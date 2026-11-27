<script setup lang="ts">
import {
  AlertTriangle,
  Copy,
  Info,
  Link2,
  RefreshCw,
  ShieldCheck,
  Store,
  TrendingUp,
  Unplug,
} from '@lucide/vue'
import { toast } from 'vue-sonner'
import type { MlDashboardRange, MlDashboardResponse } from '~~/shared/types/mercadolivre'
import {
  formatLogisticLabel,
  formatMlLastSyncedAt,
  formatMlSyncStageError,
  getReputationLabel,
} from '~~/shared/utils/mercadolivre'
import { fmtBRL, fmtCompactBRL } from '~~/shared/utils/revenue'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { MlEChartsOption } from '@/components/reports/mercadolivre/MlChart.vue'
import MlChart from '@/components/reports/mercadolivre/MlChart.vue'
import MlProductsTable from '@/components/reports/mercadolivre/MlProductsTable.vue'

definePageMeta({
  title: 'Dashboard Gerencial — Mercado Livre',
})

const route = useRoute()
const range = ref<MlDashboardRange>('30d')
const customFrom = ref('')
const customTo = ref('')
const syncing = ref(false)
const connecting = ref(false)
const disconnecting = ref(false)

const queryParams = computed(() => {
  const params: Record<string, string> = { range: range.value }
  if (range.value === 'custom' && customFrom.value && customTo.value) {
    params.from = customFrom.value
    params.to = customTo.value
  }
  return params
})

const { data, pending, error, refresh } = await useFetch<MlDashboardResponse>(
  '/api/mercadolivre/dashboard',
  {
    query: queryParams,
  },
)

onMounted(() => {
  if (route.query.connected === '1') {
    toast.success('Conta do Mercado Livre conectada e sincronizada!')
  } else if (typeof route.query.oauth_error === 'string' && route.query.oauth_error) {
    toast.error(`Erro ao conectar Mercado Livre: ${route.query.oauth_error}`)
  }

  if (connection.value?.lastSyncStatus === 'partial') {
    void handleSync(90)
  }
})

const connection = computed(() => data.value?.connection ?? null)
const dashboard = computed(() => data.value?.dashboard ?? null)
const lastSyncedAtLabel = computed(() => formatMlLastSyncedAt(connection.value?.lastSyncedAt))

const reputationInfo = computed(() =>
  getReputationLabel(connection.value?.reputationLevelId, connection.value?.powerSellerStatus),
)

const reputationBadgeClass = computed(() => {
  switch (reputationInfo.value.tone) {
    case 'green':
      return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
    case 'yellow':
      return 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
    case 'orange':
      return 'bg-orange-500/15 text-orange-700 dark:text-orange-400'
    case 'red':
      return 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
    default:
      return 'bg-muted text-muted-foreground'
  }
})

const dailyChartOption = computed<MlEChartsOption>(() => {
  const series = dashboard.value?.dailySeries || []
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    legend: {
      bottom: 0,
    },
    grid: { left: 16, right: 20, top: 24, bottom: 42, containLabel: true },
    xAxis: {
      type: 'category',
      data: series.map((d) => d.label),
      axisLine: { lineStyle: { color: '#71717a', opacity: 0.3 } },
    },
    yAxis: [
      {
        type: 'value',
        axisLabel: { formatter: (v: number) => fmtCompactBRL(v) },
        splitLine: { lineStyle: { type: 'dashed', opacity: 0.25 } },
      },
      {
        type: 'value',
        name: 'Pedidos',
        minInterval: 1,
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: 'Receita Bruta',
        type: 'bar',
        data: series.map((d) => Number(d.grossRevenue.toFixed(2))),
        itemStyle: { color: '#035096', borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 22,
      },
      {
        name: 'Receita Líquida',
        type: 'bar',
        data: series.map((d) => Number(d.netRevenue.toFixed(2))),
        itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 22,
      },
      {
        name: 'Pedidos',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: series.map((d) => d.ordersCount),
        itemStyle: { color: '#fe3e00' },
      },
    ],
  }
})

const logisticChartOption = computed<MlEChartsOption>(() => {
  const breakdown = dashboard.value?.logisticBreakdown || []
  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} pedidos ({d}%)',
    },
    legend: {
      bottom: 0,
    },
    series: [
      {
        name: 'Logística',
        type: 'pie',
        radius: ['46%', '72%'],
        center: ['50%', '44%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        data: breakdown.map((b) => ({
          name: b.label,
          value: b.ordersCount,
        })),
      },
    ],
  }
})

async function handleConnect() {
  connecting.value = true
  try {
    const res = await $fetch<{ url: string }>('/api/mercadolivre/auth-url')
    window.location.href = res.url
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao iniciar OAuth do Mercado Livre.'
    toast.error(msg)
    connecting.value = false
  }
}

async function handleSync(daysBackOverride?: number) {
  syncing.value = true
  let stage: 'prepare' | 'sync' | 'refresh' = 'prepare'
  try {
    const daysBack = daysBackOverride ?? (range.value === '90d' ? 90 : 60)
    const dateFrom = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString()
    let offset = 0
    let ordersSynced = 0
    let itemsSynced = 0
    let adsSupported = false

    while (true) {
      stage = 'sync'
      const result = await $fetch<{
        ordersSynced: number
        nextOrderOffset: number | null
        itemsSynced: number
        adsSupported: boolean
      }>('/api/mercadolivre/sync', {
        method: 'POST',
        body: { daysBack, dateFrom, offset },
      })

      ordersSynced += result.ordersSynced
      itemsSynced += result.itemsSynced
      if (offset === 0) adsSupported = result.adsSupported
      if (result.nextOrderOffset === null) break
      offset = result.nextOrderOffset
    }

    stage = 'refresh'
    await refresh()
    toast.success(`Sincronizado: ${ordersSynced} pedidos e ${itemsSynced} anúncios atualizados.`)
    if (!adsSupported) {
      toast.warning(
        'Não foi possível obter dados do Mercado Ads. Verifique a autorização e as campanhas Product Ads da conta.',
      )
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Falha ao sincronizar com Mercado Livre.'
    const stack = err instanceof Error ? err.stack?.split('\n').slice(1).join('\n') : null
    console.error('[ML Sync] Falha no cliente:', {
      stage,
      stack: stack ?? 'Exceção sem stack.',
    })
    toast.error(formatMlSyncStageError(stage, msg))
  } finally {
    syncing.value = false
  }
}

async function handleDisconnect() {
  disconnecting.value = true
  try {
    await $fetch('/api/mercadolivre/disconnect', { method: 'POST' })
    await refresh()
    toast.success('Conta do Mercado Livre desconectada.')
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro ao desconectar.'
    toast.error(msg)
  } finally {
    disconnecting.value = false
  }
}

async function copyRedirectUri() {
  if (!connection.value?.redirectUri) return
  try {
    await navigator.clipboard.writeText(connection.value.redirectUri)
    toast.success('Redirect URI copiada!')
  } catch {
    toast.error('Não foi possível copiar a Redirect URI.')
  }
}

function fmtPct(val: number | null | undefined, digits = 1): string {
  if (val === null || val === undefined || Number.isNaN(val)) return '—'
  return `${val.toFixed(digits)}%`
}
</script>

<template>
  <div class="flex flex-col gap-5 py-4">
    <!-- Header -->
    <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div class="flex flex-wrap items-center gap-2">
          <h1 class="text-2xl font-bold tracking-tight">Dashboard — Mercado Livre</h1>
          <Badge v-if="connection?.connected" variant="outline" class="gap-1">
            <Store class="size-3.5" />
            {{ connection.nickname }}
          </Badge>
          <Badge v-if="connection?.connected" variant="secondary" :class="reputationBadgeClass">
            <ShieldCheck class="mr-1 size-3.5" />
            {{ reputationInfo.label }}
          </Badge>
        </div>
        <p class="text-sm text-muted-foreground">
          <template v-if="connection?.connected && lastSyncedAtLabel">
            Última sincronização:
            {{ lastSyncedAtLabel }}
          </template>
          <template v-else-if="connection?.connected">
            Conta conectada. Clique em sincronizar para carregar pedidos e anúncios.
          </template>
          <template v-else>
            Conecte sua conta do Mercado Livre para acompanhar receita líquida, taxas, logística e
            anúncios.
          </template>
        </p>
      </div>

      <div v-if="connection?.connected" class="flex flex-wrap items-center gap-2">
        <Button size="sm" :disabled="syncing" @click="handleSync">
          <RefreshCw class="mr-1.5 size-4" :class="{ 'animate-spin': syncing }" />
          {{ syncing ? 'Sincronizando...' : 'Sincronizar agora' }}
        </Button>
        <Button size="sm" variant="outline" :disabled="disconnecting" @click="handleDisconnect">
          <Unplug class="mr-1.5 size-4" />
          Desconectar
        </Button>
      </div>
    </div>

    <!-- Error -->
    <Card v-if="error" class="border-destructive/40 bg-destructive/5">
      <CardHeader>
        <CardTitle class="text-base text-destructive">Erro ao carregar dados</CardTitle>
        <CardDescription>{{ error.message }}</CardDescription>
      </CardHeader>
    </Card>

    <!-- Loading -->
    <div v-else-if="pending && !data" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Skeleton v-for="i in 6" :key="i" class="h-28 w-full rounded-xl" />
    </div>

    <!-- Not Connected State -->
    <Card v-else-if="!connection?.connected" class="max-w-2xl">
      <CardHeader>
        <CardTitle class="flex items-center gap-2 text-lg">
          <Link2 class="size-5 text-primary" />
          Conectar aplicativo do Mercado Livre
        </CardTitle>
        <CardDescription>
          Autorize o acesso via OAuth 2.0 para sincronizar pedidos, comissões, fretes, anúncios e
          reputação automaticamente.
        </CardDescription>
      </CardHeader>
      <CardContent class="flex flex-col gap-4">
        <div
          v-if="!connection?.oauthConfigured"
          class="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300"
        >
          Configure as variáveis <code>ML_CLIENT_ID</code> e <code>ML_CLIENT_SECRET</code> no
          ambiente (Vercel / <code>.env</code>) antes de autorizar a conta.
        </div>

        <div class="rounded-lg border bg-muted/40 p-3 text-xs">
          <div class="mb-1 font-medium text-foreground">
            Redirect URI configurada no aplicativo:
          </div>
          <div class="flex items-center justify-between gap-2">
            <code class="truncate text-muted-foreground">{{ connection?.redirectUri }}</code>
            <Button size="sm" variant="ghost" @click="copyRedirectUri">
              <Copy class="size-3.5" />
            </Button>
          </div>
        </div>

        <div>
          <Button :disabled="connecting || !connection?.oauthConfigured" @click="handleConnect">
            <Link2 class="mr-1.5 size-4" />
            {{ connecting ? 'Redirecionando...' : 'Conectar com Mercado Livre' }}
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Connected Dashboard -->
    <template v-else-if="dashboard">
      <!-- Period Filter -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="inline-flex flex-wrap rounded-lg border bg-muted p-1">
          <button
            v-for="opt in [
              { id: '7d', label: '7 dias' },
              { id: '30d', label: '30 dias' },
              { id: 'month', label: 'Mês atual' },
              { id: '90d', label: '90 dias' },
              { id: 'custom', label: 'Personalizado' },
            ]"
            :key="opt.id"
            type="button"
            class="rounded-md px-3 py-1 text-xs font-medium transition-colors"
            :class="
              range === opt.id ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground'
            "
            @click="range = opt.id as MlDashboardRange"
          >
            {{ opt.label }}
          </button>
        </div>

        <div v-if="range === 'custom'" class="flex flex-wrap items-center gap-2">
          <Input v-model="customFrom" type="date" class="h-8 w-36 text-xs" />
          <span class="text-xs text-muted-foreground">até</span>
          <Input v-model="customTo" type="date" class="h-8 w-36 text-xs" />
        </div>

        <Badge variant="outline" class="tabular-nums">
          Período: {{ dashboard.dateFrom }} → {{ dashboard.dateTo }}
        </Badge>
      </div>

      <!-- KPIs -->
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader class="pb-2">
            <div class="flex items-center gap-1">
              <CardDescription>Receita Bruta (Pedidos Pagos)</CardDescription>
              <Tooltip>
                <TooltipTrigger as-child>
                  <button
                    type="button"
                    class="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    aria-label="Sobre receita bruta"
                  >
                    <Info class="size-3.5" aria-hidden="true" />
                  </button>
                </TooltipTrigger>
                <TooltipContent class="max-w-72 text-left">
                  Soma os valores dos pedidos com status “pago” no período selecionado. Pedidos
                  cancelados ficam fora. O painel do Mercado Livre pode usar filtros ou datas de
                  referência diferentes.
                </TooltipContent>
              </Tooltip>
            </div>
            <CardTitle class="text-2xl tabular-nums">
              {{ fmtBRL(dashboard.kpis.grossRevenue) }}
            </CardTitle>
          </CardHeader>
          <CardContent class="text-xs text-muted-foreground">
            {{ dashboard.kpis.paidOrdersCount }} pedidos pagos ·
            {{ dashboard.kpis.cancelledOrdersCount }} cancelados
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="pb-2">
            <div class="flex items-center gap-1">
              <CardDescription>Receita Líquida Estimada</CardDescription>
              <Tooltip>
                <TooltipTrigger as-child>
                  <button
                    type="button"
                    class="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    aria-label="Sobre receita líquida estimada"
                  >
                    <Info class="size-3.5" aria-hidden="true" />
                  </button>
                </TooltipTrigger>
                <TooltipContent class="max-w-72 text-left">
                  Estimativa dos pedidos pagos após comissão, frete atribuído ao vendedor e gasto em
                  Product Ads. Não representa o saldo nem o repasse oficial do Mercado Livre.
                </TooltipContent>
              </Tooltip>
            </div>
            <CardTitle class="text-2xl text-emerald-600 tabular-nums dark:text-emerald-400">
              {{ fmtBRL(dashboard.kpis.netRevenue) }}
            </CardTitle>
          </CardHeader>
          <CardContent class="flex items-center justify-between text-xs text-muted-foreground">
            <span>Pós-comissão, frete e ADS</span>
            <Badge
              variant="secondary"
              class="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
            >
              Margem {{ fmtPct(dashboard.kpis.netMarginPct) }}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="pb-2">
            <div class="flex items-center gap-1">
              <CardDescription>Deduções (Comissão + Frete)</CardDescription>
              <Tooltip>
                <TooltipTrigger as-child>
                  <button
                    type="button"
                    class="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    aria-label="Sobre deduções"
                  >
                    <Info class="size-3.5" aria-hidden="true" />
                  </button>
                </TooltipTrigger>
                <TooltipContent class="max-w-72 text-left">
                  Soma somente as comissões e os custos de frete atribuídos aos pedidos pagos na
                  sincronização. Outros ajustes, estornos ou tarifas podem não estar incluídos.
                </TooltipContent>
              </Tooltip>
            </div>
            <CardTitle class="text-2xl tabular-nums">
              {{ fmtBRL(dashboard.kpis.totalFees + dashboard.kpis.totalShippingCost) }}
            </CardTitle>
          </CardHeader>
          <CardContent class="text-xs text-muted-foreground">
            Comissão: {{ fmtBRL(dashboard.kpis.totalFees) }} · Frete:
            {{ fmtBRL(dashboard.kpis.totalShippingCost) }}
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="pb-2">
            <div class="flex items-center gap-1">
              <CardDescription>Ticket Médio</CardDescription>
              <Tooltip>
                <TooltipTrigger as-child>
                  <button
                    type="button"
                    class="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    aria-label="Sobre ticket médio"
                  >
                    <Info class="size-3.5" aria-hidden="true" />
                  </button>
                </TooltipTrigger>
                <TooltipContent class="max-w-72 text-left">
                  Receita bruta dos pedidos pagos dividida pela quantidade desses pedidos no
                  período. É uma média por pedido, não por produto.
                </TooltipContent>
              </Tooltip>
            </div>
            <CardTitle class="text-2xl tabular-nums">
              {{ fmtBRL(dashboard.kpis.averageTicket) }}
            </CardTitle>
          </CardHeader>
          <CardContent class="text-xs text-muted-foreground">
            Baseado em {{ dashboard.kpis.paidOrdersCount }} vendas confirmadas
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="pb-2">
            <div class="flex items-center gap-1">
              <CardDescription>Mercado Ads (Product Ads)</CardDescription>
              <Tooltip>
                <TooltipTrigger as-child>
                  <button
                    type="button"
                    class="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    aria-label="Sobre métricas do Mercado Ads"
                  >
                    <Info class="size-3.5" aria-hidden="true" />
                  </button>
                </TooltipTrigger>
                <TooltipContent class="max-w-72 text-left">
                  Mostra o gasto e a receita atribuída a Product Ads. ACOS é gasto dividido pela
                  receita atribuída; ROAS é receita atribuída dividida pelo gasto. A sincronização
                  consulta no máximo 60 dias, então a cobertura pode ser menor que o período do
                  relatório.
                </TooltipContent>
              </Tooltip>
            </div>
            <CardTitle class="text-2xl tabular-nums">
              {{ dashboard.kpis.hasAdsData ? fmtBRL(dashboard.kpis.adsCost) : 'Sem dados' }}
            </CardTitle>
          </CardHeader>
          <CardContent class="text-xs text-muted-foreground">
            <template v-if="dashboard.kpis.hasAdsData">
              ACOS: {{ fmtPct(dashboard.kpis.adsAcos) }} · ROAS:
              {{ dashboard.kpis.adsRoas ? `${dashboard.kpis.adsRoas.toFixed(2)}x` : '—' }}
            </template>
            <template v-else>
              Escopo de publicidade não ativo ou sem investimento no período
            </template>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="pb-2">
            <div class="flex items-center gap-1">
              <CardDescription>Saúde da Conta</CardDescription>
              <Tooltip>
                <TooltipTrigger as-child>
                  <button
                    type="button"
                    class="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    aria-label="Sobre saúde da conta"
                  >
                    <Info class="size-3.5" aria-hidden="true" />
                  </button>
                </TooltipTrigger>
                <TooltipContent class="max-w-72 text-left">
                  Vendas e taxas de reclamações e atrasos vêm do perfil de reputação do vendedor no
                  Mercado Livre. O total de vendas não usa o filtro de datas deste relatório.
                </TooltipContent>
              </Tooltip>
            </div>
            <CardTitle class="flex items-center gap-2 text-lg">
              <TrendingUp class="size-5 text-primary" />
              {{ connection.reputationMetrics.sales60d ?? 0 }} vendas
            </CardTitle>
          </CardHeader>
          <CardContent class="text-xs text-muted-foreground">
            Reclamações:
            {{ fmtPct((connection.reputationMetrics.claimsRate ?? 0) * 100, 2) }} · Atrasos:
            {{ fmtPct((connection.reputationMetrics.delayedRate ?? 0) * 100, 2) }}
          </CardContent>
        </Card>
      </div>

      <!-- Charts -->
      <div class="grid gap-4 lg:grid-cols-3">
        <Card class="lg:col-span-2">
          <CardHeader>
            <CardTitle class="text-base">Evolução Diária: Bruto vs. Líquido</CardTitle>
            <CardDescription>Comparativo diário de faturamento e volume de pedidos</CardDescription>
          </CardHeader>
          <CardContent>
            <MlChart :option="dailyChartOption" height="320px" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle class="text-base">Modalidade Logística</CardTitle>
            <CardDescription>Distribuição de pedidos por tipo de envio</CardDescription>
          </CardHeader>
          <CardContent>
            <MlChart
              v-if="dashboard.logisticBreakdown.length"
              :option="logisticChartOption"
              height="320px"
            />
            <div v-else class="flex h-80 items-center justify-center text-sm text-muted-foreground">
              Sem pedidos com logística no período.
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Top Products Table -->
      <Card>
        <CardHeader>
          <CardTitle class="text-base">Ranking de Produtos / Anúncios</CardTitle>
          <CardDescription>
            Produtos ordenados por receita bruta no período selecionado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MlProductsTable :products="dashboard.topProducts" />
        </CardContent>
      </Card>

      <!-- Attention Items -->
      <Card v-if="dashboard.attentionItems.length">
        <CardHeader>
          <CardTitle class="flex items-center gap-2 text-base">
            <AlertTriangle class="size-4 text-amber-500" />
            Atenção de Estoque &amp; Anúncios Pausados ({{ dashboard.attentionItems.length }})
          </CardTitle>
          <CardDescription>
            Anúncios ativos com 5 ou menos unidades disponíveis ou anúncios pausados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <div
              v-for="item in dashboard.attentionItems.slice(0, 9)"
              :key="item.item_id"
              class="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm"
            >
              <div class="min-w-0">
                <div class="truncate font-medium" :title="item.title">{{ item.title }}</div>
                <div class="text-xs text-muted-foreground">
                  {{ item.sku || item.item_id }} · {{ formatLogisticLabel(item.logistic_type) }}
                </div>
              </div>
              <Badge
                variant="secondary"
                :class="
                  item.status === 'paused'
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                "
              >
                {{ item.status === 'paused' ? 'Pausado' : `${item.available_quantity} un.` }}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </template>
  </div>
</template>
