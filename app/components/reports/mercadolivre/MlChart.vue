<script setup lang="ts">
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import type { ComposeOption } from 'echarts/core'
import type { BarSeriesOption, LineSeriesOption, PieSeriesOption } from 'echarts/charts'
import type {
  GridComponentOption,
  LegendComponentOption,
  TooltipComponentOption,
} from 'echarts/components'
import VChart from 'vue-echarts'

const props = withDefaults(
  defineProps<{
    option: MlEChartsOption
    height?: string
  }>(),
  {
    height: '320px',
  },
)

use([
  CanvasRenderer,
  BarChart,
  LineChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
])

export type MlEChartsOption = ComposeOption<
  | BarSeriesOption
  | LineSeriesOption
  | PieSeriesOption
  | GridComponentOption
  | TooltipComponentOption
  | LegendComponentOption
>
</script>

<template>
  <ClientOnly>
    <div class="w-full" :style="{ height: props.height }">
      <VChart :option="props.option" autoresize class="h-full w-full" />
    </div>
    <template #fallback>
      <Skeleton class="w-full rounded-lg" :style="{ height: props.height }" />
    </template>
  </ClientOnly>
</template>
