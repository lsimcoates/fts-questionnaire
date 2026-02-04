import { listJobs, removeJob, loadLocalDraft, deleteLocalDraft } from "./db";
import { createQuestionnaire, updateQuestionnaire, finalizeQuestionnaire } from "../services/api";

export async function syncOutbox() {
  if (!navigator.onLine) return { ok: false, synced: 0 };

  const jobs = await listJobs();
  jobs.sort((a, b) => (a.created_at || 0) - (b.created_at || 0));

  let synced = 0;

  for (const job of jobs) {
    try {
      if (job.type !== "finalize") {
        await removeJob(job.job_id);
        continue;
      }

      const local = await loadLocalDraft(job.localDraftId);
      if (!local?.data) {
        await removeJob(job.job_id);
        continue;
      }

      const payload = local.data;

      // Create or update, then finalize
      let qid = job.serverQid || payload.__server_qid || null;

      if (!qid) {
        const created = await createQuestionnaire(payload);
        qid = created.id;

        // stash qid into payload for safety if sync runs again mid-way
        payload.__server_qid = qid;
        await updateQuestionnaire(qid, payload);
      } else {
        await updateQuestionnaire(qid, payload);
      }

      await finalizeQuestionnaire(qid);

      // Cleanup
      await removeJob(job.job_id);
      await deleteLocalDraft(job.localDraftId);
      synced += 1;
    } catch {
      // stop if auth expired / backend unreachable
      break;
    }
  }

  return { ok: true, synced };
}
