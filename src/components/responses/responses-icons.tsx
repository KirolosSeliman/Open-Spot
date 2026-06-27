export function CalendarSlotIcon() {
  return (
    <svg aria-hidden className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path
        d="M8 3v2M16 3v2M4 9h16M6 5h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export function EyeIcon() {
  return (
    <svg aria-hidden className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M2.5 12C4.2 7.8 8 5 12 5s7.8 2.8 9.5 7c-1.7 4.2-5.5 7-9.5 7s-7.8-2.8-9.5-7Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" fill="currentColor" r="2.5" stroke="none" />
    </svg>
  );
}

export function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden
      className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg aria-hidden className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 16l4 4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

export function SlidersIcon() {
  return (
    <svg aria-hidden className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M4 7h10M14 7h6M4 12h4M10 12h10M4 17h8M14 17h6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <circle cx="16" cy="7" fill="currentColor" r="1.5" />
      <circle cx="8" cy="12" fill="currentColor" r="1.5" />
      <circle cx="12" cy="17" fill="currentColor" r="1.5" />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg aria-hidden className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
      <path
        d="M5 12.5 9.5 17 19 7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
      />
    </svg>
  );
}

export function XIcon() {
  return (
    <svg aria-hidden className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
      <path
        d="M7 7l10 10M17 7 7 17"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2.2"
      />
    </svg>
  );
}

export function DotsIcon() {
  return (
    <svg aria-hidden className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <circle cx="6" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="18" cy="12" r="1.5" />
    </svg>
  );
}
