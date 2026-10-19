/**
 * @file shared/schemas/login.schema.ts
 * @description This file contains the schema for the login form.
 * @author Alessandro Pinheiro <
 */

import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email('Por favor, insira um email válido.'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
})
