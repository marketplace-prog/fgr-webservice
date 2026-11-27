export type MlDashboardRange = '7d' | '30d' | 'month' | '90d' | 'custom'

export type MlLogisticCategory = 'full' | 'flex' | 'agencies' | 'other'

export interface MlReputationMetrics {
  claimsRate?: number | null
  delayedRate?: number | null
  cancellationsRate?: number | null
  sales60d?: number | null
}

export interface MlConnectionSummary {
  connected: boolean
  sellerId: number | null
  nickname: string | null
  siteId: string | null
  reputationLevelId: string | null
  powerSellerStatus: string | null
  reputationMetrics: MlReputationMetrics
  lastSyncedAt: string | null
  lastSyncStatus: 'ok' | 'partial' | 'error' | null
  lastSyncError: string | null
  oauthConfigured: boolean
  redirectUri: string
}

export interface MlOrderItemSnapshot {
  item_id: string
  title: string
  sku: string | null
  quantity: number
  unit_price: number
  sale_fee: number
}

export interface MlOrderRecord {
  order_id: number
  seller_id: number
  date_created: string
  status: string
  total_amount: number
  paid_amount: number
  sale_fee: number
  shipping_cost: number
  net_amount: number
  logistic_type: string | null
  shipping_status: string | null
  items: MlOrderItemSnapshot[]
}

export interface MlItemRecord {
  item_id: string
  seller_id: number
  sku: string | null
  title: string
  status: string
  price: number
  available_quantity: number
  sold_quantity: number
  listing_type_id: string | null
  logistic_type: string | null
  permalink: string | null
  thumbnail: string | null
  health: number | null
}

export interface MlAdsDailyRecord {
  date: string
  cost: number
  clicks: number
  prints: number
  direct_amount: number
  indirect_amount: number
  total_amount: number
}

export interface MlDailyPoint {
  date: string
  label: string
  grossRevenue: number
  netRevenue: number
  saleFee: number
  shippingCost: number
  adsCost: number
  ordersCount: number
}

export interface MlLogisticSummary {
  category: MlLogisticCategory
  label: string
  ordersCount: number
  grossRevenue: number
  sharePct: number
}

export interface MlTopProductRow {
  itemId: string
  sku: string | null
  title: string
  unitsSold: number
  grossRevenue: number
  saleFee: number
  netRevenue: number
  availableQuantity: number | null
  status: string | null
  logisticType: string | null
  permalink: string | null
}

export interface MlDashboardKpis {
  grossRevenue: number
  netRevenue: number
  netMarginPct: number
  totalFees: number
  totalShippingCost: number
  totalDeductions: number
  deductionsPct: number
  paidOrdersCount: number
  cancelledOrdersCount: number
  averageTicket: number
  adsCost: number
  adsRevenue: number
  adsRoas: number | null
  adsAcos: number | null
  hasAdsData: boolean
}

export interface MlDashboardData {
  range: MlDashboardRange
  dateFrom: string
  dateTo: string
  kpis: MlDashboardKpis
  dailySeries: MlDailyPoint[]
  logisticBreakdown: MlLogisticSummary[]
  topProducts: MlTopProductRow[]
  attentionItems: MlItemRecord[]
}

export interface MlDashboardResponse {
  connection: MlConnectionSummary
  dashboard: MlDashboardData | null
}
