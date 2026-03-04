# Scenariosimulator

Interaktiv scenariosimulator for sikkerhetshendelser basert på NSM Risiko 2026. Simuler OT-angrep og digitale risikoer i sanntid.

**Live:** https://elzacka.github.io/simulator/

## Simulatorer

- **OT-simulator** — Operasjonell teknologi: simuler angrep mot industrielle kontrollsystemer (SCADA, PLS, HMI)
- **Risiko-simulator** — Digital risiko: simuler cyberhendelser mot sky, nettverk, e-post og finanssystemer

## Teknologi

- React 19, TypeScript 5.9, Vite 7
- Material Symbols Rounded (ikoner)
- Nunito Sans (font)
- GitHub Pages (hosting via GitHub Actions)

## Kom i gang

```bash
npm install
npm run dev
```

## Skript

| Kommando | Beskrivelse |
|----------|-------------|
| `npm run dev` | Start utviklingsserver |
| `npm run build` | Produksjonsbygg |
| `npm run lint` | Kjor ESLint |
| `npm run preview` | Forhandsvis produksjonsbygg |

## Prosjektstruktur

```
src/
  App.tsx              — Forside med simulatorvalg
  Icon.tsx             — Gjenbrukbar Material Symbols-komponent
  OTSimulator.tsx      — OT-scenariosimulator
  RisikoSimulator.tsx  — Risiko-scenariosimulator
  index.css            — Globale stiler og animasjoner
  main.tsx             — React-inngangspunkt
```

## Deploy

Push til `main` trigger automatisk deploy til GitHub Pages via GitHub Actions.

## Lisens

Privat prosjekt.
