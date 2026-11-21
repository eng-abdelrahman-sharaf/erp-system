export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      employees: {
        Row: {
          address: string
          created_at: string
          email: string
          employment_date: string
          full_name: string
          id: string
          notes: string | null
          phone: string
          position: string
          salary: number
          status: Database["public"]["Enums"]["employment_status"]
          updated_at: string
        }
        Insert: {
          address: string
          created_at?: string
          email: string
          employment_date: string
          full_name: string
          id?: string
          notes?: string | null
          phone: string
          position: string
          salary?: number
          status?: Database["public"]["Enums"]["employment_status"]
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          email?: string
          employment_date?: string
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string
          position?: string
          salary?: number
          status?: Database["public"]["Enums"]["employment_status"]
          updated_at?: string
        }
        Relationships: []
      }
      inventory_activity_logs: {
        Row: {
          activity_type: Database["public"]["Enums"]["inventory_activity_type"]
          created_at: string
          id: string
          item_id: string
          new_reserved: number
          new_total: number
          new_used: number
          notes: string | null
          performed_by: string | null
          previous_reserved: number
          previous_total: number
          previous_used: number
          quantity: number
          related_order_id: string | null
          transfer_id: string | null
          warehouse_id: string
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["inventory_activity_type"]
          created_at?: string
          id?: string
          item_id: string
          new_reserved: number
          new_total: number
          new_used: number
          notes?: string | null
          performed_by?: string | null
          previous_reserved: number
          previous_total: number
          previous_used: number
          quantity: number
          related_order_id?: string | null
          transfer_id?: string | null
          warehouse_id: string
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["inventory_activity_type"]
          created_at?: string
          id?: string
          item_id?: string
          new_reserved?: number
          new_total?: number
          new_used?: number
          notes?: string | null
          performed_by?: string | null
          previous_reserved?: number
          previous_total?: number
          previous_used?: number
          quantity?: number
          related_order_id?: string | null
          transfer_id?: string | null
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_activity_logs_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_activity_logs_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_summary"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "inventory_activity_logs_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_activity_logs_related_order_id_fkey"
            columns: ["related_order_id"]
            isOneToOne: false
            referencedRelation: "order_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_activity_logs_related_order_id_fkey"
            columns: ["related_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_activity_logs_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "warehouse_transfers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_activity_logs_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "inventory_summary"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "inventory_activity_logs_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          sku: string
          unit: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          sku: string
          unit: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          sku?: string
          unit?: string
        }
        Relationships: []
      }
      order_activity_logs: {
        Row: {
          activity_type: string
          created_at: string
          description: string
          id: string
          order_id: string
          performed_by: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string
          description: string
          id?: string
          order_id: string
          performed_by?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string
          id?: string
          order_id?: string
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_activity_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_activity_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_activity_logs_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_inventory: {
        Row: {
          created_at: string
          id: string
          item_id: string
          order_id: string
          quantity: number
          unit: string
          warehouse_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          order_id: string
          quantity: number
          unit: string
          warehouse_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          order_id?: string
          quantity?: number
          unit?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_inventory_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_inventory_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_summary"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "order_inventory_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_inventory_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_inventory_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "inventory_summary"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "order_inventory_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      order_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          order_id: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          order_id: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_notes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_notes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          client_address: string
          client_name: string
          client_phone: string
          created_at: string
          created_by: string
          description: string | null
          employee_id: string | null
          id: string
          notes: string | null
          order_date: string
          order_number: string
          status: Database["public"]["Enums"]["order_status"]
          title: string
          updated_at: string
        }
        Insert: {
          client_address: string
          client_name: string
          client_phone: string
          created_at?: string
          created_by: string
          description?: string | null
          employee_id?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number: string
          status?: Database["public"]["Enums"]["order_status"]
          title: string
          updated_at?: string
        }
        Update: {
          client_address?: string
          client_name?: string
          client_phone?: string
          created_at?: string
          created_by?: string
          description?: string | null
          employee_id?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number?: string
          status?: Database["public"]["Enums"]["order_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_periods: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          period_end: string
          period_start: string
          salary_amount: number
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          period_end: string
          period_start: string
          salary_amount: number
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          period_end?: string
          period_start?: string
          salary_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "payroll_periods_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          role_id: string
          status: Database["public"]["Enums"]["account_status"]
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          role_id: string
          status?: Database["public"]["Enums"]["account_status"]
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          role_id?: string
          status?: Database["public"]["Enums"]["account_status"]
        }
        Relationships: [
          {
            foreignKeyName: "profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          can_read: boolean
          can_write: boolean
          created_at: string
          id: string
          module: Database["public"]["Enums"]["module_name"]
          role_id: string
        }
        Insert: {
          can_read?: boolean
          can_write?: boolean
          created_at?: string
          id?: string
          module: Database["public"]["Enums"]["module_name"]
          role_id: string
        }
        Update: {
          can_read?: boolean
          can_write?: boolean
          created_at?: string
          id?: string
          module?: Database["public"]["Enums"]["module_name"]
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      salary_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          payment_date: string
          payroll_period_id: string
          recorded_by: string | null
          reference_number: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          payment_date?: string
          payroll_period_id: string
          recorded_by?: string | null
          reference_number?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          payment_date?: string
          payroll_period_id?: string
          recorded_by?: string | null
          reference_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salary_payments_payroll_period_id_fkey"
            columns: ["payroll_period_id"]
            isOneToOne: false
            referencedRelation: "payroll_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_payments_payroll_period_id_fkey"
            columns: ["payroll_period_id"]
            isOneToOne: false
            referencedRelation: "payroll_summary"
            referencedColumns: ["payroll_period_id"]
          },
          {
            foreignKeyName: "salary_payments_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_stock: {
        Row: {
          available_quantity: number | null
          id: string
          item_id: string
          reserved_quantity: number
          total_quantity: number
          updated_at: string
          used_quantity: number
          warehouse_id: string
        }
        Insert: {
          available_quantity?: number | null
          id?: string
          item_id: string
          reserved_quantity?: number
          total_quantity?: number
          updated_at?: string
          used_quantity?: number
          warehouse_id: string
        }
        Update: {
          available_quantity?: number | null
          id?: string
          item_id?: string
          reserved_quantity?: number
          total_quantity?: number
          updated_at?: string
          used_quantity?: number
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_stock_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_stock_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_summary"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "warehouse_stock_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "inventory_summary"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "warehouse_stock_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_transfers: {
        Row: {
          created_at: string
          destination_warehouse_id: string
          id: string
          item_id: string
          notes: string | null
          performed_by: string | null
          quantity: number
          source_warehouse_id: string
          transfer_date: string
        }
        Insert: {
          created_at?: string
          destination_warehouse_id: string
          id?: string
          item_id: string
          notes?: string | null
          performed_by?: string | null
          quantity: number
          source_warehouse_id: string
          transfer_date?: string
        }
        Update: {
          created_at?: string
          destination_warehouse_id?: string
          id?: string
          item_id?: string
          notes?: string | null
          performed_by?: string | null
          quantity?: number
          source_warehouse_id?: string
          transfer_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_transfers_destination_warehouse_id_fkey"
            columns: ["destination_warehouse_id"]
            isOneToOne: false
            referencedRelation: "inventory_summary"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "warehouse_transfers_destination_warehouse_id_fkey"
            columns: ["destination_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_transfers_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_transfers_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_summary"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "warehouse_transfers_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_transfers_source_warehouse_id_fkey"
            columns: ["source_warehouse_id"]
            isOneToOne: false
            referencedRelation: "inventory_summary"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "warehouse_transfers_source_warehouse_id_fkey"
            columns: ["source_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          address: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          address: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          address?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      inventory_summary: {
        Row: {
          available_quantity: number | null
          item_id: string | null
          item_name: string | null
          reserved_quantity: number | null
          sku: string | null
          total_quantity: number | null
          unit: string | null
          used_quantity: number | null
          warehouse_id: string | null
          warehouse_name: string | null
        }
        Relationships: []
      }
      order_summary: {
        Row: {
          client_address: string | null
          client_name: string | null
          client_phone: string | null
          employee_id: string | null
          employee_name: string | null
          id: string | null
          inventory_items_count: number | null
          order_date: string | null
          order_number: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          title: string | null
          total_inventory_quantity: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_summary: {
        Row: {
          employee_id: string | null
          employee_name: string | null
          outstanding: number | null
          payroll_period_id: string | null
          period_end: string | null
          period_start: string | null
          salary_amount: number | null
          total_paid: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_periods_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      adjust_inventory: {
        Args: {
          p_activity: Database["public"]["Enums"]["inventory_activity_type"]
          p_item_id: string
          p_notes?: string
          p_quantity: number
          p_warehouse_id: string
        }
        Returns: string
      }
      change_order_status: {
        Args: {
          p_new_status: Database["public"]["Enums"]["order_status"]
          p_order_id: string
        }
        Returns: undefined
      }
      has_module_permission: {
        Args: {
          p_module: Database["public"]["Enums"]["module_name"]
          p_write?: boolean
        }
        Returns: boolean
      }
      record_salary_payment: {
        Args: {
          p_amount: number
          p_method: Database["public"]["Enums"]["payment_method"]
          p_notes?: string
          p_payment_date: string
          p_payroll_period_id: string
          p_reference_number?: string
        }
        Returns: string
      }
      reserve_order_inventory: {
        Args: {
          p_item_id: string
          p_order_id: string
          p_quantity: number
          p_warehouse_id: string
        }
        Returns: string
      }
      transfer_inventory: {
        Args: {
          p_destination_warehouse_id: string
          p_item_id: string
          p_notes?: string
          p_quantity: number
          p_source_warehouse_id: string
        }
        Returns: string
      }
    }
    Enums: {
      account_status: "active" | "inactive"
      employment_status: "active" | "inactive"
      inventory_activity_type:
        | "addition"
        | "manual_usage"
        | "reservation"
        | "release"
        | "consumption"
        | "transfer_out"
        | "transfer_in"
      module_name: "users" | "orders" | "employees" | "inventory"
      order_status: "pending" | "in_progress" | "paid" | "cancelled"
      payment_method: "cash" | "bank_transfer" | "instapay" | "check" | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_status: ["active", "inactive"],
      employment_status: ["active", "inactive"],
      inventory_activity_type: [
        "addition",
        "manual_usage",
        "reservation",
        "release",
        "consumption",
        "transfer_out",
        "transfer_in",
      ],
      module_name: ["users", "orders", "employees", "inventory"],
      order_status: ["pending", "in_progress", "paid", "cancelled"],
      payment_method: ["cash", "bank_transfer", "instapay", "check", "other"],
    },
  },
} as const
