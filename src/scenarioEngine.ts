import { useState, useEffect, useRef } from "react";
import { parse } from "yaml";

/* ── Typer ── */

export interface Steg {
  tid: number;
  sys: string;
  status: string;
  melding: string;
  lovkrav?: string;
}

export interface Scenario {
  id: string;
  navn: string;
  ikon: string;
  kort: string;
  beskrivelse: string;
  owasp?: string;
  eksponert?: boolean;
  angrepsvektor?: string[];
  // Merkelapper som skiller scenariene: hva slags virksomhet og funksjon som
  // rammes, og trusselens art (tilsiktet/utilsiktet) og kilde.
  virksomhet?: string;
  virksomhetIkon?: string;
  funksjon?: string;
  funksjonIkon?: string;
  trussel?: { art: string; kilde: string };
  // Fagområde som grupperer scenariene i nedtrekksmenyen.
  kategori?: string;
  // Når angrepet faktisk oppdages. vedSteg er indeks i steg[]; alt før er
  // uoppdaget. overvaket = true når uavhengig overvåkning fanger det tidlig.
  deteksjon?: { vedSteg: number; kilde: string; forsinkelse: string; overvaket?: boolean };
  steg: Steg[];
  tiltak?: { forebygging?: string[]; respons?: string[] };
}

export interface LoggInnslag extends Steg {
  idx: number;
  ts: string;
}

export interface SystemInfo {
  navn: string;
  gruppe: number;
  col: number;
  ikon: string;
}

export interface SimulatorData {
  gruppeLabels: string[];
  systemer: Record<string, SystemInfo>;
  scenarier: Scenario[];
}

/* ── Hjelpefunksjoner ── */

const FARGER: Record<string, string> = {
  kompromittert: "var(--st-kompromittert)", odelagt: "var(--st-odelagt)",
  nede: "var(--st-nede)", kritisk: "var(--st-kritisk)",
  feil: "var(--st-feil)", manipulert: "var(--st-manipulert)", svekket: "var(--st-svekket)",
  advarsel: "var(--st-advarsel)", eksponert: "var(--st-eksponert)", oppdateres: "var(--st-oppdateres)",
  normal: "var(--st-normal)",
};

const TEKST: Record<string, string> = {
  kompromittert: "Kompromittert", odelagt: "Ødelagt", nede: "Ute av drift", kritisk: "Kritisk",
  feil: "Feil", manipulert: "Manipulert", svekket: "Svekket",
  advarsel: "Advarsel", eksponert: "Eksponert", oppdateres: "Oppdateres",
  normal: "Normal",
};

const TEXT_EN: Record<string, string> = {
  kompromittert: "Compromised", odelagt: "Destroyed", nede: "Down", kritisk: "Critical",
  feil: "Error", manipulert: "Tampered", svekket: "Degraded",
  advarsel: "Warning", eksponert: "Exposed", oppdateres: "Updating",
  normal: "Normal",
};

// Alvorlighetsrekkefølge for statusforklaringen
const REKKEFOLGE = [
  "normal", "oppdateres", "eksponert", "advarsel", "svekket", "feil",
  "manipulert", "kritisk", "nede", "kompromittert", "odelagt",
];

const FORKLARING: Record<string, string> = {
  normal: "Fungerer som det skal",
  oppdateres: "Ny programvare eller fastvare installeres",
  eksponert: "Kan nås fra internett uten god nok beskyttelse",
  advarsel: "Avvik eller svakhet som bør følges opp",
  svekket: "Fungerer bare delvis",
  feil: "Teknisk feil eller feilkonfigurasjon",
  manipulert: "Innstillinger eller data er endret av en angriper",
  kritisk: "Har passert en sikker grense",
  nede: "Virker ikke",
  kompromittert: "En angriper har tilgang eller kontroll",
  odelagt: "Varig tap, må kastes eller erstattes",
};

const EXPLANATION_EN: Record<string, string> = {
  normal: "Working as intended",
  oppdateres: "New software or firmware is being installed",
  eksponert: "Reachable from the internet without adequate protection",
  advarsel: "Deviation or weakness that needs follow-up",
  svekket: "Only partly working",
  feil: "Technical fault or misconfiguration",
  manipulert: "Settings or data changed by an attacker",
  kritisk: "Past a safe limit",
  nede: "Not working",
  kompromittert: "An attacker has access or control",
  odelagt: "Permanent loss; must be discarded or replaced",
};

export type Lang = "no" | "en";

// Statusene et scenario bruker, pluss normal, i alvorlighetsrekkefølge
export function statusForklaring(sc: Scenario | undefined, lang: Lang) {
  if (!sc) return [];
  const brukt = new Set(["normal", ...sc.steg.map(s => s.status)]);
  const tekst = lang === "en" ? EXPLANATION_EN : FORKLARING;
  return REKKEFOLGE.filter(k => brukt.has(k)).map(k => ({
    status: k, etikett: statusLabel(k, lang), forklaring: tekst[k], farge: fg(k),
  }));
}

export function fg(s?: string): string {
  if (!s) return "var(--accent)";
  return FARGER[s] || "var(--accent)";
}

export function statusLabel(s: string | undefined, lang: Lang): string {
  const map = lang === "en" ? TEXT_EN : TEKST;
  return map[s ?? "normal"] || s!;
}

/* ── YAML-parser ── */

export function parseSimulatorData(yamlString: string): SimulatorData {
  const raw = parse(yamlString) as {
    gruppeLabels: string[];
    systemer: Record<string, { navn: string; gruppe: number; col: number; ikon: string }>;
    scenarier: Scenario[];
  };
  return {
    gruppeLabels: raw.gruppeLabels,
    systemer: raw.systemer,
    scenarier: raw.scenarier,
  };
}

/* ── Felles scenariomotor-hook ── */

const BRUTT_STATUSER = ["nede", "kritisk", "kompromittert", "odelagt", "feil", "manipulert", "eksponert"];

// Takt: Neste steg venter til forrige melding er lest (ca. 22 tegn/s),
// men aldri kortere enn YAML-rytmen (tid) strukket ut.
const MS_PER_TEGN = 45;
const MIN_STEG_MS = 3000;
const TEMPO = 3;

export function useScenarioEngine(scenarier: Scenario[]) {
  const [valgt, setValgt] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [log, setLog] = useState<LoggInnslag[]>([]);
  const [aktivIdx, setAktivIdx] = useState(-1);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => { timers.current.forEach(clearTimeout); };
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  const nullstill = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setValgt(null);
    setStatuses({});
    setLog([]);
    setAktivIdx(-1);
    setRunning(false);
    setDone(false);
  };

  const simuler = () => {
    if (!valgt) return;
    const id = valgt;
    nullstill();
    setValgt(id);
    const sc = scenarier.find(s => s.id === id);
    if (!sc) return;
    setRunning(true);
    let ved = 0;
    sc.steg.forEach((steg, idx) => {
      if (idx > 0) {
        const forrige = sc.steg[idx - 1];
        ved += Math.max(MIN_STEG_MS, forrige.melding.length * MS_PER_TEGN, (steg.tid - forrige.tid) * TEMPO);
      }
      const t = setTimeout(() => {
        setStatuses(prev => ({ ...prev, [steg.sys]: steg.status }));
        setAktivIdx(idx);
        setLog(prev => [...prev, {
          ...steg, idx,
          ts: new Date().toLocaleTimeString("no-NO", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
        }]);
        if (idx === sc.steg.length - 1) { setRunning(false); setDone(true); }
      }, ved);
      timers.current.push(t);
    });
  };

  const velgScenario = (id: string) => { nullstill(); setValgt(id); };

  const scenario = scenarier.find(s => s.id === valgt);
  const antallBrutt = Object.values(statuses).filter(s => BRUTT_STATUSER.includes(s)).length;
  const lovkravListe = [...new Set(log.flatMap(l => (l.lovkrav ? [l.lovkrav] : [])))];

  return {
    valgt, running, done, statuses, log, aktivIdx, logRef,
    scenario, antallBrutt, lovkravListe,
    velgScenario, simuler, nullstill,
  };
}
