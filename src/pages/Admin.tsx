import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Calendar,
  TrendingUp,
  ArrowRight,
  Shield,
  X,
  Menu,
  LogOut,
  Home,
  FileText,
  MapPin,
  Building2,
  CalendarOff,
  CalendarRange,
  User,
  FileBarChart,
  ClipboardList,
  AlertCircle,
  Ban,
  GraduationCap,
  FileSpreadsheet,
  Search,
  CheckCircle2,
  Lock
} from "lucide-react";

import { getCurrentUser, logout, canAccessLaporanIndividu } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

type MenuCategory = 'all' | 'users' | 'permits' | 'config' | 'reports';

interface MenuItem {
  id: string;
  title: string;
  description: string;
  icon: any;
  gradient: string;
  shadowColor: string;
  route: string;
  category: MenuCategory;
  isSuperadminOnly?: boolean;
}

export default function Admin() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<MenuCategory>('all');
  const [searchQuery, setSearchQuery] = useState("");

  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingPermits: 0,
    loading: true
  });

  useEffect(() => {
    setIsLoaded(true);
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const { count: usersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      const { count: permitsCount } = await supabase
        .from('leave_permits')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalUsers: usersCount || 0,
        pendingPermits: permitsCount || 0,
        loading: false
      });
    } catch (err) {
      console.error("Error fetching admin stats:", err);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const menuItems: MenuItem[] = [
    {
      id: 'app_users',
      title: 'Kelola Pengguna',
      description: 'Atur data akun, role, unit kerja & status pengguna sistem',
      icon: Users,
      gradient: 'from-amber-500 to-red-600',
      shadowColor: 'shadow-amber-500/30',
      route: '/admin/kelola-pengguna',
      category: 'users'
    },
    ...(currentUser?.role === 'superadmin'
      ? [
          {
            id: 'revoke-akses',
            title: 'Revoke Akses',
            description: 'Cabut akses khusus atau turunkan jabatan pengguna',
            icon: Ban,
            gradient: 'from-rose-500 to-red-700',
            shadowColor: 'shadow-rose-500/30',
            route: '/admin/revoke-akses',
            category: 'users' as MenuCategory,
            isSuperadminOnly: true
          }
        ]
      : []),
    {
      id: 'leave_permits',
      title: 'Kelola Izin & Cuti',
      description: 'Daftar pengajuan izin, cuti, dan dinas luar pegawai',
      icon: FileText,
      gradient: 'from-teal-500 to-cyan-600',
      shadowColor: 'shadow-teal-500/30',
      route: '/admin/kelola-izin-cuti',
      category: 'permits'
    },
    ...(currentUser?.role === 'superadmin'
      ? [
          {
            id: 'titik_absensi',
            title: 'Titik Absensi',
            description: 'Atur lokasi dan radius absensi kantor utama',
            icon: MapPin,
            gradient: 'from-purple-500 to-indigo-600',
            shadowColor: 'shadow-purple-500/30',
            route: '/admin/titik-absensi',
            category: 'config' as MenuCategory,
            isSuperadminOnly: true
          },
          {
            id: 'titik_absensi_v2',
            title: 'Titik Absen V2',
            description: 'Atur penugasan titik lokasi absensi per user',
            icon: MapPin,
            gradient: 'from-indigo-500 to-blue-600',
            shadowColor: 'shadow-indigo-500/30',
            route: '/admin/titik-absenv2',
            category: 'config' as MenuCategory,
            isSuperadminOnly: true
          },
          {
            id: 'bangunan',
            title: 'Manajemen Bangunan',
            description: 'Set radius dan titik lokasi per gedung kampus',
            icon: Building2,
            gradient: 'from-orange-500 to-amber-600',
            shadowColor: 'shadow-amber-500/30',
            route: '/admin/bangunan',
            category: 'config' as MenuCategory,
            isSuperadminOnly: true
          },
          {
            id: 'jam_kerja',
            title: 'Jadwal Jam Kerja',
            description: 'Atur jam masuk & pulang khusus per pegawai',
            icon: CalendarRange,
            gradient: 'from-fuchsia-500 to-purple-600',
            shadowColor: 'shadow-purple-500/30',
            route: '/admin/jam-kerja',
            category: 'config' as MenuCategory,
            isSuperadminOnly: true
          }
        ]
      : []),
    {
      id: 'holidays',
      title: 'Kelola Hari Libur',
      description: 'Atur kalender hari libur nasional & nonaktifkan absensi',
      icon: CalendarOff,
      gradient: 'from-red-500 to-rose-600',
      shadowColor: 'shadow-red-500/30',
      route: '/admin/hari-libur',
      category: 'config'
    },
    {
      id: 'stats',
      title: 'Kondisi Statistik',
      description: 'Grafik dan ringkasan kehadiran statistik harian',
      icon: TrendingUp,
      gradient: 'from-blue-500 to-indigo-600',
      shadowColor: 'shadow-blue-500/30',
      route: '/admin/kondisi-statistik',
      category: 'reports'
    },
    ...(canAccessLaporanIndividu()
      ? [
          {
            id: 'laporan-individu',
            title: 'Laporan Individu',
            description: 'Profil detail & rekap kehadiran personal',
            icon: User,
            gradient: 'from-amber-500 to-orange-600',
            shadowColor: 'shadow-orange-500/30',
            route: '/admin/laporan-individu',
            category: 'reports' as MenuCategory,
            isSuperadminOnly: currentUser?.role !== 'superadmin' ? false : true
          }
        ]
      : []),
    ...(currentUser?.role === 'superadmin' || currentUser?.role === 'admin'
      ? [
          {
            id: 'laporan-kehadiran3',
            title: 'Laporan Kehadiran 3',
            description: 'Cetak PDF rekapitulasi mingguan semua pegawai',
            icon: ClipboardList,
            gradient: 'from-indigo-500 to-blue-700',
            shadowColor: 'shadow-indigo-500/30',
            route: '/admin/laporan-kehadiran3',
            category: 'reports' as MenuCategory
          },
          {
            id: 'laporan-kehadiran-kkn',
            title: 'Laporan Kehadiran KKN',
            description: 'Cetak PDF kehadiran Pembekalan KKN DPL & Mahasiswa',
            icon: GraduationCap,
            gradient: 'from-amber-500 to-yellow-600',
            shadowColor: 'shadow-amber-500/30',
            route: '/admin/laporan-kehadiran-kkn',
            category: 'reports' as MenuCategory
          },
          {
            id: 'laporan-kehadiran4',
            title: 'Laporan Kehadiran 4',
            description: 'Laporan PDF berbasis analisa kondisi statistik',
            icon: FileBarChart,
            gradient: 'from-emerald-500 to-teal-600',
            shadowColor: 'shadow-emerald-500/30',
            route: '/admin/laporan-kehadiran4',
            category: 'reports' as MenuCategory
          },
          {
            id: 'laporan-kehadiran5',
            title: 'Laporan Kehadiran 5',
            description: 'Laporan rekap ringkas (Nama, Unit Kerja & Keterangan Bulanan)',
            icon: FileSpreadsheet,
            gradient: 'from-violet-500 to-purple-700',
            shadowColor: 'shadow-purple-500/30',
            route: '/admin/laporan-kehadiran5',
            category: 'reports' as MenuCategory
          },
          {
            id: 'laporan-per-pengguna',
            title: 'Laporan Per Pengguna',
            description: 'Rekap bulanan PDF resmi per pegawai (dengan foto)',
            icon: FileText,
            gradient: 'from-cyan-500 to-blue-700',
            shadowColor: 'shadow-cyan-500/30',
            route: '/admin/laporan-per-pengguna',
            category: 'reports' as MenuCategory
          },
          {
            id: 'laporan-alpha',
            title: 'Laporan Alpha',
            description: 'Rekap daftar ketidakhadiran mingguan pegawai',
            icon: AlertCircle,
            gradient: 'from-red-500 to-rose-700',
            shadowColor: 'shadow-red-500/30',
            route: '/admin/laporan-alpha',
            category: 'reports' as MenuCategory
          }
        ]
      : []),
    ...(currentUser?.role === 'superadmin'
      ? [
          {
            id: 'rekap',
            title: 'Rekapitulasi Kehadiran',
            description: 'Ringkasan rekapitulasi kehadiran umum',
            icon: FileBarChart,
            gradient: 'from-emerald-600 to-teal-700',
            shadowColor: 'shadow-emerald-500/30',
            route: '/admin/rekap',
            category: 'reports' as MenuCategory,
            isSuperadminOnly: true
          }
        ]
      : []),
    {
      id: 'laporan-kehadiran2',
      title: 'Laporan Kehadiran 2',
      description: 'Laporan rekap kehadiran lengkap dengan bukti foto',
      icon: ClipboardList,
      gradient: 'from-sky-500 to-blue-600',
      shadowColor: 'shadow-sky-500/30',
      route: '/admin/laporan-kehadiran2',
      category: 'reports'
    }
  ];

  const filteredMenuItems = menuItems.filter(item => {
    const matchesRole = !item.isSuperadminOnly || currentUser?.role === 'superadmin';
    const matchesTab = activeTab === 'all' || item.category === activeTab;
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesTab && matchesSearch;
  });

  const categories: { id: MenuCategory; label: string; count: number }[] = [
    { id: 'all', label: 'Semua Modul', count: menuItems.length },
    { id: 'users', label: 'Pengguna & Akses', count: menuItems.filter(i => i.category === 'users').length },
    { id: 'permits', label: 'Izin & Cuti', count: menuItems.filter(i => i.category === 'permits').length },
    { id: 'config', label: 'Konfigurasi & Lokasi', count: menuItems.filter(i => i.category === 'config').length },
    { id: 'reports', label: 'Laporan & Analytics', count: menuItems.filter(i => i.category === 'reports').length },
  ];

  return (
    <div className="min-h-screen bg-slate-100/90 w-full overflow-x-hidden font-sans">
      {/* Top Navigation Bar */}
      <div className="bg-white shadow-md border-b-2 border-slate-300 w-full sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 sm:px-8 py-4 w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2.5 hover:bg-slate-100 rounded-xl transition-colors active:scale-95 text-slate-900"
              aria-label="Buka menu"
            >
              <Menu className="w-7 h-7" />
            </button>
            <div className="flex items-center gap-3">
              <img
                src="/unes.png"
                alt="Logo UNES"
                className="h-11 w-11 object-contain drop-shadow"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-[#8c1b1d] leading-tight tracking-wide">
                    PANEL ADMIN
                  </h1>
                  <span className="bg-[#8c1b1d] text-[#fbbf24] text-[11px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider hidden sm:inline-block shadow-sm">
                    UNES-AAI
                  </span>
                </div>
                <p className="text-xs text-slate-900 font-extrabold hidden sm:block">Universitas Ekasakti Padang</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2.5 bg-slate-200 hover:bg-[#8c1b1d]/15 text-slate-900 hover:text-[#8c1b1d] rounded-xl transition-all active:scale-95 font-black text-sm hidden sm:flex items-center gap-2 border-2 border-slate-300 hover:border-[#8c1b1d]"
              title="Ke Halaman Utama"
            >
              <Home className="w-5 h-5 text-[#8c1b1d]" />
              <span>Halaman Utama</span>
            </button>
            <button
              onClick={handleLogout}
              className="px-3.5 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl transition-all active:scale-95 border-2 border-red-300 font-black text-sm flex items-center gap-2"
              title="Keluar Aplikasi"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md transition-opacity" onClick={() => setSidebarOpen(false)}>
          <div 
            className="absolute left-0 top-0 h-full w-[85%] max-w-sm bg-white shadow-2xl animate-in slide-in-from-left duration-300" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col h-full">
              <div className="p-5 border-b-2 border-slate-200 bg-[#8c1b1d]/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src="/unes.png" alt="Logo" className="h-11 w-11 object-contain" />
                    <div>
                      <h2 className="text-xl font-black text-slate-900">Menu Admin</h2>
                      <p className="text-xs text-slate-800 font-extrabold">Navigasi Pengelolaan</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 bg-white hover:bg-slate-100 rounded-full shadow-md border-2 border-slate-300"
                  >
                    <X className="w-6 h-6 text-slate-900" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        navigate(item.route);
                        setSidebarOpen(false);
                      }}
                      className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-left transition-all bg-white border-2 border-slate-200 shadow-sm active:scale-98 hover:border-[#8c1b1d] hover:shadow-md group"
                    >
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${item.gradient} text-white shadow-md flex-shrink-0`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="block text-base font-black text-slate-900 group-hover:text-[#8c1b1d] truncate">{item.title}</span>
                        <span className="text-xs text-slate-800 font-bold truncate block">{item.description}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="p-5 bg-slate-100 border-t-2 border-slate-300">
                <button
                  onClick={() => {
                    navigate('/');
                    setSidebarOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#8c1b1d] text-white font-black text-base shadow-lg shadow-[#8c1b1d]/30 active:scale-95 transition-all"
                >
                  <Home className="w-5 h-5 text-[#fbbf24]" />
                  Ke Halaman Utama
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-28">
        <div className={`space-y-8 transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          
          {/* Executive Welcome Hero Banner */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#8c1b1d] via-[#a02020] to-[#6b1516] rounded-3xl p-6 sm:p-9 text-white shadow-2xl shadow-[#8c1b1d]/30 border-2 border-[#8c1b1d]">
            {/* Ornaments */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#fbbf24]/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#fbbf24] border border-[#fbbf24] text-[#8c1b1d] text-xs font-black mb-3 shadow-md">
                  <Shield className="w-4 h-4 text-[#8c1b1d]" />
                  <span>Executive Control Center</span>
                </div>
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black mb-2 leading-tight tracking-tight text-white drop-shadow-sm">
                  Halo, {currentUser?.full_name || 'Admin'} 👋
                </h1>
                <p className="text-white text-base sm:text-lg leading-relaxed font-bold opacity-100 drop-shadow">
                  Selamat datang kembali di pusat kendali Absensi UNES-AAI. Pilih modul di bawah ini atau gunakan pencarian cepat.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Statistics Summary Bar (3 Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            {/* Stat 1: Total Pengguna */}
            <div className="bg-white p-5 rounded-2xl border-2 border-slate-300 shadow-md flex items-center gap-4 hover:border-amber-500 transition-all">
              <div className="p-4 bg-amber-500 rounded-2xl text-white shadow-md flex-shrink-0">
                <Users className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-slate-900 uppercase tracking-wider">Total Pengguna</p>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 truncate">
                  {stats.loading ? "..." : stats.totalUsers.toLocaleString('id-ID')}
                </h3>
              </div>
            </div>

            {/* Stat 2: Izin yg dikelola sistem */}
            <div className="bg-white p-5 rounded-2xl border-2 border-slate-300 shadow-md flex items-center gap-4 hover:border-teal-500 transition-all">
              <div className="p-4 bg-teal-500 rounded-2xl text-white shadow-md flex-shrink-0">
                <FileText className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-slate-900 uppercase tracking-wider">Izin yg dikelola sistem</p>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 truncate">
                  {stats.loading ? "..." : stats.pendingPermits.toLocaleString('id-ID')}
                </h3>
              </div>
            </div>

            {/* Stat 3: Status Sistem */}
            <div className="bg-white p-5 rounded-2xl border-2 border-slate-300 shadow-md flex items-center gap-4 hover:border-emerald-500 transition-all">
              <div className="p-4 bg-emerald-600 rounded-2xl text-white shadow-md flex-shrink-0">
                <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-slate-900 uppercase tracking-wider">Status Sistem</p>
                <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300 mt-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
                  Aktif 100%
                </span>
              </div>
            </div>
          </div>

          {/* Search Bar & Category Header */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-8 bg-[#8c1b1d] rounded-full" />
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                  mau ngurus apa?
                </h2>
              </div>

              {/* Instant Search Bar */}
              <div className="relative w-full md:w-80">
                <Search className="w-5 h-5 text-slate-700 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari modul admin..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-10 py-3 bg-white border-2 border-slate-300 rounded-xl text-base font-extrabold text-slate-900 placeholder-slate-500 focus:outline-none focus:border-[#8c1b1d] focus:ring-2 focus:ring-[#8c1b1d]/20 transition-all shadow-sm"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-700 hover:text-slate-900"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Navigation Tabs (Adjusted text wrapping & container padding) */}
            <div className="flex items-center gap-2.5 overflow-x-auto pb-3 pt-1 scrollbar-none px-1">
              {categories.map((cat) => {
                const isActive = activeTab === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveTab(cat.id)}
                    className={`px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl font-black text-xs sm:text-sm whitespace-nowrap shrink-0 transition-all flex items-center gap-2.5 border-2 shadow-sm ${
                      isActive
                        ? "bg-[#8c1b1d] border-[#8c1b1d] text-white shadow-lg shadow-[#8c1b1d]/30 scale-105"
                        : "bg-white border-slate-300 text-slate-900 hover:bg-slate-200 hover:border-slate-400"
                    }`}
                  >
                    <span className="inline-block">{cat.label}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black shrink-0 ${
                      isActive ? "bg-[#fbbf24] text-[#8c1b1d]" : "bg-slate-200 text-slate-900"
                    }`}>
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Module Cards Grid */}
          {filteredMenuItems.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border-2 border-slate-300 shadow-md space-y-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-700 border-2 border-slate-300">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Modul Tidak Ditemukan</h3>
              <p className="text-base text-slate-800 font-bold max-w-sm mx-auto">
                Tidak ada modul admin yang cocok dengan kata kunci "{searchQuery}".
              </p>
              <button
                onClick={() => { setSearchQuery(""); setActiveTab("all"); }}
                className="px-5 py-2.5 bg-[#8c1b1d] text-white font-black text-sm rounded-xl transition-all shadow-md hover:bg-[#7a1819]"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMenuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.route)}
                    className="group relative overflow-hidden bg-white rounded-2xl p-6 sm:p-7 text-left shadow-md hover:shadow-2xl transition-all duration-300 border-2 border-slate-300 hover:border-[#8c1b1d] active:scale-[0.98] flex flex-col justify-between"
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    <div>
                      <div className="flex items-start justify-between mb-5">
                        {/* BIGGER ICON CONTAINER & ICON */}
                        <div className={`w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-lg ${item.shadowColor} group-hover:scale-110 transition-transform duration-300 border border-white/30 flex-shrink-0`}>
                          <Icon className="w-8 h-8 sm:w-9 sm:h-9 text-white stroke-[2.2]" />
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {item.isSuperadminOnly && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-amber-900 bg-amber-200 px-2.5 py-1 rounded-lg border border-amber-400 shadow-sm">
                              <Lock className="w-3.5 h-3.5 text-amber-900" />
                              Superadmin
                            </span>
                          )}
                          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center group-hover:bg-[#8c1b1d] group-hover:text-white transition-all shadow-sm">
                            <ArrowRight className="w-5 h-5 text-slate-900 group-hover:text-white transition-colors stroke-[2.5]" />
                          </div>
                        </div>
                      </div>

                      {/* SOLID HIGH CONTRAST TEXT */}
                      <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-2 group-hover:text-[#8c1b1d] transition-colors leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-sm font-bold text-slate-800 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Bottom Line Accent on Hover */}
                    <div className="absolute bottom-0 left-0 h-1.5 w-0 bg-gradient-to-r from-[#8c1b1d] via-[#b52020] to-[#fbbf24] group-hover:w-full transition-all duration-300" />
                  </button>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
