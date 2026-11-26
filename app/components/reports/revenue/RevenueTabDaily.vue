<script setup lang="ts">
import type { RevenueDashboardData, RevenueModeModel } from '~~/shared/types/revenue'
import { fmtBRL, fmtCompactBRL, fmtPct, safePct } from '~~/shared/utils/revenue'
import type { RevenueEChartsOption } from './RevenueChart.vue'
import RevenueChart from './RevenueChart.vue'

const props = defineProps<{
  data: RevenueDashboardData
  model: RevenueModeModel
}>()

const dailyMode = ref<'cum' | 'net'>('cum')
const extraMonth = ref<string>('none')
const selectedDay = ref<number>(props.data.activeMonth.currentDay)
const simBdayRate = ref<number>(Math.round(props.data.activeMonth.defaultBdayRate || 2500))
const simRestMonthsAvg = ref<number>(Math.round(props.model.statsCurr.mean || 50000))

watch(
  () => props.data.activeMonth.currentDay,
  (d) => {
    selectedDay.value = d
    simBdayRate.value = Math.round(props.data.activeMonth.defaultBdayRate || 2500)
  },
)

const extraMonthOptions = computed(() => {
  const excluded = new Set([
    props.data.activeMonth.key,
    props.data.activeMonth.prevMonthKey,
    props.data.activeMonth.prevYearSameMonthKey,
  ])
  return props.data.daily.monthOrder
    .filter((k) => !excluded.has(k))
    .map((k) => {
      const vals = (props.data.daily.cumulative[k] ?? []).filter((v): v is number => v !== null)
      return { key: k, endVal: vals.length ? vals[vals.length - 1]! : 0 }
    })
    .reverse()
})

const dailyChartOption = computed<RevenueEChartsOption>(() => {
  const days = Array.from({ length: props.data.activeMonth.daysInMonth }, (_, i) => String(i + 1))
  const source = dailyMode.value === 'cum' ? props.data.daily.cumulative : props.data.daily.netDaily
  const activeKey = props.data.activeMonth.key
  const prevKey = props.data.activeMonth.prevMonthKey
  const yoyKey = props.data.activeMonth.prevYearSameMonthKey

  const series: RevenueEChartsOption['series'] = [
    {
      name: `${activeKey} (Atual)`,
      type: dailyMode.value === 'cum' ? 'line' : 'bar',
      data: (source[activeKey] ?? []).slice(0, days.length),
      itemStyle: { color: '#035096' },
      lineStyle: { width: 3 },
      smooth: false,
    },
  ]

  if (dailyMode.value === 'cum' && props.data.activeMonth.isPartial) {
    series.push({
      name: 'Projeção Oficial',
      type: 'line',
      data: props.data.daily.projActive.slice(0, days.length),
      itemStyle: { color: '#059669' },
      lineStyle: { width: 2, type: 'dashed' },
    })
  }

  if (source[prevKey]) {
    series.push({
      name: `${prevKey} (Mês Ant.)`,
      type: 'line',
      data: source[prevKey]!.slice(0, days.length),
      itemStyle: { color: '#71717a' },
      lineStyle: { width: 1.5 },
    })
  }

  if (yoyKey && source[yoyKey]) {
    series.push({
      name: `${yoyKey} (Ano Ant.)`,
      type: 'line',
      data: source[yoyKey]!.slice(0, days.length),
      itemStyle: { color: '#fe3e00' },
      lineStyle: { width: 1.5, type: 'dotted' },
    })
  }

  if (extraMonth.value !== 'none' && source[extraMonth.value]) {
    series.push({
      name: extraMonth.value,
      type: 'line',
      data: source[extraMonth.value]!.slice(0, days.length),
      itemStyle: { color: '#d97706' },
      lineStyle: { width: 1.5 },
    })
  }

  return {
    tooltip: {
      trigger: 'axis',
      valueFormatter: (v) => fmtBRL(typeof v === 'number' ? v : null),
    },
    legend: { top: 0 },
    grid: { left: 16, right: 16, top: 38, bottom: 28, containLabel: true },
    xAxis: { type: 'category', data: days },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: (v: number) => fmtCompactBRL(v) },
      splitLine: { lineStyle: { type: 'dashed', opacity: 0.25 } },
    },
    series,
  }
})

const dayInspectData = computed(() => {
  const dIdx = Math.max(0, Math.min(30, selectedDay.value - 1))
  const activeVal = props.data.daily.cumulative[props.data.activeMonth.key]?.[dIdx] ?? null
  const prevVal = props.data.daily.cumulative[props.data.activeMonth.prevMonthKey]?.[dIdx] ?? null
  const yoyVal = props.data.activeMonth.prevYearSameMonthKey
    ? (props.data.daily.cumulative[props.data.activeMonth.prevYearSameMonthKey]?.[dIdx] ?? null)
    : null
  return {
    activeVal,
    prevVal,
    yoyVal,
    vsPrev: safePct(activeVal, prevVal),
    vsYoy: safePct(activeVal, yoyVal),
  }
})

const simResult = computed(() => {
  const { activeMonth, yearly, currYear, prevYear } = props.data
  const currMonthSimulated = activeMonth.isPartial
    ? activeMonth.baseForSim + activeMonth.steppingDaysRemaining * simBdayRate.value
    : activeMonth.actualCurrent

  const closedSum = (yearly[currYear] ?? [])
    .slice(0, activeMonth.idx)
    .reduce<number>((a, b) => a + (b || 0), 0)
  const remainingMonthsCount = Math.max(0, 11 - activeMonth.idx)
  const projectedYearTotal =
    closedSum + currMonthSimulated + remainingMonthsCount * simRestMonthsAvg.value
  const prevYearTotal = prevYear
    ? (yearly[prevYear] ?? []).reduce<number>((a, b) => a + (b || 0), 0)
    : null

  return {
    currMonthSimulated,
    projectedYearTotal,
    remainingMonthsCount,
    vsPrevYear: prevYearTotal ? safePct(projectedYearTotal, prevYearTotal) : null,
  }
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Daily KPIs -->
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader class="pb-2">
          <CardDescription
            >Realizado até Dia {{ props.data.activeMonth.currentDay }}</CardDescription
          >
          <CardTitle class="text-2xl tabular-nums">
            {{ fmtBRL(props.data.activeMonth.actualCurrent) }}
          </CardTitle>
        </CardHeader>
        <CardContent class="text-xs text-muted-foreground">
          {{ props.data.activeMonth.key }}
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardDescription>Projeção de Fechamento</CardDescription>
          <CardTitle class="text-2xl tabular-nums">
            {{ fmtBRL(props.data.activeMonth.projectedEnd) }}
          </CardTitle>
        </CardHeader>
        <CardContent class="text-xs text-muted-foreground">
          Ritmo: {{ fmtBRL(props.data.activeMonth.bdayAvgDisplay) }} / dia útil
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardDescription>Inspeção Dia {{ selectedDay }}</CardDescription>
          <CardTitle class="text-2xl tabular-nums">
            {{ fmtBRL(dayInspectData.activeVal) }}
          </CardTitle>
        </CardHeader>
        <CardContent class="text-xs text-muted-foreground">
          vs Mês Ant: <strong>{{ fmtPct(dayInspectData.vsPrev) }}</strong> · vs Ano Ant:
          <strong>{{ fmtPct(dayInspectData.vsYoy) }}</strong>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardDescription>Anomalias / Estornos Detectados</CardDescription>
          <CardTitle class="text-2xl tabular-nums">{{ props.data.anomalies.length }}</CardTitle>
        </CardHeader>
        <CardContent class="text-xs text-muted-foreground">
          Artefatos de projeção limpos: {{ props.data.audit.artifactsCleaned }}
        </CardContent>
      </Card>
    </div>

    <!-- Daily Chart -->
    <Card>
      <CardHeader class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle
            >Curva Diária (Dia 1 ao {{ props.data.activeMonth.daysInMonth }}) e Projeção</CardTitle
          >
          <CardDescription>Acompanhamento diário acumulado e venda líquida por dia</CardDescription>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <div class="inline-flex rounded-lg border bg-muted p-0.5">
            <button
              type="button"
              class="rounded-md px-2.5 py-1 text-xs font-medium"
              :class="dailyMode === 'cum' ? 'bg-background shadow-xs' : 'text-muted-foreground'"
              @click="dailyMode = 'cum'"
            >
              Acumulado
            </button>
            <button
              type="button"
              class="rounded-md px-2.5 py-1 text-xs font-medium"
              :class="dailyMode === 'net' ? 'bg-background shadow-xs' : 'text-muted-foreground'"
              @click="dailyMode = 'net'"
            >
              Venda do Dia
            </button>
          </div>
          <select
            v-model="extraMonth"
            class="h-8 rounded-md border bg-background px-2 text-xs"
            aria-label="Comparar outro mês"
          >
            <option value="none">+ Comparar outro mês...</option>
            <option v-for="opt in extraMonthOptions" :key="opt.key" :value="opt.key">
              {{ opt.key }} ({{ fmtBRL(opt.endVal) }})
            </option>
          </select>
        </div>
      </CardHeader>
      <CardContent class="flex flex-col gap-4">
        <RevenueChart :option="dailyChartOption" height="350px" />
        <div
          class="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2 text-xs"
        >
          <span class="font-medium">Inspecionar Dia:</span>
          <input
            v-model.number="selectedDay"
            type="range"
            min="1"
            :max="props.data.activeMonth.daysInMonth"
            class="w-44 accent-primary"
          />
          <Badge variant="outline">Dia {{ selectedDay }}</Badge>
          <span class="text-muted-foreground">
            Atual: <strong class="text-foreground">{{ fmtBRL(dayInspectData.activeVal) }}</strong> ·
            Mês Ant: <strong class="text-foreground">{{ fmtBRL(dayInspectData.prevVal) }}</strong>
          </span>
        </div>
      </CardContent>
    </Card>

    <!-- Weekdays + Simulator -->
    <div class="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Concentração por Dia da Semana</CardTitle>
          <CardDescription
            >Participação percentual e média líquida por dia da semana</CardDescription
          >
        </CardHeader>
        <CardContent class="flex flex-col gap-3">
          <div v-for="w in props.data.weekdays" :key="w.weekday" class="flex flex-col gap-1">
            <div class="flex items-center justify-between text-xs">
              <span class="font-medium">{{ w.name }}</span>
              <span class="text-muted-foreground tabular-nums">
                {{ w.share_pct.toFixed(1).replace('.', ',') }}% · Média {{ fmtBRL(w.mean) }}
              </span>
            </div>
            <div class="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                class="h-full rounded-full bg-primary transition-all"
                :style="{ width: `${Math.min(100, w.share_pct * 2.5)}%` }"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Simulador de Fechamento do Ano ({{ props.data.currYear }})</CardTitle>
          <CardDescription>
            Ajuste o ritmo por dia útil restante no mês atual e a estimativa dos meses seguintes
          </CardDescription>
        </CardHeader>
        <CardContent class="flex flex-col gap-4">
          <div v-if="props.data.activeMonth.isPartial" class="flex flex-col gap-1.5">
            <div class="flex items-center justify-between text-xs">
              <span
                >Ritmo nos {{ props.data.activeMonth.steppingDaysRemaining }} dias úteis
                restantes:</span
              >
              <strong class="tabular-nums">{{ fmtBRL(simBdayRate) }} / dia útil</strong>
            </div>
            <input
              v-model.number="simBdayRate"
              type="range"
              min="0"
              max="10000"
              step="50"
              class="w-full accent-primary"
            />
          </div>

          <div v-if="simResult.remainingMonthsCount > 0" class="flex flex-col gap-1.5">
            <div class="flex items-center justify-between text-xs">
              <span>Média p/ {{ simResult.remainingMonthsCount }} mês(es) restante(s):</span>
              <strong class="tabular-nums">{{ fmtBRL(simRestMonthsAvg) }}</strong>
            </div>
            <input
              v-model.number="simRestMonthsAvg"
              type="range"
              min="25000"
              max="100000"
              step="250"
              class="w-full accent-primary"
            />
          </div>

          <div class="rounded-lg border bg-primary/5 p-3 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground"
                >Fechamento {{ props.data.activeMonth.short }}:</span
              >
              <strong class="tabular-nums">{{ fmtBRL(simResult.currMonthSimulated) }}</strong>
            </div>
            <div class="mt-1 flex items-center justify-between">
              <span class="text-muted-foreground">Projeção Total {{ props.data.currYear }}:</span>
              <strong class="text-base text-primary tabular-nums">
                {{ fmtBRL(simResult.projectedYearTotal) }}
              </strong>
            </div>
            <div
              v-if="simResult.vsPrevYear !== null"
              class="mt-1 text-right text-xs text-muted-foreground"
            >
              Variação vs {{ props.data.prevYear }}:
              <strong class="text-foreground">{{ fmtPct(simResult.vsPrevYear) }}</strong>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Audit -->
    <Card>
      <CardHeader>
        <CardTitle>Auditoria Automática da Base Atual</CardTitle>
        <CardDescription
          >Verificação recalculada automaticamente a cada atualização</CardDescription
        >
      </CardHeader>
      <CardContent class="flex flex-col gap-2 text-xs">
        <div class="rounded-lg border bg-muted/30 p-3">
          <strong>Status de conciliação:</strong> {{ props.data.audit.meta.note }}
        </div>
        <div
          v-if="props.data.anomalies.length"
          class="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3"
        >
          <strong
            >Quedas / Estornos diários identificados ({{ props.data.anomalies.length }}):</strong
          >
          <ul class="mt-1 list-inside list-disc text-muted-foreground">
            <li v-for="a in props.data.anomalies.slice(0, 5)" :key="a.date">
              {{ a.date }}: {{ fmtBRL(a.delta) }}
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
