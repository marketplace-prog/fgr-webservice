import { describe, expect, it } from 'bun:test'
import type { RevenueStore } from '../types/revenue'
import {
  buildRevenueDashboardData,
  detectAndParseRevenueCsv,
  getRevenueModeModel,
  mergeParsedCsvIntoStore,
  parseBrNumber,
} from './revenue'

function makeSampleStore(): RevenueStore {
  return {
    channel: 'Site',
    years: ['2025', '2026'],
    yearly: {
      '2025': [10000, 12000, 14000, 15000, 16000, 17000, 18000, 19000, 20000, 21000, 22000, 25000],
      '2026': [15000, 9000, null, null, null, null, null, null, null, null, null, null],
    },
    monthOrder: ['02/2025', '01/2026', '02/2026'],
    rawCum: {
      '02/2025': [1000, 2500, 4000, 5000, ...Array(27).fill(12000)],
      '01/2026': [500, 1500, 3000, ...Array(28).fill(15000)],
      '02/2026': [1200, 3200, 6000, 9000, ...Array(27).fill(null)],
    },
    rawProj: [null, null, null, 9000, 11000, ...Array(22).fill(19000), 20000, null, null, null],
    projMonthKey: '02/2026',
    meta: {
      isCustom: false,
      updatedAt: '04/02/2026',
      files: [],
      reconciled: true,
      reconcileDiffCount: 0,
      note: 'Base teste',
    },
  }
}

describe('parseBrNumber', () => {
  it('converts Brazilian currency strings to numbers', () => {
    expect(parseBrNumber('R$ 12.345,67')).toBe(12345.67)
    expect(parseBrNumber('1234,5')).toBe(1234.5)
    expect(parseBrNumber('-')).toBeNull()
    expect(parseBrNumber('')).toBeNull()
  })
})

describe('detectAndParseRevenueCsv', () => {
  it('parses annual CSV format (Mês;2025;2026)', () => {
    const csv = [
      'Canal de Vendas: Site',
      'Mês;2025;2026',
      'Jan;10.000,00;15.000,00',
      'Fev;12.000,00;18.000,00',
    ].join('\n')

    const parsed = detectAndParseRevenueCsv(csv, 'faturamento-por-ano.csv')
    expect(parsed.type).toBe('ano')
    if (parsed.type === 'ano') {
      expect(parsed.channel).toBe('Site')
      expect(parsed.years).toEqual(['2025', '2026'])
      expect(parsed.yearly['2025']![0]).toBe(10000)
      expect(parsed.yearly['2026']![1]).toBe(18000)
    }
  })

  it('parses daily CSV format (Dia;01/2026;02/2026;Projeção)', () => {
    const csv = [
      'Dia;01/2026;02/2026;Projeção',
      '1;500,00;1.200,00;-',
      '2;1.500,00;3.200,00;15.000,00',
    ].join('\n')

    const parsed = detectAndParseRevenueCsv(csv, 'faturamento-por-mes.csv')
    expect(parsed.type).toBe('mes')
    if (parsed.type === 'mes') {
      expect(parsed.monthOrder).toEqual(['01/2026', '02/2026'])
      expect(parsed.rawCum['02/2026']![1]).toBe(3200)
      expect(parsed.rawProj[1]).toBe(15000)
      expect(parsed.latestMonthInCsv).toBe('02/2026')
    }
  })
})

describe('buildRevenueDashboardData and getRevenueModeModel', () => {
  it('computes partial active month, day parity and projected modes', () => {
    const store = makeSampleStore()
    const data = buildRevenueDashboardData(store)

    expect(data.currYear).toBe('2026')
    expect(data.activeMonth.key).toBe('02/2026')
    expect(data.activeMonth.currentDay).toBe(4)
    expect(data.activeMonth.isPartial).toBe(true)
    expect(data.activeMonth.actualCurrent).toBe(9000)
    expect(data.activeMonth.projectedEnd).toBe(20000)

    const closedModel = getRevenueModeModel(data, 'closed')
    expect(closedModel.statsCurr.sum).toBe(15000)

    const parityModel = getRevenueModeModel(data, 'dayParity')
    expect(parityModel.rows[1]?.vCurr).toBe(9000)
    expect(parityModel.rows[1]?.refPrevYr).toBe(5000)

    const projectedModel = getRevenueModeModel(data, 'projected')
    expect(projectedModel.rows[1]?.vCurr).toBe(20000)
  })

  it('merges parsed daily CSV into store and syncs yearly total', () => {
    const store = makeSampleStore()
    const parsed = detectAndParseRevenueCsv(
      ['Dia;02/2026;Projeção', '1;1200,00;-', '5;11500,00;22000,00'].join('\n'),
      'faturamento-por-mes.csv',
    )
    const merged = mergeParsedCsvIntoStore(store, [parsed])
    expect(merged.nextStore.yearly['2026']![1]).toBe(11500)
    expect(merged.nextStore.meta.isCustom).toBe(true)
  })
})
