import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Clock,
    MapPin,
    ArrowLeft,
    FileText,
    Filter,
    LogIn,
    LogOut as LogOutIcon,
    User,
    Navigation,
    Calendar,
    Info,
    X,
    Trash2,
    Loader2
} from "lucide-react";
import { getCurrentUser, isSuperAdmin } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";

interface AttendanceRecord {
    id: string;
    attendance_type: string;
    created_at: string;
    location?: string | null;
    notes?: string | null;

    // Kolom yang memang disimpan oleh halaman Attendance
    photo_url?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    note?: string | null;
    has_surat_tugas?: boolean | null;
    bukti_dinas_luar_url?: string | null;

    // Tambahan KKN
    is_kkn?: boolean;
    is_alpha?: boolean;
    is_pending?: boolean;
    kkn_status?: "hadir" | "belum_mulai" | "sedang_berlangsung" | "alpa";
    session_name?: string;
    session_date?: string;
    session_time?: string;
}

const KKN_SESSIONS = [
    { key: "Sabtu Sesi 1", label: "Sabtu Sesi 1", date: "Sabtu, 18 Juli 2026", time: "07:25 - 08:00 WIB", type: "masuk", dateYMD: "2026-07-18", startHms: "07:25:00", endHms: "08:00:00" },
    { key: "Sabtu Sesi 2", label: "Sabtu Sesi 2", date: "Sabtu, 18 Juli 2026", time: "09:30 - 10:00 WIB", type: "masuk", dateYMD: "2026-07-18", startHms: "09:30:00", endHms: "10:00:00" },
    { key: "Sabtu Sesi 3", label: "Sabtu Sesi 3", date: "Sabtu, 18 Juli 2026", time: "13:00 - 13:30 WIB", type: "pulang", dateYMD: "2026-07-18", startHms: "13:00:00", endHms: "13:30:00" },
    { key: "Minggu Sesi 1", label: "Minggu Sesi 1", date: "Minggu, 19 Juli 2026", time: "07:00 - 08:00 WIB", type: "masuk", dateYMD: "2026-07-19", startHms: "07:00:00", endHms: "08:00:00" },
    { key: "Minggu Sesi 2", label: "Minggu Sesi 2", date: "Minggu, 19 Juli 2026", time: "09:30 - 10:00 WIB", type: "masuk", dateYMD: "2026-07-19", startHms: "09:30:00", endHms: "10:00:00" },
    { key: "Minggu Sesi 3", label: "Minggu Sesi 3", date: "Minggu, 19 Juli 2026", time: "11:00 - 11:30 WIB", type: "masuk", dateYMD: "2026-07-19", startHms: "11:00:00", endHms: "11:30:00" },
    { key: "Minggu Sesi 4", label: "Minggu Sesi 4", date: "Minggu, 19 Juli 2026", time: "13:30 - 14:00 WIB", type: "masuk", dateYMD: "2026-07-19", startHms: "13:30:00", endHms: "14:00:00" },
    { key: "Minggu Sesi 5", label: "Minggu Sesi 5", date: "Minggu, 19 Juli 2026", time: "15:30 - 16:00 WIB", type: "pulang", dateYMD: "2026-07-19", startHms: "15:30:00", endHms: "16:00:00" },
    { key: "Pelepasan KKN", label: "Pelepasan KKN", date: "Rabu, 29 Juli 2026", time: "08:00 - 10:00 WIB", type: "masuk", dateYMD: "2026-07-29", startHms: "08:00:00", endHms: "10:00:00" }
];

const checkSessionStatus = (session: typeof KKN_SESSIONS[0]) => {
    // Ambil waktu WIB saat ini
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23"
    }).formatToParts(now);

    const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const currentWibStr = `${lookup.year}-${lookup.month}-${lookup.day}T${lookup.hour}:${lookup.minute}:${lookup.second}`;
    const currentWibTime = new Date(currentWibStr).getTime();

    // Buat date string untuk batas waktu sesi (start dan end)
    const startWibTime = new Date(`${session.dateYMD}T${session.startHms}`).getTime();
    const endWibTime = new Date(`${session.dateYMD}T${session.endHms}`).getTime();

    if (currentWibTime < startWibTime) {
        return "belum_mulai";
    } else if (currentWibTime >= startWibTime && currentWibTime <= endWibTime) {
        return "sedang_berlangsung";
    } else {
        return "lewat"; // Sudah berakhir
    }
};

const History = () => {
    const navigate = useNavigate();
    const currentUser = getCurrentUser();
    const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<string>('all');
    const [selectedAttendance, setSelectedAttendance] = useState<AttendanceRecord | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    
    // State untuk delete functionality (superadmin only)
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    // State untuk filter bulan dan tahun
    const [selectedMonth, setSelectedMonth] = useState<string>(() => {
        // HIDE TEMPORARY: Di-hide pasca pembekalan KKN. Ubah ke true untuk merestore riwayat KKN
        const showKknJuli = false; 
        if (!currentUser) return new Date().getMonth().toString();
        const isNonStrukturalDplKknOnly = currentUser.is_dpl_kkn && !currentUser.is_struktural && !currentUser.is_panitia_kkn;
        if (showKknJuli && (currentUser.role === 'mahasiswa' || isNonStrukturalDplKknOnly)) {
            return 'kkn_juli';
        }
        return new Date().getMonth().toString();
    });
    const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

    // Generate opsi tahun (dari 2024 sampai tahun sekarang)
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - 2024 + 1 }, (_, i) => (2024 + i).toString());

    // Generate opsi bulan
    const months = [
        { value: '0', label: 'Januari' },
        { value: '1', label: 'Februari' },
        { value: '2', label: 'Maret' },
        { value: '3', label: 'April' },
        { value: '4', label: 'Mei' },
        { value: '5', label: 'Juni' },
        { value: '6', label: 'Juli' },
        { value: '7', label: 'Agustus' },
        { value: '8', label: 'September' },
        { value: '9', label: 'Oktober' },
        { value: '10', label: 'November' },
        { value: '11', label: 'Desember' },
    ];

    const getMonthOptions = () => {
        // HIDE TEMPORARY: Di-hide pasca pembekalan KKN. Ganti false ke true untuk merestore
        const showKknJuli = false;
        
        if (showKknJuli && currentUser?.role === 'mahasiswa') {
            return [{ value: 'kkn_juli', label: 'Juli (Pembekalan KKN)' }];
        }
        if (showKknJuli && (currentUser?.is_dpl_kkn || currentUser?.is_panitia_kkn)) {
            return [
                ...months,
                { value: 'kkn_juli', label: 'Juli (Pembekalan KKN)' }
            ];
        }
        return months;
    };

    useEffect(() => {
        setFilterType('all');
        loadAttendanceHistory();
    }, [selectedMonth, selectedYear]);

    const loadAttendanceHistory = async () => {
        if (!currentUser) return;

        setLoading(true);
        try {
            if (selectedMonth === 'kkn_juli') {
                const { data, error } = await supabase
                    .from('attendances')
                    .select('*')
                    .eq('user_id', currentUser.id)
                    .order('created_at', { ascending: true });

                if (error) throw error;

                const kknRecords: AttendanceRecord[] = KKN_SESSIONS.map(s => {
                    const matched = (data || []).find(a => {
                        const noteText = (a.note ?? a.notes ?? '').toLowerCase();
                        return noteText.includes(s.key.toLowerCase());
                    });

                    if (matched) {
                        return {
                            ...matched,
                            is_kkn: true,
                            is_alpha: false,
                            is_pending: false,
                            kkn_status: "hadir",
                            session_name: s.label,
                            session_date: s.date,
                            session_time: s.time
                        };
                    } else {
                        // Cek status waktu sesi
                        const sessionTimeStatus = checkSessionStatus(s);
                        if (sessionTimeStatus === "belum_mulai") {
                            return {
                                id: `dummy_${s.key}`,
                                attendance_type: s.type,
                                created_at: '',
                                is_kkn: true,
                                is_alpha: false,
                                is_pending: true,
                                kkn_status: "belum_mulai",
                                session_name: s.label,
                                session_date: s.date,
                                session_time: s.time
                            };
                        } else if (sessionTimeStatus === "sedang_berlangsung") {
                            return {
                                id: `dummy_${s.key}`,
                                attendance_type: s.type,
                                created_at: '',
                                is_kkn: true,
                                is_alpha: false,
                                is_pending: true,
                                kkn_status: "sedang_berlangsung",
                                session_name: s.label,
                                session_date: s.date,
                                session_time: s.time
                            };
                        } else {
                            // Sudah lewat, jadi Alpa
                            return {
                                id: `dummy_${s.key}`,
                                attendance_type: s.type,
                                created_at: '',
                                is_kkn: true,
                                is_alpha: true,
                                is_pending: false,
                                kkn_status: "alpa",
                                session_name: s.label,
                                session_date: s.date,
                                session_time: s.time
                            };
                        }
                    }
                });

                setAttendances(kknRecords.reverse());
            } else {
                // Hitung tanggal awal dan akhir bulan yang dipilih
                const startDate = new Date(parseInt(selectedYear), parseInt(selectedMonth), 1);
                const endDate = new Date(parseInt(selectedYear), parseInt(selectedMonth) + 1, 0, 23, 59, 59);

                const { data, error } = await supabase
                    .from('attendances')
                    .select('*')
                    .eq('user_id', currentUser.id)
                    .gte('created_at', startDate.toISOString())
                    .lte('created_at', endDate.toISOString())
                    .order('created_at', { ascending: false });

                if (error) throw error;

                setAttendances(data || []);
            }
        } catch (error) {
            console.error('Error loading history:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredAttendances = useMemo(() => {
        return attendances.filter(attendance => {
            if (selectedMonth === 'kkn_juli') {
                if (filterType === 'all') return true;
                if (filterType === 'hadir') return attendance.kkn_status === 'hadir';
                if (filterType === 'alpha') return attendance.kkn_status === 'alpa';
                return true;
            } else {
                if (filterType === 'all') return true;
                if (filterType === 'keluar') {
                    return attendance.attendance_type === 'keluar' || attendance.attendance_type === 'pulang';
                }
                return attendance.attendance_type === filterType;
            }
        });
    }, [attendances, filterType, selectedMonth]);

    const onOpenDetail = (attendance: AttendanceRecord) => {
        setSelectedAttendance(attendance);
        setDetailOpen(true);
    };

    const safeCopyToClipboard = async (value: string) => {
        try {
            await navigator.clipboard.writeText(value);
        } catch (error) {
            console.error('Clipboard write failed:', error);
        }
    };

    const getAttendanceTypeLabel = (type: string) => {
        if (type === 'masuk') return 'Absen Masuk';
        if (type === 'keluar' || type === 'pulang') return 'Absen Pulang';
        return type;
    };

    const getAttendanceTypeColor = (type: string) => {
        return type === 'masuk' ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400';
    };

    const getAttendanceTypeIcon = (type: string) => {
        return type === 'masuk' ? LogIn : LogOutIcon;
    };

    const getAttendanceTypeBg = (type: string) => {
        return type === 'masuk'
            ? 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20'
            : 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20';
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return {
            date: date.toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }),
            time: date.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit'
            })
        };
    };

    const formatCoords = (value?: number | null) => {
        if (value === null || value === undefined || Number.isNaN(value)) return '-';
        return value.toFixed(6);
    };

    const getNotesValue = (attendance: AttendanceRecord) => {
        const rawNote = attendance.notes ?? attendance.note ?? null;
        if (!rawNote) return null;

        // Filter: hanya tampilkan info lokasi (dalam radius), buang info telegram & foto
        // Contoh format: "Absensi dalam radius 200 m | Telegram: https://... | Jarak: 45.2 m dari Area Rektorat UNES"
        
        // 1. Buang bagian "| Telegram: ..."
        let filtered = rawNote.replace(/\s*\|\s*Telegram[^|]*/gi, '');
        
        // 2. Buang bagian "| telegram file: ..."
        filtered = filtered.replace(/\s*\|\s*telegram\s+file[^|]*/gi, '');
        
        // 3. Trim whitespace & pipe di awal/akhir
        filtered = filtered.replace(/^\s*\|\s*/, '').replace(/\s*\|\s*$/, '').trim();
        
        // 4. Ganti "Absensi dalam radius 200 m" → "Absensi di Rektorat Universitas Ekasakti"
        filtered = filtered.replace(/Absensi\s+dalam\s+radius\s+\d+\s*m/gi, 'Absensi di Rektorat Universitas Ekasakti');
        
        return filtered || null;
    };

    // Handle delete attendance (superadmin only)
    const handleDeleteAttendance = async (id: string) => {
        setIsDeleting(true);
        try {
            const { error } = await supabase
                .from('attendances')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            
            // Remove from local state
            setAttendances(prev => prev.filter(a => a.id !== id));
            setDeleteConfirmId(null);
            setDetailOpen(false);
            setSelectedAttendance(null);
        } catch (error) {
            console.error('Error deleting attendance:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const getFilterOptions = () => {
        if (selectedMonth === 'kkn_juli') {
            return [
                { value: 'all', label: 'Semua' },
                { value: 'hadir', label: 'Hadir' },
                { value: 'alpha', label: 'Alpa' }
            ];
        }
        return [
            { value: 'all', label: 'Semua' },
            { value: 'masuk', label: 'Masuk' },
            { value: 'keluar', label: 'Pulang' }
        ];
    };

    return (
        <>
        <div className="flex h-screen flex-col w-full bg-slate-50 dark:bg-slate-950 overflow-x-hidden animate-page-in">
            {/* Header Redesign Gojek-style */}
            <header className="relative overflow-hidden bg-[#8c1b1d] rounded-b-[30px] shadow-sm px-5 py-6 w-full shrink-0">
                {/* Decorative Elements */}
                <div className="absolute top-[-50px] right-[-30px] w-48 h-48 rounded-full bg-white/10 blur-[30px] z-0 pointer-events-none" />
                <div className="absolute bottom-[-10px] left-[-20px] w-32 h-32 rounded-full bg-white/10 blur-[20px] z-0 pointer-events-none" />

                <div className="relative z-10 flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all shadow-sm"
                        >
                            <ArrowLeft className="w-5 h-5 text-white" />
                        </button>
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold tracking-tight text-white mb-0 drop-shadow-sm">Riwayat Absensi</h1>
                            <p className="text-[11px] text-white/90 font-medium tracking-wide">Rekap kehadiran Anda</p>
                        </div>
                    </div>
                    {/* Logo Right */}
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md p-1.5 ml-auto relative group">
                        <img src="/unes.png" alt="UNES" className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110" />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow overflow-y-auto scrollbar-thin px-4 sm:px-6 lg:px-10 py-6 w-full pb-28">
                {/* Detail Dialog - Ticket Style */}
                <Dialog open={detailOpen} onOpenChange={setDetailOpen}>                    <DialogContent className="max-w-[94vw] sm:max-w-md w-full p-0 overflow-hidden bg-[#F6F7F9] dark:bg-slate-900 flex flex-col rounded-[24px] border border-slate-200 shadow-2xl mx-auto my-auto fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]">
                        {selectedAttendance && (() => {
                            const dateTime = formatDateTime(selectedAttendance.created_at);
                            const TypeIcon = getAttendanceTypeIcon(selectedAttendance.attendance_type);
                            const isCheckIn = selectedAttendance.attendance_type === 'masuk';

                            return (
                                <div className="relative flex flex-col max-h-[92vh] overflow-hidden">
                                    {/* Header Title Bar */}
                                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0 bg-white">
                                        <h3 className="text-base font-bold text-slate-900">Rincian Kehadiran</h3>
                                    </div>

                                    {/* Summary Receipt Block */}
                                    <div className={`p-5 text-center flex-shrink-0 flex flex-col items-center border-b border-black/10 ${
                                        isCheckIn 
                                            ? 'bg-[#8c1b1d] text-white' 
                                            : 'bg-[#6b1516] text-white'
                                    }`}>
                                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-2.5 shadow-md">
                                            <TypeIcon className={`w-6 h-6 ${isCheckIn ? 'text-emerald-600' : 'text-[#8c1b1d]'}`} />
                                        </div>
                                        <h2 className="text-lg font-black text-white leading-snug drop-shadow-sm">
                                            {selectedAttendance.is_kkn ? selectedAttendance.session_name : (isCheckIn ? "Absen Masuk" : "Absen Pulang")}
                                        </h2>
                                        <div className="mt-1 flex items-center gap-2">
                                            <span className="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider bg-[#fbbf24] text-[#8c1b1d] border border-[#fbbf24] shadow-sm">
                                                Berhasil Tercatat
                                            </span>
                                        </div>
                                    </div>

                                    {/* Receipt Info Body */}
                                    <div className="p-5 flex-1 overflow-y-auto space-y-4">
                                        {/* Time block */}
                                        <div className="flex items-center justify-between pb-1">
                                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Waktu Absensi</span>
                                            <span className="text-base font-black text-slate-900 italic">
                                                {dateTime.time} <span className="text-xs font-bold not-italic text-slate-400">WIB</span>
                                            </span>
                                        </div>

                                        {/* Structured Details Card (Grab Style w/ Bold Maroon Border Stroke) */}
                                        <div className="bg-white border-2 border-[#8c1b1d] divide-y divide-[#8c1b1d]/10 rounded-2xl overflow-hidden shadow-sm">
                                            {/* Hari & Tanggal */}
                                            <div className="flex items-center justify-between p-3.5">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                                    <span className="text-xs font-semibold text-slate-650">Hari & Tanggal</span>
                                                </div>
                                                <span className="text-xs font-bold text-slate-800 truncate pl-2">{dateTime.date}</span>
                                            </div>

                                            {/* Personal Info */}
                                            <div className="p-3.5 space-y-1">
                                                <div className="flex items-center gap-2.5">
                                                    <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                                    <span className="text-xs font-semibold text-slate-600">Personal Info</span>
                                                </div>
                                                <div className="pl-6">
                                                    <p className="text-xs font-bold text-slate-900 truncate">
                                                        {currentUser?.full_name || '-'}
                                                    </p>
                                                    <span className="inline-block bg-slate-150 text-slate-700 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider mt-0.5">
                                                        {currentUser?.role === 'superadmin' ? 'Super Administrator' : currentUser?.role === 'admin' ? 'Administrator' : currentUser?.role === 'dosen' ? 'Dosen' : currentUser?.role === 'mahasiswa' ? 'Mahasiswa KKN' : 'Tendik'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Lokasi */}
                                            {selectedAttendance.location && (
                                                <div className="p-3.5 space-y-1">
                                                    <div className="flex items-center gap-2.5">
                                                        <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                                        <span className="text-xs font-semibold text-slate-600">Lokasi</span>
                                                    </div>
                                                    <p className="text-xs font-bold text-slate-900 pl-6 leading-relaxed line-clamp-2">
                                                        {selectedAttendance.location}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Catatan Jarak (Gold card with Bold Gold border & Maroon text) */}
                                        {getNotesValue(selectedAttendance) && (
                                            <div className="p-3.5 bg-amber-50/70 border-2 border-[#fbbf24] rounded-2xl shadow-sm space-y-1">
                                                <div className="flex items-center gap-2.5">
                                                    <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                                    <span className="text-xs font-bold text-amber-800">Catatan Jarak</span>
                                                </div>
                                                <p className="text-xs font-bold text-[#8c1b1d] pl-6 leading-relaxed italic">
                                                    "{getNotesValue(selectedAttendance)}"
                                                </p>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="space-y-2 pt-2">
                                            {(selectedAttendance.latitude && selectedAttendance.longitude) && (
                                                <a
                                                    href={`https://www.google.com/maps?q=${selectedAttendance.latitude},${selectedAttendance.longitude}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all"
                                                >
                                                    <Navigation className="w-3.5 h-3.5" />
                                                    Buka Google Maps
                                                </a>
                                            )}

                                            {/* Delete Button - Superadmin Only */}
                                            {isSuperAdmin() && (
                                                <button
                                                    onClick={() => setDeleteConfirmId(selectedAttendance.id)}
                                                    className="w-full h-11 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs flex items-center justify-center gap-2 border border-red-100 active:scale-[0.98] transition-all"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                    Hapus
                                                </button>
                                            )}
                                        </div>

                                        {/* ID Footer */}
                                        <div className="pt-2 text-center">
                                            <p className="text-[8px] font-bold text-slate-350 dark:text-slate-600 uppercase tracking-[0.15em]">
                                                ID: {selectedAttendance.id.split('-')[0].toUpperCase()} • UNES SYSTEM
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
                    <DialogContent className="max-w-[90vw] sm:max-w-sm w-full p-0 overflow-hidden bg-white dark:bg-slate-900 rounded-2xl">
                        <div className="p-6">
                            <div className="flex justify-center mb-4">
                                <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                    <Trash2 className="w-7 h-7 text-red-600 dark:text-red-400" />
                                </div>
                            </div>
                            <DialogHeader className="text-center">
                                <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                    Hapus Absensi?
                                </DialogTitle>
                                <DialogDescription className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                                    Data absensi yang dihapus tidak dapat dikembalikan. Apakah Anda yakin ingin menghapus data ini?
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex gap-3 mt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setDeleteConfirmId(null)}
                                    disabled={isDeleting}
                                    className="flex-1"
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={() => deleteConfirmId && handleDeleteAttendance(deleteConfirmId)}
                                    disabled={isDeleting}
                                    className="flex-1"
                                >
                                    {isDeleting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Menghapus...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Hapus
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Filter Section */}
                <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '50ms' }}>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border-2 border-[#8c1b1d]/20">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-300 flex items-center gap-2">
                                Mau lihat absen kapan?
                            </h3>
                        </div>

                        {/* Filter Bulan dan Tahun */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="relative">
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="w-full appearance-none bg-white dark:bg-slate-800 border-2 border-[#8c1b1d]/20 text-slate-800 dark:text-slate-300 text-xs sm:text-sm rounded-xl px-3 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-[#8c1b1d]/20 focus:border-[#8c1b1d] transition-all font-bold"
                                >
                                    {getMonthOptions().map((month) => (
                                        <option key={month.value} value={month.value}>
                                            {month.label}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <Calendar className="w-3.5 h-3.5 text-[#8c1b1d]" />
                                </div>
                            </div>
                            <div className="relative">
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    className="w-full appearance-none bg-white dark:bg-slate-800 border-2 border-[#8c1b1d]/20 text-slate-800 dark:text-slate-300 text-xs sm:text-sm rounded-xl px-3 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-[#8c1b1d]/20 focus:border-[#8c1b1d] transition-all font-bold"
                                >
                                    {years.map((year) => (
                                        <option key={year} value={year}>
                                            {year}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            {getFilterOptions().map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setFilterType(option.value)}
                                    className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 ${filterType === option.value
                                            ? 'bg-[#8c1b1d] text-white shadow-md shadow-[#8c1b1d]/30'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Attendance List */}
                <div className="space-y-3">
                    {loading ? (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center border-2 border-[#8c1b1d]/20">
                            <div className="relative w-12 h-12 mx-auto mb-4">
                                <div className="absolute inset-0 rounded-full border-4 border-[#8c1b1d]/10" />
                                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#8c1b1d] animate-spin" />
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-bold">Memuat riwayat...</p>
                        </div>
                    ) : filteredAttendances.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center border-2 border-[#8c1b1d]/20 animate-fade-in-up">
                            <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 border border-[#fbbf24]">
                                <FileText className="w-8 h-8 text-[#8c1b1d]" />
                            </div>
                            <p className="text-slate-800 dark:text-slate-350 font-black">
                                {selectedMonth === 'kkn_juli'
                                    ? filterType === 'all'
                                        ? 'Belum ada riwayat pembekalan KKN'
                                        : filterType === 'hadir'
                                            ? 'Tidak ada riwayat pembekalan KKN yang Hadir'
                                            : 'Tidak ada riwayat pembekalan KKN yang Alpa'
                                    : filterType === 'all'
                                        ? 'Belum ada riwayat absensi'
                                        : `Tidak ada riwayat ${getAttendanceTypeLabel(filterType)}`}
                            </p>
                            <p className="text-slate-500 dark:text-slate-450 text-xs mt-1 font-bold">
                                {selectedMonth === 'kkn_juli'
                                    ? 'Daftar kehadiran sesi pembekalan KKN Anda'
                                    : 'Riwayat akan muncul setelah Anda melakukan absensi'}
                            </p>
                        </div>
                    ) : (
                        <div className="stagger-children space-y-3">
                            {filteredAttendances.map((attendance) => {
                                const isKkn = attendance.is_kkn;
                                const kknStatus = attendance.kkn_status;
                                const isClickable = !isKkn || kknStatus === "hadir";
                                
                                const dateTime = (isKkn && kknStatus !== "hadir")
                                    ? { date: attendance.session_date || '', time: attendance.session_time || '' }
                                    : formatDateTime(attendance.created_at);
                                
                                let TypeIcon = getAttendanceTypeIcon(attendance.attendance_type);
                                let iconColor = getAttendanceTypeColor(attendance.attendance_type);
                                let iconBg = getAttendanceTypeBg(attendance.attendance_type);
                                let borderClass = attendance.attendance_type === 'masuk' 
                                    ? 'border-[#fbbf24] hover:shadow-[#fbbf24]/10' 
                                    : 'border-[#8c1b1d] hover:shadow-[#8c1b1d]/10';
                                let tagText = attendance.attendance_type === 'masuk' ? 'Masuk' : 'Pulang';
                                let tagClass = attendance.attendance_type === 'masuk'
                                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
                                let titleColor = iconColor;

                                if (isKkn) {
                                    if (kknStatus === "hadir") {
                                        tagText = "Hadir";
                                        tagClass = "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold";
                                    } else if (kknStatus === "belum_mulai") {
                                        TypeIcon = Calendar;
                                        iconColor = "text-slate-400 dark:text-slate-500";
                                        iconBg = "bg-slate-100 dark:bg-slate-800/60";
                                        borderClass = "border-slate-200 dark:border-slate-800 bg-slate-50/20 hover:shadow-none";
                                        tagText = "Belum Mulai";
                                        tagClass = "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400";
                                        titleColor = "text-slate-550 dark:text-slate-400 font-bold";
                                    } else if (kknStatus === "sedang_berlangsung") {
                                        TypeIcon = Clock;
                                        iconColor = "text-amber-500 dark:text-amber-400";
                                        iconBg = "bg-amber-50 dark:bg-amber-950/20";
                                        borderClass = "border-amber-450 bg-amber-50/5 hover:shadow-none animate-pulse";
                                        tagText = "Belum Absen";
                                        tagClass = "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-450 font-bold";
                                        titleColor = "text-amber-600 dark:text-amber-450 font-bold";
                                    } else if (kknStatus === "alpa") {
                                        TypeIcon = X;
                                        iconColor = "text-rose-600 dark:text-rose-400";
                                        iconBg = "bg-rose-100 dark:bg-rose-950/30";
                                        borderClass = "border-rose-350 bg-rose-50/20 dark:bg-rose-950/5 hover:shadow-none";
                                        tagText = "Alpa";
                                        tagClass = "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400";
                                        titleColor = "text-rose-655 dark:text-rose-400 font-bold";
                                    }
                                }

                                return (
                                    <button
                                        key={attendance.id}
                                        onClick={() => isClickable && onOpenDetail(attendance)}
                                        disabled={!isClickable}
                                        className={`w-full bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border-2 ${borderClass} card-hover transition-all duration-200 hover:shadow-md text-left`}
                                    >
                                        <div className="flex items-start gap-4">
                                            {/* Icon */}
                                            <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
                                                <TypeIcon className={`w-6 h-6 ${iconColor}`} />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <h4 className={`text-sm font-bold truncate ${titleColor}`}>
                                                        {isKkn ? attendance.session_name : getAttendanceTypeLabel(attendance.attendance_type)}
                                                    </h4>
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wide ${tagClass}`}>
                                                        {tagText}
                                                    </span>
                                                </div>

                                                <p className="text-xs text-slate-650 dark:text-slate-400 mb-2 font-semibold">
                                                    {dateTime.date}
                                                </p>

                                                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        <span className="font-medium">
                                                            {(isKkn && kknStatus !== "hadir") ? attendance.session_time : dateTime.time}
                                                        </span>
                                                    </div>
                                                    {!isKkn && attendance.location && (
                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                                                            <span className="truncate max-w-[120px]">{attendance.location}</span>
                                                        </div>
                                                    )}
                                                    {isKkn && kknStatus === "hadir" && attendance.location && (
                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                                                            <span className="truncate max-w-[120px]">{attendance.location}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
        
        {/* Bottom Navigation */}
        <BottomNavigation />
        </>
    );
};

export default History;