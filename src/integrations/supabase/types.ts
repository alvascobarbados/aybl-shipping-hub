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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      backfill_allocations: {
        Row: {
          cbm: number
          created_at: string
          id: string
          owner: string | null
          product: string | null
          sailing_id: string
        }
        Insert: {
          cbm: number
          created_at?: string
          id?: string
          owner?: string | null
          product?: string | null
          sailing_id: string
        }
        Update: {
          cbm?: number
          created_at?: string
          id?: string
          owner?: string | null
          product?: string | null
          sailing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "backfill_allocations_sailing_id_fkey"
            columns: ["sailing_id"]
            isOneToOne: false
            referencedRelation: "sailing_availability"
            referencedColumns: ["sailing_id"]
          },
          {
            foreignKeyName: "backfill_allocations_sailing_id_fkey"
            columns: ["sailing_id"]
            isOneToOne: false
            referencedRelation: "sailings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_events: {
        Row: {
          booking_id: string
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          photos: string[]
          status: Database["public"]["Enums"]["booking_status"]
        }
        Insert: {
          booking_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          photos?: string[]
          status: Database["public"]["Enums"]["booking_status"]
        }
        Update: {
          booking_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          photos?: string[]
          status?: Database["public"]["Enums"]["booking_status"]
        }
        Relationships: [
          {
            foreignKeyName: "booking_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          cargo_type: string
          cbm: number
          chargeable_cbm: number
          company_id: string
          created_at: string
          created_by: string | null
          delivery_option: Database["public"]["Enums"]["delivery_option"]
          fare: Database["public"]["Enums"]["fare_type"]
          gross_kg: number
          hold_expires_at: string | null
          id: string
          insurance_declared_value: number
          origin_option: Database["public"]["Enums"]["origin_option"]
          photo_check: boolean
          price_breakdown: Json
          ref: string
          sailing_id: string
          seal_no: string | null
          standing: boolean
          status: Database["public"]["Enums"]["booking_status"]
          total_usd: number
          updated_at: string
        }
        Insert: {
          cargo_type?: string
          cbm: number
          chargeable_cbm: number
          company_id: string
          created_at?: string
          created_by?: string | null
          delivery_option?: Database["public"]["Enums"]["delivery_option"]
          fare?: Database["public"]["Enums"]["fare_type"]
          gross_kg?: number
          hold_expires_at?: string | null
          id?: string
          insurance_declared_value?: number
          origin_option?: Database["public"]["Enums"]["origin_option"]
          photo_check?: boolean
          price_breakdown?: Json
          ref: string
          sailing_id: string
          seal_no?: string | null
          standing?: boolean
          status?: Database["public"]["Enums"]["booking_status"]
          total_usd?: number
          updated_at?: string
        }
        Update: {
          cargo_type?: string
          cbm?: number
          chargeable_cbm?: number
          company_id?: string
          created_at?: string
          created_by?: string | null
          delivery_option?: Database["public"]["Enums"]["delivery_option"]
          fare?: Database["public"]["Enums"]["fare_type"]
          gross_kg?: number
          hold_expires_at?: string | null
          id?: string
          insurance_declared_value?: number
          origin_option?: Database["public"]["Enums"]["origin_option"]
          photo_check?: boolean
          price_breakdown?: Json
          ref?: string
          sailing_id?: string
          seal_no?: string | null
          standing?: boolean
          status?: Database["public"]["Enums"]["booking_status"]
          total_usd?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_sailing_id_fkey"
            columns: ["sailing_id"]
            isOneToOne: false
            referencedRelation: "sailing_availability"
            referencedColumns: ["sailing_id"]
          },
          {
            foreignKeyName: "bookings_sailing_id_fkey"
            columns: ["sailing_id"]
            isOneToOne: false
            referencedRelation: "sailings"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          country: string
          created_at: string
          id: string
          name: string
          phone: string | null
          tax_id: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          country?: string
          created_at?: string
          id?: string
          name: string
          phone?: string | null
          tax_id?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          country?: string
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          tax_id?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          booking_id: string | null
          created_at: string
          id: string
          sailing_id: string | null
          storage_path: string
          title: string | null
          type: Database["public"]["Enums"]["document_type"]
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          id?: string
          sailing_id?: string | null
          storage_path: string
          title?: string | null
          type: Database["public"]["Enums"]["document_type"]
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          id?: string
          sailing_id?: string | null
          storage_path?: string
          title?: string | null
          type?: Database["public"]["Enums"]["document_type"]
        }
        Relationships: [
          {
            foreignKeyName: "documents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_sailing_id_fkey"
            columns: ["sailing_id"]
            isOneToOne: false
            referencedRelation: "sailing_availability"
            referencedColumns: ["sailing_id"]
          },
          {
            foreignKeyName: "documents_sailing_id_fkey"
            columns: ["sailing_id"]
            isOneToOne: false
            referencedRelation: "sailings"
            referencedColumns: ["id"]
          },
        ]
      }
      ports: {
        Row: {
          cfs_address: string | null
          cfs_address_zh: string | null
          code: string
          country: string
          created_at: string
          floor_rate_usd: number
          id: string
          name: string
          transit_days_to_bgi: number
        }
        Insert: {
          cfs_address?: string | null
          cfs_address_zh?: string | null
          code: string
          country: string
          created_at?: string
          floor_rate_usd?: number
          id?: string
          name: string
          transit_days_to_bgi?: number
        }
        Update: {
          cfs_address?: string | null
          cfs_address_zh?: string | null
          code?: string
          country?: string
          created_at?: string
          floor_rate_usd?: number
          id?: string
          name?: string
          transit_days_to_bgi?: number
        }
        Relationships: []
      }
      price_rules: {
        Row: {
          cfs_fee_per_cbm: number
          created_at: string
          delivery_fee_base: number
          delivery_fee_per_cbm: number
          demand70_mult: number
          demand85_mult: number
          doc_fee: number
          early_days: number
          effective_from: string
          flex_mult: number
          id: string
          insurance_min: number
          insurance_rate: number
          is_active: boolean
          late_mult: number
          photo_check_fee: number
          pickup_fee_gz: number
          pickup_fee_yiwu: number
          standing_discount: number
          std_days: number
          std_mult: number
          terminal_fee_per_cbm: number
          updated_at: string
          version: string
        }
        Insert: {
          cfs_fee_per_cbm?: number
          created_at?: string
          delivery_fee_base?: number
          delivery_fee_per_cbm?: number
          demand70_mult?: number
          demand85_mult?: number
          doc_fee?: number
          early_days?: number
          effective_from?: string
          flex_mult?: number
          id?: string
          insurance_min?: number
          insurance_rate?: number
          is_active?: boolean
          late_mult?: number
          photo_check_fee?: number
          pickup_fee_gz?: number
          pickup_fee_yiwu?: number
          standing_discount?: number
          std_days?: number
          std_mult?: number
          terminal_fee_per_cbm?: number
          updated_at?: string
          version: string
        }
        Update: {
          cfs_fee_per_cbm?: number
          created_at?: string
          delivery_fee_base?: number
          delivery_fee_per_cbm?: number
          demand70_mult?: number
          demand85_mult?: number
          doc_fee?: number
          early_days?: number
          effective_from?: string
          flex_mult?: number
          id?: string
          insurance_min?: number
          insurance_rate?: number
          is_active?: boolean
          late_mult?: number
          photo_check_fee?: number
          pickup_fee_gz?: number
          pickup_fee_yiwu?: number
          standing_discount?: number
          std_days?: number
          std_mult?: number
          terminal_fee_per_cbm?: number
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_id: string | null
          created_at: string
          email: string | null
          name: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          email?: string | null
          name?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          email?: string | null
          name?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      sailings: {
        Row: {
          capacity_cbm: number
          capacity_kg: number
          cargo_cutoff_at: string
          created_at: string
          destination_port_id: string
          eta: string
          etd: string
          id: string
          notes: string | null
          origin_port_id: string
          status: Database["public"]["Enums"]["sailing_status"]
          updated_at: string
          voyage_no: string
        }
        Insert: {
          capacity_cbm?: number
          capacity_kg?: number
          cargo_cutoff_at: string
          created_at?: string
          destination_port_id: string
          eta: string
          etd: string
          id?: string
          notes?: string | null
          origin_port_id: string
          status?: Database["public"]["Enums"]["sailing_status"]
          updated_at?: string
          voyage_no: string
        }
        Update: {
          capacity_cbm?: number
          capacity_kg?: number
          cargo_cutoff_at?: string
          created_at?: string
          destination_port_id?: string
          eta?: string
          etd?: string
          id?: string
          notes?: string | null
          origin_port_id?: string
          status?: Database["public"]["Enums"]["sailing_status"]
          updated_at?: string
          voyage_no?: string
        }
        Relationships: [
          {
            foreignKeyName: "sailings_destination_port_id_fkey"
            columns: ["destination_port_id"]
            isOneToOne: false
            referencedRelation: "ports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sailings_origin_port_id_fkey"
            columns: ["origin_port_id"]
            isOneToOne: false
            referencedRelation: "ports"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waitlist_entries: {
        Row: {
          cbm: number
          company_id: string | null
          created_at: string
          email: string | null
          id: string
          sailing_id: string
        }
        Insert: {
          cbm: number
          company_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          sailing_id: string
        }
        Update: {
          cbm?: number
          company_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          sailing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_entries_sailing_id_fkey"
            columns: ["sailing_id"]
            isOneToOne: false
            referencedRelation: "sailing_availability"
            referencedColumns: ["sailing_id"]
          },
          {
            foreignKeyName: "waitlist_entries_sailing_id_fkey"
            columns: ["sailing_id"]
            isOneToOne: false
            referencedRelation: "sailings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      sailing_availability: {
        Row: {
          available_cbm: number | null
          backfill_cbm: number | null
          booked_cbm: number | null
          booked_kg: number | null
          capacity_cbm: number | null
          capacity_kg: number | null
          committed_cbm: number | null
          held_cbm: number | null
          last_change_at: string | null
          sailing_id: string | null
          voyage_no: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calc_quote: {
        Args: {
          _cbm: number
          _delivery?: Database["public"]["Enums"]["delivery_option"]
          _fare: Database["public"]["Enums"]["fare_type"]
          _gross_kg: number
          _insurance_value?: number
          _origin?: Database["public"]["Enums"]["origin_option"]
          _photo_check?: boolean
          _sailing_id: string
          _standing?: boolean
        }
        Returns: Json
      }
      expire_holds: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hold_space: {
        Args: {
          _cargo_type?: string
          _cbm: number
          _delivery?: Database["public"]["Enums"]["delivery_option"]
          _fare?: Database["public"]["Enums"]["fare_type"]
          _gross_kg?: number
          _insurance_value?: number
          _origin?: Database["public"]["Enums"]["origin_option"]
          _photo_check?: boolean
          _sailing_id: string
          _standing?: boolean
        }
        Returns: Json
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      my_company_id: { Args: never; Returns: string }
    }
    Enums: {
      app_role: "customer" | "ops" | "admin"
      booking_status:
        | "held"
        | "confirmed"
        | "received"
        | "loaded"
        | "sailed"
        | "arrived"
        | "released"
        | "cancelled"
        | "expired"
      delivery_option: "collect" | "deliver"
      document_type:
        | "confirmation"
        | "supplier_label"
        | "house_bl"
        | "manifest"
        | "invoice"
      fare_type: "saver" | "flex"
      origin_option: "cfs" | "pickup_gz" | "pickup_yiwu"
      sailing_status:
        | "scheduled"
        | "open"
        | "closed"
        | "sailed"
        | "arrived"
        | "released"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["customer", "ops", "admin"],
      booking_status: [
        "held",
        "confirmed",
        "received",
        "loaded",
        "sailed",
        "arrived",
        "released",
        "cancelled",
        "expired",
      ],
      delivery_option: ["collect", "deliver"],
      document_type: [
        "confirmation",
        "supplier_label",
        "house_bl",
        "manifest",
        "invoice",
      ],
      fare_type: ["saver", "flex"],
      origin_option: ["cfs", "pickup_gz", "pickup_yiwu"],
      sailing_status: [
        "scheduled",
        "open",
        "closed",
        "sailed",
        "arrived",
        "released",
      ],
    },
  },
} as const
