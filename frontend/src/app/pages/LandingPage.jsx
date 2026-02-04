import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createQuestionnaire,
  listQuestionnaires,
  downloadQuestionnairePdf,
  getQuestionnaire,
  deleteQuestionnaire,
  authMe,
  authLogout
} from "../services/api";

const PAGE_SIZE = 10;

export default function LandingPage() {
  const navigate = useNavigate();

  const [caseNumber, setCaseNumber] = useState("");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("");

  // ✅ pagination
  const [page, setPage] = useState(1);

  // ✅ hover tracking
  const [hovered, setHovered] = useState(null);

  // ✅ user role for admin tools
  const [role, setRole] = useState(null);
  const isAdmin = role === "admin" || role === "superadmin";

  const logout = async () => {
    try {
      await authLogout(); // ✅ clears httponly cookie
    } catch {
      // ignore - still clear local state
    }

    localStorage.removeItem("fts_qid");
    setRole(null);
    navigate("/login");
  };

  const goAdminTools = () => {
    navigate("/admin-tools");
  };

  const goChangePassword = () => {
    navigate("/change-password");
  };

  const load = async () => {
    try {
      setStatus("Loading records...");
      const data = await listQuestionnaires();

      // newest first by updated_at, fallback created_at
      data.sort((a, b) => {
        const da = new Date(a.updated_at || a.created_at || 0).getTime();
        const db = new Date(b.updated_at || b.created_at || 0).getTime();
        return db - da;
      });

      setRows(data);
      setPage(1);
      setStatus("");
    } catch (e) {
      setStatus(`Failed to load records: ${e.message}`);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const me = await authMe();
        setRole(me.role);
        await load(); // ✅ only load after session confirmed
      } catch (e) {
        setRole(null);
        navigate("/login");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      String(r.case_number || "").toLowerCase().includes(q)
    );
  }, [rows, query]);

  useEffect(() => {
    setPage(1);
  }, [query]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  }, [filtered.length]);

  const safePage = Math.min(page, totalPages);

  const paged = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  const createNew = async () => {
    const cn = caseNumber.trim();
    if (!cn) {
      setStatus("Please enter a Case Number to create a new questionnaire.");
      return;
    }

    try {
      setStatus("Creating new draft...");
      const created = await createQuestionnaire({ case_number: cn, consent: "" });

      localStorage.setItem("fts_qid", created.id);

      setStatus("");
      navigate(`/questionnaire/${created.id}`);
    } catch (e) {
      setStatus(`Create failed: ${e.message}`);
    }
  };

  const openRecord = (id) => {
    localStorage.setItem("fts_qid", id);
    navigate(`/questionnaire/${id}`);
  };

  const prettyDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString();
  };

  const onGeneratePdf = async (r) => {
    try {
      setStatus("Generating PDF...");
      const blob = await downloadQuestionnairePdf(r.id);

      const filename = `Case_${r.case_number || "unknown"}_v${r.version || ""}.pdf`;
      downloadBlob(blob, filename);

      setStatus("");
    } catch (e) {
      setStatus(`PDF failed: ${e.message}`);
    }
  };

  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  // ✅ COPY: duplicates questionnaire into a new version (new draft) with signatures removed
  const onCopy = async (r) => {
    try {
      const ok = window.confirm(
        `Copy this questionnaire?\n\nCase ${r.case_number || "—"} v${r.version || ""}\n\nThis will create a NEW draft version with signatures removed.`
      );
      if (!ok) return;

      setStatus("Copying questionnaire (removing signatures)...");

      const record = await getQuestionnaire(r.id);

      // your getQuestionnaire returns { data: ... } in QuestionnairePage
      const src = record?.data ?? record;

      // clone + strip fields that should not carry over
      const payload = { ...(src || {}) };

      // Ensure new record is created as next version for same case number
      payload.case_number = src?.case_number || r.case_number || payload.case_number;

      // strip identifiers / system fields if present
      delete payload.id;
      delete payload.version;
      delete payload.status;
      delete payload.created_at;
      delete payload.updated_at;
      delete payload.submitted_at;
      delete payload.redo_of_id;

      // ✅ signatures removed (png + names + dates)
      payload.client_signature_png = "";
      payload.client_print_name = "";
      payload.client_signature_date = "";

      payload.collector_signature_png = "";
      payload.collector_print_name = "";
      payload.collector_signature_date = "";

      payload.refusal_signature_png = "";
      payload.refusal_print_name = "";
      payload.refusal_signature_date = "";

      const created = await createQuestionnaire(payload);

      // store draft id for resume behaviour
      localStorage.setItem("fts_qid", created.id);

      setStatus("");
      navigate(`/questionnaire/${created.id}`);
    } catch (e) {
      setStatus(`Copy failed: ${e.message}`);
    }
  };

  // ✅ DELETE: removes entry (needs backend endpoint)
  const onDelete = async (r) => {
    try {
      const ok = window.confirm(
        `Delete this record?\n\nCase ${r.case_number || "—"} v${r.version || ""}\n\nThis cannot be undone.`
      );
      if (!ok) return;

      setStatus("Deleting record...");

      await deleteQuestionnaire(r.id);

      // refresh list after delete
      await load();

      setStatus("");
    } catch (e) {
      setStatus(`Delete failed: ${e.message}`);
    }
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <img
            src={`${process.env.PUBLIC_URL}/logo.png`}
            alt="FTS Logo"
            style={styles.logo}
          />

          <div>
            <h1 style={styles.h1}>FTS Questionnaire</h1>
            <p style={styles.sub}>
              Create, search, and open questionnaire records.
            </p>
          </div>
        </div>

        <div style={styles.headerRight}>
          {/* ✅ Change Password */}
          <button
            style={{
              ...styles.logoutBtn,
              ...(hovered === "changepw" ? styles.logoutBtnHover: {}),
            }}
            onMouseEnter={() => setHovered("changepw")}
            onMouseLeave={() => setHovered(null)}
            onClick={goChangePassword}
          >
            Change Password
          </button>

          {/* ✅ Admin Tools (only admins/superadmins) */}
          {isAdmin && (
            <button
              style={{
                ...styles.deleteBtn,
                ...(hovered === "admintools" ? styles.deleteBtnHover : {}),
              }}
              onMouseEnter={() => setHovered("admintools")}
              onMouseLeave={() => setHovered(null)}
              onClick={goAdminTools}
            >
              Admin Tools
            </button>
          )}

          {/* ✅ Refresh */}
          <button
            style={{
              ...styles.refreshBtn,
              ...(hovered === "refresh" ? styles.refreshBtnHover : {}),
            }}
            onMouseEnter={() => setHovered("refresh")}
            onMouseLeave={() => setHovered(null)}
            onClick={load}
          >
            Refresh
          </button>

          {/* ✅ Logout (company blue) */}
          <button
            style={{
              ...styles.logoutBtn,
              ...(hovered === "logout" ? styles.logoutBtnHover : {}),
            }}
            onMouseEnter={() => setHovered("logout")}
            onMouseLeave={() => setHovered(null)}
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </header>

      {/* ...rest of your component unchanged... */}

      <section style={styles.card}>
        <h2 style={styles.h2}>Create a new questionnaire</h2>

        <div style={styles.row}>
          <input
            style={styles.input}
            placeholder="Enter Case Number (required)"
            value={caseNumber}
            onChange={(e) => setCaseNumber(e.target.value)}
          />

          <button
            style={{
              ...styles.primaryBtn,
              ...(hovered === "newdraft" ? styles.primaryBtnHover : {}),
            }}
            onMouseEnter={() => setHovered("newdraft")}
            onMouseLeave={() => setHovered(null)}
            onClick={createNew}
          >
            New draft
          </button>
        </div>

        <p style={styles.hint}>
          A new draft will be created as the next version for that case number (v1, v2, v3…).
        </p>
      </section>

      <section style={styles.card}>
        <h2 style={styles.h2}>Search</h2>

        <input
          style={styles.inputWide}
          placeholder="Search by Case Number…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div style={styles.metaRow}>
          <span style={styles.metaText}>
            Showing {filtered.length} record{filtered.length === 1 ? "" : "s"}
          </span>
        </div>
      </section>

      <section style={styles.card}>
        <h2 style={styles.h2}>Recent questionnaires</h2>

        {paged.length === 0 ? (
          <p style={styles.empty}>No records found.</p>
        ) : (
          <>
            <div style={styles.list}>
              {paged.map((r) => (
                <div key={r.id} style={styles.item}>
                  <div style={{ flex: 1 }}>
                    <div style={styles.itemTitle}>
                      Case <strong>{r.case_number || "—"}</strong>{" "}
                      {r.version ? <span style={styles.badge}>v{r.version}</span> : null}
                      {r.status ? (
                        <span
                          style={r.status === "submitted" ? styles.badgeGreen : styles.badgeGray}
                        >
                          {r.status}
                        </span>
                      ) : null}
                    </div>

                    <div style={styles.itemMeta}>
                      Updated: {prettyDate(r.updated_at)}{" "}
                      {r.submitted_at ? ` • Submitted: ${prettyDate(r.submitted_at)}` : ""}
                    </div>

                    {r.redo_of_id ? (
                      <div style={styles.itemMetaSmall}>Redo of: {r.redo_of_id}</div>
                    ) : null}
                  </div>

                  <div style={styles.btnGroup}>
                    <button
                      style={{
                        ...styles.openBtn,
                        ...(hovered === `open-${r.id}` ? styles.openBtnHover : {}),
                      }}
                      onMouseEnter={() => setHovered(`open-${r.id}`)}
                      onMouseLeave={() => setHovered(null)}
                      onClick={() => openRecord(r.id)}
                    >
                      Open
                    </button>

                    <button
                      style={{
                        ...styles.pdfBtn,
                        ...(hovered === `pdf-${r.id}` ? styles.pdfBtnHover : {}),
                      }}
                      onMouseEnter={() => setHovered(`pdf-${r.id}`)}
                      onMouseLeave={() => setHovered(null)}
                      onClick={() => onGeneratePdf(r)}
                    >
                      Generate PDF
                    </button>

                    <button
                      style={{
                        ...styles.copyBtn,
                        ...(hovered === `copy-${r.id}` ? styles.copyBtnHover : {}),
                      }}
                      onMouseEnter={() => setHovered(`copy-${r.id}`)}
                      onMouseLeave={() => setHovered(null)}
                      onClick={() => onCopy(r)}
                    >
                      Copy
                    </button>

                    {isAdmin && (
                      <button
                        style={{
                          ...styles.deleteBtn,
                          ...(hovered === `del-${r.id}` ? styles.deleteBtnHover : {}),
                        }}
                        onMouseEnter={() => setHovered(`del-${r.id}`)}
                        onMouseLeave={() => setHovered(null)}
                        onClick={() => onDelete(r)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filtered.length > 0 && (
              <div style={styles.pagination}>
                <button
                  type="button"
                  style={{
                    ...styles.pageBtn,
                    ...(safePage === 1 ? styles.pageBtnDisabled : {}),
                  }}
                  disabled={safePage === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  ◀ Back
                </button>

                <div style={styles.pageInfo}>
                  Page <strong>{safePage}</strong> of <strong>{totalPages}</strong>
                  <span style={styles.pageInfoSmall}>
                    {" "}
                    • Showing {(safePage - 1) * PAGE_SIZE + 1}–
                    {Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
                  </span>
                </div>

                <button
                  type="button"
                  style={{
                    ...styles.pageBtn,
                    ...(safePage === totalPages ? styles.pageBtnDisabled : {}),
                  }}
                  disabled={safePage === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next ▶
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {status ? <p style={styles.status}>{status}</p> : null}
    </div>
  );
}

const styles = {
  page: {
    position: "relative",
    maxWidth: 1100,
    margin: "0 auto",
    padding: 20,
    fontFamily: "Segoe UI",
    borderRadius: 12,
    background: "white",
    boxShadow: "0 0 0 1px #e6e9ef, 0 8px 24px rgba(0,0,0,0.04)",
  },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },

  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },

  // ✅ NEW: Change password button (neutral)
  changePwBtn: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #cfd7e6",
    background: "white",
    color: "#00528c",
    cursor: "pointer",
    fontWeight: 800,
    transition: "background 120ms ease, transform 120ms ease, box-shadow 120ms ease",
  },
  changePwBtnHover: {
    background: "#f3f6fb",
    transform: "translateY(-1px)",
    boxShadow: "0 4px 10px rgba(0,0,0,0.06)",
  },

  logoutBtn: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    background: "#00528c", // company blue
    color: "white",
    fontWeight: 700,
    transition: "background 120ms ease, transform 120ms ease, box-shadow 120ms ease",
  },
  logoutBtnHover: {
    background: "#004270",
    transform: "translateY(-1px)",
    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
  },

  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  logo: {
    height: 84,
    width: "auto",
    objectFit: "contain",
  },

  h1: { margin: 0, color: "#00528c" },
  sub: { margin: "6px 0 0", color: "#555" },

  card: {
    border: "1px solid #e6e6e6",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    background: "white",
  },
  h2: { margin: "0 0 10px", color: "#00528c" },

  row: { display: "flex", gap: 10, flexWrap: "wrap" },
  input: {
    flex: "1 1 320px",
    padding: "12px 12px",
    borderRadius: 10,
    border: "1px solid #ccc",
    fontSize: 15,
    boxSizing: "border-box",
  },
  inputWide: {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 10,
    border: "1px solid #ccc",
    fontSize: 15,
    boxSizing: "border-box",
  },

  hint: { marginTop: 10, fontSize: 13, color: "#666" },

  primaryBtn: {
    padding: "12px 18px",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    background: "#00528c",
    color: "white",
    fontSize: 15,
    fontWeight: 700,
    transition: "background 120ms ease, transform 120ms ease, box-shadow 120ms ease",
  },
  primaryBtnHover: {
    background: "#004270",
    transform: "translateY(-1px)",
    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
  },

  refreshBtn: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #ccc",
    background: "#904369",
    color: "white",
    cursor: "pointer",
    fontWeight: 600,
    transition: "background 120ms ease, transform 120ms ease, box-shadow 120ms ease",
  },
  refreshBtnHover: {
    background: "#7b3759",
    transform: "translateY(-1px)",
    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
  },

  metaRow: { marginTop: 10 },
  metaText: { color: "#666", fontSize: 13 },

  list: { display: "flex", flexDirection: "column", gap: 10, marginTop: 10 },
  item: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    border: "1px solid #eee",
    background: "#fafafa",
  },
  itemTitle: { fontSize: 15, marginBottom: 4 },
  itemMeta: { fontSize: 13, color: "#666" },
  itemMetaSmall: { fontSize: 12, color: "#777", marginTop: 4 },

  badge: {
    marginLeft: 8,
    padding: "3px 8px",
    borderRadius: 999,
    border: "1px solid #ddd",
    background: "white",
    fontSize: 12,
    fontWeight: 700,
  },
  badgeGreen: {
    marginLeft: 8,
    padding: "3px 8px",
    borderRadius: 999,
    border: "1px solid #bde5c8",
    background: "#eaf7ee",
    fontSize: 12,
    fontWeight: 700,
  },
  badgeGray: {
    marginLeft: 8,
    padding: "3px 8px",
    borderRadius: 999,
    border: "1px solid #ddd",
    background: "#f2f2f2",
    fontSize: 12,
    fontWeight: 700,
  },

  btnGroup: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },

  openBtn: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    background: "#00528c",
    color: "white",
    fontWeight: 700,
    whiteSpace: "nowrap",
    transition: "background 120ms ease, transform 120ms ease, box-shadow 120ms ease",
  },
  openBtnHover: {
    background: "#004270",
    transform: "translateY(-1px)",
    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
  },

  pdfBtn: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #ccc",
    cursor: "pointer",
    background: "#904369",
    color: "white",
    fontWeight: 700,
    whiteSpace: "nowrap",
    transition: "background 120ms ease, transform 120ms ease, box-shadow 120ms ease",
  },
  pdfBtnHover: {
    background: "#7b3759",
    transform: "translateY(-1px)",
    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
  },

  copyBtn: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    background: "#00528c",
    color: "white",
    fontWeight: 700,
    whiteSpace: "nowrap",
    transition: "background 120ms ease, transform 120ms ease, box-shadow 120ms ease",
  },
  copyBtnHover: {
    background: "#004270",
    transform: "translateY(-1px)",
    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
  },

  deleteBtn: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    background: "#c0392b",
    color: "white",
    fontWeight: 700,
    whiteSpace: "nowrap",
    transition: "background 120ms ease, transform 120ms ease, box-shadow 120ms ease",
  },
  deleteBtnHover: {
    background: "#a93226",
    transform: "translateY(-1px)",
    boxShadow: "0 4px 10px rgba(0,0,0,0.10)",
  },

  pagination: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 12,
    flexWrap: "wrap",
  },
  pageBtn: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #ccc",
    background: "white",
    color: "#00528c",
    cursor: "pointer",
    fontWeight: 700,
    transition: "background 120ms ease, transform 120ms ease, box-shadow 120ms ease",
  },
  pageBtnDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
    color: "#999",
  },
  pageInfo: {
    color: "#555",
    fontSize: 13,
  },
  pageInfoSmall: {
    color: "#777",
    fontSize: 12,
  },

  empty: { margin: 0, color: "#666" },
  status: { marginTop: 10, color: "#333" },
};
