import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~~/shared/types/database.types'
import type { MlConnectionSummary, MlReputationMetrics } from '~~/shared/types/mercadolivre'

const ML_AUTH_BASE = 'https://auth.mercadolivre.com.br/authorization'
const ML_API_BASE = 'https://api.mercadolibre.com'

export interface MlOAuthTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  scope?: string
  user_id: number
  refresh_token: string
}

export interface MlUserProfile {
  id: number
  nickname: string
  site_id: string
  seller_reputation?: {
    level_id?: string | null
    power_seller_status?: string | null
    transactions?: {
      total?: number
    }
    metrics?: {
      claims?: { rate?: number }
      delayed_handling_time?: { rate?: number }
      cancellations?: { rate?: number }
    }
  }
}

function getMlTokenExpiresAt(expiresIn: number): string {
  const expiresAtMs = Date.now() + expiresIn * 1000
  const expiresAt = new Date(expiresAtMs)

  if (
    !Number.isFinite(expiresIn) ||
    expiresIn <= 0 ||
    !Number.isFinite(expiresAtMs) ||
    Number.isNaN(expiresAt.getTime())
  ) {
    throw new Error('O Mercado Livre retornou um prazo de expiração inválido para o token.')
  }

  return expiresAt.toISOString()
}

export function getMlOAuthConfig() {
  const config = useRuntimeConfig()
  const clientId = String(config.mercadolivre?.clientId || '').trim()
  const clientSecret = String(config.mercadolivre?.clientSecret || '').trim()
  const redirectUri = String(
    config.mercadolivre?.redirectUri ||
      'https://fgr-webservice.vercel.app/api/mercadolivre/callback',
  ).trim()

  return {
    clientId,
    clientSecret,
    redirectUri,
    configured: Boolean(clientId && clientSecret && redirectUri),
  }
}

export function buildMlAuthUrl(state: string): string {
  const { clientId, redirectUri, configured } = getMlOAuthConfig()
  if (!configured) {
    throw createError({
      statusCode: 500,
      message:
        'Credenciais do Mercado Livre não configuradas. Defina ML_CLIENT_ID e ML_CLIENT_SECRET.',
    })
  }

  const url = new URL(ML_AUTH_BASE)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('state', state)
  return url.toString()
}

export async function exchangeMlCodeForTokens(code: string): Promise<MlOAuthTokenResponse> {
  const { clientId, clientSecret, redirectUri, configured } = getMlOAuthConfig()
  if (!configured) {
    throw createError({
      statusCode: 500,
      message: 'Credenciais do Mercado Livre não configuradas.',
    })
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
  })

  return await $fetch<MlOAuthTokenResponse>(`${ML_API_BASE}/oauth/token`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })
}

export async function refreshMlTokens(refreshToken: string): Promise<MlOAuthTokenResponse> {
  const { clientId, clientSecret, configured } = getMlOAuthConfig()
  if (!configured) {
    throw createError({
      statusCode: 500,
      message: 'Credenciais do Mercado Livre não configuradas.',
    })
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  })

  return await $fetch<MlOAuthTokenResponse>(`${ML_API_BASE}/oauth/token`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })
}

export async function mlApiGet<T>(
  path: string,
  accessToken: string,
  query?: Record<string, string | number | undefined>,
): Promise<T> {
  const url = new URL(`${ML_API_BASE}${path.startsWith('/') ? path : `/${path}`}`)
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== '') {
        url.searchParams.set(k, String(v))
      }
    }
  }

  const response = await $fetch<unknown>(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      accept: 'application/json',
    },
  })

  return response as T
}

export async function getActiveMlConnection(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from('ml_connections')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw createError({
      statusCode: 500,
      message: `Erro ao consultar conexão Mercado Livre: ${error.message}`,
    })
  }

  return data
}

export async function ensureValidMlAccessToken(
  supabase: SupabaseClient<Database>,
  connection: Database['public']['Tables']['ml_connections']['Row'],
): Promise<string> {
  const expiresAtMs = new Date(connection.expires_at).getTime()
  const refreshThresholdMs = 5 * 60 * 1000

  if (expiresAtMs - Date.now() > refreshThresholdMs) {
    return connection.access_token
  }

  const refreshed = await refreshMlTokens(connection.refresh_token)
  const nextExpiresAt = getMlTokenExpiresAt(refreshed.expires_in)

  const { error } = await supabase
    .from('ml_connections')
    .update({
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token,
      token_type: refreshed.token_type || 'Bearer',
      scope: refreshed.scope ?? connection.scope,
      expires_at: nextExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', connection.id)

  if (error) {
    throw createError({
      statusCode: 500,
      message: `Erro ao atualizar token do Mercado Livre: ${error.message}`,
    })
  }

  return refreshed.access_token
}

export function toMlConnectionSummary(
  row: Database['public']['Tables']['ml_connections']['Row'] | null,
): MlConnectionSummary {
  const { configured, redirectUri } = getMlOAuthConfig()

  if (!row) {
    return {
      connected: false,
      sellerId: null,
      nickname: null,
      siteId: null,
      reputationLevelId: null,
      powerSellerStatus: null,
      reputationMetrics: {},
      lastSyncedAt: null,
      lastSyncStatus: null,
      lastSyncError: null,
      oauthConfigured: configured,
      redirectUri,
    }
  }

  const metrics = (row.reputation_metrics || {}) as MlReputationMetrics

  return {
    connected: true,
    sellerId: row.seller_id,
    nickname: row.nickname,
    siteId: row.site_id,
    reputationLevelId: row.reputation_level_id,
    powerSellerStatus: row.power_seller_status,
    reputationMetrics: metrics,
    lastSyncedAt: row.last_synced_at,
    lastSyncStatus: (row.last_sync_status as 'ok' | 'partial' | 'error' | null) ?? null,
    lastSyncError: row.last_sync_error,
    oauthConfigured: configured,
    redirectUri,
  }
}
