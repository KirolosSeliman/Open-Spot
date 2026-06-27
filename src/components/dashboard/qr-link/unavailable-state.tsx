export function PublicLinkUnavailableState() {
  return (
    <section
      className="rounded-[22px] border border-[#e2e8f0] bg-white p-8 shadow-[0_18px_55px_rgba(15,23,42,0.06)]"
      data-dashboard-surface="panel"
    >
      <h2 className="text-lg font-extrabold text-[#07142f]">Lien public indisponible</h2>
      <p className="mt-3 max-w-2xl text-[15px] leading-[1.65] text-[#64748b]">
        Impossible de générer le QR code parce que le commerce n&apos;a pas encore de
        lien public.
      </p>
    </section>
  );
}

export function PublicOriginConfigState({
  blockingReasons
}: {
  blockingReasons: string[];
}) {
  return (
    <section
      className="rounded-[22px] border border-[#f2b8b5] bg-[#fff7f6] p-6 shadow-[0_18px_55px_rgba(15,23,42,0.04)]"
      data-dashboard-surface="panel"
    >
      <div className="grid gap-4 text-sm leading-6 text-[#8a1f17]">
        <p className="font-black">
          Les liens publics ne sont pas prets, car l&apos;URL publique de
          l&apos;application n&apos;est pas configuree de façon securitaire.
        </p>
        <ul className="grid gap-2 font-bold">
          {blockingReasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
        <p>
          Configurez <span className="font-black">APP_BASE_URL</span> dans Vercel
          avec l&apos;URL publique HTTPS de production, puis redeployez.
        </p>
      </div>
    </section>
  );
}
