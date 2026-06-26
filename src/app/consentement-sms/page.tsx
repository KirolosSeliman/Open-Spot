import { PageShell } from "@/components/layout/page-shell";
import { LegalPageView } from "@/components/legal/LegalPageView";
import { createLegalMetadata } from "@/lib/legal/metadata";
import { smsConsentPage } from "@/lib/legal/legal-content";

export const metadata = createLegalMetadata(smsConsentPage);

export default function ConsentementSmsPage() {
  return (
    <PageShell>
      <LegalPageView page={smsConsentPage} />
    </PageShell>
  );
}
