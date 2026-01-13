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
  h2: { margin: 0, marginBottom: 12 },
  row: { display: "flex", gap: 16, flexWrap: "wrap" },
  field: { display: "flex", flexDirection: "column", flex: 1, minWidth: 260 },
  label: { fontWeight: 600, marginBottom: 6 },
  input: {
    padding: 10,
    borderRadius: 6,
    border: "1px solid #ccc",
    fontSize: 14,
  },
  inline: { display: "flex", gap: 18, marginTop: 8 },
  radioLabel: { display: "flex", gap: 8, alignItems: "center" },
  error: { color: "crimson", marginTop: 6, marginBottom: 0, fontSize: 13 },
};
