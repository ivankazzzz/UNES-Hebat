"use client";

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { getCurrentUser, refreshUserData, type AuthUser } from "@/lib/auth";
import {
  ArrowLeft,
  MapPin,
  CheckCircle,
  AlertCircle,
  CalendarOff,
  Clock,
  Building2
} from "lucide-react";

type TelegramEvidenceResponse = {
  ok: boolean;
  result: {
    messageId: number;
    chatId: number;
    fileId: string | null;
    photoRef?: string | null;
    photoUrl?: string | null;
    messageLink?: string | null;
    caption?: string | null;
    sentAt: string;
    meta?: unknown;
  };

};

type AttendanceTimesState = {
  masuk?: string | null;
  pulang?: string | null;
};

interface AttendanceLocation {
  id: string;
  user_id: string | null;
  building_id?: string | null;
  unit_kerja: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  location_name: string;
  is_active: boolean;
  is_primary?: boolean | null;
  priority?: number | null;
  created_at?: string | null;
}

interface CampusArea {
  lat: number;
  lng: number;
  radiusMeters: number;
  label: string;
}

interface Holiday {
  id: string;
  holiday_date: string;
  description: string;
  is_active: boolean;
}

interface LeavePermit {
  id: string;
  user_id: string;
  permit_type: 'izin' | 'cuti' | 'dinas_luar';
  start_date: string;
  end_date: string;
  description: string | null;
  document_url: string | null;
  status: string;
}

interface UserWorkSchedule {
  id: string;
  user_id: string;
  check_in_start: string;  // Format: "HH:MM:SS"
  check_in_end: string;
  check_out_start: string;
  check_out_end: string;
  reason: string | null;
  is_active: boolean;
}

// Default jam kerja (jika user tidak punya jadwal khusus)
const DEFAULT_WORK_SCHEDULE = {
  check_in_start: "08:00:00",
  check_in_end: "08:30:00",
  check_out_start: "15:00:00",
  check_out_end: "17:00:00"
};

const ATTENDANCE_TELEGRAM_CHAT_ID =
  (import.meta.env.VITE_ATTENDANCE_TELEGRAM_CHAT_ID as string | undefined) ??
  "-1003486972781";

// STRICT MODE: Tidak ada fallback default
// Semua user HARUS memiliki titik absensi yang dikonfigurasi di database
// Jika tidak ada, user tidak bisa melakukan absensi

const WIB_TIME_ZONE = "Asia/Jakarta";

type WibDateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

const getWibDateParts = (date: Date): WibDateParts => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: WIB_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);

  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
    hour: Number(lookup.hour),
    minute: Number(lookup.minute)
  };
};

const getWibDayBoundsUtc = (now: Date) => {
  const { year, month, day } = getWibDateParts(now);

  // WIB adalah UTC+7, jadi start WIB 00:00 = UTC 17:00 hari sebelumnya.
  const startUtc = new Date(Date.UTC(year, month - 1, day, -7, 0, 0, 0));
  const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000);

  const pad2 = (value: number) => String(value).padStart(2, "0");
  const dayStringWib = `${year}-${pad2(month)}-${pad2(day)}`;

  return {
    dayStringWib,
    startIsoUtc: startUtc.toISOString(),
    endIsoUtc: endUtc.toISOString()
  };
};

const isSundayWib = (date: Date): boolean => {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: WIB_TIME_ZONE,
    weekday: "short"
  }).format(date);

  return weekday.toLowerCase() === "sun";
};

const formatWibWeekdayId = (date: Date): string => {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: WIB_TIME_ZONE,
    weekday: "long"
  }).format(date);
};

const isCheckConstraintViolation = (error: unknown, constraintName: string): boolean => {
  if (!error || typeof error !== "object") return false;

  const maybeCode = (error as { code?: string | null }).code;
  const maybeMessage = (error as { message?: string | null }).message;

  return (
    maybeCode === "23514" ||
    (typeof maybeMessage === "string" && maybeMessage.includes(constraintName))
  );
};

const isUniqueConstraintViolation = (error: unknown, constraintName?: string): boolean => {
  if (!error || typeof error !== "object") return false;

  const maybeCode = (error as { code?: string | null }).code;
  const maybeMessage = (error as { message?: string | null }).message;

  if (maybeCode !== "23505") return false;
  if (!constraintName) return true;

  return typeof maybeMessage === "string" && maybeMessage.includes(constraintName);
};


export default function Attendance() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState<string>("");
  const [locationStatus, setLocationStatus] = useState<"inside" | "outside" | "unknown">("unknown");
  const [distanceFromCampusMeters, setDistanceFromCampusMeters] = useState<number>(0);
  const [photo, setPhoto] = useState<string | null>(null);
  const [streamStarted, setStreamStarted] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);


  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"success" | "error" | "info" | "warning">("success");
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  // Loading Overlay State - untuk loading di tengah layar
  const [loadingOverlay, setLoadingOverlay] = useState<{
    show: boolean;
    message: string;
    subMessage?: string;
  }>({ show: true, message: "Mempersiapkan...", subMessage: "Mohon tunggu sebentar" });

  const [isProcessing, setIsProcessing] = useState(false);
  const [attendanceType, setAttendanceType] = useState<"masuk" | "pulang">("masuk");
  const [todayAttendance, setTodayAttendance] = useState<{ masuk: boolean; pulang: boolean }>({ masuk: false, pulang: false });
  const [attendanceTimes, setAttendanceTimes] = useState<AttendanceTimesState>({});
  const [effectiveCampusRadiusMeters, setEffectiveCampusRadiusMeters] = useState<number>(75);
  const [activeCampusAreaLabel, setActiveCampusAreaLabel] = useState<string>("Menunggu konfigurasi...");
  const [gpsReady, setGpsReady] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(true);
  const watchIdRef = useRef<number | null>(null);
  
  // Data titik absensi dari database berdasarkan unit_kerja user
  const [userAttendanceLocation, setUserAttendanceLocation] = useState<AttendanceLocation | null>(null);
  const [secondaryAttendanceLocations, setSecondaryAttendanceLocations] = useState<AttendanceLocation[]>([]);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  // Status untuk multiple titik absensi (dosen struktural dengan banyak lokasi)
  const [primaryLocationStatus, setPrimaryLocationStatus] = useState<"inside" | "outside" | "unknown">("unknown");
  const [secondaryLocationStatuses, setSecondaryLocationStatuses] = useState<Array<{ location: AttendanceLocation; status: "inside" | "outside"; distance: number }>>([]);
  const [primaryDistanceMeters, setPrimaryDistanceMeters] = useState<number>(0);
  const [activeLocationForAbsensi, setActiveLocationForAbsensi] = useState<AttendanceLocation | null>(null);
  
  
  // Track initialization status
  const [cameraReady, setCameraReady] = useState(false);
  const [configReady, setConfigReady] = useState(false);
  const [permissionsRequested, setPermissionsRequested] = useState(false);

  // Current user state - can be updated after refresh
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(getCurrentUser());
  const isUserIdentityIncomplete = (user: AuthUser | null): boolean => {
    if (!user) return true;
    const username = (user.username || "").trim();
    const fullName = (user.full_name || "").trim();
    return !username || !fullName;
  };


  // Holiday state - untuk mengecek apakah hari ini libur
  const [todayHoliday, setTodayHoliday] = useState<Holiday | null>(null);
  const [holidayChecked, setHolidayChecked] = useState(false);
  const [holidayNotified, setHolidayNotified] = useState(false);

  // User work schedule state - jam kerja khusus per user
  const [userWorkSchedule, setUserWorkSchedule] = useState<UserWorkSchedule | null>(null);
  const [workScheduleLoaded, setWorkScheduleLoaded] = useState(false);

  // Leave permit state - untuk mengecek apakah user punya izin/cuti/dinas luar hari ini
  const [todayLeavePermit, setTodayLeavePermit] = useState<LeavePermit | null>(null);
  const [leavePermitChecked, setLeavePermitChecked] = useState(false);

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

  const formatAttendanceStatusLabel = (status: string): string => {
    if (!status) return "";
    if (status === "kurang_jam") return "Kurang Jam";
    if (status === "hadir") return "Hadir";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatAttendanceTypeLabel = (type: string): string => {
    if (!type) return "";
    if (type === "masuk") return "Presensi Masuk";
    if (type === "pulang") return "Presensi Pulang";
    if (type === "keluar") return "Presensi Keluar";
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Helper: parse time string "HH:MM:SS" to total minutes
   const parseTimeToMinutes = (timeStr: string): number => {
     const safe = (timeStr || "").trim();
     if (!safe) return 0;

     const parts = safe.split(":");
     const hours = parseInt(parts[0], 10);
     const minutes = parseInt(parts[1], 10);

     // Defensive: if invalid values, treat as 0 minutes.
     if (Number.isNaN(hours) || Number.isNaN(minutes)) return 0;

     return hours * 60 + minutes;
   };

  // Helper: format time "HH:MM:SS" to "HH:MM"
  const formatTimeDisplay = (timeStr: string): string => {
    const parts = timeStr.split(":");
    return `${parts[0]}:${parts[1]}`;
  };

  // Validasi waktu absensi berdasarkan jam kerja user (dari database atau default)
  // Di luar window waktu absensi => ditolak (ditutup)
  // Superadmin dan user dengan dinas luar boleh bypass jam absensi
  const isAttendanceWindowOpen = (type: "masuk" | "pulang"): { isOpen: boolean; message: string } => {
    // Superadmin bypass - izinkan absen kapan saja
    if (currentUser?.role === "superadmin") {
      return { isOpen: true, message: "" };
    }

    // User dengan bypass_time_restrictions bypass - izinkan absen kapan saja
    if (currentUser?.bypass_time_restrictions === true) {
      return { isOpen: true, message: "" };
    }

    // User dengan dinas luar bypass - izinkan absen kapan saja
    if (todayLeavePermit?.permit_type === "dinas_luar") {
      return { isOpen: true, message: "" };
    }

    // Gunakan jam kerja dari database jika ada, jika tidak gunakan default
    const schedule = userWorkSchedule || DEFAULT_WORK_SCHEDULE;

    const { hour, minute } = getWibDateParts(new Date());
    const totalMinutes = hour * 60 + minute;

    if (type === "masuk") {
      const startMinutes = parseTimeToMinutes(schedule.check_in_start);
      const endMinutes = parseTimeToMinutes(schedule.check_in_end);
      const startDisplay = formatTimeDisplay(schedule.check_in_start);
      const endDisplay = formatTimeDisplay(schedule.check_in_end);

      if (totalMinutes < startMinutes) {
        return {
          isOpen: false,
          message: `Presensi Masuk belum dibuka. Waktu presensi masuk dimulai pukul ${startDisplay} WIB.`
        };
      }
       // Inclusive end time: allow attendance exactly at end minute.
       // Inclusive end time: allow attendance exactly at end minute.
     if (totalMinutes > endMinutes) {
        return {
          isOpen: false,
          message: `Presensi Masuk sudah ditutup. Waktu presensi masuk berakhir pukul ${endDisplay} WIB.`
        };
      }

      return { isOpen: true, message: "" };
    }

    // type === "pulang"
    const startMinutes = parseTimeToMinutes(schedule.check_out_start);
    const endMinutes = parseTimeToMinutes(schedule.check_out_end);
    const startDisplay = formatTimeDisplay(schedule.check_out_start);
    const endDisplay = formatTimeDisplay(schedule.check_out_end);

    if (totalMinutes < startMinutes) {
      return {
        isOpen: false,
        message: `Presensi Pulang belum dibuka. Waktu presensi pulang dimulai pukul ${startDisplay} WIB.`
      };
    }
    if (totalMinutes > endMinutes) {
      return {
        isOpen: false,
        message: `Presensi Pulang sudah ditutup. Waktu presensi pulang berakhir pukul ${endDisplay} WIB.`
      };
    }

    return { isOpen: true, message: "" };
  };

  const formatTimeWIBLabel = (iso?: string | null): string => {
    if (!iso) return "-";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "-";
    const formatted = new Intl.DateTimeFormat("id-ID", {
      timeZone: WIB_TIME_ZONE,
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
    return `${formatted} WIB`;
  };

  const formatDateTimeWIBLabel = (iso?: string | null): string | null => {
    if (!iso) return null;
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat("id-ID", {
      timeZone: WIB_TIME_ZONE,
      dateStyle: "long",
      timeStyle: "medium"
    }).format(date);
  };

  const findNearestCampusArea = (lat: number, lng: number) => {
    // Untuk user dengan multiple titik absensi (lebih dari 1 lokasi aktif)
    if (userAttendanceLocation && secondaryAttendanceLocations.length > 0) {
      // Hitung jarak ke titik primer (unit kerja)
      const primaryDistanceKm = calculateDistance(lat, lng, userAttendanceLocation.latitude, userAttendanceLocation.longitude);
      const primaryDistanceM = Math.max(0, primaryDistanceKm * 1000);
      const primaryInside = primaryDistanceM <= userAttendanceLocation.radius_meters;
      
      // Hitung jarak ke semua titik sekunder
      const secondaryStatuses = secondaryAttendanceLocations.map(secLoc => {
        const distanceKm = calculateDistance(lat, lng, secLoc.latitude, secLoc.longitude);
        const distanceM = Math.max(0, distanceKm * 1000);
        const inside = distanceM <= secLoc.radius_meters;
        return {
          location: secLoc,
          status: inside ? "inside" as const : "outside" as const,
          distance: distanceM
        };
      });
      
      // Update status
      setPrimaryLocationStatus(primaryInside ? "inside" : "outside");
      setPrimaryDistanceMeters(primaryDistanceM);
      setSecondaryLocationStatuses(secondaryStatuses);
      
      // Kumpulkan semua lokasi (primer + sekunder) dengan statusnya
      const allLocations = [
        { location: userAttendanceLocation, status: primaryInside ? "inside" as const : "outside" as const, distance: primaryDistanceM },
        ...secondaryStatuses
      ];
      
      // Cari lokasi yang di dalam radius, jika ada pilih yang terdekat
      const insideLocations = allLocations.filter(loc => loc.status === "inside");
      
      let activeLocation: AttendanceLocation;
      let activeDistance: number;
      let isInside: boolean;
      
      if (insideLocations.length > 0) {
        // Ada lokasi yang di dalam radius, pilih yang terdekat
        const nearest = insideLocations.reduce((prev, curr) => 
          prev.distance <= curr.distance ? prev : curr
        );
        activeLocation = nearest.location;
        activeDistance = nearest.distance;
        isInside = true;
      } else {
        // Semua di luar radius, pilih yang terdekat
        const nearest = allLocations.reduce((prev, curr) => 
          prev.distance <= curr.distance ? prev : curr
        );
        activeLocation = nearest.location;
        activeDistance = nearest.distance;
        isInside = false;
      }
      
      setActiveLocationForAbsensi(activeLocation);
      
      return {
        nearestArea: {
          lat: activeLocation.latitude,
          lng: activeLocation.longitude,
          radiusMeters: activeLocation.radius_meters,
          label: activeLocation.location_name
        } as CampusArea,
        distanceMeters: activeDistance,
        isInside: isInside,
        radiusMeters: activeLocation.radius_meters
      };
    }
    
    // Gunakan titik absensi dari database jika tersedia (non-struktural)
    if (userAttendanceLocation) {
      const distanceKm = calculateDistance(lat, lng, userAttendanceLocation.latitude, userAttendanceLocation.longitude);
      const distanceMeters = Math.max(0, distanceKm * 1000);
      const inside = distanceMeters <= userAttendanceLocation.radius_meters;
      
      setPrimaryLocationStatus(inside ? "inside" : "outside");
      setPrimaryDistanceMeters(distanceMeters);
      setActiveLocationForAbsensi(userAttendanceLocation);
      
      return {
        nearestArea: {
          lat: userAttendanceLocation.latitude,
          lng: userAttendanceLocation.longitude,
          radiusMeters: userAttendanceLocation.radius_meters,
          label: userAttendanceLocation.location_name
        } as CampusArea,
        distanceMeters: distanceMeters,
        isInside: inside,
        radiusMeters: userAttendanceLocation.radius_meters
      };
    }
    
    // STRICT MODE: Tidak ada fallback - jika tidak ada data dari database, return null/outside
    // User HARUS memiliki titik absensi yang dikonfigurasi
    return {
      nearestArea: null,
      distanceMeters: 0,
      isInside: false,
      radiusMeters: 75
    };
  };

  // Fetch titik absensi berdasarkan unit_kerja user
  // Untuk dosen struktural: fetch 2 titik (unit kerja + Gedung Rektorat)
  useEffect(() => {
    const fetchUserAttendanceLocation = async () => {
      if (!currentUser?.id) {
        setLoadingLocation(false);
        setConfigReady(true);
        setLocationError("Akun Anda tidak valid. Silakan login ulang.");
        return;
      }
 
      try {
        // Fetch SEMUA titik absensi dari attendance_locations table
        const { data: allLocations, error: locError } = await supabase
          .from("attendance_locations")
          .select("*")
          .eq("user_id", currentUser.id)
          .eq("is_active", true)
          .order("priority", { ascending: true, nullsFirst: false })
          .order("is_primary", { ascending: false })
          .order("created_at", { ascending: true });
 
        // Jika tidak ada lokasi sama sekali di attendance_locations, error
        if (locError || !allLocations || allLocations.length === 0) {
          setLocationError(
            `Titik presensi untuk user "${currentUser.full_name}" belum dikonfigurasi. Hubungi admin.`
          );
          setLoadingLocation(false);
          setConfigReady(true);
          return;
        }

        // Utamakan lokasi yang ditandai primary, fallback ke urutan awal
        const primaryLocation =
          allLocations.find((loc) => loc.priority === 1) ??
          allLocations.find((loc) => loc.is_primary) ??
          allLocations[0];
        setUserAttendanceLocation(primaryLocation);
        setActiveCampusAreaLabel(primaryLocation.location_name);
        setEffectiveCampusRadiusMeters(primaryLocation.radius_meters);
        setActiveLocationForAbsensi(primaryLocation);

        // Lokasi sisanya dari attendance_locations = SECONDARY
        const secondaryFromTable = allLocations
          .filter((loc) => loc.id !== primaryLocation.id)
          .map((loc) => ({
          id: loc.id,
          user_id: loc.user_id,
          unit_kerja: `${loc.unit_kerja} (Alternatif)`,
          latitude: loc.latitude,
          longitude: loc.longitude,
          radius_meters: loc.radius_meters,
          location_name: loc.location_name,
          is_active: true,
        }));

        setSecondaryAttendanceLocations(secondaryFromTable);

        setLoadingLocation(false);
        setConfigReady(true);
      } catch (err) {
        console.error("Error fetching attendance location:", err);
        setLocationError("Gagal memuat titik presensi. Coba refresh halaman.");
        setLoadingLocation(false);
        setConfigReady(true);
      }
    };

    fetchUserAttendanceLocation();
  }, [currentUser?.id]);

  // Effect untuk menghitung ulang jarak ketika userAttendanceLocation atau lokasi GPS berubah
  useEffect(() => {
    if (location && userAttendanceLocation) {
      const { nearestArea, distanceMeters, isInside, radiusMeters } = findNearestCampusArea(location.lat, location.lng);
      
      setDistanceFromCampusMeters(distanceMeters);
      setLocationStatus(isInside ? "inside" : "outside");
      setEffectiveCampusRadiusMeters(radiusMeters);
      if (nearestArea?.label) {
        setActiveCampusAreaLabel(nearestArea.label);
      }
    }
  }, [userAttendanceLocation, secondaryAttendanceLocations, location]);

  // Effect untuk menutup loading overlay saat semua siap
  useEffect(() => {
    if (cameraReady && gpsReady && configReady) {
      // Semua sudah siap, tutup loading overlay
      setLoadingOverlay({ show: false, message: "" });
    } else if (cameraReady && !gpsReady && !gpsLoading) {
      // Kamera siap tapi GPS gagal
      setLoadingOverlay({ show: false, message: "" });
    } else if (gpsReady && !cameraReady && streamStarted) {
      // GPS siap tapi kamera masih proses
      setLoadingOverlay({ 
        show: true, 
        message: "Mempersiapkan Kamera", 
        subMessage: "Mohon tunggu sebentar..." 
      });
    } else if (cameraReady && gpsLoading) {
      // Kamera siap, GPS masih loading
      setLoadingOverlay({ 
        show: true, 
        message: "Mengambil Lokasi Anda", 
        subMessage: "Mohon tunggu, sedang mengakses GPS..." 
      });
    }
  }, [cameraReady, gpsReady, gpsLoading, configReady, streamStarted]);

  useEffect(() => {
    const initUser = async () => {
      // Refresh user data untuk memastikan identity field (username/full_name) selalu lengkap
      // dan mengikuti update dari database.
      const refreshedUser = await refreshUserData();
      if (refreshedUser) {
        setCurrentUser(refreshedUser);
      }
      // Tunggu schedule khusus ter-load sebelum menentukan mode masuk/pulang.
      // Jika tidak, user jam kerja khusus bisa salah terbaca sebagai mode pulang.
      if (!workScheduleLoaded) return;
      checkTodayAttendance();
    };
    
    const user = getCurrentUser();
    if (user) {
      // Jika session lama tidak punya username/full_name, paksa refresh.
      // Ini mencegah kasus Telegram sukses tapi DB insert gagal (username NOT NULL).
      if (isUserIdentityIncomplete(user)) {
        initUser();
      } else {
        // Tetap refresh sekali untuk sinkronisasi, tapi tidak blocking.
        initUser();
      }
    }

  }, [workScheduleLoaded]);

  // Effect untuk mengecek apakah hari ini adalah hari libur
  useEffect(() => {
    const checkTodayHoliday = async () => {
      try {
        // Dapatkan tanggal hari ini dalam format WIB
        const { year, month, day } = getWibDateParts(new Date());
        const todayDateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        const { data, error } = await supabase
          .from("holidays")
          .select("*")
          .eq("holiday_date", todayDateString)
          .eq("is_active", true)
          .limit(1);

        if (!error && data && data.length > 0) {
          setTodayHoliday(data[0]);
        }
        setHolidayChecked(true);
      } catch (error) {
        console.error("Error checking holiday:", error);
        setHolidayChecked(true);
      }
    };

    checkTodayHoliday();
  }, []);

  // Notifikasi proaktif: begitu status libur terdeteksi, tampilkan info sekali.
  useEffect(() => {
    if (
      holidayNotified ||
      !holidayChecked ||
      !todayHoliday ||
      !currentUser ||
      currentUser.role === 'superadmin'
    ) {
      return;
    }

    showModal(
      "warning",
      "Hari Ini Libur",
      `Terimakasih atas semangat Anda, namun mohon maaf saat ini sedang libur karena "${todayHoliday.description}". Sistem presensi tidak menerima presensi pada hari libur.`
    );
    setHolidayNotified(true);
  }, [holidayChecked, todayHoliday, currentUser, holidayNotified]);

  // Effect untuk fetch jam kerja khusus user dari database
  useEffect(() => {
    const fetchUserWorkSchedule = async () => {
      if (!currentUser?.id) {
        setWorkScheduleLoaded(true);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_work_schedules")
          .select("*")
          .eq("user_id", currentUser.id)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          setUserWorkSchedule(data);
        }
        // Jika tidak ada data, user akan menggunakan jam kerja default
        setWorkScheduleLoaded(true);
      } catch (error) {
        console.error("Error fetching user work schedule:", error);
        setWorkScheduleLoaded(true);
      }
    };

    fetchUserWorkSchedule();
  }, [currentUser?.id]);

  // Effect untuk fetch leave permit hari ini
  useEffect(() => {
    const checkTodayLeavePermit = async () => {
      if (!currentUser?.id) {
        setLeavePermitChecked(true);
        return;
      }

      try {
        // Dapatkan tanggal hari ini dalam format WIB
        const { year, month, day } = getWibDateParts(new Date());
        const todayDateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // Cari leave permit yang aktif pada hari ini
        // Semua jenis (izin, cuti, dinas luar) langsung aktif saat user upload (tidak perlu approval)
        const { data, error } = await supabase
          .from("leave_permits")
          .select("*")
          .eq("user_id", currentUser.id)
          .lte("start_date", todayDateString)
          .gte("end_date", todayDateString)
          .limit(1);

        if (!error && data && data.length > 0) {
          setTodayLeavePermit(data[0]);
        }
        setLeavePermitChecked(true);
      } catch (error) {
        console.error("Error checking leave permit:", error);
        setLeavePermitChecked(true);
      }
    };

    checkTodayLeavePermit();
  }, [currentUser?.id]);

  const checkTodayAttendance = async () => {
    if (!currentUser) return;

    const bounds = getWibDayBoundsUtc(new Date());

    const { data, error } = await supabase
      .from("attendances")
      .select("attendance_type, created_at, note")
      .eq("user_id", currentUser.id)
      .gte("created_at", bounds.startIsoUtc)
      .lt("created_at", bounds.endIsoUtc);

    if (!error && data) {
      // Kecualikan absensi KKN
      const regulerData = data.filter((a) => !a.note?.includes("[Sesi:"));
      
      const hasMasuk = regulerData.some((a) => a.attendance_type === "masuk");
      const hasPulang = regulerData.some((a) => a.attendance_type === "pulang");
      const times: AttendanceTimesState = {};

      regulerData.forEach((record) => {
        if (record.attendance_type === "masuk" && record.created_at) {
          if (!times.masuk || new Date(record.created_at) < new Date(times.masuk)) {
            times.masuk = record.created_at;
          }
        }

        if (record.attendance_type === "pulang" && record.created_at) {
          if (!times.pulang || new Date(record.created_at) < new Date(times.pulang)) {
            times.pulang = record.created_at;
          }
        }
      });

      setTodayAttendance({ masuk: hasMasuk, pulang: hasPulang });
      setAttendanceTimes(times);

      // Tentukan tipe absensi berdasarkan waktu WIB dan jam kerja user
      // PENTING: untuk user jam kerja khusus, jangan hitung pakai default sebelum schedule selesai di-load,
      // karena bisa menyebabkan jam 13:00 terbaca sebagai mode pulang.
      if (!workScheduleLoaded) {
        return;
      }

      const schedule = userWorkSchedule || DEFAULT_WORK_SCHEDULE;
      const checkInEndMinutes = parseTimeToMinutes(schedule.check_in_end);
      const checkOutStartMinutes = parseTimeToMinutes(schedule.check_out_start);

      // Midpoint antara akhir jam masuk dan awal jam pulang
      // Digunakan untuk menentukan kapan UI switch ke mode pulang
      const midpointMinutes = Math.floor((checkInEndMinutes + checkOutStartMinutes) / 2);

      const { hour: currentHour, minute: currentMinute } = getWibDateParts(new Date());
      const currentTotalMinutes = currentHour * 60 + currentMinute;
      const isAfterMidpoint = currentTotalMinutes >= midpointMinutes;

      if (hasPulang) {
        // Sudah absen pulang, tetap di mode pulang (tidak bisa absen lagi)
        setAttendanceType("pulang");
      } else if (isAfterMidpoint) {
        // Sudah lewat midpoint, saatnya absen pulang
        setAttendanceType("pulang");
      } else if (hasMasuk) {
        // Sudah absen masuk tapi belum midpoint, tetap mode masuk (untuk tampilan)
        setAttendanceType("masuk");
      } else {
        // Belum absen masuk dan belum midpoint
        setAttendanceType("masuk");
      }
    }
  };

  const calculateStatus = (type: "masuk" | "pulang"): "hadir" | "kurang_jam" => {
    const schedule = userWorkSchedule || DEFAULT_WORK_SCHEDULE;

    const { hour, minute } = getWibDateParts(new Date());
    const totalMinutes = hour * 60 + minute;

    if (type === "masuk") {
      // Jika absen masuk berhasil disimpan berarti masih dalam window, maka status selalu "hadir".
      const endMinutes = parseTimeToMinutes(schedule.check_in_end);
      return totalMinutes <= endMinutes ? "hadir" : "hadir";
    }

    // type === "pulang"
    // "kurang_jam" hanya untuk pulang terlalu cepat (sebelum jam pulang dibuka).
    const startMinutes = parseTimeToMinutes(schedule.check_out_start);
    return totalMinutes >= startMinutes ? "hadir" : "kurang_jam";
  };

  // Fungsi untuk request permission kamera dan lokasi - dipanggil otomatis saat mount
  useEffect(() => {
    const requestPermissionsOnMount = async () => {
      setPermissionsRequested(true);
      
      // Request kamera
      if (!navigator.mediaDevices?.getUserMedia) {
        setLoadingOverlay({ show: false, message: "" });
        showModal("error", "Kamera Tidak Tersedia", "Kamera tidak didukung pada perangkat ini.");
        return;
      }

      // Loading overlay untuk kamera
      setLoadingOverlay({ 
        show: true, 
        message: "Meminta Akses Kamera", 
        subMessage: "Mohon izinkan akses kamera pada browser Anda..." 
      });

      const attachStreamToVideo = async (stream: MediaStream): Promise<void> => {
        streamRef.current = stream;
        setStreamStarted(true);
        setCameraError(null);

        const videoEl = videoRef.current;
        if (!videoEl) {
          throw new Error("Elemen video belum siap.");
        }

        videoEl.srcObject = stream;

        // Tunggu metadata agar ukuran video tersedia (menghindari layar hitam/0x0 di Android tertentu)
        await new Promise<void>((resolve, reject) => {
          const timeoutId = window.setTimeout(() => {
            cleanup();
            reject(new Error("Timeout menunggu kamera siap."));
          }, 8000);

          const cleanup = () => {
            window.clearTimeout(timeoutId);
            videoEl.removeEventListener("loadedmetadata", onReady);
            videoEl.removeEventListener("canplay", onReady);
          };

          const onReady = () => {
            cleanup();
            resolve();
          };

          videoEl.addEventListener("loadedmetadata", onReady, { once: true });
          videoEl.addEventListener("canplay", onReady, { once: true });
        });

        const playPromise = videoEl.play();
        if (playPromise && typeof playPromise.then === "function") {
          await playPromise;
        }

        setCameraReady(true);
      };

      const stopExistingStream = () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      try {
        stopExistingStream();

        // Coba constraint yang lebih toleran untuk Chrome Android (hindari max frameRate ketat)
        const primaryConstraints: MediaStreamConstraints = {
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        };

        const fallbackConstraints: MediaStreamConstraints = { video: true };

        try {
          const stream = await navigator.mediaDevices.getUserMedia(primaryConstraints);
          await attachStreamToVideo(stream);
        } catch (err) {
          console.warn("Primary camera constraints failed, using fallback.", err);
          const stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
          await attachStreamToVideo(stream);
        }
      } catch (error) {
        console.error("Camera init error:", error);
        setCameraReady(false);
        setStreamStarted(false);
        setCameraError(error instanceof Error ? error.message : "Gagal menginisialisasi kamera.");
        setLoadingOverlay({ show: false, message: "" });
        showModal("error", "Kamera Bermasalah", "Kamera tidak dapat digunakan atau hanya menampilkan layar hitam. Silakan tutup aplikasi lain yang memakai kamera lalu reload.");
        setPermissionsRequested(false);
        return;
      }

      // Request lokasi
      if (!navigator.geolocation) {
        setLoadingOverlay({ show: false, message: "" });
        showModal("error", "Geolokasi Tidak Tersedia", "Geolokasi tidak didukung oleh browser ini.");
        return;
      }

      // Loading overlay untuk GPS
      setLoadingOverlay({ 
        show: true, 
        message: "Meminta Akses Lokasi", 
        subMessage: "Mohon izinkan akses lokasi pada browser Anda..." 
      });

      // Gunakan getCurrentPosition dulu untuk trigger permission prompt
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          // Setelah permission diberikan, mulai watchPosition
          const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
          setLocation(coords);

          const { nearestArea, distanceMeters, isInside, radiusMeters } = findNearestCampusArea(coords.lat, coords.lng);

          setDistanceFromCampusMeters(distanceMeters);
          setLocationStatus(isInside ? "inside" : "outside");
          setEffectiveCampusRadiusMeters(radiusMeters);
          setActiveCampusAreaLabel(nearestArea?.label ?? "Lokasi tidak dikonfigurasi");
          
          setGpsReady(true);
          setGpsLoading(false);

          // Get location name
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=18&addressdetails=1`)
            .then(res => res.json())
            .then(data => {
              if (data.display_name) {
                const parts = data.display_name.split(',');
                setLocationName(parts.slice(0, 3).join(', '));
              } else {
                setLocationName(`${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
              }
            })
            .catch(() => {
              setLocationName(`${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
            });

          // Setelah berhasil, start watchPosition untuk update realtime
          const watchId = navigator.geolocation.watchPosition(
            async (position) => {
              const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
              setLocation(coords);

              const { nearestArea, distanceMeters, isInside, radiusMeters } = findNearestCampusArea(coords.lat, coords.lng);

              setDistanceFromCampusMeters(distanceMeters);
              setLocationStatus(isInside ? "inside" : "outside");
              setEffectiveCampusRadiusMeters(radiusMeters);
              setActiveCampusAreaLabel(nearestArea?.label ?? "Lokasi tidak dikonfigurasi");
              
              setGpsReady(true);
              setGpsLoading(false);

              fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=18&addressdetails=1`)
                .then(res => res.json())
                .then(data => {
                  if (data.display_name) {
                    const parts = data.display_name.split(',');
                    setLocationName(parts.slice(0, 3).join(', '));
                  } else {
                    setLocationName(`${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
                  }
                })
                .catch(() => {
                  setLocationName(`${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
                });
            },
            (error) => {
              console.warn("GPS watchPosition error:", error);
            },
            {
              enableHighAccuracy: true,
              timeout: 8000,
              maximumAge: 5000
            }
          );

          watchIdRef.current = watchId;
        },
        (error) => {
          console.error("GPS permission error:", error);
          setLoadingOverlay({ show: false, message: "" });
          
          let errorMessage = "GPS Anda tidak aktif, nyalakan dan reload halaman untuk presensi.";
          if (error.code === error.PERMISSION_DENIED) {
            errorMessage = "Izin lokasi ditolak. Silakan aktifkan izin lokasi di pengaturan browser Anda, lalu reload halaman.";
          }
          
          showModal("error", "Gagal Mengakses Lokasi", errorMessage);
          setGpsReady(false);
          setGpsLoading(false);
          setPermissionsRequested(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    };

    requestPermissionsOnMount();
  }, []);

  useEffect(() => {
    // Cleanup saat unmount
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const showModal = (type: "success" | "error" | "info" | "warning", title: string, message: string) => {
    setModalType(type);
    setModalTitle(title);
    setModalMessage(message);
    setModalOpen(true);
  };

  const normalizeEvidencePhotoUrl = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return trimmed;

    if (trimmed.startsWith("telegram:file:")) return trimmed;
    if (trimmed.includes("t.me/")) return trimmed;
    if (/^[A-Za-z0-9_-]{10,}$/.test(trimmed)) return `telegram:file:${trimmed}`;
    return trimmed;
  };

  // Helper untuk memanggil RPC Supabase dengan retry otomatis jika gagal koneksi (Failed to fetch)
  const supabaseRpcWithRetry = async (
    fnName: string,
    params: Record<string, any>,
    maxRetries = 3,
    delayMs = 1500
  ): Promise<{ data: any; error: any }> => {
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        const result = await supabase.rpc(fnName, params);
        if (!result.error) {
          return result;
        }
        
        const errMsg = String(result.error.message || "").toLowerCase();
        if (!errMsg.includes("fetch") && !errMsg.includes("network") && !errMsg.includes("load failed")) {
          return result;
        }
        
        console.warn(`Supabase RPC network error (attempt ${attempt + 1}/${maxRetries}):`, result.error);
      } catch (err: any) {
        console.warn(`Supabase RPC thrown error (attempt ${attempt + 1}/${maxRetries}):`, err);
      }
      
      attempt++;
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    return await supabase.rpc(fnName, params);
  };

  const uploadAttendanceEvidenceToTelegram = async (
    base64Data: string,
    fileName: string,
    caption: string,
    meta: Record<string, unknown>
  ): Promise<TelegramEvidenceResponse> => {

    const response = await fetch("/api/telegram-evidence", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fileName,
        fileType: "image/png",
        fileBase64: base64Data,
        caption,
        targetChatId: ATTENDANCE_TELEGRAM_CHAT_ID,
        meta
      })
    });

    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch (error) {
      if (!response.ok) {
        throw new Error("Gagal mengirim foto ke Telegram.");
      }
      throw error;
    }

    const typedPayload = payload as TelegramEvidenceResponse & { error?: string };

    if (!response.ok || !typedPayload.ok) {
      const message = (payload as { error?: string })?.error || "Gagal mengirim foto ke Telegram.";
      throw new Error(message);
    }

    return typedPayload;
  };

  const isCurrentWindowOpen = isAttendanceWindowOpen(attendanceType);
  const isAttendanceTimeBlocked = !isCurrentWindowOpen.isOpen && currentUser?.role !== "superadmin";

  const handleCapture = async () => {
    if (isProcessing || !currentUser) return;
 
    // Lock segera untuk cegah double-click/latency.
    setIsProcessing(true);
    const requestedAttendanceType = attendanceType;


    // === VALIDASI HARI (MINGGU) ===
    // Default: tidak menerima absensi di hari Minggu (WIB).
    // Pengecualian: superadmin atau user dengan bypass_time_restrictions diizinkan.
    const now = new Date();
    const hasBypassTimeRestrictions = currentUser?.bypass_time_restrictions === true;
    if (isSundayWib(now) && currentUser.role !== 'superadmin' && !hasBypassTimeRestrictions) {
      showModal(
        "warning",
        "Hari Minggu",
        `Hari ini ${formatWibWeekdayId(now)}. Sistem presensi tidak menerima pencatatan kehadiran pada hari Minggu.`
      );
      setIsProcessing(false);
      return;
    }
    // === END VALIDASI HARI (MINGGU) ===

    // === VALIDASI HARI LIBUR ===
    // Superadmin atau user dengan bypass_time_restrictions bisa absen di hari libur
    if (todayHoliday && currentUser.role !== 'superadmin' && !hasBypassTimeRestrictions) {
      showModal(
        "warning",
        "Hari Ini Libur",
        `Terimakasih atas semangat Anda, namun mohon maaf saat ini sedang libur karena "${todayHoliday.description}". Sistem presensi tidak menerima presensi pada hari libur.`
      );
      setIsProcessing(false);
      return;
    }
    // === END VALIDASI HARI LIBUR ===

    // === VALIDASI IZIN/CUTI ===
    // Kebijakan baru:
    // - Izin dan Cuti: BLOKIR absensi sepenuhnya
    // - Dinas Luar: BOLEH absen tanpa validasi lokasi
    if (todayLeavePermit) {
      const isLeaveBlockingAbsence = ["izin", "cuti"].includes(
        todayLeavePermit.permit_type
      );

      if (isLeaveBlockingAbsence) {
        const titleByType: Record<string, string> = {
          izin: "Pengajuan Izin Terdeteksi",
          cuti: "Pengajuan Cuti Terdeteksi",
        };

        const messageByType: Record<string, string> = {
          izin: "Anda telah mengajukan izin pada tanggal hari ini. Sistem presensi tidak menerima pencatatan kehadiran selama periode izin berlaku. Terima kasih atas perhatian Anda.",
          cuti: "Anda telah mengajukan cuti pada tanggal hari ini. Sistem presensi tidak menerima pencatatan kehadiran selama periode cuti berlaku. Selamat menikmati waktu istirahat Anda.",
        };

        showModal(
          "info",
          titleByType[todayLeavePermit.permit_type] ?? "Pengajuan Izin/Cuti Terdeteksi",
          messageByType[todayLeavePermit.permit_type] ?? "Anda memiliki izin/cuti yang berlaku hari ini."
        );
        setIsProcessing(false);
        return;
      }
    }
    // === END VALIDASI IZIN/CUTI ===

    // Cek apakah titik absensi sudah dimuat
    // SKIP untuk user dengan dinas luar (boleh absen tanpa validasi lokasi)
    const isDinasLuar = todayLeavePermit?.permit_type === "dinas_luar";
    
    if (!isDinasLuar && loadingLocation) {
      showModal("info", "Memuat Data", "Sedang memuat titik presensi. Mohon tunggu sebentar.");
      setIsProcessing(false);
      return;
    }

    // Cek apakah ada error konfigurasi titik absensi
    if (!isDinasLuar && locationError) {
      showModal("error", "Konfigurasi Tidak Lengkap", locationError);
      setIsProcessing(false);
      return;
    }

    // Cek apakah titik absensi tersedia untuk user ini
    if (!isDinasLuar && !userAttendanceLocation) {
      showModal(
        "error",
        "Titik Presensi Tidak Ditemukan",
        "Titik presensi untuk akun Anda belum dikonfigurasi. Silakan hubungi administrator."
      );
      setIsProcessing(false);
      return;
    }

    if (todayAttendance[requestedAttendanceType]) {
        showModal(
          "info",
          "Sudah Presensi",
          `Anda sudah melakukan ${formatAttendanceTypeLabel(requestedAttendanceType)} hari ini. Anda sudah presensi hari ini.`
        );


      setIsProcessing(false);
      return;
    }

    // Cek apakah sudah lewat midpoint (tengah antara jam masuk dan jam pulang)
    // Menggunakan jam kerja user jika ada, jika tidak gunakan default
    const schedule = userWorkSchedule || DEFAULT_WORK_SCHEDULE;
    const checkInEndMinutes = parseTimeToMinutes(schedule.check_in_end);
    const checkOutStartMinutes = parseTimeToMinutes(schedule.check_out_start);
    const midpointMinutes = Math.floor((checkInEndMinutes + checkOutStartMinutes) / 2);
    
    const { hour: currentWibHour, minute: currentWibMinute } = getWibDateParts(new Date());
    const currentTotalMinutes = currentWibHour * 60 + currentWibMinute;
    const isAfterMidpoint = currentTotalMinutes >= midpointMinutes;

    // Validasi absen masuk sebelum pulang - hanya berlaku sebelum midpoint
    // Setelah midpoint, pengguna bisa langsung absen pulang meskipun belum absen masuk
    if (attendanceType === "pulang" && !todayAttendance.masuk && !isAfterMidpoint) {
      showModal("error", "Belum Presensi Masuk", "Anda harus melakukan presensi masuk terlebih dahulu sebelum presensi pulang.");
      setIsProcessing(false);
      return;
    }

    // Pastikan jam kerja sudah dimuat sebelum validasi window.
    if (!workScheduleLoaded) {
      showModal("info", "Memuat Jam Kerja", "Sedang memuat jam kerja Anda. Mohon coba lagi sebentar.");
      setIsProcessing(false);
      return;
    }

    // Validasi waktu absensi
    const attendanceWindow = isAttendanceWindowOpen(attendanceType);
 
    if (!attendanceWindow.isOpen) {
      const titleText = attendanceType === "masuk" 
        ? "Waktu Presensi Masuk Ditutup" 
        : "Waktu Presensi Pulang Ditutup";
      showModal("error", titleText, attendanceWindow.message);
      setIsProcessing(false);
      return;
    }

    if (!location || !gpsReady) {
      showModal("error", "GPS Belum Siap", "Mohon tunggu hingga lokasi GPS siap. Pastikan izin lokasi sudah diberikan.");
      setIsProcessing(false);
      return;
    }

    const roundedDistanceMeters = Math.max(0, Math.round(distanceFromCampusMeters));
    const radiusThresholdMeters = Math.round(effectiveCampusRadiusMeters);
    
    // BLOKIR ABSENSI JIKA DI LUAR RADIUS
    // KECUALI untuk user dengan dinas luar (boleh absen di mana saja)
    // ATAU user dengan bypass_geofencing=true (akun test atau khusus)
    const hasBypassGeofencing = currentUser?.bypass_geofencing === true;
    if (!isDinasLuar && !hasBypassGeofencing && (locationStatus === "outside" || roundedDistanceMeters > radiusThresholdMeters)) {


      // Untuk user dengan multiple titik absensi
      if (secondaryAttendanceLocations.length > 0 && userAttendanceLocation) {
        const allLocationNames = [
          userAttendanceLocation.location_name,
          ...secondaryAttendanceLocations.map(loc => loc.location_name)
        ];
        const locationNamesStr = allLocationNames.map(name => `"${name}"`).join(", ");
        showModal(
          "warning", 
          "Di Luar Titik Presensi", 
          `Anda berada di luar radius semua titik presensi yang diizinkan. Silakan mendekat ke salah satu lokasi: ${locationNamesStr}.`
        );
      } else {
        const unitKerjaName = userAttendanceLocation.location_name || activeCampusAreaLabel;
        showModal(
          "warning", 
          "Di Luar Titik Presensi", 
          `Anda berada ${roundedDistanceMeters} meter dari titik presensi "${unitKerjaName}". Radius maksimal adalah ${radiusThresholdMeters} meter. Silakan berada di lokasi titik presensi Anda.`
        );
      }
      setIsProcessing(false);
      return;
    }

    // Recheck ke DB untuk mencegah race/submit dobel di hari yang sama.
    try {
      const bounds = getWibDayBoundsUtc(new Date());
      const { data: existingAttendances, error: existingAttendanceError } = await supabase
        .from("attendances")
        .select("id, attendance_type, created_at, note")
        .eq("user_id", currentUser.id)
        .eq("attendance_type", requestedAttendanceType)
        .gte("created_at", bounds.startIsoUtc)
        .lt("created_at", bounds.endIsoUtc);

      const regulerExist = existingAttendances?.filter((a) => !a.note?.includes("[Sesi:"));

      if (!existingAttendanceError && regulerExist && regulerExist.length > 0) {
        showModal(
          "info",
          "Sudah Presensi",
          `Anda sudah melakukan ${formatAttendanceTypeLabel(attendanceType)} hari ini. Anda sudah presensi hari ini.`
        );
        setIsProcessing(false);
        await checkTodayAttendance();
        return;
      }
    } catch {
      // Jika query gagal, lanjutkan; perlindungan utama ada pada constraint unik DB.
    }

    const coords = location;


    const distanceLabel = `${roundedDistanceMeters} m`;
    const radiusLabel = `${radiusThresholdMeters} m`;
    const locationStatusLabel = "Dalam Unit Kerja"; // Karena presensi hanya bisa jika di dalam area
    const locationNote = `Presensi dalam radius ${radiusLabel} (${distanceLabel} dari ${activeCampusAreaLabel})`;

    if (!videoRef.current || !canvasRef.current) {
      showModal("error", "Kamera Tidak Siap", "Mohon pastikan kamera siap sebelum melakukan presensi.");
      setIsProcessing(false);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Set canvas to 1:1 aspect ratio (square)
    // Use the smaller dimension of the video to ensure we crop to square
    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      showModal("error", "Kamera Tidak Siap", "Gagal memproses foto dari kamera. Silakan coba lagi.");
      setIsProcessing(false);
      return;
    }

    // Calculate crop position to center the video content
    const sourceX = (video.videoWidth - size) / 2;
    const sourceY = (video.videoHeight - size) / 2;

    // Draw cropped square image centered from video
    ctx.drawImage(
      video,
      sourceX,
      sourceY,
      size,
      size, // Source crop area (centered square from video)
      0,
      0,
      size,
      size // Destination (full canvas)
    );

    const dataUrl = canvas.toDataURL("image/png");
    setPhoto(dataUrl);

    try {
      const currentAttendanceType = requestedAttendanceType; // Simpan tipe asli sebelum state berubah

      const base64Data = dataUrl.split(",")[1];
      if (!base64Data) {
        throw new Error("Foto presensi tidak valid.");
      }

      // Pastikan identity user lengkap sebelum proses yang irreversible (kirim ke Telegram).
      // Kalau tidak, refresh dulu agar insert DB tidak gagal (kolom username NOT NULL).
      if (isUserIdentityIncomplete(currentUser)) {
        const refreshed = await refreshUserData();
        if (refreshed) setCurrentUser(refreshed);
        // Pakai data refreshed untuk request berikutnya.
        if (isUserIdentityIncomplete(refreshed)) {
          showModal(
            "error",
            "Data Akun Belum Lengkap",
            "Data akun Anda belum lengkap (username/nama). Silakan logout lalu login kembali, atau hubungi admin."
          );
          return;
        }
      }

      const attendanceStatus = calculateStatus(currentAttendanceType);

      const attendanceStatusLabel = formatAttendanceStatusLabel(attendanceStatus) || attendanceStatus;
      const attendanceTypeLabel = formatAttendanceTypeLabel(currentAttendanceType);
      const fileName = `attendance_${currentUser.id}_${Date.now()}.png`;

      const now = new Date();
      const nowIso = now.toISOString();
      const timestampLabel =
        formatDateTimeWIBLabel(nowIso) ??
        new Intl.DateTimeFormat("id-ID", {
          timeZone: WIB_TIME_ZONE,
          dateStyle: "long",
          timeStyle: "medium"
        }).format(now);

      const coordinateLabel = `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
      const humanLocation = locationName || coordinateLabel;
       const effectiveUser = currentUser;
       const displayName = effectiveUser.full_name || effectiveUser.username || String(effectiveUser.id);


      const existingMasukIso = attendanceTimes.masuk ?? null;
      const existingPulangIso = attendanceTimes.pulang ?? null;
      const masukTimeIso = currentAttendanceType === "masuk" ? nowIso : existingMasukIso;
      const pulangTimeIso = currentAttendanceType === "pulang" ? nowIso : existingPulangIso;
      const masukTimeLabel = formatTimeWIBLabel(masukTimeIso);
      const pulangTimeLabel = formatTimeWIBLabel(pulangTimeIso);

      const captionLines: string[] = [
        "✅ Presensi diterima berikut :",
        "===== Profil Tendik =====",
        `👩‍🏫 Nama: ${displayName}`,
        "===== Detail Kehadiran =====",
        `🏢 Presensi masuk diterima pada jam ${masukTimeLabel}`,
        `🏠 Presensi keluar diterima pada jam ${pulangTimeLabel}`,
        `🕘 Jenis Presensi Saat Ini: ${attendanceTypeLabel}`,
        `✅ Status Presensi: ${attendanceStatusLabel}`,
        `📅 Dicatat pada: ${timestampLabel}`,
        `📍 Lokasi: ${humanLocation}`,
        `🏛️ Area Kampus: ${activeCampusAreaLabel}`,
        `📏 Jarak dari Area: ${distanceLabel} (radius ${radiusLabel})`,
        `🛰️ Koordinat: ${coordinateLabel}`,
        `📌 Zona Lokasi: ${locationStatusLabel}`
      ];

      captionLines.push("===== UNES | 2025 =====");

      const telegramMeta = {
        module: "attendance",
        attendanceType: currentAttendanceType,
        attendanceTypeLabel,
        attendanceStatus,
        attendanceStatusLabel,
        userId: String(currentUser.id),
         username: effectiveUser.username,
         fullName: effectiveUser.full_name,
         role: effectiveUser.role,
         isStruktural: effectiveUser.is_struktural ?? false,
         unitKerja: effectiveUser.unit_kerja ?? null,

        timestamp: nowIso,
        attendanceTimes: {
          masuk: masukTimeIso,
          pulang: pulangTimeIso
        },
        location: {
          latitude: coords.lat,
          longitude: coords.lng,
          distanceMeters: roundedDistanceMeters,
          locationName: locationName || null,
          locationStatus,
          locationStatusLabel,
          campusAreaLabel: activeCampusAreaLabel
        },
        distanceFromCampusMeters: roundedDistanceMeters,
        campusRadiusMeters: radiusThresholdMeters,
        campusAreaLabel: activeCampusAreaLabel,
        locationNote
      };

      // Upload foto ke Telegram saja (tidak ke Supabase Storage) - Non-blocking fallback
      let normalizedPhotoUrl = `telegram:file:failed_upload_${Date.now()}`;
      let fileIdRef = "";
      
      try {
        const telegramResult = await uploadAttendanceEvidenceToTelegram(
          base64Data,
          fileName,
          captionLines.join("\n"),
          telegramMeta
        );

        if (telegramResult && telegramResult.ok && telegramResult.result) {
          const photoUrlFromServer = telegramResult.result.photoRef?.trim()
            || telegramResult.result.photoUrl?.trim()
            || (telegramResult.result.fileId ? `telegram:file:${telegramResult.result.fileId}` : "");
          normalizedPhotoUrl = normalizeEvidencePhotoUrl(photoUrlFromServer);
          fileIdRef = telegramResult.result.fileId || "";
        }
      } catch (err) {
        console.error("Error forwarding attendance to Telegram (rate limited/network):", err);
        normalizedPhotoUrl = `telegram:file:rate_limited_${Date.now()}`;
      }

      // Simpan file_id di note untuk referensi (jika diperlukan untuk debugging)
      const noteWithTelegram = fileIdRef
        ? `${locationNote} | Telegram file: ${fileIdRef}`
        : `${locationNote} [Telegram Rate Limited/Busy]`;

      const { data: attendanceData, error: saveError } = await supabaseRpcWithRetry(
        "submit_attendance_server_time",
        {
          p_user_id: currentUser.id,
          p_username: (effectiveUser.username || effectiveUser.full_name || String(effectiveUser.id)).trim(),
          p_photo_url: normalizedPhotoUrl,
          p_latitude: coords.lat,
          p_longitude: coords.lng,
          p_attendance_type: currentAttendanceType,
          p_note: noteWithTelegram,
          p_has_surat_tugas: false,
          p_bukti_dinas_luar_url: null
        }
      );

      if (saveError) throw saveError;

      const createdAt = attendanceData?.created_at ?? nowIso;
      setTodayAttendance((prev) => ({
        ...prev,
        [currentAttendanceType]: true
      }));
      setAttendanceTimes((prev) => ({
        ...prev,
        [currentAttendanceType]: createdAt
      }));

      if (currentAttendanceType === "masuk") {
        setAttendanceType("pulang");
      }

      const successMessage =
        currentAttendanceType === "masuk"
          ? "Presensi Anda telah berhasil dicatat. Selamat bekerja!"
          : "Presensi Anda telah berhasil dicatat. Selamat beristirahat dan sampai jumpa besok dengan semangat baru!";

      showModal("success", `${attendanceTypeLabel} Berhasil`, successMessage);
    } catch (error) {
      console.error("Error saving attendance:", error);
      const rawMessage = typeof (error as { message?: string })?.message === "string"
        ? (error as { message?: string }).message!.toLowerCase()
        : "";

      if (isCheckConstraintViolation(error, "attendances_not_sunday_wib")) {
        if (currentUser.role === "superadmin") {
          showModal(
            "warning",
            "Hari Minggu",
            "Akun superadmin sudah diizinkan dari sisi aplikasi, namun database masih memblokir penyimpanan presensi di hari Minggu (constraint attendances_not_sunday_wib)."
          );
        } else {
          showModal(
            "warning",
            "Hari Minggu",
            "Sistem presensi ditutup pada hari Minggu (WIB). Pencatatan kehadiran tidak dapat disimpan."
          );
        }
      } else if (
        isUniqueConstraintViolation(error, "uniq_attendance_user_type_day_wib") ||
        rawMessage.includes("sudah melakukan")
      ) {
        showModal(
          "info",
          "Sudah Presensi",
          `Anda sudah melakukan ${formatAttendanceTypeLabel(requestedAttendanceType)} hari ini. Anda sudah presensi hari ini.`
        );
        await checkTodayAttendance();
      } else if (rawMessage.includes("absen masuk belum dibuka") || rawMessage.includes("presensi masuk belum dibuka")) {
        showModal(
          "error",
          "Waktu Presensi Masuk Ditutup",
          "Presensi masuk belum dibuka. Silakan presensi pada jam masuk yang ditentukan."
        );
      } else if (rawMessage.includes("absen masuk sudah ditutup") || rawMessage.includes("presensi masuk sudah ditutup")) {
        showModal(
          "error",
          "Waktu Presensi Masuk Ditutup",
          "Presensi masuk sudah ditutup."
        );
      } else if (rawMessage.includes("absen pulang belum dibuka") || rawMessage.includes("presensi pulang belum dibuka")) {
        showModal(
          "error",
          "Waktu Presensi Pulang Ditutup",
          "Presensi pulang belum dibuka. Silakan presensi setelah jam pulang dimulai."
        );
      } else if (rawMessage.includes("absen pulang sudah ditutup") || rawMessage.includes("presensi pulang sudah ditutup")) {
        showModal(
          "error",
          "Waktu Presensi Pulang Ditutup",
          "Presensi pulang sudah ditutup."
        );
      } else if (rawMessage.includes("hari ini libur")) {
        showModal(
          "warning",
          "Hari Ini Libur",
          "Hari ini terdaftar sebagai hari libur, sehingga presensi ditutup."
        );
      } else if (rawMessage.includes("izin/cuti aktif")) {
        showModal(
          "info",
          "Izin/Cuti Aktif",
          "Anda memiliki izin atau cuti aktif hari ini, sehingga presensi tidak dapat dilakukan."
        );
      } else {
        showModal(
          "error",
          `${formatAttendanceTypeLabel(attendanceType)} Gagal`,
          "Wajah tidak terdeteksi, upload foto gagal, atau lokasi tidak sesuai. Silakan coba lagi."
        );
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full h-screen h-[100dvh] flex flex-col bg-white dark:bg-slate-950 overflow-hidden font-sans select-none animate-page-in touch-none">
      <style>{`
        @keyframes scan-line {
          0% { transform: translateY(-100%); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(250%); opacity: 0; }
        }
        .scan-line { animation: scan-line 3s linear infinite; }
        @keyframes pulse-border {
          0%, 100% { border-color: rgba(140, 27, 29, 0.3); }
          50% { border-color: rgba(140, 27, 29, 1); }
        }
        .pulse-border { animation: pulse-border 2s ease-in-out infinite; }
      `}</style>
      
      <div className="w-full flex-1 flex flex-col max-w-md mx-auto relative overflow-hidden h-full">
        {/* Header - Compact & High Contrast */}
        <header className="shrink-0 flex items-center justify-between px-4 h-14 bg-[#8c1b1d] text-white">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 active:bg-black/10 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 stroke-[3px]" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-black uppercase tracking-tight leading-none">
              {formatAttendanceTypeLabel(attendanceType)}
            </h1>
            <p className="text-[10px] font-bold opacity-90 uppercase mt-0.5 tracking-wider">
              {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="w-8 h-8 bg-white rounded-lg p-1">
            <img alt="Logo" className="w-full h-full object-contain" src="/unes.png" />
          </div>
        </header>

        <main className="flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-900 overflow-hidden">
          {/* Camera Section - Balanced Height for Elderly Accessibility */}
          <div className="relative flex-initial h-[42vh] camera-section bg-black overflow-hidden border-b-4 border-slate-200 dark:border-slate-800">
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              muted
              playsInline
              autoPlay
              style={{ transform: "scaleX(-1)" }}
            />
            
            {/* High Contrast Overlays */}
            <div className={`absolute top-4 left-4 right-4 py-3 px-4 rounded-xl border-2 text-center shadow-2xl backdrop-blur-md z-10 transition-colors duration-300 ${
              locationStatus === 'inside'
                ? 'bg-emerald-600 border-white text-white'
                : 'bg-rose-600 border-white text-white'
            }`}>
              <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 rounded-full bg-white animate-pulse shadow-[0_0_10px_white]" />
                <span className="text-sm font-black uppercase tracking-wide">
                  {locationStatus === 'inside' ? 'LOKASI SESUAI (SIAP)' : 'DI LUAR AREA PRESENSI'}
                </span>
              </div>
            </div>

            {/* Scanning Guide - Compactized for smaller camera box */}
            <div className="absolute inset-8 sm:inset-10 border-2 border-white/40 rounded-3xl pointer-events-none">
               <div className="scan-line absolute inset-x-0 h-1 bg-white shadow-[0_0_20px_white]" />
               <div className="absolute -top-1 -left-1 w-10 h-10 border-t-8 border-l-8 border-[#8c1b1d] rounded-tl-xl" />
               <div className="absolute -top-1 -right-1 w-10 h-10 border-t-8 border-r-8 border-[#8c1b1d] rounded-tr-xl" />
               <div className="absolute -bottom-1 -left-1 w-10 h-10 border-b-8 border-l-8 border-[#8c1b1d] rounded-bl-xl" />
               <div className="absolute -bottom-1 -right-1 w-10 h-10 border-b-8 border-r-8 border-[#8c1b1d] rounded-br-xl" />
            </div>
          </div>

          {/* Info Section - Solid Colors & Big Text */}
          <div className="shrink-0 p-2 sm:p-3 space-y-2 info-section bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            {/* Status Grid */}
            <div className="grid grid-cols-2 gap-2 grid-stats">
              <div className={`p-1.5 rounded-xl border-4 transition-all ${todayAttendance.masuk ? 'bg-emerald-50 border-emerald-500' : 'bg-slate-100 border-slate-200'}`}>
                <p className="text-[9px] font-black uppercase text-slate-500 mb-0">MASUK</p>
                <div className="flex items-baseline gap-1">
                  <p className={`text-base font-black leading-tight ${todayAttendance.masuk ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {todayAttendance.masuk ? formatTimeWIBLabel(attendanceTimes.masuk).split(' ')[0] : '--:--'}
                  </p>
                  <span className="text-[9px] font-bold text-slate-400 italic">WIB</span>
                </div>
              </div>
              <div className={`p-1.5 rounded-xl border-4 transition-all ${todayAttendance.pulang ? 'bg-blue-50 border-blue-500' : 'bg-slate-100 border-slate-200'}`}>
                <p className="text-[9px] font-black uppercase text-slate-500 mb-0">PULANG</p>
                <div className="flex items-baseline gap-1">
                  <p className={`text-base font-black leading-tight ${todayAttendance.pulang ? 'text-blue-700' : 'text-slate-400'}`}>
                    {todayAttendance.pulang ? formatTimeWIBLabel(attendanceTimes.pulang).split(' ')[0] : '--:--'}
                  </p>
                  <span className="text-[9px] font-bold text-slate-400 italic">WIB</span>
                </div>
              </div>
            </div>

            {/* Multi-Location Status Grid */}
            {!loadingLocation && (userAttendanceLocation || secondaryAttendanceLocations.length > 0) && (
              <div className={`grid gap-2 mb-1 ${secondaryAttendanceLocations.length > 0 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {/* Primary Location */}
                {userAttendanceLocation && (
                  <div className={`p-2 rounded-xl border-2 flex flex-col justify-between min-h-[54px] transition-all ${primaryLocationStatus === 'inside' ? 'bg-emerald-600 border-emerald-700 text-white shadow-md' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 opacity-80'}`}>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <MapPin className={`w-3 h-3 shrink-0 ${primaryLocationStatus === 'inside' ? 'text-white' : 'text-[#8c1b1d]'}`} />
                      <h2 className="text-[10px] font-black uppercase leading-[1.1] break-words">
                        {userAttendanceLocation.location_name}
                      </h2>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className={`text-[10px] font-bold ${primaryLocationStatus === 'inside' ? 'text-white' : 'text-slate-500'}`}>
                        {primaryDistanceMeters < 1000 ? `${Math.round(primaryDistanceMeters)}m` : `${(primaryDistanceMeters/1000).toFixed(1)}km`}
                      </p>
                      {primaryLocationStatus === 'inside' && <CheckCircle className="w-3.5 h-3.5 text-white animate-pulse" />}
                    </div>
                  </div>
                )}

                {/* Secondary Locations (Max 1 display to keep grid clean, or map all) */}
                {secondaryAttendanceLocations.map((secLoc) => {
                  const statusInfo = secondaryLocationStatuses.find(s => s.location.id === secLoc.id);
                  const isInside = statusInfo?.status === 'inside';
                  const distance = statusInfo?.distance ?? 0;
                  
                  return (
                    <div key={secLoc.id} className={`p-2 rounded-xl border-2 flex flex-col justify-between min-h-[54px] transition-all ${isInside ? 'bg-emerald-600 border-emerald-700 text-white shadow-md' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 opacity-80'}`}>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Building2 className={`w-3 h-3 shrink-0 ${isInside ? 'text-white' : 'text-[#8c1b1d]'}`} />
                        <h2 className="text-[10px] font-black uppercase leading-[1.1] break-words">
                          {secLoc.location_name}
                        </h2>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className={`text-[10px] font-bold ${isInside ? 'text-white' : 'text-slate-500'}`}>
                          {distance < 1000 ? `${Math.round(distance)}m` : `${(distance/1000).toFixed(1)}km`}
                        </p>
                        {isInside && <CheckCircle className="w-3.5 h-3.5 text-white animate-pulse" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Error/Notice Messages - Big & Bold */}
            <div className="empty:hidden">
              {locationStatus === "outside" && gpsReady && todayLeavePermit?.permit_type !== 'dinas_luar' && (
                <div className="bg-rose-100 border-2 border-rose-500 p-2 rounded-lg flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <p className="text-[10px] font-black text-rose-700 uppercase leading-tight">
                    POSISI DI LUAR RADIUS. DEKATI TITIK LOKASI!
                  </p>
                </div>
              )}
            </div>

            {/* Action Button - Massive & High Contrast */}
            <div className="pb-1 action-button-container">
              <button
                onClick={handleCapture}
                disabled={
                  isProcessing || !gpsReady || loadingLocation || todayAttendance[attendanceType] ||
                  (locationStatus !== "inside" && todayLeavePermit?.permit_type !== 'dinas_luar') ||
                  !!locationError
                }
                className={`w-full py-3 sm:py-4 action-button rounded-xl flex flex-col items-center justify-center gap-1 shadow-[0_4px_0_0_rgba(0,0,0,0.15)] active:shadow-none active:translate-y-1 transition-all ${
                  isProcessing || !gpsReady || loadingLocation
                    ? "bg-slate-300 text-slate-500 border-b-4 border-slate-400"
                    : todayAttendance[attendanceType]
                      ? "bg-emerald-600 text-white border-b-4 border-emerald-800"
                      : isAttendanceTimeBlocked
                        ? "bg-slate-400 text-white border-b-4 border-slate-500 opacity-90"
                      : (locationStatus === "outside" && todayLeavePermit?.permit_type !== 'dinas_luar')
                        ? "bg-slate-400 text-white border-b-4 border-slate-500 opacity-60"
                        : "bg-[#8c1b1d] text-white border-b-4 border-[#6b1516]"
                }`}
              >
                {isProcessing ? (
                  <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="text-lg sm:text-xl font-black uppercase tracking-tighter leading-none">
                      {todayAttendance[attendanceType] ? "SUDAH SELESAI" : isAttendanceTimeBlocked ? "WAKTU PRESENSI DITUTUP" : "SIMPAN PRESENSI"}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-bold opacity-80 uppercase tracking-widest mt-0.5">
                      {isAttendanceTimeBlocked ? "TEKAN UNTUK INFO" : "TEKAN TOMBOL DISINI"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Fullscreen Success/Error Overlay */}
      {loadingOverlay.show && (
        <div className="fixed inset-0 z-[100] bg-[#8c1b1d] flex flex-col items-center justify-center p-8 text-white">
          <div className="w-24 h-24 border-8 border-white/20 border-t-white rounded-full animate-spin mb-8" />
          <h2 className="text-3xl font-black uppercase text-center">{loadingOverlay.message}</h2>
          <p className="text-lg font-bold opacity-80 mt-4 text-center">{loadingOverlay.subMessage}</p>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-[110] bg-black/95 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl overflow-hidden border-8 border-[#8c1b1d]">
             <div className={`w-20 h-20 mx-auto mb-6 flex items-center justify-center rounded-2xl ${
               modalType === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
             }`}>
                {modalType === 'success' ? <CheckCircle className="w-12 h-12" /> : <AlertCircle className="w-12 h-12" />}
             </div>
             <h2 className="text-2xl font-black text-slate-900 uppercase mb-2">{modalTitle}</h2>
             <p className="text-slate-600 font-bold text-lg mb-8 leading-tight">{modalMessage}</p>
             <button
               onClick={() => setModalOpen(false)}
               className="w-full py-5 bg-[#8c1b1d] text-white rounded-2xl text-xl font-black uppercase shadow-lg active:scale-95 transition-transform"
             >
               KEMBALI
             </button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
