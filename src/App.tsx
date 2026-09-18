import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Attendance from "./pages/Attendance";
import AttendanceKKN from "./pages/AttendanceKKN";
import History from "./pages/History";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";

import KelolaPengguna from "./pages/KelolaPengguna";
import KelolaIzinCuti from "./pages/KelolaIzinCuti";
import IzinCutiUser from "./pages/IzinCutiUser";
import KondisiStatistik from "./pages/KondisiStatistik";
import TitikAbsensi from "./pages/TitikAbsensi";
import TitikAbsenV2 from "./pages/TitikAbsenV2";
import Bangunan from "./pages/Bangunan";
import MappingKehadiran from "./pages/MappingKehadiran";
import HariLibur from "./pages/HariLibur";
import JamKerja from "./pages/JamKerja";
import Rekap from "./pages/Rekap";
import LaporanIndividu from "./pages/LaporanIndividu";
import LaporanKehadiran2 from "./pages/LaporanKehadiran2";
import LaporanKehadiran3 from "./pages/LaporanKehadiran3";
import LaporanKehadiran4 from "./pages/LaporanKehadiran4";
import LaporanKehadiran5 from "./pages/LaporanKehadiran5";
import LaporanKehadiranKKN from "./pages/LaporanKehadiranKKN";
import LaporanPerPengguna from "./pages/LaporanPerPengguna";
import LaporanAlpha from "./pages/LaporanAlpha";
import RevokeAkses from "./pages/RevokeAkses";
import NotFound from "./pages/NotFound";
import SoundPlayer from "./components/SoundPlayer";


 

const queryClient = new QueryClient();



const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <SoundPlayer />
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes - All pages have custom navigation */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance"
            element={
              <ProtectedRoute>
                <Attendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance-kkn"
            element={
              <ProtectedRoute>
                <AttendanceKKN />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Izin Cuti User Route */}
          <Route
            path="/izin-cuti"
            element={
              <ProtectedRoute>
                <IzinCutiUser />
              </ProtectedRoute>
            }
          />

{/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <Admin />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/kelola-pengguna"
            element={
              <ProtectedRoute requireAdmin>
                <KelolaPengguna />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/kelola-izin-cuti"
            element={
              <ProtectedRoute requireAdmin>
                <KelolaIzinCuti />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/jam-kerja"
            element={
              <ProtectedRoute requireSuperAdmin>
                <JamKerja />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/kondisi-statistik"
            element={
              <ProtectedRoute requireAdmin>
                <KondisiStatistik />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/titik-absensi"
            element={
              <ProtectedRoute requireSuperAdmin>
                <TitikAbsensi />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/titik-absenv2"
            element={
              <ProtectedRoute requireSuperAdmin>
                <TitikAbsenV2 />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/bangunan"
            element={
              <ProtectedRoute requireSuperAdmin>
                <Bangunan />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/mapping-kehadiran"
            element={
              <ProtectedRoute requireAdmin>
                <MappingKehadiran />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/hari-libur"
            element={
              <ProtectedRoute requireAdmin>
                <HariLibur />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/laporan-individu"
            element={
              <ProtectedRoute requireAdmin>
                <LaporanIndividu />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/rekap"
            element={
              <ProtectedRoute requireSuperAdmin>
                <Rekap />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/laporan-kehadiran2"
            element={
              <ProtectedRoute requireAdmin>
                <LaporanKehadiran2 />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/laporan-kehadiran3"
            element={
              <ProtectedRoute requireAdmin>
                <LaporanKehadiran3 />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/laporan-kehadiran4"
            element={
              <ProtectedRoute requireAdmin>
                <LaporanKehadiran4 />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/laporan-kehadiran5"
            element={
              <ProtectedRoute requireAdmin>
                <LaporanKehadiran5 />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/laporan-kehadiran-kkn"
            element={
              <ProtectedRoute requireAdmin>
                <LaporanKehadiranKKN />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/laporan-per-pengguna"
            element={
              <ProtectedRoute requireAdmin>
                <LaporanPerPengguna />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/laporan-alpha"
            element={
              <ProtectedRoute requireAdmin>
                <LaporanAlpha />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/revoke-akses"
            element={
              <ProtectedRoute requireSuperAdmin>
                <RevokeAkses />
              </ProtectedRoute>
            }
          />
  
  
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
