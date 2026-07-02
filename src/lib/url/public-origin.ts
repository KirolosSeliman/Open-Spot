import {
  LOCAL_DEV_SITE_URL,
  PRODUCTION_SITE_URL,
  isLocalDevelopment
} from "@/lib/site-url";

export type PublicOriginSource =
  | "APP_BASE_URL"
  | "NEXT_PUBLIC_SITE_URL"
  | "NEXT_PUBLIC_APP_URL"
  | "VERCEL_PROJECT_PRODUCTION_URL"
  | "PRODUCTION_FALLBACK"
  | "LOCAL_DEV_FALLBACK"
  | "request"
  | "none";

export type PublicOriginStatus = {
  origin: string | null;
  isReady: boolean;
  source: PublicOriginSource;
  isProductionSafe: boolean;
  blockingReasons: string[];
};

type EnvSource = Partial<Record<string, string | undefined>>;

type PublicOriginOptions = {
  env?: EnvSource;
  requestHeaders?: Headers;
  allowLocalhostInDevelopment?: boolean;
};

type OriginCandidate = {
  source: Exclude<PublicOriginSource, "none">;
  value: string | undefined;
  addHttpsIfMissing?: boolean;
};

function isDeployedEnvironment(env: EnvSource) {
  return (
    env.NODE_ENV === "production" ||
    env.VERCEL_ENV === "production" ||
    env.VERCEL_ENV === "preview"
  );
}

function isLocalOrInternalHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");

  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    return true;
  }

  if (host.startsWith("127.")) {
    return true;
  }

  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipv4) {
    return host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80:");
  }

  const octets = ipv4.slice(1).map(Number);
  if (octets.some((octet) => octet < 0 || octet > 255)) {
    return true;
  }

  const [first, second] = octets;

  return (
    first === 10 ||
    first === 127 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 169 && second === 254)
  );
}

function normalizeOriginCandidate(candidate: OriginCandidate) {
  const rawValue = candidate.value?.trim();

  if (!rawValue) {
    return null;
  }

  const withProtocol =
    candidate.addHttpsIfMissing && !/^https?:\/\//i.test(rawValue)
      ? `https://${rawValue}`
      : rawValue;

  try {
    const url = new URL(withProtocol);
    return url.origin;
  } catch {
    return null;
  }
}

function getRequestOrigin(requestHeaders: Headers | undefined) {
  if (!requestHeaders) {
    return undefined;
  }

  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const proto = requestHeaders.get("x-forwarded-proto") ?? "https";

  if (!host) {
    return undefined;
  }

  return `${proto}://${host}`;
}

function validateOrigin({
  origin,
  source,
  env,
  allowLocalhostInDevelopment
}: {
  origin: string | null;
  source: PublicOriginSource;
  env: EnvSource;
  allowLocalhostInDevelopment: boolean;
}) {
  const blockingReasons: string[] = [];
  const deployedEnvironment = isDeployedEnvironment(env);

  if (!origin) {
    blockingReasons.push("Public origin is missing or invalid.");
    return blockingReasons;
  }

  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    blockingReasons.push("Public origin is missing or invalid.");
    return blockingReasons;
  }

  const isLocalOrInternal = isLocalOrInternalHost(parsed.hostname);
  const localAllowed = !deployedEnvironment && allowLocalhostInDevelopment;

  if (parsed.protocol !== "https:" && !(localAllowed && isLocalOrInternal)) {
    blockingReasons.push("Production public links require HTTPS.");
  }

  if (isLocalOrInternal && !localAllowed) {
    blockingReasons.push(`${source} points to a local or internal host.`);
  }

  return blockingReasons;
}

export function getPublicAppOrigin({
  env = process.env,
  requestHeaders,
  allowLocalhostInDevelopment = true
}: PublicOriginOptions = {}): PublicOriginStatus {
  const candidates: OriginCandidate[] = [
    { source: "APP_BASE_URL", value: env.APP_BASE_URL },
    { source: "NEXT_PUBLIC_SITE_URL", value: env.NEXT_PUBLIC_SITE_URL },
    { source: "NEXT_PUBLIC_APP_URL", value: env.NEXT_PUBLIC_APP_URL },
    {
      source: "VERCEL_PROJECT_PRODUCTION_URL",
      value: env.VERCEL_PROJECT_PRODUCTION_URL,
      addHttpsIfMissing: true
    },
    { source: "request", value: getRequestOrigin(requestHeaders) }
  ];

  for (const candidate of candidates) {
    if (!candidate.value?.trim()) {
      continue;
    }

    const origin = normalizeOriginCandidate(candidate);
    const blockingReasons = validateOrigin({
      origin,
      source: candidate.source,
      env,
      allowLocalhostInDevelopment
    });

    return {
      origin,
      isReady: Boolean(origin) && blockingReasons.length === 0,
      source: candidate.source,
      isProductionSafe: Boolean(origin) && blockingReasons.length === 0,
      blockingReasons
    };
  }

  if (isLocalDevelopment(env) && allowLocalhostInDevelopment) {
    return {
      origin: LOCAL_DEV_SITE_URL,
      isReady: true,
      source: "LOCAL_DEV_FALLBACK",
      isProductionSafe: false,
      blockingReasons: []
    };
  }

  return {
    origin: PRODUCTION_SITE_URL,
    isReady: true,
    source: "PRODUCTION_FALLBACK",
    isProductionSafe: true,
    blockingReasons: []
  };
}
