<script setup lang="ts">
import { Download, Eye, EyeOff, Upload } from '@lucide/vue'
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from 'reka-ui'
import { toast } from 'vue-sonner'
import type { RevenueMode, RevenueStore, RevenueTabId } from '~~/shared/types/revenue'
import {
  buildConsolidatedRevenueCsv,
  buildRevenueDashboardData,
  fmtBRL,
  getRevenueModeModel,
} from '~~/shared/utils/revenue'
import RevenueImportModal from '@/components/reports/revenue/RevenueImportModal.vue'
import RevenueTabAverage from '@/components/reports/revenue/RevenueTabAverage.vue'
import RevenueTabDaily from '@/components/reports/revenue/RevenueTabDaily.vue'
import RevenueTabOverview from '@/components/reports/revenue/RevenueTabOverview.vue'
import RevenueTabVariations from '@/components/reports/revenue/RevenueTabVariations.vue'
import RevenueTabYearly from '@/components/reports/revenue/RevenueTabYearly.vue'

definePageMeta({
  title: 'Faturamento — Canal Site',
})

const mode = ref<RevenueMode>('dayParity')
const activeTab = ref<RevenueTabId>('overview')
const showLabels = ref(true)
const importModalOpen = ref(false)

const {
  data: store,
  pending,
  error,
} = await useFetch<RevenueStore>('/api/reports/revenue', {
  query: { channel: 'site' },
})

const dashboardData = computed(() => (store.value ? buildRevenueDashboardData(store.value) : null))
const modeModel = computed(() =>
  dashboardData.value ? getRevenueModeModel(dashboardData.value, mode.value) : null,
)

function handleStoreImported(nextStore: RevenueStore) {
  store.value = nextStore
}

function handleExportCsv() {
  if (!dashboardData.value || !modeModel.value) return
  const csv = buildConsolidatedRevenueCsv(dashboardData.value, modeModel.value)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `faturamento-consolidado-${dashboardData.value.currYear}.csv`
  a.click()
  URL.revokeObjectURL(url)
  toast.success('CSV consolidado exportado')
}
</script>

<template>
  <div class="flex flex-col gap-5 py-4">
    <!-- Header -->
    <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div class="flex flex-wrap items-center gap-2">
          <h1 class="text-2xl font-bold tracking-tight">
            Faturamento — Canal {{ dashboardData?.channel || 'Site' }}
          </h1>
          <Badge v-if="dashboardData" variant="outline" class="tabular-nums">
            Ref: {{ dashboardData.referenceDate }}
          </Badge>
        </div>
        <p class="text-sm text-muted-foreground">
          {{ store?.meta.note || 'Carregando dados de faturamento...' }}
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <Button size="sm" @click="importModalOpen = true">
          <Upload class="mr-1.5 size-4" />
          Importar CSV
        </Button>
        <Button size="sm" variant="outline" :disabled="!dashboardData" @click="handleExportCsv">
          <Download class="mr-1.5 size-4" />
          Exportar Consolidado
        </Button>
        <Button
          size="sm"
          :variant="showLabels ? 'secondary' : 'outline'"
          @click="showLabels = !showLabels"
        >
          <Eye v-if="showLabels" class="mr-1.5 size-4" />
          <EyeOff v-else class="mr-1.5 size-4" />
          Valores
        </Button>
      </div>
    </div>

    <!-- Error / Loading -->
    <Card v-if="error" class="border-destructive/40 bg-destructive/5">
      <CardHeader>
        <CardTitle class="text-base text-destructive">Erro ao carregar relatório</CardTitle>
        <CardDescription>{{ error.message }}</CardDescription>
      </CardHeader>
    </Card>

    <div v-else-if="pending && !dashboardData" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Skeleton v-for="i in 4" :key="i" class="h-28 w-full rounded-xl" />
    </div>

    <!-- Main Dashboard -->
    <template v-else-if="dashboardData && modeModel && store">
      <!-- Mode Filter Bar -->
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-xs font-medium text-muted-foreground">
          Critério {{ dashboardData.activeMonth.full }}/{{ dashboardData.currYear.slice(2) }}:
        </span>
        <div class="inline-flex flex-wrap rounded-lg border bg-muted p-1">
          <button
            type="button"
            class="rounded-md px-3 py-1 text-xs font-medium transition-colors"
            :class="
              mode === 'closed'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground'
            "
            @click="mode = 'closed'"
          >
            Fechados
          </button>
          <button
            type="button"
            class="rounded-md px-3 py-1 text-xs font-medium transition-colors"
            :class="
              mode === 'dayParity'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground'
            "
            @click="mode = 'dayParity'"
          >
            Dia {{ dashboardData.activeMonth.currentDay }} (Paridade)
          </button>
          <button
            type="button"
            class="rounded-md px-3 py-1 text-xs font-medium transition-colors"
            :class="
              mode === 'projected'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground'
            "
            @click="mode = 'projected'"
          >
            Com Projeção ({{ fmtBRL(dashboardData.activeMonth.projectedEnd) }})
          </button>
        </div>
      </div>

      <!-- 5 Tabs -->
      <TabsRoot v-model="activeTab" class="flex flex-col gap-4">
        <TabsList
          class="inline-flex w-full flex-wrap gap-1 rounded-lg border bg-muted p-1 lg:w-fit"
        >
          <TabsTrigger
            value="overview"
            class="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
          >
            Visão Geral {{ dashboardData.currYear }}
          </TabsTrigger>
          <TabsTrigger
            value="yearly"
            class="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
          >
            Comparativo Anual
          </TabsTrigger>
          <TabsTrigger
            value="average"
            class="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
          >
            Vs. Média
          </TabsTrigger>
          <TabsTrigger
            value="variations"
            class="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
          >
            % Mês e Ano Anterior
          </TabsTrigger>
          <TabsTrigger
            value="daily"
            class="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
          >
            Ritmo Diário (1–31)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <RevenueTabOverview
            :data="dashboardData"
            :model="modeModel"
            :mode="mode"
            :show-labels="showLabels"
          />
        </TabsContent>

        <TabsContent value="yearly">
          <RevenueTabYearly :data="dashboardData" :model="modeModel" :show-labels="showLabels" />
        </TabsContent>

        <TabsContent value="average">
          <RevenueTabAverage :data="dashboardData" :model="modeModel" :show-labels="showLabels" />
        </TabsContent>

        <TabsContent value="variations">
          <RevenueTabVariations
            :data="dashboardData"
            :model="modeModel"
            :show-labels="showLabels"
          />
        </TabsContent>

        <TabsContent value="daily">
          <RevenueTabDaily :data="dashboardData" :model="modeModel" />
        </TabsContent>
      </TabsRoot>

      <RevenueImportModal
        v-model:open="importModalOpen"
        :store="store"
        :data="dashboardData"
        @imported="handleStoreImported"
      />
    </template>
  </div>
</template>
