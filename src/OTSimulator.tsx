import { memo } from "react";
import Icon from "./Icon";
import otYaml from "./scenarios/ot.yaml?raw";
import { parseSimulatorData, useScenarioEngine, fg, statusTekst } from "./scenarioEngine";
import type { SystemInfo } from "./scenarioEngine";

const data = parseSimulatorData(otYaml);
const SYS_INFO = data.systemer;
const SCENARIOS = data.scenarier;

/* ── SVG tverrsnitt: posisjoner og forbindelser ── */

const SYS_POS: Record<string, { x: number; y: number }> = {
  ups:        { x: 195, y: 497 },
  hvac:       { x: 390, y: 497 },
  bms:        { x: 585, y: 497 },
  aak:        { x: 195, y: 378 },
  TVO:        { x: 390, y: 378 },
  vaktrom:    { x: 585, y: 378 },
  brannmur:   { x: 195, y: 259 },
  server:     { x: 390, y: 259 },
  servertemp: { x: 585, y: 259 },
  fagsystem:  { x: 390, y: 140 },
  angriper:   { x: 720, y: 52 },
};

/* Nodestørrelse: nw=80, nh=48. Halv: 40x, 24y.
   Kanter beregnet fra SYS_POS ± halv.
   Forbindelser stopper ved nodekant, ikke senter. */

const NODE_W = 80, NODE_H = 48;

/* ── SVG bygningsvisualisering ── */

const BuildingCrossSection = memo(({ statuses, showAngriper }: { statuses: Record<string, string>; showAngriper: boolean }) => {
  const bx = 100, bw = 580;
  const wallW = 3;
  const plates = [78, 196, 315, 434];
  const groundY = 434;
  const foundY = 553;

  return (
    <svg viewBox="0 0 800 590" style={{ width: "100%", height: "auto", display: "block" }}
         role="img" aria-label="Tverrsnitt av kontorbygg med OT-systemer">
      <defs>
        <pattern id="hatch" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="6" stroke="#1a2535" strokeWidth="0.5" />
        </pattern>
        <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
        </filter>
      </defs>

      {/* Bakgrunn og grunn */}
      <rect x="0" y="0" width="800" height="590" fill="#060b18" />
      <rect x="0" y={groundY} width="800" height={590 - groundY} fill="url(#hatch)" />
      <rect x="0" y={groundY} width="800" height={590 - groundY} fill="rgba(8,14,26,0.88)" />

      {/* Bygningskropp — etasjefyll */}
      <rect x={bx + wallW} y={85} width={bw - wallW * 2} height={111} fill="rgba(14,24,40,0.45)" />
      <rect x={bx + wallW} y={203} width={bw - wallW * 2} height={112} fill="rgba(12,20,36,0.45)" />
      <rect x={bx + wallW} y={322} width={bw - wallW * 2} height={112} fill="rgba(14,24,40,0.45)" />
      <rect x={bx + wallW} y={441} width={bw - wallW * 2} height={112} fill="rgba(10,18,32,0.6)" />

      {/* Etasjeskillere (betongdekker) — innsatt innenfor vegger */}
      {plates.map(y => (
        <rect key={y} x={bx + wallW} y={y} width={bw - wallW * 2} height={6} fill="#1a2840" />
      ))}

      {/* Tak */}
      <rect x={bx - 2} y={76} width={bw + 4} height={4} fill="#263348" rx={1} />

      {/* Fundament */}
      <rect x={bx - 8} y={foundY} width={bw + 16} height={16} fill="#1a2840" rx="2" />

      {/* Yttervegger */}
      <rect x={bx} y={76} width={wallW} height={foundY + 16 - 76} fill="#263348" />
      <rect x={bx + bw - wallW} y={76} width={wallW} height={foundY + 16 - 76} fill="#263348" />

      {/* Romskillere — svake, ikke-strukturelle */}
      <line x1={293} y1={85} x2={293} y2={foundY} stroke="#141e30" strokeDasharray="2,8" strokeWidth="0.5" />
      <line x1={487} y1={85} x2={487} y2={foundY} stroke="#141e30" strokeDasharray="2,8" strokeWidth="0.5" />

      {/* Bakkenivå — høyre linje starter med avstand fra vegg */}
      <line x1="55" y1={groundY + 3} x2={bx} y2={groundY + 3} stroke="#2a3a50" strokeWidth="1.5" />
      <text x="55" y={groundY - 3} fill="#3a4a5c" fontSize="7" fontFamily="'Nunito Sans', sans-serif">BAKKENIV&#197;</text>

      {/* Vinduer på fasade */}
      {[105, 135, 224, 254, 343, 373].map((wy, i) => (
        <g key={`w${i}`}>
          <rect x={bx + 5} y={wy} width={10} height={18} fill="rgba(37,99,235,0.06)" stroke="#1a2840" strokeWidth="0.5" rx="1" />
          <rect x={bx + bw - 15} y={wy} width={10} height={18} fill="rgba(37,99,235,0.06)" stroke="#1a2840" strokeWidth="0.5" rx="1" />
        </g>
      ))}

      {/* Systemnoder — avrundede rektangler (kun bygningsnoder, gruppe >= 0) */}
      {Object.entries(SYS_POS)
        .filter(([id]) => (SYS_INFO[id] as SystemInfo).gruppe >= 0)
        .map(([id, pos]) => {
        const info = SYS_INFO[id] as SystemInfo;
        const st = statuses[id];
        const c = fg(st);
        const hit = !!st && st !== "normal";
        const nw = NODE_W, nh = NODE_H;
        const nx = pos.x - nw / 2;
        const ny = pos.y - nh / 2;
        return (
          <g key={id}>
            {hit && (
              <rect x={nx - 6} y={ny - 6} width={nw + 12} height={nh + 12}
                    rx={11} fill={c} stroke="none"
                    filter="url(#nodeGlow)"
                    className="ot-node-glow" />
            )}
            <rect x={nx} y={ny} width={nw} height={nh} rx={7}
                  fill={hit ? `${c}12` : "rgba(8,14,28,0.92)"}
                  stroke={hit ? c : "#1e2d42"}
                  strokeWidth={hit ? 1.5 : 1} />
            <foreignObject x={pos.x - 9} y={ny + 6} width={18} height={18}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={info.ikon} size={16} fill={hit} ariaLabel=""
                      style={{ color: hit ? c : "#6b7280" }} />
              </div>
            </foreignObject>
            <text x={pos.x} y={ny + nh - 9}
                  textAnchor="middle"
                  fill={hit ? c : "#8896aa"}
                  fontSize="7.5" fontWeight={hit ? 700 : 600}
                  fontFamily="'Nunito Sans', sans-serif">
              {info.navn}
            </text>
            {hit && (
              <g>
                <rect x={pos.x - 30} y={ny + nh + 3} width={60} height={14}
                      rx={3} fill={`${c}18`} stroke={c} strokeWidth={0.5} />
                <text x={pos.x} y={ny + nh + 13}
                      textAnchor="middle"
                      fill={c}
                      fontSize="7" fontWeight={700}
                      fontFamily="'Nunito Sans', sans-serif"
                      letterSpacing="0.04em">
                  {statusTekst(st)}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Angripernode — ekstern, utenfor bygget (kun for angrepsscenarier) */}
      {showAngriper && (() => {
        const pos = SYS_POS.angriper;
        const info = SYS_INFO.angriper as SystemInfo;
        const st = statuses.angriper;
        const c = st ? fg(st) : "#ff003c";
        const hit = !!st && st !== "normal";
        const nw = NODE_W, nh = NODE_H;
        const nx = pos.x - nw / 2;
        const ny = pos.y - nh / 2;
        return (
          <g>
            <text x={pos.x} y={ny - 8}
                  textAnchor="middle"
                  fill="#6b7fa0" fontSize="7" fontWeight={600}
                  fontFamily="'Nunito Sans', sans-serif"
                  letterSpacing="0.08em">
              INTERNETT
            </text>
            {hit && (
              <rect x={nx - 6} y={ny - 6} width={nw + 12} height={nh + 12}
                    rx={11} fill={c} stroke="none"
                    filter="url(#nodeGlow)"
                    className="ot-node-glow" />
            )}
            <rect x={nx} y={ny} width={nw} height={nh} rx={7}
                  fill={hit ? `${c}12` : "#1c0a10"}
                  stroke={hit ? c : "#ff003c"}
                  strokeWidth={1.5} />
            <foreignObject x={pos.x - 9} y={ny + 6} width={18} height={18}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={info.ikon} size={16} fill={hit} ariaLabel=""
                      style={{ color: hit ? c : "#ff003c" }} />
              </div>
            </foreignObject>
            <text x={pos.x} y={ny + nh - 9}
                  textAnchor="middle"
                  fill={hit ? c : "#ff003c"}
                  fontSize="7.5" fontWeight={700}
                  fontFamily="'Nunito Sans', sans-serif">
              ANGRIPER
            </text>
            {hit && (
              <g>
                <rect x={pos.x - 30} y={ny + nh + 3} width={60} height={14}
                      rx={3} fill={`${c}18`} stroke={c} strokeWidth={0.5} />
                <text x={pos.x} y={ny + nh + 13}
                      textAnchor="middle"
                      fill={c}
                      fontSize="7" fontWeight={700}
                      fontFamily="'Nunito Sans', sans-serif"
                      letterSpacing="0.04em">
                  {statusTekst(st)}
                </text>
              </g>
            )}
          </g>
        );
      })()}

      {/* Etasjelabels — med bakgrunnspille */}
      {[
        { y: 140, label: "3. ETG", sub: "Kontorer" },
        { y: 259, label: "2. ETG", sub: "Serverrom" },
        { y: 378, label: "1. ETG", sub: "Inngang" },
        { y: 497, label: "KJELLER", sub: "Teknisk" },
      ].map(f => (
        <g key={f.label}>
          <rect x={10} y={f.y - 14} width={78} height={26} rx={4}
                fill="rgba(8,14,28,0.85)" stroke="#1a2840" strokeWidth={0.5} />
          <text x={49} y={f.y - 1} textAnchor="middle"
                fill="#6b7fa0" fontSize="10" fontWeight={700}
                fontFamily="'Nunito Sans', sans-serif">{f.label}</text>
          <text x={49} y={f.y + 10} textAnchor="middle"
                fill="#3a4a5c" fontSize="7"
                fontFamily="'Nunito Sans', sans-serif">{f.sub}</text>
        </g>
      ))}
    </svg>
  );
});

interface Props {
  onBack: () => void;
}

export default function OTSimulator({ onBack }: Props) {
  const {
    valgt, running, done, statuses, log, aktivIdx, logRef,
    scenario, antallBrutt, lovkravListe,
    velgScenario, simuler, nullstill,
  } = useScenarioEngine(SCENARIOS);

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
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px", paddingBottom: "11px" }}>
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
            <div style={{ padding: "6px" }}>
              <BuildingCrossSection statuses={statuses} showAngriper={!!scenario?.steg.some(s => s.sys === "angriper")} />
            </div>
          </div>

          {/* HENDELSESLOGG */}
          <div style={{ border: "1px solid #1c2a40", borderRadius: "6px", background: "rgba(8,16,32,0.95)" }}>
            <div style={{ padding: "8px 14px", borderBottom: "1px solid #1c2a40", fontSize: "10px", color: "#8896aa", letterSpacing: "0.08em", fontWeight: 600 }}>
              HENDELSESLOGG — HENDELSESKJEDE
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

          {/* KONTEKST */}
          {valgt && (
            <div style={{ border: "1px solid #1c2a40", borderRadius: "6px", background: "rgba(8,16,32,0.95)", padding: "10px", animation: "fadein 0.3s ease" }}>
              <div style={{ fontSize: "9px", color: "#8896aa", letterSpacing: "0.08em", marginBottom: "6px", fontWeight: 600 }}>KONTEKST</div>
              <div style={{ fontSize: "10px", color: "#9ca3af", lineHeight: 1.6 }}>{scenario?.beskrivelse}</div>
              <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #1c2a40", fontSize: "9px", color: "#5a6a80" }}>
                Basert på hendelsesmønstre relatert til OT i typiske norske kontorbygg
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
