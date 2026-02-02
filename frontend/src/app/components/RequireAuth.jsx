import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { authMe } from "../services/api";

export default function RequireAuth({ children }) {
  const [loading, setLoading] = useState(true);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await authMe();
        setOk(true);
      } catch {
        setOk(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;
  if (!ok) return <Navigate to="/login" replace />;
  return children;
}
