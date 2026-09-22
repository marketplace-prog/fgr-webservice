/**
 * @file server\api\webhook\pedido-registrado.post.ts - Webhook Handler - Magazord "Pedido Registrado"
 * @description Endpoint Nitro (Nuxt 4) responsável por receber webhooks de novos pedidos do Magazord,
 * processar os dados para gerar insights de negócio e encaminhar uma notificação formatada para o Discord.
 */

import type {
  MagazordPedidoItem,
  MagazordPedidoPayload,
} from "~~/shared/types/magazord"

/**
 * Analisa variáveis da venda (como frete cobrado vs. frete real, cupons, ticket do carrinho)
 * e gera um resumo estratégico com anomalias e indicadores de sucesso.
 * 
 * @param pedido - O objeto principal contendo informações financeiras da venda.
 * @param itens - Array de produtos da compra, útil para analisar o volume do carrinho.
 * @param freteCusto - Custo da etiqueta logística retornado na aba de rastreio.
 * @returns Uma string unificada pronta para ser renderizada no Discord contendo todos os alertas acionados.
 */
const generateInsights = (pedido: MagazordPedidoPayload, itens: MagazordPedidoItem[], freteCusto: number): string => {
  const insights: string[] = []

  // Análise de Viabilidade do Frete
  const freteCliente = Number(pedido.valorFrete || 0)
  if (freteCliente === 0 && freteCusto > 0) {
    insights.push(`📦 **Subsídio:** Frete Grátis ativado. Loja absorveu custo de **${formatCurrency(freteCusto)}**.`)
  } else if (freteCliente < freteCusto) {
    insights.push(`⚠️ **Frete Deficitário:** O envio custará ${formatCurrency(freteCusto)}, mas o cliente pagou apenas ${formatCurrency(freteCliente)} (Defasagem de ${formatCurrency(freteCusto - freteCliente)}).`)
  }

  // Análise de Descontos e Cupons
  const desconto = Number(pedido.valorDesconto || 0)
  const valorProdutos = Number(pedido.valorProduto || 0)
  if (desconto > 0 && valorProdutos > 0) {
    const percentualDesconto = ((desconto / valorProdutos) * 100).toFixed(1)
    if (Number(percentualDesconto) > 15) {
      insights.push(`🚨 **Desconto Agressivo:** Redução de ${percentualDesconto}% no pedido (${formatCurrency(desconto)} off).`)
    }
  }

  if (pedido.cupomCodigo) {
    insights.push(`🎟️ **Cupom:** Venda convertida usando o cupom \`${pedido.cupomCodigo}\`.`)
  }

  // Análise de Volume de Carrinho (Cross-Sell)
  const qtdTotalItens = itens.reduce((acc, item) => acc + (item.quantidade || 1), 0)
  if (qtdTotalItens === 1) {
    insights.push(`🛒 **Carrinho Único:** Cliente comprou apenas 1 item. Oportunidade para cross-sell.`)
  } else if (qtdTotalItens >= 4) {
    insights.push(`🔥 **Ótimo Ticket:** Carrinho robusto com ${qtdTotalItens} itens adicionados.`)
  }

  // Análise Financeira / Risco de Inadimplência ou Custo de Antecipação
  const formaPagamento = (pedido.formaPagamentoNome || '').toUpperCase()
  if (formaPagamento.includes('PIX')) {
    insights.push(`⚡ **Liquidez Imediata:** Pagamento via PIX.`)
  } else if (pedido.condicaoPagamentoParcelas >= 6) {
    insights.push(`⏳ **Longo Prazo:** Compra em ${pedido.condicaoPagamentoParcelas}x. Atenção ao custo de antecipação do caixa.`)
  }

  // Se nenhum alerta especial for ativado
  return insights.length > 0 ? insights.join('\n\n') : '✅ Pedido saudável, nenhuma anomalia de margem detectada.'
}

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
    const rawBody = await readBody<MagazordPedidoPayload | { payload: MagazordPedidoPayload }>(event)
    const pedido = rawBody && 'payload' in rawBody ? rawBody.payload : rawBody

    if (!pedido || !pedido.codigo) {
      throw createError({ statusCode: 400, message: 'Payload do webhook inválido ou sem código do pedido' })
    }

    console.log(`[📦 Webhook Magazord] Processando pedido #${pedido.codigo}`)

    // --- Extração de Itens e Rastreio ---
    const rastreioInfo = pedido.arrayPedidoRastreio?.[0]
    const itensRastreio: MagazordPedidoItem[] = rastreioInfo?.pedidoItem || []
    
    const itensList = itensRastreio.length
      ? itensRastreio
          .map((item) => `• **${item.quantidade}x** ${item.produtoNome || item.descricao || 'Item genérico'} (${formatCurrency(item.valorItem ?? item.valorUnitario)})`)
          .join('\n')
      : 'Itens não detalhados neste webhook'

    // --- Processamento de Informações Contextuais ---
    const canalVenda = pedido.marketplaceNome
      ? `🛍️ **Marketplace:** ${pedido.marketplaceNome}${pedido.lojaMarketplaceNome ? ` (${pedido.lojaMarketplaceNome})` : ''}`
      : `🌐 **E-commerce:** ${pedido.lojaNome || 'Loja Própria'}`

    const freteCusto = Number(rastreioInfo?.valorFreteTransportadora || 0)
    const smartInsights = generateInsights(pedido, itensRastreio, freteCusto)

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
          title: truncate(`📦 Pedido #${pedido.codigo} | ${pedido.pedidoSituacaoDescricao}`.toUpperCase(), 256),
          description: truncate(canalVenda, 4096),
          color: corDiscord,
          fields: [
            {
              name: '👤 Cliente',
              value: truncate(`**${primeiroNome}**`),
              inline: true,
            },
            {
              name: '💳 Pagamento',
              value: truncate(`${pedido.formaPagamentoNome || 'N/A'}${pedido.condicaoPagamentoNome ? ` - ${pedido.condicaoPagamentoNome}` : ''}`),
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
              value: truncate(`**Produtos:** ${formatCurrency(pedido.valorProduto)}\n**Frete (Cliente):** ${formatCurrency(pedido.valorFrete)}\n**Descontos:** ${formatCurrency(pedido.valorDesconto)}\n**Total Pago:** **${formatCurrency(pedido.valorTotalFinal ?? pedido.valorTotal)}**`),
              inline: true,
            },
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

    return { success: true, message: `Webhook do pedido #${pedido.codigo} encaminhado com sucesso.` }

  } catch (error: any) {
    // Permite que erros gerados pelo "createError" (ex: falta de runtime config ou payload mal formado) cheguem limpos ao client.
    if (error.__nuxt_error) {
      throw error
    }

    console.error('🔥 Erro ao encaminhar webhook para o Discord:', error.data || error.message || error)
    
    throw createError({
      statusCode: 502,
      statusMessage: 'Discord Integration Error',
      message: 'Falha ao processar e enviar o webhook para o Discord.',
    })
  }
})