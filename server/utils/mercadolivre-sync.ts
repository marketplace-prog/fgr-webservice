import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '~~/shared/types/database.types'
import type { MlOrderItemSnapshot, MlReputationMetrics } from '~~/shared/types/mercadolivre'
import {
  ensureValidMlAccessToken,
  getActiveMlConnection,
  mlApiGet,
  type MlUserProfile,
} from './mercadolivre-api'

interface MlOrdersSearchResponse {
  results: MlRawOrder[]
  paging: { total: number; limit: number; offset: number }
}

interface MlRawOrder {
  id: number
  pack_id?: number | null
  date_created: string
  date_closed?: string | null
  status: string
  currency_id?: string
  total_amount?: number
  paid_amount?: number
  buyer?: { nickname?: string }
  shipping?: { id?: number }
  order_items?: Array<{
    item?: {
      id?: string
      title?: string
      seller_sku?: string | null
    }
    quantity?: number
    unit_price?: number
    sale_fee?: number
  }>
}

interface MlShipmentDetails {
  id: number
  status?: string
  logistic_type?: string
  shipping_option?: {
    cost?: number
    list_cost?: number
  }
}

interface MlShipmentCosts {
  senders?: Array<{
    cost?: number
  }>
}

interface MlItemsSearchResponse {
  results: string[]
  paging?: { total: number; limit: number; offset: number }
}

interface MlRawItemBody {
  id: string
  title: string
  status: string
  price?: number
  available_quantity?: number
  sold_quantity?: number
  listing_type_id?: string
  permalink?: string
  thumbnail?: string
  health?: number | null
  seller_custom_field?: string | null
  shipping?: { logistic_type?: string | null }
  attributes?: Array<{ id?: string; value_name?: string | null }>
}

interface MlMultiGetItemEntry {
  code: number
  body?: MlRawItemBody
}

interface MlAdvertisersResponse {
  advertisers?: Array<{ advertiser_id: number; site_id: string }>
}

interface MlAdsMetricsResponse {
  results?: Array<{
    date?: string
    metrics?: {
      cost?: number
      clicks?: number
      prints?: number
      direct_amount?: number
      indirect_amount?: number
      total_amount?: number
      acos?: number
      roas?: number
    }
  }>
}

export interface MlSyncResult {
  ordersSynced: number
  itemsSynced: number
  adsDaysSynced: number
  adsSupported: boolean
  lastSyncedAt: string
}

async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = []
  let index = 0

  async function next() {
    while (index < items.length) {
      const current = items[index++]!
      results.push(await worker(current))
    }
  }

  const runners = Array.from({ length: Math.min(limit, items.length) }, () => next())
  await Promise.all(runners)
  return results
}

function extractItemSku(item: MlRawItemBody): string | null {
  if (item.seller_custom_field) return item.seller_custom_field
  const skuAttr = item.attributes?.find((a) => a.id === 'SELLER_SKU')
  return skuAttr?.value_name ?? null
}

async function fetchShipmentInfo(
  shippingId: number,
  accessToken: string,
): Promise<{ logisticType: string | null; shippingStatus: string | null; shippingCost: number }> {
  try {
    const [shipment, costs] = await Promise.all([
      mlApiGet<MlShipmentDetails>(`/shipments/${shippingId}`, accessToken),
      mlApiGet<MlShipmentCosts>(`/shipments/${shippingId}/costs`, accessToken).catch(() => null),
    ])

    const sellerCost = Number(costs?.senders?.[0]?.cost ?? 0) || 0
    return {
      logisticType: shipment.logistic_type ?? null,
      shippingStatus: shipment.status ?? null,
      shippingCost: sellerCost,
    }
  } catch {
    return { logisticType: null, shippingStatus: null, shippingCost: 0 }
  }
}

async function syncRevenueChannelMercadoLivre(
  supabase: SupabaseClient<Database>,
  sellerId: number,
) {
  const { data: paidOrders, error } = await supabase
    .from('ml_orders')
    .select('date_created, total_amount')
    .eq('seller_id', sellerId)
    .eq('status', 'paid')
    .order('date_created', { ascending: true })

  if (error || !paidOrders?.length) return

  const monthlyTotals = new Map<string, number>()
  const dailyTotals = new Map<string, number>()

  for (const row of paidOrders) {
    const dateStr = row.date_created.slice(0, 10)
    const [yStr, mStr] = dateStr.split('-')
    if (!yStr || !mStr) continue
    const ymKey = `${yStr}-${mStr}`
    const amount = Number(row.total_amount) || 0
    monthlyTotals.set(ymKey, (monthlyTotals.get(ymKey) ?? 0) + amount)
    dailyTotals.set(dateStr, (dailyTotals.get(dateStr) ?? 0) + amount)
  }

  const monthlyUpserts = Array.from(monthlyTotals.entries()).map(([ym, revenue]) => {
    const [year, month] = ym.split('-').map(Number)
    return {
      channel: 'mercadolivre',
      year: year!,
      month: month!,
      revenue: Number(revenue.toFixed(2)),
      updated_at: new Date().toISOString(),
    }
  })

  if (monthlyUpserts.length) {
    await supabase
      .from('revenue_monthly')
      .upsert(monthlyUpserts, { onConflict: 'channel,year,month' })
  }

  const monthDayMap = new Map<string, Map<number, number>>()
  for (const [dateStr, amount] of dailyTotals.entries()) {
    const [yStr, mStr, dStr] = dateStr.split('-')
    const ymKey = `${yStr}-${mStr}`
    const day = Number(dStr)
    if (!monthDayMap.has(ymKey)) monthDayMap.set(ymKey, new Map())
    monthDayMap.get(ymKey)!.set(day, amount)
  }

  const dailyUpserts: Database['public']['Tables']['revenue_daily']['Insert'][] = []
  for (const [ym, dayMap] of monthDayMap.entries()) {
    const [year, month] = ym.split('-').map(Number)
    let running = 0
    const sortedDays = Array.from(dayMap.keys()).sort((a, b) => a - b)
    for (const day of sortedDays) {
      running += dayMap.get(day) ?? 0
      dailyUpserts.push({
        channel: 'mercadolivre',
        year: year!,
        month: month!,
        day,
        cumulative_revenue: Number(running.toFixed(2)),
        updated_at: new Date().toISOString(),
      })
    }
  }

  if (dailyUpserts.length) {
    await supabase
      .from('revenue_daily')
      .upsert(dailyUpserts, { onConflict: 'channel,year,month,day' })
  }
}

export async function syncMercadoLivreData(
  supabase: SupabaseClient<Database>,
  options: { daysBack?: number } = {},
): Promise<MlSyncResult> {
  const connection = await getActiveMlConnection(supabase)
  if (!connection) {
    throw createError({
      statusCode: 400,
      message: 'Nenhuma conta do Mercado Livre conectada.',
    })
  }

  const accessToken = await ensureValidMlAccessToken(supabase, connection)
  const sellerId = connection.seller_id
  const daysBack = options.daysBack ?? 90

  try {
    // 1. Atualiza perfil e reputação do vendedor
    const profile = await mlApiGet<MlUserProfile>(`/users/${sellerId}`, accessToken)
    const reputationMetrics: MlReputationMetrics = {
      claimsRate: profile.seller_reputation?.metrics?.claims?.rate ?? null,
      delayedRate: profile.seller_reputation?.metrics?.delayed_handling_time?.rate ?? null,
      cancellationsRate: profile.seller_reputation?.metrics?.cancellations?.rate ?? null,
      sales60d: profile.seller_reputation?.transactions?.total ?? null,
    }

    // 2. Busca pedidos do período (paginação até 500 pedidos por sync para caber com folga no timeout)
    const dateFrom = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString()
    const rawOrders: MlRawOrder[] = []
    let offset = 0
    const limit = 50
    const maxOrders = 500

    while (offset < maxOrders) {
      const page = await mlApiGet<MlOrdersSearchResponse>('/orders/search', accessToken, {
        seller: sellerId,
        'order.date_created.from': dateFrom,
        sort: 'date_desc',
        limit,
        offset,
      })

      const batch = page.results || []
      rawOrders.push(...batch)
      if (batch.length < limit || rawOrders.length >= page.paging.total) {
        break
      }
      offset += limit
    }

    // Busca detalhes de envio para pedidos únicos com shipping.id
    const shippingIds = Array.from(
      new Set(
        rawOrders
          .map((o) => o.shipping?.id)
          .filter((id): id is number => typeof id === 'number' && id > 0),
      ),
    )

    const shipmentInfoMap = new Map<
      number,
      { logisticType: string | null; shippingStatus: string | null; shippingCost: number }
    >()

    await runWithConcurrency(shippingIds, 6, async (shippingId) => {
      const info = await fetchShipmentInfo(shippingId, accessToken)
      shipmentInfoMap.set(shippingId, info)
    })

    const orderUpserts: Database['public']['Tables']['ml_orders']['Insert'][] = rawOrders.map(
      (o) => {
        const itemsSnapshot: MlOrderItemSnapshot[] = (o.order_items || []).map((oi) => ({
          item_id: oi.item?.id || '',
          title: oi.item?.title || '',
          sku: oi.item?.seller_sku ?? null,
          quantity: Number(oi.quantity ?? 0),
          unit_price: Number(oi.unit_price ?? 0),
          sale_fee: Number(oi.sale_fee ?? 0) * Number(oi.quantity ?? 1),
        }))

        const totalAmount = Number(o.total_amount ?? 0)
        const paidAmount = Number(o.paid_amount ?? 0)
        const saleFee = itemsSnapshot.reduce((acc, item) => acc + item.sale_fee, 0)
        const shipInfo = o.shipping?.id ? shipmentInfoMap.get(o.shipping.id) : undefined
        const shippingCost = shipInfo?.shippingCost ?? 0
        const netAmount = Math.max(0, totalAmount - saleFee - shippingCost)

        return {
          order_id: o.id,
          seller_id: sellerId,
          pack_id: o.pack_id ?? null,
          date_created: o.date_created,
          date_closed: o.date_closed ?? null,
          status: o.status,
          currency_id: o.currency_id || 'BRL',
          total_amount: Number(totalAmount.toFixed(2)),
          paid_amount: Number(paidAmount.toFixed(2)),
          sale_fee: Number(saleFee.toFixed(2)),
          shipping_cost: Number(shippingCost.toFixed(2)),
          net_amount: Number(netAmount.toFixed(2)),
          logistic_type: shipInfo?.logisticType ?? null,
          shipping_status: shipInfo?.shippingStatus ?? null,
          items: itemsSnapshot as unknown as Json,
          buyer_nickname: o.buyer?.nickname ?? null,
          updated_at: new Date().toISOString(),
        }
      },
    )

    if (orderUpserts.length) {
      const { error: ordersErr } = await supabase
        .from('ml_orders')
        .upsert(orderUpserts, { onConflict: 'order_id' })

      if (ordersErr) {
        throw new Error(`Erro ao salvar pedidos ML: ${ordersErr.message}`)
      }
    }

    // 3. Sincroniza anúncios (ativos e pausados, até 200 mais recentes)
    const itemIdsSet = new Set<string>()
    for (const status of ['active', 'paused']) {
      const searchRes = await mlApiGet<MlItemsSearchResponse>(
        `/users/${sellerId}/items/search`,
        accessToken,
        { status, limit: 100 },
      ).catch(() => ({ results: [] }))

      for (const id of searchRes.results || []) {
        itemIdsSet.add(id)
      }
    }

    const itemIds = Array.from(itemIdsSet).slice(0, 200)
    const itemUpserts: Database['public']['Tables']['ml_items']['Insert'][] = []

    for (let i = 0; i < itemIds.length; i += 20) {
      const chunk = itemIds.slice(i, i + 20)
      const multi = await mlApiGet<MlMultiGetItemEntry[]>('/items', accessToken, {
        ids: chunk.join(','),
      }).catch(() => [])

      for (const entry of multi) {
        if (entry.code !== 200 || !entry.body) continue
        const b = entry.body
        itemUpserts.push({
          item_id: b.id,
          seller_id: sellerId,
          sku: extractItemSku(b),
          title: b.title,
          status: b.status,
          price: Number(b.price ?? 0),
          available_quantity: Number(b.available_quantity ?? 0),
          sold_quantity: Number(b.sold_quantity ?? 0),
          listing_type_id: b.listing_type_id ?? null,
          logistic_type: b.shipping?.logistic_type ?? null,
          permalink: b.permalink ?? null,
          thumbnail: b.thumbnail ?? null,
          health: b.health ?? null,
          updated_at: new Date().toISOString(),
        })
      }
    }

    if (itemUpserts.length) {
      const { error: itemsErr } = await supabase
        .from('ml_items')
        .upsert(itemUpserts, { onConflict: 'item_id' })

      if (itemsErr) {
        throw new Error(`Erro ao salvar anúncios ML: ${itemsErr.message}`)
      }
    }

    // 4. Tenta sincronizar métricas de Product Ads (opcional conforme escopo do app)
    let adsDaysSynced = 0
    let adsSupported = false
    try {
      const advertisers = await mlApiGet<MlAdvertisersResponse>(
        '/advertising/advertisers',
        accessToken,
        { product_id: 'PADS' },
      )
      const advertiser = advertisers.advertisers?.[0]
      if (advertiser) {
        adsSupported = true
        const toDate = new Date().toISOString().slice(0, 10)
        const fromDate = new Date(Date.now() - Math.min(daysBack, 60) * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10)

        const adsRes = await mlApiGet<MlAdsMetricsResponse>(
          `/advertising/${advertiser.site_id}/advertisers/${advertiser.advertiser_id}/product_ads/campaigns/metrics`,
          accessToken,
          {
            date_from: fromDate,
            date_to: toDate,
            metrics: 'clicks,prints,cost,direct_amount,indirect_amount,total_amount,acos,roas',
            aggregation_type: 'DAILY',
          },
        ).catch(() => ({ results: [] }))

        const adsUpserts: Database['public']['Tables']['ml_ads_daily']['Insert'][] = (
          adsRes.results || []
        )
          .filter((r) => Boolean(r.date))
          .map((r) => ({
            seller_id: sellerId,
            date: r.date!,
            cost: Number(r.metrics?.cost ?? 0),
            clicks: Number(r.metrics?.clicks ?? 0),
            prints: Number(r.metrics?.prints ?? 0),
            direct_amount: Number(r.metrics?.direct_amount ?? 0),
            indirect_amount: Number(r.metrics?.indirect_amount ?? 0),
            total_amount: Number(r.metrics?.total_amount ?? 0),
            acos: r.metrics?.acos ?? null,
            roas: r.metrics?.roas ?? null,
            updated_at: new Date().toISOString(),
          }))

        if (adsUpserts.length) {
          await supabase.from('ml_ads_daily').upsert(adsUpserts, { onConflict: 'seller_id,date' })
          adsDaysSynced = adsUpserts.length
        }
      }
    } catch {
      adsSupported = false
    }

    // 5. Alimenta revenue_monthly e revenue_daily com channel = 'mercadolivre'
    await syncRevenueChannelMercadoLivre(supabase, sellerId)

    const nowIso = new Date().toISOString()
    await supabase
      .from('ml_connections')
      .update({
        nickname: profile.nickname || connection.nickname,
        site_id: profile.site_id || connection.site_id,
        reputation_level_id: profile.seller_reputation?.level_id ?? null,
        power_seller_status: profile.seller_reputation?.power_seller_status ?? null,
        reputation_metrics: reputationMetrics as unknown as Json,
        last_synced_at: nowIso,
        last_sync_status: 'ok',
        last_sync_error: null,
        updated_at: nowIso,
      })
      .eq('id', connection.id)

    return {
      ordersSynced: orderUpserts.length,
      itemsSynced: itemUpserts.length,
      adsDaysSynced,
      adsSupported,
      lastSyncedAt: nowIso,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido na sincronização ML'
    await supabase
      .from('ml_connections')
      .update({
        last_sync_status: 'error',
        last_sync_error: message,
        updated_at: new Date().toISOString(),
      })
      .eq('id', connection.id)

    throw err
  }
}
