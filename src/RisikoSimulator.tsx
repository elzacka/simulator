import { useState, useEffect, useRef } from "react";
import Icon from "./Icon";

interface Steg {
  tid: number;
  sys: string;
  status: string;
  melding: string;
  lovkrav?: string;
}

interface Scenario {
  id: string;
  navn: string;
  ikon: string;
  kort: string;
  beskrivelse: string;
  steg: Steg[];
}

interface LoggInnslag extends Steg {
  idx: number;
  ts: string;
}

interface SystemInfo {
  navn: string;
  domene: number;
  col: number;
  ikon: string;
}

/* ————————————————————————————————————————————
   5 scenarier basert på NSM Risiko 2026
   Målgruppe: Innkjøpere i norsk offentlig sektor
   ———————————————————————————————————————————— */

const SCENARIOS: Scenario[] = [
  {
    id: "leverandor_angrep",
    navn: "Svært kritisk — IT-leverandør",
    ikon: "link",
    kort: "Leverandør hackes — angriperen bruker deres tilgang til å stjele data og penger",
    beskrivelse: "Virksomheten har satt ut IT-drift til en ekstern leverandør uten tilstrekkelige sikkerhetskrav i kontrakten. Leverandøren blir hacket, og angriperen bruker leverandørens legitime tilgang til å kompromittere virksomhetens systemer. Dette scenariet viser hvorfor sikkerhetskrav i anskaffelser er avgjørende.",
    steg: [
      { tid: 0, sys: "leverandor", status: "svært_kritisk", melding: "IT-leverandørens fjernstyringsverktøy er kompromittert. Angriperen har full tilgang til alle kunders systemer." },
      { tid: 1200, sys: "nettverk", status: "svært_kritisk", melding: "Angriperen bruker leverandørens VPN-tilgang til å kartlegge virksomhetens interne nettverk." },
      { tid: 2400, sys: "epost", status: "svært_kritisk", melding: "Leverandørens servicekonto gir tilgang til e-postsystemet. Intern kommunikasjon overvåkes." },
      { tid: 3600, sys: "fagsystem", status: "svært_kritisk", melding: "Saksbehandlingssystemet med personsensitive data kompromitteres via leverandørtilgangen.", lovkrav: "Personopplysningsloven / GDPR art. 32" },
      { tid: 4800, sys: "personaldata", status: "svært_kritisk", melding: "Personopplysninger om ansatte og borgere kopieres ut av virksomheten.", lovkrav: "GDPR art. 33 — varsling innen 72 timer" },
      { tid: 6000, sys: "okonomi", status: "manipulert", melding: "Angriperen endrer kontonummer i fakturarutinene. Neste utbetaling på 4,2 mill. kr sendes til angriperens konto.", lovkrav: "Anskaffelsesloven § 6" },
      { tid: 7200, sys: "backup", status: "svært_kritisk", melding: "Backup-løsningen krypteres med løsepengevirus. Gjenoppretting av data er umulig." },
      { tid: 8400, sys: "skytjeneste", status: "nede", melding: "Leverandørens skytjeneste stenges ned som følge av hendelsen. Alle avhengige systemer er utilgjengelige.", lovkrav: "Sikkerhetsloven § 4-1" },
    ]
  },
  {
    id: "innsiderisiko",
    navn: "Innsiderisiko — «Ola Nordmann»",
    ikon: "person",
    kort: "Ansatt med sikkerhetsklarering rekrutteres gradvis av fremmed etterretning",
    beskrivelse: "Basert på et scenario fra NSM Risiko 2026. En ansatt med sikkerhetsklarering for HEMMELIG og bred systemtilgang rekrutteres gradvis av en fremmed etterretningstjeneste — via en nær relasjon. Virksomheten mangler rutiner for å oppdage og håndtere situasjonen.",
    steg: [
      { tid: 0, sys: "tilgang", status: "advarsel", melding: "«Ola» er autorisert for nivå HEMMELIG. Han har bred tilgang til fagsystemer og gradert informasjon." },
      { tid: 1500, sys: "personaldata", status: "advarsel", melding: "«Ola» blir samboer med person fra et land PST vurderer som høy etterretningstrussel. Forholdet meldes ikke til autorisasjonsansvarlig." },
      { tid: 3000, sys: "epost", status: "svekket", melding: "«Ola» introduseres for fagpersoner fra samboerens nettverk. De utveksler informasjon via privat e-post." },
      { tid: 4500, sys: "fagsystem", status: "svært_kritisk", melding: "«Ola» inviteres til fagsamarbeid i utlandet. Han holder foredrag om sitt arbeidsområde for et ukjent publikum." },
      { tid: 6000, sys: "personaldata", status: "svært_kritisk", melding: "«Ola» deler gradert informasjon med personer tilknyttet fremmed etterretning — bevisst eller under press.", lovkrav: "Sikkerhetsloven § 5-4 — taushetsplikt" },
      { tid: 7500, sys: "tilgang", status: "feil", melding: "Autorisasjonsansvarlig er aldri blitt varslet om samboerforholdet. Ingen revurdering av «Ola»s klarering er gjennomført.", lovkrav: "Sikkerhetsloven § 8-4 — personkontroll" },
      { tid: 9000, sys: "backup", status: "svekket", melding: "Omfanget av informasjonslekkasjen er ukjent. Det finnes ingen logging av «Ola»s tilgang til sensitiv informasjon.", lovkrav: "Sikkerhetsloven § 4-3 — sikkerhetsstyring" },
    ]
  },
  {
    id: "skytjeneste_avbrudd",
    navn: "Skytjenesteavbrudd — konsentrasjonsrisiko",
    ikon: "cloud",
    kort: "Én utenlandsk skyleverandør svikter — hele virksomheten stopper opp",
    beskrivelse: "Virksomheten har samlet e-post, fagsystemer, backup og tilgangsstyring hos én stor utenlandsk skyleverandør. En geopolitisk hendelse fører til at tjenestene begrenses for europeiske kunder. Ingen reserveløsning finnes fordi alt ble anskaffet fra samme leverandør.",
    steg: [
      { tid: 0, sys: "skytjeneste", status: "nede", melding: "Geopolitisk hendelse: Utenlandsk skyleverandør begrenser tjenester for europeiske kunder uten varsel." },
      { tid: 800, sys: "epost", status: "nede", melding: "E-post og samhandlingsverktøy er utilgjengelige. All intern og ekstern kommunikasjon stanser." },
      { tid: 1600, sys: "tilgang", status: "nede", melding: "Felles innloggingsløsning (SSO) i skyen er nede. Ingen ansatte kan logge inn på noe system.", lovkrav: "Digitalsikkerhetsloven art. 21" },
      { tid: 2400, sys: "fagsystem", status: "nede", melding: "Alle fagsystemer hostet i skyen er utilgjengelige. Saksbehandling og publikumstjenester stopper." },
      { tid: 3200, sys: "okonomi", status: "nede", melding: "Lønn- og faktureringssystem er nede. Ansatte risikerer å ikke få utbetalt lønn ved neste termin.", lovkrav: "Anskaffelsesloven § 6" },
      { tid: 4000, sys: "backup", status: "nede", melding: "Backup er lagret hos samme skyleverandør. Ingen data kan gjenopprettes fra alternativ kilde." },
      { tid: 5000, sys: "nettverk", status: "svekket", melding: "VPN og nettverkstjenester som er avhengige av skyen feiler. Fjernarbeid er umulig." },
      { tid: 6000, sys: "fysisk", status: "svekket", melding: "Bygningsstyring og adgangskort knyttet til skytjenesten svikter. Dører må låses opp manuelt.", lovkrav: "Sikkerhetsloven § 4-1" },
    ]
  },
  {
    id: "fysisk_brist",
    navn: "Fysisk inntrengning via adgangskort",
    ikon: "badge",
    kort: "Synlig adgangskort kopieres — inntrenger stjeler data fra bygget",
    beskrivelse: "En ansatt bærer synlig adgangskort utenfor arbeidsplassen. Kortet fotograferes og kopieres. En inntrenger bruker det falske kortet og «tailgating» (følger tett bak en ansatt) for å komme inn i bygget. Sensitive data stjeles via USB-enhet.",
    steg: [
      { tid: 0, sys: "fysisk", status: "svært_kritisk", melding: "Ansatt bærer synlig adgangskort på T-banen. Foto av kortets design og ID-nummer tas av ukjent person." },
      { tid: 1200, sys: "tilgang", status: "svært_kritisk", melding: "Falskt adgangskort produseres basert på fotografiet. Inntrengeren bruker «tailgating» ved hovedinngangen.", lovkrav: "Sikkerhetsloven § 4-2" },
      { tid: 2400, sys: "fysisk", status: "svekket", melding: "Inntrengeren beveger seg fritt i bygget. Ingen ansatte utfordrer en ukjent person uten synlig kort." },
      { tid: 3600, sys: "nettverk", status: "svært_kritisk", melding: "USB-enhet med skadevare kobles til en nettverkskontakt i et uovervåket møterom. Bakdør installeres." },
      { tid: 4800, sys: "fagsystem", status: "svært_kritisk", melding: "Via bakdøren kartlegges interne systemer. Fagsystemet med pågående anskaffelser kompromitteres." },
      { tid: 6000, sys: "epost", status: "svært_kritisk", melding: "Intern e-post overvåkes. Budsjettrammer og konkurransegrunnlag for pågående anskaffelser avdekkes.", lovkrav: "Anskaffelsesloven § 6" },
      { tid: 7200, sys: "personaldata", status: "svært_kritisk", melding: "Personopplysninger og gradert informasjon kopieres til USB-enhet og bringes ut av bygget.", lovkrav: "GDPR art. 33 — varsling innen 72 timer" },
    ]
  },
  {
    id: "ki_angrep",
    navn: "KI-drevet angrep mot innkjøper",
    ikon: "smart_toy",
    kort: "Kunstig intelligens brukes til å lure innkjøpsansvarlig — deepfake og perfekt norsk",
    beskrivelse: "Trusselaktør bruker kunstig intelligens til å lage perfekt tilpassede phishing-e-poster og deepfake-videosamtaler rettet mot innkjøpsansvarlige. Angrepet utnytter tillit og rutiner i anskaffelsesprosessen for å omdirigere betalinger og stjele forretningshemmeligheter.",
    steg: [
      { tid: 0, sys: "epost", status: "svært_kritisk", melding: "KI-generert phishing-e-post sendes til innkjøpsansvarlig. Perfekt norsk, refererer til en reell pågående anskaffelse." },
      { tid: 1200, sys: "tilgang", status: "svært_kritisk", melding: "Ansatt klikker lenke og oppgir pålogging. Tofaktorverifisering avlures via KI-generert telefonsamtale som ligner IT-support." },
      { tid: 2400, sys: "okonomi", status: "manipulert", melding: "Angriperen endrer leverandørens kontonummer i økonomisystemet. Neste betaling på 2,8 mill. kr sendes til feil konto.", lovkrav: "Anskaffelsesloven § 6" },
      { tid: 3600, sys: "epost", status: "svekket", melding: "KI-deepfake videosamtale brukes til å «bekrefte» kontoendringen. Personen i videoen ligner seksjonsleder til forveksling." },
      { tid: 4800, sys: "fagsystem", status: "svært_kritisk", melding: "Angriperen bruker tilgangen til å kartlegge alle pågående og fremtidige anskaffelser i fagsystemet." },
      { tid: 6000, sys: "personaldata", status: "svært_kritisk", melding: "Budsjettrammer, kontraktsverdier og leverandørlister eksfiltreres. Kan brukes til fremtidige angrep.", lovkrav: "Sikkerhetsloven § 5-4 — taushetsplikt" },
      { tid: 7200, sys: "nettverk", status: "svært_kritisk", melding: "Vedvarende bakdør installeres i nettverket for fremtidig tilgang og overvåkning.", lovkrav: "Digitalsikkerhetsloven art. 21" },
    ]
  }
];

const SYS_INFO: Record<string, SystemInfo> = {
  leverandor: { navn: "Leverandørtilgang", domene: 0, col: 0, ikon: "link" },
  nettverk:   { navn: "Internt nettverk", domene: 0, col: 1, ikon: "hub" },
  skytjeneste:{ navn: "Skytjenester", domene: 0, col: 2, ikon: "cloud" },
  backup:     { navn: "Backup", domene: 0, col: 3, ikon: "backup" },
  tilgang:    { navn: "Tilgangskontroll", domene: 1, col: 0, ikon: "vpn_key" },
  epost:      { navn: "E-post", domene: 1, col: 1, ikon: "mail" },
  fagsystem:  { navn: "Fagsystemer", domene: 2, col: 0, ikon: "computer" },
  okonomi:    { navn: "Økonomi / lønn", domene: 2, col: 1, ikon: "finance" },
  personaldata:{ navn: "Personopplysninger", domene: 2, col: 2, ikon: "person" },
  fysisk:     { navn: "Fysisk sikring", domene: 3, col: 0, ikon: "domain" },
};

const DOMENER = [
  "DIGITAL INFRASTRUKTUR",
  "BRUKER OG TILGANG",
  "KJERNEVIRKSOMHET",
  "FYSISK SIKRING",
];

function fg(s?: string): string {
  if (!s) return "#2563eb";
  const m: Record<string, string> = {
    svært_kritisk: "#ff003c", nede: "#ff2244", kritisk: "#ff5500",
    feil: "#ff6600", manipulert: "#e06000", svekket: "#cc8800",
    advarsel: "#ccaa00", oppdateres: "#3b82f6", normal: "#00cc66",
  };
  return m[s] || "#2563eb";
}

function statusTekst(s?: string): string {
  if (!s) return "NORMAL";
  const m: Record<string, string> = {
    svært_kritisk: "LANGVARIG NEDETID/SVÆRT KRITISK", nede: "NEDE", kritisk: "KRITISK",
    feil: "FEIL", manipulert: "MANIPULERT", svekket: "SVEKKET",
    advarsel: "ADVARSEL", oppdateres: "OPPDATERES", normal: "NORMAL",
  };
  return m[s] || s.toUpperCase();
}

interface Props {
  onBack: () => void;
}

export default function RisikoSimulator({ onBack }: Props) {
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
    setStatuses({});
    setLog([]);
    setAktivIdx(-1);
    setRunning(false);
    setDone(false);
  };

  const simuler = () => {
    if (!valgt) return;
    nullstill();
    const sc = SCENARIOS.find(s => s.id === valgt);
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
  const antallBrutt = Object.values(statuses).filter(s =>
    ["nede", "kritisk", "svært kritisk", "feil", "manipulert"].includes(s)).length;
  const lovkravListe = [...new Set(log.filter(l => l.lovkrav).map(l => l.lovkrav))];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#060b18",
      color: "#d1d5db",
      padding: "14px",
      boxSizing: "border-box",
      backgroundImage: "radial-gradient(ellipse at 85% 30%, rgba(37,99,235,0.05) 0%, transparent 55%)"
    }}>
      {/* TOPPLINJE */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px", borderBottom: "1px solid #1c2a40", paddingBottom: "11px" }}>
        <button className="backbtn" onClick={onBack} style={{
          border: "1px solid #1c2a40", background: "transparent", color: "#8896aa",
          padding: "5px 14px", borderRadius: "6px", fontSize: "13px", fontFamily: "inherit",
          display: "flex", alignItems: "center", gap: "6px",
        }}>
          <Icon name="arrow_back" size={16} ariaLabel="" /> Tilbake
        </button>
        <span style={{ fontSize: "16px", fontWeight: 700, color: "#3b82f6", letterSpacing: "0.06em" }}>NSM RISIKO 2026</span>
        <span style={{ fontSize: "10px", color: "#8896aa", letterSpacing: "0.08em", marginTop: "1px" }}>SCENARIOSIMULATOR · ANSKAFFELSER OG LEVERANDØRKJEDER</span>
        {running && (
          <span style={{ marginLeft: "auto", color: "#f59e0b", fontSize: "11px", animation: "blink 0.9s infinite", display: "flex", alignItems: "center", gap: "6px" }}>
            <Icon name="radio_button_checked" size={12} fill={true} ariaLabel="" /> SIMULERING AKTIV
          </span>
        )}
        {done && (
          <span style={{ marginLeft: "auto", color: "#ef4444", fontSize: "11px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Icon name="stop" size={12} fill={true} ariaLabel="" /> FULLFØRT · {antallBrutt} SYSTEMER RAMMET
          </span>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "12px", alignItems: "start" }}>
        {/* VENSTRE KOLONNE */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {/* ORGANISASJONSVISNING */}
          <div style={{ border: "1px solid #1c2a40", borderRadius: "6px", overflow: "hidden", background: "rgba(8,16,32,0.95)" }}>
            <div style={{ padding: "8px 14px", borderBottom: "1px solid #1c2a40", fontSize: "10px", color: "#8896aa", letterSpacing: "0.08em", fontWeight: 600 }}>
              ORGANISASJONSVISNING — SYSTEMSTATUS
            </div>
            <div style={{ padding: "10px", display: "flex", flexDirection: "column", gap: "3px" }}>
              {DOMENER.map((domenenavn, dIdx) => {
                const sys = Object.entries(SYS_INFO)
                  .filter(([, v]) => v.domene === dIdx)
                  .sort((a, b) => a[1].col - b[1].col);
                return (
                  <div key={dIdx} style={{ borderLeft: "2px solid #1c2a40", paddingLeft: "10px", paddingTop: "7px", paddingBottom: "7px" }}>
                    <div style={{ fontSize: "9px", color: "#7a8a9e", letterSpacing: "0.08em", marginBottom: "7px" }}>{domenenavn}</div>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {sys.map(([id, info]) => {
                        const st = statuses[id];
                        const c = fg(st);
                        const hit = !!st && st !== "normal";
                        return (
                          <div key={id} className={`sysnode${hit ? " hit" : ""}`} style={{
                            border: `1px solid ${hit ? c : "#1c2a40"}`,
                            borderRadius: "6px",
                            padding: "6px 10px",
                            background: hit ? `${c}12` : "rgba(6,11,24,0.97)",
                            minWidth: "110px",
                            color: hit ? c : "#9ca3af",
                            position: "relative",
                            overflow: "hidden",
                          }}>
                            {hit && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: c, animation: "blink 0.9s infinite" }} />}
                            <div style={{ marginBottom: "2px" }}>
                              <Icon name={info.ikon} size={20} fill={hit} ariaLabel="" />
                            </div>
                            <div style={{ fontSize: "10px", fontWeight: 700, lineHeight: 1.3 }}>{info.navn}</div>
                            <div style={{ fontSize: "9px", marginTop: "2px", color: hit ? c : "#6b7280", letterSpacing: "0.05em" }}>{statusTekst(st)}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* HENDELSESLOGG */}
          <div style={{ border: "1px solid #1c2a40", borderRadius: "6px", background: "rgba(8,16,32,0.95)" }}>
            <div style={{ padding: "8px 14px", borderBottom: "1px solid #1c2a40", fontSize: "10px", color: "#8896aa", letterSpacing: "0.08em", fontWeight: 600 }}>
              HENDELSESLOGG — FEILKJEDE
            </div>
            <div ref={logRef} style={{ maxHeight: "280px", overflowY: "auto", padding: "7px" }}>
              {log.length === 0
                ? <div style={{ color: "#5a6a80", fontSize: "12px", padding: "24px", textAlign: "center" }}>— Velg scenario og trykk SIMULER —</div>
                : log.map((e, i) => {
                  const c = fg(e.status);
                  return (
                    <div key={i} className="logrow" style={{
                      display: "flex", gap: "7px", padding: "5px 7px", marginBottom: "1px",
                      borderLeft: `3px solid ${c}`, background: i === aktivIdx ? `${c}0c` : "transparent",
                      borderRadius: "0 4px 4px 0",
                    }}>
                      <div style={{ color: "#7a8a9e", fontSize: "9px", minWidth: "55px", paddingTop: "1px", flexShrink: 0 }}>{e.ts}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", gap: "5px", alignItems: "center", marginBottom: "2px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "10px", color: c, fontWeight: 700 }}>{SYS_INFO[e.sys]?.navn || e.sys}</span>
                          <span style={{ fontSize: "8px", color: c, border: `1px solid ${c}30`, padding: "0 4px", borderRadius: "3px" }}>{statusTekst(e.status)}</span>
                          {e.lovkrav && (
                            <span style={{ fontSize: "8px", color: "#d97706", border: "1px solid #d9770630", padding: "0 4px", borderRadius: "3px", marginLeft: "auto", display: "flex", alignItems: "center", gap: "3px" }}>
                              <Icon name="warning" size={10} fill={true} ariaLabel="" /> {e.lovkrav}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "10px", color: "#9ca3af", lineHeight: 1.5 }}>{e.melding}</div>
                      </div>
                    </div>
                  );
                })
              }
            </div>
          </div>

          {/* OPPSUMMERING */}
          {done && (
            <div style={{ border: "1px solid #dc2626", borderRadius: "6px", background: "rgba(30,0,6,0.95)", padding: "14px", animation: "fadein 0.4s ease" }}>
              <div style={{ fontSize: "10px", color: "#ef4444", letterSpacing: "0.08em", marginBottom: "10px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
                <Icon name="stop" size={12} fill={true} ariaLabel="" /> KONSEKVENSOPPSUMMERING
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                <div>
                  <div style={{ fontSize: "9px", color: "#7a8a9e", marginBottom: "3px" }}>SYSTEMER RAMMET</div>
                  <div style={{ color: "#ef4444", fontSize: "28px", fontWeight: 700, lineHeight: 1 }}>{antallBrutt}</div>
                </div>
                <div>
                  <div style={{ fontSize: "9px", color: "#7a8a9e", marginBottom: "3px" }}>LOVKRAV BERØRT</div>
                  <div style={{ color: "#f59e0b", fontSize: "28px", fontWeight: 700, lineHeight: 1 }}>{lovkravListe.length}</div>
                </div>
              </div>
              {lovkravListe.map((l, i) => (
                <div key={i} style={{ fontSize: "10px", color: "#d97706", padding: "2px 0", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Icon name="arrow_forward" size={12} ariaLabel="" /> {l}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* HØYRE KOLONNE */}
        <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
          {/* SCENARIOVELGER */}
          <div style={{ border: "1px solid #1c2a40", borderRadius: "6px", background: "rgba(8,16,32,0.95)" }}>
            <div style={{ padding: "8px 14px", borderBottom: "1px solid #1c2a40", fontSize: "10px", color: "#8896aa", letterSpacing: "0.08em", fontWeight: 600 }}>VELG HENDELSE</div>
            <div style={{ padding: "7px", display: "flex", flexDirection: "column", gap: "5px" }}>
              {SCENARIOS.map(sc => (
                <div key={sc.id} className={`sccard${valgt === sc.id ? " sel" : ""}`} onClick={() => velgScenario(sc.id)}
                  style={{ padding: "10px", borderRadius: "5px", border: "1px solid #1c2a40", background: "rgba(6,11,24,0.95)" }}>
                  <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                    <Icon name={sc.ikon} size={20} fill={valgt === sc.id} ariaLabel="" />
                    <div>
                      <div style={{ fontSize: "10px", fontWeight: 700, color: valgt === sc.id ? "#60a5fa" : "#93c5fd", marginBottom: "3px", lineHeight: 1.4 }}>{sc.navn}</div>
                      <div style={{ fontSize: "9px", color: "#7a8a9e", lineHeight: 1.4 }}>{sc.kort}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SIMULERINGSKNAPP */}
          <button className="simbtn" onClick={simuler} disabled={!valgt || running} style={{
            padding: "13px", fontSize: "11px", fontFamily: "inherit", fontWeight: 700,
            letterSpacing: "0.1em", borderRadius: "6px", border: "none",
            background: running ? "#0a140a" : done ? "#0a0a16" : valgt ? "linear-gradient(135deg,#1e40af,#2563eb)" : "#0f1520",
            color: running ? "#4a8a4a" : done ? "#6b7280" : valgt ? "#e5e7eb" : "#4b5563",
            boxShadow: valgt && !running && !done ? "0 0 20px rgba(37,99,235,0.3)" : "none",
            cursor: valgt && !running ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
          }}>
            {running ? (
              <>
                <Icon name="sync" size={14} ariaLabel="" style={{ animation: "spin 1s linear infinite" }} />
                SIMULERER...
              </>
            ) : done ? (
              <>
                <Icon name="replay" size={14} ariaLabel="" />
                KJØR IGJEN
              </>
            ) : (
              <>
                <Icon name="play_arrow" size={14} fill={true} ariaLabel="" />
                SIMULER
              </>
            )}
          </button>

          {(done || running) && (
            <button className="simbtn" onClick={nullstill} style={{
              padding: "9px", fontSize: "10px", fontFamily: "inherit", letterSpacing: "0.08em",
              borderRadius: "6px", border: "1px solid #1c2a40", background: "transparent",
              color: "#8896aa", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
            }}>
              <Icon name="close" size={14} ariaLabel="" /> NULLSTILL
            </button>
          )}

          {/* TEGNFORKLARING */}
          <div style={{ border: "1px solid #1c2a40", borderRadius: "6px", background: "rgba(8,16,32,0.95)", padding: "10px" }}>
            <div style={{ fontSize: "9px", color: "#8896aa", letterSpacing: "0.08em", marginBottom: "8px", fontWeight: 600 }}>STATUSKODER</div>
            {([
              ["NORMAL", "#2563eb"],
              ["ADVARSEL", "#ccaa00"],
              ["SVEKKET", "#cc8800"],
              ["FEIL / MANIPULERT", "#ff6600"],
              ["NEDETID / KRITISK", "#ff2244"],
              ["LANGVARIG NEDETID / SVÆRT KRITISK", "#ff003c"],
            ] as const).map(([l, c]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
                <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: c, boxShadow: `0 0 5px ${c}`, flexShrink: 0 }} />
                <span style={{ fontSize: "9px", color: "#8896aa" }}>{l}</span>
              </div>
            ))}
          </div>

          {/* KONTEKST */}
          {valgt && (
            <div style={{ border: "1px solid #1c2a40", borderRadius: "6px", background: "rgba(8,16,32,0.95)", padding: "10px", animation: "fadein 0.3s ease" }}>
              <div style={{ fontSize: "9px", color: "#8896aa", letterSpacing: "0.08em", marginBottom: "6px", fontWeight: 600 }}>KONTEKST</div>
              <div style={{ fontSize: "10px", color: "#9ca3af", lineHeight: 1.6 }}>{SCENARIOS.find(s => s.id === valgt)?.beskrivelse}</div>
              <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #1c2a40", fontSize: "9px", color: "#5a6a80" }}>
                Basert på NSM Risiko 2026 og Veileder for sikkerhet i anskaffelser
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
