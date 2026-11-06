export function getPageRange(pageIndex: number, pageSize: number, totalRows: number) {
  if (totalRows <= 0 || pageSize <= 0) return { from: 0, to: 0 }

  const from = Math.min(pageIndex * pageSize + 1, totalRows)
  return { from, to: Math.min((pageIndex + 1) * pageSize, totalRows) }
}

export function getNextVisibleCount(visibleCount: number, totalRows: number, pageSize: number) {
  return Math.min(visibleCount + pageSize, totalRows)
}
