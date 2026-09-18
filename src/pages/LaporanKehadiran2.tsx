import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { AttendanceWithUser } from "@/lib/supabase";
import { FileDown, Loader2, ExternalLink, Camera } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type PdfDocument = jsPDF & {
  lastAutoTable?: {
    finalY: number;
  };
};

// Helper function to fetch photo from Telegram via API proxy
const fetchTelegramPhoto = async (photoUrl: string): Promise<string | null> => {
  try {
    // Check if it's a message link format
    if (photoUrl.includes('t.me/')) {
      console.warn('Message link tidak dapat di-fetch langsung, memerlukan file_id');
      return null;
    }

    // Check if it's telegram:file:{fileId} format
    if (photoUrl.startsWith('telegram:file:')) {
      const fileId = photoUrl.replace('telegram:file:', '');
      
      // Use our API proxy to fetch the photo
      const response = await fetch(`/api/telegram-photo?file_id=${encodeURIComponent(fileId)}`);
      
      if (!response.ok) {
        console.warn('Gagal mendapatkan foto dari Telegram');
        return null;
      }

      const result = await response.json();
      
      if (!result.ok || !result.dataUrl) {
        console.warn('Data URL tidak ditemukan dalam response');
        return null;
      }

      return result.dataUrl;
    }

    return null;
  } catch (error) {
    console.error('Error fetching Telegram photo:', error);
    return null;
  }
};

interface LeavePermit {
  id: string;
  user_id: string;
  permit_type: 'izin' | 'cuti' | 'dinas_luar';
  start_date: string;
  end_date: string;
  description: string | null;
  document_url: string | null;
  status?: string;
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

const permitTypeColors: Record<string, string> = {
  izin: "bg-blue-100 text-blue-800",
  cuti: "bg-green-100 text-green-800",
  dinas_luar: "bg-purple-100 text-purple-800",
};

// Format tanggal dengan nama bulan lengkap
const formatDateLong = (dateStr: string) => {
  return parseLocalYMD(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

// Hari (Senin, Selasa, dst) berdasarkan tanggal lokal
const formatDayName = (dateStr: string) => {
  return parseLocalYMD(dateStr).toLocaleDateString('id-ID', {
    weekday: 'long',
  });
};

// Format waktu dengan WIB
const formatTimeWIB = (date: Date | null) => {
  if (!date) return '-';
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
};

const wrapTextByWords = (text: string, maxLineLength: number) => {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (candidate.length > maxLineLength && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = candidate;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines.join('\n');
};

const formatLiburNasionalText = (description: string, maxLineLength = 14) => {
  const wrapped = wrapTextByWords(description, maxLineLength);
  return `Libur Nasional\n(${wrapped})`;
};

// Convert Date -> YYYY-MM-DD in LOCAL time (hindari geser timezone)
const toLocalYMD = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Parse YYYY-MM-DD as LOCAL date (bukan UTC)
const parseLocalYMD = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
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

  // Special cases for specific users
  if (username === "andi.syahrum.makkurade" || username === "tesx" || username.includes("tesx") || String(user.full_name || "").toLowerCase().includes("tesx")) return false;
  if (category === "dosen_struktural" && username === "susi.delmiati") return true;
  if (category === "tendik" && (username === "irfan.ananda.ismail" || username === "asmara.indah")) return true;


  // Default logic
  if (category === "tendik") {
    // Tendik mencakup pegawai + akun admin aplikasi
    return role === "pegawai" || role === "admin" || role === "superadmin";
  }
  if (category === "dosen_struktural") return role === "dosen" && isStruktural;
  return false;
};

export default function LaporanKehadiran2() {
  const [attendances, setAttendances] = useState<AttendanceWithUser[]>([]);
  const [app_users, setUsers] = useState<ReportUser[]>([]);
  const [leavePermits, setLeavePermits] = useState<LeavePermit[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState<ReportCategory>("tendik");
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .neq('role', 'mahasiswa')
        .order('full_name');

      if (usersError) throw usersError;
      setUsers(usersData || []);

      const [year, month] = selectedMonth.split('-').map(Number);
      const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
      const endOfMonthDate = new Date(year, month, 0);
      const endOfMonthStr = `${year}-${String(month).padStart(2, '0')}-${String(endOfMonthDate.getDate()).padStart(2, '0')}`;

      const allAttendances: AttendanceWithUser[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const from = page * pageSize;
        const to = from + pageSize - 1;

        const { data: attData, error: attError } = await supabase
          .from('attendances')
          .select(`
            *,
            user:users(id, username, full_name, role, is_struktural)
          `)
          .gte('created_at', `${startOfMonth}T00:00:00Z`)
          .lte('created_at', `${endOfMonthStr}T23:59:59Z`)
          .order('created_at', { ascending: false })
          .range(from, to);

        if (attError) throw attError;

        if (attData && attData.length > 0) {
          const filtered = attData.filter(a => !(a.note && (a.note.includes('Sesi:') || a.note.includes('KKN'))));
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

      const { data: permitsData, error: permitsError } = await supabase
        .from('leave_permits')
        .select('*')
        .order('start_date', { ascending: false });

      if (!permitsError) {
        setLeavePermits(permitsData || []);
      }

      // Fetch holidays data
      const { data: holidaysData, error: holidaysError } = await supabase
        .from('holidays')
        .select('*')
        .eq('is_active', true)
        .order('holiday_date', { ascending: false });

      if (!holidaysError) {
        setHolidays(holidaysData || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSelectedUser("");
  }, [selectedCategory]);

  const usersInSelectedCategory = app_users.filter((user) => isUserInCategory(user, selectedCategory));
  const categoryUserIdSet = new Set(usersInSelectedCategory.map((user) => user.id));

  const selectedUserData = usersInSelectedCategory.find((u) => u.id === selectedUser);
  const isAllUsers = selectedUser === "";

  const filteredAttendances = attendances.filter((a) => {
    if (!a.user_id || !a.created_at) return false;

    const matchUser = isAllUsers
      ? categoryUserIdSet.has(a.user_id)
      : a.user_id === selectedUser;

    // Extract date part only (YYYY-MM-DD) and check if year-month matches
    const attendanceDate = a.created_at.split('T')[0]; // Get YYYY-MM-DD
    const attendanceYearMonth = attendanceDate.substring(0, 7); // Get YYYY-MM
    const matchMonth = attendanceYearMonth === selectedMonth;
    return matchUser && matchMonth;
  });

  const filteredLeavePermits = leavePermits.filter((permit) => {
    const matchUser = isAllUsers
      ? categoryUserIdSet.has(permit.user_id)
      : permit.user_id === selectedUser;

    const permitStart = parseLocalYMD(permit.start_date);
    const permitEnd = parseLocalYMD(permit.end_date);

    const [year, month] = selectedMonth.split('-').map(Number);
    const selectedMonthStart = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const selectedMonthEnd = new Date(year, month, 0, 23, 59, 59, 999);

    const matchMonth = permitStart <= selectedMonthEnd && permitEnd >= selectedMonthStart;
    return matchUser && matchMonth;
  });

  const groupedData = filteredAttendances.reduce((acc, attendance) => {
    const date = attendance.created_at.split('T')[0];

    if (!acc[date]) {
      acc[date] = {
        date,
        masuk: null,
        pulang: null,
      };
    }

    if (attendance.attendance_type === 'masuk') {
      acc[date].masuk = attendance;
    } else {
      acc[date].pulang = attendance;
    }

    return acc;
  }, {} as Record<string, any>);

  const tableData = Object.values(groupedData).sort((a: any, b: any) =>
    a.date.localeCompare(b.date)
  );

  const getAllUsersTableData = () => {
    const userAttendanceMap: Record<string, { user: any; dates: Record<string, any> }> = {};

    filteredAttendances.forEach((attendance) => {
      const userId = attendance.user_id;
      if (!userId || !attendance.created_at) return;

      const date = attendance.created_at.split('T')[0];
      const user = attendance.user;

      if (!userAttendanceMap[userId]) {
        userAttendanceMap[userId] = {
          user,
          dates: {},
        };
      }

      if (!userAttendanceMap[userId].dates[date]) {
        userAttendanceMap[userId].dates[date] = {
          date,
          masuk: null,
          pulang: null,
        };
      }

      if (attendance.attendance_type === 'masuk') {
        userAttendanceMap[userId].dates[date].masuk = attendance;
      } else {
        userAttendanceMap[userId].dates[date].pulang = attendance;
      }
    });

    return userAttendanceMap;
  };

  const getLeavePermitForDate = (userId: string, dateStr: string): LeavePermit | null => {
    return leavePermits.find(permit => {
      if (permit.user_id !== userId) return false;
      const date = parseLocalYMD(dateStr);
      const startDate = parseLocalYMD(permit.start_date);
      const endDate = parseLocalYMD(permit.end_date);
      return date >= startDate && date <= endDate;
    }) || null;
  };

  // Check if a date is a holiday
  const getHolidayForDate = (dateStr: string): Holiday | null => {
    return holidays.find(holiday => holiday.holiday_date === dateStr) || null;
  };

  // Nama bulan lengkap untuk periode (pakai local date agar tidak geser)
  const [selectedYear, selectedMonthNumber] = selectedMonth.split('-').map(Number);
  const monthName = new Date(selectedYear, selectedMonthNumber - 1, 1).toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric'
  });

  const monthForFilename = `${String(selectedMonthNumber).padStart(2, '0')}-${selectedYear}`;

  const getExtendedTableData = () => {
    const existingDates = new Set(tableData.map((row: any) => row.date));
    const data = [...tableData];
    
    if (selectedUser) {
      // Add leave permits
      const userPermits = leavePermits.filter(permit => permit.user_id === selectedUser);
      
      // Get proper month boundaries
      const [year, month] = selectedMonth.split('-').map(Number);
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0); // Last day of the month
      
      userPermits.forEach(permit => {
        const startDate = parseLocalYMD(permit.start_date);
        const endDate = parseLocalYMD(permit.end_date);
        
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          if (d >= monthStart && d <= monthEnd) {
             const dateStr = toLocalYMD(d);
            
            if (!existingDates.has(dateStr)) {
              data.push({
                date: dateStr,
                masuk: null,
                pulang: null,
                hasLeavePermit: true,
                leavePermitType: permit.permit_type,
                leavePermitDescription: permit.description,
                leavePermitUrl: permit.document_url
              });
              existingDates.add(dateStr);
            }
          }
        }
      });

      // Add holidays that fall within the selected month
      holidays.forEach(holiday => {
        const holidayDate = new Date(holiday.holiday_date);
        if (holidayDate >= monthStart && holidayDate <= monthEnd) {
          const dateStr = holiday.holiday_date;
          
          if (!existingDates.has(dateStr)) {
            data.push({
              date: dateStr,
              masuk: null,
              pulang: null,
              isHoliday: true,
              holidayDescription: holiday.description
            });
            existingDates.add(dateStr);
          } else {
            // If date exists, mark it as holiday
            const existingRow = data.find((row: any) => row.date === dateStr);
            if (existingRow) {
              existingRow.isHoliday = true;
              existingRow.holidayDescription = holiday.description;
            }
          }
        }
      });
      
      data.sort((a: any, b: any) => a.date.localeCompare(b.date));
    }
    
    return data;
  };

  // Helper function to generate all dates in month from day 1 to today
  const generateAllDatesInMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-').map(Number);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
    
    // Start date is always the 1st of the selected month at 00:00:00
    const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    
    // Determine end date: if selected month is current month, use today, otherwise use last day of month
    let endDate: Date;
    if (year === today.getFullYear() && month === today.getMonth() + 1) {
      endDate = today;
    } else {
      // Last day of selected month at 23:59:59
      endDate = new Date(year, month, 0, 23, 59, 59, 999);
    }
    
    const dates: string[] = [];
    const currentDate = new Date(startDate);
    
    // Iterate from start to end, ensuring we stay within the same month
    while (currentDate <= endDate) {
      // Double check that we're in the correct month and year
      if (currentDate.getFullYear() === year && currentDate.getMonth() === month - 1) {
        dates.push(toLocalYMD(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  };

  // Build PDF document
  const buildPdfDoc = async () => {
    if (!selectedUserData) return null;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' }) as PdfDocument;
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 36;
    const headerTopY = 36;
    let currentY = headerTopY;
    const lineHeight = 18;

    doc.setTextColor(0, 0, 0);

    try {
      const logoData = await fetch('/unes.png').then(response => response.blob()).then(blob => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      });
      doc.addImage(logoData, 'PNG', marginX, headerTopY - 10, 60, 60);
    } catch (error) {
      console.warn('Logo tidak dapat dimuat untuk PDF:', error);
    }

    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('YAYASAN PERGURUAN TINGGI PADANG', pageWidth / 2, currentY, { align: 'center' });
    currentY += 20;

    doc.setFontSize(16);
    doc.text('UNIVERSITAS EKASAKTI', pageWidth / 2, currentY, { align: 'center' });
    currentY += 22;

    doc.setFont('times', 'normal');
    doc.setFontSize(11);
    doc.text('Jl. Veteran Dalam No. 26 Padang (25113) Telp. (0751) 28859-26770', pageWidth / 2, currentY, { align: 'center' });
    currentY += 16;
    doc.text('Fax. (0751) 32694; https://unespadang.ac.id/', pageWidth / 2, currentY, { align: 'center' });
    currentY += 14;

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1);
    doc.line(marginX, currentY, pageWidth - marginX, currentY);
    currentY += 22;

    doc.setFont('times', 'bold');
    doc.setFontSize(14);
    doc.text('LAPORAN KEHADIRAN PEGAWAI', pageWidth / 2, currentY, { align: 'center' });
    currentY += 24;

    doc.setFont('times', 'normal');
    doc.setFontSize(11);
    doc.text('Nama', marginX, currentY);
    doc.text(`: ${selectedUserData.full_name}`, marginX + 120, currentY);
    currentY += lineHeight;

    doc.text('Unit Kerja', marginX, currentY);
    doc.text(`: ${selectedUserData.unit_kerja || '-'}`, marginX + 120, currentY);
    currentY += lineHeight;

    doc.text('Periode', marginX, currentY);
    doc.text(`: ${monthName}`, marginX + 120, currentY);
    currentY += lineHeight + 10;

    // Generate all dates from day 1 to today
    const allDates = generateAllDatesInMonth(selectedMonth);
    
    // Create a map of existing attendance data
    const existingAttendanceMap = new Map<string, any>();
    const extendedData = getExtendedTableData();
    extendedData.forEach((row: any) => {
      existingAttendanceMap.set(row.date, row);
    });
    
    // Build complete table data with all dates
    const completeTableData = allDates.map(dateStr => {
      if (existingAttendanceMap.has(dateStr)) {
        return existingAttendanceMap.get(dateStr);
      } else {
        // Check if it's Sunday (weekend)
        const date = parseLocalYMD(dateStr);
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0; // Only Sunday is weekend
        
        return {
          date: dateStr,
          masuk: null,
          pulang: null,
          isWeekend
        };
      }
    });
    
    // Fetch all photos from Telegram before building table
    const photoCache = new Map<string, string>();
    
    for (const row of completeTableData) {
      if (row.masuk?.photo_url) {
        const photo = await fetchTelegramPhoto(row.masuk.photo_url);
        if (photo) {
          photoCache.set(`masuk-${row.date}`, photo);
        }
      }
      if (row.pulang?.photo_url) {
        const photo = await fetchTelegramPhoto(row.pulang.photo_url);
        if (photo) {
          photoCache.set(`pulang-${row.date}`, photo);
        }
      }
    }
    
    const tableBody = completeTableData.map((row: any, index: number) => {
      const masukTime = row.masuk ? new Date(row.masuk.created_at) : null;
      const pulangTime = row.pulang ? new Date(row.pulang.created_at) : null;


      const dateForCheck = typeof row.date === 'string' ? row.date : toLocalYMD(new Date(row.date));
      let leavePermit = getLeavePermitForDate(selectedUser, dateForCheck);

      if (row.hasLeavePermit) {
        leavePermit = {
          id: 'permit-' + dateForCheck,
          user_id: selectedUser,
          permit_type: row.leavePermitType,
          start_date: dateForCheck,
          end_date: dateForCheck,
          description: row.leavePermitDescription,
          document_url: row.leavePermitUrl,
        };
      }

      const isSunday = parseLocalYMD(dateForCheck).getDay() === 0;
      const isWeekend = Boolean(row.isWeekend) || isSunday;

      // Check holiday (non-weekend)
      const holiday = getHolidayForDate(dateForCheck);
      const isHoliday = row.isHoliday || holiday !== null;
      const holidayDesc = row.holidayDescription || holiday?.description;

      const liburNasionalText = isHoliday && holidayDesc ? formatLiburNasionalText(holidayDesc) : null;

      // Format jam masuk dengan logic "Tidak Absen Masuk"
      let jamMasuk = '-';
      if (isWeekend) {
        jamMasuk = 'Libur Hari Minggu';
      } else if (liburNasionalText) {
        jamMasuk = liburNasionalText;
      } else if (masukTime) {
        jamMasuk = masukTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
      } else if (!leavePermit) {
        jamMasuk = 'Tidak Absen Masuk';
      }

      // Format jam pulang dengan logic "Tidak Absen Pulang"
      let jamPulang = '-';
      if (isWeekend) {
        jamPulang = 'Libur Hari Minggu';
      } else if (liburNasionalText) {
        jamPulang = liburNasionalText;
      } else if (pulangTime) {
        jamPulang = pulangTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
      } else if (!leavePermit) {
        jamPulang = 'Tidak Absen Pulang';
      }

      // Keterangan column
      let keterangan = '-';
      if (isWeekend) {
        keterangan = 'Libur Hari Minggu';
      } else if (liburNasionalText) {
        keterangan = liburNasionalText;
      } else if (leavePermit) {
        const permitLabel = permitTypeLabels[leavePermit.permit_type] || leavePermit.permit_type;
        keterangan = permitLabel;
      } else if (row.masuk && row.pulang) {
        keterangan = 'Hadir';
      } else if (row.masuk && !row.pulang) {
        keterangan = 'Tidak Absen Pulang';
      } else if (!row.masuk && row.pulang) {
        keterangan = 'Tidak Absen Masuk';
      }

      const buktiMasuk = isWeekend
        ? 'Libur Hari Minggu'
        : liburNasionalText
          ? liburNasionalText
          : 'tidak ada foto';

      const buktiPulang = isWeekend
        ? 'Libur Hari Minggu'
        : liburNasionalText
          ? liburNasionalText
          : 'tidak ada foto';

      return [
        index + 1,
        formatDayName(dateForCheck),
        formatDateLong(row.date),
        jamMasuk,
        buktiMasuk,
        jamPulang,
        buktiPulang,
        keterangan,
      ];
    });

    const totalTableWidth = 20 + 45 + 70 + 71 + 50 + 71 + 50 + 71; // 448pt
    const tableMarginX = (pageWidth - totalTableWidth) / 2; // Center the table

    autoTable(doc, {
      head: [[
        'No',
        'Hari',
        'Tanggal',
        'Jam Masuk',
        'Bukti Masuk',
        'Jam Pulang',
        'Bukti Pulang',
        'Keterangan',
      ]],
      body: tableBody,
      startY: currentY,
      margin: { left: tableMarginX, right: tableMarginX, top: 36, bottom: 36 },
      tableWidth: totalTableWidth,
      styles: {
        font: 'times',
        fontSize: 8,
        cellPadding: 3,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.5,
        halign: 'center',
        minCellHeight: 52, // Increased height for square 1:1 photos (50px photo + 2px padding)
      },
        headStyles: {
          font: 'times',
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          lineWidth: 0.5,
          fontSize: 8,
          halign: 'center',
        },
      columnStyles: {
        0: { cellWidth: 20, halign: 'center' },    // No
        1: { cellWidth: 45, halign: 'center' },    // Hari
        2: { cellWidth: 70, halign: 'center' },    // Tanggal
        3: { cellWidth: 71, halign: 'center' },    // Jam Masuk
        4: { cellWidth: 50, halign: 'center' },    // Bukti Masuk (foto 1:1)
        5: { cellWidth: 71, halign: 'center' },    // Jam Pulang
        6: { cellWidth: 50, halign: 'center' },    // Bukti Pulang (foto 1:1)
        7: { cellWidth: 71, halign: 'center' },    // Keterangan
      },
        didDrawCell: (data) => {
        const rowIndex = data.row.index;
        const rowData = completeTableData[rowIndex];
        if (!rowData) return;

        const dateForCheck = typeof rowData.date === 'string' ? rowData.date : toLocalYMD(new Date(rowData.date));
        let leavePermit = getLeavePermitForDate(selectedUser, dateForCheck);

        if (rowData.hasLeavePermit) {
          leavePermit = {
            id: 'permit-' + dateForCheck,
            user_id: selectedUser,
            permit_type: 'izin' as const,
            start_date: dateForCheck,
            end_date: dateForCheck,
            description: rowData.leavePermitDescription,
            document_url: rowData.leavePermitUrl,
          };
        }

        const holiday = getHolidayForDate(dateForCheck);
        const isHoliday = rowData.isHoliday || holiday !== null;

        const isSunday = parseLocalYMD(dateForCheck).getDay() === 0;
        const isWeekend = Boolean(rowData.isWeekend) || isSunday;
        const skipEvidence = isWeekend || isHoliday;

        // Handle Bukti Masuk column (index 4)
        if (!skipEvidence && data.column.index === 4 && data.cell.section === 'body') {
          const photoKey = `masuk-${rowData.date}`;
          const photoBase64 = photoCache.get(photoKey);

          if (photoBase64) {
            const imgSize = Math.min(data.cell.width - 4, data.cell.height - 4);
            const imgX = data.cell.x + (data.cell.width - imgSize) / 2;
            const imgY = data.cell.y + (data.cell.height - imgSize) / 2;

            try {
              doc.addImage(photoBase64, 'JPEG', imgX, imgY, imgSize, imgSize);
            } catch (err) {
              console.error('Failed to add masuk image:', err);
            }
          }
        }

        // Handle Bukti Pulang column (index 6)
        if (!skipEvidence && data.column.index === 6 && data.cell.section === 'body') {
          const photoKey = `pulang-${rowData.date}`;
          const photoBase64 = photoCache.get(photoKey);

          if (photoBase64) {
            const imgSize = Math.min(data.cell.width - 4, data.cell.height - 4);
            const imgX = data.cell.x + (data.cell.width - imgSize) / 2;
            const imgY = data.cell.y + (data.cell.height - imgSize) / 2;

            try {
              doc.addImage(photoBase64, 'JPEG', imgX, imgY, imgSize, imgSize);
            } catch (err) {
              console.error('Failed to add pulang image:', err);
            }
          }
        }

        // Handle Keterangan column with clickable link for izin dinas luar (index 7)
        if (data.column.index === 7 && data.cell.section === 'body') {
          const actualUrl = leavePermit?.document_url || null;

          if (actualUrl) {
            doc.setFillColor(255, 255, 255);
            doc.rect(data.cell.x + 0.5, data.cell.y + 0.5, data.cell.width - 1, data.cell.height - 1, 'F');

            const permitLabel = permitTypeLabels[leavePermit!.permit_type] || leavePermit!.permit_type;
            const linkText = `${permitLabel} (Surat)`;
            doc.setTextColor(0, 0, 255);
            doc.setFont('times', 'normal');
            doc.setFontSize(8);

            const textWidth = doc.getTextWidth(linkText);
            const textX = data.cell.x + (data.cell.width - textWidth) / 2;
            const textY = data.cell.y + data.cell.height / 2 + 3;

            doc.textWithLink(linkText, textX, textY, { url: actualUrl });
            
            doc.setDrawColor(0, 0, 255);
            doc.setLineWidth(0.3);
            doc.line(textX, textY + 1, textX + textWidth, textY + 1);

            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.5);
            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'S');

            doc.setTextColor(0, 0, 0);
          }
        }
      }
    });

    const finalY = doc.lastAutoTable?.finalY ?? currentY + 40;
    
     // Calculate statistics
     let totalHariBekerja = 0;
     let totalTidakAbsenMasuk = 0;
     let totalTidakAbsenPulang = 0;
     let totalIzinCutiDinasLuar = 0;
     let totalTidakMasukBekerja = 0;

     completeTableData.forEach((row: any) => {
       const dateForCheck = typeof row.date === 'string' ? row.date : toLocalYMD(new Date(row.date));
       const leavePermit = getLeavePermitForDate(selectedUser, dateForCheck);
       const holiday = getHolidayForDate(dateForCheck);
       const isHoliday = row.isHoliday || holiday !== null;
       const isSunday = parseLocalYMD(dateForCheck).getDay() === 0;
       const isWeekend = Boolean(row.isWeekend) || isSunday;

       // Hari bekerja: dikecualikan Minggu dan libur nasional
       if (!isWeekend && !isHoliday) {
         totalHariBekerja++;

         if (leavePermit) {
           totalIzinCutiDinasLuar++;
         } else {
           if (!row.masuk && !row.pulang) {
             totalTidakMasukBekerja++;
             totalTidakAbsenMasuk++;
             totalTidakAbsenPulang++;
           } else {
             if (!row.masuk) totalTidakAbsenMasuk++;
             if (!row.pulang) totalTidakAbsenPulang++;
           }
         }
       }
     });
    
    // Add recap section
    const rekapY = finalY + 24;
    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.text('Rekap:', marginX, rekapY);
    
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    const rekapLineHeight = 16;
    let rekapCurrentY = rekapY + rekapLineHeight;
    
       doc.text(`Total Hari Bekerja (kecuali Minggu) = ${totalHariBekerja} hari`, marginX, rekapCurrentY);
    rekapCurrentY += rekapLineHeight;
    
    doc.text(`Total Tidak Absen Masuk = ${totalTidakAbsenMasuk} hari`, marginX, rekapCurrentY);
    rekapCurrentY += rekapLineHeight;
    
    doc.text(`Total Tidak Absen Pulang = ${totalTidakAbsenPulang} hari`, marginX, rekapCurrentY);
    rekapCurrentY += rekapLineHeight;
    
    doc.text(`Total Izin/Cuti/Dinas Luar = ${totalIzinCutiDinasLuar} hari`, marginX, rekapCurrentY);
    rekapCurrentY += rekapLineHeight;
    
    doc.setFont('times', 'bold');
    doc.text(`Total Tidak Masuk Bekerja = ${totalTidakMasukBekerja} hari`, marginX, rekapCurrentY);
    
    const signatureY = rekapCurrentY + 30;

    doc.setFont('times', 'normal');
    doc.setFontSize(11);
    doc.text(`Padang, ${new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })}`, pageWidth - 220, signatureY);

    doc.text('Wakil Rektor 2', pageWidth - 220, signatureY + lineHeight);
    doc.text('Dr. Susi Delmiati S.H, M.H', pageWidth - 220, signatureY + lineHeight * 4);
    doc.text('NUPTK: 6753747648230140', pageWidth - 220, signatureY + lineHeight * 5);

    return doc;
  };

  // Build PDF for ALL users
  const buildAllUsersPdfDoc = async () => {
    const allUsersData = getAllUsersTableData();
    const userIds = Object.keys(allUsersData);

    const defaultUsersToProcess = usersInSelectedCategory.map((u) => u.id);
    const usersToProcess = (userIds.length > 0 ? userIds : defaultUsersToProcess).filter((id) =>
      categoryUserIdSet.has(id)
    );

    if (usersToProcess.length === 0) return null;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' }) as PdfDocument;
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 36;
    const lineHeight = 18;

    let logoData: string | null = null;
    try {
      logoData = await fetch('/unes.png').then(response => response.blob()).then(blob => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      });
    } catch (error) {
      console.warn('Logo tidak dapat dimuat untuk PDF:', error);
    }

    const sortedUserIds = usersToProcess.sort((a, b) => {
      const userA = allUsersData[a]?.user?.full_name || app_users.find(u => u.id === a)?.full_name || '';
      const userB = allUsersData[b]?.user?.full_name || app_users.find(u => u.id === b)?.full_name || '';
      return userA.localeCompare(userB);
    });

    for (let userIndex = 0; userIndex < sortedUserIds.length; userIndex++) {
      const userId = sortedUserIds[userIndex];
      const userData = allUsersData[userId];
      const userInfo = userData?.user || app_users.find(u => u.id === userId);
      
      // Generate all dates from day 1 to today
      const allDates = generateAllDatesInMonth(selectedMonth);
      
      // Create a map of existing attendance data
      const existingAttendanceMap = new Map<string, any>();
      if (userData) {
        Object.values(userData.dates).forEach((row: any) => {
          existingAttendanceMap.set(row.date, row);
        });
      }
      
      // Build complete table data with all dates
      const userTableData = allDates.map(dateStr => {
        if (existingAttendanceMap.has(dateStr)) {
          const existingData = existingAttendanceMap.get(dateStr);
          // Check if it's a holiday
          const holiday = getHolidayForDate(dateStr);
          if (holiday) {
            return {
              ...existingData,
              isHoliday: true,
              holidayDescription: holiday.description
            };
          }
          return existingData;
        } else {
          // Check if it's a holiday
          const holiday = getHolidayForDate(dateStr);
          if (holiday) {
            return {
              date: dateStr,
              masuk: null,
              pulang: null,
              isHoliday: true,
              holidayDescription: holiday.description
            };
          }
          
          // Check if it's Sunday (weekend)
          const date = new Date(dateStr);
          const dayOfWeek = date.getDay();
          const isWeekend = dayOfWeek === 0; // Only Sunday is weekend
          
          return {
            date: dateStr,
            masuk: null,
            pulang: null,
            isWeekend
          };
        }
      });

      if (userIndex > 0) {
        doc.addPage();
      }

      const headerTopY = 36;
      let currentY = headerTopY;

      if (logoData) {
        doc.addImage(logoData, 'PNG', marginX, headerTopY - 10, 60, 60);
      }

      doc.setFont('times', 'bold');
      doc.setFontSize(12);
      doc.text('YAYASAN PERGURUAN TINGGI PADANG', pageWidth / 2, currentY, { align: 'center' });
      currentY += 20;

      doc.setFontSize(16);
      doc.text('UNIVERSITAS EKASAKTI', pageWidth / 2, currentY, { align: 'center' });
      currentY += 22;

      doc.setFont('times', 'normal');
      doc.setFontSize(11);
      doc.text('Jl. Veteran Dalam No. 26 Padang (25113) Telp. (0751) 28859-26770', pageWidth / 2, currentY, { align: 'center' });
      currentY += 16;
      doc.text('Fax. (0751) 32694; https://unespadang.ac.id/', pageWidth / 2, currentY, { align: 'center' });
      currentY += 14;

      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(1);
      doc.line(marginX, currentY, pageWidth - marginX, currentY);
      currentY += 22;

      doc.setFont('times', 'bold');
      doc.setFontSize(14);
      doc.text('LAPORAN KEHADIRAN PEGAWAI', pageWidth / 2, currentY, { align: 'center' });
      currentY += 24;

      doc.setFont('times', 'normal');
      doc.setFontSize(11);
      doc.text('Nama', marginX, currentY);
      doc.text(`: ${userInfo?.full_name || '-'}`, marginX + 120, currentY);
      currentY += lineHeight;

      doc.text('Unit Kerja', marginX, currentY);
      doc.text(`: ${userInfo?.unit_kerja || '-'}`, marginX + 120, currentY);
      currentY += lineHeight;

      doc.text('Periode', marginX, currentY);
      doc.text(`: ${monthName}`, marginX + 120, currentY);
      currentY += lineHeight + 10;

      const tableBody = userTableData.map((row: any, index: number) => {
        const masukTime = row.masuk ? new Date(row.masuk.created_at) : null;
        const pulangTime = row.pulang ? new Date(row.pulang.created_at) : null;

        const dateForCheck = typeof row.date === 'string' ? row.date : toLocalYMD(new Date(row.date));
        const leavePermit = getLeavePermitForDate(userId, dateForCheck);

        const isSunday = parseLocalYMD(dateForCheck).getDay() === 0;
        const isWeekend = Boolean(row.isWeekend) || isSunday;

        // Check holiday
        const holiday = getHolidayForDate(dateForCheck);
        const isHoliday = row.isHoliday || holiday !== null;
        const holidayDesc = row.holidayDescription || holiday?.description;

        const liburNasionalText = isHoliday && holidayDesc ? formatLiburNasionalText(holidayDesc) : null;

        // Format jam masuk dengan logic "Tidak Absen Masuk"
        let jamMasuk = '-';
        if (isWeekend) {
          jamMasuk = 'Libur Hari Minggu';
        } else if (liburNasionalText) {
          jamMasuk = liburNasionalText;
        } else if (masukTime) {
          jamMasuk = masukTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
        } else if (!leavePermit) {
          jamMasuk = 'Tidak Absen Masuk';
        }

        // Format jam pulang dengan logic "Tidak Absen Pulang"
        let jamPulang = '-';
        if (isWeekend) {
          jamPulang = 'Libur Hari Minggu';
        } else if (liburNasionalText) {
          jamPulang = liburNasionalText;
        } else if (pulangTime) {
          jamPulang = pulangTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
        } else if (!leavePermit) {
          jamPulang = 'Tidak Absen Pulang';
        }

        // Keterangan column
        let keterangan = '-';
        if (isWeekend) {
          keterangan = 'Libur Hari Minggu';
        } else if (isHoliday && holidayDesc) {
          keterangan = `Libur Nasional (${holidayDesc})`;
        } else if (leavePermit) {
          keterangan = permitTypeLabels[leavePermit.permit_type] || leavePermit.permit_type;
        } else if (row.masuk && row.pulang) {
          keterangan = 'Hadir';
        } else if (row.masuk && !row.pulang) {
          keterangan = 'Tidak Absen Pulang';
        } else if (!row.masuk && row.pulang) {
          keterangan = 'Tidak Absen Masuk';
        }
        
        const buktiUrl = leavePermit?.document_url ? 'Surat' : '-';

        return [
          index + 1,
          formatDayName(dateForCheck),
          formatDateLong(row.date),
          jamMasuk,
          jamPulang,
          keterangan,
          buktiUrl,
        ];
      });

      const totalTableWidthAllUsers = 35 + 70 + 110 + 80 + 80 + 85 + 62; // 522pt
      const tableMarginXAllUsers = (pageWidth - totalTableWidthAllUsers) / 2; // Center the table

      autoTable(doc, {
        head: [[
          'No',
          'Hari',
          'Tanggal',
          'Jam Masuk',
          'Jam Pulang',
          'Keterangan',
          'Bukti',
        ]],
        body: tableBody,
        startY: currentY,
        margin: { left: tableMarginXAllUsers, right: tableMarginXAllUsers, top: 36, bottom: 36 },
        tableWidth: totalTableWidthAllUsers,
        styles: {
          font: 'times',
          fontSize: 9,
          cellPadding: 5,
          textColor: [0, 0, 0],
          lineColor: [0, 0, 0],
          lineWidth: 0.5,
          halign: 'center',
        },
        headStyles: {
          font: 'times',
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          lineWidth: 0.5,
          fontSize: 9,
          halign: 'center',
        },
      columnStyles: {
        0: { cellWidth: 35, halign: 'center' },  // No
        1: { cellWidth: 70, halign: 'center' },  // Hari
        2: { cellWidth: 110, halign: 'center' }, // Tanggal
        3: { cellWidth: 80, halign: 'center' },  // Jam Masuk
        4: { cellWidth: 80, halign: 'center' },  // Jam Pulang
        5: { cellWidth: 85, halign: 'center' },  // Keterangan
        6: { cellWidth: 62, halign: 'center' },  // Bukti
      },
      didDrawCell: (data) => {
        if (data.column.index === 6 && data.cell.section === 'body') {
            const rowIndex = data.row.index;
            const rowData = userTableData[rowIndex] as any;
            if (!rowData?.date) return;

            const dateForCheck = typeof rowData.date === 'string' ? rowData.date : toLocalYMD(new Date(rowData.date));
            const leavePermit = getLeavePermitForDate(userId, dateForCheck);

            const actualUrl = leavePermit?.document_url || null;

            if (actualUrl) {
              doc.setFillColor(255, 255, 255);
              doc.rect(data.cell.x + 0.5, data.cell.y + 0.5, data.cell.width - 1, data.cell.height - 1, 'F');

              const linkText = 'Surat';
              doc.setTextColor(0, 0, 255);
              doc.setFont('times', 'normal');
              doc.setFontSize(9);

              const textWidth = doc.getTextWidth(linkText);
              const textX = data.cell.x + (data.cell.width - textWidth) / 2;
              const textY = data.cell.y + data.cell.height / 2 + 3;

              doc.textWithLink(linkText, textX, textY, { url: actualUrl });
              
              doc.setDrawColor(0, 0, 255);
              doc.setLineWidth(0.3);
              doc.line(textX, textY + 1, textX + textWidth, textY + 1);

              doc.setDrawColor(0, 0, 0);
              doc.setLineWidth(0.5);
              doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'S');

              doc.setTextColor(0, 0, 0);
            }
          }
        }
      });

      const finalY = doc.lastAutoTable?.finalY ?? currentY + 40;
      
       // Calculate statistics
       let totalHariBekerja = 0;
       let totalTidakAbsenMasuk = 0;
       let totalTidakAbsenPulang = 0;
       let totalIzinCutiDinasLuar = 0;
       let totalTidakMasukBekerja = 0;

       userTableData.forEach((row: any) => {
         const dateForCheck = typeof row.date === 'string' ? row.date : toLocalYMD(new Date(row.date));
         const leavePermit = getLeavePermitForDate(userId, dateForCheck);
         const holiday = getHolidayForDate(dateForCheck);
         const isHoliday = row.isHoliday || holiday !== null;
         const isSunday = parseLocalYMD(dateForCheck).getDay() === 0;
         const isWeekend = Boolean(row.isWeekend) || isSunday;

         // Hari bekerja: dikecualikan Minggu dan libur nasional
         if (!isWeekend && !isHoliday) {
           totalHariBekerja++;

           if (leavePermit) {
             totalIzinCutiDinasLuar++;
           } else {
             if (!row.masuk && !row.pulang) {
               totalTidakMasukBekerja++;
               totalTidakAbsenMasuk++;
               totalTidakAbsenPulang++;
             } else {
               if (!row.masuk) totalTidakAbsenMasuk++;
               if (!row.pulang) totalTidakAbsenPulang++;
             }
           }
         }
       });
      
      // Add recap section
      const rekapY = finalY + 24;
      doc.setFont('times', 'bold');
      doc.setFontSize(11);
      doc.text('Rekap:', marginX, rekapY);
      
      doc.setFont('times', 'normal');
      doc.setFontSize(10);
      const rekapLineHeight = 16;
      let rekapCurrentY = rekapY + rekapLineHeight;
      
      doc.text(`Total Hari Bekerja (kecuali Minggu) = ${totalHariBekerja} hari`, marginX, rekapCurrentY);
      rekapCurrentY += rekapLineHeight;
      
      doc.text(`Total Tidak Absen Masuk = ${totalTidakAbsenMasuk} hari`, marginX, rekapCurrentY);
      rekapCurrentY += rekapLineHeight;
      
      doc.text(`Total Tidak Absen Pulang = ${totalTidakAbsenPulang} hari`, marginX, rekapCurrentY);
      rekapCurrentY += rekapLineHeight;
      
      doc.text(`Total Izin/Cuti/Dinas Luar = ${totalIzinCutiDinasLuar} hari`, marginX, rekapCurrentY);
      rekapCurrentY += rekapLineHeight;
      
      doc.setFont('times', 'bold');
      doc.text(`Total Tidak Masuk Bekerja = ${totalTidakMasukBekerja} hari`, marginX, rekapCurrentY);
      
      const signatureY = rekapCurrentY + 30;

      doc.setFont('times', 'normal');
      doc.setFontSize(11);
      doc.text(`Padang, ${new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })}`, pageWidth - 220, signatureY);

      doc.text(' Wakil Rektor 2', pageWidth - 220, signatureY + lineHeight);
      doc.text('Dr. Susi Delmiati S.H, M.H', pageWidth - 220, signatureY + lineHeight * 4);
      doc.text('NUPTK: 6753747648230140', pageWidth - 220, signatureY + lineHeight * 5);
    }

    return doc;
  };

  const handleExportPDF = async () => {
    if (isAllUsers) {
      const doc = await buildAllUsersPdfDoc();
      if (!doc) return;
      doc.save(`Laporan_Absensi_Semua_${categoryLabel[selectedCategory].replace(/\s+/g, "_")}_${monthForFilename}.pdf`);
    } else {
      if (!selectedUserData) return;
      const doc = await buildPdfDoc();
      if (!doc) return;
      const safeName = selectedUserData.full_name.replace(/[^a-z0-9]/gi, '_');
      doc.save(`Laporan_Absensi_${categoryLabel[selectedCategory].replace(/\s+/g, "_")}_${safeName}_${monthForFilename}.pdf`);
    }
  };

  const extendedTableData = getExtendedTableData();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header - Mobile Optimized */}
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex flex-col gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              Laporan Kehadiran
            </h2>
             <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
               Rekap kehadiran & izin/cuti per kategori
             </p>
          </div>
          <button
            onClick={() => { void handleExportPDF(); }}
            disabled={isAllUsers ? false : (!selectedUserData)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            <FileDown size={16} />
            <span>{isAllUsers ? 'Unduh PDF Semua' : 'Unduh PDF'}</span>
          </button>
        </div>
      </div>

      {/* Controls - Mobile Optimized */}
      <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50 border-b border-gray-200">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            Kategori
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as ReportCategory)}
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2.5"
          >
            <option value="dosen_struktural">Dosen Struktural</option>
            <option value="tendik">Tendik</option>
          </select>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            Pilih {categoryLabel[selectedCategory]}
          </label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2.5"
          >
            <option value="">Semua {categoryLabel[selectedCategory]}</option>
            {usersInSelectedCategory.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            Bulan
          </label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2.5"
          />
        </div>
      </div>

       {/* Table/Content - Mobile Optimized */}
       <div>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
            <p className="text-sm text-gray-500">Memuat data...</p>
          </div>
          ) : isAllUsers ? (
            <div className="text-center py-12 px-4">
              <p className="text-gray-500 text-sm">
                Pilih {categoryLabel[selectedCategory].toLowerCase()} individual untuk melihat detail laporan
              </p>
            </div>
          ) : !selectedUser ? (
          <div className="text-center py-12 px-4">
            <p className="text-gray-500 text-sm">
              Pilih {categoryLabel[selectedCategory].toLowerCase()} untuk melihat laporan
            </p>
          </div>
        ) : extendedTableData.length === 0 ? (
          <div className="text-center py-12 px-4">
            <p className="text-gray-500 text-sm">Tidak ada data pada periode ini</p>
          </div>
        ) : (
          /* Mobile Card View & Desktop Table */
          <>
            {/* Mobile View - Card Style */}
            <div className="block sm:hidden divide-y divide-gray-100">
              {extendedTableData.map((row: any) => {
                const masukTime = row.masuk ? new Date(row.masuk.created_at) : null;
                const pulangTime = row.pulang ? new Date(row.pulang.created_at) : null;
                const masukPhotoUrl = row.masuk?.photo_url || null;
                const pulangPhotoUrl = row.pulang?.photo_url || null;

                 const dateForCheck = typeof row.date === 'string' ? row.date : toLocalYMD(new Date(row.date));
                 let leavePermit = getLeavePermitForDate(selectedUser, dateForCheck);

                
                if (row.hasLeavePermit) {
                  leavePermit = {
                    id: 'permit-' + dateForCheck,
                    user_id: selectedUser,
                    permit_type: row.leavePermitType,
                    start_date: dateForCheck,
                    end_date: dateForCheck,
                    description: row.leavePermitDescription,
                    document_url: row.leavePermitUrl
                  };
                }

                // Check holiday
                const holiday = getHolidayForDate(dateForCheck);
                const isHoliday = row.isHoliday || holiday !== null;
                const holidayDesc = row.holidayDescription || holiday?.description;

                return (
                  <div key={row.date} className={`p-4 hover:bg-gray-50 ${isHoliday ? 'bg-red-50' : ''}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {formatDateLong(row.date)}
                      </span>
                      {isHoliday ? (
                        <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800">
                          Libur Nasional
                        </span>
                      ) : leavePermit ? (
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${permitTypeColors[leavePermit.permit_type]}`}>
                          {permitTypeLabels[leavePermit.permit_type]}
                        </span>
                      ) : (row.masuk || row.pulang) ? (
                        <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          Hadir
                        </span>
                      ) : null}
                    </div>
                    {isHoliday ? (
                      <div className="text-xs text-red-600 font-medium">
                        {holidayDesc}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">Masuk</span>
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium text-gray-900">
                              {formatTimeWIB(masukTime)}
                            </p>
                            {masukPhotoUrl && (
                              <a
                                href={masukPhotoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Lihat Bukti Masuk"
                              >
                                <Camera size={14} />
                              </a>
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Pulang</span>
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium text-gray-900">
                              {formatTimeWIB(pulangTime)}
                            </p>
                            {pulangPhotoUrl && (
                              <a
                                href={pulangPhotoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Lihat Bukti Pulang"
                              >
                                <Camera size={14} />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    {leavePermit?.document_url && !isHoliday && (
                      <a
                        href={leavePermit.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 font-medium"
                      >
                        <ExternalLink size={12} />
                        Lihat Surat
                      </a>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop View - Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider text-xs">
                  <tr>
                    <th className="px-4 py-3 font-medium">No</th>
                    <th className="px-4 py-3 font-medium">Tanggal</th>
                    <th className="px-4 py-3 font-medium">Jam Masuk</th>
                    <th className="px-4 py-3 font-medium">Jam Pulang</th>
                    <th className="px-4 py-3 font-medium">Keterangan</th>
                    <th className="px-4 py-3 font-medium">Bukti Surat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {extendedTableData.map((row: any, index: number) => {
                    const masukTime = row.masuk ? new Date(row.masuk.created_at) : null;
                    const pulangTime = row.pulang ? new Date(row.pulang.created_at) : null;
                    const masukPhotoUrl = row.masuk?.photo_url || null;
                    const pulangPhotoUrl = row.pulang?.photo_url || null;

           const dateForCheck = typeof row.date === 'string' ? row.date : toLocalYMD(new Date(row.date));
                    let leavePermit = getLeavePermitForDate(selectedUser, dateForCheck);
                    
                    if (row.hasLeavePermit) {
                      leavePermit = {
                        id: 'permit-' + dateForCheck,
                        user_id: selectedUser,
                        permit_type: row.leavePermitType,
                        start_date: dateForCheck,
                        end_date: dateForCheck,
                        description: row.leavePermitDescription,
                        document_url: row.leavePermitUrl
                      };
                    }

                    // Check holiday
                    const holiday = getHolidayForDate(dateForCheck);
                    const isHoliday = row.isHoliday || holiday !== null;
                    const holidayDesc = row.holidayDescription || holiday?.description;

                    return (
                      <tr key={row.date} className={`hover:bg-gray-50 ${isHoliday ? 'bg-red-50' : ''}`}>
                        <td className="px-4 py-3 text-gray-600">{index + 1}</td>
                        <td className="px-4 py-3 text-gray-900 font-medium">
                          {formatDateLong(row.date)}
                        </td>
                        <td className="px-4 py-3 text-gray-900">
                          {isHoliday ? (
                            <span className="text-gray-400">-</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span>{formatTimeWIB(masukTime)}</span>
                              {masukPhotoUrl && (
                                <a
                                  href={masukPhotoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                  title="Lihat Bukti Masuk"
                                >
                                  <Camera size={14} />
                                  <span>Bukti</span>
                                </a>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-900">
                          {isHoliday ? (
                            <span className="text-gray-400">-</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span>{formatTimeWIB(pulangTime)}</span>
                              {pulangPhotoUrl && (
                                <a
                                  href={pulangPhotoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                  title="Lihat Bukti Pulang"
                                >
                                  <Camera size={14} />
                                  <span>Bukti</span>
                                </a>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isHoliday ? (
                            <div className="flex flex-col">
                              <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800 w-fit">
                                Libur Nasional
                              </span>
                              <span className="text-xs text-red-600 mt-1">{holidayDesc}</span>
                            </div>
                          ) : leavePermit ? (
                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${permitTypeColors[leavePermit.permit_type]}`}>
                              {permitTypeLabels[leavePermit.permit_type]}
                            </span>
                          ) : (row.masuk || row.pulang) ? (
                            <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                              Hadir
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isHoliday ? (
                            <span className="text-gray-400 text-xs">-</span>
                          ) : leavePermit?.document_url ? (
                            <a
                              href={leavePermit.document_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium"
                            >
                              <ExternalLink size={12} />
                              Surat
                            </a>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}