export function QrLinkHero() {
  return (
    <section
      className="relative overflow-hidden rounded-[24px] border border-[#e2e8f0] bg-white p-9 shadow-[0_18px_55px_rgba(15,23,42,0.06)] sm:p-11"
      data-dashboard-surface="hero"
    >
      <div className="relative z-10 max-w-[520px]">
        <p className="text-[13px] font-extrabold uppercase tracking-[0.2em] text-[#2563ff]">
          OPEN SPOT
        </p>
        <h1 className="mt-3 text-[clamp(1.85rem,3.2vw,2.625rem)] font-extrabold leading-[1.1] tracking-tight text-[#07142f]">
          QR code et lien public
        </h1>
        <p className="mt-4 text-base leading-[1.6] text-[#64748b] sm:text-[17px]">
          Partagez ce QR code au comptoir, sur une affiche ou en ligne pour laisser
          les clients rejoindre la liste d&apos;attente.
        </p>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 top-1/2 hidden h-40 w-40 -translate-y-1/2 rounded-full bg-[#eef4ff] sm:block lg:right-6"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-8 top-8 hidden sm:grid sm:grid-cols-4 sm:gap-2 lg:right-14 lg:top-10"
      >
        {Array.from({ length: 16 }).map((_, index) => (
          <span
            className="h-1.5 w-1.5 rounded-full bg-[#dbeafe]"
            key={`dot-${index}`}
          />
        ))}
      </div>
    </section>
  );
}
