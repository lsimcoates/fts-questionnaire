import React from "react";
import { drugExposureRows } from "../config/drugExposureConfig";
import { todayISO } from "../config/dateUtils";

const EXPOSURE_OPTIONS = [
  "Formal contact with a user",
  "Intimate contact with a user",
  "To a place where drugs have been used",
  "Direct contact with the drug",
  "Outdoor exposure",
  "Unsure",
];

export default function DrugExposureTable({ register }) {
  return (
    <section style={styles.section}>
      <h2 style={styles.h2}>Drug passive exposure</h2>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Drug</th>
              <th style={styles.thCenter}>Exposed</th>
              <th style={styles.thCenter}>None</th>
              <th style={styles.th}>Date of last exposure</th>
              <th style={styles.thCenter}>Unsure</th>
              <th style={styles.th}>Level of exposure</th>
              <th style={{ ...styles.th, ...styles.exposureColHeader }}>
                Type of exposure (tick all that apply)
              </th>
            </tr>
          </thead>

          <tbody>
            {drugExposureRows.map((drugName, index) => (
              <tr key={drugName}>
                <td style={styles.td}>{drugName}</td>

                {["exposed", "none"].map((status) => (
                  <td key={status} style={styles.tdCenter}>
                    <input
                      type="radio"
                      value={status}
                      {...register(`drug_exposure.${index}.status`)}
                    />
                  </td>
                ))}

                <td style={styles.td}>
                  <input
                    style={styles.input}
                    type="date"
                    max={todayISO}
                    {...register(`drug_exposure.${index}.date_of_last_exposure`)}
                    />
                </td>

                <td style={styles.tdCenter}>
                  <input
                    type="checkbox"
                    {...register(`drug_exposure.${index}.unsure_date`)}
                  />
                </td>

                <td style={styles.td}>
                  <select
                    style={styles.select}
                    {...register(`drug_exposure.${index}.level_of_exposure`)}
                  >
                    <option value="">Choose</option>
                    <option value="Single Occassion">Single Occassion</option>
                    <option value="Less than monthly">Less than monthly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Daily">Daily</option>
                    <option value="Unsure">Unsure</option>
                  </select>
                </td>

                <td style={{ ...styles.td, ...styles.exposureCol }}>
                  <div style={styles.checkboxList}>
                    {EXPOSURE_OPTIONS.map((opt) => (
                      <label key={opt} style={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          value={opt}
                          {...register(`drug_exposure.${index}.type_of_exposure`)}
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </td>

                {/* hidden: store drug name in submitted data */}
                <input
                  type="hidden"
                  value={drugName}
                  {...register(`drug_exposure.${index}.drug_name`)}
                />
              </tr>
            ))}
          </tbody>

          {/* One “Other information” row spanning full width */}
          <tfoot>
            <tr>
              <td style={styles.td} colSpan={7}>
                <label style={styles.otherInfoLabel}>
                  Other information (additional drugs, and changes in frequency/pattern of exposure)
                </label>
                <textarea
                  style={styles.textarea}
                  rows={4}
                  {...register("drug_exposure_other_info")}
                  placeholder="Enter any additional information here..."
                />
              </td>
            </tr>
          </tfoot>
        </table>
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
  h2: { marginBottom: 12 },

  tableWrapper: { overflowX: "auto" },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 14,
    minWidth: 1100,
  },

  th: {
    textAlign: "left",
    padding: 10,
    borderBottom: "1px solid #ddd",
    background: "#fafafa",
    whiteSpace: "nowrap",
    verticalAlign: "bottom",
  },
  thCenter: {
    textAlign: "center",
    padding: 10,
    borderBottom: "1px solid #ddd",
    background: "#fafafa",
    whiteSpace: "nowrap",
    verticalAlign: "bottom",
  },

  td: {
    padding: 10,
    borderBottom: "1px solid #eee",
    verticalAlign: "top",
  },
  tdCenter: {
    padding: 10,
    borderBottom: "1px solid #eee",
    textAlign: "center",
    verticalAlign: "middle",
  },

  input: { padding: 6, borderRadius: 6, border: "1px solid #ccc" },
  select: { padding: 6, borderRadius: 6, border: "1px solid #ccc", width: "100%" },

  exposureColHeader: {
    minWidth: 320, // forces more space for the checkbox list
    whiteSpace: "normal",
  },
  exposureCol: {
    minWidth: 320,
  },

  checkboxList: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  checkboxLabel: {
    display: "flex",
    gap: 8,
    alignItems: "flex-start",
    lineHeight: 1.2,
  },

  otherInfoLabel: { display: "block", fontWeight: 600, marginBottom: 6 },
  textarea: {
    width: "100%",
    padding: 10,
    borderRadius: 6,
    border: "1px solid #ccc",
    fontSize: 14,
    resize: "vertical",
  },
};
