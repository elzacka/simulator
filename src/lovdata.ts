const D = "https://lovdata.no/dokument/";
const GDPR = D + "NL/lov/2018-06-15-38/gdpr/ARTIKKEL_";
const DSL = D + "NL/lov/2023-12-20-108";
const DSF = D + "SF/forskrift/2025-06-20-1131";
const MHV = D + "SF/forskrift/2003-04-25-486";

/** Citation as written in the app → Lovdata link to that provision. Anchors checked against Lovdata 2026-11-09. */
const HJEMLER: Record<string, string> = {
  "gdpr art. 5 nr. 1 bokstav f": `${GDPR}5#gdpr/ARTIKKEL_5`,
  "gdpr art. 28": `${GDPR}28#gdpr/ARTIKKEL_28`,
  "gdpr art. 32": `${GDPR}32#gdpr/ARTIKKEL_32`,
  "gdpr art. 33": `${GDPR}33#gdpr/ARTIKKEL_33`,
  "gdpr art. 34": `${GDPR}34#gdpr/ARTIKKEL_34`,
  "digitalsikkerhetsloven § 7": `${DSL}/KAPITTEL_2#PARAGRAF_7`,
  "digitalsikkerhetsloven § 8": `${DSL}/KAPITTEL_2#PARAGRAF_8`,
  "digitalsikkerhetsloven": DSL,
  "digitalsikkerhetsforskriften § 8": `${DSF}/KAPITTEL_2#PARAGRAF_8`,
  "digitalsikkerhetsforskriften § 10": `${DSF}/KAPITTEL_2#PARAGRAF_10`,
  "digitalsikkerhetsforskriften § 11": `${DSF}/KAPITTEL_2#PARAGRAF_11`,
  "digitalsikkerhetsforskriften § 12": `${DSF}/KAPITTEL_2#PARAGRAF_12`,
  "digitalsikkerhetsforskriften § 13": `${DSF}/KAPITTEL_2#PARAGRAF_13`,
  "digitalsikkerhetsforskriften § 14": `${DSF}/KAPITTEL_2#PARAGRAF_14`,
  "digitalsikkerhetsforskriften § 17": `${DSF}/KAPITTEL_4#PARAGRAF_17`,
  "digitalsikkerhetsforskriften": DSF,
  "arbeidsplassforskriften § 2-14": `${D}SF/forskrift/2011-12-06-1356/KAPITTEL_2#PARAGRAF_2-14`,
  "næringsmiddelhygieneforskriften § 12": `${D}SF/forskrift/2008-12-22-1623/KAPITTEL_5#PARAGRAF_12`,
  "forskrift om miljørettet helsevern kap. 3a": `${MHV}/KAPITTEL_4#KAPITTEL_4`,
  "forskrift om miljørettet helsevern": MHV,
};

const POLITIET = "https://anmeldelse.politiet.no/";
const DATATILSYNET = "https://www.datatilsynet.no/rettigheter-og-plikter/virksomhetenes-plikter/avvik/";

/** Reporting bodies as written in the app → their reporting page. Checked 2026-11-09. */
const VARSLING: Record<string, string> = {
  "politiet": POLITIET,
  "politianmeldelse": POLITIET,
  "nsm": "https://nsm.no/varsle-nsm/",
  "pst": "https://www.pst.no/tips-oss/",
  "datatilsynet": DATATILSYNET,
  "supervisory authority": DATATILSYNET,
};

// Mentions of a reporting body that are no call to report to it
const UNNTAK = ["nsm risiko", "nsm veileder", "pst vurderer"];

const LENKER = { ...HJEMLER, ...VARSLING };
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Longest first, so "§ 12" wins over the bare act name; whole words only, so "NSMs" stays plain
const MONSTER = new RegExp(
  `(?<![\\p{L}\\d])(?!${UNNTAK.map(escape).join("|")})(${Object.keys(LENKER).sort((a, b) => b.length - a.length).map(escape).join("|")})(?![\\p{L}\\d-])`,
  "giu",
);

export type Del = string | { tekst: string; href: string };

/** Splits text into plain parts and links: citations to Lovdata, reporting bodies to their reporting page. */
export function medHjemmelLenker(tekst: string): Del[] {
  return tekst.split(MONSTER).map((del, i) =>
    i % 2 === 1 ? { tekst: del, href: LENKER[del.toLowerCase()] } : del,
  ).filter(d => d !== "");
}
