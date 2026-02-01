import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ScanPage from "./pages/ScanPage.jsx";
import CheckinPage from "./pages/CheckinPage.jsx";
import TicketPage from "./pages/TicketPage.jsx";

import AdminLogin from "./pages/AdminLogin.jsx";
import AdminEvents from "./pages/AdminEvents.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminAttendance from "./pages/AdminAttendance.jsx";
import AdminLottery from "./pages/AdminLottery.jsx";
import LotteryRoulette from "./pages/LotteryRoulette.jsx";
import AdminDetailEvents from "./pages/AdminDetailEvents.jsx";
import TicketValidatorPage from "./pages/TicketValidatorPage.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Peserta */}
        <Route path="/" element={<ScanPage />} />
        <Route path="/checkin/:eventCode" element={<CheckinPage />} />
        <Route path="/ticket/:token" element={<TicketPage />} />
        <Route path="/validator" element={<TicketValidatorPage />} />
        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/events"
          element={
            <ProtectedRoute>
              <AdminEvents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/events/:id/details"
          element={
            <ProtectedRoute>
              <AdminDetailEvents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/events/:id/attendance"
          element={
            <ProtectedRoute>
              <AdminAttendance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/events/:id/lottery"
          element={
            <ProtectedRoute>
              <AdminLottery />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/events/:id/roulette"
          element={
            <ProtectedRoute>
              <LotteryRoulette />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
