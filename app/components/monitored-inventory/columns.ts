/**
 * @file app/components/monitored-inventory/columns.ts
 * @description This file contains the column definitions for the monitored inventory table, using @tanstack/vue-table.
 * @version 1.0.0
 * @author Alessandro Pinheiro
 * @license MIT
 */

import { createColumnHelper } from '@tanstack/vue-table'
import type { DataTableFeatures } from './features'

// This type defines the shape of our data.
// You can use a Zod schema here if you want.
export interface Payment {
  id: string
  amount: number
  status: 'pending' | 'processing' | 'success' | 'failed'
  email: string
}

// Use `accessor` for data columns and `display` for columns without one.
const columnHelper = createColumnHelper<DataTableFeatures, Payment>()

export const columns = columnHelper.columns([
  columnHelper.accessor('status', {
    header: 'Status',
  }),
  columnHelper.accessor('email', {
    header: 'Email',
  }),
  columnHelper.accessor('amount', {
    header: 'Amount',
  }),
])
