import React, { useState } from "react";
import { Link } from "react-router-dom";
import { authForgotPassword } from "../services/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  const onSend = async () => {
    setStatus("Sending reset email...");
    try {
      const res = await authForgotPassword(email);
      setStatus(res.message || "If the account exists, an email was sent.");
    } catch (e) {
      // still show generic message
      setStatus("If the account exists, an email was sent.");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.h1}>Forgot password</h1>
        <p style={styles.sub}>Enter your work email to receive a reset link.</p>

        <input
          style={styles.input}
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button style={styles.primaryBtn} onClick={onSend}>
          Send reset link
        </button>

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
