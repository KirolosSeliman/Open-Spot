import { maskTwilioSid } from "@/lib/sms/twilio-validation";

type TwilioEnv = Partial<Record<string, string | undefined>>;

export type SafeTwilioUiError = {
  title: string;
  message: string;
  technicalDetail?: string;
  recommendedAction?: string;
  twilioCode?: string;
  maskedAccountSid?: string | null;
  maskedPhoneNumberSid?: string | null;
};

const PHONE_NOT_FOUND_PATTERNS = [
  /IncomingPhoneNumbers\/PN/i,
  /requested resource .* was not found/i,
  /\b20404\b/
];

function extractTwilioCode(raw: string) {
  const match = raw.match(/\b(2\d{4})\b/);

  return match?.[1];
}

function sanitizeTechnicalDetail(raw: string, env: TwilioEnv = process.env) {
  let sanitized = raw;

  if (env.TWILIO_AUTH_TOKEN) {
    sanitized = sanitized.replaceAll(env.TWILIO_AUTH_TOKEN, "[redacted]");
  }

  sanitized = sanitized.replace(/\b(AC[a-zA-Z0-9]{32})\b/g, (sid) => maskTwilioSid(sid) ?? "••••");
  sanitized = sanitized.replace(/\b(PN[a-zA-Z0-9]{32})\b/g, (sid) => maskTwilioSid(sid) ?? "••••");
  sanitized = sanitized.replace(/\b(MG[a-zA-Z0-9]{32})\b/g, (sid) => maskTwilioSid(sid) ?? "••••");

  return sanitized.slice(0, 500);
}

export function getSafeTwilioUiError(
  error: unknown,
  context?: {
    accountSid?: string | null;
    phoneNumberSid?: string | null;
  },
  env: TwilioEnv = process.env
): SafeTwilioUiError {
  const raw = error instanceof Error ? error.message : String(error);
  const twilioCode = extractTwilioCode(raw);
  const maskedAccountSid = maskTwilioSid(context?.accountSid);
  const maskedPhoneNumberSid = maskTwilioSid(context?.phoneNumberSid);

  if (PHONE_NOT_FOUND_PATTERNS.some((pattern) => pattern.test(raw))) {
    return {
      title: "Impossible de configurer les webhooks Twilio.",
      message:
        "Le numéro Twilio enregistré est introuvable dans le compte ou sous-compte lié. Resynchronisez les numéros ou sélectionnez un numéro valide.",
      technicalDetail: sanitizeTechnicalDetail(raw, env),
      recommendedAction:
        "Synchronisez depuis Twilio ou assignez un numéro valide dans ce sous-compte.",
      twilioCode,
      maskedAccountSid,
      maskedPhoneNumberSid
    };
  }

  if (/Messaging Service/i.test(raw) && /not found/i.test(raw)) {
    return {
      title: "Service d'envoi Twilio introuvable.",
      message:
        "Le Messaging Service enregistré est introuvable dans le compte Twilio lié. Recréez ou resynchronisez le service.",
      technicalDetail: sanitizeTechnicalDetail(raw, env),
      recommendedAction: "Configurez à nouveau le service d'envoi.",
      twilioCode,
      maskedAccountSid,
      maskedPhoneNumberSid
    };
  }

  return {
    title: "Erreur Twilio",
    message: sanitizeTechnicalDetail(raw, env).slice(0, 240),
    technicalDetail: sanitizeTechnicalDetail(raw, env),
    recommendedAction: "Vérifiez la configuration Twilio puis resynchronisez.",
    twilioCode,
    maskedAccountSid,
    maskedPhoneNumberSid
  };
}

export function formatSafeTwilioUiErrorMessage(error: SafeTwilioUiError) {
  return error.message;
}

export function getSafeTwilioErrorMessage(error: unknown, env: TwilioEnv = process.env) {
  return getSafeTwilioUiError(error, undefined, env).message;
}

export function isTwilioDuplicateMessagingAttachError(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error);

  return (
    /\b21710\b/.test(raw) ||
    /already exists in the Messaging Service/i.test(raw) ||
    /Phone Number is already in the Messaging Service/i.test(raw)
  );
}
