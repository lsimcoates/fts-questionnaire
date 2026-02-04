import { openDB } from "idb";

const DB_NAME = "fts_offline";
const DB_VERSION = 1;

export async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("drafts")) {
        db.createObjectStore("drafts", { keyPath: "id" }); // id = qid or local:<uuid>
      }
      if (!db.objectStoreNames.contains("outbox")) {
        db.createObjectStore("outbox", { keyPath: "job_id" });
      }
    },
  });
}

// Drafts
export async function saveLocalDraft(id, data, meta = {}) {
  const db = await getDB();
  await db.put("drafts", {
    id,
    data,
    meta,
    updated_at: Date.now(),
    created_at: meta.created_at || Date.now(),
  });
}

export async function loadLocalDraft(id) {
  const db = await getDB();
  return db.get("drafts", id);
}

export async function deleteLocalDraft(id) {
  const db = await getDB();
  await db.delete("drafts", id);
}

export async function listLocalDrafts() {
  const db = await getDB();
  return db.getAll("drafts");
}

// Outbox
export async function queueJob(job) {
  const db = await getDB();
  await db.put("outbox", job);
}

export async function listJobs() {
  const db = await getDB();
  return db.getAll("outbox");
}

export async function removeJob(job_id) {
  const db = await getDB();
  await db.delete("outbox", job_id);
}

// add to frontend/src/offline/db.js

export function makeLocalId() {
  return `local:${crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random()}`;
}

export async function createLocalDraft(initialData = {}, meta = {}) {
  const id = makeLocalId();
  await saveLocalDraft(id, initialData, {
    ...meta,
    status: meta.status || "draft",
    case_number: initialData.case_number || meta.case_number || "",
    created_at: Date.now(),
  });
  return { id };
}

// Optional convenience to mark local draft queued
export async function markLocalQueued(id, data) {
  await saveLocalDraft(id, data, { case_number: data.case_number || "", status: "queued" });
}
