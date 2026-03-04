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
  etasje: number;
  col: number;
  ikon: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: "snmp_ups", navn: "OWASP A05 — Default SNMP på UPS", ikon: "bolt",
    kort: "Default credentials → strømbortfall → total kollaps",
    beskrivelse: "Angriper bruker ukryptert SNMP community string «public» til å sende shutdown-kommando til UPS. Ingen autentisering kreves.",
    steg: [
      { tid: 0, sys: "ups", status: "svært_kritisk", melding: "Angriper sender SNMP WriteRequest: powerOff=1 (community: «public»)" },
      { tid: 900, sys: "ups", status: "nede", melding: "UPS slår seg av. Strømbortfall i teknisk rom og serverrom." },
      { tid: 1600, sys: "hvac", status: "nede", melding: "HVAC mister strøm. Kjøling stanser umiddelbart." },
      { tid: 2200, sys: "server", status: "nede", melding: "Servere mister strøm. Ukontrollert nedstenging initieres." },
      { tid: 2800, sys: "brannmur", status: "nede", melding: "Brannmur uten strøm. Nettverksbeskyttelse faller bort." },
      { tid: 3400, sys: "TVO", status: "nede", melding: "NVR uten strøm. Alle kameraer svarte. Opptak stopper.", lovkrav: "Sikkerhetsloven §7" },
      { tid: 4100, sys: "aak", status: "svekket", melding: "AAK på nødstrøm/batteri. Loggføring stopper om 15 min." },
      { tid: 5000, sys: "fagsystem", status: "nede", melding: "Alle fagsystemer utilgjengelige. Saksbehandling umulig.", lovkrav: "Digitalsikkerhetsloven art. 21" },
      { tid: 6200, sys: "servertemp", status: "kritisk", melding: "Servertemperatur >35°C. Permanent maskinvareskade risikeres.", lovkrav: "NSM GP 2.5 — strømredundans" },
    ]
  },
  {
    id: "bacnet", navn: "A01 — BACnet BMS eksponert mot internett", ikon: "thermostat",
    kort: "Angriper manipulerer kjøling → overoppheting → total nedetid",
    beskrivelse: "Angriper finner BACnet port 47808 åpen på internett via Shodan. Ingen autentisering. Manipulerer kjølesetpoint direkte.",
    steg: [
      { tid: 0, sys: "bms", status: "svært_kritisk", melding: "BACnet port 47808 åpen. WriteProperty: cooling_setpoint=99°C sendt." },
      { tid: 1100, sys: "hvac", status: "manipulert", melding: "Kjølesetpoint overstyrt til 99°C. Vifter stanser. Kjølemedium stengt." },
      { tid: 2500, sys: "servertemp", status: "advarsel", melding: "Temperatur stiger jevnt. Nå 29°C — kritisk grense: 35°C." },
      { tid: 4000, sys: "server", status: "svekket", melding: "Servere throttler prosessorkraft for å begrense varme. Ytelse -45%." },
      { tid: 5800, sys: "servertemp", status: "kritisk", melding: "Temperatur >35°C. Automatisk nedstenging initieres.", lovkrav: "NIS2 art. 21 — alvorlig hendelse" },
      { tid: 6400, sys: "server", status: "nede", melding: "Servere stenger ned automatisk for å unngå permanent skade." },
      { tid: 7000, sys: "TVO", status: "nede", melding: "VMS-server ned. Alle kameraopptak stopper.", lovkrav: "Sikkerhetsloven §7" },
      { tid: 7800, sys: "fagsystem", status: "nede", melding: "Alle tjenester utilgjengelige. Samfunnsoppdrag ikke oppfylt.", lovkrav: "Digitalsikkerhetsloven" },
    ]
  },
  {
    id: "patching", navn: "Patchefeil brannmur → TVO svart", ikon: "construction",
    kort: "Automatisk oppdatering, feil ACL — kameraer slokner, ingen alarm",
    beskrivelse: "Automatisk firmware-oppdatering deployes 03:14. Ny ACL-regel blokkerer ved feil VLAN 30 (TVO/NVR). Ingen varsling utløses.",
    steg: [
      { tid: 0, sys: "brannmur", status: "oppdateres", melding: "Automatisk firmware-oppdatering starter 03:14. Brannmur restarter." },
      { tid: 1400, sys: "brannmur", status: "feil", melding: "Oppdatering fullført. Feil ACL-regel: VLAN 30 (TVO/NVR) blokkert." },
      { tid: 1700, sys: "TVO", status: "nede", melding: "NVR mister kontakt med alle kameraer via VLAN 30. Svarte skjermer.", lovkrav: "Sikkerhetsloven §7" },
      { tid: 2000, sys: "aak", status: "svekket", melding: "Adgangskontroll-server utilgjengelig via VLAN 30. Loggføring stanser." },
      { tid: 2800, sys: "vaktrom", status: "advarsel", melding: "Vakt oppdager svarte skjermer 03:22. Varsler IT-vakt på telefon." },
      { tid: 3800, sys: "brannmur", status: "normal", melding: "Feil ACL identifisert og rettet. Total nedetid: 1t 14min.", lovkrav: "Endringslogg-krav (ITIL/endringsstyring)" },
      { tid: 4400, sys: "TVO", status: "normal", melding: "Kameraer tilbake online. Opptak gjenopptas. Hull i videohistorikk." },
      { tid: 4400, sys: "aak", status: "normal", melding: "Adgangskontroll-logging gjenopptatt. 1t 14min uten sporing." },
    ]
  }
];

const SYS_INFO: Record<string, SystemInfo> = {
  ups:        { navn: "UPS", etasje: 0, col: 0, ikon: "bolt" },
  hvac:       { navn: "HVAC / Kjøling", etasje: 0, col: 1, ikon: "ac_unit" },
  bms:        { navn: "BMS / SD-anlegg", etasje: 0, col: 2, ikon: "rule_settings" },
  aak:        { navn: "Adgangskontroll", etasje: 1, col: 0, ikon: "lock" },
  TVO:       { navn: "TVO / NVR", etasje: 1, col: 1, ikon: "speed_camera" },
  vaktrom:    { navn: "Vaktrom", etasje: 1, col: 2, ikon: "person_shield" },
  brannmur:   { navn: "Brannmur", etasje: 2, col: 0, ikon: "shield_locked" },
  server:     { navn: "Servere", etasje: 2, col: 1, ikon: "dns" },
  servertemp: { navn: "Temp-sensor server", etasje: 2, col: 2, ikon: "thermostat" },
  fagsystem:  { navn: "Fagsystemer", etasje: 3, col: 1, ikon: "computer" },
};

const ETASJER = [
  "KJELLER — Teknisk rom",
  "1. ETG — Inngang / Vaktrom",
  "2. ETG — IT / Serverrom",
  "3. ETG — Kontorer / Drift",
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
    svært_kritisk: "LANGVARIG NEDETID / SVÆRT KRITISK", nede: "NEDE", kritisk: "KRITISK",
    feil: "FEIL", manipulert: "MANIPULERT", svekket: "SVEKKET",
    advarsel: "ADVARSEL", oppdateres: "OPPDATERES", normal: "NORMAL",
  };
  return m[s] || s.toUpperCase();
}

interface Props {
  onBack: () => void;
}

export default function OTSimulator({ onBack }: Props) {
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
    ["nede", "kritisk", "svært_kritisk", "feil", "manipulert"].includes(s)).length;
  const lovkravListe = [...new Set(log.filter(l => l.lovkrav).map(l => l.lovkrav))];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#060b18",
      color: "#d1d5db",
      padding: "14px",
      boxSizing: "border-box",
      backgroundImage: "radial-gradient(ellipse at 15% 40%, rgba(37,99,235,0.05) 0%, transparent 55%)"
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
        <span style={{ fontSize: "16px", fontWeight: 700, color: "#3b82f6", letterSpacing: "0.06em" }}>OPERASJONELL TEKNOLOGI</span>
        <span style={{ fontSize: "10px", color: "#8896aa", letterSpacing: "0.08em", marginTop: "1px" }}>SCENARIOSIMULATOR · BYGG</span>
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "12px", alignItems: "start" }}>
        {/* VENSTRE KOLONNE */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {/* BYGNINGSVISNING */}
          <div style={{ border: "1px solid #1c2a40", borderRadius: "6px", overflow: "hidden", background: "rgba(8,16,32,0.95)" }}>
            <div style={{ padding: "8px 14px", borderBottom: "1px solid #1c2a40", fontSize: "10px", color: "#8896aa", letterSpacing: "0.08em", fontWeight: 600 }}>
              BYGNINGSVISNING — SYSTEMSTATUS
            </div>
            <div style={{ padding: "10px", display: "flex", flexDirection: "column-reverse", gap: "3px" }}>
              {ETASJER.map((etasjenavn, etIdx) => {
                const sys = Object.entries(SYS_INFO)
                  .filter(([, v]) => v.etasje === etIdx)
                  .sort((a, b) => a[1].col - b[1].col);
                return (
                  <div key={etIdx} style={{ borderLeft: "2px solid #1c2a40", paddingLeft: "10px", paddingTop: "7px", paddingBottom: "7px" }}>
                    <div style={{ fontSize: "9px", color: "#7a8a9e", letterSpacing: "0.08em", marginBottom: "7px" }}>{etasjenavn}</div>
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
            <div ref={logRef} style={{ maxHeight: "250px", overflowY: "auto", padding: "7px" }}>
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
              ["NEDE / KRITISK", "#ff2244"],
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
                Basert på OWASP Top 10 2025 og hendelsesmønstre fra norsk offentlig sektor
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
