import { MagazordWebhookPedidoRegistrado } from "~~/shared/types/magazord"

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const forwardUrl = config.discord?.webhook

  if (!forwardUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: 'A variável DISCORD_WEBHOOK não está configurada no runtimeConfig',
    })
  }

  try {
    const body = await readBody<MagazordWebhookPedidoRegistrado>(event)
    const pedido = body?.payload

    if (!pedido) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Payload do webhook em formato inválido ou vazio',
      })
    }

    console.log(`[${new Date().toISOString()}] 📦 Processando pedido #${pedido.codigo || pedido.id}`)

    const formatCurrency = (val: number) =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)

    // Lista formatada dos itens do pedido
    const itensList = pedido.itens?.length
      ? pedido.itens.map(item => `• **${item.quantidade}x** ${item.nome} (${formatCurrency(item.valorTotal)})`).join('\n')
      : 'Nenhum item listado'

    // Formas de pagamento
    const pagamentosList = pedido.pagamentos?.length
      ? pedido.pagamentos.map(p => `• ${p.formaPagamentoNome} (${p.parcelas}x) - ${formatCurrency(p.valor)}`).join('\n')
      : 'Não informado'

    // Endereço de entrega
    const endereco = pedido.enderecoEntrega
      ? `${pedido.enderecoEntrega.logradouro}, ${pedido.enderecoEntrega.numero} - ${pedido.enderecoEntrega.bairro}\n${pedido.enderecoEntrega.cidade}/${pedido.enderecoEntrega.uf} - CEP: ${pedido.enderecoEntrega.cep}`
      : 'Não informado'

    // Construção da estrutura do Discord Embed
    const discordPayload = {
      username: 'Magazord Orders',
      avatar_url: 'https://cdn-icons-png.flaticon.com/512/891/891462.png',
      embeds: [
        {
          title: `📦 Novo Pedido Registrado #${pedido.codigo || pedido.id}`,
          color: 5763719, // Verde (#57F287)
          fields: [
            {
              name: '👤 Cliente',
              value: `**${pedido.cliente?.nome || 'N/A'}**\nCPF/CNPJ: ${pedido.cliente?.cpfCnpj || 'N/A'}\nEmail: ${pedido.cliente?.email || 'N/A'}`,
              inline: true,
            },
            {
              name: '📊 Situação',
              value: pedido.situacaoNome || 'Registrado',
              inline: true,
            },
            {
              name: '💳 Pagamento',
              value: pagamentosList,
              inline: false,
            },
            {
              name: '📍 Endereço de Entrega',
              value: endereco,
              inline: false,
            },
            {
              name: '🛒 Itens do Pedido',
              value: itensList.length > 1024 ? itensList.substring(0, 1021) + '...' : itensList,
              inline: false,
            },
            {
              name: '💰 Resumo de Valores',
              value: `**Produtos:** ${formatCurrency(pedido.valorProdutos)}\n**Frete:** ${formatCurrency(pedido.valorFrete)}\n**Desconto:** ${formatCurrency(pedido.valorDesconto)}\n**Total:** **${formatCurrency(pedido.valorTotal)}**`,
              inline: false,
            },
          ],
          timestamp: pedido.dataCriacao || new Date().toISOString(),
          footer: {
            text: 'Magazord Webhook Proxy',
          },
        },
      ],
    }

    const forwardResponse = await fetch(forwardUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(discordPayload),
    })

    if (!forwardResponse.ok) {
      const errorText = await forwardResponse.text()
      console.error(`🚨 Falha ao enviar para o Discord: HTTP ${forwardResponse.status} - ${errorText}`)

      throw createError({
        statusCode: 502,
        statusMessage: 'Erro ao encaminhar notificação para o Discord',
      })
    }

    console.log(`✅ Webhook enviado com sucesso para o Discord`)

    return {
      message: 'Webhook recebido e enviado ao Discord com sucesso',
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