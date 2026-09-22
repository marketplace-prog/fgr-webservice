/**
 * @file shared/types/magazord.ts
 * @description Tipagens e Enums baseados na documentação oficial da API Magazord para os eventos de Webhook.
 * Representam a estrutura de dados enviada nos eventos de "Pedido Registrado" e "Alteração de Situação".
 */

/**
 * Identifica a plataforma, canal ou método pelo qual o pedido foi gerado.
 */
export enum MagazordOrigemPedido {
  /** Pedido gerado organicamente através da vitrine do site (E-commerce próprio) */
  SITE = 1,
  /** Pedido gerado e importado através de integrações de Marketplace (Mercado Livre, Shopee, etc.) */
  MARKETPLACE = 2,
  /** Pedido inserido manualmente no painel administrativo (Backoffice/Televendas) */
  MANUAL = 3
}

/**
 * Mapeia os status primários do fluxo de vida do pedido no sistema Magazord.
 */
export enum MagazordPedidoSituacao {
  /** Pedido criado, aguardando a confirmação de pagamento pelo gateway ou cliente */
  AGUARDANDO_PAGAMENTO = 1,
  /** Pedido cancelado (por falta de pagamento, recusa do cartão ou ação manual) */
  CANCELADO_PAGAMENTO = 2,
  /** Pagamento retido em análise antifraude pelo gateway */
  EM_ANALISE_PAGAMENTO = 3,
  /** Pagamento aprovado com sucesso, pedido pronto para faturamento/separação */
  APROVADO = 4,
}

/**
 * Define a natureza jurídica do cliente que realizou a compra.
 */
export enum MagazordPessoaTipo {
  /** Pessoa Física (CPF) */
  FISICA = 1,
  /** Pessoa Jurídica (CNPJ) */
  JURIDICA = 2
}

/**
 * Identifica a família ou método principal de pagamento selecionado no checkout.
 */
export enum MagazordFormaPagamento {
  /** Pagamento via Boleto Bancário */
  BOLETO_BANCARIO = 1,
  /** Pagamento via Cartão de Crédito - Bandeira Mastercard */
  CARTAO_MASTERCARD = 2,
  /** Pagamento via Cartão de Crédito - Bandeira Visa */
  CARTAO_VISA = 3,
  /** Pagamento via Cartão de Crédito - Bandeira Diners */
  CARTAO_DINERS = 4
}

/**
 * ---------------------------------------------------------
 * INTERFACES AUXILIARES
 * ---------------------------------------------------------
 */

/**
 * Representa um produto ou SKU individual inserido dentro de um pedido ou pacote de rastreio.
 */
export interface MagazordPedidoItem {
  /** ID interno do vínculo do item no banco de dados do pedido */
  id?: number
  /** ID identificador do produto matriz no catálogo do Magazord */
  produtoId?: number
  /** Código interno ou referência do produto cadastrado na loja */
  codigo?: string
  /** Nome comercial do produto exibido na vitrine */
  produtoNome?: string
  /** Descrição complementar ou especificações da variação adquirida */
  descricao?: string
  /** Quantidade de unidades compradas deste item específico */
  quantidade: number
  /** Valor base de uma única unidade do produto (geralmente formatado em string, ex: "150.00") */
  valorUnitario?: string | number
  /** Valor total do item (valor unitário multiplicado pela quantidade, sem considerar descontos globais) */
  valorItem?: string | number
  /** Valor líquido total do item após rateio de descontos e acréscimos */
  valorTotal?: string | number
  /** Montante de desconto monetário aplicado diretamente a este item */
  valorDesconto?: string | number
  /** Código SKU (Stock Keeping Unit) único da variação do produto */
  sku?: string
  /** Assinatura de índice para acomodar metadados adicionais não mapeados rigidamente pela API */
  [key: string]: unknown
}

/**
 * Representa um evento individual na linha do tempo (log de auditoria) do pedido.
 */
export interface MagazordPedidoHistorico {
  /** ID único do registro do evento no histórico */
  id: number
  /** Data e hora exata em que o evento ocorreu no formato YYYY-MM-DD HH:mm:ss */
  dataHora: string
  /** Código numérico da situação do pedido no momento deste registro */
  pedidoSituacao: MagazordPedidoSituacao | number
  /** Título resumido da situação no momento do evento */
  pedidoSituacaoDescricao: string
  /** Descrição literal e detalhada explicando a transição (ex: "Pagamento aprovado via PIX pelo gateway X") */
  pedidoSituacaoDescricaoDetalhada: string
  /** Código classificador do tipo de histórico (interno) */
  tipo: number
  /** ID da etapa correspondente no fluxo logístico/financeiro */
  etapa: number
  /** Indicador binário/booleano da situação do registro no banco */
  situacao: number
  /** Nome do usuário logado, cliente ou rotina de sistema que desencadeou a ação */
  nomeUsuario: string
  /** Categoria do ator responsável pela alteração (ex: "Sistema", "Administrador", "Cliente") */
  tipoUsuario: string
  /** ID de vínculo com um objeto de rastreio específico, se a alteração for de cunho logístico */
  pedidoRastreioId: string
}

/**
 * Contém os dados logísticos após a geração da etiqueta de envio, bem como as promessas de entrega.
 */
export interface MagazordPedidoRastreio {
  /** ID interno do pacote de rastreamento no Magazord */
  id: number
  /** Valor de frete efetivamente cobrado do cliente (ou R$ 0,00 se frete grátis) */
  valorFrete: string
  /** Custo real da etiqueta logística cobrado pela transportadora para o lojista */
  valorFreteTransportadora: string
  /** Código alfanumérico público para acompanhamento da entrega */
  codigoRastreio: string | null
  /** URL direta e montada para rastreamento no site da transportadora */
  link: string | null
  /** Prazo em dias úteis prometido para a entrega final */
  diasUteis: number
  /** Data limite acordada para o lojista separar e entregar o pacote à transportadora */
  dataLimitePostagem: string
  /** Data máxima estipulada para o cliente receber o pacote em sua casa */
  dataLimiteEntregaCliente: string
  /** Data exata em que o pacote foi bipado/despachado na transportadora */
  dataPostagemTransportadora: string | null
  /** Prazo máximo operacional acordado entre o lojista e a transportadora */
  dataLimiteEntregaTransportadora: string
  /** Data exata em que o pacote foi entregue ao destinatário final */
  dataEntregaTransportadora: string | null
  /** Código do status atual do rastreamento */
  situacao: number
  /** Detalhes e dimensões das embalagens utilizadas neste envio específico */
  embalagens: unknown | null
  /** ID interno do serviço específico contratado (ex: PAC, SEDEX, Jadlog Package) */
  transportadoraServicoId: number
  /** Serviços logísticos adicionais contratados (ex: Mão Própria, AR) */
  transportadoraServicoOpcoes: unknown | null
  /** Código classificador do tipo de serviço na transportadora */
  transportadoraServicoTipo: number
  /** Nome amigável do serviço de frete escolhido pelo cliente (ex: "Sedex Convencional") */
  transportadoraServicoDescricao: string
  /** Mensagem complementar sobre a entrega retornada pelo cálculo de frete */
  transportadoraTextoEntrega: string | null
  /** Nome da agência ou ponto de coleta específico onde o pacote foi postado */
  transportadoraAgenciaNome: string | null
  /** Código de identificação do serviço na agência física */
  transportadoraAgenciaCodigoServico: string | null
  /** ID único da empresa de transporte cadastrada no Magazord */
  transportadoraId: number
  /** Nome da transportadora (ex: "Correios", "Loggi", "Jadlog") */
  transportadoraNome: string
  /** Categoria da transportadora */
  transportadoraTipo: number
  /** Flag que indica envios que naturalmente não possuem rastreio (ex: Motoboy Local, Retirada na Loja) */
  naoGeraRastreio: boolean
  /** Situação global do pedido atrelado a este pacote logístico */
  pedidoSituacao: MagazordPedidoSituacao | number
  /** ID da etapa de situação do pedido para controle interno */
  pedidoSituacaoEtapa: number
  /** ID do tipo de situação do pedido associada a este rastreio */
  pedidoSituacaoTipo: number
  /** Resumo em texto do status do pedido no qual este rastreio se encontra */
  pedidoSituacaoDescricao: string
  /** Descrição detalhada do status logístico/pedido deste rastreamento */
  pedidoSituacaoDescricaoDetalhada: string
  /** Código identificador do pedido no sistema/ERP próprio do lojista (se aplicável) */
  pedidoLojistaCodigo: string | null
  /** Nome da filial ou loja parceira responsável pelo fulfillment (separação e despacho) */
  lojistaNome: string | null
  /** Array contendo exclusivamente os itens que estão sendo enviados dentro deste pacote/rastreio */
  pedidoItem: MagazordPedidoItem[]
  /** Array contendo estrutura de itens tipo 'Kit' se houver bundle promocional */
  pedidoItemKit: unknown[]
  /** Estrutura bruta contendo os logs do cálculo original do frete */
  calculoFreteInformacoes: unknown | null
  /** Objeto com chaves de acesso, série e número da Nota Fiscal faturada para este envio */
  pedidoNotaFiscal: unknown | null
  /** ID da tag de identificação no sistema de gestão de armazém/estoque */
  tag_id: string | null
}

/**
 * Informação de contato estruturada associada ao cadastro do cliente.
 */
export interface MagazordPessoaContato {
  /** Identificador numérico do tipo de contato (ex: 1 = Celular, 2 = Comercial, 3 = Residencial) */
  tipo: number
  /** String com o número do telefone ou identificador do contato correspondente */
  contato: string
}

/**
 * ---------------------------------------------------------
 * PAYLOAD PRINCIPAL
 * ---------------------------------------------------------
 */

/**
 * Estrutura completa do pedido recebida nos webhooks do Magazord.
 */
export interface MagazordPedidoPayload {
  // --- Identificação do Pedido ---
  /** ID interno e sequencial do pedido no banco de dados do Magazord */
  id: number
  /** ID da loja matriz na qual o pedido foi processado */
  id_loja: number
  /** Nome comercial da loja onde a venda foi realizada */
  lojaNome: string
  /** Código público de identificação do pedido, visível para o cliente (ex: "11997") */
  codigo: string
  /** Código alternativo de rastreabilidade, usado frequentemente em integrações ERP */
  codigoSecundario: string | null
  /** Timestamp do momento exato em que o pedido foi finalizado (Formato: YYYY-MM-DD HH:mm:ss-03) */
  dataHora: string
  /** Indica por qual plataforma o pedido foi gerado (Site, Marketplace ou Manual) */
  origem: MagazordOrigemPedido | number
  
  // --- Valores e Totalizadores ---
  /** Somatório do valor original de todos os produtos do pedido */
  valorProduto: string
  /** Custo total de frete cobrado do comprador (R$ 0.00 se frete grátis) */
  valorFrete: string
  /** Total de descontos abatidos do pedido (promocionais, cupons, boleto/pix) */
  valorDesconto: string
  /** Acréscimos aplicados ao pedido (ex: juros por parcelamento direto, embalagens extras) */
  valorAcrescimo: string
  /** Valor adicional cobrado por opções de presente (embalagem, cartão) */
  valorPresente: string
  /** Valor base do pedido, antes de ajustes e rateios finais do sistema financeiro */
  valorTotal: string
  /** Valor líquido, exato e final que foi/será pago pelo cliente */
  valorTotalFinal: number
  /** Custo adicionado por personalização de itens (ex: gravação de nome em joias/camisas) */
  valorPersonalizacao: string | null
  /** Montante abatido do total que foi pago usando saldo/créditos em loja do cliente */
  creditoUtilizado: string | null
  /** Montante abatido usando saldo de campanhas de cashback ativas */
  cashbackUtilizado: string | null
  
  // --- Situação ---
  /** Código numérico que define em que fase o pedido se encontra */
  pedidoSituacao: MagazordPedidoSituacao | number
  /** ID da etapa correspondente no pipeline geral (ex: Checkout -> Logística -> Conclusão) */
  pedidoSituacaoEtapa: number
  /** Tipificação técnica do status (Normal, Cancelamento, Extravio, etc.) */
  pedidoSituacaoTipo: number
  /** Título humanizado da situação do pedido (ex: "Aguardando Pagamento", "Faturado") */
  pedidoSituacaoDescricao: string
  /** Texto extenso detalhando a situação para exibição no painel do cliente */
  pedidoSituacaoDescricaoDetalhada: string
  
  // --- Dados do Cliente ---
  /** ID único do cadastro do cliente/comprador no banco de dados da loja */
  pessoaId: number
  /** Nome completo ou razão social do comprador */
  pessoaNome: string
  /** Número do CPF ou CNPJ (apenas números ou formatado, dependendo da configuração da loja) */
  pessoaCpfCnpj: string
  /** Endereço de e-mail utilizado na compra */
  pessoaEmail: string
  /** Identifica se o comprador é Pessoa Física (1) ou Jurídica (2) */
  pessoaTipo: MagazordPessoaTipo | number
  /** Data de nascimento do comprador (YYYY-MM-DD), pode ser nulo se não exigido no checkout */
  pessoaDataNascimento: string | null
  /** Sexo do comprador (M, F ou N/A), se coletado */
  pessoaSexo: string | null
  /** Array com os telefones de contato vinculados ao comprador neste pedido */
  pessoaContato: MagazordPessoaContato[]
  /** Nome da pessoa que vai receber o pacote (pode ser diferente do comprador) */
  nomeDestinatario: string
  
  // --- Endereço de Entrega ---
  /** Rua, Avenida, Travessa, etc. do local de entrega */
  logradouro: string
  /** Número da residência ou prédio do destino */
  numero: string
  /** Bairro correspondente ao CEP informado */
  bairro: string
  /** Informações adicionais de endereço (ex: "Apto 42", "Fundos", "Próximo à padaria") */
  complemento: string
  /** Nome da cidade de destino */
  cidadeNome: string
  /** UF/Sigla do estado de destino (ex: "SP", "SC") */
  estadoSigla: string
  /** Nome do País de destino, nulo se a loja operar exclusivamente no Brasil */
  paisNome: string | null
  /** Código de Endereçamento Postal (CEP) do destino */
  cep: string
  
  // --- Pagamento ---
  /** ID identificador do método de pagamento usado (1 = Boleto, 2 = Mastercard, etc.) */
  formaPagamentoId: MagazordFormaPagamento | number
  /** Nome textual da forma de pagamento exibida no checkout */
  formaPagamentoNome: string
  /** ID interno da condição ou regra de parcelamento aplicada */
  condicaoPagamentoId: number
  /** Nome amigável da condição (ex: "3x Sem Juros", "À Vista") */
  condicaoPagamentoNome: string
  /** Número de parcelas escolhidas no momento da compra (1 para à vista) */
  condicaoPagamentoParcelas: number
  /** ID que especifica como o dinheiro entrará no caixa (forma de recebimento) */
  formaRecebimentoId: number
  /** Nome da forma de recebimento associada */
  formaRecebimentoNome: string
  /** ID numérico do Gateway ou Adquirente responsável por processar a cobrança (ex: Pagar.me, Cielo, MercadoPago) */
  gatewayPagamentoId: number | null
  /** Array de boletos bancários caso a forma de pagamento selecionada o exija */
  boletos: unknown[]
  /** Dados para pagamento via PIX (String Copia e Cola, QR Code, Data de Vencimento), se aplicável */
  pedidoPagamentoPix: unknown | null
  /** Dados específicos de carteiras digitais integradas (ex: AME Digital), se aplicável */
  pedidoPagamentoAme: unknown | null
  /** URL gerada pelo gateway de pagamento para conclusão de pagamentos externos/redirecionamento */
  linkPagamento: string | null
  
  // --- Marketplace ---
  /** ID interno do Hub/Marketplace (ex: Mercado Livre, B2W, Amazon) se o pedido veio de lá */
  marketplaceId: number | null
  /** Nome do Marketplace de origem do pedido */
  marketplaceNome: string | null
  /** ID ou código original do pedido na plataforma do Marketplace (necessário para tracking reverso) */
  codigoMarketplace: string | null
  /** Data e hora em que a compra ocorreu na plataforma parceira */
  dataMarketplace: string | null
  /** ID interno da conta conectada do Marketplace no painel do Magazord */
  lojaDoMarketplaceId: number | null
  /** Nome da loja/apelido cadastrado lá no Marketplace (ex: "Minha Loja Oficial - ML") */
  lojaDoMarketplaceNome: string | null
  /** ID numérico da loja parceira em cenários B2B2C */
  lojaMarketplaceId: number | null
  /** Nome associado à loja no ecossistema do Marketplace */
  lojaMarketplaceNome: string | null
  
  /** 
   * String serializada em JSON contendo metadados visuais, ícones ou flags de configuração enviadas pelo marketplace.
   * @example '{"icone":"marketplace-meli.svg"}'
   * Nota: É necessário realizar `JSON.parse()` antes de acessar as propriedades.
   */
  lojaMarketplaceOpcoes: string | null
  
  // --- Marketing, Cupons e Tracking ---
  /** Código promocional digitado pelo cliente no carrinho, se houver */
  cupomCodigo: string | null
  /** ID interno do cupom utilizado no banco de dados */
  cupomId: number | null
  /** Valor monetário bruto abatido em razão exclusiva do cupom promocional */
  cupomValorDesconto: string | null
  /** Classificação do desconto do cupom (ex: percentual, fixo, frete gratis) */
  cupomTipoDesconto: string | null
  /** Fonte do tráfego ou campanha que gerou a venda (UTM Source) */
  pedidoTrackingSource: string | null
  /** User-Agent (dispositivo e navegador) que o cliente utilizou durante o checkout */
  pedidoTrackingUserAgent: string | null
  /** Parâmetros completos da URL (UTMs e gclid) no momento do fechamento do pedido */
  pedidoTrackingParams: string | null
  /** Código do país (Country Code) baseado no IP do comprador */
  pedidoTrackingCountryCode: string | null
  /** Dados brutos dos pixels de conversão disparados neste pedido */
  pedidoTrackingConversion: string | null
  
  // --- Meta Dados Adicionais ---
  /** Endereço de IP público capturado no momento do fechamento da compra (medida antifraude) */
  pedidoIp: string | null
  /** Código de identificação do vendedor físico ou televendas atrelado comissão deste pedido */
  codigoVendedor: string | null
  /** Se o produto for pré-venda, esta data indica quando ele estará disponível para despacho */
  dataPreVenda: string | null
  /** Tipo de cadastro do parceiro em vendas B2B (Parceiro Magazord/Representante) */
  tipoCadastroPM: string | null
  /** IDs de lojas oficiais ou franquias caso seja um modelo Omnichannel / Multi-CD */
  lojasOficiaisId: unknown[]
  /** URL pública contendo o logotipo ou avatar da loja que efetuou a venda */
  lojaUrlImagem: string
  /** URL da home page da loja onde a venda foi realizada */
  lojaUrl: string
  /** URL enviada ao cliente pós-entrega para preenchimento de NPS ou Review dos produtos */
  linkAvaliacao: string | null
  /** Flag do sistema indicando se processos paralelos devem ser mostrados no log visual */
  mostraProcessos: boolean
  /** Flag interna de monitoramento ativa (ex: sinalização de atendimento prioritário ou suporte) */
  monitoraPedido: boolean
  
  // --- Arrays Filhos ---
  /** Array de pacotes logísticos (rastreios). Um pedido pode ser particionado em múltiplos rastreios caso saia de CDs diferentes. */
  arrayPedidoRastreio: MagazordPedidoRastreio[]
  /** Array contendo toda a linha do tempo cronológica de alterações de situação que o pedido sofreu. */
  pedidoHistorico: MagazordPedidoHistorico[]
}

/** 
 * Envelopamento Padrão de Webhook
 * 
 * Dependendo do endpoint registrado e da versão da configuração no Magazord, 
 * o JSON pode enviar os dados do pedido dentro de uma propriedade raiz nomeada como `payload`.
 */
export interface MagazordPedidoWebhookEnvelope {
  /** O objeto principal contendo todos os dados do pedido. */
  payload: MagazordPedidoPayload
}