import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, FileText, Loader2, LogOut, UserRoundSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCurrentUser, logout } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import {
  generateMonthlyUserAttendancePDF,
  type MonthlyUserReportPhoto,
  type MonthlyUserReportPhotoDay,
  type MonthlyUserReportStats,
} from "@/lib/pdf-laporan-per-pengguna";

type ReportUser = {
  id: string;
  username: string;
  full_name: string;
  role: string;
  unit_kerja: string | null;
  primary_location: string | null;
  secondary_location: string[] | null;
  is_struktural: boolean | null;
};

type AttendanceRow = {
  user_id: string | null;
  attendance_type: string;
  created_at: string | null;
  photo_url: string | null;
};

type LeavePermitRow = {
  user_id: string;
  permit_type: "izin" | "cuti" | "dinas_luar";
  start_date: string;
  end_date: string;
  description: string | null;
};

type HolidayRow = {
  holiday_date: string;
  description: string;
  is_active: boolean | null;
};

type ReportPreview = {
  stats: MonthlyUserReportStats;
  photoDays: MonthlyUserReportPhotoDay[];
};

const MONTHS = [
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

const pad2 = (value: number) => String(value).padStart(2, "0");

const ymd = (year: number, month: number, day: number) => `${year}-${pad2(month)}-${pad2(day)}`;

const parseYmdLocal = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const dayKeyWib = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));

const getMonthRange = (year: number, month: number) => {
  const lastDay = new Date(year, month, 0).getDate();
  const startDate = ymd(year, month, 1);
  const endDate = ymd(year, month, lastDay);
  const startUtc = new Date(Date.UTC(year, month - 1, 1, -7, 0, 0, 0)).toISOString();
  const endUtc = new Date(Date.UTC(year, month, 1, -7, 0, 0, -1)).toISOString();

  return { startDate, endDate, startUtc, endUtc, lastDay };
};

const eachDateKey = (startDate: string, endDate: string) => {
  const dates: string[] = [];
  const cursor = parseYmdLocal(startDate);
  const end = parseYmdLocal(endDate);

  while (cursor <= end) {
    dates.push(ymd(cursor.getFullYear(), cursor.getMonth() + 1, cursor.getDate()));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
};

const isSunday = (dateKey: string) => parseYmdLocal(dateKey).getDay() === 0;

const overlapsDate = (dateKey: string, startDate: string, endDate: string) => dateKey >= startDate && dateKey <= endDate;

const permitTypeLabel: Record<LeavePermitRow["permit_type"], string> = {
  izin: "Izin",
  cuti: "Cuti",
  dinas_luar: "Dinas Luar",
};

const buildLeaveLabel = (permits: LeavePermitRow[]) => {
  if (permits.length === 0) return null;

  const labels = permits.map((permit) => {
    const label = permitTypeLabel[permit.permit_type] ?? permit.permit_type;
    const description = (permit.description ?? "").trim();
    return description ? `${label}: ${description}` : label;
  });

  return labels.join("\n");
};

const formatTimeWib = (iso: string) =>
  new Date(iso).toLocaleTimeString("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
  }) + " WIB";

const formatDateKeyDisplay = (dateKey: string) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
};

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });

const fetchAttendancePhoto = async (photoUrl: string | null) => {
  if (!photoUrl) return null;
  if (photoUrl.startsWith("data:image/")) return photoUrl;
  if (photoUrl.includes("t.me/")) return null;

  try {
    if (photoUrl.startsWith("telegram:file:")) {
      const fileId = photoUrl.replace("telegram:file:", "");
      const response = await fetch(`/api/telegram-photo?file_id=${encodeURIComponent(fileId)}`);
      if (!response.ok) return null;
      const result = (await response.json()) as { ok?: boolean; dataUrl?: string };
      return result.ok && result.dataUrl ? result.dataUrl : null;
    }

    if (/^https?:\/\//i.test(photoUrl)) {
      const response = await fetch(photoUrl);
      if (!response.ok) return null;
      return await blobToDataUrl(await response.blob());
    }

    return null;
  } catch {
    return null;
  }
};

const buildAttendancePhotoDays = async (
  attendances: AttendanceRow[],
  leavePermits: LeavePermitRow[],
  year: number,
  month: number,
): Promise<MonthlyUserReportPhotoDay[]> => {
  const sorted = [...attendances]
    .filter((attendance) => attendance.created_at && (attendance.attendance_type === "masuk" || attendance.attendance_type === "pulang"))
    .sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? ""));

  const photoMap = new Map<string, { masuk: MonthlyUserReportPhoto | null; pulang: MonthlyUserReportPhoto | null }>();
  for (const attendance of sorted) {
    const createdAt = attendance.created_at as string;
    const dateKey = dayKeyWib(createdAt);
    const entry = photoMap.get(dateKey) ?? { masuk: null, pulang: null };
    const photo = {
      timeLabel: formatTimeWib(createdAt),
      dataUrl: await fetchAttendancePhoto(attendance.photo_url),
    };

    if (attendance.attendance_type === "masuk" && !entry.masuk) {
      entry.masuk = photo;
    }
    if (attendance.attendance_type === "pulang" && !entry.pulang) {
      entry.pulang = photo;
    }
    photoMap.set(dateKey, entry);
  }

  const { startDate, endDate } = getMonthRange(year, month);
  return eachDateKey(startDate, endDate).map((dateKey) => {
    const entry = photoMap.get(dateKey);
    const permitsOnDay = leavePermits.filter((permit) => overlapsDate(dateKey, permit.start_date, permit.end_date));

    return {
      dateKey,
      masuk: entry?.masuk ?? null,
      pulang: entry?.pulang ?? null,
      leaveLabel: buildLeaveLabel(permitsOnDay),
    };
  });
};

const calculateStats = (
  attendances: AttendanceRow[],
  leavePermits: LeavePermitRow[],
  holidays: HolidayRow[],
  year: number,
  month: number,
): MonthlyUserReportStats => {
  const { startDate, endDate } = getMonthRange(year, month);
  const holidaySet = new Set(holidays.filter((holiday) => holiday.is_active !== false).map((holiday) => holiday.holiday_date));
  const masukDays = new Set(
    attendances
      .filter((attendance) => attendance.created_at && attendance.attendance_type === "masuk")
      .map((attendance) => dayKeyWib(attendance.created_at as string)),
  );
  const pulangDays = new Set(
    attendances
      .filter((attendance) => attendance.created_at && attendance.attendance_type === "pulang")
      .map((attendance) => dayKeyWib(attendance.created_at as string)),
  );
  const attendedDays = new Set([...masukDays, ...pulangDays]);
  const workingDays = eachDateKey(startDate, endDate).filter((dateKey) => !isSunday(dateKey) && !holidaySet.has(dateKey));

  let sakit = 0;
  let cuti = 0;
  let izin = 0;
  let dinasLuar = 0;
  let alpa = 0;

  for (const dateKey of workingDays) {
    const permitsOnDay = leavePermits.filter((permit) => overlapsDate(dateKey, permit.start_date, permit.end_date));
    const hasLeave = permitsOnDay.length > 0;
    const hasAttendance = attendedDays.has(dateKey);

    const hasSick = permitsOnDay.some(
      (permit) => permit.permit_type === "izin" && (permit.description ?? "").toLowerCase().includes("sakit"),
    );
    const hasCuti = permitsOnDay.some((permit) => permit.permit_type === "cuti");
    const hasIzin = permitsOnDay.some((permit) => permit.permit_type === "izin" && !((permit.description ?? "").toLowerCase().includes("sakit")));
    const hasDinas = permitsOnDay.some((permit) => permit.permit_type === "dinas_luar");

    if (hasSick) sakit += 1;
    if (hasCuti) cuti += 1;
    if (hasIzin) izin += 1;
    if (hasDinas) dinasLuar += 1;
    if (!hasAttendance && !hasLeave) alpa += 1;
  }

  return {
    absenMasuk: masukDays.size,
    absenPulang: pulangDays.size,
    sakit,
    cuti,
    izin,
    dinasLuar,
    alpa,
    total: sakit + cuti + alpa,
    hariKerja: workingDays.length,
    hadirHari: workingDays.filter((dateKey) => attendedDays.has(dateKey)).length,
  };
};

export default function LaporanPerPengguna() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const now = new Date();
  const [users, setUsers] = useState<ReportUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [reportPreview, setReportPreview] = useState<ReportPreview | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        const { data, error } = await supabase
          .from("users")
          .select("id, username, full_name, role, unit_kerja, primary_location, secondary_location, is_struktural")
          .neq("role", "mahasiswa")
          .order("full_name", { ascending: true });

        if (error) throw error;
        const filtered = (data ?? []).filter((u: any) => {
          const uname = String(u.username || '').toLowerCase();
          const fname = String(u.full_name || '').toLowerCase();
          return u.role !== "mahasiswa" && uname !== "tesx" && !uname.includes("tesx") && !fname.includes("tesx") && uname !== "andi.syahrum.makkurade";
        });
        setUsers(filtered as ReportUser[]);
      } catch (error) {
        console.error("Gagal memuat pengguna:", error);
        setError("Gagal memuat daftar pengguna.");
      } finally {
        setLoadingUsers(false);
      }
    };

    void loadUsers();
  }, []);

  const selectedUser = users.find((user) => user.id === selectedUserId) ?? null;

  const years = useMemo(() => {
    const currentYear = now.getFullYear();
    return Array.from({ length: 5 }, (_, index) => currentYear - 3 + index);
  }, [now]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  useEffect(() => {
    if (!selectedUser) {
      setReportPreview(null);
      setPreviewError(null);
      return;
    }

    let isActive = true;
    const loadPreview = async () => {
      try {
        setPreviewLoading(true);
        setPreviewError(null);
        setReportPreview(null);
        const month = Number(selectedMonth);
        const year = Number(selectedYear);
        const { startDate, endDate, startUtc, endUtc } = getMonthRange(year, month);

        const [{ data: attendanceData, error: attendanceError }, { data: permitData, error: permitError }, { data: holidayData, error: holidayError }] =
          await Promise.all([
            supabase
              .from("attendances")
              .select("user_id, attendance_type, created_at, photo_url, note")
              .eq("user_id", selectedUser.id)
              .gte("created_at", startUtc)
              .lte("created_at", endUtc),
            supabase
              .from("leave_permits")
              .select("user_id, permit_type, start_date, end_date, description")
              .eq("user_id", selectedUser.id)
              .lte("start_date", endDate)
              .gte("end_date", startDate),
            supabase
              .from("holidays")
              .select("holiday_date, description, is_active")
              .eq("is_active", true)
              .gte("holiday_date", startDate)
              .lte("holiday_date", endDate),
          ]);

        if (attendanceError) throw attendanceError;
        if (permitError) throw permitError;
        if (holidayError) throw holidayError;

        const filteredAttendance = (attendanceData ?? []).filter((a: any) => !(a.note && (a.note.includes("Sesi:") || a.note.includes("KKN"))));
        const typedAttendances = filteredAttendance as AttendanceRow[];
        const typedPermits = (permitData ?? []) as LeavePermitRow[];
        const typedHolidays = (holidayData ?? []) as HolidayRow[];
        const stats = calculateStats(typedAttendances, typedPermits, typedHolidays, year, month);
        const photoDays = await buildAttendancePhotoDays(typedAttendances, typedPermits, year, month);

        if (isActive) {
          setReportPreview({ stats, photoDays });
        }
      } catch (error) {
        console.error("Gagal memuat preview laporan per pengguna:", error);
        if (isActive) {
          setPreviewError("Gagal memuat preview laporan.");
        }
      } finally {
        if (isActive) {
          setPreviewLoading(false);
        }
      }
    };

    void loadPreview();

    return () => {
      isActive = false;
    };
  }, [selectedUser, selectedMonth, selectedYear]);

  const handleDownload = async () => {
    if (!selectedUser || !reportPreview) return;

    try {
      setGenerating(true);
      setError(null);
      const month = Number(selectedMonth);
      const year = Number(selectedYear);

      await generateMonthlyUserAttendancePDF({
        user: selectedUser,
        month,
        year,
        printedAt: new Date(),
        stats: reportPreview.stats,
        photoDays: reportPreview.photoDays,
      });
    } catch (error) {
      console.error("Gagal membuat PDF laporan per pengguna:", error);
      setError("Gagal membuat PDF. Silakan cek koneksi dan coba lagi.");
    } finally {
      setGenerating(false);
    }
  };

  const renderPreviewEvidence = (photo: MonthlyUserReportPhoto | null, fallback: string | null, type: "masuk" | "pulang") => {
    if (photo?.dataUrl) {
      return (
        <div className="flex items-center gap-2">
          <img src={photo.dataUrl} alt={`Foto absen ${type}`} className="h-12 w-12 rounded-lg object-cover border border-slate-200" />
          <span className="text-xs font-semibold text-slate-700">{photo.timeLabel}</span>
        </div>
      );
    }

    if (photo) {
      return (
        <div className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2 py-2">
          Foto tidak tersedia
          <div className="font-normal text-amber-600">{photo.timeLabel}</div>
        </div>
      );
    }

    return (
      <div className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-2 py-2 whitespace-pre-line">
        {fallback || (type === "masuk" ? "Alpha\nTidak Absen Masuk" : "Alpha\nTidak Absen Pulang")}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 w-full overflow-x-hidden font-sans">
      <div className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin")}
              className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors active:scale-95 border border-slate-200"
              title="Kembali ke Admin"
            >
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </button>
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-800">Laporan Kehadiran Per Pengguna</h1>
              <p className="text-xs sm:text-sm text-slate-500">Rekap bulanan resmi untuk satu pegawai/dosen</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:block text-sm font-semibold text-slate-700 max-w-[180px] truncate">
              {currentUser?.full_name || "Admin"}
            </div>
            <button
              onClick={handleLogout}
              className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all active:scale-95 border border-red-100"
              title="Keluar"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          <Card className="p-5 sm:p-6 border-slate-200 shadow-sm">
            <div className="flex items-start gap-3 mb-6">
              <div className="h-11 w-11 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-700 border border-blue-100">
                <UserRoundSearch className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Filter Laporan</h2>
                <p className="text-sm text-slate-500 mt-1">Pilih nama, bulan, dan tahun sebelum mengunduh PDF.</p>
              </div>
            </div>

            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="user-select">Nama pegawai/dosen</Label>
                <select
                  id="user-select"
                  value={selectedUserId}
                  onChange={(event) => setSelectedUserId(event.target.value)}
                  disabled={loadingUsers}
                  className="h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">{loadingUsers ? "Memuat pengguna..." : "Pilih pengguna"}</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name} - {user.unit_kerja || user.role}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500">{users.length} pengguna tersedia.</p>
              </div>

              <div className="space-y-2">
                <Label>Bulan</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih bulan" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tahun</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tahun" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-100 pt-5">
              <p className="text-sm text-slate-500">
                PDF akan dibuat dengan halaman rekap utama dan lampiran foto attendance per tanggal selama periode terpilih.
              </p>
              <Button
                onClick={() => void handleDownload()}
                disabled={!selectedUser || !reportPreview || previewLoading || generating || loadingUsers}
                className="h-11 px-5 bg-blue-700 hover:bg-blue-800"
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {generating ? "Menyiapkan PDF..." : "Unduh PDF"}
              </Button>
            </div>
          </Card>

          <Card className="p-5 sm:p-6 border-slate-200 shadow-sm bg-gradient-to-b from-white to-blue-50/40">
            <h2 className="text-base font-bold text-slate-800 mb-4">Preview Data</h2>
            {selectedUser ? (
              <div className="space-y-4">
                <div className="h-16 w-16 rounded-3xl bg-blue-100 text-blue-800 flex items-center justify-center text-2xl font-bold">
                  {selectedUser.full_name.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-900">{selectedUser.full_name}</div>
                  <div className="text-sm text-slate-500">{selectedUser.username}</div>
                </div>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="rounded-xl bg-white border border-slate-100 p-3">
                    <div className="text-xs font-semibold text-slate-500">Role</div>
                    <div className="font-semibold text-slate-800 capitalize">{selectedUser.role}</div>
                  </div>
                  <div className="rounded-xl bg-white border border-slate-100 p-3">
                    <div className="text-xs font-semibold text-slate-500">Unit Kerja</div>
                    <div className="font-semibold text-slate-800">{selectedUser.unit_kerja || "-"}</div>
                  </div>
                  <div className="rounded-xl bg-white border border-slate-100 p-3">
                    <div className="text-xs font-semibold text-slate-500">Lokasi Utama</div>
                    <div className="font-semibold text-slate-800">{selectedUser.primary_location || selectedUser.unit_kerja || "-"}</div>
                  </div>
                </div>
                {previewLoading && (
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-semibold text-blue-700">
                    Memuat preview laporan...
                  </div>
                )}
                {previewError && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                    {previewError}
                  </div>
                )}
                {reportPreview && !previewLoading && (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="text-xs font-bold text-slate-500 mb-3">DATA ABSENSI</div>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {[
                          ["Absen Masuk", reportPreview.stats.absenMasuk],
                          ["Absen Pulang", reportPreview.stats.absenPulang],
                          ["Sakit", reportPreview.stats.sakit],
                          ["Izin", reportPreview.stats.izin],
                          ["Alpha", reportPreview.stats.alpa],
                        ].map(([label, value]) => (
                          <div key={label} className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center">
                            <div className="text-[11px] font-semibold text-slate-500">{label}</div>
                            <div className="text-xl font-bold text-slate-900">{value}</div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 text-xs text-slate-500">
                        Hari kerja: <span className="font-semibold text-slate-700">{reportPreview.stats.hariKerja}</span> | Hari hadir:{" "}
                        <span className="font-semibold text-slate-700">{reportPreview.stats.hadirHari}</span> | Dinas luar:{" "}
                        <span className="font-semibold text-slate-700">{reportPreview.stats.dinasLuar}</span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="text-xs font-bold text-slate-500 mb-3">LAMPIRAN FOTO KEHADIRAN</div>
                      <div className="max-h-[520px] overflow-y-auto rounded-xl border border-slate-100">
                        <table className="w-full text-sm">
                          <thead className="sticky top-0 bg-slate-100 text-slate-700">
                            <tr>
                              <th className="p-2 text-left font-bold">Tanggal</th>
                              <th className="p-2 text-left font-bold">Absen Masuk</th>
                              <th className="p-2 text-left font-bold">Absen Pulang</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reportPreview.photoDays.map((day) => (
                              <tr key={day.dateKey} className="border-t border-slate-100 align-top">
                                <td className="p-2 text-xs font-semibold text-slate-700 w-24">{formatDateKeyDisplay(day.dateKey)}</td>
                                <td className="p-2">{renderPreviewEvidence(day.masuk, day.leaveLabel, "masuk")}</td>
                                <td className="p-2">{renderPreviewEvidence(day.pulang, day.leaveLabel, "pulang")}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                Pilih pengguna dulu untuk melihat ringkasan identitas.
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
