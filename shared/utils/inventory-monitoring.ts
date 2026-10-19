export function parseMinQuantityInput(value: string | number): number | undefined {
  if (value === '') return undefined

  const quantity = Number(value)
  return Number.isFinite(quantity) ? quantity : undefined
}
