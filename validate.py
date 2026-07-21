"""Validate aggregated public/data JSON against the frontend schema rules."""

from __future__ import annotations

import json
import os
import sys

from pipeline_utils import (
    VALID_CATEGORIES,
    VALID_PARTIES,
    VALID_RESULTS,
    VALID_STANCES,
    VALID_TRENDS,
)


def _load(path: str):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def validate() -> int:
    data_dir = "public/data"
    required = ["sessions.json", "topics.json", "parties.json", "trends.json"]
    errors: list[str] = []

    for name in required:
        path = os.path.join(data_dir, name)
        if not os.path.exists(path):
            errors.append(f"Missing {path}")
            continue

    if errors:
        for e in errors:
            print(f"ERROR: {e}")
        return 1

    sessions = _load(os.path.join(data_dir, "sessions.json"))
    topics = _load(os.path.join(data_dir, "topics.json"))
    parties = _load(os.path.join(data_dir, "parties.json"))
    trends = _load(os.path.join(data_dir, "trends.json"))

    session_ids = set()
    for i, s in enumerate(sessions):
        for field in ("id", "date", "title", "pdfUrl", "type", "topics", "decisions"):
            if field not in s:
                errors.append(f"sessions[{i}] missing field {field}")
        sid = s.get("id")
        if sid in session_ids:
            errors.append(f"Duplicate session id {sid}")
        session_ids.add(sid)
        if s.get("type") not in {"Einladung", "Beschlussprotokoll"}:
            errors.append(f"sessions[{i}] invalid type {s.get('type')!r}")
        for j, d in enumerate(s.get("decisions") or []):
            if d.get("result") not in VALID_RESULTS:
                errors.append(
                    f"sessions[{i}].decisions[{j}] invalid result {d.get('result')!r}"
                )

    topic_ids = set()
    for i, t in enumerate(topics):
        for field in ("id", "name", "category", "sessionIds", "trend", "partyPositions"):
            if field not in t:
                errors.append(f"topics[{i}] missing field {field}")
        tid = t.get("id")
        if tid in topic_ids:
            errors.append(f"Duplicate topic id {tid}")
        topic_ids.add(tid)
        if t.get("category") not in VALID_CATEGORIES:
            errors.append(f"topics[{i}] invalid category {t.get('category')!r}")
        if t.get("trend") not in VALID_TRENDS:
            errors.append(f"topics[{i}] invalid trend {t.get('trend')!r}")
        for sid in t.get("sessionIds") or []:
            if sid not in session_ids:
                errors.append(f"topics[{i}] references unknown sessionId {sid}")
        for j, p in enumerate(t.get("partyPositions") or []):
            if p.get("party") not in VALID_PARTIES:
                errors.append(
                    f"topics[{i}].partyPositions[{j}] invalid party {p.get('party')!r}"
                )
            if p.get("stance") not in VALID_STANCES:
                errors.append(
                    f"topics[{i}].partyPositions[{j}] invalid stance {p.get('stance')!r}"
                )

    for i, group in enumerate(parties):
        if group.get("topicId") not in topic_ids:
            errors.append(f"parties[{i}] unknown topicId {group.get('topicId')}")
        for j, p in enumerate(group.get("positions") or []):
            if p.get("party") not in VALID_PARTIES:
                errors.append(f"parties[{i}].positions[{j}] invalid party")
            if p.get("stance") not in VALID_STANCES:
                errors.append(f"parties[{i}].positions[{j}] invalid stance")

    for i, tr in enumerate(trends):
        if tr.get("category") not in VALID_CATEGORIES:
            errors.append(f"trends[{i}] invalid category {tr.get('category')!r}")
        if not isinstance(tr.get("count"), int) or tr.get("count") < 0:
            errors.append(f"trends[{i}] invalid count")
        if not isinstance(tr.get("date"), str) or len(tr.get("date", "")) < 7:
            errors.append(f"trends[{i}] invalid date")

    if errors:
        print(f"Validation failed with {len(errors)} error(s):")
        for e in errors[:50]:
            print(f"  - {e}")
        if len(errors) > 50:
            print(f"  ... and {len(errors) - 50} more")
        return 1

    print(
        f"Validation OK: {len(sessions)} sessions, {len(topics)} topics, "
        f"{len(parties)} party groups, {len(trends)} trend points."
    )
    return 0


if __name__ == "__main__":
    sys.exit(validate())
