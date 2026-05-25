export type RecoveredBookingMetric = {
  recoveredValueCents: number;
  commissionCents: number;
};

export function calculateDashboardMetrics({
  openingsCreated,
  openingsFilled,
  smsSent,
  responsesReceived,
  recoveredBookings,
  waitlistCustomers,
  optOuts
}: {
  openingsCreated: number;
  openingsFilled: number;
  smsSent: number;
  responsesReceived: number;
  recoveredBookings: RecoveredBookingMetric[];
  waitlistCustomers: number;
  optOuts: number;
}) {
  return {
    recoveredRevenueCents: recoveredBookings.reduce(
      (total, booking) => total + booking.recoveredValueCents,
      0
    ),
    openingsCreated,
    openingsFilled,
    responseRate: smsSent === 0 ? 0 : Math.round((responsesReceived / smsSent) * 100),
    waitlistCustomers,
    smsSent,
    optOuts,
    estimatedCommissionCents: recoveredBookings.reduce(
      (total, booking) => total + booking.commissionCents,
      0
    )
  };
}
