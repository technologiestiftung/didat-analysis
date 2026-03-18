# DiDat Analyse - Ausschuss für Digitalisierung und Datenschutz

Diese Web-App bietet eine interaktive Analyse und Übersicht über die Sitzungsprotokolle und Diskussionen des Berliner Ausschusses für Digitalisierung und Datenschutz (Wahlperiode 2025 - 2026).

Die App analysiert vollautomatisiert (mittels NLP/LLM) offizielle Beschlussprotokolle, kategorisiert die diskutierten Themen, leitet Themen-Trends über die Zeit ab und extrahiert detailliert die geäußerten Positionen der einzelnen Parteien (SPD, CDU, Grüne, FDP, Linke, AfD) zu den jeweiligen Fachbereichen.

## Hauptfunktionen

- **Übersicht (Dashboard):** Auf einen Blick die Anzahl der Sitzungen, gefassten Beschlüsse und diskutierten Themen. Eine Trend-Grafik visualisiert die thematische Entwicklung über die Monate.
- **Themen & Parteipositionen:** Alle diskutierten Themen sind in handliche Kategorien (z.B. _E-Government_, _KI_, _Cybersicherheit_) gruppiert. Man kann zu jedem Thema nachlesen, welche Partei sich wie (pro, contra, neutral) positioniert hat, inklusive der wichtigsten Zitate aus dem Originalprotokoll.
- **Sitzungen:** Eine chronologische Liste aller verarbeiteten Sitzungen. Ein Klick öffnet ein Detail-Panel mit den konkreten Beschlüssen (inklusive Abstimmungsergebnissen) und verlinkt direkt auf die PDF-Originaldokumente des Berliner Parlaments.

## Technische Architektur

Dieses Projekt besteht aus zwei Hauptkomponenten:

1.  **Python Data-Pipeline (`scripts/`):**
    Lädt die Rohdokumente vom Parlament herunter, extrahiert die Texte aus den PDFs und lässt eine Large Language Model (Gemini 2.5 Pro) die komplexen Textanalysen durchführen. Anschließend werden die Daten aggregiert und für das Frontend als fertige JSON-Dateien (`public/data/*.json`) abgelegt.
2.  **React/Vite Frontend (`src/`):**
    Eine schlanke, leichtgewichtige Single Page Application (SPA), die ohne Laufzeit-Backend auskommt. Alle berechneten JSON-Daten werden direkt im Frontend gerendert und gefiltert. Die UI basiert auf Tailwind CSS und Shadcn.

### Data-Pipeline ausführen

Um neue Sitzungen vom Berliner Parlament hinzuzufügen, muss die Daten-Pipeline erneut ausgeführt werden.

Voraussetzungen:

- Python 3.9+ installiert
- `.venv` anlegen und Pakete installieren: `python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt`
- Installiere Playwright-Browser: `playwright install chromium`
- Lege eine `.env` Datei mit deinem Gemini API Key an (`GEMINI_API_KEY="dein-key"`)

Führe dann die komplette Pipeline aus:

```bash
# Lade virtuelle Umgebung
source .venv/bin/activate
source .env

# 1. Neue Dokumente scrapend
python scripts/scrape_docs.py

# 2. PDFs laden und Text extrahieren
python scripts/parse_pdfs.py

# 3. KI-Analyse durchführen (Achtung: Dies sendet Daten an die API und kann mehrere Minuten dauern)
python scripts/analyze.py

# 4. Daten für das Frontend aggregieren
python scripts/aggregate.py
```

## Installation und Entwicklung Frontend

Das Frontend ist mit [Vite](https://vitejs.dev/), [React](https://reactjs.org/) und [Tailwind CSS](https://tailwindcss.com/) gebaut.

Abhängigkeiten installieren:

```bash
pnpm install
```

Lokalen Entwicklungsserver starten:

```bash
pnpm run dev
```

Die App ist dann unter `http://localhost:5173` erreichbar.

Für das Produktions-Build:

```bash
pnpm run build
```

## Credits

Basierend auf dem Vite-React-Template der [Technologiestiftung Berlin](https://github.com/technologiestiftung/template-vite-react).
Illustrationen und Design-System: Shadcn, Tailwind CSS, Lucide.
