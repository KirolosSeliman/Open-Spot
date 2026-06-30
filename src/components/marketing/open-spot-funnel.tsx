import Link from "next/link";

import { OpenSpotLogo } from "@/components/brand/open-spot-logo";
import { LuneraOpenSpotTemplate } from "@/components/marketing/lunera-open-spot-template";

export async function OpenSpotFunnel() {
  return (
    <>
      <MarketingReferenceHeader />
      <LuneraOpenSpotTemplate locale="en" withExternalHeader />
    </>
  );
}

function MarketingReferenceHeader() {
  const navItems = [
    { href: "#features", label: "Features" },
    { href: "#how-it-works", label: "How it works" },
    { href: "#pricing", label: "Pricing" },
    { href: "/book-call", label: "Contact" }
  ] as const;

  return (
    <header className="reference-navbar fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3">
      <div className="reference-navbar-shell mx-auto">
        <Link
          className="reference-brand-link focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2f78ff]"
          href="/"
        >
          <OpenSpotLogo priority size="sm" variant="lockup" />
        </Link>

        <nav aria-label="Main navigation" className="reference-nav-links">
          {navItems.map((item) => (
            <Link className="reference-nav-link" href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="reference-navbar-actions">
          <Link className="reference-login-link" href="/sign-in">
            Log in
          </Link>
        </div>
      </div>
    </header>
  );
}
