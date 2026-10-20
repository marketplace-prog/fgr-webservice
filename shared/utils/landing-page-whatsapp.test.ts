import { describe, expect, it } from 'bun:test'
import { makeLandingLeadWhatsAppMessage } from './landing-page-whatsapp'
import { landingPageLeadSchema } from '../schemas/landing-page-lead.schema'

const lead = landingPageLeadSchema.parse({
  landingSlug: 'redes-de-futebol',
  name: 'Ana Souza',
  email: '',
  phone: '(47) 9215-4477',
  threadColor: 'branca',
  threadThicknessMm: 6,
  meshSizeCm: 13,
  lengthCm: 111,
  heightCm: 222,
  upperRecessCm: 333,
  lowerRecessCm: 444,
  consent: true,
})

describe('makeLandingLeadWhatsAppMessage', () => {
  it('personalizes and formats the quote request without including the protocol', () => {
    const message = makeLandingLeadWhatsAppMessage(lead)

    expect(message).toContain('Olá, me chamo *Ana Souza* e quero um orçamento')
    expect(message).toContain('*Medidas*')
    expect(message).toContain('- Comprimento: 111 cm')
    expect(message).toContain('- Altura: 222 cm')
    expect(message).toContain('*Recuos*')
    expect(message).toContain('- Superior: 333 cm')
    expect(message).toContain('- Inferior: 444 cm')
    expect(message).toContain('- Fio: 6 mm')
    expect(message).toContain('- Malha: 13 x 13 cm')
    expect(message).toContain('- Cor: Branca')
    expect(message).not.toMatch(/\p{Extended_Pictographic}/u)
    expect(message).not.toContain('Protocolo')
  })
})
