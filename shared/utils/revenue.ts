import type {
  ParsedRevenueCsv,
  RevenueAnomaly,
  RevenueDashboardData,
  RevenueMode,
  RevenueModeModel,
  RevenueStatsSummary,
  RevenueStore,
} from '../types/revenue'

export const MONTHS_SHORT = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
] as const

export const MONTHS_FULL = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const

export const WK_NAMES = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
] as const

export function fmtBRL(val: number | null | undefined): string {
  if (val === null || val === undefined || Number.isNaN(val)) return '—'
  const rounded = Math.round(val)
  return (rounded < 0 ? '-R$ ' : 'R$ ') + Math.abs(rounded).toLocaleString('pt-BR')
}

export function fmtSignedBRL(val: number | null | undefined): string {
  if (val === null || val === undefined || Number.isNaN(val)) return '—'
  const rounded = Math.round(val)
  const absStr = Math.abs(rounded).toLocaleString('pt-BR')
  if (rounded > 0) return '+R$ ' + absStr
  if (rounded < 0) return '-R$ ' + absStr
  return 'R$ 0'
}

export function fmtCompactBRL(val: number | null | undefined): string {
  if (val === null || val === undefined || Number.isNaN(val)) return ''
  const abs = Math.abs(val)
  if (abs >= 1000) return (val < 0 ? '-' : '') + (abs / 1000).toFixed(1).replace('.', ',') + 'k'
  return Math.round(val).toString()
}

export function fmtPct(val: number | null | undefined, signed = true): string {
  if (val === null || val === undefined || Number.isNaN(val)) return '—'
  const fixed = Math.abs(val).toFixed(1).replace('.', ',')
  if (!signed) return fixed + '%'
  if (val > 0.04) return '+' + fixed + '%'
  if (val < -0.04) return '-' + fixed + '%'
  return '0,0%'
}

export function safePct(
  num: number | null | undefined,
  den: number | null | undefined,
): number | null {
  if (
    num === null ||
    num === undefined ||
    den === null ||
    den === undefined ||
    Math.abs(den) < 0.01
  ) {
    return null
  }
  return (num / den - 1) * 100
}

export function calcRevenueStats(arr: (number | null | undefined)[]): RevenueStatsSummary {
  const clean = arr.filter((v): v is number => v !== null && v !== undefined)
  const n = clean.length
  const sum = clean.reduce((a, b) => a + b, 0)
  const mean = n ? sum / n : 0
  const sorted = [...clean].sort((a, b) => a - b)
  const median = n
    ? n % 2 === 1
      ? (sorted[(n - 1) / 2] ?? 0)
      : ((sorted[n / 2 - 1] ?? 0) + (sorted[n / 2] ?? 0)) / 2
    : 0
  const variance = n > 1 ? clean.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (n - 1) : 0
  return {
    count: n,
    sum,
    mean,
    median,
    std: Math.sqrt(variance),
    min: sorted[0] ?? 0,
    max: sorted[n - 1] ?? 0,
  }
}

export function parseBrNumber(str: unknown): number | null {
  if (str === null || str === undefined) return null
  let s = String(str).trim().replace(/R\$/gi, '').replace(/\s+/g, '')
  if (!s || s === '-' || s === '—') return null
  if (s.includes(',') && s.includes('.')) {
    s = s.replace(/\./g, '').replace(',', '.')
  } else if (s.includes(',')) {
    s = s.replace(',', '.')
  }
  const v = Number(s)
  return Number.isFinite(v) ? Math.round(v * 100) / 100 : null
}

function stripAccentsLower(s: string): string {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function sortMonthKeysChronologically(keys: string[]): string[] {
  return [...new Set(keys)].sort((a, b) => {
    const [ma = 0, ya = 0] = a.split('/').map(Number)
    const [mb = 0, yb = 0] = b.split('/').map(Number)
    return ya !== yb ? ya - yb : ma - mb
  })
}

export function getDaysInMonth(year: number | string, month1to12: number): number {
  return new Date(Number(year), Number(month1to12), 0).getDate()
}

export function detectAndParseRevenueCsv(
  text: string,
  filename = 'Texto colado',
): ParsedRevenueCsv {
  const cleanText = String(text || '').replace(/^\uFEFF/, '')
  const lines = cleanText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  if (lines.length < 2) {
    throw new Error(`O arquivo "${filename}" está vazio ou incompleto.`)
  }

  let channel: string | null = null
  for (const line of lines.slice(0, 5)) {
    if (stripAccentsLower(line).includes('canal de vendas:')) {
      const after = line.split(':')[1] || ''
      const val = (after.split(';')[0] ?? '').split(',')[0]?.trim() ?? ''
      if (val) channel = val
    }
  }

  for (let idx = 0; idx < Math.min(lines.length, 12); idx++) {
    const line = lines[idx] ?? ''
    for (const sep of [';', ',', '\t']) {
      const parts = line.split(sep).map((p) => p.trim().replace(/^"|"$/g, ''))
      if (parts.length < 2) continue
      const firstCol = stripAccentsLower(parts[0] ?? '')

      if (firstCol === 'mes') {
        const yearCols: { colIdx: number; year: string }[] = []
        parts.forEach((h, colIdx) => {
          if (colIdx > 0 && /^\d{4}$/.test(h)) yearCols.push({ colIdx, year: h })
        })
        if (!yearCols.length) continue

        const years = yearCols.map((y) => y.year).sort()
        const yearly: Record<string, (number | null)[]> = {}
        years.forEach((y) => {
          yearly[y] = Array(12).fill(null)
        })
        const mMap: Record<string, number> = {
          jan: 0,
          fev: 1,
          mar: 2,
          abr: 3,
          mai: 4,
          jun: 5,
          jul: 6,
          ago: 7,
          set: 8,
          out: 9,
          nov: 10,
          dez: 11,
        }

        for (let r = idx + 1; r < lines.length; r++) {
          const rowParts = (lines[r] ?? '').split(sep).map((p) => p.trim().replace(/^"|"$/g, ''))
          if (!rowParts[0]) continue
          const mk = stripAccentsLower(rowParts[0]).slice(0, 3)
          if (mk === 'tot') continue
          if (mk in mMap) {
            const mIdx = mMap[mk]!
            yearCols.forEach(({ colIdx, year }) => {
              if (colIdx < rowParts.length) {
                yearly[year]![mIdx] = parseBrNumber(rowParts[colIdx])
              }
            })
          }
        }
        return { type: 'ano', filename, channel, years, yearly }
      }

      if (firstCol === 'dia') {
        const monthCols: { colIdx: number; key: string }[] = []
        let projIdx: number | null = null
        parts.forEach((h, colIdx) => {
          if (colIdx === 0) return
          const hl = stripAccentsLower(h)
          if (hl.includes('proje')) {
            projIdx = colIdx
          } else if (/^\d{1,2}\/\d{4}$/.test(h)) {
            const [mm, yyyy] = h.split('/')
            const normKey = String(Number(mm)).padStart(2, '0') + '/' + yyyy
            monthCols.push({ colIdx, key: normKey })
          }
        })
        if (!monthCols.length) continue

        const rawCum: Record<string, (number | null)[]> = {}
        monthCols.forEach((m) => {
          rawCum[m.key] = Array(31).fill(null)
        })
        const rawProj: (number | null)[] = Array(31).fill(null)

        for (let r = idx + 1; r < lines.length; r++) {
          const rowParts = (lines[r] ?? '').split(sep).map((p) => p.trim().replace(/^"|"$/g, ''))
          if (!rowParts[0]) continue
          const dLabel = stripAccentsLower(rowParts[0])
          if (dLabel.startsWith('tot')) continue
          const dNum = Number(rowParts[0])
          if (Number.isInteger(dNum) && dNum >= 1 && dNum <= 31) {
            monthCols.forEach(({ colIdx, key }) => {
              if (colIdx < rowParts.length) {
                rawCum[key]![dNum - 1] = parseBrNumber(rowParts[colIdx])
              }
            })
            if (projIdx !== null && projIdx < rowParts.length) {
              rawProj[dNum - 1] = parseBrNumber(rowParts[projIdx])
            }
          }
        }
        return {
          type: 'mes',
          filename,
          channel,
          monthOrder: monthCols.map((m) => m.key),
          rawCum,
          rawProj,
          latestMonthInCsv: monthCols[monthCols.length - 1]!.key,
        }
      }
    }
  }

  throw new Error(
    `Formato não reconhecido em "${filename}". Envie os arquivos CSV com cabeçalho "Dia;..." ou "Mês;...".`,
  )
}

export function mergeParsedCsvIntoStore(
  currentStore: RevenueStore,
  parsedItems: ParsedRevenueCsv[],
): {
  nextStore: RevenueStore
  reconcileDiffCount: number
  reconcileMaxDiff: number
  importedYearly: Record<string, (number | null)[]>
  importedDaily: Record<string, (number | null)[]>
  projMonthKey: string | null
  rawProj: (number | null)[] | undefined
} {
  const nextStore: RevenueStore = JSON.parse(JSON.stringify(currentStore))
  const parsedAno = parsedItems.find((x) => x.type === 'ano')
  const parsedMes = parsedItems.find((x) => x.type === 'mes')

  const importedYearly: Record<string, (number | null)[]> = {}
  const importedDaily: Record<string, (number | null)[]> = {}

  if (parsedAno) {
    if (parsedAno.channel) nextStore.channel = parsedAno.channel
    parsedAno.years.forEach((y) => {
      if (!nextStore.years.includes(y)) nextStore.years.push(y)
      nextStore.yearly[y] = [...(parsedAno.yearly[y] ?? Array(12).fill(null))]
      importedYearly[y] = [...nextStore.yearly[y]!]
    })
    nextStore.years.sort()
  }

  let reconcileDiffCount = 0
  let reconcileMaxDiff = 0

  if (parsedMes) {
    if (parsedMes.channel) nextStore.channel = parsedMes.channel
    Object.keys(parsedMes.rawCum).forEach((k) => {
      nextStore.rawCum[k] = [...(parsedMes.rawCum[k] ?? Array(31).fill(null))]
      importedDaily[k] = [...nextStore.rawCum[k]!]
    })
    nextStore.monthOrder = sortMonthKeysChronologically([
      ...nextStore.monthOrder,
      ...parsedMes.monthOrder,
    ])
    nextStore.rawProj = [...parsedMes.rawProj]
    nextStore.projMonthKey = parsedMes.latestMonthInCsv

    parsedMes.monthOrder.forEach((mKey) => {
      const [mmStr = '01', yyyy = '2026'] = mKey.split('/')
      const mIdx = Number(mmStr) - 1
      const arr = parsedMes.rawCum[mKey] || []
      const nonNull = arr.filter((v): v is number => v !== null && v !== undefined)
      if (!nonNull.length) return
      const lastCum = nonNull[nonNull.length - 1]!

      if (!nextStore.years.includes(yyyy)) {
        nextStore.years.push(yyyy)
        nextStore.years.sort()
        nextStore.yearly[yyyy] = Array(12).fill(null)
      }

      if (parsedAno && parsedAno.yearly[yyyy] && parsedAno.yearly[yyyy]![mIdx] !== null) {
        const diff = Math.abs((parsedAno.yearly[yyyy]![mIdx] ?? 0) - lastCum)
        if (diff > 0.02) {
          reconcileDiffCount++
          reconcileMaxDiff = Math.max(reconcileMaxDiff, diff)
        }
      }
      nextStore.yearly[yyyy]![mIdx] = lastCum
      if (!importedYearly[yyyy]) {
        importedYearly[yyyy] = [...(nextStore.yearly[yyyy] ?? Array(12).fill(null))]
      }
      importedYearly[yyyy]![mIdx] = lastCum
    })
  }

  const nowStr = new Date().toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  let note = ''
  if (parsedAno && parsedMes) {
    note =
      reconcileDiffCount === 0
        ? `Conciliação 100% exata entre os 2 arquivos (${parsedMes.monthOrder.length} meses diários sincronizados).`
        : `${reconcileDiffCount} mês(es) com pequena diferença entre os CSVs (máx ${fmtBRL(reconcileMaxDiff)}) — prevaleceu o diário.`
  } else if (parsedMes) {
    note = `Atualizado via faturamento-por-mes.csv: ${parsedMes.monthOrder.length} meses sincronizados automaticamente na visão anual.`
  } else if (parsedAno) {
    note = `Atualizado via faturamento-por-ano.csv: anos ${parsedAno.years.join(', ')}.`
  }

  nextStore.meta = {
    isCustom: true,
    updatedAt: nowStr,
    files: parsedItems.map((i) => i.filename),
    reconciled: reconcileDiffCount === 0,
    reconcileDiffCount,
    note,
  }

  return {
    nextStore,
    reconcileDiffCount,
    reconcileMaxDiff,
    importedYearly,
    importedDaily,
    projMonthKey: nextStore.projMonthKey,
    rawProj: parsedMes ? nextStore.rawProj : undefined,
  }
}

export function buildRevenueDashboardData(store: RevenueStore): RevenueDashboardData {
  const years = [...store.years].sort()
  const currYear = years[years.length - 1] ?? String(new Date().getFullYear())
  const prevYear = years.length >= 2 ? years[years.length - 2]! : null
  const prev2Year = years.length >= 3 ? years[years.length - 3]! : null

  const currArr = store.yearly[currYear] || Array(12).fill(null)
  let activeMonthIdx = 0
  currArr.forEach((v, idx) => {
    if (v !== null && v !== undefined) activeMonthIdx = idx
  })

  const activeMonthKey = String(activeMonthIdx + 1).padStart(2, '0') + '/' + currYear
  const daysInActive = getDaysInMonth(currYear, activeMonthIdx + 1)

  const cumulative: Record<string, (number | null)[]> = {}
  const netDaily: Record<string, (number | null)[]> = {}
  const validMask: Record<string, boolean[]> = {}
  const wkBuckets = Array.from({ length: 7 }, (_, i) => ({
    weekday: i,
    name: WK_NAMES[i]!,
    days_count: 0,
    sum: 0,
  }))
  const anomalies: RevenueAnomaly[] = []
  let artifactsCleaned = 0

  store.monthOrder.forEach((mKey) => {
    const [mmStr = '01', yyyyStr = '2026'] = mKey.split('/')
    const mNum = Number(mmStr)
    const yNum = Number(yyyyStr)
    const maxD = getDaysInMonth(yNum, mNum)
    const src = store.rawCum[mKey] || Array(31).fill(null)

    const cArr: (number | null)[] = []
    const nArr: (number | null)[] = []
    const vArr: boolean[] = []
    let prev = 0

    for (let d = 1; d <= 31; d++) {
      const isValid = d <= maxD
      vArr.push(isValid)
      const rawV = src[d - 1]
      if (rawV === null || rawV === undefined) {
        cArr.push(null)
        nArr.push(null)
      } else {
        cArr.push(rawV)
        if (!isValid) {
          nArr.push(null)
        } else {
          const delta = Math.round((rawV - prev) * 100) / 100
          prev = rawV
          nArr.push(delta)

          const jsDay = new Date(yNum, mNum - 1, d).getDay()
          const wkIdx = jsDay === 0 ? 6 : jsDay - 1
          wkBuckets[wkIdx]!.days_count += 1
          wkBuckets[wkIdx]!.sum += delta

          if (delta < -0.01) {
            anomalies.push({
              date: `${String(d).padStart(2, '0')}/${mmStr}/${yyyyStr}`,
              mes: mKey,
              dia: d,
              delta,
            })
          }
        }
      }
    }
    cumulative[mKey] = cArr
    netDaily[mKey] = nArr
    validMask[mKey] = vArr
  })

  anomalies.sort((a, b) => a.delta - b.delta)

  const totalNetAll = wkBuckets.reduce((acc, w) => acc + w.sum, 0) || 1
  const weekdays = wkBuckets.map((w) => ({
    ...w,
    sum: Math.round(w.sum * 100) / 100,
    mean: w.days_count ? Math.round((w.sum / w.days_count) * 100) / 100 : 0,
    share_pct: (w.sum / totalNetAll) * 100,
  }))

  const activeCumArr = cumulative[activeMonthKey] || null
  let currentDay = daysInActive
  let actualCurrent = currArr[activeMonthIdx] ?? 0
  let actualPrevDay = actualCurrent
  let hasDailyForActive = false

  if (activeCumArr) {
    let lastD = 1
    for (let d = 1; d <= daysInActive; d++) {
      if (activeCumArr[d - 1] !== null && activeCumArr[d - 1] !== undefined) {
        lastD = d
      }
    }
    currentDay = lastD
    const lastDailyVal = activeCumArr[currentDay - 1] ?? 0
    if (Math.abs((currArr[activeMonthIdx] ?? 0) - lastDailyVal) < 0.05) {
      hasDailyForActive = true
      actualCurrent = lastDailyVal
      actualPrevDay = currentDay > 1 ? (activeCumArr[currentDay - 2] ?? 0) : 0
    } else {
      actualCurrent = currArr[activeMonthIdx] ?? lastDailyVal
      actualPrevDay = lastDailyVal
    }
  }

  const isPartial = currentDay < daysInActive

  const projClean: (number | null)[] = Array(31).fill(null)
  let projectedEnd = actualCurrent
  let projectedToday = actualCurrent
  let steppingDaysRemaining = 0
  let baseForSim = actualPrevDay
  let defaultBdayRate = 0

  if (store.projMonthKey === activeMonthKey && Array.isArray(store.rawProj)) {
    for (let d = 1; d <= 31; d++) {
      const pv = store.rawProj[d - 1]
      if (pv !== null && pv !== undefined) {
        if (d < currentDay || d > daysInActive) {
          artifactsCleaned++
        } else {
          projClean[d - 1] = pv
        }
      }
    }
  }

  const validProjVals = projClean.filter((v): v is number => v !== null)
  if (isPartial && validProjVals.length > 0) {
    projectedEnd = validProjVals[validProjVals.length - 1]!
    projectedToday = projClean[currentDay - 1] ?? actualCurrent
    if (currentDay > 1 && projClean[currentDay - 1] !== null && activeCumArr) {
      projClean[currentDay - 2] = activeCumArr[currentDay - 2] ?? null
    } else if (projClean[currentDay - 1] === null && activeCumArr) {
      projClean[currentDay - 1] = actualCurrent
    }

    let prevP = currentDay > 1 ? actualPrevDay : 0
    let steps = 0
    for (let d = currentDay; d <= daysInActive; d++) {
      const pv = projClean[d - 1]
      if (pv !== null && pv !== undefined && pv - prevP > 0.5) {
        steps++
        prevP = pv
      }
    }
    steppingDaysRemaining = steps || 1
    baseForSim = currentDay > 1 ? actualPrevDay : 0
    defaultBdayRate = (projectedEnd - baseForSim) / steppingDaysRemaining
  } else if (isPartial) {
    let completedBdays = 0
    let remBdays = 0
    for (let d = 1; d <= daysInActive; d++) {
      const wd = new Date(Number(currYear), activeMonthIdx, d).getDay()
      const isWkday = wd >= 1 && wd <= 5
      if (isWkday) {
        if (d <= currentDay) completedBdays++
        else remBdays++
      }
    }
    defaultBdayRate = completedBdays > 0 ? actualCurrent / completedBdays : 0
    steppingDaysRemaining = remBdays
    baseForSim = actualCurrent
    projectedEnd = Math.round((actualCurrent + remBdays * defaultBdayRate) * 100) / 100
    projectedToday = actualCurrent
    if (remBdays > 0) {
      let running = actualCurrent
      projClean[currentDay - 1] = actualCurrent
      for (let d = currentDay + 1; d <= daysInActive; d++) {
        const wd = new Date(Number(currYear), activeMonthIdx, d).getDay()
        if (wd >= 1 && wd <= 5) running += defaultBdayRate
        projClean[d - 1] = Math.round(running * 100) / 100
      }
    }
  }

  const closedCountCurrYear = isPartial ? activeMonthIdx : activeMonthIdx + 1
  const closedCurrKeys: string[] = []
  for (let m = 0; m < closedCountCurrYear; m++) {
    const k = String(m + 1).padStart(2, '0') + '/' + currYear
    if (cumulative[k]) closedCurrKeys.push(k)
  }
  const avgRefKeys =
    closedCurrKeys.length > 0
      ? closedCurrKeys
      : store.monthOrder.filter((k) => k !== activeMonthKey && cumulative[k])

  const avgClosedCum = Array(31).fill(0)
  const avgClosedDaily = Array(31).fill(0)
  for (let dIdx = 0; dIdx < 31; dIdx++) {
    const cVals = avgRefKeys
      .map((k) => cumulative[k]?.[dIdx])
      .filter((v): v is number => v !== null && v !== undefined)
    avgClosedCum[dIdx] = cVals.length
      ? Math.round((cVals.reduce((a, b) => a + b, 0) / cVals.length) * 100) / 100
      : 0

    const nVals = avgRefKeys
      .map((k) => netDaily[k]?.[dIdx])
      .filter((v): v is number => v !== null && v !== undefined)
    avgClosedDaily[dIdx] = nVals.length
      ? Math.round((nVals.reduce((a, b) => a + b, 0) / nVals.length) * 100) / 100
      : 0
  }

  const prevMonthKey =
    activeMonthIdx === 0
      ? '12/' + String(Number(currYear) - 1)
      : String(activeMonthIdx).padStart(2, '0') + '/' + currYear
  const prevYearSameMonthKey = prevYear
    ? String(activeMonthIdx + 1).padStart(2, '0') + '/' + prevYear
    : null

  const getCumAtDaySafe = (mKey: string, dayNum: number): number | null => {
    const arr = cumulative[mKey]
    if (!arr) return null
    if (arr[dayNum - 1] !== null && arr[dayNum - 1] !== undefined) return arr[dayNum - 1]!
    for (let d = dayNum - 1; d >= 0; d--) {
      if (arr[d] !== null && arr[d] !== undefined) return arr[d]!
    }
    return null
  }

  const prevMonthAtDay = getCumAtDaySafe(prevMonthKey, currentDay)
  const prevYearAtDay = prevYearSameMonthKey
    ? getCumAtDaySafe(prevYearSameMonthKey, currentDay)
    : null
  const avgClosedAtDay = avgClosedCum[currentDay - 1] || null

  let completedBdaysActive = 0
  if (activeCumArr && netDaily[activeMonthKey]) {
    for (let d = 1; d <= (currentDay > 1 ? currentDay - 1 : 1); d++) {
      const wd = new Date(Number(currYear), activeMonthIdx, d).getDay()
      if (wd >= 1 && wd <= 5 && (netDaily[activeMonthKey]![d - 1] !== 0 || d > 2)) {
        completedBdaysActive++
      }
    }
  }
  const bdayAvgDisplay =
    defaultBdayRate > 0
      ? defaultBdayRate
      : completedBdaysActive
        ? actualCurrent / completedBdaysActive
        : 0

  const referenceDate = `${String(currentDay).padStart(2, '0')}/${String(activeMonthIdx + 1).padStart(2, '0')}/${currYear}`

  return {
    channel: store.channel || 'Site',
    referenceDate,
    years,
    currYear,
    prevYear,
    prev2Year,
    yearly: store.yearly,
    closedCountCurrYear,
    activeMonth: {
      idx: activeMonthIdx,
      short: MONTHS_SHORT[activeMonthIdx]!,
      full: MONTHS_FULL[activeMonthIdx]!,
      key: activeMonthKey,
      daysInMonth: daysInActive,
      currentDay,
      isPartial,
      hasDailyForActive,
      actualCurrent,
      actualPrevDay,
      projectedToday,
      projectedEnd,
      bdayAvgDisplay: Math.round(bdayAvgDisplay * 100) / 100,
      steppingDaysRemaining,
      baseForSim,
      defaultBdayRate,
      prevMonthKey,
      prevYearSameMonthKey,
      prevMonthAtDay,
      prevYearAtDay,
      avgClosedAtDay,
    },
    daily: {
      monthOrder: store.monthOrder,
      cumulative,
      netDaily,
      validMask,
      projActive: projClean,
      avgClosedCum,
      avgClosedDaily,
      avgRefLabel:
        closedCurrKeys.length > 0
          ? `Jan–${MONTHS_SHORT[closedCountCurrYear - 1]}/${currYear.slice(2)}`
          : 'Meses fechados',
    },
    weekdays,
    anomalies,
    audit: {
      artifactsCleaned,
      meta: store.meta,
    },
  }
}

export function getRevenueModeModel(
  data: RevenueDashboardData,
  mode: RevenueMode,
): RevenueModeModel {
  const { currYear, prevYear, prev2Year, yearly, activeMonth, closedCountCurrYear } = data
  const yCurrRaw = yearly[currYear] || Array(12).fill(null)
  const yPrev = prevYear ? yearly[prevYear] || Array(12).fill(null) : Array(12).fill(null)
  const yPrev2 = prev2Year ? yearly[prev2Year] || Array(12).fill(null) : Array(12).fill(null)

  const yCurrActive = [...yCurrRaw]
  if (mode === 'projected' && activeMonth.isPartial) {
    yCurrActive[activeMonth.idx] = activeMonth.projectedEnd
  }

  let statsCurr: RevenueStatsSummary
  let compPrevSamePeriod: number
  let compPrev2SamePeriod: number
  let periodLabel: string

  if (mode === 'closed' && closedCountCurrYear > 0) {
    statsCurr = calcRevenueStats(yCurrRaw.slice(0, closedCountCurrYear))
    compPrevSamePeriod = yPrev
      .slice(0, closedCountCurrYear)
      .reduce<number>((a, b) => a + (b || 0), 0)
    compPrev2SamePeriod = yPrev2
      .slice(0, closedCountCurrYear)
      .reduce<number>((a, b) => a + (b || 0), 0)
    periodLabel = `Jan–${MONTHS_SHORT[closedCountCurrYear - 1]} (${closedCountCurrYear} ${closedCountCurrYear === 1 ? 'mês fechado' : 'meses fechados'})`
  } else if (mode === 'dayParity' && activeMonth.isPartial) {
    statsCurr = calcRevenueStats(yCurrRaw.slice(0, activeMonth.idx + 1))
    const prevClosedPart = yPrev.slice(0, activeMonth.idx).reduce<number>((a, b) => a + (b || 0), 0)
    const prevActivePart =
      activeMonth.prevYearAtDay !== null ? activeMonth.prevYearAtDay : yPrev[activeMonth.idx] || 0
    compPrevSamePeriod = prevClosedPart + prevActivePart
    compPrev2SamePeriod = yPrev2
      .slice(0, activeMonth.idx + 1)
      .reduce<number>((a, b) => a + (b || 0), 0)
    periodLabel = `Jan–${String(activeMonth.currentDay).padStart(2, '0')}/${activeMonth.short} (Acumulado real)`
  } else {
    statsCurr = calcRevenueStats(yCurrActive.slice(0, activeMonth.idx + 1))
    compPrevSamePeriod = yPrev
      .slice(0, activeMonth.idx + 1)
      .reduce<number>((a, b) => a + (b || 0), 0)
    compPrev2SamePeriod = yPrev2
      .slice(0, activeMonth.idx + 1)
      .reduce<number>((a, b) => a + (b || 0), 0)
    periodLabel = activeMonth.isPartial
      ? `Jan–${activeMonth.short} (c/ Projeção ${activeMonth.short})`
      : `Jan–${activeMonth.short} (${activeMonth.idx + 1} meses)`
  }

  const rows = MONTHS_SHORT.map((mShort, idx) => {
    const mFull = MONTHS_FULL[idx]!
    const vPrev2 = yPrev2[idx] ?? null
    const vPrev = yPrev[idx] ?? null
    let vCurr = yCurrActive[idx] ?? null
    const isActive = idx === activeMonth.idx
    const isFuture = vCurr === null || vCurr === undefined

    let prevRef = idx === 0 ? (yPrev[11] ?? null) : (yCurrActive[idx - 1] ?? null)
    let refPrevYr = vPrev
    const refPrev2Yr = vPrev2
    let avgRef = statsCurr.mean
    let note = ''

    if (isActive && activeMonth.isPartial) {
      if (mode === 'dayParity') {
        vCurr = activeMonth.actualCurrent
        if (activeMonth.prevMonthAtDay !== null) prevRef = activeMonth.prevMonthAtDay
        if (activeMonth.prevYearAtDay !== null) refPrevYr = activeMonth.prevYearAtDay
        if (activeMonth.avgClosedAtDay !== null && activeMonth.avgClosedAtDay > 0) {
          avgRef = activeMonth.avgClosedAtDay
        }
        note = `Paridade Dia ${activeMonth.currentDay}`
      } else if (mode === 'projected') {
        vCurr = activeMonth.projectedEnd
        note = 'Projeção Oficial'
      } else {
        vCurr = activeMonth.actualCurrent
        note = `Parcial até ${String(activeMonth.currentDay).padStart(2, '0')}/${String(idx + 1).padStart(2, '0')}`
      }
    }

    const momPct = !isFuture ? safePct(vCurr, prevRef) : null
    const momDiff = !isFuture && prevRef !== null && vCurr !== null ? vCurr - prevRef : null

    const yoyPrevPct = !isFuture ? safePct(vCurr, refPrevYr) : null
    const yoyPrevDiff = !isFuture && refPrevYr !== null && vCurr !== null ? vCurr - refPrevYr : null

    const yoyPrev2Pct = !isFuture ? safePct(vCurr, refPrev2Yr) : null
    const yoyPrev2Diff =
      !isFuture && refPrev2Yr !== null && vCurr !== null ? vCurr - refPrev2Yr : null

    const vsAvgPct = !isFuture ? safePct(vCurr, avgRef) : null
    const vsAvgDiff = !isFuture && avgRef && vCurr !== null ? vCurr - avgRef : null

    return {
      idx,
      mShort,
      mFull,
      vPrev2,
      vPrev,
      vCurr: isFuture ? null : vCurr,
      rawCurr: yCurrRaw[idx] ?? null,
      prevRef,
      refPrevYr,
      refPrev2Yr,
      avgRef,
      momPct,
      momDiff,
      yoyPrevPct,
      yoyPrevDiff,
      yoyPrev2Pct,
      yoyPrev2Diff,
      vsAvgPct,
      vsAvgDiff,
      isActive,
      isFuture,
      note,
    }
  })

  return {
    statsCurr,
    statsPrev: calcRevenueStats(yPrev),
    statsPrev2: calcRevenueStats(yPrev2),
    compPrevSamePeriod,
    compPrev2SamePeriod,
    periodLabel,
    rows,
  }
}

export function buildConsolidatedRevenueCsv(
  data: RevenueDashboardData,
  model: RevenueModeModel,
): string {
  const headers = [
    'Mês',
    ...(data.prev2Year ? [data.prev2Year] : []),
    ...(data.prevYear ? [data.prevYear] : []),
    data.currYear,
    'Vs Média (%)',
    'MoM (%)',
    ...(data.prevYear ? [`YoY vs ${data.prevYear} (%)`] : []),
    'Observação',
  ]

  const lines = [headers.join(';')]
  model.rows.forEach((r) => {
    const cols = [
      r.mFull,
      ...(data.prev2Year ? [r.vPrev2 !== null ? r.vPrev2.toFixed(2).replace('.', ',') : ''] : []),
      ...(data.prevYear ? [r.vPrev !== null ? r.vPrev.toFixed(2).replace('.', ',') : ''] : []),
      r.vCurr !== null ? r.vCurr.toFixed(2).replace('.', ',') : '',
      r.vsAvgPct !== null ? r.vsAvgPct.toFixed(2).replace('.', ',') : '',
      r.momPct !== null ? r.momPct.toFixed(2).replace('.', ',') : '',
      ...(data.prevYear
        ? [r.yoyPrevPct !== null ? r.yoyPrevPct.toFixed(2).replace('.', ',') : '']
        : []),
      r.note || (r.isFuture ? 'Sem dados' : 'Fechado'),
    ]
    lines.push(cols.join(';'))
  })
  return '\uFEFF' + lines.join('\n')
}
