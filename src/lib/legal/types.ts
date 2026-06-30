export type LegalContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "contact"; heading?: string; entity: string };

export type LegalSection = {
  id: string;
  title: string;
  blocks: LegalContentBlock[];
};

export type LegalPageDefinition = {
  slug: string;
  title: string;
  description: string;
  lastUpdated: string;
  eyebrow: string;
  sidebarNote: string;
  sections: LegalSection[];
};
