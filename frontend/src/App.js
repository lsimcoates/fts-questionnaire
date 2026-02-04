import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import LandingPage from "./app/pages/LandingPage";
import QuestionnairePage from "./app/questionnaire/QuestionnairePage";

import RequireAuth from "./app/components/RequireAuth";

import LoginPage from "./app/pages/LoginPage";
import AdminToolsPage from "./app/pages/AdminToolsPage";
import ChangePasswordPage from "./app/pages/ChangePasswordPage";

export default function App() {
  return (
    <Routes>
      {/* ✅ Public auth route */}
      <Route path="/login" element={<LoginPage />} />

      {/* ✅ Protected app routes */}
      <Route
        path="/"
        element={
          <RequireAuth>
            <LandingPage />
          </RequireAuth>
        }
      />

      <Route
        path="/questionnaire/:id"
        element={
          <RequireAuth>
            <QuestionnairePage />
          </RequireAuth>
        }
      />

      <Route
        path="/change-password"
        element={
          <RequireAuth>
            <ChangePasswordPage />
          </RequireAuth>
        }
      />

      <Route
        path="/admin-tools"
        element={
          <RequireAuth>
            <AdminToolsPage />
          </RequireAuth>
        }
      />

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
