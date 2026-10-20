import { describe, expect, it } from 'bun:test'
import { formatBrazilianPhone } from './phone'

describe('formatBrazilianPhone', () => {
  it('formats local landline and mobile numbers', () => {
    expect(formatBrazilianPhone('4733332222')).toBe('(47) 3333-2222')
    expect(formatBrazilianPhone('47921554477')).toBe('(47) 92155-4477')
  })

  it('removes an optional Brazil country code and limits the input length', () => {
    expect(formatBrazilianPhone('+55 47 9215-4477')).toBe('(47) 9215-4477')
    expect(formatBrazilianPhone('47921554477123')).toBe('(47) 92155-4477')
  })
})
