<script setup lang="ts">
import { FileSpreadsheet, Upload } from '@lucide/vue'
import { toast } from 'vue-sonner'
import type { ParsedRevenueCsv, RevenueDashboardData, RevenueStore } from '~~/shared/types/revenue'
import { detectAndParseRevenueCsv, fmtBRL, mergeParsedCsvIntoStore } from '~~/shared/utils/revenue'

const props = defineProps<{
  store: RevenueStore
  data: RevenueDashboardData
}>()

const emit = defineEmits<{
  imported: [nextStore: RevenueStore]
}>()

const open = defineModel<boolean>('open', { default: false })

const activeMode = ref<'file' | 'paste'>('file')
const pasteText = ref('')
const isDragging = ref(false)
const isSaving = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

async function readFileSmartEncoding(file: File): Promise<string> {
  const buf = await file.arrayBuffer()
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buf)
  } catch {
    return new TextDecoder('windows-1252').decode(buf)
  }
}

async function processParsedItems(parsedItems: ParsedRevenueCsv[]) {
  if (!parsedItems.length) return
  isSaving.value = true
  try {
    const merged = mergeParsedCsvIntoStore(props.store, parsedItems)
    await $fetch('/api/reports/revenue-import', {
      method: 'POST',
      body: {
        channel: merged.nextStore.channel.toLowerCase(),
        yearly: Object.keys(merged.importedYearly).length ? merged.importedYearly : undefined,
        daily: Object.keys(merged.importedDaily).length ? merged.importedDaily : undefined,
        projMonthKey: merged.projMonthKey,
        rawProj: merged.rawProj,
        sourceFiles: merged.nextStore.meta.files,
        note: merged.nextStore.meta.note,
        reconciled: merged.nextStore.meta.reconciled,
        reconcileDiffCount: merged.reconcileDiffCount,
      },
    })

    emit('imported', merged.nextStore)
    toast.success('Dados importados e salvos', {
      description: merged.nextStore.meta.note,
    })
    pasteText.value = ''
    open.value = false
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Não foi possível salvar os dados importados.'
    toast.error('Erro ao importar CSV', { description: message })
  } finally {
    isSaving.value = false
  }
}

async function handleFiles(files: FileList | null) {
  if (!files || !files.length) return
  try {
    const parsedItems: ParsedRevenueCsv[] = []
    for (const file of Array.from(files)) {
      const text = await readFileSmartEncoding(file)
      parsedItems.push(detectAndParseRevenueCsv(text, file.name))
    }
    await processParsedItems(parsedItems)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Arquivo CSV inválido.'
    toast.error('Falha ao ler CSV', { description: message })
  } finally {
    if (fileInputRef.value) fileInputRef.value.value = ''
  }
}

async function handlePasteSubmit() {
  if (!pasteText.value.trim()) {
    toast.error('Cole o conteúdo CSV antes de processar.')
    return
  }
  try {
    const parsed = detectAndParseRevenueCsv(pasteText.value, 'Texto colado')
    await processParsedItems([parsed])
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Texto CSV inválido.'
    toast.error('Falha ao interpretar CSV', { description: message })
  }
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  handleFiles(e.dataTransfer?.files ?? null)
}
</script>

<template>
  <ResponsiveModal
    v-model:open="open"
    title="Importar e Atualizar Dados Diários"
    description="Envie os CSVs exportados (faturamento-por-mes.csv e/ou faturamento-por-ano.csv). O sistema identifica automaticamente e salva no Supabase."
  >
    <div class="flex flex-col gap-4">
      <div class="inline-flex w-fit rounded-lg border bg-muted p-1">
        <button
          type="button"
          class="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
          :class="
            activeMode === 'file'
              ? 'bg-background text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          "
          @click="activeMode = 'file'"
        >
          Selecionar / Arrastar CSV
        </button>
        <button
          type="button"
          class="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
          :class="
            activeMode === 'paste'
              ? 'bg-background text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          "
          @click="activeMode = 'paste'"
        >
          Colar Texto CSV
        </button>
      </div>

      <div v-if="activeMode === 'file'">
        <input
          ref="fileInputRef"
          type="file"
          accept=".csv,.txt,text/csv,application/vnd.ms-excel"
          multiple
          class="hidden"
          @change="handleFiles(($event.target as HTMLInputElement).files)"
        />
        <button
          type="button"
          class="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors"
          :class="
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border bg-muted/30 hover:border-primary/60 hover:bg-muted/50'
          "
          :disabled="isSaving"
          @click="fileInputRef?.click()"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="onDrop"
        >
          <div
            class="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary"
          >
            <Upload class="size-5" />
          </div>
          <div class="text-sm font-semibold">
            {{
              isSaving
                ? 'Processando e salvando...'
                : 'Clique para escolher ou arraste os arquivos .CSV'
            }}
          </div>
          <p class="max-w-md text-xs text-muted-foreground">
            Você pode enviar apenas <strong>faturamento-por-mes.csv</strong> (sincroniza o mês atual
            na visão anual) ou os <strong>2 arquivos juntos</strong>.
          </p>
        </button>
      </div>

      <div v-else class="flex flex-col gap-2">
        <Textarea
          v-model="pasteText"
          rows="6"
          placeholder="Cole aqui o conteúdo de faturamento-por-mes.csv ou faturamento-por-ano.csv (separado por ;)..."
        />
        <div class="flex justify-end">
          <Button size="sm" :disabled="isSaving" @click="handlePasteSubmit">
            <FileSpreadsheet class="mr-1.5 size-4" />
            {{ isSaving ? 'Salvando...' : 'Processar Texto Colado' }}
          </Button>
        </div>
      </div>

      <div class="rounded-lg border bg-muted/40 p-3 text-xs">
        <div class="flex items-center justify-between gap-2 font-medium">
          <span>Base atual ({{ props.data.referenceDate }})</span>
          <Badge variant="outline">
            {{ props.store.meta.reconciled ? 'Conciliado' : 'Com divergência' }}
          </Badge>
        </div>
        <p class="mt-1 text-muted-foreground">
          {{ props.store.meta.note }}
        </p>
        <div class="mt-2 flex flex-wrap gap-3 text-muted-foreground">
          <span
            >Atualizado:
            <strong class="text-foreground">{{ props.store.meta.updatedAt }}</strong></span
          >
          <span
            >Mês ativo:
            <strong class="text-foreground">{{
              fmtBRL(props.data.activeMonth.actualCurrent)
            }}</strong></span
          >
        </div>
      </div>
    </div>
  </ResponsiveModal>
</template>
