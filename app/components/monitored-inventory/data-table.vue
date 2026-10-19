<script setup lang="ts" generic="TData extends import('@tanstack/vue-table').RowData">
/**
 * @file app/components/monitored-inventory/data-table.vue
 * @description This file contains the data table component for the monitored inventory, using @tanstack/vue-table.
 * @version 1.0.0
 * @author Alessandro Pinheiro
 * @license MIT
 */

import type { ColumnDef } from '@tanstack/vue-table'
import { FlexRender, useTable } from '@tanstack/vue-table'
import { ArrowDown, ArrowDownUp, ArrowUp, Columns3 } from '@lucide/vue'

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

const props = defineProps<{
  columns: ColumnDef<DataTableFeatures, TData>[]
  data: TData[]
}>()

const table = useTable({
  features,
  get data() {
    return props.data
  },
  get columns() {
    return props.columns
  },
})
</script>

<template>
  <div class="rounded-md border">
    <div class="flex justify-end border-b p-2">
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
        <template v-if="table.getRowModel().rows?.length">
          <TableRow
            v-for="row in table.getRowModel().rows"
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
              No results.
            </TableCell>
          </TableRow>
        </template>
      </TableBody>
    </Table>
  </div>
</template>
