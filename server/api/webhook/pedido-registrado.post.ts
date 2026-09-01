import type {
  MagazordPedidoItem,
  MagazordPedidoPayload,
} from "~~/shared/types/magazord"

// Funções utilitárias de anonimização (LGPD)
const maskName = (name?: string) => {
  if (!name) return 'N/A'
  return name.split(' ').map(n => n.charAt(0) + '***').join(' ')
}

const maskDoc = (doc?: string) => {
  if (!doc) return 'N/A'
  const digitsOnly = doc.replace(/\D/g, '')
  if (!digitsOnly) return 'N/A'
  return doc.replace(/\d/g, (c, i: number) => (i < doc.length - 4 ? '*' : c))
}

// Trunca valores para respeitar o limite de 1024 caracteres por field do Discord
const truncate = (value: string, max = 1024) =>
  value.length > max ? `${value.substring(0, max - 3)}...` : value

/**
 * A Magazord envia datas como "YYYY-MM-DD HH:mm:ss-03", ou seja, sem o ":00"
 * no offset de fuso. O construtor nativo `Date()` não reconhece esse formato
 * de forma confiável (em vários engines resulta em "Invalid Date", o que
 * derrubava o handler ao chamar `.toISOString()`). Esta função normaliza o
 * offset e cai num fallback seguro se a data vier inválida ou ausente.
 */
const parseMagazordDate = (raw?: string | null): Date => {
  if (!raw) return new Date()
  const normalized = raw.trim().replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00')
  const parsed = new Date(normalized)
  return isNaN(parsed.getTime()) ? new Date() : parsed
}

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
    const rawBody = await readBody<MagazordPedidoPayload | { payload: MagazordPedidoPayload }>(event)

    // Alguns eventos da Magazord envelopam o pedido em `{ payload: {...} }`;
    // aqui de fato tratamos os dois formatos, em vez de só comentar sobre isso.
    const pedido: MagazordPedidoPayload | undefined =
      rawBody && 'payload' in rawBody ? rawBody.payload : (rawBody as MagazordPedidoPayload)

    if (!pedido || !pedido.codigo) {
      throw createError({
        statusCode: 400,
        message: 'Payload do webhook em formato inválido ou vazio',
      })
    }

    console.log(`[${new Date().toISOString()}] 📦 Processando pedido #${pedido.codigo}`)

    // Utilitário de moeda
    const formatCurrency = (val: string | number | null | undefined) =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val) || 0)

    // --- Tratamento de Itens ---
    const rastreioInfo = pedido.arrayPedidoRastreio?.[0]
    const itensRastreio: MagazordPedidoItem[] = rastreioInfo?.pedidoItem || []

    const itensList = itensRastreio.length
      ? itensRastreio
          .map((item) => `• **${item.quantidade}x** ${item.produtoNome || item.descricao || 'Item sem descrição'} (${formatCurrency(item.valorItem ?? item.valorUnitario)})`)
          .join('\n')
      : 'Itens não detalhados neste webhook'

    // --- Canal de Venda ---
    const canalVenda = pedido.marketplaceNome
      ? `🛍️ **Marketplace:** ${pedido.marketplaceNome}${pedido.lojaMarketplaceNome ? ` (${pedido.lojaMarketplaceNome})` : ''}`
      : `🌐 **E-commerce:** ${pedido.lojaNome || 'Loja Própria'}`

    // --- Insights de Negócio ---
    const freteCliente = Number(pedido.valorFrete || 0)
    const freteCusto = Number(rastreioInfo?.valorFreteTransportadora || 0)

    let freteInsight = ''
    if (freteCliente === 0 && freteCusto > 0) {
      freteInsight = `⚠️ **Atenção:** Frete grátis oferecido. Custo logístico de **${formatCurrency(freteCusto)}** absorvido pela loja/marketplace.`
    } else if (freteCliente < freteCusto) {
      freteInsight = `📉 **Subsídio:** Cliente pagou ${formatCurrency(freteCliente)}, mas o envio custará ${formatCurrency(freteCusto)}.`
    } else {
      freteInsight = `✅ **Frete Saudável:** Custo de envio coberto pelo valor cobrado do cliente.`
    }

    const slaPostagem = rastreioInfo?.dataLimitePostagem
      ? `⏳ **SLA de Postagem:** Até ${parseMagazordDate(rastreioInfo.dataLimitePostagem).toLocaleDateString('pt-BR')}`
      : 'SLA não informado'

    const insights = `${freteInsight}\n${slaPostagem}`

    // --- Anonimização ---
    const clienteAnonimo = maskName(pedido.pessoaNome)
    const docAnonimo = maskDoc(pedido.pessoaCpfCnpj)
    const enderecoAnonimo = `***Rua/Número Ocultos (LGPD)***\nBairro: ${pedido.bairro || 'N/A'}\n${pedido.cidadeNome || 'N/A'}/${pedido.estadoSigla || 'N/A'}`

    // Formatação de Pagamento
    const pagamento = `${pedido.formaPagamentoNome || 'Não informado'}${pedido.condicaoPagamentoNome ? ` - ${pedido.condicaoPagamentoNome}` : ''}`

    // Construção do Discord Embed
    const discordPayload = {
      username: 'Notificações de Vendas',
      avatar_url: 'https://cdn-icons-png.flaticon.com/512/3144/3144456.png', // Ícone de carrinho
      embeds: [
        {
          title: truncate(`📦 Novo Pedido Registrado: #${pedido.codigo}`, 256),
          description: truncate(canalVenda, 4096),
          color: 5763719, // Verde (#57F287)
          fields: [
            {
              name: '👤 Cliente (Anonimizado)',
              value: truncate(`**${clienteAnonimo}**\nDoc: ${docAnonimo}`),
              inline: true,
            },
            {
              name: '📊 Situação',
              value: truncate(pedido.pedidoSituacaoDescricaoDetalhada || pedido.pedidoSituacaoDescricao || 'Registrado'),
              inline: true,
            },
            {
              name: '💳 Pagamento',
              value: truncate(pagamento),
              inline: false,
            },
            {
              name: '📍 Região de Entrega',
              value: truncate(enderecoAnonimo),
              inline: false,
            },
            {
              name: '🛒 Itens do Pedido',
              value: truncate(itensList),
              inline: false,
            },
            {
              name: '💰 Resumo de Valores',
              value: truncate(`**Produtos:** ${formatCurrency(pedido.valorProduto)}\n**Frete Cobrado:** ${formatCurrency(pedido.valorFrete)}\n**Total do Pedido:** **${formatCurrency(pedido.valorTotalFinal ?? pedido.valorTotal)}**`),
              inline: true,
            },
            {
              name: '💡 Insights da Venda',
              value: truncate(insights),
              inline: false,
            },
          ],
          timestamp: parseMagazordDate(pedido.dataHora).toISOString(),
          footer: {
            text: 'Magazord Webhook • Proteção LGPD Ativa',
          },
        },
      ],
    }

    const forwardResponse = await fetch(forwardUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

    console.log(`✅ Webhook #${pedido.codigo} enviado com sucesso para o Discord!`)
    return { message: 'Webhook processado e enviado com sucesso' }

  } catch (error: any) {
    console.error('🔥 Erro interno ao processar o webhook:', error)
    if (error.statusCode) throw error
    throw createError({
      statusCode: 400,
      message: 'Payload inválido ou erro interno ao processar requisição',
    })
  }
})