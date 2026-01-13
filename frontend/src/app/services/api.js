// frontend/src/services/api.js

const isGithubPages = window.location.hostname.endsWith("github.io");

// IMPORTANT: replace this with your actual Render backend URL (no /api at end)
const RENDER_BASE = "https://fts-questionnaire.onrender.com/";

const LOCAL_BASE = "http://127.0.0.1:8000";

const BASE = `${isGithubPages ? RENDER_BASE : LOCAL_BASE}/api`;

async function parseError(res) {
  try {
    const text = await res.text();
    return text || `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

async function handleFetch(res) {
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  // Some endpoints might return empty; be safe
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return res.json();
  return res.text();
}

export async function createQuestionnaire(data) {
  const res = await fetch(`${BASE}/questionnaires`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data }),
  });
  return handleFetch(res);
}

export async function updateQuestionnaire(id, data) {
  const res = await fetch(`${BASE}/questionnaires/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data }),
  });
  return handleFetch(res);
}

export async function getQuestionnaire(id) {
  const res = await fetch(`${BASE}/questionnaires/${id}`);
  return handleFetch(res);
}

export async function finalizeQuestionnaire(id) {
  const res = await fetch(`${BASE}/questionnaires/${id}/finalize`, {
    method: "POST",
  });
  return handleFetch(res);
}

export async function listQuestionnaires() {
  const res = await fetch(`${BASE}/questionnaires`);
  return handleFetch(res);
}

export async function downloadQuestionnairePdf(id) {
  const res = await fetch(`${BASE}/questionnaires/${id}/pdf`, { method: "POST" });
  if (!res.ok) throw new Error(await res.text());
  return res.blob();
}
