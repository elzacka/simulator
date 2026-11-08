import risikoYaml from "./scenarios/risiko.yaml?raw";
import { parseSimulatorData } from "./scenarioEngine";
import Simulator, { type SimulatorConfig } from "./Simulator";
import { type ThemeState } from "./theme";

const data = parseSimulatorData(risikoYaml);

const config: SimulatorConfig = {
  lang: "no",
  tittel: "NSM Risiko 2026",
  undertittel: "Anskaffelser og leverandørkjeder",
  visningTittel: "Organisasjonsvisning",
  kontekstFot: () => "Basert på NSM Risiko 2026",
};

export default function RisikoSimulator({ onBack, theme }: { onBack: () => void; theme: ThemeState }) {
  return <Simulator onBack={onBack} data={data} config={config} theme={theme} />;
}
