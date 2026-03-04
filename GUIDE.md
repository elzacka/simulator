# Simulator — Vedlikeholdsguide

Denne guiden dekker tilpasning av farger, fonter, ikoner og tekst, samt hvordan du kjører prosjektet lokalt og publiserer til GitHub.

---

## Innholdsfortegnelse

1. [Prosjektstruktur](#prosjektstruktur)
2. [Bakgrunnsfarger](#bakgrunnsfarger)
3. [Tekstfarger](#tekstfarger)
4. [Fonter](#fonter)
5. [Overskrifter og beskrivelser](#overskrifter-og-beskrivelser)
6. [Kort og rammer](#kort-og-rammer)
7. [Statusfarger](#statusfarger)
8. [Knapper](#knapper)
9. [Ikoner](#ikoner)
10. [Lokal utvikling](#lokal-utvikling)
11. [Git og GitHub](#git-og-github)

---

## Prosjektstruktur

```
simulator/
├── index.html              ← HTML-inngangspunkt (tittel, meta, språk)
├── package.json            ← Avhengigheter og skript
├── vite.config.ts          ← Vite-konfigurasjon
├── src/
│   ├── index.css           ← Globale stiler, fontimport, animasjoner
│   ├── Icon.tsx            ← Gjenbrukbar ikon-komponent (Material Symbols)
│   ├── App.tsx             ← Forside (velg simulator)
│   ├── OTSimulator.tsx     ← OT-scenariosimulatoren
│   └── RisikoSimulator.tsx ← Risiko-scenariosimulatoren
```

---

## Bakgrunnsfarger

### Hovedbakgrunn

Bakgrunnsfargen `#060b18` (mørk marineblå) er satt på fire steder:

| Fil | Linje | Hva |
|-----|-------|-----|
| `src/index.css` | 16 | `background: #060b18` (body) |
| `src/App.tsx` | 17 | `background: "#060b18"` |
| `src/OTSimulator.tsx` | 182 | `background: "#060b18"` |
| `src/RisikoSimulator.tsx` | 223 | `background: "#060b18"` |

**For å endre:** Søk og erstatt `#060b18` med ønsket farge i alle fire filer.

### Gradient-glød

Hver side har en subtil blå gradient-glød i bakgrunnen:

| Fil | Linje | Effekt |
|-----|-------|--------|
| `src/App.tsx` | 23 | Glød venstre-senter |
| `src/OTSimulator.tsx` | 186 | Glød venstre-oppe |
| `src/RisikoSimulator.tsx` | 227 | Glød høyre-oppe |

Gløden bruker `rgba(37,99,235,0.05)`. Endre opasiteten (0.05) for sterkere/svakere effekt, eller endre fargen.

---

## Tekstfarger

Prosjektet bruker tre tekstnivåer:

| Nivå | Farge | Hex | Brukes til |
|------|-------|-----|------------|
| Primær | Lys grå | `#e5e7eb` | Overskrifter, viktig tekst |
| Sekundær | Dempet blågrå | `#8896aa` | Beskrivelser, undertekst |
| Tertiær | Mørk grå | `#5a6a80` | Fotnoter, krediteringer |
| Standard body | Lys grå | `#d1d5db` | Brødtekst |

**Standard body-farge** settes i `src/index.css` linje 17: `color: #d1d5db`.

For å endre sekundærtekst, søk etter `#8896aa` i alle `.tsx`-filer.

---

## Fonter

### Skrifttype

Fonten `Nunito Sans` importeres i `src/index.css` linje 1:

```css
@import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700;800&display=swap');
```

Og brukes i linje 13:

```css
font-family: 'Nunito Sans', 'Segoe UI', system-ui, sans-serif;
```

**For å endre font:**
1. Oppdater `@import`-URLen med ny font fra [Google Fonts](https://fonts.google.com)
2. Oppdater `font-family` i `src/index.css` linje 13

### Ikonfont

Material Symbols Rounded importeres i `src/index.css` linje 2. Se [Ikoner](#ikoner) for detaljer.

---

## Overskrifter og beskrivelser

### Forsiden (App.tsx)

| Element | Linjer | Egenskaper |
|---------|--------|------------|
| Hovedtittel | 26–32 | `fontSize: clamp(28px, 5vw, 42px)`, `fontWeight: 700`, `color: #e5e7eb` |
| Beskrivelse | 35–39 | `fontSize: clamp(14px, 2.5vw, 17px)`, `color: #8896aa` |
| Korttittel | 67–71 | `fontSize: 20px`, `fontWeight: 700`, `color: #e5e7eb` |
| Kortbeskrivelse | 75–78 | `fontSize: 14px`, `color: #8896aa` |
| Kortlenke | 84–90 | `fontSize: 13px`, `color: #3b82f6`, `fontWeight: 600` |

### Simulatorsidene

Begge simulatorene bruker samme stilmønster. Titler, beskrivelser og etiketter styres med inline-stiler i de respektive komponentene.

---

## Kort og rammer

### Kortbakgrunn

Alle kort bruker `rgba(8, 16, 32, 0.95)` — halvgjennomsiktig mørk blå:

| Fil | Linjer |
|-----|--------|
| `src/App.tsx` | 61, 103 |
| `src/OTSimulator.tsx` | 215, 260, 323 |
| `src/RisikoSimulator.tsx` | 256, 301, 364 |

### Ramme/border

Alle rammer bruker `#1c2a40` (mørk blå):

Søk etter `#1c2a40` for å endre alle rammer samtidig.

### Hover-effekt

Definert i `src/index.css`:
- Linje 81: `rgba(37, 99, 235, 0.08)` — hover
- Linje 86: `rgba(37, 99, 235, 0.12)` — valgt/aktiv

---

## Statusfarger

Begge simulatorene har en `fg()`-funksjon som returnerer farge basert på status:

| Status | Farge | Hex |
|--------|-------|-----|
| kompromittert | Knallrød | `#ff003c` |
| nede | Rød | `#ff2244` |
| kritisk | Oransjerød | `#ff5500` |
| feil | Oransje | `#ff6600` |
| manipulert | Mørk oransje | `#e06000` |
| degradert | Brun-oransje | `#cc8800` |
| advarsel | Gul | `#ccaa00` |
| oppdateres | Blå | `#3b82f6` |
| normal | Grønn | `#00cc66` |
| standard | Primærblå | `#2563eb` |

**Plassering:**
- `src/OTSimulator.tsx` linje 102–110
- `src/RisikoSimulator.tsx` linje 143–151

---

## Knapper

Primærknappen bruker en blå gradient:

```
background: linear-gradient(135deg, #1e40af, #2563eb)
color: #e5e7eb
boxShadow: 0 0 20px rgba(37,99,235,0.3)
```

| Fil | Linje |
|-----|-------|
| `src/OTSimulator.tsx` | 345–347 |
| `src/RisikoSimulator.tsx` | 386–388 |

---

## Ikoner

Prosjektet bruker **Material Symbols Rounded** via `src/Icon.tsx`.

### Bruk i kode

```tsx
import { Icon } from "./Icon";

<Icon name="security" size={20} />
<Icon name="warning" size={16} fill color="#ff5500" />
<Icon name="check_circle" size={24} fill color="#00cc66" aria-label="OK" />
```

### Tilgjengelige egenskaper

| Prop | Type | Standard | Beskrivelse |
|------|------|----------|-------------|
| `name` | string | (påkrevd) | Ikonnavn fra Material Symbols |
| `size` | number | 20 | Pikselstørrelse |
| `fill` | boolean | false | Fylt versjon av ikonet |
| `weight` | number | 400 | Strektykkelse (100–700) |
| `grade` | number | 0 | Visuell vekt (-25 til 200) |
| `color` | string | `currentColor` | Farge |
| `className` | string | — | Ekstra CSS-klasser |
| `aria-label` | string | — | Tilgjengelighetstekst |

### Finn ikoner

Bla gjennom alle tilgjengelige ikoner på [Material Symbols](https://fonts.google.com/icons?icon.set=Material+Symbols).

### Erstatte et ikon

Finn gjeldende `<Icon name="...">` i koden og bytt `name` til ønsket ikon fra Material Symbols-katalogen.

---

## Lokal utvikling

### Forutsetninger

- [Node.js](https://nodejs.org) (v18 eller nyere)
- npm (følger med Node.js)

### Start utviklingsserveren

```bash
npm run dev
```

Åpner vanligvis på `http://localhost:5173`. Endringer i koden oppdateres automatisk i nettleseren (hot reload).

### Stopp serveren

Trykk `Ctrl + C` i terminalen der serveren kjører.

### Start på nytt

```bash
# Stopp med Ctrl + C, deretter:
npm run dev
```

### Bygg for produksjon

```bash
npm run build
```

Produksjonsfilene havner i `dist/`-mappen.

### Forhåndsvis produksjonsbygget

```bash
npm run preview
```

### Kjør linter

```bash
npm run lint
```

---

## Git og GitHub

### Førstegangsoppsett

Koble prosjektet til GitHub-repoet:

```bash
git init
git remote add origin https://github.com/elzacka/simulator.git
```

### Daglig arbeidsflyt

#### 1. Se status på endringer

```bash
git status
```

#### 2. Legg til filer

```bash
# Legg til spesifikke filer:
git add src/App.tsx src/index.css

# Eller legg til alle endrede filer:
git add -A
```

#### 3. Lag en commit

Skriv en kort, beskrivende melding om hva du endret:

```bash
git commit -m "Oppdater bakgrunnsfarge til mørkere nyanse"
```

#### 4. Push til GitHub

```bash
# Første gang (setter opp sporing):
git push -u origin main

# Deretter:
git push
```

### Vanlige scenarier

**Endret farger:**
```bash
git add src/index.css src/App.tsx src/OTSimulator.tsx src/RisikoSimulator.tsx
git commit -m "Endre bakgrunnsfarge fra marineblå til svart"
git push
```

**Endret font:**
```bash
git add src/index.css
git commit -m "Bytt font fra Nunito Sans til Inter"
git push
```

**Byttet ikoner:**
```bash
git add src/OTSimulator.tsx src/RisikoSimulator.tsx
git commit -m "Erstatt advarselikon med nytt Material Symbol"
git push
```

### Angre endringer

```bash
# Angre endringer i en fil (før commit):
git checkout -- src/App.tsx

# Angre siste commit (behold filene):
git reset --soft HEAD~1
```

---

## Fargepalett — hurtigreferanse

| Formål | Hex | Eksempel |
|--------|-----|---------|
| Bakgrunn | `#060b18` | Hovedbakgrunn |
| Rammer | `#1c2a40` | Alle borders |
| Kort | `rgba(8,16,32,0.95)` | Kortbakgrunn |
| Primærtekst | `#e5e7eb` | Overskrifter |
| Sekundærtekst | `#8896aa` | Beskrivelser |
| Tertiærtekst | `#5a6a80` | Fotnoter |
| Primærblå | `#2563eb` | Knapper, lenker |
| Lysblå | `#3b82f6` | Lenker, aktive elementer |
| Grønn | `#00cc66` | Normal-status |
| Rød | `#ff003c` | Kritisk-status |
| Gul | `#ccaa00` | Advarsel-status |
| Oransje | `#ff5500` | Feil-status |
