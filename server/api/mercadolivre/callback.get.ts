import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import type { Database, Json } from '~~/shared/types/database.types'
import type { MlReputationMetrics } from '~~/shared/types/mercadolivre'
import {
  exchangeMlCodeForTokens,
  mlApiGet,
  type MlUserProfile,
} from '~~/server/utils/mercadolivre-api'
import { syncMercadoLivreData } from '~~/server/utils/mercadolivre-sync'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const code = typeof query.code === 'string' ? query.code.trim() : ''
  const state = typeof query.state === 'string' ? query.state.trim() : ''
  const oauthError = typeof query.error === 'string' ? query.error.trim() : ''

  if (oauthError) {
    return sendRedirect(
      event,
      `/reports/mercadolivre?oauth_error=${encodeURIComponent(oauthError)}`,
    )
  }

  const expectedState = getCookie(event, 'ml_oauth_state')
  deleteCookie(event, 'ml_oauth_state', { path: '/' })

  if (!code || !state || !expectedState || state !== expectedState) {
    return sendRedirect(event, '/reports/mercadolivre?oauth_error=invalid_state')
  }

  const user = await serverSupabaseUser(event)
  if (!user) {
    return sendRedirect(event, '/login')
  }

  try {
    const tokenRes = await exchangeMlCodeForTokens(code)
    const profile = await mlApiGet<MlUserProfile>('/users/me', tokenRes.access_token)

    const supabase = serverSupabaseServiceRole<Database>(event)
    const expiresAt = new Date(Date.now() + tokenRes.expires_in * 1000).toISOString()

    const reputationMetrics: MlReputationMetrics = {
      claimsRate: profile.seller_reputation?.metrics?.claims?.rate ?? null,
      delayedRate: profile.seller_reputation?.metrics?.delayed_handling_time?.rate ?? null,
      cancellationsRate: profile.seller_reputation?.metrics?.cancellations?.rate ?? null,
      sales60d: profile.seller_reputation?.transactions?.total ?? null,
    }

    // Garante conta única: remove conexões antigas de outros sellers se houver troca de conta
    await supabase.from('ml_connections').delete().neq('seller_id', profile.id)

    const { error: upsertErr } = await supabase.from('ml_connections').upsert(
      {
        seller_id: profile.id,
        nickname: profile.nickname,
        site_id: profile.site_id || 'MLB',
        access_token: tokenRes.access_token,
        refresh_token: tokenRes.refresh_token,
        token_type: tokenRes.token_type || 'Bearer',
        scope: tokenRes.scope ?? null,
        expires_at: expiresAt,
        reputation_level_id: profile.seller_reputation?.level_id ?? null,
        power_seller_status: profile.seller_reputation?.power_seller_status ?? null,
        reputation_metrics: reputationMetrics as unknown as Json,
        connected_by: user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'seller_id' },
    )

    if (upsertErr) {
      throw new Error(upsertErr.message)
    }

    // Faz a primeira carga dos últimos 90 dias em seguida; se falhar parcialmente, redireciona mesmo assim
    try {
      await syncMercadoLivreData(supabase, { daysBack: 90 })
    } catch (syncErr) {
      console.error('[ML Callback] Falha na sincronização inicial:', syncErr)
    }

    return sendRedirect(event, '/reports/mercadolivre?connected=1')
  } catch (err) {
    console.error('[ML Callback] Erro no fluxo OAuth:', err)
    const msg = err instanceof Error ? err.message : 'oauth_failed'
    return sendRedirect(event, `/reports/mercadolivre?oauth_error=${encodeURIComponent(msg)}`)
  }
})
