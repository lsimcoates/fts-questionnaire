// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import LandingPage from "./app/pages/LandingPage";
import QuestionnairePage from "./app/questionnaire/QuestionnairePage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/questionnaire/:id" element={<QuestionnairePage />} />
      </Routes>
    </BrowserRouter>
  );
}
