<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm, Field as VeeField } from 'vee-validate'
import { toast } from 'vue-sonner'
import { Loader } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { createMonitoredInventorySchema } from '~~/shared/schemas/inventory-monitoring.schema'
import type { Database } from '~~/shared/types/database.types'

const emit = defineEmits<{
  (e: 'saved' | 'cancel'): void
}>()

const supabase = useSupabaseClient<Database>()
const user = useSupabaseUser()
const isSubmitting = ref(false)
const isLookingUpProduct = ref(false)
const productLookupError = ref('')

const { handleSubmit, resetForm, values, setFieldValue } = useForm({
  validationSchema: toTypedSchema(createMonitoredInventorySchema),
  initialValues: {
    sku: '',
    name: '',
    sku_type: 'variation',
    min_quantity: 5,
    is_active: true,
  },
})

watch([() => values.sku, () => values.sku_type], ([sku, skuType], _previous, onCleanup) => {
  const normalizedSku = sku?.trim() ?? ''
  const isCurrentLookup = () => values.sku?.trim() === normalizedSku && values.sku_type === skuType
  productLookupError.value = ''
  setFieldValue('name', '')

  if (!normalizedSku) {
    isLookingUpProduct.value = false
    return
  }

  isLookingUpProduct.value = true
  const timeout = setTimeout(async () => {
    try {
      const product = await $fetch<{ name: string }>('/api/inventory/product-by-sku', {
        query: { sku: normalizedSku, sku_type: skuType },
      })
      if (isCurrentLookup()) {
        setFieldValue('name', product.name)
      }
    } catch (error: unknown) {
      if (!isCurrentLookup()) return

      const status =
        typeof error === 'object' && error !== null && 'statusCode' in error
          ? error.statusCode
          : undefined
      productLookupError.value =
        status === 404
          ? 'SKU não encontrado na Magazord.'
          : 'Não foi possível consultar o produto na Magazord.'
    } finally {
      if (isCurrentLookup()) isLookingUpProduct.value = false
    }
  }, 400)

  onCleanup(() => clearTimeout(timeout))
})

const onSubmit = handleSubmit(async (values) => {
  isSubmitting.value = true

  try {
    const { data: monitor, error } = await supabase
      .from('stock_monitors')
      .insert({
        sku: values.sku.trim(),
        name: values.name.trim(),
        sku_type: values.sku_type,
        min_quantity: values.min_quantity,
        is_active: values.is_active,
        created_by: user.value?.id ?? null,
      })
      .select('id')
      .single()

    if (error) {
      if (error.code === '23505') {
        toast.error(
          `O SKU "${values.sku}" já está cadastrado como ${values.sku_type === 'parent' ? 'Produto Pai' : 'Variação'}.`,
        )
      } else {
        toast.error(`Erro ao cadastrar produto: ${error.message}`)
      }
      return
    }

    if (!monitor) {
      toast.error(
        'Cadastro concluído, mas não foi possível obter o ID para verificar o estoque. Atualize a lista.',
      )
      resetForm()
      emit('saved')
      return
    }

    try {
      const result = await $fetch<{ stock: number; alerted: boolean }>(
        '/api/inventory/check-single',
        {
          method: 'POST',
          body: { id: monitor.id },
        },
      )

      if (result.alerted) {
        toast.warning(
          `SKU "${values.sku}" cadastrado. Estoque atual: ${result.stock} un. (mínimo: ${values.min_quantity}).`,
        )
      } else {
        toast.success(`SKU "${values.sku}" cadastrado e estoque verificado: ${result.stock} un.`)
      }
    } catch (err: unknown) {
      console.error('Erro ao verificar estoque após cadastrar produto:', err)
      const message = err instanceof Error ? err.message : 'Falha na requisição'
      toast.error(
        `SKU "${values.sku}" cadastrado, mas não foi possível verificar o estoque: ${message}`,
      )
    }

    resetForm()
    emit('saved')
  } catch (err: unknown) {
    console.error('Erro ao cadastrar produto monitorado:', err)
    toast.error('Ocorreu um erro inesperado ao salvar.')
  } finally {
    isSubmitting.value = false
  }
})
</script>

<template>
  <form id="monitored-product-form" class="space-y-4" @submit="onSubmit">
    <FieldGroup>
      <!-- Campo SKU -->
      <VeeField v-slot="{ componentField, errors }" name="sku">
        <Field :data-invalid="!!errors.length">
          <FieldLabel for="sku">
            SKU do Produto <span class="text-destructive">*</span>
          </FieldLabel>
          <Input
            id="sku"
            v-bind="componentField"
            placeholder="Ex: FGR-CAM-001-G"
            autocomplete="off"
            :aria-invalid="!!errors.length"
          />
          <FieldError v-if="errors.length" :errors="errors" />
        </Field>
      </VeeField>

      <!-- Tipo de Monitoramento (Variação vs Pai) -->
      <VeeField v-slot="{ componentField, errors }" name="sku_type">
        <Field :data-invalid="!!errors.length">
          <FieldLabel> Tipo de Produto / SKU <span class="text-destructive">*</span> </FieldLabel>
          <div class="grid grid-cols-2 gap-3 pt-1">
            <label
              class="flex cursor-pointer items-center justify-between rounded-lg border p-3 text-sm transition-colors hover:bg-muted/50 has-checked:border-primary has-checked:bg-primary/5"
            >
              <div class="space-y-0.5">
                <span class="font-medium text-foreground">Variação (Filho)</span>
                <p class="text-xs text-muted-foreground">Tamanho/cor específico</p>
              </div>
              <input
                type="radio"
                value="variation"
                v-bind="componentField"
                class="accent-primary"
              />
            </label>

            <label
              class="flex cursor-pointer items-center justify-between rounded-lg border p-3 text-sm transition-colors hover:bg-muted/50 has-checked:border-primary has-checked:bg-primary/5"
            >
              <div class="space-y-0.5">
                <span class="font-medium text-foreground">Produto Pai</span>
                <p class="text-xs text-muted-foreground">Estoque agrupado</p>
              </div>
              <input type="radio" value="parent" v-bind="componentField" class="accent-primary" />
            </label>
          </div>
          <FieldError v-if="errors.length" :errors="errors" />
        </Field>
      </VeeField>

      <!-- Nome do Produto -->
      <VeeField v-slot="{ componentField, errors }" name="name">
        <Field :data-invalid="!!errors.length">
          <FieldLabel for="name">
            Nome do Produto <span class="text-destructive">*</span>
          </FieldLabel>
          <Input
            id="name"
            v-bind="componentField"
            :placeholder="
              isLookingUpProduct ? 'Consultando Magazord...' : 'Preenchido pela Magazord'
            "
            readonly
            :aria-invalid="!!errors.length"
          />
          <p v-if="productLookupError" class="text-sm text-destructive" role="alert">
            {{ productLookupError }}
          </p>
          <p v-else class="text-xs text-muted-foreground">
            O nome é obtido automaticamente da API Magazord a partir do SKU.
          </p>
          <FieldError v-if="errors.length" :errors="errors" />
        </Field>
      </VeeField>

      <!-- Limite Mínimo para Alerta -->
      <VeeField v-slot="{ componentField, errors }" name="min_quantity">
        <Field :data-invalid="!!errors.length">
          <FieldLabel for="min_quantity">
            Estoque Mínimo para Alerta <span class="text-destructive">*</span>
          </FieldLabel>
          <Input
            id="min_quantity"
            type="number"
            min="0"
            step="1"
            v-bind="componentField"
            placeholder="5"
            :aria-invalid="!!errors.length"
          />
          <p class="text-xs text-muted-foreground">
            Quando o estoque disponível for menor ou igual a esse valor, o alerta no Discord será
            disparado.
          </p>
          <FieldError v-if="errors.length" :errors="errors" />
        </Field>
      </VeeField>
    </FieldGroup>

    <!-- Botões de Ação -->
    <div class="flex justify-end gap-2 pt-2">
      <Button type="button" variant="outline" :disabled="isSubmitting" @click="emit('cancel')">
        Cancelar
      </Button>
      <Button
        type="submit"
        form="monitored-product-form"
        :disabled="isSubmitting || isLookingUpProduct || !values.name"
      >
        <Loader v-if="isSubmitting" class="animate-spin" />
        Salvar Monitoramento
      </Button>
    </div>
  </form>
</template>
