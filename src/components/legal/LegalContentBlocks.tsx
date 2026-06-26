import type { LegalContentBlock } from "@/lib/legal/types";

function isEmailPlaceholder(email: string) {
  return email === "À compléter" || email.includes("compléter");
}

function ContactBlock({
  address,
  email,
  entity,
  heading
}: Extract<LegalContentBlock, { type: "contact" }>) {
  return (
    <div className="mt-1 rounded-2xl border border-[#DDE5F0] bg-[#F8FAFD] px-5 py-4">
      {heading ? <p className="text-sm font-bold text-[#07142F]">{heading}</p> : null}
      <p className={`text-sm leading-7 text-[#50617D] ${heading ? "mt-2" : ""}`}>{entity}</p>
      <p className="text-sm leading-7 text-[#50617D]">
        Courriel :{" "}
        {isEmailPlaceholder(email) ? (
          <span>{email}</span>
        ) : (
          <a className="font-semibold text-[#2563FF] transition hover:text-[#1D5BFF]" href={`mailto:${email}`}>
            {email}
          </a>
        )}
      </p>
      <p className="text-sm leading-7 text-[#50617D]">Adresse : {address}</p>
    </div>
  );
}

export function LegalContentBlocks({ blocks }: { blocks: LegalContentBlock[] }) {
  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        if (block.type === "paragraph") {
          const isKeyword = block.text === "STOP" || block.text === "AIDE";

          return (
            <p
              className={
                isKeyword
                  ? "inline-flex rounded-xl bg-[#EEF4FF] px-4 py-2 text-sm font-black tracking-wide text-[#2563FF]"
                  : "text-[0.98rem] leading-8 text-[#50617D]"
              }
              key={`${block.text.slice(0, 24)}-${index}`}
            >
              {block.text}
            </p>
          );
        }

        if (block.type === "list") {
          return (
            <ul className="grid gap-2 pl-1" key={`list-${index}`}>
              {block.items.map((item) => (
                <li className="flex gap-3 text-[0.98rem] leading-8 text-[#50617D]" key={item}>
                  <span aria-hidden="true" className="mt-3.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2563FF]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          );
        }

        return <ContactBlock key={`contact-${index}`} {...block} />;
      })}
    </div>
  );
}
