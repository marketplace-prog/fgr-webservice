/**
 * @file shared/schemas/product-monitoring.schema.ts
 * @description This file contains the Zod schemas for product monitoring, including the schema for creating a new monitored product and updating its settings.
 * @version 1.0.0
 * @author Alessandro Pinheiro
 * @license MIT
 */

import { z } from 'zod'

/**
 * @description Tipo inferido a partir do schema de criação de inventário monitorado.
 */
export const createMonitoredInventorySchema = z.object({
  sku: z
    .string('O SKU do produto é obrigatório.')
    .min(1, 'O SKU não pode estar vazio.')
    .trim(),
  name: z
    .string('O nome do produto é obrigatório.')
    .min(1, 'O nome do produto não pode estar vazio.')
    .trim(),
  min_stock_alert: z
    .number('O limite mínimo deve ser um número.')
    .int('O valor deve ser um número inteiro.')
    .min(0, 'O estoque mínimo não pode ser negativo.')
    .default(5),
  current_stock: z
    .number('O estoque atual deve ser um número.')
    .int('O valor deve ser um número inteiro.')
    .min(0)
    .optional()
    .default(0)
})

/**
 * @description Tipo inferido a partir do schema de atualização de inventário monitorado.
 */
export const updateMonitoredInventorySchema = createMonitoredInventorySchema
  .partial()
  .omit({ sku: true }) // Não permite alterar o SKU após o cadastro

/**
 * @description Tipo inferido a partir do schema de criação de inventário monitorado.
 */
export type CreateMonitoredInventoryInput = z.infer<typeof createMonitoredInventorySchema>
