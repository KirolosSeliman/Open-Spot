export function isFailedSmsStatus(status: string | null | undefined) {
  return ["failed", "undelivered", "error"].includes(String(status ?? ""));
}

export function isDeliveredSmsStatus(status: string | null | undefined) {
  return String(status ?? "") === "delivered";
}

export function isTerminalSmsStatus(status: string | null | undefined) {
  return ["delivered", "failed", "undelivered", "received"].includes(
    String(status ?? "")
  );
}

export function hasMissingStatusCallback({
  provider,
  direction,
  status,
  statusCallbackReceivedAt,
  createdAt,
  now = new Date()
}: {
  provider: string | null | undefined;
  direction: string | null | undefined;
  status: string | null | undefined;
  statusCallbackReceivedAt: string | null | undefined;
  createdAt: string;
  now?: Date;
}) {
  if (
    provider !== "twilio" ||
    direction !== "outbound" ||
    statusCallbackReceivedAt ||
    isTerminalSmsStatus(status)
  ) {
    return false;
  }

  return now.getTime() - Date.parse(createdAt) > 10 * 60 * 1000;
}

export function getInboundReplyClassificationLabel(classification: string | null) {
  switch (classification) {
    case "opt_out":
      return "Opt-out";
    case "appointment_confirm":
      return "Appointment confirmed";
    case "appointment_cancel":
      return "Appointment cancelled";
    case "waitlist_positive":
      return "Waitlist positive";
    default:
      return "Unknown";
  }
}
