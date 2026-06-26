import Link from "next/link";

import type { LegalSection as LegalSectionType } from "@/lib/legal/types";

function ShieldIcon() {
  return (
    <svg
      aria-hidden="true"
      className="mt-0.5 h-5 w-5 shrink-0 text-[#2563FF]"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M12 3l7 3v6c0 4.4-2.8 8.3-7 9-4.2-.7-7-4.6-7-9V6l7-3z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M9.5 12.2l1.8 1.8 3.5-3.8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function LegalSidebar({
  note,
  sections
}: {
  note: string;
  sections: LegalSectionType[];
}) {
  return (
    <aside className="lg:sticky lg:top-8 lg:self-start">
      <div className="rounded-[1.35rem] border border-[#DDE5F0] bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
        <h2 className="text-lg font-black text-[#07142F]">Sommaire</h2>
        <nav aria-label="Sommaire de la page" className="mt-5">
          <ol className="grid gap-3">
            {sections.map((section, index) => (
              <li key={section.id}>
                <Link
                  className="group flex items-start gap-3 rounded-xl px-1 py-1 transition hover:bg-[#F8FAFD]"
                  href={`#${section.id}`}
                >
                  <span className="text-sm font-black text-[#2563FF]">{index + 1}.</span>
                  <span className="text-sm font-semibold leading-6 text-[#50617D] transition group-hover:text-[#07142F]">
                    {section.title}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-6 rounded-2xl border border-[#D6E4FF] bg-[#EEF4FF] px-4 py-4">
          <div className="flex gap-3">
            <ShieldIcon />
            <p className="text-sm leading-7 text-[#50617D]">{note}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
