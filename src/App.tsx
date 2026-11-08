import { useState } from "react";
import OTSimulator from "./OTSimulator";
import RisikoSimulator from "./RisikoSimulator";
import OwaspSimulator from "./OwaspSimulator";
import Icon from "./Icon";
import ThemeToggle from "./ThemeToggle";
import { useTheme } from "./theme";

type Page = "start" | "ot" | "risiko" | "owasp";

interface Kort {
  id: Exclude<Page, "start">;
  tittel: string;
  tekst: string;
  antall: string;
  aktuell?: boolean;
  // Gated-kategorier er inaktive i produksjon (GitHub Pages), klikkbare i dev.
  gated?: boolean;
}

const KORT: Kort[] = [
  {
    id: "ot",
    tittel: "Operasjonell teknologi",
    tekst: "Feilkjeder i OT i bygg og anlegg: Bygningsautomatisering (BMS/HVAC), energiforsyning, elektroniske sikringsanlegg og butikkjøling. Tilsiktede og utilsiktede hendelser.",
    antall: "9 scenarier",
    aktuell: true,
  },
  {
    id: "risiko",
    tittel: "Risiko 2026",
    tekst: "Uønskede hendelser i anskaffelser og leverandørkjeder. Basert på NSMs risikovurdering for 2026.",
    antall: "5 scenarier",
    gated: true,
  },
  {
    id: "owasp",
    tittel: "OWASP Top Ten 2025",
    tekst: "Angrepskjeder mot webapplikasjoner: Feil i tilgangskontroll, «injection», feilkonfigurasjon og mer.",
    antall: "10 scenarier",
    gated: true,
  },
];

// I produksjon (GitHub Pages) er bare OT aktiv.
const erAktiv = (k: Kort) => !k.gated || !import.meta.env.PROD;

export default function App() {
  const [page, setPage] = useState<Page>("start");
  const theme = useTheme();

  if (page === "ot") return <OTSimulator onBack={() => setPage("start")} theme={theme} />;
  if (page === "risiko") return <RisikoSimulator onBack={() => setPage("start")} theme={theme} />;
  if (page === "owasp") return <OwaspSimulator onBack={() => setPage("start")} theme={theme} />;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "var(--space-5) var(--space-4)" }}>
      <div style={{ maxWidth: "880px", margin: "0 auto" }}>
        <header style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: "var(--space-2)" }}>Sikkerhet og beredskap</div>
            <h1 style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(30px, 5vw, 46px)",
              fontWeight: 600,
              color: "var(--ink)",
              lineHeight: 1.1,
              letterSpacing: "-0.01em",
            }}>
              Scenariosimulator
            </h1>
          </div>
          <ThemeToggle tema={theme.tema} bytt={theme.bytt} />
        </header>

        <p style={{ fontSize: "var(--text-md)", color: "var(--ink-2)", lineHeight: 1.6, marginBottom: "var(--space-4)" }}>
          Simuler realistiske sikkerhetshendelser og se hvordan en feilkjede
          utvikler seg steg for steg.
        </p>

        <details className="situasjon" style={{ marginBottom: "var(--space-6)", paddingTop: "var(--space-4)", borderTop: "1px solid var(--line)" }}>
          <summary className="eyebrow" style={{ color: "var(--accent)", display: "flex", alignItems: "center", gap: "6px" }}>
            <span className="situasjon-chevron" style={{ display: "inline-flex", transition: "transform 0.2s ease" }}>
              <Icon name="expand_more" size={16} ariaLabel="" />
            </span>
            Situasjonsbilde: Operasjonell teknologi
          </summary>
          <div style={{ marginTop: "var(--space-3)" }}>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-2)", lineHeight: 1.6, marginBottom: "var(--space-3)" }}>
            Bevisstheten om risiko i operasjonell teknologi (OT) er lav
            sammenlignet med IT. Det ligger i ordet. <em>Informasjonsteknologi</em> gir oss informasjonen og systemene vi bruker privat og på jobb. Operasjonell teknologi handler om det fysiske; en type teknologi vi sjelden ser eller vet eksisterer. Det som må fungere for å opprettholde energiforsyning og mange andre kritiske tjenester vi tar for gitt. OT er også det som gir automatikken i bowlinghallen og fabrikken. Hovedinngangen, rulletrappen og kameraovervåkingen på kjøpesenteret. Det du passerer i sikkerhetskontrollen på flyplassen. 
          </p>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-2)", lineHeight: 1.6, marginBottom: "var(--space-3)" }}>
            Angrep mot OT rammer sjelden deg personlig, men det kan fort endre seg. De koordinerte angrepene mot kjøle- og fryseanlegg i Europa i
            okt/nov 2026 har blitt en øyeåpner for mange. Hendelsene viser hvordan sårbarheter i teknologi kan påvirke oss på flere områder enn vi har kunnet forestille oss. I dette tilfellet: Matforsyningen der vi bor.
          </p>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-2)", lineHeight: 1.6 }}>
            Simulatoren er laget for å bruke i opplæring. Målet er å øke bevisstheten ved å
            vise sammenhengene.
          </p>
          </div>
        </details>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {KORT.map(k => {
            const aktiv = erAktiv(k);
            return (
              <button
                key={k.id}
                className={aktiv ? "navcard panel" : "panel"}
                onClick={aktiv ? () => setPage(k.id) : undefined}
                disabled={!aktiv}
                aria-disabled={!aktiv}
                style={{
                  display: "block", width: "100%", textAlign: "left", fontFamily: "inherit",
                  padding: "var(--space-4)",
                  opacity: aktiv ? 1 : 0.55,
                  cursor: aktiv ? "pointer" : "not-allowed",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: "var(--space-2)", rowGap: "var(--space-1)" }}>
                      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", fontWeight: 600, color: "var(--ink)" }}>
                        {k.tittel}
                      </h2>
                      {k.aktuell && aktiv && (
                        <span style={{
                          fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--accent)", whiteSpace: "nowrap",
                          padding: "1px 8px", borderRadius: "999px", background: "var(--accent-surface)",
                        }}>
                          Aktuelt nå
                        </span>
                      )}
                      {!aktiv && (
                        <span style={{
                          fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--ink-3)", whiteSpace: "nowrap",
                          padding: "1px 8px", borderRadius: "999px", border: "1px solid var(--line)",
                        }}>
                          Kommer senere
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)", marginTop: "2px", marginBottom: "var(--space-2)" }}>
                      {k.antall}
                    </div>
                    <p style={{ fontSize: "var(--text-sm)", color: "var(--ink-2)", lineHeight: 1.55 }}>
                      {k.tekst}
                    </p>
                  </div>
                  {aktiv && <Icon name="chevron_right" size={20} ariaLabel="" style={{ color: "var(--ink-3)", flexShrink: 0 }} />}
                </div>
              </button>
            );
          })}
        </div>

        <footer style={{ marginTop: "var(--space-6)", paddingTop: "var(--space-4)", borderTop: "1px solid var(--line)", fontSize: "var(--text-xs)", color: "var(--ink-3)", lineHeight: 1.6 }}>
          Kilder: Faktiske hendelser omtalt i åpne kilder · NSM Risiko 2026 · OWASP Top Ten 2025 · OT/ICS-rammeverk (ISA, NIST, SANS) · Lovdata.no
        </footer>
      </div>
    </div>
  );
}
