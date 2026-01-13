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
    formState: { errors },
  } = useForm({
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

      // Drug tables
      drug_use: [],
      drug_exposure: [],
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
      hair_last_cut_date: "",
      hair_last_cut_unsure: false,
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

      pregnant_last_12_months: "",
      pregnancy_due_or_birth_date: "",
      pregnancy_due_date_unsure: false,
      pregnancy_weeks: "",
      hair_dyed_bleached: "",
      hair_last_dyed_bleached_date: "",
      hair_thermal_applications: "",
      hair_wash_frequency: "",
      nails_contact_bleach: "",
      frequent_swimming: "",
      frequent_sunbeds: "",
      frequent_sprays_on_sites: "",

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

  const navigate = useNavigate();
  const { id: routeId } = useParams();

  const [qid, setQid] = useState(
    () => routeId || localStorage.getItem("fts_qid") || ""
  );

  const [statusMsg, setStatusMsg] = useState("");

  const consent = watch("consent"); // "Yes" | "No" | ""
  const hasConsent = consent === "Yes";
  const refused = consent === "No";

  // Load saved draft if we have an ID
  useEffect(() => {
    async function loadDraft() {
      if (!qid) return;
      try {
        const record = await getQuestionnaire(qid);
        reset(record.data);
        setStatusMsg(`Loaded draft (${record.status})`);
      } catch (e) {
        setStatusMsg("Could not load saved draft (clearing saved ID).");
        localStorage.removeItem("fts_qid");
        setQid("");
      }
    }
    loadDraft();
  }, [qid, reset]);

  const saveDraft = async () => {
    setStatusMsg("Saving draft...");
    const payload = watch(); // entire form JSON

    try {
      if (!qid) {
        const created = await createQuestionnaire(payload);
        setQid(created.id);
        localStorage.setItem("fts_qid", created.id);
        setStatusMsg(
          `Draft created ✅ Case ${created.case_number} v${created.version} (ID: ${created.id})`
        );
        navigate("/", { state: { toast: "Draft saved ✅" } });
      } else {
        await updateQuestionnaire(qid, payload);
        setStatusMsg("Draft updated ✅");
      }
    } catch (e) {
      setStatusMsg(`Save failed: ${e.message}`);
    }
  };

  useEffect(() => {
    if (routeId && routeId !== qid) {
      setQid(routeId);
    }
  }, [routeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const submitFinal = async () => {
    setStatusMsg("Submitting...");
    const payload = watch();

    try {
      let id = qid;

      if (!id) {
        const created = await createQuestionnaire(payload);
        id = created.id;
        setQid(id);
        localStorage.setItem("fts_qid", id);
      } else {
        await updateQuestionnaire(id, payload);
      }

      const result = await finalizeQuestionnaire(id);

      // ✅ CLEAR LOCAL DRAFT STATE AFTER SUCCESSFUL SUBMIT
      localStorage.removeItem("fts_qid");
      setQid("");

      setStatusMsg(`Submitted ✅ Case ${payload.case_number} (ID: ${result.id})`);
      navigate("/", { state: { toast: "Document Submitted ✅" } });
    } catch (e) {
      setStatusMsg(`Submit failed: ${e.message}`);
    }
  };

  // Keep normal HTML submit from doing anything unexpected
  const onSubmit = (data) => {
    console.log("FORM SUBMIT (local):", data);
    submitFinal();
  };

  const goHome = () => navigate("/");

  return (
    <div style={styles.page}>
      {/* ✅ Header row with Home button + centered title */}
      <div style={styles.headerRow}>
        <button type="button" style={styles.homeBtn} onClick={goHome}>
          Home
        </button>
        <h1 style={styles.h1}>FTS Client Questionnaire</h1>
        {/* spacer keeps title centered */}
        <div style={styles.headerSpacer} />
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Always visible */}
        <PersonalDetails register={register} errors={errors} />

        {hasConsent && (
          <>
            <DrugUseTable register={register} />
            <DrugExposureTable register={register} />
            <MedicationSection register={register} watch={watch} setValue={setValue} />
            <AlcoholSection register={register} watch={watch} setValue={setValue} />
            <HairAndInfluencingSection register={register} watch={watch} setValue={setValue} />

            <SignatureSection
              register={register}
              control={control}
              watch={watch}
              setValue={setValue}
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
            style={styles.secondaryBtn}
            onClick={handleSubmit(saveDraft)}
          >
            Save draft
          </button>

          <button
            type="button"
            style={styles.primaryBtn}
            onClick={handleSubmit(submitFinal)}
          >
            Submit
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
    fontFamily: "Arial",
  },

  // ✅ header layout
  headerRow: {
    display: "grid",
    gridTemplateColumns: "auto 1fr auto",
    alignItems: "center",
    marginBottom: 18,
  },
  h1: { textAlign: "center", margin: 0 },

  headerSpacer: { width: 78 }, // roughly matches button width to keep title centered

  homeBtn: {
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid #ccc",
    background: "white",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 700,
  },

  actions: { display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" },

  secondaryBtn: {
    padding: "12px 18px",
    borderRadius: 8,
    border: "1px solid #ccc",
    background: "white",
    cursor: "pointer",
    fontSize: 15,
    fontWeight: 600,
  },

  primaryBtn: {
    padding: "12px 18px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    background: "#0b5cff",
    color: "white",
    fontSize: 15,
    fontWeight: 700,
  },

  status: { marginTop: 10, fontSize: 14 },
  statusSmall: { marginTop: 6, fontSize: 12, color: "#555" },
};
