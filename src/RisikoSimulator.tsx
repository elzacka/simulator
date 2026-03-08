import { useState } from "react";
import Icon from "./Icon";
import risikoYaml from "./scenarios/risiko.yaml?raw";
import { parseSimulatorData, useScenarioEngine, fg, statusTekst } from "./scenarioEngine";

const data = parseSimulatorData(risikoYaml);
const SYS_INFO = data.systemer;
const SCENARIOS = data.scenarier;
const DOMENER = data.gruppeLabels;

interface Props {
  onBack: () => void;
}

export default function RisikoSimulator({ onBack }: Props) {
  const {
    valgt, running, done, statuses, log, aktivIdx, logRef,
    scenario, antallBrutt, lovkravListe,
    velgScenario, simuler, nullstill,
  } = useScenarioEngine(SCENARIOS);
  const [scOpen, setScOpen] = useState(false);

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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "12px", alignItems: "start" }}>
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
                  .filter(([, v]) => v.gruppe === dIdx)
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
                            width: "120px",
                            height: "68px",
                            color: hit ? c : "#9ca3af",
                            position: "relative",
                            overflow: "hidden",
                            textAlign: "center",
                            boxSizing: "border-box",
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
              HENDELSESLOGG — HENDELSESKJEDE
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
        </div>

        {/* HØYRE KOLONNE — SCENARIOVELGER + KONTROLLER */}
        <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
          <div style={{ border: "1px solid #1c2a40", borderRadius: "6px", background: "rgba(8,16,32,0.95)", position: "relative" }}>
            <div onClick={() => setScOpen(!scOpen)} style={{
              padding: "8px 14px", fontSize: "10px", color: "#8896aa", letterSpacing: "0.08em", fontWeight: 600,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", userSelect: "none",
            }}>
              <span>{scenario ? scenario.navn : "Velg scenario"}</span>
              <Icon name={scOpen ? "expand_less" : "expand_more"} size={16} ariaLabel="" />
            </div>
            {scOpen && (
              <div style={{ borderTop: "1px solid #1c2a40", padding: "7px", display: "flex", flexDirection: "column", gap: "5px", maxHeight: "400px", overflowY: "auto" }}>
                {SCENARIOS.map(sc => (
                  <div key={sc.id} className={`sccard${valgt === sc.id ? " sel" : ""}`} onClick={() => { velgScenario(sc.id); setScOpen(false); }}
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
            )}
          </div>

          {/* KONTEKST */}
          {valgt && (
            <div style={{ border: "1px solid #1c2a40", borderRadius: "6px", background: "rgba(8,16,32,0.95)", padding: "10px", animation: "fadein 0.3s ease" }}>
              <div style={{ fontSize: "9px", color: "#8896aa", letterSpacing: "0.08em", marginBottom: "6px", fontWeight: 600 }}>KONTEKST</div>
              <div style={{ fontSize: "10px", color: "#9ca3af", lineHeight: 1.6 }}>{scenario?.beskrivelse}</div>
              <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #1c2a40", fontSize: "9px", color: "#5a6a80" }}>
                Basert på NSM Risiko 2026
              </div>
            </div>
          )}

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
              ["NORMAL", "#00cc66"],
              ["ADVARSEL", "#ccaa00"],
              ["SVEKKET", "#cc8800"],
              ["EKSPONERT", "#a855f7"],
              ["FEIL / MANIPULERT", "#ff6600"],
              ["NEDE / KRITISK", "#ff2244"],
              ["KOMPROMITTERT", "#ff003c"],
            ] as const).map(([l, c]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
                <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: c, boxShadow: `0 0 5px ${c}`, flexShrink: 0 }} />
                <span style={{ fontSize: "9px", color: "#8896aa" }}>{l}</span>
              </div>
            ))}
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
      </div>
    </div>
  );
}
