import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { AttendanceWithUser } from "@/lib/supabase";
import { FileDown, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
    
    // Cek apakah parsing berhasil
    if (Number.isNaN(date.getTime()) || !isFinite(date.getTime())) {
      console.error(`toWIBYMD: Invalid date for timestamp: ${utcTimestamp}`);
      return null;
    }
    
    // Tambah 7 jam (WIB = UTC+7)
    const wibTime = date.getTime() + (7 * 60 * 60 * 1000);
    const wibDate = new Date(wibTime);
    
    // Gunakan UTC methods untuk extract date setelah offset ditambahkan
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

const getMonthName = (dateStr: string) => {
  return parseLocalYMD(dateStr).toLocaleDateString("id-ID", {
    month: "long",
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

  // MULTIPLE FALLBACK STRATEGIES untuk parsing tanggal
  
  // Strategy 1: Gunakan toWIBYMD untuk konversi UTC ke WIB
  const wibResult = toWIBYMD(createdAt);
  if (wibResult) return wibResult;
  
  // Strategy 2: Fallback - ambil langsung dari string (untuk format YYYY-MM-DD)
  if (createdAt.includes("T")) {
    return createdAt.split("T")[0];
  }
  
  // Strategy 3: Fallback - untuk format dengan spasi
  if (createdAt.includes(" ")) {
    return createdAt.split(" ")[0];
  }
  
  // Strategy 4: Last resort
  return createdAt.substring(0, 10);
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

const normalizeNameKey = (value?: string | null): string => {
  return String(value || "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
};

// Mapping unit kerja dan jabatan berdasarkan struktur organisasi
const unitKerjaOrder: Record<string, number> = {
  // Dosen Struktural
  "Yayasan": 1,
  "Rektorat": 2,
  "Fakultas Ekonomi": 3,
  "Fakultas Hukum": 4,
  "Fakultas Pertanian": 5,
  "Fakultas Sastra": 6,
  "Fakultas Teknik & Perencanaan": 7,
  "Fakultas Ilmu Sosial dan Ilmu Politik (FISIPOL)": 8,
  "Fakultas Keguruan dan Ilmu Pendidikan (FKIP)": 9,
  "Akademi Akuntansi Indonesia (AAI)": 10,
  "LPPM": 11,
  "LPM": 12,
  "Lembaga Diklat, KKN": 13,
  "BKK": 14,
  "UPT Perpustakaan (Struktural)": 15,
  
  // Tendik - mengikuti urutan dari daftar yang diberikan
  // "Yayasan": 1, // sama dengan dosen struktural
  // "Rektorat": 2, // sama dengan dosen struktural
  // "Fakultas Ekonomi": 3, // sama
  // "Fakultas Hukum": 4, // sama
  // "Fakultas Pertanian": 5, // sama
  // "Fakultas Sastra": 6, // sama
  // "Fakultas Teknik & Perencanaan": 7, // sama
  // "Fakultas Ilmu Sosial dan Ilmu Politik (FISIPOL)": 8, // sama
  // "Fakultas Keguruan dan Ilmu Pendidikan (FKIP)": 9, // sama
  // "Akademi Akuntansi Indonesia (AAI)": 10, // sama
  // "LPM": 12, // sama
  "BAPSI": 16,
  "BAAK": 17,
  "BAU": 18,
  "Perlengkapan": 19,
  "UPT Perpustakaan": 20, // Berbeda dengan "UPT Perpustakaan (Struktural)"
  "PMB": 21,
  "Registrasi": 22,
  "Pengelola Informasi dan Dokumentasi": 23,
  "Humas": 24,
  "IT": 25,
  "Laboratorium Komputer": 26,
  
  // Default untuk unit kerja yang tidak terdaftar
  "": 999
};

// Manual mapping untuk dosen struktural berdasarkan nama lengkap
// Ini memastikan urutan yang PASTI benar sesuai daftar yang diberikan
const manualUnitKerjaMapping: Record<string, string> = {
  // Yayasan
  "Dr. Andi Syahrum Makkurade, M.Si": "Yayasan", // Nama exact dari database
  "Drs. H. Andi Syahrum Makkurade": "Yayasan",
  "Drs H. Andi Syahrum Makkurade": "Yayasan",
  "Drs. Andi Syahrum Makkurade": "Yayasan",
  "Drs Andi Syahrum Makkurade": "Yayasan",
  "H. Andi Syahrum Makkurade": "Yayasan",
  "Andi Syahrum Makkurade": "Yayasan",
  "andi.syahrum.makkurade": "Yayasan", // username backup
  "Dr. Jusmita Weriza, S.Kom, M.Kom": "Yayasan",
  "Dr Jusmita Weriza, S.Kom, M.Kom": "Yayasan",
  "Dr. JUSMITA WERIZA, S.Kom, M.Kom": "Yayasan",
  "jusmita.weriza": "Yayasan", // username backup
  
  // Rektorat
  "Prof. Dr. H. Sufyarma Marsidin, M.Pd": "Rektorat",
  "sufyarma.marsidin": "Rektorat", // username backup
  "Dr. Ir. Dewirman Prima Putra, M.Si": "Rektorat",
  "dewirman.prima.putra": "Rektorat",
  "Dr. Susi Delmiati, S.H, M.H": "Rektorat",
  "susi.delmiati": "Rektorat",
  "Drs. M. Takdir Mattaliti, M.Si": "Rektorat",
  "Dr.Slamet Riyadi, S.Pd.I, M.A.": "Rektorat",
  
  // Fakultas Ekonomi
  "Dr. Salfadri, S.E., M.Si": "Fakultas Ekonomi",
  "Dr Salfadri, S.E., M.Si": "Fakultas Ekonomi",
  "Dr. Salfadri,S.E.,M.Si": "Fakultas Ekonomi",
  "salfadri": "Fakultas Ekonomi", // username backup
  "Jhon Rinaldo, S.E., M.Si": "Fakultas Ekonomi",
  "Dr Nuraeni Dahri, S.Kom, M.Kom": "Fakultas Ekonomi",
  "Meri Yani, S.E., M.Si, Ak, CA": "Fakultas Ekonomi",
  "Dr RICE HARYATI, S.E., M.Si": "Fakultas Ekonomi",
  
  // Fakultas Hukum
  "Dr FITRIATI, S.H, M.H": "Fakultas Hukum",
  "Dr. Bisma Putra Pratama, S.H., M.H": "Fakultas Hukum",
  "Dr.Iyah Faniyah, S.H, M.Hum": "Fakultas Hukum",
  "Dr.Neni Vesna Madjid, S.H., M.H": "Fakultas Hukum",
  "Netrivianti, S.H., M.H": "Fakultas Hukum",
  "Dora Tiara, S.H., M.H": "Fakultas Hukum",
  "Alam Suryo Laksono, S.H., M.H.": "Fakultas Hukum",
  
  // Fakultas Pertanian
  "Ir Mahmud, M.Si": "Fakultas Pertanian",
  "EDDWINA AIDILA FITRIA, S.TP, M.Si": "Fakultas Pertanian",
  "Meriati, S.P, M.P": "Fakultas Pertanian",
  "Wawan Sumarno, S.P, M.Si": "Fakultas Pertanian",
  "Rera Aga Salihat, S.Si, M.Si": "Fakultas Pertanian",
  
  // Fakultas Sastra
  "Dr.Mac Aditiawarman, M.Hum": "Fakultas Sastra",
  "Drs. Raflis, M.Hum": "Fakultas Sastra",
  
  // Fakultas Teknik & Perencanaan
  "Drs. Risal Abu, S.T, M.Eng": "Fakultas Teknik & Perencanaan",
  "Dr Ir Irnawati Siregar, M.Pd.T": "Fakultas Teknik & Perencanaan",
  "Dr Nazili, S.T, M.T": "Fakultas Teknik & Perencanaan",
  "Ir Irmayani, M.T": "Fakultas Teknik & Perencanaan",
  "Ir Mukhnizar, M.T": "Fakultas Teknik & Perencanaan",
  "Rosnita Rauf, S.T, M.T": "Fakultas Teknik & Perencanaan",
  "ROBBY HOTTER, S.T, M.T": "Fakultas Teknik & Perencanaan",
  "Merry Thressia, S.Si, M.Si": "Fakultas Teknik & Perencanaan",
  "Desriyenti, S.T.M.T": "Fakultas Teknik & Perencanaan",
  
  // FISIPOL
  "Drs. TARMA SARTIMA, M.Si, Ph.D": "Fakultas Ilmu Sosial dan Ilmu Politik (FISIPOL)",
  "Annisa Fitri, S.Sos, M.AP": "Fakultas Ilmu Sosial dan Ilmu Politik (FISIPOL)",
  "Doddie Arya Kusuma B, S.Sos, M.Si": "Fakultas Ilmu Sosial dan Ilmu Politik (FISIPOL)",
  "Dr.Sumartono, M.Si": "Fakultas Ilmu Sosial dan Ilmu Politik (FISIPOL)",
  "Puryanto, S.A.P, M.A.P": "Fakultas Ilmu Sosial dan Ilmu Politik (FISIPOL)",
  
  // FKIP
  "Dr.Feby Meuthia Yusuf, M.Pd": "Fakultas Keguruan dan Ilmu Pendidikan (FKIP)",
  "DWI MUTIA CHAN, S.Pd, M.Pd": "Fakultas Keguruan dan Ilmu Pendidikan (FKIP)",
  "KHURNIA BUDI UTAMI, S.Pd, M.Pd": "Fakultas Keguruan dan Ilmu Pendidikan (FKIP)",
  "Khurnia Budi Utami, S.Pd, M.Pd": "Fakultas Keguruan dan Ilmu Pendidikan (FKIP)",
  "khurnia.budi.utami": "Fakultas Keguruan dan Ilmu Pendidikan (FKIP)", // username backup
  "RENI RESPITA, S.Pd, M.Pd.E": "Fakultas Keguruan dan Ilmu Pendidikan (FKIP)",
  "Yessy Marzona, S.Pd, M.Pd": "Fakultas Keguruan dan Ilmu Pendidikan (FKIP)",
  
  // AAI
  "Desmiwerita, S.E., M.Si": "Akademi Akuntansi Indonesia (AAI)",
  "Dr. Yuli Ardiany, S.E., M.Si, C.Atr": "Akademi Akuntansi Indonesia (AAI)",
  
  // LPPM
  "Prof. Dr Ir I Ketut Budaraga, M.Si": "LPPM",
  "HARRY SETYA HADI, S.Kom, M.Kom": "LPPM",
  "Rera Agung Syukra, S.Si, M.Si": "LPPM",
  
  // LPM
  "Adrian Fadhli, S.Pd, M.T": "LPM",
  "Budiman, S.T, M.T": "LPM",
  
  // Lembaga Diklat, KKN
  "Prof. Dr H. Agussalim M, S.E, M.S. MCE.": "Lembaga Diklat, KKN",
  "Dian Wahyuni Dewi Fitri, S.T, M.T": "Lembaga Diklat, KKN",
  
  // BKK
  "Dr.Susi Yuliastanty, S.Pd, M.M": "BKK",
  
  // UPT Perpustakaan (Struktural)
  "YUMI ARIYATI, S.Sos, M.I.Kom": "UPT Perpustakaan (Struktural)",
};

const manualUnitKerjaMappingNormalized: Record<string, string> = Object.fromEntries(
  Object.entries(manualUnitKerjaMapping)
    .filter(([key]) => key.includes(" "))
    .map(([key, value]) => [normalizeNameKey(key), value])
);

// Mapping jabatan untuk urutan
const jabatanOrder: Record<string, number> = {
  // Yayasan
  "Sekretaris YPTP": 1,
  "Bendahara Yayasan": 2,
  
  // Rektorat
  "Rektor": 3,
  "Wakil Rektor I": 4,
  "Wakil Rektor II": 5,
  "Wakil Rektor III": 6,
  "Staf Ahli WR I": 7,
  "Staf Ahli Rektor": 8,
  
  // Dekan & Wadek
  "Dekan": 10,
  "Wadek": 11,
  
  // Direktur & Wakil
  "Direktur AAI": 15,
  "Wakil Direktur AAI": 16,
  
  // Kepala/Ka Prodi/Ka Lab
  "Ketua LPPM": 20,
  "Ketua Lembaga": 21,
  "Kepala LPM": 22,
  "Kepala BAPSI": 23,
  "Ka. BKK": 24,
  "Ka. Perpustakaan": 25,
  "Ka. BAAK": 26,
  "Plt. Ka. BAU": 27,
  "Ka. Perlengkapan": 28,
  "Ka. Keuangan Yayasan": 29,
  "Ka. Prodi": 30,
  "Ka. GPM": 31,
  "Ka. PMB": 32,
  "Ka. Lab": 33,
  "Ka. PPLK": 34,
  "Ka. TU": 35,
  
  // Koordinator
  "Koordinator Registrasi": 40,
  
  // Sekretaris & Staf
  "Sek. LPPM": 50,
  "Sek. Lembaga": 51,
  "Sek. Prodi": 52,
  
  // Staf Ahli & Pengelola
  "Staf Ahli Lembaga": 60,
  "Staf Ahli": 61,
  "Pengelola Informasi dan Dokumentasi": 62,
  
  // Staf per unit
  "Staf WR I": 70,
  "Staf WR II": 71,
  "Staf WR III": 72,
  "Staf Keuangan Yayasan": 73,
  "Staf BAAK": 74,
  "Staf BAU": 75,
  "Staf Perlengkapan": 76,
  "Staf Perpustakaan": 77,
  "Staf PMB": 78,
  "Staf Registrasi": 79,
  "Staf IT": 80,
  "Staf LPM": 81,
  "Staf BAPSI": 82,
  "Staf Lab. Komputer": 83,
  "Staf Lab.": 84,
  "Staf TU": 85,
  "Staf Prodi": 86,
  "Staf Perpus.": 87,
  "Staf Fak.": 88,
  "Staf Pasca": 89,
  "Staf": 90,
  "Operator Siaga": 91,
  
  // Dosen biasa
  "Dosen": 100,
  
  // Default
  "": 999
};

// Exact order mapping berdasarkan nama lengkap
// Format: "nama_lengkap": [unit_kerja_order, position_in_unit]
// Ini memastikan urutan EXACT sesuai daftar yang diberikan
const exactOrderMapping: Record<string, [number, number]> = {
  // DOSEN STRUKTURAL
  // Yayasan (unit order: 1)
  "Dr. Andi Syahrum Makkurade, M.Si": [1, 1], // Nama exact dari database
  "Drs. H. Andi Syahrum Makkurade": [1, 1],
  "Drs H. Andi Syahrum Makkurade": [1, 1],
  "Drs. Andi Syahrum Makkurade": [1, 1],
  "Drs Andi Syahrum Makkurade": [1, 1],
  "H. Andi Syahrum Makkurade": [1, 1],
  "Andi Syahrum Makkurade": [1, 1],
  "Dr. Jusmita Weriza, S.Kom, M.Kom": [1, 2],
  "Dr Jusmita Weriza, S.Kom, M.Kom": [1, 2],
  "Dr. JUSMITA WERIZA, S.Kom, M.Kom": [1, 2],
  
  // Rektorat (unit order: 2)
  "Prof. Dr. H. Sufyarma Marsidin, M.Pd": [2, 1],
  "Dr. Ir. Dewirman Prima Putra, M.Si": [2, 2],
  "Dr. Susi Delmiati, S.H, M.H": [2, 3],
  "Drs. M. Takdir Mattaliti, M.Si": [2, 4],
  "Dr.Slamet Riyadi, S.Pd.I, M.A.": [2, 5],
  
  // Fakultas Ekonomi (unit order: 3)
  "Dr. Salfadri, S.E., M.Si": [3, 1],
  "Dr Salfadri, S.E., M.Si": [3, 1],
  "Dr. Salfadri,S.E.,M.Si": [3, 1],
  "Jhon Rinaldo, S.E., M.Si": [3, 2],
  "Dr Nuraeni Dahri, S.Kom, M.Kom": [3, 3],
  "Meri Yani, S.E., M.Si, Ak, CA": [3, 4],
  "Dr RICE HARYATI, S.E., M.Si": [3, 5],
  
  // Fakultas Hukum (unit order: 4)
  "Dr FITRIATI, S.H, M.H": [4, 1],
  "Dr. Bisma Putra Pratama, S.H., M.H": [4, 2],
  "Dr.Iyah Faniyah, S.H, M.Hum": [4, 3],
  "Dr.Neni Vesna Madjid, S.H., M.H": [4, 4],
  "Netrivianti, S.H., M.H": [4, 5],
  "Dora Tiara, S.H., M.H": [4, 6],
  "Alam Suryo Laksono, S.H., M.H.": [4, 7],
  
  // Fakultas Pertanian (unit order: 5)
  "Ir Mahmud, M.Si": [5, 1],
  "EDDWINA AIDILA FITRIA, S.TP, M.Si": [5, 2],
  "Meriati, S.P, M.P": [5, 3],
  "Wawan Sumarno, S.P, M.Si": [5, 4],
  "Rera Aga Salihat, S.Si, M.Si": [5, 5],
  
  // Fakultas Sastra (unit order: 6)
  "Dr.Mac Aditiawarman, M.Hum": [6, 1],
  "Drs. Raflis, M.Hum": [6, 2],
  
  // Fakultas Teknik & Perencanaan (unit order: 7)
  "Drs. Risal Abu, S.T, M.Eng": [7, 1],
  "Dr Ir Irnawati Siregar, M.Pd.T": [7, 2],
  "Dr Nazili, S.T, M.T": [7, 3],
  "Ir Irmayani, M.T": [7, 4],
  "Ir Mukhnizar, M.T": [7, 5],
  "Rosnita Rauf, S.T, M.T": [7, 6],
  "ROBBY HOTTER, S.T, M.T": [7, 7],
  "Merry Thressia, S.Si, M.Si": [7, 8],
  "Desriyenti, S.T.M.T": [7, 9],
  
  // Fakultas Ilmu Sosial dan Ilmu Politik (FISIPOL) (unit order: 8)
  "Drs. TARMA SARTIMA, M.Si, Ph.D": [8, 1],
  "Annisa Fitri, S.Sos, M.AP": [8, 2],
  "Doddie Arya Kusuma B, S.Sos, M.Si": [8, 3],
  "Dr.Sumartono, M.Si": [8, 4],
  "Puryanto, S.A.P, M.A.P": [8, 5],
  
  // Fakultas Keguruan dan Ilmu Pendidikan (FKIP) (unit order: 9)
  "Dr.Feby Meuthia Yusuf, M.Pd": [9, 1],
  "DWI MUTIA CHAN, S.Pd, M.Pd": [9, 2],
  "KHURNIA BUDI UTAMI, S.Pd, M.Pd": [9, 3],
  "Khurnia Budi Utami, S.Pd, M.Pd": [9, 3],
  "khurnia.budi.utami": [9, 3], // username backup
  "RENI RESPITA, S.Pd, M.Pd.E": [9, 4],
  "Yessy Marzona, S.Pd, M.Pd": [9, 5],
  
  // Akademi Akuntansi Indonesia (AAI) (unit order: 10)
  "Desmiwerita, S.E., M.Si": [10, 1],
  "Dr. Yuli Ardiany, S.E., M.Si, C.Atr": [10, 2],
  
  // LPPM (unit order: 11)
  "Prof. Dr Ir I Ketut Budaraga, M.Si": [11, 1],
  "HARRY SETYA HADI, S.Kom, M.Kom": [11, 2],
  "Rera Agung Syukra, S.Si, M.Si": [11, 3],
  
  // LPM (unit order: 12)
  "Adrian Fadhli, S.Pd, M.T": [12, 1],
  "Budiman, S.T, M.T": [12, 2],
  
  // Lembaga Diklat, KKN (unit order: 13)
  "Prof. Dr H. Agussalim M, S.E, M.S. MCE.": [13, 1],
  "Dian Wahyuni Dewi Fitri, S.T, M.T": [13, 2],
  
  // BKK (unit order: 14)
  "Dr.Susi Yuliastanty, S.Pd, M.M": [14, 1],
  
  // UPT Perpustakaan (Struktural) (unit order: 15)
  "YUMI ARIYATI, S.Sos, M.I.Kom": [15, 1],
  
  // TENDIK
  // Yayasan Tendik (unit order: 1)
  // Note: Drs. H. Andi Syahrum Makkurade juga di Yayasan sebagai Ketua Yayasan
  "Drs. Suparman": [1, 101],
  "Refni Elida, S.H.": [1, 102],
  "Afriyani, A.Md.Kom.": [1, 103],
  "Dasriul Dahri, S.E.": [1, 104],
  "Muhammad Abdurrahman Syuraim": [1, 105],
  "Mutiara Ayu Ningtyas, S.K.M.": [1, 106],
  "Sri Widya Ningsih, S.E.": [1, 107],
  
  // Rektorat Tendik (unit order: 2)
  "Irfan Ananda Ismail, S.Pd., M.Pd., Gr.": [2, 101],
  "Dendi Kurniawan, S.H., M.H": [2, 102],
  "Novita Trisina, S.E.": [2, 103],
  "Renol Destitama Yoga, A.Md.Kom, SM.": [2, 104],
  "Reski Nofrialdi, S.Pd": [2, 105],
  
  // Fakultas Ekonomi Tendik (unit order: 3)
  "Zul Aida, S.E.": [3, 101],
  "Alfin Dahlia, S.E.": [3, 102],
  "Desmayenti": [3, 103],
  "Fakhri Harpin Yulio, S.Ak": [3, 104],
  "Tiara Hasari, S.Pd": [3, 105],
  "Wahyu Fauzan Syahputra, S.Pd, Gr.": [3, 106],
  
  // Fakultas Hukum Tendik (unit order: 4)
  "Yoserizal, A.Md.": [4, 101],
  "Desi Sumanti, S.H": [4, 102],
  "Hary Ardya Nugraha, S.H, M.H": [4, 103],
  "Indriwati Ikhwal, S.Hum": [4, 104],
  "Mulyati": [4, 105],
  "Roza Mauludiah, S.Hum": [4, 106],
  "Yenilza Zein, S.E.": [4, 107],
  "Yuni Hafizah, S.E.": [4, 108],
  "Yuswardi, S.E.": [4, 109],
  
  // Fakultas Pertanian Tendik (unit order: 5)
  "Suroso, S.E.": [5, 101],
  "Elitriyanti, S.Pd": [5, 102],
  "Musrafil, S.I.Kom": [5, 103],
  "Nela Putriana, S.TP.": [5, 104],
  
  // Fakultas Sastra Tendik (unit order: 6)
  "Yeni Erwanti, A.Md.": [6, 101],
  
  // Fakultas Teknik & Perencanaan Tendik (unit order: 7)
  "Poniman, S.E.": [7, 101],
  "Desriyenti, S.T. M.T": [7, 9],
  "Gita Susanti": [7, 103],
  "Hazlif Nasif, S.T, M.T": [7, 104],
  "Mutiara Putri Yosti, S.T": [7, 105],
  "Nike Rahmawati, S.T": [7, 106],
  "Siska Rahmadani": [7, 107],
  "Syafridawati, S.T": [7, 108],
  "Yogi Saputra, S.Ars.": [7, 109],
  
  // Fakultas Ilmu Sosial dan Ilmu Politik (FISIPOL) Tendik (unit order: 8)
  "Emmi Yuliza, S.H": [8, 101],
  "Lovana Mae Angelkha Sutri, S.H": [8, 102],
  "Susilawati": [8, 103],
  
  // Fakultas Keguruan dan Ilmu Pendidikan (FKIP) Tendik (unit order: 9)
  "Dewi Irawati, A.Md.": [9, 101],
  "Nani Asyura": [9, 102],
  "Rangga Prayitno, S.H.": [9, 103],
  "Risyon": [9, 104],
  
  // Akademi Akuntansi Indonesia (AAI) Tendik (unit order: 10)
  "Elyatisna, S.E.": [10, 101],
  
  // LPM Tendik (unit order: 12)
  "Aulya Bayu De Patna Siregar, S.Pd, S.H": [12, 101],
  "Irmayanti": [12, 102],
  
  // BAPSI (unit order: 16)
  "Afika Putri Dzakianda, S.Si": [16, 1],
  "Silvia Syafrida, S.Pd": [16, 2],
  "Velyka Hana Kusuma, A.Md.": [16, 3],
  "Yenitaroza, S.Kom": [16, 4],
  
  // BAAK (unit order: 17)
  "Delsi, A.Md.Kom.": [17, 1],
  "Marniati, A.Md.Kom.": [17, 2],
  "Nofrizir, A.Md.Adm.": [17, 3],
  "Sari Maryulis, Amd., Ak.": [17, 4],
  
  // BAU (unit order: 18)
  "Drs. Syarifuddin Nur": [18, 1],
  "Asmara Indah, S.E.": [18, 2],
  "Idrawati": [18, 3],
  "Merryanti Hamid, S.E": [18, 4],
  "Mita Budi Febriani": [18, 5],
  
  // Perlengkapan (unit order: 19)
  "Ahmad Suryadi": [19, 1],
  "Andi L": [19, 2],
  "Bakhtiar": [19, 3],
  "Firdaus": [19, 4],
  "Hendrianto": [19, 5],
  "Mukidjo, S.T": [19, 6],
  "Mulyadi Chandra": [19, 7],
  "Ramli Syafri": [19, 8],
  "Syafwandi": [19, 9],
  "Zul Akhyar": [19, 10],
  
  // UPT Perpustakaan Tendik (unit order: 20)
  "Fitriani, A.Md.Kom.": [20, 1],
  "Misbah, S.I.P.": [20, 2],
  "Zwarnesih Asmarayuda, S.H.": [20, 3],
  
  // PMB (unit order: 21)
  "Muhammad Reza Ardiansyah Suparman, S.A.P.": [21, 1],
  "Shara Wigi Legenda, S.I.Kom": [21, 2],
  
  // Registrasi (unit order: 22)
  "Dewi Retno Sani, S.Sn": [22, 1],
  "Evi Dwi Lastri, S.Ak, MM": [22, 2],
  "Hilda Ariani, S.H.": [22, 3],
  "Silvia Yuliana, S.Ak": [22, 4],
  "Wami Oktarini Putri, S.E.": [22, 5],
  
  // Pengelola Informasi dan Dokumentasi (unit order: 23)
  "Rudiyansa Putra, S.Sos": [23, 1],
  
  // Humas (unit order: 24)
  "Syarifuddin, S.E., M.Hum": [24, 1],
  
  // IT (unit order: 25)
  "Pandu Aji Putra Utama, S.I.Kom": [25, 1],
  "Andi Fazzar Fardian Syah, S.Kom": [25, 2],
  "Irfan Thomi, A.Md.": [25, 3],
  "Rival Ramdani, A.Md.": [25, 4],
  "Rizhardi Mahalim, A.Md.": [25, 5],
  
  // Laboratorium Komputer (unit order: 26)
  "Miroslina, S.Sos": [26, 1],
};

const exactOrderMappingNormalized: Record<string, [number, number]> = Object.fromEntries(
  Object.entries(exactOrderMapping).map(([key, value]) => [normalizeNameKey(key), value])
);

// Helper untuk extract jabatan utama dari string jabatan lengkap
const extractMainJabatan = (jabatanFull: string | null | undefined): string => {
  if (!jabatanFull) return "";
  const jabatan = jabatanFull.toLowerCase();
  
  // Yayasan
  if (jabatan.includes("sekretaris yptp")) return "Sekretaris YPTP";
  if (jabatan.includes("bendahara yayasan")) return "Bendahara Yayasan";
  if (jabatan.includes("ka. keuangan yayasan")) return "Ka. Keuangan Yayasan";
  
  // Rektorat
  if (jabatan.includes("rektor") && !jabatan.includes("wakil")) return "Rektor";
  if (jabatan.includes("wakil rektor i") || jabatan.includes("wr i")) return "Wakil Rektor I";
  if (jabatan.includes("wakil rektor ii") || jabatan.includes("wr ii")) return "Wakil Rektor II";
  if (jabatan.includes("wakil rektor iii") || jabatan.includes("wr iii")) return "Wakil Rektor III";
  if (jabatan.includes("staf ahli wr")) return "Staf Ahli WR I";
  if (jabatan.includes("staf ahli rektor")) return "Staf Ahli Rektor";
  
  // Dekan & Wadek
  if (jabatan.includes("dekan")) return "Dekan";
  if (jabatan.includes("wadek")) return "Wadek";
  
  // Direktur & Wakil
  if (jabatan.includes("direktur aai")) return "Direktur AAI";
  if (jabatan.includes("wakil direktur aai")) return "Wakil Direktur AAI";
  
  // Kepala/Ka
  if (jabatan.includes("ketua lppm")) return "Ketua LPPM";
  if (jabatan.includes("ketua lembaga")) return "Ketua Lembaga";
  if (jabatan.includes("kepala lpm")) return "Kepala LPM";
  if (jabatan.includes("kepala bapsi")) return "Kepala BAPSI";
  if (jabatan.includes("ka. bkk") || jabatan.includes("kepala bkk")) return "Ka. BKK";
  if (jabatan.includes("ka. perpustakaan") || jabatan.includes("kepala perpustakaan")) return "Ka. Perpustakaan";
  if (jabatan.includes("ka. baak")) return "Ka. BAAK";
  if (jabatan.includes("plt. ka. bau")) return "Plt. Ka. BAU";
  if (jabatan.includes("ka. perlengkapan")) return "Ka. Perlengkapan";
  if (jabatan.includes("ka. prodi") || jabatan.includes("kepala prodi")) return "Ka. Prodi";
  if (jabatan.includes("ka. gpm")) return "Ka. GPM";
  if (jabatan.includes("ka. pmb")) return "Ka. PMB";
  if (jabatan.includes("ka. lab") || jabatan.includes("kepala lab")) return "Ka. Lab";
  if (jabatan.includes("ka. pplk")) return "Ka. PPLK";
  if (jabatan.includes("ka. tu")) return "Ka. TU";
  
  // Koordinator
  if (jabatan.includes("koordinator registrasi")) return "Koordinator Registrasi";
  
  // Sekretaris
  if (jabatan.includes("sek. lppm")) return "Sek. LPPM";
  if (jabatan.includes("sek. lembaga")) return "Sek. Lembaga";
  if (jabatan.includes("sek. prodi")) return "Sek. Prodi";
  
  // Staf Ahli & Pengelola
  if (jabatan.includes("staf ahli lembaga")) return "Staf Ahli Lembaga";
  if (jabatan.includes("staf ahli")) return "Staf Ahli";
  if (jabatan.includes("pengelola informasi dan dokumentasi")) return "Pengelola Informasi dan Dokumentasi";
  
  // Staf per unit (urut berdasarkan spesifik)
  if (jabatan.includes("staf wr i")) return "Staf WR I";
  if (jabatan.includes("staf wr ii")) return "Staf WR II";
  if (jabatan.includes("staf wr iii")) return "Staf WR III";
  if (jabatan.includes("staf keuangan yayasan")) return "Staf Keuangan Yayasan";
  if (jabatan.includes("staf baak")) return "Staf BAAK";
  if (jabatan.includes("staf bau")) return "Staf BAU";
  if (jabatan.includes("staf perlengkapan")) return "Staf Perlengkapan";
  if (jabatan.includes("staf perpustakaan") || jabatan.includes("staf perpus.")) return "Staf Perpustakaan";
  if (jabatan.includes("staf pmb")) return "Staf PMB";
  if (jabatan.includes("staf registrasi")) return "Staf Registrasi";
  if (jabatan.includes("staf it")) return "Staf IT";
  if (jabatan.includes("staf lpm")) return "Staf LPM";
  if (jabatan.includes("staf bapsi")) return "Staf BAPSI";
  if (jabatan.includes("staf lab. komputer")) return "Staf Lab. Komputer";
  if (jabatan.includes("staf lab.")) return "Staf Lab.";
  if (jabatan.includes("staf tu")) return "Staf TU";
  if (jabatan.includes("staf prodi")) return "Staf Prodi";
  if (jabatan.includes("staf pasca")) return "Staf Pasca";
  if (jabatan.includes("staf fak.") || jabatan.includes("staf fisipo")) return "Staf Fak.";
  if (jabatan.includes("operator siaga")) return "Operator Siaga";
  if (jabatan.includes("staf")) return "Staf";
  
  // Dosen
  if (jabatan.includes("dosen")) return "Dosen";
  
  return "";
};

// Helper untuk extract unit kerja dari string jabatan lengkap
const extractUnitKerja = (jabatanFull: string | null | undefined, fullName?: string, username?: string): string => {
  // FAILSAFE: Force KHURNIA to FKIP by username
  if (username === "khurnia.budi.utami") {
    return "Fakultas Keguruan dan Ilmu Pendidikan (FKIP)";
  }
  
  // Cek manual mapping terlebih dahulu (untuk dosen struktural)
  // Try by fullName first, then by username as backup
  if (fullName && manualUnitKerjaMapping[fullName]) {
    return manualUnitKerjaMapping[fullName];
  }

  if (fullName) {
    const normalizedName = normalizeNameKey(fullName);
    if (manualUnitKerjaMappingNormalized[normalizedName]) {
      return manualUnitKerjaMappingNormalized[normalizedName];
    }
  }
  
  if (username && manualUnitKerjaMapping[username]) {
    return manualUnitKerjaMapping[username];
  }
  
  if (!jabatanFull) return "";
  const desc = jabatanFull.toLowerCase();
  
  // Check for specific unit kerja patterns
  if (desc.includes("yptp") || desc.includes("yayasan")) return "Yayasan";
  if (desc.includes("rektor") && !desc.includes("fak")) return "Rektorat";
  
  // Fakultas
  if (desc.includes("fak. ekonomi") || (desc.includes("ekonomi") && desc.includes("fak"))) return "Fakultas Ekonomi";
  if (desc.includes("fak. hukum") || (desc.includes("hukum") && desc.includes("fak"))) return "Fakultas Hukum";
  if (desc.includes("fak. pertanian") || (desc.includes("pertanian") && desc.includes("fak"))) return "Fakultas Pertanian";
  if (desc.includes("fak. sastra") || (desc.includes("sastra") && desc.includes("fak"))) return "Fakultas Sastra";
  if (desc.includes("fak.teknik") || desc.includes("fak. teknik") || (desc.includes("teknik") && desc.includes("fak"))) return "Fakultas Teknik & Perencanaan";
  if (desc.includes("fisipol")) return "Fakultas Ilmu Sosial dan Ilmu Politik (FISIPOL)";
  if (desc.includes("fkip")) return "Fakultas Keguruan dan Ilmu Pendidikan (FKIP)";
  
  // AAI
  if (desc.includes("aai")) return "Akademi Akuntansi Indonesia (AAI)";
  
  // Lembaga & Unit
  if (desc.includes("lppm")) return "LPPM";
  if (desc.includes("lpm") && !desc.includes("lppm")) return "LPM";
  if (desc.includes("diklat") || desc.includes("kkn")) return "Lembaga Diklat, KKN";
  if (desc.includes("bkk")) return "BKK";
  
  // Unit Tendik
  if (desc.includes("bapsi")) return "BAPSI";
  if (desc.includes("baak")) return "BAAK";
  if (desc.includes("bau")) return "BAU";
  if (desc.includes("perlengkapan") && !desc.includes("ka. bau")) return "Perlengkapan";
  if (desc.includes("pmb")) return "PMB";
  if (desc.includes("registrasi")) return "Registrasi";
  if (desc.includes("pengelola informasi dan dokumentasi")) return "Pengelola Informasi dan Dokumentasi";
  if (desc.includes("humas") || desc.includes("informasi")) return "Humas";
  if (desc.includes("staf it")) return "IT";
  if (desc.includes("lab. komputer")) return "Laboratorium Komputer";
  
  // Perpustakaan (harus setelah check fakultas)
  if (desc.includes("perpustakaan") && desc.includes("struktural")) return "UPT Perpustakaan (Struktural)";
  if (desc.includes("perpustakaan") || desc.includes("perpus")) return "UPT Perpustakaan";
  
  return "";
};

type ReportCategory = "semua" | "dosen_struktural" | "tendik";

type ReportUser = {
  id: string;
  full_name: string;
  username?: string | null;
  role?: string | null;
  unit_kerja?: string | null;
  is_struktural?: boolean | null;
};

const categoryLabel: Record<ReportCategory, string> = {
  semua: "Semua (Dosen Struktural + Tendik)",
  dosen_struktural: "Dosen Struktural",
  tendik: "Tendik",
};

const isUserInCategory = (user: ReportUser, category: ReportCategory) => {
  const role = String(user.role || "").toLowerCase();
  const isStruktural = Boolean(user.is_struktural);
  const username = String(user.username || "").toLowerCase();
  const unitKerja = String(user.unit_kerja || "").toLowerCase();
  const fullName = String(user.full_name || "").toLowerCase();
  
  // Debug for KHURNIA
  const isKhurnia = username.includes("khurnia") || fullName.includes("khurnia");
  
  // FAILSAFE: Never exclude KHURNIA
  if (username === "khurnia.budi.utami") {
    const isDosenStruktural = isStruktural && (role === "dosen" || role === "admin" || role === "superadmin");
    if (category === "dosen_struktural") return isDosenStruktural;
    if (category === "tendik") return false;
    return isDosenStruktural;
  }
  
  // Exclude cleaning service, satpam, garin, SMA, TK dari semua kategori
  if (unitKerja.includes("cleaning") || unitKerja.includes("service")) {
    if (isKhurnia) console.log("KHURNIA excluded: cleaning/service");
    return false;
  }
  if (unitKerja.includes("satpam") || unitKerja.includes("security")) {
    if (isKhurnia) console.log("KHURNIA excluded: satpam/security");
    return false;
  }
  if (unitKerja.includes("garin")) {
    if (isKhurnia) console.log("KHURNIA excluded: garin");
    return false;
  }
  if (unitKerja.includes("sma") || unitKerja.includes("sekolah menengah")) {
    if (isKhurnia) console.log("KHURNIA excluded: SMA");
    return false;
  }
  // FIX: Make TK filter more specific to avoid matching "Mtk" (Matematika)
  if (unitKerja.includes("taman kanak") || unitKerja.includes(" tk ") || unitKerja.startsWith("tk ") || unitKerja.endsWith(" tk")) {
    if (isKhurnia) console.log("KHURNIA excluded: TK");
    return false;
  }
  
  // Exclude username spesifik
  if (username.includes("ahmad.kaiser") || username.includes("ismardanus")) {
    if (isKhurnia) console.log("KHURNIA excluded: specific username");
    return false;
  }
  
  // Exclude akun tes
  if (username.includes("tesx") || fullName.includes("tesx")) {
    if (isKhurnia) console.log("KHURNIA excluded: test account");
    return false;
  }

  if (username === "andi.syahrum.makkurade") {
    return false;
  }

  
  // Dosen Struktural: dosen dengan is_struktural=true, atau admin/superadmin dengan is_struktural=true
  const isDosenStruktural = isStruktural && (role === "dosen" || role === "admin" || role === "superadmin");
  
  if (isKhurnia) {
    console.log("KHURNIA category check:", {
      role,
      isStruktural,
      isDosenStruktural,
      category,
      willInclude: category === "dosen_struktural" ? isDosenStruktural : false
    });
  }
  
  // Tendik: pegawai, admin, superadmin yang BUKAN struktural
  // Kecuali untuk irfan.ananda.ismail dan asmara.indah yang adalah tendik meskipun admin/superadmin
  const isTendik = (
    (role === "pegawai") || 
    ((role === "admin" || role === "superadmin") && !isStruktural) ||
    username === "irfan.ananda.ismail" || 
    username === "asmara.indah"
  );
  
  if (category === "dosen_struktural") return isDosenStruktural;
  if (category === "tendik") return isTendik;
  return isDosenStruktural || isTendik;
};

export default function LaporanKehadiran3() {
  const [attendances, setAttendances] = useState<AttendanceWithUser[]>([]);
  const [appUsers, setUsers] = useState<ReportUser[]>([]);
  const [leavePermits, setLeavePermits] = useState<LeavePermit[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState<"processing" | "completed" | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory>("semua");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(1);

  useEffect(() => { loadData(); }, [selectedMonth]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: usersData } = await supabase
        .from("users")
        .select("*")
        .neq("role", "mahasiswa")
        .order("full_name");
      setUsers(usersData || []);
      
      // Debug: Check if KHURNIA is loaded
      const khurniaInData = (usersData || []).find(u => u.username === "khurnia.budi.utami");
      if (khurniaInData) {
        console.log("✓ KHURNIA BUDI UTAMI loaded from database:", {
          username: khurniaInData.username,
          full_name: khurniaInData.full_name,
          role: khurniaInData.role,
          is_struktural: khurniaInData.is_struktural
        });
      } else {
        console.log("✗ KHURNIA BUDI UTAMI NOT in loaded data");
      }
      
      // Parse bulan yang dipilih untuk filter
      const [year, month] = selectedMonth.split("-").map(Number);
      const startOfMonth = `${year}-${String(month).padStart(2, "0")}-01`;
      const endOfMonth = new Date(year, month, 0); // Last day of month
      const endOfMonthStr = `${year}-${String(month).padStart(2, "0")}-${String(endOfMonth.getDate()).padStart(2, "0")}`;
      
      console.log(`=== Loading attendances for ${selectedMonth} ===`);
      console.log(`Date range: ${startOfMonth} to ${endOfMonthStr}`);
      
      // Load ALL attendance dengan pagination untuk bypass limit 1000
      const allAttendances: AttendanceWithUser[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;
      
      while (hasMore) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        
        console.log(`Loading page ${page + 1} (rows ${from}-${to})...`);
        
        const { data: attData, error } = await supabase
          .from("attendances")
          .select("*, user:users(*)")
          .gte("created_at", `${startOfMonth}T00:00:00Z`)
          .lte("created_at", `${endOfMonthStr}T23:59:59Z`)
          .order("created_at", { ascending: false })
          .range(from, to);
        
        if (error) {
          console.error("Error loading attendance:", error);
          break;
        }
        
        if (attData && attData.length > 0) {
          const filtered = attData.filter(a => !(a.note && (a.note.includes("Sesi:") || a.note.includes("KKN"))));
          allAttendances.push(...filtered);
          console.log(`  Loaded ${filtered.length} non-KKN records (total so far: ${allAttendances.length})`);
          
          // Jika kurang dari pageSize, berarti sudah habis
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
      
      // Debug: cek format created_at dan data Januari 2026
      if (allAttendances.length > 0) {
        console.log(`=== LoadData Debug ===`);
        console.log(`First attendance created_at:`, allAttendances[0]?.created_at);
        console.log(`Last attendance created_at:`, allAttendances[allAttendances.length - 1]?.created_at);
        console.log(`Type of created_at:`, typeof allAttendances[0]?.created_at);
        
        const jan2 = allAttendances.filter(a => {
          const ca = String(a.created_at || "");
          return ca.startsWith("2026-01-02");
        });
        console.log(`\n🔍 RAW Filter - Attendances on 2026-01-02: ${jan2.length}`);
        
        if (jan2.length > 0) {
          console.log(`Sample 2026-01-02 records (first 3):`, jan2.slice(0, 3).map(a => ({
            created_at: a.created_at,
            parsed_wib: toWIBYMD(a.created_at),
            user: a.user?.full_name,
            type: a.attendance_type,
            has_photo: !!a.photo_url
          })));
        } else {
          console.warn(`⚠️ No attendance records found for 2026-01-02!`);
        }
      }
      
      const { data: permitsData } = await supabase.from("leave_permits").select("*");
      setLeavePermits(permitsData || []);
      
      const { data: holidaysData } = await supabase.from("holidays").select("*").eq("is_active", true);
      setHolidays(holidaysData || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const weekOptions = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const options = [];
    
    // Khusus untuk Januari 2026: minggu pertama dari 2 Januari (Jumat) - 10 Januari (Sabtu)
    if (year === 2026 && month === 1) {
      // Minggu 1: 2-10 Januari (9 hari, termasuk Minggu 4 Jan yang libur)
      options.push({
        index: 1,
        startYMD: "2026-01-02",
        endYMD: "2026-01-10",
        label: "Minggu ke-1 (2026-01-02 s/d 2026-01-10)",
      });
      
      // Minggu selanjutnya: 7 hari dari tanggal 11
      let cursor = new Date(2026, 0, 11); // 11 Januari
      let index = 2;
      while (cursor <= lastDay) {
        const start = new Date(cursor);
        const end = new Date(cursor);
        end.setDate(end.getDate() + 6); // 7 hari
        if (end > lastDay) end.setTime(lastDay.getTime());
        
        const startYMD = toLocalYMD(start);
        const endYMD = toLocalYMD(end);
        options.push({
          index,
          startYMD,
          endYMD,
          label: `Minggu ke-${index} (${startYMD} s/d ${endYMD})`,
        });
        index += 1;
        cursor.setDate(end.getDate() + 1);
      }
    } else {
      // Untuk bulan lain: logika standar 7 hari per minggu
      let cursor = new Date(firstDay);
      let index = 1;
      while (cursor <= lastDay) {
        const start = new Date(cursor);
        const end = new Date(cursor);
        end.setDate(end.getDate() + 6); // 7 hari
        if (end > lastDay) end.setTime(lastDay.getTime());
        
        const startYMD = toLocalYMD(start);
        const endYMD = toLocalYMD(end);
        options.push({
          index,
          startYMD,
          endYMD,
          label: `Minggu ke-${index} (${startYMD} s/d ${endYMD})`,
        });
        index += 1;
        cursor.setDate(end.getDate() + 1);
      }
    }
    
    return options;
  }, [selectedMonth]);

  const selectedWeek = useMemo(() => weekOptions.find((w) => w.index === selectedWeekIndex) ?? weekOptions[0], [weekOptions, selectedWeekIndex]);
  
  const usersInScope = useMemo(() => {
    // Filter users berdasarkan kategori
    const filtered = appUsers.filter((u) => isUserInCategory(u, selectedCategory));
    
    // Debug: Check if KHURNIA BUDI UTAMI is in filtered list
    const khurniaUser = appUsers.find(u => u.username === "khurnia.budi.utami");
    if (khurniaUser) {
      const isIncluded = filtered.some(u => u.username === "khurnia.budi.utami");
      console.log("DEBUG KHURNIA BUDI UTAMI:", {
        found_in_appUsers: true,
        full_name: khurniaUser.full_name,
        role: khurniaUser.role,
        is_struktural: khurniaUser.is_struktural,
        unit_kerja: khurniaUser.unit_kerja,
        included_in_filtered: isIncluded,
        selectedCategory,
        passes_filter: isUserInCategory(khurniaUser, selectedCategory)
      });
    } else {
      console.log("DEBUG KHURNIA BUDI UTAMI: NOT FOUND in appUsers");
    }
    
    // Debug: List all FKIP users in filtered list
    const fkipUsers = filtered.filter(u => {
      const unit = extractUnitKerja(u.unit_kerja, u.full_name, u.username);
      return unit.includes("FKIP") || unit.includes("Keguruan");
    });
    console.log("DEBUG: FKIP users in filtered list:", fkipUsers.map(u => ({
      username: u.username,
      full_name: u.full_name,
      unit: extractUnitKerja(u.unit_kerja, u.full_name, u.username)
    })));
    
    // Sort berdasarkan exact order mapping
    const sorted = filtered.sort((a, b) => {
      // FAILSAFE: Force KHURNIA to correct position by username
      const isKhurniaA = a.username === "khurnia.budi.utami";
      const isKhurniaB = b.username === "khurnia.budi.utami";
      
      // Cek apakah ada exact order untuk kedua user
      let exactOrderA =
        exactOrderMapping[a.full_name] ?? exactOrderMappingNormalized[normalizeNameKey(a.full_name)];
      let exactOrderB =
        exactOrderMapping[b.full_name] ?? exactOrderMappingNormalized[normalizeNameKey(b.full_name)];
      
      // FAILSAFE: If KHURNIA doesn't have order from mapping, force it
      if (isKhurniaA && !exactOrderA) {
        exactOrderA = [9, 3]; // FKIP position 3
        console.warn("⚠️ KHURNIA order not found in mapping, using failsafe [9, 3]");
      }
      if (isKhurniaB && !exactOrderB) {
        exactOrderB = [9, 3]; // FKIP position 3
        console.warn("⚠️ KHURNIA order not found in mapping, using failsafe [9, 3]");
      }
      
      // Debug logging for Dr. Salfadri
      if (a.full_name.includes("Salfadri") || b.full_name.includes("Salfadri")) {
        console.log("DEBUG Salfadri sorting:", {
          nameA: a.full_name,
          nameB: b.full_name,
          exactOrderA,
          exactOrderB,
          unitKerjaA: extractUnitKerja(a.unit_kerja, a.full_name, a.username),
          unitKerjaB: extractUnitKerja(b.unit_kerja, b.full_name, b.username)
        });
      }
      
      // Debug for KHURNIA
      if (isKhurniaA || isKhurniaB) {
        console.log("DEBUG KHURNIA sorting:", {
          nameA: a.full_name,
          nameB: b.full_name,
          usernameA: a.username,
          usernameB: b.username,
          exactOrderA,
          exactOrderB,
          isKhurniaA,
          isKhurniaB
        });
      }
      
      // Jika keduanya ada di exact mapping, gunakan exact order
      if (exactOrderA && exactOrderB) {
        // Sort by unit kerja order first
        if (exactOrderA[0] !== exactOrderB[0]) {
          return exactOrderA[0] - exactOrderB[0];
        }
        // Then by position in unit
        return exactOrderA[1] - exactOrderB[1];
      }
      
      // Jika hanya A yang ada di mapping, A lebih dulu
      if (exactOrderA && !exactOrderB) return -1;
      
      // Jika hanya B yang ada di mapping, B lebih dulu
      if (!exactOrderA && exactOrderB) return 1;
      
      // Jika keduanya tidak ada di mapping, gunakan fallback sorting
      // Extract unit kerja dari unit_kerja field (yang berisi full description)
      // Pass full_name dan username untuk manual mapping
      const unitA = extractUnitKerja(a.unit_kerja, a.full_name, a.username);
      const unitB = extractUnitKerja(b.unit_kerja, b.full_name, b.username);
      
      // Cari order unit kerja (jika tidak ada di mapping, gunakan default 999)
      const unitOrderA = unitKerjaOrder[unitA] ?? 999;
      const unitOrderB = unitKerjaOrder[unitB] ?? 999;
      
      // Jika unit kerja berbeda, urutkan berdasarkan unit kerja
      if (unitOrderA !== unitOrderB) {
        return unitOrderA - unitOrderB;
      }
      
      // Jika unit kerja sama, urutkan berdasarkan jabatan
      const mainJabatanA = extractMainJabatan(a.unit_kerja);
      const mainJabatanB = extractMainJabatan(b.unit_kerja);
      
      const jabatanOrderA = jabatanOrder[mainJabatanA] ?? 999;
      const jabatanOrderB = jabatanOrder[mainJabatanB] ?? 999;
      
      if (jabatanOrderA !== jabatanOrderB) {
        return jabatanOrderA - jabatanOrderB;
      }
      
      // Jika jabatan juga sama, urutkan berdasarkan nama
      return a.full_name.localeCompare(b.full_name);
    });
    
    // Debug: Final sorted FKIP users
    const sortedFkipUsers = sorted.filter(u => {
      const unit = extractUnitKerja(u.unit_kerja, u.full_name, u.username);
      return unit.includes("FKIP") || unit.includes("Keguruan");
    });
    console.log("DEBUG: Final sorted FKIP users:", sortedFkipUsers.map((u, idx) => ({
      position: idx + 1,
      username: u.username,
      full_name: u.full_name
    })));
    
    // Check if KHURNIA is in final sorted list
    const khurniaInSorted = sorted.find(u => u.username === "khurnia.budi.utami");
    if (khurniaInSorted) {
      const khurniaIndex = sorted.findIndex(u => u.username === "khurnia.budi.utami");
      console.log("✓ KHURNIA in final sorted list at position:", khurniaIndex + 1);
    } else {
      console.error("✗ KHURNIA NOT in final sorted list!");
    }
    
    return sorted;
  }, [appUsers, selectedCategory]);

  const buildWeeklyAllUsersPdfDoc = async () => {
    if (!selectedWeek) return null;
    
    // Update progress: Starting
    setExportProgress(15);
    
    // Generate weekDates berdasarkan start dan end dari selectedWeek
    const weekDates: string[] = [];
    const start = parseLocalYMD(selectedWeek.startYMD);
    const end = parseLocalYMD(selectedWeek.endYMD);
    
    let cursor = new Date(start);
    while (cursor <= end) {
      const dateYMD = toLocalYMD(cursor);
      weekDates.push(dateYMD);
      cursor.setDate(cursor.getDate() + 1);
    }

    const weeklyMap: Record<string, Record<string, any>> = {};
    
    // Debug: cek berapa attendance yang ada untuk rentang tanggal ini
    console.log(`=== Building weeklyMap ===`);
    console.log(`Selected week range: ${selectedWeek.startYMD} to ${selectedWeek.endYMD}`);
    console.log(`Total attendances to process: ${attendances.length}`);
    
    // Cek apakah ada attendance untuk awal Januari 2026
    const jan2026Att = attendances.filter(a => {
      const ca = String(a.created_at || "");
      return ca.startsWith("2026-01");
    });
    console.log(`Attendances in January 2026 (raw filter): ${jan2026Att.length}`);
    
    if (jan2026Att.length > 0) {
      const jan2Att = jan2026Att.filter(a => {
        const ca = String(a.created_at || "");
        return ca.startsWith("2026-01-02");
      });
      console.log(`Attendances on 2026-01-02 (raw filter): ${jan2Att.length}`);
      
      if (jan2Att.length > 0) {
        console.log(`Sample 2026-01-02 records:`, jan2Att.slice(0, 3).map(a => ({
          created_at: a.created_at,
          parsed_ymd: createdAtToLocalYMD(a.created_at),
          user: a.user?.full_name,
          type: a.attendance_type
        })));
      }
    }
    
    let processedCount = 0;
    let jan2ParsedCount = 0;
    let jan2AddedCount = 0;
    
    attendances.forEach(a => {
      processedCount++;
      
      // Gunakan fungsi createdAtToLocalYMD yang sudah ada untuk konsistensi parsing
      const dateYMD = createdAtToLocalYMD(a.created_at);
      
      if (!dateYMD) {
        if (processedCount <= 5) {
          console.error(`❌ Failed to parse date for attendance:`, {
            created_at: a.created_at,
            user: a.user?.full_name,
            type: a.attendance_type
          });
        }
        return;
      }
      
      // Debug untuk tanggal 2 Januari - cek apakah di-exclude
      if (dateYMD === "2026-01-02") {
        jan2ParsedCount++;
        const isInRange = dateYMD >= selectedWeek.startYMD && dateYMD <= selectedWeek.endYMD;
        
        if (jan2ParsedCount <= 10) {
          console.log(`✓ Parsed 2026-01-02 #${jan2ParsedCount}: User=${a.user?.full_name}, Type=${a.attendance_type}, InRange=${isInRange}, WeekRange=${selectedWeek.startYMD} to ${selectedWeek.endYMD}`);
        }
      }
      
      // Filtering berdasarkan range
      if (dateYMD < selectedWeek.startYMD || dateYMD > selectedWeek.endYMD) return;
      
      // Log ketika data masuk ke weeklyMap
      if (dateYMD === "2026-01-02") {
        jan2AddedCount++;
        if (jan2AddedCount <= 10) {
          console.log(`✅ Adding to weeklyMap #${jan2AddedCount}: User=${a.user?.full_name}, UserID=${a.user_id}, Type=${a.attendance_type}, Photo=${a.photo_url ? 'YES' : 'NO'}`);
        }
      }
      
      if (!weeklyMap[a.user_id]) weeklyMap[a.user_id] = {};
      if (!weeklyMap[a.user_id][dateYMD]) weeklyMap[a.user_id][dateYMD] = { masuk: null, pulang: null };
      if (a.attendance_type === "masuk") weeklyMap[a.user_id][dateYMD].masuk = a;
      else weeklyMap[a.user_id][dateYMD].pulang = a;
    });
    
    console.log(`\n📊 Processing Summary:`);
    console.log(`  Total attendances processed: ${processedCount}`);
    console.log(`  Attendances parsed as 2026-01-02: ${jan2ParsedCount}`);
    console.log(`  Attendances added to weeklyMap for 2026-01-02: ${jan2AddedCount}`);
    console.log(`  WeeklyMap built with ${Object.keys(weeklyMap).length} users`);
    
    // Debug: hitung berapa attendance untuk tanggal 2 Januari yang masuk ke map
    let jan2UsersCount = 0;
    let jan2TotalRecords = 0;
    Object.keys(weeklyMap).forEach(userId => {
      if (weeklyMap[userId]["2026-01-02"]) {
        jan2UsersCount++;
        const jan2Data = weeklyMap[userId]["2026-01-02"];
        if (jan2Data.masuk) jan2TotalRecords++;
        if (jan2Data.pulang) jan2TotalRecords++;
      }
    });
    console.log(`  Users with attendance on 2026-01-02 in weeklyMap: ${jan2UsersCount}`);
    console.log(`  Total masuk/pulang records for 2026-01-02: ${jan2TotalRecords}`);

    // Update progress: Building PDF document
    setExportProgress(25);

    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "legal" }) as PdfDocument;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 18; // Narrow margin (~0.25 inch)
    const marginTop = 20; // Narrow margin

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
          img.onerror = (err) => reject(new Error("Failed to load image"));
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

        // Cover-crop to square
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
      weekDates.forEach((d) => {
        const att = weeklyMap[u.id]?.[d];

        if (att?.masuk?.photo_url) {
          photoTasks.push(async () => {
            try {
              const p = await fetchTelegramPhoto(att.masuk.photo_url);
              if (!p) return;
              const square = await toSquareJpegDataUrl(p, 512);
              if (square) photoCache.set(`m-${u.id}-${d}`, square);
            } catch (err) {
              console.error(`Error processing masuk photo for ${u.full_name} on ${d}:`, err);
            }
          });
        }

        if (att?.pulang?.photo_url) {
          photoTasks.push(async () => {
            try {
              const p = await fetchTelegramPhoto(att.pulang.photo_url);
              if (!p) return;
              const square = await toSquareJpegDataUrl(p, 512);
              if (square) photoCache.set(`p-${u.id}-${d}`, square);
            } catch (err) {
              console.error(`Error processing pulang photo for ${u.full_name} on ${d}:`, err);
            }
          });
        }
      });
    });
    
    if (photoTasks.length) {
      console.log(`Processing ${photoTasks.length} photos...`);
      setExportProgress(35);
      
      // Process photos with progress updates
      const totalPhotos = photoTasks.length;
      let processedPhotos = 0;
      
      // Create wrapped tasks that update progress
      const wrappedTasks = photoTasks.map(task => async () => {
        await task();
        processedPhotos++;
        // Progress from 35% to 75% during photo processing
        const photoProgress = 35 + Math.floor((processedPhotos / totalPhotos) * 40);
        setExportProgress(photoProgress);
      });
      
      await runWithConcurrency(wrappedTasks, 15);
      console.log(`Photo cache ready: ${photoCache.size} photos`);
      setExportProgress(80);
    } else {
      setExportProgress(80);
    }


    // Helper function untuk menambahkan footer di setiap halaman
    const addFooter = () => {
      const now = new Date();
      const tanggal = now.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
      const jam = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const footerText = `Dicetak dari kehadiran.irfanananda28.com pada ${tanggal} ${jam} WIB`;
      
      doc.setFont("times", "normal").setFontSize(8).setTextColor(100, 100, 100);
      doc.text(footerText, pageWidth / 2, pageHeight - 15, { align: "center" });
      doc.setTextColor(0, 0, 0); // Reset text color
    };

    const usersPerPage = 2;
    
    // Track numbering per unit kerja
    const unitKerjaNumbering = new Map<string, number>();
    
    // Track previous unit kerja to detect changes
    let previousUnitKerja = "";
    let isFirstPage = true;
    
    // Pre-process users to determine page breaks at unit boundaries
    // We need to ensure each unit starts on a new page
    const pageGroups: ReportUser[][] = [];
    let currentPage: ReportUser[] = [];
    
    for (let i = 0; i < usersInScope.length; i++) {
      const user = usersInScope[i];
      const userUnit = extractUnitKerja(user.unit_kerja, user.full_name, user.username);
      
      // Check if this user belongs to a different unit than the current page
      if (currentPage.length > 0) {
        const firstUserInPage = currentPage[0];
        const pageUnit = extractUnitKerja(firstUserInPage.unit_kerja, firstUserInPage.full_name, firstUserInPage.username);
        
        // If unit changed OR page is full, start new page
        if (userUnit !== pageUnit || currentPage.length >= usersPerPage) {
          pageGroups.push([...currentPage]);
          currentPage = [];
        }
      }
      
      currentPage.push(user);
    }
    
    // Add remaining users
    if (currentPage.length > 0) {
      pageGroups.push(currentPage);
    }
    
    // Now render each page group
    for (let pIdx = 0; pIdx < pageGroups.length; pIdx++) {
      const pageUsers = pageGroups[pIdx];
      
      // Extract unit kerja dari user pertama di halaman ini
      const firstUserOnPage = pageUsers[0];
      const unitKerjaOnPage = firstUserOnPage
        ? extractUnitKerja(firstUserOnPage.unit_kerja, firstUserOnPage.full_name, firstUserOnPage.username)
        : "";
      
      // Debug logging
      if (firstUserOnPage && firstUserOnPage.full_name.includes("Salfadri")) {
        console.log("DEBUG Salfadri page generation:", {
          name: firstUserOnPage.full_name,
          unit_kerja_raw: firstUserOnPage.unit_kerja,
          unitKerjaOnPage,
          previousUnitKerja,
          pageIndex: pIdx
        });
      }
      
      // Add page if not first page
      if (!isFirstPage) {
        doc.addPage();
      }
      
      let currentY = marginTop;
      
      // Header dengan logo (compact untuk narrow margin)
      if (logoData) doc.addImage(logoData, "PNG", marginX, currentY, 44, 44);
      doc.setFont("times", "bold").setFontSize(14).text("YAYASAN PERGURUAN TINGGI PADANG", pageWidth / 2, currentY + 5, { align: "center" });
      doc.setFontSize(16).text("UNIVERSITAS EKASAKTI", pageWidth / 2, currentY + 22, { align: "center" });
      doc.setFontSize(10).setFont("times", "normal").text("Jl. Veteran Dalam No. 26 Padang (25113) Telp. (0751) 28859-26770", pageWidth / 2, currentY + 36, { align: "center" });
      
      // Double line separator
      doc.setLineWidth(1.3);
      doc.line(marginX, currentY + 46, pageWidth - marginX, currentY + 46);
      doc.setLineWidth(0.4);
      doc.line(marginX, currentY + 49, pageWidth - marginX, currentY + 49);
      
      // Title dengan kategori
      let titleText = "LAPORAN KEHADIRAN MINGGUAN";
      if (selectedCategory === "dosen_struktural") {
        titleText = "LAPORAN KEHADIRAN MINGGUAN DOSEN STRUKTURAL";
      } else if (selectedCategory === "tendik") {
        titleText = "LAPORAN KEHADIRAN MINGGUAN TENDIK";
      }
      doc.setFont("times", "bold").setFontSize(13).text(titleText, pageWidth / 2, currentY + 63, { align: "center" });
      
      const monthName = getMonthName(selectedWeek.startYMD);
      const periodeText = `Periode: ${formatDateLong(selectedWeek.startYMD)} - ${formatDateLong(selectedWeek.endYMD)} (Minggu ${selectedWeekIndex} Bulan ${monthName})`;
      doc.setFont("times", "normal").setFontSize(10).text(periodeText, pageWidth / 2, currentY + 77, { align: "center" });
      currentY += 88;
      
      // Tambahkan label unit kerja di kiri atas tabel (selalu tampil jika ada)
      if (unitKerjaOnPage) {
        doc.setFont("times", "bold").setFontSize(11).setTextColor(0, 0, 0);
        doc.text(`Unit Kerja: ${unitKerjaOnPage}`, marginX, currentY, { align: "left" });
        currentY += 10;
      }
      
      // Update tracking variables
      previousUnitKerja = unitKerjaOnPage;
      isFirstPage = false;
      
      const colWidthNo = 32;
      const colWidthNama = 120;
      const colWidthDate = (pageWidth - (marginX * 2) - colWidthNo - colWidthNama) / weekDates.length;
      const rowH = 210; // Lebih pendek karena foto lebih kecil

      autoTable(doc, {
        startY: currentY,
        head: [["No", "Nama Pegawai", ...weekDates.map(d => `${formatDayName(d)}\n${formatDateShort(d)}`)]],
        body: pageUsers.map((u) => {
          // Extract unit kerja untuk user ini
          const userUnitKerja = extractUnitKerja(u.unit_kerja, u.full_name, u.username);
          
          // Get atau initialize counter untuk unit kerja ini
          let currentNumber = unitKerjaNumbering.get(userUnitKerja) || 0;
          currentNumber++;
          unitKerjaNumbering.set(userUnitKerja, currentNumber);
          
          return [currentNumber, u.full_name, ...weekDates.map(() => "")];
        }),
        theme: "grid",
        styles: { font: "times", fontSize: 8.5, minCellHeight: rowH, valign: "top", halign: "center", lineWidth: 0.65, lineColor: [0, 0, 0], textColor: [0, 0, 0] },
        headStyles: { fillColor: [220, 230, 241], textColor: [0, 0, 0], halign: "center", valign: "middle", fontSize: 9.5, fontStyle: "bold", minCellHeight: 30 },
        columnStyles: { 
          0: { cellWidth: colWidthNo, halign: "center", fontStyle: "bold", fontSize: 9, textColor: [0, 0, 0] }, 
          1: { cellWidth: colWidthNama, halign: "center", valign: "middle", fontStyle: "bold", fontSize: 14, textColor: [0, 0, 0] } 
        },
        didDrawPage: () => {
          addFooter();
        },
        didDrawCell: (data) => {
          if (data.cell.section !== "body" || data.column.index < 2) return;
          const u = pageUsers[data.row.index];
          const d = weekDates[data.column.index - 2];
          if (!u || !d) return;

          const att = weeklyMap[u.id]?.[d];
           const x = data.cell.x;
           const y = data.cell.y;
           const w = data.cell.width;

           const isSunday = parseLocalYMD(d).getDay() === 0;
           const holiday = holidays.find(h => h.holiday_date === d);
           const permit = leavePermits.find(lp => lp.user_id === u.id && d >= lp.start_date && d <= lp.end_date);

           if (isSunday || holiday || permit) {
             doc.setFontSize(8).setTextColor(0, 0, 0);
             const msg = isSunday ? "Libur Minggu" : holiday ? `Libur:\n${holiday.description}` : `Izin:\n${permitTypeLabels[permit!.permit_type]}`;
             doc.text(msg, x + w/2, y + rowH/2, { align: "center" });
             doc.setTextColor(0, 0, 0);
             return;
           }

            const mTime = att?.masuk
              ? new Date(att.masuk.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
              : "--:--";
            const pTime = att?.pulang
              ? new Date(att.pulang.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
              : "--:--";
            
            const hasMasuk = att?.masuk;
            const hasPulang = att?.pulang;

            const CM_TO_PT = 72 / 2.54;
            const photoBoxSize = 2.5 * CM_TO_PT; // 2.5cm (dikecilkan lagi dari 2.88cm)
            const photoBoxX = x + (w - photoBoxSize) / 2;
            const textX = x + w / 2;

            const drawPhotoBox = (boxX: number, boxY: number) => {
              doc.setDrawColor(160, 160, 160);
              doc.setLineWidth(0.6);
              doc.rect(boxX, boxY, photoBoxSize, photoBoxSize);
            };

            const drawContainedPhoto = (photoDataUrl: string | undefined, boxX: number, boxY: number) => {
              if (!photoDataUrl) return;
              const padding = 2;
              const drawSize = photoBoxSize - padding * 2;
              const drawX = boxX + padding;
              const drawY = boxY + padding;
              doc.addImage(photoDataUrl, "JPEG", drawX, drawY, drawSize, drawSize);
            };
            
            const drawNoAttendanceText = (boxX: number, boxY: number, type: "masuk" | "pulang") => {
              doc.setFontSize(7);
              doc.setTextColor(0, 0, 0);
              const text = type === "masuk" ? "Tidak Absen\nMasuk" : "Tidak Absen\nPulang";
              doc.text(text, boxX + photoBoxSize / 2, boxY + photoBoxSize / 2, { align: "center", baseline: "middle" });
            };

            doc.setFont("times", "bold");

            const topPad = 6;
            const labelHeight = 9;
            const labelToBoxGap = 3.5;
            const betweenSectionsGap = 6;

            // Section Masuk (ATAS)
            const masukLabelY = y + topPad + labelHeight;
            doc.setFontSize(8);
            doc.setTextColor(0, 0, 0);
            doc.text("Bukti Masuk", textX, masukLabelY, { align: "center" });
            
            const masukTimeY = masukLabelY + 9;
            doc.setFontSize(8.5);
            doc.setTextColor(0, 120, 0);
            doc.text(mTime, textX, masukTimeY, { align: "center" });
            doc.setTextColor(0, 0, 0);

            const masukBoxY = masukTimeY + labelToBoxGap;
            drawPhotoBox(photoBoxX, masukBoxY);
            const masukPhotoKey = `m-${u.id}-${d}`;
            const masukPhoto = photoCache.get(masukPhotoKey);
            if (hasMasuk) {
              if (masukPhoto) {
                drawContainedPhoto(masukPhoto, photoBoxX, masukBoxY);
              } else {
                // Foto tidak tersedia di cache
                doc.setFontSize(6);
                doc.setTextColor(100, 100, 100);
                doc.text("Foto tidak tersedia", photoBoxX + photoBoxSize / 2, masukBoxY + photoBoxSize / 2, { align: "center", baseline: "middle" });
                doc.setTextColor(0, 0, 0);
              }
            } else {
              drawNoAttendanceText(photoBoxX, masukBoxY, "masuk");
            }

            // Section Pulang (BAWAH)
            const pulangLabelY = masukBoxY + photoBoxSize + betweenSectionsGap + labelHeight;
            doc.setFontSize(8);
            doc.setTextColor(0, 0, 0);
            doc.text("Bukti Pulang", textX, pulangLabelY, { align: "center" });
            
            const pulangTimeY = pulangLabelY + 9;
            doc.setFontSize(8.5);
            doc.setTextColor(190, 0, 0);
            doc.text(pTime, textX, pulangTimeY, { align: "center" });
            doc.setTextColor(0, 0, 0);

            const pulangBoxY = pulangTimeY + labelToBoxGap;
            drawPhotoBox(photoBoxX, pulangBoxY);
            const pulangPhotoKey = `p-${u.id}-${d}`;
            const pulangPhoto = photoCache.get(pulangPhotoKey);
            if (hasPulang) {
              if (pulangPhoto) {
                drawContainedPhoto(pulangPhoto, photoBoxX, pulangBoxY);
              } else {
                // Foto tidak tersedia di cache
                doc.setFontSize(6);
                doc.setTextColor(100, 100, 100);
                doc.text("Foto tidak tersedia", photoBoxX + photoBoxSize / 2, pulangBoxY + photoBoxSize / 2, { align: "center", baseline: "middle" });
                doc.setTextColor(0, 0, 0);
              }
            } else {
              drawNoAttendanceText(photoBoxX, pulangBoxY, "pulang");
            }
        }
      });
    }
    return doc;
  };

  const handleExport = async () => {
    setExporting(true);
    setExportProgress(0);
    setExportStatus("processing");
    
    try {
      // Simulate progress during PDF build
      setExportProgress(10);
      
      const doc = await buildWeeklyAllUsersPdfDoc();
      
      setExportProgress(90);
      
      if (doc) {
        const monthName = getMonthName(selectedWeek.startYMD);
        const categoryName = selectedCategory === "dosen_struktural" 
          ? "Dosen Struktural" 
          : selectedCategory === "tendik" 
            ? "Tendik" 
            : "Semua";
        const filename = `Minggu ${selectedWeekIndex} ${monthName} ${categoryName}.pdf`;
        
        setExportProgress(95);
        doc.save(filename);
        
        setExportProgress(100);
        setExportStatus("completed");
        
        // Auto-close modal after 2 seconds
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
    } catch (error) {
      console.error("Export error:", error);
      setExporting(false);
      setExportStatus(null);
      setExportProgress(0);
    }
  };

  return (
    <>
      {/* Loading Modal */}
      {exporting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all">
            <div className="flex flex-col items-center space-y-6">
              {/* Icon/Animation */}
              <div className="relative">
                {exportStatus === "completed" ? (
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-scale-in">
                    <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                )}
              </div>

              {/* Title */}
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-gray-900">
                  {exportStatus === "completed" ? "Selesai!" : "Mohon Tunggu"}
                </h3>
                <p className="text-sm text-gray-600 font-medium">
                  {exportStatus === "completed" 
                    ? "PDF berhasil diunduh" 
                    : "Jangan tutup atau reload halaman ini"}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full space-y-2">
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 font-medium">
                    {exportStatus === "completed" ? "Selesai" : "Memproses PDF..."}
                  </span>
                  <span className="text-blue-600 font-bold">{exportProgress}%</span>
                </div>
              </div>

              {/* Status Message */}
              {exportStatus === "processing" && (
                <p className="text-xs text-gray-500 text-center">
                  Sedang memproses {usersInScope.length} pegawai
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-6">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Laporan Kehadiran Mingguan (Tabel Foto)</h2>
            <p className="text-sm text-gray-500">Format Legal landscape, narrow margin, 2 user per halaman - foto 2.5cm.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cakupan</label>
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value as ReportCategory)} className="w-full border p-2 rounded">
                <option value="semua">Semua</option>
                <option value="dosen_struktural">Dosen Struktural</option>
                <option value="tendik">Tendik</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bulan</label>
              <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minggu</label>
              <select value={selectedWeekIndex} onChange={(e) => setSelectedWeekIndex(Number(e.target.value))} className="w-full border p-2 rounded">
                {weekOptions.map((w) => <option key={w.index} value={w.index}>{w.label}</option>)}
              </select>
            </div>
          </div>

          <button 
            onClick={handleExport} 
            disabled={loading || exporting || usersInScope.length === 0} 
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 font-bold transition-all"
          >
            {exporting ? <Loader2 className="animate-spin" /> : <FileDown />}
            {exporting ? "Sedang Memproses PDF..." : "Unduh PDF Laporan"}
          </button>
          
          {loading && <div className="text-center py-4 text-blue-600 font-medium">Memuat data...</div>}
          {!loading && usersInScope.length === 0 && <div className="text-center py-4 text-red-500">Tidak ada data untuk kategori ini.</div>}
        </div>
      </div>
    </>
  );
}
