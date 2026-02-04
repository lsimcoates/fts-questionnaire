from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Any, Dict, Optional, List
from datetime import datetime
import uuid

from fastapi.responses import Response
from sqlmodel import select

from app.services.pdf import render_questionnaire_html, html_to_pdf_bytes
from app.auth.router import get_current_user
from app.auth.db import get_session
from app.questionnaires.models import Questionnaire

router = APIRouter(dependencies=[Depends(get_current_user)])


def now_iso() -> str:
    return datetime.utcnow().isoformat()


def normalize_case(case_number: Optional[str]) -> str:
    return (case_number or "").strip()


def _get_user_id(user) -> Optional[int]:
    if isinstance(user, dict):
        return user.get("id")
    return getattr(user, "id", None)


def _get_user_email(user) -> Optional[str]:
    if isinstance(user, dict):
        return user.get("email")
    return getattr(user, "email", None)


def next_version_for_case(session, case_number: str) -> int:
    case_number = normalize_case(case_number)
    # Find max version for this case_number
    existing = session.exec(
        select(Questionnaire.version)
        .where(Questionnaire.case_number == case_number)
        .order_by(Questionnaire.version.desc())
        .limit(1)
    ).first()
    return (int(existing) + 1) if existing is not None else 1


# Request model
class QuestionnairePayload(BaseModel):
    data: Dict[str, Any]
    status: Optional[str] = None  # "draft" | "submitted"


def q_to_index_row(q: Questionnaire) -> Dict[str, Any]:
    return {
        "id": q.id,
        "case_number": q.case_number,
        "version": q.version,
        "status": q.status,
        "created_at": q.created_at,
        "updated_at": q.updated_at,
        "submitted_at": q.submitted_at,
        "redo_of_id": q.redo_of_id,
    }


def q_to_full_record(q: Questionnaire) -> Dict[str, Any]:
    return {
        **q_to_index_row(q),
        "user_id": q.user_id,
        "user_email": q.user_email,
        "data": q.data or {},
    }


@router.post("/questionnaires")
def create_questionnaire(payload: QuestionnairePayload, user=Depends(get_current_user)):
    """
    Create a new questionnaire draft.
    Requires case_number in payload.data.
    Assigns version = next integer per case_number.
    """
    case_number = normalize_case(payload.data.get("case_number"))
    if not case_number:
        raise HTTPException(status_code=422, detail="case_number is required")

    with get_session() as session:
        qid = uuid.uuid4().hex
        created_at = now_iso()
        version = next_version_for_case(session, case_number)

        record_status = payload.status or "draft"
        if record_status not in ("draft", "submitted"):
            record_status = "draft"

        q = Questionnaire(
            id=qid,
            case_number=case_number,
            version=version,
            status=record_status,
            created_at=created_at,
            updated_at=created_at,
            submitted_at=(created_at if record_status == "submitted" else None),
            redo_of_id=None,
            user_id=_get_user_id(user),
            user_email=_get_user_email(user),
            data=payload.data,
        )

        session.add(q)
        session.commit()

    return {"id": qid, "case_number": case_number, "version": version}


@router.get("/questionnaires")
def list_questionnaires():
    """
    Returns the lightweight index for dashboards (fast).
    """
    with get_session() as session:
        qs = session.exec(
            select(Questionnaire).order_by(Questionnaire.created_at.desc())
        ).all()
        return [q_to_index_row(q) for q in qs]


@router.get("/questionnaires/{qid}")
def get_questionnaire(qid: str):
    """
    Returns the full record including data.
    """
    with get_session() as session:
        q = session.get(Questionnaire, qid)
        if not q:
            raise HTTPException(status_code=404, detail="Not found")
        return q_to_full_record(q)


@router.put("/questionnaires/{qid}")
def update_questionnaire(qid: str, payload: QuestionnairePayload):
    """
    Update questionnaire data (draft-only).
    case_number is required and cannot be changed after creation.
    """
    incoming_case = normalize_case(payload.data.get("case_number"))
    if not incoming_case:
        raise HTTPException(status_code=422, detail="case_number is required")

    with get_session() as session:
        q = session.get(Questionnaire, qid)
        if not q:
            raise HTTPException(status_code=404, detail="Not found")

        if q.status == "submitted":
            raise HTTPException(
                status_code=400,
                detail="Questionnaire is finalized and cannot be edited.",
            )

        if incoming_case != normalize_case(q.case_number):
            raise HTTPException(
                status_code=400,
                detail="case_number cannot be changed after creation.",
            )

        q.data = payload.data
        q.updated_at = now_iso()

        session.add(q)
        session.commit()

    return {"ok": True}


@router.post("/questionnaires/{qid}/finalize")
def finalize_questionnaire(qid: str):
    """
    Mark a questionnaire submitted/locked.
    """
    with get_session() as session:
        q = session.get(Questionnaire, qid)
        if not q:
            raise HTTPException(status_code=404, detail="Not found")

        case_number = normalize_case(q.case_number or (q.data or {}).get("case_number"))
        if not case_number:
            raise HTTPException(status_code=422, detail="case_number is required")

        ts = now_iso()
        q.case_number = case_number
        q.status = "submitted"
        q.submitted_at = ts
        q.updated_at = ts

        session.add(q)
        session.commit()

        return {"ok": True, "id": q.id, "case_number": q.case_number, "version": q.version}


@router.post("/questionnaires/{qid}/redo")
def redo_questionnaire(qid: str, user=Depends(get_current_user)):
    """
    Create a new DRAFT version for the same case_number,
    copying the old data as a starting point.
    """
    with get_session() as session:
        old = session.get(Questionnaire, qid)
        if not old:
            raise HTTPException(status_code=404, detail="Not found")

        case_number = normalize_case(old.case_number or (old.data or {}).get("case_number"))
        if not case_number:
            raise HTTPException(status_code=400, detail="Original record has no case_number")

        new_id = uuid.uuid4().hex
        created_at = now_iso()
        version = next_version_for_case(session, case_number)

        q = Questionnaire(
            id=new_id,
            case_number=case_number,
            version=version,
            status="draft",
            created_at=created_at,
            updated_at=created_at,
            submitted_at=None,
            redo_of_id=old.id,
            user_id=_get_user_id(user),
            user_email=_get_user_email(user),
            data=old.data or {},
        )

        session.add(q)
        session.commit()

        return {"id": new_id, "case_number": case_number, "version": version, "redo_of_id": old.id}


@router.post("/questionnaires/{qid}/pdf")
def generate_pdf(qid: str):
    with get_session() as session:
        q = session.get(Questionnaire, qid)
        if not q:
            raise HTTPException(status_code=404, detail="Not found")

        html = render_questionnaire_html(q.data or {})
        pdf_bytes = html_to_pdf_bytes(html)

        filename = f"{q.case_number or 'case'}_v{q.version}_{qid}.pdf"

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )


@router.delete("/questionnaires/{qid}")
def delete_questionnaire(qid: str):
    """
    Delete a questionnaire record from the DB.
    """
    with get_session() as session:
        q = session.get(Questionnaire, qid)
        if not q:
            raise HTTPException(status_code=404, detail="Not found")

        session.delete(q)
        session.commit()

    return {"ok": True, "id": qid}
