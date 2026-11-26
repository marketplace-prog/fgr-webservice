<script setup lang="ts">
import type { RevenueDashboardData, RevenueModeModel } from '~~/shared/types/revenue'
import {
  MONTHS_SHORT,
  calcRevenueStats,
  fmtBRL,
  fmtCompactBRL,
  fmtPct,
  safePct,
} from '~~/shared/utils/revenue'
import type { RevenueEChartsOption } from './RevenueChart.vue'
import RevenueChart from './RevenueChart.vue'

const props = defineProps<{
  data: RevenueDashboardData
  model: RevenueModeModel
  showLabels: boolean
}>()

const chartType = ref<'bar' | 'line'>('bar')
const visibleYears = ref<Record<string, boolean>>({})

watch(
  () => props.data.years,
  (years) => {
    years.forEach((y) => {
      if (visibleYears.value[y] === undefined) visibleYears.value[y] = true
    })
  },
  { immediate: true },
)

const YEAR_COLORS = ['#94a3b8', '#475569', '#035096', '#fe3e00']

const yearlyStats = computed(() =>
  props.data.years.map((y, idx) => {
    const raw =
      y === props.data.currYear
        ? props.model.rows.map((r) => r.vCurr)
        : (props.data.yearly[y] ?? Array(12).fill(null))
    return {
      year: y,
      color: YEAR_COLORS[idx % YEAR_COLORS.length]!,
      stats: calcRevenueStats(raw),
    }
  }),
)

const quarters = computed(() => {
  const qLabels = ['Q1 (Jan–Mar)', 'Q2 (Abr–Jun)', 'Q3 (Jul–Set)', 'Q4 (Out–Dez)']
  return [0, 1, 2, 3].map((qIdx) => {
    const start = qIdx * 3
    const end = start + 3
    const byYear: Record<string, number> = {}
    props.data.years.forEach((y) => {
      const arr =
        y === props.data.currYear
          ? props.model.rows.map((r) => r.vCurr)
          : (props.data.yearly[y] ?? Array(12).fill(null))
      byYear[y] = arr.slice(start, end).reduce<number>((a, b) => a + (b || 0), 0)
    })
    const currVal = byYear[props.data.currYear] ?? 0
    const prevVal = props.data.prevYear ? (byYear[props.data.prevYear] ?? 0) : null
    return {
      label: qLabels[qIdx]!,
      byYear,
      yoy: prevVal !== null && currVal > 0 ? safePct(currVal, prevVal) : null,
    }
  })
})

const yearlyChartOption = computed<RevenueEChartsOption>(() => {
  const activeYears = props.data.years.filter((y) => visibleYears.value[y] !== false)
  const series = activeYears.map((y) => {
    const idx = props.data.years.indexOf(y)
    const color = YEAR_COLORS[idx % YEAR_COLORS.length]!
    const values =
      y === props.data.currYear
        ? props.model.rows.map((r) => r.vCurr)
        : (props.data.yearly[y] ?? Array(12).fill(null))

    return {
      name: y,
      type: chartType.value,
      data: values,
      smooth: chartType.value === 'line',
      itemStyle: { color, borderRadius: chartType.value === 'bar' ? [4, 4, 0, 0] : 0 },
      lineStyle: { width: y === props.data.currYear ? 3 : 2 },
      label: {
        show: props.showLabels && y === props.data.currYear,
        position: 'top' as const,
        fontSize: 10,
        formatter: (p: { value?: unknown }) =>
          fmtCompactBRL(typeof p.value === 'number' ? p.value : null),
      },
    }
  })

  return {
    tooltip: {
      trigger: 'axis',
      valueFormatter: (val) => fmtBRL(typeof val === 'number' ? val : null),
    },
    legend: { top: 0 },
    grid: { left: 16, right: 16, top: 36, bottom: 28, containLabel: true },
    xAxis: { type: 'category', data: [...MONTHS_SHORT] },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: (v: number) => fmtCompactBRL(v) },
      splitLine: { lineStyle: { type: 'dashed', opacity: 0.25 } },
    },
    series,
  }
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Yearly KPIs -->
    <div class="grid gap-3 md:grid-cols-3">
      <Card v-for="item in yearlyStats" :key="item.year">
        <CardHeader class="pb-2">
          <CardDescription>Total {{ item.year }}</CardDescription>
          <CardTitle class="text-2xl tabular-nums">{{ fmtBRL(item.stats.sum) }}</CardTitle>
        </CardHeader>
        <CardContent class="text-xs text-muted-foreground">
          Média: <strong class="text-foreground">{{ fmtBRL(item.stats.mean) }}</strong> ·
          {{ item.stats.count }} meses
        </CardContent>
      </Card>
    </div>

    <!-- Comparison Chart -->
    <Card>
      <CardHeader class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Comparativo Mês a Mês entre Anos</CardTitle>
          <CardDescription
            >Compare sazonalidade e evolução de patamar entre os exercícios</CardDescription
          >
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <div class="inline-flex rounded-lg border bg-muted p-0.5">
            <button
              type="button"
              class="rounded-md px-2.5 py-1 text-xs font-medium"
              :class="chartType === 'bar' ? 'bg-background shadow-xs' : 'text-muted-foreground'"
              @click="chartType = 'bar'"
            >
              Barras
            </button>
            <button
              type="button"
              class="rounded-md px-2.5 py-1 text-xs font-medium"
              :class="chartType === 'line' ? 'bg-background shadow-xs' : 'text-muted-foreground'"
              @click="chartType = 'line'"
            >
              Linhas
            </button>
          </div>
          <Button
            v-for="y in props.data.years"
            :key="y"
            size="sm"
            :variant="visibleYears[y] !== false ? 'default' : 'outline'"
            @click="visibleYears[y] = visibleYears[y] === false"
          >
            {{ y }}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <RevenueChart :option="yearlyChartOption" height="350px" />
      </CardContent>
    </Card>

    <!-- Quarters + Stats -->
    <div class="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Desempenho por Trimestre</CardTitle>
          <CardDescription>Acumulado trimestral comparado aos anos anteriores</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trimestre</TableHead>
                <TableHead v-for="y in props.data.years" :key="y" class="text-right">
                  {{ y }}
                </TableHead>
                <TableHead v-if="props.data.prevYear" class="text-right">YoY</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="q in quarters" :key="q.label">
                <TableCell class="font-medium">{{ q.label }}</TableCell>
                <TableCell v-for="y in props.data.years" :key="y" class="text-right tabular-nums">
                  {{ q.byYear[y] ? fmtBRL(q.byYear[y]) : '—' }}
                </TableCell>
                <TableCell v-if="props.data.prevYear" class="text-right tabular-nums">
                  {{ fmtPct(q.yoy) }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Estatísticas Anuais Comparadas</CardTitle>
          <CardDescription>Média, mediana, desvio-padrão e extremos mensais</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ano</TableHead>
                <TableHead class="text-right">Média</TableHead>
                <TableHead class="text-right">Mediana</TableHead>
                <TableHead class="text-right">Mín / Máx</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="item in yearlyStats" :key="item.year">
                <TableCell class="font-medium">{{ item.year }}</TableCell>
                <TableCell class="text-right tabular-nums">{{ fmtBRL(item.stats.mean) }}</TableCell>
                <TableCell class="text-right tabular-nums">{{
                  fmtBRL(item.stats.median)
                }}</TableCell>
                <TableCell class="text-right text-xs tabular-nums">
                  {{ fmtBRL(item.stats.min) }} / {{ fmtBRL(item.stats.max) }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>

    <!-- Side-by-side history -->
    <Card>
      <CardHeader>
        <CardTitle>Histórico Completo Lado a Lado</CardTitle>
        <CardDescription>Valores mensais em R$ e variação percentual do ano atual</CardDescription>
      </CardHeader>
      <CardContent class="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mês</TableHead>
              <TableHead v-if="props.data.prev2Year" class="text-right">{{
                props.data.prev2Year
              }}</TableHead>
              <TableHead v-if="props.data.prevYear" class="text-right">{{
                props.data.prevYear
              }}</TableHead>
              <TableHead class="text-right">{{ props.data.currYear }}</TableHead>
              <TableHead v-if="props.data.prevYear" class="text-right">
                Var. vs {{ props.data.prevYear }}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="r in props.model.rows" :key="r.mShort">
              <TableCell class="font-medium">{{ r.mFull }}</TableCell>
              <TableCell v-if="props.data.prev2Year" class="text-right tabular-nums">
                {{ fmtBRL(r.vPrev2) }}
              </TableCell>
              <TableCell v-if="props.data.prevYear" class="text-right tabular-nums">
                {{ fmtBRL(r.vPrev) }}
              </TableCell>
              <TableCell class="text-right font-medium tabular-nums">{{
                fmtBRL(r.vCurr)
              }}</TableCell>
              <TableCell v-if="props.data.prevYear" class="text-right tabular-nums">
                {{ fmtPct(r.yoyPrevPct) }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
</template>
