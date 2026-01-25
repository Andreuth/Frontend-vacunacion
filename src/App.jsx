import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import PediatricDashboard from "./pages/PediatricDashboard";
import RepresentativeDashboard from "./pages/RepresentativeDashboard";
import RegisterChild from "./pages/RegisterChild";
import ChildNextVaccines from "./pages/ChildNextVaccines";
import ChildHistory from "./pages/ChildHistory";

import "./App.css";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Pediatra */}
        <Route
          path="/pediatric"
          element={
            <ProtectedRoute roles={["ADMIN", "PEDIATRA"]}>
              <PediatricDashboard />
            </ProtectedRoute>
          }
        />

        {/* Representante */}
        <Route
          path="/representative"
          element={
            <ProtectedRoute roles={["ADMIN", "REPRESENTANTE"]}>
              <RepresentativeDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/children/register"
          element={
            <ProtectedRoute roles={["ADMIN", "REPRESENTANTE"]}>
              <RegisterChild />
            </ProtectedRoute>
          }
        />

        {/* Child detail */}
        <Route
          path="/children/:childId/next-vaccines"
          element={
            <ProtectedRoute roles={["ADMIN", "PEDIATRA", "REPRESENTANTE"]}>
              <ChildNextVaccines />
            </ProtectedRoute>
          }
        />

        <Route
          path="/children/:childId/history"
          element={
            <ProtectedRoute roles={["ADMIN", "PEDIATRA", "REPRESENTANTE"]}>
              <ChildHistory />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}
