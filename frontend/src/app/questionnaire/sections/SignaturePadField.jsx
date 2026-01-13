import React, { useEffect, useRef } from "react";
import SignatureCanvas from "react-signature-canvas";

export default function SignaturePadField({
  label,
  value = "",            // existing PNG dataURL
  onChange = () => {},   // callback to parent
}) {
  const sigRef = useRef(null);

  // Load existing signature into the canvas when value changes
  useEffect(() => {
    if (!sigRef.current) return;

    // Always start clean
    sigRef.current.clear();

    // If we have a saved signature, load it
    if (value) {
      try {
        sigRef.current.fromDataURL(value);
      } catch {
        // If the value is malformed, just leave blank
      }
    }
  }, [value]);

  const handleEnd = () => {
    if (!sigRef.current) return;
    const isEmpty = sigRef.current.isEmpty();
    const png = isEmpty ? "" : sigRef.current.toDataURL("image/png");
    onChange(png);
  };

  const clear = () => {
    sigRef.current?.clear();
    onChange("");
  };

  return (
    <div style={styles.wrap}>
      <label style={styles.label}>{label}</label>

      <div style={styles.pad}>
        <SignatureCanvas
          ref={sigRef}
          onEnd={handleEnd}
          penColor="black"
          canvasProps={{ style: styles.canvas }}
        />
      </div>

      <button type="button" onClick={clear} style={styles.clearBtn}>
        Clear signature
      </button>
    </div>
  );
}

const styles = {
  wrap: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 },
  label: { fontWeight: 600 },
  pad: { border: "1px solid #ccc", borderRadius: 6, overflow: "hidden" },
  canvas: { width: "100%", height: 160, background: "white" },
  clearBtn: {
    width: "fit-content",
    padding: "8px 12px",
    borderRadius: 6,
    border: "1px solid #ccc",
    background: "white",
    cursor: "pointer",
  },
};
