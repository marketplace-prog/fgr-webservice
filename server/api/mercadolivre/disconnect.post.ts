import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~~/shared/types/database.types'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Autenticação necessária.',
    })
  }

  const supabase = serverSupabaseServiceRole<Database>(event)
  const { error } = await supabase
    .from('ml_connections')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')

  if (error) {
    throw createError({
      statusCode: 500,
      message: `Erro ao desconectar conta Mercado Livre: ${error.message}`,
    })
  }

  return { success: true }
})
