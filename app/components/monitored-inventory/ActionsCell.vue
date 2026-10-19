<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { MoreHorizontal, RefreshCw, Trash2 } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Database, StockMonitor } from '~~/shared/types/database.types'

const props = defineProps<{
  monitor: StockMonitor
}>()

const emit = defineEmits<{
  (e: 'refreshed' | 'deleted'): void
}>()

const supabase = useSupabaseClient<Database>()
const isChecking = ref(false)
const isDeleting = ref(false)

async function checkNow() {
  isChecking.value = true

  try {
    const res = await $fetch<{ success: boolean; stock: number; alerted: boolean }>(
      '/api/inventory/check-single',
      {
        method: 'POST',
        body: { id: props.monitor.id },
      },
    )

    if (res.alerted) {
      toast.warning(
        `Alerta disparado! Estoque do SKU "${props.monitor.sku}" está em ${res.stock} un. (Mínimo: ${props.monitor.min_quantity}). Notificação enviada ao Discord.`,
      )
    } else {
      toast.success(
        `Estoque do SKU "${props.monitor.sku}" verificado: ${res.stock} un. (Dentro do limite seguro).`,
      )
    }

    emit('refreshed')
  } catch (err: unknown) {
    console.error('Erro ao verificar estoque:', err)
    const message = err instanceof Error ? err.message : 'Falha na requisição'
    toast.error(`Falha ao verificar estoque: ${message}`)
  } finally {
    isChecking.value = false
  }
}

async function deleteMonitor() {
  if (!confirm(`Deseja realmente remover o monitoramento do SKU "${props.monitor.sku}"?`)) {
    return
  }

  isDeleting.value = true

  try {
    const { error } = await supabase.from('stock_monitors').delete().eq('id', props.monitor.id)

    if (error) {
      toast.error(`Erro ao excluir monitor: ${error.message}`)
      return
    }

    toast.success(`Monitoramento do SKU "${props.monitor.sku}" removido com sucesso.`)
    emit('deleted')
  } catch {
    toast.error('Erro inesperado ao excluir monitor.')
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <div class="flex items-center justify-end gap-1.5">
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button
          variant="ghost"
          size="icon-sm"
          :disabled="isChecking || isDeleting"
          aria-label="Ações do produto"
        >
          <MoreHorizontal data-icon="inline-start" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Ações do produto</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem
            :disabled="isChecking || isDeleting || !monitor.is_active"
            @select="checkNow"
          >
            <RefreshCw data-icon="inline-start" :class="{ 'animate-spin': isChecking }" />
            Verificar estoque
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            :disabled="isChecking || isDeleting"
            @select="deleteMonitor"
          >
            <Trash2 data-icon="inline-start" />
            Excluir monitoramento
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>
