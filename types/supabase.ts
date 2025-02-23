export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      vouchers: {
        Row: {
          id: string
          code: string
          discount_type: 'percentage' | 'fixed'
          discount_value: number
          max_usage: number
          current_usage: number
          start_date: string
          end_date: string
          status: 'active' | 'expired' | 'depleted'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          discount_type: 'percentage' | 'fixed'
          discount_value: number
          max_usage: number
          current_usage?: number
          start_date: string
          end_date: string
          status?: 'active' | 'expired' | 'depleted'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          discount_type?: 'percentage' | 'fixed'
          discount_value?: number
          max_usage?: number
          current_usage?: number
          start_date?: string
          end_date?: string
          status?: 'active' | 'expired' | 'depleted'
          created_at?: string
          updated_at?: string
        }
      }
      voucher_usage: {
        Row: {
          id: string
          voucher_id: string
          booking_id: string
          user_id: string
          streamer_id: string
          discount_applied: number
          original_price: number
          final_price: number
          used_at: string
        }
        Insert: {
          id?: string
          voucher_id: string
          booking_id: string
          user_id: string
          streamer_id: string
          discount_applied: number
          original_price: number
          final_price: number
          used_at?: string
        }
        Update: {
          id?: string
          voucher_id?: string
          booking_id?: string
          user_id?: string
          streamer_id?: string
          discount_applied?: number
          original_price?: number
          final_price?: number
          used_at?: string
        }
      }
      users: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          image_url?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          email: string
          image_url?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string
          image_url?: string
          created_at?: string
          updated_at?: string
        }
      }
      streamers: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          image_url?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name: string
          email: string
          image_url?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string
          image_url?: string
          created_at?: string
          updated_at?: string
        }
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
  }
} 