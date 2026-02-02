import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import LandingPage from "./app/pages/LandingPage";
import QuestionnairePage from "./app/questionnaire/QuestionnairePage";

import RequireAuth from "./app/components/RequireAuth";

import LoginPage from "./app/pages/LoginPage";
import SignupPage from "./app/pages/SignupPage";
import VerifyPage from "./app/pages/VerifyPage";
import ForgotPasswordPage from "./app/pages/ForgotPasswordPage";
import ResetPasswordPage from "./app/pages/ResetPasswordPage";

export default function App() {
  return (
    <Routes>
      {/* ✅ Public auth routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/verify" element={<VerifyPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

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

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
