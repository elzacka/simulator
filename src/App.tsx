import { useState } from "react";
import OTSimulator from "./OTSimulator";
import RisikoSimulator from "./RisikoSimulator";
import Icon from "./Icon";

type Page = "start" | "ot" | "risiko";

export default function App() {
  const [page, setPage] = useState<Page>("start");

  if (page === "ot") return <OTSimulator onBack={() => setPage("start")} />;
  if (page === "risiko") return <RisikoSimulator onBack={() => setPage("start")} />;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#060b18",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 20px",
      backgroundImage: "radial-gradient(ellipse at 30% 50%, rgba(37,99,235,0.05) 0%, transparent 60%)",
    }}>
      <div style={{ textAlign: "center", marginBottom: "48px" }}>
        <h1 style={{
          fontSize: "clamp(28px, 5vw, 42px)",
          fontWeight: 700,
          color: "#e5e7eb",
          letterSpacing: "0.02em",
          marginBottom: "12px",
        }}>
          Scenariosimulator
        </h1>
        <p style={{
          fontSize: "clamp(14px, 2.5vw, 17px)",
          color: "#8896aa",
          maxWidth: "540px",
          lineHeight: 1.6,
        }}>
          Simuler realistiske sikkerhetshendelser og se hvordan feilkjeder
          sprer seg gjennom en virksomhet
        </p>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 320px))",
        gap: "24px",
        justifyContent: "center",
        width: "100%",
        maxWidth: "700px",
      }}>
        <div
          className="navcard"
          onClick={() => setPage("ot")}
          style={{
            padding: "32px 28px",
            borderRadius: "8px",
            border: "1px solid #1c2a40",
            background: "rgba(8, 16, 32, 0.95)",
          }}
        >
          <h2 style={{
            fontSize: "20px",
            fontWeight: 700,
            color: "#e5e7eb",
            marginBottom: "10px",
          }}>
            Operasjonell teknologi
          </h2>
          <p style={{
            fontSize: "14px",
            color: "#8896aa",
            lineHeight: 1.55,
          }}>
            Feilkjeder i operasjonell teknologi. Simuler angrep mot UPS, BMS
            og nettverksinfrastruktur i kontorbygg.
          </p>
          <div style={{
            marginTop: "20px",
            fontSize: "13px",
            color: "#3b82f6",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}>
            3 scenarier <Icon name="arrow_forward" size={16} ariaLabel="" />
          </div>
        </div>

        <div
          className="navcard"
          onClick={() => setPage("risiko")}
          style={{
            padding: "32px 28px",
            borderRadius: "8px",
            border: "1px solid #1c2a40",
            background: "rgba(8, 16, 32, 0.95)",
          }}
        >
          <h2 style={{
            fontSize: "20px",
            fontWeight: 700,
            color: "#e5e7eb",
            marginBottom: "10px",
          }}>
            Risiko 2026
          </h2>
          <p style={{
            fontSize: "14px",
            color: "#8896aa",
            lineHeight: 1.55,
          }}>
            Uønskede hendelser relatert til anskaffelser og leverandørkjeder.
            Basert på NSMs risikovurdering for 2026.
          </p>
          <div style={{
            marginTop: "20px",
            fontSize: "13px",
            color: "#3b82f6",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}>
            5 scenarier <Icon name="arrow_forward" size={16} ariaLabel="" />
          </div>
        </div>
      </div>

      <div style={{
        marginTop: "48px",
        fontSize: "12px",
        color: "#5a6a80",
        textAlign: "center",
        lineHeight: 1.6,
      }}>
        Kilder: OWASP Top Ten 2025 · NSM Risiko 2026 · NSM Veileder for sikkerhet i anskaffelser 2025
      </div>
    </div>
  );
}
