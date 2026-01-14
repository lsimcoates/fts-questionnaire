import React from "react";
import { hairColourOptions, infectionOptions } from "../config/options";
import { todayISO } from "../config/dateUtils";

export default function PersonalDetails({ register, errors }) {
  return (
    <section style={styles.section}>
      <h2 style={styles.h2}>Personal details</h2>

      {/* Name + Collector Name */}
      <div style={styles.row}>
        <div style={styles.field}>
          <label style={styles.label}>Name</label>
          <input
            style={styles.input}
            type="text"
            {...register("client_name", { required: "Name is required" })}
            placeholder="Enter name"
          />
          {errors?.client_name && (
            <p style={styles.error}>{errors.client_name.message}</p>
          )}
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Collector Name</label>
          <input
            style={styles.input}
            type="text"
            {...register("collector_name")}
            placeholder="Enter collector name"
          />
        </div>
      </div>

      {/* Case Number */}
      <div style={styles.field}>
        <label style={styles.label}>Case Number</label>
        <input
          style={styles.input}
          type="text"
          {...register("case_number", { required: "Case number is required" })}
          placeholder="Enter case number"
        />
        {errors?.case_number && (
          <p style={styles.error}>{errors.case_number.message}</p>
        )}
      </div>

      {/* Consent */}
      <div style={styles.field}>
        <label style={styles.label}>
          Do you consent to Forensic Testing Service (FTS) asking these questions
          and the completion of the questionnaire?
        </label>

        <div style={styles.inline}>
          <label style={styles.radioLabel}>
            <input
              type="radio"
              value="Yes"
              {...register("consent", { required: "Consent is required" })}
            />
            Yes
          </label>

          <label style={styles.radioLabel}>
            <input
              type="radio"
              value="No"
              {...register("consent", { required: "Consent is required" })}
            />
            No
          </label>
        </div>

        {errors?.consent && <p style={styles.error}>{errors.consent.message}</p>}
      </div>

      {/* DOB + Sex at birth */}
      <div style={styles.row}>
        <div style={styles.field}>
          <label style={styles.label}>Date of Birth</label>
          <input style={styles.input} type="date" max={todayISO} {...register("dob")} />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>What is your sex at birth?</label>
          <select
            style={styles.input}
            {...register("sex_at_birth")}
            defaultValue=""
          >
            <option value="">Choose an item</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
      </div>

      {/* Hair Colour */}
      <div style={styles.field}>
        <label style={styles.label}>
          What is the natural hair colour of your scalp hair? (choose the most applicable)
        </label>
        <select style={styles.input} {...register("natural_hair_colour")}>
          <option value="">Choose an item</option>
          {hairColourOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      {/* Blood-borne infections */}
      <div style={styles.field}>
        <label style={styles.label}>
          Do you have any blood-borne infections that you are aware of? (Such as HIV, HEP)
        </label>
        <select style={styles.input} {...register("blood_borne_infections")}>
          <option value="">Choose an item</option>
          {infectionOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
      {/* Occupation */}
      <div style={styles.row}>
        <div style={styles.field}>
          <label style={styles.label}>Occupation</label>
          <input
            style={styles.input}
            type="text"
            {...register("occupation")}
            placeholder="Enter name"
          />
        </div>
      </div>
    </section>
  );
}

const styles = {
  section: {
    border: "1px solid #ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  h2: { margin: 0, marginBottom: 8, color: "#904369" },
  row: { display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 10 },
  field: { display: "flex", flexDirection: "column", flex: 1, minWidth: 260, marginBottom: 10 },
  label: { fontWeight: 600, marginBottom: 5, lineHeight: 1.1 },
  input: {
    padding: 9,
    borderRadius: 6,
    border: "1px solid #ccc",
    fontSize: 12,
    boxSizing: "border-box",
  },
  inline: { display: "flex", gap: 14, marginTop: 6 },
  radioLabel: { display: "flex", gap: 6, alignItems: "center" },
  error: { color: "crimson", marginTop: 4, marginBottom: 0, fontSize: 12 },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 12,
    marginBottom: 10,
  },

  fieldGrid: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },
};
