from __future__ import annotations
from typing import Any, Dict, List, Optional


def get_path(obj: Any, path: str) -> Any:
    """
    Supports dot paths like:
      "status"
      "case_number"
      "data.natural_hair_colour"
      "data.drug_use"  (returns list)
    """
    if obj is None:
        return None

    cur = obj
    for part in path.split("."):
        if cur is None:
            return None
        if isinstance(cur, dict):
            cur = cur.get(part)
        else:
            # SQLModel object -> getattr
            cur = getattr(cur, part, None)
    return cur


def _coerce_dateish(v: Any) -> Any:
    # leave strings as-is; you’ll compare ISO strings lexicographically safely if they’re full ISO
    return v


def match_op(value: Any, op: str, expected: Any) -> bool:
    if op == "eq":
        return value == expected
    if op == "neq":
        return value != expected
    if op == "contains":
        if value is None:
            return False
        return str(expected).lower() in str(value).lower()
    if op == "in":
        # expected should be list
        if expected is None:
            return False
        return value in expected
    if op == "gte":
        return _coerce_dateish(value) >= _coerce_dateish(expected)
    if op == "lte":
        return _coerce_dateish(value) <= _coerce_dateish(expected)

    raise ValueError(f"Unknown op: {op}")


def match_rule(record: Dict[str, Any], rule: Dict[str, Any]) -> bool:
    """
    Rule forms:
      {"field":"data.natural_hair_colour","op":"eq","value":"Brown"}

      {"any":{
          "field":"data.drug_use",
          "where":[
             {"field":"drug_name","op":"eq","value":"Powder Cocaine"},
             {"field":"status","op":"eq","value":"used"}
          ]
      }}
    """
    if "any" in rule:
        any_spec = rule["any"]
        arr = get_path(record, any_spec["field"]) or []
        if not isinstance(arr, list):
            return False
        where = any_spec.get("where") or []
        for item in arr:
            ok = True
            for cond in where:
                v = get_path(item, cond["field"])
                if not match_op(v, cond["op"], cond.get("value")):
                    ok = False
                    break
            if ok:
                return True
        return False

    field = rule.get("field")
    op = rule.get("op", "eq")
    expected = rule.get("value")
    v = get_path(record, field)
    return match_op(v, op, expected)


def apply_filters(
    records: List[Dict[str, Any]],
    rules: Optional[List[Dict[str, Any]]] = None,
) -> List[Dict[str, Any]]:
    rules = rules or []
    if not rules:
        return records

    out: List[Dict[str, Any]] = []
    for r in records:
        ok = True
        for rule in rules:
            if not match_rule(r, rule):
                ok = False
                break
        if ok:
            out.append(r)
    return out
