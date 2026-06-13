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
      appointment_events: {
        Row: {
          id: string;
          organization_id: string;
          appointment_id: string;
          actor_profile_id: string | null;
          event_type: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          appointment_id: string;
          actor_profile_id?: string | null;
          event_type: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          appointment_id?: string;
          actor_profile_id?: string | null;
          event_type?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      appointments: {
        Row: {
          id: string;
          organization_id: string;
          customer_id: string;
          service_id: string | null;
          starts_at: string;
          ends_at: string | null;
          timezone: string;
          status: string;
          reminder_status: string;
          confirmation_status: string;
          reminder_24h_enabled: boolean;
          confirmation_request_enabled: boolean;
          source: string;
          notes: string | null;
          created_by_profile_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          customer_id: string;
          service_id?: string | null;
          starts_at: string;
          ends_at?: string | null;
          timezone?: string;
          status?: string;
          reminder_status?: string;
          confirmation_status?: string;
          reminder_24h_enabled?: boolean;
          confirmation_request_enabled?: boolean;
          source?: string;
          notes?: string | null;
          created_by_profile_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          customer_id?: string;
          service_id?: string | null;
          starts_at?: string;
          ends_at?: string | null;
          timezone?: string;
          status?: string;
          reminder_status?: string;
          confirmation_status?: string;
          reminder_24h_enabled?: boolean;
          confirmation_request_enabled?: boolean;
          source?: string;
          notes?: string | null;
          created_by_profile_id?: string | null;
          created_at?: string;
          updated_at?: string;
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
          source: string;
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
          source?: string;
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
          source?: string;
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
          source: string;
          source_appointment_id: string | null;
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
          source?: string;
          source_appointment_id?: string | null;
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
          source?: string;
          source_appointment_id?: string | null;
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
      organization_settings: {
        Row: {
          id: string;
          organization_id: string;
          default_language: Database["public"]["Enums"]["supported_language"];
          sms_daily_limit: number;
          sms_monthly_limit: number;
          waitlist_public_enabled: boolean;
          appointment_reminders_enabled: boolean;
          default_reminder_delay_hours: number;
          appointment_confirmation_requests_enabled: boolean;
          client_sms_cancellation_enabled: boolean;
          auto_create_opening_on_sms_cancellation: boolean;
          auto_send_recovery_sms_on_cancellation: boolean;
          unavailable_sms_to_non_selected_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          default_language?: Database["public"]["Enums"]["supported_language"];
          sms_daily_limit?: number;
          sms_monthly_limit?: number;
          waitlist_public_enabled?: boolean;
          appointment_reminders_enabled?: boolean;
          default_reminder_delay_hours?: number;
          appointment_confirmation_requests_enabled?: boolean;
          client_sms_cancellation_enabled?: boolean;
          auto_create_opening_on_sms_cancellation?: boolean;
          auto_send_recovery_sms_on_cancellation?: boolean;
          unavailable_sms_to_non_selected_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          default_language?: Database["public"]["Enums"]["supported_language"];
          sms_daily_limit?: number;
          sms_monthly_limit?: number;
          waitlist_public_enabled?: boolean;
          appointment_reminders_enabled?: boolean;
          default_reminder_delay_hours?: number;
          appointment_confirmation_requests_enabled?: boolean;
          client_sms_cancellation_enabled?: boolean;
          auto_create_opening_on_sms_cancellation?: boolean;
          auto_send_recovery_sms_on_cancellation?: boolean;
          unavailable_sms_to_non_selected_enabled?: boolean;
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
          profile_id: string;
          role: Database["public"]["Enums"]["organization_role"];
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          profile_id: string;
          role?: Database["public"]["Enums"]["organization_role"];
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          profile_id?: string;
          role?: Database["public"]["Enums"]["organization_role"];
          status?: string;
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
      platform_admins: {
        Row: {
          id: string;
          user_id: string | null;
          email: string;
          role: "super_admin" | "account_admin" | "support_admin" | "analyst";
          status: "active" | "inactive" | "suspended";
          created_at: string;
          updated_at: string;
          last_seen_at: string | null;
          active: boolean;
          created_by: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          email: string;
          role?: "super_admin" | "account_admin" | "support_admin" | "analyst";
          status?: "active" | "inactive" | "suspended";
          created_at?: string;
          updated_at?: string;
          last_seen_at?: string | null;
          active?: boolean;
          created_by?: string | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          email?: string;
          role?: "super_admin" | "account_admin" | "support_admin" | "analyst";
          status?: "active" | "inactive" | "suspended";
          created_at?: string;
          updated_at?: string;
          last_seen_at?: string | null;
          active?: boolean;
          created_by?: string | null;
          notes?: string | null;
        };
        Relationships: [];
      };
      platform_admin_organization_access: {
        Row: {
          id: string;
          platform_admin_id: string;
          organization_id: string;
          access_level: "read_only" | "support" | "manager_mode";
          granted_by: string | null;
          granted_at: string;
          revoked_at: string | null;
        };
        Insert: {
          id?: string;
          platform_admin_id: string;
          organization_id: string;
          access_level?: "read_only" | "support" | "manager_mode";
          granted_by?: string | null;
          granted_at?: string;
          revoked_at?: string | null;
        };
        Update: {
          platform_admin_id?: string;
          organization_id?: string;
          access_level?: "read_only" | "support" | "manager_mode";
          granted_by?: string | null;
          granted_at?: string;
          revoked_at?: string | null;
        };
        Relationships: [];
      };
      platform_admin_audit_logs: {
        Row: {
          id: string;
          platform_admin_id: string | null;
          admin_user_id: string | null;
          admin_email: string | null;
          organization_id: string | null;
          action: string;
          entity_type: string | null;
          entity_id: string | null;
          metadata: Json;
          ip: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          platform_admin_id?: string | null;
          admin_user_id?: string | null;
          admin_email?: string | null;
          organization_id?: string | null;
          action: string;
          entity_type?: string | null;
          entity_id?: string | null;
          metadata?: Json;
          ip?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          platform_admin_id?: string | null;
          admin_user_id?: string | null;
          admin_email?: string | null;
          organization_id?: string | null;
          action?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          metadata?: Json;
          ip?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          auth_user_id: string;
          full_name: string | null;
          email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id: string;
          full_name?: string | null;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          auth_user_id?: string;
          full_name?: string | null;
          email?: string | null;
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
      scheduled_messages: {
        Row: {
          id: string;
          organization_id: string;
          customer_id: string;
          appointment_id: string | null;
          opening_id: string | null;
          message_type: string;
          channel: string;
          scheduled_for: string;
          status: string;
          template_key: string;
          body_snapshot: string | null;
          provider: string | null;
          provider_message_id: string | null;
          sent_at: string | null;
          failed_at: string | null;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          customer_id: string;
          appointment_id?: string | null;
          opening_id?: string | null;
          message_type: string;
          channel?: string;
          scheduled_for: string;
          status?: string;
          template_key: string;
          body_snapshot?: string | null;
          provider?: string | null;
          provider_message_id?: string | null;
          sent_at?: string | null;
          failed_at?: string | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          customer_id?: string;
          appointment_id?: string | null;
          opening_id?: string | null;
          message_type?: string;
          channel?: string;
          scheduled_for?: string;
          status?: string;
          template_key?: string;
          body_snapshot?: string | null;
          provider?: string | null;
          provider_message_id?: string | null;
          sent_at?: string | null;
          failed_at?: string | null;
          error_message?: string | null;
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
          appointment_id: string | null;
          direction: Database["public"]["Enums"]["sms_direction"];
          provider: string;
          provider_message_id: string | null;
          from_number: string;
          to_number: string;
          body: string;
          status: string;
          error_code: string | null;
          error_message: string | null;
          status_callback_received_at: string | null;
          delivered_at: string | null;
          failed_at: string | null;
          provider_status_payload: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          customer_id?: string | null;
          opening_id?: string | null;
          appointment_id?: string | null;
          direction: Database["public"]["Enums"]["sms_direction"];
          provider: string;
          provider_message_id?: string | null;
          from_number: string;
          to_number: string;
          body: string;
          status: string;
          error_code?: string | null;
          error_message?: string | null;
          status_callback_received_at?: string | null;
          delivered_at?: string | null;
          failed_at?: string | null;
          provider_status_payload?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          customer_id?: string | null;
          opening_id?: string | null;
          appointment_id?: string | null;
          direction?: Database["public"]["Enums"]["sms_direction"];
          provider?: string;
          provider_message_id?: string | null;
          from_number?: string;
          to_number?: string;
          body?: string;
          status?: string;
          error_code?: string | null;
          error_message?: string | null;
          status_callback_received_at?: string | null;
          delivered_at?: string | null;
          failed_at?: string | null;
          provider_status_payload?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      sms_templates: {
        Row: {
          id: string;
          organization_id: string | null;
          template_key: string;
          language: string;
          body: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id?: string | null;
          template_key: string;
          language: string;
          body: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string | null;
          template_key?: string;
          language?: string;
          body?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
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
          source: string;
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
          source?: string;
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
          source?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      waitlist_entry_services: {
        Row: {
          id: string;
          organization_id: string;
          waitlist_entry_id: string;
          service_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          waitlist_entry_id: string;
          service_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          waitlist_entry_id?: string;
          service_id?: string;
          created_at?: string;
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
      create_opening_with_offers: {
        Args: {
          target_organization_id: string;
          target_service_id: string | null;
          opening_title: string;
          opening_start_time: string;
          opening_end_time: string;
          opening_offer_label: string | null;
        };
        Returns: string;
      };
      get_public_waitlist_signup_data: {
        Args: {
          organization_slug: string;
        };
        Returns: Json;
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
          consent_accepted: boolean;
          consent_copy: string;
          signup_source: string;
          service_ids: string[];
        };
        Returns: string;
      };
      record_opening_broadcast_audit: {
        Args: {
          target_opening_id: string;
          provider_name: string;
          sent_count: number;
          failed_count?: number;
          failure_reasons?: string[];
        };
        Returns: undefined;
      };
      record_simulator_broadcast_audit: {
        Args: {
          target_opening_id: string;
          sent_count: number;
        };
        Returns: undefined;
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
