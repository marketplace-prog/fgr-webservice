/**
 * Tipos do payload de webhook "pedido registrado" do Magazord.
 * Baseado no JSON de exemplo enviado (pedido #11997).
 *
 * Observação: dentro de `arrayPedidoRastreio[].pedidoItem`, o console.log original
 * truncou o conteúdo como "[Array]", então `MagazordPedidoItem` foi inferido a partir
 * dos campos já referenciados no webhook (quantidade, produtoNome, valorItem etc.).
 * Vale conferir/ajustar esse tipo contra um payload real assim que possível.
 */

export interface MagazordPedidoItem {
  id?: number
  produtoId?: number
  codigo?: string
  produtoNome?: string
  descricao?: string
  quantidade: number
  valorUnitario?: string | number
  valorItem?: string | number
  valorTotal?: string | number
  valorDesconto?: string | number
  sku?: string
  [key: string]: unknown
}

export interface MagazordPedidoHistorico {
  id: number
  dataHora: string
  pedidoSituacao: number
  pedidoSituacaoDescricao: string
  pedidoSituacaoDescricaoDetalhada: string
  tipo: number
  etapa: number
  situacao: number
  nomeUsuario: string
  tipoUsuario: string
  pedidoRastreioId: string
}

export interface MagazordPedidoRastreio {
  id: number
  valorFrete: string
  valorFreteTransportadora: string
  codigoRastreio: string | null
  link: string | null
  diasUteis: number
  dataLimitePostagem: string
  dataLimiteEntregaCliente: string
  dataPostagemTransportadora: string | null
  dataLimiteEntregaTransportadora: string
  dataEntregaTransportadora: string | null
  situacao: number
  embalagens: unknown | null
  transportadoraServicoId: number
  transportadoraServicoOpcoes: unknown | null
  transportadoraServicoTipo: number
  transportadoraServicoDescricao: string
  transportadoraTextoEntrega: string | null
  transportadoraAgenciaNome: string | null
  transportadoraAgenciaCodigoServico: string | null
  transportadoraId: number
  transportadoraNome: string
  transportadoraTipo: number
  naoGeraRastreio: boolean
  pedidoSituacao: number
  pedidoSituacaoEtapa: number
  pedidoSituacaoTipo: number
  pedidoSituacaoDescricao: string
  pedidoSituacaoDescricaoDetalhada: string
  pedidoLojistaCodigo: string | null
  lojistaNome: string | null
  pedidoItem: MagazordPedidoItem[]
  pedidoItemKit: unknown[]
  calculoFreteInformacoes: unknown | null
  pedidoNotaFiscal: unknown | null
  tag_id: string | null
}

export interface MagazordPedidoPayload {
  id: number
  id_loja: number
  lojaNome: string
  codigo: string
  codigoSecundario: string | null
  dataHora: string
  valorProduto: string
  valorFrete: string
  valorDesconto: string
  valorAcrescimo: string
  valorPresente: string
  valorTotal: string
  origem: number
  pedidoIp: string | null
  codigoVendedor: string | null
  pessoaId: number
  pessoaNome: string
  pessoaCpfCnpj: string
  pessoaEmail: string
  pessoaTipo: number
  pessoaDataNascimento: string | null
  pessoaSexo: string | null
  formaPagamentoId: number
  formaPagamentoNome: string
  condicaoPagamentoId: number
  condicaoPagamentoNome: string
  condicaoPagamentoParcelas: number
  marketplaceId: number | null
  marketplaceNome: string | null
  codigoMarketplace: string | null
  dataMarketplace: string | null
  pedidoSituacao: number
  pedidoSituacaoEtapa: number
  pedidoSituacaoTipo: number
  pedidoSituacaoDescricao: string
  pedidoSituacaoDescricaoDetalhada: string
  dataPreVenda: string | null
  nomeDestinatario: string
  logradouro: string
  numero: string
  bairro: string
  complemento: string
  cidadeNome: string
  estadoSigla: string
  paisNome: string | null
  cep: string
  pedidoTrackingSource: string | null
  pedidoTrackingUserAgent: string | null
  pedidoTrackingParams: string | null
  pedidoTrackingCountryCode: string | null
  cupomCodigo: string | null
  cupomId: number | null
  cupomValorDesconto: string | null
  cupomTipoDesconto: string | null
  lojaDoMarketplaceId: number | null
  lojaDoMarketplaceNome: string | null
  /** Vem como string JSON (ex: `{"icone":"marketplace-meli.svg"}`) — dar JSON.parse se necessário */
  lojaMarketplaceOpcoes: string | null
  lojaMarketplaceId: number | null
  lojaMarketplaceNome: string | null
  formaRecebimentoId: number
  formaRecebimentoNome: string
  gatewayPagamentoId: number | null
  tipoCadastroPM: string | null
  lojasOficiaisId: unknown[]
  pedidoTrackingConversion: string | null
  valorPersonalizacao: string | null
  lojaUrlImagem: string
  lojaUrl: string
  creditoUtilizado: string | null
  cashbackUtilizado: string | null
  valorTotalFinal: number
  arrayPedidoRastreio: MagazordPedidoRastreio[]
  boletos: unknown[]
  pedidoPagamentoPix: unknown | null
  linkPagamento: string | null
  linkAvaliacao: string | null
  mostraProcessos: boolean
  monitoraPedido: boolean
  pedidoPagamentoAme: unknown | null
  pedidoHistorico: MagazordPedidoHistorico[]
  pessoaContato: {
    tipo: number
    contato: string
  }[]
}

/** Alguns endpoints/eventos da Magazord envelopam o pedido em `{ payload: {...} }` */
export interface MagazordPedidoWebhookEnvelope {
  payload: MagazordPedidoPayload
}