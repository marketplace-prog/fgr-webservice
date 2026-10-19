/**
 * @file server/utils/stock-service.ts
 * @description Serviços de verificação de estoque e envio de alertas no Discord para o FGR Sports.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { createMagazordApiUrl, createMagazordAuthorization } from '~~/server/utils/magazord-api'
import type { Database, StockMonitor } from '~~/shared/types/database.types'

/**
 * Consulta o estoque disponível para venda no Magazord.
 * Suporta consulta por variação (SKU filho) e produto pai.
 */
export async function fetchMagazordStock(
  sku: string,
  skuType: 'variation' | 'parent',
): Promise<number> {
  const config = useRuntimeConfig().magazord
  if (!config.apiUrl || !config.apiToken || !config.apiPassword) {
    throw createError({
      statusCode: 503,
      message: 'As credenciais da API Magazord não estão configuradas.',
    })
  }

  const url = createMagazordApiUrl(config.apiUrl, '/v1/listEstoque')
  const filter = skuType === 'parent' ? 'produtoPai' : 'produto'
  const headers = {
    Authorization: createMagazordAuthorization(config.apiToken, config.apiPassword),
  }

  const pageSize = 100
  let offset = 0
  let availableStock = 0

  while (true) {
    const response = await $fetch<{
      data?: Array<{ quantidadeDisponivelVenda?: number }>
    }>(url.toString(), {
      headers,
      query: {
        [filter]: sku,
        limit: pageSize,
        offset,
      },
    })

    if (!Array.isArray(response.data)) {
      throw createError({
        statusCode: 502,
        message: `A resposta da API Magazord não contém a lista de estoque do SKU ${sku}.`,
      })
    }

    for (const item of response.data) {
      if (typeof item.quantidadeDisponivelVenda !== 'number') {
        throw createError({
          statusCode: 502,
          message: `A resposta da API Magazord não contém a quantidade disponível do SKU ${sku}.`,
        })
      }
      availableStock += item.quantidadeDisponivelVenda
    }

    if (response.data.length < pageSize) break
    offset += pageSize
  }

  return availableStock
}

/**
 * Dispara notificação de estoque baixo para o Discord.
 */
export async function sendStockDiscordAlert(
  webhookUrl: string,
  monitor: {
    sku: string
    name: string
    sku_type: 'variation' | 'parent'
    current_stock: number
    min_quantity: number
  },
) {
  if (!webhookUrl) {
    console.warn(`[Alerta de Estoque] Webhook do Discord não configurado. SKU: ${monitor.sku}`)
    return
  }

  const tipoLabel =
    monitor.sku_type === 'parent' ? '🏷️ Produto Pai (Agrupado)' : '🔹 Variação (SKU Filho)'

  const payload = {
    username: 'Monitor de Estoque | FGR Sports',
    avatar_url: 'https://cdn-icons-png.flaticon.com/512/6853/6853339.png',
    embeds: [
      {
        title: '🚨 ESTOQUE BAIXO DETECTADO!',
        description: `O produto **${monitor.name}** está com estoque disponível no limite de reposição.`,
        color: 15548997,
        fields: [
          { name: '📦 Produto', value: truncate(monitor.name, 256), inline: false },
          { name: '🏷️ SKU', value: `\`${monitor.sku}\``, inline: true },
          { name: 'Tipo', value: tipoLabel, inline: true },
          {
            name: '📉 Estoque Disponível',
            value: `**${monitor.current_stock} un.**`,
            inline: true,
          },
          { name: '⚠️ Mínimo Configurado', value: `**${monitor.min_quantity} un.**`, inline: true },
        ],
        footer: {
          text: 'FGR Sports • Monitoramento Automático de Estoque',
        },
        timestamp: new Date().toISOString(),
      },
    ],
  }

  try {
    await $fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    })
  } catch (err: unknown) {
    console.error(
      `[Alerta de Estoque] Erro ao enviar webhook Discord para o SKU ${monitor.sku}:`,
      err,
    )
  }
}

/**
 * Processa a verificação de um único monitor e atualiza o Supabase.
 */
export async function processMonitorCheck(
  supabase: SupabaseClient<Database>,
  monitor: StockMonitor,
  webhookUrl: string,
): Promise<{ monitor: StockMonitor; alerted: boolean; stock: number }> {
  const currentStock = await fetchMagazordStock(monitor.sku, monitor.sku_type)
  const now = new Date().toISOString()
  const isLowStock = currentStock <= monitor.min_quantity
  let alerted = false

  // Se estiver abaixo ou no limite mínimo, despacha alerta
  if (isLowStock) {
    await sendStockDiscordAlert(webhookUrl, {
      sku: monitor.sku,
      name: monitor.name,
      sku_type: monitor.sku_type,
      current_stock: currentStock,
      min_quantity: monitor.min_quantity,
    })
    alerted = true
  }

  const updatePayload: Partial<StockMonitor> = {
    current_stock: currentStock,
    last_checked_at: now,
    updated_at: now,
  }

  if (alerted) {
    updatePayload.last_alerted_at = now
  }

  const { data: updated, error } = await supabase
    .from('stock_monitors')
    .update(updatePayload)
    .eq('id', monitor.id)
    .select()
    .single()

  if (error) {
    console.error(`[ProcessMonitor] Erro ao atualizar monitor ${monitor.id}:`, error)
  }

  return {
    monitor: updated || { ...monitor, ...updatePayload },
    alerted,
    stock: currentStock,
  }
}
