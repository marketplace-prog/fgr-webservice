export interface MagazordCliente {
  id: number;
  nome: string;
  cpfCnpj: string;
  tipoPessoa: 'F' | 'J' | string;
  email: string;
  telefone?: string;
  celular?: string;
}

export interface MagazordEndereco {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
  referencia?: string;
}

export interface MagazordItemPedido {
  id: number;
  sku: string;
  codigoProduto: string;
  nome: string;
  quantidade: number;
  valorUnitario: number;
  valorDesconto: number;
  valorTotal: number;
}

export interface MagazordPagamento {
  formaPagamentoId: number;
  formaPagamentoNome: string;
  valor: number;
  parcelas: number;
  status: string;
}

export interface MagazordPedidoRegistradoPayload {
  id: number;
  codigo: string;
  dataCriacao: string;
  situacaoId: number;
  situacaoNome: string;
  valorProdutos: number;
  valorFrete: number;
  valorDesconto: number;
  valorTotal: number;
  cliente: MagazordCliente;
  enderecoEntrega: MagazordEndereco;
  itens: MagazordItemPedido[];
  pagamentos: MagazordPagamento[];
}

export interface MagazordWebhookPedidoRegistrado {
  evento: 'pedido.registrado' | string;
  dataEnvio: string;
  payload: MagazordPedidoRegistradoPayload;
}