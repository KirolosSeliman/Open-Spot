import { PageShell } from "@/components/layout/page-shell";
import { LegalPageView } from "@/components/legal/LegalPageView";
import { assertProductionLegalConfig } from "@/lib/legal/constants";
import { createLegalMetadata } from "@/lib/legal/metadata";
import { termsOfUsePage } from "@/lib/legal/legal-content";

export const dynamic = "force-dynamic";

export const metadata = createLegalMetadata(termsOfUsePage);

export default function ConditionsUtilisationPage() {
  assertProductionLegalConfig();

  return (
    <PageShell>
      <LegalPageView page={termsOfUsePage} />
    </PageShell>
  );
}
