import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  adminExportJson,
  adminExportCsv,
  adminExportOptions,
  adminUsersList,
  adminUserCreate,
  adminUserSetRole,
  adminUserDelete,
} from "../services/api";

const YESNO_ANY = ["", "Yes", "No"];

export default function AdminToolsPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("");

  // Dropdown options from backend
  const [opts, setOpts] = useState({
    natural_hair_colours: [],
    sex_at_birth: [],
    testing_types: [],
    hair_dyed_bleached: ["Yes", "No"],
    hair_thermal_applications: ["Yes", "No"],
    frequent_swimming: ["Yes", "No"],
    frequent_sunbeds: ["Yes", "No"],
    frequent_sprays_on_sites: ["Yes", "No"],
    pregnant_last_12_months: ["Yes", "No"],
    hair_cut_in_last_12_months: ["Yes", "No"],
    hair_removed_body_hair_last_12_months: ["Yes", "No"],
    drug_use_used_names: [],
    drug_exposure_exposed_names: [],
  });

  useEffect(() => {
    (async () => {
      try {
        const data = await adminExportOptions();
        setOpts((prev) => ({ ...prev, ...data }));
      } catch (e) {
        // non-fatal: page still usable
        console.warn("adminExportOptions failed:", e);
      }
    })();
  }, []);

  // -----------------------------
  // Export filters
  // -----------------------------
  const [submittedFrom, setSubmittedFrom] = useState("");
  const [submittedTo, setSubmittedTo] = useState("");

  const [naturalHairColour, setNaturalHairColour] = useState("");
  const [sexAtBirth, setSexAtBirth] = useState("");
  const [testingType, setTestingType] = useState("");

  const [hairDyedBleached, setHairDyedBleached] = useState("");
  const [thermalApps, setThermalApps] = useState("");
  const [swimming, setSwimming] = useState("");
  const [sunbeds, setSunbeds] = useState("");
  const [sprays, setSprays] = useState("");
  const [pregnant, setPregnant] = useState("");
  const [hairCut, setHairCut] = useState("");
  const [bodyHairRemoved, setBodyHairRemoved] = useState("");

  // "Drug used" and "Drug exposed"
  const [drugUsedName, setDrugUsedName] = useState("");
  const [drugExposedName, setDrugExposedName] = useState("");

  const params = useMemo(() => {
    const p = {};
    if (submittedFrom) p.submitted_from = submittedFrom;
    if (submittedTo) p.submitted_to = submittedTo;

    if (naturalHairColour) p.natural_hair_colour = naturalHairColour;
    if (sexAtBirth) p.sex_at_birth = sexAtBirth;
    if (testingType) p.testing_type = testingType;

    if (hairDyedBleached) p.hair_dyed_bleached = hairDyedBleached;
    if (thermalApps) p.hair_thermal_applications = thermalApps;
    if (swimming) p.frequent_swimming = swimming;
    if (sunbeds) p.frequent_sunbeds = sunbeds;
    if (sprays) p.frequent_sprays_on_sites = sprays;
    if (pregnant) p.pregnant_last_12_months = pregnant;
    if (hairCut) p.hair_cut_in_last_12_months = hairCut;
    if (bodyHairRemoved) p.hair_removed_body_hair_last_12_months = bodyHairRemoved;

    if (drugUsedName) p.drug_used_name = drugUsedName;
    if (drugExposedName) p.drug_exposed_name = drugExposedName;

    return p;
  }, [
    submittedFrom,
    submittedTo,
    naturalHairColour,
    sexAtBirth,
    testingType,
    hairDyedBleached,
    thermalApps,
    swimming,
    sunbeds,
    sprays,
    pregnant,
    hairCut,
    bodyHairRemoved,
    drugUsedName,
    drugExposedName,
  ]);

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

  const onDownloadJson = async () => {
    try {
      setStatus("Preparing JSON export...");
      const blob = await adminExportJson(params);
      downloadBlob(blob, "submitted_questionnaires.json");
      setStatus("");
    } catch (e) {
      setStatus(e.message || "Export failed");
    }
  };

  const onDownloadCsv = async () => {
    try {
      setStatus("Preparing CSV export...");
      const blob = await adminExportCsv(params);
      downloadBlob(blob, "submitted_questionnaires.csv");
      setStatus("");
    } catch (e) {
      setStatus(e.message || "Export failed");
    }
  };

  // -----------------------------
  // Users table state
  // -----------------------------
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState("");
  const [usersBusyId, setUsersBusyId] = useState(null);

  const loadUsers = async () => {
    setUsersLoading(true);
    setUsersError("");
    try {
      const data = await adminUsersList();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      setUsersError(e?.message || "Failed to load users");
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const onMakeAdmin = async (u) => {
    setUsersBusyId(u.id);
    try {
      await adminUserSetRole(u.id, "admin");
      await loadUsers();
    } catch (e) {
      alert(e?.message || "Failed to update role");
    } finally {
      setUsersBusyId(null);
    }
  };

  const onRemoveAdmin = async (u) => {
    setUsersBusyId(u.id);
    try {
      await adminUserSetRole(u.id, "user");
      await loadUsers();
    } catch (e) {
      alert(e?.message || "Failed to update role");
    } finally {
      setUsersBusyId(null);
    }
  };

  const onDeleteUser = async (u) => {
    const ok = window.confirm(`Delete ${u.email}?\n\nThis cannot be undone.`);
    if (!ok) return;

    setUsersBusyId(u.id);
    try {
      await adminUserDelete(u.id);
      await loadUsers();
    } catch (e) {
      alert(e?.message || "Failed to delete user");
    } finally {
      setUsersBusyId(null);
    }
  };

  // -----------------------------
  // ✅ NEW: Create user state
  // -----------------------------
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [createBusy, setCreateBusy] = useState(false);
  const [createdInfo, setCreatedInfo] = useState(null); // { email, role, temp_password }

  const onCreateUser = async (e) => {
    e.preventDefault();
    setCreatedInfo(null);

    const email = newEmail.trim();
    if (!email) {
      alert("Please enter an email.");
      return;
    }

    setCreateBusy(true);
    try {
      const res = await adminUserCreate({ email, role: newRole });
      setCreatedInfo({
        email: res.email,
        role: res.role,
        temp_password: res.temp_password,
      });
      setNewEmail("");
      setNewRole("user");
      await loadUsers();
    } catch (err) {
      alert(err?.message || "Failed to create user");
    } finally {
      setCreateBusy(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard.");
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      alert("Copied to clipboard.");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button style={styles.homeBtn} onClick={() => navigate("/")}>
          ◀ Home
        </button>
        <h1 style={styles.h1}>Admin Tools</h1>
        <div />
      </div>

      {/* =======================
          Card 1: Export
          ======================= */}
      <div style={styles.card}>
        <h2 style={styles.h2}>Export submitted questionnaires</h2>

        <div style={styles.grid}>
          <Field label="Submitted from">
            <input
              style={styles.input}
              type="date"
              value={submittedFrom}
              onChange={(e) => setSubmittedFrom(e.target.value)}
            />
          </Field>

          <Field label="Submitted to">
            <input
              style={styles.input}
              type="date"
              value={submittedTo}
              onChange={(e) => setSubmittedTo(e.target.value)}
            />
          </Field>

          <Field label="Natural hair colour">
            <select
              style={styles.input}
              value={naturalHairColour}
              onChange={(e) => setNaturalHairColour(e.target.value)}
            >
              <option value="">(any)</option>
              {opts.natural_hair_colours.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Testing type">
            <select
              style={styles.input}
              value={testingType}
              onChange={(e) => setTestingType(e.target.value)}
            >
              <option value="">(any)</option>
              {opts.testing_types.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Sex at birth">
            <select
              style={styles.input}
              value={sexAtBirth}
              onChange={(e) => setSexAtBirth(e.target.value)}
            >
              <option value="">(any)</option>
              {opts.sex_at_birth.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Dyed / bleached">
            <select
              style={styles.input}
              value={hairDyedBleached}
              onChange={(e) => setHairDyedBleached(e.target.value)}
            >
              <option value="">(any)</option>
              {YESNO_ANY.filter(Boolean).map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Thermal applications">
            <select
              style={styles.input}
              value={thermalApps}
              onChange={(e) => setThermalApps(e.target.value)}
            >
              <option value="">(any)</option>
              {YESNO_ANY.filter(Boolean).map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Frequent swimming / hot tubs">
            <select
              style={styles.input}
              value={swimming}
              onChange={(e) => setSwimming(e.target.value)}
            >
              <option value="">(any)</option>
              {YESNO_ANY.filter(Boolean).map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Frequent sunbeds">
            <select
              style={styles.input}
              value={sunbeds}
              onChange={(e) => setSunbeds(e.target.value)}
            >
              <option value="">(any)</option>
              {YESNO_ANY.filter(Boolean).map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Sprays on sites">
            <select
              style={styles.input}
              value={sprays}
              onChange={(e) => setSprays(e.target.value)}
            >
              <option value="">(any)</option>
              {YESNO_ANY.filter(Boolean).map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Pregnant last 12 months">
            <select
              style={styles.input}
              value={pregnant}
              onChange={(e) => setPregnant(e.target.value)}
            >
              <option value="">(any)</option>
              {YESNO_ANY.filter(Boolean).map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Hair cut last 12 months">
            <select
              style={styles.input}
              value={hairCut}
              onChange={(e) => setHairCut(e.target.value)}
            >
              <option value="">(any)</option>
              {YESNO_ANY.filter(Boolean).map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Body hair removed last 12 months">
            <select
              style={styles.input}
              value={bodyHairRemoved}
              onChange={(e) => setBodyHairRemoved(e.target.value)}
            >
              <option value="">(any)</option>
              {YESNO_ANY.filter(Boolean).map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Drug used">
            <select
              style={styles.input}
              value={drugUsedName}
              onChange={(e) => setDrugUsedName(e.target.value)}
            >
              <option value="">(any)</option>
              {opts.drug_use_used_names.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Drug exposed">
            <select
              style={styles.input}
              value={drugExposedName}
              onChange={(e) => setDrugExposedName(e.target.value)}
            >
              <option value="">(any)</option>
              {opts.drug_exposure_exposed_names.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div style={styles.actions}>
          <button style={styles.primaryBtn} onClick={onDownloadJson}>
            Download JSON (no signatures)
          </button>
          <button style={styles.secondaryBtn} onClick={onDownloadCsv}>
            Download CSV (all fields)
          </button>
        </div>

        {status ? <p style={styles.status}>{status}</p> : null}
        <p style={styles.note}>
          Exports include <strong>submitted</strong> questionnaires only, and
          signatures are removed automatically.
        </p>
      </div>

      {/* =======================
          Card 2: Create user (NEW)
          ======================= */}
      <div style={{ ...styles.card, marginTop: 16 }}>
        <h2 style={styles.h2}>Create user</h2>

        <form onSubmit={onCreateUser} style={createStyles.row}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={styles.label}>Email</div>
            <input
              style={styles.input}
              placeholder="name@forensic-testing.co.uk"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
          </div>

          <div style={{ width: 220 }}>
            <div style={styles.label}>Role</div>
            <select
              style={styles.input}
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
            >
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          </div>

          <div style={{ alignSelf: "flex-end" }}>
            <button style={styles.primaryBtn} type="submit" disabled={createBusy}>
              {createBusy ? "Creating..." : "Create"}
            </button>
          </div>
        </form>

        {createdInfo && (
          <div style={createStyles.resultBox}>
            <div style={createStyles.resultTitle}>User created</div>
            <div style={createStyles.resultRow}>
              <strong>Email:</strong> {createdInfo.email}
            </div>
            <div style={createStyles.resultRow}>
              <strong>Role:</strong> {createdInfo.role}
            </div>

            <div style={createStyles.pwRow}>
              <div style={{ flex: 1 }}>
                <div style={createStyles.pwLabel}>Temporary password</div>
                <div style={createStyles.pwValue}>{createdInfo.temp_password}</div>
                <div style={styles.note}>
                  Share this securely. The user should change it after login.
                </div>
              </div>
              <button
                type="button"
                style={createStyles.copyBtn}
                onClick={() => copyToClipboard(createdInfo.temp_password)}
              >
                Copy
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =======================
          Card 3: Users
          ======================= */}
      <div style={{ ...styles.card, marginTop: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2 style={{ ...styles.h2, margin: 0 }}>Users</h2>
          <button
            style={styles.refreshBtn}
            onClick={loadUsers}
            disabled={usersLoading}
            title="Refresh"
          >
            ↻ Refresh
          </button>
        </div>

        {usersLoading && <p style={styles.note}>Loading users…</p>}
        {!usersLoading && usersError && (
          <p style={{ ...styles.note, color: "crimson", fontWeight: 800 }}>
            {usersError}
          </p>
        )}

        {!usersLoading && !usersError && (
          <div style={{ overflowX: "auto", marginTop: 12 }}>
            <table style={userStyles.table}>
              <thead>
                <tr>
                  <th style={userStyles.th}>Email</th>
                  <th style={userStyles.th}>Role</th>
                  <th style={userStyles.th}>Created</th>
                  <th style={userStyles.th}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {users.map((u) => {
                  const busy = usersBusyId === u.id;

                  return (
                    <tr key={u.id} style={userStyles.tr}>
                      <td style={userStyles.td}>{u.email}</td>
                      <td style={userStyles.td}>{u.role}</td>
                      <td style={userStyles.td}>
                        {u.created_at
                          ? String(u.created_at).slice(0, 19).replace("T", " ")
                          : "-"}
                      </td>

                      <td style={userStyles.td}>
                        {u.role === "user" && (
                          <button
                            style={userStyles.btnBlue}
                            disabled={busy}
                            onClick={() => onMakeAdmin(u)}
                          >
                            Make Admin
                          </button>
                        )}

                        {u.role === "admin" && (
                          <button
                            style={userStyles.btnGrey}
                            disabled={busy}
                            onClick={() => onRemoveAdmin(u)}
                          >
                            Remove Admin
                          </button>
                        )}

                        <button
                          style={{
                            ...userStyles.btnRed,
                            opacity: u.role === "superadmin" ? 0.5 : 1,
                          }}
                          disabled={busy || u.role === "superadmin"}
                          onClick={() => onDeleteUser(u)}
                        >
                          Delete
                        </button>

                        {u.role === "superadmin" && (
                          <span style={{ marginLeft: 10, color: "#666" }}>
                            (protected)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {users.length === 0 && (
                  <tr>
                    <td style={userStyles.td} colSpan={4}>
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <p style={styles.note}>
          You can promote users to <strong>admin</strong> (not superadmin) or
          delete accounts. Superadmins are protected.
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={styles.field}>
      <div style={styles.label}>{label}</div>
      {children}
    </div>
  );
}

const styles = {
  page: {
    maxWidth: 1150,
    margin: "24px auto",
    padding: 20,
    fontFamily: "Segoe UI",
  },
  header: {
    display: "grid",
    gridTemplateColumns: "auto 1fr auto",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  h1: { margin: 0, textAlign: "center", color: "#00528c", fontSize: 42 },
  homeBtn: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #ccc",
    background: "white",
    cursor: "pointer",
    fontWeight: 700,
    color: "#00528c",
  },
  card: {
    border: "1px solid #e6e6e6",
    borderRadius: 14,
    background: "white",
    padding: 18,
    boxShadow: "0 0 0 1px #e6e9ef, 0 8px 24px rgba(0,0,0,0.04)",
  },
  h2: { margin: "0 0 12px", color: "#00528c" },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(220px, 1fr))",
    gap: 14,
  },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontWeight: 700, color: "#333" },
  input: {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 10,
    border: "1px solid #ccc",
    fontSize: 14,
    boxSizing: "border-box",
    background: "white",
  },
  actions: { display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" },
  primaryBtn: {
    padding: "12px 16px",
    borderRadius: 12,
    border: "none",
    background: "#00528c",
    color: "white",
    cursor: "pointer",
    fontWeight: 800,
  },
  secondaryBtn: {
    padding: "12px 16px",
    borderRadius: 12,
    border: "none",
    background: "#904369",
    color: "white",
    cursor: "pointer",
    fontWeight: 800,
  },
  refreshBtn: {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid #ccc",
    background: "white",
    cursor: "pointer",
    fontWeight: 800,
    color: "#00528c",
  },
  status: { marginTop: 12, color: "#333" },
  note: { marginTop: 10, color: "#666", fontSize: 13 },
};

const createStyles = {
  row: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "flex-start",
  },
  resultBox: {
    marginTop: 14,
    border: "1px solid #e6e6e6",
    borderRadius: 12,
    padding: 14,
    background: "#fafafa",
  },
  resultTitle: {
    fontWeight: 900,
    color: "#00528c",
    marginBottom: 8,
  },
  resultRow: {
    color: "#333",
    marginBottom: 6,
  },
  pwRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginTop: 10,
    flexWrap: "wrap",
  },
  pwLabel: { fontWeight: 800, color: "#333", marginBottom: 4 },
  pwValue: {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    fontSize: 16,
    fontWeight: 900,
    letterSpacing: 0.2,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #ddd",
    background: "white",
    display: "inline-block",
  },
  copyBtn: {
    padding: "12px 14px",
    borderRadius: 12,
    border: "none",
    background: "#904369",
    color: "white",
    cursor: "pointer",
    fontWeight: 900,
    whiteSpace: "nowrap",
  },
};

const userStyles = {
  table: {
    width: "100%",
    borderCollapse: "collapse",
    border: "1px solid #e6e6e6",
    borderRadius: 12,
    overflow: "hidden",
  },
  th: {
    textAlign: "left",
    padding: "10px 10px",
    background: "#f6f8fb",
    color: "#333",
    fontWeight: 800,
    borderBottom: "1px solid #e6e6e6",
    whiteSpace: "nowrap",
  },
  tr: { borderTop: "1px solid #eee" },
  td: { padding: "10px 10px", verticalAlign: "middle" },

  btnBlue: {
    padding: "8px 10px",
    borderRadius: 10,
    border: "none",
    background: "#00528c",
    color: "white",
    cursor: "pointer",
    fontWeight: 800,
    marginRight: 8,
  },
  btnGrey: {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid #ccc",
    background: "white",
    color: "#333",
    cursor: "pointer",
    fontWeight: 800,
    marginRight: 8,
  },
  btnRed: {
    padding: "8px 10px",
    borderRadius: 10,
    border: "none",
    background: "#b42318",
    color: "white",
    cursor: "pointer",
    fontWeight: 800,
  },
};
