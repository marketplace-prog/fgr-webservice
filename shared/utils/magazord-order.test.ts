import { describe, expect, it } from 'bun:test'
import { describeMagazordOrderOrigin, generateOrderInsights } from './magazord'

describe('describeMagazordOrderOrigin', () => {
  it('identifies manual orders clearly', () => {
    expect(describeMagazordOrderOrigin(3)).toEqual({
      title: 'Pedido manual',
      label: '📝 Manual',
      channel: 'Cadastrado manualmente no painel Magazord',
    })
  })

  it('identifies site orders and their store', () => {
    expect(describeMagazordOrderOrigin(1, null, 'FGR Sports').channel).toBe(
      'E-commerce: FGR Sports',
    )
  })

  it('includes marketplace details and handles unknown origins', () => {
    expect(describeMagazordOrderOrigin(2, 'Mercado Livre').channel).toBe(
      'Marketplace: Mercado Livre',
    )
    expect(describeMagazordOrderOrigin(8).label).toBe('❔ Origem não identificada (8)')
    expect(describeMagazordOrderOrigin(null).label).toBe('❔ Origem não identificada')
  })
})

describe('generateOrderInsights', () => {
  it('shows seller attribution for manually entered orders', () => {
    const insights = generateOrderInsights({ origem: 3, codigoVendedor: 'VEN-42' }, [], 0)

    expect(insights).toContain('Vendedor')
    expect(insights).toContain('VEN-42')
  })

  it('shows traffic source for site orders', () => {
    const insights = generateOrderInsights({ origem: 1, pedidoTrackingSource: 'instagram' }, [], 0)

    expect(insights).toContain('instagram')
  })

  it('does not imply margin health when no alert is triggered', () => {
    expect(generateOrderInsights({}, [], 0)).toContain(
      'não representa uma análise completa de margem',
    )
  })
})
