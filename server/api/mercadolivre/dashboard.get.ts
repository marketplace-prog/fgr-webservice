import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~~/shared/types/database.types'
import type {
  MlAdsDailyRecord,
  MlDashboardRange,
  MlDashboardResponse,
  MlItemRecord,
  MlOrderItemSnapshot,
  MlOrderRecord,
} from '~~/shared/types/mercadolivre'
import { aggregateMlDashboard, resolveMlDateRange } from '~~/shared/utils/mercadolivre'
import { getActiveMlConnection, toMlConnectionSummary } from '~~/server/utils/mercadolivre-api'

const VALID_RANGES: MlDashboardRange[] = ['7d', '30d', 'month', '90d', 'custom']

export default defineEventHandler(async (event): Promise<MlDashboardResponse> => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Autenticação necessária para visualizar o dashboard do Mercado Livre.',
    })
  }

  const query = getQuery(event)
  const rawRange = String(query.range || '30d') as MlDashboardRange
  const range: MlDashboardRange = VALID_RANGES.includes(rawRange) ? rawRange : '30d'
  const customFrom = typeof query.from === 'string' ? query.from : undefined
  const customTo = typeof query.to === 'string' ? query.to : undefined

  const supabase = serverSupabaseServiceRole<Database>(event)
  const connectionRow = await getActiveMlConnection(supabase)
  const connection = toMlConnectionSummary(connectionRow)

  if (!connectionRow) {
    return {
      connection,
      dashboard: null,
    }
  }

  const { dateFrom, dateTo } = resolveMlDateRange(range, customFrom, customTo)
  const fromIso = `${dateFrom}T00:00:00.000Z`
  const toIso = `${dateTo}T23:59:59.999Z`

  const [ordersRes, itemsRes, adsRes] = await Promise.all([
    supabase
      .from('ml_orders')
      .select(
        'order_id, seller_id, date_created, status, total_amount, paid_amount, sale_fee, shipping_cost, net_amount, logistic_type, shipping_status, items',
      )
      .eq('seller_id', connectionRow.seller_id)
      .gte('date_created', fromIso)
      .lte('date_created', toIso)
      .order('date_created', { ascending: true }),
    supabase
      .from('ml_items')
      .select(
        'item_id, seller_id, sku, title, status, price, available_quantity, sold_quantity, listing_type_id, logistic_type, permalink, thumbnail, health',
      )
      .eq('seller_id', connectionRow.seller_id)
      .order('sold_quantity', { ascending: false }),
    supabase
      .from('ml_ads_daily')
      .select('date, cost, clicks, prints, direct_amount, indirect_amount, total_amount')
      .eq('seller_id', connectionRow.seller_id)
      .gte('date', dateFrom)
      .lte('date', dateTo)
      .order('date', { ascending: true }),
  ])

  if (ordersRes.error) {
    throw createError({
      statusCode: 500,
      message: `Erro ao carregar pedidos ML: ${ordersRes.error.message}`,
    })
  }

  if (itemsRes.error) {
    throw createError({
      statusCode: 500,
      message: `Erro ao carregar anúncios ML: ${itemsRes.error.message}`,
    })
  }

  if (adsRes.error) {
    throw createError({
      statusCode: 500,
      message: `Erro ao carregar métricas de ADS: ${adsRes.error.message}`,
    })
  }

  const orders: MlOrderRecord[] = (ordersRes.data || []).map((row) => ({
    order_id: row.order_id,
    seller_id: row.seller_id,
    date_created: row.date_created,
    status: row.status,
    total_amount: Number(row.total_amount),
    paid_amount: Number(row.paid_amount),
    sale_fee: Number(row.sale_fee),
    shipping_cost: Number(row.shipping_cost),
    net_amount: Number(row.net_amount),
    logistic_type: row.logistic_type,
    shipping_status: row.shipping_status,
    items: (Array.isArray(row.items) ? row.items : []) as unknown as MlOrderItemSnapshot[],
  }))

  const items: MlItemRecord[] = (itemsRes.data || []).map((row) => ({
    item_id: row.item_id,
    seller_id: row.seller_id,
    sku: row.sku,
    title: row.title,
    status: row.status,
    price: Number(row.price),
    available_quantity: row.available_quantity,
    sold_quantity: row.sold_quantity,
    listing_type_id: row.listing_type_id,
    logistic_type: row.logistic_type,
    permalink: row.permalink,
    thumbnail: row.thumbnail,
    health: row.health,
  }))

  const adsDaily: MlAdsDailyRecord[] = (adsRes.data || []).map((row) => ({
    date: row.date,
    cost: Number(row.cost),
    clicks: row.clicks,
    prints: row.prints,
    direct_amount: Number(row.direct_amount),
    indirect_amount: Number(row.indirect_amount),
    total_amount: Number(row.total_amount),
  }))

  const dashboard = aggregateMlDashboard({
    range,
    dateFrom,
    dateTo,
    orders,
    items,
    adsDaily,
  })

  return {
    connection,
    dashboard,
  }
})
