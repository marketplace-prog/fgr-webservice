import { z } from 'zod'

const phoneSchema = z
  .string()
  .transform((value) => {
    const digits = value.replace(/\D/g, '')
    return digits.startsWith('55') && (digits.length === 12 || digits.length === 13)
      ? digits.slice(2)
      : digits
  })
  .refine((value) => value.length === 0 || /^\d{10,11}$/.test(value), {
    message: 'Informe um telefone brasileiro com DDD.',
  })
  .transform((value) => value || null)

const emailSchema = z
  .string()
  .trim()
  .max(254, 'O e-mail deve ter no máximo 254 caracteres.')
  .refine((value) => value.length === 0 || z.email().safeParse(value).success, {
    message: 'Informe um e-mail válido.',
  })
  .transform((value) => value || null)

const measurementSchema = z.coerce
  .number()
  .finite('Informe uma medida válida.')
  .positive('A medida deve ser maior que zero.')
  .max(100000, 'A medida deve ser menor que 100.000 cm.')

const trackingValueSchema = z.string().trim().max(200).optional().default('')

export const landingPageLeadSchema = z
  .object({
    landingSlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug inválido.'),
    name: z.string().trim().min(2, 'Informe seu nome.').max(120),
    email: emailSchema,
    phone: phoneSchema,
    threadColor: z.enum(['preta', 'branca', 'azul', 'verde']),
    threadThicknessMm: z.union([z.literal(3), z.literal(4), z.literal(6)]),
    meshSizeCm: z.union([
      z.literal(10),
      z.literal(12),
      z.literal(13),
      z.literal(15),
      z.literal(16),
    ]),
    lengthCm: measurementSchema,
    heightCm: measurementSchema,
    upperRecessCm: measurementSchema,
    lowerRecessCm: measurementSchema,
    consent: z.literal(true, {
      error: 'É necessário autorizar o contato para solicitar o orçamento.',
    }),
    website: z.string().max(0, 'Solicitação inválida.').optional().default(''),
    utmSource: trackingValueSchema,
    utmMedium: trackingValueSchema,
    utmCampaign: trackingValueSchema,
    utmTerm: trackingValueSchema,
    utmContent: trackingValueSchema,
    referrer: z.string().trim().max(2048).optional().default(''),
  })
  .superRefine((lead, context) => {
    if (!lead.email && !lead.phone) {
      context.addIssue({
        code: 'custom',
        message: 'Informe um e-mail ou telefone para recebermos seu contato.',
        path: ['email'],
      })
    }
  })

export type LandingPageLeadInput = z.infer<typeof landingPageLeadSchema>
