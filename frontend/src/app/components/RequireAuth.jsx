import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { authMe } from "../services/api";

export default function RequireAuth({ children }) {
  const [loading, setLoading] = useState(true);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const allowed = () => localStorage.getItem("fts_offline_allowed") === "1";

    const setSafe = (nextOk, nextLoading) => {
      if (cancelled) return;
      setOk(nextOk);
      setLoading(nextLoading);
    };

    const recheck = async () => {
      const offlineAllowed = allowed();

      // Try to validate online session.
      setSafe(ok, true);

      try {
        await authMe();

        // success: mark device as offline-capable
        localStorage.setItem("fts_offline_allowed", "1");
        localStorage.setItem("fts_offline_allowed_at", String(Date.now()));

        setSafe(true, false);
      } catch (e) {
        const offlineAllowed = allowed();

        if (e?.status === 401) {
          setSafe(false, false);
          return;
        }

        if (offlineAllowed) {
          setSafe(true, false);
        } else {
          setSafe(false, false);
        }
      }
    };

    recheck();

    window.addEventListener("online", recheck);
    window.addEventListener("offline", recheck);

    return () => {
      cancelled = true;
      window.removeEventListener("online", recheck);
      window.removeEventListener("offline", recheck);
    };
  }, []);

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;
  if (!ok) return <Navigate to="/login" replace />;

  return children;
}
