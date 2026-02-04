import React, { useEffect } from "react";
import { todayISO } from "../config/dateUtils";

const WEEKLY_OPTIONS = [
  "0–15 units (less than 6 pints/half a 70cl bottle of spirit)",
  "15–30 units (6 to 12 pints/a 70cl bottle of spirit)",
  "30–55 units (12–24 pints / 2 × 70cl bottles of spirits)",
  "More than 55 units (25+ pints / 2+ bottles of spirits)",
  "Binges (no more than once every two weeks)",
  "Unsure",
];

export default function AlcoholSection({
  register,
  watch,
  setValue,
  clearErrors,
  errors,
  showErrors,
}) {
  const consumedAlcohol = watch("alcohol_consumed_last_12_months"); 
  const unsureLastDate = watch("alcohol_last_date_unsure"); 
  // If ticked clear the date
  useEffect(() => {
    if (unsureLastDate) {
      setValue("alcohol_last_consumed_date", "", { shouldDirty: false });
      clearErrors?.("alcohol_last_consumed_date");
    }
  }, [unsureLastDate, setValue, clearErrors]);

  // If they say No alcohol, clear related fields
  useEffect(() => {
    if (consumedAlcohol === "No") {
      setValue("alcohol_last_consumed_date", "", { shouldDirty: false });
      setValue("alcohol_last_date_unsure", false, { shouldDirty: false });
      setValue("alcohol_weekly_options", [], { shouldDirty: false }); 
      setValue("alcohol_other_info", "", { shouldDirty: false });

      clearErrors?.([
        "alcohol_last_consumed_date",
        "alcohol_last_date_unsure",
        "alcohol_weekly_options",
        "alcohol_other_info",
      ]);
    }
  }, [consumedAlcohol, setValue, clearErrors]);

  const disabled = consumedAlcohol === "No";

  return (
    <section style={styles.section}>
      <h2 style={styles.h2}>Alcohol Consumption</h2>

      {/* 2 column layout (left form, right image) */}
      <div style={styles.grid}>
        {/* LEFT: existing form content */}
        <div>
          {/* Consumed in last 12 months */}
          <div style={styles.field}>
            <label style={styles.label}>
              Have you consumed any alcohol in the last 12 months?
            </label>

            <div style={styles.inline}>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  value="Yes"
                  {...register("alcohol_consumed_last_12_months", {
                    required: "Please select an option",
                  })}
                />
                Yes
              </label>

              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  value="No"
                  {...register("alcohol_consumed_last_12_months", {
                    required: "Please select an option",
                  })}
                />
                No
              </label>
            </div>

            {showErrors && errors?.alcohol_consumed_last_12_months && (
              <p style={styles.error}>
                {errors.alcohol_consumed_last_12_months.message}
              </p>
            )}
          </div>

          {/* Last consumed date + unsure */}
          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>When did you last consume alcohol?</label>
              <input
                style={styles.input}
                type="date"
                max={todayISO}
                disabled={disabled || unsureLastDate}
                {...register("alcohol_last_consumed_date")}
              />
            </div>

            <div style={{ ...styles.field, ...styles.unsureBox }}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  disabled={disabled}
                  {...register("alcohol_last_date_unsure")}
                />
                Unsure
              </label>
            </div>
          </div>

          {/* Weekly consumption (checkboxes) */}
          <div style={styles.field}>
            <label style={styles.label}>
              Please tick which most closely matches your average weekly alcohol
              consumption:
            </label>

            <div style={styles.checkboxList}>
              {WEEKLY_OPTIONS.map((label) => (
                <label key={label} style={styles.checkboxLine}>
                  <input
                    type="checkbox"
                    value={label}
                    disabled={disabled}
                    {...register("alcohol_weekly_options", {
                      validate: (v) => {
                        if (consumedAlcohol !== "Yes") return true;
                        return Array.isArray(v) && v.length > 0
                          ? true
                          : "Please select at least one option";
                      },
                    })}
                  />
                  {label}
                </label>
              ))}
            </div>

            {showErrors && errors?.alcohol_weekly_options && (
              <p style={styles.error}>{errors.alcohol_weekly_options.message}</p>
            )}
          </div>

          {/* Other info */}
          <div style={styles.field}>
            <label style={styles.label}>
              Other information (changes in pattern of consumption)
            </label>
            <textarea
              style={styles.textarea}
              rows={4}
              disabled={disabled}
              {...register("alcohol_other_info")}
              placeholder="Enter any additional information here..."
            />
          </div>
        </div>

        {/* alcohol units key image */}
        <div style={styles.keyWrap}>
          {(consumedAlcohol === "Yes" || consumedAlcohol === "") && (
            <img
              src={`${process.env.PUBLIC_URL}/alcoholkey.png`}
              alt="Alcohol unit guide"
              style={styles.alcoholKeyImg}
            />
          )}
        </div>
      </div>
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

  // left form + right image column
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 360px",
    gap: 18,
    alignItems: "start",
  },

  keyWrap: {
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    paddingTop: 6,
  },

  alcoholKeyImg: {
    width: "100%",
    height: "auto",
    maxWidth: 360,
    borderRadius: 10,
  },

  row: { display: "flex", gap: 18, flexWrap: "wrap", alignItems: "flex-end" },
  field: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 },
  label: { fontWeight: 600 },
  helperText: { fontWeight: 400, fontSize: 13, color: "#555" },

  inline: { display: "flex", gap: 18, alignItems: "center" },
  radioLabel: { display: "flex", gap: 8, alignItems: "center" },

  input: { padding: 8, borderRadius: 6, border: "1px solid #ccc", minWidth: 240 },

  unsureBox: { justifyContent: "flex-end" },
  checkboxLabel: { display: "flex", gap: 8, alignItems: "center", fontWeight: 600 },

  checkboxList: { display: "flex", flexDirection: "column", gap: 8, marginTop: 6 },
  checkboxLine: { display: "flex", gap: 8, alignItems: "flex-start", lineHeight: 1.2 },

  textarea: {
    width: "98%",
    padding: 10,
    borderRadius: 6,
    border: "1px solid #ccc",
    fontSize: 14,
    resize: "vertical",
  },

  error: { color: "crimson", marginTop: 4, marginBottom: 0, fontSize: 12 },
};
