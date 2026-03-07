# Scenariosimulator

Interaktiv scenariosimulator for sikkerhetshendelser. Simuler cyberangrep og digitale risikoer i sanntid med hendelseslogg, systemstatusvisning og konsekvensoppsummering.

**Live:** https://elzacka.github.io/simulator/

## Simulatorer

- **Operasjonell teknologi** — Angrep mot OT-systemer i kontorbygg (UPS, BMS, HVAC, adgangskontroll)
- **NSM Risiko 2026** — Uønskede hendelser knyttet til anskaffelser og leverandørkjeder
- **OWASP Top 10 2025** — Angrep mot webapplikasjoner basert på OWASP Top 10:2025

## Teknologi

- React 19, TypeScript 5.9, Vite 7
- Scenariodata i YAML (`src/scenarios/`)
- Material Symbols Rounded, Nunito Sans
- GitHub Pages via GitHub Actions

## Kom i gang

```bash
npm install
npm run dev
```

## Skript

| Kommando | Beskrivelse |
|----------|-------------|
| `npm run dev` | Utviklingsserver |
| `npm run build` | Produksjonsbygg |
| `npm run lint` | ESLint |
| `npm run preview` | Forhåndsvis bygg |

## Deploy

Push til `main` trigger automatisk deploy til GitHub Pages.

## Lisens

Privat prosjekt.
