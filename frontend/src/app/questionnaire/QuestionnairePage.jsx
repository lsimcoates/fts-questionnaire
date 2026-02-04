import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";

import PersonalDetails from "./sections/PersonalDetails";
import DrugUseTable from "./sections/DrugUseTable";
import DrugExposureTable from "./sections/DrugExposureTable";
import MedicationSection from "./sections/MedicationSection";
import AlcoholSection from "./sections/AlcoholSection";
import HairAndInfluencingSection from "./sections/HairAndInfluencingSection";
import SignatureSection from "./sections/SignatureSection";
import OfflineBanner from "../components/OfflineBanner";
import { saveLocalDraft, loadLocalDraft, queueJob } from "../offline/db";
import { uuid } from "../offline/utils";


import {
  createQuestionnaire,
  updateQuestionnaire,
  getQuestionnaire,
  finalizeQuestionnaire,
} from "../services/api";

export default function QuestionnairePage() {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    reset,
    clearErrors,
    formState: { errors, submitCount },
  } = useForm({
    shouldUnregister: false, 
    defaultValues: {
      // Personal Details
      consent: "",
      client_name: "",
      collector_name: "",
      case_number: "",
      dob: "",
      sex_at_birth: "",
      natural_hair_colour: "",
      blood_borne_infections: "",
      ethnicity: "",
      ethnicity_other_detail: "",
      testing_type: "",

      // Drug tables
      drug_use: [],
      drug_exposure: [],
      drug_exposure_any: "",
      drug_use_other_info: "",
      drug_exposure_other_info: "",

      // Medication
      has_other_medications: "",
      other_medications_details: "",

      // Alcohol
      alcohol_consumed_last_12_months: "",
      alcohol_last_consumed_date: "",
      alcohol_last_date_unsure: false,
      alcohol_weekly_options: [],
      alcohol_other_info: "",

      // Hair + Influencing
      hair_cut_in_last_12_months: "",
      hair_last_cut_date: "",
      hair_last_cut_unsure: false,
      hair_cut_shaved_to_skin: false,
      hair_removed_body_hair_last_12_months: "",

      hair_removed_sites_arms: false,
      hair_removed_sites_arms_last_shaved_date: "",
      hair_removed_sites_arms_last_shaved_unsure: false,

      hair_removed_sites_legs: false,
      hair_removed_sites_legs_last_shaved_date: "",
      hair_removed_sites_legs_last_shaved_unsure: false,

      hair_removed_sites_chest: false,
      hair_removed_sites_chest_last_shaved_date: "",
      hair_removed_sites_chest_last_shaved_unsure: false,

      hair_removed_sites_back: false,
      hair_removed_sites_back_last_shaved_date: "",
      hair_removed_sites_back_last_shaved_unsure: false,

      hair_removed_underarms: false,
      hair_removed_underarms_last_shaved_date: "",
      hair_removed_underarms_last_shaved_unsure: false,

      hair_removed_sites_arms_last_shaved_last_collection: false,
      hair_removed_sites_legs_last_shaved_last_collection: false,
      hair_removed_sites_chest_last_shaved_last_collection: false,
      hair_removed_sites_back_last_shaved_last_collection: false,
      hair_removed_sites_underarms_last_shaved_last_collection: false,


      pregnant_last_12_months: "",
      pregnancy_due_or_birth_date: "",
      pregnancy_due_date_unsure: false,
      pregnancy_weeks: "",
      pregnancy_due_date_not_applicable: false,
      pregnancy_outcome: "",
      hair_dyed_bleached: "",
      hair_last_dyed_bleached_date: "",
      hair_thermal_applications: "",
      hair_wash_frequency: "",
      nails_contact_bleach: "",
      frequent_swimming: "",
      frequent_sunbeds: "",
      frequent_sprays_on_sites: "",
      hair_thermal_frequency: "",
      frequent_swimming_frequency: "",
      frequent_sunbeds_frequency: "",
      frequent_sprays_frequency: "",

      sprays_sites_scalp: false,
      sprays_sites_arms: false,
      sprays_sites_chest: false,
      sprays_sites_legs: false,
      sprays_sites_back: false,

      // Signatures
      client_print_name: "",
      client_signature_date: "",
      client_signature_png: "",

      collector_print_name: "",
      collector_signature_date: "",
      collector_signature_png: "",

      refusal_print_name: "",
      refusal_signature_date: "",
      refusal_signature_png: "",
    },
  });

  const showErrors = submitCount > 0;

  const navigate = useNavigate();
  const { id: routeId } = useParams();

  const [qid, setQid] = useState(
    () => routeId || localStorage.getItem("fts_qid") || ""
  );

  const [statusMsg, setStatusMsg] = useState("");

  // hover tracking
  const [hovered, setHovered] = useState(null);

  const consent = watch("consent"); // "Yes" | "No" | ""
  const hasConsent = consent === "Yes";
  const refused = consent === "No";

  // testing type determines which sections appear
  const testingType = watch("testing_type"); // "Drug & Alcohol" | "Drug Only" | "Alcohol Only" | ""
  const isAlcoholOnly = testingType === "Alcohol Only";

  // if Alcohol Only, clear drug section fields 
  useEffect(() => {
    if (isAlcoholOnly) {
      setValue("drug_use", [], { shouldDirty: false });
      setValue("drug_exposure", [], { shouldDirty: false });
      setValue("drug_use_other_info", "", { shouldDirty: false });
      setValue("drug_exposure_other_info", "", { shouldDirty: false });
      clearErrors(["drug_use", "drug_exposure", "drug_use_other_info", "drug_exposure_other_info"]);
    }
  }, [isAlcoholOnly, setValue, clearErrors]);

  // Load saved draft if we have an ID that is the same
  useEffect(() => {
    async function loadDraft() {
      if (!qid) return;

      // local drafts
      if (qid.startsWith("local:")) {
        const local = await loadLocalDraft(qid);
        if (local?.data) {
          reset(local.data);
          setStatusMsg("Loaded local draft (offline).");
        } else {
          setStatusMsg("Local draft not found.");
        }
        return;
      }

      // server first, fallback to local snapshot if available
      try {
        const record = await getQuestionnaire(qid);
        reset(record.data);
        setStatusMsg(`Loaded draft (${record.status})`);
      } catch {
        const local = await loadLocalDraft(qid);
        if (local?.data) {
          reset(local.data);
          setStatusMsg("Loaded local fallback draft (offline).");
        } else {
          setStatusMsg("Could not load saved draft (clearing saved ID).");
          localStorage.removeItem("fts_qid");
          setQid("");
        }
      }
    }
    loadDraft();
  }, [qid, reset]);

  const saveDraft = async () => {
    setStatusMsg("Saving draft...");
    const payload = watch();

    // OFFLINE -> local save + queue "upsert" (draft sync later)
    if (!navigator.onLine) {
      const id = qid || `local:${uuid()}`;

      await saveLocalDraft(id, payload, {
        case_number: payload.case_number || "",
        status: "draft (local)",
      });

      // queue draft job
      await queueJob({
        job_id: `job:${uuid()}`,
        type: "save",          // <= draft upload later (NOT finalize)
        localDraftId: id,
        created_at: Date.now(),
      });

      setQid(id);
      localStorage.setItem("fts_qid", id);
      setStatusMsg("Saved locally ✅ (offline)");
      navigate("/", { state: { toast: "Draft saved locally ✅" } });
      return;
    }


    // ONLINE -> your normal behaviour (+ local snapshot)
    try {
      if (!qid || qid.startsWith("local:")) {
        const created = await createQuestionnaire(payload);
        setQid(created.id);
        localStorage.setItem("fts_qid", created.id);

        await saveLocalDraft(created.id, payload, { case_number: created.case_number, status: "draft" });

        setStatusMsg(`Draft created ✅ Case ${created.case_number} v${created.version} (ID: ${created.id})`);
        navigate("/", { state: { toast: "Draft saved ✅" } });
      } else {
        await updateQuestionnaire(qid, payload);
        await saveLocalDraft(qid, payload, { case_number: payload.case_number, status: "draft" });
        setStatusMsg("Draft updated ✅");
      }
    } catch (e) {
      const id = qid && !qid.startsWith("local:") ? qid : `local:${uuid()}`;

      await saveLocalDraft(id, payload, {
        case_number: payload.case_number || "",
        status: "draft (local)",
      });

      await queueJob({
        job_id: `job:${uuid()}`,
        type: "save",
        localDraftId: id,
        created_at: Date.now(),
      });

      setQid(id);
      localStorage.setItem("fts_qid", id);
      setStatusMsg("Server unreachable — saved locally ✅ (will sync)");
    }
  };

  useEffect(() => {
    if (routeId && routeId !== qid) {
      setQid(routeId);
    }
  }, [routeId]); 

  const submitFinal = async () => {
    setStatusMsg("Submitting...");
    const payload = watch();

    // OFFLINE -> queue finalize
    if (!navigator.onLine) {
      const localDraftId = qid && qid.startsWith("local:") ? qid : (qid || `local:${uuid()}`);

      await saveLocalDraft(localDraftId, payload, { case_number: payload.case_number || "", status: "queued" });

      await queueJob({
        job_id: `job:${uuid()}`,
        type: "finalize",
        localDraftId,
        serverQid: payload.__server_qid || null,
        created_at: Date.now(),
      });

      localStorage.removeItem("fts_qid");
      setQid("");
      setStatusMsg("Offline: Submission queued ✅ (will sync when online)");
      navigate("/", { state: { toast: "Queued for sync ✅" } });
      return;
    }

    // ONLINE -> normal submit
    try {
      let id = qid;

      if (!id || id.startsWith("local:")) {
        const created = await createQuestionnaire(payload);
        id = created.id;
        setQid(id);
        localStorage.setItem("fts_qid", id);
      } else {
        await updateQuestionnaire(id, payload);
      }

      const result = await finalizeQuestionnaire(id);

      localStorage.removeItem("fts_qid");
      setQid("");

      setStatusMsg(`Submitted ✅ Case ${payload.case_number} (ID: ${result.id})`);
      navigate("/", { state: { toast: "Document Submitted ✅" } });
    } catch (e) {
      // fallback -> queue
      const localDraftId = qid && !qid.startsWith("local:") ? qid : `local:${uuid()}`;

      await saveLocalDraft(localDraftId, payload, { case_number: payload.case_number || "", status: "queued" });

      await queueJob({
        job_id: `job:${uuid()}`,
        type: "finalize",
        localDraftId,
        created_at: Date.now(),
      });

      localStorage.removeItem("fts_qid");
      setQid("");

      setStatusMsg("Submit failed — queued for sync ✅");
      navigate("/", { state: { toast: "Queued for sync ✅" } });
    }
  };

  // Keep normal HTML submit from doing anything unexpected
  const onSubmit = (data) => {
    console.log("FORM SUBMIT (local):", data);
    submitFinal();
  };

  const onInvalid = (errs) => {
    // pop-up message
    alert("Please complete the required fields before continuing.");

    // scroll to the first error field (best effort)
    const firstFieldName = Object.keys(errs || {})[0];
    if (firstFieldName) {
      const el = document.querySelector(`[name="${firstFieldName}"]`);
      if (el && typeof el.scrollIntoView === "function") {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.focus?.();
      }
    }
  };

  const goHome = () => navigate("/");

  return (
    <div style={styles.page}>
      <OfflineBanner />
      {/* Header row with Home button + centered title */}
      <div style={styles.headerRow}>
        <button
          type="button"
          style={{
            ...styles.homeBtn,
            ...(hovered === "home" ? styles.homeBtnHover : {}),
          }}
          onMouseEnter={() => setHovered("home")}
          onMouseLeave={() => setHovered(null)}
          onClick={goHome}
        >
          Home
        </button>

        <h1 style={styles.h1}>FTS Client Questionnaire</h1>

        {/* spacer keeps title centered */}
        <img
          src={`${process.env.PUBLIC_URL}/logo.png`}
          alt="FTS Logo"
          style={styles.headerLogo}
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit, onInvalid)}>
        {/* Always visible */}
        <PersonalDetails
          register={register}
          watch={watch}
          setValue={setValue}
          errors={errors}
          showErrors={showErrors}
        />

        {hasConsent && (
          <>
            {/* Only show drug sections when NOT alcohol-only */}
            {!isAlcoholOnly && (
              <>
                <DrugUseTable
                  register={register}
                  control={control}
                  watch={watch}
                  setValue={setValue}
                  errors={errors}
                  showErrors={showErrors}
                />
                <DrugExposureTable
                  register={register}
                  control={control}
                  setValue={setValue}
                  errors={errors}
                  showErrors={showErrors}
                />
              </>
            )}

            <MedicationSection
              register={register}
              watch={watch}
              setValue={setValue}
              errors={errors}
              showErrors={showErrors}
            />

            <AlcoholSection
              register={register}
              watch={watch}
              setValue={setValue}
              clearErrors={clearErrors}
              errors={errors}
              showErrors={showErrors}
            />

            <HairAndInfluencingSection
              register={register}
              watch={watch}
              setValue={setValue}
              errors={errors}
              showErrors={showErrors}
            />

            <SignatureSection
              register={register}
              control={control}
              watch={watch}
              setValue={setValue}
              errors={errors}
              showErrors={showErrors}
              mode="full"
            />
          </>
        )}

        {refused && (
          <SignatureSection
            register={register}
            control={control}
            watch={watch}
            setValue={setValue}
            mode="refusal-only"
          />
        )}

        <div style={styles.actions}>
          <button
            type="button"
            style={{
              ...styles.secondaryBtn,
              ...(hovered === "save" ? styles.secondaryBtnHover : {}),
            }}
            onMouseEnter={() => setHovered("save")}
            onMouseLeave={() => setHovered(null)}
            onClick={saveDraft}
          >
            Save draft
          </button>

          <button
            type="button"
            style={{
              ...styles.primaryBtn,
              ...(hovered === "submit" ? styles.primaryBtnHover : {}),
            }}
            onMouseEnter={() => setHovered("submit")}
            onMouseLeave={() => setHovered(null)}
            onClick={handleSubmit(submitFinal)}
          >
            Submit
          </button>

          <button
            type="button"
            style={{
              ...styles.homeBtnBottom,
              ...(hovered === "homeBottom" ? styles.homeBtnBottomHover : {}),
            }}
            onMouseEnter={() => setHovered("homeBottom")}
            onMouseLeave={() => setHovered(null)}
            onClick={goHome}
          >
            Home
          </button>
        </div>

        {statusMsg && <p style={styles.status}>{statusMsg}</p>}
        {qid && <p style={styles.statusSmall}>Draft ID: {qid}</p>}
      </form>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: 20,
    fontFamily: "Segoe UI",
    borderRadius: 12,
    background: "white",
    boxShadow: "0 0 0 1px #e6e9ef, 0 8px 24px rgba(0,0,0,0.04)",
  },

  // header layout
  headerRow: {
    display: "grid",
    gridTemplateColumns: "auto 1fr auto",
    alignItems: "center",
    color: "#00528c",
    marginBottom: 18,
  },
  h1: { textAlign: "center", margin: 0 },

  headerLogo: {
    height: 64,
    width: "auto",
    objectFit: "contain",
    justifySelf: "end",
  },

  // Home button (blue)
  homeBtn: {
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid #ccc",
    background: "#00528c",
    color: "white",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 700,
    transition:
      "background 120ms ease, transform 120ms ease, box-shadow 120ms ease",
  },
  homeBtnHover: {
    background: "#004270",
    transform: "translateY(-1px)",
    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
  },

  actions: { display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" },

  // Save draft (plum)
  secondaryBtn: {
    padding: "12px 18px",
    borderRadius: 8,
    border: "1px solid #ccc",
    background: "#904369",
    color: "white",
    cursor: "pointer",
    fontSize: 15,
    fontWeight: 600,
    transition:
      "background 120ms ease, transform 120ms ease, box-shadow 120ms ease",
  },
  secondaryBtnHover: {
    background: "#7b3759",
    transform: "translateY(-1px)",
    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
  },

  // Submit (blue)
  primaryBtn: {
    padding: "12px 18px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    background: "#00528c",
    color: "white",
    fontSize: 15,
    fontWeight: 700,
    transition:
      "background 120ms ease, transform 120ms ease, box-shadow 120ms ease",
  },
  primaryBtnHover: {
    background: "#004270",
    transform: "translateY(-1px)",
    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
  },

  status: { marginTop: 10, fontSize: 14 },
  statusSmall: { marginTop: 6, fontSize: 12, color: "#555" },

  homeBtnBottom: {
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid #ccc",
    background: "#00528c",
    color: "white",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 700,
    transition: "background 120ms ease, transform 120ms ease, box-shadow 120ms ease",
    marginLeft: "auto", // 
  },

  homeBtnBottomHover: {
    background: "#004270",
    transform: "translateY(-1px)",
    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
  },

};
