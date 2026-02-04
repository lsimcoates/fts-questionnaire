import React, { useEffect } from "react";
import { todayISO } from "../config/dateUtils";

const FREQ_OPTIONS = ["Daily", "Weekly", "Monthly", "Less than monthly"];

export default function HairAndInfluencingSection({
  register,
  watch,
  setValue,
  trigger,
  errors,
  showErrors,
}) {
  // parent scalp cut question
  const cutInLast12Months = watch("hair_cut_in_last_12_months"); 

  // scalp hair cut follow-ups
  const cutUnsure = watch("hair_last_cut_unsure");

  // body hair removed in last 12 months (Yes/No)
  const removedBodyHair = watch("hair_removed_body_hair_last_12_months"); 

  // pregnancy
  const sexAtBirth = watch("sex_at_birth"); 
  const pregnancyLocked = sexAtBirth === "Male";
  const pregnant = watch("pregnant_last_12_months"); 
  const dueUnsure = watch("pregnancy_due_date_unsure");

  //  pregnancy not applicable + outcome
  const dueNotApplicable = watch("pregnancy_due_date_not_applicable"); 
  const pregnancyOutcome = watch("pregnancy_outcome"); 

  // dyed/bleached
  const dyedBleached = watch("hair_dyed_bleached"); 

  // sites removed from
  const armsSelected = watch("hair_removed_sites_arms");
  const legsSelected = watch("hair_removed_sites_legs");
  const chestSelected = watch("hair_removed_sites_chest");
  const backSelected = watch("hair_removed_sites_back");
  const underarmsSelected = watch("hair_removed_sites_underarms");

  // per-site unsure flags
  const armsUnsure = watch("hair_removed_sites_arms_last_shaved_unsure");
  const legsUnsure = watch("hair_removed_sites_legs_last_shaved_unsure");
  const chestUnsure = watch("hair_removed_sites_chest_last_shaved_unsure");
  const backUnsure = watch("hair_removed_sites_back_last_shaved_unsure");
  const underarmsUnsure = watch("hair_removed_sites_underarms_last_shaved_unsure");

  // per-site last collection flags
  const armsLastCollection = watch(
    "hair_removed_sites_arms_last_shaved_last_collection"
  );
  const legsLastCollection = watch(
    "hair_removed_sites_legs_last_shaved_last_collection"
  );
  const chestLastCollection = watch(
    "hair_removed_sites_chest_last_shaved_last_collection"
  );
  const backLastCollection = watch(
    "hair_removed_sites_back_last_shaved_last_collection"
  );
  const underarmsLastCollection = watch(
    "hair_removed_sites_underarms_last_shaved_last_collection"
  );

  // influencing parent questions
  const thermal = watch("hair_thermal_applications");   
  const swimming = watch("frequent_swimming"); 
  const sunbeds = watch("frequent_sunbeds"); 
  const sprays = watch("frequent_sprays_on_sites"); 

  // sprays sites 
  watch("sprays_sites_scalp");
  watch("sprays_sites_arms");
  watch("sprays_sites_chest");
  watch("sprays_sites_legs");
  watch("sprays_sites_back");

  /** Scalp cut logic */

  // If parent is not Yes, clear all cut follow-ups
  useEffect(() => {
    if (cutInLast12Months !== "Yes") {
      setValue("hair_last_cut_date", "", { shouldDirty: false });
      setValue("hair_last_cut_unsure", false, { shouldDirty: false });
      setValue("hair_cut_shaved_to_skin", "", { shouldDirty: false });
    }
  }, [cutInLast12Months, setValue]);

  // clear scalp cut date if unsure
  useEffect(() => {
    if (cutUnsure) setValue("hair_last_cut_date", "", { shouldDirty: false });
  }, [cutUnsure, setValue]);

  // Re-trigger validations when scalp-cut state changes
  useEffect(() => {
    trigger?.([
      "hair_cut_in_last_12_months",
      "hair_last_cut_date",
      "hair_last_cut_unsure",
      "hair_cut_shaved_to_skin",
    ]);
  }, [cutInLast12Months, cutUnsure, trigger]);

  /**Pregnancy logic*/
  useEffect(() => {
    if (!pregnancyLocked) return;

    // force parent answer to No
    setValue("pregnant_last_12_months", "No", { shouldDirty: true });

    // clear all pregnancy follow-ups
    setValue("pregnancy_due_or_birth_date", "", { shouldDirty: false });
    setValue("pregnancy_due_date_unsure", false, { shouldDirty: false });
    setValue("pregnancy_due_date_not_applicable", false, { shouldDirty: false });
    setValue("pregnancy_outcome", "", { shouldDirty: false });
    setValue("pregnancy_weeks", "", { shouldDirty: false });

    // revalidate in case pregnancy errors were showing
    trigger?.([
      "pregnant_last_12_months",
      "pregnancy_due_or_birth_date",
      "pregnancy_due_date_unsure",
      "pregnancy_due_date_not_applicable",
      "pregnancy_outcome",
      "pregnancy_weeks",
    ]);
  }, [pregnancyLocked, setValue, trigger]);

  // clear pregnancy date if unsure ticked
  useEffect(() => {
    if (dueUnsure) {
      setValue("pregnancy_due_or_birth_date", "", { shouldDirty: false });
      // mutual exclusion
      setValue("pregnancy_due_date_not_applicable", false, { shouldDirty: false });
      setValue("pregnancy_outcome", "", { shouldDirty: false });
    }
  }, [dueUnsure, setValue]);

  // clear pregnancy date if not-applicable ticked (and mutually exclude unsure)
  useEffect(() => {
    if (dueNotApplicable) {
      setValue("pregnancy_due_or_birth_date", "", { shouldDirty: false });
      setValue("pregnancy_due_date_unsure", false, { shouldDirty: false });
    } else {
      // if they untick not applicable, clear outcome
      setValue("pregnancy_outcome", "", { shouldDirty: false });
    }
  }, [dueNotApplicable, setValue]);

  // if not pregnant, clear pregnancy follow-ups
  useEffect(() => {
    if (pregnant !== "Yes") {
      setValue("pregnancy_due_or_birth_date", "", { shouldDirty: false });
      setValue("pregnancy_due_date_unsure", false, { shouldDirty: false });
      setValue("pregnancy_due_date_not_applicable", false, { shouldDirty: false });
      setValue("pregnancy_outcome", "", { shouldDirty: false });
      setValue("pregnancy_weeks", "", { shouldDirty: false });
    }
  }, [pregnant, setValue]);

  // Re-trigger pregnancy validations when relevant state changes
  useEffect(() => {
    trigger?.([
      "pregnancy_due_or_birth_date",
      "pregnancy_due_date_unsure",
      "pregnancy_due_date_not_applicable",
      "pregnancy_outcome",
    ]);
  }, [pregnant, dueUnsure, dueNotApplicable, pregnancyOutcome, trigger]);

  /**Dyed/bleached logic*/

  // if not dyed/bleached, clear follow-up date
  useEffect(() => {
    if (dyedBleached !== "Yes") {
      setValue("hair_last_dyed_bleached_date", "", { shouldDirty: false });
    }
  }, [dyedBleached, setValue]);

  /** Body hair removal logic*/

  // if body hair removal is not Yes, clear all sites + per-site details
  useEffect(() => {
    if (removedBodyHair !== "Yes") {
      setValue("hair_removed_sites_arms", false, { shouldDirty: false });
      setValue("hair_removed_sites_legs", false, { shouldDirty: false });
      setValue("hair_removed_sites_chest", false, { shouldDirty: false });
      setValue("hair_removed_sites_back", false, { shouldDirty: false });
      setValue("hair_removed_sites_underarms", false, { shouldDirty: false });

      // arms
      setValue("hair_removed_sites_arms_last_shaved_date", "", {
        shouldDirty: false,
      });
      setValue("hair_removed_sites_arms_last_shaved_unsure", false, {
        shouldDirty: false,
      });
      setValue("hair_removed_sites_arms_last_shaved_last_collection", false, {
        shouldDirty: false,
      });

      // legs
      setValue("hair_removed_sites_legs_last_shaved_date", "", {
        shouldDirty: false,
      });
      setValue("hair_removed_sites_legs_last_shaved_unsure", false, {
        shouldDirty: false,
      });
      setValue("hair_removed_sites_legs_last_shaved_last_collection", false, {
        shouldDirty: false,
      });

      // chest
      setValue("hair_removed_sites_chest_last_shaved_date", "", {
        shouldDirty: false,
      });
      setValue("hair_removed_sites_chest_last_shaved_unsure", false, {
        shouldDirty: false,
      });
      setValue("hair_removed_sites_chest_last_shaved_last_collection", false, {
        shouldDirty: false,
      });

      // back
      setValue("hair_removed_sites_back_last_shaved_date", "", {
        shouldDirty: false,
      });
      setValue("hair_removed_sites_back_last_shaved_unsure", false, {
        shouldDirty: false,
      });
      setValue("hair_removed_sites_back_last_shaved_last_collection", false, {
        shouldDirty: false,
      });

      // underarms
      setValue("hair_removed_sites_underarms_last_shaved_date", "", {
        shouldDirty: false,
      });
      setValue("hair_removed_sites_underarms_last_shaved_unsure", false, {
        shouldDirty: false,
      });
      setValue(
        "hair_removed_sites_underarms_last_shaved_last_collection",
        false,
        { shouldDirty: false }
      );
    }
  }, [removedBodyHair, setValue]);

  //enforce mutual exclusion & clear date if unsure/last-collection
  function handleSiteState({
    selected,
    unsure,
    lastCollection,
    dateField,
    unsureField,
    lastCollectionField,
  }) {
    if (!selected) {
      setValue(dateField, "", { shouldDirty: false });
      setValue(unsureField, false, { shouldDirty: false });
      setValue(lastCollectionField, false, { shouldDirty: false });
      return;
    }

    if (unsure) {
      setValue(dateField, "", { shouldDirty: false });
      setValue(lastCollectionField, false, { shouldDirty: false });
      return;
    }

    if (lastCollection) {
      setValue(dateField, "", { shouldDirty: false });
      setValue(unsureField, false, { shouldDirty: false });
    }
  }

  // Per-site clearing logic
  useEffect(() => {
    handleSiteState({
      selected: armsSelected,
      unsure: armsUnsure,
      lastCollection: armsLastCollection,
      dateField: "hair_removed_sites_arms_last_shaved_date",
      unsureField: "hair_removed_sites_arms_last_shaved_unsure",
      lastCollectionField: "hair_removed_sites_arms_last_shaved_last_collection",
    });
  }, [armsSelected, armsUnsure, armsLastCollection]);

  useEffect(() => {
    handleSiteState({
      selected: legsSelected,
      unsure: legsUnsure,
      lastCollection: legsLastCollection,
      dateField: "hair_removed_sites_legs_last_shaved_date",
      unsureField: "hair_removed_sites_legs_last_shaved_unsure",
      lastCollectionField: "hair_removed_sites_legs_last_shaved_last_collection",
    });
  }, [legsSelected, legsUnsure, legsLastCollection]);

  useEffect(() => {
    handleSiteState({
      selected: chestSelected,
      unsure: chestUnsure,
      lastCollection: chestLastCollection,
      dateField: "hair_removed_sites_chest_last_shaved_date",
      unsureField: "hair_removed_sites_chest_last_shaved_unsure",
      lastCollectionField:
        "hair_removed_sites_chest_last_shaved_last_collection",
    });
  }, [chestSelected, chestUnsure, chestLastCollection]);

  useEffect(() => {
    handleSiteState({
      selected: backSelected,
      unsure: backUnsure,
      lastCollection: backLastCollection,
      dateField: "hair_removed_sites_back_last_shaved_date",
      unsureField: "hair_removed_sites_back_last_shaved_unsure",
      lastCollectionField: "hair_removed_sites_back_last_shaved_last_collection",
    });
  }, [backSelected, backUnsure, backLastCollection]);

  useEffect(() => {
    handleSiteState({
      selected: underarmsSelected,
      unsure: underarmsUnsure,
      lastCollection: underarmsLastCollection,
      dateField: "hair_removed_sites_underarms_last_shaved_date",
      unsureField: "hair_removed_sites_underarms_last_shaved_unsure",
      lastCollectionField:
        "hair_removed_sites_underarms_last_shaved_last_collection",
    });
  }, [underarmsSelected, underarmsUnsure, underarmsLastCollection]);

  /** Influencing factor clearing */

  // clear thermal frequency if "No"
  useEffect(() => {
    if (thermal !== "Yes")
      setValue("hair_thermal_frequency", "", { shouldDirty: false });
  }, [thermal, setValue]);

  // clear swimming frequency if "No"
  useEffect(() => {
    if (swimming !== "Yes")
      setValue("frequent_swimming_frequency", "", { shouldDirty: false });
  }, [swimming, setValue]);

  // clear sunbeds frequency if "No"
  useEffect(() => {
    if (sunbeds !== "Yes")
      setValue("frequent_sunbeds_frequency", "", { shouldDirty: false });
  }, [sunbeds, setValue]);

  // sprays follow-ups clearing if "No"
  useEffect(() => {
    if (sprays !== "Yes") {
      setValue("frequent_sprays_frequency", "", { shouldDirty: false });
      setValue("sprays_sites_scalp", false, { shouldDirty: false });
      setValue("sprays_sites_arms", false, { shouldDirty: false });
      setValue("sprays_sites_chest", false, { shouldDirty: false });
      setValue("sprays_sites_legs", false, { shouldDirty: false });
      setValue("sprays_sites_back", false, { shouldDirty: false });
    }
  }, [sprays, setValue]);

  // pregnancy weeks is NOT required

  const SiteFlags = ({ unsureName, lastCollectionName }) => {
    const unsureReg = register(unsureName);
    const lastReg = register(lastCollectionName);

    return (
      <div style={styles.unsureWrap}>
        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            {...unsureReg}
            onChange={(e) => {
              unsureReg.onChange(e);
              if (e.target.checked) {
                setValue(lastCollectionName, false, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }
            }}
          />
          Unsure
        </label>

        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            {...lastReg}
            onChange={(e) => {
              lastReg.onChange(e);
              if (e.target.checked) {
                setValue(unsureName, false, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }
            }}
          />
          Last collection
        </label>
      </div>
    );
  };

  return (
    <section style={styles.section}>
      <h2 style={styles.h2}>
        Hair Cutting (within the 12 months prior to sampling)
      </h2>

      {/* Parent scalp cut question */}
      <div style={styles.field}>
        <label style={styles.label}>
          Have you cut your scalp hair in the 12 months prior to sample
          collection/since your previous test?
        </label>

        <div style={styles.inline}>
          <label style={styles.radioLabel}>
            <input
              type="radio"
              value="Yes"
              {...register("hair_cut_in_last_12_months", {
                required: "Please select an option",
              })}
            />{" "}
            Yes
          </label>

          <label style={styles.radioLabel}>
            <input
              type="radio"
              value="No"
              {...register("hair_cut_in_last_12_months", {
                required: "Please select an option",
              })}
            />{" "}
            No
          </label>
        </div>

        {showErrors && errors?.hair_cut_in_last_12_months && (
          <div style={styles.errorText}>
            {errors.hair_cut_in_last_12_months.message}
          </div>
        )}
      </div>

      {/* Only show cut follow-ups if Yes */}
      {cutInLast12Months === "Yes" && (
        <>
          {/* Last scalp hair cut date */}
          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>
                When did you last cut your scalp hair?
              </label>
              <input
                style={styles.input}
                type="date"
                max={todayISO}
                disabled={cutUnsure}
                {...register("hair_last_cut_date", {
                  validate: (v) => {
                    if (cutInLast12Months !== "Yes") return true;
                    if (cutUnsure) return true;
                    return (v || "").trim()
                      ? true
                      : "Please enter a date or tick Unsure";
                  },
                })}
              />
            </div>
            <div style={styles.unsureWrap}>
              <label style={styles.checkboxLabel}>
                <input type="checkbox" {...register("hair_last_cut_unsure")} />
                Unsure
              </label>
            </div>
          </div>

          {showErrors && errors?.hair_last_cut_date && (
            <div style={styles.errorText}>
              {errors.hair_last_cut_date.message}
            </div>
          )}

          {/* Was shaved to the skin? */}
          <div style={styles.field}>
            <label style={styles.label}>Was scalp hair shaved to the skin?</label>

            <div style={styles.inline}>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  value="Yes"
                  {...register("hair_cut_shaved_to_skin", {
                    validate: (v) => {
                      if (cutInLast12Months !== "Yes") return true;
                      return v ? true : "Please select an option";
                    },
                  })}
                />{" "}
                Yes
              </label>

              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  value="No"
                  {...register("hair_cut_shaved_to_skin", {
                    validate: (v) => {
                      if (cutInLast12Months !== "Yes") return true;
                      return v ? true : "Please select an option";
                    },
                  })}
                />{" "}
                No
              </label>
            </div>

            {showErrors && errors?.hair_cut_shaved_to_skin && (
              <div style={styles.errorText}>
                {errors.hair_cut_shaved_to_skin.message}
              </div>
            )}
          </div>
        </>
      )}

      {/* Body hair removed yes/no */}
      <div style={styles.field}>
        <label style={styles.label}>
          Have you shaved (to the skin)/removed any body hair in the last 12 months?
        </label>

        <div style={styles.inline}>
          <label style={styles.radioLabel}>
            <input
              type="radio"
              value="Yes"
              {...register("hair_removed_body_hair_last_12_months", {
                required: "Please select an option",
              })}
            />{" "}
            Yes
          </label>

          <label style={styles.radioLabel}>
            <input
              type="radio"
              value="No"
              {...register("hair_removed_body_hair_last_12_months", {
                required: "Please select an option",
              })}
            />{" "}
            No
          </label>
        </div>

        {showErrors && errors?.hair_removed_body_hair_last_12_months && (
          <div style={styles.errorText}>
            {errors.hair_removed_body_hair_last_12_months.message}
          </div>
        )}
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
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  {...register("hair_removed_sites_underarms")}
                />
                Underarms
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
                  disabled={armsUnsure || armsLastCollection}
                  {...register("hair_removed_sites_arms_last_shaved_date", {
                    onChange: (e) => {
                      if ((e.target.value || "").trim()) {
                        setValue(
                          "hair_removed_sites_arms_last_shaved_unsure",
                          false,
                          { shouldDirty: false }
                        );
                        setValue(
                          "hair_removed_sites_arms_last_shaved_last_collection",
                          false,
                          { shouldDirty: false }
                        );
                      }
                    },
                  })}
                />
              </div>

              <SiteFlags
                unsureName="hair_removed_sites_arms_last_shaved_unsure"
                lastCollectionName="hair_removed_sites_arms_last_shaved_last_collection"
              />
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
                  disabled={legsUnsure || legsLastCollection}
                  {...register("hair_removed_sites_legs_last_shaved_date", {
                    onChange: (e) => {
                      if ((e.target.value || "").trim()) {
                        setValue(
                          "hair_removed_sites_legs_last_shaved_unsure",
                          false,
                          { shouldDirty: false }
                        );
                        setValue(
                          "hair_removed_sites_legs_last_shaved_last_collection",
                          false,
                          { shouldDirty: false }
                        );
                      }
                    },
                  })}
                />
              </div>

              <SiteFlags
                unsureName="hair_removed_sites_legs_last_shaved_unsure"
                lastCollectionName="hair_removed_sites_legs_last_shaved_last_collection"
              />
            </div>
          )}

          {chestSelected && (
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>
                  When did you last shave your chest?
                </label>
                <input
                  style={styles.input}
                  type="date"
                  max={todayISO}
                  disabled={chestUnsure || chestLastCollection}
                  {...register("hair_removed_sites_chest_last_shaved_date", {
                    onChange: (e) => {
                      if ((e.target.value || "").trim()) {
                        setValue(
                          "hair_removed_sites_chest_last_shaved_unsure",
                          false,
                          { shouldDirty: false }
                        );
                        setValue(
                          "hair_removed_sites_chest_last_shaved_last_collection",
                          false,
                          { shouldDirty: false }
                        );
                      }
                    },
                  })}
                />
              </div>

              <SiteFlags
                unsureName="hair_removed_sites_chest_last_shaved_unsure"
                lastCollectionName="hair_removed_sites_chest_last_shaved_last_collection"
              />
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
                  disabled={backUnsure || backLastCollection}
                  {...register("hair_removed_sites_back_last_shaved_date", {
                    onChange: (e) => {
                      if ((e.target.value || "").trim()) {
                        setValue(
                          "hair_removed_sites_back_last_shaved_unsure",
                          false,
                          { shouldDirty: false }
                        );
                        setValue(
                          "hair_removed_sites_back_last_shaved_last_collection",
                          false,
                          { shouldDirty: false }
                        );
                      }
                    },
                  })}
                />
              </div>

              <SiteFlags
                unsureName="hair_removed_sites_back_last_shaved_unsure"
                lastCollectionName="hair_removed_sites_back_last_shaved_last_collection"
              />
            </div>
          )}

          {underarmsSelected && (
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>
                  When did you last shave your underarms?
                </label>
                <input
                  style={styles.input}
                  type="date"
                  max={todayISO}
                  disabled={underarmsUnsure || underarmsLastCollection}
                  {...register("hair_removed_sites_underarms_last_shaved_date", {
                    onChange: (e) => {
                      if ((e.target.value || "").trim()) {
                        setValue(
                          "hair_removed_sites_underarms_last_shaved_unsure",
                          false,
                          { shouldDirty: false }
                        );
                        setValue(
                          "hair_removed_sites_underarms_last_shaved_last_collection",
                          false,
                          { shouldDirty: false }
                        );
                      }
                    },
                  })}
                />
              </div>

              <SiteFlags
                unsureName="hair_removed_sites_underarms_last_shaved_unsure"
                lastCollectionName="hair_removed_sites_underarms_last_shaved_last_collection"
              />
            </div>
          )}
        </>
      )}

      <hr style={styles.hr} />

      <h2 style={styles.h2}>Influencing Factors</h2>

      {/* Pregnant */}
      <div style={styles.field}>
        <label style={styles.label}>
          Are you currently pregnant or have you been pregnant in the 12 months
          prior sampling?
        </label>

        <div style={styles.inline}>
          <label style={styles.radioLabel}>
            <input
              type="radio"
              value="Yes"
              disabled={pregnancyLocked}
              {...register("pregnant_last_12_months", {
                required: "Please select an option",
              })}
            />{" "}
            Yes
          </label>
          <label style={styles.radioLabel}>
            <input
              type="radio"
              value="No"
              disabled={pregnancyLocked}
              {...register("pregnant_last_12_months", {
                required: "Please select an option",
              })}
            />{" "}
            No
          </label>
        </div>

        {showErrors && errors?.pregnant_last_12_months && (
          <div style={styles.errorText}>
            {errors.pregnant_last_12_months.message}
          </div>
        )}
      </div>

      {/* Due date / birth date */}
      <div style={styles.row}>
        <div style={styles.field}>
          <label style={styles.label}>
            If so, when is your due date/when did you give birth?
          </label>
          <input
            style={styles.input}
            type="date"
            disabled={pregnancyLocked || pregnant !== "Yes" || dueUnsure || dueNotApplicable}
            {...register("pregnancy_due_or_birth_date", {
              validate: (v) => {
                if (pregnant !== "Yes") return true;
                if (dueUnsure || dueNotApplicable) return true;
                return (v || "").trim()
                  ? true
                  : "Please enter a due/birth date or tick Unsure / Not applicable";
              },
            })}
          />
        </div>

        <div style={styles.unsureWrap}>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              disabled={pregnant !== "Yes"}
              {...register("pregnancy_due_date_unsure", {
                validate: (v) => {
                  if (pregnant !== "Yes") return true;
                  if (v) return true;
                  const naVal = watch("pregnancy_due_date_not_applicable");
                  if (naVal) return true;
                  const dateVal = watch("pregnancy_due_or_birth_date");
                  return (dateVal || "").trim()
                    ? true
                    : "Please enter a due/birth date or tick Unsure / Not applicable";
                },
              })}
              onChange={(e) => {
                const checked = e.target.checked;
                setValue("pregnancy_due_date_unsure", checked, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                if (checked) {
                  setValue("pregnancy_due_date_not_applicable", false, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  setValue("pregnancy_outcome", "", {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }
              }}
            />
            Unsure
          </label>

          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              disabled={pregnancyLocked || pregnant !== "Yes"}
              {...register("pregnancy_due_date_not_applicable", {
                validate: (v) => {
                  if (pregnant !== "Yes") return true;
                  if (v) return true;
                  const unsureVal = watch("pregnancy_due_date_unsure");
                  if (unsureVal) return true;
                  const dateVal = watch("pregnancy_due_or_birth_date");
                  return (dateVal || "").trim()
                    ? true
                    : "Please enter a due/birth date or tick Unsure / Not applicable";
                },
              })}
              onChange={(e) => {
                const checked = e.target.checked;
                setValue("pregnancy_due_date_not_applicable", checked, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                if (checked) {
                  setValue("pregnancy_due_date_unsure", false, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                } else {
                  setValue("pregnancy_outcome", "", {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }
              }}
            />
            Not applicable
          </label>
        </div>
      </div>

      {showErrors &&
        (errors?.pregnancy_due_or_birth_date ||
          errors?.pregnancy_due_date_unsure ||
          errors?.pregnancy_due_date_not_applicable) && (
          <div style={styles.errorText}>
            {errors?.pregnancy_due_or_birth_date?.message ||
              errors?.pregnancy_due_date_unsure?.message ||
              errors?.pregnancy_due_date_not_applicable?.message}
          </div>
        )}

      {/* Outcome only if Not applicable */}
      {pregnant === "Yes" && dueNotApplicable && (
        <div style={styles.field}>
          <label style={styles.label}>Reason (if not applicable)</label>
          <select
            style={styles.select}
            {...register("pregnancy_outcome", {
              validate: (v) => {
                if (pregnant !== "Yes") return true;
                if (!dueNotApplicable) return true;
                return v ? true : "Please select an option";
              },
            })}
          >
            <option value="">Choose an item</option>
            <option value="Termination">Termination</option>
            <option value="Miscarriage">Miscarriage</option>
            <option value="Miscarriage in 3rd trimester">
              Miscarriage in 3rd trimester
            </option>
          </select>

          {showErrors && errors?.pregnancy_outcome && (
            <div style={styles.errorText}>{errors.pregnancy_outcome.message}</div>
          )}
        </div>
      )}

      {/* Weeks pregnant (NOT required) */}
      <div style={styles.field}>
        <label style={styles.label}>
          How many weeks pregnant were you when you gave birth? (if applicable)
        </label>

        <select
          style={styles.select}
          disabled={pregnancyLocked || pregnant !== "Yes"}
          {...register("pregnancy_weeks")}
        >
          <option value="">Choose an item</option>
          <option value="Unsure">Unsure</option>
          {Array.from({ length: 45 }, (_, i) => i)
            .reverse()
            .map((w) => (
              <option key={w} value={String(w)}>
                {w}
              </option>
            ))}
        </select>

        {showErrors && errors?.pregnancy_weeks && (
          <div style={styles.errorText}>{errors.pregnancy_weeks.message}</div>
        )}
      </div>

      {/* Dyed/bleached */}
      <YesNo
        label="Have you dyed/bleached your hair in the 12 months prior to sampling?"
        name="hair_dyed_bleached"
        register={register}
        required={true}
        requiredMessage="Please select an option"
        errors={errors}
        showErrors={showErrors}
      />

      {dyedBleached === "Yes" && (
        <div style={styles.field}>
          <label style={styles.label}>
            To the best of your knowledge, when did you last dye/bleach your
            scalp hair? (if unsure leave blank)
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
        label="Have you used thermal applications (e.g. hair straighteners) applied from the roots of the scalp hair?"
        name="hair_thermal_applications"
        register={register}
        required={true}
        requiredMessage="Please select an option"
        errors={errors}
        showErrors={showErrors}
      />

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
        label="Do you swim in a pool or use hot tubs and submerge your head?"
        name="frequent_swimming"
        register={register}
        required={true}
        requiredMessage="Please select an option"
        errors={errors}
        showErrors={showErrors}
      />

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
      <YesNo
        label="Do you use sunbeds?"
        name="frequent_sunbeds"
        register={register}
        required={true}
        requiredMessage="Please select an option"
        errors={errors}
        showErrors={showErrors}
      />

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

      {/* Sprays */}
      <YesNo
        label="Have you applied hairspray, perfume/aftershave, deodorant and/or dry shampoo to the sample sites?"
        name="frequent_sprays_on_sites"
        register={register}
        required={true}
        requiredMessage="Please select an option"
        errors={errors}
        showErrors={showErrors}
      />

      {sprays === "Yes" && (
        <>
          <div style={styles.field}>
            <label style={styles.label}>
              How often have you applied these products to the sample sites?
            </label>
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

function YesNo({
  label,
  name,
  register,
  required = false,
  requiredMessage = "Please select an option",
  errors,
  showErrors,
}) {
  const rules = required ? { required: requiredMessage } : undefined;
  const err = errors?.[name];

  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>

      <div style={styles.inline}>
        <label style={styles.radioLabel}>
          <input type="radio" value="Yes" {...register(name, rules)} /> Yes
        </label>
        <label style={styles.radioLabel}>
          <input type="radio" value="No" {...register(name, rules)} /> No
        </label>
      </div>

      {showErrors && err && (
        <div style={styles.errorText}>{err.message || requiredMessage}</div>
      )}
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

  input: {
    padding: 8,
    borderRadius: 6,
    border: "1px solid #ccc",
    minWidth: 240,
  },
  select: { padding: 8, borderRadius: 6, border: "1px solid #ccc", minWidth: 280 },

  unsureWrap: {
    paddingBottom: 2,
    display: "flex",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap",
  },

  checkboxLabel: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    fontWeight: 600,
  },

  inline: { display: "flex", gap: 18, alignItems: "center" },
  radioLabel: { display: "flex", gap: 8, alignItems: "center" },

  checkboxGrid: { display: "flex", gap: 18, flexWrap: "wrap" },

  errorText: { color: "crimson", fontSize: 12, marginTop: 4 },
};
