import React, { useEffect } from "react";
import { todayISO } from "../config/dateUtils";

const FREQ_OPTIONS = ["Daily", "Weekly", "Monthly", "Less than monthly"];

export default function HairAndInfluencingSection({ register, watch, setValue }) {
  // scalp hair cut
  const cutUnsure = watch("hair_last_cut_unsure");

  // body hair removed in last 12 months (Yes/No)
  const removedBodyHair = watch("hair_removed_body_hair_last_12_months"); // "Yes"/"No"

  // pregnancy
  const pregnant = watch("pregnant_last_12_months"); // "Yes"/"No"
  const dueUnsure = watch("pregnancy_due_date_unsure");

  // dyed/bleached
  const dyedBleached = watch("hair_dyed_bleached"); // "Yes"/"No"

  // sites removed from
  const armsSelected = watch("hair_removed_sites_arms");
  const legsSelected = watch("hair_removed_sites_legs");
  const chestSelected = watch("hair_removed_sites_chest");
  const backSelected = watch("hair_removed_sites_back");

  // per-site unsure flags
  const armsUnsure = watch("hair_removed_sites_arms_last_shaved_unsure");
  const legsUnsure = watch("hair_removed_sites_legs_last_shaved_unsure");
  const chestUnsure = watch("hair_removed_sites_chest_last_shaved_unsure");
  const backUnsure = watch("hair_removed_sites_back_last_shaved_unsure");

  // ✅ NEW: influencing parent questions
  const thermal = watch("hair_thermal_applications"); // "Yes"/"No"
  const swimming = watch("frequent_swimming"); // "Yes"/"No"
  const sunbeds = watch("frequent_sunbeds"); // "Yes"/"No"
  const sprays = watch("frequent_sprays_on_sites"); // "Yes"/"No"

  // ✅ NEW: sprays sites
  const spraysScalp = watch("sprays_sites_scalp");
  const spraysArms = watch("sprays_sites_arms");
  const spraysChest = watch("sprays_sites_chest");
  const spraysLegs = watch("sprays_sites_legs");
  const spraysBack = watch("sprays_sites_back");

  // clear scalp cut date if unsure
  useEffect(() => {
    if (cutUnsure) setValue("hair_last_cut_date", "");
  }, [cutUnsure, setValue]);

  // clear pregnancy date if unsure ticked
  useEffect(() => {
    if (dueUnsure) setValue("pregnancy_due_or_birth_date", "");
  }, [dueUnsure, setValue]);

  // if not pregnant, clear pregnancy follow-ups
  useEffect(() => {
    if (pregnant === "No") {
      setValue("pregnancy_due_or_birth_date", "");
      setValue("pregnancy_due_date_unsure", false);
      setValue("pregnancy_weeks", "");
    }
  }, [pregnant, setValue]);

  // if not dyed/bleached, clear follow-up date
  useEffect(() => {
    if (dyedBleached !== "Yes") {
      setValue("hair_last_dyed_bleached_date", "");
    }
  }, [dyedBleached, setValue]);

  // if body hair removal is not Yes, clear all sites + per-site details
  useEffect(() => {
    if (removedBodyHair !== "Yes") {
      setValue("hair_removed_sites_arms", false);
      setValue("hair_removed_sites_legs", false);
      setValue("hair_removed_sites_chest", false);
      setValue("hair_removed_sites_back", false);

      setValue("hair_removed_sites_arms_last_shaved_date", "");
      setValue("hair_removed_sites_arms_last_shaved_unsure", false);

      setValue("hair_removed_sites_legs_last_shaved_date", "");
      setValue("hair_removed_sites_legs_last_shaved_unsure", false);

      setValue("hair_removed_sites_chest_last_shaved_date", "");
      setValue("hair_removed_sites_chest_last_shaved_unsure", false);

      setValue("hair_removed_sites_back_last_shaved_date", "");
      setValue("hair_removed_sites_back_last_shaved_unsure", false);
    }
  }, [removedBodyHair, setValue]);

  // per-site clearing logic (untick clears; unsure clears date)
  useEffect(() => {
    if (!armsSelected) {
      setValue("hair_removed_sites_arms_last_shaved_date", "");
      setValue("hair_removed_sites_arms_last_shaved_unsure", false);
    } else if (armsUnsure) {
      setValue("hair_removed_sites_arms_last_shaved_date", "");
    }
  }, [armsSelected, armsUnsure, setValue]);

  useEffect(() => {
    if (!legsSelected) {
      setValue("hair_removed_sites_legs_last_shaved_date", "");
      setValue("hair_removed_sites_legs_last_shaved_unsure", false);
    } else if (legsUnsure) {
      setValue("hair_removed_sites_legs_last_shaved_date", "");
    }
  }, [legsSelected, legsUnsure, setValue]);

  useEffect(() => {
    if (!chestSelected) {
      setValue("hair_removed_sites_chest_last_shaved_date", "");
      setValue("hair_removed_sites_chest_last_shaved_unsure", false);
    } else if (chestUnsure) {
      setValue("hair_removed_sites_chest_last_shaved_date", "");
    }
  }, [chestSelected, chestUnsure, setValue]);

  useEffect(() => {
    if (!backSelected) {
      setValue("hair_removed_sites_back_last_shaved_date", "");
      setValue("hair_removed_sites_back_last_shaved_unsure", false);
    } else if (backUnsure) {
      setValue("hair_removed_sites_back_last_shaved_date", "");
    }
  }, [backSelected, backUnsure, setValue]);

  // ✅ NEW: clear thermal frequency if "No"
  useEffect(() => {
    if (thermal !== "Yes") {
      setValue("hair_thermal_frequency", "");
    }
  }, [thermal, setValue]);

  // ✅ NEW: clear swimming frequency if "No"
  useEffect(() => {
    if (swimming !== "Yes") {
      setValue("frequent_swimming_frequency", "");
    }
  }, [swimming, setValue]);

  // ✅ NEW: clear sunbeds frequency if "No"
  useEffect(() => {
    if (sunbeds !== "Yes") {
      setValue("frequent_sunbeds_frequency", "");
    }
  }, [sunbeds, setValue]);

  // ✅ NEW: sprays follow-ups (frequency + sites) clearing if "No"
  useEffect(() => {
    if (sprays !== "Yes") {
      setValue("frequent_sprays_frequency", "");

      setValue("sprays_sites_scalp", false);
      setValue("sprays_sites_arms", false);
      setValue("sprays_sites_chest", false);
      setValue("sprays_sites_legs", false);
      setValue("sprays_sites_back", false);
    }
  }, [sprays, setValue]);

  const pregnancyDisabled = pregnant !== "Yes";

  return (
    <section style={styles.section}>
      <h2 style={styles.h2}>Hair Cutting (within the 12 months prior to sampling)</h2>

      {/* Last scalp hair cut */}
      <div style={styles.row}>
        <div style={styles.field}>
          <label style={styles.label}>When did you last cut your scalp hair?</label>
          <input
            style={styles.input}
            type="date"
            max={todayISO}
            disabled={cutUnsure}
            {...register("hair_last_cut_date")}
          />
        </div>
        <div style={styles.unsureWrap}>
          <label style={styles.checkboxLabel}>
            <input type="checkbox" {...register("hair_last_cut_unsure")} />
            Unsure
          </label>
        </div>
      </div>

      {/* Body hair removed yes/no */}
      <div style={styles.field}>
        <label style={styles.label}>
          Have you shaved/removed any body hair in the last 12 months?
        </label>
        <div style={styles.inline}>
          <label style={styles.radioLabel}>
            <input
              type="radio"
              value="Yes"
              {...register("hair_removed_body_hair_last_12_months")}
            />{" "}
            Yes
          </label>
          <label style={styles.radioLabel}>
            <input
              type="radio"
              value="No"
              {...register("hair_removed_body_hair_last_12_months")}
            />{" "}
            No
          </label>
        </div>
      </div>

      {/* Only show sites if Yes */}
      {removedBodyHair === "Yes" && (
        <>
          <div style={styles.field}>
            <label style={styles.label}>Where did you remove hair from?</label>

            <div style={styles.checkboxGrid}>
              <label style={styles.checkboxLabel}>
                <input type="checkbox" {...register("hair_removed_sites_arms")} />
                Arms
              </label>
              <label style={styles.checkboxLabel}>
                <input type="checkbox" {...register("hair_removed_sites_legs")} />
                Legs
              </label>
              <label style={styles.checkboxLabel}>
                <input type="checkbox" {...register("hair_removed_sites_chest")} />
                Chest
              </label>
              <label style={styles.checkboxLabel}>
                <input type="checkbox" {...register("hair_removed_sites_back")} />
                Back
              </label>
            </div>
          </div>

          {armsSelected && (
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>When did you last shave your arms?</label>
                <input
                  style={styles.input}
                  type="date"
                  max={todayISO}
                  disabled={armsUnsure}
                  {...register("hair_removed_sites_arms_last_shaved_date")}
                />
              </div>
              <div style={styles.unsureWrap}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    {...register("hair_removed_sites_arms_last_shaved_unsure")}
                  />
                  Unsure
                </label>
              </div>
            </div>
          )}

          {legsSelected && (
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>When did you last shave your legs?</label>
                <input
                  style={styles.input}
                  type="date"
                  max={todayISO}
                  disabled={legsUnsure}
                  {...register("hair_removed_sites_legs_last_shaved_date")}
                />
              </div>
              <div style={styles.unsureWrap}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    {...register("hair_removed_sites_legs_last_shaved_unsure")}
                  />
                  Unsure
                </label>
              </div>
            </div>
          )}

          {chestSelected && (
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>When did you last shave your chest?</label>
                <input
                  style={styles.input}
                  type="date"
                  max={todayISO}
                  disabled={chestUnsure}
                  {...register("hair_removed_sites_chest_last_shaved_date")}
                />
              </div>
              <div style={styles.unsureWrap}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    {...register("hair_removed_sites_chest_last_shaved_unsure")}
                  />
                  Unsure
                </label>
              </div>
            </div>
          )}

          {backSelected && (
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>When did you last shave your back?</label>
                <input
                  style={styles.input}
                  type="date"
                  max={todayISO}
                  disabled={backUnsure}
                  {...register("hair_removed_sites_back_last_shaved_date")}
                />
              </div>
              <div style={styles.unsureWrap}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    {...register("hair_removed_sites_back_last_shaved_unsure")}
                  />
                  Unsure
                </label>
              </div>
            </div>
          )}
        </>
      )}

      <hr style={styles.hr} />

      <h2 style={styles.h2}>Influencing Factors</h2>

      {/* Pregnant */}
      <div style={styles.field}>
        <label style={styles.label}>
          Are you currently pregnant or have you been pregnant in the 12 months prior sampling?
        </label>
        <div style={styles.inline}>
          <label style={styles.radioLabel}>
            <input type="radio" value="Yes" {...register("pregnant_last_12_months")} /> Yes
          </label>
          <label style={styles.radioLabel}>
            <input type="radio" value="No" {...register("pregnant_last_12_months")} /> No
          </label>
        </div>
      </div>

      {/* Due date / birth date */}
      <div style={styles.row}>
        <div style={styles.field}>
          <label style={styles.label}>If so, when is your due date/when did you give birth?</label>
          <input
            style={styles.input}
            type="date"
            max={todayISO}
            disabled={pregnancyDisabled || dueUnsure}
            {...register("pregnancy_due_or_birth_date")}
          />
        </div>
        <div style={styles.unsureWrap}>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              disabled={pregnancyDisabled}
              {...register("pregnancy_due_date_unsure")}
            />
            Unsure
          </label>
        </div>
      </div>

      {/* Weeks pregnant */}
      <div style={styles.field}>
        <label style={styles.label}>
          How many weeks pregnant were you when you gave birth? (if applicable)
        </label>
        <select style={styles.select} disabled={pregnancyDisabled} {...register("pregnancy_weeks")}>
          <option value="">Choose an item</option>
          <option value="Unsure">Unsure</option>
          {Array.from({ length: 45 }, (_, i) => i).reverse().map((w) => (
            <option key={w} value={String(w)}>
              {w}
            </option>
          ))}
        </select>
      </div>

      {/* Dyed/bleached */}
      <YesNo
        label="Have you dyed/bleached your hair in the 12 months prior to sampling?"
        name="hair_dyed_bleached"
        register={register}
      />

      {/* Follow-up if dyed/bleached */}
      {dyedBleached === "Yes" && (
        <div style={styles.field}>
          <label style={styles.label}>
            To the best of your knowledge, when did you last dye/bleach your scalp hair? (if unsure leave blank)
          </label>
          <input
            style={styles.input}
            type="date"
            max={todayISO}
            {...register("hair_last_dyed_bleached_date")}
          />
        </div>
      )}

      {/* Thermal applications */}
      <YesNo
        label="Have you used thermal applications (i.e. hair straighteners) on your scalp hair?"
        name="hair_thermal_applications"
        register={register}
      />

      {/* ✅ NEW: thermal frequency */}
      {thermal === "Yes" && (
        <div style={styles.field}>
          <label style={styles.label}>How often do you use thermal applications?</label>
          <select style={styles.select} {...register("hair_thermal_frequency")}>
            <option value="">Choose an item</option>
            {FREQ_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Wash frequency */}
      <div style={styles.field}>
        <label style={styles.label}>How often do you wash your hair?</label>
        <select style={styles.select} {...register("hair_wash_frequency")}>
          <option value="">Choose an item</option>
          <option value="Daily">Daily</option>
          <option value="Every other day">Every other day</option>
          <option value="2–3 times per week">2–3 times per week</option>
          <option value="Weekly">Weekly</option>
          <option value="Less than weekly">Less than weekly</option>
          <option value="Unsure">Unsure</option>
        </select>
      </div>

      {/* Nails contact with bleach */}
      <div style={styles.field}>
        <label style={styles.label}>Have your nails had direct contact with bleach?</label>
        <select style={styles.select} {...register("nails_contact_bleach")}>
          <option value="">Choose an item</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
          <option value="Unsure">Unsure</option>
        </select>
      </div>

      {/* Swim/hot tubs */}
      <YesNo
        label="Do you swim in a pool or use hot tubs?"
        name="frequent_swimming"
        register={register}
      />

      {/* ✅ NEW: swimming frequency */}
      {swimming === "Yes" && (
        <div style={styles.field}>
          <label style={styles.label}>How often do you swim or use hot tubs?</label>
          <select style={styles.select} {...register("frequent_swimming_frequency")}>
            <option value="">Choose an item</option>
            {FREQ_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Sunbeds */}
      <YesNo label="Do you use sunbeds?" name="frequent_sunbeds" register={register} />

      {/* ✅ NEW: sunbeds frequency */}
      {sunbeds === "Yes" && (
        <div style={styles.field}>
          <label style={styles.label}>How often do you use sunbeds?</label>
          <select style={styles.select} {...register("frequent_sunbeds_frequency")}>
            <option value="">Choose an item</option>
            {FREQ_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Sprays on sample sites */}
      <YesNo
        label="Have you applied hairspray, perfume/aftershave, deodorant and/or dry shampoo to the sample sites?"
        name="frequent_sprays_on_sites"
        register={register}
      />

      {/* ✅ NEW: sprays follow-ups */}
      {sprays === "Yes" && (
        <>
          <div style={styles.field}>
            <label style={styles.label}>How often have you applied these products to the sample sites?</label>
            <select style={styles.select} {...register("frequent_sprays_frequency")}>
              <option value="">Choose an item</option>
              {FREQ_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Which sites have these been applied to?</label>
            <div style={styles.checkboxGrid}>
              <label style={styles.checkboxLabel}>
                <input type="checkbox" {...register("sprays_sites_scalp")} />
                Scalp
              </label>
              <label style={styles.checkboxLabel}>
                <input type="checkbox" {...register("sprays_sites_arms")} />
                Arms
              </label>
              <label style={styles.checkboxLabel}>
                <input type="checkbox" {...register("sprays_sites_chest")} />
                Chest
              </label>
              <label style={styles.checkboxLabel}>
                <input type="checkbox" {...register("sprays_sites_legs")} />
                Legs
              </label>
              <label style={styles.checkboxLabel}>
                <input type="checkbox" {...register("sprays_sites_back")} />
                Back
              </label>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function YesNo({ label, name, register }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      <div style={styles.inline}>
        <label style={styles.radioLabel}>
          <input type="radio" value="Yes" {...register(name)} /> Yes
        </label>
        <label style={styles.radioLabel}>
          <input type="radio" value="No" {...register(name)} /> No
        </label>
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
  h2: { marginBottom: 12, color: "#904369" },
  hr: { margin: "18px 0", border: "none", borderTop: "1px solid #eee" },

  row: { display: "flex", gap: 18, flexWrap: "wrap", alignItems: "flex-end" },
  field: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 },
  label: { fontWeight: 600 },

  input: { padding: 8, borderRadius: 6, border: "1px solid #ccc", minWidth: 240 },
  select: { padding: 8, borderRadius: 6, border: "1px solid #ccc", minWidth: 280 },

  unsureWrap: { paddingBottom: 2 },
  checkboxLabel: { display: "flex", gap: 8, alignItems: "center", fontWeight: 600 },

  inline: { display: "flex", gap: 18, alignItems: "center" },
  radioLabel: { display: "flex", gap: 8, alignItems: "center" },

  checkboxGrid: { display: "flex", gap: 18, flexWrap: "wrap" },
};
