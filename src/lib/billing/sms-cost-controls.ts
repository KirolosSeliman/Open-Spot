export function canSendSmsWithinLimits({
  dailySent,
  dailyLimit,
  monthlySent,
  monthlyLimit
}: {
  dailySent: number;
  dailyLimit: number;
  monthlySent: number;
  monthlyLimit: number;
}) {
  if (dailySent >= dailyLimit) {
    return {
      ok: false,
      reason: "Daily SMS limit reached."
    };
  }

  if (monthlySent >= monthlyLimit) {
    return {
      ok: false,
      reason: "Monthly SMS limit reached."
    };
  }

  return {
    ok: true,
    reason: null
  };
}
