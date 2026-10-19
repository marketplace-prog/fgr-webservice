<script setup lang="ts">
import { ref, watch } from 'vue'
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

watch(
  () => props.monitor.is_active,
  (value) => {
    isActive.value = value
  },
)

async function onToggle(checked: boolean) {
  const previousValue = isActive.value
  isUpdating.value = true
  isActive.value = checked

  try {
    const { data, error } = await supabase
      .from('stock_monitors')
      .update({ is_active: checked, updated_at: new Date().toISOString() })
      .eq('id', props.monitor.id)
      .select('id, is_active')
      .maybeSingle()

    if (error) {
      isActive.value = previousValue
      toast.error(`Erro ao atualizar status do monitor: ${error.message}`)
      return
    }

    if (!data) {
      isActive.value = previousValue
      toast.error('Nenhuma alteração foi salva. Verifique suas permissões e tente novamente.')
      return
    }

    isActive.value = data.is_active
    toast.info(
      data.is_active
        ? `Monitoramento do SKU "${props.monitor.sku}" ativado.`
        : `Monitoramento do SKU "${props.monitor.sku}" pausado.`,
    )
    emit('updated', data.is_active)
  } catch {
    isActive.value = previousValue
    toast.error('Erro inesperado ao alterar status do monitor.')
  } finally {
    isUpdating.value = false
  }
}
</script>

<template>
  <div class="flex items-center gap-2">
    <Switch :model-value="isActive" :disabled="isUpdating" @update:model-value="onToggle" />
    <span
      class="text-xs font-medium"
      :class="isActive ? 'text-foreground' : 'text-muted-foreground'"
    >
      {{ isActive ? 'Ativo' : 'Pausado' }}
    </span>
  </div>
</template>
