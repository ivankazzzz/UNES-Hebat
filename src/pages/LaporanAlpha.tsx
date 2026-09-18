import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { AttendanceWithUser } from "@/lib/supabase";
import { FileDown, Loader2, AlertCircle } from "lucide-react";
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

const normalizeNameKey = (value?: string | null): string => {
  return String(value || "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
};

// Mapping unit kerja berdasarkan struktur organisasi
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
  
  // Tendik
  "BAPSI": 16,
  "BAAK": 17,
  "BAU": 18,
  "Perlengkapan": 19,
  "UPT Perpustakaan": 20,
  "PMB": 21,
  "Registrasi": 22,
  "Pengelola Informasi dan Dokumentasi": 23,
  "Humas": 24,
  "IT": 25,
  "Laboratorium Komputer": 26,
  
  "": 999
};

// Manual mapping untuk dosen struktural dan tendik berdasarkan nama lengkap
const manualUnitKerjaMapping: Record<string, string> = {
  // Yayasan
  "Dr. Andi Syahrum Makkurade, M.Si": "Yayasan",
  "Dr. Jusmita Weriza, S.Kom, M.Kom": "Yayasan",
  
  // Rektorat
  "Prof. Dr. H. Sufyarma Marsidin, M.Pd": "Rektorat",
  "Dr. Ir. Dewirman Prima Putra, M.Si": "Rektorat",
  "Dr. Susi Delmiati, S.H, M.H": "Rektorat",
  "Drs. M. Takdir Mattaliti, M.Si": "Rektorat",
  "Dr.Slamet Riyadi, S.Pd.I, M.A.": "Rektorat",
  
  // Fakultas Ekonomi
  "Dr. Salfadri, S.E., M.Si": "Fakultas Ekonomi",
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

// Exact order mapping berdasarkan nama lengkap (COPY DARI LaporanKehadiran3)
const exactOrderMapping: Record<string, [number, number]> = {
  // DOSEN STRUKTURAL
  // Yayasan (unit order: 1)
  "Dr. Andi Syahrum Makkurade, M.Si": [1, 1],
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
  "khurnia.budi.utami": [9, 3],
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

// Helper untuk extract unit kerja
const extractUnitKerja = (jabatanFull: string | null | undefined, fullName?: string, username?: string): string => {
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
  
  if (desc.includes("aai")) return "Akademi Akuntansi Indonesia (AAI)";
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
  
  if (desc.includes("perpustakaan") && desc.includes("struktural")) return "UPT Perpustakaan (Struktural)";
  if (desc.includes("perpustakaan") || desc.includes("perpus")) return "UPT Perpustakaan";
  
  return "";
};

type ReportCategory = "dosen_struktural" | "tendik";

type ReportUser = {
  id: string;
  full_name: string;
  username?: string | null;
  role?: string | null;
  unit_kerja?: string | null;
  is_struktural?: boolean | null;
};

const categoryLabel: Record<ReportCategory, string> = {
  dosen_struktural: "Dosen Struktural",
  tendik: "Tendik",
};

const isUserInCategory = (user: ReportUser, category: ReportCategory) => {
  const role = String(user.role || "").toLowerCase();
  const isStruktural = Boolean(user.is_struktural);
  const username = String(user.username || "").toLowerCase();
  const unitKerja = String(user.unit_kerja || "").toLowerCase();
  const fullName = String(user.full_name || "").toLowerCase();
  
  // Exclude cleaning service, satpam, garin, SMA, TK dari semua kategori
  if (unitKerja.includes("cleaning") || unitKerja.includes("service")) return false;
  if (unitKerja.includes("satpam") || unitKerja.includes("security")) return false;
  if (unitKerja.includes("garin")) return false;
  if (unitKerja.includes("sma") || unitKerja.includes("sekolah menengah")) return false;
  if (unitKerja.includes("tk") || unitKerja.includes("taman kanak")) return false;
  
  // Exclude username spesifik
  if (username.includes("ahmad.kaiser") || username.includes("ismardanus")) return false;
  
  // Exclude akun tes
  if (username.includes("tesx") || fullName.includes("tesx")) return false;
  if (username === "andi.syahrum.makkurade") return false;

  
  // Dosen Struktural: dosen dengan is_struktural=true, atau admin/superadmin dengan is_struktural=true
  const isDosenStruktural = isStruktural && (role === "dosen" || role === "admin" || role === "superadmin");
  
  // Tendik: pegawai, admin, superadmin yang BUKAN struktural
  const isTendik = (
    (role === "pegawai") || 
    ((role === "admin" || role === "superadmin") && !isStruktural) ||
    username === "irfan.ananda.ismail" || 
    username === "asmara.indah"
  );
  
  if (category === "dosen_struktural") return isDosenStruktural;
  if (category === "tendik") return isTendik;
  return false;
};

export default function LaporanAlpha() {
  const [attendances, setAttendances] = useState<AttendanceWithUser[]>([]);
  const [appUsers, setUsers] = useState<ReportUser[]>([]);
  const [leavePermits, setLeavePermits] = useState<LeavePermit[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState<"processing" | "completed" | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory>("dosen_struktural");
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
      
      const [year, month] = selectedMonth.split("-").map(Number);
      const startOfMonth = `${year}-${String(month).padStart(2, "0")}-01`;
      const endOfMonth = new Date(year, month, 0);
      const endOfMonthStr = `${year}-${String(month).padStart(2, "0")}-${String(endOfMonth.getDate()).padStart(2, "0")}`;
      
      // Load attendance dengan pagination
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
      
      const { data: permitsData } = await supabase.from("leave_permits").select("*");
      setLeavePermits(permitsData || []);
      
      const { data: holidaysData } = await supabase.from("holidays").select("*").eq("is_active", true);
      setHolidays(holidaysData || []);
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  };

  const weekOptions = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const options = [];
    
    if (year === 2026 && month === 1) {
      options.push({
        index: 1,
        startYMD: "2026-01-02",
        endYMD: "2026-01-10",
        label: "Minggu ke-1 (2026-01-02 s/d 2026-01-10)",
      });
      
      let cursor = new Date(2026, 0, 11);
      let index = 2;
      while (cursor <= lastDay) {
        const start = new Date(cursor);
        const end = new Date(cursor);
        end.setDate(end.getDate() + 6);
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
      let cursor = new Date(firstDay);
      let index = 1;
      while (cursor <= lastDay) {
        const start = new Date(cursor);
        const end = new Date(cursor);
        end.setDate(end.getDate() + 6);
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
    const filtered = appUsers.filter((u) => isUserInCategory(u, selectedCategory));
    
    // Sort berdasarkan exact order mapping (SAMA dengan LaporanKehadiran3)
    const sorted = filtered.sort((a, b) => {
      // Cek apakah ada exact order untuk kedua user
      const exactOrderA =
        exactOrderMapping[a.full_name] ?? exactOrderMappingNormalized[normalizeNameKey(a.full_name)];
      const exactOrderB =
        exactOrderMapping[b.full_name] ?? exactOrderMappingNormalized[normalizeNameKey(b.full_name)];
      
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
      const unitA = extractUnitKerja(a.unit_kerja, a.full_name, a.username);
      const unitB = extractUnitKerja(b.unit_kerja, b.full_name, b.username);
      
      const unitOrderA = unitKerjaOrder[unitA] ?? 999;
      const unitOrderB = unitKerjaOrder[unitB] ?? 999;
      
      if (unitOrderA !== unitOrderB) {
        return unitOrderA - unitOrderB;
      }
      
      return a.full_name.localeCompare(b.full_name);
    });
    
    return sorted;
  }, [appUsers, selectedCategory]);

  const buildAlphaReportPdf = async () => {
    if (!selectedWeek) return null;
    
    setExportProgress(15);
    
    // Generate weekDates
    const weekDates: string[] = [];
    const start = parseLocalYMD(selectedWeek.startYMD);
    const end = parseLocalYMD(selectedWeek.endYMD);
    
    let cursor = new Date(start);
    while (cursor <= end) {
      const dateYMD = toLocalYMD(cursor);
      weekDates.push(dateYMD);
      cursor.setDate(cursor.getDate() + 1);
    }

    // Build weeklyMap untuk cek kehadiran
    const weeklyMap: Record<string, Record<string, any>> = {};
    
    attendances.forEach(a => {
      const dateYMD = createdAtToLocalYMD(a.created_at);
      if (!dateYMD) return;
      
      if (dateYMD < selectedWeek.startYMD || dateYMD > selectedWeek.endYMD) return;
      
      if (!weeklyMap[a.user_id]) weeklyMap[a.user_id] = {};
      if (!weeklyMap[a.user_id][dateYMD]) weeklyMap[a.user_id][dateYMD] = { masuk: null, pulang: null };
      if (a.attendance_type === "masuk") weeklyMap[a.user_id][dateYMD].masuk = a;
      else weeklyMap[a.user_id][dateYMD].pulang = a;
    });

    setExportProgress(30);

    // LANDSCAPE format seperti LaporanKehadiran3
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

    const addFooter = () => {
      const now = new Date();
      const tanggal = now.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
      const jam = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const footerText = `Dicetak dari kehadiran.irfanananda28.com pada ${tanggal} ${jam} WIB`;
      
      doc.setFont("times", "normal").setFontSize(8).setTextColor(100, 100, 100);
      doc.text(footerText, pageWidth / 2, pageHeight - 15, { align: "center" });
      doc.setTextColor(0, 0, 0);
    };

    setExportProgress(50);

    // Hitung total alpha
    let totalAlpha = 0;
    usersInScope.forEach((u) => {
      weekDates.forEach((d) => {
        const att = weeklyMap[u.id]?.[d];
        const isSunday = parseLocalYMD(d).getDay() === 0;
        const holiday = holidays.find(h => h.holiday_date === d);
        const permit = leavePermits.find(lp => lp.user_id === u.id && d >= lp.start_date && d <= lp.end_date);

        if (isSunday || holiday || permit) return;

        const hasMasuk = att?.masuk;
        const hasPulang = att?.pulang;

        if (!hasMasuk || !hasPulang) {
          totalAlpha++;
        }
      });
    });

    setExportProgress(60);

    // Track unit kerja untuk numbering dan page grouping
    const unitKerjaNumbering = new Map<string, number>();
    let previousUnitKerja = "";
    let isFirstPage = true;

    // Group users per page (4 users per page - DIUBAH dari 2)
    const usersPerPage = 4;
    const pageGroups: ReportUser[][] = [];
    let currentPage: ReportUser[] = [];
    
    for (let i = 0; i < usersInScope.length; i++) {
      const user = usersInScope[i];
      const userUnit = extractUnitKerja(user.unit_kerja, user.full_name, user.username);
      
      if (currentPage.length > 0) {
        const firstUserInPage = currentPage[0];
        const pageUnit = extractUnitKerja(firstUserInPage.unit_kerja, firstUserInPage.full_name, firstUserInPage.username);
        
        if (userUnit !== pageUnit || currentPage.length >= usersPerPage) {
          pageGroups.push([...currentPage]);
          currentPage = [];
        }
      }
      
      currentPage.push(user);
    }
    
    if (currentPage.length > 0) {
      pageGroups.push(currentPage);
    }

    setExportProgress(70);

    // Render each page
    for (let pIdx = 0; pIdx < pageGroups.length; pIdx++) {
      const pageUsers = pageGroups[pIdx];
      
      const firstUserOnPage = pageUsers[0];
      const unitKerjaOnPage = firstUserOnPage
        ? extractUnitKerja(firstUserOnPage.unit_kerja, firstUserOnPage.full_name, firstUserOnPage.username)
        : "";
      
      if (!isFirstPage) {
        doc.addPage();
      }
      
      let currentY = marginTop;
      
      // Header dengan logo
      if (logoData) doc.addImage(logoData, "PNG", marginX, currentY, 44, 44);
      doc.setFont("times", "bold").setFontSize(14).text("YAYASAN PERGURUAN TINGGI PADANG", pageWidth / 2, currentY + 5, { align: "center" });
      doc.setFontSize(16).text("UNIVERSITAS EKASAKTI", pageWidth / 2, currentY + 22, { align: "center" });
      doc.setFontSize(10).setFont("times", "normal").text("Jl. Veteran Dalam No. 26 Padang (25113) Telp. (0751) 28859-26770", pageWidth / 2, currentY + 36, { align: "center" });
      
      // Double line separator
      doc.setLineWidth(1.3);
      doc.line(marginX, currentY + 46, pageWidth - marginX, currentY + 46);
      doc.setLineWidth(0.4);
      doc.line(marginX, currentY + 49, pageWidth - marginX, currentY + 49);
      
      // Title
      const titleText = selectedCategory === "dosen_struktural" 
        ? "LAPORAN ALPHA MINGGUAN DOSEN STRUKTURAL" 
        : "LAPORAN ALPHA MINGGUAN TENDIK";
      doc.setFont("times", "bold").setFontSize(13).text(titleText, pageWidth / 2, currentY + 63, { align: "center" });
      
      const monthName = getMonthName(selectedWeek.startYMD);
      const periodeText = `Periode: ${formatDateLong(selectedWeek.startYMD)} - ${formatDateLong(selectedWeek.endYMD)} (Minggu ${selectedWeekIndex} Bulan ${monthName})`;
      doc.setFont("times", "normal").setFontSize(10).text(periodeText, pageWidth / 2, currentY + 77, { align: "center" });
      currentY += 88;
      
      // Label unit kerja dan total alpha
      if (unitKerjaOnPage) {
        doc.setFont("times", "bold").setFontSize(11).setTextColor(0, 0, 0);
        doc.text(`Unit Kerja: ${unitKerjaOnPage}`, marginX, currentY, { align: "left" });
        
        // Total Alpha di kanan atas (hanya di halaman pertama)
        if (isFirstPage) {
          doc.text(`Total Alpha: ${totalAlpha} Rekam`, pageWidth - marginX, currentY, { align: "right" });
        }
        currentY += 10;
      }
      
      previousUnitKerja = unitKerjaOnPage;
      isFirstPage = false;
      
      const colWidthNo = 32;
      const colWidthNama = 120;
      const colWidthDate = (pageWidth - (marginX * 2) - colWidthNo - colWidthNama) / weekDates.length;
      const rowH = 50; // Dikurangi dari 60 karena sekarang 4 user per page

      autoTable(doc, {
        startY: currentY,
        head: [["No", "Nama Pegawai", ...weekDates.map(d => `${formatDayName(d)}\n${formatDateShort(d)}`)]],
        body: pageUsers.map((u) => {
          const userUnitKerja = extractUnitKerja(u.unit_kerja, u.full_name, u.username);
          
          let currentNumber = unitKerjaNumbering.get(userUnitKerja) || 0;
          currentNumber++;
          unitKerjaNumbering.set(userUnitKerja, currentNumber);
          
          return [currentNumber, u.full_name, ...weekDates.map(() => "")];
        }),
        theme: "grid",
        styles: { 
          font: "times", 
          fontSize: 8.5, 
          minCellHeight: rowH, 
          valign: "middle", 
          halign: "center", 
          lineWidth: 0.65, 
          lineColor: [0, 0, 0], 
          textColor: [0, 0, 0] 
        },
        headStyles: { 
          fillColor: [220, 230, 241], 
          textColor: [0, 0, 0], 
          halign: "center", 
          valign: "middle", 
          fontSize: 9.5, 
          fontStyle: "bold", 
          minCellHeight: 30 
        },
        columnStyles: { 
          0: { cellWidth: colWidthNo, halign: "center", fontStyle: "bold", fontSize: 9 }, 
          1: { cellWidth: colWidthNama, halign: "center", valign: "middle", fontStyle: "bold", fontSize: 11 } 
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
          const h = data.cell.height;

          const isSunday = parseLocalYMD(d).getDay() === 0;
          const holiday = holidays.find(h => h.holiday_date === d);
          const permit = leavePermits.find(lp => lp.user_id === u.id && d >= lp.start_date && d <= lp.end_date);

          if (isSunday || holiday || permit) {
            doc.setFontSize(7).setTextColor(0, 0, 0);
            const msg = isSunday ? "Libur\nMinggu" : holiday ? `Libur:\n${holiday.description}` : `Izin/Cuti`;
            doc.text(msg, x + w/2, y + h/2, { align: "center", baseline: "middle" });
            doc.setTextColor(0, 0, 0);
            return;
          }

          // Cek alpha
          const hasMasuk = att?.masuk;
          const hasPulang = att?.pulang;

          if (!hasMasuk || !hasPulang) {
            // Ada alpha
            doc.setFontSize(7);
            doc.setTextColor(200, 0, 0); // Red text
            let keterangan = "";
            if (!hasMasuk && !hasPulang) {
              keterangan = "ALPHA\nTidak absen\nmasuk & pulang";
            } else if (!hasMasuk) {
              keterangan = "ALPHA\nTidak absen\nmasuk";
            } else {
              keterangan = "ALPHA\nTidak absen\npulang";
            }
            doc.text(keterangan, x + w/2, y + h/2, { align: "center", baseline: "middle" });
            doc.setTextColor(0, 0, 0);
          } else {
            // Hadir lengkap
            doc.setFontSize(7);
            doc.setTextColor(0, 150, 0); // Green text
            doc.text("✓ Hadir", x + w/2, y + h/2, { align: "center", baseline: "middle" });
            doc.setTextColor(0, 0, 0);
          }
        }
      });
    }

    setExportProgress(95);

    return doc;
  };

  const handleExport = async () => {
    setExporting(true);
    setExportProgress(0);
    setExportStatus("processing");
    
    try {
      setExportProgress(10);
      
      const doc = await buildAlphaReportPdf();
      
      setExportProgress(90);
      
      if (doc) {
        const monthName = getMonthName(selectedWeek.startYMD);
        const categoryName = selectedCategory === "dosen_struktural" ? "Dosen Struktural" : "Tendik";
        const filename = `Laporan Alpha Minggu ${selectedWeekIndex} ${monthName} ${categoryName}.pdf`;
        
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
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-red-50 rounded-xl">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Laporan Alpha Mingguan</h2>
              <p className="text-sm text-gray-500">Laporan ketidakhadiran (alpha) dosen struktural dan tendik per minggu</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cakupan</label>
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value as ReportCategory)} className="w-full border p-2 rounded">
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
            className="flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 disabled:bg-red-300 font-bold transition-all"
          >
            {exporting ? <Loader2 className="animate-spin" /> : <FileDown />}
            {exporting ? "Sedang Memproses PDF..." : "Unduh PDF Laporan Alpha"}
          </button>
          
          {loading && <div className="text-center py-4 text-blue-600 font-medium">Memuat data...</div>}
          {!loading && usersInScope.length === 0 && <div className="text-center py-4 text-red-500">Tidak ada data untuk kategori ini.</div>}
        </div>
      </div>
    </>
  );
}
