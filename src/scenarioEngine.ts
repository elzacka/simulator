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
  kompromittert: "#ff003c", nede: "#ff2244", kritisk: "#ff5500",
  feil: "#ff6600", manipulert: "#e06000", svekket: "#cc8800",
  advarsel: "#ccaa00", eksponert: "#a855f7", oppdateres: "#3b82f6",
  normal: "#00cc66",
};

const TEKST: Record<string, string> = {
  kompromittert: "KOMPROMITTERT", nede: "NEDE", kritisk: "KRITISK",
  feil: "FEIL", manipulert: "MANIPULERT", svekket: "SVEKKET",
  advarsel: "ADVARSEL", eksponert: "EKSPONERT", oppdateres: "OPPDATERES",
  normal: "NORMAL",
};

export function fg(s?: string): string {
  if (!s) return "#2563eb";
  return FARGER[s] || "#2563eb";
}

export function statusTekst(s?: string): string {
  if (!s) return "NORMAL";
  return TEKST[s] || s.toUpperCase();
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

const BRUTT_STATUSER = ["nede", "kritisk", "kompromittert", "feil", "manipulert", "eksponert"];

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
    nullstill();
    const sc = scenarier.find(s => s.id === valgt);
    if (!sc) return;
    setRunning(true);
    sc.steg.forEach((steg, idx) => {
      const t = setTimeout(() => {
        setStatuses(prev => ({ ...prev, [steg.sys]: steg.status }));
        setAktivIdx(idx);
        setLog(prev => [...prev, {
          ...steg, idx,
          ts: new Date().toLocaleTimeString("no-NO", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
        }]);
        if (idx === sc.steg.length - 1) { setRunning(false); setDone(true); }
      }, steg.tid);
      timers.current.push(t);
    });
  };

  const velgScenario = (id: string) => { nullstill(); setValgt(id); };

  const scenario = scenarier.find(s => s.id === valgt);
  const antallBrutt = Object.values(statuses).filter(s => BRUTT_STATUSER.includes(s)).length;
  const lovkravListe = [...new Set(log.filter(l => l.lovkrav).map(l => l.lovkrav))];

  return {
    valgt, running, done, statuses, log, aktivIdx, logRef,
    scenario, antallBrutt, lovkravListe,
    velgScenario, simuler, nullstill,
  };
}
