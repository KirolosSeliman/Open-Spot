import { PageShell } from "@/components/layout/page-shell";
import { LegalPageView } from "@/components/legal/LegalPageView";
import { assertProductionLegalConfig } from "@/lib/legal/constants";
import { createLegalMetadata } from "@/lib/legal/metadata";
import { privacyPolicyPage } from "@/lib/legal/legal-content";

export const dynamic = "force-dynamic";

export const metadata = createLegalMetadata(privacyPolicyPage);

export default function PolitiqueConfidentialitePage() {
  assertProductionLegalConfig();

  return (
    <PageShell>
      <LegalPageView page={privacyPolicyPage} />
    </PageShell>
  );
}
