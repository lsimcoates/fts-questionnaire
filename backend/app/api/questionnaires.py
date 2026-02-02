from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any, Dict, Optional, List
from datetime import datetime
import os
import json
import uuid
from fastapi.responses import Response
from app.services.pdf import render_questionnaire_html, html_to_pdf_bytes

router = APIRouter()

# File storage:
# backend/app/api/questionnaires.py  --> backend/app/data/questionnaires/
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data", "questionnaires")
INDEX_FILE = os.path.join(DATA_DIR, "index.json")


# -----------------------------
# Storage helpers
# -----------------------------
def ensure_storage():
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(INDEX_FILE):
        with open(INDEX_FILE, "w", encoding="utf-8") as f:
            json.dump([], f)


def load_index() -> List[Dict[str, Any]]:
    ensure_storage()
    with open(INDEX_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_index(rows: List[Dict[str, Any]]):
    ensure_storage()
    with open(INDEX_FILE, "w", encoding="utf-8") as f:
        json.dump(rows, f, indent=2)


def q_path(qid: str) -> str:
    return os.path.join(DATA_DIR, f"{qid}.json")


def normalize_case(case_number: Optional[str]) -> str:
    return (case_number or "").strip()


def next_version_for_case(case_number: str) -> int:
    case_number = normalize_case(case_number)
    idx = load_index()
    versions = [
        int(row.get("version", 0))
        for row in idx
        if row.get("case_number") == case_number
    ]
    return (max(versions) + 1) if versions else 1


def now_iso() -> str:
    return datetime.utcnow().isoformat()


# -----------------------------
# Request model
# -----------------------------
class QuestionnairePayload(BaseModel):
    data: Dict[str, Any]
    status: Optional[str] = None  # "draft" | "submitted"


# -----------------------------
# Routes
# -----------------------------
@router.post("/questionnaires")
def create_questionnaire(payload: QuestionnairePayload):
    """
    Create a new questionnaire draft.
    Requires case_number in payload.data.
    Assigns version = next integer per case_number.
    """
    ensure_storage()
    case_number = normalize_case(payload.data.get("case_number"))

    if not case_number:
        raise HTTPException(status_code=422, detail="case_number is required")

    qid = uuid.uuid4().hex
    created_at = now_iso()
    version = next_version_for_case(case_number)

    record = {
        "id": qid,
        "case_number": case_number,
        "version": version,
        "status": payload.status or "draft",
        "created_at": created_at,
        "updated_at": created_at,
        "submitted_at": None,
        "redo_of_id": None,
        "data": payload.data,
    }

    with open(q_path(qid), "w", encoding="utf-8") as f:
        json.dump(record, f, indent=2)

    idx = load_index()
    idx.append(
        {
            "id": qid,
            "case_number": case_number,
            "version": version,
            "status": record["status"],
            "created_at": created_at,
            "updated_at": created_at,
            "submitted_at": None,
            "redo_of_id": None,
        }
    )
    save_index(idx)

    return {"id": qid, "case_number": case_number, "version": version}


@router.get("/questionnaires")
def list_questionnaires():
    """
    Returns the lightweight index for dashboards (fast).
    """
    return load_index()


@router.get("/questionnaires/{qid}")
def get_questionnaire(qid: str):
    """
    Returns the full record including data.
    """
    path = q_path(qid)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Not found")

    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


@router.put("/questionnaires/{qid}")
def update_questionnaire(qid: str, payload: QuestionnairePayload):
    """
    Update questionnaire data (draft-only).
    case_number is required and cannot be changed after creation.
    """
    path = q_path(qid)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Not found")

    with open(path, "r", encoding="utf-8") as f:
        record = json.load(f)

    if record.get("status") == "submitted":
        raise HTTPException(
            status_code=400,
            detail="Questionnaire is finalized and cannot be edited.",
        )

    incoming_case = normalize_case(payload.data.get("case_number"))
    if not incoming_case:
        raise HTTPException(status_code=422, detail="case_number is required")

    # Keep versioning sane: do not allow case_number change after creation
    if incoming_case != normalize_case(record.get("case_number")):
        raise HTTPException(
            status_code=400,
            detail="case_number cannot be changed after creation.",
        )

    record["data"] = payload.data
    record["updated_at"] = now_iso()

    with open(path, "w", encoding="utf-8") as f:
        json.dump(record, f, indent=2)

    idx = load_index()
    for row in idx:
        if row["id"] == qid:
            row["updated_at"] = record["updated_at"]
            row["status"] = record["status"]
            row["case_number"] = record.get("case_number")
            row["version"] = record.get("version")
    save_index(idx)

    return {"ok": True}


@router.post("/questionnaires/{qid}/finalize")
def finalize_questionnaire(qid: str):
    """
    Mark a questionnaire submitted/locked.
    """
    path = q_path(qid)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Not found")

    with open(path, "r", encoding="utf-8") as f:
        record = json.load(f)

    # Ensure case_number still present
    case_number = normalize_case(record.get("case_number") or record.get("data", {}).get("case_number"))
    if not case_number:
        raise HTTPException(status_code=422, detail="case_number is required")

    record["case_number"] = case_number
    record["status"] = "submitted"
    record["submitted_at"] = now_iso()
    record["updated_at"] = record["submitted_at"]

    with open(path, "w", encoding="utf-8") as f:
        json.dump(record, f, indent=2)

    idx = load_index()
    for row in idx:
        if row["id"] == qid:
            row["status"] = "submitted"
            row["submitted_at"] = record["submitted_at"]
            row["updated_at"] = record["updated_at"]
            row["case_number"] = record.get("case_number")
            row["version"] = record.get("version")
    save_index(idx)

    return {"ok": True, "id": qid, "case_number": record["case_number"], "version": record["version"]}


@router.post("/questionnaires/{qid}/redo")
def redo_questionnaire(qid: str):
    """
    Create a new DRAFT version for the same case_number,
    copying the old data as a starting point.
    """
    old_path = q_path(qid)
    if not os.path.exists(old_path):
        raise HTTPException(status_code=404, detail="Not found")

    with open(old_path, "r", encoding="utf-8") as f:
        old = json.load(f)

    case_number = normalize_case(old.get("case_number") or old.get("data", {}).get("case_number"))
    if not case_number:
        raise HTTPException(status_code=400, detail="Original record has no case_number")

    ensure_storage()
    new_id = uuid.uuid4().hex
    created_at = now_iso()
    version = next_version_for_case(case_number)

    new_record = {
        "id": new_id,
        "case_number": case_number,
        "version": version,
        "status": "draft",
        "created_at": created_at,
        "updated_at": created_at,
        "submitted_at": None,
        "redo_of_id": qid,
        "data": old.get("data", {}),
    }

    with open(q_path(new_id), "w", encoding="utf-8") as f:
        json.dump(new_record, f, indent=2)

    idx = load_index()
    idx.append(
        {
            "id": new_id,
            "case_number": case_number,
            "version": version,
            "status": "draft",
            "created_at": created_at,
            "updated_at": created_at,
            "submitted_at": None,
            "redo_of_id": qid,
        }
    )
    save_index(idx)

    return {"id": new_id, "case_number": case_number, "version": version, "redo_of_id": qid}

@router.post("/questionnaires/{qid}/pdf")
def generate_pdf(qid: str):
    path = q_path(qid)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Not found")

    with open(path, "r", encoding="utf-8") as f:
        record = json.load(f)

    html = render_questionnaire_html(record.get("data", {}))
    pdf_bytes = html_to_pdf_bytes(html)

    filename = f"{record.get('case_number','case')}_v{record.get('version','')}_{qid}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

@router.delete("/questionnaires/{qid}")
def delete_questionnaire(qid: str):
    """
    Delete a questionnaire record:
    - removes the JSON file
    - removes the row from index.json
    """
    ensure_storage()

    path = q_path(qid)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Not found")

    # Optional rule: prevent deleting submitted records
    # (comment this out if you want to allow delete always)
    with open(path, "r", encoding="utf-8") as f:
        record = json.load(f)
    if record.get("status") == "submitted":
        raise HTTPException(status_code=400, detail="Submitted records cannot be deleted.")

    # Remove the file
    try:
        os.remove(path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {e}")

    # Remove from index
    idx = load_index()
    new_idx = [row for row in idx if row.get("id") != qid]
    save_index(new_idx)

    return {"ok": True, "id": qid}
