export type RevenueMode = 'closed' | 'dayParity' | 'projected'
export type RevenueTabId = 'overview' | 'yearly' | 'average' | 'variations' | 'daily'

export interface RevenueStoreMeta {
  isCustom: boolean
  updatedAt: string
  files: string[]
  reconciled: boolean
  reconcileDiffCount: number
  note: string
}

export interface RevenueStore {
  channel: string
  years: string[]
  yearly: Record<string, (number | null)[]>
  monthOrder: string[]
  rawCum: Record<string, (number | null)[]>
  rawProj: (number | null)[]
  projMonthKey: string | null
  meta: RevenueStoreMeta
}

export interface RevenueAnomaly {
  date: string
  mes: string
  dia: number
  delta: number
}

export interface WeekdayStats {
  weekday: number
  name: string
  days_count: number
  sum: number
  mean: number
  share_pct: number
}

export interface ActiveMonthSummary {
  idx: number
  short: string
  full: string
  key: string
  daysInMonth: number
  currentDay: number
  isPartial: boolean
  hasDailyForActive: boolean
  actualCurrent: number
  actualPrevDay: number
  projectedToday: number
  projectedEnd: number
  bdayAvgDisplay: number
  steppingDaysRemaining: number
  baseForSim: number
  defaultBdayRate: number
  prevMonthKey: string
  prevYearSameMonthKey: string | null
  prevMonthAtDay: number | null
  prevYearAtDay: number | null
  avgClosedAtDay: number | null
}

export interface RevenueDashboardData {
  channel: string
  referenceDate: string
  years: string[]
  currYear: string
  prevYear: string | null
  prev2Year: string | null
  yearly: Record<string, (number | null)[]>
  closedCountCurrYear: number
  activeMonth: ActiveMonthSummary
  daily: {
    monthOrder: string[]
    cumulative: Record<string, (number | null)[]>
    netDaily: Record<string, (number | null)[]>
    validMask: Record<string, boolean[]>
    projActive: (number | null)[]
    avgClosedCum: number[]
    avgClosedDaily: number[]
    avgRefLabel: string
  }
  weekdays: WeekdayStats[]
  anomalies: RevenueAnomaly[]
  audit: {
    artifactsCleaned: number
    meta: RevenueStoreMeta
  }
}

export interface RevenueStatsSummary {
  count: number
  sum: number
  mean: number
  median: number
  std: number
  min: number
  max: number
}

export interface RevenueModeRow {
  idx: number
  mShort: string
  mFull: string
  vPrev2: number | null
  vPrev: number | null
  vCurr: number | null
  rawCurr: number | null
  prevRef: number | null
  refPrevYr: number | null
  refPrev2Yr: number | null
  avgRef: number
  momPct: number | null
  momDiff: number | null
  yoyPrevPct: number | null
  yoyPrevDiff: number | null
  yoyPrev2Pct: number | null
  yoyPrev2Diff: number | null
  vsAvgPct: number | null
  vsAvgDiff: number | null
  isActive: boolean
  isFuture: boolean
  note: string
}

export interface RevenueModeModel {
  statsCurr: RevenueStatsSummary
  statsPrev: RevenueStatsSummary
  statsPrev2: RevenueStatsSummary
  compPrevSamePeriod: number
  compPrev2SamePeriod: number
  periodLabel: string
  rows: RevenueModeRow[]
}

export interface ParsedYearlyCsv {
  type: 'ano'
  filename: string
  channel: string | null
  years: string[]
  yearly: Record<string, (number | null)[]>
}

export interface ParsedDailyCsv {
  type: 'mes'
  filename: string
  channel: string | null
  monthOrder: string[]
  rawCum: Record<string, (number | null)[]>
  rawProj: (number | null)[]
  latestMonthInCsv: string
}

export type ParsedRevenueCsv = ParsedYearlyCsv | ParsedDailyCsv
