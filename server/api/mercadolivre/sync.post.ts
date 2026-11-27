import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~~/shared/types/database.types'
import {
  ML_ORDER_SYNC_BATCH_SIZE,
  normalizeMlSyncDateFrom,
  normalizeMlSyncDaysBack,
} from '~~/shared/utils/mercadolivre'
import type { MlSyncResult } from '~~/server/utils/mercadolivre-sync'
import { syncMercadoLivreData } from '~~/server/utils/mercadolivre-sync'

export default defineEventHandler(async (event) => {
  try {
    const user = await serverSupabaseUser(event)
    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Autenticação necessária para sincronizar dados.',
      })
    }

    const body = await readBody<{ daysBack?: unknown; offset?: number; dateFrom?: string }>(event)
    const daysBack = normalizeMlSyncDaysBack(body?.daysBack)
    if (daysBack === null) {
      throw createError({
        statusCode: 400,
        message: 'A quantidade de dias da sincronização precisa ser um número válido.',
      })
    }

    const offset = body?.offset ?? 0

    if (!Number.isSafeInteger(offset) || offset < 0) {
      throw createError({
        statusCode: 400,
        message: 'O deslocamento de pedidos precisa ser um inteiro não negativo.',
      })
    }

    const dateFrom = normalizeMlSyncDateFrom(body?.dateFrom)
    if (dateFrom === null) {
      throw createError({
        statusCode: 400,
        message: 'A data inicial da sincronização é inválida.',
      })
    }

    const supabase = serverSupabaseServiceRole<Database>(event)
    const result: MlSyncResult = await syncMercadoLivreData(supabase, {
      daysBack,
      offset,
      dateFrom,
      maxOrders: ML_ORDER_SYNC_BATCH_SIZE,
    })

    return {
      success: true,
      ...result,
    }
  } catch (error) {
    const stack = error instanceof Error ? error.stack?.split('\n').slice(1).join('\n') : null
    console.error('[ML Sync] Falha no handler de sincronização:', stack ?? 'Exceção sem stack.')
    throw error
  }
})
