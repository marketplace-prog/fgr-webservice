/**
 * @file server\api\webhook\pedido-registrado.post.ts - Webhook Handler - Magazord "Pedido Registrado"
 * @description Endpoint Nitro (Nuxt 4) responsável por receber webhooks de novos pedidos do Magazord,
 * processar os dados para gerar insights de negócio e encaminhar uma notificação formatada para o Discord.
 */

import type { MagazordPedidoItem, MagazordPedidoPayload } from '~~/shared/types/magazord'
import { describeMagazordOrderOrigin, generateOrderInsights } from '~~/shared/utils/magazord'

/**
 * Função principal que captura e roteia a chamada HTTP.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const forwardUrl = config.discord?.novos_pedidos

  if (!forwardUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Configuração Incompleta',
      message: 'A variável DISCORD_WEBHOOK_NOVOS_PEDIDOS não está configurada no runtimeConfig.',
    })
  }

  try {
    // Tenta ler o body mapeando tanto para o root direto do json quanto para envelopamentos '{ payload: {...} }'
    const rawBody = await readBody<MagazordPedidoPayload | { payload: MagazordPedidoPayload }>(
      event,
    )
    const pedido = rawBody && 'payload' in rawBody ? rawBody.payload : rawBody

    if (!pedido || !pedido.codigo) {
      throw createError({
        statusCode: 400,
        message: 'Payload do webhook inválido ou sem código do pedido',
      })
    }

    // --- Extração de Itens e Rastreio ---
    const rastreioInfo = pedido.arrayPedidoRastreio?.[0]
    const itensRastreio: MagazordPedidoItem[] = rastreioInfo?.pedidoItem || []

    const itensList = itensRastreio.length
      ? itensRastreio
          .map(
            (item) =>
              `• **${item.quantidade}x** ${item.produtoNome || item.descricao || 'Item genérico'} (${formatCurrency(item.valorItem ?? item.valorUnitario)})`,
          )
          .join('\n')
      : 'Itens não detalhados neste webhook'

    // --- Processamento de Informações Contextuais ---
    const origemPedido = describeMagazordOrderOrigin(
      pedido.origem,
      pedido.marketplaceNome,
      pedido.lojaNome,
    )
    const canalVenda =
      Number(pedido.origem) === 2 && pedido.lojaMarketplaceNome
        ? `${origemPedido.channel} (${pedido.lojaMarketplaceNome})`
        : origemPedido.channel

    const freteCusto = Number(rastreioInfo?.valorFreteTransportadora || 0)
    const smartInsights = generateOrderInsights(pedido, itensRastreio, freteCusto)

    // Dados limpos do cliente e endereço
    const primeiroNome = getFirstName(pedido.pessoaNome)
    const enderecoResumido = `Bairro: ${pedido.bairro || 'N/A'}\n${pedido.cidadeNome || 'N/A'} - ${pedido.estadoSigla || 'N/A'}`

    // Determinação Dinâmica de Cor do Discord Embed
    const situacaoCodigo = Number(pedido.pedidoSituacao) || 0
    const corDiscord = getStatusColor(situacaoCodigo)

    // --- Montagem do Embed do Discord ---
    const discordPayload = {
      username: 'Operação de Vendas',
      avatar_url: 'https://cdn-icons-png.flaticon.com/512/3144/3144456.png',
      embeds: [
        {
          title: truncate(
            `${origemPedido.title} #${pedido.codigo} | ${pedido.pedidoSituacaoDescricao}`,
            256,
          ),
          description: truncate(canalVenda, 4096),
          color: corDiscord,
          fields: [
            {
              name: '👤 Cliente',
              value: truncate(`**${primeiroNome}**`),
              inline: true,
            },
            {
              name: '🧭 Origem',
              value: truncate(origemPedido.label),
              inline: true,
            },
            {
              name: '💳 Pagamento',
              value: truncate(
                `${pedido.formaPagamentoNome || 'N/A'}${pedido.condicaoPagamentoNome ? ` - ${pedido.condicaoPagamentoNome}` : ''}`,
              ),
              inline: true,
            },
            {
              name: '📍 Destino',
              value: truncate(enderecoResumido),
              inline: false,
            },
            {
              name: '🛒 Produtos',
              value: truncate(itensList),
              inline: false,
            },
            {
              name: '💰 Fechamento',
              value: truncate(
                `**Produtos:** ${formatCurrency(pedido.valorProduto)}\n**Frete (cliente):** ${formatCurrency(pedido.valorFrete)}\n**Descontos:** ${formatCurrency(pedido.valorDesconto)}\n**Acréscimos:** ${formatCurrency(pedido.valorAcrescimo)}\n**Presente:** ${formatCurrency(pedido.valorPresente)}\n**Total pago:** **${formatCurrency(pedido.valorTotalFinal ?? pedido.valorTotal)}**`,
              ),
              inline: true,
            },
            ...(Number(pedido.origem) === 3
              ? [
                  {
                    name: '👤 Vendedor',
                    value: truncate(pedido.codigoVendedor || 'Não informado'),
                    inline: true,
                  },
                ]
              : []),
            ...(Number(pedido.origem) === 2 && pedido.codigoMarketplace
              ? [
                  {
                    name: '🔗 Código no marketplace',
                    value: truncate(pedido.codigoMarketplace),
                    inline: true,
                  },
                ]
              : []),
            {
              name: '💡 Insights da Venda',
              value: truncate(smartInsights),
              inline: false,
            },
          ],
          timestamp: parseMagazordDate(pedido.dataHora).toISOString(),
          footer: { text: 'Integração Magazord • Nitro Server' },
        },
      ],
    }

    // --- Disparo com ofetch ($fetch) ---
    // Envia assincronamente. Se a API do Discord retornar qualquer erro HTTP (4xx, 5xx), o $fetch automaticamente joga para o catch.
    await $fetch(forwardUrl, {
      method: 'POST',
      body: discordPayload,
    })

    return {
      success: true,
      message: `Webhook do pedido #${pedido.codigo} encaminhado com sucesso.`,
    }
  } catch (error: unknown) {
    // Permite que erros gerados pelo "createError" (ex: falta de runtime config ou payload mal formado) cheguem limpos ao client.
    if (error && typeof error === 'object' && '__nuxt_error' in error) {
      throw error
    }

    console.error('🔥 Erro ao encaminhar webhook para o Discord:', error)

    throw createError({
      statusCode: 502,
      statusMessage: 'Discord Integration Error',
      message: 'Falha ao processar e enviar o webhook para o Discord.',
    })
  }
})
