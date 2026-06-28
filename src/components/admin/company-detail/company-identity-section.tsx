import Link from "next/link";

import { CopyValueButton } from "@/components/admin/company-detail/copy-value-button";
import {
  CompanyDetailCard,
  CompanyDetailIconBadge,
  CompanyDetailSectionTitle
} from "@/components/admin/company-detail/company-detail-ui";
import { ResendOwnerInvitationButton } from "@/components/admin/resend-owner-invitation-button";

const dateFormatter = new Intl.DateTimeFormat("fr-CA", {
  dateStyle: "medium",
  timeStyle: "short"
});

function formatDate(value: string | null) {
  if (!value) {
    return "Non disponible";
  }

  return dateFormatter.format(new Date(value));
}

function IdCardIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <rect height="14" rx="2" width="20" x="2" y="5" />
      <path d="M2 10h20M7 15h.01M11 15h2" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function FieldRow({
  label,
  value,
  copyValue
}: {
  label: string;
  value: string;
  copyValue?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <dt className="text-sm font-semibold text-[#64748b]">{label}</dt>
      <dd className="flex items-center gap-2 text-sm font-medium text-[#0b1328]">
        <span className="min-w-0 break-all">{value}</span>
        {copyValue ? <CopyValueButton label={label} value={copyValue} /> : null}
      </dd>
    </div>
  );
}

export function CompanyIdentityCard({
  organizationId,
  slug,
  createdAt
}: {
  organizationId: string;
  slug: string | null;
  createdAt: string;
}) {
  return (
    <CompanyDetailCard>
      <div className="flex items-center gap-3">
        <CompanyDetailIconBadge>
          <IdCardIcon />
        </CompanyDetailIconBadge>
        <CompanyDetailSectionTitle>Identité</CompanyDetailSectionTitle>
      </div>
      <dl className="mt-6 grid gap-5">
        <FieldRow copyValue={organizationId} label="ID de l'organisation" value={organizationId} />
        <FieldRow
          copyValue={slug ?? undefined}
          label="Slug"
          value={slug ?? "Non renseigné"}
        />
        <FieldRow label="Créée le" value={formatDate(createdAt)} />
      </dl>
    </CompanyDetailCard>
  );
}

export function CompanyOwnerAccessCard({
  organizationId,
  ownerEmail,
  accessLevel,
  timezone
}: {
  organizationId: string;
  ownerEmail: string | null;
  accessLevel: string;
  timezone: string | null;
}) {
  return (
    <CompanyDetailCard>
      <div className="flex items-center gap-3">
        <CompanyDetailIconBadge>
          <UserIcon />
        </CompanyDetailIconBadge>
        <CompanyDetailSectionTitle>Propriétaire / accès</CompanyDetailSectionTitle>
      </div>
      <dl className="mt-6 grid gap-5">
        <FieldRow
          label="Courriel du propriétaire"
          value={ownerEmail ?? "Non renseigné"}
        />
        <div className="grid gap-1.5">
          <dt className="text-sm font-semibold text-[#64748b]">Niveau d&apos;accès</dt>
          <dd>
            <span className="inline-flex rounded-full bg-[#eef5ff] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#2563ff]">
              {accessLevel}
            </span>
          </dd>
        </div>
        <FieldRow
          label="Fuseau horaire"
          value={timezone ?? "Non renseigné"}
        />
      </dl>
      <ResendOwnerInvitationButton
        organizationId={organizationId}
        ownerEmail={ownerEmail}
      />
    </CompanyDetailCard>
  );
}

function ChevronIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5 shrink-0 text-[#94a3b8]" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

const navigationItems = [
  {
    hrefSuffix: "/business-info",
    title: "Informations du commerce",
    description: "Détails complets du commerce, coordonnées et préférences.",
    icon: (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      </svg>
    )
  },
  {
    hrefSuffix: "/billing",
    title: "Conditions de facturation",
    description: "Abonnement, frais par spot et paramètres de facturation.",
    icon: (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
        <rect height="14" rx="2" width="20" x="2" y="5" />
        <path d="M2 10h20" />
      </svg>
    )
  },
  {
    hrefSuffix: "/billing#analytics",
    title: "Analytique",
    description: "Performances, coûts SMS et tendance des clients.",
    icon: (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
        <path d="M3 3v18h18M7 16l4-4 4 4 5-6" />
      </svg>
    )
  },
  {
    hrefSuffix: "/compliance",
    title: "Support interne",
    description: "Notes internes et contrôles de support.",
    icon: (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
        <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
      </svg>
    )
  },
  {
    hrefSuffix: "#manager-mode",
    title: "Manager mode",
    description: "Ouvrir le dashboard en tant que gestionnaire.",
    icon: (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
      </svg>
    )
  }
] as const;

export function CompanyNavigationCards({ organizationId }: { organizationId: string }) {
  const base = `/admin/organizations/${organizationId}`;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {navigationItems.map((item) => (
        <Link
          className="group flex items-start gap-4 rounded-[24px] border border-[#e2eaf5] bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)] transition hover:border-[#bfdbfe] hover:bg-[#f8fbff]"
          href={`${base}${item.hrefSuffix}`}
          key={item.title}
        >
          <CompanyDetailIconBadge className="transition group-hover:bg-[#dbeafe]">
            {item.icon}
          </CompanyDetailIconBadge>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-[#0b1328]">{item.title}</p>
            <p className="mt-2 text-sm leading-6 text-[#64748b]">{item.description}</p>
          </div>
          <ChevronIcon />
        </Link>
      ))}
    </div>
  );
}
