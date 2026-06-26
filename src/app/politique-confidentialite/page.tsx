import { PageShell } from "@/components/layout/page-shell";
import { LegalPageView } from "@/components/legal/LegalPageView";
import { createLegalMetadata } from "@/lib/legal/metadata";
import { privacyPolicyPage } from "@/lib/legal/legal-content";

export const metadata = createLegalMetadata(privacyPolicyPage);

export default function PolitiqueConfidentialitePage() {
  return (
    <PageShell>
      <LegalPageView page={privacyPolicyPage} />
    </PageShell>
  );
}
