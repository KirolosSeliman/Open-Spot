import type { Dictionary, Locale } from "./types";

export const supportedLocales: Locale[] = ["en", "fr"];

export const dictionaries: Record<Locale, Dictionary> = {
  en: {
    common: {
      productName: "Open Spot",
      tagline:
        "Fill last-minute cancellations by SMS without changing your current booking system."
    },
    navigation: {
      dashboard: "Dashboard",
      pricing: "Pricing",
      contact: "Contact",
      waitlist: "Waitlist"
    }
  },
  fr: {
    common: {
      productName: "Open Spot",
      tagline:
        "Remplissez vos annulations de derniere minute par SMS, sans changer votre systeme de rendez-vous actuel."
    },
    navigation: {
      dashboard: "Tableau de bord",
      pricing: "Tarifs",
      contact: "Contact",
      waitlist: "Liste d'attente"
    }
  }
};
