import React, { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { authResetPassword } from "../services/api";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") || "";

  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState("");

  const onReset = async () => {
    setStatus("Resetting password...");
    try {
      await authResetPassword({
        token,
        new_password: pw,
        confirm_password: confirm,
      });
      setStatus("Password reset ✅ You can now login.");
      setTimeout(() => navigate("/login"), 900);
    } catch (e) {
      setStatus(e.message || "Reset failed");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.h1}>Reset password</h1>

        {!token ? (
          <p style={styles.sub}>Missing token.</p>
        ) : (
          <>
            <input
              style={styles.input}
              placeholder="New password"
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
            />
            <input
              style={styles.input}
              placeholder="Confirm new password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />

            <button style={styles.primaryBtn} onClick={onReset}>
              Set new password
            </button>
          </>
        )}

        <div style={styles.linksRow}>
          <Link to="/login" style={styles.link}>Back to login</Link>
        </div>

        {status ? <p style={styles.status}>{status}</p> : null}
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: 520, margin: "40px auto", padding: 20, fontFamily: "Segoe UI" },
  card: {
    border: "1px solid #e6e6e6",
    borderRadius: 12,
    padding: 18,
    background: "white",
    boxShadow: "0 0 0 1px #e6e9ef, 0 8px 24px rgba(0,0,0,0.04)",
  },
  h1: { margin: "6px 0 6px", color: "#00528c" },
  sub: { margin: "0 0 12px", color: "#555" },
  input: {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 10,
    border: "1px solid #ccc",
    fontSize: 15,
    boxSizing: "border-box",
    marginBottom: 10,
  },
  primaryBtn: {
    width: "100%",
    padding: "12px 18px",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    background: "#00528c",
    color: "white",
    fontSize: 15,
    fontWeight: 700,
  },
  linksRow: { marginTop: 10 },
  link: { color: "#00528c", textDecoration: "none", fontWeight: 600 },
  status: { marginTop: 10, color: "#333" },
};
