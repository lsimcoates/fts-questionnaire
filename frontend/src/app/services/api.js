// frontend/src/services/api.js

const isGithubPages = window.location.hostname.endsWith("github.io");

// IMPORTANT: replace this with your actual Render backend URL (no /api at end)
const RENDER_BASE = "https://fts-questionnaire.onrender.com";
const LOCAL_BASE = "http://localhost:8000";

const BASE = `${isGithubPages ? RENDER_BASE : LOCAL_BASE}/api`;

export async function authLogin(payload) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleFetch(res);
}

export async function authSignup(payload) {
  const res = await fetch(`${BASE}/auth/signup`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleFetch(res);
}

export async function authMe() {
  const res = await fetch(`${BASE}/auth/me`, {
    method: "GET",
    credentials: "include",
  });
  return handleFetch(res);
}

export async function authLogout() {
  const res = await fetch(`${BASE}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
  return handleFetch(res);
}

export async function authVerify(token) {
  const res = await fetch(`${BASE}/auth/verify?token=${encodeURIComponent(token)}`, {
    method: "POST",
    credentials: "include",
  });
  return handleFetch(res);
}

export async function authForgotPassword(email) {
  const res = await fetch(`${BASE}/auth/forgot-password`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return handleFetch(res);
}

export async function authResetPassword(payload) {
  const res = await fetch(`${BASE}/auth/reset-password`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleFetch(res);
}


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
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return res.json();
  return res.text();
}

export async function createQuestionnaire(data) {
  const res = await fetch(`${BASE}/questionnaires`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data }),
  });
  return handleFetch(res);
}

export async function updateQuestionnaire(id, data) {
  const res = await fetch(`${BASE}/questionnaires/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data }),
  });
  return handleFetch(res);
}

export async function getQuestionnaire(id) {
  const res = await fetch(`${BASE}/questionnaires/${id}`, {
    credentials: "include",
  });
  return handleFetch(res);
}

export async function finalizeQuestionnaire(id) {
  const res = await fetch(`${BASE}/questionnaires/${id}/finalize`, {
    method: "POST",
    credentials: "include",
  });
  return handleFetch(res);
}

export async function listQuestionnaires() {
  const res = await fetch(`${BASE}/questionnaires`, {
    credentials: "include",
  });
  return handleFetch(res);
}

export async function downloadQuestionnairePdf(id) {
  const res = await fetch(`${BASE}/questionnaires/${id}/pdf`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.blob();
}

export async function deleteQuestionnaire(id) {
  const res = await fetch(`${BASE}/questionnaires/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  return handleFetch(res);
}
