<script setup lang="ts">
import {
  columnFilteringFeature,
  columnVisibilityFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  FlexRender,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
  useTable,
} from '@tanstack/vue-table'
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Copy,
  ExternalLink,
  Search,
} from '@lucide/vue'
import { toast } from 'vue-sonner'
import type { MlTopProductRow } from '~~/shared/types/mercadolivre'
import { formatLogisticLabel } from '~~/shared/utils/mercadolivre'
import { fmtBRL } from '~~/shared/utils/revenue'

const props = defineProps<{
  products: MlTopProductRow[]
}>()

const features = tableFeatures({
  columnFilteringFeature,
  columnVisibilityFeature,
  rowPaginationFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
  filterFns: { includesString: filterFn_includesString },
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
})

type MlTableFeatures = typeof features

const columnHelper = createColumnHelper<MlTableFeatures, MlTopProductRow>()

const searchTerm = ref('')
const columnVisibility = ref<Record<string, boolean>>({})

async function copyCode(value: string, label: string) {
  try {
    await navigator.clipboard.writeText(value)
    toast.success(`${label} copiado: ${value}`)
  } catch {
    toast.error(`Não foi possível copiar o ${label}.`)
  }
}

const columns = [
  columnHelper.accessor('title', {
    header: 'Produto / Anúncio',
    cell: (info) => info.getValue(),
    enableHiding: false,
  }),
  columnHelper.accessor((row) => row.sku || row.itemId, {
    id: 'code',
    header: 'SKU / MLB',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('unitsSold', {
    header: 'Unidades',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('grossRevenue', {
    header: 'Receita Bruta',
    cell: (info) => fmtBRL(info.getValue()),
  }),
  columnHelper.accessor('netRevenue', {
    header: 'Receita Líquida',
    cell: (info) => fmtBRL(info.getValue()),
  }),
  columnHelper.accessor('availableQuantity', {
    header: 'Estoque',
    cell: (info) => {
      const val = info.getValue()
      return val === null ? '—' : String(val)
    },
  }),
  columnHelper.accessor('logisticType', {
    header: 'Envio',
    cell: (info) => formatLogisticLabel(info.getValue()),
  }),
]

const table = useTable({
  features,
  get data() {
    return props.products
  },
  columns,
  state: {
    get columnVisibility() {
      return columnVisibility.value
    },
  },
  onColumnVisibilityChange: (updater) => {
    columnVisibility.value =
      typeof updater === 'function' ? updater(columnVisibility.value) : updater
  },
  initialState: {
    pagination: { pageIndex: 0, pageSize: 10 },
    sorting: [{ id: 'grossRevenue', desc: true }],
  },
})

watch(searchTerm, (val) => {
  table.getColumn('title')?.setFilterValue(val || undefined)
})
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="relative w-full sm:max-w-xs">
        <Search
          class="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground"
        />
        <Input v-model="searchTerm" placeholder="Buscar por título do anúncio..." class="pl-8" />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="outline" size="sm">
            <Columns3 class="mr-1.5 size-4" />
            Colunas
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Colunas visíveis</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            v-for="col in table.getAllColumns().filter((c) => c.getCanHide())"
            :key="col.id"
            :model-value="col.getIsVisible()"
            @update:model-value="(v: boolean) => col.toggleVisibility(Boolean(v))"
          >
            {{ typeof col.columnDef.header === 'string' ? col.columnDef.header : col.id }}
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <div class="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
            <TableHead v-for="header in headerGroup.headers" :key="header.id">
              <button
                v-if="header.column.getCanSort()"
                type="button"
                class="inline-flex items-center gap-1 font-medium hover:text-foreground"
                @click="header.column.toggleSorting(header.column.getIsSorted() === 'asc')"
              >
                <FlexRender :render="header.column.columnDef.header" :props="header.getContext()" />
                <ArrowUpDown class="size-3.5 text-muted-foreground" />
              </button>
              <FlexRender
                v-else
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          <template v-if="table.getRowModel().rows.length">
            <TableRow v-for="row in table.getRowModel().rows" :key="row.id">
              <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                <template v-if="cell.column.id === 'title'">
                  <div class="flex max-w-xs items-center gap-2">
                    <span class="truncate font-medium" :title="row.original.title">
                      {{ row.original.title }}
                    </span>
                    <a
                      v-if="row.original.permalink"
                      :href="row.original.permalink"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="shrink-0 text-muted-foreground hover:text-primary"
                      aria-label="Abrir anúncio no Mercado Livre"
                    >
                      <ExternalLink class="size-3.5" />
                    </a>
                  </div>
                </template>

                <template v-else-if="cell.column.id === 'code'">
                  <button
                    type="button"
                    class="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    @click="copyCode(String(cell.getValue()), row.original.sku ? 'SKU' : 'MLB')"
                  >
                    <span>{{ cell.getValue() }}</span>
                    <Copy class="size-3" />
                  </button>
                </template>

                <template v-else-if="cell.column.id === 'availableQuantity'">
                  <Badge
                    v-if="row.original.availableQuantity !== null"
                    variant="secondary"
                    :class="
                      row.original.availableQuantity <= 5
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                        : 'bg-muted text-foreground'
                    "
                  >
                    {{ row.original.availableQuantity }}
                  </Badge>
                  <span v-else class="text-muted-foreground">—</span>
                </template>

                <template v-else>
                  <span class="tabular-nums">
                    <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
                  </span>
                </template>
              </TableCell>
            </TableRow>
          </template>
          <TableRow v-else>
            <TableCell :colspan="columns.length" class="h-24 text-center text-muted-foreground">
              Nenhum produto vendido no período selecionado.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <div class="flex items-center justify-between text-xs text-muted-foreground">
      <span> {{ table.getFilteredRowModel().rows.length }} produto(s) no período </span>
      <div class="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          :disabled="!table.getCanPreviousPage()"
          @click="table.previousPage()"
        >
          <ChevronLeft class="size-4" />
        </Button>
        <span class="px-2 tabular-nums">
          Página {{ table.getState().pagination.pageIndex + 1 }} de
          {{ Math.max(1, table.getPageCount()) }}
        </span>
        <Button
          variant="outline"
          size="sm"
          :disabled="!table.getCanNextPage()"
          @click="table.nextPage()"
        >
          <ChevronRight class="size-4" />
        </Button>
      </div>
    </div>
  </div>
</template>
