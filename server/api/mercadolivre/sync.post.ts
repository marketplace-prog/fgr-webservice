import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~~/shared/types/database.types'
import { syncMercadoLivreData } from '~~/server/utils/mercadolivre-sync'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Autenticação necessária para sincronizar dados.',
    })
  }

  const body = await readBody<{ daysBack?: number; offset?: number; dateFrom?: string }>(event)
  const daysBack = Math.min(Math.max(Number(body?.daysBack || 90), 1), 180)
  const offset = body?.offset ?? 0

  if (!Number.isSafeInteger(offset) || offset < 0) {
    throw createError({
      statusCode: 400,
      message: 'O deslocamento de pedidos precisa ser um inteiro não negativo.',
    })
  }

  let dateFrom: string | undefined
  if (body?.dateFrom !== undefined) {
    if (typeof body.dateFrom !== 'string' || Number.isNaN(Date.parse(body.dateFrom))) {
      throw createError({
        statusCode: 400,
        message: 'A data inicial da sincronização é inválida.',
      })
    }

    dateFrom = new Date(body.dateFrom).toISOString()
  }

  const supabase = serverSupabaseServiceRole<Database>(event)
  const result = await syncMercadoLivreData(supabase, { daysBack, offset, dateFrom })

  return {
    success: true,
    ...result,
  }
})
