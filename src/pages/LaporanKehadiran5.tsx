import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Download, LogOut } from "lucide-react";
import { logout } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { generateLaporanKehadiran5PDF } from "@/lib/pdf-generator";
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
  "Kepala Lembaga": 20,
  "Ketua Lembaga": 21,
  "Sekretaris Lembaga": 22,
  "Kepala Badan": 25,
  "Sekretaris Badan": 26,
  "Kepala Biro": 30,
  "Ka. Biro": 31,
  "Plt. Ka. BAU": 32,
  "Plt. Ka. BAAK": 33,
  "Kepala Bagian": 35,
  "Kepala UPT": 40,
  "Ka. Perpustakaan": 41,
  "Ka. Prodi": 45,
  "Ketua Program Studi": 46,
  "Sekretaris Prodi": 47,
  "Sekretaris Program Studi": 48,
  "Kepala Labor": 50,
  "Kepala Laboratorium": 51,
  "Kepala Pusat": 55,
  "Kepala BAPSI": 100,
  "Ka. BAPSI": 101,
  "Ka. BAU": 102,
  "Ka. Perlengkapan": 103,
  "Kepala BAU": 104,
  "Ka. BAAK": 105,
  "Ka. TU": 106,
  "Kepala TU": 107,
  "Koordinator Registrasi": 108,
  "Koordinator": 109,
  "Ka.": 110,
  "Staf": 200,
  "Dosen": 300,
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

  "Fadli, S.Kom": [1, 1],
  "Fadhil": [1, 2],
  "Muhammad Fadil": [1, 2],
  "M. Fadil": [1, 2],
  "Khairul Saleh": [1, 3],
  "KHAIRUL SALEH": [1, 3],
  "Dafrizal, S.Sos": [1, 4],

  "Riri Oktafiani": [2, 1],
  "Riri Oktafiani, S.M.": [2, 1],
  "Riri Oktafiani, S.M": [2, 1],
  "Novy Fitria": [2, 2],
  "Novy Fitria, A.Md": [2, 2],
  "Novi Fitria": [2, 2],
  "Muhammad Rizki, A.Md": [2, 3],
  "M. Rizki": [2, 3],
  "M. Rizki, A.Md": [2, 3],
  "Muhammad Rizki": [2, 3],
  "GUSRI RAMADHANI": [2, 4],
  "Gusri Ramadhani": [2, 4],
  "Gusri Ramadhani, A.Md": [2, 4],
  "Muhammad Ilham, S.H": [2, 5],
  "M. Ilham, S.H": [2, 5],
  "M. Ilham": [2, 5],
  "Ilham, S.H": [2, 5],

  "Zul Aida, S.E.": [3, 1],
  "Zul Aida, S.E": [3, 1],
  "Zul Aida": [3, 1],
  "Zulaida": [3, 1],
  "Zulaida, S.E": [3, 1],
  "Zulaida, S.E.": [3, 1],
  "Wahyu Fauzan Syahputra, S.Pd, Gr.": [3, 2],
  "Wahyu Fauzan Syahputra, S.Pd, Gr": [3, 2],
  "Wahyu Fauzan Syahputra": [3, 2],
  "Wahyu Fauzan": [3, 2],
  "Tiara Hasari, S.Pd": [3, 3],
  "Tiara Hasari": [3, 3],

  "Yoserizal, A.Md.": [4, 1],
  "Yoserizal, A.Md": [4, 1],
  "Yoserizal": [4, 1],
  "Yuswardi, S.E.": [4, 2],
  "Yuswardi, S.E": [4, 2],
  "Yuswardi": [4, 2],
  "Mulia Hendra, S.H": [4, 3],
  "Mulia Hendra": [4, 3],
  "Melia Hendra": [4, 3],
  "M. Hendra": [4, 3],
  "M. Hendra, S.H": [4, 3],
  "Mulia Hendra, S.H.": [4, 3],
  "Febri Yanto": [4, 4],
  "Febriyanto": [4, 4],

  "Suroso, S.E.": [5, 1],
  "Suroso, S.E": [5, 1],
  "Suroso": [5, 1],
  "Yefni Rozalinda, S.P": [5, 2],
  "Yefni Rozalinda": [5, 2],
  "Yefni": [5, 2],

  "Yeni Erwanti, A.Md.": [6, 1],
  "Yeni Erwanti, A.Md": [6, 1],
  "Yeni Erwanti": [6, 1],
  "Aida Susanti": [6, 2],
  "Aida Susanti, S.Hum": [6, 2],

  "Aulia Eka Putra, S.Kom": [7, 1],
  "Aulia Eka Putra": [7, 1],
  "Aulia": [7, 1],
  "Syafridawati, S.T": [7, 2],
  "Syafridawati": [7, 2],
  "Yogi Saputra, S.Ars.": [7, 3],
  "Yogi Saputra, S.Ars": [7, 3],
  "Yogi Saputra": [7, 3],
  "Rifani Guswita, S.Si": [7, 4],
  "Rifani Guswita": [7, 4],

  "Guspita, S.Sos": [8, 1],
  "Guspita": [8, 1],
  "Susilawati": [8, 2],

  "Desmira, S.Kom": [9, 1],
  "Desmira": [9, 1],
  "Kiki Febria Rahmi, S.Pd": [9, 2],
  "Kiki Febria Rahmi": [9, 2],
  "Kiki Febria": [9, 2],
  "Kiki": [9, 2],
  "Kiki Febri Rahmi, S.Pd": [9, 2],

  "Rina S.E": [10, 1],
  "Rina, S.E": [10, 1],
  "Rina, S.E.": [10, 1],
  "Rina": [10, 1],

  "Afriyeni, S.Kom": [12, 1],
  "Afriyeni": [12, 1],

  "Yenitaroza, S.Kom": [16, 1],
  "Yenitaroza": [16, 1],
  "Rezi Ramadhani, A.Md.": [16, 2],
  "Rezi Ramadhani, A.Md": [16, 2],
  "Rezi Ramadhani": [16, 2],
  "Rezi": [16, 2],
  "Velyka Hana Kusuma, A.Md.": [16, 3],
  "Velyka Hana Kusuma, A.Md": [16, 3],
  "Velyka Hana Kusuma": [16, 3],
  "Velyka": [16, 3],

  "Dodi Susanto, S.E.": [17, 1],
  "Dodi Susanto, S.E": [17, 1],
  "Dodi Susanto": [17, 1],
  "Dodi": [17, 1],
  "Rika Herawati, S.E.": [17, 2],
  "Rika Herawati, S.E": [17, 2],
  "Rika Herawati": [17, 2],
  "Rika": [17, 2],
  "Mimin Kurnia Ningsih, S.E.": [17, 3],
  "Mimin Kurnia Ningsih, S.E": [17, 3],
  "Mimin Kurnia Ningsih": [17, 3],
  "Mimin Kurnianingsih, S.E.": [17, 3],
  "Mimin": [17, 3],

  "Syarifuddin Nur, S.H": [18, 1],
  "Syarifuddin Nur": [18, 1],
  "Alvis Syahrin, S.Sos": [18, 2],
  "Alvis Syahrin": [18, 2],
  "Alvis Sahrin, S.Sos": [18, 2],
  "Alvis Sahrin": [18, 2],
  "Alvis": [18, 2],
  "Asmara Indah, S.Kom": [18, 3],
  "Asmara Indah": [18, 3],
  "Indah": [18, 3],
  "Irfan Ananda Ismail, S.Pd": [18, 4],
  "Irfan Ananda Ismail": [18, 4],
  "Irfan": [18, 4],
  "Adil Marta": [18, 5],
  "Aldo Maulana": [18, 6],

  "Danil, S.E": [19, 1],
  "Danil, S.E.": [19, 1],
  "Danil": [19, 1],
  "M. Al Ikhlas, S.E.": [19, 2],
  "M. Al Ikhlas, S.E": [19, 2],
  "M. Al Ikhlas": [19, 2],
  "Al Ikhlas": [19, 2],
  "Ikhlas": [19, 2],

  "Indra Gunawan, S.Kom": [20, 1],
  "Indra Gunawan": [20, 1],
  "Indra": [20, 1],
  "Afrizal, S.Sos": [20, 2],
  "Afrizal": [20, 2],
  "Nadia Pratiwi, S.E": [20, 3],
  "Nadia Pratiwi, S.E.": [20, 3],
  "Nadia Pratiwi": [20, 3],
  "Nadia": [20, 3],
  "Silvia Murni, S.Sos": [20, 4],
  "Silvia Murni": [20, 4],
  "Silvia": [20, 4],
  "Reza Pahlevi, S.Kom": [20, 5],
  "Reza Pahlevi": [20, 5],
  "Reza": [20, 5],
  "Nur Asni": [20, 6],
  "Nuraini": [20, 7],

  "Dewi Yana, S.E": [21, 1],
  "Dewi Yana, S.E.": [21, 1],
  "Dewi Yana": [21, 1],
  "Dewiyana, S.E.": [21, 1],
  "Dewiyana": [21, 1],
  "Indra Sukma, S.Kom": [21, 2],
  "Indra Sukma": [21, 2],

  "Wami Oktarini Putri, S.E.": [22, 1],
  "Wami Oktarini Putri, S.E": [22, 1],
  "Wami Oktarini Putri": [22, 1],
  "Wami Oktarini": [22, 1],
  "Wami": [22, 1],

  "Syarifuddin, S.H": [24, 1],
  "Syarifuddin": [24, 1],
  "Furqanul Hamdi, S.I.Kom": [24, 2],
  "Furqanul Hamdi, S.I.Kom, M.I.Kom.": [24, 2],
  "Furqanul Hamdi": [24, 2],
  "Furqan": [24, 2],

  "Eka Putra, S.Kom": [25, 1],
  "Eka Putra": [25, 1],

  "Lita Puspa Sari, S.Kom": [26, 1],
  "Lita Puspa Sari": [26, 1],
  "Lita": [26, 1],
};

const exactOrderMappingNormalized: Record<string, [number, number]> = Object.fromEntries(
  Object.entries(exactOrderMapping)
    .filter(([key]) => key.includes(" "))
    .map(([key, value]) => [normalizeNameKey(key), value])
);

const extractMainJabatan = (jabatanFull?: string | null): string => {
  if (!jabatanFull) return "";
  const firstPart = jabatanFull.split("&")[0]?.trim() ?? "";
  const lower = firstPart.toLowerCase();

  if (lower.includes("rektor") && !lower.includes("wakil")) return "Rektor";
  if (lower.includes("wakil rektor i") || lower.includes("wr i")) return "Wakil Rektor I";
  if (lower.includes("wakil rektor ii") || lower.includes("wr ii")) return "Wakil Rektor II";
  if (lower.includes("wakil rektor iii") || lower.includes("wr iii")) return "Wakil Rektor III";
  if (lower.includes("sekretaris yptp")) return "Sekretaris YPTP";
  if (lower.includes("bendahara yayasan")) return "Bendahara Yayasan";
  if (lower.includes("dekan")) return "Dekan";
  if (lower.includes("wadek") || lower.includes("wakil dekan")) return "Wadek";
  if (lower.includes("direktur aai")) return "Direktur AAI";
  if (lower.includes("wakil direktur aai")) return "Wakil Direktur AAI";
  if (lower.includes("kepala lembaga") || lower.includes("ka. lembaga")) return "Kepala Lembaga";
  if (lower.includes("ketua lembaga")) return "Ketua Lembaga";
  if (lower.includes("sekretaris lembaga")) return "Sekretaris Lembaga";
  if (lower.includes("kepala badan") || lower.includes("ka. badan")) return "Kepala Badan";
  if (lower.includes("sekretaris badan")) return "Sekretaris Badan";
  if (lower.includes("kepala biro") || lower.includes("ka. biro")) return "Kepala Biro";
  if (lower.includes("plt. ka. bau")) return "Plt. Ka. BAU";
  if (lower.includes("plt. ka. baak")) return "Plt. Ka. BAAK";
  if (lower.includes("kepala bapsi") || lower.includes("ka. bapsi")) return "Kepala BAPSI";
  if (lower.includes("kepala perpustakaan") || lower.includes("ka. perpustakaan")) return "Ka. Perpustakaan";
  if (lower.includes("ka. prodi") || lower.includes("ketua program studi")) return "Ka. Prodi";
  if (lower.includes("sekretaris prodi") || lower.includes("sekretaris program studi")) return "Sekretaris Prodi";
  if (lower.includes("ka. labor") || lower.includes("kepala labor")) return "Kepala Labor";
  if (lower.includes("ka. pmb")) return "Ka. PMB";
  if (lower.includes("ka. tu") || lower.includes("kepala tu")) return "Ka. TU";
  if (lower.includes("ka. perlengkapan")) return "Ka. Perlengkapan";
  if (lower.includes("koordinator registrasi") || lower.includes("koordinator")) return "Koordinator";
  if (lower.includes("staf")) return "Staf";
  if (lower.includes("dosen")) return "Dosen";

  return firstPart;
};

const extractUnitKerja = (jabatanFull?: string | null, fullName?: string, username?: string): string => {
  if (fullName) {
    if (manualUnitKerjaMapping[fullName]) {
      return manualUnitKerjaMapping[fullName];
    }
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

export default function LaporanKehadiran5() {
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

  const tendikUnitOrder: Record<string, number> = {
    "Yayasan": 1,
    "Rektorat": 2,
    "BAAK": 3,
    "BAU": 4,
    "BAPSI": 5,
    "Perlengkapan": 6,
    "PMB": 7,
    "Registrasi": 8,
    "Humas": 9,
    "IT": 10,
    "LPM": 11,
    "LPPM": 11,
    "UPT Perpustakaan": 12,
    "Pascasarjana": 13,
    "Fakultas Ekonomi": 14,
    "Fakultas Hukum": 15,
    "Fakultas Pertanian": 16,
    "Fakultas Sastra": 17,
    "Fakultas Teknik & Perencanaan": 18,
    "Fakultas Ilmu Sosial dan Ilmu Politik (FISIPOL)": 19,
    "Fakultas Keguruan dan Ilmu Pendidikan (FKIP)": 20,
    "Akademi Akuntansi Indonesia (AAI)": 21,
    "Laboratorium Komputer": 22,
    "": 999
  };

  const extractTendikUnit = (unitKerja?: string | null): string => {
    const desc = (unitKerja || "").toLowerCase();
    
    if (desc.includes("yayasan") || desc.includes("yptp")) return "Yayasan";
    if (desc.includes("wr ") || desc.includes("rektor")) return "Rektorat";
    if (desc.includes("baak")) return "BAAK";
    if (desc.includes("bau")) return "BAU";
    if (desc.includes("bapsi")) return "BAPSI";
    if (desc.includes("perlengkapan")) return "Perlengkapan";
    if (desc.includes("pmb")) return "PMB";
    if (desc.includes("registrasi")) return "Registrasi";
    if (desc.includes("humas")) return "Humas";
    if (desc.includes("staf it") || desc === "it") return "IT";
    if (desc.includes("lpm")) return "LPM";
    if (desc.includes("lppm")) return "LPPM";
    if (desc.includes("perpustakaan universitas") || (desc.includes("perpustakaan") && !desc.includes("fak"))) return "UPT Perpustakaan";
    if (desc.includes("pascasarjana")) return "Pascasarjana";
    
    if (desc.includes("ekonomi")) return "Fakultas Ekonomi";
    if (desc.includes("hukum")) return "Fakultas Hukum";
    if (desc.includes("pertanian") || desc.includes("thp")) return "Fakultas Pertanian";
    if (desc.includes("sastra")) return "Fakultas Sastra";
    if (desc.includes("teknik") || desc.includes("mesin") || desc.includes("arsitek")) return "Fakultas Teknik & Perencanaan";
    if (desc.includes("fisipol")) return "Fakultas Ilmu Sosial dan Ilmu Politik (FISIPOL)";
    if (desc.includes("fkip")) return "Fakultas Keguruan dan Ilmu Pendidikan (FKIP)";
    if (desc.includes("aai")) return "Akademi Akuntansi Indonesia (AAI)";
    if (desc.includes("lab. komputer") || desc.includes("laboratorium komputer")) return "Laboratorium Komputer";
    
    return "";
  };

  const tendikJabatanRank = (unitKerja?: string | null): number => {
    const desc = (unitKerja || "").toLowerCase();
    if (desc.includes("bendahara yayasan")) return 1;
    if (desc.includes("kepala bapsi") || desc.includes("ka. bapsi")) return 2;
    if (desc.includes("koordinator registrasi") || desc.includes("koordinator")) return 3;
    if (desc.includes("ka. tu") || desc.includes("ka.tu") || desc.includes("kepala tu")) return 4;
    if (desc.includes("staf ahli")) return 5;
    if (desc.includes("staf wr")) return 6;
    if (desc.includes("staf tu")) return 7;
    if (desc.includes("staf prodi")) return 8;
    if (desc.includes("staf lab") || desc.includes("laboratorium")) return 9;
    if (desc.includes("staf perpus") || desc.includes("perpustakaan")) return 10;
    if (desc.includes("staf")) return 11;
    return 20;
  };

  const sortedUsers = useMemo(() => {
    const users = [...selectedUsers];

    if (selectedCategory === "tendik") {
      return users.sort((a, b) => {
        const unitA = extractTendikUnit(a.unit_kerja);
        const unitB = extractTendikUnit(b.unit_kerja);
        const orderA = tendikUnitOrder[unitA] ?? 999;
        const orderB = tendikUnitOrder[unitB] ?? 999;

        if (orderA !== orderB) {
          return orderA - orderB;
        }

        const rankA = tendikJabatanRank(a.unit_kerja);
        const rankB = tendikJabatanRank(b.unit_kerja);

        if (rankA !== rankB) {
          return rankA - rankB;
        }

        const nameA = a.full_name ?? "";
        const nameB = b.full_name ?? "";
        return nameA.localeCompare(nameB);
      });
    }

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
  }, [selectedCategory, selectedUsers]);

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
      const filenamePrefix = `Rekap ${monthLabel} ${categoryLabel} - Ringkas`;

      await generateLaporanKehadiran5PDF({
        selectedMonth,
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
        attendances: allAttendances,
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
      console.error("Gagal membuat PDF laporan kehadiran 5:", error);
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
              <h1 className="text-lg font-bold text-gray-900 text-sm md:text-base leading-tight">Laporan Kehadiran 5</h1>
              <p className="text-[10px] text-gray-500 md:hidden">Rekap Bulanan Ringkas</p>
              <p className="text-xs text-gray-500 hidden md:block">Rekap Kehadiran Bulanan (Ringkas 4 Kolom)</p>
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

        <Card className="border-violet-200 bg-violet-50/70 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-violet-900">
              <Download className="w-5 h-5 text-violet-700" />
              Unduh Laporan (PDF)
            </CardTitle>
            <CardDescription className="text-violet-700/80">Format A4 portrait ringkas (No, Nama, Unit Kerja/Jabatan, Keterangan Bulanan)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg bg-white border border-violet-100 p-3.5 shadow-sm">
              <div className="text-xs text-violet-900 font-semibold mb-1">Struktur Kolom Laporan:</div>
              <ul className="text-[11.5px] text-violet-800 space-y-1">
                <li>• <strong>Kolom 1:</strong> No</li>
                <li>• <strong>Kolom 2:</strong> Nama Pegawai / Dosen</li>
                <li>• <strong>Kolom 3:</strong> Unit Kerja / Jabatan</li>
                <li>• <strong>Kolom 4:</strong> Keterangan Bulan (Total Hari Kerja, Hadir, Absen Masuk, Absen Pulang, Izin, Cuti, Dinas Luar, Tidak Absen)</li>
              </ul>
            </div>
            <Button
              onClick={handleDownloadPdf}
              disabled={loading || downloadingPdf}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2.5 rounded-xl shadow-md transition-all active:scale-[0.99]"
            >
              {downloadingPdf ? "Menyiapkan PDF..." : "Unduh PDF Laporan Kehadiran 5"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
