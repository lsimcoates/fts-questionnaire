import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { authVerify } from "../services/api";

export default function VerifyPage() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState("Verifying...");

  useEffect(() => {
    (async () => {
      const token = params.get("token");
      if (!token) {
        setStatus("Missing token.");
        return;
      }
      try {
        await authVerify(token);
        setStatus("Verified ✅ You can now login.");
      } catch (e) {
        setStatus(e.message || "Verification failed.");
      }
    })();
  }, [params]);

  return (
    <div style={{ maxWidth: 520, margin: "40px auto", padding: 20, fontFamily: "Segoe UI" }}>
      <h1 style={{ color: "#00528c" }}>Verify</h1>
      <p>{status}</p>
      <Link to="/login" style={{ color: "#00528c", fontWeight: 700, textDecoration: "none" }}>
        Go to login
      </Link>
    </div>
  );
}
