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
      book_call_requests: {
        Row: {
          id: string;
          locale: "fr" | "en";
          full_name: string;
          business_name: string;
          email: string;
          phone: string;
          business_type: string | null;
          current_booking_system: string | null;
          cancellation_volume: string | null;
          preferred_time_message: string | null;
          consent_sms_email: boolean;
          status: "new" | "contacted" | "qualified" | "closed" | "spam";
          source_path: string;
          source_url: string | null;
          user_agent: string | null;
          internal_notes: string | null;
          created_at: string;
          updated_at: string;
          contacted_at: string | null;
        };
        Insert: {
          id?: string;
          locale?: "fr" | "en";
          full_name: string;
          business_name: string;
          email: string;
          phone: string;
          business_type?: string | null;
          current_booking_system?: string | null;
          cancellation_volume?: string | null;
          preferred_time_message?: string | null;
          consent_sms_email?: boolean;
          status?: "new" | "contacted" | "qualified" | "closed" | "spam";
          source_path?: string;
          source_url?: string | null;
          user_agent?: string | null;
          internal_notes?: string | null;
          created_at?: string;
          updated_at?: string;
          contacted_at?: string | null;
        };
        Update: {
          id?: string;
          locale?: "fr" | "en";
          full_name?: string;
          business_name?: string;
          email?: string;
          phone?: string;
          business_type?: string | null;
          current_booking_system?: string | null;
          cancellation_volume?: string | null;
          preferred_time_message?: string | null;
          consent_sms_email?: boolean;
          status?: "new" | "contacted" | "qualified" | "closed" | "spam";
          source_path?: string;
          source_url?: string | null;
          user_agent?: string | null;
          internal_notes?: string | null;
          created_at?: string;
          updated_at?: string;
          contacted_at?: string | null;
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
          deleted_at: string | null;
          deleted_by_profile_id: string | null;
          deleted_reason: string | null;
          restored_at: string | null;
          restored_by_profile_id: string | null;
          deletion_metadata: Json;
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
          deleted_at?: string | null;
          deleted_by_profile_id?: string | null;
          deleted_reason?: string | null;
          restored_at?: string | null;
          restored_by_profile_id?: string | null;
          deletion_metadata?: Json;
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
          deleted_at?: string | null;
          deleted_by_profile_id?: string | null;
          deleted_reason?: string | null;
          restored_at?: string | null;
          restored_by_profile_id?: string | null;
          deletion_metadata?: Json;
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
      platform_admin_sessions: {
        Row: {
          id: string;
          platform_admin_id: string;
          admin_user_id: string;
          admin_email: string;
          organization_id: string;
          acting_role: "manager";
          reason: string;
          status: "active" | "ended" | "expired";
          started_at: string;
          expires_at: string;
          ended_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          platform_admin_id: string;
          admin_user_id: string;
          admin_email: string;
          organization_id: string;
          acting_role?: "manager";
          reason: string;
          status?: "active" | "ended" | "expired";
          started_at?: string;
          expires_at: string;
          ended_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          platform_admin_id?: string;
          admin_user_id?: string;
          admin_email?: string;
          organization_id?: string;
          acting_role?: "manager";
          reason?: string;
          status?: "active" | "ended" | "expired";
          started_at?: string;
          expires_at?: string;
          ended_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      platform_sms_webhook_events: {
        Row: {
          id: string;
          provider: string;
          event_type: "inbound" | "status_callback" | "simulator_inbound";
          processing_status:
            | "received_linked"
            | "received_unlinked"
            | "invalid_signature"
            | "status_updated"
            | "status_unmatched"
            | "storage_unavailable"
            | "persistence_failed"
            | "ignored"
            | "error";
          organization_id: string | null;
          customer_id: string | null;
          opening_id: string | null;
          appointment_id: string | null;
          sms_message_id: string | null;
          provider_message_id: string | null;
          from_number: string | null;
          to_number: string | null;
          classification: string | null;
          http_status: number | null;
          error_code: string | null;
          error_message: string | null;
          body_preview: string | null;
          payload_summary: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          provider: string;
          event_type: "inbound" | "status_callback" | "simulator_inbound";
          processing_status:
            | "received_linked"
            | "received_unlinked"
            | "invalid_signature"
            | "status_updated"
            | "status_unmatched"
            | "storage_unavailable"
            | "persistence_failed"
            | "ignored"
            | "error";
          organization_id?: string | null;
          customer_id?: string | null;
          opening_id?: string | null;
          appointment_id?: string | null;
          sms_message_id?: string | null;
          provider_message_id?: string | null;
          from_number?: string | null;
          to_number?: string | null;
          classification?: string | null;
          http_status?: number | null;
          error_code?: string | null;
          error_message?: string | null;
          body_preview?: string | null;
          payload_summary?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          provider?: string;
          event_type?: "inbound" | "status_callback" | "simulator_inbound";
          processing_status?:
            | "received_linked"
            | "received_unlinked"
            | "invalid_signature"
            | "status_updated"
            | "status_unmatched"
            | "storage_unavailable"
            | "persistence_failed"
            | "ignored"
            | "error";
          organization_id?: string | null;
          customer_id?: string | null;
          opening_id?: string | null;
          appointment_id?: string | null;
          sms_message_id?: string | null;
          provider_message_id?: string | null;
          from_number?: string | null;
          to_number?: string | null;
          classification?: string | null;
          http_status?: number | null;
          error_code?: string | null;
          error_message?: string | null;
          body_preview?: string | null;
          payload_summary?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      platform_compliance_reviews: {
        Row: {
          id: string;
          organization_id: string | null;
          issue_key: string;
          issue_type: string;
          status: "open" | "reviewed" | "resolved" | "dismissed";
          severity: "low" | "medium" | "high";
          note: string | null;
          reviewed_by_platform_admin_id: string | null;
          reviewed_at: string | null;
          resolved_at: string | null;
          dismissed_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id?: string | null;
          issue_key: string;
          issue_type: string;
          status?: "open" | "reviewed" | "resolved" | "dismissed";
          severity?: "low" | "medium" | "high";
          note?: string | null;
          reviewed_by_platform_admin_id?: string | null;
          reviewed_at?: string | null;
          resolved_at?: string | null;
          dismissed_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string | null;
          issue_key?: string;
          issue_type?: string;
          status?: "open" | "reviewed" | "resolved" | "dismissed";
          severity?: "low" | "medium" | "high";
          note?: string | null;
          reviewed_by_platform_admin_id?: string | null;
          reviewed_at?: string | null;
          resolved_at?: string | null;
          dismissed_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      platform_organization_admin_controls: {
        Row: {
          organization_id: string;
          support_status: "healthy" | "needs_setup" | "watchlist" | "blocked" | "disabled";
          admin_note: string | null;
          is_internal_test: boolean;
          sms_sending_paused: boolean;
          sms_paused_at: string | null;
          sms_paused_by_platform_admin_id: string | null;
          sms_pause_reason: string | null;
          sms_resumed_at: string | null;
          sms_resumed_by_platform_admin_id: string | null;
          disabled_at: string | null;
          disabled_by_platform_admin_id: string | null;
          disabled_reason: string | null;
          reactivated_at: string | null;
          reactivated_by_platform_admin_id: string | null;
          archived_at: string | null;
          archived_by_platform_admin_id: string | null;
          archived_reason: string | null;
          unarchived_at: string | null;
          unarchived_by_platform_admin_id: string | null;
          last_health_check_at: string | null;
          last_health_check_status: "healthy" | "warning" | "blocked" | "unknown" | null;
          last_health_check_payload: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          support_status?: "healthy" | "needs_setup" | "watchlist" | "blocked" | "disabled";
          admin_note?: string | null;
          is_internal_test?: boolean;
          sms_sending_paused?: boolean;
          sms_paused_at?: string | null;
          sms_paused_by_platform_admin_id?: string | null;
          sms_pause_reason?: string | null;
          sms_resumed_at?: string | null;
          sms_resumed_by_platform_admin_id?: string | null;
          disabled_at?: string | null;
          disabled_by_platform_admin_id?: string | null;
          disabled_reason?: string | null;
          reactivated_at?: string | null;
          reactivated_by_platform_admin_id?: string | null;
          archived_at?: string | null;
          archived_by_platform_admin_id?: string | null;
          archived_reason?: string | null;
          unarchived_at?: string | null;
          unarchived_by_platform_admin_id?: string | null;
          last_health_check_at?: string | null;
          last_health_check_status?: "healthy" | "warning" | "blocked" | "unknown" | null;
          last_health_check_payload?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          organization_id?: string;
          support_status?: "healthy" | "needs_setup" | "watchlist" | "blocked" | "disabled";
          admin_note?: string | null;
          is_internal_test?: boolean;
          sms_sending_paused?: boolean;
          sms_paused_at?: string | null;
          sms_paused_by_platform_admin_id?: string | null;
          sms_pause_reason?: string | null;
          sms_resumed_at?: string | null;
          sms_resumed_by_platform_admin_id?: string | null;
          disabled_at?: string | null;
          disabled_by_platform_admin_id?: string | null;
          disabled_reason?: string | null;
          reactivated_at?: string | null;
          reactivated_by_platform_admin_id?: string | null;
          archived_at?: string | null;
          archived_by_platform_admin_id?: string | null;
          archived_reason?: string | null;
          unarchived_at?: string | null;
          unarchived_by_platform_admin_id?: string | null;
          last_health_check_at?: string | null;
          last_health_check_status?: "healthy" | "warning" | "blocked" | "unknown" | null;
          last_health_check_payload?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      platform_organization_billing_terms: {
        Row: {
          organization_id: string;
          currency: string;
          monthly_subscription_cents: number;
          filled_spot_fee_mode: "none" | "fixed" | "percentage" | "fixed_plus_percentage";
          filled_spot_fixed_fee_cents: number;
          filled_spot_percentage_bps: number;
          notes: string | null;
          updated_by_platform_admin_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          currency?: string;
          monthly_subscription_cents?: number;
          filled_spot_fee_mode?: "none" | "fixed" | "percentage" | "fixed_plus_percentage";
          filled_spot_fixed_fee_cents?: number;
          filled_spot_percentage_bps?: number;
          notes?: string | null;
          updated_by_platform_admin_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          organization_id?: string;
          currency?: string;
          monthly_subscription_cents?: number;
          filled_spot_fee_mode?: "none" | "fixed" | "percentage" | "fixed_plus_percentage";
          filled_spot_fixed_fee_cents?: number;
          filled_spot_percentage_bps?: number;
          notes?: string | null;
          updated_by_platform_admin_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      potential_clients: {
        Row: {
          id: string;
          full_name: string;
          business_name: string;
          email: string;
          phone: string;
          phone_normalized: string | null;
          business_type: string;
          preferred_contact_method: "sms" | "email" | "either";
          message: string | null;
          status:
            | "new"
            | "contacted"
            | "call_booked"
            | "qualified"
            | "not_a_fit"
            | "won"
            | "lost"
            | "archived";
          source: string;
          source_path: string | null;
          consent_to_contact: boolean;
          consent_text: string;
          consented_at: string;
          consent_ip: string | null;
          consent_user_agent: string | null;
          confirmation_email_sent_at: string | null;
          confirmation_email_status: "pending" | "sent" | "failed" | "skipped" | null;
          owner_notification_sent_at: string | null;
          owner_notification_status: "pending" | "sent" | "failed" | "skipped" | null;
          last_contacted_at: string | null;
          last_contact_channel: "sms" | "email" | "phone" | "other" | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          business_name: string;
          email: string;
          phone: string;
          phone_normalized?: string | null;
          business_type: string;
          preferred_contact_method: "sms" | "email" | "either";
          message?: string | null;
          status?:
            | "new"
            | "contacted"
            | "call_booked"
            | "qualified"
            | "not_a_fit"
            | "won"
            | "lost"
            | "archived";
          source?: string;
          source_path?: string | null;
          consent_to_contact: boolean;
          consent_text: string;
          consented_at: string;
          consent_ip?: string | null;
          consent_user_agent?: string | null;
          confirmation_email_sent_at?: string | null;
          confirmation_email_status?: "pending" | "sent" | "failed" | "skipped" | null;
          owner_notification_sent_at?: string | null;
          owner_notification_status?: "pending" | "sent" | "failed" | "skipped" | null;
          last_contacted_at?: string | null;
          last_contact_channel?: "sms" | "email" | "phone" | "other" | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          business_name?: string;
          email?: string;
          phone?: string;
          phone_normalized?: string | null;
          business_type?: string;
          preferred_contact_method?: "sms" | "email" | "either";
          message?: string | null;
          status?:
            | "new"
            | "contacted"
            | "call_booked"
            | "qualified"
            | "not_a_fit"
            | "won"
            | "lost"
            | "archived";
          source?: string;
          source_path?: string | null;
          consent_to_contact?: boolean;
          consent_text?: string;
          consented_at?: string;
          consent_ip?: string | null;
          consent_user_agent?: string | null;
          confirmation_email_sent_at?: string | null;
          confirmation_email_status?: "pending" | "sent" | "failed" | "skipped" | null;
          owner_notification_sent_at?: string | null;
          owner_notification_status?: "pending" | "sent" | "failed" | "skipped" | null;
          last_contacted_at?: string | null;
          last_contact_channel?: "sms" | "email" | "phone" | "other" | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
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
      sms_consent_requests: {
        Row: {
          id: string;
          organization_id: string;
          customer_id: string;
          status: string;
          phone_e164: string;
          language: string;
          outbound_sms_message_id: string | null;
          inbound_sms_message_id: string | null;
          provider: string | null;
          provider_message_id: string | null;
          message_body: string;
          sent_at: string | null;
          responded_at: string | null;
          accepted_at: string | null;
          declined_at: string | null;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          customer_id: string;
          status?: string;
          phone_e164: string;
          language?: string;
          outbound_sms_message_id?: string | null;
          inbound_sms_message_id?: string | null;
          provider?: string | null;
          provider_message_id?: string | null;
          message_body: string;
          sent_at?: string | null;
          responded_at?: string | null;
          accepted_at?: string | null;
          declined_at?: string | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          customer_id?: string;
          status?: string;
          phone_e164?: string;
          language?: string;
          outbound_sms_message_id?: string | null;
          inbound_sms_message_id?: string | null;
          provider?: string | null;
          provider_message_id?: string | null;
          message_body?: string;
          sent_at?: string | null;
          responded_at?: string | null;
          accepted_at?: string | null;
          declined_at?: string | null;
          error_message?: string | null;
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
          message_type: string | null;
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
          message_type?: string | null;
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
          message_type?: string | null;
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
          opening_normal_price_cents: number | null;
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
      record_opening_confirmation_audit: {
        Args: {
          target_opening_id: string;
          target_offer_id: string;
          target_booking_request_id: string;
          target_sms_message_id: string;
          provider_name: string;
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
      schedule_appointment_reminder: {
        Args: {
          target_organization_id: string;
          target_appointment_id: string;
          target_customer_id: string;
          target_scheduled_for: string;
          target_template_key?: string;
        };
        Returns: string;
      };
      cancel_pending_appointment_reminders: {
        Args: {
          target_organization_id: string;
          target_appointment_id: string;
        };
        Returns: number;
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
