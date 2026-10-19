<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { Check, Loader } from '@lucide/vue'
import type { Database, StockMonitor } from '~~/shared/types/database.types'

const props = defineProps<{
  monitor: StockMonitor
}>()

const emit = defineEmits<{
  (e: 'updated', newMin: number): void
}>()

const supabase = useSupabaseClient<Database>()
const currentValue = ref<number>(props.monitor.min_quantity)
const isSaving = ref(false)
const justSaved = ref(false)

async function saveValue() {
  const parsed = Number(currentValue.value)
  if (Number.isNaN(parsed) || parsed < 0) {
    currentValue.value = props.monitor.min_quantity
    toast.error('O estoque mínimo deve ser um número maior ou igual a zero.')
    return
  }

  if (parsed === props.monitor.min_quantity) {
    return
  }

  isSaving.value = true
  try {
    const { error } = await supabase
      .from('stock_monitors')
      .update({ min_quantity: parsed, updated_at: new Date().toISOString() })
      .eq('id', props.monitor.id)

    if (error) {
      currentValue.value = props.monitor.min_quantity
      toast.error(`Erro ao atualizar quantidade mínima: ${error.message}`)
      return
    }

    justSaved.value = true
    setTimeout(() => {
      justSaved.value = false
    }, 2000)

    toast.success(`Estoque mínimo do SKU "${props.monitor.sku}" atualizado para ${parsed}!`)
    emit('updated', parsed)
  } catch {
    currentValue.value = props.monitor.min_quantity
    toast.error('Erro inesperado ao salvar alteração.')
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="flex items-center gap-1.5">
    <input
      v-model.number="currentValue"
      type="number"
      min="0"
      step="1"
      :disabled="isSaving"
      class="h-8 w-16 rounded-md border border-input bg-transparent px-2 text-center text-sm font-semibold shadow-xs transition-colors focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none disabled:opacity-50"
      @blur="saveValue"
      @keydown.enter="saveValue"
    />
    <Loader v-if="isSaving" class="size-3.5 animate-spin text-muted-foreground" />
    <Check v-else-if="justSaved" class="size-3.5 animate-in text-emerald-500 fade-in" />
  </div>
</template>
