/**
 * @file app/components/monitored-inventory/columns.ts
 * @description Definição de colunas para a tabela de estoque monitorado (@tanstack/vue-table v9).
 */

import { createColumnHelper } from '@tanstack/vue-table'
import { Copy } from '@lucide/vue'
import { h } from 'vue'
import { toast } from 'vue-sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { StockMonitor } from '~~/shared/types/database.types'
import ActionsCell from './ActionsCell.vue'
import ActiveSwitchCell from './ActiveSwitchCell.vue'
import EditableMinQuantityCell from './EditableMinQuantityCell.vue'
import type { DataTableFeatures } from './features'

const columnHelper = createColumnHelper<DataTableFeatures, StockMonitor>()

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Nunca'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return 'Nunca'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

async function copySku(sku: string) {
  try {
    await navigator.clipboard.writeText(sku)
    toast.success(`SKU "${sku}" copiado para a área de transferência.`)
  } catch (error: unknown) {
    console.error('Erro ao copiar SKU para a área de transferência:', error)
    toast.error('Não foi possível copiar o SKU. Verifique as permissões do navegador.')
  }
}

export function getColumns(onRefresh?: () => void) {
  return columnHelper.columns([
    columnHelper.accessor('sku', {
      header: 'SKU / Tipo',
      cell: ({ row }) => {
        const isParent = row.original.sku_type === 'parent'
        return h('div', { class: 'flex flex-col gap-1' }, [
          h(
            Button,
            {
              type: 'button',
              variant: 'ghost',
              size: 'sm',
              class: 'h-auto w-fit px-1 py-0 font-mono font-semibold',
              title: 'Copiar SKU',
              'aria-label': `Copiar SKU ${row.original.sku}`,
              onClick: () => copySku(row.original.sku),
            },
            { default: () => [row.original.sku, h(Copy, { 'data-icon': 'inline-end' })] },
          ),
          h(
            Badge,
            {
              variant: isParent ? 'outline' : 'secondary',
              class: 'w-fit text-[10px] px-1.5 py-0 font-normal',
            },
            () => (isParent ? 'Produto Pai' : 'Variação'),
          ),
        ])
      },
    }),

    columnHelper.accessor('name', {
      header: 'Nome do Produto',
      cell: ({ row }) =>
        h(
          'div',
          { class: 'max-w-[260px] truncate font-medium text-sm', title: row.original.name },
          row.original.name,
        ),
    }),

    columnHelper.accessor('current_stock', {
      header: 'Estoque Disponível',
      cell: ({ row }) => {
        const stock = row.original.current_stock
        const min = row.original.min_quantity
        const isLow = stock <= min

        return h('div', { class: 'flex items-center gap-1.5' }, [
          h(
            Badge,
            {
              variant: isLow ? 'destructive' : 'secondary',
              class: 'font-mono text-xs',
            },
            () => `${stock} un.`,
          ),
          isLow ? h('span', { class: 'text-xs text-destructive font-medium' }, '🚨 Baixo') : null,
        ])
      },
    }),

    columnHelper.accessor('min_quantity', {
      header: 'Estoque Mínimo',
      cell: ({ row }) =>
        h(EditableMinQuantityCell, {
          monitor: row.original,
          onUpdated: (newMin: number) => {
            row.original.min_quantity = newMin
            onRefresh?.()
          },
        }),
    }),

    columnHelper.accessor('is_active', {
      header: 'Monitoramento',
      cell: ({ row }) =>
        h(ActiveSwitchCell, {
          monitor: row.original,
          onUpdated: (isActive: boolean) => {
            row.original.is_active = isActive
          },
        }),
    }),

    columnHelper.accessor('last_checked_at', {
      header: 'Última Checagem',
      cell: ({ row }) =>
        h(
          'span',
          { class: 'text-xs text-muted-foreground' },
          formatDate(row.original.last_checked_at),
        ),
    }),

    columnHelper.accessor('last_alerted_at', {
      header: 'Último Alerta',
      cell: ({ row }) => {
        const date = row.original.last_alerted_at
        return h(
          'span',
          {
            class: ['text-xs', date ? 'text-destructive font-medium' : 'text-muted-foreground'],
          },
          formatDate(date),
        )
      },
    }),

    columnHelper.display({
      id: 'actions',
      enableHiding: false,
      header: () => h('div', { class: 'text-right' }, 'Ações'),
      cell: ({ row }) =>
        h(ActionsCell, {
          monitor: row.original,
          onRefreshed: () => onRefresh?.(),
          onDeleted: () => onRefresh?.(),
        }),
    }),
  ])
}

export const columns = getColumns()
