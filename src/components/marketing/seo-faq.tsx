import type { FaqItem } from "@/lib/seo/public-pages";

export function SeoFaq({ items }: { items: FaqItem[] }) {
  return (
    <section className="rounded-[1.5rem] border border-[var(--line)] bg-white p-6 shadow-[var(--card-shadow)] sm:p-8">
      <p className="os-kicker">FAQ</p>
      <h2 className="os-section-title mt-3">Questions fréquentes</h2>
      <div className="mt-7 grid gap-4">
        {items.map((item) => (
          <article
            className="rounded-[1rem] border border-[var(--line)] bg-slate-50 p-5"
            key={item.question}
          >
            <h3 className="text-lg font-black leading-tight">{item.question}</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              {item.answer}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
