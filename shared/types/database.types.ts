export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      stock_monitors: {
        Row: {
          id: string
          sku: string
          name: string
          sku_type: 'variation' | 'parent'
          min_quantity: number
          current_stock: number
          is_active: boolean
          last_checked_at: string | null
          last_alerted_at: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          sku: string
          name: string
          sku_type?: 'variation' | 'parent'
          min_quantity?: number
          current_stock?: number
          is_active?: boolean
          last_checked_at?: string | null
          last_alerted_at?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          sku?: string
          name?: string
          sku_type?: 'variation' | 'parent'
          min_quantity?: number
          current_stock?: number
          is_active?: boolean
          last_checked_at?: string | null
          last_alerted_at?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type StockMonitor = Database['public']['Tables']['stock_monitors']['Row']
export type StockMonitorInsert = Database['public']['Tables']['stock_monitors']['Insert']
export type StockMonitorUpdate = Database['public']['Tables']['stock_monitors']['Update']
