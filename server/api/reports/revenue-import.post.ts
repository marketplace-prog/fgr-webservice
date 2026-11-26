import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { revenueImportSchema } from '~~/shared/schemas/revenue.schema'
import type { Database } from '~~/shared/types/database.types'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Autenticação necessária para importar dados de faturamento.',
    })
  }

  const rawBody = await readBody(event)
  const parsed = revenueImportSchema.safeParse(rawBody)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      message: parsed.error.issues[0]?.message || 'Payload de importação inválido.',
    })
  }

  const {
    channel,
    yearly,
    daily,
    projMonthKey,
    rawProj,
    sourceFiles,
    note,
    reconciled,
    reconcileDiffCount,
  } = parsed.data
  const normalizedChannel = channel.toLowerCase()
  const supabase = await serverSupabaseClient<Database>(event)
  const nowIso = new Date().toISOString()

  if (yearly) {
    const monthlyRows: Database['public']['Tables']['revenue_monthly']['Insert'][] = []
    for (const [yearStr, months] of Object.entries(yearly)) {
      const year = Number(yearStr)
      months.forEach((rev, idx) => {
        if (rev !== null && rev !== undefined) {
          monthlyRows.push({
            channel: normalizedChannel,
            year,
            month: idx + 1,
            revenue: rev,
            updated_at: nowIso,
            updated_by: user.id,
          })
        }
      })
    }

    if (monthlyRows.length > 0) {
      const { error } = await supabase
        .from('revenue_monthly')
        .upsert(monthlyRows, { onConflict: 'channel,year,month' })
      if (error) {
        throw createError({
          statusCode: 500,
          message: 'Erro ao salvar faturamento mensal: ' + error.message,
        })
      }
    }
  }

  if (daily) {
    const dailyRows: Database['public']['Tables']['revenue_daily']['Insert'][] = []
    for (const [mKey, days] of Object.entries(daily)) {
      const [mmStr, yyyyStr] = mKey.split('/')
      const month = Number(mmStr)
      const year = Number(yyyyStr)
      const isProjMonth = projMonthKey === mKey

      days.forEach((cum, idx) => {
        const proj = isProjMonth && rawProj ? (rawProj[idx] ?? null) : null
        if (cum !== null || proj !== null) {
          dailyRows.push({
            channel: normalizedChannel,
            year,
            month,
            day: idx + 1,
            cumulative_revenue: cum,
            projected_cumulative: proj,
            updated_at: nowIso,
            updated_by: user.id,
          })
        }
      })
    }

    if (dailyRows.length > 0) {
      const { error } = await supabase
        .from('revenue_daily')
        .upsert(dailyRows, { onConflict: 'channel,year,month,day' })
      if (error) {
        throw createError({
          statusCode: 500,
          message: 'Erro ao salvar faturamento diário: ' + error.message,
        })
      }
    }
  }

  const { error: importErr } = await supabase.from('revenue_imports').insert({
    channel: normalizedChannel,
    source_files: sourceFiles,
    note,
    reconciled,
    reconcile_diff_count: reconcileDiffCount,
    imported_at: nowIso,
    imported_by: user.id,
  })

  if (importErr) {
    throw createError({
      statusCode: 500,
      message: 'Erro ao registrar histórico de importação: ' + importErr.message,
    })
  }

  return { success: true }
})
