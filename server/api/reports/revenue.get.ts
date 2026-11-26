import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '~~/shared/types/database.types'
import type { RevenueStore } from '~~/shared/types/revenue'
import { sortMonthKeysChronologically } from '~~/shared/utils/revenue'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Autenticação necessária para consultar relatórios de faturamento.',
    })
  }

  const query = getQuery(event)
  const channel =
    String(query.channel || 'site')
      .trim()
      .toLowerCase() || 'site'
  const supabase = await serverSupabaseClient<Database>(event)

  const [monthlyRes, dailyRes, importRes] = await Promise.all([
    supabase
      .from('revenue_monthly')
      .select('year, month, revenue')
      .eq('channel', channel)
      .order('year', { ascending: true })
      .order('month', { ascending: true }),
    supabase
      .from('revenue_daily')
      .select('year, month, day, cumulative_revenue, projected_cumulative')
      .eq('channel', channel)
      .order('year', { ascending: true })
      .order('month', { ascending: true })
      .order('day', { ascending: true }),
    supabase
      .from('revenue_imports')
      .select('source_files, note, reconciled, reconcile_diff_count, imported_at')
      .eq('channel', channel)
      .order('imported_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (monthlyRes.error) {
    throw createError({
      statusCode: 500,
      message: 'Erro ao carregar faturamento mensal: ' + monthlyRes.error.message,
    })
  }

  if (dailyRes.error) {
    throw createError({
      statusCode: 500,
      message: 'Erro ao carregar faturamento diário: ' + dailyRes.error.message,
    })
  }

  const yearly: Record<string, (number | null)[]> = {}
  const yearSet = new Set<string>()

  for (const row of monthlyRes.data || []) {
    const yStr = String(row.year)
    yearSet.add(yStr)
    if (!yearly[yStr]) {
      yearly[yStr] = Array(12).fill(null)
    }
    yearly[yStr]![row.month - 1] = Number(row.revenue)
  }

  const rawCum: Record<string, (number | null)[]> = {}
  const projByMonth: Record<string, (number | null)[]> = {}
  const monthKeys = new Set<string>()

  for (const row of dailyRes.data || []) {
    const mKey = `${String(row.month).padStart(2, '0')}/${row.year}`
    monthKeys.add(mKey)
    if (!rawCum[mKey]) rawCum[mKey] = Array(31).fill(null)
    if (row.cumulative_revenue !== null) {
      rawCum[mKey]![row.day - 1] = Number(row.cumulative_revenue)
    }
    if (row.projected_cumulative !== null) {
      if (!projByMonth[mKey]) projByMonth[mKey] = Array(31).fill(null)
      projByMonth[mKey]![row.day - 1] = Number(row.projected_cumulative)
    }
  }

  const monthOrder = sortMonthKeysChronologically(Array.from(monthKeys))
  const projKeys = sortMonthKeysChronologically(Object.keys(projByMonth))
  const projMonthKey = projKeys.length ? projKeys[projKeys.length - 1]! : null
  const rawProj = projMonthKey ? projByMonth[projMonthKey]! : Array(31).fill(null)

  const latestImport = importRes.data
  const updatedAtStr = latestImport?.imported_at
    ? new Date(latestImport.imported_at).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Base inicial'

  const store: RevenueStore = {
    channel: channel === 'site' ? 'Site' : channel,
    years: Array.from(yearSet).sort(),
    yearly,
    monthOrder,
    rawCum,
    rawProj,
    projMonthKey,
    meta: {
      isCustom: Boolean(latestImport),
      updatedAt: updatedAtStr,
      files: latestImport?.source_files ?? [],
      reconciled: latestImport?.reconciled ?? true,
      reconcileDiffCount: latestImport?.reconcile_diff_count ?? 0,
      note: latestImport?.note ?? 'Dados carregados do Supabase.',
    },
  }

  return store
})
