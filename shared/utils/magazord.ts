/**
 * @file shared/utils/magazord.ts
 * Utilitários compartilhados para processamento de dados do Magazord.
 * Auto-importados pelo motor Nitro (Nuxt 4).
 */

/**
 * Extrai apenas o primeiro nome do cliente para uso em notificações,
 * evitando a exposição de dados sensíveis e mantendo a interface limpa.
 * 
 * @param name - Nome completo do cliente retornado pela API.
 * @returns O primeiro nome ou 'N/A' caso o valor seja nulo/inválido.
 */
export const getFirstName = (name?: string): string => {
  if (!name) return 'N/A'
  return name.trim().split(' ')[0] ?? 'Anônimo 🎭'
}

/**
 * Trunca uma string para garantir que ela não estoure os limites da API do Discord.
 * Campos de `Embed` no Discord possuem um limite estrito de 1024 caracteres.
 * 
 * @param value - O texto original que será verificado.
 * @param max - O tamanho máximo permitido (padrão: 1024).
 * @returns A string intacta ou truncada com reticências.
 */
export const truncate = (value: string, max = 1024): string =>
  value.length > max ? `${value.substring(0, max - 3)}...` : value

/**
 * Normaliza o formato de data enviado pelo Magazord.
 * A Magazord frequentemente envia datas no formato "YYYY-MM-DD HH:mm:ss-03" (sem o :00 no offset).
 * Motores JS mais rígidos falham ao instanciar isso via `new Date()`. Esta função injeta o padrão ISO correto.
 * 
 * @param raw - Data em formato de string fornecida pelo webhook.
 * @returns Objeto `Date` válido. Cai para a data/hora atual (fallback) em caso de string inparseável.
 */
export const parseMagazordDate = (raw?: string | null): Date => {
  if (!raw) return new Date()
  const normalized = raw.trim().replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00')
  const parsed = new Date(normalized)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

/**
 * Converte valores numéricos soltos no formato de moeda Real Brasileiro (BRL).
 * 
 * @param val - Valor em string ou numérico.
 * @returns String formatada. Ex: "R$ 1.500,00".
 */
export const formatCurrency = (val: string | number | null | undefined): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val) || 0)

/**
 * Mapeia o código de status interno do pedido do Magazord para um código de cor decimal do Discord.
 * 
 * @param situacaoId - O ID numérico referente à situação do pedido (`pedidoSituacao`).
 * @returns O código decimal da cor a ser utilizada na borda lateral do alerta no Discord.
 */
export const getStatusColor = (situacaoId: number): number => {
  switch (situacaoId) {
    case 1: return 16753920 // Amarelo (#FFA500) - Aguardando Pagamento
    case 2: return 15548997 // Vermelho (#ED4245) - Cancelado
    case 3: return 3447003  // Azul (#3498DB) - Em Análise de Pagamento
    case 4: return 5763719  // Verde (#57F287) - Aprovado/Faturado
    default: return 9807270 // Cinza (#95A5A6) - Outros / Desconhecido
  }
}