import { describe, expect, test } from 'bun:test'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  createPaginatedRowModel,
  rowPaginationFeature,
  tableFeatures,
  useTable,
} from '@tanstack/vue-table'
import { ensureValidMlAccessToken } from '../server/utils/mercadolivre-api'
import type { Database } from '../shared/types/database.types'
import {
  aggregateMlDashboard,
  classifyLogisticType,
  formatLogisticLabel,
  getMlCurrentPageNumber,
  getNextMlOrderOffset,
  getReputationLabel,
  resolveMlDateRange,
} from '../shared/utils/mercadolivre'
import type { MlAdsDailyRecord, MlItemRecord, MlOrderRecord } from '../shared/types/mercadolivre'

describe('Mercado Livre utils', () => {
  test('classifyLogisticType maps ML logistic types accurately', () => {
    expect(classifyLogisticType('fulfillment')).toBe('full')
    expect(classifyLogisticType('self_service')).toBe('flex')
    expect(classifyLogisticType('xd_drop_off')).toBe('agencies')
    expect(classifyLogisticType('drop_off')).toBe('agencies')
    expect(classifyLogisticType('cross_docking')).toBe('agencies')
    expect(classifyLogisticType(null)).toBe('other')
    expect(formatLogisticLabel('fulfillment')).toBe('Full (Fulfillment)')
  })

  test('getReputationLabel formats level and medal', () => {
    expect(getReputationLabel('5_green', 'platinum')).toEqual({
      label: 'MercadoLíder Platinum',
      tone: 'green',
    })
    expect(getReputationLabel('3_yellow', null)).toEqual({
      label: 'Amarelo (Atenção)',
      tone: 'yellow',
    })
    expect(getReputationLabel(null, null)).toEqual({
      label: 'Sem reputação',
      tone: 'neutral',
    })
  })

  test('resolveMlDateRange calculates 7d and month ranges deterministically', () => {
    const ref = new Date('2026-11-27T12:00:00.000Z')
    expect(resolveMlDateRange('7d', undefined, undefined, ref)).toEqual({
      dateFrom: '2026-11-21',
      dateTo: '2026-11-27',
    })
    expect(resolveMlDateRange('month', undefined, undefined, ref)).toEqual({
      dateFrom: '2026-11-01',
      dateTo: '2026-11-27',
    })
    expect(resolveMlDateRange('custom', '2026-11-10', '2026-11-01', ref)).toEqual({
      dateFrom: '2026-11-01',
      dateTo: '2026-11-10',
    })
  })

  test('getNextMlOrderOffset continues bounded batches until all matching orders are synced', () => {
    expect(getNextMlOrderOffset(0, 500, 620)).toBe(500)
    expect(getNextMlOrderOffset(500, 120, 620)).toBeNull()
    expect(getNextMlOrderOffset(500, 0, 620)).toBeNull()
  })

  test('reports an invalid expiration from the Mercado Livre token refresh response', async () => {
    const originalFetch = Object.getOwnPropertyDescriptor(globalThis, '$fetch')
    const originalRuntimeConfig = Object.getOwnPropertyDescriptor(globalThis, 'useRuntimeConfig')

    Object.defineProperty(globalThis, '$fetch', {
      configurable: true,
      value: async () => ({
        access_token: 'refreshed-access-token',
        refresh_token: 'refreshed-refresh-token',
        token_type: 'Bearer',
        expires_in: undefined,
      }),
    })
    Object.defineProperty(globalThis, 'useRuntimeConfig', {
      configurable: true,
      value: () => ({
        mercadolivre: {
          clientId: 'client-id',
          clientSecret: 'client-secret',
          redirectUri: 'https://example.com/callback',
        },
      }),
    })

    const supabase = {
      from: () => ({
        update: () => ({
          eq: async () => ({ error: null }),
        }),
      }),
    } as unknown as SupabaseClient<Database>

    const connection: Database['public']['Tables']['ml_connections']['Row'] = {
      id: 'connection-id',
      seller_id: 1,
      nickname: 'seller',
      site_id: 'MLB',
      access_token: 'expired-access-token',
      refresh_token: 'refresh-token',
      token_type: 'Bearer',
      scope: null,
      expires_at: '2000-01-01T00:00:00.000Z',
      reputation_level_id: null,
      power_seller_status: null,
      reputation_metrics: {},
      last_synced_at: null,
      last_sync_status: 'ok',
      last_sync_error: null,
      connected_by: null,
      created_at: '2000-01-01T00:00:00.000Z',
      updated_at: '2000-01-01T00:00:00.000Z',
    }

    try {
      await expect(ensureValidMlAccessToken(supabase, connection)).rejects.toThrow(
        'O Mercado Livre retornou um prazo de expiração inválido para o token.',
      )
    } finally {
      if (originalFetch) {
        Object.defineProperty(globalThis, '$fetch', originalFetch)
      } else {
        Reflect.deleteProperty(globalThis, '$fetch')
      }

      if (originalRuntimeConfig) {
        Object.defineProperty(globalThis, 'useRuntimeConfig', originalRuntimeConfig)
      } else {
        Reflect.deleteProperty(globalThis, 'useRuntimeConfig')
      }
    }
  })

  test('getMlCurrentPageNumber reads the visible page from the TanStack v9 pagination atom', () => {
    const features = tableFeatures({
      rowPaginationFeature,
      paginatedRowModel: createPaginatedRowModel(),
    })
    const table = useTable({
      features,
      columns: [],
      data: [],
      initialState: { pagination: { pageIndex: 2, pageSize: 10 } },
    })

    expect(getMlCurrentPageNumber(table.atoms.pagination)).toBe(3)
  })

  test('aggregateMlDashboard computes gross, net, deductions, logistics, products and ads', () => {
    const orders: MlOrderRecord[] = [
      {
        order_id: 1001,
        seller_id: 99,
        date_created: '2026-11-25T14:00:00.000Z',
        status: 'paid',
        total_amount: 200,
        paid_amount: 200,
        sale_fee: 32,
        shipping_cost: 18,
        net_amount: 150,
        logistic_type: 'fulfillment',
        shipping_status: 'delivered',
        items: [
          {
            item_id: 'MLB1',
            title: 'Rede de Futebol Society',
            sku: 'REDE-SOC-4MM',
            quantity: 2,
            unit_price: 100,
            sale_fee: 32,
          },
        ],
      },
      {
        order_id: 1002,
        seller_id: 99,
        date_created: '2026-11-26T10:00:00.000Z',
        status: 'cancelled',
        total_amount: 100,
        paid_amount: 0,
        sale_fee: 0,
        shipping_cost: 0,
        net_amount: 0,
        logistic_type: 'self_service',
        shipping_status: 'cancelled',
        items: [],
      },
    ]

    const items: MlItemRecord[] = [
      {
        item_id: 'MLB1',
        seller_id: 99,
        sku: 'REDE-SOC-4MM',
        title: 'Rede de Futebol Society',
        status: 'active',
        price: 100,
        available_quantity: 3,
        sold_quantity: 12,
        listing_type_id: 'gold_pro',
        logistic_type: 'fulfillment',
        permalink: 'https://produto.mercadolivre.com.br/MLB-1',
        thumbnail: null,
        health: 0.95,
      },
    ]

    const adsDaily: MlAdsDailyRecord[] = [
      {
        date: '2026-11-25',
        cost: 20,
        clicks: 40,
        prints: 1000,
        direct_amount: 100,
        indirect_amount: 0,
        total_amount: 100,
      },
    ]

    const result = aggregateMlDashboard({
      range: '7d',
      dateFrom: '2026-11-25',
      dateTo: '2026-11-26',
      orders,
      items,
      adsDaily,
    })

    expect(result.kpis.grossRevenue).toBe(200)
    expect(result.kpis.totalFees).toBe(32)
    expect(result.kpis.totalShippingCost).toBe(18)
    expect(result.kpis.adsCost).toBe(20)
    expect(result.kpis.netRevenue).toBe(130)
    expect(result.kpis.paidOrdersCount).toBe(1)
    expect(result.kpis.cancelledOrdersCount).toBe(1)
    expect(result.kpis.averageTicket).toBe(200)
    expect(result.kpis.hasAdsData).toBe(true)
    expect(result.kpis.adsRoas).toBe(5)
    expect(result.kpis.adsAcos).toBe(20)
    expect(result.logisticBreakdown).toHaveLength(1)
    expect(result.logisticBreakdown[0]?.category).toBe('full')
    expect(result.topProducts[0]?.unitsSold).toBe(2)
    expect(result.attentionItems).toHaveLength(1)
  })
})
