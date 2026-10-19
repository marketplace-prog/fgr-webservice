import { serverSupabaseUser } from '#supabase/server'
import { createMagazordApiUrl, createMagazordAuthorization } from '~~/server/utils/magazord-api'

type MagazordProductRecord = Record<string, unknown>

const nameFields = [
  'produtoNome',
  'nomeProduto',
  'produtoDescricao',
  'descricaoProduto',
  'nome',
  'descricao',
]

function isRecord(value: unknown): value is MagazordProductRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function extractProductName(response: unknown): string | undefined {
  if (!isRecord(response)) return undefined

  for (const field of nameFields) {
    const value = response[field]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }

  for (const field of ['data', 'produto', 'derivacao']) {
    const name = extractProductName(response[field])
    if (name) return name
  }

  return undefined
}

function getStatusCode(error: unknown): number | undefined {
  if (!isRecord(error)) return undefined
  if (typeof error.statusCode === 'number') return error.statusCode
  if (typeof error.status === 'number') return error.status
  return undefined
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Autenticação necessária.' })
  }

  const query = getQuery(event)
  const sku = typeof query.sku === 'string' ? query.sku.trim() : ''
  const skuType = query.sku_type

  if (!sku || (skuType !== 'variation' && skuType !== 'parent')) {
    throw createError({
      statusCode: 400,
      message: 'Informe um SKU e um tipo de produto válidos.',
    })
  }

  const config = useRuntimeConfig(event).magazord
  if (!config.apiUrl || !config.apiToken || !config.apiPassword) {
    throw createError({
      statusCode: 503,
      message: 'As credenciais da API Magazord não estão configuradas.',
    })
  }

  let url: URL
  try {
    const endpoint =
      skuType === 'variation'
        ? `/v3/produtos/derivacao/${encodeURIComponent(sku)}/detail`
        : `/v2/site/produto/${encodeURIComponent(sku)}`
    url = createMagazordApiUrl(config.apiUrl, endpoint)
  } catch {
    throw createError({
      statusCode: 500,
      message: 'A URL da API Magazord é inválida ou não utiliza HTTPS.',
    })
  }

  let response: unknown
  try {
    response = await $fetch<unknown>(url.toString(), {
      headers: {
        Authorization: createMagazordAuthorization(config.apiToken, config.apiPassword),
      },
    })
  } catch (error: unknown) {
    if (getStatusCode(error) === 404) {
      throw createError({ statusCode: 404, message: 'SKU não encontrado na Magazord.' })
    }

    throw createError({
      statusCode: 502,
      message:
        getStatusCode(error) === 401
          ? 'A API Magazord recusou as credenciais configuradas.'
          : 'Não foi possível consultar a API Magazord.',
    })
  }

  const name = extractProductName(response)
  if (!name) {
    throw createError({
      statusCode: 502,
      message: 'A resposta da API Magazord não contém o nome do produto.',
    })
  }

  return { name }
})
