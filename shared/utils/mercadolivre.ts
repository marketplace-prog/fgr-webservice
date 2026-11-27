import type {
  MlAdsDailyRecord,
  MlDailyPoint,
  MlDashboardData,
  MlDashboardRange,
  MlItemRecord,
  MlLogisticCategory,
  MlLogisticSummary,
  MlOrderRecord,
  MlTopProductRow,
} from '~~/shared/types/mercadolivre'

const LOGISTIC_LABELS: Record<MlLogisticCategory, string> = {
  full: 'Full (Fulfillment)',
  flex: 'Flex (Envio Próprio)',
  agencies: 'Agências / Correios',
  other: 'Outros',
}

export const ML_ORDER_SYNC_BATCH_SIZE = 50

export function normalizeMlSyncDaysBack(value: unknown): number | null {
  const daysBack = value === undefined || value === null ? 90 : Number(value)

  if (!Number.isFinite(daysBack)) return null

  return Math.min(Math.max(daysBack, 1), 180)
}

export function normalizeMlSyncDateFrom(value: unknown): string | undefined | null {
  if (value === undefined) return undefined
  if (typeof value !== 'string') return null

  const timestamp = Date.parse(value)
  if (!Number.isFinite(timestamp)) return null

  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return null

  return date.toISOString()
}

export function formatMlSyncStageError(stage: 'sync' | 'refresh', message: string): string {
  if (stage === 'refresh') {
    return `Sincronização concluída, mas falhou ao atualizar o dashboard: ${message}`
  }

  return `Falha na requisição de sincronização do Mercado Livre: ${message}`
}

export function formatMlLastSyncedAt(value: string | null | undefined): string | null {
  if (!value) return null

  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return null

  return date.toLocaleString('pt-BR')
}

export function classifyLogisticType(logisticType: string | null | undefined): MlLogisticCategory {
  if (!logisticType) return 'other'
  const normalized = logisticType.toLowerCase()
  if (normalized === 'fulfillment') return 'full'
  if (normalized === 'self_service') return 'flex'
  if (normalized === 'xd_drop_off' || normalized === 'drop_off' || normalized === 'cross_docking') {
    return 'agencies'
  }
  return 'other'
}

export function formatLogisticLabel(logisticType: string | null | undefined): string {
  return LOGISTIC_LABELS[classifyLogisticType(logisticType)]
}

function isValidIsoDate(value: string | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false

  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export function getReputationLabel(
  levelId: string | null | undefined,
  powerSellerStatus: string | null | undefined,
): { label: string; tone: 'green' | 'yellow' | 'orange' | 'red' | 'neutral' } {
  const medal =
    powerSellerStatus === 'platinum'
      ? 'MercadoLíder Platinum'
      : powerSellerStatus === 'gold'
        ? 'MercadoLíder Gold'
        : powerSellerStatus === 'silver'
          ? 'MercadoLíder'
          : null

  if (!levelId) {
    return { label: medal ?? 'Sem reputação', tone: 'neutral' }
  }

  if (levelId.startsWith('5_')) return { label: medal ?? 'Verde (Excelente)', tone: 'green' }
  if (levelId.startsWith('4_')) return { label: medal ?? 'Verde Claro', tone: 'green' }
  if (levelId.startsWith('3_')) return { label: 'Amarelo (Atenção)', tone: 'yellow' }
  if (levelId.startsWith('2_')) return { label: 'Laranja (Alerta)', tone: 'orange' }
  if (levelId.startsWith('1_')) return { label: 'Vermelho (Crítico)', tone: 'red' }

  return { label: medal ?? levelId, tone: 'neutral' }
}

export function resolveMlDateRange(
  range: MlDashboardRange,
  customFrom?: string,
  customTo?: string,
  now: Date = new Date(),
): { dateFrom: string; dateTo: string } {
  const toIsoDate = (d: Date) => d.toISOString().slice(0, 10)

  if (range === 'custom' && isValidIsoDate(customFrom) && isValidIsoDate(customTo)) {
    return customFrom <= customTo
      ? { dateFrom: customFrom, dateTo: customTo }
      : { dateFrom: customTo, dateTo: customFrom }
  }

  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

  if (range === 'month') {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    return { dateFrom: toIsoDate(start), dateTo: toIsoDate(end) }
  }

  const daysBack = range === '7d' ? 6 : range === '90d' ? 89 : 29
  const start = new Date(end)
  start.setUTCDate(start.getUTCDate() - daysBack)
  return { dateFrom: toIsoDate(start), dateTo: toIsoDate(end) }
}

export function getNextMlOrderOffset(
  offset: number,
  syncedCount: number,
  total: number,
): number | null {
  if (syncedCount <= 0) return null

  const nextOffset = offset + syncedCount
  return nextOffset < total ? nextOffset : null
}

export function getMlCurrentPageNumber(pagination: { get: () => { pageIndex: number } }): number {
  return pagination.get().pageIndex + 1
}

function buildDateBuckets(dateFrom: string, dateTo: string): string[] {
  const dates: string[] = []
  const cursor = new Date(`${dateFrom}T00:00:00.000Z`)
  const end = new Date(`${dateTo}T00:00:00.000Z`)

  while (cursor <= end && dates.length < 366) {
    dates.push(cursor.toISOString().slice(0, 10))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  return dates
}

export function aggregateMlDashboard(params: {
  range: MlDashboardRange
  dateFrom: string
  dateTo: string
  orders: MlOrderRecord[]
  items: MlItemRecord[]
  adsDaily: MlAdsDailyRecord[]
}): MlDashboardData {
  const { range, dateFrom, dateTo, orders, items, adsDaily } = params

  const itemById = new Map<string, MlItemRecord>()
  for (const item of items) {
    itemById.set(item.item_id, item)
  }

  const dailyMap = new Map<string, MlDailyPoint>()
  for (const date of buildDateBuckets(dateFrom, dateTo)) {
    const [yyyy, mm, dd] = date.split('-')
    dailyMap.set(date, {
      date,
      label: `${dd}/${mm}${yyyy ? '' : ''}`,
      grossRevenue: 0,
      netRevenue: 0,
      saleFee: 0,
      shippingCost: 0,
      adsCost: 0,
      ordersCount: 0,
    })
  }

  const logisticAgg = new Map<MlLogisticCategory, { ordersCount: number; grossRevenue: number }>([
    ['full', { ordersCount: 0, grossRevenue: 0 }],
    ['flex', { ordersCount: 0, grossRevenue: 0 }],
    ['agencies', { ordersCount: 0, grossRevenue: 0 }],
    ['other', { ordersCount: 0, grossRevenue: 0 }],
  ])

  const productAgg = new Map<string, MlTopProductRow>()

  let grossRevenue = 0
  let netRevenue = 0
  let totalFees = 0
  let totalShippingCost = 0
  let paidOrdersCount = 0
  let cancelledOrdersCount = 0

  for (const order of orders) {
    if (order.status === 'cancelled') {
      cancelledOrdersCount++
      continue
    }

    if (order.status !== 'paid') {
      continue
    }

    paidOrdersCount++
    const gross = Number(order.total_amount) || 0
    const fee = Number(order.sale_fee) || 0
    const shipping = Number(order.shipping_cost) || 0
    const net = Number(order.net_amount) || Math.max(0, gross - fee - shipping)

    grossRevenue += gross
    totalFees += fee
    totalShippingCost += shipping
    netRevenue += net

    const dateKey = order.date_created.slice(0, 10)
    const point = dailyMap.get(dateKey)
    if (point) {
      point.grossRevenue += gross
      point.netRevenue += net
      point.saleFee += fee
      point.shippingCost += shipping
      point.ordersCount += 1
    }

    const category = classifyLogisticType(order.logistic_type)
    const logEntry = logisticAgg.get(category)!
    logEntry.ordersCount += 1
    logEntry.grossRevenue += gross

    const orderItems = Array.isArray(order.items) ? order.items : []
    for (const oi of orderItems) {
      const qty = Number(oi.quantity) || 0
      const itemGross = (Number(oi.unit_price) || 0) * qty
      const itemFee = Number(oi.sale_fee) || 0
      const catalog = itemById.get(oi.item_id)

      const existing = productAgg.get(oi.item_id)
      if (existing) {
        existing.unitsSold += qty
        existing.grossRevenue += itemGross
        existing.saleFee += itemFee
        existing.netRevenue += Math.max(0, itemGross - itemFee)
      } else {
        productAgg.set(oi.item_id, {
          itemId: oi.item_id,
          sku: oi.sku ?? catalog?.sku ?? null,
          title: oi.title || catalog?.title || oi.item_id,
          unitsSold: qty,
          grossRevenue: itemGross,
          saleFee: itemFee,
          netRevenue: Math.max(0, itemGross - itemFee),
          availableQuantity: catalog?.available_quantity ?? null,
          status: catalog?.status ?? null,
          logisticType: catalog?.logistic_type ?? order.logistic_type ?? null,
          permalink: catalog?.permalink ?? null,
        })
      }
    }
  }

  let adsCost = 0
  let adsRevenue = 0
  for (const ad of adsDaily) {
    const cost = Number(ad.cost) || 0
    const rev = Number(ad.total_amount) || 0
    adsCost += cost
    adsRevenue += rev
    const point = dailyMap.get(ad.date)
    if (point) {
      point.adsCost += cost
    }
  }

  const totalDeductions = totalFees + totalShippingCost + adsCost
  const netAfterAds = Math.max(0, netRevenue - adsCost)
  const netMarginPct = grossRevenue > 0 ? (netAfterAds / grossRevenue) * 100 : 0
  const deductionsPct = grossRevenue > 0 ? (totalDeductions / grossRevenue) * 100 : 0
  const averageTicket = paidOrdersCount > 0 ? grossRevenue / paidOrdersCount : 0
  const hasAdsData = adsDaily.length > 0
  const adsRoas = adsCost > 0 ? adsRevenue / adsCost : null
  const adsAcos = adsRevenue > 0 ? (adsCost / adsRevenue) * 100 : null

  const logisticBreakdown: MlLogisticSummary[] = Array.from(logisticAgg.entries())
    .map(([category, agg]) => ({
      category,
      label: LOGISTIC_LABELS[category],
      ordersCount: agg.ordersCount,
      grossRevenue: agg.grossRevenue,
      sharePct: paidOrdersCount > 0 ? (agg.ordersCount / paidOrdersCount) * 100 : 0,
    }))
    .filter((entry) => entry.ordersCount > 0)
    .sort((a, b) => b.ordersCount - a.ordersCount)

  const topProducts = Array.from(productAgg.values()).sort(
    (a, b) => b.grossRevenue - a.grossRevenue,
  )

  const attentionItems = items
    .filter(
      (item) =>
        (item.status === 'active' && item.available_quantity <= 5) || item.status === 'paused',
    )
    .sort((a, b) => a.available_quantity - b.available_quantity)

  return {
    range,
    dateFrom,
    dateTo,
    kpis: {
      grossRevenue,
      netRevenue: netAfterAds,
      netMarginPct,
      totalFees,
      totalShippingCost,
      totalDeductions,
      deductionsPct,
      paidOrdersCount,
      cancelledOrdersCount,
      averageTicket,
      adsCost,
      adsRevenue,
      adsRoas,
      adsAcos,
      hasAdsData,
    },
    dailySeries: Array.from(dailyMap.values()),
    logisticBreakdown,
    topProducts,
    attentionItems,
  }
}
