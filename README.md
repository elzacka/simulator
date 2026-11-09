# Scenariosimulator

Interaktiv scenariosimulator for sikkerhetshendelser. Simuler cyberangrep og digitale risikoer i sanntid med hendelseslogg, systemstatusvisning og konsekvensoppsummering.

**Live:** https://elzacka.github.io/simulator/

## Simulatorer

- **Operasjonell teknologi** — Angrep mot OT-systemer i bygg og anlegg (UPS, BMS, HVAC, adgangskontroll, kjøl og frys)
- **NSM Risiko 2026** — Uønskede hendelser knyttet til anskaffelser og leverandørkjeder
- **OWASP Top 10 2025** — Angrep mot webapplikasjoner basert på OWASP Top 10:2025

## Teknologi

- React 19, TypeScript 5.9, Vite 7
- Scenariodata i YAML (`src/scenarios/`). Tekstfeltene støtter `**fet**` og `*kursiv*`.
- Lyst standardtema og mørk modus via CSS-variabler
- Public Sans, Source Serif 4
- Ikoner som SVG i `src/ikoner/<bibliotek>/` (Lucide, Tabler, Heroicons, Material Symbols), valgt etter hva som passer best. Lisensene ligger ved hvert bibliotek. Bruk i YAML: `ikon: lucide/cctv`
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
