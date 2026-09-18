import { Home, Camera, FileText, User, Users, BarChart3, LogOut } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "@/lib/auth";

export default function SidebarNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <aside className="h-full w-full bg-corporate-navy text-white flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <img 
              src="/unes.png" 
              alt="Logo UNES" 
              className="w-6 h-6 object-contain"
            />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-wide">UNES</h1>
            <p className="text-white/60 text-xs">Sistem Absensi</p>
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 px-4 py-3 w-full rounded-lg text-white/80 hover:bg-red-500/20 hover:text-red-400 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
}