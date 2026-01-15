import React, { useEffect } from "react";

export default function MedicationSection({
  register,
  watch,
  setValue,
  errors,
  showErrors,
}) {
  const hasOtherMeds = watch("has_other_medications"); // "Yes" | "No" | ""

  // If they select "No", clear the details box so you don't store stale text
  useEffect(() => {
    if (hasOtherMeds === "No") {
      setValue("other_medications_details", "");
    }
  }, [hasOtherMeds, setValue]);

  return (
    <section style={styles.section}>
      <h2 style={styles.h2}>Medication</h2>

      <div style={styles.field}>
        <label style={styles.label}>
          Have you used any other medications (not listed above) during the 12
          months prior to sampling?
        </label>

        <div style={styles.inline}>
          <label style={styles.radioLabel}>
            <input
              type="radio"
              value="Yes"
              {...register("has_other_medications", {
                required: "Please select an option",
              })}
            />
            Yes
          </label>

          <label style={styles.radioLabel}>
            <input
              type="radio"
              value="No"
              {...register("has_other_medications", {
                required: "Please select an option",
              })}
            />
            No
          </label>
        </div>

        {showErrors && errors?.has_other_medications && (
          <p style={styles.error}>{errors.has_other_medications.message}</p>
        )}
      </div>

      {hasOtherMeds === "Yes" && (
        <div style={styles.field}>
          <label style={styles.label}>
            If so, please list below, with their respective sources:
          </label>

          <textarea
            style={styles.textarea}
            rows={5}
            {...register("other_medications_details")}
            placeholder="Enter medication(s) and source(s)..."
          />
        </div>
      )}
    </section>
  );
}

const styles = {
  section: {
    border: "1px solid #ddd",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  h2: { marginBottom: 12, color: "#904369" },
  field: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 },
  label: { fontWeight: 600 },
  inline: { display: "flex", gap: 18, alignItems: "center" },
  radioLabel: { display: "flex", gap: 8, alignItems: "center" },
  textarea: {
    width: "100%",
    padding: 10,
    borderRadius: 6,
    border: "1px solid #ccc",
    fontSize: 14,
    resize: "vertical",
  },
  error: { color: "crimson", marginTop: 4, marginBottom: 0, fontSize: 12 },
};
