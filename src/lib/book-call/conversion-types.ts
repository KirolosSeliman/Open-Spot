import type { Database } from "@/types/database";

export const callRequestConversionStatuses = [
  "not_started",
  "processing",
  "client_created",
  "invite_sent",
  "completed",
  "invite_failed",
  "failed"
] as const;

export type CallRequestConversionStatus =
  (typeof callRequestConversionStatuses)[number];

export const callRequestInvitationStatuses = [
  "pending",
  "sent",
  "failed",
  "not_required"
] as const;

export type CallRequestInvitationStatus =
  (typeof callRequestInvitationStatuses)[number];

export type BookCallRequestRow = Database["public"]["Tables"]["book_call_requests"]["Row"];

export type ConversionResult =
  | {
      status: "completed";
      organizationId: string;
      userId: string;
      invitationSent: boolean;
      existingUser: boolean;
      email: string;
    }
  | {
      status: "partial";
      organizationId: string;
      userId: string;
      invitationSent: false;
      errorCode: string;
      errorMessage: string;
      email: string;
    }
  | {
      status: "already_converted";
      organizationId: string;
      userId: string | null;
      invitationStatus: CallRequestInvitationStatus | null;
      email: string;
    }
  | {
      status: "failed";
      errorCode: string;
      errorMessage: string;
    }
  | {
      status: "processing";
      errorMessage: string;
    };

export type ResendInvitationResult =
  | {
      status: "sent";
      email: string;
    }
  | {
      status: "failed";
      errorCode: string;
      errorMessage: string;
    };

export function isConversionComplete(request: Pick<BookCallRequestRow, "conversion_status" | "organization_id">) {
  return (
    request.organization_id !== null &&
    (request.conversion_status === "completed" ||
      request.conversion_status === "invite_sent" ||
      request.conversion_status === "client_created")
  );
}

export function canConvertRequest(request: Pick<
  BookCallRequestRow,
  "email" | "business_name" | "conversion_status" | "organization_id"
>) {
  if (isConversionComplete(request)) {
    return false;
  }

  if (request.conversion_status === "processing") {
    return false;
  }

  const email = request.email?.trim().toLowerCase() ?? "";
  const businessName = request.business_name?.trim() ?? "";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return false;
  }

  return businessName.length >= 2;
}
