import { MagazordWebhookPedidoRegistrado } from "~~/shared/types/magazord"

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const forwardUrl = config.forwardUrl

  if (!forwardUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: 'A variável FORWARD_URL não está configurada no .env',
    })
  }

  try {
    const body = await readBody<MagazordWebhookPedidoRegistrado>(event)

    console.log(`[${new Date().toISOString()}] 📦 Recebido webhook do pedido #${body?.payload?.id || 'Desconhecido'}`)

    const forwardResponse = await fetch(forwardUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!forwardResponse.ok) {
      const errorText = await forwardResponse.text()
      console.error(`🚨 Falha ao encaminhar: HTTP ${forwardResponse.status} - ${errorText}`)

      throw createError({
        statusCode: 502,
        statusMessage: 'Erro no destino ao encaminhar payload',
      })
    }

    console.log(`✅ Payload encaminhado com sucesso para ${forwardUrl}`)

    return {
      message: 'Webhook recebido e encaminhado com sucesso',
    }

  } catch (error: any) {
    console.error('🔥 Erro interno ao processar o webhook:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 400,
      statusMessage: 'Payload inválido ou erro interno ao processar requisição',
    })
  }
})