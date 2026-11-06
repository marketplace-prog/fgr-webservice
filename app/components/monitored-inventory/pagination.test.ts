import { describe, expect, it } from 'bun:test'
import { getNextVisibleCount, getPageRange } from './pagination'

describe('monitored inventory pagination', () => {
  it('calculates the visible range for a page', () => {
    expect(getPageRange(1, 25, 60)).toEqual({ from: 26, to: 50 })
  })

  it('limits the last page range to the total row count', () => {
    expect(getPageRange(2, 25, 60)).toEqual({ from: 51, to: 60 })
  })

  it('returns an empty range when the list has no rows', () => {
    expect(getPageRange(0, 25, 0)).toEqual({ from: 0, to: 0 })
  })

  it('adds one page of rows while capping at the total', () => {
    expect(getNextVisibleCount(20, 45, 20)).toBe(40)
    expect(getNextVisibleCount(40, 45, 20)).toBe(45)
  })
})
