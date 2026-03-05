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
  owasp: string;
  steg: Steg[];
}

interface LoggInnslag extends Steg {
  idx: number;
  ts: string;
}

interface SystemInfo {
  navn: string;
  lag: number;
  col: number;
  ikon: string;
}

/* ————————————————————————————————————————————
   5 scenarier basert på OWASP Top Ten 2025
   Målgruppe: Utviklere og driftsansvarlige i norsk offentlig sektor
   ———————————————————————————————————————————— */

const SCENARIOS: Scenario[] = [
  {
    id: "broken_access",
    navn: "A01 — Broken Access Control",
    ikon: "shield",
    owasp: "A01:2025",
    kort: "IDOR-sårbarhet i portal — innbyggere ser andres data",
    beskrivelse: "En innbyggerportal mangler tilgangskontroll på API-nivå. Ved å endre bruker-ID i URL-en kan en angriper se og endre andre innbyggeres søknader, vedtak og personopplysninger. Feilen skyldes at autorisasjonssjekk kun gjøres i frontend, ikke i backend-API-et.",
    steg: [
      { tid: 0, sys: "api", status: "kompromittert", melding: "Angriper oppdager at GET /api/soknader/{id} returnerer data uten autorisasjonssjekk. Endrer ID fra egen til vilkårlig." },
      { tid: 1200, sys: "database", status: "kompromittert", melding: "Databasen returnerer søknadsdata for alle innbyggere. Ingen row-level security. 14 000 søknader eksponert.", lovkrav: "GDPR art. 32 — tilgangskontroll" },
      { tid: 2400, sys: "persondata", status: "kompromittert", melding: "Personnummer, inntektsopplysninger og helsedata leses ut via IDOR-sårbarheten.", lovkrav: "GDPR art. 33 — varsling innen 72 timer" },
      { tid: 3600, sys: "portal", status: "manipulert", melding: "Angriper bruker PUT /api/soknader/{id} til å endre status på andres søknader. Vedtak manipuleres." },
      { tid: 4800, sys: "epost", status: "svekket", melding: "Automatisk e-postvarsling sender bekreftelse på endret søknad til uskyldig innbygger. Hendelsen oppdages." },
      { tid: 6000, sys: "logg", status: "advarsel", melding: "Loggene viser 4 300 uautoriserte API-kall siste 72 timer. Ingen alarm ble utløst.", lovkrav: "Digitalsikkerhetsloven art. 21" },
      { tid: 7200, sys: "brannmur", status: "feil", melding: "WAF var konfigurert til å logge, ikke blokkere. Rate limiting var deaktivert for «intern» trafikk." },
      { tid: 8400, sys: "backup", status: "svekket", melding: "Omfanget av dataeksponering er ukjent. Alle backups siden sårbarheten ble introdusert må gjennomgås.", lovkrav: "Personopplysningsloven § 26" },
    ]
  },
  {
    id: "misconfig",
    navn: "A02 — Security Misconfiguration",
    ikon: "settings",
    owasp: "A02:2025",
    kort: "Debug-modus i produksjon — feilmeldinger avslører infrastruktur",
    beskrivelse: "En webapplikasjon deployes til produksjon med debug-modus aktivert. Stack traces, databasetilkoblingsstrenger og interne IP-adresser eksponeres i feilmeldinger. Default admin-konto er ikke deaktivert. Unødvendige tjenester og porter er åpne.",
    steg: [
      { tid: 0, sys: "webserver", status: "advarsel", melding: "Debug-modus er aktiv i produksjon. Detaljerte stack traces returneres ved alle feil." },
      { tid: 1000, sys: "api", status: "svekket", melding: "Feilmelding avslører databasetype, versjon og intern IP: PostgreSQL 14.2 på 10.0.3.47." },
      { tid: 2000, sys: "admin", status: "kompromittert", melding: "Default admin-konto «admin/admin» er aktiv. Angriper logger inn på /admin-panelet.", lovkrav: "NSM grunnprinsipper 2.3 — minste privilegium" },
      { tid: 3200, sys: "database", status: "kompromittert", melding: "Admin-panelet gir direkte databasetilgang. Hele bruker-tabellen med passord-hasher eksporteres." },
      { tid: 4400, sys: "persondata", status: "kompromittert", melding: "12 500 brukerprofiler med personnummer, e-post og adresse lastes ned.", lovkrav: "GDPR art. 33 — varsling innen 72 timer" },
      { tid: 5600, sys: "webserver", status: "kompromittert", melding: "Unødvendig tjeneste (phpMyAdmin) kjører på port 8080 uten autentisering. Full DB-tilgang." },
      { tid: 6800, sys: "logg", status: "feil", melding: "Logging skriver til lokal fil som roterer hver 24 timer. Eldre logger er allerede slettet.", lovkrav: "Sikkerhetsloven § 4-3" },
    ]
  },
  {
    id: "supply_chain",
    navn: "A03 — Supply Chain Failures",
    ikon: "link",
    owasp: "A03:2025",
    kort: "Kompromittert npm-pakke — bakdør i CI/CD-pipeline",
    beskrivelse: "En populær npm-pakke som brukes i virksomhetens webapplikasjon blir kompromittert via en dependency confusion-angrep. Ondsinnet kode injiseres i en patch-oppdatering og deployes automatisk via CI/CD-pipelinen uten manuell gjennomgang.",
    steg: [
      { tid: 0, sys: "cicd", status: "kompromittert", melding: "npm-pakken «form-validator-utils» v2.1.4 inneholder bakdør. Automatisk oppdatering via Dependabot." },
      { tid: 1200, sys: "webserver", status: "kompromittert", melding: "Ondsinnet kode deployes til produksjon via automatisk CI/CD-pipeline. Ingen manuell kodegjennomgang.", lovkrav: "Digitalsikkerhetsloven art. 21" },
      { tid: 2400, sys: "portal", status: "kompromittert", melding: "Bakdøren samler inn alle skjemadata (inkl. personnummer) og sender til ekstern server." },
      { tid: 3600, sys: "persondata", status: "kompromittert", melding: "Innbyggernes personopplysninger eksfiltreres i sanntid. 850 søknader kompromittert første døgn.", lovkrav: "GDPR art. 33 — varsling innen 72 timer" },
      { tid: 4800, sys: "api", status: "svekket", melding: "Bakdøren installerer en sekundær payload som kartlegger interne API-endepunkter og tokens." },
      { tid: 6000, sys: "database", status: "advarsel", melding: "SCA-verktøy (Software Composition Analysis) var ikke konfigurert. Ingen SBOM finnes for applikasjonen.", lovkrav: "NSM grunnprinsipper 2.9 — programvareintegritet" },
      { tid: 7200, sys: "logg", status: "svekket", melding: "Utgående trafikk til ukjent IP ble ikke fanget opp. Egress-filtrering var ikke implementert." },
    ]
  },
  {
    id: "injection",
    navn: "A05 — Injection",
    ikon: "code",
    owasp: "A05:2025",
    kort: "SQL-injeksjon i søkefelt — hele databasen dumpes",
    beskrivelse: "Søkefeltet i en offentlig tjeneste validerer ikke brukerinput. En angriper bruker SQL-injeksjon til å hente ut hele databasen, inkludert intern saksbehandlerdata, før angrepet eskaleres til OS-kommandoer via xp_cmdshell.",
    steg: [
      { tid: 0, sys: "portal", status: "kompromittert", melding: "Angriper sender ' OR 1=1 -- i søkefeltet. Applikasjonen returnerer alle poster i tabellen (45 000 rader)." },
      { tid: 1200, sys: "database", status: "kompromittert", melding: "UNION SELECT avslører tabellstruktur. Angriper finner tabellene «brukere», «vedtak» og «dokumenter»." },
      { tid: 2400, sys: "persondata", status: "kompromittert", melding: "Tabellen «brukere» inneholder personnummer, passord-hasher (MD5 uten salt) og adresser.", lovkrav: "GDPR art. 32 — kryptering" },
      { tid: 3600, sys: "admin", status: "kompromittert", melding: "Admin-passord knekkes (MD5: «Sommer2024!»). Angriper logger inn som systemadministrator.", lovkrav: "NSM grunnprinsipper 2.3" },
      { tid: 4800, sys: "webserver", status: "kompromittert", melding: "Via admin-tilgang aktiveres xp_cmdshell. Angriper har nå OS-tilgang på databaseserveren." },
      { tid: 6000, sys: "api", status: "nede", melding: "Angriper installerer kryptominer og bakdør. Serverlast øker til 98%. Tjenesten svarer ikke." },
      { tid: 7200, sys: "brannmur", status: "svekket", melding: "Utgående C2-trafikk over port 443 blandes med normal HTTPS. Ingen DPI-inspeksjon konfigurert." },
      { tid: 8400, sys: "logg", status: "feil", melding: "SQL-feilmeldinger ble logget men aldri overvåket. 3 uker med angrepsforsøk ble ignorert.", lovkrav: "Digitalsikkerhetsloven art. 21" },
    ]
  },
  {
    id: "auth_failure",
    navn: "A07 — Authentication Failures",
    ikon: "passkey",
    owasp: "A07:2025",
    kort: "Credential stuffing mot ansattportal — ingen MFA, ingen rate limiting",
    beskrivelse: "En ansattportal med VPN-tilgang mangler flerfaktorautentisering og rate limiting. En angriper bruker lekkede brukernavn/passord-par fra et tidligere databrudd til å systematisk logge inn som ansatte. Session-ID-er er forutsigbare og invalideres ikke ved passordendring.",
    steg: [
      { tid: 0, sys: "portal", status: "advarsel", melding: "Automatisert credential stuffing startes. 200 innloggingsforsøk per minutt. Ingen rate limiting." },
      { tid: 1200, sys: "admin", status: "kompromittert", melding: "5 av 200 passord-par gir treff. Ansatt med rollen «saksbehandler» kompromitteres. Ingen MFA.", lovkrav: "NSM grunnprinsipper 2.2 — autentisering" },
      { tid: 2400, sys: "epost", status: "kompromittert", melding: "Angriperen leser ansattes e-post via SSO-token. Intern kommunikasjon om pågående anskaffelse avdekkes." },
      { tid: 3600, sys: "api", status: "kompromittert", melding: "API-tokenet er en forutsigbar JWT uten utløpstid. Token gjenbrukes selv etter at ansatt bytter passord." },
      { tid: 4800, sys: "persondata", status: "kompromittert", melding: "Saksbehandlerens tilgang brukes til å eksportere personopplysninger om 2 300 innbyggere.", lovkrav: "GDPR art. 33 — varsling innen 72 timer" },
      { tid: 6000, sys: "database", status: "svekket", melding: "Session-ID-er er sekvensielle (1001, 1002, 1003...). Angriper kaprer 12 aktive sesjoner." },
      { tid: 7200, sys: "logg", status: "feil", melding: "Mislykkede innloggingsforsøk logges, men ingen alarm utløses. Terskelverdier er satt til 10 000.", lovkrav: "Sikkerhetsloven § 4-3 — sikkerhetsstyring" },
    ]
  }
];

const SYS_INFO: Record<string, SystemInfo> = {
  portal:     { navn: "Innbyggerportal", lag: 0, col: 0, ikon: "language" },
  webserver:  { navn: "Webserver", lag: 0, col: 1, ikon: "dns" },
  brannmur:   { navn: "WAF / Brannmur", lag: 0, col: 2, ikon: "shield_locked" },
  api:        { navn: "API-lag", lag: 1, col: 0, ikon: "api" },
  admin:      { navn: "Admin-panel", lag: 1, col: 1, ikon: "admin_panel_settings" },
  cicd:       { navn: "CI/CD-pipeline", lag: 1, col: 2, ikon: "build" },
  database:   { navn: "Database", lag: 2, col: 0, ikon: "database" },
  persondata: { navn: "Personopplysninger", lag: 2, col: 1, ikon: "person" },
  epost:      { navn: "E-post / SSO", lag: 2, col: 2, ikon: "mail" },
  logg:       { navn: "Logging / SIEM", lag: 3, col: 0, ikon: "monitoring" },
  backup:     { navn: "Backup", lag: 3, col: 1, ikon: "backup" },
};

const LAG = [
  "PRESENTASJON — Frontend / Edge",
  "APPLIKASJON — Backend / API",
  "DATA — Database / Personopplysninger",
  "DRIFT — Logging / Backup",
];

function fg(s?: string): string {
  if (!s) return "#2563eb";
  const m: Record<string, string> = {
    kompromittert: "#ff003c", nede: "#ff2244", kritisk: "#ff5500",
    feil: "#ff6600", manipulert: "#e06000", svekket: "#cc8800",
    advarsel: "#ccaa00", oppdateres: "#3b82f6", normal: "#00cc66",
  };
  return m[s] || "#2563eb";
}

function statusTekst(s?: string): string {
  if (!s) return "NORMAL";
  const m: Record<string, string> = {
    kompromittert: "KOMPROMITTERT", nede: "NEDE", kritisk: "KRITISK",
    feil: "FEIL", manipulert: "MANIPULERT", svekket: "SVEKKET",
    advarsel: "ADVARSEL", oppdateres: "OPPDATERES", normal: "NORMAL",
  };
  return m[s] || s.toUpperCase();
}

interface Props {
  onBack: () => void;
}

export default function OwaspSimulator({ onBack }: Props) {
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
    ["nede", "kritisk", "kompromittert", "feil", "manipulert"].includes(s)).length;
  const lovkravListe = [...new Set(log.filter(l => l.lovkrav).map(l => l.lovkrav))];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#060b18",
      color: "#d1d5db",
      padding: "14px",
      boxSizing: "border-box",
      backgroundImage: "radial-gradient(ellipse at 50% 20%, rgba(37,99,235,0.05) 0%, transparent 55%)"
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
        <span style={{ fontSize: "16px", fontWeight: 700, color: "#3b82f6", letterSpacing: "0.06em" }}>OWASP TOP 10 2025</span>
        <span style={{ fontSize: "10px", color: "#8896aa", letterSpacing: "0.08em", marginTop: "1px" }}>SCENARIOSIMULATOR · WEBAPPLIKASJONSSIKKERHET</span>
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
          {/* ARKITEKTURVISNING */}
          <div style={{ border: "1px solid #1c2a40", borderRadius: "6px", overflow: "hidden", background: "rgba(8,16,32,0.95)" }}>
            <div style={{ padding: "8px 14px", borderBottom: "1px solid #1c2a40", fontSize: "10px", color: "#8896aa", letterSpacing: "0.08em", fontWeight: 600 }}>
              ARKITEKTURVISNING — SYSTEMSTATUS
            </div>
            <div style={{ padding: "10px", display: "flex", flexDirection: "column", gap: "3px" }}>
              {LAG.map((lagnavn, lIdx) => {
                const sys = Object.entries(SYS_INFO)
                  .filter(([, v]) => v.lag === lIdx)
                  .sort((a, b) => a[1].col - b[1].col);
                return (
                  <div key={lIdx} style={{ borderLeft: "2px solid #1c2a40", paddingLeft: "10px", paddingTop: "7px", paddingBottom: "7px" }}>
                    <div style={{ fontSize: "9px", color: "#7a8a9e", letterSpacing: "0.08em", marginBottom: "7px" }}>{lagnavn}</div>
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
              HENDELSESLOGG — ANGREPSKJEDE
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
              ["KOMPROMITTERT", "#ff003c"],
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
                Basert på OWASP Top Ten 2025 ({SCENARIOS.find(s => s.id === valgt)?.owasp})
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
