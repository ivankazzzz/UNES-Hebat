import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { AttendanceWithUser } from "@/lib/supabase";
import { FileDown, Loader2, GraduationCap, AlertCircle, FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { generateKondisiStatistikPDF } from "@/lib/pdf-generator";

type PdfDocument = jsPDF & {
  lastAutoTable?: {
    finalY: number;
  };
};

const toLocalYMD = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Konversi UTC timestamp ke tanggal WIB (UTC+7)
const toWIBYMD = (utcTimestamp: string): string | null => {
  if (!utcTimestamp) return null;
  
  try {
    const date = new Date(utcTimestamp);
    
    if (Number.isNaN(date.getTime()) || !isFinite(date.getTime())) {
      console.error(`toWIBYMD: Invalid date for timestamp: ${utcTimestamp}`);
      return null;
    }
    
    const wibTime = date.getTime() + (7 * 60 * 60 * 1000);
    const wibDate = new Date(wibTime);
    
    const year = wibDate.getUTCFullYear();
    const month = String(wibDate.getUTCMonth() + 1).padStart(2, "0");
    const day = String(wibDate.getUTCDate()).padStart(2, "0");
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error(`toWIBYMD: Error parsing timestamp ${utcTimestamp}:`, error);
    return null;
  }
};

const parseLocalYMD = (dateStr: string) => {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

const formatDateLong = (dateStr: string) => {
  return parseLocalYMD(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatDayName = (dateStr: string) => {
  return parseLocalYMD(dateStr).toLocaleDateString("id-ID", {
    weekday: "long",
  });
};

const formatDateShort = (dateStr: string) => {
  const date = parseLocalYMD(dateStr);
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit" });
};

const createdAtToLocalYMD = (createdAt?: string | null): string | null => {
  if (!createdAt) return null;
  
  const wibResult = toWIBYMD(createdAt);
  if (wibResult) return wibResult;
  
  if (createdAt.includes("T")) {
    return createdAt.split("T")[0];
  }
  
  if (createdAt.includes(" ")) {
    return createdAt.split(" ")[0];
  }
  
  return createdAt.substring(0, 10);
};

// Extract HH:MM time from a UTC timestamp, converted to WIB
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

const fetchTelegramPhoto = async (photoUrl: string): Promise<string | null> => { 
  try {
    if (!photoUrl) return null;
    if (photoUrl.includes("t.me/")) return null;
    
    if (photoUrl.startsWith("telegram:file:")) {
      const fileId = photoUrl.replace("telegram:file:", "");
      const response = await fetch(`/api/telegram-photo?file_id=${encodeURIComponent(fileId)}`);
      
      if (!response.ok) return null;
      
      const result = await response.json();
      return (result.ok && result.dataUrl) ? result.dataUrl : null;
    }
    
    return null;
  } catch (err) {
    console.error("Error fetching telegram photo:", err);
    return null;
  }
};

const runWithConcurrency = async (tasks: Array<() => Promise<void>>, limit = 6) => {
  if (!tasks.length) return;
  let index = 0;
  const worker = async () => {
    while (true) {
      const taskIndex = index;
      index += 1;
      if (taskIndex >= tasks.length) break;
      await tasks[taskIndex]!();
    }
  };
  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () => worker());
  await Promise.all(workers);
};

interface LeavePermit {
  id: string;
  user_id: string;
  permit_type: "izin" | "cuti" | "dinas_luar";
  start_date: string;
  end_date: string;
  description: string | null;
  document_url: string | null;
}

interface Holiday {
  id: string;
  holiday_date: string;
  description: string;
  is_active: boolean;
}

const permitTypeLabels: Record<string, string> = {
  izin: "Izin",
  cuti: "Cuti",
  dinas_luar: "Dinas Luar",
};

type ReportCategory = "dpl_kkn" | "mahasiswa" | "panitia_kkn";

type ReportUser = {
  id: string;
  full_name: string;
  username?: string | null;
  role?: string | null;
  unit_kerja?: string | null;
  is_dpl_kkn?: boolean | null;
  is_panitia_kkn?: boolean | null;
};

const categoryLabel: Record<ReportCategory, string> = {
  dpl_kkn: "DPL KKN",
  mahasiswa: "Mahasiswa KKN",
  panitia_kkn: "Panitia KKN 2026",
};

interface Session {
  index: number;
  label: string;
  dateYMDs: string[];
}

// Opsi pilihan dropdown laporan/rekap
const SESSIONS: Session[] = [
  {
    index: 1,
    dateYMDs: ["2026-07-18"],
    label: "Sabtu, 18 Juli 2026 - Sesi 1 (07:25-08:00)",
  },
  {
    index: 2,
    dateYMDs: ["2026-07-18"],
    label: "Sabtu, 18 Juli 2026 - Sesi 2 (09:30-10:00)",
  },
  {
    index: 3,
    dateYMDs: ["2026-07-18"],
    label: "Sabtu, 18 Juli 2026 - Sesi 3 (13:00-13:30)",
  },
  {
    index: 4,
    dateYMDs: ["2026-07-19"],
    label: "Minggu, 19 Juli 2026 - Sesi 1 (07:00-08:00)",
  },
  {
    index: 5,
    dateYMDs: ["2026-07-19"],
    label: "Minggu, 19 Juli 2026 - Sesi 2 (09:30-10:00)",
  },
  {
    index: 6,
    dateYMDs: ["2026-07-19"],
    label: "Minggu, 19 Juli 2026 - Sesi 3 (11:00-11:30)",
  },
  {
    index: 7,
    dateYMDs: ["2026-07-19"],
    label: "Minggu, 19 Juli 2026 - Sesi 4 (13:30-14:00)",
  },
  {
    index: 8,
    dateYMDs: ["2026-07-19"],
    label: "Minggu, 19 Juli 2026 - Sesi 5 (15:30-16:00)",
  },
  {
    index: 9,
    dateYMDs: ["2026-07-29"],
    label: "Rabu, 29 Juli 2026 - Pelepasan KKN (08:00-10:00)",
  },
  {
    index: 10,
    dateYMDs: ["2026-07-18"],
    label: "Rekap Sabtu, 18 Juli 2026",
  },
  {
    index: 11,
    dateYMDs: ["2026-07-19"],
    label: "Rekap Minggu, 19 Juli 2026",
  },
  {
    index: 12,
    dateYMDs: ["2026-07-29"],
    label: "Rekap Pelepasan KKN (29 Juli 2026)",
  },
  {
    index: 13,
    dateYMDs: ["2026-07-18", "2026-07-19"],
    label: "Rekap Sabtu & Minggu (18 & 19 Juli 2026)",
  },
  {
    index: 14,
    dateYMDs: ["2026-07-18", "2026-07-19", "2026-07-29"],
    label: "Rekap Kumulatif Semua Hari KKN",
  },
];

// Detail Jadwal Sesi Individual KKN
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

const getActiveSessionsInScope = (sessionIndex: number): KknIndividualSession[] => {
  switch (sessionIndex) {
    case 1: return [KKN_INDIVIDUAL_SESSIONS[0]];
    case 2: return [KKN_INDIVIDUAL_SESSIONS[1]];
    case 3: return [KKN_INDIVIDUAL_SESSIONS[2]];
    case 4: return [KKN_INDIVIDUAL_SESSIONS[3]];
    case 5: return [KKN_INDIVIDUAL_SESSIONS[4]];
    case 6: return [KKN_INDIVIDUAL_SESSIONS[5]];
    case 7: return [KKN_INDIVIDUAL_SESSIONS[6]];
    case 8: return [KKN_INDIVIDUAL_SESSIONS[7]];
    case 9: return [KKN_INDIVIDUAL_SESSIONS[8]];
    case 10: // Rekap Sabtu
      return [KKN_INDIVIDUAL_SESSIONS[0], KKN_INDIVIDUAL_SESSIONS[1], KKN_INDIVIDUAL_SESSIONS[2]];
    case 11: // Rekap Minggu
      return [
        KKN_INDIVIDUAL_SESSIONS[3], KKN_INDIVIDUAL_SESSIONS[4], 
        KKN_INDIVIDUAL_SESSIONS[5], KKN_INDIVIDUAL_SESSIONS[6], 
        KKN_INDIVIDUAL_SESSIONS[7]
      ];
    case 12: // Rekap Pelepasan KKN
      return [KKN_INDIVIDUAL_SESSIONS[8]];
    case 13: // Rekap Sabtu & Minggu
      return [
        KKN_INDIVIDUAL_SESSIONS[0], KKN_INDIVIDUAL_SESSIONS[1], KKN_INDIVIDUAL_SESSIONS[2],
        KKN_INDIVIDUAL_SESSIONS[3], KKN_INDIVIDUAL_SESSIONS[4], KKN_INDIVIDUAL_SESSIONS[5],
        KKN_INDIVIDUAL_SESSIONS[6], KKN_INDIVIDUAL_SESSIONS[7]
      ];
    case 14: // Rekap Kumulatif Semua
      return KKN_INDIVIDUAL_SESSIONS;
    default:
      return [KKN_INDIVIDUAL_SESSIONS[0]];
  }
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

// Helper pencocokan absensi dengan sesi KKN (Teks note / Jam)
const findMatchedSession = (createdAt: string, note?: string | null): KknIndividualSession | null => {
  if (!createdAt) return null;
  
  // 1. Pertama, cek nama sesi yang tercantum di kolom note (RPC submit_attendance_kkn menyisipkan ini)
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
  
  // 2. Fallback: pencocokan manual berdasarkan tanggal dan waktu WIB
  const dateYMD = createdAtToLocalYMD(createdAt);
  const wibTime = createdAtToWIBTime(createdAt);
  if (!dateYMD || !wibTime) return null;
  
  const matchedByTime = KKN_INDIVIDUAL_SESSIONS.find((s) => {
    return s.dateYMD === dateYMD && 
           wibTime >= s.startTime && 
           wibTime <= s.endTime;
  });
  
  return matchedByTime || null;
};

const isUserInCategory = (user: ReportUser, category: ReportCategory) => {
  const role = String(user.role || "").toLowerCase();
  const username = String(user.username || "").toLowerCase();
  const fullName = String(user.full_name || "").toLowerCase();
  
  if (username.includes("tesx") || fullName.includes("tesx")) {
    return false;
  }

  if (category === "dpl_kkn") {
    return Boolean(user.is_dpl_kkn);
  }
  
  if (category === "mahasiswa") {
    return role === "mahasiswa";
  }

  if (category === "panitia_kkn") {
    return Boolean(user.is_panitia_kkn);
  }
  
  return false;
};

export default function LaporanKehadiranKKN() {
  const [attendances, setAttendances] = useState<AttendanceWithUser[]>([]);
  const [appUsers, setUsers] = useState<ReportUser[]>([]);
  const [leavePermits, setLeavePermits] = useState<LeavePermit[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportingText, setExportingText] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState<"processing" | "completed" | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory>("dpl_kkn");
  const [selectedSessionIndex, setSelectedSessionIndex] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const leaveDatesByUser = useMemo(() => {
    const result: Record<string, Record<string, LeavePermit["permit_type"]>> = {};
    leavePermits.forEach((leave) => {
      const start = new Date(leave.start_date);
      const end = new Date(leave.end_date);
      const cursor = new Date(start);
      while (cursor <= end) {
        const dateKey = cursor.toISOString().slice(0, 10);
        if (!result[leave.user_id]) {
          result[leave.user_id] = {};
        }
        result[leave.user_id][dateKey] = leave.permit_type;
        cursor.setDate(cursor.getDate() + 1);
      }
    });
    return result;
  }, [leavePermits]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const allUsers: ReportUser[] = [];
      let uPage = 0;
      const uPageSize = 1000;
      let uHasMore = true;
      
      while (uHasMore) {
        const from = uPage * uPageSize;
        const to = from + uPageSize - 1;
        const { data: uData, error: uError } = await supabase
          .from("users")
          .select("*")
          .order("full_name")
          .range(from, to);
          
        if (uError) {
          console.error("Error loading users:", uError);
          break;
        }
        
        if (uData && uData.length > 0) {
          allUsers.push(...uData);
          if (uData.length < uPageSize) {
            uHasMore = false;
          } else {
            uPage++;
          }
        } else {
          uHasMore = false;
        }
      }
      setUsers(allUsers);
      
      const startDate = "2026-07-18";
      const endDate = "2026-07-29";
      
      console.log(`=== Loading KKN attendances (${startDate} to ${endDate}) ===`);
      
      const allAttendances: AttendanceWithUser[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;
      
      while (hasMore) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        
        const { data: attData, error } = await supabase
          .from("attendances")
          .select("*, user:users(*)")
          .gte("created_at", `${startDate}T00:00:00Z`)
          .lte("created_at", `${endDate}T23:59:59Z`)
          .order("created_at", { ascending: false })
          .range(from, to);
        
        if (error) {
          console.error("Error loading attendance:", error);
          break;
        }
        
        if (attData && attData.length > 0) {
          allAttendances.push(...attData);
          if (attData.length < pageSize) {
            hasMore = false;
          } else {
            page++;
          }
        } else {
          hasMore = false;
        }
      }
      
      setAttendances(allAttendances);
      console.log(`✅ Total attendances loaded: ${allAttendances.length}`);
      
      const { data: permitsData } = await supabase.from("leave_permits").select("*");
      setLeavePermits(permitsData || []);
      
      const { data: holidaysData } = await supabase.from("holidays").select("*").eq("is_active", true);
      setHolidays(holidaysData || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const selectedSession = useMemo(
    () => SESSIONS.find((s) => s.index === selectedSessionIndex) ?? SESSIONS[0],
    [selectedSessionIndex]
  );
  
  const usersInScope = useMemo(() => {
    let filtered = appUsers.filter((u) => isUserInCategory(u, selectedCategory));
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(u => 
        (u.full_name || "").toLowerCase().includes(q) || 
        (u.username || "").toLowerCase().includes(q)
      );
    }

    const sorted = filtered.sort((a, b) => a.full_name.localeCompare(b.full_name));
    return sorted;
  }, [appUsers, selectedCategory, searchQuery]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedSessionIndex, searchQuery]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return usersInScope.slice(startIndex, startIndex + itemsPerPage);
  }, [usersInScope, currentPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(usersInScope.length / itemsPerPage);
  }, [usersInScope]);

  const buildAllUsersPdfDoc = async () => {
    if (!selectedSession) return null;
    
    setExportProgress(15);
    
    const activeSessions = getActiveSessionsInScope(selectedSessionIndex);
    
    // sessionMap[user_id][session_index] = attendance_record
    const sessionMap: Record<string, Record<number, any>> = {};
    
    attendances.forEach((a) => {
      const matched = findMatchedSession(a.created_at, a.note);
      if (matched) {
        if (!sessionMap[a.user_id]) {
          sessionMap[a.user_id] = {};
        }
        sessionMap[a.user_id][matched.index] = a;
      }
    });
    
    console.log(`sessionMap built with ${Object.keys(sessionMap).length} active users`);

    setExportProgress(25);

    // Kertas Legal Landscape
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "legal" }) as PdfDocument;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 18;
    const marginTop = 20;

    let logoData: string | null = null;
    try {
      const res = await fetch("/unes.png");
      if (res.ok) {
        const blob = await res.blob();
        logoData = await new Promise((r) => { const reader = new FileReader(); reader.onload = () => r(reader.result as string); reader.readAsDataURL(blob); });
      }
    } catch {}

    const toSquareJpegDataUrl = async (dataUrl: string, sizePx = 450): Promise<string | null> => {
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = dataUrl;

        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("Failed to load image"));
          setTimeout(() => reject(new Error("Image load timeout")), 10000);
        });

        const srcW = img.naturalWidth || img.width;
        const srcH = img.naturalHeight || img.height;
        
        if (!srcW || !srcH) return null;

        const canvas = document.createElement("canvas");
        canvas.width = sizePx;
        canvas.height = sizePx;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, sizePx, sizePx);

        const scale = Math.max(sizePx / srcW, sizePx / srcH);
        const drawW = srcW * scale;
        const drawH = srcH * scale;
        const dx = (sizePx - drawW) / 2;
        const dy = (sizePx - drawH) / 2;

        ctx.drawImage(img, dx, dy, drawW, drawH);
        return canvas.toDataURL("image/jpeg", 0.9);
      } catch (err) {
        console.error("Error converting image:", err);
        return null;
      }
    };

    const photoCache = new Map<string, string>();
    const photoTasks: Array<() => Promise<void>> = [];
    usersInScope.forEach((u) => {
      activeSessions.forEach((s) => {
        const att = sessionMap[u.id]?.[s.index];
        if (att?.photo_url) {
          photoTasks.push(async () => {
            try {
              const p = await fetchTelegramPhoto(att.photo_url);
              if (!p) return;
              const square = await toSquareJpegDataUrl(p, 512);
              if (square) photoCache.set(`${u.id}-${s.index}`, square);
            } catch (err) {
              console.error(`Error processing photo for ${u.full_name} session ${s.index}:`, err);
            }
          });
        }
      });
    });
    
    if (photoTasks.length) {
      console.log(`Processing ${photoTasks.length} photos...`);
      setExportProgress(35);
      
      const totalPhotos = photoTasks.length;
      let processedPhotos = 0;
      
      const wrappedTasks = photoTasks.map(task => async () => {
        await task();
        processedPhotos++;
        const photoProgress = 35 + Math.floor((processedPhotos / totalPhotos) * 45);
        setExportProgress(photoProgress);
      });
      
      await runWithConcurrency(wrappedTasks, 15);
      console.log(`Photo cache ready: ${photoCache.size} photos`);
      setExportProgress(80);
    } else {
      setExportProgress(80);
    }

    const addFooter = () => {
      const now = new Date();
      const tanggal = now.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
      const jam = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const footerText = `Dicetak dari kehadiran.irfanananda28.com pada ${tanggal} ${jam} WIB`;
      
      doc.setFont("times", "normal").setFontSize(8).setTextColor(100, 100, 100);
      doc.text(footerText, pageWidth / 2, pageHeight - 15, { align: "center" });
      doc.setTextColor(0, 0, 0);
    };

    // rowH = 115pt agar muat 3-4 user per halaman
    const rowH = 115;
    const usersPerPage = 3;
    
    const pageGroups: ReportUser[][] = [];
    for (let i = 0; i < usersInScope.length; i += usersPerPage) {
      pageGroups.push(usersInScope.slice(i, i + usersPerPage));
    }
    
    let globalNumber = 0;
    
    for (let pIdx = 0; pIdx < pageGroups.length; pIdx++) {
      const pageUsers = pageGroups[pIdx];
      
      if (pIdx > 0) {
        doc.addPage();
      }
      
      let currentY = marginTop;
      
      if (logoData) doc.addImage(logoData, "PNG", marginX, currentY, 44, 44);
      doc.setFont("times", "bold").setFontSize(14).text("YAYASAN PERGURUAN TINGGI PADANG", pageWidth / 2, currentY + 5, { align: "center" });
      doc.setFontSize(16).text("UNIVERSITAS EKASAKTI", pageWidth / 2, currentY + 22, { align: "center" });
      doc.setFontSize(10).setFont("times", "normal").text("Jl. Veteran Dalam No. 26 Padang (25113) Telp. (0751) 28859-26770", pageWidth / 2, currentY + 36, { align: "center" });
      
      doc.setLineWidth(1.3);
      doc.line(marginX, currentY + 46, pageWidth - marginX, currentY + 46);
      doc.setLineWidth(0.4);
      doc.line(marginX, currentY + 49, pageWidth - marginX, currentY + 49);
      
      const titleText = "LAPORAN KEHADIRAN PEMBEKALAN KKN DPL DAN MAHASISWA";
      doc.setFont("times", "bold").setFontSize(13).text(titleText, pageWidth / 2, currentY + 63, { align: "center" });
      
      const sessionInfo = `${selectedSession.label}`;
      doc.setFont("times", "normal").setFontSize(10).text(sessionInfo, pageWidth / 2, currentY + 77, { align: "center" });
      currentY += 88;
      
      doc.setFont("times", "bold").setFontSize(11).setTextColor(0, 0, 0);
      doc.text(`Kategori: ${categoryLabel[selectedCategory]}`, marginX, currentY, { align: "left" });
      currentY += 10;
      
      const numSessions = activeSessions.length;
      const colWidthNo = 30;
      const colWidthNama = 130;
      const colWidthTotal = 80;
      const totalTableWidth = pageWidth - (marginX * 2); // 1008 - 36 = 972
      const remainingWidth = totalTableWidth - colWidthNo - colWidthNama - colWidthTotal; // 972 - 30 - 130 - 80 = 732
      const colWidthSession = remainingWidth / numSessions;

      const colStyles: Record<number, any> = {
        0: { cellWidth: colWidthNo, halign: "center", fontStyle: "bold", fontSize: 9, textColor: [0, 0, 0] },
        1: { cellWidth: colWidthNama, halign: "left", valign: "middle", fontStyle: "bold", fontSize: 10, textColor: [0, 0, 0] }
      };
      
      for (let i = 0; i < numSessions; i++) {
        colStyles[2 + i] = { cellWidth: colWidthSession, halign: "center", valign: "top", textColor: [0, 0, 0] };
      }
      
      colStyles[2 + numSessions] = { cellWidth: colWidthTotal, halign: "center", valign: "middle", fontStyle: "bold", fontSize: 9, textColor: [0, 0, 0] };

      autoTable(doc, {
        startY: currentY,
        margin: { left: marginX, right: marginX },
        head: [["No", "Nama", ...activeSessions.map(s => s.colLabel), "Total Kehadiran"]],
        body: pageUsers.map((u) => {
          globalNumber++;
          const nameDisplay = u.role === "mahasiswa" ? `${u.full_name}\n(BP: ${u.username})` : u.full_name;
          
          let hadir = 0;
          let alpha = 0;
          let izin = 0;
          
          activeSessions.forEach((s) => {
            const att = sessionMap[u.id]?.[s.index];
            const permit = leavePermits.find(lp => lp.user_id === u.id && s.dateYMD >= lp.start_date && s.dateYMD <= lp.end_date);
            
            if (att) {
              hadir++;
            } else if (permit) {
              izin++;
            } else if (isSessionStarted(s)) {
              alpha++;
            }
          });
          
          let totalStr = `Hadir: ${hadir}\nAlpa: ${alpha}`;
          if (izin > 0) {
            totalStr += `\nIzin: ${izin}`;
          }
          
          return [globalNumber, nameDisplay, ...activeSessions.map(() => ""), totalStr];
        }),
        theme: "grid",
        styles: { font: "times", fontSize: 8.5, minCellHeight: rowH, valign: "top", halign: "center", lineWidth: 0.65, lineColor: [0, 0, 0], textColor: [0, 0, 0] },
        headStyles: { fillColor: [220, 230, 241], textColor: [0, 0, 0], halign: "center", valign: "middle", fontSize: 9, fontStyle: "bold", minCellHeight: 30 },
        columnStyles: colStyles,
        didDrawPage: () => {
          addFooter();
        },
        didDrawCell: (data) => {
          if (data.cell.section !== "body" || data.column.index < 2 || data.column.index === 2 + activeSessions.length) return;
          const u = pageUsers[data.row.index];
          const session = activeSessions[data.column.index - 2];
          if (!u || !session) return;

          const att = sessionMap[u.id]?.[session.index];
          const x = data.cell.x;
          const y = data.cell.y;
          const w = data.cell.width;

          const permit = leavePermits.find(lp => lp.user_id === u.id && session.dateYMD >= lp.start_date && session.dateYMD <= lp.end_date);

          if (permit) {
            doc.setFont("times", "bold").setFontSize(8).setTextColor(0, 0, 0);
            doc.text(`Izin:\n${permitTypeLabels[permit.permit_type]}`, x + w/2, y + rowH/2 - 5, { align: "center" });
            return;
          }

          const CM_TO_PT = 72 / 2.54;
          const photoBoxSize = 2.5 * CM_TO_PT; // ~71pt
          const photoBoxX = x + (w - photoBoxSize) / 2;
          const textX = x + w / 2;

          if (att) {
            const wibTime = createdAtToWIBTime(att.created_at) || "--:--";
            
            // Jam Absensi
            doc.setFont("times", "bold").setFontSize(8.5).setTextColor(0, 120, 0);
            doc.text(wibTime, textX, y + 13, { align: "center" });
            doc.setTextColor(0, 0, 0);

            // Frame Foto
            const boxY = y + 20;
            doc.setDrawColor(160, 160, 160);
            doc.setLineWidth(0.6);
            doc.rect(photoBoxX, boxY, photoBoxSize, photoBoxSize);

            // Gambar Foto
            const photoKey = `${u.id}-${session.index}`;
            const photoData = photoCache.get(photoKey);
            if (photoData) {
              const padding = 2;
              doc.addImage(photoData, "JPEG", photoBoxX + padding, boxY + padding, photoBoxSize - padding * 2, photoBoxSize - padding * 2);
            } else {
              doc.setFontSize(6);
              doc.setTextColor(100, 100, 100);
              doc.text("Foto tidak tersedia", photoBoxX + photoBoxSize / 2, boxY + photoBoxSize / 2, { align: "center", baseline: "middle" });
              doc.setTextColor(0, 0, 0);
            }
          } else if (!isSessionStarted(session)) {
            // Belum dimulai
            doc.setFont("times", "normal").setFontSize(8.5).setTextColor(120, 120, 120);
            doc.text("-", textX, y + rowH/2 - 3, { align: "center", baseline: "middle" });
            doc.setTextColor(0, 0, 0);
          } else {
            // Tampil tulisan Alpha merah tebal di tengah sel
            doc.setFont("times", "bold").setFontSize(10).setTextColor(190, 0, 0);
            doc.text("Alpha", textX, y + rowH/2 - 3, { align: "center", baseline: "middle" });
            doc.setTextColor(0, 0, 0);
          }
        }
      });
    }
    return doc;
  };

  const buildAllUsersTextPdfDoc = async () => {
    if (!selectedSession) return null;
    
    setExportProgress(15);
    
    const activeSessions = getActiveSessionsInScope(selectedSessionIndex);
    
    // sessionMap[user_id][session_index] = attendance_record
    const sessionMap: Record<string, Record<number, any>> = {};
    
    attendances.forEach((a) => {
      const matched = findMatchedSession(a.created_at, a.note);
      if (matched) {
        if (!sessionMap[a.user_id]) {
          sessionMap[a.user_id] = {};
        }
        sessionMap[a.user_id][matched.index] = a;
      }
    });

    setExportProgress(30);

    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "legal" }) as PdfDocument;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 18;
    const marginTop = 20;

    let logoData: string | null = null;
    try {
      const res = await fetch("/unes.png");
      if (res.ok) {
        const blob = await res.blob();
        logoData = await new Promise((r) => { const reader = new FileReader(); reader.onload = () => r(reader.result as string); reader.readAsDataURL(blob); });
      }
    } catch {}

    setExportProgress(50);

    const addFooter = () => {
      const now = new Date();
      const tanggal = now.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
      const jam = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      
      doc.setFont("times", "normal").setFontSize(8).setTextColor(0, 0, 0);
      // Keterangan di kiri bawah (Hanya V = Hadir, X = Tidak Hadir)
      const keteranganLabel = "Keterangan: V = Hadir, X = Tidak Hadir";
      doc.text(keteranganLabel, marginX, pageHeight - 15, { align: "left" });
      
      // Info Cetak di kanan bawah
      const footerText = `Dicetak dari kehadiran.irfanananda28.com pada ${tanggal} ${jam} WIB`;
      doc.text(footerText, pageWidth - marginX, pageHeight - 15, { align: "right" });
    };

    const rowH = 24; // tinggi baris tunggal rapat
    const usersPerPage = 15; // muat 15 user per halaman landscape Legal
    
    const pageGroups: ReportUser[][] = [];
    for (let i = 0; i < usersInScope.length; i += usersPerPage) {
      pageGroups.push(usersInScope.slice(i, i + usersPerPage));
    }
    
    let globalNumber = 0;
    
    for (let pIdx = 0; pIdx < pageGroups.length; pIdx++) {
      const pageUsers = pageGroups[pIdx];
      
      if (pIdx > 0) {
        doc.addPage();
      }
      
      let currentY = marginTop;
      
      if (logoData) doc.addImage(logoData, "PNG", marginX, currentY, 44, 44);
      doc.setFont("times", "bold").setFontSize(14).text("YAYASAN PERGURUAN TINGGI PADANG", pageWidth / 2, currentY + 5, { align: "center" });
      doc.setFontSize(16).text("UNIVERSITAS EKASAKTI", pageWidth / 2, currentY + 22, { align: "center" });
      doc.setFontSize(10).setFont("times", "normal").text("Jl. Veteran Dalam No. 26 Padang (25113) Telp. (0751) 28859-26770", pageWidth / 2, currentY + 36, { align: "center" });
      doc.text("Fax. (0751) 32694; https://unespadang.ac.id/", pageWidth / 2, currentY + 47, { align: "center" });
      
      doc.setLineWidth(1.3);
      doc.line(marginX, currentY + 53, pageWidth - marginX, currentY + 53);
      doc.setLineWidth(0.4);
      doc.line(marginX, currentY + 56, pageWidth - marginX, currentY + 56);
      
      const titleText = "REKAPITULASI ABSENSI";
      doc.setFont("times", "bold").setFontSize(14).text(titleText, pageWidth / 2, currentY + 72, { align: "center" });
      
      const sessionInfo = `Periode: ${selectedSession.label}`;
      doc.setFont("times", "normal").setFontSize(11).text(sessionInfo, pageWidth / 2, currentY + 86, { align: "center" });
      currentY += 96;
      
      doc.setFont("times", "bold").setFontSize(10).setTextColor(0, 0, 0);
      doc.text(`Kategori: ${categoryLabel[selectedCategory]}`, marginX, currentY, { align: "left" });
      currentY += 10;

      const colWidthNo = 35;
      const colWidthNama = 220;
      const colWidthNote = 120;
      const totalTableWidth = pageWidth - (marginX * 2);
      const remainingWidth = totalTableWidth - colWidthNo - colWidthNama - colWidthNote;
      const colWidthSession = remainingWidth / activeSessions.length;

      const colStyles: Record<number, any> = {
        0: { cellWidth: colWidthNo, halign: "center", fontStyle: "bold", fontSize: 9 },
        1: { cellWidth: colWidthNama, halign: "left", valign: "middle", fontStyle: "bold", fontSize: 9 },
      };
      
      for (let i = 0; i < activeSessions.length; i++) {
        colStyles[2 + i] = { cellWidth: colWidthSession, halign: "center", valign: "middle", fontSize: 9, fontStyle: "bold" };
      }
      colStyles[2 + activeSessions.length] = { cellWidth: colWidthNote, halign: "left", valign: "middle", fontSize: 8 };

      const headRow1 = [
        { content: "No", rowSpan: 2 },
        { content: "Nama", rowSpan: 2 },
        { content: "Sesi KKN", colSpan: activeSessions.length, styles: { halign: "center", valign: "middle", fontStyle: "bold" } },
        { content: "Keterangan", rowSpan: 2 }
      ];

      const headRow2 = activeSessions.map((s) => {
        const datePart = s.dateYMD.split("-").reverse().join("/");
        const dayName = s.dateYMD === "2026-07-18" ? "Sabtu" : s.dateYMD === "2026-07-19" ? "Minggu" : "Rabu";
        
        let sessionName = `Sesi ${s.index}`;
        if (s.index === 9) {
          sessionName = "Pelepasan KKN";
        } else if (s.index >= 4 && s.index <= 8) {
          sessionName = `Sesi ${s.index - 3}`;
        }
        return `${sessionName}\n${dayName} ${datePart}\n(${s.startTime}-${s.endTime})`;
      });

      autoTable(doc, {
        startY: currentY,
        margin: { left: marginX, right: marginX },
        head: [headRow1, headRow2],
        body: pageUsers.map((u) => {
          globalNumber++;
          const nameDisplay = u.role === "mahasiswa" ? `${u.full_name}\n(BP: ${u.username})` : u.full_name;
          
          let totalHadir = 0;
          let totalAlpa = 0;
          
          const dateCells = activeSessions.map((s) => {
            const att = sessionMap[u.id]?.[s.index];
            
            if (att) {
              totalHadir++;
              return "V";
            }
            
            if (isSessionStarted(s)) {
              totalAlpa++;
              return "X";
            }
            
            return "-";
          });
          
          const noteLines = [
            `Total Sesi: ${activeSessions.length}`,
            `Total Hadir: ${totalHadir}`,
            `Total Alpa: ${totalAlpa}`
          ];
          
          return [globalNumber, nameDisplay, ...dateCells, noteLines.join("\n")];
        }),
        theme: "grid",
        styles: { font: "times", fontSize: 8.5, minCellHeight: rowH, valign: "middle", halign: "center", lineWidth: 0.65, lineColor: [0, 0, 0], textColor: [0, 0, 0] },
        headStyles: { fillColor: [220, 230, 241], textColor: [0, 0, 0], halign: "center", valign: "middle", fontSize: 8.5, fontStyle: "bold" },
        columnStyles: colStyles,
        didDrawPage: () => {
          addFooter();
        }
      });
      
      const photoProgress = 50 + Math.floor(((pIdx + 1) / pageGroups.length) * 40);
      setExportProgress(photoProgress);
    }
    
    setExportProgress(90);
    return doc;
  };

  const handleExport = async (isTextOnly = false) => {
    if (isTextOnly) {
      setExportingText(true);
    } else {
      setExporting(true);
    }
    setExportProgress(0);
    setExportStatus("processing");
    
    try {
      setExportProgress(10);
      
      const sessionLabel = selectedSession.label.replace(/[,:]/g, "").replace(/\s+/g, "_");
      const categoryName = selectedCategory === "dpl_kkn" 
        ? "DPL_KKN" 
        : selectedCategory === "panitia_kkn" 
          ? "Panitia_KKN" 
          : "Mahasiswa";
      
      if (isTextOnly) {
        // Ekspor PDF model teks sesi (gaya contohlaporanteks.pdf tetapi kolom Sesi KKN)
        const doc = await buildAllUsersTextPdfDoc();
        setExportProgress(90);
        
        if (doc) {
          const filename = `KKN_${sessionLabel}_${categoryName}_Teks.pdf`;
          setExportProgress(95);
          doc.save(filename);
          
          setExportProgress(100);
          setExportStatus("completed");
          
          setTimeout(() => {
            setExportingText(false);
            setExportStatus(null);
            setExportProgress(0);
          }, 2000);
        } else {
          setExportingText(false);
          setExportStatus(null);
          setExportProgress(0);
        }

      } else {
        // Ekspor PDF model bawaan (landscape dengan foto selfie)
        const doc = await buildAllUsersPdfDoc(false);
        setExportProgress(90);
        
        if (doc) {
          const filename = `KKN_${sessionLabel}_${categoryName}.pdf`;
          setExportProgress(95);
          doc.save(filename);
          
          setExportProgress(100);
          setExportStatus("completed");
          
          setTimeout(() => {
            setExporting(false);
            setExportStatus(null);
            setExportProgress(0);
          }, 2000);
        } else {
          setExporting(false);
          setExportStatus(null);
          setExportProgress(0);
        }
      }
    } catch (error) {
      console.error("Export error:", error);
      setExportingText(false);
      setExporting(false);
      setExportStatus(null);
      setExportProgress(0);
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 pb-12 font-sans">
      {/* Top sticky header */}
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b-2 border-[#8c1b1d] px-4 py-3 shadow-md shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#8c1b1d]/5 rounded-2xl flex items-center justify-center border-2 border-[#8c1b1d]">
              <GraduationCap className="w-6 h-6 text-[#8c1b1d]" />
            </div>
            <div>
              <h1 className="font-extrabold text-slate-800 dark:text-white text-base leading-tight">
                Laporan Kehadiran KKN
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">
                Universitas Ekasakti
              </p>
            </div>
          </div>
          <button
            onClick={() => window.location.href = "/admin"}
            className="px-4 py-1.5 border-2 border-[#8c1b1d] text-[#8c1b1d] hover:bg-[#8c1b1d] hover:text-white font-extrabold text-xs rounded-xl transition-all active:scale-95"
          >
            KEMBALI
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-6">
        {/* Filter Controls Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-md border-2 border-[#8c1b1d]/10 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
            {/* Kategori Dropdown */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Kategori Peserta</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as ReportCategory)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-[#8c1b1d]/20 focus:border-[#8c1b1d] rounded-2xl text-sm font-bold focus:outline-none focus:ring-0"
              >
                <option value="dpl_kkn">Dosen Pembimbing Lapangan (DPL KKN)</option>
                <option value="mahasiswa">Mahasiswa KKN</option>
                <option value="panitia_kkn">Panitia KKN 2026</option>
              </select>
            </div>

            {/* Sesi Dropdown */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Pilih Sesi / Rekap</label>
              <select
                value={selectedSessionIndex}
                onChange={(e) => setSelectedSessionIndex(parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-[#8c1b1d]/20 focus:border-[#8c1b1d] rounded-2xl text-sm font-bold focus:outline-none focus:ring-0"
              >
                {SESSIONS.map((s) => (
                  <option key={s.index} value={s.index}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Cari Nama / BP */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Cari Nama / BP</label>
              <input
                type="text"
                placeholder="Cari nama atau No. BP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-[#8c1b1d]/20 focus:border-[#8c1b1d] rounded-2xl text-sm font-bold focus:outline-none focus:ring-0 placeholder:text-slate-400 placeholder:font-normal"
              />
            </div>

            {/* Export PDF & Text Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => handleExport(false)}
                disabled={loading || usersInScope.length === 0 || exporting || exportingText}
                className="flex-1 py-3 bg-[#8c1b1d] hover:bg-[#7a1819] disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 text-white font-extrabold text-sm rounded-2xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 border-2 border-[#8c1b1d]"
              >
                {exporting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Mengekspor PDF ({exportProgress}%)
                  </>
                ) : (
                  <>
                    <FileDown className="w-5 h-5" />
                    Unduh PDF Laporan
                  </>
                )}
              </button>

              <button
                onClick={() => handleExport(true)}
                disabled={loading || usersInScope.length === 0 || exporting || exportingText}
                className="flex-1 py-3 bg-[#fbbf24] hover:bg-[#d9a31c] disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 text-slate-900 font-extrabold text-sm rounded-2xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 border-2 border-[#fbbf24]"
              >
                {exportingText ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Mengekspor Teks ({exportProgress}%)
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5" />
                    Unduh Laporan Teks
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Loading / Data State */}
        {loading ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border-2 border-[#8c1b1d]/10 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-10 h-10 text-[#8c1b1d] animate-spin" />
            <p className="text-slate-600 font-bold">Memuat data absensi...</p>
          </div>
        ) : usersInScope.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border-2 border-[#8c1b1d]/10 flex flex-col items-center justify-center space-y-2">
            <AlertCircle className="w-12 h-12 text-slate-400 mb-2" />
            <p className="text-slate-800 dark:text-white font-black text-lg">Tidak Ada Data</p>
            <p className="text-slate-500 font-semibold text-sm">
              {searchQuery ? `Pencarian "${searchQuery}" tidak ditemukan pada kategori ini.` : "Tidak ada peserta yang terdaftar pada kategori ini."}
            </p>
          </div>
        ) : (
          /* Preview Data Card */
          <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-md border-2 border-[#8c1b1d] overflow-hidden">
            <div className="bg-[#8c1b1d] px-6 py-4 flex items-center justify-between border-b border-[#8c1b1d]/10">
              <span className="font-extrabold text-white text-sm">
                Preview Kehadiran ({usersInScope.length} Orang)
              </span>
              <span className="bg-amber-400 text-[#8c1b1d] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
                KKN 2026
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 border-b-2 border-slate-200 dark:border-slate-700 text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    <th className="py-4 px-6 text-center w-16">No</th>
                    <th className="py-4 px-6 w-72">Nama Peserta</th>
                    <th className="py-4 px-6">Status / Sesi Detil</th>
                    <th className="py-4 px-6 w-44 text-center">Total Kehadiran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200">
                  {paginatedUsers.map((u, idx) => {
                    const globalIdx = (currentPage - 1) * itemsPerPage + idx;
                    return (
                      <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-4 px-6 text-center text-slate-500">{globalIdx + 1}</td>
                      <td className="py-4 px-6 font-extrabold text-slate-900 dark:text-white">
                        <div>{u.full_name}</div>
                        {u.role === "mahasiswa" && (
                          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">BP: {u.username}</div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-500">
                        {selectedSessionIndex <= 9 ? (
                          // Preview Sesi Tunggal
                          (() => {
                            const currentSess = KKN_INDIVIDUAL_SESSIONS[selectedSessionIndex - 1];
                            if (!currentSess) return null;
                            const sMap = attendances.filter(a => a.user_id === u.id);
                            
                            const matchedAtt = sMap.find(a => {
                              const matched = findMatchedSession(a.created_at, a.note);
                              return matched && matched.index === currentSess.index;
                            });

                            return matchedAtt ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 border border-green-200 text-green-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                Hadir pada {createdAtToWIBTime(matchedAtt.created_at)} WIB (Tipe: {matchedAtt.attendance_type})
                              </span>
                            ) : !isSessionStarted(currentSess) ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-500">
                                Belum Dimulai
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700">
                                Alpha / Tidak Absen Sesi
                              </span>
                            );
                          })()
                        ) : (
                          // Preview Laporan Rekap
                          <div className="flex flex-wrap gap-2">
                            {getActiveSessionsInScope(selectedSessionIndex).map((s) => {
                              const sMap = attendances.filter(a => a.user_id === u.id);
                              const matched = sMap.find(a => {
                                const matchedSess = findMatchedSession(a.created_at, a.note);
                                return matchedSess && matchedSess.index === s.index;
                              });

                              const started = isSessionStarted(s);
                              return (
                                <div key={s.index} className={`px-2.5 py-1 rounded-xl border text-[10px] font-extrabold flex items-center gap-1.5 ${
                                  matched 
                                    ? "bg-green-50 border-green-200 text-green-700" 
                                    : !started
                                      ? "bg-slate-50 border-slate-200 text-slate-500"
                                      : "bg-rose-50 border-rose-200 text-rose-700"
                                } border border-slate-200 dark:border-slate-800`}>
                                  <span>{s.label.split(" - ")[1].split(" (")[0]}:</span>
                                  <strong>{matched ? `${createdAtToWIBTime(matched.created_at)} WIB` : !started ? "Belum Mulai" : "Alpha"}</strong>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-xs text-center">
                        {(() => {
                          const activeSess = getActiveSessionsInScope(selectedSessionIndex);
                          let hadir = 0;
                          let alpha = 0;
                          let izin = 0;
                          
                          activeSess.forEach((s) => {
                            const matched = attendances.find(a => a.user_id === u.id && findMatchedSession(a.created_at, a.note)?.index === s.index);
                            const permit = leavePermits.find(lp => lp.user_id === u.id && s.dateYMD >= lp.start_date && s.dateYMD <= lp.end_date);
                            
                            if (matched) {
                              hadir++;
                            } else if (permit) {
                              izin++;
                            } else if (isSessionStarted(s)) {
                              alpha++;
                            }
                          });
                          
                          return (
                            <div className="flex flex-col gap-1 items-center justify-center font-bold">
                              <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-lg bg-green-50 text-green-700 border border-green-200 w-20">Hadir: {hadir}</span>
                              <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 w-20">Alpa: {alpha}</span>
                              {izin > 0 && (
                                <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 w-20">Izin: {izin}</span>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="bg-slate-50 dark:bg-slate-900 border-t-2 border-slate-100 dark:border-slate-800 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Menampilkan <span className="text-[#8c1b1d] font-black">{Math.min((currentPage - 1) * itemsPerPage + 1, usersInScope.length)}</span> - <span className="text-[#8c1b1d] font-black">{Math.min(currentPage * itemsPerPage, usersInScope.length)}</span> dari <span className="text-slate-700 dark:text-slate-300 font-black">{usersInScope.length}</span> peserta
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-xl border-2 border-[#8c1b1d]/20 disabled:border-slate-200 disabled:text-slate-400 text-[#8c1b1d] hover:bg-[#8c1b1d] hover:text-white font-extrabold text-xs transition-all"
                  >
                    Sebelumnya
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                    const isCurrent = currentPage === pageNum;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-xl font-extrabold text-xs transition-all border-2 ${
                          isCurrent 
                            ? "bg-[#8c1b1d] border-[#8c1b1d] text-white shadow-sm" 
                            : "border-slate-200 text-slate-600 hover:border-[#8c1b1d]/40 dark:border-slate-800 dark:text-slate-350"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-xl border-2 border-[#8c1b1d]/20 disabled:border-slate-200 disabled:text-slate-400 text-[#8c1b1d] hover:bg-[#8c1b1d] hover:text-white font-extrabold text-xs transition-all"
                  >
                    Berikutnya
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Exporting Loading Overlay Modal */}
      {exporting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 border-2 border-[#8c1b1d]">
            <div className="flex flex-col items-center space-y-6">
              <div className="relative">
                {exportStatus === "completed" ? (
                  <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center border-2 border-green-500 animate-scale-in">
                    <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-20 h-20 border-4 border-[#8c1b1d]/20 border-t-[#8c1b1d] rounded-full animate-spin" />
                )}
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-xl font-black text-slate-900 uppercase">
                  {exportStatus === "completed" ? "Ekspor Selesai!" : "Mengekspor PDF..."}
                </h3>
                <p className="text-sm text-slate-500 font-semibold leading-relaxed">
                  {exportStatus === "completed" 
                    ? "Laporan PDF berhasil diunduh ke perangkat Anda." 
                    : "Sedang menarik data foto bukti dan menyusun PDF. Jangan tutup atau reload halaman ini."}
                </p>
              </div>

              <div className="w-full space-y-2">
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div 
                    className="h-full bg-gradient-to-r from-[#8c1b1d] to-[#fbbf24] rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs font-black">
                  <span className="text-slate-500">PROGRES:</span>
                  <span className="text-[#8c1b1d]">{exportProgress}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
