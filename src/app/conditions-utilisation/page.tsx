import { PageShell } from "@/components/layout/page-shell";
import { LegalPageView } from "@/components/legal/LegalPageView";
import { createLegalMetadata } from "@/lib/legal/metadata";
import { termsOfUsePage } from "@/lib/legal/legal-content";

export const metadata = createLegalMetadata(termsOfUsePage);

export default function ConditionsUtilisationPage() {
  return (
    <PageShell>
      <LegalPageView page={termsOfUsePage} />
    </PageShell>
  );
}
