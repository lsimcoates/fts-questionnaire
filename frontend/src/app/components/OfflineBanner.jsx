import React, { useEffect, useState } from "react";
import { syncOutbox } from "../offline/sync";

export default function OfflineBanner() {
  const [online, setOnline] = useState(navigator.onLine);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const onUp = async () => {
      setOnline(true);

      try {
        const r = await syncOutbox();
        if (r?.synced) setMsg(`Synced ${r.synced} queued submission(s).`);
        else setMsg("Back online.");
      } catch {
        setMsg("Back online — sync pending.");
      } finally {
        setTimeout(() => setMsg(""), 4000);
      }
    };

    const onDown = () => {
      setOnline(false);
      setMsg("");
    };

    window.addEventListener("online", onUp);
    window.addEventListener("offline", onDown);
    return () => {
      window.removeEventListener("online", onUp);
      window.removeEventListener("offline", onDown);
    };
  }, []);

  if (online && !msg) return null;

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        padding: "10px 12px",
        background: online ? "#e8fff0" : "#fff4e5",
        borderBottom: "1px solid rgba(0,0,0,0.1)",
        fontFamily: "Segoe UI",
      }}
    >
      {!online ? <strong>You’re offline — saving locally.</strong> : <strong>{msg}</strong>}
    </div>
  );
}
