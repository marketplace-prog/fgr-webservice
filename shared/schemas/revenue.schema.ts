import { z } from 'zod'

export const revenueImportSchema = z.object({
  channel: z.string().trim().min(1).max(50).default('site'),
  yearly: z
    .record(z.string().regex(/^\d{4}$/), z.array(z.number().nullable()).length(12))
    .optional(),
  daily: z
    .record(z.string().regex(/^\d{2}\/\d{4}$/), z.array(z.number().nullable()).length(31))
    .optional(),
  projMonthKey: z
    .string()
    .regex(/^\d{2}\/\d{4}$/)
    .nullable()
    .optional(),
  rawProj: z.array(z.number().nullable()).length(31).optional(),
  sourceFiles: z.array(z.string().trim().min(1)).default([]),
  note: z.string().trim().max(500).default(''),
  reconciled: z.boolean().default(true),
  reconcileDiffCount: z.number().int().min(0).default(0),
})

export type RevenueImportPayload = z.infer<typeof revenueImportSchema>
