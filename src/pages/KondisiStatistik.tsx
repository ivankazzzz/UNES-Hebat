import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  PieChart,
  Calendar,
  LogOut,
  UserCheck,
  UserX,
  TrendingUp,
  Users2,
  GraduationCap,
  Briefcase,
  Download
} from "lucide-react";
import { logout } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { generateKondisiStatistikPDF } from "@/lib/pdf-generator";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const MONTH_OPTIONS = [
  { value: "01", label: "Januari" },
  { value: "02", label: "Februari" },
  { value: "03", label: "Maret" },
  { value: "04", label: "April" },
  { value: "05", label: "Mei" },
  { value: "06", label: "Juni" },
  { value: "07", label: "Juli" },
  { value: "08", label: "Agustus" },
  { value: "09", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" }
];

const parseDayString = (dayString: string) => {
  const [yearStr, monthStr, dayStr] = dayString.split("-");
  return {
    year: Number(yearStr),
    month: Number(monthStr),
    day: Number(dayStr)
  };
};

const formatDayString = (year: number, month: number, day: number) => {
  const pad2 = (value: number) => String(value).padStart(2, "0");
  return `${year}-${pad2(month)}-${pad2(day)}`;
};

const getDaysInMonth = (year: number, month: number) => {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
};

export default function KondisiStatistik() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const selectedMonth = selectedDate.split("-")[1] ?? "01";

  const WIB_TIME_ZONE = "Asia/Jakarta";

  const handleMonthChange = (monthValue: string) => {
    const { year, day } = parseDayString(selectedDate);
    const monthNumber = Number(monthValue);
    if (!monthNumber) return;
    const daysInMonth = getDaysInMonth(year, monthNumber);
    const nextDay = Math.min(day, daysInMonth);
    setSelectedDate(formatDayString(year, monthNumber, nextDay));
  };

  const getWibDayBoundsUtc = useCallback(
    (dayString: string): { startIsoUtc: string; endIsoUtc: string } => {
      // dayString format: YYYY-MM-DD
      const [yearStr, monthStr, dayStr] = dayString.split("-");
      const year = Number(yearStr);
      const month = Number(monthStr);
      const day = Number(dayStr);

      // WIB = UTC+7 => start WIB 00:00 == UTC 17:00 previous day.
      const startUtc = new Date(Date.UTC(year, month - 1, day, -7, 0, 0, 0));
      const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000);

      return { startIsoUtc: startUtc.toISOString(), endIsoUtc: endUtc.toISOString() };
    },
    []
  );

  const isSundayWibFromDayString = useCallback(
    (dayString: string): boolean => {
      const [yearStr, monthStr, dayStr] = dayString.split("-");
      const year = Number(yearStr);
      const month = Number(monthStr);
      const day = Number(dayStr);

      // Representasikan WIB midnight dalam UTC, lalu cek weekday pada timezone WIB.
      const wibMidnightUtc = new Date(Date.UTC(year, month - 1, day, -7, 0, 0, 0));
      const weekday = new Intl.DateTimeFormat("en-US", {
        timeZone: WIB_TIME_ZONE,
        weekday: "short"
      }).format(wibMidnightUtc);

      return weekday.toLowerCase() === "sun";
    },
    [WIB_TIME_ZONE]
  );

  const [stats, setStats] = useState({
    totalUsers: 0,
    presentToday: 0,
    notPresentToday: 0,
    missingCheckoutToday: 0,

    dosenStrukturalTotal: 0,
    tendikTotal: 0,

    dosenStrukturalMasuk: 0,
    dosenStrukturalPulang: 0,
    tendikMasuk: 0,
    tendikPulang: 0,

    attendanceByType: [],
    attendanceByTypeDosenStruktural: [],
    attendanceByTypeTendik: [],

    detailedStats: [],
    monthlyTrend: [],
    monthlyTrendPulang: [],
    categoryMasukPulang: []
  });

  type MinimalUser = {
    id: string;
    full_name: string | null;
    role: string | null;
    username: string | null;
    unit_kerja?: string | null;
    is_struktural?: boolean | null;
  };

  type MinimalAttendance = {
    id: string;
    user_id: string | null;
    attendance_type: string;
    created_at: string | null;
  };

  type ChartEntry = {
    name: string;
    value: number;
    color: string;
    type: string;
  };

  type CategoryMasukPulangEntry = {
    category: string;
    masuk: number;
    pulang: number;
  };

  const [detailModal, setDetailModal] = useState<{
    open: boolean;
    title: string;
    users: MinimalUser[];
  }>({
    open: false,
    title: "",
    users: []
  });

  const [allUsers, setAllUsers] = useState<MinimalUser[]>([]);
  const [trackedUsers, setTrackedUsers] = useState<MinimalUser[]>([]);
  const [allAttendances, setAllAttendances] = useState<MinimalAttendance[]>([]);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isTenagaKependidikan = useCallback((user: MinimalUser): boolean => {
    // Exclude tesx
    if (user.username === 'tesx' || user.username === 'andi.syahrum.makkurade') return false;


    // Explicit inclusions for specific admin/superadmin users who are Tendik
    if (user.username === 'irfan.ananda.ismail' || user.username === 'asmara.indah') {
      return true;
    }

    const role = (user.role || "").toLowerCase();
    if (role !== "pegawai") return false;

    const unitKerja = (user.unit_kerja || "").toLowerCase();

    const excludedKeywords = [
      "satpam",
      "guru",
      "driver",
      "garin",
      "tk ekasakti",
      "sma ekasakti",
      "ka. kebersihan",
      "komandan satpam",
      "wakil komandan satpam",
      "cleaning service",
      "kebersihan",
    ];

    if (excludedKeywords.some((keyword) => unitKerja.includes(keyword))) return false;

    const includedKeywords = [
      "staf",
      "ka.",
      "kepala",
      "koordinator",
      "bendahara",
      "sekretaris",
      "operator",
      "koor.",
      "komandan",
      "kepsek",
      "waka",
      "pengelola",
    ];

    return includedKeywords.some((keyword) => unitKerja.includes(keyword));
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, full_name, role, username, unit_kerja, is_struktural');

      const typedUsers = (usersData ?? []) as MinimalUser[];
      
      if (usersError) throw usersError;
      setAllUsers(typedUsers);

      // Dosen struktural: role dosen dengan is_struktural=true ATAU admin/superadmin dengan is_struktural=true
      // Exclude user "tesx"
      const dosenStrukturalUsers = typedUsers.filter(
        (u) => {
          if (u.username === 'tesx' || u.username === 'andi.syahrum.makkurade') return false; // Exclude tesx + andi.syahrum.makkurade
          const role = (u.role || "").toLowerCase();
          return u.is_struktural === true && (role === "dosen" || role === "admin" || role === "superadmin");
        }
      );
      const tendikUsers = typedUsers.filter((u) => {
        if (u.username === 'tesx' || u.username === 'andi.syahrum.makkurade') return false; // Exclude tesx + andi.syahrum.makkurade
        return isTenagaKependidikan(u);
      });

      const tracked = [...dosenStrukturalUsers, ...tendikUsers];
      setTrackedUsers(tracked);

      const trackedUserIds = new Set(tracked.map((u) => u.id));
      const dosenStrukturalUserIds = new Set(dosenStrukturalUsers.map((u) => u.id));
      const tendikUserIds = new Set(tendikUsers.map((u) => u.id));

      const selectedBounds = getWibDayBoundsUtc(selectedDate);

      // Fetch attendances for selected date (berdasarkan batas hari WIB)
      const { data: attData, error: attError } = await supabase
        .from('attendances')
        .select('id, user_id, attendance_type, created_at')
        .gte('created_at', selectedBounds.startIsoUtc)
        .lt('created_at', selectedBounds.endIsoUtc);

      const typedAttendances = (attData ?? []) as MinimalAttendance[];

      if (attError) throw attError;
      setAllAttendances(typedAttendances);

      // Calculate stats (hanya Dosen Struktural + Tendik)
      const checkins = typedAttendances.filter((a) => a.attendance_type === "masuk");
      const checkouts = typedAttendances.filter((a) => a.attendance_type === "pulang");

      const presentUserIds = new Set(checkins.map((a) => a.user_id).filter(Boolean));
      const checkoutUserIds = new Set(checkouts.map((a) => a.user_id).filter(Boolean));

      // base metrics untuk detailedStats (berdasarkan trackedUsers)
      const hasMasuk = Array.from(presentUserIds).filter((id) => trackedUserIds.has(id)).length;
      const hasPulang = Array.from(checkoutUserIds).filter((id) => trackedUserIds.has(id)).length;
      const notPresent = tracked.length - hasMasuk;
      const notMasuk = tracked.length - hasMasuk;
      const notPulang = Math.max(0, hasMasuk - hasPulang);

      const isSunday = isSundayWibFromDayString(selectedDate);

      const filteredPresentUserIds = new Set(Array.from(presentUserIds).filter((id) => trackedUserIds.has(id)));
      const filteredCheckoutUserIds = new Set(Array.from(checkoutUserIds).filter((id) => trackedUserIds.has(id)));
      const filteredMissingCheckoutIds = Array.from(filteredPresentUserIds).filter(
        (id) => !filteredCheckoutUserIds.has(id)
      );

      const trackedUsersCount = tracked.length;
      const presentCount = isSunday ? 0 : filteredPresentUserIds.size;
      const notPresentCount = isSunday ? trackedUsersCount : trackedUsersCount - filteredPresentUserIds.size;
      const missingCheckoutCount = isSunday ? 0 : filteredMissingCheckoutIds.length;

      const dosenStrukturalMasuk = isSunday
        ? 0
        : Array.from(filteredPresentUserIds).filter((id) => dosenStrukturalUserIds.has(id)).length;
      const dosenStrukturalPulang = isSunday
        ? 0
        : Array.from(filteredCheckoutUserIds).filter((id) => dosenStrukturalUserIds.has(id)).length;
      const tendikMasuk = isSunday ? 0 : Array.from(filteredPresentUserIds).filter((id) => tendikUserIds.has(id)).length;
      const tendikPulang = isSunday
        ? 0
        : Array.from(filteredCheckoutUserIds).filter((id) => tendikUserIds.has(id)).length;

      const categoryMasukPulang: CategoryMasukPulangEntry[] = [
        { category: "Dosen Struktural", masuk: dosenStrukturalMasuk, pulang: dosenStrukturalPulang },
        { category: "Tendik", masuk: tendikMasuk, pulang: tendikPulang }
      ];

      const dosenStrukturalTotal = dosenStrukturalUsers.length;
      const tendikTotal = tendikUsers.length;

      const dosenStrukturalPresentCount = isSunday
        ? 0
        : Array.from(filteredPresentUserIds).filter((id) => dosenStrukturalUserIds.has(id)).length;
      const tendikPresentCount = isSunday
        ? 0
        : Array.from(filteredPresentUserIds).filter((id) => tendikUserIds.has(id)).length;

      const attendanceByType: ChartEntry[] = [
        { name: "Hadir", value: presentCount, color: "#10b981", type: "present" },
        { name: "Tidak Hadir", value: notPresentCount, color: "#ef4444", type: "absent" }
      ];

      const attendanceByTypeDosenStruktural: ChartEntry[] = [
        {
          name: "Hadir",
          value: dosenStrukturalPresentCount,
          color: "#10b981",
          type: "present_dosen_struktural"
        },
        {
          name: "Tidak Hadir",
          value: Math.max(0, dosenStrukturalTotal - dosenStrukturalPresentCount),
          color: "#ef4444",
          type: "absent_dosen_struktural"
        }
      ];

      const attendanceByTypeTendik: ChartEntry[] = [
        {
          name: "Hadir",
          value: tendikPresentCount,
          color: "#10b981",
          type: "present_tendik"
        },
        {
          name: "Tidak Hadir",
          value: Math.max(0, tendikTotal - tendikPresentCount),
          color: "#ef4444",
          type: "absent_tendik"
        }
      ];

      const detailedStats: ChartEntry[] = [
        { name: "Absen Masuk", value: isSunday ? 0 : hasMasuk, color: "#3b82f6", type: "masuk" },
        { name: "Absen Pulang", value: isSunday ? 0 : hasPulang, color: "#8b5cf6", type: "pulang" },
        { name: "Tidak Masuk", value: isSunday ? trackedUsersCount : notPresent, color: "#f59e0b", type: "not_present" },
        { name: "Tidak Absen Masuk", value: isSunday ? trackedUsersCount : notMasuk, color: "#ef4444", type: "not_masuk" },
        { name: "Tidak Absen Pulang", value: isSunday ? 0 : notPulang, color: "#ec4899", type: "not_pulang" }
      ];

      setStats((prev) => ({
        ...prev,
        totalUsers: trackedUsersCount,
        presentToday: presentCount,
        notPresentToday: notPresentCount,
        missingCheckoutToday: missingCheckoutCount,

        dosenStrukturalTotal,
        tendikTotal,

        dosenStrukturalMasuk,
        dosenStrukturalPulang,
        tendikMasuk,
        tendikPulang,

        attendanceByType,
        attendanceByTypeDosenStruktural,
        attendanceByTypeTendik,
        detailedStats,
        categoryMasukPulang
      }));

      // Fetch monthly trend (last 7 days) - Masuk & Pulang
      const { year: trendYear, month: trendMonth, day: trendDay } = parseDayString(selectedDate);
      const anchorDateUtc = new Date(Date.UTC(trendYear, trendMonth - 1, trendDay));
      const startDateUtc = new Date(anchorDateUtc.getTime());
      startDateUtc.setUTCDate(startDateUtc.getUTCDate() - 6);

      const wibDayFormatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: WIB_TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      });

      const wibLabelFormatter = new Intl.DateTimeFormat("id-ID", {
        timeZone: WIB_TIME_ZONE,
        weekday: "short",
        day: "2-digit",
        month: "2-digit"
      });

      const rangeStart = getWibDayBoundsUtc(wibDayFormatter.format(startDateUtc)).startIsoUtc;
      const rangeEnd = getWibDayBoundsUtc(selectedDate).endIsoUtc;

      // Fetch both masuk and pulang data
      const { data: trendDataMasuk, error: trendErrorMasuk } = await supabase
        .from('attendances')
        .select('created_at, attendance_type, user_id')
        .gte('created_at', rangeStart)
        .lt('created_at', rangeEnd)
        .eq('attendance_type', 'masuk');

      const { data: trendDataPulang, error: trendErrorPulang } = await supabase
        .from('attendances')
        .select('created_at, attendance_type, user_id')
        .gte('created_at', rangeStart)
        .lt('created_at', rangeEnd)
        .eq('attendance_type', 'pulang');

      if (trendErrorMasuk) {
        console.error("Error fetching trend masuk:", trendErrorMasuk);
      }
      if (trendErrorPulang) {
        console.error("Error fetching trend pulang:", trendErrorPulang);
      }

      const typedTrendMasuk = (trendDataMasuk ?? []) as Array<{ created_at: string | null; attendance_type: string; user_id: string | null }>;
      const typedTrendPulang = (trendDataPulang ?? []) as Array<{ created_at: string | null; attendance_type: string; user_id: string | null }>;

      const trendMasuk: Array<{ date: string; count: number }> = [];
      const trendPulang: Array<{ date: string; count: number }> = [];
      
      for (let i = 0; i < 7; i++) {
        const dayDateUtc = new Date(startDateUtc.getTime());
        dayDateUtc.setUTCDate(dayDateUtc.getUTCDate() + i);

        const wibDayStr = wibDayFormatter.format(dayDateUtc);
        const isSunday = isSundayWibFromDayString(wibDayStr);
        const bounds = getWibDayBoundsUtc(wibDayStr);

        let countMasuk = 0;
        let countPulang = 0;

        if (!isSunday) {
          const masukIds = new Set<string>();
          typedTrendMasuk.forEach((a) => {
            if (!a.created_at) return;
            if (!a.user_id) return;
            if (!trackedUserIds.has(a.user_id)) return;
            if (a.created_at >= bounds.startIsoUtc && a.created_at < bounds.endIsoUtc) {
              masukIds.add(a.user_id);
            }
          });

          const pulangIds = new Set<string>();
          typedTrendPulang.forEach((a) => {
            if (!a.created_at) return;
            if (!a.user_id) return;
            if (!trackedUserIds.has(a.user_id)) return;
            if (a.created_at >= bounds.startIsoUtc && a.created_at < bounds.endIsoUtc) {
              pulangIds.add(a.user_id);
            }
          });

          countMasuk = masukIds.size;
          countPulang = pulangIds.size;
        }

        const label = wibLabelFormatter.format(dayDateUtc);

        trendMasuk.push({
          date: label,
          count: countMasuk
        });

        trendPulang.push({
          date: label,
          count: countPulang
        });
      }

      setStats((prev) => ({ ...prev, monthlyTrend: trendMasuk, monthlyTrendPulang: trendPulang }));

    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, getWibDayBoundsUtc, isSundayWibFromDayString, isTenagaKependidikan, WIB_TIME_ZONE]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showPresentUsers = () => {
    if (isSundayWibFromDayString(selectedDate)) {
      setDetailModal({
        open: true,
        title: "Hari Minggu - Tidak Ada Kehadiran",
        users: []
      });
      return;
    }

    const presentIds = new Set(allAttendances.filter((a) => a.attendance_type === "masuk").map((a) => a.user_id));
    const users = trackedUsers.filter((u) => presentIds.has(u.id));
    setDetailModal({
      open: true,
      title: "Daftar Pengguna Hadir",
      users: users
    });
  };

  const showNotPresentUsers = () => {
    const users = trackedUsers;

    setDetailModal({
      open: true,
      title: isSundayWibFromDayString(selectedDate)
        ? "Hari Minggu - Semua Pengguna Tidak Hadir"
        : "Daftar Pengguna Tidak Hadir",
      users: isSundayWibFromDayString(selectedDate)
        ? users
        : users.filter((user) => {
            const presentIds = new Set(
              allAttendances.filter((a) => a.attendance_type === "masuk").map((a) => a.user_id)
            );
            return !presentIds.has(user.id);
          })
    });
  };

  const showMissingCheckoutUsers = () => {
    if (isSundayWibFromDayString(selectedDate)) {
      setDetailModal({
        open: true,
        title: "Hari Minggu - Tidak Ada Kehadiran",
        users: []
      });
      return;
    }

    const presentIds = new Set(allAttendances.filter((a) => a.attendance_type === "masuk").map((a) => a.user_id));
    const checkoutIds = new Set(allAttendances.filter((a) => a.attendance_type === "pulang").map((a) => a.user_id));
    const missingIds = Array.from(presentIds).filter((id) => !checkoutIds.has(id));
    const users = trackedUsers.filter((u) => missingIds.includes(u.id));
    setDetailModal({
      open: true,
      title: "Daftar Pengguna Belum Absen Pulang",
      users: users
    });
  };

  const showCategoryUsers = (opts: {
    title: string;
    category: "dosen_struktural" | "tendik";
    attendanceType: "masuk" | "pulang";
  }) => {
    if (isSundayWibFromDayString(selectedDate)) {
      setDetailModal({
        open: true,
        title: "Hari Minggu - Tidak Ada Kehadiran",
        users: []
      });
      return;
    }

    const targetIds = new Set(
      allAttendances.filter((a) => a.attendance_type === opts.attendanceType).map((a) => a.user_id)
    );

    const users = trackedUsers.filter((user) => {
      if (!targetIds.has(user.id)) return false;

      const role = (user.role || "").toLowerCase();
      const isDosenStruktural = user.is_struktural === true && (role === "dosen" || role === "admin" || role === "superadmin");
      const isTendik = isTenagaKependidikan(user);

      return opts.category === "dosen_struktural" ? isDosenStruktural : isTendik;
    });

    setDetailModal({
      open: true,
      title: opts.title,
      users
    });
  };

  const showAttendanceUsersByCategory = useCallback(
    (opts: { title: string; category: "dosen_struktural" | "tendik"; mode: "present" | "absent" }) => {
      const isSunday = isSundayWibFromDayString(selectedDate);
      if (isSunday) {
        setDetailModal({
          open: true,
          title: opts.mode === "present" ? "Hari Minggu - Tidak Ada Kehadiran" : "Hari Minggu - Semua Pengguna Tidak Hadir",
          users: opts.mode === "present"
            ? []
            : trackedUsers.filter((user) => {
                const role = (user.role || "").toLowerCase();
                const isDosenStruktural = user.is_struktural === true && (role === "dosen" || role === "admin" || role === "superadmin");
                const isTendik = isTenagaKependidikan(user);
                return opts.category === "dosen_struktural" ? isDosenStruktural : isTendik;
              })
        });
        return;
      }

      const presentIds = new Set(
        allAttendances.filter((a) => a.attendance_type === "masuk").map((a) => a.user_id)
      );

      const users = trackedUsers.filter((user) => {
        const role = (user.role || "").toLowerCase();
        const isDosenStruktural = user.is_struktural === true && (role === "dosen" || role === "admin" || role === "superadmin");
        const isTendik = isTenagaKependidikan(user);

        return opts.category === "dosen_struktural" ? isDosenStruktural : isTendik;
      });

      setDetailModal({
        open: true,
        title: opts.title,
        users
      });
    },
    [allAttendances, isSundayWibFromDayString, isTenagaKependidikan, selectedDate, trackedUsers]
  );

  const handlePieClick = (data: { type?: string }) => {
    switch (data.type) {
      case "present":
        showPresentUsers();
        return;
      case "absent":
        showNotPresentUsers();
        return;
      case "present_dosen_struktural":
        showAttendanceUsersByCategory({
          title: "Daftar Dosen Struktural Hadir",
          category: "dosen_struktural",
          mode: "present"
        });
        return;
      case "absent_dosen_struktural":
        showAttendanceUsersByCategory({
          title: "Daftar Dosen Struktural Tidak Hadir",
          category: "dosen_struktural",
          mode: "absent"
        });
        return;
      case "present_tendik":
        showAttendanceUsersByCategory({
          title: "Daftar Tendik Hadir",
          category: "tendik",
          mode: "present"
        });
        return;
      case "absent_tendik":
        showAttendanceUsersByCategory({
          title: "Daftar Tendik Tidak Hadir",
          category: "tendik",
          mode: "absent"
        });
        return;
    }
  };

  const handleBarClick = (data: { type?: string }) => {
    const type = data.type;
    let users: MinimalUser[] = [];
    let title = "";

    const presentIds = new Set(allAttendances.filter((a) => a.attendance_type === "masuk").map((a) => a.user_id));
    const checkoutIds = new Set(allAttendances.filter((a) => a.attendance_type === "pulang").map((a) => a.user_id));

    switch (type) {
      case "masuk":
        users = trackedUsers.filter((u) => presentIds.has(u.id));
        title = "Daftar Pengguna Absen Masuk";
        break;
      case "pulang":
        users = trackedUsers.filter((u) => checkoutIds.has(u.id));
        title = "Daftar Pengguna Absen Pulang";
        break;
      case "not_present":
      case "not_masuk":
        users = trackedUsers.filter((u) => !presentIds.has(u.id));
        title = type === "not_present" ? "Daftar Pengguna Tidak Masuk" : "Daftar Pengguna Tidak Absen Masuk";
        break;
      case "not_pulang": {
        const missingIds = Array.from(presentIds).filter((id) => !checkoutIds.has(id));
        users = trackedUsers.filter((u) => missingIds.includes(u.id));
        title = "Daftar Pengguna Tidak Absen Pulang";
        break;
      }
    }

    if (users.length >= 0) {
      setDetailModal({
        open: true,
        title: title,
        users: users
      });
    }
  };

   const handleDownloadPdf = async () => {
     setDownloadingPdf(true);
     try {
       // Fetch ALL history for "rekam kehadiran terbaik" calculation
       const trackedUserIds = trackedUsers.map((u) => u.id).filter(Boolean);
       let historyAttendances: MinimalAttendance[] = [];
       if (trackedUserIds.length > 0) {
         const { data: histData, error: histError } = await supabase
           .from('attendances')
           .select('id, user_id, attendance_type, created_at')
           .in('user_id', trackedUserIds)
           .order('created_at', { ascending: false });

         if (histError) throw histError;
         historyAttendances = (histData ?? []) as MinimalAttendance[];
       }

       await generateKondisiStatistikPDF({
         selectedDate,
         stats: {
           totalUsers: stats.totalUsers,
           presentToday: stats.presentToday,
           notPresentToday: stats.notPresentToday,
           missingCheckoutToday: stats.missingCheckoutToday,
           dosenStrukturalTotal: stats.dosenStrukturalTotal,
           tendikTotal: stats.tendikTotal,
           dosenStrukturalMasuk: stats.dosenStrukturalMasuk,
           dosenStrukturalPulang: stats.dosenStrukturalPulang,
           tendikMasuk: stats.tendikMasuk,
           tendikPulang: stats.tendikPulang,
         },
         trackedUsers,
         attendancesSelectedDate: allAttendances,
         attendancesHistory: historyAttendances,
         isSunday: isSundayWibFromDayString(selectedDate),
       });
     } catch (error) {
       console.error("Gagal membuat PDF kondisi statistik:", error);
     } finally {
       setDownloadingPdf(false);
     }
   };

  return (
    <div className="min-h-screen bg-gray-50 w-full overflow-x-hidden">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 w-full">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 w-full">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin")}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <img src="/unes.png" alt="UNES Logo" className="h-8 w-8" />
            <div>
              <h1 className="text-lg font-bold text-gray-900 text-sm md:text-base leading-tight">Statistik</h1>
              <p className="text-[10px] text-gray-500 md:hidden">Analitik Kehadiran</p>
              <p className="text-xs text-gray-500 hidden md:block">Dashboard Analitik Kehadiran</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleLogout} className="p-2 hover:bg-gray-100 rounded-lg">
              <LogOut className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 pb-20">
        {/* Date Selector - More Eye Catching & Centered */}
        <div className="flex flex-col items-center justify-center space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
          <label className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Pilih Tanggal & Bulan Laporan</label>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative group">
              <div className="absolute inset-0 bg-blue-500 blur-lg opacity-20 group-hover:opacity-30 transition-opacity rounded-full"></div>
              <div className="relative flex items-center bg-white border-2 border-blue-100 rounded-2xl px-4 py-2 shadow-sm focus-within:border-blue-500 transition-all">
                <Calendar className="w-5 h-5 text-blue-500 mr-2" />
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-lg font-bold text-gray-900 focus:outline-none cursor-pointer"
                />
              </div>
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-blue-500 blur-lg opacity-20 group-hover:opacity-30 transition-opacity rounded-full"></div>
              <div className="relative flex items-center bg-white border-2 border-blue-100 rounded-2xl px-4 py-2 shadow-sm focus-within:border-blue-500 transition-all">
                <Calendar className="w-5 h-5 text-blue-500 mr-2" />
                <select
                  value={selectedMonth}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  className="bg-transparent text-lg font-bold text-gray-900 focus:outline-none cursor-pointer"
                >
                  {MONTH_OPTIONS.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow bg-blue-50 border-blue-100"
            onClick={showPresentUsers}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-blue-900">Total Hadir</CardTitle>
              <UserCheck className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">{stats.presentToday}</div>
              <p className="text-xs text-blue-600">Hari ini</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow bg-red-50 border-red-100"
            onClick={showNotPresentUsers}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-red-900">Tidak Hadir</CardTitle>
              <UserX className="w-4 h-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700">{stats.notPresentToday}</div>
              <p className="text-xs text-red-600">Belum absen masuk</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow bg-orange-50 border-orange-100"
            onClick={showMissingCheckoutUsers}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-orange-900">Belum Pulang</CardTitle>
              <TrendingUp className="w-4 h-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700">{stats.missingCheckoutToday}</div>
              <p className="text-xs text-orange-600">Sudah masuk, belum pulang</p>
            </CardContent>
          </Card>

          <Card className="bg-emerald-50 border-emerald-100">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-emerald-900">Total Pengguna</CardTitle>
              <Users2 className="w-4 h-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-700">{stats.totalUsers}</div>
              <p className="text-xs text-emerald-600">Dosen struktural + tendik</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow bg-sky-50 border-sky-100"
            onClick={() =>
              showCategoryUsers({
                title: "Daftar Dosen Struktural Absen Masuk",
                category: "dosen_struktural",
                attendanceType: "masuk"
              })
            }
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-sky-900">Dosen Struktural Masuk</CardTitle>
              <GraduationCap className="w-4 h-4 text-sky-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-sky-700">{stats.dosenStrukturalMasuk}</div>
              <p className="text-xs text-sky-600">Absen masuk {stats.dosenStrukturalMasuk} dari total {stats.dosenStrukturalTotal}</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow bg-indigo-50 border-indigo-100"
            onClick={() =>
              showCategoryUsers({
                title: "Daftar Dosen Struktural Absen Pulang",
                category: "dosen_struktural",
                attendanceType: "pulang"
              })
            }
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-indigo-900">Dosen Struktural Pulang</CardTitle>
              <LogOut className="w-4 h-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-700">{stats.dosenStrukturalPulang}</div>
              <p className="text-xs text-indigo-600">Absen pulang {stats.dosenStrukturalPulang} dari total {stats.dosenStrukturalTotal}</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow bg-teal-50 border-teal-100"
            onClick={() =>
              showCategoryUsers({
                title: "Daftar Tendik Absen Masuk",
                category: "tendik",
                attendanceType: "masuk"
              })
            }
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-teal-900">Tendik Masuk</CardTitle>
              <Briefcase className="w-4 h-4 text-teal-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-teal-700">{stats.tendikMasuk}</div>
              <p className="text-xs text-teal-600">Absen masuk {stats.tendikMasuk} dari total {stats.tendikTotal}</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow bg-purple-50 border-purple-100"
            onClick={() =>
              showCategoryUsers({
                title: "Daftar Tendik Absen Pulang",
                category: "tendik",
                attendanceType: "pulang"
              })
            }
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-purple-900">Tendik Pulang</CardTitle>
              <LogOut className="w-4 h-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700">{stats.tendikPulang}</div>
              <p className="text-xs text-purple-600">Absen pulang {stats.tendikPulang} dari total {stats.tendikTotal}</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-sky-600" />
                  Masuk vs Pulang (Struktural & Tendik)
                </CardTitle>
                <CardDescription>Perbandingan jumlah absen per kategori</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.categoryMasukPulang} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="category" tick={{ fontSize: 10 }} interval={0} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="masuk" name="Absen Masuk" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="pulang" name="Absen Pulang" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-blue-600" />
                  Persentase Kehadiran
                </CardTitle>
                <CardDescription>Klik pada bagian chart untuk melihat detail nama</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col">
                    <div className="flex items-baseline justify-between mb-2">
                      <h3 className="text-sm font-semibold text-gray-900">Dosen Struktural</h3>
                      <span className="text-xs font-medium text-gray-600">
                        Hadir{" "}
                        {stats.dosenStrukturalTotal > 0
                          ? Math.round(
                              ((stats.attendanceByTypeDosenStruktural?.[0]?.value ?? 0) / stats.dosenStrukturalTotal) *
                                100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                          <Pie
                            data={stats.attendanceByTypeDosenStruktural}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={75}
                            paddingAngle={5}
                            dataKey="value"
                            onClick={(data) => handlePieClick(data)}
                            className="cursor-pointer"
                          >
                            {(stats.attendanceByTypeDosenStruktural as ChartEntry[]).map((entry, index: number) => (
                              <Cell key={`cell-dosen-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                        </RePieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-baseline justify-between mb-2">
                      <h3 className="text-sm font-semibold text-gray-900">Tendik</h3>
                      <span className="text-xs font-medium text-gray-600">
                        Hadir{" "}
                        {stats.tendikTotal > 0
                          ? Math.round(((stats.attendanceByTypeTendik?.[0]?.value ?? 0) / stats.tendikTotal) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                          <Pie
                            data={stats.attendanceByTypeTendik}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={75}
                            paddingAngle={5}
                            dataKey="value"
                            onClick={(data) => handlePieClick(data)}
                            className="cursor-pointer"
                          >
                            {(stats.attendanceByTypeTendik as ChartEntry[]).map((entry, index: number) => (
                              <Cell key={`cell-tendik-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                        </RePieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                  Tren 7 Hari Terakhir Absen Masuk
                </CardTitle>
                <CardDescription>Jumlah absensi masuk harian</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.monthlyTrend}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10 }} 
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="count"
                      name="Jumlah Hadir"
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#colorCount)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  Tren 7 Hari Terakhir Absen Pulang
                </CardTitle>
                <CardDescription>Jumlah absensi pulang harian</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.monthlyTrendPulang}>
                    <defs>
                      <linearGradient id="colorCountPulang" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10 }} 
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="count"
                      name="Jumlah Pulang"
                      stroke="#8b5cf6"
                      fillOpacity={1}
                      fill="url(#colorCountPulang)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* PDF Download Section - Bottom of Page */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-emerald-200 bg-emerald-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5 text-emerald-700" />
                Unduh Laporan (PDF)
              </CardTitle>
              <CardDescription>1 halaman A4 landscape</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg bg-white border border-emerald-100 p-3">
                <div className="text-xs text-emerald-800 font-semibold">Isi laporan</div>
                <ul className="mt-1 text-[11px] text-emerald-900 space-y-1">
                  <li>Performa per unit kerja (masuk/pulang/tidak masuk/tidak pulang)</li>
                  <li>Ringkasan kepatuhan harian pada tanggal laporan</li>
                  <li>Akun dengan kehadiran terlengkap (bulan berjalan s.d tanggal laporan)</li>
                </ul>
              </div>
              <Button
                onClick={handleDownloadPdf}
                disabled={loading || downloadingPdf}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {downloadingPdf ? "Menyiapkan PDF..." : "Unduh PDF Kondisi Statistik"}
              </Button>
            </CardContent>
          </Card>

          {/* Empty space for future content */}
          <Card className="border-gray-200 bg-gray-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-400">
                <div className="w-5 h-5 border-2 border-dashed border-gray-300 rounded"></div>
                Konten Akan Ditambahkan
              </CardTitle>
              <CardDescription className="text-gray-400">Bagian ini tersedia untuk konten tambahan</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-[200px]">
              <p className="text-sm text-gray-400 text-center italic">
                Space ini disediakan untuk<br />konten yang akan ditambahkan kemudian
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 - More Professional Detailed Stats */}
        <div className="grid grid-cols-1 gap-6">
          <Card className="overflow-hidden border-none shadow-md bg-white">
            <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500 w-full"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <BarChart3 className="w-6 h-6 text-purple-600" />
                Analisis Kepatuhan Absensi
              </CardTitle>
              <CardDescription>Visualisasi mendalam kondisi harian tendik</CardDescription>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                {(stats.detailedStats as ChartEntry[]).map((item, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => handleBarClick(item)}
                    className="flex flex-row md:flex-col items-center justify-between md:justify-center p-3 rounded-xl bg-gray-50 border border-gray-100 cursor-pointer hover:bg-white hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-center gap-3 md:flex-col md:gap-1">
                      <div className="w-2 h-8 md:w-8 md:h-1 rounded-full mb-1" style={{ backgroundColor: item.color }}></div>
                      <span className="text-xs font-medium text-gray-500 text-left md:text-center group-hover:text-gray-900 transition-colors">{item.name}</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
              
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={stats.detailedStats} 
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={100} 
                      fontSize={10}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Bar 
                      dataKey="value" 
                      radius={[0, 10, 10, 0]} 
                      barSize={32}
                      onClick={(data) => handleBarClick(data)}
                      className="cursor-pointer"
                    >
                      {(stats.detailedStats as ChartEntry[]).map((entry, index: number) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color}
                          fillOpacity={0.8}
                          className="hover:fill-opacity-100 transition-all"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      </div>

      {/* Detail Modal */}
      <Dialog open={detailModal.open} onOpenChange={(open) => setDetailModal(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detailModal.title}</DialogTitle>
            <DialogDescription>
              Terdapat {detailModal.users.length} orang dalam kategori ini.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {detailModal.users.length > 0 ? (
              detailModal.users.map((user, idx) => (
                <div key={user.id} className="flex items-center gap-3 p-3 bg-white border rounded-lg">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-600">
                    {user.full_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{user.full_name}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.role} - @{user.username}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                Tidak ada data ditemukan.
              </div>
            )}
          </div>
          <div className="flex justify-end mt-4">
            <Button onClick={() => setDetailModal(prev => ({ ...prev, open: false }))}>Tutup</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
