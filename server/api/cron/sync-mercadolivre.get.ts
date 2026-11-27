import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~~/shared/types/database.types'
import { getActiveMlConnection } from '~~/server/utils/mercadolivre-api'
import { syncMercadoLivreData } from '~~/server/utils/mercadolivre-sync'

export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseServiceRole<Database>(event)
  const connection = await getActiveMlConnection(supabase)

  if (!connection) {
    return {
      success: true,
      skipped: true,
      reason: 'Nenhuma conta do Mercado Livre conectada.',
    }
  }

  try {
    const result = await syncMercadoLivreData(supabase, { daysBack: 14 })
    return {
      success: true,
      skipped: false,
      ...result,
    }
  } catch (err) {
    console.error('[Cron sync-mercadolivre] Erro na sincronização:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro ao sincronizar Mercado Livre.',
    }
  }
})
