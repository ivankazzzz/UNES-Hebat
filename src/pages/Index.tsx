import { Link, useNavigate } from "react-router-dom";
import {
    Calendar,
    Clock,
    TrendingUp,
    MapPin,
    User,
    CheckCircle,
    Settings,
    ChevronRight,
    FileText,
    XCircle,
    LogOut,
    Award,
    BookOpen,
    Smartphone,
    X,
    Download
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import BottomNavigation from "@/components/BottomNavigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

/*
 * ██╗██████╗ ███████╗ █████╗ ███╗   ██╗     █████╗ ███╗   ██╗ █████╗ ███╗   ██╗██████╗  █████╗ 
 * ██║██╔══██╗██╔════╝██╔══██╗████╗  ██║    ██╔══██╗████╗  ██║██╔══██╗████╗  ██║██╔══██╗██╔══██╗
 * ██║██████╔╝█████╗  ███████║██╔██╗ ██║    ███████║██╔██╗ ██║███████║██╔██╗ ██║██║  ██║███████║
 * ██║██╔══██╗██╔══╝  ██╔══██║██║╚██╗██║    ██╔══██║██║╚██╗██║██╔══██║██║╚██╗██║██║  ██║██╔══██║
 * ██║██║  ██║██║     ██║  ██║██║ ╚████║    ██║  ██║██║ ╚████║██║  ██║██║ ╚████║██████╔╝██║  ██║
 * ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝  ╚═╝╚═╝  ╚═══╝    ╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝ ╚═╝  ╚═╝
 * 
 * Made With Proud by Irfan Ananda - 2025
 */

// Easter egg: Console art for curious developers
const showDevSignature = () => {
    console.log(
        `%c
    ██╗██████╗ ███████╗ █████╗ ███╗   ██╗     █████╗ ███╗   ██╗ █████╗ ███╗   ██╗██████╗  █████╗ 
    ██║██╔══██╗██╔════╝██╔══██╗████╗  ██║    ██╔══██╗████╗  ██║██╔══██╗████╗  ██║██╔══██╗██╔══██╗
    ██║██████╔╝█████╗  ███████║██╔██╗ ██║    ███████║██╔██╗ ██║███████║██╔██╗ ██║██║  ██║███████║
    ██║██╔══██╗██╔══╝  ██╔══██║██║╚██╗██║    ██╔══██║██║╚██╗██║██╔══██║██║╚██╗██║██║  ██║██╔══██║
    ██║██║  ██║██║     ██║  ██║██║ ╚████║    ██║  ██║██║ ╚████║██║  ██║██║ ╚████║██████╔╝██║  ██║
    ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝  ╚═╝╚═╝  ╚═══╝    ╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝ ╚═╝  ╚═╝
        `,
        'color: #3b82f6; font-family: monospace; font-weight: bold;'
    );
    console.log(
        '%c Made With Proud by Irfan Ananda - 2025 ',
        'background: linear-gradient(90deg, #1e3a5f, #3d6cb3); color: #fbbf24; font-size: 14px; font-weight: bold; padding: 8px 16px; border-radius: 4px;'
    );
    console.log(
        '%c "Code is like humor. When you have to explain it, it\'s bad." - Cory House ',
        'color: #64748b; font-style: italic; font-size: 11px;'
    );
};

type LeavePermit = {
    id: string;
    permit_type: "izin" | "cuti" | "dinas_luar";
    start_date: string;
    end_date: string;
    description: string | null;
};

const permitTypeLabels: Record<string, string> = {
    izin: "Izin",
    cuti: "Cuti",
    dinas_luar: "Dinas Luar",
};

const permitTypeColors: Record<string, string> = {
    izin: "bg-blue-100 text-blue-800",
    cuti: "bg-green-100 text-green-800",
    dinas_luar: "bg-purple-100 text-purple-800",
};

interface KknIndividualSession {
    index: number;
    dateYMD: string;
    startTime: string;
    endTime: string;
    label: string;
    colLabel: string;
}

const KKN_INDIVIDUAL_SESSIONS: KknIndividualSession[] = [
  {
    index: 1,
    dateYMD: "2026-07-18",
    startTime: "07:25",
    endTime: "08:00",
    label: "Sabtu, 18 Juli 2026 - Sesi 1 (07:25-08:00)",
    colLabel: "Sabtu - Sesi 1\n(07:25 - 08:00)",
  },
  {
    index: 2,
    dateYMD: "2026-07-18",
    startTime: "09:30",
    endTime: "10:00",
    label: "Sabtu, 18 Juli 2026 - Sesi 2 (09:30-10:00)",
    colLabel: "Sabtu - Sesi 2\n(09:30 - 10:00)",
  },
  {
    index: 3,
    dateYMD: "2026-07-18",
    startTime: "13:00",
    endTime: "13:30",
    label: "Sabtu, 18 Juli 2026 - Sesi 3 (13:00-13:30)",
    colLabel: "Sabtu - Sesi 3\n(13:00 - 13:30)",
  },
  {
    index: 4,
    dateYMD: "2026-07-19",
    startTime: "07:00",
    endTime: "08:00",
    label: "Minggu, 19 Juli 2026 - Sesi 1 (07:00-08:00)",
    colLabel: "Minggu - Sesi 1\n(07:00 - 08:00)",
  },
  {
    index: 5,
    dateYMD: "2026-07-19",
    startTime: "09:30",
    endTime: "10:00",
    label: "Minggu, 19 Juli 2026 - Sesi 2 (09:30-10:00)",
    colLabel: "Minggu - Sesi 2\n(09:30 - 10:00)",
  },
  {
    index: 6,
    dateYMD: "2026-07-19",
    startTime: "11:00",
    endTime: "11:30",
    label: "Minggu, 19 Juli 2026 - Sesi 3 (11:00-11:30)",
    colLabel: "Minggu - Sesi 3\n(11:00 - 11:30)",
  },
  {
    index: 7,
    dateYMD: "2026-07-19",
    startTime: "13:30",
    endTime: "14:00",
    label: "Minggu, 19 Juli 2026 - Sesi 4 (13:30-14:00)",
    colLabel: "Minggu - Sesi 4\n(13:30 - 14:00)",
  },
  {
    index: 8,
    dateYMD: "2026-07-19",
    startTime: "15:30",
    endTime: "16:00",
    label: "Minggu, 19 Juli 2026 - Sesi 5 (15:30-16:00)",
    colLabel: "Minggu - Sesi 5\n(15:30 - 16:00)",
  },
  {
    index: 9,
    dateYMD: "2026-07-29",
    startTime: "08:00",
    endTime: "10:00",
    label: "Rabu, 29 Juli 2026 - Pelepasan KKN (08:00-10:00)",
    colLabel: "Rabu - Pelepasan\n(08:00 - 10:00)",
  }
];

const toWIBYMD = (utcTimestamp: string): string | null => {
  if (!utcTimestamp) return null;
  try {
    const date = new Date(utcTimestamp);
    if (Number.isNaN(date.getTime()) || !isFinite(date.getTime())) return null;
    const wibTime = date.getTime() + (7 * 60 * 60 * 1000);
    const wibDate = new Date(wibTime);
    const year = wibDate.getUTCFullYear();
    const month = String(wibDate.getUTCMonth() + 1).padStart(2, "0");
    const day = String(wibDate.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return null;
  }
};

const createdAtToLocalYMD = (createdAt?: string | null): string | null => {
  if (!createdAt) return null;
  const wibResult = toWIBYMD(createdAt);
  if (wibResult) return wibResult;
  if (createdAt.includes("T")) return createdAt.split("T")[0];
  if (createdAt.includes(" ")) return createdAt.split(" ")[0];
  return createdAt.substring(0, 10);
};

const createdAtToWIBTime = (createdAt?: string | null): string | null => {
  if (!createdAt) return null;
  try {
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime()) || !isFinite(date.getTime())) return null;
    const wibTime = date.getTime() + (7 * 60 * 60 * 1000);
    const wibDate = new Date(wibTime);
    const hours = String(wibDate.getUTCHours()).padStart(2, "0");
    const minutes = String(wibDate.getUTCMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  } catch {
    return null;
  }
};

const findMatchedSession = (createdAt: string, note?: string | null): KknIndividualSession | null => {
  if (!createdAt) return null;
  if (note) {
    const matchedByNote = KKN_INDIVIDUAL_SESSIONS.find((s) => {
      if (s.index === 1) return note.includes("Sabtu Sesi 1");
      if (s.index === 2) return note.includes("Sabtu Sesi 2");
      if (s.index === 3) return note.includes("Sabtu Sesi 3");
      if (s.index === 4) return note.includes("Minggu Sesi 1");
      if (s.index === 5) return note.includes("Minggu Sesi 2");
      if (s.index === 6) return note.includes("Minggu Sesi 3");
      if (s.index === 7) return note.includes("Minggu Sesi 4");
      if (s.index === 8) return note.includes("Minggu Sesi 5");
      if (s.index === 9) return note.includes("Pelepasan KKN");
      return false;
    });
    if (matchedByNote) return matchedByNote;
  }
  const dateYMD = createdAtToLocalYMD(createdAt);
  const wibTime = createdAtToWIBTime(createdAt);
  if (!dateYMD || !wibTime) return null;
  return KKN_INDIVIDUAL_SESSIONS.find((s) => s.dateYMD === dateYMD && wibTime >= s.startTime && wibTime <= s.endTime) || null;
};

const getCurrentWibDateTime = () => {
  const nowWib = new Date(Date.now() + (7 * 60 * 60 * 1000));
  const y = nowWib.getUTCFullYear();
  const m = String(nowWib.getUTCMonth() + 1).padStart(2, "0");
  const d = String(nowWib.getUTCDate()).padStart(2, "0");
  const hh = String(nowWib.getUTCHours()).padStart(2, "0");
  const mm = String(nowWib.getUTCMinutes()).padStart(2, "0");
  return {
    dateYMD: `${y}-${m}-${d}`,
    timeHM: `${hh}:${mm}`
  };
};

const isSessionStarted = (session: KknIndividualSession) => {
  const currentWib = getCurrentWibDateTime();
  if (currentWib.dateYMD > session.dateYMD) {
    return true;
  }
  if (currentWib.dateYMD === session.dateYMD) {
    return currentWib.timeHM >= session.startTime;
  }
  return false;
};


const AKREDITASI_UNES_URL = "https://akreditasiunes.irfanananda28.com/";
const KALENDER_AKADEMIK_URL = "https://1drv.ms/b/c/ebf93f4e5a3b8f9a/IQB8oHSmTWPLSLfkTmMo1XHFAZUvke5zaN7TZ_XteB8XamM?e=7seip4";
const PERPUSTAKAAN_URL = "https://absenpustaka.irfanananda28.com/statistik";
const HOME_BANNER_IMAGES = ["rektorpmb.jpg", "gambar2.jpg", "gambar1.png", "gambar3.jpeg"];

const Index = () => {
    const [currentUser, setCurrentUser] = useState<any>(getCurrentUser());
    const isNonStrukturalDplKknOnly = currentUser?.is_dpl_kkn && !currentUser?.is_struktural && !currentUser?.is_panitia_kkn;
    const navigate = useNavigate();

    // State dismiss modal himbauan
    const [isAppNoticeDismissed, setIsAppNoticeDismissed] = useState(false);

    // Deteksi akses browser vs APK UNESHebat / PWA
    const isBrowserAccess = typeof window !== "undefined" &&
        !(window as any).Capacitor?.isNativePlatform() &&
        !window.matchMedia("(display-mode: standalone)").matches;

    // Daftar username khusus yang ditampilkan himbauan UNES HEBAT (Harry Setya Hadi, Rudiyansa, & Ramli Syafri)
    const TARGET_APP_NOTICE_USERS = [
        'harry.setya.hadi',
        'hary.setya.hadi',
        'rudiyansa.putra',
        'rudiyansa',
        'ramli.syafri',
        'ramlisyafri',
        'tesx'
    ];

    // Himbauan khusus akun yang ditentukan jika diakses via browser biasa
    const isTargetUser = currentUser?.username && TARGET_APP_NOTICE_USERS.includes(currentUser.username.toLowerCase());
    const showAppNotice = isTargetUser && isBrowserAccess && !isAppNoticeDismissed;

    const handleDownloadAppClick = () => {
        const playStoreUrl = "https://play.google.com/store/apps/details?id=com.ivanad.ngabsen.unesv1&hl=id";
        const marketUrl = "market://details?id=com.ivanad.ngabsen.unesv1";
        const isAndroid = /Android/i.test(navigator.userAgent);
        
        if (isAndroid) {
            window.location.href = marketUrl;
            setTimeout(() => {
                window.open(playStoreUrl, '_blank', 'noopener,noreferrer');
            }, 1000);
        } else {
            window.open(playStoreUrl, '_blank', 'noopener,noreferrer');
        }
    };
    const [locationName, setLocationName] = useState("Mencari lokasi...");
    const [locationFetched, setLocationFetched] = useState(false);
    const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalMasuk: 0,
        totalPulang: 0,
        tidakMasuk: 0,
        leaveDays: 0,
    });
    const [kknStats, setKknStats] = useState({
        totalMasuk: 0,
        totalPulang: 0,
        tidakMasuk: 0,
        leaveDays: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    
    // State untuk bulan yang dipilih (default bulan saat ini)
    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
    
    // State untuk modal tidak masuk kerja
    const [showAbsentModal, setShowAbsentModal] = useState(false);
    const [absentDates, setAbsentDates] = useState<Array<{date: Date, day: string}>>([]);
    const [showKknAbsentModal, setShowKknAbsentModal] = useState(false);
    const [kknAbsentDates, setKknAbsentDates] = useState<Array<{date: Date, day: string}>>([]);

    // State untuk izin/cuti/dinas luar
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [showKknLeaveModal, setShowKknLeaveModal] = useState(false);
    const [leavePermits, setLeavePermits] = useState<LeavePermit[]>([]);
    
    // State untuk hari libur dari database
    const [holidays, setHolidays] = useState<string[]>([]);
    const [activeBannerIndex, setActiveBannerIndex] = useState(0);
    const bannerTouchStartX = useRef<number | null>(null);
    
    // Daftar bulan untuk dropdown
    const months = [
        { value: "1", label: "Januari" },
        { value: "2", label: "Februari" },
        { value: "3", label: "Maret" },
        { value: "4", label: "April" },
        { value: "5", label: "Mei" },
        { value: "6", label: "Juni" },
        { value: "7", label: "Juli" },
        { value: "8", label: "Agustus" },
        { value: "9", label: "September" },
        { value: "10", label: "Oktober" },
        { value: "11", label: "November" },
        { value: "12", label: "Desember" },
    ];
    
    // Daftar tahun untuk dropdown (5 tahun terakhir hingga tahun ini)
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 6 }, (_, i) => ({
        value: (currentYear - 5 + i + 1).toString(),
        label: (currentYear - 5 + i + 1).toString()
    }));

    const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    useEffect(() => {
        // Show developer signature in console (hidden gem)
        showDevSignature();

        // Get user location and attendance location
        const getLocationInfo = async () => {
            // Prevent multiple calls if location already fetched
            if (locationFetched) {
                return;
            }

            if (!navigator.geolocation) {
                setLocationName("Lokasi tidak tersedia");
                setLocationFetched(true);
                return;
            }

            // First, get the attendance location for this user
            let targetLat = -0.930000; // Default campus location
            let targetLng = 100.356500;
            let locationLabel = "Kampus";

            if (currentUser?.id) {
                try {
                    const { data: locData } = await supabase
                        .from("attendance_locations")
                        .select("latitude, longitude, location_name, is_primary, priority, created_at")
                        .eq("user_id", currentUser.id)
                        .eq("is_active", true)
                        .order("priority", { ascending: true, nullsFirst: false })
                        .order("is_primary", { ascending: false })
                        .order("created_at", { ascending: true });

                    if (locData && locData.length > 0) {
                        const primaryLocation =
                            locData.find((loc) => loc.priority === 1) ??
                            locData.find((loc) => loc.is_primary) ??
                            locData[0];
                        targetLat = parseFloat(primaryLocation.latitude);
                        targetLng = parseFloat(primaryLocation.longitude);
                        locationLabel = primaryLocation.location_name || "Lokasi Absensi";
                    }
                } catch (error) {
                    // Use default campus location if no specific location found
                    console.log("Using default campus location");
                }
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const distance = calculateDistance(latitude, longitude, targetLat, targetLng);
                    setLocationName(`${distance.toFixed(1)} km dari ${locationLabel}`);
                    setLocationFetched(true); // Mark as fetched
                },
                () => {
                    setLocationName("Lokasi tidak tersedia");
                    setLocationFetched(true); // Mark as fetched even on error
                }
            );
        };

        getLocationInfo();

        // Load attendance stats
        loadStats();
    }, [selectedMonth, selectedYear]);

    useEffect(() => {
        if (HOME_BANNER_IMAGES.length <= 1) return;

        const delay = activeBannerIndex === 0 ? 5000 : 3000;
        const bannerTimer = window.setTimeout(() => {
            setActiveBannerIndex((currentIndex) => (currentIndex + 1) % HOME_BANNER_IMAGES.length);
        }, delay);

        return () => window.clearTimeout(bannerTimer);
    }, [activeBannerIndex]);

    const showPreviousBanner = () => {
        setActiveBannerIndex((currentIndex) =>
            currentIndex === 0 ? HOME_BANNER_IMAGES.length - 1 : currentIndex - 1
        );
    };

    const showNextBanner = () => {
        setActiveBannerIndex((currentIndex) => (currentIndex + 1) % HOME_BANNER_IMAGES.length);
    };

    const handleBannerTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
        bannerTouchStartX.current = event.touches[0]?.clientX ?? null;
    };

    const handleBannerTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
        if (bannerTouchStartX.current === null || HOME_BANNER_IMAGES.length <= 1) return;

        const touchEndX = event.changedTouches[0]?.clientX;
        if (typeof touchEndX !== "number") return;

        const swipeDistance = touchEndX - bannerTouchStartX.current;
        bannerTouchStartX.current = null;

        if (Math.abs(swipeDistance) < 40) return;
        if (swipeDistance > 0) {
            showPreviousBanner();
        } else {
            showNextBanner();
        }
    };

    const handleBannerClick = () => {
        if (HOME_BANNER_IMAGES[activeBannerIndex] === "gambar2.jpg") {
            const playStoreUrl = "https://play.google.com/store/apps/details?id=com.ivanad.ngabsen.unesv1&hl=id";
            const marketUrl = "market://details?id=com.ivanad.ngabsen.unesv1";
            const isAndroid = /Android/i.test(navigator.userAgent);
            
            if (isAndroid) {
                window.location.href = marketUrl;
                setTimeout(() => {
                    window.open(playStoreUrl, '_blank', 'noopener,noreferrer');
                }, 1000);
            } else {
                window.open(playStoreUrl, '_blank', 'noopener,noreferrer');
            }
        }
    };

    const loadStats = async () => {
        if (!currentUser) {
            setIsLoading(false);
            return;
        }

        try {
            // Sync user data live dari database untuk menangani penambahan flag panitia/DPL baru
            const { data: userData } = await supabase
                .from('users')
                .select('is_dpl_kkn, is_struktural, is_panitia_kkn')
                .eq('id', currentUser.id)
                .single();

            let activeUser = currentUser;
            if (userData) {
                const updatedUser = {
                    ...currentUser,
                    is_dpl_kkn: userData.is_dpl_kkn || false,
                    is_struktural: userData.is_struktural || false,
                    is_panitia_kkn: userData.is_panitia_kkn || false
                };
                // Simpan ke localStorage
                localStorage.setItem('absensi_unes_auth', JSON.stringify(updatedUser));
                
                // Update state reaktif jika ada perubahan
                if (
                    currentUser.is_dpl_kkn !== updatedUser.is_dpl_kkn ||
                    currentUser.is_struktural !== updatedUser.is_struktural ||
                    currentUser.is_panitia_kkn !== updatedUser.is_panitia_kkn
                ) {
                    setCurrentUser(updatedUser);
                    activeUser = updatedUser;
                }
            }
            // Load holidays dari database
            const { data: holidaysData } = await supabase
                .from('holidays')
                .select('holiday_date')
                .eq('is_active', true);

            const holidayDates = holidaysData?.map(h => h.holiday_date) || [];
            setHolidays(holidayDates);

            // Filter berdasarkan bulan dan tahun yang dipilih
            const startDate = new Date(selectedYear, selectedMonth - 1, 1);
            const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);
            const leaveRangeStart = new Date(selectedYear, selectedMonth - 1, 1);
            const leaveRangeEnd = new Date(selectedYear, selectedMonth, 0);

            const { data: attendanceData, error: attendanceError } = await supabase
                .from('attendances')
                .select('*')
                .eq('user_id', currentUser.id)
                .gte('created_at', startDate.toISOString())
                .lte('created_at', endDate.toISOString());

            if (attendanceError) throw attendanceError;

            const { data: leaveData, error: leaveError } = await supabase
                .from('leave_permits')
                .select('id, permit_type, start_date, end_date, description')
                .eq('user_id', currentUser.id)
                .lte('start_date', formatDateKey(leaveRangeEnd))
                .gte('end_date', formatDateKey(leaveRangeStart))
                .order('start_date', { ascending: true });

            if (leaveError) throw leaveError;

            const attendanceRecords = attendanceData || [];
            const leaveRecords = leaveData || [];

            setLeavePermits(leaveRecords);

            // Hitung statistik berdasarkan role
            if (currentUser.role === 'mahasiswa') {
                const scopeSessions = KKN_INDIVIDUAL_SESSIONS.filter(s => {
                    const [sYear, sMonth] = s.dateYMD.split("-");
                    return parseInt(sYear) === selectedYear && parseInt(sMonth) === selectedMonth;
                });

                let KknHadir = 0;
                let KknAlpha = 0;
                let KknIzin = 0;
                const KknAbsentDatesList: Array<{date: Date, day: string}> = [];

                scopeSessions.forEach(s => {
                    const matched = attendanceRecords.find(a => findMatchedSession(a.created_at, a.note)?.index === s.index);
                    const permit = leaveRecords.find(lp => s.dateYMD >= lp.start_date && s.dateYMD <= lp.end_date);

                    if (matched) {
                        KknHadir++;
                    } else if (permit) {
                        KknIzin++;
                    } else if (isSessionStarted(s)) {
                        KknAlpha++;
                        const [year, month, day] = s.dateYMD.split("-").map(Number);
                        KknAbsentDatesList.push({
                            date: new Date(year, month - 1, day),
                            day: `${s.label.split(" - ")[1].split(" (")[0]} (${s.startTime}-${s.endTime} WIB)`
                        });
                    }
                });

                setAbsentDates(KknAbsentDatesList);
                setAttendanceHistory(attendanceRecords.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
                setStats({
                    totalMasuk: KknHadir,
                    totalPulang: 0,
                    tidakMasuk: KknAlpha,
                    leaveDays: KknIzin,
                });
            } else {
                // Hitung total absen masuk reguler
                const totalMasuk = attendanceRecords.filter(a => a.attendance_type === 'masuk').length;

                // Hitung total absen pulang reguler
                const totalPulang = attendanceRecords.filter(a => a.attendance_type === 'pulang').length;

                // Identifikasi tanggal-tanggal tidak masuk kerja reguler
                const absentDatesList = getAbsentDates(attendanceRecords, leaveRecords, selectedYear, selectedMonth, holidayDates);
                setAbsentDates(absentDatesList);

                // Hitung tidak masuk kerja reguler
                const tidakMasuk = absentDatesList.length;
                const leaveDays = calculateLeaveDays(leaveRecords, leaveRangeStart, leaveRangeEnd);

                setAttendanceHistory(attendanceRecords.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
                setStats({
                    totalMasuk,
                    totalPulang,
                    tidakMasuk,
                    leaveDays,
                });

                // Jika user adalah Mahasiswa, DPL KKN, atau Panitia KKN, hitung juga statistik KKN secara paralel
                if (currentUser.role === 'mahasiswa' || currentUser.is_dpl_kkn || currentUser.is_panitia_kkn) {
                    const scopeSessions = KKN_INDIVIDUAL_SESSIONS.filter(s => {
                        const [sYear, sMonth] = s.dateYMD.split("-");
                        return parseInt(sYear) === selectedYear && parseInt(sMonth) === selectedMonth;
                    });

                    let KknHadir = 0;
                    let KknAlpha = 0;
                    let KknIzin = 0;
                    const KknAbsentDatesList: Array<{date: Date, day: string}> = [];

                    scopeSessions.forEach(s => {
                        const matched = attendanceRecords.find(a => findMatchedSession(a.created_at, a.note)?.index === s.index);
                        const permit = leaveRecords.find(lp => s.dateYMD >= lp.start_date && s.dateYMD <= lp.end_date);

                        if (matched) {
                            KknHadir++;
                        } else if (permit) {
                            KknIzin++;
                        } else if (isSessionStarted(s)) {
                            KknAlpha++;
                            const [year, month, day] = s.dateYMD.split("-").map(Number);
                            KknAbsentDatesList.push({
                                date: new Date(year, month - 1, day),
                                day: `${s.label.split(" - ")[1].split(" (")[0]} (${s.startTime}-${s.endTime} WIB)`
                            });
                        }
                    });

                    setKknAbsentDates(KknAbsentDatesList);
                    setKknStats({
                        totalMasuk: KknHadir,
                        totalPulang: 0,
                        tidakMasuk: KknAlpha,
                        leaveDays: KknIzin,
                    });
                }
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const parseLocalYMD = (dateStr: string) => {
        const [year, month, day] = dateStr.split("-").map(Number);
        return new Date(year, month - 1, day, 0, 0, 0, 0);
    };

    const formatDateKey = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const formatDateLong = (dateStr: string) => {
        return parseLocalYMD(dateStr).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    const getLeaveDaysSet = (permits: LeavePermit[], rangeStart: Date, rangeEnd: Date) => {
        const leaveDaysSet = new Set<string>();

        permits.forEach((permit) => {
            const permitStart = parseLocalYMD(permit.start_date);
            const permitEnd = parseLocalYMD(permit.end_date);
            const effectiveStart = permitStart > rangeStart ? permitStart : rangeStart;
            const effectiveEnd = permitEnd < rangeEnd ? permitEnd : rangeEnd;

            if (effectiveStart > effectiveEnd) return;

            const current = new Date(effectiveStart);
            while (current <= effectiveEnd) {
                leaveDaysSet.add(formatDateKey(current));
                current.setDate(current.getDate() + 1);
            }
        });

        return leaveDaysSet;
    };

    const calculateLeaveDays = (permits: LeavePermit[], rangeStart: Date, rangeEnd: Date) => {
        if (permits.length === 0) return 0;
        return getLeaveDaysSet(permits, rangeStart, rangeEnd).size;
    };

    // Fungsi untuk mendapatkan tanggal-tanggal tidak masuk kerja
    const getAbsentDates = (
        attendanceData: any[],
        leavePermits: LeavePermit[],
        year: number,
        month: number,
        holidayDates: string[]
    ): Array<{date: Date, day: string}> => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set ke awal hari
        
        const startDate = new Date(year, month - 1, 1);
        startDate.setHours(0, 0, 0, 0);
        
        // Tentukan end date berdasarkan bulan/tahun yang dipilih
        let endDate: Date;
        
        if (year > today.getFullYear() || (year === today.getFullYear() && month > today.getMonth() + 1)) {
            return []; // Masa depan, tidak ada tanggal tidak masuk
        } else if (year === today.getFullYear() && month === today.getMonth() + 1) {
            endDate = new Date(today);
        } else {
            endDate = new Date(year, month, 0);
            endDate.setHours(23, 59, 59, 999);
        }

        const leaveDaysSet = getLeaveDaysSet(leavePermits, startDate, endDate);
        
        // Buat set dari tanggal-tanggal yang ada absen (masuk ATAU pulang - salah satu saja sudah dianggap hadir)
        const attendedDates = new Set(
            attendanceData
                .filter(a => a.attendance_type === 'masuk' || a.attendance_type === 'pulang')
                .map(a => {
                    const date = new Date(a.created_at);
                    // Format: YYYY-MM-DD dengan timezone lokal
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    return `${year}-${month}-${day}`;
                })
        );
        
        // List tanggal tidak masuk
        const absentList: Array<{date: Date, day: string}> = [];
        const currentDate = new Date(startDate);
        const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        
        while (currentDate <= endDate) {
            const dayOfWeek = currentDate.getDay();
            // Hari kerja: Senin-Sabtu (hanya Minggu yang libur mingguan)
            // 0 = Minggu
            if (dayOfWeek !== 0) {
                // Format tanggal lokal
                const year = currentDate.getFullYear();
                const month = String(currentDate.getMonth() + 1).padStart(2, '0');
                const day = String(currentDate.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;
                
                // Skip jika tanggal adalah hari libur nasional
                if (!holidayDates.includes(dateStr)) {
                    const isOnLeave = leaveDaysSet.has(dateStr);
                    // Cek apakah user tidak hadir di tanggal ini dan tidak ada izin/cuti/dinas luar
                    if (!attendedDates.has(dateStr) && !isOnLeave) {
                        absentList.push({
                            date: new Date(currentDate),
                            day: dayNames[dayOfWeek]
                        });
                    }
                }
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return absentList;
    };

    // Greeting based on time with strict whitelist fallback
    const VALID_GREETINGS = new Set([
        "Assalamualaikum / Selamat Pagi",
        "Assalamualaikum / Selamat Siang",
        "Assalamualaikum / Selamat Sore",
        "Assalamualaikum / Selamat Malam",
    ]);

    const FALLBACK_GREETING = "Assalamualaikum / Selamat Datang";

    const getGreetingByHour = (hour: number) => {
        if (hour < 10) return "Assalamualaikum / Selamat Pagi";
        if (hour < 15) return "Assalamualaikum / Selamat Siang";
        if (hour < 18) return "Assalamualaikum / Selamat Sore";
        return "Assalamualaikum / Selamat Malam";
    };

    const getGreeting = () => {
        const greeting = getGreetingByHour(new Date().getHours());
        return VALID_GREETINGS.has(greeting) ? greeting : FALLBACK_GREETING;
    };

    const statsConfig = [
        {
            key: "masuk",
            icon: CheckCircle,
            value: stats.totalMasuk,
            label: "Total Absen Masuk",
            gradient: "from-blue-600 to-indigo-700",
            iconBg: "bg-amber-400/20",
            iconColor: "text-amber-400"
        },
        {
            key: "pulang",
            icon: LogOut,
            value: stats.totalPulang,
            label: "Total Absen Pulang",
            gradient: "from-teal-500 to-cyan-600",
            iconBg: "bg-amber-400/20",
            iconColor: "text-amber-400"
        },
        {
            key: "absen",
            icon: XCircle,
            value: stats.tidakMasuk,
            label: "Tidak Masuk Kerja",
            gradient: "from-rose-500 to-red-600",
            iconBg: "bg-amber-400/20",
            iconColor: "text-amber-400",
            isInteractive: true
        },
        {
            key: "izin",
            icon: Calendar,
            value: stats.leaveDays,
            label: "Izin / Cuti / Dinas Luar",
            gradient: "from-amber-500 to-orange-600",
            iconBg: "bg-amber-400/20",
            iconColor: "text-amber-400",
            isInteractive: true
        },
    ];

    // Add CSS fix for overscroll behavior
    useEffect(() => {
        // Prevent body scroll bounce
        document.body.style.overscrollBehavior = 'none';
        
        // Cleanup function
        return () => {
            document.body.style.overscrollBehavior = 'auto';
        };
    }, []);

    return (
        <>
        <div className="flex h-[100dvh] flex-col w-full bg-[#f8f9fa] dark:bg-slate-950 overflow-hidden relative animate-page-in">
            
            {/* Header with curved bottom background */}
            <div className="bg-gradient-to-b from-[#8c1b1d] to-[#7a1819] h-[180px] w-full absolute top-0 left-0 rounded-b-[40px] z-0 shadow-sm"></div>

            {/* Top Bar Location & Profile */}
            <div className="pt-8 pb-4 px-5 relative z-10 flex items-center gap-3">
                <button 
                    onClick={() => navigate('/profile')}
                    className="flex-shrink-0 w-10 h-10 bg-white border border-white/20 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all overflow-hidden"
                >
                    <User className="w-6 h-6 text-[#8c1b1d]" />
                </button>
                <div className="flex flex-1 items-center bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 shadow-sm overflow-hidden min-w-0">
                    <MapPin className="w-4 h-4 text-white mr-2 flex-shrink-0" />
                    <span className="text-white text-xs font-semibold opacity-100 truncate flex-1">
                        {locationName || 'Mendeteksi lokasi...'}
                    </span>
                </div>
                <div className="flex-shrink-0 w-10 h-10 bg-white border border-white/20 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all overflow-hidden p-1.5">
                    <img 
                        src="/unes.png" 
                        alt="Unes Logo" 
                        className="w-full h-full object-contain"
                    />
                </div>
            </div>

            {/* Main scrollable content */}
            <main className="flex-grow overflow-y-auto px-5 w-full pb-28 z-10 relative space-y-6">
                
                {/* Modal Pop-up Himbauan Buka via Aplikasi UNES HEBAT (Khusus akun tesx jika diakses via Browser) */}
                {showAppNotice && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
                        <div className="max-w-sm w-full bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border-2 border-[#8c1b1d] relative text-center flex flex-col items-center animate-scale-in">
                            {/* Tombol Close X di atas kanan */}
                            <button
                                type="button"
                                onClick={() => setIsAppNoticeDismissed(true)}
                                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-colors border border-slate-200 dark:border-slate-700 active:scale-90"
                                title="Tutup Himbauan"
                                aria-label="Tutup Himbauan"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            {/* Badge Icon Animatif Senyum Berkedip */}
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#8c1b1d] to-[#7a1819] border-2 border-[#fbbf24] flex items-center justify-center shadow-lg mb-4 mt-2">
                                <svg className="w-11 h-11" viewBox="0 0 36 36" fill="none">
                                    <style>{`
                                        @keyframes blinkEye {
                                            0%, 88%, 100% { transform: scaleY(1); }
                                            94% { transform: scaleY(0.1); }
                                        }
                                        .blinking-eye {
                                            transform-origin: center;
                                            animation: blinkEye 2.8s infinite ease-in-out;
                                        }
                                    `}</style>
                                    {/* Yellow Face Circle */}
                                    <circle cx="18" cy="18" r="16" fill="#fbbf24" stroke="#8c1b1d" strokeWidth="2" />
                                    {/* Left Eye */}
                                    <ellipse className="blinking-eye" cx="12" cy="14" rx="2" ry="2.5" fill="#8c1b1d" />
                                    {/* Right Eye */}
                                    <ellipse className="blinking-eye" cx="24" cy="14" rx="2" ry="2.5" fill="#8c1b1d" />
                                    {/* Cheerful Smile Mouth */}
                                    <path d="M 11 20 Q 18 28 25 20" stroke="#8c1b1d" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                                    {/* Cute Blush cheeks */}
                                    <circle cx="9" cy="21" r="2" fill="#f43f5e" opacity="0.45" />
                                    <circle cx="27" cy="21" r="2" fill="#f43f5e" opacity="0.45" />
                                </svg>
                            </div>

                            {/* Judul & Deskripsi */}
                            <h3 className="font-black text-[#8c1b1d] dark:text-amber-400 text-base mb-2">
                                Himbauan Penggunaan Aplikasi
                            </h3>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6 px-2">
                                Bapak/Ibu saat ini Absensi lebih mudah dengan adanya <span className="font-extrabold text-[#8c1b1d] dark:text-amber-400">UNES Hebat</span>, silahkan melakukan absensi melalui aplikasi UNES Hebat dengan menginstall melalui tombol berikut:
                            </p>

                            {/* Tombol Download UNES HEBAT di Tengah */}
                            <button
                                type="button"
                                onClick={handleDownloadAppClick}
                                className="w-full py-3.5 px-4 bg-gradient-to-r from-[#8c1b1d] via-[#b52020] to-[#c0392b] hover:from-[#7a1819] hover:to-[#a02020] text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-[#8c1b1d]/30 border border-[#fbbf24]/40 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                            >
                                <Download className="w-4 h-4 text-[#fbbf24]" />
                                <span>Unduh UNES HEBAT di Play Store</span>
                            </button>

                            {/* Opsi Lanjutkan via Browser */}
                            <button
                                type="button"
                                onClick={() => setIsAppNoticeDismissed(true)}
                                className="mt-3 text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline active:scale-95 transition-all"
                            >
                                Lanjutkan via Browser
                            </button>
                        </div>
                    </div>
                )}

                {/* Hero Image Container (Replacing Profile Card) */}
                <div
                    className={`w-full aspect-[16/7] mt-2 mb-2 rounded-2xl overflow-hidden relative shadow-md bg-white touch-pan-y select-none ${
                        HOME_BANNER_IMAGES[activeBannerIndex] === "gambar2.jpg" ? "cursor-pointer" : ""
                    }`}
                    onTouchStart={handleBannerTouchStart}
                    onTouchEnd={handleBannerTouchEnd}
                    onClick={handleBannerClick}
                >
                    {HOME_BANNER_IMAGES.map((imageName, index) => (
                        <img
                            key={imageName}
                            src={`/${imageName}`}
                            alt="Pengumuman / Informasi Kampus"
                            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
                                index === activeBannerIndex ? "opacity-100" : "opacity-0"
                            }`}
                        />
                    ))}
                    {HOME_BANNER_IMAGES.length > 1 && (
                        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                            {HOME_BANNER_IMAGES.map((imageName, index) => (
                                <span
                                    key={`${imageName}-indicator`}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${
                                        index === activeBannerIndex
                                            ? "w-5 bg-white shadow"
                                            : "w-1.5 bg-white/60"
                                    }`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Layanan Untuk Anda Grid */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border-2 border-[#8c1b1d]">
                    <h3 className="font-extrabold text-slate-800 dark:text-white text-sm mb-4">Layanan Untuk Anda</h3>
                    <div className="grid grid-cols-4 gap-y-4 gap-x-2">
                        

                        {/* Akreditasi */}
                        {(currentUser?.role === 'superadmin' || currentUser?.role === 'admin' || currentUser?.role === 'dosen' || currentUser?.role === 'pegawai' || currentUser?.role === 'mahasiswa') && (
                            <button
                                type="button"
                                title="Buka Akreditasi UNES"
                                aria-label="Buka Akreditasi UNES"
                                className="flex flex-col items-center gap-2 cursor-pointer active:scale-90 transition-transform"
                                onClick={() => window.open(AKREDITASI_UNES_URL, "_blank", "noopener,noreferrer")}
                            >
                                <div className="w-12 h-12 flex items-center justify-center rounded-[16px] bg-amber-500 shadow-sm shadow-amber-500/20">
                                    <Award className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold text-center leading-tight">Akreditasi</span>
                            </button>
                        )}

                        {/* Kalender Akademik */}
                        {(currentUser?.role === 'superadmin' || currentUser?.role === 'admin' || currentUser?.role === 'dosen' || currentUser?.role === 'pegawai' || currentUser?.role === 'mahasiswa') && (
                            <button
                                type="button"
                                title="Buka Kalender Akademik"
                                aria-label="Buka Kalender Akademik"
                                className="flex flex-col items-center gap-2 cursor-pointer active:scale-90 transition-transform"
                                onClick={() => window.open(KALENDER_AKADEMIK_URL, "_blank", "noopener,noreferrer")}
                            >
                                <div className="w-12 h-12 flex items-center justify-center rounded-[16px] bg-indigo-500 shadow-sm shadow-indigo-500/20">
                                    <Calendar className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold text-center leading-tight">Kalender<br/>Akademik</span>
                            </button>
                        )}

                        {/* Perpustakaan */}
                        {(currentUser?.role === 'superadmin' || currentUser?.role === 'admin' || currentUser?.role === 'dosen' || currentUser?.role === 'pegawai' || currentUser?.role === 'mahasiswa') && (
                            <button
                                type="button"
                                title="Buka Perpustakaan"
                                aria-label="Buka Perpustakaan"
                                className="flex flex-col items-center gap-2 cursor-pointer active:scale-90 transition-transform"
                                onClick={() => window.location.href = PERPUSTAKAAN_URL}
                            >
                                <div className="w-12 h-12 flex items-center justify-center rounded-[16px] bg-teal-500 shadow-sm shadow-teal-500/20">
                                    <BookOpen className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold text-center leading-tight">Perpustakaan</span>
                            </button>
                        )}
                        
                        {/* Izin/Cuti */}
                        {(currentUser?.role === 'superadmin' || currentUser?.role === 'admin' || currentUser?.role === 'dosen' || currentUser?.role === 'pegawai') && !(currentUser?.role === 'dosen' && !currentUser?.is_struktural && currentUser?.is_dpl_kkn) && (
                            <div className="flex flex-col items-center gap-2 cursor-pointer active:scale-90 transition-transform" onClick={() => navigate('/izin-cuti')}>
                                <div className="w-12 h-12 flex items-center justify-center rounded-[16px] bg-sky-500 shadow-sm shadow-sky-500/20">
                                    <FileText className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold text-center leading-tight">Izin / Cuti</span>
                            </div>
                        )}

                        {/* Admin Room */}
                        {(currentUser?.role === 'superadmin' || currentUser?.role === 'admin') && (
                            <div className="flex flex-col items-center gap-2 cursor-pointer active:scale-90 transition-transform" onClick={() => navigate('/admin')}>
                                <div className="w-12 h-12 flex items-center justify-center rounded-[16px] bg-purple-500 shadow-sm shadow-purple-500/20">
                                    <Settings className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold text-center leading-tight">Admin<br/>Room</span>
                            </div>
                        )}
                        
                    </div>
                </div>

                {/* HIDE TEMPORARY: Di-hide pasca pembekalan KKN selesai */}
                {false && (currentUser?.role === 'mahasiswa' || currentUser?.is_dpl_kkn || currentUser?.is_panitia_kkn) && (
                    <div 
                        className="bg-gradient-to-r from-[#8c1b1d] to-[#fbbf24] rounded-2xl p-4 shadow-md relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-transform border-2 border-[#fbbf24] mb-3" 
                        onClick={() => navigate('/attendance-kkn')}
                    >
                        <div className="absolute -right-6 -bottom-6 opacity-20 w-32 h-32 rounded-full border-[10px] border-white z-0"></div>
                        <div className="relative z-10 flex gap-4 items-center justify-between">
                            <div className="flex-1">
                                <h4 className="font-extrabold text-white mb-1 text-sm tracking-wide">
                                    Absen Pembekalan KKN
                                </h4>
                                <p className="text-[11px] text-amber-100 leading-snug max-w-[220px]">
                                    Catat kehadiran sesi pembekalan KKN Anda di sini.
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-[18px] bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform shadow-lg relative shrink-0">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                                    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/>
                                </svg>
                            </div>
                        </div>
                    </div>
                )}

                {/* Banner Absen CTA (Reguler, disembunyikan untuk Mahasiswa & DPL Non-Struktural) */}
                {currentUser?.role !== 'mahasiswa' && !isNonStrukturalDplKknOnly && (
                    <div className="bg-gradient-to-r from-[#8c1b1d] to-[#fbbf24] rounded-2xl p-4 shadow-md relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-transform" onClick={() => navigate('/attendance')}>
                        <div className="absolute -right-6 -bottom-6 opacity-20 w-32 h-32 rounded-full border-[10px] border-white z-0"></div>
                        <div className="relative z-10 flex gap-4 items-center justify-between">
                            <div className="flex-1">
                                <h4 className="font-extrabold text-white mb-1 text-sm tracking-wide">
                                    Absen Disini
                                </h4>
                                <p className="text-[11px] text-sky-100 leading-snug max-w-[200px]">
                                    Catat waktu kedatangan dan kepulangan Anda hari ini.
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-[18px] bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform shadow-lg relative">
                                {/* Smiley Face Icon (Mac-style) */}
                                <div className="w-8 h-8 rounded-full border-2 border-white flex flex-col items-center justify-center gap-1.5 relative overflow-hidden">
                                    <div className="flex gap-2.5">
                                        <div className="w-1 h-1 bg-white rounded-full"></div>
                                        <div className="w-1 h-1 bg-white rounded-full"></div>
                                    </div>
                                    <div className="w-4 h-2 border-b-2 border-white rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Informasi Kehadiran */}
                {currentUser?.role !== 'mahasiswa' && !isNonStrukturalDplKknOnly && (
                    <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-xl shadow-slate-200/50 border-2 border-[#8c1b1d]">
                        <div className="flex flex-col gap-5">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <h3 className="font-black text-slate-800 dark:text-white text-sm tracking-tight">Informasi Kehadiran</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Statistik Bulanan</p>
                                </div>
                                
                                {/* Month/Year selector compact */}
                                <div className="flex gap-2">
                                    <Select value={selectedMonth.toString()} onValueChange={(v) => { setSelectedMonth(parseInt(v)); setIsLoading(true); }}>
                                        <SelectTrigger className="h-8 px-3 bg-slate-100 dark:bg-slate-800 border-none text-[11px] font-extrabold rounded-xl shadow-none focus:ring-0">
                                            <SelectValue placeholder="Bulan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {months.map(m => <SelectItem key={m.value} value={m.value} className="text-[11px]">{m.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <Select value={selectedYear.toString()} onValueChange={(v) => { setSelectedYear(parseInt(v)); setIsLoading(true); }}>
                                        <SelectTrigger className="h-8 px-3 bg-slate-100 dark:bg-slate-800 border-none text-[11px] font-extrabold rounded-xl shadow-none focus:ring-0">
                                            <SelectValue placeholder="Tahun" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {years.map(y => <SelectItem key={y.value} value={y.value} className="text-[11px]">{y.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Compact 1-Row Rangkuman Kehadiran */}
                            <div className="flex items-center justify-between divide-x-2 divide-[#8c1b1d]/20 bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-3 border border-[#8c1b1d]/20 mt-1 shadow-sm">
                                {/* Total Masuk */}
                                <div className="flex-1 text-center py-0.5">
                                    <span className="block font-black text-lg text-slate-900 dark:text-slate-100 leading-none">{stats.totalMasuk}</span>
                                    <span className="inline-block text-[9px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider mt-1.5">
                                        {currentUser?.role === 'mahasiswa' ? 'Hadir KKN' : 'Masuk'}
                                    </span>
                                </div>
                                
                                {/* Total Pulang */}
                                {currentUser?.role !== 'mahasiswa' && (
                                    <div className="flex-1 text-center py-0.5">
                                        <span className="block font-black text-lg text-slate-900 dark:text-slate-100 leading-none">{stats.totalPulang}</span>
                                        <span className="inline-block text-[9px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider mt-1.5">Pulang</span>
                                    </div>
                                )}

                                {/* Tidak Masuk (Alpha) */}
                                <button 
                                    type="button"
                                    onClick={() => setShowAbsentModal(true)}
                                    className="flex-1 text-center py-0.5 hover:bg-[#8c1b1d]/5 dark:hover:bg-rose-950/20 active:scale-95 transition-all rounded-xl cursor-pointer"
                                >
                                    <span className="block font-black text-lg text-slate-900 dark:text-slate-100 leading-none">
                                        {stats.tidakMasuk}
                                    </span>
                                    <span className="inline-block text-[9px] font-extrabold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded-md border border-rose-200 dark:border-rose-900/50 mt-1 shadow-sm">
                                        Alpha
                                    </span>
                                </button>

                                {/* Izin/Cuti */}
                                {currentUser?.role !== 'mahasiswa' && (
                                    <button 
                                        type="button"
                                        onClick={() => setShowLeaveModal(true)}
                                        className="flex-1 text-center py-0.5 hover:bg-[#8c1b1d]/5 dark:hover:bg-amber-950/20 active:scale-95 transition-all rounded-xl cursor-pointer"
                                    >
                                        <span className="block font-black text-lg text-slate-900 dark:text-slate-100 leading-none">
                                            {stats.leaveDays}
                                        </span>
                                        <span className="inline-block text-[9px] font-extrabold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-900/50 mt-1 shadow-sm">
                                            Izin/Cuti
                                        </span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* HIDE TEMPORARY: Di-hide pasca pembekalan KKN selesai */}
                {false && (currentUser?.role === 'mahasiswa' || currentUser?.is_dpl_kkn || currentUser?.is_panitia_kkn) && (
                    <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-xl shadow-slate-200/50 border-2 border-[#8c1b1d] mt-4">
                        <div className="flex flex-col gap-5">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <h3 className="font-black text-slate-800 dark:text-white text-sm tracking-tight">Informasi Kehadiran pembekalan KKN</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Statistik Bulanan</p>
                                </div>
                            </div>

                            {/* Compact 1-Row Rangkuman Kehadiran KKN */}
                            <div className="flex items-center justify-between divide-x-2 divide-[#8c1b1d]/20 bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-3 border border-[#8c1b1d]/20 mt-1 shadow-sm">
                                {/* Total Masuk (Hadir KKN) */}
                                <div className="flex-1 text-center py-0.5">
                                    <span className="block font-black text-lg text-slate-900 dark:text-slate-100 leading-none">{kknStats.totalMasuk}</span>
                                    <span className="inline-block text-[9px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider mt-1.5">Hadir KKN</span>
                                </div>

                                {/* Tidak Masuk (Alpha KKN) */}
                                <button 
                                    type="button"
                                    onClick={() => setShowKknAbsentModal(true)}
                                    className="flex-1 text-center py-0.5 hover:bg-[#8c1b1d]/5 dark:hover:bg-rose-950/20 active:scale-95 transition-all rounded-xl cursor-pointer"
                                >
                                    <span className="block font-black text-lg text-slate-900 dark:text-slate-100 leading-none">
                                        {kknStats.tidakMasuk}
                                    </span>
                                    <span className="inline-block text-[9px] font-extrabold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded-md border border-rose-200 dark:border-rose-900/50 mt-1 shadow-sm">
                                        Alpha
                                    </span>
                                </button>


                            </div>
                        </div>
                    </div>
                )}

            </main>
        </div>

        {/* Bottom Navigation */}
        <BottomNavigation />
            
        {/* Modal Detail Tidak Masuk Kerja */}
            <Dialog open={showAbsentModal} onOpenChange={setShowAbsentModal}>
                <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">
                            {currentUser?.role === 'mahasiswa' ? 'Detail Ketidakhadiran KKN' : 'Detail Tidak Masuk Kerja'}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-slate-600 dark:text-slate-400">
                            {months.find(m => m.value === selectedMonth.toString())?.label} {selectedYear}
                            <br />
                            <span className="text-xs">
                                {currentUser?.role === 'mahasiswa' 
                                    ? 'Daftar sesi pembekalan KKN yang tidak dihadiri' 
                                    : 'Tidak ada absen masuk/pulang dan tidak ada izin/cuti/dinas luar'}
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="mt-4">
                        {absentDates.length === 0 ? (
                            <div className="text-center py-8">
                                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
                                <p className="text-slate-600 dark:text-slate-400 font-medium">
                                    Tidak ada ketidakhadiran
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                                    Anda hadir di semua hari kerja
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                                    Total: {absentDates.length} hari tidak masuk
                                </p>
                                {absentDates.map((absent, index) => {
                                    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                                                       'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                                    return (
                                        <div 
                                            key={index}
                                            className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                                        >
                                            <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-red-100 dark:bg-red-900/20 rounded-lg">
                                                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-slate-800 dark:text-slate-100">
                                                    {absent.day}
                                                </p>
                                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                                    {absent.date.getDate()} {monthNames[absent.date.getMonth()]} {absent.date.getFullYear()}
                                                </p>
                                            </div>
                                            <div className="flex-shrink-0">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400">
                                                    Tidak Hadir
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal Detail Izin / Cuti / Dinas Luar */}
            <Dialog open={showLeaveModal} onOpenChange={setShowLeaveModal}>
                <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">
                            Detail Izin / Cuti / Dinas Luar
                        </DialogTitle>
                        <DialogDescription className="text-sm text-slate-600 dark:text-slate-400">
                            {months.find(m => m.value === selectedMonth.toString())?.label} {selectedYear}
                            <br />
                            <span className="text-xs">Data izin/cuti/dinas luar pada periode ini</span>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4">
                        {leavePermits.length === 0 ? (
                            <div className="text-center py-8">
                                <Calendar className="w-16 h-16 text-amber-500 mx-auto mb-3" />
                                <p className="text-slate-600 dark:text-slate-400 font-medium">
                                    Belum ada izin/cuti/dinas luar
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                                    Data akan tampil setelah ada pengajuan
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Total: {stats.leaveDays} hari
                                </p>
                                {leavePermits.map((permit) => {
                                    const startLabel = formatDateLong(permit.start_date);
                                    const endLabel = formatDateLong(permit.end_date);
                                    const dateLabel = permit.start_date === permit.end_date
                                        ? startLabel
                                        : `${startLabel} - ${endLabel}`;
                                    const perihal = permit.description?.trim() || "-";

                                    return (
                                        <div
                                            key={permit.id}
                                            className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                                        >
                                            <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-amber-100 dark:bg-amber-900/20 rounded-lg">
                                                <Calendar className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${permitTypeColors[permit.permit_type]}`}>
                                                        {permitTypeLabels[permit.permit_type]}
                                                    </span>
                                                </div>
                                                <p className="font-semibold text-slate-800 dark:text-slate-100">
                                                    {dateLabel}
                                                </p>
                                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                                    Perihal: {perihal}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal Detail Tidak Masuk KKN */}
            <Dialog open={showKknAbsentModal} onOpenChange={setShowKknAbsentModal}>
                <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">
                            Detail Ketidakhadiran KKN
                        </DialogTitle>
                        <DialogDescription className="text-sm text-slate-600 dark:text-slate-400">
                            {months.find(m => m.value === selectedMonth.toString())?.label} {selectedYear}
                            <br />
                            <span className="text-xs">Daftar sesi pembekalan KKN yang tidak dihadiri</span>
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="mt-4">
                        {kknAbsentDates.length === 0 ? (
                            <div className="text-center py-8">
                                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
                                <p className="text-slate-600 dark:text-slate-400 font-medium">
                                    Tidak ada ketidakhadiran
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                                    Anda hadir di semua sesi pembekalan KKN
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                                    Total: {kknAbsentDates.length} sesi tidak dihadiri
                                </p>
                                {kknAbsentDates.map((absent, index) => {
                                    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                                                       'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                                    return (
                                        <div 
                                            key={index}
                                            className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                                        >
                                            <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-red-100 dark:bg-red-900/20 rounded-lg">
                                                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-slate-800 dark:text-slate-100">
                                                    {absent.day}
                                                </p>
                                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                                    {absent.date.getDate()} {monthNames[absent.date.getMonth()]} {absent.date.getFullYear()}
                                                </p>
                                            </div>
                                            <div className="flex-shrink-0">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400">
                                                    Tidak Hadir
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal Detail Izin / Cuti KKN */}
            <Dialog open={showKknLeaveModal} onOpenChange={setShowKknLeaveModal}>
                <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">
                            Detail Izin / Cuti KKN
                        </DialogTitle>
                        <DialogDescription className="text-sm text-slate-600 dark:text-slate-400">
                            {months.find(m => m.value === selectedMonth.toString())?.label} {selectedYear}
                            <br />
                            <span className="text-xs">Data izin/cuti pembekalan KKN pada periode ini</span>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4">
                        {leavePermits.length === 0 ? (
                            <div className="text-center py-8">
                                <Calendar className="w-16 h-16 text-amber-500 mx-auto mb-3" />
                                <p className="text-slate-600 dark:text-slate-400 font-medium">
                                    Belum ada izin/cuti
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                                    Data akan tampil setelah ada pengajuan
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Total: {kknStats.leaveDays} sesi izin/cuti
                                </p>
                                {leavePermits.map((permit) => {
                                    const startLabel = formatDateLong(permit.start_date);
                                    const endLabel = formatDateLong(permit.end_date);
                                    const dateLabel = permit.start_date === permit.end_date
                                        ? startLabel
                                        : `${startLabel} - ${endLabel}`;
                                    const perihal = permit.description?.trim() || "-";

                                    return (
                                        <div
                                            key={permit.id}
                                            className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                                        >
                                            <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-amber-100 dark:bg-amber-900/20 rounded-lg">
                                                <Calendar className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${permitTypeColors[permit.permit_type]}`}>
                                                        {permitTypeLabels[permit.permit_type]}
                                                    </span>
                                                </div>
                                                <p className="font-semibold text-slate-800 dark:text-slate-100">
                                                    {dateLabel}
                                                </p>
                                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                                    Perihal: {perihal}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default Index;
