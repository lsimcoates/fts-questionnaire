# backend/app/api/admin.py

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from typing import Any, Dict, List, Optional
from datetime import datetime
import os
import json
import csv
import io
import secrets
import string

from pydantic import BaseModel, EmailStr

from app.auth.router import get_current_user
from app.auth.security import hash_password
from app.auth.config import ALLOWED_EMAIL_DOMAIN

# ✅ DB access for managing users (make sure these paths match your project)
from sqlmodel import select
from app.auth.db import get_session, User

# IMPORTANT: This matches your questionnaires JSON storage
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data", "questionnaires")
INDEX_FILE = os.path.join(DATA_DIR, "index.json")

router = APIRouter(prefix="/admin", tags=["admin"])


# -----------------------------
# Auth helpers
# -----------------------------
def _get_role(user):
    # supports dict OR pydantic model
    if isinstance(user, dict):
        return user.get("role")
    return getattr(user, "role", None)


def _get_user_id(user):
    if isinstance(user, dict):
        return user.get("id")
    return getattr(user, "id", None)


def require_admin(user=Depends(get_current_user)):
    role = _get_role(user)
    if role not in ("admin", "superadmin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return user


def require_superadmin(user=Depends(get_current_user)):
    role = _get_role(user)
    if role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superadmin access required",
        )
    return user


# -----------------------------
# User creation helpers (NEW)
# -----------------------------
def _require_domain(email: str):
    """
    Reuse the same domain restriction concept as auth router.
    """
    domain = email.split("@")[-1].lower().strip()
    if domain != ALLOWED_EMAIL_DOMAIN.lower():
        raise HTTPException(
            status_code=400,
            detail=f"Email must end with @{ALLOWED_EMAIL_DOMAIN}",
        )


def _generate_temp_password(length: int = 12) -> str:
    """
    Simple temp password generator (no symbols to avoid copy/paste issues).
    """
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


class AdminCreateUserPayload(BaseModel):
    email: EmailStr
    role: str = "user"  # "user" | "admin" (superadmin blocked here)


@router.post("/users")
def admin_create_user(payload: AdminCreateUserPayload, user=Depends(require_admin)):
    """
    Admin creates a user (no email flows).
    Returns a one-time temporary password for the admin to share securely.

    Safeguards:
      - Enforces ALLOWED_EMAIL_DOMAIN
      - Disallows creating superadmin via this endpoint
    """
    email = payload.email.lower().strip()

    _require_domain(email)

    if payload.role not in ("user", "admin"):
        raise HTTPException(status_code=400, detail="role must be 'user' or 'admin'")

    temp_password = _generate_temp_password()

    with get_session() as session:
        existing = session.exec(select(User).where(User.email == email)).first()
        if existing:
            raise HTTPException(status_code=400, detail="Account already exists")

        new_user = User(
            email=email,
            password_hash=hash_password(temp_password),
            role=payload.role,
            is_active=True,
            # If your User model still has these fields, they can remain,
            # but they are no longer used when you remove email verification:
            # is_verified=True,
        )

        session.add(new_user)
        session.commit()
        session.refresh(new_user)

    return {
        "ok": True,
        "id": new_user.id,
        "email": new_user.email,
        "role": new_user.role,
        "temp_password": temp_password,  # show once to admin
    }


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


def q_path(qid: str) -> str:
    return os.path.join(DATA_DIR, f"{qid}.json")


def parse_iso(dt: Optional[str]) -> Optional[datetime]:
    """
    Accepts either full ISO datetime or YYYY-MM-DD.
    Returns datetime (naive or aware depending on stored format).
    """
    if not dt:
        return None
    try:
        # handle trailing Z
        return datetime.fromisoformat(dt.replace("Z", "+00:00"))
    except Exception:
        return None


def parse_date_as_day_start(s: Optional[str]) -> Optional[datetime]:
    """
    UI date input gives YYYY-MM-DD. Interpret as start of day.
    """
    if not s:
        return None
    d = parse_iso(s)
    if not d:
        return None
    return d.replace(hour=0, minute=0, second=0, microsecond=0)


def parse_date_as_day_end(s: Optional[str]) -> Optional[datetime]:
    """
    UI date input gives YYYY-MM-DD. Interpret as end of day (23:59:59.999999),
    so 'Submitted to' includes the entire day.
    """
    if not s:
        return None
    d = parse_iso(s)
    if not d:
        return None
    return d.replace(hour=23, minute=59, second=59, microsecond=999999)


# -----------------------------
# Data sanitization
# -----------------------------
SIGNATURE_KEYS = {
    "client_signature_png",
    "collector_signature_png",
    "refusal_signature_png",
}


def strip_signatures(data: Dict[str, Any]) -> Dict[str, Any]:
    """Remove signature PNGs from the questionnaire 'data' payload."""
    if not isinstance(data, dict):
        return data

    clean = dict(data)
    for k in SIGNATURE_KEYS:
        if k in clean:
            clean[k] = ""
    return clean


# -----------------------------
# Filtering helpers
# -----------------------------
def norm(s: Any) -> str:
    return ("" if s is None else str(s)).strip()


def norm_lower(s: Any) -> str:
    return norm(s).lower()


def matches_yesno(value: Any, expected: Optional[str]) -> bool:
    if not expected:
        return True
    return norm(value) == expected


def matches_text(value: Any, expected: Optional[str]) -> bool:
    if not expected:
        return True
    return norm(value) == expected


def matches_drug_used(data: Dict[str, Any], drug_name: Optional[str]) -> bool:
    """
    If drug_name provided, must find at least one drug_use row where:
      drug_name matches AND status == "used" (case-insensitive)
    """
    if not drug_name:
        return True

    du = data.get("drug_use") or []
    if not isinstance(du, list):
        return False

    for it in du:
        if not isinstance(it, dict):
            continue
        name_ok = norm(it.get("drug_name")) == drug_name
        status_ok = norm_lower(it.get("status")) == "used"
        if name_ok and status_ok:
            return True
    return False


def matches_drug_exposed(data: Dict[str, Any], drug_name: Optional[str]) -> bool:
    """
    If drug_name provided, must find at least one drug_exposure row where:
      drug_name matches AND status == "exposed" (case-insensitive)
    """
    if not drug_name:
        return True

    de = data.get("drug_exposure") or []
    if not isinstance(de, list):
        return False

    for it in de:
        if not isinstance(it, dict):
            continue
        name_ok = norm(it.get("drug_name")) == drug_name
        status_ok = norm_lower(it.get("status")) == "exposed"
        if name_ok and status_ok:
            return True
    return False


def record_passes_filters(record: Dict[str, Any], params: Dict[str, str]) -> bool:
    """
    record is full json file:
      { id, status, submitted_at, data:{...} }
    params are query params from frontend.
    """

    # Only submitted records for export
    if norm_lower(record.get("status")) != "submitted":
        return False

    submitted_at = parse_iso(record.get("submitted_at"))
    if not submitted_at:
        return False

    # Date range
    submitted_from = parse_date_as_day_start(params.get("submitted_from"))
    submitted_to = parse_date_as_day_end(params.get("submitted_to"))

    if submitted_from and submitted_at < submitted_from:
        return False
    if submitted_to and submitted_at > submitted_to:
        return False

    data = record.get("data") or {}
    if not isinstance(data, dict):
        data = {}

    # Simple exact-match fields
    if not matches_text(data.get("natural_hair_colour"), params.get("natural_hair_colour")):
        return False
    if not matches_text(data.get("sex_at_birth"), params.get("sex_at_birth")):
        return False
    if not matches_text(data.get("testing_type"), params.get("testing_type")):
        return False

    # Influencing yes/no fields
    if not matches_yesno(data.get("hair_dyed_bleached"), params.get("hair_dyed_bleached")):
        return False
    if not matches_yesno(data.get("hair_thermal_applications"), params.get("hair_thermal_applications")):
        return False
    if not matches_yesno(data.get("frequent_swimming"), params.get("frequent_swimming")):
        return False
    if not matches_yesno(data.get("frequent_sunbeds"), params.get("frequent_sunbeds")):
        return False
    if not matches_yesno(data.get("frequent_sprays_on_sites"), params.get("frequent_sprays_on_sites")):
        return False
    if not matches_yesno(data.get("pregnant_last_12_months"), params.get("pregnant_last_12_months")):
        return False
    if not matches_yesno(data.get("hair_cut_in_last_12_months"), params.get("hair_cut_in_last_12_months")):
        return False
    if not matches_yesno(data.get("hair_removed_body_hair_last_12_months"), params.get("hair_removed_body_hair_last_12_months")):
        return False

    # Drug Used filter (implies status == used)
    if not matches_drug_used(data, params.get("drug_used_name")):
        return False

    # Drug Exposed filter (implies status == exposed)
    if not matches_drug_exposed(data, params.get("drug_exposed_name")):
        return False

    return True


# -----------------------------
# CSV flattening
# -----------------------------
def flatten(obj: Any, prefix: str = "", out: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Flattens nested JSON into dot keys. Lists are JSON-stringified.
    """
    if out is None:
        out = {}

    if isinstance(obj, dict):
        for k, v in obj.items():
            key = f"{prefix}.{k}" if prefix else str(k)
            flatten(v, key, out)
    elif isinstance(obj, list):
        out[prefix] = json.dumps(obj, ensure_ascii=False)
    else:
        out[prefix] = obj

    return out


# -----------------------------
# User counts (drafts/submissions) from JSON storage
# -----------------------------
def questionnaire_owner_key(record: Dict[str, Any]) -> Optional[str]:
    """
    Links a questionnaire to a user.
    Prefer record["user_id"]; fallback to record["user_email"].
    """
    uid = record.get("user_id")
    if uid is not None:
        return f"user_id:{uid}"

    email = record.get("user_email")
    if email:
        return f"user_email:{str(email).strip().lower()}"

    return None


def build_user_counts() -> Dict[str, Dict[str, int]]:
    """
    Scans all questionnaire JSON files and returns per-user counts.
    Requires each questionnaire JSON to include user_id or user_email.
    """
    ensure_storage()
    idx = load_index()

    counts: Dict[str, Dict[str, int]] = {}

    for row in idx:
        qid = row.get("id")
        if not qid:
            continue

        path = q_path(qid)
        if not os.path.exists(path):
            continue

        try:
            with open(path, "r", encoding="utf-8") as f:
                record = json.load(f)
        except Exception:
            continue

        owner = questionnaire_owner_key(record)
        if not owner:
            continue

        st = norm_lower(record.get("status"))
        if st not in ("draft", "submitted"):
            continue

        if owner not in counts:
            counts[owner] = {"drafts": 0, "submissions": 0}

        if st == "draft":
            counts[owner]["drafts"] += 1
        elif st == "submitted":
            counts[owner]["submissions"] += 1

    return counts


# -----------------------------
# 1) OPTIONS ENDPOINT (DROPDOWNS)
# -----------------------------
@router.get("/export/options")
def export_options(user=Depends(require_admin)):
    """
    Returns dropdown option values derived from SUBMITTED questionnaires only.
    """
    ensure_storage()
    idx = load_index()
    idx = [r for r in idx if norm_lower(r.get("status")) == "submitted"]

    hair_colours = set()
    sexes = set()
    testing_types = set()

    dyed_bleached_vals = set()
    thermal_vals = set()
    swimming_vals = set()
    sunbeds_vals = set()
    sprays_vals = set()
    pregnant_vals = set()
    hair_cut_vals = set()
    body_hair_removed_vals = set()

    drug_use_used_names = set()
    drug_exposure_exposed_names = set()

    def add_nonempty(s, target):
        if s is None:
            return
        v = norm(s)
        if v:
            target.add(v)

    def is_used_status(s: Optional[str]) -> bool:
        return norm_lower(s) == "used"

    def is_exposed_status(s: Optional[str]) -> bool:
        return norm_lower(s) == "exposed"

    for row in idx:
        path = q_path(row["id"])
        try:
            with open(path, "r", encoding="utf-8") as f:
                record = json.load(f)
        except Exception:
            continue

        data = record.get("data") or {}

        add_nonempty(data.get("natural_hair_colour"), hair_colours)
        add_nonempty(data.get("sex_at_birth"), sexes)
        add_nonempty(data.get("testing_type"), testing_types)

        add_nonempty(data.get("hair_dyed_bleached"), dyed_bleached_vals)
        add_nonempty(data.get("hair_thermal_applications"), thermal_vals)
        add_nonempty(data.get("frequent_swimming"), swimming_vals)
        add_nonempty(data.get("frequent_sunbeds"), sunbeds_vals)
        add_nonempty(data.get("frequent_sprays_on_sites"), sprays_vals)
        add_nonempty(data.get("pregnant_last_12_months"), pregnant_vals)
        add_nonempty(data.get("hair_cut_in_last_12_months"), hair_cut_vals)
        add_nonempty(data.get("hair_removed_body_hair_last_12_months"), body_hair_removed_vals)

        # Drug use: only include names where status == "used"
        du = data.get("drug_use") or []
        if isinstance(du, list):
            for it in du:
                if isinstance(it, dict) and is_used_status(it.get("status")):
                    add_nonempty(it.get("drug_name"), drug_use_used_names)

        # Drug exposure: only include names where status == "exposed"
        de = data.get("drug_exposure") or []
        if isinstance(de, list):
            for it in de:
                if isinstance(it, dict) and is_exposed_status(it.get("status")):
                    add_nonempty(it.get("drug_name"), drug_exposure_exposed_names)

    return {
        "natural_hair_colours": sorted(hair_colours),
        "sex_at_birth": sorted(sexes),
        "testing_types": sorted(testing_types),

        "hair_dyed_bleached": sorted(dyed_bleached_vals),
        "hair_thermal_applications": sorted(thermal_vals),
        "frequent_swimming": sorted(swimming_vals),
        "frequent_sunbeds": sorted(sunbeds_vals),
        "frequent_sprays_on_sites": sorted(sprays_vals),
        "pregnant_last_12_months": sorted(pregnant_vals),
        "hair_cut_in_last_12_months": sorted(hair_cut_vals),
        "hair_removed_body_hair_last_12_months": sorted(body_hair_removed_vals),

        "drug_use_used_names": sorted(drug_use_used_names),
        "drug_exposure_exposed_names": sorted(drug_exposure_exposed_names),
    }


# -----------------------------
# 2) EXPORT JSON (submitted only, signatures removed)
# -----------------------------
@router.get("/export/json")
def export_json(
    user=Depends(require_admin),
    submitted_from: Optional[str] = None,
    submitted_to: Optional[str] = None,
    natural_hair_colour: Optional[str] = None,
    sex_at_birth: Optional[str] = None,
    testing_type: Optional[str] = None,

    hair_dyed_bleached: Optional[str] = None,
    hair_thermal_applications: Optional[str] = None,
    frequent_swimming: Optional[str] = None,
    frequent_sunbeds: Optional[str] = None,
    frequent_sprays_on_sites: Optional[str] = None,
    pregnant_last_12_months: Optional[str] = None,
    hair_cut_in_last_12_months: Optional[str] = None,
    hair_removed_body_hair_last_12_months: Optional[str] = None,

    drug_used_name: Optional[str] = None,
    drug_exposed_name: Optional[str] = None,
):
    params = {
        "submitted_from": submitted_from or "",
        "submitted_to": submitted_to or "",
        "natural_hair_colour": natural_hair_colour or "",
        "sex_at_birth": sex_at_birth or "",
        "testing_type": testing_type or "",

        "hair_dyed_bleached": hair_dyed_bleached or "",
        "hair_thermal_applications": hair_thermal_applications or "",
        "frequent_swimming": frequent_swimming or "",
        "frequent_sunbeds": frequent_sunbeds or "",
        "frequent_sprays_on_sites": frequent_sprays_on_sites or "",
        "pregnant_last_12_months": pregnant_last_12_months or "",
        "hair_cut_in_last_12_months": hair_cut_in_last_12_months or "",
        "hair_removed_body_hair_last_12_months": hair_removed_body_hair_last_12_months or "",

        "drug_used_name": drug_used_name or "",
        "drug_exposed_name": drug_exposed_name or "",
    }

    # Debug (safe to leave in while testing)
    print("=== EXPORT JSON HIT ===", params)

    ensure_storage()
    idx = [r for r in load_index() if norm_lower(r.get("status")) == "submitted"]

    out_records = []
    for row in idx:
        path = q_path(row["id"])
        if not os.path.exists(path):
            continue
        try:
            with open(path, "r", encoding="utf-8") as f:
                record = json.load(f)
        except Exception:
            continue

        if not record_passes_filters(record, params):
            continue

        clean = dict(record)
        clean["data"] = strip_signatures(clean.get("data") or {})
        out_records.append(clean)

    payload = json.dumps(out_records, indent=2, ensure_ascii=False).encode("utf-8")
    print("EXPORT JSON count:", len(out_records), "bytes:", len(payload))

    return Response(
        content=payload,
        media_type="application/json; charset=utf-8",
        headers={
            "Content-Disposition": 'attachment; filename="submitted_questionnaires.json"',
            "X-Export-Count": str(len(out_records)),
        },
    )


# -----------------------------
# 3) EXPORT CSV (submitted only, ALL fields, signatures removed)
# -----------------------------
@router.get("/export/csv")
def export_csv(
    user=Depends(require_admin),
    submitted_from: Optional[str] = None,
    submitted_to: Optional[str] = None,
    natural_hair_colour: Optional[str] = None,
    sex_at_birth: Optional[str] = None,
    testing_type: Optional[str] = None,

    hair_dyed_bleached: Optional[str] = None,
    hair_thermal_applications: Optional[str] = None,
    frequent_swimming: Optional[str] = None,
    frequent_sunbeds: Optional[str] = None,
    frequent_sprays_on_sites: Optional[str] = None,
    pregnant_last_12_months: Optional[str] = None,
    hair_cut_in_last_12_months: Optional[str] = None,
    hair_removed_body_hair_last_12_months: Optional[str] = None,

    drug_used_name: Optional[str] = None,
    drug_exposed_name: Optional[str] = None,
):
    params = {
        "submitted_from": submitted_from or "",
        "submitted_to": submitted_to or "",
        "natural_hair_colour": natural_hair_colour or "",
        "sex_at_birth": sex_at_birth or "",
        "testing_type": testing_type or "",

        "hair_dyed_bleached": hair_dyed_bleached or "",
        "hair_thermal_applications": hair_thermal_applications or "",
        "frequent_swimming": frequent_swimming or "",
        "frequent_sunbeds": frequent_sunbeds or "",
        "frequent_sprays_on_sites": frequent_sprays_on_sites or "",
        "pregnant_last_12_months": pregnant_last_12_months or "",
        "hair_cut_in_last_12_months": hair_cut_in_last_12_months or "",
        "hair_removed_body_hair_last_12_months": hair_removed_body_hair_last_12_months or "",

        "drug_used_name": drug_used_name or "",
        "drug_exposed_name": drug_exposed_name or "",
    }

    print("=== EXPORT CSV HIT ===", params)

    ensure_storage()
    idx = [r for r in load_index() if norm_lower(r.get("status")) == "submitted"]

    rows: List[Dict[str, Any]] = []
    all_keys = set()

    # Always include these base columns so CSV isn't "empty"
    base_fields = [
        "id",
        "case_number",
        "version",
        "status",
        "created_at",
        "updated_at",
        "submitted_at",
        "redo_of_id",
    ]
    all_keys.update(base_fields)

    for row in idx:
        path = q_path(row["id"])
        if not os.path.exists(path):
            continue
        try:
            with open(path, "r", encoding="utf-8") as f:
                record = json.load(f)
        except Exception:
            continue

        if not record_passes_filters(record, params):
            continue

        clean_data = strip_signatures(record.get("data") or {})

        flat = {
            "id": record.get("id"),
            "case_number": record.get("case_number"),
            "version": record.get("version"),
            "status": record.get("status"),
            "created_at": record.get("created_at"),
            "updated_at": record.get("updated_at"),
            "submitted_at": record.get("submitted_at"),
            "redo_of_id": record.get("redo_of_id"),
        }

        flat_data = flatten(clean_data)
        flat.update({f"data.{k}": v for k, v in flat_data.items()})

        rows.append(flat)
        all_keys.update(flat.keys())

    fieldnames = sorted(all_keys)

    out = io.StringIO()
    writer = csv.DictWriter(out, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()
    for r in rows:
        writer.writerow({k: r.get(k, "") for k in fieldnames})

    csv_bytes = out.getvalue().encode("utf-8")
    print("EXPORT CSV count:", len(rows), "bytes:", len(csv_bytes))

    return Response(
        content=csv_bytes,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": 'attachment; filename="submitted_questionnaires.csv"',
            "X-Export-Count": str(len(rows)),
        },
    )


# ============================================================
# ✅ Users table for Admin Tools (list / promote / delete)
# ============================================================

class RoleUpdate(BaseModel):
    role: str  # "user" or "admin"

class CreateUserPayload(BaseModel):
    email: EmailStr
    role: str = "user"  # user | admin


def _require_domain(email: str):
    domain = email.split("@")[-1].lower().strip()
    if domain != ALLOWED_EMAIL_DOMAIN.lower():
        raise HTTPException(
            status_code=400,
            detail=f"Email must end with @{ALLOWED_EMAIL_DOMAIN}",
        )


def _generate_temp_password(length: int = 14) -> str:
    # Avoid ambiguous characters
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    return "".join(secrets.choice(alphabet) for _ in range(length))


@router.get("/users")
def admin_list_users(user=Depends(require_admin)):
    """
    List all users for admin tools table.
    """
    with get_session() as session:
        users = session.exec(select(User).order_by(User.id.desc())).all()

        return [
            {
                "id": u.id,
                "email": u.email,
                "role": u.role,
                "is_active": u.is_active,
                "created_at": getattr(u, "created_at", None),
            }
            for u in users
        ]

@router.post("/users")
def admin_create_user(payload: CreateUserPayload, user=Depends(require_admin)):
    """
    Create a user with a generated temporary password.
    - Admins can create users/admins (but not superadmin)
    - Email domain restricted
    - Marks users as verified because email verification is removed
    """
    email = payload.email.strip().lower()
    _require_domain(email)

    if payload.role not in ("user", "admin"):
        raise HTTPException(status_code=400, detail="role must be 'user' or 'admin'")

    temp_password = _generate_temp_password()

    with get_session() as session:
        existing = session.exec(select(User).where(User.email == email)).first()
        if existing:
            raise HTTPException(status_code=400, detail="Account already exists")

        u = User(
            email=email,
            password_hash=hash_password(temp_password),
            role=payload.role,
            is_active=True,
            is_verified=True,   # ✅ since we're removing email verification
            verified_at=datetime.utcnow().isoformat(),
        )
        session.add(u)
        session.commit()
        session.refresh(u)

        return {
            "ok": True,
            "id": u.id,
            "email": u.email,
            "role": u.role,
            "temp_password": temp_password,
        }

@router.patch("/users/{user_id}/role")
def admin_update_user_role(
    user_id: int,
    payload: RoleUpdate,
    user=Depends(require_admin),
):
    """
    Promote/demote a user:
      - Allowed roles: user <-> admin
      - Not allowed: setting superadmin via this endpoint
      - Protects superadmin from modification
      - Prevents changing your own role (safety)
    """
    if payload.role not in ("user", "admin"):
        raise HTTPException(status_code=400, detail="role must be 'user' or 'admin'")

    requester_id = user.get("id") if isinstance(user, dict) else getattr(user, "id", None)

    with get_session() as session:
        target = session.get(User, user_id)
        if not target:
            raise HTTPException(status_code=404, detail="User not found")

        if target.role == "superadmin":
            raise HTTPException(status_code=403, detail="Cannot modify superadmin")

        if requester_id == target.id:
            raise HTTPException(status_code=400, detail="Cannot change your own role")

        target.role = payload.role
        session.add(target)
        session.commit()
        session.refresh(target)

        return {"ok": True, "id": target.id, "role": target.role}


@router.delete("/users/{user_id}")
def admin_delete_user(
    user_id: int,
    user=Depends(require_admin),
):
    """
    Delete a user with safeguards:
      - cannot delete superadmin
      - cannot delete yourself
      - optional: only superadmin can delete admins
    """
    requester_id = user.get("id") if isinstance(user, dict) else getattr(user, "id", None)
    requester_role = user.get("role") if isinstance(user, dict) else getattr(user, "role", None)

    with get_session() as session:
        target = session.get(User, user_id)
        if not target:
            raise HTTPException(status_code=404, detail="User not found")

        if target.role == "superadmin":
            raise HTTPException(status_code=403, detail="Cannot delete superadmin")

        if requester_id == target.id:
            raise HTTPException(status_code=400, detail="Cannot delete your own account")

        # Optional stricter rule: only superadmin can delete admins
        if requester_role != "superadmin" and target.role == "admin":
            raise HTTPException(status_code=403, detail="Only superadmin can delete admins")

        session.delete(target)
        session.commit()

        return {"ok": True}
