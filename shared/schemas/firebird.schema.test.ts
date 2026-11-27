import { describe, expect, test } from 'bun:test'
import { firebirdTableSchemas } from './firebird.schema'

describe('Firebird table schemas', () => {
  test('includes schemas for database tables', () => {
    expect(firebirdTableSchemas.PRODUTO).toBeDefined()
    expect(firebirdTableSchemas.NFSAIDA).toBeDefined()
  })

  test('validates required, nullable, numeric, and date columns', () => {
    const produto = firebirdTableSchemas.PRODUTO

    expect(produto.shape.CHAVE.safeParse(1).success).toBe(true)
    expect(produto.shape.CHAVE.safeParse(1.5).success).toBe(false)
    expect(produto.shape.CHAVE.safeParse(null).success).toBe(false)
    expect(produto.shape.CODIGO.safeParse(null).success).toBe(true)
    expect(produto.shape.CODIGO.safeParse(123).success).toBe(false)
    expect(produto.shape.PESOBRUTO.safeParse('1.250').success).toBe(true)
    expect(produto.shape.PESOBRUTO.safeParse(1.25).success).toBe(true)
    expect(produto.shape.DATAHORACAD.safeParse(new Date()).success).toBe(true)
    expect(produto.shape.DATAHORACAD.safeParse('2026-01-01').success).toBe(false)
  })
})
