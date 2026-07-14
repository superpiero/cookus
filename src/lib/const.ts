import type {
  InstitutionCategory,
  JobCategory,
  EmploymentType,
  SalaryPeriod,
  ApplicationStatus,
} from "@prisma/client";

/** Číselník měst/regionů (docs/04 #17) — sdílí formuláře i filtry. */
export const CITIES = [
  "Praha",
  "Brno",
  "Ostrava",
  "Plzeň",
  "Liberec",
  "Olomouc",
  "České Budějovice",
  "Hradec Králové",
  "Pardubice",
  "Zlín",
  "Karlovy Vary",
  "Ústí nad Labem",
  "Jihlava",
  "Kladno",
  "Krkonoše a hory",
  "Jižní Morava — venkov",
  "Střední Čechy",
  "Jinde v ČR",
] as const;

export const RESERVED_HANDLES = new Set([
  "admin", "api", "jobs", "feed", "messages", "settings", "login", "register",
  "notifications", "styleguide", "p", "people", "post", "applications",
  "verifications", "privacy", "forgot-password", "reset-password", "friends",
]);

export const INSTITUTION_CATEGORY_LABELS: Record<InstitutionCategory, string> = {
  RESTAURACE: "Restaurace",
  KAVARNA: "Kavárna",
  BAR: "Bar",
  HOTEL: "Hotel",
  BISTRO: "Bistro",
  CATERING: "Catering",
  CUKRARNA: "Cukrárna",
  PIVOVAR: "Pivovar",
  SKOLA: "Škola / kurzy",
  JINE: "Jiné",
};

export const JOB_CATEGORY_LABELS: Record<JobCategory, string> = {
  KUCHAR: "Kuchař/ka",
  CISNIK: "Číšník / servírka",
  BARISTA: "Barista",
  BARMAN: "Barman/ka",
  CUKRAR: "Cukrář/ka",
  SOMELIER: "Sommelier",
  PROVOZNI: "Provozní",
  RECEPCNI: "Recepční",
  POMOCNA_SILA: "Pomocná síla",
  MANAZER: "Manažer/ka",
  JINE: "Jiné",
};

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  PLNY_UVAZEK: "Plný úvazek",
  ZKRACENY_UVAZEK: "Zkrácený úvazek",
  BRIGADA: "Brigáda",
  SEZONNI: "Sezónní",
  STAZ: "Stáž",
};

export const SALARY_PERIOD_LABELS: Record<SalaryPeriod, string> = {
  HODINA: "Kč/hod",
  MESIC: "Kč/měs",
};

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  SENT: "Nová",
  VIEWED: "Zobrazená",
  SHORTLISTED: "Užší výběr",
  REJECTED: "Zamítnutá",
  HIRED: "Přijat/a",
};

/** Quick-bar chatu (docs/04 #25 — mini paleta, nativní vstup zůstává). */
export const QUICK_EMOJI = ["👍", "🔥", "😄", "🙌", "❤️", "👏", "🤝", "🎉"] as const;

export const MAX_SKILLS = 15;
export const MAX_POSTS_PER_USER = 100;
