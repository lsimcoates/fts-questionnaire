import React, { useEffect } from "react";
import { useWatch } from "react-hook-form";
import { drugExposureRows } from "../config/drugExposureConfig";
import { todayISO } from "../config/dateUtils";

const EXPOSURE_OPTIONS = [
  "Close and physical contact with a user",
  "Sexual contact with a user",
  "To a place where drugs have been used",
  "Direct contact with the drug",
  "Outdoor exposure",
  "Unsure",
];

const STATUS_OPTIONS = ["Exposed", "Not exposed"];

const PARENT_LEVEL_OPTIONS = [
  "Single Occassion",
  "Less than monthly",
  "Monthly",
  "Weekly",
  "Daily",
  "Unsure",
];

// Child rows need "Not exposed" as requested
const CHILD_LEVEL_OPTIONS = ["Not exposed", ...PARENT_LEVEL_OPTIONS];

function isoMonthsAgo(months) {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD for <input type="date">
}

function DateShortcuts({ onToday, onMinus3, onMinus6 }) {
  return (
    <div style={styles.dateShortcuts}>
      <button type="button" style={styles.shortcutBtn} onClick={onToday}>
        Today
      </button>
      <button type="button" style={styles.shortcutBtn} onClick={onMinus3}>
        −3 months
      </button>
      <button type="button" style={styles.shortcutBtn} onClick={onMinus6}>
        −6 months
      </button>
    </div>
  );
}

function blankExposurePeriod() {
  return {
    start_date_of_exposure: "",
    date_of_last_exposure: "",
    unsure_date: false,
    level_of_exposure: "",
    type_of_exposure: [],
    has_change: false,
  };
}

// helper: is a period row totally empty (so we can trim)
function isEmptyPeriod(p) {
  if (!p) return true;
  const typeArr = Array.isArray(p.type_of_exposure) ? p.type_of_exposure : [];
  return (
    !p.has_change &&
    !p.start_date_of_exposure &&
    !p.date_of_last_exposure &&
    !p.level_of_exposure &&
    !p.unsure_date &&
    typeArr.length === 0
  );
}

// helper: is a period row "active" (user interacted / filled something / ticked has_change)
function isPeriodActive(p) {
  if (!p) return false;
  const typeArr = Array.isArray(p.type_of_exposure) ? p.type_of_exposure : [];
  return (
    !!p.has_change ||
    !!p.start_date_of_exposure ||
    !!p.date_of_last_exposure ||
    !!p.level_of_exposure ||
    !!p.unsure_date ||
    typeArr.length > 0
  );
}

function DrugExposureRow({
  drugName,
  index,
  register,
  errors,
  showErrors,
  control,
  setValue,
}) {
  const baseHasChange =
    useWatch({ control, name: `drug_exposure.${index}.has_change` }) || false;

  const periods =
    useWatch({ control, name: `drug_exposure.${index}.periods` }) || [];

  // ✅ watch parent start + unsure for end-date validation
  const parentStart =
    useWatch({ control, name: `drug_exposure.${index}.start_date_of_exposure` }) || "";
  const parentUnsure =
    useWatch({ control, name: `drug_exposure.${index}.unsure_date` }) || false;

  // ✅ Base checkbox controls whether periods exist at all (rehydration-safe)
  useEffect(() => {
    if (baseHasChange) {
      if (!Array.isArray(periods) || periods.length === 0) {
        setValue(`drug_exposure.${index}.periods`, [blankExposurePeriod()], {
          shouldDirty: false,
        });
      }
    } else {
      if (Array.isArray(periods) && periods.length > 0) {
        setValue(`drug_exposure.${index}.periods`, [], { shouldDirty: false });
      }
    }
  }, [baseHasChange, periods, index, setValue]);

  // ✅ Chain behaviour: ensure exactly ONE new blank row exists after the last ticked period
  useEffect(() => {
    if (!Array.isArray(periods) || periods.length === 0) return;

    let lastTicked = -1;
    for (let i = 0; i < periods.length; i++) {
      if (periods[i]?.has_change) lastTicked = i;
    }

    // none ticked => keep exactly one row
    if (lastTicked === -1) {
      if (periods.length !== 1) {
        setValue(
          `drug_exposure.${index}.periods`,
          [periods[0] || blankExposurePeriod()],
          { shouldDirty: false }
        );
      }
      return;
    }

    const desiredLen = lastTicked + 2;

    if (periods.length < desiredLen) {
      const next = [...periods];
      while (next.length < desiredLen) next.push(blankExposurePeriod());
      setValue(`drug_exposure.${index}.periods`, next, { shouldDirty: false });
      return;
    }

    if (periods.length > desiredLen) {
      const tail = periods.slice(desiredLen);
      const allTailEmpty = tail.every(isEmptyPeriod);
      if (allTailEmpty) {
        setValue(`drug_exposure.${index}.periods`, periods.slice(0, desiredLen), {
          shouldDirty: false,
        });
      }
    }
  }, [periods, index, setValue]);

  const statusErr = errors?.drug_exposure?.[index]?.status;

  return (
    <>
      {/* Parent row */}
      <tr>
        <td style={styles.td}>{drugName}</td>

        {/* ✅ Status column: two radios stacked vertically */}
        <td style={styles.tdCenter}>
          <div style={styles.statusStack}>
            {STATUS_OPTIONS.map((label) => (
              <label key={label} style={styles.statusOption}>
                <input
                  type="radio"
                  value={label}
                  {...register(`drug_exposure.${index}.status`, {
                    required: "Please select Exposed or Not exposed",
                  })}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </td>

        {/* Start date */}
        <td style={styles.td}>
          <input
            style={styles.input}
            type="date"
            max={todayISO}
            {...register(`drug_exposure.${index}.start_date_of_exposure`)}
          />

          <DateShortcuts
            onToday={() =>
              setValue(
                `drug_exposure.${index}.start_date_of_exposure`,
                todayISO,
                { shouldDirty: true }
              )
            }
            onMinus3={() =>
              setValue(
                `drug_exposure.${index}.start_date_of_exposure`,
                isoMonthsAgo(3),
                { shouldDirty: true }
              )
            }
            onMinus6={() =>
              setValue(
                `drug_exposure.${index}.start_date_of_exposure`,
                isoMonthsAgo(6),
                { shouldDirty: true }
              )
            }
          />
        </td>

        {/* ✅ End date: cannot be before start date */}
        <td style={styles.td}>
          <input
            style={styles.input}
            type="date"
            max={todayISO}
            min={parentStart || undefined}
            {...register(`drug_exposure.${index}.date_of_last_exposure`, {
              validate: (end) => {
                if (!end || !parentStart) return true;
                if (parentUnsure) return true;
                return end >= parentStart
                  ? true
                  : "End date cannot be before start date";
              },
            })}
          />

        </td>

        <td style={styles.tdCenter}>
          <input type="checkbox" {...register(`drug_exposure.${index}.unsure_date`)} />
        </td>

        <td style={styles.td}>
          <select
            style={styles.select}
            {...register(`drug_exposure.${index}.level_of_exposure`)}
          >
            <option value="">Choose</option>
            {PARENT_LEVEL_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
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

        {/* Changes/fluctuations */}
        <td style={styles.tdCenter}>
          <input type="checkbox" {...register(`drug_exposure.${index}.has_change`)} />
        </td>

        {/* hidden: store drug name */}
        <input
          type="hidden"
          value={drugName}
          {...register(`drug_exposure.${index}.drug_name`)}
        />
      </tr>

      {/* Child period rows */}
      {Array.isArray(periods) &&
        periods.length > 0 &&
        periods.map((p, pIndex) => {
          const pErr = errors?.drug_exposure?.[index]?.periods?.[pIndex] || {};
          const periodActive = isPeriodActive(p);

          // ✅ use period object directly (no hooks in map)
          const periodStart = (p?.start_date_of_exposure || "").trim();

          return (
            <React.Fragment key={`${drugName}-period-${pIndex}`}>
              <tr>
                <td style={{ ...styles.td, ...styles.subRowDrug }}>
                  <span style={styles.subRowArrow}>↳</span> Period {pIndex + 2}
                </td>

                {/* Status placeholder */}
                <td style={styles.tdCenter}>
                  <span style={styles.muted}>—</span>
                </td>

                {/* Start date */}
                <td style={styles.td}>
                  <input
                    style={styles.input}
                    type="date"
                    max={todayISO}
                    {...register(
                      `drug_exposure.${index}.periods.${pIndex}.start_date_of_exposure`,
                      {
                        validate: (v) => {
                          if (!baseHasChange) return true;
                          if (!periodActive) return true;
                          if (p?.unsure_date) return true;
                          return (v || "").trim() ? true : "Start date is required";
                        },
                      }
                    )}
                  />

                  <DateShortcuts
                    onToday={() =>
                      setValue(
                        `drug_exposure.${index}.periods.${pIndex}.start_date_of_exposure`,
                        todayISO,
                        { shouldDirty: true }
                      )
                    }
                    onMinus3={() =>
                      setValue(
                        `drug_exposure.${index}.periods.${pIndex}.start_date_of_exposure`,
                        isoMonthsAgo(3),
                        { shouldDirty: true }
                      )
                    }
                    onMinus6={() =>
                      setValue(
                        `drug_exposure.${index}.periods.${pIndex}.start_date_of_exposure`,
                        isoMonthsAgo(6),
                        { shouldDirty: true }
                      )
                    }
                  />
                </td>

                {/* ✅ End date with ordering rule */}
                <td style={styles.td}>
                  <input
                    style={styles.input}
                    type="date"
                    max={todayISO}
                    min={periodStart || undefined}
                    {...register(
                      `drug_exposure.${index}.periods.${pIndex}.date_of_last_exposure`,
                      {
                        validate: (end) => {
                          if (!baseHasChange) return true;
                          if (!periodActive) return true;
                          if (p?.unsure_date) return true;

                          // existing required rule
                          if (!(end || "").trim()) return "End date is required";

                          // ✅ ordering rule
                          if (periodStart && end < periodStart) {
                            return "End date cannot be before start date";
                          }
                          return true;
                        },
                      }
                    )}
                  />
                </td>

                <td style={styles.tdCenter}>
                  <input
                    type="checkbox"
                    {...register(`drug_exposure.${index}.periods.${pIndex}.unsure_date`)}
                  />
                </td>

                {/* Level of exposure (+ Not exposed) */}
                <td style={styles.td}>
                  <select
                    style={styles.select}
                    {...register(
                      `drug_exposure.${index}.periods.${pIndex}.level_of_exposure`,
                      {
                        validate: (v) => {
                          if (!baseHasChange) return true;
                          if (!periodActive) return true;
                          return (v || "").trim()
                            ? true
                            : "Level of exposure is required";
                        },
                      }
                    )}
                  >
                    <option value="">Choose</option>
                    {CHILD_LEVEL_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </td>

                {/* Type of exposure in child rows too */}
                <td style={{ ...styles.td, ...styles.exposureCol }}>
                  <div style={styles.checkboxList}>
                    {EXPOSURE_OPTIONS.map((opt) => (
                      <label key={opt} style={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          value={opt}
                          {...register(
                            `drug_exposure.${index}.periods.${pIndex}.type_of_exposure`
                          )}
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </td>

                {/* Changes/fluctuations for chaining */}
                <td style={styles.tdCenter}>
                  <input
                    type="checkbox"
                    {...register(`drug_exposure.${index}.periods.${pIndex}.has_change`)}
                  />
                </td>
              </tr>

              {/* period validation error row */}
              {showErrors &&
                (pErr?.start_date_of_exposure ||
                  pErr?.date_of_last_exposure ||
                  pErr?.level_of_exposure) && (
                  <tr>
                    <td style={styles.errorRow} colSpan={8}>
                      <span style={styles.errorText}>
                        {drugName} period {pIndex + 2}:{" "}
                        {pErr.start_date_of_exposure?.message ||
                          pErr.date_of_last_exposure?.message ||
                          pErr.level_of_exposure?.message}
                      </span>
                    </td>
                  </tr>
                )}
            </React.Fragment>
          );
        })}

      {/* Parent row-level error line */}
      {showErrors && statusErr && (
        <tr>
          <td style={styles.errorRow} colSpan={8}>
            <span style={styles.errorText}>
              {drugName}: {statusErr.message}
            </span>
          </td>
        </tr>
      )}
    </>
  );
}

export default function DrugExposureTable({
  register,
  control,
  setValue,
  errors,
  showErrors,
}) {
  // ✅ overarching yes/no
  const anyExposure = useWatch({ control, name: "drug_exposure_any" }) || "";

  // ✅ Optional: when user selects "No", clear table so stale data doesn't submit
  useEffect(() => {
    if (anyExposure === "No") {
      // Clear array rows
      setValue("drug_exposure", [], { shouldDirty: false });

      // Clear other info too (optional, but usually desired)
      setValue("drug_exposure_other_info", "", { shouldDirty: false });
    }
  }, [anyExposure, setValue]);

  return (
    <section style={styles.section}>
      <h2 style={styles.h2}>Passive Exposure to drugs</h2>

      {/* ✅ Overarching question */}
      <div style={styles.topQuestionBox}>
        <div style={styles.topQuestionLabel}>
          Have you been exposed to any of the drugs listed above during the 12 months prior to
          sampling?
        </div>

        <div style={styles.topQuestionOptions}>
          {["Yes", "No"].map((v) => (
            <label key={v} style={styles.topQuestionOption}>
              <input
                type="radio"
                value={v}
                {...register("drug_exposure_any", {
                  required: "Please select Yes or No",
                })}
              />
              <span>{v}</span>
            </label>
          ))}
        </div>

        {showErrors && errors?.drug_exposure_any && (
          <div style={styles.topQuestionError}>{errors.drug_exposure_any.message}</div>
        )}
      </div>

      {/* ✅ Only show the table if Yes */}
      {anyExposure === "Yes" && (
        <>
          <p style={styles.infoText}>
            <strong>Drug Exposure:</strong> Please provide details of your drug exposure to the
            best of your knowledge in the table below. If there has been any fluctuations or
            changes in pattern of drug exposure please clarify these in the 'Other information'
            box at the end of the table.
          </p>

          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Drug</th>
                  <th style={styles.thCenter}>Have you been exposed?</th>
                  <th style={styles.th}>Start date</th>
                  <th style={styles.th}>End date</th>
                  <th style={styles.thCenter}>Unsure</th>
                  <th style={styles.th}>Level of exposure</th>
                  <th style={{ ...styles.th, ...styles.exposureColHeader }}>
                    Type of exposure (tick all that apply)
                  </th>
                  <th style={styles.thCenter}>Any changes/fluctuations</th>
                </tr>
              </thead>

              <tbody>
                {drugExposureRows.map((drugName, index) => (
                  <DrugExposureRow
                    key={drugName}
                    drugName={drugName}
                    index={index}
                    register={register}
                    errors={errors}
                    showErrors={showErrors}
                    control={control}
                    setValue={setValue}
                  />
                ))}
              </tbody>

              <tfoot>
                <tr>
                  <td style={styles.td} colSpan={8}>
                    <label style={styles.otherInfoLabel}>
                      Other information (additional drugs, and changes in frequency/pattern of
                      exposure)
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
        </>
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

  // ✅ Overarching question styling
  topQuestionBox: {
    border: "1px solid #eee",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    background: "#fafafa",
  },
  topQuestionLabel: {
    fontWeight: 700,
    marginBottom: 8,
    lineHeight: 1.3,
  },
  topQuestionOptions: {
    display: "flex",
    gap: 18,
    alignItems: "center",
    flexWrap: "wrap",
  },
  topQuestionOption: {
    display: "flex",
    gap: 8,
    alignItems: "center",
  },
  topQuestionError: {
    marginTop: 8,
    color: "crimson",
    fontSize: 12,
    fontWeight: 600,
  },

  infoText: { marginTop: 0, marginBottom: 12, lineHeight: 1.35 },

  tableWrapper: { overflowX: "auto" },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 12,
    minWidth: 0,
    tableLayout: "fixed",
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
    padding: 6,
    borderBottom: "1px solid #ddd",
    background: "#fafafa",
    whiteSpace: "normal",
    verticalAlign: "bottom",
  },

  td: {
    padding: 10,
    borderBottom: "1px solid #eee",
    verticalAlign: "top",
  },
  tdCenter: {
    padding: 6,
    borderBottom: "1px solid #eee",
    textAlign: "center",
    verticalAlign: "middle",
  },

  input: { padding: 6, borderRadius: 6, border: "1px solid #ccc", width: "100%" },
  select: { padding: 6, borderRadius: 6, border: "1px solid #ccc", width: "100%" },

  exposureColHeader: { whiteSpace: "normal" },
  exposureCol: {},

  checkboxList: { display: "flex", flexDirection: "column", gap: 6 },
  checkboxLabel: { display: "flex", gap: 8, alignItems: "flex-start", lineHeight: 1.2 },

  statusStack: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    alignItems: "flex-start",
  },
  statusOption: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    lineHeight: 1.1,
  },

  subRowDrug: { paddingLeft: 22, color: "#444", fontStyle: "italic" },
  subRowArrow: { display: "inline-block", marginRight: 6, color: "#666", fontStyle: "normal" },

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

  errorRow: { padding: 10, borderBottom: "1px solid #eee", background: "#fff5f5" },
  errorText: { color: "crimson", fontSize: 12, fontWeight: 600 },

  // ✅ Added: date shortcut buttons (same as DrugUseTable)
  dateShortcuts: {
    display: "flex",
    gap: 6,
    marginTop: 6,
    flexWrap: "wrap",
  },
  shortcutBtn: {
    padding: "4px 8px",
    borderRadius: 6,
    border: "1px solid #ccc",
    background: "#fff",
    cursor: "pointer",
    fontSize: 11,
  },
};
