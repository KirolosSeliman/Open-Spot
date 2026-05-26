export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          id: string;
          organization_id: string;
          actor_user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          actor_user_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          actor_user_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      booking_requests: {
        Row: {
          id: string;
          organization_id: string;
          opening_id: string;
          selected_offer_id: string | null;
          customer_id: string;
          status: Database["public"]["Enums"]["booking_request_status"];
          recovered_value_cents: number | null;
          platform_commission_cents: number | null;
          confirmed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          opening_id: string;
          selected_offer_id?: string | null;
          customer_id: string;
          status?: Database["public"]["Enums"]["booking_request_status"];
          recovered_value_cents?: number | null;
          platform_commission_cents?: number | null;
          confirmed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          opening_id?: string;
          selected_offer_id?: string | null;
          customer_id?: string;
          status?: Database["public"]["Enums"]["booking_request_status"];
          recovered_value_cents?: number | null;
          platform_commission_cents?: number | null;
          confirmed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      commission_records: {
        Row: {
          id: string;
          organization_id: string;
          booking_request_id: string;
          recovered_value_cents: number;
          discount_amount_cents: number;
          commission_percent: number;
          commission_cap_cents: number | null;
          commission_amount_cents: number;
          currency: string;
          calculated_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          booking_request_id: string;
          recovered_value_cents: number;
          discount_amount_cents?: number;
          commission_percent: number;
          commission_cap_cents?: number | null;
          commission_amount_cents: number;
          currency?: string;
          calculated_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          booking_request_id?: string;
          recovered_value_cents?: number;
          discount_amount_cents?: number;
          commission_percent?: number;
          commission_cap_cents?: number | null;
          commission_amount_cents?: number;
          currency?: string;
          calculated_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          organization_id: string;
          full_name: string;
          phone_e164: string;
          email: string | null;
          preferred_language: Database["public"]["Enums"]["supported_language"];
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          full_name: string;
          phone_e164: string;
          email?: string | null;
          preferred_language?: Database["public"]["Enums"]["supported_language"];
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          full_name?: string;
          phone_e164?: string;
          email?: string | null;
          preferred_language?: Database["public"]["Enums"]["supported_language"];
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      import_batches: {
        Row: {
          id: string;
          organization_id: string;
          file_name: string;
          total_rows: number;
          valid_rows: number;
          invalid_rows: number;
          duplicate_rows: number;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          file_name: string;
          total_rows?: number;
          valid_rows?: number;
          invalid_rows?: number;
          duplicate_rows?: number;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          file_name?: string;
          total_rows?: number;
          valid_rows?: number;
          invalid_rows?: number;
          duplicate_rows?: number;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      opening_offers: {
        Row: {
          id: string;
          organization_id: string;
          opening_id: string;
          customer_id: string;
          status: Database["public"]["Enums"]["opening_offer_status"];
          sent_at: string | null;
          responded_at: string | null;
          response_text: string | null;
          response_rank: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          opening_id: string;
          customer_id: string;
          status?: Database["public"]["Enums"]["opening_offer_status"];
          sent_at?: string | null;
          responded_at?: string | null;
          response_text?: string | null;
          response_rank?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          opening_id?: string;
          customer_id?: string;
          status?: Database["public"]["Enums"]["opening_offer_status"];
          sent_at?: string | null;
          responded_at?: string | null;
          response_text?: string | null;
          response_rank?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      openings: {
        Row: {
          id: string;
          organization_id: string;
          service_id: string | null;
          title: string;
          start_time: string;
          end_time: string;
          normal_price_cents: number | null;
          discount_type: Database["public"]["Enums"]["discount_type"];
          discount_value: number | null;
          offer_label: string | null;
          status: Database["public"]["Enums"]["opening_status"];
          expires_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          service_id?: string | null;
          title: string;
          start_time: string;
          end_time: string;
          normal_price_cents?: number | null;
          discount_type?: Database["public"]["Enums"]["discount_type"];
          discount_value?: number | null;
          offer_label?: string | null;
          status?: Database["public"]["Enums"]["opening_status"];
          expires_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          service_id?: string | null;
          title?: string;
          start_time?: string;
          end_time?: string;
          normal_price_cents?: number | null;
          discount_type?: Database["public"]["Enums"]["discount_type"];
          discount_value?: number | null;
          offer_label?: string | null;
          status?: Database["public"]["Enums"]["opening_status"];
          expires_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      organization_billing_settings: {
        Row: {
          id: string;
          organization_id: string;
          billing_status: string;
          subscription_status: string;
          base_plan_amount_cents: number;
          base_plan_currency: string;
          default_commission_percent: number;
          commission_cap_cents: number | null;
          sms_daily_limit: number;
          sms_monthly_limit: number;
          sms_sending_window_start: string;
          sms_sending_window_end: string;
          waitlist_public_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          billing_status?: string;
          subscription_status?: string;
          base_plan_amount_cents?: number;
          base_plan_currency?: string;
          default_commission_percent?: number;
          commission_cap_cents?: number | null;
          sms_daily_limit?: number;
          sms_monthly_limit?: number;
          sms_sending_window_start?: string;
          sms_sending_window_end?: string;
          waitlist_public_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          billing_status?: string;
          subscription_status?: string;
          base_plan_amount_cents?: number;
          base_plan_currency?: string;
          default_commission_percent?: number;
          commission_cap_cents?: number | null;
          sms_daily_limit?: number;
          sms_monthly_limit?: number;
          sms_sending_window_start?: string;
          sms_sending_window_end?: string;
          waitlist_public_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: Database["public"]["Enums"]["organization_role"];
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role?: Database["public"]["Enums"]["organization_role"];
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?: Database["public"]["Enums"]["organization_role"];
          created_at?: string;
        };
        Relationships: [];
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          email: string | null;
          phone: string | null;
          timezone: string;
          default_language: Database["public"]["Enums"]["supported_language"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          email?: string | null;
          phone?: string | null;
          timezone?: string;
          default_language?: Database["public"]["Enums"]["supported_language"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          email?: string | null;
          phone?: string | null;
          timezone?: string;
          default_language?: Database["public"]["Enums"]["supported_language"];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          description: string | null;
          duration_minutes: number;
          normal_price_cents: number | null;
          currency: string;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          description?: string | null;
          duration_minutes: number;
          normal_price_cents?: number | null;
          currency?: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          description?: string | null;
          duration_minutes?: number;
          normal_price_cents?: number | null;
          currency?: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sms_consents: {
        Row: {
          id: string;
          organization_id: string;
          customer_id: string;
          phone_e164: string;
          status: Database["public"]["Enums"]["sms_consent_status"];
          source: string;
          consent_text: string | null;
          consented_at: string | null;
          unsubscribed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          customer_id: string;
          phone_e164: string;
          status?: Database["public"]["Enums"]["sms_consent_status"];
          source: string;
          consent_text?: string | null;
          consented_at?: string | null;
          unsubscribed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          customer_id?: string;
          phone_e164?: string;
          status?: Database["public"]["Enums"]["sms_consent_status"];
          source?: string;
          consent_text?: string | null;
          consented_at?: string | null;
          unsubscribed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sms_messages: {
        Row: {
          id: string;
          organization_id: string;
          customer_id: string | null;
          opening_id: string | null;
          direction: Database["public"]["Enums"]["sms_direction"];
          provider: string;
          provider_message_id: string | null;
          from_number: string;
          to_number: string;
          body: string;
          status: string;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          customer_id?: string | null;
          opening_id?: string | null;
          direction: Database["public"]["Enums"]["sms_direction"];
          provider: string;
          provider_message_id?: string | null;
          from_number: string;
          to_number: string;
          body: string;
          status: string;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          customer_id?: string | null;
          opening_id?: string | null;
          direction?: Database["public"]["Enums"]["sms_direction"];
          provider?: string;
          provider_message_id?: string | null;
          from_number?: string;
          to_number?: string;
          body?: string;
          status?: string;
          error_message?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      sms_usage_counters: {
        Row: {
          id: string;
          organization_id: string;
          usage_date: string;
          usage_month: string;
          daily_sent_count: number;
          monthly_sent_count: number;
          provider_cost_cents: number;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          usage_date: string;
          usage_month: string;
          daily_sent_count?: number;
          monthly_sent_count?: number;
          provider_cost_cents?: number;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          usage_date?: string;
          usage_month?: string;
          daily_sent_count?: number;
          monthly_sent_count?: number;
          provider_cost_cents?: number;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      waitlist_entries: {
        Row: {
          id: string;
          organization_id: string;
          customer_id: string;
          service_id: string | null;
          status: Database["public"]["Enums"]["waitlist_status"];
          preferred_days: string[];
          preferred_time_windows: string[];
          discount_interest: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          customer_id: string;
          service_id?: string | null;
          status?: Database["public"]["Enums"]["waitlist_status"];
          preferred_days?: string[];
          preferred_time_windows?: string[];
          discount_interest?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          customer_id?: string;
          service_id?: string | null;
          status?: Database["public"]["Enums"]["waitlist_status"];
          preferred_days?: string[];
          preferred_time_windows?: string[];
          discount_interest?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_organization_with_owner: {
        Args: {
          organization_name: string;
          organization_slug: string;
          organization_email: string;
          organization_phone: string;
          organization_timezone: string;
          organization_default_language: Database["public"]["Enums"]["supported_language"];
        };
        Returns: string;
      };
      register_waitlist_signup: {
        Args: {
          organization_slug: string;
          customer_full_name: string;
          customer_phone_e164: string;
          customer_preferred_language: Database["public"]["Enums"]["supported_language"];
          service_interest: string;
          preferred_days: string[];
          preferred_time_windows: string[];
          wants_discount: boolean;
          consent_copy: string;
        };
        Returns: string;
      };
      validate_opening_offer: {
        Args: {
          target_opening_id: string;
          target_offer_id: string;
          recovered_value_cents: number;
          commission_cents: number;
        };
        Returns: string;
      };
    };
    Enums: {
      booking_request_status:
        | "pending_merchant_validation"
        | "confirmed"
        | "cancelled"
        | "completed"
        | "no_show";
      discount_type: "none" | "fixed_amount" | "percentage" | "custom";
      opening_offer_status:
        | "pending"
        | "sent"
        | "responded"
        | "selected"
        | "rejected"
        | "expired"
        | "invalid";
      opening_status:
        | "draft"
        | "broadcasting"
        | "awaiting_validation"
        | "filled"
        | "expired"
        | "cancelled";
      organization_role: "owner" | "manager" | "staff";
      sms_consent_status: "opted_in" | "needs_consent" | "opted_out";
      sms_direction: "outbound" | "inbound";
      supported_language: "en" | "fr";
      waitlist_status: "active" | "paused" | "booked" | "removed";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
