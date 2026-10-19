/**
 * @file server/api/webhooks/magazord/status.post.ts
 * Endpoint Nitro (Nuxt 4) para receber atualizações de situação de pedido.
 */

import type { MagazordPedidoPayload } from '~~/shared/types/magazord'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const forwardUrl = config.discord?.atualizacoes

  if (!forwardUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Configuração Incompleta',
      message: 'A variável DISCORD_WEBHOOK_ATUALIZACOES não está configurada.',
    })
  }

  try {
    const rawBody = await readBody<MagazordPedidoPayload | { payload: MagazordPedidoPayload }>(
      event,
    )
    const pedido = rawBody && 'payload' in rawBody ? rawBody.payload : rawBody

    if (!pedido || !pedido.codigo) {
      throw createError({ statusCode: 400, message: 'Payload inválido' })
    }

    console.log(
      `[🔄 Webhook Magazord] Atualização no pedido #${pedido.codigo} para o status: ${pedido.pedidoSituacaoDescricao}`,
    )

    // Dados limpos do cliente
    const primeiroNome = getFirstName(pedido.pessoaNome) // Utilizando a util global
    const situacaoCodigo = Number(pedido.pedidoSituacao) || 0
    const corDiscord = getStatusColor(situacaoCodigo)

    // Lógica para capturar informações de Logística/Rastreio (caso existam)
    const rastreioInfo = pedido.arrayPedidoRastreio?.[0]
    let rastreioTexto = 'Ainda não despachado'

    if (rastreioInfo?.codigoRastreio) {
      if (rastreioInfo.link) {
        rastreioTexto = `[📦 **${rastreioInfo.codigoRastreio}**](${rastreioInfo.link}) (${rastreioInfo.transportadoraNome})`
      } else {
        rastreioTexto = `📦 **${rastreioInfo.codigoRastreio}** (${rastreioInfo.transportadoraNome})`
      }
    }

    // --- Montagem do Embed do Discord ---
    const discordPayload = {
      username: 'Atualizações de Pedidos',
      avatar_url: 'https://cdn-icons-png.flaticon.com/512/8146/8146003.png', // Ícone de atualização/sincronização
      embeds: [
        {
          title: truncate(`🔄 Pedido #${pedido.codigo} Atualizado`, 256),
          description: `O pedido de **${primeiroNome}** mudou de status.`,
          color: corDiscord,
          fields: [
            {
              name: '📊 Novo Status',
              value: truncate(
                `**${pedido.pedidoSituacaoDescricaoDetalhada || pedido.pedidoSituacaoDescricao}**`,
              ),
              inline: false,
            },
            {
              name: '🚚 Rastreamento',
              value: truncate(rastreioTexto),
              inline: true,
            },
            {
              name: '💰 Valor Total',
              value: truncate(`**${formatCurrency(pedido.valorTotalFinal ?? pedido.valorTotal)}**`),
              inline: true,
            },
          ],
          timestamp: parseMagazordDate(pedido.dataHora).toISOString(),
          footer: { text: 'Integração Magazord • Status Update' },
        },
      ],
    }

    // --- Disparo com ofetch ($fetch) ---
    await $fetch(forwardUrl, {
      method: 'POST',
      body: discordPayload,
    })

    return {
      success: true,
      message: `Atualização do pedido #${pedido.codigo} encaminhada com sucesso.`,
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && '__nuxt_error' in error) {
      throw error
    }

    console.error('🔥 Erro ao encaminhar atualização para o Discord:', error)

    throw createError({
      statusCode: 502,
      statusMessage: 'Discord Integration Error',
      message: 'Falha ao processar e enviar a atualização para o Discord.',
    })
  }
})
