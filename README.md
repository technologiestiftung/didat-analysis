# DiDat Analyse - Ausschuss für Digitalisierung und Datenschutz

Diese Web-App bietet eine interaktive Analyse und Übersicht über die Sitzungsprotokolle und Diskussionen des Berliner Ausschusses für Digitalisierung und Datenschutz (Zeitraum Februar 2023 bis heute).

Die App analysiert vollautomatisiert (mittels NLP/LLM) offizielle Beschlussprotokolle, kategorisiert die diskutierten Themen, leitet Themen-Trends über die Zeit ab und extrahiert detailliert die geäußerten Positionen der einzelnen Parteien (SPD, CDU, Grüne, FDP, Linke, AfD) zu den jeweiligen Fachbereichen.

## Hauptfunktionen

- **Übersicht (Dashboard):** Auf einen Blick die Anzahl der Sitzungen, gefassten Beschlüsse und diskutierten Themen. Eine Trend-Grafik visualisiert die thematische Entwicklung über die Monate.
- **Themen & Parteipositionen:** Alle diskutierten Themen sind in handliche Kategorien (z.B. *E-Government*, *KI*, *Cybersicherheit*) gruppiert. Man kann zu jedem Thema nachlesen, welche Partei sich wie (pro, contra, neutral) positioniert hat, inklusive der wichtigsten Zitate aus dem Originalprotokoll.
- **Sitzungen:** Eine chronologische Liste aller verarbeiteten Sitzungen. Ein Klick öffnet ein Detail-Panel mit den konkreten Beschlüssen (inklusive Abstimmungsergebnissen) und verlinkt direkt auf die PDF-Originaldokumente des Berliner Parlaments.

## Technische Architektur

Dieses Projekt besteht aus zwei Hauptkomponenten:
1.  **Python Data-Pipeline (isoliert in Docker):**
    Lädt die Rohdokumente vom Parlament herunter, extrahiert die Texte aus den PDFs und lässt eine Large Language Model (Gemini 2.5 Pro) die komplexen Textanalysen durchführen. Anschließend werden die Daten aggregiert und für das Frontend als fertige JSON-Dateien (`public/data/*.json`) abgelegt.
2.  **React/Vite Frontend (`src/`):**
    Eine schlanke, leichtgewichtige Single Page Application (SPA), die ohne Laufzeit-Backend auskommt. Alle berechneten JSON-Daten werden direkt im Frontend gerendert und gefiltert. Die UI basiert auf Tailwind CSS und Shadcn.

### Data-Pipeline ausführen (via Docker)

Um neue Sitzungen vom Berliner Parlament hinzuzufügen, muss die Daten-Pipeline erneut ausgeführt werden. Dank Docker ist dafür keine lokale Python-Installation mehr nötig.

**Voraussetzungen:**
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) muss installiert und gestartet sein.
- Lege eine `.env` Datei im Hauptverzeichnis mit deinem Gemini API Key an (`GEMINI_API_KEY="dein-key"`).

Führe dann die komplette Pipeline mit einem einzigen Befehl aus:
```bash
docker-compose run --rm data-pipeline
```
Der Container wird gebaut, die Skripte ausgeführt und die neuen JSON-Dateien direkt in dein `public/data` Verzeichnis geschrieben.

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