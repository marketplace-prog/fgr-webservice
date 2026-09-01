import { MagazordPedidoPayload } from "~~/shared/types/magazord"

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const forwardUrl = config.discord?.webhook

  if (!forwardUrl) {
    throw createError({
      statusCode: 500,
      message: 'A variável DISCORD_WEBHOOK não está configurada no runtimeConfig',
    })
  }

  try {
    const body = await readBody<MagazordPedidoPayload>(event)

    console.log(`[${new Date().toISOString()}] 🔔 Webhook recebido do Magazord:`, body)
    
    // Tratamento para caso o Magazord envie o JSON direto ou envelopado em "payload"
    const pedido = body?.payload || body

    if (!pedido || !pedido.codigo) {
      throw createError({
        statusCode: 400,
        message: 'Payload do webhook em formato inválido ou vazio',
      })
    }

    console.log(`[${new Date().toISOString()}] 📦 Processando pedido #${pedido.codigo}`)

    const formatCurrency = (val: number) =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)

    // Os itens agora estão dentro do array de rastreio
    const itensRastreio = pedido.arrayPedidoRastreio?.[0]?.pedidoItem || []
    const itensList = itensRastreio.length
      ? itensRastreio.map((item: any) => `• **${item.quantidade}x** ${item.produtoNome} (${formatCurrency(item.valorItem)})`).join('\n')
      : 'Nenhum item listado'

    // Formatação de Pagamento
    const pagamento = `${pedido.formaPagamentoNome || 'Não informado'} - ${pedido.condicaoPagamentoNome || ''}`

    // Endereço (agora na raiz do JSON)
    const endereco = pedido.logradouro
      ? `${pedido.logradouro}, ${pedido.numero || 'S/N'} - ${pedido.bairro}\n${pedido.cidadeNome}/${pedido.estadoSigla} - CEP: ${pedido.cep}`
      : 'Não informado'

    // Construção do Discord Embed
    const discordPayload = {
      username: 'Magazord Orders',
      avatar_url: 'https://cdn-icons-png.flaticon.com/512/891/891462.png',
      embeds: [
        {
          title: `📦 Novo Pedido Registrado #${pedido.codigo}`,
          color: 5763719, // Verde (#57F287)
          fields: [
            {
              name: '👤 Cliente',
              value: `**${pedido.pessoaNome || 'N/A'}**\nCPF/CNPJ: ${pedido.pessoaCpfCnpj || 'N/A'}\nEmail: ${pedido.pessoaEmail || 'N/A'}`,
              inline: true,
            },
            {
              name: '📊 Situação',
              value: pedido.pedidoSituacaoDescricao || 'Registrado',
              inline: true,
            },
            {
              name: '💳 Pagamento',
              value: pagamento,
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
              value: `**Produtos:** ${formatCurrency(pedido.valorProduto)}\n**Frete:** ${formatCurrency(pedido.valorFrete)}\n**Desconto:** ${formatCurrency(pedido.valorDesconto)}\n**Total:** **${formatCurrency(pedido.valorTotal)}**`,
              inline: false,
            },
          ],
          timestamp: pedido.dataHora || new Date().toISOString(),
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
        message: 'Erro ao encaminhar notificação para o Discord',
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
      message: 'Payload inválido ou erro interno ao processar requisição',
    })
  }
})