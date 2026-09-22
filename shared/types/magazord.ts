/**
 * @file shared/types/magazord.ts
 * Enums baseados na documentação oficial da API Magazord
 * Nota: Os valores abaixo são os mais comuns, mas APIs de e-commerce
 * podem adicionar novos IDs dinamicamente.
 */

export enum MagazordOrigemPedido {
  SITE = 1,
  MARKETPLACE = 2,
  MANUAL = 3
}

export enum MagazordPedidoSituacao {
  AGUARDANDO_PAGAMENTO = 1,
  CANCELADO_PAGAMENTO = 2,
  EM_ANALISE_PAGAMENTO = 3,
  APROVADO = 4,
}

export enum MagazordPessoaTipo {
  FISICA = 1,
  JURIDICA = 2
}

export enum MagazordFormaPagamento {
  BOLETO_BANCARIO = 1,
  CARTAO_MASTERCARD = 2,
  CARTAO_VISA = 3,
  CARTAO_DINERS = 4
}

/**
 * ---------------------------------------------------------
 * INTERFACES AUXILIARES
 * ---------------------------------------------------------
 */

export interface MagazordPedidoItem {
  id?: number
  produtoId?: number
  codigo?: string
  produtoNome?: string
  descricao?: string
  quantidade: number
  /** Valores monetários frequentemente vêm como string formatada no Magazord */
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
  pedidoSituacao: MagazordPedidoSituacao | number
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
  pedidoSituacao: MagazordPedidoSituacao | number
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

export interface MagazordPessoaContato {
  tipo: number
  contato: string
}

/**
 * ---------------------------------------------------------
 * PAYLOAD PRINCIPAL
 * ---------------------------------------------------------
 */

export interface MagazordPedidoPayload {
  // --- Identificação do Pedido ---
  id: number
  id_loja: number
  lojaNome: string
  codigo: string
  codigoSecundario: string | null
  dataHora: string
  origem: MagazordOrigemPedido | number
  
  // --- Valores e Totalizadores ---
  valorProduto: string
  valorFrete: string
  valorDesconto: string
  valorAcrescimo: string
  valorPresente: string
  valorTotal: string
  valorTotalFinal: number
  valorPersonalizacao: string | null
  creditoUtilizado: string | null
  cashbackUtilizado: string | null
  
  // --- Situação ---
  pedidoSituacao: MagazordPedidoSituacao | number
  pedidoSituacaoEtapa: number
  pedidoSituacaoTipo: number
  pedidoSituacaoDescricao: string
  pedidoSituacaoDescricaoDetalhada: string
  
  // --- Dados do Cliente ---
  pessoaId: number
  pessoaNome: string
  pessoaCpfCnpj: string
  pessoaEmail: string
  pessoaTipo: MagazordPessoaTipo | number
  pessoaDataNascimento: string | null
  pessoaSexo: string | null
  pessoaContato: MagazordPessoaContato[]
  nomeDestinatario: string
  
  // --- Endereço de Entrega ---
  logradouro: string
  numero: string
  bairro: string
  complemento: string
  cidadeNome: string
  estadoSigla: string
  paisNome: string | null
  cep: string
  
  // --- Pagamento ---
  formaPagamentoId: MagazordFormaPagamento | number
  formaPagamentoNome: string
  condicaoPagamentoId: number
  condicaoPagamentoNome: string
  condicaoPagamentoParcelas: number
  formaRecebimentoId: number
  formaRecebimentoNome: string
  gatewayPagamentoId: number | null
  boletos: unknown[]
  pedidoPagamentoPix: unknown | null
  pedidoPagamentoAme: unknown | null
  linkPagamento: string | null
  
  // --- Marketplace ---
  marketplaceId: number | null
  marketplaceNome: string | null
  codigoMarketplace: string | null
  dataMarketplace: string | null
  lojaDoMarketplaceId: number | null
  lojaDoMarketplaceNome: string | null
  lojaMarketplaceId: number | null
  lojaMarketplaceNome: string | null
  
  /** 
   * Retornado como string JSON pela API.
   * @example '{"icone":"marketplace-meli.svg"}'
   * Requer `JSON.parse()` antes do uso. 
   */
  lojaMarketplaceOpcoes: string | null
  
  // --- Marketing, Cupons e Tracking ---
  cupomCodigo: string | null
  cupomId: number | null
  cupomValorDesconto: string | null
  cupomTipoDesconto: string | null
  pedidoTrackingSource: string | null
  pedidoTrackingUserAgent: string | null
  pedidoTrackingParams: string | null
  pedidoTrackingCountryCode: string | null
  pedidoTrackingConversion: string | null
  
  // --- Meta Dados Adicionais ---
  pedidoIp: string | null
  codigoVendedor: string | null
  dataPreVenda: string | null
  tipoCadastroPM: string | null
  lojasOficiaisId: unknown[]
  lojaUrlImagem: string
  lojaUrl: string
  linkAvaliacao: string | null
  mostraProcessos: boolean
  monitoraPedido: boolean
  
  // --- Arrays Filhos ---
  arrayPedidoRastreio: MagazordPedidoRastreio[]
  pedidoHistorico: MagazordPedidoHistorico[]
}

/** 
 * Envelopamento Padrão de Webhook
 * A API do Magazord geralmente envia o body envelopado na raiz 'payload'.
 */
export interface MagazordPedidoWebhookEnvelope {
  payload: MagazordPedidoPayload
}