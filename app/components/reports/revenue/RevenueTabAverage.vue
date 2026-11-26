<script setup lang="ts">
import type { RevenueDashboardData, RevenueModeModel } from '~~/shared/types/revenue'
import { fmtBRL, fmtCompactBRL, fmtPct, fmtSignedBRL, safePct } from '~~/shared/utils/revenue'
import type { RevenueEChartsOption } from './RevenueChart.vue'
import RevenueChart from './RevenueChart.vue'

const props = defineProps<{
  data: RevenueDashboardData
  model: RevenueModeModel
  showLabels: boolean
}>()

const avgUnit = ref<'pct' | 'brl'>('pct')
const avgSort = ref<'chrono' | 'desc'>('chrono')
const customTargetInput = ref<string>('')

const targetReference = computed(() => {
  const parsed = Number(customTargetInput.value.replace(',', '.'))
  if (Number.isFinite(parsed) && parsed > 0) return parsed
  return props.model.statsCurr.mean
})

const adherenceRows = computed(() => {
  const base = props.model.rows
    .filter((r) => r.vCurr !== null)
    .map((r) => {
      const refVal = r.isActive && !customTargetInput.value ? r.avgRef : targetReference.value
      const diff = (r.vCurr ?? 0) - refVal
      const pct = safePct(r.vCurr, refVal) ?? 0
      const index100 = refVal > 0 ? ((r.vCurr ?? 0) / refVal) * 100 : 0
      return { ...r, refVal, diff, pct, index100 }
    })

  if (avgSort.value === 'desc') {
    return [...base].sort((a, b) => b.pct - a.pct)
  }
  return base
})

const aboveCount = computed(() => adherenceRows.value.filter((r) => r.diff >= 0).length)

const avgChartOption = computed<RevenueEChartsOption>(() => {
  const categories = adherenceRows.value.map((r) => r.mShort)
  const values = adherenceRows.value.map((r) => {
    const val = avgUnit.value === 'pct' ? Number(r.pct.toFixed(1)) : Math.round(r.diff)
    return {
      value: val,
      itemStyle: {
        color: val >= 0 ? '#10b981' : '#e11d48',
        borderRadius: val >= 0 ? [4, 4, 0, 0] : [0, 0, 4, 4],
      },
    }
  })

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      valueFormatter: (v) =>
        typeof v === 'number' ? (avgUnit.value === 'pct' ? fmtPct(v) : fmtSignedBRL(v)) : '—',
    },
    grid: { left: 16, right: 16, top: 24, bottom: 28, containLabel: true },
    xAxis: { type: 'category', data: categories },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (v: number) => (avgUnit.value === 'pct' ? `${v}%` : fmtCompactBRL(v)),
      },
      splitLine: { lineStyle: { type: 'dashed', opacity: 0.25 } },
    },
    series: [
      {
        name: avgUnit.value === 'pct' ? 'Desvio (%)' : 'Desvio (R$)',
        type: 'bar',
        data: values,
        barMaxWidth: 38,
        label: {
          show: props.showLabels,
          position: 'top',
          fontSize: 10,
          formatter: (p) =>
            typeof p.value === 'number'
              ? avgUnit.value === 'pct'
                ? fmtPct(p.value)
                : fmtCompactBRL(p.value)
              : '',
        },
      },
    ],
  }
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="grid gap-3 sm:grid-cols-3">
      <Card>
        <CardHeader class="pb-2">
          <CardDescription>Referência Atual</CardDescription>
          <CardTitle class="text-2xl tabular-nums">{{ fmtBRL(targetReference) }}</CardTitle>
        </CardHeader>
        <CardContent class="text-xs text-muted-foreground">
          {{ customTargetInput ? 'Meta personalizada' : `Média mensal ${props.data.currYear}` }}
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardDescription>Meses Acima da Referência</CardDescription>
          <CardTitle class="text-2xl tabular-nums">
            {{ aboveCount }} / {{ adherenceRows.length }}
          </CardTitle>
        </CardHeader>
        <CardContent class="text-xs text-muted-foreground">
          Abaixo da referência: {{ adherenceRows.length - aboveCount }} meses
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardDescription>Meta Customizada (opcional)</CardDescription>
          <div class="pt-1">
            <Input v-model="customTargetInput" type="number" placeholder="Ex: 55000" class="h-8" />
          </div>
        </CardHeader>
        <CardContent class="text-xs text-muted-foreground">
          Deixe vazio para usar a média do ano
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Desvio Mensal em Relação à Média / Meta</CardTitle>
          <CardDescription>
            Quanto cada mês ficou acima (verde) ou abaixo (vermelho) da referência selecionada
          </CardDescription>
        </div>
        <div class="flex flex-wrap gap-2">
          <div class="inline-flex rounded-lg border bg-muted p-0.5">
            <button
              type="button"
              class="rounded-md px-2.5 py-1 text-xs font-medium"
              :class="avgUnit === 'pct' ? 'bg-background shadow-xs' : 'text-muted-foreground'"
              @click="avgUnit = 'pct'"
            >
              % Desvio
            </button>
            <button
              type="button"
              class="rounded-md px-2.5 py-1 text-xs font-medium"
              :class="avgUnit === 'brl' ? 'bg-background shadow-xs' : 'text-muted-foreground'"
              @click="avgUnit = 'brl'"
            >
              R$ Diferença
            </button>
          </div>
          <Button
            size="sm"
            variant="outline"
            @click="avgSort = avgSort === 'chrono' ? 'desc' : 'chrono'"
          >
            {{ avgSort === 'chrono' ? 'Ordenar por Desvio' : 'Ordem Cronológica' }}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <RevenueChart :option="avgChartOption" height="330px" />
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Tabela de Aderência à Média / Meta</CardTitle>
        <CardDescription>
          Diferença em Reais, percentual acima/abaixo e Índice Base 100 (100,0 = referência)
        </CardDescription>
      </CardHeader>
      <CardContent class="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mês</TableHead>
              <TableHead class="text-right">Realizado</TableHead>
              <TableHead class="text-right">Referência</TableHead>
              <TableHead class="text-right">Diferença (R$)</TableHead>
              <TableHead class="text-right">Desvio (%)</TableHead>
              <TableHead class="text-right">Base 100</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="r in adherenceRows" :key="r.mShort">
              <TableCell class="font-medium">{{ r.mFull }}</TableCell>
              <TableCell class="text-right tabular-nums">{{ fmtBRL(r.vCurr) }}</TableCell>
              <TableCell class="text-right tabular-nums">{{ fmtBRL(r.refVal) }}</TableCell>
              <TableCell
                class="text-right font-medium tabular-nums"
                :class="
                  r.diff >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                "
              >
                {{ fmtSignedBRL(r.diff) }}
              </TableCell>
              <TableCell class="text-right tabular-nums">{{ fmtPct(r.pct) }}</TableCell>
              <TableCell class="text-right font-mono tabular-nums">
                {{ r.index100.toFixed(1).replace('.', ',') }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
</template>
