import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Cases from "./pages/Cases";
import NewReport from "./pages/NewReport";
import CaseDetail from "./pages/CaseDetail";
import Intelligence from "./pages/Intelligence";
import EvidenceAll from "./pages/EvidenceAll";
import ReportsAll from "./pages/ReportsAll";
import InstitutionPage from "./pages/InstitutionPage";
import UsersPage from "./pages/UsersPage";
import SettingsPage from "./pages/SettingsPage";

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/cases" element={<Cases />} />
        <Route path="/cases/:caseId" element={<CaseDetail />} />
        <Route path="/new-report" element={<NewReport />} />
        <Route path="/intelligence" element={<Intelligence />} />
        <Route path="/evidence" element={<EvidenceAll />} />
        <Route path="/reports" element={<ReportsAll />} />
        <Route path="/institution" element={<InstitutionPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
