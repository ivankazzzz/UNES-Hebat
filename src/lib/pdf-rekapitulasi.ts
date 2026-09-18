import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type PdfDocument = jsPDF & {
  lastAutoTable?: {
    finalY: number;
  };
};

interface UserStats {
  name: string;
  unitKerja: string;
  totalHariKerja: number;
  hadirPenuh: number;
  jumlahAbsenMasuk: number;
  jumlahAbsenPulang: number;
  tidakAbsenMasuk: number;
  tidakAbsenPulang: number;
  izinCutiDinasLuar: number;
  totalTidakMasuk: number;
  persentaseKehadiran: number;
}

interface RekapitulasiPdfOptions {
  categoryLabel: string;
  periodLabel: string;
  userStatsByUnitKerja: Record<string, { users: UserStats[] }>;
  selectedMonth: string;
  sundays: string[];
  holidays: Array<{ date: string; description: string }>;
  selectedCategory?: string;
}

// ============================================================================
// MASTER ORDER - DOSEN STRUKTURAL (SESUAI PERMINTAAN USER)
// Urutan unit kerja: Yayasan -> Rektorat -> FE -> FH -> FP -> FS -> FT -> Fisipol -> FKIP -> AAI -> LPPM -> LPM -> Lembaga Diklat KKN -> BKK -> UPT Perpustakaan
// ============================================================================
const STRUKTURAL_ORDER: Array<{ order: number; name: string; group: string }> = [
  // YAYASAN (1-2)
  { order: 1, name: 'Dr. Andi Syahrum Makkurade, M.Si', group: 'Yayasan' }, // Nama exact dari database
  { order: 2, name: 'Dr. JUSMITA WERIZA, S.Kom, M.Kom', group: 'Yayasan' },

  // REKTORAT (3-7)
  { order: 3, name: 'Prof. Dr. H. Sufyarma Marsidin, M.Pd', group: 'Rektorat' },
  { order: 4, name: 'Dr. Ir. Dewirman Prima Putra, M.Si', group: 'Rektorat' },
  { order: 5, name: 'Dr. Susi Delmiati, S.H, M.H', group: 'Rektorat' },
  { order: 6, name: 'Drs. M. Takdir Mattaliti, M.Si', group: 'Rektorat' },
  { order: 7, name: 'Dr. Slamet Riyadi, S.Pd.I, M.A.', group: 'Rektorat' },

  // FAKULTAS EKONOMI (8-12)
  { order: 8, name: 'Dr. Salfadri, S.E., M.Si', group: 'Fakultas Ekonomi' },
  { order: 9, name: 'Jhon Rinaldo, S.E., M.Si', group: 'Fakultas Ekonomi' },
  { order: 10, name: 'Dr. Nuraeni Dahri, S.Kom, M.Kom', group: 'Fakultas Ekonomi' },
  { order: 11, name: 'Meri Yani, S.E., M.Si, Ak, CA', group: 'Fakultas Ekonomi' },
  { order: 12, name: 'Dr. RICE HARYATI, S.E., M.Si', group: 'Fakultas Ekonomi' },

  // FAKULTAS HUKUM (13-19)
  { order: 13, name: 'Dr. FITRIATI, S.H, M.H', group: 'Fakultas Hukum' },
  { order: 14, name: 'Dr. Bisma Putra Pratama, S.H., M.H', group: 'Fakultas Hukum' },
  { order: 15, name: 'Dr. Iyah Faniyah, S.H, M.Hum', group: 'Fakultas Hukum' },
  { order: 16, name: 'Dr. NENI VESNA MADJID, S.H., M.H', group: 'Fakultas Hukum' },
  { order: 17, name: 'Netrivianti, S.H., M.H', group: 'Fakultas Hukum' },
  { order: 18, name: 'Dora Tiara, S.H., M.H', group: 'Fakultas Hukum' },
  { order: 19, name: 'Alam Suryo Laksono, S.H., M.H', group: 'Fakultas Hukum' },

  // FAKULTAS PERTANIAN (20-24)
  { order: 20, name: 'Ir. Mahmud, M.Si', group: 'Fakultas Pertanian' },
  { order: 21, name: 'EDDWINA AIDILA FITRIA, S.TP, M.Si', group: 'Fakultas Pertanian' },
  { order: 22, name: 'Meriati, S.P, M.P', group: 'Fakultas Pertanian' },
  { order: 23, name: 'Wawan Sumarno, S.P, M.Si', group: 'Fakultas Pertanian' },
  { order: 24, name: 'Rera Aga Salihat, S.Si, M.Si', group: 'Fakultas Pertanian' },

  // FAKULTAS SASTRA (25-26)
  { order: 25, name: 'Dr. Mac Aditiawarman, M.Hum', group: 'Fakultas Sastra' },
  { order: 26, name: 'Drs. Raflis, M.Hum', group: 'Fakultas Sastra' },

  // FAKULTAS TEKNIK (27-34)
  { order: 27, name: 'Drs. Risal Abu, S.T, M.Eng', group: 'Fakultas Teknik' },
  { order: 28, name: 'Dr. Irnawati Siregar, M.Pd.T', group: 'Fakultas Teknik' },
  { order: 29, name: 'Dr. Nazili, S.T, M.T', group: 'Fakultas Teknik' },
  { order: 30, name: 'Ir. Irmayani, M.T', group: 'Fakultas Teknik' },
  { order: 31, name: 'Ir. Mukhnizar, M.T', group: 'Fakultas Teknik' },
  { order: 32, name: 'Rosnita Rauf, S.T, M.T', group: 'Fakultas Teknik' },
  { order: 33, name: 'ROBBY HOTTER, S.T, M.T', group: 'Fakultas Teknik' },
  { order: 34, name: 'Merry Thressia, S.Si, M.Si', group: 'Fakultas Teknik' },

  // FISIPOL (35-39)
  { order: 35, name: 'Drs. TARMA SARTIMA, M.Si, Ph.D', group: 'Fisipol' },
  { order: 36, name: 'Annisa Fitri, S.Sos, M.AP', group: 'Fisipol' },
  { order: 37, name: 'Doddie Arya Kusuma B, S.Sos, M.Si', group: 'Fisipol' },
  { order: 38, name: 'Dr. Sumartono, M.Si', group: 'Fisipol' },
  { order: 39, name: 'Puryanto, S.A.P, M.A.P', group: 'Fisipol' },

  // FKIP (40-44)
  { order: 40, name: 'Dr. Feby Meuthia Yusuf, M.Pd', group: 'FKIP' },
  { order: 41, name: 'DWI MUTIA CHAN, S.Pd, M.Pd', group: 'FKIP' },
  { order: 42, name: 'KHURNIA BUDI UTAMI, S.Pd, M.Pd', group: 'FKIP' },
  { order: 43, name: 'RENI RESPITA, S.Pd, M.Pd.E', group: 'FKIP' },
  { order: 44, name: 'Yessy Marzona, S.Pd, M.Pd', group: 'FKIP' },

  // AAI (45-46)
  { order: 45, name: 'Desmiwerita, S.E., M.Si', group: 'AAI' },
  { order: 46, name: 'Dr. Yuli Ardiany, S.E., M.Si, C.Atr', group: 'AAI' },

  // LPPM (47-49)
  { order: 47, name: 'Prof. Dr. Ir. I Ketut Budaraga, M.Si', group: 'LPPM' },
  { order: 48, name: 'HARRY SETYA HADI, S.Kom, M.Kom', group: 'LPPM' },
  { order: 49, name: 'Rera Agung Syukra, S.Si, M.Si', group: 'LPPM' },

  // LPM (50-51)
  { order: 50, name: 'Adrian Fadhli, S.Pd, M.T', group: 'LPM' },
  { order: 51, name: 'Budiman, S.T, M.T', group: 'LPM' },

  // Lembaga Diklat, KKN (52-53)
  { order: 52, name: 'Prof. Dr. H. Agussalim M, S.E, M.S. MCE.', group: 'Lembaga Diklat, KKN' },
  { order: 53, name: 'Dian Wahyuni Dewi Fitri, S.T, M.T', group: 'Lembaga Diklat, KKN' },

  // BKK (54)
  { order: 54, name: 'Dr. Susi Yuliastanty, S.Pd, M.M', group: 'BKK' },

  // UPT Perpustakaan (Struktural) (55)
  { order: 55, name: 'YUMI ARIYATI, S.Sos, M.I.Kom', group: 'UPT Perpustakaan (Struktural)' },
];

// Urutan group yang tetap (sesuai permintaan user)
const GROUP_ORDER = [
  'Yayasan',
  'Rektorat',
  'Fakultas Ekonomi',
  'Fakultas Hukum',
  'Fakultas Pertanian',
  'Fakultas Sastra',
  'Fakultas Teknik',
  'Fisipol',
  'FKIP',
  'AAI',
  'LPPM',
  'LPM',
  'Lembaga Diklat, KKN',
  'BKK',
  'UPT Perpustakaan (Struktural)',
];

// Build lookup map for quick access
const ORDER_MAP = new Map<string, { order: number; group: string }>();
STRUKTURAL_ORDER.forEach(item => {
  ORDER_MAP.set(item.name, { order: item.order, group: item.group });
});

// Fungsi untuk mendapatkan data dari Supabase
async function fetchStrukturalUsersFromSupabase(): Promise<Array<{ id: string; full_name: string; unit_kerja: string; sort_order?: number | null }>> {
  const { createClient } = await import('@supabase/supabase-js');
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase credentials not found');
    return [];
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, unit_kerja, sort_order')
    .eq('is_struktural', true)
    .not('full_name', 'is', null);

  if (error) {
    console.error('Error fetching struktural users:', error);
    return [];
  }

  return data.map(user => ({
    id: user.id,
    full_name: user.full_name || '',
    unit_kerja: user.unit_kerja || '',
    sort_order: user.sort_order
  }));
}

// Fungsi fuzzy match untuk mencocokkan nama Supabase dengan MASTER ORDER
function findBestMatch(supabaseName: string, group: string): { order: number; group: string } | null {
  const normalizedSupabase = supabaseName.toLowerCase().replace(/\s+/g, ' ').replace(/\./g, '').trim();

  // First try exact match (with and without dots)
  const exactMatch = ORDER_MAP.get(supabaseName);
  if (exactMatch && exactMatch.group === group) {
    return exactMatch;
  }

  // Try exact match without dots
  const exactMatchNoDots = ORDER_MAP.get(supabaseName.replace(/\./g, ''));
  if (exactMatchNoDots && exactMatchNoDots.group === group) {
    return exactMatchNoDots;
  }

  // Try matching by order number in the name (e.g., "Dr.")
  for (const [name, info] of ORDER_MAP) {
    if (info.group !== group) continue;

    const normalizedName = name.toLowerCase().replace(/\s+/g, ' ').replace(/\./g, '').trim();

    // Check if Supabase name contains key parts of the master name
    const masterParts = normalizedName.split(' ');
    const supabaseParts = normalizedSupabase.split(' ');

    let matchCount = 0;
    for (const masterPart of masterParts) {
      if (masterPart.length < 3) continue; // Skip short parts like "M", "S", etc.
      if (supabaseParts.some(sp => sp.includes(masterPart) || masterPart.includes(sp))) {
        matchCount++;
      }
    }

    // If majority of parts match, consider it a match
    if (matchCount >= Math.ceil(masterParts.length * 0.6)) {
      return info;
    }
  }

  return null;
}

// Fungsi utama untuk mengorganisir data Supabase sesuai urutan yang diinginkan
async function organizeStrukturalDataForPDF(): Promise<Map<string, Array<{ id: string; full_name: string; unit_kerja: string; order: number }>>> {
  const users = await fetchStrukturalUsersFromSupabase();
  const result = new Map<string, Array<{ id: string; full_name: string; unit_kerja: string; order: number }>>();

  // Initialize all groups
  GROUP_ORDER.forEach(group => {
    result.set(group, []);
  });

  // Classify each user to their group
  for (const user of users) {
    const unitKerja = user.unit_kerja.toLowerCase();
    let group: string | null = null;

    // Determine group based on unit_kerja keywords
    if (unitKerja.includes('yayasan') || unitKerja.includes('yptp') || unitKerja.includes('sekretaris yptp')) {
      group = 'Yayasan';
    } else if (
      unitKerja.includes('rektor') ||
      unitKerja.includes('wr i') ||
      unitKerja.includes('wr ii') ||
      unitKerja.includes('wr iii') ||
      unitKerja.includes('staf ahli wr')
    ) {
      group = 'Rektorat';
    } else if (
      unitKerja.includes('fak. ekonomi') ||
      unitKerja.includes('manajemen') ||
      unitKerja.includes('akuntansi') ||
      (unitKerja.includes('ekonomi') && !unitKerja.includes('fe'))
    ) {
      group = 'Fakultas Ekonomi';
    } else if (
      unitKerja.includes('fak. hukum') ||
      unitKerja.includes('ilmu hukum') ||
      unitKerja.includes('pasca')
    ) {
      group = 'Fakultas Hukum';
    } else if (
      unitKerja.includes('fak. pertanian') ||
      unitKerja.includes('agribisnis') ||
      unitKerja.includes('agroteknologi') ||
      unitKerja.includes('thp')
    ) {
      group = 'Fakultas Pertanian';
    } else if (
      unitKerja.includes('fak. sastra') ||
      unitKerja.includes('sastra inggris')
    ) {
      group = 'Fakultas Sastra';
    } else if (
      unitKerja.includes('fak. teknik') ||
      unitKerja.includes('fak.teknik') ||
      unitKerja.includes('teknik') ||
      unitKerja.includes('arsitektur')
    ) {
      group = 'Fakultas Teknik';
    } else if (
      unitKerja.includes('fisipol') ||
      unitKerja.includes('adm negara') ||
      unitKerja.includes('pemerintahan') ||
      unitKerja.includes('komunikasi')
    ) {
      group = 'Fisipol';
    } else if (
      unitKerja.includes('fkip') ||
      unitKerja.includes('pend.') ||
      unitKerja.includes('fk ip')
    ) {
      group = 'FKIP';
    } else if (
      unitKerja.includes('aai') ||
      unitKerja.includes('akademi akuntansi')
    ) {
      group = 'AAI';
    } else if (
      unitKerja.includes('d iii mik') ||
      unitKerja.includes('d3 mik') ||
      unitKerja.includes('diii mik')
    ) {
      group = 'D III MIK';
    }

    if (group) {
      // Use sort_order from database if available, otherwise use MASTER ORDER
      let order = 999;
      
      // First try to use sort_order from database
      if (user.sort_order !== null && user.sort_order !== undefined) {
        order = user.sort_order;
      } else {
        // Fallback to MASTER ORDER
        const matchInfo = findBestMatch(user.full_name, group);
        order = matchInfo?.order || 999;
      }

      const existingList = result.get(group) || [];
      existingList.push({
        id: user.id,
        full_name: user.full_name,
        unit_kerja: user.unit_kerja,
        order
      });
      result.set(group, existingList);
    }
  }

  // Sort each group by order
  for (const group of GROUP_ORDER) {
    const list = result.get(group) || [];
    list.sort((a, b) => a.order - b.order);
    result.set(group, list);
  }

  return result;
}

export async function buildRekapitulasiPDF(options: RekapitulasiPdfOptions): Promise<jsPDF> {
  const { categoryLabel, periodLabel, userStatsByUnitKerja, selectedMonth, sundays, holidays, selectedCategory } = options;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' }) as PdfDocument;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 40;
  const lineHeight = 20;

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

  // Draw header
  const headerTopY = 36;
  let currentY = headerTopY;

  if (logoData) {
    doc.addImage(logoData, 'PNG', marginX, headerTopY - 10, 60, 60);
  }

  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.text('YAYASAN PERGURUAN TINGGI PADANG', pageWidth / 2, currentY, { align: 'center' });
  currentY += 22;

  doc.setFontSize(16);
  doc.text('UNIVERSITAS EKASAKTI', pageWidth / 2, currentY, { align: 'center' });
  currentY += 24;

  doc.setFont('times', 'normal');
  doc.setFontSize(12);
  doc.text('Jl. Veteran Dalam No. 26 Padang (25113) Telp. (0751) 28859-26770', pageWidth / 2, currentY, { align: 'center' });
  currentY += 18;
  doc.text('Fax. (0751) 32694; https://unespadang.ac.id/', pageWidth / 2, currentY, { align: 'center' });
  currentY += 18;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(1);
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  currentY += 22;

  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.text(`LAPORAN REKAPITULASI KEHADIRAN ${categoryLabel.toUpperCase()}`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 24;

  doc.setFont('times', 'normal');
  doc.setFontSize(14);
  doc.text(`Periode: ${periodLabel}`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 28;

  const isDosenStruktural = selectedCategory === 'dosen_struktural' || categoryLabel.toLowerCase().includes('dosen struktural');

  // Common table settings
  const tableWidth = 762;
  const startX = (pageWidth - tableWidth) / 2;
  const rowHeight = 22;
  const unitHeaderHeight = 26;
  const bottomMargin = 40;
  
  const commonStyles = {
    font: 'times' as const,
    fontSize: 11,
    cellPadding: 3,
    textColor: [0, 0, 0] as [number, number, number],
    lineColor: [0, 0, 0] as [number, number, number],
    lineWidth: 0.5,
    halign: 'center' as const,
    valign: 'middle' as const,
    overflow: 'linebreak' as const,
  };

  const columnStyles = {
    0: { cellWidth: 32, halign: 'center' as const },
    1: { cellWidth: 200, halign: 'left' as const },
    2: { cellWidth: 50, halign: 'center' as const },
    3: { cellWidth: 55, halign: 'center' as const },
    4: { cellWidth: 55, halign: 'center' as const },
    5: { cellWidth: 55, halign: 'center' as const },
    6: { cellWidth: 55, halign: 'center' as const },
    7: { cellWidth: 80, halign: 'center' as const },
    8: { cellWidth: 90, halign: 'center' as const },
    9: { cellWidth: 90, halign: 'center' as const },
  };

  // Kumpulkan SEMUA user stats ke dalam satu flat array
  const allUserStats: UserStats[] = [];
  Object.values(userStatsByUnitKerja).forEach(unitData => {
    allUserStats.push(...unitData.users);
  });

  // Buat lookup map dari nama ke stats
  const statsMap = new Map<string, UserStats>();
  allUserStats.forEach(stats => {
    statsMap.set(stats.name, stats);
  });

  let isFirstTable = true;
  let rowNumber = 1;

  if (isDosenStruktural) {
    // =========================================================================
    // PENDEKATAN BARU: Fetch dari Supabase danurutkan sesuai urutan user
    // =========================================================================

    // Fetch data struktural dari Supabase
    const organizedData = await organizeStrukturalDataForPDF();

    for (const groupName of GROUP_ORDER) {
      // Ambil data user dari Supabase yang sudah diorganisir
      const peopleInGroup = organizedData.get(groupName) || [];

      // Filter hanya yang ada datanya (cocokkan dengan statsMap)
      const peopleWithData = peopleInGroup.filter(p => {
        // Coba cari stats dengan nama lengkap dari Supabase
        if (statsMap.has(p.full_name)) return true;
        // Coba cari dengan nama dari MASTER ORDER jika ada perbedaan format
        return Array.from(statsMap.keys()).some(supabaseName => {
          const normalizedSupabase = supabaseName.toLowerCase().replace(/\s+/g, ' ').replace(/\./g, '').trim();
          const normalizedPerson = p.full_name.toLowerCase().replace(/\s+/g, ' ').replace(/\./g, '').trim();
          return normalizedSupabase === normalizedPerson;
        });
      });

      if (peopleWithData.length === 0) continue;

      // Calculate space needed
      const minSpaceNeeded = unitHeaderHeight + rowHeight * Math.min(peopleWithData.length, 2);
      const remainingSpace = pageHeight - currentY - bottomMargin;

      if (!isFirstTable && remainingSpace < minSpaceNeeded) {
        doc.addPage();
        currentY = 50;

        doc.setFont('times', 'bold');
        doc.setFontSize(12);
        doc.text(`LAPORAN REKAPITULASI KEHADIRAN ${categoryLabel.toUpperCase()} (Lanjutan)`, pageWidth / 2, 25, { align: 'center' });
        doc.setFont('times', 'normal');
        doc.setFontSize(10);
        doc.text(`Periode: ${periodLabel}`, pageWidth / 2, 38, { align: 'center' });
      }

      // Build table data untuk group ini
      const unitTableData: any[] = [];

      // Group header
      unitTableData.push([
        {
          content: groupName.toUpperCase(),
          colSpan: 10,
          styles: { fontStyle: 'bold', fillColor: [220, 220, 220], halign: 'left', fontSize: 11 }
        }
      ]);

      // Tambahkan setiap orang SESUAI URUTAN DARI SUPABASE (sudah diurutkan sesuai ORDER)
      for (const person of peopleWithData) {
        // Cari stats - prioritaskan nama Supabase
        let stats = statsMap.get(person.full_name);

        // Jika tidak ketemu, coba cari dengan nama yang sudah dinormalisasi
        if (!stats) {
          for (const [supabaseName, supabaseStats] of statsMap.entries()) {
            const normalizedSupabase = supabaseName.toLowerCase().replace(/\s+/g, ' ').replace(/\./g, '').trim();
            const normalizedPerson = person.full_name.toLowerCase().replace(/\s+/g, ' ').replace(/\./g, '').trim();
            if (normalizedSupabase === normalizedPerson) {
              stats = supabaseStats;
              break;
            }
          }
        }

        if (stats) {
          unitTableData.push([
            rowNumber++,
            stats.name,
            stats.totalHariKerja,
            stats.jumlahAbsenMasuk,
            stats.jumlahAbsenPulang,
            stats.tidakAbsenMasuk,
            stats.tidakAbsenPulang,
            stats.izinCutiDinasLuar,
            stats.totalTidakMasuk,
            `${stats.persentaseKehadiran}%`
          ]);
        }
      }

      // Draw table
      autoTable(doc, {
        head: isFirstTable ? [[
          'No',
          'Nama Pegawai',
          'Hari\nKerja',
          'Absen\nMasuk',
          'Absen\nPulang',
          'Tidak\nMasuk',
          'Tidak\nPulang',
          'Izin/Cuti\n/Dinas',
          'Total\nTdk Masuk',
          'Kehadiran\n(%)'
        ]] : [],
        body: unitTableData,
        startY: currentY,
        margin: { left: startX, right: startX, top: 50, bottom: bottomMargin },
        tableWidth: tableWidth,
        showHead: isFirstTable ? 'firstPage' : false,
        styles: commonStyles,
        headStyles: {
          font: 'times',
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          lineWidth: 0.5,
          fontSize: 11,
          halign: 'center',
          valign: 'middle',
          fontStyle: 'bold',
          minCellHeight: 30,
        },
        columnStyles: columnStyles,
        didParseCell(data) {
          if (Array.isArray(data.row.raw) && data.row.raw.length === 1) {
            data.cell.styles.fontSize = 11;
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.minCellHeight = 24;
          }
        },
      });

      currentY = doc.lastAutoTable?.finalY ?? currentY + 20;
      isFirstTable = false;
    }
  } else {
    // Non-dosen struktural: gunakan logic lama (sort by unit kerja name)
    const sortedUnitKerja = Object.keys(userStatsByUnitKerja).sort((a, b) => a.localeCompare(b));

    for (const unitKerja of sortedUnitKerja) {
      const unitData = userStatsByUnitKerja[unitKerja];
      const sortedUsers = unitData.users.sort((a, b) => a.name.localeCompare(b.name));

      const minSpaceNeeded = unitHeaderHeight + rowHeight * Math.min(sortedUsers.length, 2);
      const remainingSpace = pageHeight - currentY - bottomMargin;

      if (!isFirstTable && remainingSpace < minSpaceNeeded) {
        doc.addPage();
        currentY = 50;
        
        doc.setFont('times', 'bold');
        doc.setFontSize(12);
        doc.text(`LAPORAN REKAPITULASI KEHADIRAN ${categoryLabel.toUpperCase()} (Lanjutan)`, pageWidth / 2, 25, { align: 'center' });
        doc.setFont('times', 'normal');
        doc.setFontSize(10);
        doc.text(`Periode: ${periodLabel}`, pageWidth / 2, 38, { align: 'center' });
      }

      const unitTableData: any[] = [];
      
      unitTableData.push([
        {
          content: unitKerja.toUpperCase(),
          colSpan: 10,
          styles: { fontStyle: 'bold', fillColor: [220, 220, 220], halign: 'left', fontSize: 11 }
        }
      ]);

      sortedUsers.forEach(user => {
        unitTableData.push([
          rowNumber++,
          user.name,
          user.totalHariKerja,
          user.jumlahAbsenMasuk,
          user.jumlahAbsenPulang,
          user.tidakAbsenMasuk,
          user.tidakAbsenPulang,
          user.izinCutiDinasLuar,
          user.totalTidakMasuk,
          `${user.persentaseKehadiran}%`
        ]);
      });

      autoTable(doc, {
        head: isFirstTable ? [[
          'No',
          'Nama Pegawai',
          'Hari\nKerja',
          'Absen\nMasuk',
          'Absen\nPulang',
          'Tidak\nMasuk',
          'Tidak\nPulang',
          'Izin/Cuti\n/Dinas',
          'Total\nTdk Masuk',
          'Kehadiran\n(%)'
        ]] : [],
        body: unitTableData,
        startY: currentY,
        margin: { left: startX, right: startX, top: 50, bottom: bottomMargin },
        tableWidth: tableWidth,
        showHead: isFirstTable ? 'firstPage' : false,
        styles: commonStyles,
        headStyles: {
          font: 'times',
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          lineWidth: 0.5,
          fontSize: 11,
          halign: 'center',
          valign: 'middle',
          fontStyle: 'bold',
          minCellHeight: 30,
        },
        columnStyles: columnStyles,
        didParseCell(data) {
          if (Array.isArray(data.row.raw) && data.row.raw.length === 1) {
            data.cell.styles.fontSize = 11;
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.minCellHeight = 24;
          }
        },
      });

      currentY = doc.lastAutoTable?.finalY ?? currentY + 20;
      isFirstTable = false;
    }
  }

  // Calculate grand totals
  const grandTotalHariKerja = allUserStats.reduce((sum, u) => sum + u.totalHariKerja, 0);
  const grandJumlahAbsenMasuk = allUserStats.reduce((sum, u) => sum + u.jumlahAbsenMasuk, 0);
  const grandJumlahAbsenPulang = allUserStats.reduce((sum, u) => sum + u.jumlahAbsenPulang, 0);
  const grandTidakAbsenMasuk = allUserStats.reduce((sum, u) => sum + u.tidakAbsenMasuk, 0);
  const grandTidakAbsenPulang = allUserStats.reduce((sum, u) => sum + u.tidakAbsenPulang, 0);
  const grandIzinCutiDinasLuar = allUserStats.reduce((sum, u) => sum + u.izinCutiDinasLuar, 0);
  const grandTotalTidakMasuk = allUserStats.reduce((sum, u) => sum + u.totalTidakMasuk, 0);
  const grandAvgPersentase = allUserStats.length > 0
    ? Math.round(allUserStats.reduce((sum, u) => sum + u.persentaseKehadiran, 0) / allUserStats.length)
    : 0;

  // Check if grand total fits on current page
  const grandTotalSpace = rowHeight + 10;
  if (pageHeight - currentY - bottomMargin < grandTotalSpace) {
    doc.addPage();
    currentY = 50;
  }

  // Add grand total table
  autoTable(doc, {
    body: [[
      {
        content: 'TOTAL KESELURUHAN',
        colSpan: 2,
        styles: { fontStyle: 'bold', fillColor: [200, 200, 200], halign: 'right' }
      },
      grandTotalHariKerja,
      grandJumlahAbsenMasuk,
      grandJumlahAbsenPulang,
      grandTidakAbsenMasuk,
      grandTidakAbsenPulang,
      grandIzinCutiDinasLuar,
      grandTotalTidakMasuk,
      `${grandAvgPersentase}%`
    ]],
    startY: currentY,
    margin: { left: startX, right: startX },
    tableWidth: tableWidth,
    styles: commonStyles,
    columnStyles: columnStyles,
  });

  const finalY = doc.lastAutoTable?.finalY ?? currentY + 40;
  
  // Add explanation section on a new page
  doc.addPage();
  let explainY = 60;
  
  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.text('PENJELASAN PERHITUNGAN HARI KERJA', pageWidth / 2, explainY, { align: 'center' });
  explainY += 30;
  
  // Parse month details
  const [year, month] = selectedMonth.split('-').map(Number);
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const monthName = monthNames[month - 1];
  const daysInMonth = new Date(year, month, 0).getDate();
  
  // Calculate working days
  const totalSundays = sundays.length;
  const totalHolidays = holidays.length;
  const totalWorkingDays = daysInMonth - totalSundays - totalHolidays;
  
  doc.setFont('times', 'normal');
  doc.setFontSize(12);
  
  // Main explanation
  const mainText = `Bulan ${monthName} ${year} memiliki ${daysInMonth} hari kalender.`;
  doc.text(mainText, marginX, explainY);
  explainY += lineHeight;
  
  doc.text(`Total hari kerja efektif dalam periode ini adalah ${totalWorkingDays} hari.`, marginX, explainY);
  explainY += lineHeight * 1.5;
  
  // Breakdown section
  doc.setFont('times', 'bold');
  doc.text('Rincian Perhitungan:', marginX, explainY);
  explainY += lineHeight;
  
  doc.setFont('times', 'normal');
  doc.text(`• Total hari dalam bulan: ${daysInMonth} hari`, marginX + 20, explainY);
  explainY += lineHeight;
  
  doc.text(`• Hari Minggu: ${totalSundays} hari`, marginX + 20, explainY);
  explainY += lineHeight;
  
  // List Sundays
  if (sundays.length > 0) {
    const sundayDates = sundays.map(dateStr => {
      const d = new Date(dateStr + 'T00:00:00');
      return d.getDate();
    }).sort((a, b) => a - b);
    
    const sundayText = `  Tanggal: ${sundayDates.join(', ')}`;
    doc.setFontSize(11);
    doc.text(sundayText, marginX + 40, explainY);
    doc.setFontSize(12);
    explainY += lineHeight;
  }
  
  doc.text(`• Libur Nasional: ${totalHolidays} hari`, marginX + 20, explainY);
  explainY += lineHeight;
  
  // List holidays
  if (holidays.length > 0) {
    holidays.forEach(holiday => {
      const holidayDate = new Date(holiday.date + 'T00:00:00');
      const dateNum = holidayDate.getDate();
      const holidayText = `  ${dateNum} ${monthName}: ${holiday.description}`;
      doc.setFontSize(11);
      doc.text(holidayText, marginX + 40, explainY);
      doc.setFontSize(12);
      explainY += lineHeight;
    });
  }
  
  explainY += lineHeight * 0.5;
  doc.setFont('times', 'bold');
  doc.text(`• Total Hari Kerja: ${daysInMonth} - ${totalSundays} - ${totalHolidays} = ${totalWorkingDays} hari`, marginX + 20, explainY);
  explainY += lineHeight * 2;
  
  // Additional notes
  doc.setFont('times', 'italic');
  doc.setFontSize(11);
  doc.text('Catatan:', marginX, explainY);
  explainY += lineHeight;
  doc.text('- Perhitungan kehadiran hanya berdasarkan hari kerja efektif (tidak termasuk Minggu dan libur nasional)', marginX + 20, explainY);
  explainY += lineHeight;
  doc.text('- Persentase kehadiran dihitung dari: (Jumlah Absen Masuk dan Pulang / Total Hari Kerja) x 100%', marginX + 20, explainY);
  
  // Add signature section on explanation page
  const signatureYPos = explainY + 40;

  // Check if we need a new page for signature
  if (signatureYPos + 100 > pageHeight - 36) {
    doc.addPage();
    const newSignatureY = 60;
    
    doc.setFont('times', 'normal');
    doc.setFontSize(11);
    doc.text(`Padang, ${new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })}`, pageWidth - 220, newSignatureY);

    doc.text('Wakil Rektor 2', pageWidth - 220, newSignatureY + lineHeight);
    doc.text('Dr. Susi Delmiati S.H, M.H', pageWidth - 220, newSignatureY + lineHeight * 4);
    doc.text('NUPTK: 6753747648230140', pageWidth - 220, newSignatureY + lineHeight * 5);
  } else {
    doc.setFont('times', 'normal');
    doc.setFontSize(11);
    doc.text(`Padang, ${new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })}`, pageWidth - 220, signatureYPos);

    doc.text('Wakil Rektor 2', pageWidth - 220, signatureYPos + lineHeight);
    doc.text('Dr. Susi Delmiati S.H, M.H', pageWidth - 220, signatureYPos + lineHeight * 4);
    doc.text('NUPTK: 6753747648230140', pageWidth - 220, signatureYPos + lineHeight * 5);
  }

  return doc;
}
