import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./app/pages/LandingPage";
import QuestionnairePage from "./app/questionnaire/QuestionnairePage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/questionnaire/:id" element={<QuestionnairePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
