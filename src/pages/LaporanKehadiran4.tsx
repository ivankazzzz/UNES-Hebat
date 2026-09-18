import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Download, LogOut } from "lucide-react";
import { logout } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { generateKondisiStatistikPDF } from "@/lib/pdf-generator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const normalizeNameKey = (value?: string | null): string => {
  return String(value || "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
};

const unitKerjaOrder: Record<string, number> = {
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

const manualUnitKerjaMapping: Record<string, string> = {
  "Dr. Andi Syahrum Makkurade, M.Si": "Yayasan",
  "Drs. H. Andi Syahrum Makkurade": "Yayasan",
  "Drs H. Andi Syahrum Makkurade": "Yayasan",
  "Drs. Andi Syahrum Makkurade": "Yayasan",
  "Drs Andi Syahrum Makkurade": "Yayasan",
  "H. Andi Syahrum Makkurade": "Yayasan",
  "Andi Syahrum Makkurade": "Yayasan",
  "andi.syahrum.makkurade": "Yayasan",
  "Dr. Jusmita Weriza, S.Kom, M.Kom": "Yayasan",
  "Dr Jusmita Weriza, S.Kom, M.Kom": "Yayasan",
  "Dr. JUSMITA WERIZA, S.Kom, M.Kom": "Yayasan",
  "jusmita.weriza": "Yayasan",
  "Prof. Dr. H. Sufyarma Marsidin, M.Pd": "Rektorat",
  "sufyarma.marsidin": "Rektorat",
  "Dr. Ir. Dewirman Prima Putra, M.Si": "Rektorat",
  "dewirman.prima.putra": "Rektorat",
  "Dr. Susi Delmiati, S.H, M.H": "Rektorat",
  "susi.delmiati": "Rektorat",
  "Drs. M. Takdir Mattaliti, M.Si": "Rektorat",
  "Dr.Slamet Riyadi, S.Pd.I, M.A.": "Rektorat",
  "Dr. Salfadri, S.E., M.Si": "Fakultas Ekonomi",
  "Dr Salfadri, S.E., M.Si": "Fakultas Ekonomi",
  "Dr. Salfadri,S.E.,M.Si": "Fakultas Ekonomi",
  "salfadri": "Fakultas Ekonomi",
  "Jhon Rinaldo, S.E., M.Si": "Fakultas Ekonomi",
  "Dr Nuraeni Dahri, S.Kom, M.Kom": "Fakultas Ekonomi",
  "Meri Yani, S.E., M.Si, Ak, CA": "Fakultas Ekonomi",
  "Dr RICE HARYATI, S.E., M.Si": "Fakultas Ekonomi",
  "Dr FITRIATI, S.H, M.H": "Fakultas Hukum",
  "Dr. Bisma Putra Pratama, S.H., M.H": "Fakultas Hukum",
  "Dr.Iyah Faniyah, S.H, M.Hum": "Fakultas Hukum",
  "Dr.Neni Vesna Madjid, S.H., M.H": "Fakultas Hukum",
  "Netrivianti, S.H., M.H": "Fakultas Hukum",
  "Dora Tiara, S.H., M.H": "Fakultas Hukum",
  "Alam Suryo Laksono, S.H., M.H.": "Fakultas Hukum",
  "Ir Mahmud, M.Si": "Fakultas Pertanian",
  "EDDWINA AIDILA FITRIA, S.TP, M.Si": "Fakultas Pertanian",
  "Meriati, S.P, M.P": "Fakultas Pertanian",
  "Wawan Sumarno, S.P, M.Si": "Fakultas Pertanian",
  "Rera Aga Salihat, S.Si, M.Si": "Fakultas Pertanian",
  "Dr.Mac Aditiawarman, M.Hum": "Fakultas Sastra",
  "Drs. Raflis, M.Hum": "Fakultas Sastra",
  "Drs. Risal Abu, S.T, M.Eng": "Fakultas Teknik & Perencanaan",
  "Dr Ir Irnawati Siregar, M.Pd.T": "Fakultas Teknik & Perencanaan",
  "Dr Nazili, S.T, M.T": "Fakultas Teknik & Perencanaan",
  "Ir Irmayani, M.T": "Fakultas Teknik & Perencanaan",
  "Ir Mukhnizar, M.T": "Fakultas Teknik & Perencanaan",
  "Rosnita Rauf, S.T, M.T": "Fakultas Teknik & Perencanaan",
  "ROBBY HOTTER, S.T, M.T": "Fakultas Teknik & Perencanaan",
  "Merry Thressia, S.Si, M.Si": "Fakultas Teknik & Perencanaan",
  "Desriyenti, S.T.M.T": "Fakultas Teknik & Perencanaan",
  "Drs. TARMA SARTIMA, M.Si, Ph.D": "Fakultas Ilmu Sosial dan Ilmu Politik (FISIPOL)",
  "Annisa Fitri, S.Sos, M.AP": "Fakultas Ilmu Sosial dan Ilmu Politik (FISIPOL)",
  "Doddie Arya Kusuma B, S.Sos, M.Si": "Fakultas Ilmu Sosial dan Ilmu Politik (FISIPOL)",
  "Dr.Sumartono, M.Si": "Fakultas Ilmu Sosial dan Ilmu Politik (FISIPOL)",
  "Puryanto, S.A.P, M.A.P": "Fakultas Ilmu Sosial dan Ilmu Politik (FISIPOL)",
  "Dr.Feby Meuthia Yusuf, M.Pd": "Fakultas Keguruan dan Ilmu Pendidikan (FKIP)",
  "DWI MUTIA CHAN, S.Pd, M.Pd": "Fakultas Keguruan dan Ilmu Pendidikan (FKIP)",
  "KHURNIA BUDI UTAMI, S.Pd, M.Pd": "Fakultas Keguruan dan Ilmu Pendidikan (FKIP)",
  "Khurnia Budi Utami, S.Pd, M.Pd": "Fakultas Keguruan dan Ilmu Pendidikan (FKIP)",
  "khurnia.budi.utami": "Fakultas Keguruan dan Ilmu Pendidikan (FKIP)",
  "RENI RESPITA, S.Pd, M.Pd.E": "Fakultas Keguruan dan Ilmu Pendidikan (FKIP)",
  "Yessy Marzona, S.Pd, M.Pd": "Fakultas Keguruan dan Ilmu Pendidikan (FKIP)",
  "Desmiwerita, S.E., M.Si": "Akademi Akuntansi Indonesia (AAI)",
  "Dr. Yuli Ardiany, S.E., M.Si, C.Atr": "Akademi Akuntansi Indonesia (AAI)",
  "Prof. Dr Ir I Ketut Budaraga, M.Si": "LPPM",
  "HARRY SETYA HADI, S.Kom, M.Kom": "LPPM",
  "Rera Agung Syukra, S.Si, M.Si": "LPPM",
  "Adrian Fadhli, S.Pd, M.T": "LPM",
  "Budiman, S.T, M.T": "LPM",
  "Prof. Dr H. Agussalim M, S.E, M.S. MCE.": "Lembaga Diklat, KKN",
  "Dian Wahyuni Dewi Fitri, S.T, M.T": "Lembaga Diklat, KKN",
  "Dr.Susi Yuliastanty, S.Pd, M.M": "BKK",
  "YUMI ARIYATI, S.Sos, M.I.Kom": "UPT Perpustakaan (Struktural)"
};

const manualUnitKerjaMappingNormalized: Record<string, string> = Object.fromEntries(
  Object.entries(manualUnitKerjaMapping)
    .filter(([key]) => key.includes(" "))
    .map(([key, value]) => [normalizeNameKey(key), value])
);

const jabatanOrder: Record<string, number> = {
  "Sekretaris YPTP": 1,
  "Bendahara Yayasan": 2,
  "Rektor": 3,
  "Wakil Rektor I": 4,
  "Wakil Rektor II": 5,
  "Wakil Rektor III": 6,
  "Staf Ahli WR I": 7,
  "Staf Ahli Rektor": 8,
  "Dekan": 10,
  "Wadek": 11,
  "Direktur AAI": 15,
  "Wakil Direktur AAI": 16,
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
  "Koordinator Registrasi": 40,
  "Sek. LPPM": 50,
  "Sek. Lembaga": 51,
  "Sek. Prodi": 52,
  "Staf Ahli Lembaga": 60,
  "Staf Ahli": 61,
  "Pengelola Informasi dan Dokumentasi": 62,
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
  "Dosen": 100,
  "": 999
};

const exactOrderMapping: Record<string, [number, number]> = {
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
  "Prof. Dr. H. Sufyarma Marsidin, M.Pd": [2, 1],
  "Dr. Ir. Dewirman Prima Putra, M.Si": [2, 2],
  "Dr. Susi Delmiati, S.H, M.H": [2, 3],
  "Drs. M. Takdir Mattaliti, M.Si": [2, 4],
  "Dr.Slamet Riyadi, S.Pd.I, M.A.": [2, 5],
  "Dr. Salfadri, S.E., M.Si": [3, 1],
  "Dr Salfadri, S.E., M.Si": [3, 1],
  "Dr. Salfadri,S.E.,M.Si": [3, 1],
  "Jhon Rinaldo, S.E., M.Si": [3, 2],
  "Dr Nuraeni Dahri, S.Kom, M.Kom": [3, 3],
  "Meri Yani, S.E., M.Si, Ak, CA": [3, 4],
  "Dr RICE HARYATI, S.E., M.Si": [3, 5],
  "Dr FITRIATI, S.H, M.H": [4, 1],
  "Dr. Bisma Putra Pratama, S.H., M.H": [4, 2],
  "Dr.Iyah Faniyah, S.H, M.Hum": [4, 3],
  "Dr.Neni Vesna Madjid, S.H., M.H": [4, 4],
  "Netrivianti, S.H., M.H": [4, 5],
  "Dora Tiara, S.H., M.H": [4, 6],
  "Alam Suryo Laksono, S.H., M.H.": [4, 7],
  "Ir Mahmud, M.Si": [5, 1],
  "EDDWINA AIDILA FITRIA, S.TP, M.Si": [5, 2],
  "Meriati, S.P, M.P": [5, 3],
  "Wawan Sumarno, S.P, M.Si": [5, 4],
  "Rera Aga Salihat, S.Si, M.Si": [5, 5],
  "Dr.Mac Aditiawarman, M.Hum": [6, 1],
  "Drs. Raflis, M.Hum": [6, 2],
  "Drs. Risal Abu, S.T, M.Eng": [7, 1],
  "Dr Ir Irnawati Siregar, M.Pd.T": [7, 2],
  "Dr Nazili, S.T, M.T": [7, 3],
  "Ir Irmayani, M.T": [7, 4],
  "Ir Mukhnizar, M.T": [7, 5],
  "Rosnita Rauf, S.T, M.T": [7, 6],
  "ROBBY HOTTER, S.T, M.T": [7, 7],
  "Merry Thressia, S.Si, M.Si": [7, 8],
  "Desriyenti, S.T.M.T": [7, 9],
  "Drs. TARMA SARTIMA, M.Si, Ph.D": [8, 1],
  "Annisa Fitri, S.Sos, M.AP": [8, 2],
  "Doddie Arya Kusuma B, S.Sos, M.Si": [8, 3],
  "Dr.Sumartono, M.Si": [8, 4],
  "Puryanto, S.A.P, M.A.P": [8, 5],
  "Dr.Feby Meuthia Yusuf, M.Pd": [9, 1],
  "DWI MUTIA CHAN, S.Pd, M.Pd": [9, 2],
  "KHURNIA BUDI UTAMI, S.Pd, M.Pd": [9, 3],
  "Khurnia Budi Utami, S.Pd, M.Pd": [9, 3],
  "khurnia.budi.utami": [9, 3],
  "RENI RESPITA, S.Pd, M.Pd.E": [9, 4],
  "Yessy Marzona, S.Pd, M.Pd": [9, 5],
  "Desmiwerita, S.E., M.Si": [10, 1],
  "Dr. Yuli Ardiany, S.E., M.Si, C.Atr": [10, 2],
  "Prof. Dr Ir I Ketut Budaraga, M.Si": [11, 1],
  "HARRY SETYA HADI, S.Kom, M.Kom": [11, 2],
  "Rera Agung Syukra, S.Si, M.Si": [11, 3],
  "Adrian Fadhli, S.Pd, M.T": [12, 1],
  "Budiman, S.T, M.T": [12, 2],
  "Prof. Dr H. Agussalim M, S.E, M.S. MCE.": [13, 1],
  "Dian Wahyuni Dewi Fitri, S.T, M.T": [13, 2],
  "Dr.Susi Yuliastanty, S.Pd, M.M": [14, 1],
  "YUMI ARIYATI, S.Sos, M.I.Kom": [15, 1],
  "Drs. Suparman": [1, 101],
  "Refni Elida, S.H.": [1, 102],
  "Afriyani, A.Md.Kom.": [1, 103],
  "Dasriul Dahri, S.E.": [1, 104],
  "Muhammad Abdurrahman Syuraim": [1, 105],
  "Mutiara Ayu Ningtyas, S.K.M.": [1, 106],
  "Sri Widya Ningsih, S.E.": [1, 107],
  "Irfan Ananda Ismail, S.Pd., M.Pd., Gr.": [2, 101],
  "Dendi Kurniawan, S.H., M.H": [2, 102],
  "Novita Trisina, S.E.": [2, 103],
  "Renol Destitama Yoga, A.Md.Kom, SM.": [2, 104],
  "Reski Nofrialdi, S.Pd": [2, 105],
  "Zul Aida, S.E.": [3, 101],
  "Alfin Dahlia, S.E.": [3, 102],
  "Desmayenti": [3, 103],
  "Fakhri Harpin Yulio, S.Ak": [3, 104],
  "Tiara Hasari, S.Pd": [3, 105],
  "Wahyu Fauzan Syahputra, S.Pd, Gr.": [3, 106],
  "Yoserizal, A.Md.": [4, 101],
  "Desi Sumanti, S.H": [4, 102],
  "Hary Ardya Nugraha, S.H, M.H": [4, 103],
  "Indriwati Ikhwal, S.Hum": [4, 104],
  "Mulyati": [4, 105],
  "Roza Mauludiah, S.Hum": [4, 106],
  "Yenilza Zein, S.E.": [4, 107],
  "Yuni Hafizah, S.E.": [4, 108],
  "Yuswardi, S.E.": [4, 109],
  "Suroso, S.E.": [5, 101],
  "Elitriyanti, S.Pd": [5, 102],
  "Musrafil, S.I.Kom": [5, 103],
  "Nela Putriana, S.TP.": [5, 104],
  "Yeni Erwanti, A.Md.": [6, 101],
  "Poniman, S.E.": [7, 101],
  "Desriyenti, S.T. M.T": [7, 9],
  "Gita Susanti": [7, 103],
  "Hazlif Nasif, S.T, M.T": [7, 104],
  "Mutiara Putri Yosti, S.T": [7, 105],
  "Nike Rahmawati, S.T": [7, 106],
  "Siska Rahmadani": [7, 107],
  "Syafridawati, S.T": [7, 108],
  "Yogi Saputra, S.Ars.": [7, 109],
  "Emmi Yuliza, S.H": [8, 101],
  "Lovana Mae Angelkha Sutri, S.H": [8, 102],
  "Susilawati": [8, 103],
  "Dewi Irawati, A.Md.": [9, 101],
  "Nani Asyura": [9, 102],
  "Rangga Prayitno, S.H.": [9, 103],
  "Risyon": [9, 104],
  "Elyatisna, S.E.": [10, 101],
  "Aulya Bayu De Patna Siregar, S.Pd, S.H": [12, 101],
  "Irmayanti": [12, 102],
  "Afika Putri Dzakianda, S.Si": [16, 1],
  "Silvia Syafrida, S.Pd": [16, 2],
  "Velyka Hana Kusuma, A.Md.": [16, 3],
  "Yenitaroza, S.Kom": [16, 4],
  "Delsi, A.Md.Kom.": [17, 1],
  "Marniati, A.Md.Kom.": [17, 2],
  "Nofrizir, A.Md.Adm.": [17, 3],
  "Sari Maryulis, Amd., Ak.": [17, 4],
  "Drs. Syarifuddin Nur": [18, 1],
  "Asmara Indah, S.E.": [18, 2],
  "Idrawati": [18, 3],
  "Merryanti Hamid, S.E": [18, 4],
  "Mita Budi Febriani": [18, 5],
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
  "Fitriani, A.Md.Kom.": [20, 1],
  "Misbah, S.I.P.": [20, 2],
  "Zwarnesih Asmarayuda, S.H.": [20, 3],
  "Muhammad Reza Ardiansyah Suparman, S.A.P.": [21, 1],
  "Shara Wigi Legenda, S.I.Kom": [21, 2],
  "Dewi Retno Sani, S.Sn": [22, 1],
  "Evi Dwi Lastri, S.Ak, MM": [22, 2],
  "Hilda Ariani, S.H.": [22, 3],
  "Silvia Yuliana, S.Ak": [22, 4],
  "Wami Oktarini Putri, S.E.": [22, 5],
  "Rudiyansa Putra, S.Sos": [23, 1],
  "Syarifuddin, S.E., M.Hum": [24, 1],
  "Pandu Aji Putra Utama, S.I.Kom": [25, 1],
  "Andi Fazzar Fardian Syah, S.Kom": [25, 2],
  "Irfan Thomi, A.Md.": [25, 3],
  "Rival Ramdani, A.Md.": [25, 4],
  "Rizhardi Mahalim, A.Md.": [25, 5],
  "Miroslina, S.Sos": [26, 1]
};

const exactOrderMappingNormalized: Record<string, [number, number]> = Object.fromEntries(
  Object.entries(exactOrderMapping).map(([key, value]) => [normalizeNameKey(key), value])
);

const extractMainJabatan = (jabatanFull: string | null | undefined): string => {
  if (!jabatanFull) return "";
  const jabatan = jabatanFull.toLowerCase();

  if (jabatan.includes("sekretaris yptp")) return "Sekretaris YPTP";
  if (jabatan.includes("bendahara yayasan")) return "Bendahara Yayasan";
  if (jabatan.includes("ka. keuangan yayasan")) return "Ka. Keuangan Yayasan";

  if (jabatan.includes("rektor") && !jabatan.includes("wakil")) return "Rektor";
  if (jabatan.includes("wakil rektor i") || jabatan.includes("wr i")) return "Wakil Rektor I";
  if (jabatan.includes("wakil rektor ii") || jabatan.includes("wr ii")) return "Wakil Rektor II";
  if (jabatan.includes("wakil rektor iii") || jabatan.includes("wr iii")) return "Wakil Rektor III";
  if (jabatan.includes("staf ahli wr")) return "Staf Ahli WR I";
  if (jabatan.includes("staf ahli rektor")) return "Staf Ahli Rektor";

  if (jabatan.includes("dekan")) return "Dekan";
  if (jabatan.includes("wadek")) return "Wadek";

  if (jabatan.includes("direktur aai")) return "Direktur AAI";
  if (jabatan.includes("wakil direktur aai")) return "Wakil Direktur AAI";

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

  if (jabatan.includes("koordinator registrasi")) return "Koordinator Registrasi";

  if (jabatan.includes("sek. lppm")) return "Sek. LPPM";
  if (jabatan.includes("sek. lembaga")) return "Sek. Lembaga";
  if (jabatan.includes("sek. prodi")) return "Sek. Prodi";

  if (jabatan.includes("staf ahli lembaga")) return "Staf Ahli Lembaga";
  if (jabatan.includes("staf ahli")) return "Staf Ahli";
  if (jabatan.includes("pengelola informasi dan dokumentasi")) return "Pengelola Informasi dan Dokumentasi";

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
  if (jabatan.includes("dosen")) return "Dosen";

  return "";
};

const extractUnitKerja = (jabatanFull: string | null | undefined, fullName?: string, username?: string): string => {
  if (username === "khurnia.budi.utami") {
    return "Fakultas Keguruan dan Ilmu Pendidikan (FKIP)";
  }

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

  if (desc.includes("bapsi")) return "BAPSI";
  if (desc.includes("baak")) return "BAAK";
  if (desc.includes("bau")) return "BAU";
  if (desc.includes("perlengkapan") && !desc.includes("ka. bau")) return "Perlengkapan";
  if (desc.includes("pmb")) return "PMB";
  if (desc.includes("registrasi") || desc.includes("koordinator registrasi")) return "Registrasi";
  if (desc.includes("pengelola informasi dan dokumentasi")) return "Pengelola Informasi dan Dokumentasi";
  if (desc.includes("humas") || desc.includes("informasi")) return "Humas";
  if (desc.includes("staf it")) return "IT";
  if (desc.includes("lab. komputer")) return "Laboratorium Komputer";

  if (desc.includes("perpustakaan") && desc.includes("struktural")) return "UPT Perpustakaan (Struktural)";
  if (desc.includes("perpustakaan") || desc.includes("perpus")) return "UPT Perpustakaan";

  return "";
};

type ReportCategory = "dosen_struktural" | "tendik";

const categoryLabels: Record<ReportCategory, string> = {
  dosen_struktural: "Dosen Struktural",
  tendik: "Tenaga Kependidikan"
};

export default function LaporanKehadiran4() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory>("dosen_struktural");
  const [downloadingPdf, setDownloadingPdf] = useState(false);

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

  type Holiday = {
    holiday_date: string;
    description: string;
    is_active: boolean;
  };

  type LeavePermit = {
    id: string;
    user_id: string;
    permit_type: "izin" | "cuti" | "dinas_luar";
    start_date: string;
    end_date: string;
  };

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
    tendikPulang: 0
  });

  const [trackedUsers, setTrackedUsers] = useState<MinimalUser[]>([]);
  const [dosenStrukturalUsers, setDosenStrukturalUsers] = useState<MinimalUser[]>([]);
  const [tendikUsers, setTendikUsers] = useState<MinimalUser[]>([]);
  const [allAttendances, setAllAttendances] = useState<MinimalAttendance[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [leavePermits, setLeavePermits] = useState<LeavePermit[]>([]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };


  const toWIBYMD = useCallback((utcTimestamp: string): string | null => {
    if (!utcTimestamp) return null;
    try {
      const date = new Date(utcTimestamp);
      if (Number.isNaN(date.getTime()) || !isFinite(date.getTime())) {
        return null;
      }
      const wibTime = date.getTime() + 7 * 60 * 60 * 1000;
      const wibDate = new Date(wibTime);
      const year = wibDate.getUTCFullYear();
      const month = String(wibDate.getUTCMonth() + 1).padStart(2, "0");
      const day = String(wibDate.getUTCDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch {
      return null;
    }
  }, []);

  const createdAtToLocalYMD = useCallback((createdAt?: string | null): string | null => {
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
  }, [toWIBYMD]);

  const isTenagaKependidikan = useCallback((user: MinimalUser): boolean => {
    if (user.username === "tesx" || user.username === "andi.syahrum.makkurade") return false;
    if (user.username === "irfan.ananda.ismail" || user.username === "asmara.indah") {
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
      "kebersihan"
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
      "pengelola"
    ];

    return includedKeywords.some((keyword) => unitKerja.includes(keyword));
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, full_name, role, username, unit_kerja, is_struktural")
        .neq("role", "mahasiswa");

      const typedUsers = (usersData ?? []) as MinimalUser[];
      if (usersError) throw usersError;

      const dosenStrukturalUsers = typedUsers.filter((u) => {
        if (u.username === "tesx" || u.username === "andi.syahrum.makkurade") return false;
        const role = (u.role || "").toLowerCase();
        return u.is_struktural === true && (role === "dosen" || role === "admin" || role === "superadmin");
      });

      const tendikUsers = typedUsers.filter((u) => {
        if (u.username === "tesx" || u.username === "andi.syahrum.makkurade") return false;
        return isTenagaKependidikan(u);
      });

      const tracked = [...dosenStrukturalUsers, ...tendikUsers];
      setTrackedUsers(tracked);
      setDosenStrukturalUsers(dosenStrukturalUsers);
      setTendikUsers(tendikUsers);

      const trackedUserIds = new Set(tracked.map((u) => u.id));
      const dosenStrukturalUserIds = new Set(dosenStrukturalUsers.map((u) => u.id));
      const tendikUserIds = new Set(tendikUsers.map((u) => u.id));

      const [year, month] = selectedMonth.split("-").map(Number);
      const startOfMonth = `${year}-${String(month).padStart(2, "0")}-01`;
      const endOfMonthDate = new Date(year, month, 0);
      const endOfMonth = `${year}-${String(month).padStart(2, "0")}-${String(endOfMonthDate.getDate()).padStart(2, "0")}`;

      const { data: holidaysData, error: holidaysError } = await supabase
        .from("holidays")
        .select("holiday_date, description, is_active")
        .eq("is_active", true)
        .gte("holiday_date", startOfMonth)
        .lte("holiday_date", endOfMonth);

      if (holidaysError) throw holidaysError;
      setHolidays((holidaysData ?? []) as Holiday[]);

      const { data: permitsData, error: permitsError } = await supabase
        .from("leave_permits")
        .select("id, user_id, permit_type, start_date, end_date")
        .lte("start_date", endOfMonth)
        .gte("end_date", startOfMonth);

      if (permitsError) throw permitsError;
      setLeavePermits((permitsData ?? []) as LeavePermit[]);

      const allAttendances: MinimalAttendance[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const from = page * pageSize;
        const to = from + pageSize - 1;

        const { data: attData, error: attError } = await supabase
          .from("attendances")
          .select("id, user_id, attendance_type, created_at, note")
          .gte("created_at", `${startOfMonth}T00:00:00Z`)
          .lte("created_at", `${endOfMonth}T23:59:59Z`)
          .order("created_at", { ascending: false })
          .range(from, to);

        if (attError) throw attError;

        if (attData && attData.length > 0) {
          const filtered = attData.filter((a: any) => !(a.note && (a.note.includes("Sesi:") || a.note.includes("KKN"))));
          allAttendances.push(...(filtered as MinimalAttendance[]));
          if (attData.length < pageSize) {
            hasMore = false;
          } else {
            page += 1;
          }
        } else {
          hasMore = false;
        }
      }

      setAllAttendances(allAttendances);

      const monthAttendance = allAttendances.filter((a) => {
        if (!a.created_at) return false;
        const day = createdAtToLocalYMD(a.created_at);
        if (!day) return false;
        return day >= startOfMonth && day <= endOfMonth;
      });

      const checkinUserIds = new Set(
        monthAttendance
          .filter((a) => a.attendance_type === "masuk")
          .map((a) => a.user_id)
          .filter(Boolean)
      );

      const checkoutUserIds = new Set(
        monthAttendance
          .filter((a) => a.attendance_type === "pulang")
          .map((a) => a.user_id)
          .filter(Boolean)
      );

      const presentUserIds = new Set<string>([...checkinUserIds, ...checkoutUserIds]);

      const filteredPresentUserIds = new Set(Array.from(presentUserIds).filter((id) => trackedUserIds.has(id)));
      const filteredCheckinUserIds = new Set(Array.from(checkinUserIds).filter((id) => trackedUserIds.has(id)));
      const filteredCheckoutUserIds = new Set(Array.from(checkoutUserIds).filter((id) => trackedUserIds.has(id)));
      const filteredMissingCheckoutIds = Array.from(filteredCheckinUserIds).filter(
        (id) => !filteredCheckoutUserIds.has(id)
      );

      const trackedUsersCount = tracked.length;
      const presentCount = filteredPresentUserIds.size;
      const notPresentCount = trackedUsersCount - filteredPresentUserIds.size;
      const missingCheckoutCount = filteredMissingCheckoutIds.length;

      const dosenStrukturalMasuk = Array.from(filteredPresentUserIds).filter((id) => dosenStrukturalUserIds.has(id)).length;
      const dosenStrukturalPulang = Array.from(filteredCheckoutUserIds).filter((id) => dosenStrukturalUserIds.has(id)).length;
      const tendikMasuk = Array.from(filteredPresentUserIds).filter((id) => tendikUserIds.has(id)).length;
      const tendikPulang = Array.from(filteredCheckoutUserIds).filter((id) => tendikUserIds.has(id)).length;

      setStats({
        totalUsers: trackedUsersCount,
        presentToday: presentCount,
        notPresentToday: notPresentCount,
        missingCheckoutToday: missingCheckoutCount,
        dosenStrukturalTotal: dosenStrukturalUsers.length,
        tendikTotal: tendikUsers.length,
        dosenStrukturalMasuk,
        dosenStrukturalPulang,
        tendikMasuk,
        tendikPulang
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  }, [createdAtToLocalYMD, isTenagaKependidikan, selectedMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);



  const monthDates = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    if (!year || !month) return [] as number[];
    const dates: number[] = [];
    const lastDay = new Date(year, month, 0).getDate();
    for (let day = 1; day <= lastDay; day += 1) {
      dates.push(day);
    }
    return dates;
  }, [selectedMonth]);

  const selectedUsers = useMemo(() => {
    const users = selectedCategory === "dosen_struktural" ? dosenStrukturalUsers : tendikUsers;
    return users.filter((user) => (user.username ?? "").toLowerCase() !== "andi.syahrum.makkurade");
  }, [dosenStrukturalUsers, selectedCategory, tendikUsers]);

  const sortedUsers = useMemo(() => {
    const users = [...selectedUsers];
    return users.sort((a, b) => {
      const nameA = a.full_name ?? "";
      const nameB = b.full_name ?? "";
      const exactOrderA =
        exactOrderMapping[nameA] ?? exactOrderMappingNormalized[normalizeNameKey(nameA)];
      const exactOrderB =
        exactOrderMapping[nameB] ?? exactOrderMappingNormalized[normalizeNameKey(nameB)];

      if (exactOrderA && exactOrderB) {
        if (exactOrderA[0] !== exactOrderB[0]) {
          return exactOrderA[0] - exactOrderB[0];
        }
        return exactOrderA[1] - exactOrderB[1];
      }

      if (exactOrderA && !exactOrderB) return -1;
      if (!exactOrderA && exactOrderB) return 1;

      const unitA = extractUnitKerja(a.unit_kerja, a.full_name ?? undefined, a.username ?? undefined);
      const unitB = extractUnitKerja(b.unit_kerja, b.full_name ?? undefined, b.username ?? undefined);
      const unitOrderA = unitKerjaOrder[unitA] ?? 999;
      const unitOrderB = unitKerjaOrder[unitB] ?? 999;

      if (unitOrderA !== unitOrderB) {
        return unitOrderA - unitOrderB;
      }

      const mainJabatanA = extractMainJabatan(a.unit_kerja);
      const mainJabatanB = extractMainJabatan(b.unit_kerja);

      const jabatanOrderA = jabatanOrder[mainJabatanA] ?? 999;
      const jabatanOrderB = jabatanOrder[mainJabatanB] ?? 999;

      if (jabatanOrderA !== jabatanOrderB) {
        return jabatanOrderA - jabatanOrderB;
      }

      return nameA.localeCompare(nameB);
    });
  }, [selectedUsers]);

  const categoryLabel = categoryLabels[selectedCategory];

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

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const [year, month] = selectedMonth.split("-").map(Number);
      const startOfMonth = `${year}-${String(month).padStart(2, "0")}-01`;
      const endOfMonthDate = new Date(year, month, 0);
      const endOfMonth = `${year}-${String(month).padStart(2, "0")}-${String(endOfMonthDate.getDate()).padStart(2, "0")}`;
      const monthLabel = new Date(year, month - 1, 1).toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric"
      });
      const monthTitle = `BULAN ${new Date(year, month - 1, 1)
        .toLocaleDateString("id-ID", { month: "long" })
        .toUpperCase()}`;
      const filenamePrefix = `Rekap ${monthLabel} ${categoryLabel}`;

      const historyAttendances = allAttendances;

      await generateKondisiStatistikPDF({
        selectedDate: startOfMonth,
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
          tendikPulang: stats.tendikPulang
        },
        trackedUsers: selectedUsers,
        attendancesSelectedDate: historyAttendances,
        attendancesHistory: historyAttendances,
        isSunday: false,
        reportTitle: "REKAPITULASI ABSENSI",
        filenamePrefix,
          monthOptions: {
            monthLabel,
            monthTitle,
            dates: monthDates,
            monthStart: startOfMonth,
            monthEnd: endOfMonth,
            categoryLabel,
            holidayDates: holidays.filter((h) => h.is_active).map((h) => h.holiday_date),
            holidayLabels: Object.fromEntries(
              holidays.filter((h) => h.is_active).map((h) => [h.holiday_date, h.description])
            ),
            leaveByUser: leaveDatesByUser,
            sortedUsers
          }

      });
    } catch (error) {
      console.error("Gagal membuat PDF laporan kehadiran 4:", error);
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 w-full overflow-x-hidden">
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
              <h1 className="text-lg font-bold text-gray-900 text-sm md:text-base leading-tight">Laporan Kehadiran 4</h1>
              <p className="text-[10px] text-gray-500 md:hidden">Rekap Bulanan</p>
              <p className="text-xs text-gray-500 hidden md:block">Rekap Kehadiran Bulanan</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleLogout} className="p-2 hover:bg-gray-100 rounded-lg">
              <LogOut className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6 pb-20">
        <div className="flex flex-col items-center justify-center space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
          <label className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Pilih Bulan & Kategori</label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative group">
              <div className="absolute inset-0 bg-blue-500 blur-lg opacity-20 group-hover:opacity-30 transition-opacity rounded-full"></div>
              <div className="relative flex items-center bg-white border-2 border-blue-100 rounded-2xl px-4 py-2 shadow-sm focus-within:border-blue-500 transition-all">
                <Calendar className="w-5 h-5 text-blue-500 mr-2" />
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent text-lg font-bold text-gray-900 focus:outline-none cursor-pointer"
                />
              </div>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as ReportCategory)}
              className="h-11 rounded-2xl border-2 border-blue-100 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="dosen_struktural">Dosen Struktural</option>
              <option value="tendik">Tenaga Kependidikan</option>
            </select>
          </div>
        </div>

        <Card className="border-emerald-200 bg-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-emerald-700" />
              Unduh Laporan (PDF)
            </CardTitle>
            <CardDescription>Format A4 landscape, kategori terpisah</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg bg-white border border-emerald-100 p-3">
              <div className="text-xs text-emerald-800 font-semibold">Isi laporan</div>
              <ul className="mt-1 text-[11px] text-emerald-900 space-y-1">
                <li>Daftar pegawai sesuai kategori terpilih</li>
                <li>Kolom hari kerja (Senin-Sabtu, libur dikecualikan)</li>
                <li>Status absensi Pagi / Pulang per tanggal</li>
                <li>Keterangan total rekap bulanan per pegawai</li>
              </ul>
            </div>
            <Button
              onClick={handleDownloadPdf}
              disabled={loading || downloadingPdf}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {downloadingPdf ? "Menyiapkan PDF..." : "Unduh PDF Laporan Kehadiran 4"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
