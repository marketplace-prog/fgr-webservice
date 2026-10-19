<script setup lang="ts">
import { AlertCircle, Loader, PlusCircle, RefreshCw, Search } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { getColumns } from '~/components/monitored-inventory/columns'
import DataTable from '~/components/monitored-inventory/data-table.vue'
import MonitoredProductForm from '~/components/monitored-inventory/MonitoredProductForm.vue'
import ResponsiveModal from '~/components/ResponsiveModal.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Database, StockMonitor } from '~~/shared/types/database.types'

const supabase = useSupabaseClient<Database>()
const monitors = ref<StockMonitor[]>([])
const isLoading = ref(true)
const isModalOpen = ref(false)
const searchQuery = ref('')

async function fetchMonitors() {
  isLoading.value = true
  try {
    const { data, error } = await supabase
      .from('stock_monitors')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar monitores:', error)
      toast.error(`Erro ao carregar lista de estoque: ${error.message}`)
      return
    }

    monitors.value = data || []
  } catch (err: unknown) {
    console.error('Erro inesperado ao buscar monitores:', err)
    toast.error('Falha de conexão com o banco de dados.')
  } finally {
    isLoading.value = false
  }
}

const filteredMonitors = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return monitors.value

  return monitors.value.filter(
    (item) => item.sku.toLowerCase().includes(q) || item.name.toLowerCase().includes(q),
  )
})

const columns = computed(() => getColumns(fetchMonitors))

function onProductSaved() {
  isModalOpen.value = false
  fetchMonitors()
}

onMounted(() => {
  fetchMonitors()
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Cabeçalho da Página -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-foreground">Monitoramento de Estoque</h1>
        <p class="text-sm text-muted-foreground">
          Cadastre SKUs para monitorar o estoque disponível e disparar alertas automáticos no
          Discord.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          :disabled="isLoading"
          title="Recarregar lista"
          @click="fetchMonitors"
        >
          <RefreshCw class="size-4" :class="{ 'animate-spin': isLoading }" />
          <span class="hidden sm:inline">Atualizar</span>
        </Button>

        <ResponsiveModal
          v-model:open="isModalOpen"
          title="Cadastrar SKU para Monitoramento"
          description="Informe os dados do produto para que o sistema alerte quando o estoque disponível atingir o limite."
        >
          <template #trigger>
            <Button size="sm">
              <PlusCircle class="size-4" />
              Novo Produto
            </Button>
          </template>

          <MonitoredProductForm @saved="onProductSaved" @cancel="isModalOpen = false" />
        </ResponsiveModal>
      </div>
    </div>

    <!-- Barra de Filtro e Busca -->
    <div class="flex items-center justify-between gap-4">
      <div class="relative w-full max-w-sm">
        <Search class="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          type="search"
          placeholder="Buscar por SKU ou nome..."
          class="pl-8"
        />
      </div>

      <div class="text-xs text-muted-foreground">
        Total cadastrado: <strong>{{ monitors.length }}</strong>
        {{ monitors.length === 1 ? 'item' : 'itens' }}
      </div>
    </div>

    <!-- Tabela ou Estados -->
    <div
      v-if="isLoading && monitors.length === 0"
      class="flex h-48 flex-col items-center justify-center gap-2 rounded-lg border bg-card text-card-foreground"
    >
      <Loader class="size-6 animate-spin text-muted-foreground" />
      <span class="text-sm text-muted-foreground">Carregando produtos monitorados...</span>
    </div>

    <div
      v-else-if="monitors.length === 0"
      class="flex h-48 flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-card p-6 text-center text-card-foreground"
    >
      <AlertCircle class="size-8 text-muted-foreground" />
      <div class="space-y-1">
        <h3 class="text-sm font-semibold">Nenhum SKU monitorado</h3>
        <p class="text-xs text-muted-foreground">
          Comece cadastrando um SKU com estoque mínimo para ser avisado no Discord.
        </p>
      </div>
      <Button size="sm" @click="isModalOpen = true">
        <PlusCircle class="size-4" />
        Adicionar Primeiro Produto
      </Button>
    </div>

    <div v-else class="space-y-4">
      <DataTable :columns="columns" :data="filteredMonitors" />
    </div>
  </div>
</template>
