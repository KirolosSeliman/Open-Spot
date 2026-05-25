import { Button } from "@/components/ui/button";

export function WaitlistPreview({ slug }: { slug: string }) {
  return (
    <form
      action="/api/waitlist"
      className="grid gap-4 rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm"
      method="post"
    >
      <input name="organizationSlug" type="hidden" value={slug} />
      <div>
        <label className="text-sm font-semibold" htmlFor="fullName">
          Name
        </label>
        <input
          className="mt-2 min-h-11 w-full rounded-md border border-[var(--line)] px-3"
          id="fullName"
          name="fullName"
          placeholder="Customer name"
          required
          type="text"
        />
      </div>
      <div>
        <label className="text-sm font-semibold" htmlFor="phone">
          Mobile phone
        </label>
        <input
          className="mt-2 min-h-11 w-full rounded-md border border-[var(--line)] px-3"
          id="phone"
          name="phone"
          placeholder="+1 514 000 0000"
          required
          type="tel"
        />
      </div>
      <div>
        <label className="text-sm font-semibold" htmlFor="preferredLanguage">
          Preferred language
        </label>
        <select
          className="mt-2 min-h-11 w-full rounded-md border border-[var(--line)] px-3"
          id="preferredLanguage"
          name="preferredLanguage"
        >
          <option value="en">English</option>
          <option value="fr">Francais</option>
        </select>
      </div>
      <div>
        <label className="text-sm font-semibold" htmlFor="serviceInterest">
          Service interest
        </label>
        <input
          className="mt-2 min-h-11 w-full rounded-md border border-[var(--line)] px-3"
          id="serviceInterest"
          name="serviceInterest"
          placeholder="Haircut, color, manicure"
          type="text"
        />
      </div>
      <div>
        <label className="text-sm font-semibold" htmlFor="preferredDays">
          Preferred days
        </label>
        <input
          className="mt-2 min-h-11 w-full rounded-md border border-[var(--line)] px-3"
          id="preferredDays"
          name="preferredDays"
          placeholder="Monday, Friday"
          type="text"
        />
      </div>
      <label className="flex gap-3 text-sm leading-6 text-[var(--muted)]">
        <input
          className="mt-1 h-4 w-4"
          name="discountInterest"
          type="checkbox"
        />
        I am open to last-minute offers or discounts.
      </label>
      <label className="flex gap-3 text-sm leading-6 text-[var(--muted)]">
        <input
          className="mt-1 h-4 w-4"
          name="consentAccepted"
          required
          type="checkbox"
        />
        I agree to receive SMS about last-minute openings from {slug} and
        understand I can reply STOP to unsubscribe.
      </label>
      <Button type="submit">Join waitlist</Button>
    </form>
  );
}
