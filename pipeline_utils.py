"""Shared helpers for the DiDat data pipeline."""

from __future__ import annotations

import hashlib
import re
from typing import Optional

VALID_CATEGORIES = frozenset(
    {
        "Bürgerdienste & Digitale Anträge",
        "IT-Modernisierung & Infrastruktur",
        "Datenschutz & Grundrechte",
        "Informationsfreiheit & Transparenz",
        "Künstliche Intelligenz (KI)",
        "Cybersicherheit & Resilienz",
        "Haushalt & Steuerung",
        "Digitale Gesetze & Strategien",
    }
)

VALID_PARTIES = frozenset({"SPD", "CDU", "Grüne", "FDP", "Linke", "AfD"})
VALID_STANCES = frozenset({"pro", "contra", "neutral", "keine Aussage"})
VALID_RESULTS = frozenset(
    {"angenommen", "abgelehnt", "vertagt", "zur Kenntnis genommen"}
)
VALID_TRENDS = frozenset({"steigend", "fallend", "konstant"})

DEFAULT_CATEGORY = "IT-Modernisierung & Infrastruktur"
CUTOFF_DATE = "2022-01-26"


def parse_session_number(raw: str) -> Optional[str]:
    """Extract the committee session number from scraped row text."""
    match = re.match(r"^(\d+)\b", raw.strip())
    if match:
        return match.group(1)
    return None


def parse_date_from_raw(raw: str) -> Optional[str]:
    """Extract DD.MM.YYYY from scraped row text as YYYY-MM-DD (no year remapping)."""
    match = re.search(r"(\d{1,2})\.(\d{1,2})\.(\d{4})", raw)
    if not match:
        return None
    d, m, y = match.groups()
    return f"{y}-{m.zfill(2)}-{d.zfill(2)}"


def session_id_from_number(number: str) -> str:
    return f"s_{int(number):03d}"


def topic_id_from_name(name: str) -> str:
    digest = hashlib.sha1(name.encode("utf-8")).hexdigest()[:8]
    return f"t_{digest}"


def normalize_category(category: Optional[str]) -> Optional[str]:
    if not category:
        return None
    if category in VALID_CATEGORIES:
        return category
    # Light fuzzy: strip and exact match after normalize whitespace
    cleaned = " ".join(category.split())
    if cleaned in VALID_CATEGORIES:
        return cleaned
    return None


def compute_topic_trend(session_dates: list[str]) -> str:
    """Compare mention density in the earlier vs later half of the topic's timeline."""
    months = sorted({d[:7] for d in session_dates if d and len(d) >= 7})
    if len(months) < 2:
        return "konstant"

    mid = len(months) // 2
    early = set(months[:mid])
    late = set(months[mid:])
    month_list = [d[:7] for d in session_dates if d and len(d) >= 7]
    early_count = sum(1 for m in month_list if m in early)
    late_count = sum(1 for m in month_list if m in late)
    early_rate = early_count / max(len(early), 1)
    late_rate = late_count / max(len(late), 1)

    if late_rate > early_rate * 1.25:
        return "steigend"
    if early_rate > late_rate * 1.25:
        return "fallend"
    return "konstant"
