import { useNavigate } from "react-router-dom";
import UserManagement from "@/components/UserManagement";
import { ArrowLeft, Users, LogOut } from "lucide-react";
import { getCurrentUser, logout } from "@/lib/auth";

export default function KelolaPengguna() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50/50 w-full">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/admin")}
                className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="bg-blue-600/10 p-1.5 rounded-lg">
                  <img
                    src="/unes.png"
                    alt="UNES Logo"
                    className="h-6 w-6"
                  />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-gray-900 leading-none">Kelola Pengguna</h1>
                  <p className="text-[10px] font-medium text-gray-500 mt-0.5">Administrator Panel</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-sm font-semibold text-gray-700">{currentUser?.full_name || 'Admin'}</span>
                <span className="text-xs text-gray-500">Administrator</span>
              </div>
              <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-sm ring-2 ring-blue-100">
                {currentUser?.full_name?.charAt(0) || 'A'}
              </div>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-full transition-colors ml-1"
                title="Keluar"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6 animate-fade-in">
          {/* Page Title Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Manajemen Pengguna
              </h1>
              <p className="text-gray-500 mt-1">
                Kelola data pengguna, hak akses, dan struktur organisasi.
              </p>
            </div>
          </div>

          {/* Content Area */}
          <UserManagement />
        </div>
      </main>
    </div>
  );
}
