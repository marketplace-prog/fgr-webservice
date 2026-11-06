<script setup lang="ts" generic="TData extends import('@tanstack/vue-table').RowData">
/**
 * @file app/components/monitored-inventory/data-table.vue
 * @description This file contains the data table component for the monitored inventory, using @tanstack/vue-table.
 * @version 1.0.0
 * @author Alessandro Pinheiro
 * @license MIT
 */

import type { ColumnDef, PaginationState } from '@tanstack/vue-table'
import { FlexRender, useTable } from '@tanstack/vue-table'
import { ArrowDown, ArrowDownUp, ArrowLeft, ArrowRight, ArrowUp, Columns3 } from '@lucide/vue'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { features, type DataTableFeatures } from './features'
import { getNextVisibleCount, getPageRange } from './pagination'

const props = defineProps<{
  columns: ColumnDef<DataTableFeatures, TData>[]
  data: TData[]
}>()

const pageSizeOptions = [10, 25, 50, 100] as const
const defaultPageSize = 10
const initialState: { pagination: PaginationState } = {
  pagination: {
    pageIndex: 0,
    pageSize: defaultPageSize,
  },
}
type DisplayMode = 'pagination' | 'infinite'

const displayMode = ref<DisplayMode>('pagination')
const visibleRowCount = ref<number>(defaultPageSize)
const loadMoreTarget = ref<HTMLElement | null>(null)

const table = useTable({
  features,
  initialState,
  get data() {
    return props.data
  },
  get columns() {
    return props.columns
  },
})

const pageIndex = computed(() => table.atoms.pagination.get().pageIndex)
const pageSize = computed(() => table.atoms.pagination.get().pageSize)
const totalRows = computed(() => table.getPrePaginatedRowModel().rows.length)
const displayedRows = computed(() =>
  displayMode.value === 'pagination'
    ? table.getRowModel().rows
    : table.getPrePaginatedRowModel().rows.slice(0, visibleRowCount.value),
)
const pageRange = computed(() => getPageRange(pageIndex.value, pageSize.value, totalRows.value))
const pageCount = computed(() => Math.max(table.getPageCount(), 1))
const canLoadMore = computed(() => visibleRowCount.value < totalRows.value)

function handlePageSizeChange(event: Event) {
  const target = event.target
  if (!(target instanceof HTMLSelectElement)) return

  const nextPageSize = pageSizeOptions.find((size) => size === Number(target.value))
  if (!nextPageSize) return

  table.setPageSize(nextPageSize)
  table.setPageIndex(0)
  visibleRowCount.value = nextPageSize
}

function handleDisplayModeChange(event: Event) {
  const target = event.target
  if (!(target instanceof HTMLSelectElement)) return

  const nextMode = target.value
  if (nextMode !== 'pagination' && nextMode !== 'infinite') return

  displayMode.value = nextMode
  table.setPageIndex(0)
  visibleRowCount.value = pageSize.value
}

function loadMoreRows() {
  visibleRowCount.value = getNextVisibleCount(
    visibleRowCount.value,
    totalRows.value,
    pageSize.value,
  )
}

let intersectionObserver: IntersectionObserver | undefined

function observeLoadMoreTarget() {
  intersectionObserver?.disconnect()
  if (displayMode.value === 'infinite' && loadMoreTarget.value) {
    intersectionObserver?.observe(loadMoreTarget.value)
  }
}

watch([displayMode, loadMoreTarget], observeLoadMoreTarget, { flush: 'post' })
watch(
  () => props.data,
  () => {
    table.setPageIndex(0)
    visibleRowCount.value = pageSize.value
  },
  { flush: 'sync' },
)

onMounted(() => {
  if (typeof IntersectionObserver === 'undefined') return

  intersectionObserver = new IntersectionObserver(
    ([entry]) => {
      if (entry?.isIntersecting && displayMode.value === 'infinite') loadMoreRows()
    },
    { rootMargin: '200px' },
  )
  observeLoadMoreTarget()
})

onUnmounted(() => intersectionObserver?.disconnect())
</script>

<template>
  <div class="rounded-md border">
    <div class="flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-wrap items-center gap-3">
        <label class="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Exibição</span>
          <select
            :value="displayMode"
            aria-label="Modo de exibição da lista"
            class="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            @change="handleDisplayModeChange"
          >
            <option value="pagination">Paginação</option>
            <option value="infinite">Carregar ao rolar</option>
          </select>
        </label>

        <label class="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{{
            displayMode === 'pagination' ? 'Itens por página' : 'Itens por carregamento'
          }}</span>
          <select
            :value="pageSize"
            aria-label="Quantidade de itens por página"
            class="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            @change="handlePageSizeChange"
          >
            <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
          </select>
        </label>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="outline" size="sm" aria-label="Escolher colunas visíveis">
            <Columns3 data-icon="inline-start" />
            Colunas
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Colunas visíveis</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuCheckboxItem
              v-for="column in table.getAllLeafColumns().filter((column) => column.getCanHide())"
              :key="column.id"
              :model-value="column.getIsVisible()"
              @update:model-value="
                (visible: boolean | 'indeterminate') => column.toggleVisibility(visible === true)
              "
            >
              {{
                typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id
              }}
            </DropdownMenuCheckboxItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    <Table>
      <TableHeader>
        <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
          <TableHead
            v-for="header in headerGroup.headers"
            :key="header.id"
            :aria-sort="
              header.column.getIsSorted() === 'asc'
                ? 'ascending'
                : header.column.getIsSorted() === 'desc'
                  ? 'descending'
                  : undefined
            "
          >
            <template v-if="!header.isPlaceholder && header.column.getCanSort()">
              <Button
                variant="ghost"
                size="sm"
                class="-ml-3"
                @click="header.column.getToggleSortingHandler()?.($event)"
              >
                <FlexRender :header="header" />
                <ArrowUp v-if="header.column.getIsSorted() === 'asc'" data-icon="inline-end" />
                <ArrowDown
                  v-else-if="header.column.getIsSorted() === 'desc'"
                  data-icon="inline-end"
                />
                <ArrowDownUp v-else data-icon="inline-end" />
              </Button>
            </template>
            <FlexRender v-else-if="!header.isPlaceholder" :header="header" />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <template v-if="displayedRows.length">
          <TableRow
            v-for="row in displayedRows"
            :key="row.id"
            :data-state="row.getIsSelected() && 'selected'"
          >
            <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
              <FlexRender :cell="cell" />
            </TableCell>
          </TableRow>
        </template>
        <template v-else>
          <TableRow>
            <TableCell :colspan="table.getVisibleLeafColumns().length" class="h-24 text-center">
              Nenhum resultado.
            </TableCell>
          </TableRow>
        </template>
      </TableBody>
    </Table>

    <div
      class="flex flex-col gap-3 border-t p-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between"
    >
      <span v-if="displayMode === 'pagination'">
        Exibindo {{ pageRange.from }}–{{ pageRange.to }} de {{ totalRows }} itens
      </span>
      <span v-else>Exibindo {{ displayedRows.length }} de {{ totalRows }} itens</span>

      <div v-if="displayMode === 'pagination'" class="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          :disabled="!table.getCanPreviousPage()"
          aria-label="Página anterior"
          @click="table.previousPage()"
        >
          <ArrowLeft data-icon="inline-start" />
          Anterior
        </Button>
        <span class="min-w-20 text-center"> Página {{ pageIndex + 1 }} de {{ pageCount }} </span>
        <Button
          variant="outline"
          size="sm"
          :disabled="!table.getCanNextPage()"
          aria-label="Próxima página"
          @click="table.nextPage()"
        >
          Próxima
          <ArrowRight data-icon="inline-end" />
        </Button>
      </div>

      <template v-else>
        <div
          v-if="canLoadMore"
          ref="loadMoreTarget"
          class="flex flex-col items-center gap-2 sm:flex-row"
        >
          <span>Role para carregar mais itens.</span>
          <Button variant="outline" size="sm" @click="loadMoreRows">Carregar mais</Button>
        </div>
        <span v-else-if="totalRows > 0">Todos os itens foram exibidos.</span>
      </template>
    </div>
  </div>
</template>
