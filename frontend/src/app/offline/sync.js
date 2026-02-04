// frontend/src/offline/sync.js
import { listJobs, removeJob, loadLocalDraft, saveLocalDraft } from "./db";
import {
  createQuestionnaire,
  updateQuestionnaire,
  finalizeQuestionnaire,
  authMe,
} from "../services/api";

/**
 * Sync queued jobs when online.
 *
 * Returns: { synced: number, remaining: number }
 * - Stops on first failure to avoid deleting jobs when backend/auth is down.
 */
export async function syncOutbox() {
  // If offline, do nothing
  if (!navigator.onLine) return { synced: 0, remaining: (await listJobs()).length };

  // If device isn't allowed for offline mode, don't sync (optional safety)
  // (If you want to allow syncing anyway, remove this block.)
  const offlineAllowed = localStorage.getItem("fts_offline_allowed") === "1";
  if (!offlineAllowed) return { synced: 0, remaining: (await listJobs()).length };

  // Ensure user is authenticated (important: cookie might not be present)
  // If this fails, we can't hit protected endpoints.
  try {
    await authMe();
  } catch (e) {
    // Not logged in / cookie missing
    return { synced: 0, remaining: (await listJobs()).length };
  }

  const jobs = await listJobs();
  let synced = 0;

  // Process oldest-first
  jobs.sort((a, b) => (a.created_at || 0) - (b.created_at || 0));

  for (const job of jobs) {
    try {
      if (job.type === "finalize") {
        await handleFinalizeJob(job);
        await removeJob(job.job_id);
        synced += 1;
      } else if (job.type === "save") {
        await handleSaveJob(job);
        await removeJob(job.job_id);
        synced += 1;
      } else {
        // Unknown job: remove so it doesn't block forever (or keep if you prefer)
        await removeJob(job.job_id);
      }
    } catch (e) {
      // Stop on first failure; leave remaining jobs to retry next time.
      break;
    }
  }

  const remaining = (await listJobs()).length;
  return { synced, remaining };
}

/**
 * Job: finalize
 * - ensures record exists on server (create if needed)
 * - updates payload
 * - finalizes (locks)
 */
async function handleFinalizeJob(job) {
  const localId = job.localDraftId;
  const local = await loadLocalDraft(localId);

  if (!local?.data) throw new Error("Local draft missing");
  const payload = local.data;

  // You can store a server id on the local draft meta, if you want.
  // For now: if the local id is actually a server id (not local:), use it.
  let serverId = null;

  if (typeof localId === "string" && !localId.startsWith("local:")) {
    serverId = localId;
  }

  // If you have a saved server id in meta, prefer it:
  if (!serverId && local?.meta?.server_id) {
    serverId = local.meta.server_id;
  }

  // Create if no server id
  if (!serverId) {
    const created = await createQuestionnaire(payload);
    serverId = created.id;

    // Persist link so future syncs update the same server record (optional)
    await saveLocalDraft(localId, payload, {
      ...(local.meta || {}),
      server_id: serverId,
      case_number: payload.case_number || local.meta?.case_number || "",
      status: "queued",
    });
  }

  // Update then finalize
  await updateQuestionnaire(serverId, payload);
  await finalizeQuestionnaire(serverId);

  // Mark local as submitted/synced (optional)
  await saveLocalDraft(localId, payload, {
    ...(local.meta || {}),
    server_id: serverId,
    case_number: payload.case_number || local.meta?.case_number || "",
    status: "submitted (synced)",
  });
}

/**
 * Job: save (optional support)
 * - pushes a draft save to server without finalizing
 */
async function handleSaveJob(job) {
  const localId = job.localDraftId;
  const local = await loadLocalDraft(localId);
  if (!local?.data) throw new Error("Local draft missing");
  const payload = local.data;

  let serverId = null;

  if (typeof localId === "string" && !localId.startsWith("local:")) {
    serverId = localId;
  }

  if (!serverId && local?.meta?.server_id) {
    serverId = local.meta.server_id;
  }

  if (!serverId) {
    const created = await createQuestionnaire(payload);
    serverId = created.id;
    await saveLocalDraft(localId, payload, {
      ...(local.meta || {}),
      server_id: serverId,
      case_number: payload.case_number || "",
      status: "draft",
    });
  } else {
    await updateQuestionnaire(serverId, payload);
  }

  // keep local marked draft
  await saveLocalDraft(localId, payload, {
    ...(local.meta || {}),
    server_id: serverId,
    case_number: payload.case_number || local.meta?.case_number || "",
    status: "draft",
  });
}
