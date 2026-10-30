export function getEmbeddedWidgetScrollTop(frameTop: number, targetOffset: number): number {
  return Math.max(0, frameTop + targetOffset - 24)
}
