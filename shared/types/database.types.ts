export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      landing_page_leads: {
        Row: {
          id: string
          landing_slug: string
          name: string
          email: string | null
          phone: string | null
          thread_color: 'preta' | 'branca' | 'azul' | 'verde'
          thread_thickness_mm: 3 | 4 | 6
          mesh_size_cm: 10 | 12 | 13 | 15 | 16
          length_cm: number
          height_cm: number
          upper_recess_cm: number
          lower_recess_cm: number
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          utm_term: string | null
          utm_content: string | null
          referrer: string | null
          consented_at: string
          created_at: string
        }
        Insert: {
          id?: string
          landing_slug: string
          name: string
          email?: string | null
          phone?: string | null
          thread_color: 'preta' | 'branca' | 'azul' | 'verde'
          thread_thickness_mm: 3 | 4 | 6
          mesh_size_cm: 10 | 12 | 13 | 15 | 16
          length_cm: number
          height_cm: number
          upper_recess_cm: number
          lower_recess_cm: number
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          utm_term?: string | null
          utm_content?: string | null
          referrer?: string | null
          consented_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          landing_slug?: string
          name?: string
          email?: string | null
          phone?: string | null
          thread_color?: 'preta' | 'branca' | 'azul' | 'verde'
          thread_thickness_mm?: 3 | 4 | 6
          mesh_size_cm?: 10 | 12 | 13 | 15 | 16
          length_cm?: number
          height_cm?: number
          upper_recess_cm?: number
          lower_recess_cm?: number
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          utm_term?: string | null
          utm_content?: string | null
          referrer?: string | null
          consented_at?: string
          created_at?: string
        }
        Relationships: []
      }
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
