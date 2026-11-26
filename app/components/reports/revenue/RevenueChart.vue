<script setup lang="ts">
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart } from 'echarts/charts'
import {
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  MarkPointComponent,
  TooltipComponent,
} from 'echarts/components'
import type { ComposeOption } from 'echarts/core'
import type { BarSeriesOption, LineSeriesOption } from 'echarts/charts'
import type {
  GridComponentOption,
  LegendComponentOption,
  MarkLineComponentOption,
  MarkPointComponentOption,
  TooltipComponentOption,
} from 'echarts/components'
import VChart from 'vue-echarts'

const props = withDefaults(
  defineProps<{
    option: RevenueEChartsOption
    height?: string
  }>(),
  {
    height: '320px',
  },
)

const emit = defineEmits<{
  chartClick: [params: unknown]
}>()

use([
  CanvasRenderer,
  BarChart,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  MarkLineComponent,
  MarkPointComponent,
])

export type RevenueEChartsOption = ComposeOption<
  | BarSeriesOption
  | LineSeriesOption
  | GridComponentOption
  | TooltipComponentOption
  | LegendComponentOption
  | MarkLineComponentOption
  | MarkPointComponentOption
>

function onChartClick(params: unknown) {
  emit('chartClick', params)
}
</script>

<template>
  <ClientOnly>
    <div class="w-full" :style="{ height: props.height }">
      <VChart :option="props.option" autoresize class="h-full w-full" @click="onChartClick" />
    </div>
    <template #fallback>
      <Skeleton class="w-full rounded-lg" :style="{ height: props.height }" />
    </template>
  </ClientOnly>
</template>
