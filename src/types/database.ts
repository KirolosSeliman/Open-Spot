export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Enums: {
      organization_role: "owner" | "manager" | "staff";
      supported_language: "en" | "fr";
      sms_consent_status: "opted_in" | "needs_consent" | "opted_out";
      waitlist_status: "active" | "paused" | "booked" | "removed";
      discount_type: "none" | "fixed_amount" | "percentage" | "custom";
      opening_status:
        | "draft"
        | "broadcasting"
        | "awaiting_validation"
        | "filled"
        | "expired"
        | "cancelled";
      opening_offer_status:
        | "pending"
        | "sent"
        | "responded"
        | "selected"
        | "rejected"
        | "expired"
        | "invalid";
      booking_request_status:
        | "pending_merchant_validation"
        | "confirmed"
        | "cancelled"
        | "completed"
        | "no_show";
      sms_direction: "outbound" | "inbound";
    };
    Tables: {
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
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: Database["public"]["Enums"]["organization_role"];
          created_at: string;
        };
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
      };
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
      };
    };
    Functions: {
      validate_opening_offer: {
        Args: {
          target_opening_id: string;
          target_offer_id: string;
          recovered_value_cents: number;
          commission_cents: number;
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
    };
  };
};
