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
    // --- Aguardando / Pendências (Amarelos e Laranjas) ---
    case 1: return 16753920  // Amarelo (#FFA500) - Aguardando Pagamento
    case 11: return 15105570 // Laranja (#E67E22) - Disputa
    case 15: return 15844367 // Amarelo Claro (#F1C40F) - Aguardando Pagamento (Diferenciado)
    case 18: return 15965202 // Dourado (#F39C12) - Aguardando Atualização de Dados
    case 22: return 16729344 // Laranja Avermelhado (#FF4500) - Suspenso Temporariamente

    // --- Análise / Processamento (Azuis e Cianos) ---
    case 3: return 3447003   // Azul (#3498DB) - Em análise Pagamento
    case 13: return 1146986  // Azul Esverdeado (#11806A) - Em análise de pagamento (interna)
    case 23: return 6139362  // Azul Claro (#5DADE2) - Faturamento Iniciado
    case 25: return 65535    // Ciano (#00FFFF) - Tratamento Pós-Vendas
    case 27: return 2719929  // Azul Marinho (#2980B9) - Crédito por Troca

    // --- Sucesso / Aprovação (Verdes e Turquesas) ---
    case 4: return 5763719   // Verde Claro (#57F287) - Aprovado
    case 5: return 3066993   // Verde Padrão (#2ECC71) - Aprovado e Integrado
    case 6: return 5822093   // Verde Pastel (#58D68D) - Nota Fiscal Emitida
    case 8: return 2067276   // Verde Escuro (#1F8B4C) - Entregue
    case 12: return 1752220  // Turquesa (#1ABC9C) - Aprovado Análise de Pagamento
    case 29: return 4770224  // Verde Menta (#48C9B0) - Chargeback Recuperado
    case 30: return 10672590 // Verde Amarelado (#A2D9CE) - Aprovado Parcial

    // --- Logística e Transporte (Roxos e Lilases) ---
    case 7: return 10181046  // Roxo (#9B59B6) - Transporte
    case 19: return 11498181 // Lilás (#AF7AC5) - Aguardando Chegada do Produto
    case 31: return 9323693  // Roxo Escuro (#8E44AD) - Em Logística Reversa

    // --- Cancelamentos e Problemas (Vermelhos e Rosas) ---
    case 2: return 15548997  // Vermelho (#ED4245) - Cancelado Pagamento
    case 9: return 10038562  // Vermelho Escuro (#992D22) - Fraude
    case 10: return 16711680 // Vermelho Vivo (#FF0000) - Chargeback
    case 14: return 12601643 // Vinho (#C0392B) - Cancelado Pagamento Análise
    case 16: return 13849600 // Laranja Escuro (#D35400) - Problema Fluxo Postal
    case 24: return 15221651 // Rosa Escuro (#E84393) - Em Cancelamento
    case 28: return 13459797 // Vermelho Desbotado (#CD6155) - Nota Fiscal Denegada

    // --- Devoluções e Inativos (Cinzas) ---
    case 17: return 9807270  // Cinza Claro (#95A5A6) - Devolvido Financeiro
    case 20: return 8359053  // Cinza Escuro (#7F8C8D) - Devolvido Estoque (Dep. 1)
    case 21: return 7371644  // Cinza Ardosia (#707B7C) - Devolvido Estoque (Outros Dep.)
    case 26: return 11713211 // Cinza Platinado (#B2BABB) - Nota Fiscal Cancelada

    // --- Fallback ---
    default: return 9807270  // Cinza (#95A5A6) - Outros / Desconhecido
  }
}