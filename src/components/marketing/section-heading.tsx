export function SectionHeading({
  eyebrow,
  title,
  description
}: {
  eyebrow?: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-2xl">
      {eyebrow ? (
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--primary)]">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-3xl font-bold leading-tight text-[var(--foreground)] sm:text-5xl">
        {title}
      </h1>
      <p className="mt-4 text-base leading-7 text-[var(--muted)] sm:text-lg">
        {description}
      </p>
    </div>
  );
}
