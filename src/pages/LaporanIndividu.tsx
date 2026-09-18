import { useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut, UserRoundSearch, Sparkles } from "lucide-react";
import { getCurrentUser, logout } from "@/lib/auth";
import LaporanIndividuView from "@/components/LaporanIndividu";

export default function LaporanIndividuPage() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-100/30 w-full overflow-x-hidden">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-gradient-to-br from-purple-400/8 to-pink-400/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-gradient-to-br from-emerald-400/8 to-teal-400/8 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="bg-white/70 backdrop-blur-xl shadow-sm shadow-slate-200/50 border-b border-white/60 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-10 py-3.5 w-full max-w-[1920px] mx-auto">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => navigate("/admin")}
              className="p-2.5 hover:bg-slate-100/80 rounded-xl transition-all duration-200 active:scale-95 border border-slate-200/60 bg-white/50 backdrop-blur-sm shadow-sm"
              title="Kembali ke Admin"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-orange-400 via-amber-500 to-yellow-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/25 ring-2 ring-white">
                  <UserRoundSearch className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                  <Sparkles className="w-2 h-2 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-800 leading-tight tracking-tight">
                  Laporan Individu
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Analisis profil & kehadiran personil
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2.5 px-3.5 py-2 bg-white/80 border border-slate-200/60 rounded-xl shadow-sm backdrop-blur-sm">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                {currentUser?.full_name?.charAt(0) || "A"}
              </div>
              <div className="text-sm text-slate-700 font-semibold truncate max-w-[140px]">
                {currentUser?.full_name || "Admin"}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2.5 bg-red-50/80 hover:bg-red-100 text-red-600 rounded-xl transition-all duration-200 active:scale-95 border border-red-100/60 shadow-sm backdrop-blur-sm"
              title="Keluar"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full relative">
        <div className="p-4 sm:p-6 lg:p-8">
          <LaporanIndividuView />
        </div>
      </div>
    </div>
  );
}
