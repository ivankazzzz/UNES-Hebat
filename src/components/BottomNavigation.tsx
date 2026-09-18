import { Link, useLocation } from "react-router-dom";
import { Home, History, User } from "lucide-react";

const navItems = [
    { to: "/", icon: Home, label: "Dashboard" },
    { to: "/history", icon: History, label: "Riwayat" },
    { to: "/profile", icon: User, label: "Profil" },
];

export default function BottomNavigation() {
    const location = useLocation();

    return (
        <div className="fixed bottom-4 left-0 right-0 z-[100] px-4 pointer-events-none sm:hidden">
            <nav className="relative max-w-lg mx-auto bg-[#8c1b1d] dark:bg-[#8c1b1d] backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 shadow-[0_10px_40px_rgba(0,0,0,0.1)] rounded-[32px] px-2 overflow-hidden pointer-events-auto">
                <div className="flex justify-around items-center h-[72px] w-full">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.to;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.to}
                                to={item.to}
                                className={`
                                    relative flex flex-col items-center justify-center w-full h-full gap-1
                                    transition-all duration-300 ease-out py-1 active:scale-90
                                    ${isActive ? 'text-white' : 'text-white/60 hover:text-white'}
                                `}
                            >
                                {/* Kapsul Highlight Aktif */}
                                {isActive && (
                                    <div className="absolute inset-0 bg-white/20 dark:bg-white/20 rounded-2xl mx-1 my-2" />
                                )}

                                {/* Ikon dengan animasi naik */}
                                <div className={`
                                    relative z-10 transition-transform duration-300 flex items-center justify-center
                                    ${isActive ? '-translate-y-1 scale-110' : 'scale-100'}
                                `}>
                                    <Icon className={`w-6 h-6 transition-all duration-300 ${isActive ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
                                    
                                    {/* Efek Pendaran Belakang Ikon */}
                                    {isActive && (
                                        <div className="absolute inset-0 bg-white/30 rounded-full blur-lg opacity-80 -z-10" />
                                    )}
                                </div>

                                <span className={`
                                    relative z-10 text-[10px] font-bold tracking-tight transition-all duration-300
                                    ${isActive ? 'opacity-100' : 'opacity-60'}
                                `}>
                                    {item.label}
                                </span>

                                {/* Titik Indikator Bawah */}
                                {isActive && (
                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                                )}
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
