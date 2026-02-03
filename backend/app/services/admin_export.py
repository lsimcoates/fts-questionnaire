from __future__ import annotations
from typing import Any, Dict, List, Optional
import json
import csv
import io


SIGNATURE_FIELDS = [
    "client_signature_png",
    "collector_signature_png",
    "refusal_signature_png",
    "client_print_name",
    "client_signature_date",
    "collector_print_name",
    "collector_signature_date",
    "refusal_print_name",
    "refusal_signature_date",
]


def strip_signatures(record: Dict[str, Any]) -> Dict[str, Any]:
    """
    Removes signature-related fields from record["data"] if present.
    """
    out = dict(record)
    data = dict(out.get("data") or {})
    for k in SIGNATURE_FIELDS:
        if k in data:
            data.pop(k, None)
    out["data"] = data
    return out


def _safe_scalar(v: Any) -> str:
    if v is None:
        return ""
    if isinstance(v, (str, int, float, bool)):
        return str(v)
    # lists/dicts -> JSON string
    return json.dumps(v, ensure_ascii=False)


def flatten_record(record: Dict[str, Any], columns: Optional[List[str]] = None) -> Dict[str, Any]:
    """
    Returns a flat dict suitable for CSV/table.
    - Always includes: case_number, id, version, submitted_at, updated_at
    - If columns is provided: only includes those data.* columns
      Example column: "data.natural_hair_colour"
    """
    base = {
        "case_number": record.get("case_number", ""),
        "id": record.get("id", ""),
        "version": record.get("version", ""),
        "status": record.get("status", ""),
        "submitted_at": record.get("submitted_at", ""),
        "updated_at": record.get("updated_at", ""),
        "created_at": record.get("created_at", ""),
    }

    data = record.get("data") or {}

    # helpful derived columns
    used = []
    for d in (data.get("drug_use") or []):
        if (d or {}).get("status") == "used":
            used.append((d or {}).get("drug_name"))
    exposed = []
    for d in (data.get("drug_exposure") or []):
        if (d or {}).get("status") == "Exposed":
            exposed.append((d or {}).get("drug_name"))

    base["drug_use_used_list"] = ", ".join([x for x in used if x])
    base["drug_exposure_exposed_list"] = ", ".join([x for x in exposed if x])

    if columns:
        for col in columns:
            if not col.startswith("data."):
                continue
            key = col.split(".", 1)[1]  # remove "data."
            base[key] = _safe_scalar(data.get(key))
        return base

    # Default: include all top-level keys in data (except big signatures already removed upstream)
    for k, v in data.items():
        base[k] = _safe_scalar(v)

    return base


def make_csv(flat_rows: List[Dict[str, Any]]) -> str:
    if not flat_rows:
        return ""

    # union of all headers
    headers = []
    seen = set()
    for r in flat_rows:
        for k in r.keys():
            if k not in seen:
                seen.add(k)
                headers.append(k)

    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=headers, extrasaction="ignore")
    writer.writeheader()
    for r in flat_rows:
        writer.writerow(r)
    return buf.getvalue()
