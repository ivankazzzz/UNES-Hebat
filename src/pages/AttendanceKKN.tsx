"use client";

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { getCurrentUser, type AuthUser } from "@/lib/auth";
import {
  ArrowLeft,
  MapPin,
  CheckCircle,
  AlertCircle
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

const WIB_TIME_ZONE = "Asia/Jakarta";

// Target pembekalan KKN: Gedung A
const KKN_TARGET_LAT = -0.9387835;
const KKN_TARGET_LNG = 100.3561079;
const KKN_TARGET_RADIUS = 150; // meter
const KKN_LOCATION_LABEL = "Gedung A (Auditorium)";

const KKN_SESSIONS_DISPLAY = [
  { key: "Sabtu Sesi 1", label: "Sabtu Sesi 1", type: "masuk" },
  { key: "Sabtu Sesi 2", label: "Sabtu Sesi 2", type: "masuk" },
  { key: "Sabtu Sesi 3", label: "Sabtu Sesi 3", type: "pulang" },
  { key: "Minggu Sesi 1", label: "Minggu Sesi 1", type: "masuk" },
  { key: "Minggu Sesi 2", label: "Minggu Sesi 2", type: "masuk" },
  { key: "Minggu Sesi 3", label: "Minggu Sesi 3", type: "masuk" },
  { key: "Minggu Sesi 4", label: "Minggu Sesi 4", type: "masuk" },
  { key: "Minggu Sesi 5", label: "Minggu Sesi 5", type: "pulang" },
  { key: "Pelepasan KKN", label: "Pelepasan KKN", type: "masuk" }
];

const ATTENDANCE_TELEGRAM_CHAT_ID =
  (import.meta.env.VITE_ATTENDANCE_TELEGRAM_CHAT_ID as string | undefined) ??
  "-1003486972781";

const getWibDateParts = (date: Date) => {
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

  return {
    startIsoUtc: startUtc.toISOString(),
    endIsoUtc: endUtc.toISOString()
  };
};

export default function AttendanceKKN() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  // Geolocation states
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  const streamRef = useRef<MediaStream | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Riwayat Kehadiran KKN
  const [kknAttendanceMap, setKknAttendanceMap] = useState<Record<string, string>>({});

  const [activeSessionLabel, setActiveSessionLabel] = useState<string | null>(null);

  // Modal & Overlay states (disamakan dengan Attendance.tsx)
  const [loadingOverlay, setLoadingOverlay] = useState<{
    show: boolean;
    message: string;
    subMessage: string;
  }>({
    show: false,
    message: "",
    subMessage: ""
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"success" | "error">("success");
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  const showModal = (
    type: "success" | "error",
    title: string,
    message: string
  ) => {
    setModalType(type);
    setModalTitle(title);
    setModalMessage(message);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    if (modalType === "success") {
      navigate("/");
    }
  };

  // Hitung jarak Haversine (dalam meter)
  const calculateDistanceMeters = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3;
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // Memeriksa riwayat absensi untuk seluruh sesi KKN
  const checkKknAttendance = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("attendances")
        .select("created_at, note")
        .eq("user_id", userId);
        
      if (data) {
        const mapping: Record<string, string> = {};
        data.forEach(a => {
          if (a.note) {
            if (a.note.includes("Sabtu Sesi 1")) mapping["Sabtu Sesi 1"] = a.created_at;
            else if (a.note.includes("Sabtu Sesi 2")) mapping["Sabtu Sesi 2"] = a.created_at;
            else if (a.note.includes("Sabtu Sesi 3")) mapping["Sabtu Sesi 3"] = a.created_at;
            else if (a.note.includes("Minggu Sesi 1")) mapping["Minggu Sesi 1"] = a.created_at;
            else if (a.note.includes("Minggu Sesi 2")) mapping["Minggu Sesi 2"] = a.created_at;
            else if (a.note.includes("Minggu Sesi 3")) mapping["Minggu Sesi 3"] = a.created_at;
            else if (a.note.includes("Minggu Sesi 4")) mapping["Minggu Sesi 4"] = a.created_at;
            else if (a.note.includes("Minggu Sesi 5")) mapping["Minggu Sesi 5"] = a.created_at;
            else if (a.note.includes("Pelepasan KKN")) mapping["Pelepasan KKN"] = a.created_at;
          }
        });
        setKknAttendanceMap(mapping);
      }
    } catch (err) {
      console.error("Error checking KKN attendance history:", err);
    }
  };

  // Mengambil sesi KKN aktif saat ini berdasarkan server time (WIB)
  const fetchActiveSession = async (userId?: string, isTestUser = false) => {
    try {
      if (isTestUser && userId) {
        const { data: attData } = await supabase
          .from("attendances")
          .select("note")
          .eq("user_id", userId);
          
        const hasSabtuS1 = attData?.some(a => a.note && a.note.includes("Sabtu Sesi 1")) || false;
        const hasSabtuS2 = attData?.some(a => a.note && a.note.includes("Sabtu Sesi 2")) || false;
        const hasSabtuS3 = attData?.some(a => a.note && a.note.includes("Sabtu Sesi 3")) || false;
        const hasMingguS1 = attData?.some(a => a.note && a.note.includes("Minggu Sesi 1")) || false;
        const hasMingguS2 = attData?.some(a => a.note && a.note.includes("Minggu Sesi 2")) || false;
        const hasMingguS3 = attData?.some(a => a.note && a.note.includes("Minggu Sesi 3")) || false;
        const hasMingguS4 = attData?.some(a => a.note && a.note.includes("Minggu Sesi 4")) || false;
        const hasMingguS5 = attData?.some(a => a.note && a.note.includes("Minggu Sesi 5")) || false;
        const hasPelepasan = attData?.some(a => a.note && a.note.includes("Pelepasan KKN")) || false;
        
        if (!hasSabtuS1) {
          setActiveSessionLabel("Sabtu Sesi 1");
        } else if (!hasSabtuS2) {
          setActiveSessionLabel("Sabtu Sesi 2");
        } else if (!hasSabtuS3) {
          setActiveSessionLabel("Sabtu Sesi 3");
        } else if (!hasMingguS1) {
          setActiveSessionLabel("Minggu Sesi 1");
        } else if (!hasMingguS2) {
          setActiveSessionLabel("Minggu Sesi 2");
        } else if (!hasMingguS3) {
          setActiveSessionLabel("Minggu Sesi 3");
        } else if (!hasMingguS4) {
          setActiveSessionLabel("Minggu Sesi 4");
        } else if (!hasMingguS5) {
          setActiveSessionLabel("Minggu Sesi 5");
        } else if (!hasPelepasan) {
          setActiveSessionLabel("Pelepasan KKN");
        } else {
          setActiveSessionLabel("Semua Sesi KKN Selesai");
        }
        return;
      }

      const now = new Date();
      const { year, month, day, hour, minute } = getWibDateParts(now);
      const todayStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const timeStr = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
      
      const { data, error } = await supabase
        .from("kkn_sessions")
        .select("session_name, start_time, end_time")
        .eq("session_date", todayStr);
        
      if (error) {
        console.error("Error fetching active session:", error);
        return;
      }
      
      if (data && data.length > 0) {
        // Cari sesi yang waktunya mencakup timeStr
        const matched = data.find((s) => {
          const start = s.start_time.substring(0, 5);
          const end = s.end_time.substring(0, 5);
          const current = timeStr.substring(0, 5);
          
          // Tambahkan toleransi 1 menit ke end time
          const [endH, endM] = end.split(":").map(Number);
          let tolM = endM + 1;
          let tolH = endH;
          if (tolM >= 60) {
            tolM = 0;
            tolH = (tolH + 1) % 24;
          }
          const endTol = `${String(tolH).padStart(2, "0")}:${String(tolM).padStart(2, "0")}`;
          
          return current >= start && current <= endTol;
        });
        
        if (matched) {
          setActiveSessionLabel(matched.session_name);
        } else {
          setActiveSessionLabel("Tidak Ada Sesi Aktif");
        }
      } else {
        setActiveSessionLabel("Tidak Ada Sesi Hari Ini");
      }
    } catch (err) {
      console.error("Error matching active session:", err);
    }
  };

  // Mengambil user dari auth
  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      navigate("/login");
      return;
    }
    setCurrentUser(user);
    const isTest = user.username === '12345678';
    checkKknAttendance(user.id);
    fetchActiveSession(user.id, isTest);

    // Jika test account, set GPS ke ready
    if (isTest) {
      setLoadingLocation(false);
      setLocationError(null);
      setLocation({ lat: KKN_TARGET_LAT, lng: KKN_TARGET_LNG });
      setDistance(0);
      setGpsAccuracy(1.0);
    }
  }, [navigate]);

  // Request & monitoring lokasi GPS
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation tidak didukung pada browser Anda.");
      setLoadingLocation(false);
      return;
    }

    const handleSuccess = (position: GeolocationPosition) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const accuracy = position.coords.accuracy;

      setLocation({ lat, lng });
      setGpsAccuracy(accuracy);

      const d = calculateDistanceMeters(lat, lng, KKN_TARGET_LAT, KKN_TARGET_LNG);
      setDistance(d);
      setLoadingLocation(false);
      setLocationError(null);
    };

    const handleError = (error: GeolocationPositionError) => {
      console.error("GPS error:", error);
      let errMsg = "Gagal mengambil koordinat GPS.";
      if (error.code === error.PERMISSION_DENIED) {
        errMsg = "Izin akses lokasi ditolak. Mohon aktifkan GPS pada browser Anda.";
      }
      setLocationError(errMsg);
      setLoadingLocation(false);
    };

    watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000
    });

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Request & inisialisasi kamera depan
  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Kamera tidak didukung pada perangkat ini.");
      return;
    }

    const startCamera = async () => {
      try {
        setLoadingOverlay({
          show: true,
          message: "Meminta Akses Kamera",
          subMessage: "Mohon izinkan akses kamera pada browser Anda..."
        });

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }

        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        const videoEl = videoRef.current;
        if (videoEl) {
          videoEl.srcObject = stream;
          await new Promise<void>((resolve) => {
            videoEl.onloadedmetadata = () => resolve();
          });
          await videoEl.play();
          setCameraReady(true);
        }
        setLoadingOverlay({ show: false, message: "", subMessage: "" });
      } catch (err) {
        console.error("Error starting camera:", err);
        setCameraError("Gagal mengaktifkan kamera depan. Pastikan izin kamera aktif.");
        setLoadingOverlay({ show: false, message: "", subMessage: "" });
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

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
        // Hanya retry jika error mengandung indikasi kegagalan jaringan/fetch
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

  // Kirim bukti foto ke Telegram
  const uploadToTelegram = async (
    base64Data: string,
    fileName: string,
    caption: string,
    meta: Record<string, unknown>
  ): Promise<TelegramEvidenceResponse> => {
    const response = await fetch("/api/telegram-evidence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName,
        fileType: "image/png",
        fileBase64: base64Data,
        caption,
        targetChatId: ATTENDANCE_TELEGRAM_CHAT_ID,
        meta
      })
    });

    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || "Gagal mengirim foto ke Telegram.");
    }
    return payload;
  };

  const handleCapture = async () => {
    if (isProcessing || !currentUser) return;
    setIsProcessing(true);

    // 1. Validasi Lokasi (kecuali jika user dibypass)
    const isBypassLocation = currentUser.bypass_geofencing === true || currentUser.username === '12345678';
    if (!isBypassLocation) {
      if (loadingLocation) {
        showModal("error", "Memuat GPS", "Sedang memuat data lokasi. Mohon tunggu...");
        setIsProcessing(false);
        return;
      }
      if (locationError || !location) {
        showModal("error", "GPS Bermasalah", locationError || "Koordinat GPS tidak ditemukan.");
        setIsProcessing(false);
        return;
      }
      if (distance === null || distance > KKN_TARGET_RADIUS) {
        showModal(
          "error",
          "Di Luar Radius",
          `Anda terdeteksi sejauh ${distance ? distance.toFixed(0) : "?"}m dari ${KKN_LOCATION_LABEL}. Batas radius absensi KKN adalah ${KKN_TARGET_RADIUS}m.`
        );
        setIsProcessing(false);
        return;
      }
    }

    // 2. Ambil Frame dari Video
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !cameraReady) {
      showModal("error", "Kamera Belum Siap", "Silakan tunggu hingga stream kamera aktif.");
      setIsProcessing(false);
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setIsProcessing(false);
      return;
    }

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64Data = canvas.toDataURL("image/png").replace(/^data:image\/png;base64,/, "");

    const now = new Date();
    const formatter = new Intl.DateTimeFormat("id-ID", {
      timeZone: WIB_TIME_ZONE,
      dateStyle: "long",
      timeStyle: "medium"
    });
    const nowStrWib = formatter.format(now);
    const fileName = `KKN_${currentUser.id}_${now.getTime()}.png`;

    // 3. Susun Caption Telegram
    const roundedDistance = distance !== null ? Math.round(distance) : 0;
    const captionLines = [
      `📸 *BUKTI KEHADIRAN PEMBEKALAN KKN*`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `👤 *Nama*: ${currentUser.full_name}`,
      `🔑 *Username/BP*: ${currentUser.username}`,
      `⏰ *Waktu*: ${nowStrWib} WIB`,
      `📍 *Lokasi*: ${KKN_LOCATION_LABEL}`,
      `📐 *Jarak*: ${isBypassLocation ? "Bypass (Akses Jauh)" : `${roundedDistance} meter`}`,
      `🛰️ *Akurasi GPS*: ${gpsAccuracy ? `${gpsAccuracy.toFixed(1)}m` : "?"}`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `System: Absensi UNES-AAI`
    ];

    const telegramMeta = {
      userId: currentUser.id,
      username: currentUser.username,
      fullName: currentUser.full_name,
      timestamp: now.toISOString(),
      location: {
        latitude: location?.lat || null,
        longitude: location?.lng || null,
        distanceMeters: roundedDistance,
        locationName: KKN_LOCATION_LABEL
      }
    };

    try {
      setLoadingOverlay({
        show: true,
        message: "Memproses Absen KKN",
        subMessage: "Mengirim bukti kehadiran dan menyimpan data..."
      });

      // 4. Upload Ke Telegram (Non-blocking fallback)
      let photoUrl = `telegram:file:rate_limited_${Date.now()}`;
      try {
        const telegramResult = await uploadToTelegram(
          base64Data,
          fileName,
          captionLines.join("\n"),
          telegramMeta
        );
        const fileId = telegramResult.result?.fileId;
        if (fileId) {
          photoUrl = `telegram:file:${fileId}`;
        }
      } catch (tgErr) {
        console.error("Telegram evidence upload failed (rate limited/network):", tgErr);
        // Tetap biarkan berjalan dengan photoUrl fallback agar absen sukses disimpan ke DB
      }

      // 5. Panggil RPC KKN di Supabase (dengan retry network)
      const { data: attendanceData, error: saveError } = await supabaseRpcWithRetry(
        "submit_attendance_kkn",
        {
          p_user_id: currentUser.id,
          p_username: (currentUser.username || currentUser.full_name || String(currentUser.id)).trim(),
          p_photo_url: photoUrl,
          p_latitude: location?.lat || KKN_TARGET_LAT,
          p_longitude: location?.lng || KKN_TARGET_LNG,
          p_note: `Absen KKN via Web | Jarak: ${roundedDistance}m`
        }
      );

      if (saveError) throw saveError;

      setLoadingOverlay({ show: false, message: "", subMessage: "" });
      
      // Sukses
      showModal(
        "success",
        "Presensi KKN Berhasil",
        `Presensi Pembekalan KKN anda untuk ${activeSessionLabel} telah berhasil dicatat terima kasih`
      );
    } catch (error: any) {
      setLoadingOverlay({ show: false, message: "", subMessage: "" });
      console.error("Error saving KKN attendance:", error);
      const rawMessage = error?.message?.toLowerCase() || "";

      if (rawMessage.includes("sudah melakukan")) {
        showModal(
          "error",
          "Sudah Absen",
          `Anda sudah melakukan absensi untuk sesi pembekalan KKN ini.`
        );
      } else if (rawMessage.includes("tidak ada sesi")) {
        showModal(
          "error",
          "Sesi Ditutup",
          "Tidak ada sesi absensi pembekalan KKN yang aktif saat ini. Mohon absen sesuai jadwal sesi."
        );
      } else {
        showModal(
          "error",
          "Absensi Gagal",
          error?.message || "Terjadi kesalahan sistem saat memproses absensi. Silakan coba lagi."
        );
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper format jam WIB untuk card stats
  const formatTimeWibOnly = (isoStringStr: string | null) => {
    if (!isoStringStr) return "--:--";
    try {
      const date = new Date(isoStringStr);
      const wibTime = date.getTime() + (7 * 60 * 60 * 1000);
      const wibDate = new Date(wibTime);
      const hours = String(wibDate.getUTCHours()).padStart(2, "0");
      const minutes = String(wibDate.getUTCMinutes()).padStart(2, "0");
      return `${hours}:${minutes}`;
    } catch {
      return "--:--";
    }
  };

  const locationStatus = distance === null || distance > KKN_TARGET_RADIUS ? "outside" : "inside";
  const isBypassLocation = currentUser?.bypass_geofencing === true || currentUser?.username === '12345678';

  const isValidActiveSession = activeSessionLabel && 
    activeSessionLabel !== "Tidak Ada Sesi Aktif" && 
    activeSessionLabel !== "Tidak Ada Sesi Hari Ini" && 
    activeSessionLabel !== "Semua Sesi KKN Selesai";

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
        {/* Header - Disamakan Persis dengan Attendance.tsx */}
        <header className="shrink-0 flex items-center justify-between px-4 h-14 bg-[#8c1b1d] text-white">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 active:bg-black/10 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 stroke-[3px]" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-black uppercase tracking-tight leading-none">
              ABSEN KKN
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
          {/* Camera Section - Disamakan Persis dengan Attendance.tsx */}
          <div className="relative flex-initial h-[38vh] camera-section bg-black overflow-hidden border-b-4 border-slate-200 dark:border-slate-800">
            {cameraError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white space-y-4">
                <AlertCircle className="w-12 h-12 text-[#fbbf24] animate-bounce" />
                <p className="text-sm font-semibold">{cameraError}</p>
              </div>
            ) : (
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                muted
                playsInline
                autoPlay
                style={{ transform: "scaleX(-1)" }}
              />
            )}
            
            {/* High Contrast Overlays */}
            <div className={`absolute top-4 left-4 right-4 py-3 px-4 rounded-xl border-2 text-center shadow-2xl backdrop-blur-md z-10 transition-colors duration-300 ${
              isBypassLocation || locationStatus === 'inside'
                ? 'bg-emerald-600 border-white text-white'
                : 'bg-rose-600 border-white text-white'
            }`}>
              <div className="flex flex-col items-center justify-center gap-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-white animate-pulse shadow-[0_0_10px_white]" />
                  <span className="text-sm font-black uppercase tracking-wide">
                    {isBypassLocation || locationStatus === 'inside' ? 'LOKASI SESUAI (SIAP)' : 'DI LUAR AREA ABSENSI'}
                  </span>
                </div>
                {activeSessionLabel && (
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 animate-pulse mt-0.5">
                    {activeSessionLabel}
                  </span>
                )}
              </div>
            </div>

            {/* Scanning Guide Box */}
            <div className="absolute inset-8 sm:inset-10 border-2 border-white/40 rounded-3xl pointer-events-none">
               <div className="scan-line absolute inset-x-0 h-1 bg-white shadow-[0_0_20px_white]" />
               <div className="absolute -top-1 -left-1 w-10 h-10 border-t-8 border-l-8 border-[#8c1b1d] rounded-tl-xl" />
               <div className="absolute -top-1 -right-1 w-10 h-10 border-t-8 border-r-8 border-[#8c1b1d] rounded-tr-xl" />
               <div className="absolute -bottom-1 -left-1 w-10 h-10 border-b-8 border-l-8 border-[#8c1b1d] rounded-bl-xl" />
               <div className="absolute -bottom-1 -right-1 w-10 h-10 border-b-8 border-r-8 border-[#8c1b1d] rounded-br-xl" />
            </div>
          </div>

          {/* Info Section - Disamakan Persis dengan Attendance.tsx */}
          <div className="shrink-0 p-2 sm:p-3 space-y-2 info-section bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            {/* Status Grid KKN */}
            <div className="grid grid-cols-3 gap-1.5 grid-stats">
              {KKN_SESSIONS_DISPLAY.map((s) => {
                const recordedTime = kknAttendanceMap[s.key];
                const hasAttended = !!recordedTime;
                
                return (
                  <div 
                    key={s.key} 
                    className={`p-1 rounded-lg border-2 text-center transition-all ${
                      hasAttended 
                        ? s.type === 'masuk'
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                          : 'bg-blue-50 border-blue-400 text-blue-800'
                        : 'bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-700'
                    }`}
                  >
                    <p className="text-[8px] font-black uppercase tracking-tight mb-0.5 leading-none">{s.label}</p>
                    <div className="flex items-baseline justify-center gap-0.5">
                      <p className={`text-[11px] font-black leading-tight ${hasAttended ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}`}>
                        {hasAttended ? formatTimeWibOnly(recordedTime) : "--:--"}
                      </p>
                      {hasAttended && <span className="text-[7px] font-bold text-slate-400 italic">WIB</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Target Location Card */}
            {!loadingLocation && (
              <div className="grid grid-cols-1 gap-2 mb-1">
                <div className={`p-2 rounded-xl border-2 flex flex-col justify-between min-h-[54px] transition-all ${isBypassLocation || locationStatus === 'inside' ? 'bg-emerald-600 border-emerald-700 text-white shadow-md' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 opacity-80'}`}>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <MapPin className={`w-3 h-3 shrink-0 ${isBypassLocation || locationStatus === 'inside' ? 'text-white' : 'text-[#8c1b1d]'}`} />
                    <h2 className="text-[10px] font-black uppercase leading-[1.1] break-words">
                      {KKN_LOCATION_LABEL}
                    </h2>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className={`text-[10px] font-bold ${isBypassLocation || locationStatus === 'inside' ? 'text-white' : 'text-slate-500'}`}>
                      {distance === null ? "?" : distance < 1000 ? `${Math.round(distance)}m` : `${(distance/1000).toFixed(1)}km`}
                    </p>
                    {(isBypassLocation || locationStatus === 'inside') && <CheckCircle className="w-3.5 h-3.5 text-white animate-pulse" />}
                  </div>
                </div>
              </div>
            )}

            {/* Error/Notice Messages */}
            <div className="empty:hidden">
              {!isBypassLocation && locationStatus === "outside" && !loadingLocation && (
                <div className="bg-rose-100 border-2 border-rose-500 p-2 rounded-lg flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <p className="text-[10px] font-black text-rose-700 uppercase leading-tight">
                    POSISI DI LUAR RADIUS. DEKATI TITIK LOKASI!
                  </p>
                </div>
              )}
            </div>

            {/* Action Button - Massive 3D Style */}
            <div className="pb-1 action-button-container">
              <button
                onClick={handleCapture}
                disabled={
                  isProcessing || !cameraReady || loadingLocation ||
                  (!isBypassLocation && locationStatus !== "inside") ||
                  !!locationError ||
                  !isValidActiveSession
                }
                className={`w-full py-3 sm:py-4 action-button rounded-xl flex flex-col items-center justify-center gap-1 shadow-[0_4px_0_0_rgba(0,0,0,0.15)] active:shadow-none active:translate-y-1 transition-all ${
                  isProcessing || !cameraReady || loadingLocation || !isValidActiveSession
                    ? "bg-slate-300 text-slate-500 border-b-4 border-slate-400 opacity-60 cursor-not-allowed"
                    : (!isBypassLocation && locationStatus === "outside")
                      ? "bg-slate-400 text-white border-b-4 border-slate-500 opacity-60"
                      : "bg-[#8c1b1d] text-white border-b-4 border-[#6b1516]"
                }`}
              >
                {isProcessing ? (
                  <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="text-lg sm:text-xl font-black uppercase tracking-tighter leading-none text-center px-2">
                      {isValidActiveSession
                        ? `ABSEN ${activeSessionLabel}`
                        : activeSessionLabel || "BELUM ADA SESI"}
                    </span>
                    {isValidActiveSession && (
                      <span className="text-[9px] sm:text-[10px] font-bold opacity-80 uppercase tracking-widest mt-0.5">
                        TEKAN TOMBOL DISINI
                      </span>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Fullscreen Loading Overlay */}
      {loadingOverlay.show && (
        <div className="fixed inset-0 z-[100] bg-[#8c1b1d] flex flex-col items-center justify-center p-8 text-white">
          <div className="w-24 h-24 border-8 border-white/20 border-t-white rounded-full animate-spin mb-8" />
          <h2 className="text-3xl font-black uppercase text-center">{loadingOverlay.message}</h2>
          <p className="text-lg font-bold opacity-80 mt-4 text-center">{loadingOverlay.subMessage}</p>
        </div>
      )}

      {/* Modal Box */}
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
                onClick={handleModalClose}
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
