import Link from "next/link";
import type { ReactNode } from "react";

import {
  companyDetailSecondaryButtonClassName,
  CompanyDetailDescription,
  CompanyDetailEyebrow,
  CompanyDetailPageTitle
} from "@/components/admin/company-detail/company-detail-ui";
import { cn } from "@/lib/utils/cn";

type CompanyDetailHeaderProps = {
  organizationId: string;
  eyebrow?: string;
  title: string;
  description: string;
  refreshHref: string;
  activeAction?: "overview" | "billing" | "compliance" | "business-info";
  showBackToCompanies?: boolean;
};

function ActionLink({
  href,
  label,
  icon,
  isActive
}: {
  href: string;
  label: string;
  icon: ReactNode;
  isActive?: boolean;
}) {
  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={cn(
        companyDetailSecondaryButtonClassName,
        "gap-2 px-4",
        isActive && "border-[#bfdbfe] bg-[#eef5ff] text-[#2563ff]"
      )}
      href={href}
    >
      {icon}
      {label}
    </Link>
  );
}

function BackIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="m15 6-6 6 6 6" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

function SmsIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </svg>
  );
}

function ReplyIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="m9 11-4 4 4 4" />
      <path d="M20 4v7a4 4 0 0 1-4 4H5" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="M12 3 20 7v6c0 5-3.5 8-8 8s-8-3-8-8V7z" />
    </svg>
  );
}

function RocketIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    </svg>
  );
}

function BillingIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <rect height="14" rx="2" width="20" x="2" y="5" />
      <path d="M2 10h20" />
    </svg>
  );
}

export function CompanyDetailHeader({
  organizationId,
  eyebrow = "COMPANY OVERVIEW",
  title,
  description,
  refreshHref,
  activeAction = "overview",
  showBackToCompanies = true
}: CompanyDetailHeaderProps) {
  const base = `/admin/organizations/${organizationId}`;

  return (
    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
      <div>
        <CompanyDetailEyebrow>{eyebrow}</CompanyDetailEyebrow>
        <CompanyDetailPageTitle>{title}</CompanyDetailPageTitle>
        <CompanyDetailDescription>{description}</CompanyDetailDescription>
      </div>

      <div className="flex max-w-full flex-col items-start gap-2 xl:items-end">
        <div className="flex flex-wrap gap-2">
          {showBackToCompanies ? (
            <ActionLink
              href="/admin/organizations"
              icon={<BackIcon />}
              label="Back to companies"
            />
          ) : (
            <ActionLink
              href="/admin/organizations"
              icon={<BackIcon />}
              label="Retour aux compagnies"
            />
          )}
          <ActionLink href={refreshHref} icon={<RefreshIcon />} label="Refresh" />
          <ActionLink href={`${base}/sms`} icon={<SmsIcon />} label="SMS" />
          <ActionLink href={`${base}/replies`} icon={<ReplyIcon />} label="Replies" />
          <ActionLink
            href={`${base}/compliance`}
            icon={<ShieldIcon />}
            isActive={activeAction === "compliance"}
            label="Compliance"
          />
          <ActionLink href={`${base}/onboarding`} icon={<RocketIcon />} label="Onboarding" />
        </div>
        <ActionLink
          href={`${base}/billing`}
          icon={<BillingIcon />}
          isActive={activeAction === "billing"}
          label="Billing"
        />
      </div>
    </div>
  );
}

export function CompanyDetailBreadcrumbHeader({
  organizationName,
  title,
  description
}: {
  organizationName: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <CompanyDetailEyebrow>
          Compagnies &gt; {organizationName}
        </CompanyDetailEyebrow>
        <CompanyDetailPageTitle>{title}</CompanyDetailPageTitle>
        <CompanyDetailDescription>{description}</CompanyDetailDescription>
      </div>
      <Link
        className={cn(companyDetailSecondaryButtonClassName, "gap-2 px-4 shrink-0")}
        href="/admin/organizations"
      >
        <BackIcon />
        Retour aux compagnies
      </Link>
    </div>
  );
}
