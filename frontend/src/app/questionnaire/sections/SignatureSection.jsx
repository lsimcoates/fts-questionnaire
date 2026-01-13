// src/app/questionnaire/sections/SignatureSection.jsx
import React, { useMemo, useState } from "react";
import SignaturePadField from "./SignaturePadField";
import { todayISO } from "../config/dateUtils";

export default function SignatureSection({
  register,
  control, // not used in this modal-based version, but fine to keep
  watch,
  setValue,
  mode = "full", // "full" | "refusal-only"
}) {

  const [open, setOpen] = useState(false);
  const [activeSigField, setActiveSigField] = useState(""); // e.g. "client_signature_png"
  const [tempPng, setTempPng] = useState("");

  const clientSig = watch?.("client_signature_png") || "";
  const collectorSig = watch?.("collector_signature_png") || "";
  const refusalSig = watch?.("refusal_signature_png") || "";

  const signedMap = useMemo(
    () => ({
      client_signature_png: !!clientSig,
      collector_signature_png: !!collectorSig,
      refusal_signature_png: !!refusalSig,
    }),
    [clientSig, collectorSig, refusalSig]
  );

  const openPad = (sigFieldName) => {
    setActiveSigField(sigFieldName);
    setTempPng(watch?.(sigFieldName) || ""); // load existing into modal
    setOpen(true);
  };

  const closePad = () => {
    setOpen(false);
    setActiveSigField("");
    setTempPng("");
  };

  const saveSignature = () => {
    if (!activeSigField) return;
    setValue(activeSigField, tempPng || "");
    closePad();
  };

  return (
    <section style={styles.section}>
      {mode === "full" && (
        <>
          {/* CLIENT */}
          <p style={styles.declaration}>
            <strong>
              I have reviewed this document and can confirm that the information
              provided above is true to the best of my knowledge.
            </strong>
          </p>

          <SignatureRow
            register={register}
            titleLeft="Client Signature:"
            printNameField="client_print_name"
            dateField="client_signature_date"
            signed={signedMap.client_signature_png}
            sigValue={clientSig}
            onSign={() => openPad("client_signature_png")}
          />

          <hr style={styles.hr} />

          {/* COLLECTOR */}
          <p style={styles.declaration}>
            <strong>
              I can confirm that the information captured above is a true
              representation of the information received from the client.
            </strong>
          </p>

          <SignatureRow
            register={register}
            titleLeft="Collector Signature:"
            printNameField="collector_print_name"
            dateField="collector_signature_date"
            signed={signedMap.collector_signature_png}
            sigValue={collectorSig}
            onSign={() => openPad("collector_signature_png")}
          />
        </>
      )}

      {mode === "refusal-only" && (
        <>
          <h2 style={styles.refusalTitle}>Questionnaire Refusal</h2>

          <p style={styles.declaration}>
            I confirm that I understand the client questionnaire is a critical
            part of the testing process and the information I provide will
            assist with the accurate interpretation of the test results.
            However, I refuse to complete the questionnaire:
          </p>

          <SignatureRow
            register={register}
            titleLeft="Client Signature:"
            printNameField="refusal_print_name"
            dateField="refusal_signature_date"
            signed={signedMap.refusal_signature_png}
            sigValue={refusalSig}
            onSign={() => openPad("refusal_signature_png")}
          />
        </>
      )}

      {/* Modal signature pad */}
      {open && (
        <div style={styles.modalOverlay} onClick={closePad}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitle}>Sign</div>
              <button type="button" style={styles.modalClose} onClick={closePad}>
                ✕
              </button>
            </div>

            <SignaturePadField
              label="Draw signature below"
              value={tempPng}              // LOAD existing signature
              onChange={(png) => setTempPng(png)}
            />

            <div style={styles.modalActions}>
              <button type="button" style={styles.secondaryBtn} onClick={closePad}>
                Cancel
              </button>
              <button type="button" style={styles.primaryBtn} onClick={saveSignature}>
                Save signature
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function SignatureRow({
  register,
  titleLeft,
  printNameField,
  dateField,
  signed,
  sigValue,
  onSign,
}) {
  return (
    <div style={styles.sigBlock}>
      {/* Print name line */}
      <div style={styles.printNameRow}>
        <label style={styles.printNameLabel}>Print name:</label>
        <input
          style={styles.printNameInput}
          type="text"
          {...register(printNameField)}
          placeholder="Type full name"
        />
      </div>

      {/* Signature line + date */}
      <div style={styles.signatureRow}>
        <div style={styles.signatureLeft}>
          <span style={styles.signatureTitle}>{titleLeft}</span>

          <button
            type="button"
            onClick={onSign}
            style={{
              ...styles.signatureLineButton,
              ...(signed ? styles.signatureLineSigned : null),
            }}
          >
            <span style={styles.signatureLine}>
              {signed ? "Signed ✓ (click to edit)" : "Click/tap to sign"}
            </span>

            {sigValue ? (
              <img
                src={sigValue}
                alt="Saved signature preview"
                style={styles.signaturePreview}
              />
            ) : null}
          </button>
        </div>

        <div style={styles.dateRight}>
          <label style={styles.dateLabel}>Date:</label>
          <input
            style={styles.dateInput}
            type="date"
            max={todayISO}
            {...register(dateField)}
          />
        </div>
      </div>
    </div>
  );
}

const styles = {
  section: {
    border: "1px solid #ddd",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },

  declaration: {
    margin: "0 0 10px 0",
    lineHeight: 1.4,
  },

  refusalTitle: {
    margin: "0 0 10px 0",
    color: "#b00000",
  },

  hr: {
    margin: "18px 0",
    border: "none",
    borderTop: "1px solid #eee",
  },

  sigBlock: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginBottom: 8,
  },

  printNameRow: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },
  printNameLabel: { fontWeight: 600, minWidth: 95 },
  printNameInput: {
    flex: 1,
    minWidth: 260,
    padding: 8,
    borderRadius: 6,
    border: "1px solid #ccc",
    fontSize: 14,
  },

  signatureRow: {
    display: "flex",
    gap: 16,
    alignItems: "flex-end",
    flexWrap: "wrap",
  },

  signatureLeft: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    flex: 1,
    minWidth: 360,
  },
  signatureTitle: { fontWeight: 600, whiteSpace: "nowrap", paddingTop: 6 },

  signatureLineButton: {
    flex: 1,
    padding: 0,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    textAlign: "left",
  },
  signatureLine: {
    display: "inline-block",
    width: "100%",
    paddingBottom: 4,
    borderBottom: "2px solid #333",
    color: "#333",
  },
  signatureLineSigned: {
    opacity: 0.95,
  },

  signaturePreview: {
    display: "block",
    marginTop: 6,
    maxWidth: 420,
    height: 60,
    objectFit: "contain",
    border: "1px solid #eee",
    borderRadius: 6,
    padding: 6,
    background: "white",
  },

  dateRight: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    minWidth: 240,
  },
  dateLabel: { fontWeight: 600 },
  dateInput: {
    padding: 8,
    borderRadius: 6,
    border: "1px solid #ccc",
    fontSize: 14,
    minWidth: 170,
  },

  /* Modal */
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    zIndex: 9999,
  },
  modal: {
    width: "min(800px, 100%)",
    background: "white",
    borderRadius: 10,
    padding: 14,
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: { fontWeight: 700, fontSize: 16 },
  modalClose: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: 18,
    lineHeight: 1,
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 10,
  },
  secondaryBtn: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #ccc",
    background: "white",
    cursor: "pointer",
    fontWeight: 600,
  },
  primaryBtn: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "none",
    background: "#0b5cff",
    color: "white",
    cursor: "pointer",
    fontWeight: 700,
  },
};
