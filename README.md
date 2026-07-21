# DiDat Analyse - Ausschuss für Digitalisierung und Datenschutz

Diese Web-App bietet eine interaktive Analyse und Übersicht über die Sitzungsprotokolle und Diskussionen des Berliner Ausschusses für Digitalisierung und Datenschutz (Zeitraum ab Januar 2022).

Die App analysiert vollautomatisiert (mittels NLP/LLM) offizielle Beschlussprotokolle, kategorisiert die diskutierten Themen, leitet Themen-Trends über die Zeit ab und extrahiert detailliert die geäußerten Positionen der einzelnen Parteien (SPD, CDU, Grüne, FDP, Linke, AfD) zu den jeweiligen Fachbereichen.

> **Hinweis:** Es handelt sich um einen Prototypen des CityLAB Berlin. Die Analyse erfolgt mit LLMs; Ungenauigkeiten oder Fehlinterpretationen sind möglich.

## Hauptfunktionen

- **Übersicht (Dashboard):** Anzahl der Sitzungen, gefassten Beschlüsse und diskutierten Themen. Eine Trend-Grafik visualisiert die thematische Entwicklung über die Monate (inkl. Zeitraum-Slider).
- **Themen & Parteipositionen:** Themen sind in acht Kategorien gruppiert. Pro Thema sind Parteipositionen (`pro` / `contra` / `neutral` / `keine Aussage`) und Kurzzitate aus dem Originalprotokoll einsehbar.
- **Sitzungen:** Chronologische Liste aller verarbeiteten Sitzungen mit Detail-Panel (Beschlüsse, Abstimmungsergebnisse) und Link zu den PDF-Originaldokumenten des Berliner Parlaments.

### Themenkategorien

- Bürgerdienste & Digitale Anträge
- IT-Modernisierung & Infrastruktur
- Datenschutz & Grundrechte
- Informationsfreiheit & Transparenz
- Künstliche Intelligenz (KI)
- Cybersicherheit & Resilienz
- Haushalt & Steuerung
- Digitale Gesetze & Strategien

## Technische Architektur

Das Projekt besteht aus zwei Hauptkomponenten:

1. **Python Data-Pipeline (isoliert in Docker)**  
   Lädt Rohdokumente vom Berliner Parlament, extrahiert Texte aus den PDFs und lässt ein Large Language Model (`gemini-3.5-flash`) die Analyse durchführen. Anschließend werden die Daten aggregiert, gegen das Frontend-Schema validiert und als JSON unter `public/data/` abgelegt.

2. **React/Vite Frontend (`src/`)**  
   Eine Single Page Application ohne Laufzeit-Backend. Die vorberechneten JSON-Dateien werden direkt gerendert und gefiltert. UI: Tailwind CSS und Shadcn. Routen: `/` (Übersicht), `/topics`, `/sessions`.

### Pipeline-Schritte

| Schritt | Skript | Ergebnis |
| --- | --- | --- |
| 1. Scraping | `scrape_docs.py` | `scraped_links.json` |
| 2. PDF-Parsing | `parse_pdfs.py` | `parsed_texts.json` (PDFs unter `.pdf_cache/`) |
| 3. LLM-Analyse | `analyze.py` | `analysis_results.json` |
| 4. Aggregation | `aggregate.py` | `public/data/*.json` |
| 5. Validierung | `validate.py` | Schema-Check der JSON-Dateien |

Gemeinsame Konstanten und Hilfsfunktionen liegen in `pipeline_utils.py` (Cutoff-Datum, Kategorien, Parteien, Stances, Trends).

**Ausgabe fürs Frontend (`public/data/`):**

- `sessions.json` – Sitzungen, Beschlüsse, PDF-Links
- `topics.json` – Themen, Kategorien, Trends, Parteipositionen
- `parties.json` – Parteiperspektive
- `trends.json` – Monatliche Themenhäufigkeiten je Kategorie

### Data-Pipeline ausführen (via Docker)

**Voraussetzungen:**

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installiert und gestartet
- `.env` im Projektroot mit Gemini API Key (Vorlage: `.env.example`):

```bash
GEMINI_API_KEY=dein-key
```

Komplette Pipeline (baut bei Bedarf das Image, führt `run_pipeline.sh` aus, schreibt JSON nach `public/data/`):

```bash
docker compose run --rm data-pipeline
```

(`docker-compose` funktioniert als Alias weiterhin.)

### Pipeline lokal (ohne Docker)

Voraussetzungen: Python 3, Abhängigkeiten aus `requirements.txt`, sowie Playwright-Browser (`playwright install chromium`).

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
playwright install chromium
export GEMINI_API_KEY=dein-key
./run_pipeline.sh
```

Einzelne Schritte können auch isoliert gestartet werden, z. B. `python validate.py`.

## Installation und Entwicklung Frontend

Voraussetzung: Node.js gemäß `.nvmrc` (aktuell `v22.9.0`) und [pnpm](https://pnpm.io/).

```bash
pnpm install
pnpm run dev
```

Die App ist unter `http://localhost:5173` erreichbar.

```bash
pnpm run build    # Produktions-Build
pnpm run preview  # Build lokal ansehen
```

Weitere Skripte: `pnpm run lint`, `pnpm run test:unit`, `pnpm run test:e2e`, `pnpm run test:a11y`.

Deployment (Vercel): Frontend-Build über `pnpm`; Python-Pipeline und Zwischenartefakte sind über `.vercelignore` vom Deploy ausgeschlossen.

## Credits

Basierend auf dem Vite-React-Template der [Technologiestiftung Berlin](https://github.com/technologiestiftung/template-vite-react).  
Illustrationen und Design-System: Shadcn, Tailwind CSS, Lucide.  
Quellcode: [technologiestiftung/didat-analysis](https://github.com/technologiestiftung/didat-analysis).
