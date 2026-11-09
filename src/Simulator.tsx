import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import ThemeToggle from "./ThemeToggle";
import RikTekst from "./RikTekst";
import { avhengerAvVirksomhet } from "./lovdata";
import { type ThemeState } from "./theme";
import {
  type SimulatorData, type Scenario, type Lang,
  useScenarioEngine, fg, statusLabel, statusForklaring,
} from "./scenarioEngine";

/* ── Språkavhengige faste etiketter ── */

interface Tekster {
  tilbake: string;
  pagar: string;
  fullfort: (n: number) => string;
  steg: (n: number, total: number) => string;
  systemstatus: string;
  visningTom: string;
  loggTittel: string;
  loggTom: string;
  velgScenario: string;
  kontekst: string;
  simuler: string;
  simulerer: string;
  kjorIgjen: string;
  nullstill: string;
  statuskoder: string;
  oppsummering: string;
  systemerRammet: string;
  lovkravBerort: string;
  lovkravAvhenger: string;
  tidUoppdaget: string;
  oppdagetHer: string;
  respons: string;
  forebygging: string;
}

const NO: Tekster = {
  tilbake: "Tilbake",
  pagar: "Pågår",
  fullfort: n => `Fullført · ${n} systemer rammet`,
  steg: (n, total) => `Steg ${n} av ${total}`,
  systemstatus: "Systemstatus",
  visningTom: "Velg et scenario for å se visualiseringen",
  loggTittel: "Hendelseslogg",
  loggTom: "Velg et scenario og trykk Simuler",
  velgScenario: "Velg scenario",
  kontekst: "Kontekst",
  simuler: "Simuler",
  simulerer: "Simulerer…",
  kjorIgjen: "Kjør igjen",
  nullstill: "Nullstill",
  statuskoder: "Statusforklaring",
  oppsummering: "Konsekvenser",
  systemerRammet: "Systemer rammet",
  lovkravBerort: "Lovkrav berørt",
  lovkravAvhenger: "* Om kravet gjelder, avhenger av type virksomhet og hva hendelsen påvirker",
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
  visningTom: "Select a scenario to see the system view",
  loggTittel: "Event log",
  loggTom: "Select a scenario and click Simulate",
  velgScenario: "Select scenario",
  kontekst: "Context",
  simuler: "Simulate",
  simulerer: "Simulating…",
  kjorIgjen: "Run again",
  nullstill: "Reset",
  statuskoder: "Status key",
  oppsummering: "Impact",
  systemerRammet: "Systems affected",
  lovkravBerort: "Regulations affected",
  lovkravAvhenger: "* Whether the requirement applies depends on the type of organisation and what the incident affects",
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
    // Felles rammetekst, vist én gang under punktene (den universelle delen som
    // ellers ble gjentatt i hvert scenario).
    ramme?: string;
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
  const velgerRef = useRef<HTMLDivElement>(null);

  // Lukk scenariolisten ved klikk utenfor eller Escape
  useEffect(() => {
    if (!scOpen) return;
    const klikk = (e: MouseEvent) => { if (!velgerRef.current?.contains(e.target as Node)) setScOpen(false); };
    const tast = (e: KeyboardEvent) => { if (e.key === "Escape") setScOpen(false); };
    document.addEventListener("mousedown", klikk);
    document.addEventListener("keydown", tast);
    return () => { document.removeEventListener("mousedown", klikk); document.removeEventListener("keydown", tast); };
  }, [scOpen]);

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

  const harVektor = !!(scenario?.eksponert && scenario.angrepsvektor?.length && config.angrepsvektor);
  const kanSimulere = !!valgt && !running;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", padding: "var(--space-4)", boxSizing: "border-box" }}>
      <div style={{ maxWidth: "1120px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>

        {/* TOPPLINJE */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
          <button className="btn-ghost" onClick={onBack} style={{
            border: "1px solid var(--line)", background: "transparent", color: "var(--ink-2)",
            padding: "6px 14px", borderRadius: "var(--radius-sm)", fontSize: "var(--text-sm)", fontFamily: "inherit",
            display: "flex", alignItems: "center", gap: "6px",
          }}>
            <Icon name="lucide/arrow-left" size={16} /> {t.tilbake}
          </button>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "var(--text-xl)", fontWeight: 600, color: "var(--ink)", lineHeight: 1.1 }}>{config.tittel}</span>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)" }}>{config.undertittel}</span>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <ThemeToggle tema={theme.tema} bytt={theme.bytt} />
          </div>
        </div>

        {/* KONTROLLRAD: scenariovalg og simulering */}
        <div ref={velgerRef} className="panel sim-kontroll" style={{ position: "relative" }}>
          <button type="button" className="sim-velger" onClick={() => setScOpen(!scOpen)}
            aria-expanded={scOpen} aria-controls="scenarioliste">
            <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left", minWidth: 0 }}>
              <span style={{ fontSize: "var(--text-base)", fontWeight: 600, color: "var(--ink)" }}>{scenario ? scenario.navn : t.velgScenario}</span>
            </span>
            <Icon name={scOpen ? "lucide/chevron-up" : "lucide/chevron-down"} size={20} style={{ color: "var(--ink-3)", flexShrink: 0 }} />
          </button>

          <div className="sim-handlinger">
            {running && (
              <span role="status" style={{ color: "var(--accent)", fontSize: "var(--text-sm)", display: "flex", alignItems: "center", gap: "6px" }}>
                <Icon name="lucide/loader-circle" size={14} style={{ animation: "spin 1s linear infinite" }} /> {t.pagar}
              </span>
            )}
            {done && (
              <span role="status" style={{ color: "var(--danger-ink)", fontSize: "var(--text-sm)", display: "flex", alignItems: "center", gap: "6px" }}>
                <Icon name="lucide/circle-check" size={14} /> {t.fullfort(antallBrutt)}
              </span>
            )}
            {(done || running) && (
              <button className="btn-ghost" onClick={nullstill} style={{
                padding: "var(--space-2) var(--space-3)", fontSize: "var(--text-sm)", fontFamily: "inherit",
                borderRadius: "var(--radius-sm)", border: "1px solid var(--line)", background: "transparent",
                color: "var(--ink-2)", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
              }}>
                <Icon name="lucide/x" size={14} /> {t.nullstill}
              </button>
            )}
            <button className="btn-primary" onClick={simuler} disabled={!kanSimulere} style={{
              padding: "var(--space-3) var(--space-5)", fontSize: "var(--text-base)", fontFamily: "inherit", fontWeight: 600,
              borderRadius: "var(--radius-sm)", border: "none",
              background: kanSimulere ? "var(--accent)" : "var(--line)",
              color: kanSimulere ? "var(--on-accent)" : "var(--ink-3)",
              cursor: kanSimulere ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            }}>
              {running ? (
                <><Icon name="lucide/loader-circle" size={16} style={{ animation: "spin 1s linear infinite" }} /> {t.simulerer}</>
              ) : done ? (
                <><Icon name="lucide/rotate-ccw" size={16} /> {t.kjorIgjen}</>
              ) : (
                <>
                  <Icon name="heroicons/solid/play-circle" size={16} /> {t.simuler}
                </>
              )}
            </button>
          </div>

          {scOpen && (
            <div id="scenarioliste" className="panel sim-liste">
              {scenarioGrupper.rekke.map((kat, ki) => (
                <div key={kat || ki} style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                  {kat && <div className="eyebrow" style={{ padding: "0 var(--space-1) 2px" }}>{kat}</div>}
                  <div className="sim-liste-kort">
                    {scenarioGrupper.medlem[kat].map(sc => (
                      <button type="button" key={sc.id} className={`sccard${valgt === sc.id ? " sel" : ""}`}
                        aria-current={valgt === sc.id ? "true" : undefined}
                        onClick={() => { velgScenario(sc.id); setScOpen(false); }}
                        style={{ padding: "var(--space-3)", borderRadius: "var(--radius-sm)", border: "1px solid var(--line)", background: "var(--surface-2)", font: "inherit", textAlign: "left" }}>
                        <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "flex-start" }}>
                          <Icon name={sc.ikon} size={20} style={{ color: valgt === sc.id ? "var(--accent)" : "var(--ink-2)", flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: valgt === sc.id ? "var(--accent)" : "var(--ink)", marginBottom: "2px", lineHeight: 1.35 }}>{sc.navn}</div>
                            <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-2)", lineHeight: 1.45 }}><RikTekst tekst={sc.kort} /></div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* KONTEKST OG ANGREPSVEKTOR */}
        {scenario && (
          <div className={`panel${harVektor ? " sim-kontekst" : ""}`} style={{ animation: "reveal 0.3s ease both" }}>
            <div style={{ padding: "var(--space-4)" }}>
              <div className="eyebrow" style={{ marginBottom: "var(--space-2)" }}>{t.kontekst}</div>
              {(scenario.virksomhet || scenario.funksjon || scenario.trussel) && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "var(--space-3)" }}>
                  {scenario.virksomhet && (
                    <span style={{ fontSize: "var(--text-2xs)", color: "var(--ink-2)", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", padding: "2px 8px", display: "flex", alignItems: "center", gap: "4px" }}>
                      {scenario.virksomhetIkon && <Icon name={scenario.virksomhetIkon} size={12} style={{ color: "var(--ink-3)" }} />} {scenario.virksomhet}
                    </span>
                  )}
                  {scenario.funksjon && (
                    <span style={{ fontSize: "var(--text-2xs)", color: "var(--ink-2)", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)", padding: "2px 8px", display: "flex", alignItems: "center", gap: "4px" }}>
                      {scenario.funksjonIkon && <Icon name={scenario.funksjonIkon} size={12} style={{ color: "var(--ink-3)" }} />} {scenario.funksjon}
                    </span>
                  )}
                  {scenario.trussel && (() => {
                    const tilsiktet = scenario.trussel.art.toLowerCase().startsWith("tilsiktet");
                    const col = tilsiktet ? "var(--danger-ink)" : "var(--st-advarsel)";
                    return (
                      <span style={{ fontSize: "var(--text-2xs)", color: col, border: `1px solid ${col}`, borderRadius: "var(--radius-sm)", padding: "2px 8px", display: "flex", alignItems: "center", gap: "4px" }}>
                        <Icon name={tilsiktet ? "tabler/spy" : "lucide/triangle-alert"} size={12} /> {scenario.trussel.art}: {scenario.trussel.kilde}
                      </span>
                    );
                  })()}
                </div>
              )}
              <div style={{ fontSize: "var(--text-sm)", color: "var(--ink-2)", lineHeight: 1.6 }}><RikTekst tekst={scenario.beskrivelse} /></div>
              <div style={{ marginTop: "var(--space-3)", fontSize: "var(--text-xs)", color: "var(--ink-3)" }}>
                {config.kontekstFot(scenario)}
              </div>
            </div>

            {harVektor && (
              <div className="sim-vektor" style={{ padding: "var(--space-4)" }}>
                <div className="eyebrow" style={{ marginBottom: "var(--space-2)", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Icon name="tabler/world-search" size={13} style={{ color: "var(--ink-2)" }} /> {config.angrepsvektor!.tittel}
                </div>
                {scenario.angrepsvektor!.map((p, i) => (
                  <div key={i} style={{ fontSize: "var(--text-sm)", color: "var(--ink-2)", padding: "3px 0", display: "flex", alignItems: "flex-start", gap: "8px", lineHeight: 1.5 }}>
                    <Icon name="lucide/chevron-right" size={14} style={{ color: "var(--ink-3)", flexShrink: 0, marginTop: "2px" }} /> <RikTekst tekst={p} />
                  </div>
                ))}
                {config.angrepsvektor!.ramme && (
                  <div style={{ fontSize: "var(--text-2xs)", color: "var(--ink-3)", marginTop: "var(--space-2)", lineHeight: 1.5 }}>{config.angrepsvektor!.ramme}</div>
                )}
                <div style={{ marginTop: "var(--space-3)", display: "flex", flexDirection: "column", gap: "4px" }}>
                  {config.angrepsvektor!.lenker.map((l, i) => (
                    <a key={i} href={l.href} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: "var(--text-sm)", color: "var(--accent)", textDecoration: "none", display: "flex", alignItems: "center", gap: "5px" }}>
                      <Icon name="lucide/external-link" size={13} /> {l.tekst}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* VISNING OG LOGG */}
        <div className="sim-to">
          <div className="panel" style={{ display: "flex", flexDirection: "column" }}>
            <div className="panel-head">{config.visningTittel || t.systemstatus}</div>
            <div style={{ padding: "var(--space-3) var(--space-4) var(--space-4)", display: "flex", flexDirection: "column", flex: 1 }}>
              {!scenario ? (
                <div style={{ margin: "auto 0", padding: "var(--space-5)", textAlign: "center", color: "var(--ink-3)", fontSize: "var(--text-sm)" }}>{t.visningTom}</div>
              ) : rekkefolge.grupper.map((g, gi) => (
                <div key={g} style={{
                  paddingTop: "var(--space-3)", marginTop: gi === 0 ? 0 : "var(--space-3)",
                  borderTop: gi === 0 ? "none" : "1px solid var(--line)",
                }}>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)", marginBottom: "var(--space-2)" }}>{DOMENER[g]}</div>
                  <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
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
                          width: "120px", hyphens: "auto", overflowWrap: "anywhere",
                          boxSizing: "border-box",
                          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", gap: "3px", textAlign: "center",
                          color: hit ? c : "var(--ink-3)",
                        }}>
                          <Icon name={info.ikon} size={24} />
                          <div style={{ fontSize: "var(--text-xs)", fontWeight: 600, lineHeight: 1.25, color: hit ? c : "var(--ink-2)" }}>{info.navn}</div>
                          <div style={{ fontSize: "var(--text-2xs)", color: hit ? c : "var(--ink-3)" }}>{sl(st)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            {/* STATUSFORKLARING: bare statusene scenarioet bruker */}
            {scenario && (
              <div style={{ borderTop: "1px solid var(--line)", padding: "var(--space-3) var(--space-4)" }}>
                <div className="eyebrow" style={{ marginBottom: "var(--space-2)" }}>{t.statuskoder}</div>
                <dl className="sim-forklaring">
                  {statusForklaring(scenario, config.lang).map(f => (
                    <div key={f.status} style={{ display: "flex", alignItems: "flex-start", gap: "6px", fontSize: "var(--text-xs)", lineHeight: 1.45 }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "999px", background: f.farge, flexShrink: 0, marginTop: "5px" }} />
                      <dt style={{ color: "var(--ink)", fontWeight: 600, whiteSpace: "nowrap" }}>{f.etikett}</dt>
                      <dd style={{ color: "var(--ink-3)" }}>{f.forklaring}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>

          <div className="panel" style={{ display: "flex", flexDirection: "column" }}>
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
            <div ref={logRef} style={{ flex: 1, display: "flex", flexDirection: "column", maxHeight: "520px", overflowY: "auto", padding: "var(--space-2)" }}>
              {log.length === 0
                ? <div style={{ margin: "auto 0", color: "var(--ink-3)", fontSize: "var(--text-sm)", padding: "var(--space-5)", textAlign: "center" }}>{t.loggTom}</div>
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
                        <Icon name="lucide/eye" size={14} style={{ flexShrink: 0, marginTop: "2px" }} />
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
                              <Icon name="lucide/gavel" size={11} /> <RikTekst tekst={e.lovkrav} />{avhengerAvVirksomhet(e.lovkrav) && " *"}
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

        {/* KONSEKVENSER */}
        {done && (
          <div className="panel" style={{ borderColor: "var(--danger-line)", background: "var(--danger-surface)", padding: "var(--space-4)", animation: "reveal 0.4s ease both" }}>
            <div className="eyebrow" style={{ color: "var(--danger-ink)", marginBottom: "var(--space-3)" }}>{t.oppsummering}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3) var(--space-6)", marginBottom: lovkravListe.length ? "var(--space-3)" : 0 }}>
              <div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)", marginBottom: "2px" }}>{t.systemerRammet}</div>
                <div style={{ color: "var(--danger-ink)", fontSize: "var(--text-2xl)", fontWeight: 600, lineHeight: 1 }}>{antallBrutt}</div>
              </div>
              <div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)", marginBottom: "2px" }}>{t.lovkravBerort}</div>
                <div style={{ color: "var(--st-advarsel)", fontSize: "var(--text-2xl)", fontWeight: 600, lineHeight: 1 }}>{lovkravListe.length}</div>
              </div>
              {scenario?.deteksjon && (() => {
                const col = scenario.deteksjon.overvaket ? "var(--accent)" : "var(--danger-ink)";
                return (
                  <div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)", marginBottom: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Icon name="lucide/eye" size={12} style={{ color: col }} /> {t.tidUoppdaget}
                    </div>
                    <div style={{ color: col, fontSize: "var(--text-2xl)", fontWeight: 600, lineHeight: 1 }}>{scenario.deteksjon.forsinkelse}</div>
                  </div>
                );
              })()}
            </div>
            {lovkravListe.length > 0 && (
              <div style={{ paddingTop: "var(--space-3)", borderTop: "1px solid var(--danger-line)" }}>
                {lovkravListe.map((l, i) => (
                  <div key={i} style={{ fontSize: "var(--text-xs)", color: "var(--ink-2)", padding: "2px 0", display: "flex", alignItems: "flex-start", gap: "6px" }}>
                    <Icon name="lucide/gavel" size={12} style={{ color: "var(--st-advarsel)", flexShrink: 0, marginTop: "2px" }} /> <span><RikTekst tekst={l} />{avhengerAvVirksomhet(l) && " *"}</span>
                  </div>
                ))}
                {lovkravListe.some(avhengerAvVirksomhet) && (
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)", marginTop: "var(--space-2)" }}>{t.lovkravAvhenger}</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* RESPONS OG FOREBYGGING */}
        {done && (scenario?.tiltak?.respons || scenario?.tiltak?.forebygging) && (
          <div className="sim-to">
            {scenario.tiltak.respons && (
              <div className="panel" style={{ padding: "var(--space-4)", animation: "reveal 0.4s ease both" }}>
                <div className="eyebrow" style={{ marginBottom: "var(--space-3)", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Icon name="lucide/siren" size={13} style={{ color: "var(--danger-ink)" }} /> {t.respons}
                </div>
                {scenario.tiltak.respons.map((tx, i) => (
                  <div key={i} style={{ fontSize: "var(--text-sm)", color: "var(--ink-2)", padding: "3px 0", display: "flex", alignItems: "flex-start", gap: "8px", lineHeight: 1.5 }}>
                    <Icon name="lucide/arrow-right" size={13} style={{ color: "var(--danger-ink)", flexShrink: 0, marginTop: "3px" }} /> <RikTekst tekst={tx} />
                  </div>
                ))}
              </div>
            )}
            {scenario.tiltak.forebygging && (
              <div className="panel" style={{ background: "var(--accent-surface)", padding: "var(--space-4)", animation: "reveal 0.4s ease both" }}>
                <div className="eyebrow" style={{ color: "var(--accent)", marginBottom: "var(--space-3)", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Icon name="lucide/shield-check" size={13} style={{ color: "var(--accent)" }} /> {t.forebygging}{config.forebyggingSuffiks ? config.forebyggingSuffiks(scenario) : ""}
                </div>
                {scenario.tiltak.forebygging.map((tx, i) => (
                  <div key={i} style={{ fontSize: "var(--text-sm)", color: "var(--ink-2)", padding: "3px 0", display: "flex", alignItems: "flex-start", gap: "8px", lineHeight: 1.5 }}>
                    <Icon name="lucide/arrow-right" size={13} style={{ color: "var(--accent)", flexShrink: 0, marginTop: "3px" }} /> <RikTekst tekst={tx} />
                  </div>
                ))}
                {config.lenker && lenkeHref && (
                  <div style={{ marginTop: "var(--space-3)", paddingTop: "var(--space-2)", borderTop: "1px solid var(--line)" }}>
                    <div className="eyebrow" style={{ marginBottom: "6px" }}>{config.lenker.tittel}</div>
                    <a href={lenkeHref} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: "var(--text-sm)", color: "var(--accent)", textDecoration: "none", display: "flex", alignItems: "center", gap: "5px" }}>
                      <Icon name="lucide/external-link" size={13} /> {config.lenker.etikett(scenario)}
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
