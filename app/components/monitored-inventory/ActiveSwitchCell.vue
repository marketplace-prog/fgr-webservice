<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { Switch } from '@/components/ui/switch'
import type { Database, StockMonitor } from '~~/shared/types/database.types'

const props = defineProps<{
  monitor: StockMonitor
}>()

const emit = defineEmits<{
  (e: 'updated', isActive: boolean): void
}>()

const supabase = useSupabaseClient<Database>()
const isActive = ref<boolean>(props.monitor.is_active)
const isUpdating = ref(false)

async function onToggle(checked: boolean) {
  isUpdating.value = true
  isActive.value = checked

  try {
    const { error } = await supabase
      .from('stock_monitors')
      .update({ is_active: checked, updated_at: new Date().toISOString() })
      .eq('id', props.monitor.id)

    if (error) {
      isActive.value = !checked
      toast.error(`Erro ao atualizar status do monitor: ${error.message}`)
      return
    }

    toast.info(
      checked
        ? `Monitoramento do SKU "${props.monitor.sku}" ativado.`
        : `Monitoramento do SKU "${props.monitor.sku}" pausado.`,
    )
    emit('updated', checked)
  } catch {
    isActive.value = !checked
    toast.error('Erro inesperado ao alterar status do monitor.')
  } finally {
    isUpdating.value = false
  }
}
</script>

<template>
  <div class="flex items-center gap-2">
    <Switch :checked="isActive" :disabled="isUpdating" @update:checked="onToggle" />
    <span
      class="text-xs font-medium"
      :class="isActive ? 'text-foreground' : 'text-muted-foreground'"
    >
      {{ isActive ? 'Ativo' : 'Pausado' }}
    </span>
  </div>
</template>
