import { randomUUID } from 'node:crypto'
import { serverSupabaseUser } from '#supabase/server'
import { buildMlAuthUrl } from '~~/server/utils/mercadolivre-api'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Autenticação necessária para conectar o Mercado Livre.',
    })
  }

  const state = randomUUID()
  setCookie(event, 'ml_oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10,
    path: '/',
  })

  return {
    url: buildMlAuthUrl(state),
  }
})
