import { useState } from "react";
import Icon from "./Icon";
import ThemeToggle from "./ThemeToggle";
import RikTekst from "./RikTekst";
import { type ThemeState } from "./theme";
import {
  type SimulatorData, type Scenario, type Lang,
  useScenarioEngine, fg, statusLabel,
} from "./scenarioEngine";

/* ── Språkavhengige faste etiketter ── */

interface Tekster {
  tilbake: string;
  pagar: string;
  fullfort: (n: number) => string;
  steg: (n: number, total: number) => string;
  systemstatus: string;
  visningRamme: string;
  visningTom: string;
  loggTittel: string;
  loggTom: string;
  scenarioEtikett: string;
  velgScenario: string;
  kontekst: string;
  simuler: string;
  simulerer: string;
  kjorIgjen: string;
  nullstill: string;
  statuskoder: string;
  legend: [string, string][];
  oppsummering: string;
  systemerRammet: string;
  lovkravBerort: string;
  tidUoppdaget: string;
  oppdagetHer: string;
  respons: string;
  forebygging: string;
}

const LEGEND_NO: [string, string][] = [
  ["Normal", "var(--st-normal)"],
  ["Advarsel", "var(--st-advarsel)"],
  ["Svekket", "var(--st-svekket)"],
  ["Eksponert", "var(--st-eksponert)"],
  ["Feil / manipulert", "var(--st-feil)"],
  ["Nede / kritisk", "var(--st-nede)"],
  ["Kompromittert", "var(--st-kompromittert)"],
  ["Ødelagt", "var(--st-odelagt)"],
];

const LEGEND_EN: [string, string][] = [
  ["Normal", "var(--st-normal)"],
  ["Warning", "var(--st-advarsel)"],
  ["Degraded", "var(--st-svekket)"],
  ["Exposed", "var(--st-eksponert)"],
  ["Error / tampered", "var(--st-feil)"],
  ["Down / critical", "var(--st-nede)"],
  ["Compromised", "var(--st-kompromittert)"],
  ["Destroyed", "var(--st-odelagt)"],
];

const NO: Tekster = {
  tilbake: "Tilbake",
  pagar: "Pågår",
  fullfort: n => `Fullført · ${n} systemer rammet`,
  steg: (n, total) => `Steg ${n} av ${total}`,
  systemstatus: "Systemstatus",
  visningRamme: "Du ser enhetene i bygget. Det du ikke ser, er den utdaterte programvaren og de åpne portene som gjør dem enkle å nå.",
  visningTom: "Velg et scenario for å se anleggsvisningen",
  loggTittel: "Hendelseslogg",
  loggTom: "Velg et scenario og trykk Simuler",
  scenarioEtikett: "Scenario",
  velgScenario: "Velg scenario",
  kontekst: "Kontekst",
  simuler: "Simuler",
  simulerer: "Simulerer…",
  kjorIgjen: "Kjør igjen",
  nullstill: "Nullstill",
  statuskoder: "Statusforklaring",
  legend: LEGEND_NO,
  oppsummering: "Konsekvenser",
  systemerRammet: "Systemer rammet",
  lovkravBerort: "Lovkrav berørt",
  tidUoppdaget: "Tid uoppdaget",
  oppdagetHer: "Oppdaget",
  respons: "Respons",
  forebygging: "Forebygging",
};

const EN: Tekster = {
  tilbake: "Back",
  pagar: "Running",
  fullfort: n => `Complete · ${n} systems affected`,
  steg: (n, total) => `Step ${n} of ${total}`,
  systemstatus: "System status",
  visningRamme: "You see the devices in the building. What you do not see is the outdated software and open ports that make them easy to reach.",
  visningTom: "Select a scenario to see the system view",
  loggTittel: "Event log",
  loggTom: "Select a scenario and click Simulate",
  scenarioEtikett: "Scenario",
  velgScenario: "Select scenario",
  kontekst: "Context",
  simuler: "Simulate",
  simulerer: "Simulating…",
  kjorIgjen: "Run again",
  nullstill: "Reset",
  statuskoder: "Status key",
  legend: LEGEND_EN,
  oppsummering: "Impact",
  systemerRammet: "Systems affected",
  lovkravBerort: "Regulations affected",
  tidUoppdaget: "Time undetected",
  oppdagetHer: "Detected",
  respons: "Response",
  forebygging: "Prevention",
};

/* ── Konfigurasjon per simulator ── */

export interface SimulatorConfig {
  lang: Lang;
  tittel: string;
  undertittel: string;
  visningTittel: string;
  kontekstFot: (sc?: Scenario) => string;
  forebyggingSuffiks?: (sc?: Scenario) => string;
  lenker?: {
    tittel: string;
    etikett: (sc: Scenario) => string;
    href: (sc: Scenario) => string | undefined;
  };
  // Tittel og lenker for angrepsvektor-panelet. Punktene er per scenario
  // (scenario.angrepsvektor), siden protokoll, port og verktøy varierer.
  angrepsvektor?: {
    tittel: string;
    lenker: { tekst: string; href: string }[];
  };
}

interface Props {
  onBack: () => void;
  data: SimulatorData;
  config: SimulatorConfig;
  theme: ThemeState;
}

function tint(c: string, pct: number) {
  return `color-mix(in srgb, ${c} ${pct}%, var(--surface))`;
}

export default function Simulator({ onBack, data, config, theme }: Props) {
  const SYS_INFO = data.systemer;
  const SCENARIOS = data.scenarier;
  const DOMENER = data.gruppeLabels;
  const t = config.lang === "en" ? EN : NO;
  const sl = (s?: string) => statusLabel(s, config.lang);

  const {
    valgt, running, done, statuses, log, aktivIdx, logRef,
    scenario, antallBrutt, lovkravListe,
    velgScenario, simuler, nullstill,
  } = useScenarioEngine(SCENARIOS);
  const [scOpen, setScOpen] = useState(false);

  const totalSteg = scenario?.steg.length ?? 0;
  const naSteg = Math.min(aktivIdx + 1, totalSteg);
  const andel = totalSteg ? (naSteg / totalSteg) * 100 : 0;
  const lenkeHref = scenario && config.lenker ? config.lenker.href(scenario) : undefined;

  // Bare systemene scenarioet berører. Grupper (etasjer/lag) i fast fysisk
  // rekkefølge ovenfra og ned, kjeller nederst. Innenfor hver gruppe lyser
  // nodene i den rekkefølgen de først rammes i hendelsesforløpet.
  const rekkefolge = (() => {
    const sys: Record<number, string[]> = {};
    const gruppeSett = new Set<number>();
    if (scenario) {
      const forste: Record<string, number> = {};
      scenario.steg.forEach((s, i) => { if (!(s.sys in forste)) forste[s.sys] = i; });
      const synlige = Object.keys(forste).filter(id => SYS_INFO[id] && SYS_INFO[id].gruppe >= 0);
      for (const id of synlige) {
        const g = SYS_INFO[id].gruppe;
        gruppeSett.add(g);
        if (!sys[g]) sys[g] = [];
        sys[g].push(id);
      }
      for (const g of gruppeSett) sys[g].sort((a, b) => forste[a] - forste[b]);
    }
    const grupper = [...gruppeSett].sort((a, b) => a - b);
    return { grupper, sys };
  })();

  // Scenariene gruppert etter fagområde (kategori), i rekkefølgen de først
  // opptrer. Gir mellomoverskrifter i nedtrekksmenyen.
  const scenarioGrupper = (() => {
    const rekke: string[] = [];
    const medlem: Record<string, Scenario[]> = {};
    for (const sc of SCENARIOS) {
      const k = sc.kategori || "";
      if (!(k in medlem)) { medlem[k] = []; rekke.push(k); }
      medlem[k].push(sc);
    }
    return { rekke, medlem };
  })();

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", padding: "var(--space-4)", boxSizing: "border-box" }}>
      <div style={{ maxWidth: "1120px", margin: "0 auto" }}>

        {/* TOPPLINJE */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-4)", flexWrap: "wrap" }}>
          <button className="btn-ghost" onClick={onBack} style={{
            border: "1px solid var(--line)", background: "transparent", color: "var(--ink-2)",
            padding: "6px 14px", borderRadius: "var(--radius-sm)", fontSize: "var(--text-sm)", fontFamily: "inherit",
            display: "flex", alignItems: "center", gap: "6px",
          }}>
            <Icon name="arrow_back" size={16} ariaLabel="" /> {t.tilbake}
          </button>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", fontWeight: 600, color: "var(--ink)", lineHeight: 1.1 }}>{config.tittel}</span>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)" }}>{config.undertittel}</span>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            {running && (
              <span style={{ color: "var(--accent)", fontSize: "var(--text-sm)", display: "flex", alignItems: "center", gap: "6px" }}>
                <Icon name="sync" size={14} ariaLabel="" style={{ animation: "spin 1s linear infinite" }} /> {t.pagar}
              </span>
            )}
            {done && (
              <span style={{ color: "var(--danger-ink)", fontSize: "var(--text-sm)", display: "flex", alignItems: "center", gap: "6px" }}>
                <Icon name="check_circle" size={14} ariaLabel="" /> {t.fullfort(antallBrutt)}
              </span>
            )}
            <ThemeToggle tema={theme.tema} bytt={theme.bytt} />
          </div>
        </div>

        <div className="simgrid" style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "var(--space-4)", alignItems: "start" }}>
          {/* VENSTRE KOLONNE */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            {/* SYSTEMVISNING */}
            <div className="panel">
              <div className="panel-head">{config.visningTittel || t.systemstatus}</div>
              <div style={{ padding: "var(--space-3) var(--space-4) 0", fontSize: "var(--text-xs)", color: "var(--ink-3)", lineHeight: 1.55 }}>
                {t.visningRamme}
              </div>
              <div style={{ padding: "var(--space-2) var(--space-4) var(--space-4)", display: "flex", flexDirection: "column" }}>
                {!scenario ? (
                  <div style={{ padding: "var(--space-5)", textAlign: "center", color: "var(--ink-3)", fontSize: "var(--text-sm)" }}>{t.visningTom}</div>
                ) : rekkefolge.grupper.map((g, gi) => (
                  <div key={g} style={{
                    paddingTop: "var(--space-3)", marginTop: gi === 0 ? 0 : "var(--space-3)",
                    borderTop: gi === 0 ? "none" : "1px solid var(--line)",
                  }}>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)", marginBottom: "var(--space-2)" }}>{DOMENER[g]}</div>
                    <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
                      {rekkefolge.sys[g].map(id => {
                        const info = SYS_INFO[id];
                        const st = statuses[id];
                        const c = fg(st);
                        const hit = !!st && st !== "normal";
                        return (
                          <div key={id + (st || "")} className={`sysnode${hit ? " hit" : ""}`} style={{
                            border: hit ? `1px solid ${c}` : "1px solid transparent",
                            borderRadius: "var(--radius-sm)",
                            padding: "var(--space-2) var(--space-3)",
                            background: hit ? tint(c, 10) : "transparent",
                            width: "120px",
                            boxSizing: "border-box",
                            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", gap: "3px", textAlign: "center",
                            color: hit ? c : "var(--ink-3)",
                          }}>
                            <Icon name={info.ikon} size={24} fill={hit} ariaLabel="" />
                            <div style={{ fontSize: "var(--text-xs)", fontWeight: 600, lineHeight: 1.25, color: hit ? c : "var(--ink-2)" }}>{info.navn}</div>
                            <div style={{ fontSize: "var(--text-2xs)", color: hit ? c : "var(--ink-3)" }}>{sl(st)}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* HENDELSESLOGG */}
            <div className="panel">
              <div className="panel-head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>{t.loggTittel}</span>
                {(running || done) && totalSteg > 0 && (
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)", fontWeight: 500 }}>{t.steg(naSteg, totalSteg)}</span>
                )}
              </div>
              {(running || done) && totalSteg > 0 && (
                <div style={{ padding: "0 var(--space-4)", marginTop: "var(--space-3)" }}>
                  <div className="progress-track"><div className="progress-fill" style={{ width: `${andel}%` }} /></div>
                </div>
              )}
              <div ref={logRef} style={{ maxHeight: "300px", overflowY: "auto", padding: "var(--space-2)" }}>
                {log.length === 0
                  ? <div style={{ color: "var(--ink-3)", fontSize: "var(--text-sm)", padding: "var(--space-5)", textAlign: "center" }}>{t.loggTom}</div>
                  : log.map((e, i) => {
                    const c = fg(e.status);
                    const aktiv = i === aktivIdx;
                    const det = scenario?.deteksjon;
                    const skille = det && e.idx === det.vedSteg;
                    return (
                      <div key={i}>
                      {skille && (
                        <div style={{
                          display: "flex", alignItems: "flex-start", gap: "8px",
                          padding: "var(--space-2) var(--space-3)", margin: "var(--space-2) 0",
                          borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)",
                          color: det!.overvaket ? "var(--accent)" : "var(--ink-2)",
                        }}>
                          <Icon name="visibility" size={14} ariaLabel="" style={{ flexShrink: 0, marginTop: "2px" }} />
                          <div style={{ fontSize: "var(--text-2xs)", lineHeight: 1.5 }}>
                            <span style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{t.oppdagetHer}</span>
                            <span style={{ color: "var(--ink-2)" }}> · {det!.kilde}</span>
                          </div>
                        </div>
                      )}
                      <div className="logrow" style={{
                        display: "flex", gap: "var(--space-2)", padding: "var(--space-2) var(--space-3)", marginBottom: "1px",
                        background: aktiv ? "var(--surface-2)" : "transparent",
                        borderRadius: "var(--radius-sm)",
                      }}>
                        <span style={{ width: "8px", height: "8px", borderRadius: "999px", background: c, flexShrink: 0, marginTop: "6px" }} />
                        <div style={{ color: "var(--ink-3)", fontSize: "var(--text-2xs)", minWidth: "54px", paddingTop: "1px", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{e.ts}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "2px", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "var(--text-sm)", color: "var(--ink)", fontWeight: 700 }}>{SYS_INFO[e.sys]?.navn || e.sys}</span>
                            <span style={{ fontSize: "var(--text-2xs)", color: c, fontWeight: 600 }}>{sl(e.status)}</span>
                            {e.lovkrav && (
                              <span style={{ fontSize: "var(--text-2xs)", color: "var(--st-advarsel)", border: "1px solid var(--st-advarsel)", padding: "0 6px", borderRadius: "999px", marginLeft: "auto", display: "flex", alignItems: "center", gap: "3px" }}>
                                <Icon name="gavel" size={11} ariaLabel="" /> {e.lovkrav}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-2)", lineHeight: 1.5 }}><RikTekst tekst={e.melding} /></div>
                        </div>
                      </div>
                      </div>
                    );
                  })
                }
              </div>
            </div>
          </div>

          {/* HØYRE KOLONNE */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <div className="panel" style={{ position: "relative" }}>
              <div onClick={() => setScOpen(!scOpen)} style={{
                padding: "var(--space-3) var(--space-4)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "space-between", userSelect: "none",
              }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span className="eyebrow">{t.scenarioEtikett}</span>
                  <span style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--ink)" }}>{scenario ? scenario.navn : t.velgScenario}</span>
                </div>
                <Icon name={scOpen ? "expand_less" : "expand_more"} size={20} ariaLabel="" style={{ color: "var(--ink-3)" }} />
              </div>
              {scOpen && (
                <div style={{ borderTop: "1px solid var(--line)", padding: "var(--space-2)", display: "flex", flexDirection: "column", gap: "var(--space-2)", maxHeight: "420px", overflowY: "auto" }}>
                  {scenarioGrupper.rekke.map((kat, ki) => (
                    <div key={kat || ki} style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                      {kat && (
                        <div className="eyebrow" style={{ padding: `${ki === 0 ? "0" : "var(--space-2)"} var(--space-1) 2px` }}>{kat}</div>
                      )}
                      {scenarioGrupper.medlem[kat].map(sc => (
                        <div key={sc.id} className={`sccard${valgt === sc.id ? " sel" : ""}`} onClick={() => { velgScenario(sc.id); setScOpen(false); }}
                          style={{ padding: "var(--space-3)", borderRadius: "var(--radius-sm)", border: "1px solid var(--line)", background: "var(--surface-2)" }}>
                          <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "flex-start" }}>
                            <Icon name={sc.ikon} size={20} fill={valgt === sc.id} ariaLabel="" style={{ color: valgt === sc.id ? "var(--accent)" : "var(--ink-2)", flexShrink: 0 }} />
                            <div>
                              <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: valgt === sc.id ? "var(--accent)" : "var(--ink)", marginBottom: "2px", lineHeight: 1.35 }}>{sc.navn}</div>
                              <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-2)", lineHeight: 1.45 }}><RikTekst tekst={sc.kort} /></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* KONTEKST */}
            {valgt && (
              <div className="panel" style={{ padding: "var(--space-4)", animation: "reveal 0.3s ease both" }}>
                <div className="eyebrow" style={{ marginBottom: "var(--space-2)" }}>{t.kontekst}</div>
                {(scenario?.virksomhet || scenario?.funksjon || scenario?.trussel) && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "var(--space-3)" }}>
                    {scenario?.virksomhet && (
                      <span style={{ fontSize: "var(--text-2xs)", color: "var(--ink-2)", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", padding: "2px 8px", display: "flex", alignItems: "center", gap: "4px" }}>
                        <Icon name="domain" size={12} ariaLabel="" style={{ color: "var(--ink-3)" }} /> {scenario.virksomhet}
                      </span>
                    )}
                    {scenario?.funksjon && (
                      <span style={{ fontSize: "var(--text-2xs)", color: "var(--ink-2)", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", padding: "2px 8px", display: "flex", alignItems: "center", gap: "4px" }}>
                        <Icon name="category" size={12} ariaLabel="" style={{ color: "var(--ink-3)" }} /> {scenario.funksjon}
                      </span>
                    )}
                    {scenario?.trussel && (() => {
                      const tilsiktet = scenario.trussel.art.toLowerCase().startsWith("tilsiktet");
                      const col = tilsiktet ? "var(--danger-ink)" : "var(--st-advarsel)";
                      return (
                        <span style={{ fontSize: "var(--text-2xs)", color: col, border: `1px solid ${col}`, borderRadius: "var(--radius-sm)", padding: "2px 8px", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Icon name={tilsiktet ? "gpp_maybe" : "report_problem"} size={12} ariaLabel="" /> {scenario.trussel.art}: {scenario.trussel.kilde}
                        </span>
                      );
                    })()}
                  </div>
                )}
                <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-2)", lineHeight: 1.6 }}>{scenario && <RikTekst tekst={scenario.beskrivelse} />}</div>
                <div style={{ marginTop: "var(--space-3)", paddingTop: "var(--space-3)", borderTop: "1px solid var(--line)", fontSize: "var(--text-xs)", color: "var(--ink-3)" }}>
                  {config.kontekstFot(scenario)}
                </div>
              </div>
            )}

            {/* ANGREPSVEKTOR for eksponerte scenarier (per scenario) */}
            {valgt && scenario?.eksponert && scenario.angrepsvektor?.length && config.angrepsvektor && (
              <div className="panel" style={{ padding: "var(--space-4)", animation: "reveal 0.3s ease both" }}>
                <div className="eyebrow" style={{ marginBottom: "var(--space-3)", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Icon name="travel_explore" size={13} ariaLabel="" style={{ color: "var(--ink-2)" }} /> {config.angrepsvektor.tittel}
                </div>
                {scenario.angrepsvektor.map((p, i) => (
                  <div key={i} style={{ fontSize: "var(--text-sm)", color: "var(--ink-2)", padding: "3px 0", display: "flex", alignItems: "flex-start", gap: "8px", lineHeight: 1.5 }}>
                    <Icon name="chevron_right" size={14} ariaLabel="" style={{ color: "var(--ink-3)", flexShrink: 0, marginTop: "2px" }} /> {p}
                  </div>
                ))}
                <div style={{ marginTop: "var(--space-3)", paddingTop: "var(--space-2)", borderTop: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: "4px" }}>
                  {config.angrepsvektor.lenker.map((l, i) => (
                    <a key={i} href={l.href} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: "var(--text-sm)", color: "var(--accent)", textDecoration: "none", display: "flex", alignItems: "center", gap: "5px" }}>
                      <Icon name="open_in_new" size={13} ariaLabel="" /> {l.tekst}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* SIMULERINGSKNAPP */}
            <button className="btn-primary" onClick={simuler} disabled={!valgt || running} style={{
              padding: "var(--space-3)", fontSize: "var(--text-base)", fontFamily: "inherit", fontWeight: 600,
              borderRadius: "var(--radius-sm)", border: "none",
              background: valgt && !running ? "var(--accent)" : "var(--line)",
              color: valgt && !running ? "var(--on-accent)" : "var(--ink-3)",
              cursor: valgt && !running ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            }}>
              {running ? (
                <><Icon name="sync" size={16} ariaLabel="" style={{ animation: "spin 1s linear infinite" }} /> {t.simulerer}</>
              ) : done ? (
                <><Icon name="replay" size={16} ariaLabel="" /> {t.kjorIgjen}</>
              ) : (
                <><Icon name="play_arrow" size={16} fill={true} ariaLabel="" /> {t.simuler}</>
              )}
            </button>

            {(done || running) && (
              <button className="btn-ghost" onClick={nullstill} style={{
                padding: "var(--space-2)", fontSize: "var(--text-sm)", fontFamily: "inherit",
                borderRadius: "var(--radius-sm)", border: "1px solid var(--line)", background: "transparent",
                color: "var(--ink-2)", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
              }}>
                <Icon name="close" size={14} ariaLabel="" /> {t.nullstill}
              </button>
            )}

            {/* STATUSFORKLARING */}
            <div className="panel" style={{ padding: "var(--space-4)" }}>
              <div className="eyebrow" style={{ marginBottom: "var(--space-3)" }}>{t.statuskoder}</div>
              {t.legend.map(([l, c]) => (
                <div key={l} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <span style={{ width: "9px", height: "9px", borderRadius: "999px", background: c, flexShrink: 0 }} />
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--ink-2)" }}>{l}</span>
                </div>
              ))}
            </div>

            {/* KONSEKVENSER */}
            {done && (
              <div className="panel" style={{ borderColor: "var(--danger-line)", background: "var(--danger-surface)", padding: "var(--space-4)", animation: "reveal 0.4s ease both" }}>
                <div className="eyebrow" style={{ color: "var(--danger-ink)", marginBottom: "var(--space-3)" }}>{t.oppsummering}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)", marginBottom: "var(--space-3)" }}>
                  <div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)", marginBottom: "2px" }}>{t.systemerRammet}</div>
                    <div style={{ fontFamily: "var(--font-display)", color: "var(--danger-ink)", fontSize: "var(--text-2xl)", fontWeight: 600, lineHeight: 1 }}>{antallBrutt}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)", marginBottom: "2px" }}>{t.lovkravBerort}</div>
                    <div style={{ fontFamily: "var(--font-display)", color: "var(--st-advarsel)", fontSize: "var(--text-2xl)", fontWeight: 600, lineHeight: 1 }}>{lovkravListe.length}</div>
                  </div>
                </div>
                {scenario?.deteksjon && (
                  <div style={{ marginBottom: "var(--space-3)", paddingTop: "var(--space-2)", borderTop: "1px solid var(--danger-line)", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Icon name="visibility" size={14} ariaLabel="" style={{ color: scenario.deteksjon.overvaket ? "var(--accent)" : "var(--danger-ink)", flexShrink: 0 }} />
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)" }}>{t.tidUoppdaget}:</span>
                    <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: scenario.deteksjon.overvaket ? "var(--accent)" : "var(--danger-ink)" }}>{scenario.deteksjon.forsinkelse}</span>
                  </div>
                )}
                {lovkravListe.map((l, i) => (
                  <div key={i} style={{ fontSize: "var(--text-xs)", color: "var(--ink-2)", padding: "2px 0", display: "flex", alignItems: "flex-start", gap: "6px" }}>
                    <Icon name="gavel" size={12} ariaLabel="" style={{ color: "var(--st-advarsel)", flexShrink: 0, marginTop: "2px" }} /> <RikTekst tekst={l} />
                  </div>
                ))}
              </div>
            )}

            {/* RESPONS */}
            {done && scenario?.tiltak?.respons && (
              <div className="panel" style={{ padding: "var(--space-4)", animation: "reveal 0.4s ease both" }}>
                <div className="eyebrow" style={{ marginBottom: "var(--space-3)", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Icon name="emergency" size={13} ariaLabel="" style={{ color: "var(--danger-ink)" }} /> {t.respons}
                </div>
                {scenario.tiltak.respons.map((tx, i) => (
                  <div key={i} style={{ fontSize: "var(--text-sm)", color: "var(--ink-2)", padding: "3px 0", display: "flex", alignItems: "flex-start", gap: "8px", lineHeight: 1.5 }}>
                    <Icon name="arrow_forward" size={13} ariaLabel="" style={{ color: "var(--danger-ink)", flexShrink: 0, marginTop: "3px" }} /> <RikTekst tekst={tx} />
                  </div>
                ))}
              </div>
            )}

            {/* FOREBYGGING */}
            {done && scenario?.tiltak?.forebygging && (
              <div className="panel" style={{ background: "var(--accent-surface)", padding: "var(--space-4)", animation: "reveal 0.4s ease both" }}>
                <div className="eyebrow" style={{ color: "var(--accent)", marginBottom: "var(--space-3)", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Icon name="verified_user" size={13} ariaLabel="" style={{ color: "var(--accent)" }} /> {t.forebygging}{config.forebyggingSuffiks ? config.forebyggingSuffiks(scenario) : ""}
                </div>
                {scenario.tiltak.forebygging.map((tx, i) => (
                  <div key={i} style={{ fontSize: "var(--text-sm)", color: "var(--ink-2)", padding: "3px 0", display: "flex", alignItems: "flex-start", gap: "8px", lineHeight: 1.5 }}>
                    <Icon name="arrow_forward" size={13} ariaLabel="" style={{ color: "var(--accent)", flexShrink: 0, marginTop: "3px" }} /> <RikTekst tekst={tx} />
                  </div>
                ))}
                {config.lenker && scenario && lenkeHref && (
                  <div style={{ marginTop: "var(--space-3)", paddingTop: "var(--space-2)", borderTop: "1px solid var(--line)" }}>
                    <div className="eyebrow" style={{ marginBottom: "6px" }}>{config.lenker.tittel}</div>
                    <a href={lenkeHref} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: "var(--text-sm)", color: "var(--accent)", textDecoration: "none", display: "flex", alignItems: "center", gap: "5px" }}>
                      <Icon name="open_in_new" size={13} ariaLabel="" /> {config.lenker.etikett(scenario)}
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
