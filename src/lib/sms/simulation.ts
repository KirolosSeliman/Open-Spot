export function getNextResponseRank(ranks: Array<number | null>) {
  return Math.max(0, ...ranks.map((rank) => rank ?? 0)) + 1;
}

export function isManualValidationRequired(replyBody: string) {
  void replyBody;
  return true;
}

export function normalizeSimulatedReply(replyBody: string) {
  return replyBody.trim();
}
