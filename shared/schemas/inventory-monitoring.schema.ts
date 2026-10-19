/**
 * @file shared/schemas/inventory-monitoring.schema.ts
 * @description Zod schemas para monitoramento de estoque de produtos (SKUs).
 *
 * ATENÇÃO: Não use .default() neste schema.
 * O @vee-validate/zod 4.x não é compatível com .default() do Zod v4 (_def.defaultValue).
 * Os valores padrão devem ser declarados exclusivamente via `initialValues` no `useForm()`.
 */

import { z } from 'zod'

export const skuTypeEnum = z.enum(['variation', 'parent'])

export type SkuType = z.infer<typeof skuTypeEnum>

export const createMonitoredInventorySchema = z.object({
  sku: z.string().min(1, 'O SKU não pode estar vazio.').trim(),
  name: z.string().min(1, 'O nome do produto não pode estar vazio.').trim(),
  sku_type: skuTypeEnum,
  min_quantity: z.coerce
    .number()
    .int('O valor deve ser um número inteiro.')
    .min(0, 'O estoque mínimo não pode ser negativo.'),
  is_active: z.boolean(),
})

export const updateMonitoredInventorySchema = z.object({
  name: z.string().min(1).trim().optional(),
  min_quantity: z.coerce.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
  sku_type: skuTypeEnum.optional(),
})

export type CreateMonitoredInventoryInput = z.infer<typeof createMonitoredInventorySchema>
export type UpdateMonitoredInventoryInput = z.infer<typeof updateMonitoredInventorySchema>
