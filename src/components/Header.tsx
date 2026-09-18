import { Bell, Menu, User, ChevronDown } from "lucide-react";
import { useState } from "react";
import { getCurrentUser, logout } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const currentUser = getCurrentUser();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 z-30 h-16 bg-unes-blue shadow-md transition-all duration-300">
      <div className="h-full px-4 flex items-center justify-between">
        {/* Left Section - Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-1">
            <img src="/unes.png" alt="UNES Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-white font-bold text-sm leading-tight">Universitas Ekasakti</h1>
            <p className="text-white/80 text-[10px] font-medium tracking-wider">ABSENSI ONLINE</p>
          </div>
        </div>

        {/* Right Section - User Profile */}
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger className="outline-none">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors border border-white/20">
                <User className="w-6 h-6" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                Profil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                Pengaturan
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={handleLogout}>
                Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
