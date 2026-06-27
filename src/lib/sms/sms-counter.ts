const GSM_BASIC_CHARS =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
const GSM_EXTENDED_CHARS = "^{}\\[~]|€";

function isGsmCharacter(character: string) {
  return (
    GSM_BASIC_CHARS.includes(character) ||
    GSM_EXTENDED_CHARS.includes(character)
  );
}

function isGsmBody(body: string) {
  return [...body].every(isGsmCharacter);
}

export type SmsCounterResult = {
  characterCount: number;
  segmentCount: number;
  encoding: "gsm" | "unicode";
  isLongMessage: boolean;
};

export function countSmsSegments(body: string): SmsCounterResult {
  const characterCount = [...body].length;
  const encoding = isGsmBody(body) ? "gsm" : "unicode";
  const singleSegmentLimit = encoding === "gsm" ? 160 : 70;
  const multiSegmentLimit = encoding === "gsm" ? 153 : 67;
  const segmentCount =
    characterCount === 0
      ? 1
      : characterCount <= singleSegmentLimit
        ? 1
        : Math.ceil(characterCount / multiSegmentLimit);

  return {
    characterCount,
    segmentCount,
    encoding,
    isLongMessage: segmentCount > 2
  };
}

export function formatSmsCounterLabel(body: string) {
  const result = countSmsSegments(body);
  const smsLabel = result.segmentCount === 1 ? "1 SMS" : `${result.segmentCount} SMS`;

  return {
    ...result,
    label: `${result.characterCount} caractères (${smsLabel})`
  };
}
