import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Pages Public
import LandingPage from "./pages/LandingPage.jsx"; // <-- Halaman Depan Baru
import ScanPage from "./pages/ScanPage.jsx";       // <-- Sekarang jadi Detail Event & Scanner
import CheckinPage from "./pages/CheckinPage.jsx";
import TicketPage from "./pages/TicketPage.jsx";
import TicketValidatorPage from "./pages/TicketValidatorPage.jsx";

// Pages Admin
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminEvents from "./pages/AdminEvents.jsx";
import AdminDetailEvents from "./pages/AdminDetailEvents.jsx";
import AdminAttendance from "./pages/AdminAttendance.jsx";
import AdminAddAttendances from "./pages/AdminAddAttendances.jsx"; 
import AdminLottery from "./pages/AdminLottery.jsx";
import LotteryRoulette from "./pages/LotteryRoulette.jsx";
import AdminScanConsumption from "./pages/AdminScanConsumption.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";
// Components
import ProtectedRoute from "./components/ProtectedRoute.jsx";

export default function App() {
  return (
    <BrowserRouter>
    <ScrollToTop />
      <Routes>
        {/* --- PUBLIC ROUTES --- */}
        
        {/* Halaman Depan (List Event) */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Halaman Detail Event & Kiosk Scanner */}
        <Route path="/event/:eventCode" element={<ScanPage />} />
        
        {/* Halaman Form Registrasi/Check-in Peserta */}
        <Route path="/checkin/:eventCode" element={<CheckinPage />} />
        
        {/* Halaman Tiket Digital Peserta */}
        <Route path="/ticket/:token" element={<TicketPage />} />
        
        {/* Validator Standalone (Opsional) */}
        <Route path="/validator" element={<TicketValidatorPage />} />
        

        {/* --- ADMIN ROUTES --- */}
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
        
        {/* Registrasi Manual oleh Admin */}
        <Route
          path="/admin/events/:id/add-attendance" 
          element={
            <ProtectedRoute>
              <AdminAddAttendances />
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
        <Route
          path="/admin/events/:id/scan-consumption"
          element={
            <ProtectedRoute>
              <AdminScanConsumption />
            </ProtectedRoute>
          }
        />

        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}