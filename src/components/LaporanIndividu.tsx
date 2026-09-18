import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { generateIndividualReportPDF } from "@/lib/pdf-generator";
import {
  User,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  TrendingUp,
  Search,
  ChevronLeft,
  ChevronRight,
  Activity,
  Loader2,
  BadgeCheck,
  Briefcase,
  MapPin,
  CalendarDays,
  ArrowUpRight,
  Target,
  Zap,
  AlertCircle,
  Download,
  Sparkles,
  Users,
  BarChart3,
  PieChart as PieChartIcon,
  Filter,
  X,
  Check,
  ChevronDown
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  CartesianGrid,
  Pie,
  PieChart,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  Area,
  AreaChart,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  role: string;
  unit_kerja: string;
  is_struktural?: boolean;
  created_at: string;
}

interface AttendanceStats {
  totalHadir: number;
  totalKurangJam: number;
  totalIzin: number;
  totalCuti: number;
  totalDinasLuar: number;
  attendancePercentage: number;
  recentAttendances: Array<{
    id: string;
    created_at: string;
    status: string;
    attendance_type?: string;
    note?: string;
  }>;
  monthlyTrend: { label: string; Masuk: number; Pulang: number }[];
  statusDistribution: { name: string; value: number; color: string }[];
  radarMetrics: { metric: string; value: number; fullMark: number }[];
}

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export default function LaporanIndividu() {
  const currentDate = new Date();
  
  // Filter Controls State
  const [selectedCategory, setSelectedCategory] = useState<"all" | "dosen" | "tendik">("all");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [nameSearch, setNameSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());

  // Floating Modal State for Selecting Name
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);

  // Report Content State
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportingPDF, setExportingPDF] = useState(false);
  const dashboardPrintRef = useRef<HTMLDivElement | null>(null);

  // Pagination for Daily Attendance Logs
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setSearchingUsers(true);
      setError(null);
      const { data, error } = await supabase
        .from("users")
        .select("id, username, full_name, role, unit_kerja, is_struktural, created_at")
        .neq("role", "mahasiswa")
        .order("full_name", { ascending: true });

      if (error) throw error;
      const allUsers = (data || []).filter(u => u.username !== 'tesx' && u.username !== 'andi.syahrum.makkurade');
      setUsers(allUsers);
      
      const defaultUser = allUsers.find(u => u.role !== 'mahasiswa');
      if (defaultUser) {
        setSelectedUserId(defaultUser.id);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Gagal memuat data pengguna. Silakan coba lagi.");
    } finally {
      setSearchingUsers(false);
    }
  };

  const categoryFilteredUsers = useMemo(() => {
    return users.filter(user => {
      if (user.role === 'mahasiswa') return false;
      if (user.username === 'tesx' || user.username === 'andi.syahrum.makkurade') return false;

      if (selectedCategory === "dosen") {
        return user.is_struktural === true;
      }
      if (selectedCategory === "tendik") {
        return user.role === 'pegawai' || user.role === 'tendik';
      }
      return true;
    });
  }, [users, selectedCategory]);

  const searchFilteredUsers = useMemo(() => {
    if (!nameSearch.trim()) return categoryFilteredUsers;
    const q = nameSearch.toLowerCase();
    return categoryFilteredUsers.filter(u => 
      u.full_name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.unit_kerja?.toLowerCase().includes(q)
    );
  }, [categoryFilteredUsers, nameSearch]);

  useEffect(() => {
    if (categoryFilteredUsers.length > 0) {
      const exists = categoryFilteredUsers.some(u => u.id === selectedUserId);
      if (!exists) {
        setSelectedUserId(categoryFilteredUsers[0].id);
      }
    }
  }, [categoryFilteredUsers, selectedUserId]);

  const selectedUserObj = useMemo(() => {
    return users.find(u => u.id === selectedUserId) || null;
  }, [users, selectedUserId]);

  const handleTampilkan = () => {
    const user = users.find(u => u.id === selectedUserId);
    if (!user) {
      setError("Silakan pilih pegawai / dosen terlebih dahulu.");
      return;
    }
    setSelectedUser(user);
    setCurrentPage(1);
    fetchAttendanceStats(user.id, selectedMonth, selectedYear);
  };

  const fetchAttendanceStats = async (userId: string, month: number, year: number) => {
    try {
      setLoading(true);
      setError(null);

      const padMonth = String(month).padStart(2, '0');
      const startDate = `${year}-${padMonth}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const padLastDay = String(lastDay).padStart(2, '0');
      const endDate = `${year}-${padMonth}-${padLastDay}`;

      const { data: attendances, error: attendanceError } = await supabase
        .from("attendances")
        .select("*")
        .eq("user_id", userId)
        .gte("created_at", `${startDate}T00:00:00`)
        .lte("created_at", `${endDate}T23:59:59`)
        .order("created_at", { ascending: false });

      if (attendanceError) throw attendanceError;

      const { data: permits, error: permitError } = await supabase
        .from("leave_permits")
        .select("*")
        .eq("user_id", userId)
        .gte("start_date", startDate)
        .lte("end_date", endDate);

      if (permitError) throw permitError;

      const totalHadir = (attendances ?? []).filter((a) => a.status === "hadir").length || 0;
      const totalKurangJam = (attendances ?? []).filter((a) => a.status === "kurang_jam").length || 0;
      const totalIzin = permits?.filter((p) => p.permit_type === "izin").length || 0;
      const totalCuti = permits?.filter((p) => p.permit_type === "cuti").length || 0;
      const totalDinasLuar = permits?.filter((p) => p.permit_type === "dinas_luar").length || 0;

      const totalWorkingDays = 22;
      const totalPresent = ((attendances ?? []).length || 0) / 2;
      const attendancePercentage = Math.min(100, Math.round((totalPresent / totalWorkingDays) * 100));

      const recentAttendances = (attendances ?? []).slice(0, 200) || [];

      // Monthly / Daily trend data
      const trendData: { label: string; Masuk: number; Pulang: number }[] = [];
      for (let i = 1; i <= lastDay; i++) {
        trendData.push({ label: i.toString(), Masuk: 0, Pulang: 0 });
      }

      (attendances ?? []).forEach((a) => {
        const date = new Date(a.created_at);
        const dayOfMonth = date.getDate();
        if (dayOfMonth >= 1 && dayOfMonth <= lastDay) {
          const isMasuk = a.attendance_type === "masuk" || !a.attendance_type;
          if (isMasuk) {
            if (a.status === "hadir") trendData[dayOfMonth - 1].Masuk += 1;
          } else {
            if (a.status === "hadir") trendData[dayOfMonth - 1].Pulang += 1;
          }
        }
      });

      const statusDistribution = [
        { name: "Hadir", value: totalHadir, color: "#10b981" },
        { name: "Izin/Cuti", value: totalIzin + totalCuti, color: "#3b82f6" },
        { name: "Dinas", value: totalDinasLuar, color: "#8b5cf6" },
      ];

      const totalEvents = totalHadir + totalKurangJam + totalIzin + totalCuti + totalDinasLuar || 1;
      const disciplineScore = Math.max(0, 100 - (totalKurangJam / totalEvents) * 150);

      const radarMetrics = [
        { metric: "Kehadiran", value: attendancePercentage, fullMark: 100 },
        { metric: "Disiplin", value: Math.round(disciplineScore), fullMark: 100 },
        { metric: "Kelengkapan", value: Math.round(Math.min(100, (totalHadir / 40) * 100)), fullMark: 100 },
      ];

      setAttendanceStats({
        totalHadir,
        totalKurangJam,
        totalIzin,
        totalCuti,
        totalDinasLuar,
        attendancePercentage,
        recentAttendances,
        monthlyTrend: trendData,
        statusDistribution,
        radarMetrics,
      });
    } catch (error) {
      console.error("Error fetching attendance stats:", error);
      setError("Gagal memuat data kehadiran. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!selectedUser || !attendanceStats) return;
    try {
      setExportingPDF(true);
      setError(null);

      const padMonth = String(selectedMonth).padStart(2, '0');
      const startDate = `${selectedYear}-${padMonth}-01`;
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
      const endDate = `${selectedYear}-${padMonth}-${String(lastDay).padStart(2, '0')}`;

      // Fetch active holidays and permits from Supabase
      const [{ data: holidays }, { data: permits }] = await Promise.all([
        supabase.from("holidays").select("*").eq("is_active", true),
        supabase.from("leave_permits").select("*").eq("user_id", selectedUser.id).gte("start_date", startDate).lte("end_date", endDate)
      ]);

      await generateIndividualReportPDF({
        user: selectedUser,
        stats: attendanceStats,
        selectedMonth,
        selectedYear,
        holidays: holidays || [],
        permits: permits || []
      });
    } catch (error) {
      console.error("PDF Export error:", error);
      setError("Gagal mengunduh PDF. Silakan coba lagi.");
    } finally {
      setExportingPDF(false);
    }
  };

  // Group raw attendances by date into clean [No, Hari/Tanggal, Masuk, Pulang] rows
  const dailyAttendanceList = useMemo(() => {
    if (!attendanceStats?.recentAttendances) return [];
    
    const groupedByDate: Record<string, { dateObj: Date; masuk: string; pulang: string }> = {};

    attendanceStats.recentAttendances.forEach((att) => {
      const d = new Date(att.created_at);
      // Date key in WIB YYYY-MM-DD
      const dateKey = d.toLocaleDateString("sv-SE"); // YYYY-MM-DD format
      const timeStr = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB";

      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = { dateObj: d, masuk: "-", pulang: "-" };
      }

      const isMasuk = att.attendance_type === "masuk" || (!att.attendance_type && groupedByDate[dateKey].masuk === "-");
      if (isMasuk) {
        groupedByDate[dateKey].masuk = timeStr;
      } else {
        groupedByDate[dateKey].pulang = timeStr;
      }
    });

    return Object.keys(groupedByDate)
      .sort((a, b) => b.localeCompare(a))
      .map((dateKey) => {
        const item = groupedByDate[dateKey];
        const dayName = item.dateObj.toLocaleDateString("id-ID", { weekday: "long" });
        const dateFormatted = item.dateObj.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
        return {
          dateKey,
          displayDate: `${dayName}, ${dateFormatted}`,
          masuk: item.masuk,
          pulang: item.pulang,
        };
      });
  }, [attendanceStats]);

  // Paginated daily attendances
  const totalPages = Math.ceil(dailyAttendanceList.length / ITEMS_PER_PAGE) || 1;
  const paginatedDailyAttendances = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return dailyAttendanceList.slice(start, start + ITEMS_PER_PAGE);
  }, [dailyAttendanceList, currentPage]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 4-STEP FILTER CONTROL BAR */}
      <Card className="p-6 bg-white border-2 border-slate-300 rounded-3xl shadow-xl space-y-6">
        <div className="flex items-center gap-3 border-b-2 border-slate-200 pb-4">
          <div className="p-3 bg-[#8c1b1d] rounded-2xl text-white shadow-md">
            <Filter className="w-6 h-6 text-[#fbbf24]" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              Filter Laporan Individu
            </h2>
            <p className="text-xs sm:text-sm font-extrabold text-slate-800">
              Pilih kategori, tombol pilih nama, dan tentukan periode bulan & tahun.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-2 border-red-300 rounded-2xl text-red-700 font-extrabold text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Pilih Kategori */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-slate-900 block">
              1. Kategori Jabatan
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="w-full px-4 py-3 bg-white border-2 border-slate-300 rounded-2xl font-extrabold text-slate-900 focus:border-[#8c1b1d] focus:outline-none shadow-sm cursor-pointer"
            >
              <option value="all">Semua (Dosen & Tendik)</option>
              <option value="dosen">Dosen Struktural</option>
              <option value="tendik">Tenaga Kependidikan (Tendik)</option>
            </select>
          </div>

          {/* 2. Tombol Pilih Nama (Opens Floating Modal) */}
          <div className="space-y-2 lg:col-span-1">
            <label className="text-xs font-black uppercase tracking-wider text-slate-900 block">
              2. Pilih Nama Individu
            </label>
            <button
              type="button"
              onClick={() => setIsNameModalOpen(true)}
              disabled={searchingUsers || categoryFilteredUsers.length === 0}
              className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 border-2 border-slate-300 hover:border-[#8c1b1d] rounded-2xl font-black text-sm text-slate-900 flex items-center justify-between shadow-sm transition-all active:scale-98 group disabled:bg-slate-100"
            >
              <div className="flex items-center gap-2.5 truncate">
                <User className="w-5 h-5 text-[#8c1b1d] shrink-0" />
                <span className="truncate">
                  {selectedUserObj ? selectedUserObj.full_name : "-- Pilih Nama --"}
                </span>
              </div>
              <ChevronDown className="w-5 h-5 text-slate-700 group-hover:text-[#8c1b1d] shrink-0" />
            </button>
          </div>

          {/* 3. Pilih Bulan & Tahun */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-900 block">
                3. Bulan
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full px-3 py-3 bg-white border-2 border-slate-300 rounded-2xl font-extrabold text-slate-900 focus:border-[#8c1b1d] focus:outline-none shadow-sm cursor-pointer"
              >
                {MONTH_NAMES.map((monthName, index) => (
                  <option key={index + 1} value={index + 1}>
                    {monthName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-900 block">
                Tahun
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full px-3 py-3 bg-white border-2 border-slate-300 rounded-2xl font-extrabold text-slate-900 focus:border-[#8c1b1d] focus:outline-none shadow-sm cursor-pointer"
              >
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
                <option value={2024}>2024</option>
              </select>
            </div>
          </div>

          {/* 4. Tombol Tampilkan */}
          <div className="flex items-end">
            <Button
              onClick={handleTampilkan}
              disabled={loading || !selectedUserId}
              className="w-full py-6 bg-[#8c1b1d] hover:bg-[#7a1819] text-white font-black text-base rounded-2xl shadow-lg shadow-[#8c1b1d]/30 transition-all active:scale-95 flex items-center justify-center gap-2 border-2 border-[#8c1b1d]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-[#fbbf24]" />
                  <span>Memuat...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-[#fbbf24]" />
                  <span>Tampilkan Laporan</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* FLOATING MODAL CENTERED DI TENGAH UNTUK PILIH NAMA */}
      {isNameModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsNameModalOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl border-2 border-[#8c1b1d] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 via-[#8c1b1d] to-slate-900 text-white flex items-center justify-between border-b-2 border-[#8c1b1d]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#fbbf24] rounded-xl text-[#8c1b1d]">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white leading-tight">
                    Pilih Nama Pegawai / Dosen
                  </h3>
                  <p className="text-xs text-rose-200 font-extrabold">
                    Tersedia {searchFilteredUsers.length} nama ({selectedCategory === 'dosen' ? 'Dosen Struktural' : selectedCategory === 'tendik' ? 'Tendik' : 'Semua'})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNameModalOpen(false)}
                className="p-2 hover:bg-white/20 rounded-full text-white transition-colors"
                title="Tutup Modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Instant Search Bar inside Modal */}
            <div className="p-4 bg-slate-100 border-b-2 border-slate-200">
              <div className="relative">
                <Search className="w-5 h-5 text-slate-700 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Ketik nama untuk mencari..."
                  value={nameSearch}
                  onChange={(e) => setNameSearch(e.target.value)}
                  className="w-full pl-11 pr-10 py-3 bg-white border-2 border-slate-300 rounded-xl text-base font-extrabold text-slate-900 placeholder-slate-500 focus:outline-none focus:border-[#8c1b1d]"
                />
                {nameSearch && (
                  <button
                    onClick={() => setNameSearch("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-900"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Name Cards List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-[260px] max-h-[420px]">
              {searchFilteredUsers.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <User className="w-12 h-12 text-slate-400 mx-auto" />
                  <p className="text-sm font-black text-slate-800">Nama tidak ditemukan</p>
                  <p className="text-xs font-extrabold text-slate-600">Coba ubah kata kunci pencarian</p>
                </div>
              ) : (
                searchFilteredUsers.map((u) => {
                  const isSelected = u.id === selectedUserId;
                  return (
                    <button
                      key={u.id}
                      onClick={() => {
                        setSelectedUserId(u.id);
                        setIsNameModalOpen(false);
                      }}
                      className={`w-full p-3.5 rounded-2xl text-left transition-all flex items-center justify-between border-2 ${
                        isSelected
                          ? "bg-[#8c1b1d]/10 border-[#8c1b1d] shadow-sm"
                          : "bg-white border-slate-200 hover:border-slate-400 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <Avatar className={`w-11 h-11 border-2 ${isSelected ? "border-[#8c1b1d]" : "border-slate-300"}`}>
                          <AvatarFallback className={isSelected ? "bg-[#8c1b1d] text-[#fbbf24] font-black" : "bg-slate-200 text-slate-800 font-bold"}>
                            {u.full_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <span className={`block text-base font-black truncate ${isSelected ? "text-[#8c1b1d]" : "text-slate-900"}`}>
                            {u.full_name}
                          </span>
                          <span className="text-xs font-bold text-slate-700 truncate block">
                            {u.unit_kerja || "Universitas Ekasakti"} • <span className="uppercase text-[#8c1b1d] font-black">{u.role}</span>
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-7 h-7 rounded-full bg-[#8c1b1d] text-[#fbbf24] flex items-center justify-center shrink-0 shadow-sm">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* FULL RICH DASHBOARD REPORT DISPLAY */}
      {selectedUser && attendanceStats && (
        <div ref={dashboardPrintRef} className="space-y-8 animate-in fade-in duration-500">
          
          {/* USER PROFILE HEADER CARD */}
          <Card className="p-6 bg-gradient-to-r from-slate-900 via-[#8c1b1d] to-slate-900 text-white rounded-3xl border-2 border-[#8c1b1d] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#fbbf24]/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <Avatar className="w-20 h-20 border-4 border-[#fbbf24] shadow-xl">
                  <AvatarFallback className="bg-[#8c1b1d] text-[#fbbf24] font-black text-2xl">
                    {selectedUser.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                      {selectedUser.full_name}
                    </h2>
                    <Badge className="bg-[#fbbf24] text-[#8c1b1d] font-black uppercase text-xs border border-[#fbbf24]">
                      {selectedUser.role}
                    </Badge>
                  </div>
                  <p className="text-sm font-bold text-rose-100 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-[#fbbf24]" />
                    <span>Unit Kerja: {selectedUser.unit_kerja || "Universitas Ekasakti"}</span>
                  </p>
                  <p className="text-xs font-semibold text-rose-200 mt-1 flex items-center gap-2">
                    <CalendarDays className="w-3.5 h-3.5 text-[#fbbf24]" />
                    <span>Periode: {MONTH_NAMES[selectedMonth - 1]} {selectedYear}</span>
                  </p>
                </div>
              </div>

              {/* PDF EXPORT BUTTON */}
              <Button
                onClick={handleExportPDF}
                disabled={exportingPDF}
                className="bg-[#fbbf24] hover:bg-amber-400 text-[#8c1b1d] font-black px-6 py-6 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center gap-2.5 border-2 border-[#fbbf24]"
              >
                {exportingPDF ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
                <span>Unduh Laporan PDF</span>
              </Button>
            </div>
          </Card>

          {/* QUICK METRICS GRID */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-5 bg-white border-2 border-slate-300 rounded-2xl shadow-md space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-900">Total Hadir</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-3xl font-black text-slate-900">{attendanceStats.totalHadir}</h3>
              <p className="text-xs font-bold text-emerald-700">Absensi Masuk / Pulang</p>
            </Card>

            <Card className="p-5 bg-white border-2 border-slate-300 rounded-2xl shadow-md space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-900">Izin & Cuti</span>
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-3xl font-black text-slate-900">
                {attendanceStats.totalIzin + attendanceStats.totalCuti}
              </h3>
              <p className="text-xs font-bold text-blue-700">Terbuka Disetujui</p>
            </Card>

            <Card className="p-5 bg-white border-2 border-slate-300 rounded-2xl shadow-md space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-900">Dinas Luar</span>
                <Briefcase className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-3xl font-black text-slate-900">{attendanceStats.totalDinasLuar}</h3>
              <p className="text-xs font-bold text-purple-700">Tugas Kedinasan</p>
            </Card>

            <Card className="p-5 bg-white border-2 border-slate-300 rounded-2xl shadow-md space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-900">% Kehadiran</span>
                <TrendingUp className="w-5 h-5 text-[#8c1b1d]" />
              </div>
              <h3 className="text-3xl font-black text-[#8c1b1d]">{attendanceStats.attendancePercentage}%</h3>
              <p className="text-xs font-bold text-slate-800">Skor Persentase Bulanan</p>
            </Card>
          </div>

          {/* VISUAL CHARTS GRID (2 SIMETRIS CARDS) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 1. PieChart Distribusi Status */}
            <Card className="p-6 bg-white border-2 border-slate-300 rounded-3xl shadow-xl space-y-4">
              <h3 className="text-base font-black text-[#8c1b1d] flex items-center gap-2 border-b-2 border-slate-200 pb-2">
                <PieChartIcon className="w-5 h-5 text-[#8c1b1d]" />
                Distribusi Status Presensi
              </h3>
              <div className="h-52 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={attendanceStats.statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {attendanceStats.statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-black pt-1">
                {attendanceStats.statusDistribution.map((st, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">
                    <span className="block text-slate-900 font-extrabold">{st.name}</span>
                    <span style={{ color: st.color }} className="text-lg font-black">{st.value}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* 2. Radar Performance Metrics */}
            <Card className="p-6 bg-white border-2 border-slate-300 rounded-3xl shadow-xl space-y-4">
              <h3 className="text-base font-black text-[#8c1b1d] flex items-center gap-2 border-b-2 border-slate-200 pb-2">
                <Activity className="w-5 h-5 text-[#8c1b1d]" />
                Analisis Radar Performa & Disiplin
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={attendanceStats.radarMetrics}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: "#1e293b", fontSize: 12, fontWeight: 800 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar name="Skor" dataKey="value" stroke="#8c1b1d" fill="#8c1b1d" fillOpacity={0.6} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </Card>

          </div>

          {/* CLEAN RESTRUCTURED DAILY ATTENDANCE TABLE (No | Hari/Tanggal | Masuk | Pulang) */}
          <Card className="p-6 bg-white border-2 border-slate-300 rounded-3xl shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b-2 border-slate-200 pb-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#8c1b1d]" />
                Riwayat Kehadiran Harian ({dailyAttendanceList.length} Hari Beraktivitas)
              </h3>
              <span className="text-xs font-black text-[#8c1b1d] bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                Format Jam Masuk & Pulang
              </span>
            </div>

            {paginatedDailyAttendances.length === 0 ? (
              <p className="text-sm font-bold text-slate-800 text-center py-8">
                Tidak ada catatan absensi harian untuk periode bulan & tahun yang dipilih.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm font-bold text-slate-900 border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-300 bg-slate-100 text-slate-900">
                        <th className="p-3 font-black text-center w-16">No</th>
                        <th className="p-3 font-black">Hari / Tanggal</th>
                        <th className="p-3 font-black text-center">Masuk</th>
                        <th className="p-3 font-black text-center">Pulang</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedDailyAttendances.map((item, index) => {
                        const rowNum = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
                        return (
                          <tr key={item.dateKey} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                            <td className="p-3 text-center font-black text-slate-800">{rowNum}</td>
                            <td className="p-3 font-black text-slate-900">{item.displayDate}</td>
                            <td className="p-3 text-center">
                              {item.masuk !== "-" ? (
                                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-900 px-3 py-1 rounded-xl border border-emerald-300 font-black text-xs">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                                  {item.masuk}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-bold text-xs">-</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {item.pulang !== "-" ? (
                                <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-900 px-3 py-1 rounded-xl border border-blue-300 font-black text-xs">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" />
                                  {item.pulang}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-bold text-xs">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* PAGINATION CONTROLS */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                    <p className="text-xs font-extrabold text-slate-800">
                      Halaman {currentPage} dari {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-900 font-black text-xs px-3 py-1 rounded-xl"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Sebelumnya
                      </Button>
                      <Button
                        size="sm"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-900 font-black text-xs px-3 py-1 rounded-xl"
                      >
                        Selanjutnya
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
