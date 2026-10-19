import { describe, expect, it } from 'bun:test'
import { createMonitoredInventorySchema } from '../schemas/inventory-monitoring.schema'
import { parseMinQuantityInput } from './inventory-monitoring'

describe('parseMinQuantityInput', () => {
  it('converts entered string quantities to numbers', () => {
    expect(parseMinQuantityInput('12')).toBe(12)
  })

  it('preserves zero as a valid quantity', () => {
    expect(parseMinQuantityInput(0)).toBe(0)
  })

  it('leaves an empty field unset for validation', () => {
    expect(parseMinQuantityInput('')).toBeUndefined()
  })

  it('preserves the selected quantity through form validation', () => {
    const monitor = createMonitoredInventorySchema.parse({
      sku: 'SKU-1',
      name: 'Produto',
      sku_type: 'variation',
      min_quantity: parseMinQuantityInput('12'),
      is_active: true,
    })

    expect(monitor.min_quantity).toBe(12)
  })
})
