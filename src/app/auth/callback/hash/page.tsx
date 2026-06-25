import { Suspense } from "react";

import AuthCallbackHashPage from "./hash-page";

export default function AuthCallbackHashRoutePage() {
  return (
    <Suspense
      fallback={
        <div className="os-container-wide py-12 sm:py-16 lg:py-24">
          <p className="text-sm font-bold text-[var(--muted)]">
            Verification du lien...
          </p>
        </div>
      }
    >
      <AuthCallbackHashPage />
    </Suspense>
  );
}
