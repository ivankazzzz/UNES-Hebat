import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Calendar,
  ChevronDown,
  Download,
  X,
  Users,
  User,
  ArrowLeft,
  FileBarChart
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getCurrentUser, logout } from "@/lib/auth";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type PdfDocument = jsPDF & {
  lastAutoTable?: {
    finalY: number;
  };
};

interface SimpleUser {
  id: string;
  username: string;
  full_name: string;
  unit_kerja?: string | null;
  role?: string | null;
  is_struktural?: boolean | null;
}

interface SimpleAttendance {
  id: string;
  user_id: string;
  attendance_type: "masuk" | "pulang";
  created_at: string;
}

interface LeavePermit {
  id: string;
  user_id: string;
  permit_type: "izin" | "cuti" | "dinas_luar";
  start_date: string;
  end_date: string;
}

interface Holiday {
  holiday_date: string;
  description: string;
  is_active: boolean;
}

interface AttendanceDetail {
  id: string;
  user_id: string;
  attendance_type: "masuk" | "pulang";
  created_at: string;
  photo_url: string;
  status: string;
  note?: string | null;
}

interface DailyAttendance {
  date: string;
  day: string;
  masuk?: AttendanceDetail;
  pulang?: AttendanceDetail;
  leave?: LeavePermit;
  isHoliday?: boolean;
  holidayDescription?: string;
}

const DOSEN_STRUKTURAL_ORDER = [
  { name: "Dr. Jusmita Weriza, S.Kom, M.Kom", unit: "Yayasan" },
  { name: "Prof. Dr. H. Sufyarma Marsidin, M.Pd", unit: "Rektorat" },
  { name: "Dr. Ir. Dewirman Prima Putra, M.Si", unit: "Rektorat" },
  { name: "Dr. Susi Delmiati, S.H, M.H", unit: "Rektorat" },
  { name: "Drs. M. Takdir Mattaliti, M.Si", unit: "Rektorat" },
  { name: "Dr. Slamet Riyadi, S.Pd.I, M.A.", unit: "Rektorat" },
  { name: "Dr. Salfadri, S.E., M.Si", unit: "Fakultas Ekonomi" },
  { name: "Jhon Rinaldo, S.E., M.Si", unit: "Fakultas Ekonomi" },
  { name: "Dr. Rice Haryati, S.E., M.Si", unit: "Fakultas Ekonomi" },
  { name: "Dr. Susi Yuliastanty, S.Pd, M.M", unit: "Fakultas Ekonomi" },
  { name: "Dr. Fitriyati, S.H, M.H", unit: "Fakultas Hukum" },
  { name: "Dr. Bisma Putra Pratama, S.H., M.H", unit: "Fakultas Hukum" },
  { name: "Dr. Iyah Faniyah, S.H, M.Hum", unit: "Fakultas Hukum" },
  { name: "Dr. Neni Vesna Madjid, S.H., M.H", unit: "Fakultas Hukum" },
  { name: "Netrivianti, S.H., M.H", unit: "Fakultas Hukum" },
  { name: "Dora Tiara, S.H., M.H", unit: "Fakultas Hukum" },
  { name: "Alam Suryo Laksono, S.H., M.H.", unit: "Fakultas Hukum" },
  { name: "Ir. Mahmud, M.Si", unit: "Fakultas Pertanian" },
  { name: "Eddwina Aidila Fitria, S.TP, M.Si", unit: "Fakultas Pertanian" },
  { name: "Meriati, S.P, M.P", unit: "Fakultas Pertanian" },
  { name: "Wawan Sumarno, S.P, M.Si", unit: "Fakultas Pertanian" },
  { name: "Rera Aga Salihat, S.Si, M.Si", unit: "Fakultas Pertanian" },
  { name: "Rera Agung Syukra, S.Si, M.Si", unit: "Fakultas Pertanian" },
  { name: "Dr. Mac Aditiawarman, M.Hum", unit: "Fakultas Sastra" },
  { name: "Drs. Raflis, M.Hum", unit: "Fakultas Sastra" },
  { name: "Drs. Risal Abu, S.T, M.Eng", unit: "Fakultas Teknik" },
  { name: "Adrian Fadhli, S.Pd, M.T", unit: "Fakultas Teknik" },
  { name: "Dr. Ir. Irnawati Siregar, M.Pd.T", unit: "Fakultas Teknik" },
  { name: "Dr. Nazili, S.T, M.T", unit: "Fakultas Teknik" },
  { name: "Ir. Irmayani, M.T", unit: "Fakultas Teknik" },
  { name: "Ir. Mukhnizar, M.T", unit: "Fakultas Teknik" },
  { name: "Rosnita Rauf, S.T, M.T", unit: "Fakultas Teknik" },
  { name: "Robby Hotter, S.T, M.T", unit: "Fakultas Teknik" },
  { name: "Merry Thressia, S.Si, M.Si", unit: "Fakultas Teknik" },
  { name: "Budiman, S.T, M.T", unit: "Fakultas Teknik" },
  { name: "Drs. Tarma Sartima, M.Si, Ph.D", unit: "FISIPOL" },
  { name: "Annisa Fitri, S.Sos, M.AP", unit: "FISIPOL" },
  { name: "Doddie Arya Kusuma B, S.Sos, M.Si", unit: "FISIPOL" },
  { name: "Puryanto, S.A.P, M.A.P", unit: "FISIPOL" },
  { name: "Dr. Sumartono, M.Si", unit: "FISIPOL" },
  { name: "Yumi Ariyati, S.Sos, M.I.Kom", unit: "FISIPOL" },
  { name: "Dr. Feby Meuthia Yusuf, M.Pd", unit: "FKIP" },
  { name: "Dwi Mutia Chan, S.Pd, M.Pd", unit: "FKIP" },
  { name: "Khurnia Budi Utami, S.Pd, M.Pd", unit: "FKIP" },
  { name: "Reni Respita, S.Pd, M.Pd.E", unit: "FKIP" },
  { name: "Yessy Marzona, S.Pd, M.Pd", unit: "FKIP" },
  { name: "Desmiwerita, S.E., M.Si", unit: "AAI" },
  { name: "Dr. Yuli Ardiany, S.E., M.Si, C.Atr", unit: "AAI" },
  { name: "Dr. Nuraeni Dahri, S.Kom, M.Kom", unit: "D III MIK" },
  { name: "Prof. Dr. Ir. I Ketut Budaraga, M.Si", unit: "LPPM" },
  { name: "Harry Setya Hadi, S.Kom, M.Kom", unit: "LPPM" },
  { name: "Prof. Dr. H. Agussalim M, S.E, M.S. MCE.", unit: "Lembaga Diklat, KKN" },
  { name: "Dian Wahyuni Dewi Fitri, S.T, M.T", unit: "Lembaga Diklat, KKN" },
];

const getWeekRanges = (year: number, month: number) => {
  const weeks = [];
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  
  const currentDate = new Date(firstDay);
  
  while (currentDate <= lastDay) {
    const weekStart = new Date(currentDate);
    const weekEnd = new Date(currentDate);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    if (weekEnd > lastDay) {
      weekEnd.setDate(lastDay.getDate());
    }
    
    weeks.push({
      start: new Date(weekStart),
      end: new Date(weekEnd),
      label: `${weekStart.getDate()}-${weekEnd.getDate()} ${weekStart.toLocaleDateString("id-ID", { month: "short" })}`
    });
    
    currentDate.setDate(currentDate.getDate() + 7);
  }
  
  return weeks;
};

const formatDateId = (date: Date) => {
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
};

const formatDateKeyWib = (date: Date) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  if (!year || !month || !day) return "";
  return `${year}-${month}-${day}`;
};

const NAME_ALIASES: Record<string, string[]> = {
  "Dr. Jusmita Weriza, S.Kom, M.Kom": ["jusmita weriza", "dr jusmita weriza", "jusmita"],
  "Prof. Dr. H. Sufyarma Marsidin, M.Pd": ["sufyarma marsidin", "prof sufyarma", "sufyarma"],
  "Dr. Ir. Dewirman Prima Putra, M.Si": ["deirman prima putra", "deirman", "dewirman"],
  "Dr. Susi Delmiati, S.H, M.H": ["susi delmiati", "dr susi delmiati", "delmiati"],
  "Dr. Slamet Riyadi, S.Pd.I, M.A.": ["slamet riyadi", "slamet", "riyadi"],
  "Drs. M. Takdir Mattaliti, M.Si": ["takdir mattaliti", "takdir", "mattaliti"],
  "Dr. Salfadri, S.E., M.Si": ["salfadri", "dr salfadri"],
  "Jhon Rinaldo, S.E., M.Si": ["jhon rinaldo", "jhon", "rinaldo"],
  "Prof. Dr. H. Agussalim M, S.E, M.S. MCE.": ["agussalim", "prof agussalim", "agussalim m"],
  "Dr. Rice Haryati, S.E., M.Si": ["rice haryati", "rice", "haryati"],
  "Dr. Susi Yuliastanty, S.Pd, M.M": ["susi yuliastanty", "yuliastanty"],
  "Dr. Fitriyati, S.H, M.H": ["fitriyati", "dr fitriyati"],
  "Dr. Bisma Putra Pratama, S.H., M.H": ["bisma putra pratama", "bisma", "putra pratama"],
  "Dr. Iyah Faniyah, S.H, M.Hum": ["iyah faniyah", "iyah", "faniyah"],
  "Dr. Neni Vesna Madjid, S.H., M.H": ["neni vesna madjid", "neni", "vesna madjid"],
  "Netrivianti, S.H., M.H": ["netrivianti", "netri"],
  "Dora Tiara, S.H., M.H": ["dora tiara", "dora", "tiara"],
  "Alam Suryo Laksono, S.H., M.H.": ["alam suryo laksono", "alam", "suryo laksono"],
  "Ir. Mahmud, M.Si": ["mahmud", "ir mahmud"],
  "Prof. Dr. Ir. I Ketut Budaraga, M.Si": ["ketut budaraga", "ketut", "budaraga"],
  "Eddwina Aidila Fitria, S.TP, M.Si": ["eddwina aidila fitria", "eddwina", "aidila fitria"],
  "Meriati, S.P, M.P": ["meriati", "s.p meriati"],
  "Wawan Sumarno, S.P, M.Si": ["wawan sumarno", "wawan", "sumarno"],
  "Rera Aga Salihat, S.Si, M.Si": ["rera aga salihat", "rera", "aga salihat"],
  "Rera Agung Syukra, S.Si, M.Si": ["rera agung syukra", "agung syukra"],
  "Dr. Mac Aditiawarman, M.Hum": ["mac aditiawarman", "mac", "aditiawarman"],
  "Drs. Raflis, M.Hum": ["raflis", "drs raflis"],
  "Drs. Risal Abu, S.T, M.Eng": ["risal abu", "risal", "abu"],
  "Adrian Fadhli, S.Pd, M.T": ["adrian fadhli", "adrian", "fadhli"],
  "Dr. Ir. Irnawati Siregar, M.Pd.T": ["irnawati siregar", "irnawati", "siregar"],
  "Dr. Nazili, S.T, M.T": ["nazili", "dr nazili"],
  "Ir. Irmayani, M.T": ["irmayani", "ir irmayani"],
  "Ir. Mukhnizar, M.T": ["mukhnizar", "ir mukhnizar"],
  "Rosnita Rauf, S.T, M.T": ["rosnita rauf", "rosnita", "rauf"],
  "Robby Hotter, S.T, M.T": ["robby hotter", "robby", "hotter"],
  "Merry Thressia, S.Si, M.Si": ["merry thressia", "merry", "thressia"],
  "Budiman, S.T, M.T": ["budiman", "bud"],
  "Dian Wahyuni Dewi Fitri, S.T, M.T": ["dian wahyuni dewi fitri", "dian", "wahyuni"],
  "Drs. Tarma Sartima, M.Si, Ph.D": ["tarma sartima", "tarma", "sartima"],
  "Annisa Fitri, S.Sos, M.AP": ["annisa fitri", "annisa"],
  "Doddie Arya Kusuma B, S.Sos, M.Si": ["doddie arya kusuma", "doddie", "kusuma"],
  "Puryanto, S.A.P, M.A.P": ["puryanto", "pury"],
  "Dr. Sumartono, M.Si": ["sumartono", "sumar"],
  "Yumi Ariyati, S.Sos, M.I.Kom": ["yumi ariyati", "yumi", "ariyati"],
  "Dr. Feby Meuthia Yusuf, M.Pd": ["feby meuthia yusuf", "feby", "meuthia"],
  "Dwi Mutia Chan, S.Pd, M.Pd": ["dwi mutia chan", "dwi", "mutia chan"],
  "Khurnia Budi Utami, S.Pd, M.Pd": ["khurnia budi utami", "khurnia", "budi utami"],
  "Reni Respita, S.Pd, M.Pd.E": ["reni respita", "reni", "respita"],
  "Yessy Marzona, S.Pd, M.Pd": ["yessy marzona", "yessy", "marzona"],
  "Desmiwerita, S.E., M.Si": ["desmiwerita", "desmi"],
  "Dr. Yuli Ardiany, S.E., M.Si, C.Atr": ["yuli ardiany", "yuli", "ardiany"],
  "Dr. Nuraeni Dahri, S.Kom, M.Kom": ["nuraeni dahri", "nuraeni", "dahri"],
  "Harry Setya Hadi, S.Kom, M.Kom": ["harry setya hadi", "harry", "setya hadi"],
};

const normalizeName = (name: string) => {
  return name
    .toLowerCase()
    .replace(/dr\.?|prof\.?|ir\.?|drs\.?|h\.?|s\.?\s*e\.?|s\.?\s*\.?\s*p\.?|s\.?\s*\.?\s*t\.?|s\.?\s*\.?\s*si\.?|m\.?\s*\.?\s*si\.?|m\.?\s*\.?\s*eng\.?|m\.?\s*\.?\s*pd\.?|m\.?\s*\.?\s*hum\.?|m\.?\s*\.?\s*ap\.?|c\.?\s*\.?\s*atr\.?|ph\.?\s*\.?\s*d\.?|s\.?\s*\.?\s*h\.?|s\.?\s*\.?\s*pd\.?\s*i\.?|m\.?\s*\.?\s*a\.?|m\.?\s*\.?\s*ce\.?/gi, "")
    .replace(/[,.]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const normalizeNameForComparison = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
};

const getCoreNameParts = (name: string) => {
  const normalized = name
    .toLowerCase()
    .replace(/dr\.?|prof\.?|ir\.?|drs\.?|h\.?|s\.?\s*e\.?|s\.?\s*\.?\s*p\.?|s\.?\s*\.?\s*t\.?|s\.?\s*\.?\s*si\.?|m\.?\s*\.?\s*si\.?|m\.?\s*\.?\s*eng\.?|m\.?\s*\.?\s*pd\.?|m\.?\s*\.?\s*hum\.?|m\.?\s*\.?\s*ap\.?|c\.?\s*\.?\s*atr\.?|ph\.?\s*\.?\s*d\.?|s\.?\s*\.?\s*h\.?|s\.?\s*\.?\s*pd\.?\s*i\.?|m\.?\s*\.?\s*a\.?|m\.?\s*\.?\s*ce\.?/gi, "")
    .replace(/[,.]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  
  return normalized.split(" ").filter(p => p.length > 0);
};

const findMatchingUser = (targetName: string, users: SimpleUser[]): SimpleUser | undefined => {
  const aliases = NAME_ALIASES[targetName] || [];
  const targetParts = getCoreNameParts(targetName);
  const targetCompare = normalizeNameForComparison(targetName);
  
  if (targetParts.length < 2) return undefined;
  
  const targetLastName = targetParts[targetParts.length - 1];
  const targetSecondLast = targetParts.length > 1 ? targetParts[targetParts.length - 2] : "";
  
  let bestMatch: SimpleUser | undefined = undefined;
  let bestMatchScore = 0;
  
  for (const user of users) {
    const userParts = getCoreNameParts(user.full_name);
    const userCompare = normalizeNameForComparison(user.full_name);
    
    if (userParts.length < 2) continue;
    
    const userLastName = userParts[userParts.length - 1];
    const userSecondLast = userParts.length > 1 ? userParts[userParts.length - 2] : "";
    
    let score = 0;
    
    for (const alias of aliases) {
      const normalizedAlias = normalizeNameForComparison(alias);
      if (userCompare === normalizedAlias || userCompare.includes(normalizedAlias) || normalizedAlias.includes(userCompare)) {
        score += 100;
        break;
      }
    }
    
    if (userLastName === targetLastName) {
      score += 10;
      
      if (userSecondLast === targetSecondLast) {
        score += 20;
      }
      
      if (userCompare === targetCompare) {
        score += 50;
      } else if (userCompare.includes(targetCompare) || targetCompare.includes(userCompare)) {
        score += 30;
      }
    }
    
    if (score > bestMatchScore) {
      bestMatchScore = score;
      bestMatch = user;
    }
  }
  
  return bestMatchScore >= 10 ? bestMatch : undefined;
};

export default function Rekap() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  
  const [kategori, setKategori] = useState<"dosen_struktural" | "tendik" | null>(null);
  const [reportType, setReportType] = useState<"mingguan" | "bulanan" | "keseluruhan" | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(
    formatDateKeyWib(new Date()).slice(0, 7)
  );
  const [selectedWeek, setSelectedWeek] = useState<number>(0);
  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [attendances, setAttendances] = useState<SimpleAttendance[]>([]);
  const [leavePermits, setLeavePermits] = useState<LeavePermit[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showDetailedReport, setShowDetailedReport] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SimpleUser | null>(null);
  const [detailedAttendances, setDetailedAttendances] = useState<AttendanceDetail[]>([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, username, full_name, unit_kerja, role, is_struktural")
        .neq("role", "mahasiswa")
        .order("full_name");
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Gagal memuat data pengguna", error);
    }
  };

  const loadData = async () => {
    if (!kategori || !reportType) return;

    setLoading(true);
    const [year, month] = selectedMonth.split("-").map(Number);

    let startDate: Date;
    let endDate: Date;

    if (reportType === "mingguan") {
      const weeks = getWeekRanges(year, month);
      if (selectedWeek >= weeks.length) {
        setSelectedWeek(weeks.length - 1);
      }
      const selectedWeekRange = weeks[selectedWeek];
      startDate = selectedWeekRange.start;
      endDate = selectedWeekRange.end;
    } else if (reportType === "keseluruhan") {
      // Behave like "Unduh PDF Semua" on LaporanKehadiran2: download ONE PDF with many pages.
      try {
        const usersToExport = filteredAndOrderedUsers;
        if (usersToExport.length === 0) return;

        const [exportYear, exportMonth] = selectedMonth.split("-").map(Number);
        const exportStartDate = new Date(exportYear, exportMonth - 1, 1);
        const exportEndDate = new Date(exportYear, exportMonth, 0);

        // Shared data for all users (leave + holidays)
        const { data: leaveData, error: leaveError } = await supabase
          .from("leave_permits")
          .select("id, user_id, permit_type, start_date, end_date")
          .lte("start_date", formatDateKeyWib(exportEndDate))
          .gte("end_date", formatDateKeyWib(exportStartDate));
        if (leaveError) throw leaveError;
        setLeavePermits(leaveData || []);

        const { data: holidayData, error: holidayError } = await supabase
          .from("holidays")
          .select("holiday_date, description, is_active")
          .eq("is_active", true)
          .gte("holiday_date", formatDateKeyWib(exportStartDate))
          .lte("holiday_date", formatDateKeyWib(exportEndDate));
        if (holidayError) throw holidayError;
        setHolidays(holidayData || []);

        // Prepare single PDF document
        const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" }) as PdfDocument;

        let logoData: string | null = null;
        try {
          logoData = await fetch("/unes.png")
            .then((r) => r.blob())
            .then(
              (blob) =>
                new Promise<string>((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = () => resolve(reader.result as string);
                  reader.onerror = () => reject(new Error("Failed to read logo"));
                  reader.readAsDataURL(blob);
                })
            );
        } catch (error) {
          console.warn("Logo tidak dapat dimuat untuk PDF:", error);
        }

        for (let userIndex = 0; userIndex < usersToExport.length; userIndex++) {
          const user = usersToExport[userIndex];

          // Load detailed attendances with photo_url
          const { data: attendanceData, error: attendanceError } = await supabase
            .from("attendances")
            .select("id, user_id, attendance_type, created_at, photo_url, status, note")
            .eq("user_id", user.id)
            .gte("created_at", exportStartDate.toISOString())
            .lte("created_at", exportEndDate.toISOString())
            .order("created_at", { ascending: true });
          if (attendanceError) throw attendanceError;

            const holidayMap = new Map(holidayData.map((h) => [h.holiday_date, h.description] as const));

          const attendanceByDate = new Map<string, { masuk?: AttendanceDetail; pulang?: AttendanceDetail }>();
          const filteredAttendance = (attendanceData || []).filter((att) => !(att.note && (att.note.includes("Sesi:") || att.note.includes("KKN"))));
          filteredAttendance.forEach((att) => {
            const dateKey = formatDateKeyWib(new Date(att.created_at));
            if (!attendanceByDate.has(dateKey)) {
              attendanceByDate.set(dateKey, {});
            }
            const record = attendanceByDate.get(dateKey)!;
            if (att.attendance_type === "masuk") {
              record.masuk = att;
            } else {
              record.pulang = att;
            }
          });

          const leaveByDate = new Map<string, LeavePermit>();
          (leaveData || []).forEach((leave) => {
            const start = new Date(leave.start_date);
            const end = new Date(leave.end_date);
            const curr = new Date(start);
            while (curr <= end) {
              const dateKey = formatDateKeyWib(curr);
              leaveByDate.set(dateKey, leave);
              curr.setDate(curr.getDate() + 1);
            }
          });

          const dailyAttendance: DailyAttendance[] = [];
          const current = new Date(exportStartDate);
          while (current <= exportEndDate) {
            const dateKey = formatDateKeyWib(current);
            const dayName = current.toLocaleDateString("id-ID", { weekday: "long" });

            const attendance = attendanceByDate.get(dateKey);
            const leave = leaveByDate.get(dateKey);
            const holidayDesc = holidayMap.get(dateKey);

            dailyAttendance.push({
              date: dateKey,
              day: dayName,
              masuk: attendance?.masuk,
              pulang: attendance?.pulang,
              leave,
              isHoliday: !!holidayDesc,
              holidayDescription: holidayDesc,
            });

            current.setDate(current.getDate() + 1);
          }

          // Update state only for header safety (single-user view still uses it)
          setSelectedUser(user);
          setDetailedAttendances(attendanceData || []);

          if (userIndex > 0) {
            doc.addPage();
          }

          await renderRekapKeseluruhanPdfToDoc(doc, {
            user,
            dailyAttendance,
            logoData,
          });
        }

        doc.save(`Rekap_Keseluruhan_${kategori}_${selectedMonth}.pdf`);
      } catch (error) {
        console.error("Gagal mengunduh rekap keseluruhan", error);
      } finally {
        setSelectedUser(null);
        setDetailedAttendances([]);
        setLoading(false);
      }
      return;
    } else {
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0);
    }

    try {
      const { data: attendanceData, error: attendanceError } = await supabase
        .from("attendances")
        .select("id, user_id, attendance_type, created_at, note")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());
      if (attendanceError) throw attendanceError;
      const filtered = (attendanceData || []).filter((a: any) => !(a.note && (a.note.includes("Sesi:") || a.note.includes("KKN"))));
      setAttendances(filtered);

      const { data: leaveData, error: leaveError } = await supabase
        .from("leave_permits")
        .select("id, user_id, permit_type, start_date, end_date")
        .lte("start_date", formatDateKeyWib(endDate))
        .gte("end_date", formatDateKeyWib(startDate));
      if (leaveError) throw leaveError;
      setLeavePermits(leaveData || []);

      const { data: holidayData, error: holidayError } = await supabase
        .from("holidays")
        .select("holiday_date, description, is_active")
        .eq("is_active", true)
        .gte("holiday_date", formatDateKeyWib(startDate))
        .lte("holiday_date", formatDateKeyWib(endDate));
      if (holidayError) throw holidayError;
      setHolidays(holidayData || []);
    } catch (error) {
      console.error("Gagal memuat data", error);
    } finally {
      setLoading(false);
      setShowReport(true);
    }
  };

  const loadDetailedReport = async (user: SimpleUser) => {
    setLoading(true);
    setSelectedUser(user);
    const [year, month] = selectedMonth.split("-").map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    try {
      // Load detailed attendances with photo_url
      const { data: attendanceData, error: attendanceError } = await supabase
        .from("attendances")
        .select("id, user_id, attendance_type, created_at, photo_url, status, note")
        .eq("user_id", user.id)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())
        .order("created_at", { ascending: true });
      if (attendanceError) throw attendanceError;
      const filtered = (attendanceData || []).filter((a: any) => !(a.note && (a.note.includes("Sesi:") || a.note.includes("KKN"))));
      setDetailedAttendances(filtered || []);
      
      // Load leave permits
      const { data: leaveData, error: leaveError } = await supabase
        .from("leave_permits")
        .select("id, user_id, permit_type, start_date, end_date")
        .eq("user_id", user.id)
        .lte("start_date", formatDateKeyWib(endDate))
        .gte("end_date", formatDateKeyWib(startDate));
      if (leaveError) throw leaveError;
      setLeavePermits(leaveData || []);

      // Load holidays
      const { data: holidayData, error: holidayError } = await supabase
        .from("holidays")
        .select("holiday_date, description, is_active")
        .eq("is_active", true)
        .gte("holiday_date", formatDateKeyWib(startDate))
        .lte("holiday_date", formatDateKeyWib(endDate));
      if (holidayError) throw holidayError;
      setHolidays(holidayData || []);
      
      // For Rekap Keseluruhan, immediately generate PDF (no HTML preview)
      setShowDetailedReport(false);
      setShowReport(false);

      await buildRekapKeseluruhanPdf();

      // Keep user selection screen after download
      setSelectedUser(null);
      setShowDetailedReport(true);
    } catch (error) {
      console.error("Gagal memuat data detail", error);
    } finally {
      setLoading(false);
    }
  };

  const weekRanges = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    return getWeekRanges(year, month);
  }, [selectedMonth]);

  const monthLabel = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString("id-ID", {
      month: "long",
      year: "numeric"
    });
  }, [selectedMonth]);

  const filteredAndOrderedUsers = useMemo(() => {
    let filtered: SimpleUser[] = [];
    
    if (kategori === "dosen_struktural") {
      filtered = users.filter(u => {
        if (u.username === 'tesx' || u.username === 'andi.syahrum.makkurade') return false; // Exclude tesx + andi.syahrum.makkurade

        const role = (u.role || "").toLowerCase();
        return u.is_struktural === true && (role === "dosen" || role === "admin" || role === "superadmin");
      });
      
      const ordered: SimpleUser[] = [];
      DOSEN_STRUKTURAL_ORDER.forEach(target => {
        const match = findMatchingUser(target.name, filtered);
        if (match && !ordered.find(o => o.id === match.id)) {
          ordered.push(match);
        }
      });
      
      filtered.forEach(u => {
        if (!ordered.find(o => o.id === u.id)) {
          ordered.push(u);
        }
      });
      
      return ordered;
    } else if (kategori === "tendik") {
      filtered = users.filter(u => {
        if (u.username === 'tesx' || u.username === 'andi.syahrum.makkurade' || (u.username ?? '').includes('tesx') || (u.full_name ?? '').toLowerCase().includes('tesx')) return false;

        // Explicit inclusions for specific admin/superadmin users who are Tendik
        if (u.username === 'irfan.ananda.ismail' || u.username === 'asmara.indah') {
          return true;
        }

        const role = (u.role || "").toLowerCase();
        const isTendikRole = role === "pegawai" || role === "admin" || role === "superadmin";
        if (!isTendikRole) return false;

        const unitKerja = (u.unit_kerja || "").toLowerCase();
        const excluded = [
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
        return !excluded.some(keyword => unitKerja.includes(keyword));
      });
      return filtered.sort((a, b) => a.full_name.localeCompare(b.full_name));
    }
    
    return [];
  }, [users, kategori]);

  const reportData = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    let startDate: Date;
    let endDate: Date;
    
    if (reportType === "mingguan") {
      const week = weekRanges[selectedWeek];
      startDate = week.start;
      endDate = week.end;
    } else {
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0);
    }
    
    // Create a set of holiday dates for quick lookup
    const holidayDateSet = new Set(
      holidays.map(h => h.holiday_date)
    );
    
    const workingDays = (() => {
      let count = 0;
      const current = new Date(startDate);
      while (current <= endDate) {
        const day = current.getDay();
        const dateStr = formatDateKeyWib(current);
        // Count only Mon-Sat (not Sunday) AND not a holiday
        if (day !== 0 && !holidayDateSet.has(dateStr)) {
          count++;
        }
        current.setDate(current.getDate() + 1);
      }
      return count;
    })();
    
    const attendanceMap = new Map<string, { masuk: Set<string>; pulang: Set<string> }>();
    attendances.forEach(att => {
      const date = formatDateKeyWib(new Date(att.created_at));
      if (!attendanceMap.has(att.user_id)) {
        attendanceMap.set(att.user_id, { masuk: new Set(), pulang: new Set() });
      }
      const record = attendanceMap.get(att.user_id)!;
      if (att.attendance_type === "masuk") record.masuk.add(date);
      if (att.attendance_type === "pulang") record.pulang.add(date);
    });
    
    const leaveMap = new Map<string, Set<string>>();
    leavePermits.forEach(leave => {
      const start = new Date(leave.start_date);
      const end = new Date(leave.end_date);
      const current = new Date(start);
      while (current <= end) {
        if (current >= startDate && current <= endDate) {
          const dateStr = formatDateKeyWib(current);
          if (!leaveMap.has(leave.user_id)) {
            leaveMap.set(leave.user_id, new Set());
          }
          leaveMap.get(leave.user_id)!.add(dateStr);
        }
        current.setDate(current.getDate() + 1);
      }
    });
    
    return filteredAndOrderedUsers.map(user => {
      const attRecord = attendanceMap.get(user.id) || { masuk: new Set(), pulang: new Set() };
      const leaveDates = leaveMap.get(user.id) || new Set<string>();
      
      const current = new Date(startDate);
       let hadirMasuk = 0;
       let hadirPulang = 0;
       let tidakMasuk = 0;
       let tidakPulang = 0;
       let izinCuti = 0;
       let totalTidakMasukBekerja = 0;

      
      while (current <= endDate) {
        const day = current.getDay();
        const dateStr = formatDateKeyWib(current);
        const isHoliday = holidayDateSet.has(dateStr);
        
        // Only count working days (Mon-Sat, not Sunday, not holiday)
        if (day !== 0 && !isHoliday) {
          const hasAttMasuk = attRecord.masuk.has(dateStr);
          const hasAttPulang = attRecord.pulang.has(dateStr);
          const hasLeave = leaveDates.has(dateStr);
          
           if (hasLeave) {
             izinCuti++;
           } else {
             if (!hasAttMasuk) tidakMasuk++;
             if (!hasAttPulang) tidakPulang++;
             if (hasAttMasuk) hadirMasuk++;
             if (hasAttPulang) hadirPulang++;

             // Hari dianggap masuk kerja jika ada salah satu absen (masuk/pulang)
             const hasAnyAttendance = hasAttMasuk || hasAttPulang;
             if (!hasAnyAttendance) totalTidakMasukBekerja++;
           }

        }
        current.setDate(current.getDate() + 1);
      }
      
       const totalTidakMasuk = totalTidakMasukBekerja;
       const kehadiranPercent = workingDays > 0 
         ? Math.round(((workingDays - totalTidakMasukBekerja) / workingDays) * 100) 
         : 0;

      
      return {
        user,
        no: 0,
        hariKerja: workingDays,
        absenMasuk: hadirMasuk,
        absenPulang: hadirPulang,
        tidakMasuk,
        tidakPulang,
        izinCuti,
        totalTidakMasuk,
        kehadiranPercent
      };
    }).map((item, idx) => ({ ...item, no: idx + 1 }));
  }, [filteredAndOrderedUsers, attendances, leavePermits, holidays, selectedMonth, reportType, selectedWeek, weekRanges]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const currentWeekRange = weekRanges[selectedWeek];

  const generateDailyAttendance = useMemo(() => {
    if (!selectedUser || reportType !== "keseluruhan") return [];
    
    const [year, month] = selectedMonth.split("-").map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const dailyData: DailyAttendance[] = [];
    const current = new Date(startDate);
    
    // Create maps for quick lookup
    const holidayMap = new Map(holidays.map(h => [h.holiday_date, h.description]));
    
    const attendanceByDate = new Map<string, { masuk?: AttendanceDetail; pulang?: AttendanceDetail }>();
    detailedAttendances.forEach(att => {
      const dateKey = formatDateKeyWib(new Date(att.created_at));
      if (!attendanceByDate.has(dateKey)) {
        attendanceByDate.set(dateKey, {});
      }
      const record = attendanceByDate.get(dateKey)!;
      if (att.attendance_type === "masuk") {
        record.masuk = att;
      } else {
        record.pulang = att;
      }
    });
    
    const leaveByDate = new Map<string, LeavePermit>();
    leavePermits.forEach(leave => {
      const start = new Date(leave.start_date);
      const end = new Date(leave.end_date);
      const curr = new Date(start);
      while (curr <= end) {
        const dateKey = formatDateKeyWib(curr);
        leaveByDate.set(dateKey, leave);
        curr.setDate(curr.getDate() + 1);
      }
    });
    
    const counter = 1;

    while (current <= endDate) {
      const dateKey = formatDateKeyWib(current);
      const dayName = current.toLocaleDateString("id-ID", { weekday: "long" });
      
      const attendance = attendanceByDate.get(dateKey);
      const leave = leaveByDate.get(dateKey);
      const holidayDesc = holidayMap.get(dateKey);
      
      dailyData.push({
        date: dateKey,
        day: dayName,
        masuk: attendance?.masuk,
        pulang: attendance?.pulang,
        leave: leave,
        isHoliday: !!holidayDesc,
        holidayDescription: holidayDesc
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return dailyData;
  }, [selectedUser, selectedMonth, detailedAttendances, leavePermits, holidays, reportType]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "Asia/Jakarta"
    });
  };

  const formatTimeShort = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    });
  };

  const formatDateLong = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatDayName = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("id-ID", { weekday: "long" });
  };

  const fetchTelegramPhoto = async (photoUrl: string): Promise<string | null> => {
    try {
      if (!photoUrl) return null;
      if (photoUrl.includes("t.me/")) return null;
      if (!photoUrl.startsWith("telegram:file:")) return null;

      const fileId = photoUrl.replace("telegram:file:", "");
      const response = await fetch(`/api/telegram-photo?file_id=${encodeURIComponent(fileId)}`);
      if (!response.ok) return null;

      const result = await response.json();
      if (!result?.ok || !result?.dataUrl) return null;

      return result.dataUrl as string;
    } catch (error) {
      console.error("Error fetching Telegram photo:", error);
      return null;
    }
  };

  const renderRekapKeseluruhanPdfToDoc = async (
    doc: PdfDocument,
    params: {
      user: SimpleUser;
      dailyAttendance: DailyAttendance[];
      logoData?: string | null;
    }
  ) => {
    const { user, dailyAttendance, logoData } = params;

    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 36;
    let currentY = 36;

    if (logoData) {
      try {
        doc.addImage(logoData, "PNG", marginX, currentY - 8, 60, 60);
      } catch (error) {
        console.warn("Logo tidak dapat dimuat untuk PDF:", error);
      }
    }

    doc.setTextColor(0, 0, 0);

    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.text("YAYASAN PERGURUAN TINGGI PADANG", pageWidth / 2, currentY, { align: "center" });
    currentY += 20;

    doc.setFontSize(16);
    doc.text("UNIVERSITAS EKASAKTI", pageWidth / 2, currentY, { align: "center" });
    currentY += 22;

    doc.setFont("times", "normal");
    doc.setFontSize(11);
    doc.text("Jl. Veteran Dalam No. 26 Padang (25113) Telp. (0751) 28859-26770", pageWidth / 2, currentY, {
      align: "center",
    });
    currentY += 16;
    doc.text("Fax. (0751) 32694; https://unespadang.ac.id/", pageWidth / 2, currentY, { align: "center" });
    currentY += 14;

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1);
    doc.line(marginX, currentY, pageWidth - marginX, currentY);
    currentY += 22;

    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.text("LAPORAN KEHADIRAN PEGAWAI", pageWidth / 2, currentY, { align: "center" });
    currentY += 22;

    doc.setFont("times", "normal");
    doc.setFontSize(11);
    doc.text("Nama", marginX, currentY);
    doc.text(`: ${user.full_name}`, marginX + 120, currentY);
    currentY += 16;

    doc.text("Jabatan", marginX, currentY);
    doc.text(`: ${user.role === "dosen" ? "Dosen" : "Pegawai"}`, marginX + 120, currentY);
    currentY += 16;

    doc.text("Periode", marginX, currentY);
    doc.text(`: ${monthLabel}`, marginX + 120, currentY);
    currentY += 20;

    const photoCache = new Map<string, string>();
    for (const day of dailyAttendance) {
      if (day.masuk?.photo_url) {
        const photo = await fetchTelegramPhoto(day.masuk.photo_url);
        if (photo) photoCache.set(`masuk-${day.date}`, photo);
      }
      if (day.pulang?.photo_url) {
        const photo = await fetchTelegramPhoto(day.pulang.photo_url);
        if (photo) photoCache.set(`pulang-${day.date}`, photo);
      }
    }

    const tableBody = dailyAttendance.map((day, index) => {
      const isSunday = day.day.toLowerCase() === "minggu";
      const keterangan = day.isHoliday
        ? `Libur Nasional: ${day.holidayDescription}`
        : day.leave
          ? day.leave.permit_type === "izin"
            ? "Izin"
            : day.leave.permit_type === "cuti"
              ? "Cuti"
              : "Dinas Luar"
          : isSunday
            ? "Hari Minggu"
            : day.masuk || day.pulang
              ? "Hadir"
              : "-";

      const buktiMasuk = day.masuk?.photo_url ? "" : "Tidak ada bukti";
      const buktiPulang = day.pulang?.photo_url ? "" : "Tidak ada bukti";

      return [
        index + 1,
        day.day,
        formatDateLong(day.date),
        day.masuk ? formatTimeShort(day.masuk.created_at) : "-",
        buktiMasuk,
        day.pulang ? formatTimeShort(day.pulang.created_at) : "-",
        buktiPulang,
        keterangan,
      ];
    });

    autoTable(doc, {
      head: [["No", "Hari", "Tanggal", "Jam Masuk", "Bukti Masuk", "Jam Pulang", "Bukti Pulang", "Keterangan"]],
      body: tableBody,
      startY: currentY,
      margin: { left: 24, right: 24, top: 36, bottom: 36 },
      styles: {
        font: "times",
        fontSize: 8,
        cellPadding: 3,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.5,
        halign: "center",
        minCellHeight: 52,
      },
      headStyles: {
        font: "times",
        fillColor: [245, 245, 245],
        textColor: [0, 0, 0],
        lineWidth: 0.5,
        fontSize: 8,
        halign: "center",
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 45 },
        2: { cellWidth: 75 },
        3: { cellWidth: 55 },
        4: { cellWidth: 55 },
        5: { cellWidth: 55 },
        6: { cellWidth: 55 },
        7: { cellWidth: 90 },
      },
      didDrawCell: (data) => {
        if (data.cell.section !== "body") return;

        const rowData = dailyAttendance[data.row.index];
        if (!rowData) return;

        const isSunday = rowData.day.toLowerCase() === "minggu";
        const skipEvidence = Boolean(rowData.isHoliday) || Boolean(rowData.leave) || isSunday;
        if (skipEvidence) return;

        if (data.column.index === 4) {
          const photoBase64 = photoCache.get(`masuk-${rowData.date}`);
          if (photoBase64) {
            const imgSize = Math.min(data.cell.width - 4, data.cell.height - 4);
            const imgX = data.cell.x + (data.cell.width - imgSize) / 2;
            const imgY = data.cell.y + (data.cell.height - imgSize) / 2;
            try {
              doc.addImage(photoBase64, "JPEG", imgX, imgY, imgSize, imgSize);
            } catch (err) {
              console.error("Failed to add masuk image:", err);
            }
          }
        }

        if (data.column.index === 6) {
          const photoBase64 = photoCache.get(`pulang-${rowData.date}`);
          if (photoBase64) {
            const imgSize = Math.min(data.cell.width - 4, data.cell.height - 4);
            const imgX = data.cell.x + (data.cell.width - imgSize) / 2;
            const imgY = data.cell.y + (data.cell.height - imgSize) / 2;
            try {
              doc.addImage(photoBase64, "JPEG", imgX, imgY, imgSize, imgSize);
            } catch (err) {
              console.error("Failed to add pulang image:", err);
            }
          }
        }
      },
    });
  };

  const buildRekapKeseluruhanPdf = async () => {
    if (!selectedUser) return;

    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" }) as PdfDocument;

    let logoData: string | null = null;
    try {
      logoData = await fetch("/unes.png")
        .then((r) => r.blob())
        .then(
          (blob) =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = () => reject(new Error("Failed to read logo"));
              reader.readAsDataURL(blob);
            })
        );
    } catch (error) {
      console.warn("Logo tidak dapat dimuat untuk PDF:", error);
    }

    await renderRekapKeseluruhanPdfToDoc(doc, {
      user: selectedUser,
      dailyAttendance: generateDailyAttendance,
      logoData,
    });

    const safeName = selectedUser.full_name.replace(/[^a-z0-9]/gi, "_");
    doc.save(`Laporan_Kehadiran_${safeName}_${selectedMonth}.pdf`);
  };

  // Detailed report view for individual user
  if (showReport && reportType === "keseluruhan" && selectedUser) {
    return (
      <div className="min-h-screen bg-gray-100 print:bg-white">
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30 print:hidden">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowReport(false);
                  setShowDetailedReport(true);
                  setSelectedUser(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="text-xs text-gray-500">Laporan Kehadiran Pegawai</p>
                  <h1 className="text-lg font-bold text-gray-900">{selectedUser.full_name}</h1>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          <div id="report-content" className="bg-white shadow-lg mx-auto" style={{ width: "210mm", minHeight: "297mm" }}>
            <div className="p-8">
              {/* Kop Surat */}
              <div className="border-b-4 border-gray-900 pb-3 mb-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <img src="/unes.png" alt="Logo UNES" className="h-24 w-24 object-contain" />
                  </div>
                  <div className="flex-1 text-center pt-2">
                    <h1 className="text-base font-bold text-gray-900 uppercase tracking-wide" style={{ fontSize: "20px" }}>
                      YAYASAN PERGURUAN TINGGI PADANG
                    </h1>
                    <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wide mt-1" style={{ fontSize: "24px" }}>
                      UNIVERSITAS EKASAKTI
                    </h2>
                    <p className="text-gray-700 mt-1" style={{ fontSize: "14px" }}>
                      Jl. Veteran Dalam No. 26 Padang (25113) Telp. (0751) 28859-26770
                    </p>
                    <p className="text-gray-700" style={{ fontSize: "14px" }}>
                      Fax. (0751) 32694; https://unespadang.ac.id/
                    </p>
                  </div>
                  <div className="flex-shrink-0 w-24"></div>
                </div>
              </div>
              
              <div className="text-center mb-4">
                <h2 className="font-bold text-gray-900 uppercase tracking-wide" style={{ fontSize: "20px" }}>
                  Laporan Kehadiran Pegawai
                </h2>
              </div>

              <div className="mb-6" style={{ fontSize: "14px" }}>
                <table className="w-full">
                  <tbody>
                    <tr>
                      <td className="py-1 font-bold" style={{ width: "120px" }}>Nama</td>
                      <td className="py-1">: {selectedUser.full_name}</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-bold">Jabatan</td>
                      <td className="py-1">: {selectedUser.role === "dosen" ? "Dosen" : "Pegawai"}</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-bold">Periode</td>
                      <td className="py-1">: {monthLabel}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <table className="w-full border-collapse" style={{ fontSize: "11px" }}>
                <thead>
                  <tr>
                    <th className="border border-gray-900 p-2 text-center bg-gray-100 font-bold" style={{ width: "4%" }}>No</th>
                    <th className="border border-gray-900 p-2 text-center bg-gray-100 font-bold" style={{ width: "10%" }}>Hari</th>
                    <th className="border border-gray-900 p-2 text-center bg-gray-100 font-bold" style={{ width: "10%" }}>Tanggal</th>
                    <th className="border border-gray-900 p-2 text-center bg-gray-100 font-bold" style={{ width: "8%" }}>Jam Absen Masuk</th>
                    <th className="border border-gray-900 p-2 text-center bg-gray-100 font-bold" style={{ width: "15%" }}>Bukti Absen Masuk</th>
                    <th className="border border-gray-900 p-2 text-center bg-gray-100 font-bold" style={{ width: "8%" }}>Jam Absen Pulang</th>
                    <th className="border border-gray-900 p-2 text-center bg-gray-100 font-bold" style={{ width: "15%" }}>Bukti Absen Pulang</th>
                    <th className="border border-gray-900 p-2 text-center bg-gray-100 font-bold" style={{ width: "30%" }}>Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {generateDailyAttendance.map((day, index) => (
                    <tr key={day.date}>
                      <td className="border border-gray-900 p-2 text-center">{index + 1}</td>
                      <td className="border border-gray-900 p-2 text-center">{day.day}</td>
                      <td className="border border-gray-900 p-2 text-center">
                        {new Date(day.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="border border-gray-900 p-2 text-center">
                        {day.masuk ? formatTime(day.masuk.created_at) : "-"}
                      </td>
                      <td className="border border-gray-900 p-2 text-center">
                        {day.masuk && day.masuk.photo_url ? (
                          <img 
                            src={day.masuk.photo_url} 
                            alt="Bukti Masuk" 
                            className="w-16 h-16 object-cover mx-auto rounded"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling!.textContent = 'Foto tidak tersedia';
                            }}
                          />
                        ) : (
                          <span className="text-gray-500 text-xs">Tidak ada bukti</span>
                        )}
                        <span className="hidden text-gray-500 text-xs"></span>
                      </td>
                      <td className="border border-gray-900 p-2 text-center">
                        {day.pulang ? formatTime(day.pulang.created_at) : "-"}
                      </td>
                      <td className="border border-gray-900 p-2 text-center">
                        {day.pulang && day.pulang.photo_url ? (
                          <img 
                            src={day.pulang.photo_url} 
                            alt="Bukti Pulang" 
                            className="w-16 h-16 object-cover mx-auto rounded"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling!.textContent = 'Foto tidak tersedia';
                            }}
                          />
                        ) : (
                          <span className="text-gray-500 text-xs">Tidak ada bukti</span>
                        )}
                        <span className="hidden text-gray-500 text-xs"></span>
                      </td>
                      <td className="border border-gray-900 p-2 text-left">
                        {day.isHoliday ? (
                          <span className="font-bold text-red-700">Libur Nasional: {day.holidayDescription}</span>
                        ) : day.leave ? (
                          <span className="font-bold text-blue-700">
                            {day.leave.permit_type === "izin" ? "Izin" : day.leave.permit_type === "cuti" ? "Cuti" : "Dinas Luar"}
                          </span>
                        ) : day.day === "Minggu" ? (
                          <span className="text-gray-600">Hari Minggu</span>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User selection view for detailed report
  if (showDetailedReport && reportType === "keseluruhan") {
    return (
      <div className="min-h-screen bg-slate-50 w-full overflow-x-hidden font-sans">
        <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-40">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 w-full">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowDetailedReport(false);
                  setReportType(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <FileBarChart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Pilih Pegawai</p>
                  <h1 className="text-lg font-bold text-slate-800">Rekap Keseluruhan</h1>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 pb-24">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
              <h2 className="text-xl font-bold text-slate-800 mb-2">
                {kategori === "dosen_struktural" ? "Dosen Struktural" : "Tenaga Kependidikan"}
              </h2>
              <p className="text-slate-500 mb-4">Periode: {monthLabel}</p>
              <p className="text-sm text-slate-600">Pilih pegawai untuk melihat laporan kehadiran detail</p>
            </div>

            <div className="grid gap-3">
              {filteredAndOrderedUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => loadDetailedReport(user)}
                  disabled={loading}
                  className="bg-white rounded-xl border border-slate-200 p-4 hover:border-blue-500 hover:shadow-md transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">{user.full_name}</p>
                      <p className="text-sm text-slate-500">{user.unit_kerja || "-"}</p>
                    </div>
                    <ChevronDown className="w-5 h-5 text-slate-400 rotate-[-90deg]" />
                  </div>
                </button>
              ))}
            </div>

            {loading && (
              <div className="flex justify-center items-center py-12">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  if (showReport) {
    return (
      <div className="min-h-screen bg-gray-100 print:bg-white">
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30 print:hidden">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowReport(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="text-xs text-gray-500">Laporan Rekapitulasi</p>
                  <h1 className="text-lg font-bold text-gray-900">
                    {kategori === "dosen_struktural" ? "Dosen Struktural" : "Tendik"} - {" "}
                    {reportType === "mingguan" ? "Mingguan" : "Bulanan"}
                  </h1>
                </div>
              </div>
            </div>

          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          <div id="report-content" className="bg-white shadow-lg mx-auto" style={{ width: "297mm", minHeight: "210mm" }}>
            <div className="p-8">
              {/* Kop Surat Formal */}
              <div className="border-b-4 border-gray-900 pb-3 mb-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <img src="/unes.png" alt="Logo UNES" className="h-24 w-24 object-contain" />
                  </div>
                  <div className="flex-1 text-center pt-2">
                    <h1 className="text-base font-bold text-gray-900 uppercase tracking-wide" style={{ fontSize: "20px" }}>
                      YAYASAN PERGURUAN TINGGI PADANG
                    </h1>
                    <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wide mt-1" style={{ fontSize: "24px" }}>
                      UNIVERSITAS EKASAKTI
                    </h2>
                    <p className="text-gray-700 mt-1" style={{ fontSize: "14px" }}>
                      Jl. Veteran Dalam No. 26 Padang (25113) Telp. (0751) 28859-26770
                    </p>
                    <p className="text-gray-700" style={{ fontSize: "14px" }}>
                      Fax. (0751) 32694; https://unespadang.ac.id/
                    </p>
                  </div>
                  <div className="flex-shrink-0 w-24"></div>
                </div>
              </div>
              
              <div className="text-center mb-4">
                <h2 className="font-bold text-gray-900 uppercase tracking-wide" style={{ fontSize: "20px" }}>
                  Laporan Rekapitulasi Kehadiran
                </h2>
                <p className="text-gray-600 mt-1" style={{ fontSize: "16px" }}>
                  {kategori === "dosen_struktural" ? "Dosen Struktural" : "Tenaga Kependidikan"} - {" "}
                  {reportType === "mingguan" 
                    ? `Minggu Ke-${selectedWeek + 1} (${formatDateId(currentWeekRange.start)} s.d. ${formatDateId(currentWeekRange.end)})`
                    : monthLabel
                  }
                </p>
              </div>

              <table className="w-full border-collapse" style={{ fontSize: "12px" }}>
                <thead>
                  <tr>
                    <th className="border border-gray-900 p-2 text-center bg-gray-100 font-bold" rowSpan={2} style={{ width: "5%" }}>No</th>
                    <th className="border border-gray-900 p-2 text-center bg-gray-100 font-bold" rowSpan={2} style={{ width: "25%" }}>Nama Pegawai</th>
                    <th className="border border-gray-900 p-2 text-center bg-gray-100 font-bold" rowSpan={2} style={{ width: "8%" }}>Hari Kerja</th>
                    <th className="border border-gray-900 p-2 text-center bg-gray-100 font-bold" colSpan={2} style={{ width: "16%" }}>Absen</th>
                    <th className="border border-gray-900 p-2 text-center bg-gray-100 font-bold" colSpan={2} style={{ width: "16%" }}>Tidak</th>
                    <th className="border border-gray-900 p-2 text-center bg-gray-100 font-bold" rowSpan={2} style={{ width: "12%" }}>Izin/Cuti/Dinas</th>
                    <th className="border border-gray-900 p-2 text-center bg-gray-100 font-bold" rowSpan={2} style={{ width: "10%" }}>Total Tidak Masuk</th>
                    <th className="border border-gray-900 p-2 text-center bg-gray-100 font-bold" rowSpan={2} style={{ width: "8%" }}>Kehadiran (%)</th>
                  </tr>
                  <tr>
                    <th className="border border-gray-900 p-2 text-center bg-gray-100 font-bold" style={{ width: "8%" }}>Masuk</th>
                    <th className="border border-gray-900 p-2 text-center bg-gray-100 font-bold" style={{ width: "8%" }}>Pulang</th>
                    <th className="border border-gray-900 p-2 text-center bg-gray-100 font-bold" style={{ width: "8%" }}>Masuk</th>
                    <th className="border border-gray-900 p-2 text-center bg-gray-100 font-bold" style={{ width: "8%" }}>Pulang</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((item) => (
                    <tr key={item.user.id}>
                      <td className="border border-gray-900 p-2 text-center">{item.no}</td>
                      <td className="border border-gray-900 p-2 text-left">{item.user.full_name}</td>
                      <td className="border border-gray-900 p-2 text-center">{item.hariKerja}</td>
                      <td className="border border-gray-900 p-2 text-center">{item.absenMasuk}</td>
                      <td className="border border-gray-900 p-2 text-center">{item.absenPulang}</td>
                      <td className="border border-gray-900 p-2 text-center">{item.tidakMasuk}</td>
                      <td className="border border-gray-900 p-2 text-center">{item.tidakPulang}</td>
                      <td className="border border-gray-900 p-2 text-center">{item.izinCuti}</td>
                      <td className="border border-gray-900 p-2 text-center">{item.totalTidakMasuk}</td>
                      <td className="border border-gray-900 p-2 text-center font-bold">{item.kehadiranPercent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Halaman Baru: Catatan Perhitungan Kehadiran */}
          <div className="bg-white shadow-lg mx-auto mt-8" style={{ width: "297mm", minHeight: "210mm", pageBreakBefore: "always" }}>
            <div className="p-8">
              {/* Kop Surat Formal - Halaman 2 */}
              <div className="border-b-4 border-gray-900 pb-3 mb-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <img src="/unes.png" alt="Logo UNES" className="h-24 w-24 object-contain" />
                  </div>
                  <div className="flex-1 text-center pt-2">
                    <h1 className="font-bold text-gray-900 uppercase tracking-wide" style={{ fontSize: "20px" }}>
                      YAYASAN PERGURUAN TINGGI PADANG
                    </h1>
                    <h2 className="font-bold text-gray-900 uppercase tracking-wide mt-1" style={{ fontSize: "24px" }}>
                      UNIVERSITAS EKASAKTI
                    </h2>
                    <p className="text-gray-700 mt-1" style={{ fontSize: "14px" }}>
                      Jl. Veteran Dalam No. 26 Padang (25113) Telp. (0751) 28859-26770
                    </p>
                    <p className="text-gray-700" style={{ fontSize: "14px" }}>
                      Fax. (0751) 32694; https://unespadang.ac.id/
                    </p>
                  </div>
                  <div className="flex-shrink-0 w-24"></div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-center font-bold text-gray-900 uppercase tracking-wide border-b-2 border-gray-900 pb-2" style={{ fontSize: "20px" }}>
                  Catatan Perhitungan Kehadiran
                </h3>
              </div>

              <div className="space-y-5">
                {/* 1. Rumus Perhitungan */}
                <div className="border-2 border-gray-900 p-4">
                  <h4 className="font-bold text-gray-900 mb-3 uppercase" style={{ fontSize: "16px" }}>
                    1. Rumus Perhitungan Kehadiran
                  </h4>
                  <div className="bg-gray-100 p-3 rounded">
                    <p className="text-gray-900 font-mono text-center" style={{ fontSize: "14px" }}>
                      Kehadiran (%) = ((Hari Kerja - Total Tidak Masuk) / Hari Kerja) × 100
                    </p>
                  </div>
                </div>

                {/* 2. Perhitungan Hari Kerja */}
                <div className="border-2 border-gray-900 p-4">
                  <h4 className="font-bold text-gray-900 mb-3 uppercase" style={{ fontSize: "16px" }}>
                    2. Perhitungan Hari Kerja (Contoh: Desember 2025)
                  </h4>
                  <table className="w-full" style={{ fontSize: "14px" }}>
                    <tbody>
                      <tr>
                        <td className="py-2 pr-4 border-b border-gray-300">Total hari dalam bulan Desember:</td>
                        <td className="py-2 font-bold border-b border-gray-300 text-right">31 hari</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 border-b border-gray-300">Hari Minggu:</td>
                        <td className="py-2 border-b border-gray-300 text-right">7, 14, 21, 28 (4 hari)</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 border-b border-gray-300">Hari Libur Nasional:</td>
                        <td className="py-2 border-b border-gray-300 text-right">25 Desember - Natal (1 hari)</td>
                      </tr>
                      <tr className="bg-gray-100">
                        <td className="py-2 pr-4 border-b-2 border-gray-900 font-bold">Total Hari Libur:</td>
                        <td className="py-2 border-b-2 border-gray-900 font-bold text-right">4 + 1 = 5 hari</td>
                      </tr>
                      <tr className="bg-gray-900 text-white">
                        <td className="py-3 pr-4 font-bold" style={{ fontSize: "16px" }}>TOTAL HARI KERJA:</td>
                        <td className="py-3 font-bold text-right" style={{ fontSize: "16px" }}>31 - 5 = 26 hari</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 3. Simulasi Perhitungan */}
                <div className="border-2 border-gray-900 p-4" style={{ pageBreakInside: "avoid" }}>
                  <h4 className="font-bold text-gray-900 mb-3 uppercase" style={{ fontSize: "16px" }}>
                    3. Simulasi Perhitungan (Contoh: Bisma Putra Pratama)
                  </h4>
                  <table className="w-full" style={{ fontSize: "14px" }}>
                    <tbody>
                      <tr>
                        <td className="py-2 pr-4 border-b border-gray-300">Hari Kerja (Senin - Sabtu):</td>
                        <td className="py-2 font-bold border-b border-gray-300 text-right">26 hari</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 border-b border-gray-300">Absen Masuk (hadir):</td>
                        <td className="py-2 font-bold border-b border-gray-300 text-right">2 hari</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 border-b border-gray-300">Tidak Masuk (tidak hadir):</td>
                        <td className="py-2 font-bold border-b border-gray-300 text-right">24 hari</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 border-b border-gray-300">Izin/Cuti/Dinas:</td>
                        <td className="py-2 font-bold border-b border-gray-300 text-right">0 hari</td>
                      </tr>
                      <tr className="bg-gray-900 text-white">
                        <td className="py-3 pr-4 font-bold" style={{ fontSize: "16px" }}>Kehadiran (%):</td>
                        <td className="py-3 font-bold text-right" style={{ fontSize: "16px" }}>((26 - 24) / 26) × 100 = 8%</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="mt-3 text-gray-700 italic" style={{ fontSize: "13px" }}>
                    * Kesimpulan: Bisma hanya hadir 2 dari 26 hari kerja, sehingga kehadiran = 8%
                  </p>
                </div>

                {/* 4. Penjelasan Detail */}
                <div className="border-2 border-gray-900 p-4" style={{ pageBreakInside: "avoid" }}>
                  <h4 className="font-bold text-gray-900 mb-3 uppercase" style={{ fontSize: "16px" }}>
                    4. Penjelasan Detail
                  </h4>
                  <ul className="space-y-2 text-gray-900" style={{ fontSize: "14px" }}>
                    <li className="flex gap-2">
                      <span className="font-bold min-w-[20px]">a.</span>
                      <span><strong>Hari Kerja</strong> dihitung berdasarkan hari Senin hingga Sabtu dalam periode laporan.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold min-w-[20px]">b.</span>
                      <span><strong>Hari Minggu</strong> dan <strong>Hari Libur Nasional</strong> TIDAK dihitung sebagai Hari Kerja.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold min-w-[20px]">c.</span>
                      <span>Daftar Libur Nasional diambil dari database <strong>Hari Libur</strong> yang dikelola admin.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold min-w-[20px]">d.</span>
                      <span><strong>Tidak Masuk</strong> = Hari Kerja - Absen Masuk (tidak termasuk hari izin/cuti/dinas luar yang tercatat).</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold min-w-[20px]">e.</span>
                      <span><strong>Kehadiran (%)</strong> menunjukkan persentase hari kerja yang diisi absen masuk.</span>
                    </li>
                  </ul>
                </div>

                {/* 5. Catatan Penting */}
                <div className="border-2 border-gray-900 p-4 bg-gray-50" style={{ pageBreakInside: "avoid" }}>
                  <h4 className="font-bold text-gray-900 mb-3 uppercase" style={{ fontSize: "16px" }}>
                    5. Catatan Penting
                  </h4>
                  <ul className="space-y-2 text-gray-900" style={{ fontSize: "14px" }}>
                    <li className="flex gap-2">
                      <span className="font-bold min-w-[20px]">•</span>
                      <span>Kolom <strong>"Absen Pulang"</strong> dan <strong>"Tidak Pulang"</strong> adalah data terpisah dari absen masuk.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold min-w-[20px]">•</span>
                      <span>Seseorang bisa hadir masuk 100% tetapi tidak pulang 0% jika hanya absen pagi saja.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold min-w-[20px]">•</span>
                      <span>Kehadiran dihitung dari <strong>kolom MASUK</strong>, bukan rata-rata masuk + pulang.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold min-w-[20px]">•</span>
                      <span>Hari <strong>Sabtu</strong> TETAP dihitung sebagai Hari Kerja di Universitas Ekasakti.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold min-w-[20px]">•</span>
                      <span>Hari izin/cuti/dinas luar yang tercatat TIDAK mengurangi persentase kehadiran.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold min-w-[20px]">•</span>
                      <span>Untuk bulan berbeda, jumlah Hari Kerja akan berbeda tergantung jumlah hari libur nasional.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 w-full overflow-x-hidden font-sans">
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 w-full">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin")}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Menu Admin</p>
                <h1 className="text-lg font-bold text-slate-800">Rekap</h1>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="p-4 sm:p-6 lg:p-8 pb-24">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800">Pilih Kategori & Periode</h2>
            <p className="text-slate-500 mt-1">Silakan pilih kategori dan jenis laporan</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => setKategori("dosen_struktural")}
              className={`p-6 rounded-2xl border-2 transition-all text-left ${
                kategori === "dosen_struktural"
                  ? "border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/20"
                  : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-md"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                  kategori === "dosen_struktural"
                    ? "bg-blue-500 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}>
                  <Users className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Dosen Struktural</h3>
                  <p className="text-sm text-slate-500">Rekapitulasi kehadiran dosen struktural</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setKategori("tendik")}
              className={`p-6 rounded-2xl border-2 transition-all text-left ${
                kategori === "tendik"
                  ? "border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-500/20"
                  : "border-slate-200 bg-white hover:border-emerald-300 hover:shadow-md"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                  kategori === "tendik"
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}>
                  <User className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Tendik</h3>
                  <p className="text-sm text-slate-500">Rekapitulasi kehadiran tenaga kependidikan</p>
                </div>
              </div>
            </button>
          </div>

          {kategori && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Periode Laporan
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={() => setReportType("mingguan")}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    reportType === "mingguan"
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      reportType === "mingguan" ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-600"
                    }`}>
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-slate-800">Mingguan</p>
                      <p className="text-xs text-slate-500">Rekap per minggu</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setReportType("bulanan")}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    reportType === "bulanan"
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-slate-200 hover:border-emerald-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      reportType === "bulanan" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600"
                    }`}>
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-slate-800">Bulanan</p>
                      <p className="text-xs text-slate-500">Rekap per bulan</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setReportType("keseluruhan")}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    reportType === "keseluruhan"
                      ? "border-purple-500 bg-purple-50"
                      : "border-slate-200 hover:border-purple-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      reportType === "keseluruhan" ? "bg-purple-500 text-white" : "bg-slate-100 text-slate-600"
                    }`}>
                      <FileBarChart className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-slate-800">Rekap Keseluruhan</p>
                      <p className="text-xs text-slate-500">Rekap individu detail</p>
                    </div>
                  </div>
                </button>
              </div>

              {reportType && (
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {reportType === "bulanan" ? "Pilih Bulan" : reportType === "keseluruhan" ? "Pilih Bulan untuk Laporan" : "Pilih Bulan untuk Minggu"}
                    </label>
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => {
                        setSelectedMonth(e.target.value);
                        setSelectedWeek(0);
                      }}
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {reportType === "mingguan" && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Pilih Minggu</label>
                      <select
                        value={selectedWeek}
                        onChange={(e) => setSelectedWeek(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {weekRanges.map((week, idx) => (
                          <option key={idx} value={idx}>
                            Minggu {idx + 1} ({week.label})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {kategori && reportType && (
            <button
              onClick={loadData}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Memuat Data...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Generate Laporan
                </>
              )}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
