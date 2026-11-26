<script setup lang="ts">
import type { RevenueDashboardData, RevenueModeModel } from '~~/shared/types/revenue'
import { fmtBRL, fmtPct, fmtSignedBRL } from '~~/shared/utils/revenue'
import type { RevenueEChartsOption } from './RevenueChart.vue'
import RevenueChart from './RevenueChart.vue'

const props = defineProps<{
  data: RevenueDashboardData
  model: RevenueModeModel
  showLabels: boolean
}>()

const metric = ref<'mom' | 'yoyPrev' | 'yoyPrev2'>('mom')
const filter = ref<'all' | 'pos' | 'neg'>('all')

const validRows = computed(() => props.model.rows.filter((r) => r.vCurr !== null))

const filteredRows = computed(() =>
  validRows.value.filter((r) => {
    const val =
      metric.value === 'mom' ? r.momPct : metric.value === 'yoyPrev' ? r.yoyPrevPct : r.yoyPrev2Pct
    if (filter.value === 'pos') return val !== null && val > 0.04
    if (filter.value === 'neg') return val !== null && val < -0.04
    return true
  }),
)

const varChartOption = computed<RevenueEChartsOption>(() => {
  const categories = validRows.value.map((r) => r.mShort)
  const values = validRows.value.map((r) => {
    const val =
      metric.value === 'mom' ? r.momPct : metric.value === 'yoyPrev' ? r.yoyPrevPct : r.yoyPrev2Pct
    const rounded = val !== null ? Number(val.toFixed(1)) : 0
    return {
      value: rounded,
      itemStyle: {
        color: rounded >= 0 ? '#10b981' : '#e11d48',
        borderRadius: rounded >= 0 ? [4, 4, 0, 0] : [0, 0, 4, 4],
      },
    }
  })

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      valueFormatter: (v) => fmtPct(typeof v === 'number' ? v : null),
    },
    grid: { left: 16, right: 16, top: 24, bottom: 28, containLabel: true },
    xAxis: { type: 'category', data: categories },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: (v: number) => `${v}%` },
      splitLine: { lineStyle: { type: 'dashed', opacity: 0.25 } },
    },
    series: [
      {
        name: 'Variação (%)',
        type: 'bar',
        data: values,
        barMaxWidth: 38,
        label: {
          show: props.showLabels,
          position: 'top',
          fontSize: 10,
          formatter: (p) => fmtPct(typeof p.value === 'number' ? p.value : null),
        },
      },
    ],
  }
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <Card>
      <CardHeader class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Variações Percentuais: Mês Anterior (MoM) vs. Ano Anterior (YoY)</CardTitle>
          <CardDescription>
            Janeiro é comparado com Dezembro do ano anterior; no mês em curso vale o critério
            selecionado
          </CardDescription>
        </div>
        <div class="flex flex-wrap gap-2">
          <div class="inline-flex rounded-lg border bg-muted p-0.5">
            <button
              type="button"
              class="rounded-md px-2.5 py-1 text-xs font-medium"
              :class="metric === 'mom' ? 'bg-background shadow-xs' : 'text-muted-foreground'"
              @click="metric = 'mom'"
            >
              MoM (%)
            </button>
            <button
              v-if="props.data.prevYear"
              type="button"
              class="rounded-md px-2.5 py-1 text-xs font-medium"
              :class="metric === 'yoyPrev' ? 'bg-background shadow-xs' : 'text-muted-foreground'"
              @click="metric = 'yoyPrev'"
            >
              % vs {{ props.data.prevYear }}
            </button>
            <button
              v-if="props.data.prev2Year"
              type="button"
              class="rounded-md px-2.5 py-1 text-xs font-medium"
              :class="metric === 'yoyPrev2' ? 'bg-background shadow-xs' : 'text-muted-foreground'"
              @click="metric = 'yoyPrev2'"
            >
              % vs {{ props.data.prev2Year }}
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <RevenueChart :option="varChartOption" height="330px" />
      </CardContent>
    </Card>

    <Card>
      <CardHeader class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Matriz Completa de Variações (% e R$)</CardTitle>
          <CardDescription>
            Comparação simultânea com o mês imediatamente anterior e mesmos meses dos anos
            anteriores
          </CardDescription>
        </div>
        <div class="inline-flex rounded-lg border bg-muted p-0.5">
          <button
            type="button"
            class="rounded-md px-2.5 py-1 text-xs font-medium"
            :class="filter === 'all' ? 'bg-background shadow-xs' : 'text-muted-foreground'"
            @click="filter = 'all'"
          >
            Todos
          </button>
          <button
            type="button"
            class="rounded-md px-2.5 py-1 text-xs font-medium"
            :class="filter === 'pos' ? 'bg-background shadow-xs' : 'text-muted-foreground'"
            @click="filter = 'pos'"
          >
            Positivos
          </button>
          <button
            type="button"
            class="rounded-md px-2.5 py-1 text-xs font-medium"
            :class="filter === 'neg' ? 'bg-background shadow-xs' : 'text-muted-foreground'"
            @click="filter = 'neg'"
          >
            Negativos
          </button>
        </div>
      </CardHeader>
      <CardContent class="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mês</TableHead>
              <TableHead class="text-right">{{ props.data.currYear }}</TableHead>
              <TableHead class="text-right">MoM (% / R$)</TableHead>
              <TableHead v-if="props.data.prevYear" class="text-right">
                YoY vs {{ props.data.prevYear }}
              </TableHead>
              <TableHead v-if="props.data.prev2Year" class="text-right">
                YoY vs {{ props.data.prev2Year }}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="r in filteredRows" :key="r.mShort">
              <TableCell class="font-medium">{{ r.mFull }}</TableCell>
              <TableCell class="text-right tabular-nums">{{ fmtBRL(r.vCurr) }}</TableCell>
              <TableCell class="text-right tabular-nums">
                <div class="flex flex-col items-end">
                  <span
                    :class="
                      (r.momPct ?? 0) >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    "
                  >
                    {{ fmtPct(r.momPct) }}
                  </span>
                  <span class="text-[11px] text-muted-foreground">{{
                    fmtSignedBRL(r.momDiff)
                  }}</span>
                </div>
              </TableCell>
              <TableCell v-if="props.data.prevYear" class="text-right tabular-nums">
                <div class="flex flex-col items-end">
                  <span
                    :class="
                      (r.yoyPrevPct ?? 0) >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    "
                  >
                    {{ fmtPct(r.yoyPrevPct) }}
                  </span>
                  <span class="text-[11px] text-muted-foreground">{{
                    fmtSignedBRL(r.yoyPrevDiff)
                  }}</span>
                </div>
              </TableCell>
              <TableCell v-if="props.data.prev2Year" class="text-right tabular-nums">
                <div class="flex flex-col items-end">
                  <span
                    :class="
                      (r.yoyPrev2Pct ?? 0) >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    "
                  >
                    {{ fmtPct(r.yoyPrev2Pct) }}
                  </span>
                  <span class="text-[11px] text-muted-foreground">{{
                    fmtSignedBRL(r.yoyPrev2Diff)
                  }}</span>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
</template>
