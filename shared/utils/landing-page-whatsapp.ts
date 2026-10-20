import type { LandingPageLeadInput } from '../schemas/landing-page-lead.schema'

export function makeLandingLeadWhatsAppMessage(lead: LandingPageLeadInput): string {
  const color = lead.threadColor.charAt(0).toUpperCase() + lead.threadColor.slice(1)

  return [
    `Olá, me chamo *${lead.name}* e quero um orçamento de *redes para trave*!`,
    '',
    '*Medidas*',
    `- Comprimento: ${lead.lengthCm} cm`,
    `- Altura: ${lead.heightCm} cm`,
    '',
    '*Recuos*',
    `- Superior: ${lead.upperRecessCm} cm`,
    `- Inferior: ${lead.lowerRecessCm} cm`,
    '',
    '*Especificações*',
    `- Fio: ${lead.threadThicknessMm} mm`,
    `- Malha: ${lead.meshSizeCm} x ${lead.meshSizeCm} cm`,
    `- Cor: ${color}`,
    '',
    'Aguardo seu retorno. Obrigado(a)!',
  ].join('\n')
}
