import React from "react";
import { drugUseRows } from "../config/drugUseConfig";
import { todayISO } from "../config/dateUtils";

export default function DrugUseTable({ register, errors, showErrors }) {
  return (
    <section style={styles.section}>
      <h2 style={styles.h2}>Drug use</h2>

      <p style={styles.infoText}>
        <strong>Drug Use:</strong> Please provide details of your drug use to the best of your knowledge in the table below. If there has been any fluctuations or changes in pattern of drug use please clarify these in the 'Other information' box at the end of the table.
      </p>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Drug</th>
              <th style={styles.thCenter}>Used</th>
              <th style={styles.thCenter}>Not Used</th>
              <th style={styles.th}>Date of last use</th>
              <th style={styles.thCenter}>Unsure</th>
              <th style={styles.th}>Level of use</th>
              <th style={styles.thCenter}>Prescribed to you</th>
            </tr>
          </thead>

          <tbody>
            {drugUseRows.map((drug, index) => {
              const statusErr = errors?.drug_use?.[index]?.status;

              return (
                <React.Fragment key={drug.name}>
                  <tr>
                    <td style={styles.td}>{drug.name}</td>

                    {["used", "Not Used"].map((status) => (
                      <td key={status} style={styles.tdCenter}>
                        <input
                          type="radio"
                          value={status}
                          {...register(`drug_use.${index}.status`, {
                            required: "Please select Used or Not Used",
                          })}
                        />
                      </td>
                    ))}

                    <td style={styles.td}>
                      <input
                        style={styles.input}
                        type="date"
                        max={todayISO}
                        {...register(`drug_use.${index}.date_of_last_use`)}
                      />
                    </td>

                    <td style={styles.tdCenter}>
                      <input
                        type="checkbox"
                        {...register(`drug_use.${index}.unsure_date`)}
                      />
                    </td>

                    <td style={styles.td}>
                      <select
                        style={styles.select}
                        {...register(`drug_use.${index}.level_of_use`)}
                      >
                        <option value="">Choose</option>
                        <option value="Single use">Single use</option>
                        <option value="Less than monthly">Less than monthly</option>
                        <option value="Monthly">Monthly</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Daily">Daily</option>
                        <option value="Unsure">Unsure</option>
                      </select>
                    </td>

                    <td style={styles.tdCenter}>
                      {drug.prescribed ? (
                        <input
                          type="checkbox"
                          {...register(`drug_use.${index}.prescribed`)}
                        />
                      ) : (
                        <span style={styles.muted}>—</span>
                      )}
                    </td>

                    {/* hidden: store the drug name in the submitted data */}
                    <input
                      type="hidden"
                      value={drug.name}
                      {...register(`drug_use.${index}.drug_name`)}
                    />
                  </tr>

                  {/* Row-level error line (only appears after submit attempt) */}
                  {showErrors && statusErr && (
                    <tr>
                      <td style={styles.errorRow} colSpan={7}>
                        <span style={styles.errorText}>
                          {drug.name}: {statusErr.message}
                        </span>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>

          {/* One “Other information” row spanning full width */}
          <tfoot>
            <tr>
              <td style={styles.td} colSpan={7}>
                <label style={styles.otherInfoLabel}>
                  Other information (additional drugs, and changes in frequency/pattern of use)
                </label>
                <textarea
                  style={styles.textarea}
                  rows={4}
                  {...register("drug_use_other_info")}
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
  h2: { marginBottom: 8, color: "#904369" },

  infoText: { marginTop: 0, marginBottom: 12, lineHeight: 1.35 },

  tableWrapper: { overflowX: "auto" },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 14,
    minWidth: 900,
  },

  th: {
    textAlign: "left",
    padding: 10,
    borderBottom: "1px solid #ddd",
    background: "#fafafa",
    whiteSpace: "nowrap",
  },
  thCenter: {
    textAlign: "center",
    padding: 10,
    borderBottom: "1px solid #ddd",
    background: "#fafafa",
    whiteSpace: "nowrap",
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

  muted: { color: "#999" },

  otherInfoLabel: { display: "block", fontWeight: 600, marginBottom: 6 },
  textarea: {
    width: "100%",
    padding: 10,
    borderRadius: 6,
    border: "1px solid #ccc",
    fontSize: 14,
    resize: "vertical",
  },

  // error styling for table rows
  errorRow: {
    padding: 10,
    borderBottom: "1px solid #eee",
    background: "#fff5f5",
  },
  errorText: { color: "crimson", fontSize: 12, fontWeight: 600 },
};
