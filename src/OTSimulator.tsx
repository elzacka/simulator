import otYaml from "./scenarios/ot.yaml?raw";
import { parseSimulatorData } from "./scenarioEngine";
import Simulator, { type SimulatorConfig } from "./Simulator";
import { type ThemeState } from "./theme";

const data = parseSimulatorData(otYaml);

const config: SimulatorConfig = {
  lang: "no",
  tittel: "Operasjonell teknologi",
  undertittel: "Bygg og anlegg",
  visningTittel: "Visualisering",
  kontekstFot: () => "Basert på hendelsesmønstre for OT i norske bygg og anlegg",
  angrepsvektor: {
    tittel: "Angrepsvektor: Slik nås enheten",
    ramme: "Ingen av angrepene krever kode eller programmering. Den åpne porten mot internett er selve sårbarheten.",
    lenker: [
      { tekst: "Sjekk egne adresser på Shodan", href: "https://www.shodan.io/" },
      { tekst: "NIST: Guide to Operational Technology (OT) Security", href: "https://csrc.nist.gov/pubs/sp/800/82/r4/ipd" },
      { tekst: "NSM: Grunnprinsipper for IKT-sikkerhet", href: "https://nsm.no/regelverk-og-hjelp/rad-og-anbefalinger/ta-i-bruk-grunnprinsippene/" },
    ],
  },
};

export default function OTSimulator({ onBack, theme }: { onBack: () => void; theme: ThemeState }) {
  return <Simulator onBack={onBack} data={data} config={config} theme={theme} />;
}
