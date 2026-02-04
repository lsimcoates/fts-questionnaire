import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authLogin } from "../services/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  // ✅ If offline + this device has previously authenticated, go back to app (offline mode)
  useEffect(() => {
    const allowed = localStorage.getItem("fts_offline_allowed") === "1";
    if (!navigator.onLine && allowed) {
      navigate("/", { replace: true, state: { toast: "Offline mode enabled ✅" } });
    }
  }, [navigate]);

  const onLogin = async () => {
    // ✅ Offline login is not possible (Option A). Give a friendly message.
    if (!navigator.onLine) {
      const allowed = localStorage.getItem("fts_offline_allowed") === "1";
      setStatus(
        allowed
          ? "You’re offline. This device already supports offline mode — returning Home…"
          : "You’re offline. Login requires internet. Please reconnect and try again."
      );
      if (allowed) {
        setTimeout(() => navigate("/", { replace: true }), 400);
      }
      return;
    }

    setStatus("Logging in...");
    try {
      await authLogin({ email, password });

      // ✅ Mark device as offline-capable after a successful login
      localStorage.setItem("fts_offline_allowed", "1");
      localStorage.setItem("fts_offline_allowed_at", String(Date.now()));

      setStatus("");
      navigate("/");
    } catch (e) {
      setStatus(e.message || "Login failed");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <img
          src={`${process.env.PUBLIC_URL}/logo.png`}
          alt="FTS Logo"
          style={styles.logo}
        />

        <h1 style={styles.h1}>Login</h1>
        <p style={styles.sub}>Use your @forensic-testing.co.uk email please.</p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onLogin();
          }}
        >
          <input
            style={styles.input}
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
          />

          <input
            style={styles.input}
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          <button type="submit" style={styles.primaryBtn}>
            Login
          </button>
        </form>

        {status ? <p style={styles.status}>{status}</p> : null}
      </div>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: 520,
    margin: "40px auto",
    padding: 20,
    fontFamily: "Segoe UI",
  },
  card: {
    border: "1px solid #e6e6e6",
    borderRadius: 12,
    padding: 18,
    background: "white",
    boxShadow: "0 0 0 1px #e6e9ef, 0 8px 24px rgba(0,0,0,0.04)",
  },
  logo: { height: 70, width: "auto", marginBottom: 10 },
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
  status: { marginTop: 10, color: "#333" },
};
