<script setup lang="ts">
import type { RevenueDashboardData, RevenueMode, RevenueModeModel } from '~~/shared/types/revenue'
import { fmtBRL, fmtCompactBRL, fmtPct, fmtSignedBRL, safePct } from '~~/shared/utils/revenue'
import type { RevenueEChartsOption } from './RevenueChart.vue'
import RevenueChart from './RevenueChart.vue'

const props = defineProps<{
  data: RevenueDashboardData
  model: RevenueModeModel
  mode: RevenueMode
  showLabels: boolean
}>()

const activeKpiDiff = computed(() => {
  const yoy = safePct(props.model.statsCurr.sum, props.model.compPrevSamePeriod)
  return yoy
})

const bestMonth = computed(() => {
  const valid = props.model.rows.filter((r) => r.vCurr !== null)
  if (!valid.length) return null
  return valid.reduce((a, b) => ((b.vCurr ?? 0) > (a.vCurr ?? 0) ? b : a))
})

const overviewChartOption = computed<RevenueEChartsOption>(() => {
  const categories = props.model.rows.map((r) => r.mShort)
  const values = props.model.rows.map((r) => ({
    value: r.vCurr,
    itemStyle: {
      color: r.isActive && props.data.activeMonth.isPartial ? '#fe3e00' : '#035096',
      borderRadius: [6, 6, 0, 0],
    },
  }))

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      valueFormatter: (val) => fmtBRL(typeof val === 'number' ? val : null),
    },
    grid: { left: 16, right: 20, top: 28, bottom: 28, containLabel: true },
    xAxis: {
      type: 'category',
      data: categories,
      axisLine: { lineStyle: { color: '#71717a', opacity: 0.3 } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: (v: number) => fmtCompactBRL(v) },
      splitLine: { lineStyle: { type: 'dashed', opacity: 0.25 } },
    },
    series: [
      {
        name: `Faturamento ${props.data.currYear}`,
        type: 'bar',
        data: values,
        barMaxWidth: 38,
        label: {
          show: props.showLabels,
          position: 'top',
          fontSize: 10,
          formatter: (p) => fmtCompactBRL(typeof p.value === 'number' ? p.value : null),
        },
        markLine: {
          symbol: 'none',
          lineStyle: { color: '#d97706', type: 'dashed', width: 2 },
          label: {
            formatter: () => `Média: ${fmtCompactBRL(props.model.statsCurr.mean)}`,
            position: 'insideEndTop',
          },
          data: [{ yAxis: props.model.statsCurr.mean }],
        },
      },
    ],
  }
})

function pctBadgeClass(val: number | null): string {
  if (val === null) return 'bg-muted text-muted-foreground'
  if (val > 0.04) return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
  if (val < -0.04) return 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
  return 'bg-muted text-muted-foreground'
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- KPIs -->
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader class="pb-2">
          <CardDescription>Acumulado {{ props.data.currYear }}</CardDescription>
          <CardTitle class="text-2xl tabular-nums">
            {{ fmtBRL(props.model.statsCurr.sum) }}
          </CardTitle>
        </CardHeader>
        <CardContent class="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{{ props.model.periodLabel }}</span>
          <Badge
            v-if="props.data.prevYear"
            variant="secondary"
            :class="pctBadgeClass(activeKpiDiff)"
          >
            {{ fmtPct(activeKpiDiff) }} vs {{ props.data.prevYear }}
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardDescription>Média Mensal ({{ props.data.currYear }})</CardDescription>
          <CardTitle class="text-2xl tabular-nums">
            {{ fmtBRL(props.model.statsCurr.mean) }}
          </CardTitle>
        </CardHeader>
        <CardContent class="text-xs text-muted-foreground">
          Mediana:
          <strong class="text-foreground">{{ fmtBRL(props.model.statsCurr.median) }}</strong> ·
          {{ props.model.statsCurr.count }} meses
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardDescription>
            {{ props.data.activeMonth.full }}/{{ props.data.currYear.slice(2) }} ({{
              props.data.activeMonth.isPartial
                ? `Dia ${props.data.activeMonth.currentDay}`
                : 'Fechado'
            }})
          </CardDescription>
          <CardTitle class="text-2xl tabular-nums">
            {{
              fmtBRL(
                props.mode === 'projected' && props.data.activeMonth.isPartial
                  ? props.data.activeMonth.projectedEnd
                  : props.data.activeMonth.actualCurrent,
              )
            }}
          </CardTitle>
        </CardHeader>
        <CardContent class="text-xs text-muted-foreground">
          <template v-if="props.data.activeMonth.isPartial">
            Projeção oficial:
            <strong class="text-foreground">{{
              fmtBRL(props.data.activeMonth.projectedEnd)
            }}</strong>
          </template>
          <template v-else>
            Ritmo:
            <strong class="text-foreground"
              >{{ fmtBRL(props.data.activeMonth.bdayAvgDisplay) }}/dia útil</strong
            >
          </template>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardDescription>Melhor Mês ({{ props.data.currYear }})</CardDescription>
          <CardTitle class="text-2xl tabular-nums">
            {{ bestMonth ? fmtBRL(bestMonth.vCurr) : '—' }}
          </CardTitle>
        </CardHeader>
        <CardContent class="text-xs text-muted-foreground">
          {{ bestMonth ? `${bestMonth.mFull}/${props.data.currYear}` : 'Sem dados' }}
          · Mín: <strong class="text-foreground">{{ fmtBRL(props.model.statsCurr.min) }}</strong>
        </CardContent>
      </Card>
    </div>

    <!-- Chart -->
    <Card>
      <CardHeader>
        <CardTitle>Evolução Mensal vs. Média do Ano ({{ props.data.currYear }})</CardTitle>
        <CardDescription>
          Passe o mouse nas barras para inspecionar os valores e a linha tracejada da média mensal
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RevenueChart :option="overviewChartOption" height="340px" />
      </CardContent>
    </Card>

    <!-- Table -->
    <Card>
      <CardHeader>
        <CardTitle>Resumo Mensal Detalhado</CardTitle>
        <CardDescription>
          Comparativo mensal com desvio contra a média, mês anterior (MoM) e ano anterior (YoY)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mês</TableHead>
                <TableHead class="text-right">{{ props.data.currYear }}</TableHead>
                <TableHead class="text-right">Vs. Média</TableHead>
                <TableHead class="text-right">MoM (%)</TableHead>
                <TableHead v-if="props.data.prevYear" class="text-right">
                  YoY vs {{ props.data.prevYear }}
                </TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="row in props.model.rows"
                :key="row.mShort"
                :class="row.isActive ? 'bg-primary/5 font-medium' : ''"
              >
                <TableCell class="font-medium">{{ row.mFull }}</TableCell>
                <TableCell class="text-right tabular-nums">{{ fmtBRL(row.vCurr) }}</TableCell>
                <TableCell class="text-right tabular-nums">
                  <span
                    v-if="row.vsAvgPct !== null"
                    class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
                    :class="pctBadgeClass(row.vsAvgPct)"
                  >
                    {{ fmtPct(row.vsAvgPct) }}
                  </span>
                  <span v-else class="text-muted-foreground">—</span>
                </TableCell>
                <TableCell class="text-right tabular-nums">
                  <div class="flex flex-col items-end">
                    <span>{{ fmtPct(row.momPct) }}</span>
                    <span v-if="row.momDiff !== null" class="text-[11px] text-muted-foreground">
                      {{ fmtSignedBRL(row.momDiff) }}
                    </span>
                  </div>
                </TableCell>
                <TableCell v-if="props.data.prevYear" class="text-right tabular-nums">
                  <div class="flex flex-col items-end">
                    <span>{{ fmtPct(row.yoyPrevPct) }}</span>
                    <span v-if="row.yoyPrevDiff !== null" class="text-[11px] text-muted-foreground">
                      {{ fmtSignedBRL(row.yoyPrevDiff) }}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge v-if="row.note" variant="outline">{{ row.note }}</Badge>
                  <span v-else-if="row.isFuture" class="text-xs text-muted-foreground"
                    >Sem dados</span
                  >
                  <span v-else class="text-xs text-muted-foreground">Fechado</span>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
