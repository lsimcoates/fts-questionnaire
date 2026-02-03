import React, { useEffect, useState } from "react";
import api from "../../services/api"; // adjust if your api.js path differs

export default function AdminUsersTable() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  async function loadUsers() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data || []);
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function changeRole(userId, role) {
    setBusyId(userId);
    try {
      await api.patch(`/admin/users/${userId}/role`, { role });
      await loadUsers();
    } catch (e) {
      alert(e?.response?.data?.detail || "Failed to update role");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteUser(userId, email, role) {
    const msg =
      role === "admin"
        ? `Delete ADMIN user ${email}?\n\nThis cannot be undone.`
        : `Delete user ${email}?\n\nThis cannot be undone.`;

    if (!window.confirm(msg)) return;

    setBusyId(userId);
    try {
      await api.delete(`/admin/users/${userId}`);
      await loadUsers();
    } catch (e) {
      alert(e?.response?.data?.detail || "Failed to delete user");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div style={{ marginTop: 24 }}>
      <h3 style={{ marginBottom: 12 }}>Users</h3>

      {loading && <div>Loading users…</div>}
      {!loading && error && <div style={{ color: "crimson" }}>{error}</div>}

      {!loading && !error && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th align="left" style={{ padding: "8px 6px" }}>Email</th>
                <th align="left" style={{ padding: "8px 6px" }}>Role</th>
                <th align="left" style={{ padding: "8px 6px" }}>Verified</th>
                <th align="left" style={{ padding: "8px 6px" }}>Created</th>
                <th align="left" style={{ padding: "8px 6px" }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderTop: "1px solid #ddd" }}>
                  <td style={{ padding: "10px 6px" }}>{u.email}</td>
                  <td style={{ padding: "10px 6px" }}>{u.role}</td>
                  <td style={{ padding: "10px 6px" }}>
                    {u.is_verified ? "Yes" : "No"}
                  </td>
                  <td style={{ padding: "10px 6px" }}>
                    {u.created_at ? String(u.created_at).slice(0, 19).replace("T", " ") : "-"}
                  </td>
                  <td style={{ padding: "10px 6px" }}>
                    {u.role === "user" && (
                      <button
                        disabled={busyId === u.id}
                        onClick={() => changeRole(u.id, "admin")}
                        style={{ marginRight: 8 }}
                      >
                        Make Admin
                      </button>
                    )}

                    {u.role === "admin" && (
                      <button
                        disabled={busyId === u.id}
                        onClick={() => changeRole(u.id, "user")}
                        style={{ marginRight: 8 }}
                      >
                        Remove Admin
                      </button>
                    )}

                    <button
                      disabled={busyId === u.id || u.role === "superadmin"}
                      onClick={() => deleteUser(u.id, u.email, u.role)}
                    >
                      Delete
                    </button>

                    {u.role === "superadmin" && (
                      <span style={{ marginLeft: 10, color: "#666" }}>
                        (protected)
                      </span>
                    )}
                  </td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: "10px 6px", color: "#666" }}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
