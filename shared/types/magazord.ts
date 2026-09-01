// types/magazord.ts

export interface MagazordPedidoTrackingParams {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  inStock?: string
  parceiro?: string
  gclid?: string
  lc?: string
  start_buy?: string
  pe?: string
  dispositivo?: number
}

export interface MagazordPedidoItem {
  id: number
  produtoDerivacaoId: number
  descricao: string
  quantidade: number
  valorUnitario: number
  valorDesconto: number
  valorAcrescimo: number
  valorItem: number
  dataPreVenda?: string
  pedidoInfo?: string
  deposito: number
  produtoDerivacaoCodigo: string
  produtoId: number
  produtoNome: string
  produtoDerivacaoNome: string
  ean: number | string
  marcaNome: string
  midiaPath?: string
  midiaName?: string
  midiaAlt?: string
  categoria_id: number
  categoria: string
  linkProduto?: string
}

export interface MagazordPedidoRastreio {
  id: number
  valorFrete: number
  valorFreteTransportadora: number
  diasUteis: number
  codigoRastreio: string
  link: string
  dataLimiteEntregaCliente?: string
  dataLimitePostagem?: string
  transportadoraServicoId: string
  transportadoraServicoDescricao: string
  transportadoraId: number
  transportadoraNome: string
  transportadoraTextoEntrega?: string
  transportadoraCodigoRastreioInterno?: string
  pedidoSituacao: number
  pedidoSituacaoDescricao: string
  pedidoSituacaoEtapa: number
  pedidoSituacaoTipo: number
  pedidoLojistaCodigo?: string
  lojistaNome?: string
  pedidoItem: MagazordPedidoItem[]
  pedidoNotaFiscal?: unknown[]
}

export interface MagazordPedidoHistorico {
  id: number
  dataHora: string
  pedidoSituacaoDescricao: string
  etapa: number
  situacao: number
  pedidoRastreioId: number
}

export interface MagazordPessoaContato {
  tipo: number
  contato: string
}

export interface MagazordPedidoPayload {
  id: number
  codigo: string
  codigoSecundario?: string
  dataHora: string
  valorProduto: number
  valorFrete: number
  valorDesconto: number
  valorAcrescimo: number
  valorPresente: number
  valorTotal: number
  origem: number
  pessoaId: number
  pessoaNome: string
  pessoaCpfCnpj: string
  pessoaEmail: string
  pessoaDataNascimento?: string
  pessoaSexo: number
  formaPagamentoId: number
  formaPagamentoNome: string
  condicaoPagamentoId: number
  condicaoPagamentoNome: string
  marketplaceId: number
  marketplaceNome: string
  codigoMarketplace?: string
  pedidoSituacao: number
  pedidoSituacaoDescricao: string
  pedidoSituacaoEtapa: number
  pedidoSituacaoTipo: number
  dataPreVenda?: string
  nomeDestinatario: string
  logradouro: string
  numero: string
  bairro: string
  complemento?: string
  cidadeNome: string
  estadoSigla: string
  cep: number | string
  pedidoTrackingSource?: string
  pedidoTrackingParams?: MagazordPedidoTrackingParams
  cupomCodigo?: string
  cupomValorDesconto?: number
  cupomTipoDesconto?: number
  lojaDoMarketplaceId?: number
  lojaDoMarketplaceNome?: string
  formaRecebimentoId?: number
  formaRecebimentoNome?: string
  gatewayPagamentoId?: number
  arrayPedidoRastreio: MagazordPedidoRastreio[]
  boletos?: unknown[]
  pedidoPagamentoPix?: string
  pedidoPagamentoAme?: string
  pedidoHistorico: MagazordPedidoHistorico[]
  pessoaContato: MagazordPessoaContato[]
}

