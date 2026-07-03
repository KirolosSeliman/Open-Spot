export function BingSiteVerificationMeta() {
  const token = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION?.trim();

  if (!token) {
    return null;
  }

  return <meta content={token} name="msvalidate.01" />;
}
