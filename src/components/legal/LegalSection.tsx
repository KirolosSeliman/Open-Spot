import type { LegalSection as LegalSectionType } from "@/lib/legal/types";

import { LegalContentBlocks } from "./LegalContentBlocks";

function ChevronIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 shrink-0 text-[#2563FF]"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export function LegalSection({
  index,
  section
}: {
  index: number;
  section: LegalSectionType;
}) {
  const sectionNumber = index + 1;

  return (
    <article
      className="border-b border-[#DDE5F0] py-7 first:pt-0 last:border-b-0"
      id={section.id}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 gap-4 sm:gap-5">
          <div
            aria-hidden="true"
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2563FF] text-sm font-black text-white"
          >
            {sectionNumber}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-black tracking-[-0.02em] text-[#07142F] sm:text-xl">
              {section.title}
            </h2>
            <div className="mt-4 max-w-3xl">
              <LegalContentBlocks blocks={section.blocks} />
            </div>
          </div>
        </div>
        <ChevronIcon />
      </div>
    </article>
  );
}
