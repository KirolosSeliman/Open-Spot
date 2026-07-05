import Link from "next/link";

import type { InternalLink } from "@/lib/seo/public-pages";

export function InternalLinks({
  links,
  title = "Continuer à explorer"
}: {
  links: InternalLink[];
  title?: string;
}) {
  return (
    <section className="rounded-[1.5rem] border border-[var(--line)] bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-2xl font-black">{title}</h2>
      <div className="mt-5 flex flex-wrap gap-2">
        {links.map((link) => (
          <Link className="os-chip transition hover:border-[var(--primary)]" href={link.href} key={link.href}>
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
