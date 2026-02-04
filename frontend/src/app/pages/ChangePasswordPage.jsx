import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authChangePassword } from "../services/api";

export default function ChangePasswordPage() {
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  
  // ✅ hover tracking
  const [hovered, setHovered] = useState(null);
  
  const onSubmit = async (e) => {
    e.preventDefault();

    setStatus("");
    if (!currentPassword || !newPassword || !confirmPassword) {
      setStatus("Please fill in all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setStatus("New password must be at least 8 characters.");
      return;
    }

    setSaving(true);
    setStatus("Updating password...");
    try {
      await authChangePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      setStatus("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Optional: send them back to home after a moment
      setTimeout(() => navigate("/"), 700);
    } catch (err) {
      setStatus(err.message || "Failed to update password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.headerRow}>
          <h1 style={styles.h1}>Change Password</h1>
          <button type="button" style={{
            ...styles.secondaryBtn,
            ...(hovered === "changepw" ? styles.secondaryBtnHover: {}),
          }}
           onMouseEnter={() => setHovered("changepw")}
           onMouseLeave={() => setHovered(null)}
           onClick={() => navigate("/")}>
            Back
          </button>
        </div>

        <p style={styles.sub}>
          Enter your current password, then choose a new one (minimum 8 characters).
        </p>

        <form onSubmit={onSubmit}>
          <input
            style={styles.input}
            placeholder="Current password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
          />

          <input
            style={styles.input}
            placeholder="New password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />

          <input
            style={styles.input}
            placeholder="Confirm new password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />

          <button
            type="submit"
            disabled={saving}
            style={{
              ...styles.primaryBtn,
              ...(hovered === "save" && !saving ? styles.primaryBtnHover : {}),
              ...(saving ? styles.primaryBtnDisabled : {}),
            }}
            onMouseEnter={() => setHovered("save")}
            onMouseLeave={() => setHovered(null)}
          >
            {saving ? "Saving..." : "Update password"}
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
  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
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
  primaryBtnHover: {
    background: "#004270",
    transform: "translateY(-1px)",
    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
  },
  primaryBtnDisabled: {
    opacity: 0.7,
    cursor: "not-allowed",
  },

  secondaryBtn: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #cfd7e6",
    background: "#7b3759",
    cursor: "pointer",
    fontWeight: 700,
    color: "white",
  },
  secondaryBtnHover: {
    background: "#7b3759",
    transform: "translateY(-1px)",
    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
  },

  status: { marginTop: 10, color: "#333" },
};
