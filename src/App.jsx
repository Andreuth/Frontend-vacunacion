import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import PediatricDashboard from "./pages/PediatricDashboard";
import RepresentativeDashboard from "./pages/RepresentativeDashboard";
import ChildHistory from "./pages/ChildHistory";
import ChildNextVaccines from "./pages/ChildNextVaccines";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/pediatric" element={<PediatricDashboard />} />

          <Route path="/representative" element={<RepresentativeDashboard />} />
          <Route path="/representative/history/:childId" element={<ChildHistory />} />
          <Route path="/representative/next/:childId" element={<ChildNextVaccines />} />

          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
