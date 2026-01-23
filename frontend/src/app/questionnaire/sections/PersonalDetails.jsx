import React from "react";
import { hairColourOptions, infectionOptions } from "../config/options";
import { todayISO } from "../config/dateUtils";

export default function PersonalDetails({ register, watch, setValue, errors, showErrors }) {
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
            placeholder="Enter name (match ID)"
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
            {...register("collector_name", {
              required: "Collector name is required",
            })}
            placeholder="Enter collector name"
          />
          {showErrors && errors?.collector_name && (
            <p style={styles.error}>{errors.collector_name.message}</p>
          )}
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
        {showErrors && errors?.case_number && (
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
          <input
            style={styles.input}
            type="date"
            max={todayISO}
            {...register("dob", { required: "Date of birth is required" })}
          />
          {errors?.dob && <p style={styles.error}>{errors.dob.message}</p>}
        </div>

        <div style={styles.field}>
          <label style={styles.label}>What is your sex at birth?</label>
          <select
            style={styles.input}
            {...register("sex_at_birth", { required: "Sex at birth is required" })}
            defaultValue=""
          >
            <option value="">Choose an item</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          {errors?.sex_at_birth && (
            <p style={styles.error}>{errors.sex_at_birth.message}</p>
          )}
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
        <select
          style={styles.input}
          {...register("blood_borne_infections", { required: "This field is required" })}
          defaultValue=""
        >
          <option value="">Choose an item</option>
          {infectionOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        {errors?.blood_borne_infections && (
          <p style={styles.error}>{errors.blood_borne_infections.message}</p>
        )}
      </div>

      {/* Ethnicity */}
      <div style={styles.row}>
        <div style={styles.field}>
          <label style={styles.label}>Ethnicity</label>

          <select style={styles.input} {...register("ethnicity")} defaultValue="">
            <option value="">Select ethnicity</option>

            <optgroup label="Asian or Asian British">
              <option value="Asian or Asian British - Indian">Indian</option>
              <option value="Asian or Asian British - Pakistani">Pakistani</option>
              <option value="Asian or Asian British - Bangladeshi">Bangladeshi</option>
              <option value="Asian or Asian British - Chinese">Chinese</option>
              <option value="Asian or Asian British - Any other Asian background">
                Any other Asian background
              </option>
            </optgroup>

            <optgroup label="Black, Black British, Caribbean or African">
              <option value="Black, Black British, Caribbean or African - Caribbean">
                Caribbean
              </option>
              <option value="Black, Black British, Caribbean or African - African">
                African
              </option>
              <option value="Black, Black British, Caribbean or African - Any other Black, Black British, or Caribbean background">
                Any other Black, Black British, or Caribbean background
              </option>
            </optgroup>

            <optgroup label="Mixed or multiple ethnic groups">
              <option value="Mixed or multiple ethnic groups - White and Black Caribbean">
                White and Black Caribbean
              </option>
              <option value="Mixed or multiple ethnic groups - White and Black African">
                White and Black African
              </option>
              <option value="Mixed or multiple ethnic groups - White and Asian">
                White and Asian
              </option>
              <option value="Mixed or multiple ethnic groups - Any other Mixed or multiple ethnic background">
                Any other Mixed or multiple ethnic background
              </option>
            </optgroup>

            <optgroup label="White">
              <option value="White - English, Welsh, Scottish, Northern Irish or British">
                English, Welsh, Scottish, Northern Irish or British
              </option>
              <option value="White - Irish">Irish</option>
              <option value="White - Gypsy or Irish Traveller">Gypsy or Irish Traveller</option>
              <option value="White - Roma">Roma</option>
              <option value="White - Any other White background">Any other White background</option>
            </optgroup>

            <optgroup label="Other ethnic group">
              <option value="Other ethnic group - Arab">Arab</option>
              <option value="Other ethnic group - Any other ethnic group">
                Any other ethnic group
              </option>
            </optgroup>
    </select>

    {(() => {
      const eth = watch?.("ethnicity") || "";
      const needsOther =
        eth.includes("Any other Asian background") ||
        eth.includes("Any other Black, Black British, or Caribbean background") ||
        eth.includes("Any other Mixed or multiple ethnic background") ||
        eth.includes("Any other White background") ||
        eth.includes("Any other ethnic group");

      if (!needsOther) return null;

      return (
        <div style={{ marginTop: 8 }}>
          <label style={styles.label}>Please specify</label>
          <input
            style={styles.input}
            type="text"
            {...register("ethnicity_other_detail")}
            placeholder="Type details"
          />
        </div>
      );
    })()}
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
  field: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minWidth: 260,
    marginBottom: 10,
  },
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
