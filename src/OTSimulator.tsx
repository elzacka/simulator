import otYaml from "./scenarios/ot.yaml?raw";
import { parseSimulatorData } from "./scenarioEngine";
import Simulator, { type SimulatorConfig } from "./Simulator";
import { type ThemeState } from "./theme";

const data = parseSimulatorData(otYaml);

const config: SimulatorConfig = {
  lang: "no",
  tittel: "Operasjonell teknologi",
  undertittel: "Bygg og anlegg",
  visningTittel: "Anleggsvisning",
  kontekstFot: () => "Basert på hendelsesmønstre for OT i norske bygg og anlegg",
  angrepsvektor: {
    tittel: "Angrepsvektor: Slik nås enheten",
    lenker: [
      { tekst: "Sjekk egne adresser på Shodan", href: "https://www.shodan.io/" },
      { tekst: "NSM: Råd om IKT-sikkerhet", href: "https://nsm.no/" },
    ],
  },
};

export default function OTSimulator({ onBack, theme }: { onBack: () => void; theme: ThemeState }) {
  return <Simulator onBack={onBack} data={data} config={config} theme={theme} />;
}
