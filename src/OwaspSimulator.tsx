import { useState } from "react";
import Icon from "./Icon";
import owaspYaml from "./scenarios/owasp.yaml?raw";
import { parseSimulatorData, useScenarioEngine, fg } from "./scenarioEngine";

const STATUS_EN: Record<string, string> = {
  kompromittert: "COMPROMISED", nede: "DOWN", kritisk: "CRITICAL",
  feil: "ERROR", manipulert: "TAMPERED", svekket: "DEGRADED",
  advarsel: "WARNING", eksponert: "EXPOSED", oppdateres: "UPDATING",
  normal: "NORMAL",
};
function statusText(s?: string): string {
  if (!s) return "NORMAL";
  return STATUS_EN[s] || s.toUpperCase();
}

const data = parseSimulatorData(owaspYaml);
const SYS_INFO = data.systemer;
const SCENARIOS = data.scenarier;
const LAG = data.gruppeLabels;

const OWASP_PREVENTION: Record<string, { tiltak: string[]; lenke: string }> = {
  broken_access: {
    tiltak: [
      "Except for public resources, deny by default.",
      "Implement access control mechanisms once and re-use them.",
      "Model access controls should enforce record ownership.",
      "Unique application business limit requirements should be enforced by domain models.",
      "Disable web server directory listing.",
      "Log access control failures, alert admins.",
      "Rate limit API and controller access to minimize the harm.",
    ],
    lenke: "https://owasp.org/Top10/2025/A01_2025-Broken_Access_Control/",
  },
  misconfig: {
    tiltak: [
      "A repeatable hardening process makes it fast and easy to deploy another environment that is appropriately locked down.",
      "Remove or do not install unused features and frameworks.",
      "Review and update configurations appropriate to all security notes, updates, and patches.",
      "A segmented application architecture provides effective and secure separation between components or tenants.",
      "Send security directives to clients, e.g., Security Headers.",
      "An automated process to verify the effectiveness of the configurations and settings in all environments.",
    ],
    lenke: "https://owasp.org/Top10/2025/A02_2025-Security_Misconfiguration/",
  },
  supply_chain: {
    tiltak: [
      "Remove unused dependencies, unnecessary features, components, files, and documentation.",
      "Continuously inventory the versions of both client-side and server-side components and their dependencies.",
      "Only obtain components from official sources over secure links.",
      "Monitor for libraries and components that are unmaintained or do not create security patches for older versions.",
    ],
    lenke: "https://owasp.org/Top10/2025/A03_2025-Software_Supply_Chain_Failures/",
  },
  crypto_failures: {
    tiltak: [
      "Classify data processed, stored, or transmitted. Identify which data is sensitive according to privacy laws, regulatory requirements, or business needs.",
      "Don\u2019t store sensitive data unnecessarily.",
      "Encrypt all sensitive data at rest and in transit.",
      "Disable caching for responses that contain sensitive data.",
      "Do not use legacy protocols such as FTP and SMTP for transporting sensitive data.",
      "Store passwords using strong adaptive and salted hashing functions (Argon2, scrypt, bcrypt or PBKDF2).",
      "Avoid deprecated cryptographic functions and padding schemes (MD5, SHA1, PKCS #1 v1.5).",
    ],
    lenke: "https://owasp.org/Top10/2025/A04_2025-Cryptographic_Failures/",
  },
  injection: {
    tiltak: [
      "Use a safe API which avoids using the interpreter entirely, or provides a parameterized interface.",
      "Use positive server-side input validation.",
      "For residual dynamic queries, escape special characters using the specific escape syntax for that interpreter.",
      "Use LIMIT and other SQL controls within queries to prevent mass disclosure of records.",
    ],
    lenke: "https://owasp.org/Top10/2025/A05_2025-Injection/",
  },
  insecure_design: {
    tiltak: [
      "Establish and use a secure development lifecycle with AppSec.",
      "Establish and use a library of secure design patterns.",
      "Use threat modeling for critical authentication, access control, business logic, and key flows.",
      "Integrate security language and controls into user stories.",
      "Integrate plausibility checks at each tier of your application.",
      "Write unit and integration tests to validate that all critical flows.",
      "Segregate tier layers on the system and network layers.",
      "Segregate tenants robustly by design throughout all tiers.",
      "Limit resource consumption by user or service.",
    ],
    lenke: "https://owasp.org/Top10/2025/A06_2025-Insecure_Design/",
  },
  auth_failure: {
    tiltak: [
      "Implement multi-factor authentication to prevent automated credential stuffing, brute force, and stolen credential reuse attacks.",
      "Do not ship or deploy with any default credentials.",
      "Implement weak password checks, such as testing new or changed passwords against the top 10,000 worst passwords list.",
      "Align password length, complexity, and rotation policies with NIST 800-63b.",
      "Ensure registration, credential recovery, and API pathways are hardened against account enumeration attacks.",
      "Limit or increasingly delay failed login attempts, but be careful not to create a denial of service scenario.",
      "Use a server-side, secure, built-in session manager that generates a new random session ID with high entropy after login.",
    ],
    lenke: "https://owasp.org/Top10/2025/A07_2025-Authentication_Failures/",
  },
  integrity_failures: {
    tiltak: [
      "Use digital signatures or similar mechanisms to verify the software or data is from the expected source and has not been altered.",
      "Ensure libraries and dependencies are consuming trusted repositories. Consider hosting an internal known-good repository.",
      "Ensure that a software supply chain security tool is used to verify that components do not contain known vulnerabilities.",
      "Ensure that there is a review process for code and configuration changes to minimize the chance that malicious code could be introduced into your software pipeline.",
    ],
    lenke: "https://owasp.org/Top10/2025/A08_2025-Software_or_Data_Integrity_Failures/",
  },
  logging_failures: {
    tiltak: [
      "Log important security events consistently.",
      "Monitor logs for suspicious behavior.",
      "Store logs centrally and securely.",
      "Set alerts that actually trigger and escalate.",
      "Detect and respond to attacks in real time.",
    ],
    lenke: "https://owasp.org/Top10/2025/A09_2025-Security_Logging_and_Alerting_Failures/",
  },
  exceptional_conditions: {
    tiltak: [
      "Catch errors early and fail safely.",
      "Centralize and standardize exception handling.",
      "Validate and sanitize all inputs.",
      "Apply limits on resources and requests.",
      "Log, monitor, and alert on anomalies.",
      "Test failure scenarios and secure the design.",
    ],
    lenke: "https://owasp.org/Top10/2025/A10_2025-Mishandling_of_Exceptional_Conditions/",
  },
};

interface Props {
  onBack: () => void;
}

export default function OwaspSimulator({ onBack }: Props) {
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
      backgroundImage: "radial-gradient(ellipse at 50% 20%, rgba(37,99,235,0.05) 0%, transparent 55%)"
    }}>
      {/* TOPPLINJE */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px", borderBottom: "1px solid #1c2a40", paddingBottom: "11px" }}>
        <button className="backbtn" onClick={onBack} style={{
          border: "1px solid #1c2a40", background: "transparent", color: "#8896aa",
          padding: "5px 14px", borderRadius: "6px", fontSize: "13px", fontFamily: "inherit",
          display: "flex", alignItems: "center", gap: "6px",
        }}>
          <Icon name="arrow_back" size={16} ariaLabel="" /> Back
        </button>
        <span style={{ fontSize: "16px", fontWeight: 700, color: "#3b82f6", letterSpacing: "0.06em" }}>OWASP TOP TEN 2025</span>
        <span style={{ fontSize: "10px", color: "#8896aa", letterSpacing: "0.08em", marginTop: "1px" }}>SCENARIO SIMULATOR · WEB APPLICATION SECURITY</span>
        {running && (
          <span style={{ marginLeft: "auto", color: "#f59e0b", fontSize: "11px", animation: "blink 0.9s infinite", display: "flex", alignItems: "center", gap: "6px" }}>
            <Icon name="radio_button_checked" size={12} fill={true} ariaLabel="" /> SIMULATION ACTIVE
          </span>
        )}
        {done && (
          <span style={{ marginLeft: "auto", color: "#ef4444", fontSize: "11px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Icon name="stop" size={12} fill={true} ariaLabel="" /> COMPLETE · {antallBrutt} SYSTEMS AFFECTED
          </span>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "12px", alignItems: "start" }}>
        {/* VENSTRE KOLONNE */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {/* ARKITEKTURVISNING */}
          <div style={{ border: "1px solid #1c2a40", borderRadius: "6px", overflow: "hidden", background: "rgba(8,16,32,0.95)" }}>
            <div style={{ padding: "8px 14px", borderBottom: "1px solid #1c2a40", fontSize: "10px", color: "#8896aa", letterSpacing: "0.08em", fontWeight: 600 }}>
              ARCHITECTURE VIEW — SYSTEM STATUS
            </div>
            <div style={{ padding: "10px", display: "flex", flexDirection: "column", gap: "3px" }}>
              {LAG.map((lagnavn, lIdx) => {
                const sys = Object.entries(SYS_INFO)
                  .filter(([, v]) => v.gruppe === lIdx)
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
                            <div style={{ fontSize: "9px", marginTop: "2px", color: hit ? c : "#6b7280", letterSpacing: "0.05em" }}>{statusText(st)}</div>
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
              EVENT LOG — ATTACK CHAIN
            </div>
            <div ref={logRef} style={{ maxHeight: "280px", overflowY: "auto", padding: "7px" }}>
              {log.length === 0
                ? <div style={{ color: "#5a6a80", fontSize: "12px", padding: "24px", textAlign: "center" }}>— Select a scenario and click SIMULATE —</div>
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
                          <span style={{ fontSize: "8px", color: c, border: `1px solid ${c}30`, padding: "0 4px", borderRadius: "3px" }}>{statusText(e.status)}</span>
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
              <span>{scenario ? scenario.navn : "Select scenario"}</span>
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
              <div style={{ fontSize: "9px", color: "#8896aa", letterSpacing: "0.08em", marginBottom: "6px", fontWeight: 600 }}>CONTEXT</div>
              <div style={{ fontSize: "10px", color: "#9ca3af", lineHeight: 1.6 }}>{scenario?.beskrivelse}</div>
              <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #1c2a40", fontSize: "9px", color: "#5a6a80" }}>
                Based on OWASP Top Ten 2025 ({scenario?.owasp})
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
                SIMULATING...
              </>
            ) : done ? (
              <>
                <Icon name="replay" size={14} ariaLabel="" />
                RUN AGAIN
              </>
            ) : (
              <>
                <Icon name="play_arrow" size={14} fill={true} ariaLabel="" />
                SIMULATE
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
              <Icon name="close" size={14} ariaLabel="" /> RESET
            </button>
          )}

          {/* TEGNFORKLARING */}
          <div style={{ border: "1px solid #1c2a40", borderRadius: "6px", background: "rgba(8,16,32,0.95)", padding: "10px" }}>
            <div style={{ fontSize: "9px", color: "#8896aa", letterSpacing: "0.08em", marginBottom: "8px", fontWeight: 600 }}>STATUS CODES</div>
            {([
              ["NORMAL", "#00cc66"],
              ["WARNING", "#ccaa00"],
              ["DEGRADED", "#cc8800"],
              ["EXPOSED", "#a855f7"],
              ["ERROR / TAMPERED", "#ff6600"],
              ["DOWN / CRITICAL", "#ff2244"],
              ["COMPROMISED", "#ff003c"],
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
                <Icon name="stop" size={12} fill={true} ariaLabel="" /> IMPACT SUMMARY
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                <div>
                  <div style={{ fontSize: "9px", color: "#7a8a9e", marginBottom: "3px" }}>SYSTEMS AFFECTED</div>
                  <div style={{ color: "#ef4444", fontSize: "28px", fontWeight: 700, lineHeight: 1 }}>{antallBrutt}</div>
                </div>
                <div>
                  <div style={{ fontSize: "9px", color: "#7a8a9e", marginBottom: "3px" }}>REGULATIONS AFFECTED</div>
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

          {/* TILTAK */}
          {done && scenario && OWASP_PREVENTION[scenario.id] && (
            <div style={{ border: "1px solid #1e40af", borderRadius: "6px", background: "rgba(8,16,40,0.95)", padding: "14px", animation: "fadein 0.4s ease" }}>
              <div style={{ fontSize: "10px", color: "#3b82f6", letterSpacing: "0.08em", marginBottom: "10px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
                <Icon name="verified_user" size={12} fill={true} ariaLabel="" /> PREVENTION ({scenario.owasp})
              </div>
              {OWASP_PREVENTION[scenario.id].tiltak.map((t, i) => (
                <div key={i} style={{ fontSize: "10px", color: "#9ca3af", padding: "3px 0", display: "flex", alignItems: "flex-start", gap: "6px", lineHeight: 1.5 }}>
                  <span style={{ color: "#3b82f6", flexShrink: 0, marginTop: "2px" }}><Icon name="arrow_forward" size={10} ariaLabel="" /></span> {t}
                </div>
              ))}
              <div style={{ marginTop: "10px", paddingTop: "8px", borderTop: "1px solid #1c2a40" }}>
                <div style={{ fontSize: "9px", color: "#8896aa", letterSpacing: "0.08em", marginBottom: "6px", fontWeight: 600 }}>CHEAT SHEETS & MORE</div>
                <a href={OWASP_PREVENTION[scenario.id].lenke} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: "10px", color: "#60a5fa", textDecoration: "none", display: "flex", alignItems: "center", gap: "5px" }}>
                  <Icon name="open_in_new" size={12} ariaLabel="" /> {scenario.owasp} — OWASP Top 10:2025
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
