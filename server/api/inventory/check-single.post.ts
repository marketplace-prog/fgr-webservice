import { serverSupabaseClient } from '#supabase/server'
import type { StockMonitor } from '~~/shared/types/database.types'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ id?: string }>(event)

  if (!body?.id) {
    throw createError({
      statusCode: 400,
      message: 'O ID do produto monitorado é obrigatório.',
    })
  }

  const supabase = await serverSupabaseClient(event)
  const config = useRuntimeConfig()
  const discordWebhookUrl = config.discord?.estoque_baixo || ''

  const { data: monitor, error } = await supabase
    .from('stock_monitors')
    .select('*')
    .eq('id', body.id)
    .single<StockMonitor>()

  if (error || !monitor) {
    throw createError({
      statusCode: 404,
      message: 'Monitor de estoque não encontrado.',
    })
  }

  const result = await processMonitorCheck(supabase, monitor, discordWebhookUrl)

  return {
    success: true,
    ...result,
  }
})
