import owaspYaml from "./scenarios/owasp.yaml?raw";
import { parseSimulatorData } from "./scenarioEngine";
import Simulator, { type SimulatorConfig } from "./Simulator";
import { type ThemeState } from "./theme";

const data = parseSimulatorData(owaspYaml);

const OWASP_LINKS: Record<string, string> = {
  broken_access: "https://owasp.org/Top10/2025/A01_2025-Broken_Access_Control/",
  misconfig: "https://owasp.org/Top10/2025/A02_2025-Security_Misconfiguration/",
  supply_chain: "https://owasp.org/Top10/2025/A03_2025-Software_Supply_Chain_Failures/",
  crypto_failures: "https://owasp.org/Top10/2025/A04_2025-Cryptographic_Failures/",
  injection: "https://owasp.org/Top10/2025/A05_2025-Injection/",
  insecure_design: "https://owasp.org/Top10/2025/A06_2025-Insecure_Design/",
  auth_failure: "https://owasp.org/Top10/2025/A07_2025-Authentication_Failures/",
  integrity_failures: "https://owasp.org/Top10/2025/A08_2025-Software_or_Data_Integrity_Failures/",
  logging_failures: "https://owasp.org/Top10/2025/A09_2025-Security_Logging_and_Alerting_Failures/",
  exceptional_conditions: "https://owasp.org/Top10/2025/A10_2025-Mishandling_of_Exceptional_Conditions/",
};

const config: SimulatorConfig = {
  lang: "en",
  tittel: "OWASP Top Ten 2025",
  undertittel: "Web application security",
  visningTittel: "Architecture view",
  kontekstFot: sc => `Based on OWASP Top Ten 2025 (${sc?.owasp ?? ""})`,
  forebyggingSuffiks: sc => (sc?.owasp ? ` (${sc.owasp})` : ""),
  lenker: {
    tittel: "Cheat sheets & more",
    etikett: sc => `OWASP Top 10:2025 (${sc.owasp})`,
    href: sc => OWASP_LINKS[sc.id],
  },
};

export default function OwaspSimulator({ onBack, theme }: { onBack: () => void; theme: ThemeState }) {
  return <Simulator onBack={onBack} data={data} config={config} theme={theme} />;
}
