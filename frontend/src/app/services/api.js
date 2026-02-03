// frontend/src/services/api.js

const isGithubPages = window.location.hostname.endsWith("github.io");

// IMPORTANT: replace this with your actual Render backend URL (no /api at end)
const RENDER_BASE = "https://fts-questionnaire.onrender.com";
const LOCAL_BASE = "http://localhost:8000";

const BASE = `${isGithubPages ? RENDER_BASE : LOCAL_BASE}/api`;


// ✅ Auth: who am I?
export async function authMe() {
  const res = await fetch(`${BASE}/auth/me`, {
    method: "GET",
    credentials: "include", // ✅ REQUIRED so cookies are sent
  });

  if (!res.ok) {
    // if not logged in, /me returns 401
    throw new Error("Not logged in");
  }
  return res.json();
}

// ✅ Auth: logout (clears cookie on server)
export async function authLogout() {
  const res = await fetch(`${BASE}/auth/logout`, {
    method: "POST",
    credentials: "include", // ✅ REQUIRED
  });

  if (!res.ok) {
    throw new Error("Logout failed");
  }
  return res.json();
}

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

export async function adminUsersList() {
  const res = await fetch(`${BASE}/admin/users`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load users");
  return res.json();
}

export async function adminUserSetRole(userId, role) {
  const res = await fetch(`${BASE}/admin/users/${userId}/role`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ role }),
  });
  if (!res.ok) throw new Error("Failed to update role");
  return res.json();
}

export async function adminUserDelete(userId) {
  const res = await fetch(`${BASE}/admin/users/${userId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete user");
  return res.json();
}

export async function adminQuestionnaireSchema() {
  const res = await fetch(`${BASE}/admin/questionnaires/schema`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to load schema");
  return res.json();
}

export async function adminQuestionnaireSearch(payload) {
  const res = await fetch(`${BASE}/admin/questionnaires/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Search failed");
  return res.json();
}

export async function adminQuestionnaireExport(payload) {
  const res = await fetch(`${BASE}/admin/questionnaires/export`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Export failed");
  return res.blob();
}

export async function adminExportOptions() {
  const res = await fetch(`${BASE}/admin/export/options`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function adminExportJson(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE}/admin/export/json?${qs}`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.blob();
}

export async function adminExportCsv(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${BASE}/admin/export/csv?${qs}`, {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.blob();
}
