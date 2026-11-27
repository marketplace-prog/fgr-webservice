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

  const body = await readBody<{ daysBack?: number }>(event).catch(() => ({ daysBack: 90 }))
  const daysBack = Math.min(Math.max(Number(body?.daysBack || 90), 1), 180)

  const supabase = serverSupabaseServiceRole<Database>(event)
  const result = await syncMercadoLivreData(supabase, { daysBack })

  return {
    success: true,
    ...result,
  }
})
