import { serverSupabaseServiceRole } from '#supabase/server'
import type { StockMonitor } from '~~/shared/types/database.types'

export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseServiceRole(event)
  const config = useRuntimeConfig()
  const discordWebhookUrl = config.discord?.estoque_baixo || ''

  // 1. Busca todos os monitores ativos
  const { data: monitors, error } = await supabase
    .from('stock_monitors')
    .select('*')
    .eq('is_active', true)

  if (error || !monitors) {
    console.error('[Cron check-stock] Erro ao buscar monitores:', error)
    return { success: false, error: 'Erro ao buscar monitores ativos.' }
  }

  let alertedCount = 0

  // 2. Processa cada monitor ativo
  for (const monitor of monitors as StockMonitor[]) {
    try {
      const { alerted } = await processMonitorCheck(supabase, monitor, discordWebhookUrl)
      if (alerted) {
        alertedCount++
      }
    } catch (err) {
      console.error(`[Cron check-stock] Erro ao processar SKU ${monitor.sku}:`, err)
    }
  }

  return {
    success: true,
    processed: monitors.length,
    alerted: alertedCount,
  }
})
