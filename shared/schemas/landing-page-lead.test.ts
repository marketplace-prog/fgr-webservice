import { describe, expect, it } from 'bun:test'
import { landingPageLeadSchema } from './landing-page-lead.schema'

const validLead = {
  landingSlug: 'redes-de-futebol',
  name: 'Ana Souza',
  email: '',
  phone: '(47) 9215-4477',
  threadColor: 'preta',
  threadThicknessMm: 3,
  meshSizeCm: 10,
  lengthCm: 740,
  heightCm: 240,
  upperRecessCm: 80,
  lowerRecessCm: 200,
  consent: true,
}

describe('landingPageLeadSchema', () => {
  it('normalizes the phone number and accepts a valid lead', () => {
    const result = landingPageLeadSchema.safeParse(validLead)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.phone).toBe('4792154477')
      expect(result.data.email).toBeNull()
    }
  })

  it('requires at least one contact method', () => {
    const result = landingPageLeadSchema.safeParse({
      ...validLead,
      phone: '',
    })

    expect(result.success).toBe(false)
  })

  it('rejects invalid phone numbers and out-of-range options', () => {
    const invalidPhone = landingPageLeadSchema.safeParse({
      ...validLead,
      phone: '(47) 123',
    })
    const invalidThickness = landingPageLeadSchema.safeParse({
      ...validLead,
      threadThicknessMm: 5,
    })

    expect(invalidPhone.success).toBe(false)
    expect(invalidThickness.success).toBe(false)
  })

  it('requires explicit consent', () => {
    const result = landingPageLeadSchema.safeParse({
      ...validLead,
      consent: false,
    })

    expect(result.success).toBe(false)
  })

  it('accepts the 15 cm mesh option', () => {
    const result = landingPageLeadSchema.safeParse({
      ...validLead,
      meshSizeCm: 15,
    })

    expect(result.success).toBe(true)
  })
})
