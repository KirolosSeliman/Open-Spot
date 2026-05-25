export type OfferValidationState = {
  id: string;
  status: "pending" | "sent" | "responded" | "selected" | "rejected" | "expired" | "invalid";
};

export function planManualValidation({
  openingStatus,
  selectedOfferId,
  offers
}: {
  openingStatus: string;
  selectedOfferId: string;
  offers: OfferValidationState[];
}) {
  if (openingStatus === "filled") {
    throw new Error("Opening has already been filled.");
  }

  if (!offers.some((offer) => offer.id === selectedOfferId)) {
    throw new Error("Selected offer does not belong to this opening.");
  }

  return offers.map((offer) => ({
    id: offer.id,
    status: offer.id === selectedOfferId ? "selected" : "rejected"
  }));
}
