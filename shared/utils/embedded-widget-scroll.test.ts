import { describe, expect, it } from 'bun:test'
import { getEmbeddedWidgetScrollTop } from './embedded-widget-scroll'

describe('getEmbeddedWidgetScrollTop', () => {
  it('positions the target section near the top of the host viewport', () => {
    expect(getEmbeddedWidgetScrollTop(500, 1200)).toBe(1676)
  })

  it('does not scroll above the top of the host page', () => {
    expect(getEmbeddedWidgetScrollTop(10, 5)).toBe(0)
  })
})
