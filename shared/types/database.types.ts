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
      revenue_monthly: {
        Row: {
          id: string
          channel: string
          year: number
          month: number
          revenue: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          channel?: string
          year: number
          month: number
          revenue: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          channel?: string
          year?: number
          month?: number
          revenue?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      revenue_daily: {
        Row: {
          id: string
          channel: string
          year: number
          month: number
          day: number
          cumulative_revenue: number | null
          projected_cumulative: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          channel?: string
          year: number
          month: number
          day: number
          cumulative_revenue?: number | null
          projected_cumulative?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          channel?: string
          year?: number
          month?: number
          day?: number
          cumulative_revenue?: number | null
          projected_cumulative?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      revenue_imports: {
        Row: {
          id: string
          channel: string
          source_files: string[]
          note: string | null
          reconciled: boolean
          reconcile_diff_count: number
          imported_at: string
          imported_by: string | null
        }
        Insert: {
          id?: string
          channel?: string
          source_files?: string[]
          note?: string | null
          reconciled?: boolean
          reconcile_diff_count?: number
          imported_at?: string
          imported_by?: string | null
        }
        Update: {
          id?: string
          channel?: string
          source_files?: string[]
          note?: string | null
          reconciled?: boolean
          reconcile_diff_count?: number
          imported_at?: string
          imported_by?: string | null
        }
        Relationships: []
      }
      ml_connections: {
        Row: {
          id: string
          seller_id: number
          nickname: string
          site_id: string
          access_token: string
          refresh_token: string
          token_type: string
          scope: string | null
          expires_at: string
          reputation_level_id: string | null
          power_seller_status: string | null
          reputation_metrics: Json
          last_synced_at: string | null
          last_sync_status: string | null
          last_sync_error: string | null
          connected_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          seller_id: number
          nickname: string
          site_id?: string
          access_token: string
          refresh_token: string
          token_type?: string
          scope?: string | null
          expires_at: string
          reputation_level_id?: string | null
          power_seller_status?: string | null
          reputation_metrics?: Json
          last_synced_at?: string | null
          last_sync_status?: string | null
          last_sync_error?: string | null
          connected_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          seller_id?: number
          nickname?: string
          site_id?: string
          access_token?: string
          refresh_token?: string
          token_type?: string
          scope?: string | null
          expires_at?: string
          reputation_level_id?: string | null
          power_seller_status?: string | null
          reputation_metrics?: Json
          last_synced_at?: string | null
          last_sync_status?: string | null
          last_sync_error?: string | null
          connected_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      ml_orders: {
        Row: {
          id: string
          order_id: number
          seller_id: number
          pack_id: number | null
          date_created: string
          date_closed: string | null
          status: string
          currency_id: string
          total_amount: number
          paid_amount: number
          sale_fee: number
          shipping_cost: number
          net_amount: number
          logistic_type: string | null
          shipping_status: string | null
          items: Json
          buyer_nickname: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: number
          seller_id: number
          pack_id?: number | null
          date_created: string
          date_closed?: string | null
          status: string
          currency_id?: string
          total_amount?: number
          paid_amount?: number
          sale_fee?: number
          shipping_cost?: number
          net_amount?: number
          logistic_type?: string | null
          shipping_status?: string | null
          items?: Json
          buyer_nickname?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: number
          seller_id?: number
          pack_id?: number | null
          date_created?: string
          date_closed?: string | null
          status?: string
          currency_id?: string
          total_amount?: number
          paid_amount?: number
          sale_fee?: number
          shipping_cost?: number
          net_amount?: number
          logistic_type?: string | null
          shipping_status?: string | null
          items?: Json
          buyer_nickname?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ml_items: {
        Row: {
          id: string
          item_id: string
          seller_id: number
          sku: string | null
          title: string
          status: string
          price: number
          available_quantity: number
          sold_quantity: number
          listing_type_id: string | null
          logistic_type: string | null
          permalink: string | null
          thumbnail: string | null
          health: number | null
          updated_at: string
        }
        Insert: {
          id?: string
          item_id: string
          seller_id: number
          sku?: string | null
          title: string
          status: string
          price?: number
          available_quantity?: number
          sold_quantity?: number
          listing_type_id?: string | null
          logistic_type?: string | null
          permalink?: string | null
          thumbnail?: string | null
          health?: number | null
          updated_at?: string
        }
        Update: {
          id?: string
          item_id?: string
          seller_id?: number
          sku?: string | null
          title?: string
          status?: string
          price?: number
          available_quantity?: number
          sold_quantity?: number
          listing_type_id?: string | null
          logistic_type?: string | null
          permalink?: string | null
          thumbnail?: string | null
          health?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      ml_ads_daily: {
        Row: {
          id: string
          seller_id: number
          date: string
          cost: number
          clicks: number
          prints: number
          direct_amount: number
          indirect_amount: number
          total_amount: number
          acos: number | null
          roas: number | null
          updated_at: string
        }
        Insert: {
          id?: string
          seller_id: number
          date: string
          cost?: number
          clicks?: number
          prints?: number
          direct_amount?: number
          indirect_amount?: number
          total_amount?: number
          acos?: number | null
          roas?: number | null
          updated_at?: string
        }
        Update: {
          id?: string
          seller_id?: number
          date?: string
          cost?: number
          clicks?: number
          prints?: number
          direct_amount?: number
          indirect_amount?: number
          total_amount?: number
          acos?: number | null
          roas?: number | null
          updated_at?: string
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
