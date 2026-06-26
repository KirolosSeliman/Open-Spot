import type { LegalPageDefinition } from "@/lib/legal/types";

import { LegalSection } from "./LegalSection";
import { LegalSidebar } from "./LegalSidebar";

function CalendarIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 shrink-0 text-[#64748B]"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M7 3v2M17 3v2M4 9h16M6 6h12a2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function LegalPageView({ page }: { page: LegalPageDefinition }) {
  return (
    <div className="bg-[#F7F9FD] pb-16 pt-10 sm:pb-20 sm:pt-12 lg:pb-24 lg:pt-14">
      <div className="mx-auto w-full max-w-[90rem] px-5 sm:px-6 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(17rem,19rem)_minmax(0,1fr)] lg:gap-16 xl:gap-20">
          <LegalSidebar note={page.sidebarNote} sections={page.sections} />

          <div className="min-w-0">
            <header className="max-w-4xl">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#2563FF]">
                {page.eyebrow}
              </p>
              <h1 className="mt-4 text-[clamp(2.25rem,5vw,4rem)] font-black leading-[1.02] tracking-[-0.04em] text-[#07142F]">
                {page.title}
              </h1>
              <p className="mt-5 max-w-3xl text-[1.02rem] leading-8 text-[#50617D] sm:text-lg">
                {page.description}
              </p>
              <p className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[#64748B]">
                <CalendarIcon />
                <span>
                  Dernière mise à jour :{" "}
                  <strong className="font-bold text-[#2563FF]">{page.lastUpdated}</strong>
                </span>
              </p>
            </header>

            <div className="mt-10 rounded-[1.5rem] border border-[#DDE5F0] bg-white px-5 py-2 shadow-[0_18px_55px_rgba(15,23,42,0.05)] sm:px-7 sm:py-3 lg:px-8">
              {page.sections.map((section, index) => (
                <LegalSection index={index} key={section.id} section={section} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
