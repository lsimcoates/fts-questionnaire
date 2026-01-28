import React, { useEffect } from "react";
import { useWatch } from "react-hook-form";
import { drugUseRows } from "../config/drugUseConfig";
import { todayISO } from "../config/dateUtils";

const LEVEL_OPTIONS = [
  "Abstinence",
  "Single use",
  "Less than monthly",
  "Monthly",
  "Weekly",
  "Daily",
  "Unsure",
];

function blankPeriod() {
  return {
    start_date_of_use: "",
    date_of_last_use: "",
    unsure_date: false,
    level_of_use: "",
    prescribed: false,
    has_change: false,
  };
}

// helper: is a period row totally empty (so we can trim)
function isEmptyPeriod(p) {
  if (!p) return true;
  return (
    !p.has_change &&
    !p.start_date_of_use &&
    !p.date_of_last_use &&
    !p.level_of_use &&
    !p.unsure_date &&
    !p.prescribed
  );
}

// helper: is a period row "active" (user interacted / filled something / ticked has_change)
function isPeriodActive(p) {
  if (!p) return false;
  return (
    !!p.has_change ||
    !!p.start_date_of_use ||
    !!p.date_of_last_use ||
    !!p.level_of_use ||
    !!p.unsure_date ||
    !!p.prescribed
  );
}

function DrugUseRow({ drug, index, register, errors, showErrors, control, setValue }) {
  const baseHasChange =
    useWatch({ control, name: `drug_use.${index}.has_change` }) || false;

  const periods =
    useWatch({ control, name: `drug_use.${index}.periods` }) || [];

  // ✅ watch parent start + unsure so we can validate parent end date
  const parentStart =
    useWatch({ control, name: `drug_use.${index}.start_date_of_use` }) || "";
  const parentUnsure =
    useWatch({ control, name: `drug_use.${index}.unsure_date` }) || false;

  // Base checkbox controls whether periods exist at all
  useEffect(() => {
    if (baseHasChange) {
      if (!Array.isArray(periods) || periods.length === 0) {
        setValue(`drug_use.${index}.periods`, [blankPeriod()], { shouldDirty: false });
      }
    } else {
      if (Array.isArray(periods) && periods.length > 0) {
        setValue(`drug_use.${index}.periods`, [], { shouldDirty: false });
      }
    }
  }, [baseHasChange, periods, index, setValue]);

  // Chain behaviour: ensure exactly ONE new blank row exists after the last ticked period
  useEffect(() => {
    if (!Array.isArray(periods) || periods.length === 0) return;

    let lastTicked = -1;
    for (let i = 0; i < periods.length; i++) {
      if (periods[i]?.has_change) lastTicked = i;
    }

    if (lastTicked === -1) {
      if (periods.length !== 1) {
        setValue(
          `drug_use.${index}.periods`,
          [periods[0] || blankPeriod()],
          { shouldDirty: false }
        );
      }
      return;
    }

    const desiredLen = lastTicked + 2;

    if (periods.length < desiredLen) {
      const next = [...periods];
      while (next.length < desiredLen) next.push(blankPeriod());
      setValue(`drug_use.${index}.periods`, next, { shouldDirty: false });
      return;
    }

    if (periods.length > desiredLen) {
      const tail = periods.slice(desiredLen);
      const allTailEmpty = tail.every(isEmptyPeriod);

      if (allTailEmpty) {
        setValue(
          `drug_use.${index}.periods`,
          periods.slice(0, desiredLen),
          { shouldDirty: false }
        );
      }
    }
  }, [periods, index, setValue]);

  const statusErr = errors?.drug_use?.[index]?.status;

  return (
    <>
      {/* Parent row */}
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

        {/* Start date */}
        <td style={styles.td}>
          <input
            style={styles.input}
            type="date"
            max={todayISO}
            {...register(`drug_use.${index}.start_date_of_use`)}
          />
        </td>

        {/* ✅ End date: cannot be before start date */}
        <td style={styles.td}>
          <input
            style={styles.input}
            type="date"
            max={todayISO}
            min={parentStart || undefined} // UX: prevents selecting earlier in picker
            {...register(`drug_use.${index}.date_of_last_use`, {
              validate: (end) => {
                // allow blanks
                if (!end || !parentStart) return true;
                // if unsure, ignore ordering
                if (parentUnsure) return true;

                return end >= parentStart
                  ? true
                  : "End date cannot be before start date";
              },
            })}
          />
        </td>

        <td style={styles.tdCenter}>
          <input type="checkbox" {...register(`drug_use.${index}.unsure_date`)} />
        </td>

        <td style={styles.td}>
          <select style={styles.select} {...register(`drug_use.${index}.level_of_use`)}>
            <option value="">Choose</option>
            {LEVEL_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </td>

        <td style={styles.tdCenter}>
          {drug.prescribed ? (
            <input type="checkbox" {...register(`drug_use.${index}.prescribed`)} />
          ) : (
            <span style={styles.muted}>—</span>
          )}
        </td>

        {/* Changes/fluctuations */}
        <td style={styles.tdCenter}>
          <input type="checkbox" {...register(`drug_use.${index}.has_change`)} />
        </td>

        <input
          type="hidden"
          value={drug.name}
          {...register(`drug_use.${index}.drug_name`)}
        />
      </tr>

      {/* Period rows */}
      {Array.isArray(periods) &&
        periods.length > 0 &&
        periods.map((p, pIndex) => {
          const pErr = errors?.drug_use?.[index]?.periods?.[pIndex] || {};
          const periodActive = isPeriodActive(p);

          // ✅ pull start directly from the period object (no hook needed)
          const periodStart = (p?.start_date_of_use || "").trim();

          return (
            <React.Fragment key={`${drug.name}-period-${pIndex}`}>
              <tr>
                <td style={{ ...styles.td, ...styles.subRowDrug }}>
                  <span style={styles.subRowArrow}>↳</span> Period {pIndex + 2}
                </td>

                {/* no used/not used */}
                <td style={styles.tdCenter}><span style={styles.muted}>—</span></td>
                <td style={styles.tdCenter}><span style={styles.muted}>—</span></td>

                <td style={styles.td}>
                  <input
                    style={styles.input}
                    type="date"
                    max={todayISO}
                    {...register(`drug_use.${index}.periods.${pIndex}.start_date_of_use`, {
                      validate: (v) => {
                        if (!baseHasChange) return true;
                        if (!periodActive) return true;
                        if (p?.unsure_date) return true;
                        return (v || "").trim() ? true : "Start date is required";
                      },
                    })}
                  />
                </td>

                <td style={styles.td}>
                  <input
                    style={styles.input}
                    type="date"
                    max={todayISO}
                    min={periodStart || undefined} // UX: prevents selecting earlier
                    {...register(`drug_use.${index}.periods.${pIndex}.date_of_last_use`, {
                      validate: (end) => {
                        if (!baseHasChange) return true;
                        if (!periodActive) return true;
                        if (p?.unsure_date) return true;

                        // required rule
                        if (!(end || "").trim()) return "End date is required";

                        // ✅ ordering rule
                        if (periodStart && end < periodStart) {
                          return "End date cannot be before start date";
                        }
                        return true;
                      },
                    })}
                  />
                </td>

                <td style={styles.tdCenter}>
                  <input
                    type="checkbox"
                    {...register(`drug_use.${index}.periods.${pIndex}.unsure_date`)}
                  />
                </td>

                <td style={styles.td}>
                  <select
                    style={styles.select}
                    {...register(`drug_use.${index}.periods.${pIndex}.level_of_use`, {
                      validate: (v) => {
                        if (!baseHasChange) return true;
                        if (!periodActive) return true;
                        return (v || "").trim() ? true : "Level of use is required";
                      },
                    })}
                  >
                    <option value="">Choose</option>
                    {LEVEL_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </td>

                <td style={styles.tdCenter}>
                  {drug.prescribed ? (
                    <input
                      type="checkbox"
                      {...register(`drug_use.${index}.periods.${pIndex}.prescribed`)}
                    />
                  ) : (
                    <span style={styles.muted}>—</span>
                  )}
                </td>

                <td style={styles.tdCenter}>
                  <input
                    type="checkbox"
                    {...register(`drug_use.${index}.periods.${pIndex}.has_change`)}
                  />
                </td>
              </tr>

              {/* period validation error row */}
              {showErrors &&
                (pErr?.start_date_of_use || pErr?.date_of_last_use || pErr?.level_of_use) && (
                  <tr>
                    <td style={styles.errorRow} colSpan={9}>
                      <span style={styles.errorText}>
                        {drug.name} period {pIndex + 2}:{" "}
                        {pErr.start_date_of_use?.message ||
                          pErr.date_of_last_use?.message ||
                          pErr.level_of_use?.message}
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
          <td style={styles.errorRow} colSpan={9}>
            <span style={styles.errorText}>
              {drug.name}: {statusErr.message}
            </span>
          </td>
        </tr>
      )}
    </>
  );
}

export default function DrugUseTable({ register, control, setValue, errors, showErrors }) {
  return (
    <section style={styles.section}>
      <h2 style={styles.h2}>Drug use</h2>

      <p style={styles.infoText}>
        <strong>Drug Use:</strong> Please provide details of your drug use to the best of your
        knowledge in the table below.
      </p>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Drug</th>
              <th style={styles.thCenter}>Used</th>
              <th style={styles.thCenter}>Not Used</th>
              <th style={styles.th}>Start date</th>
              <th style={styles.th}>End date</th>
              <th style={styles.thCenter}>Unsure</th>
              <th style={styles.th}>Level of use</th>
              <th style={styles.thCenter}>Prescribed to you</th>
              <th style={styles.thCenter}>Any changes/fluctuations in use</th>
            </tr>
          </thead>

          <tbody>
            {drugUseRows.map((drug, index) => (
              <DrugUseRow
                key={drug.name}
                drug={drug}
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
              <td style={styles.td} colSpan={9}>
                <label style={styles.otherInfoLabel}>
                  Other information
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
  },
  thCenter: {
    textAlign: "center",
    padding: 6,
    borderBottom: "1px solid #ddd",
    background: "#fafafa",
    whiteSpace: "normal",
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

  input: { padding: 6, borderRadius: 6, border: "1px solid #ccc" },
  select: { padding: 6, borderRadius: 6, border: "1px solid #ccc", width: "100%" },

  muted: { color: "#999" },

  subRowDrug: { paddingLeft: 22, color: "#444", fontStyle: "italic" },
  subRowArrow: { display: "inline-block", marginRight: 6, color: "#666", fontStyle: "normal" },

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
};
