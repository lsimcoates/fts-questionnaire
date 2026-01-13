import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createQuestionnaire, listQuestionnaires, downloadQuestionnairePdf } from "../services/api";

export default function LandingPage() {
  const navigate = useNavigate();

  const [caseNumber, setCaseNumber] = useState("");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("");

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
      setStatus("");
    } catch (e) {
      setStatus(`Failed to load records: ${e.message}`);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      String(r.case_number || "").toLowerCase().includes(q)
    );
  }, [rows, query]);

  const recent = useMemo(() => filtered.slice(0, 12), [filtered]);

  const createNew = async () => {
    const cn = caseNumber.trim();
    if (!cn) {
      setStatus("Please enter a Case Number to create a new questionnaire.");
      return;
    }

    try {
      setStatus("Creating new draft...");
      // minimal payload: backend requires case_number
      const created = await createQuestionnaire({ case_number: cn, consent: "" });

      // Optional: store draft id for resume behaviour
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


  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.h1}>FTS Questionnaire</h1>
          <p style={styles.sub}>Create, search, and open questionnaire records.</p>
        </div>
        <button style={styles.refreshBtn} onClick={load}>
          Refresh
        </button>
      </header>

      <section style={styles.card}>
        <h2 style={styles.h2}>Create a new questionnaire</h2>

        <div style={styles.row}>
          <input
            style={styles.input}
            placeholder="Enter Case Number (required)"
            value={caseNumber}
            onChange={(e) => setCaseNumber(e.target.value)}
          />
          <button style={styles.primaryBtn} onClick={createNew}>
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

        {recent.length === 0 ? (
          <p style={styles.empty}>No records found.</p>
        ) : (
          <div style={styles.list}>
            {recent.map((r) => (
              <div key={r.id} style={styles.item}>
                <div style={{ flex: 1 }}>
                  <div style={styles.itemTitle}>
                    Case <strong>{r.case_number || "—"}</strong>{" "}
                    {r.version ? <span style={styles.badge}>v{r.version}</span> : null}
                    {r.status ? (
                      <span style={r.status === "submitted" ? styles.badgeGreen : styles.badgeGray}>
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
                    <button style={styles.openBtn} onClick={() => openRecord(r.id)}>
                        Open
                    </button>

                    <button style={styles.pdfBtn} onClick={() => onGeneratePdf(r)}>
                        Generate PDF
                    </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {status ? <p style={styles.status}>{status}</p> : null}
    </div>
  );
}

const styles = {
  page: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: 20,
    fontFamily: "Arial",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },
  h1: { margin: 0 },
  sub: { margin: "6px 0 0", color: "#555" },

  card: {
    border: "1px solid #e6e6e6",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    background: "white",
  },
  h2: { margin: "0 0 10px" },

  row: { display: "flex", gap: 10, flexWrap: "wrap" },
  input: {
    flex: "1 1 320px",
    padding: "12px 12px",
    borderRadius: 10,
    border: "1px solid #ccc",
    fontSize: 15,
  },
  inputWide: {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 10,
    border: "1px solid #ccc",
    fontSize: 15,
  },

  hint: { marginTop: 10, fontSize: 13, color: "#666" },

  primaryBtn: {
    padding: "12px 18px",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    background: "#0b5cff",
    color: "white",
    fontSize: 15,
    fontWeight: 700,
  },
  refreshBtn: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #ccc",
    background: "white",
    cursor: "pointer",
    fontWeight: 600,
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

  openBtn: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    background: "#111",
    color: "white",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },

  btnGroup: { display: "flex", gap: 10, alignItems: "center" },
  pdfBtn: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #ccc",
    cursor: "pointer",
    background: "white",
    fontWeight: 700,
    whiteSpace: "nowrap",
    },
    
  empty: { margin: 0, color: "#666" },
  status: { marginTop: 10, color: "#333" },
};
