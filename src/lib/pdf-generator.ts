import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

type AutoTableDoc = jsPDF & {
  lastAutoTable?: {
    finalY: number;
  };
};

interface AttendanceData {
  user: {
    full_name: string;
  };
  date: string;
  masuk: {
    created_at: string;
    status: string;
    note?: string;
  } | null;
  pulang: {
    created_at: string;
    status: string;
    note?: string;
  } | null;
}

export const generatePDFReport = (data: AttendanceData[], filterDate?: string) => {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  
  // Header
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Logo (jika ada)
  // doc.addImage('logo-path', 'PNG', 14, 10, 20, 20);
  
  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('UNIVERSITAS EKASAKTI', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(14);
  doc.text('REKAP KEHADIRAN PEGAWAI', pageWidth / 2, 28, { align: 'center' });
  
  // Filter info
  if (filterDate) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const dateStr = new Date(filterDate).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    doc.text(`Tanggal: ${dateStr}`, pageWidth / 2, 35, { align: 'center' });
  }
  
  // Prepare table data
  const tableData = data.map((row, index) => {
    const masukTime = row.masuk 
      ? new Date(row.masuk.created_at).toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit'
        })
      : '-';
    
    const pulangTime = row.pulang
      ? new Date(row.pulang.created_at).toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit'
        })
      : '-';
    
    const masukStatus = row.masuk
      ? 'Hadir'
      : '-';
    
    const pulangStatus = row.pulang
      ? (row.pulang.status === 'kurang_jam' ? 'Kurang Jam' : 'Lengkap')
      : '-';
    
    const dateLocal = new Date(row.date);

    const dayName = dateLocal.toLocaleDateString('id-ID', {
      weekday: 'long'
    });

    const dateFormatted = dateLocal.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    
    // Calculate work hours
    let totalHours = '-';
    if (row.masuk && row.pulang) {
      const masukDate = new Date(row.masuk.created_at);
      const pulangDate = new Date(row.pulang.created_at);
      const hours = ((pulangDate.getTime() - masukDate.getTime()) / (1000 * 60 * 60)).toFixed(1);
      totalHours = `${hours} jam`;
    }
    
    return [
      index + 1,
      row.user?.full_name || '-',
      dayName,
      dateFormatted,
      `${masukTime}`,
      masukStatus,
      `${pulangTime}`,
      pulangStatus,
      totalHours
    ];
  });
  
  // Calculate table width and center margin
  const tableWidth = 10 + 60 + 25 + 30 + 30 + 30 + 30 + 30 + 25; // Total column widths = 270
  const horizontalMargin = (pageWidth - tableWidth) / 2;
  
  // Generate table
  autoTable(doc, {
    startY: filterDate ? 40 : 35,
    head: [[
      'No',
      'Nama Tendik',
      'Hari',
      'Tanggal',
      'Jam Masuk',
      'Status Masuk',
      'Jam Pulang',
      'Status Pulang',
      'Total Jam'
    ]],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 10
    },
    bodyStyles: {
      fontSize: 9,
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },  // No
      1: { cellWidth: 60, halign: 'left' },    // Nama
      2: { cellWidth: 25, halign: 'center' },  // Hari
      3: { cellWidth: 30, halign: 'center' },  // Tanggal
      4: { cellWidth: 30, halign: 'center' },  // Jam Masuk
      5: { cellWidth: 30, halign: 'center' },  // Status Masuk
      6: { cellWidth: 30, halign: 'center' },  // Jam Pulang
      7: { cellWidth: 30, halign: 'center' },  // Status Pulang
      8: { cellWidth: 25, halign: 'center' }   // Total Jam
    },
    margin: { left: horizontalMargin, right: horizontalMargin },
    tableWidth: tableWidth,
    didDrawPage: (data) => {
      // Footer with page number
       const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
      const currentPage = (doc as unknown as { internal: { getCurrentPageInfo: () => { pageNumber: number } } }).internal.getCurrentPageInfo().pageNumber;
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Halaman ${currentPage} dari ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }
  });
  
  // Signature section
  const finalY = (doc as AutoTableDoc).lastAutoTable?.finalY ? (doc as AutoTableDoc).lastAutoTable!.finalY + 15 : 55;
  const rightX = pageWidth - 60;
  
  doc.setFontSize(10);
  doc.text('Padang, ' + new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }), rightX, finalY);
  
  doc.text('Wakil Rektor II,', rightX, finalY + 7);
  doc.text('Dr. Susi Delmiati S.H, M.H', rightX, finalY + 35);
  
  // Save PDF
  const filename = filterDate 
    ? `Rekap_Kehadiran_${filterDate}.pdf`
    : `Rekap_Kehadiran_${new Date().toISOString().split('T')[0]}.pdf`;
  
  doc.save(filename);
};

// Data struktural untuk PDF
interface StrukturalAccount {
  no: number;
  nama: string;
  unitKerja: string;
  username: string;
  password: string;
}

const strukturalAccounts: StrukturalAccount[] = [
  { no: 1, nama: "Dr JUSMITA WERIZA, S.Kom, M.Kom", unitKerja: "Sekretaris YPTP & Dosen NIDN D III MIK", username: "jusmita.weriza", password: "12345678" },
  { no: 2, nama: "Prof. Dr. H. Sufyarma Marsidin, M.Pd", unitKerja: "Rektor", username: "sufyarma.marsidin", password: "12345678" },
  { no: 3, nama: "Dr. Ir. Dewirman Prima Putra, M.Si", unitKerja: "Wakil Rektor I & Dosen PNS Agroteknologi", username: "dewirman.prima.putra", password: "12345678" },
  { no: 4, nama: "WR2 - Dr. Susi Delmiati, S.H, M.H", unitKerja: "Wakil Rektor II & Dosen NIDN Ilmu Hukum", username: "warek2", password: "12345678" },
  { no: 5, nama: "Drs. M. Takdir Mattaliti, M.Si", unitKerja: "Wakil Rektor III & Dosen NIDN I. Adm Negara", username: "takdir.mattaliti", password: "12345678" },
  { no: 6, nama: "Dr Slamet Riyadi, S.Pd.I, M.A.", unitKerja: "Staf Ahli WR I & Dosen NIDN T. Elektro", username: "slamet.riyadi", password: "12345678" },
  { no: 7, nama: "Dr. Salfadri, S.E., M.Si", unitKerja: "Dekan Fak. Ekonomi & Dosen PNS dpk Manajemen", username: "salfadri", password: "12345678" },
  { no: 8, nama: "Jhon Rinaldo, S.E., M.Si", unitKerja: "Wadek Fak. Ekonomi & Dosen PNS dpk Manajemen", username: "jhon.rinaldo", password: "12345678" },
  { no: 9, nama: "Prof. Dr H. Agussalim M, S.E, M.S. MCE.", unitKerja: "Ka. Prodi Manajemen & Dosen NIDN Manajemen", username: "h.agussalim", password: "12345678" },
  { no: 10, nama: "Dr RICE HARYATI, S.E., M.Si", unitKerja: "Ka. GPM Fak. Ekonomi & Dosen NIDN Manajemen", username: "dr.rice.haryati", password: "12345678" },
  { no: 11, nama: "Dr Susi Yuliastanty, S.Pd, M.M", unitKerja: "Ka. BKK & Dosen NIDN Manajemen", username: "susi.yuliastanty", password: "12345678" },
  { no: 12, nama: "Dr FITRIATI, S.H, M.H", unitKerja: "Dekan Fak. Hukum & Dosen PNS dpk Ilmu Hukum S2", username: "dr.fitriati", password: "12345678" },
  { no: 13, nama: "Dr Bisma Putra Pratama, S.H., M.H", unitKerja: "Wadek Fak. Hukum & Dosen NIDN Ilmu Hukum S2", username: "dr.bisma.putra.pratama", password: "12345678" },
  { no: 14, nama: "Dr Iyah Faniyah, S.H, M.Hum", unitKerja: "Ka. Prodi Pasca & Dosen PNS dpk Ilmu Hukum S2", username: "iyah.faniyah", password: "12345678" },
  { no: 15, nama: "Dr NENI VESNA MADJID, S.H., M.H", unitKerja: "Ka. Prodi Fak. Hukum & Dosen NIDN Ilmu Hukum S2", username: "dr.neni.vesna.madjid", password: "12345678" },
  { no: 16, nama: "Netrivianti, S.H., M.H", unitKerja: "Sek. Prodi Fak. Hukum & Dosen NIDN Ilmu Hukum S1", username: "netrivianti", password: "12345678" },
  { no: 17, nama: "Dora Tiara, S.H., M.H", unitKerja: "Ka. GPM Fak. Hukum & Dosen NIDN Ilmu Hukum S1", username: "dora.tiara", password: "12345678" },
  { no: 18, nama: "Alam Suryo Laksono, S.H., M.H.", unitKerja: "Dosen NIDN Ilmu Hukum S1", username: "alam.suryo.laksono", password: "12345678" },
  { no: 19, nama: "Ir Mahmud, M.Si", unitKerja: "Dekan Fak. Pertanian & Dosen NIDN Agribisnis", username: "mahmud", password: "12345678" },
  { no: 20, nama: "Prof. Dr Ir I Ketut Budaraga, M.Si", unitKerja: "Ketua LPPM", username: "i.ketut.budaraga", password: "12345678" },
  { no: 21, nama: "EDDWINA AIDILA FITRIA, S.TP, M.Si", unitKerja: "Ka. Prodi THP & Dosen NIDN THP", username: "eddwina.aidila.fitria", password: "12345678" },
  { no: 22, nama: "Meriati, S.P, M.P", unitKerja: "Ka. Prodi Agroteknologi & Dosen NIDN Agroteknologi", username: "meriati", password: "12345678" },
  { no: 23, nama: "Wawan Sumarno, S.P, M.Si", unitKerja: "Ka. Prodi Agribisnis & Ka. PMB & Dosen NIDN Agribisnis", username: "wawan.sumarno", password: "12345678" },
  { no: 24, nama: "Rera Aga Salihat, S.Si, M.Si", unitKerja: "Ka. Lab. THP & Dosen NIDN THP", username: "rera.aga.salihat", password: "12345678" },
  { no: 25, nama: "Rera Agung Syukra, S.Si, M.Si", unitKerja: "Staf LPPM & Dosen NIDN Agribisnis", username: "rera.agung.syukra", password: "12345678" },
  { no: 26, nama: "Dr Mac Aditiawarman, M.Hum", unitKerja: "Dekan Fak. Sastra & Dosen PNS dpk Sastra Inggris", username: "mac.aditiawarman", password: "12345678" },
  { no: 27, nama: "Drs. Raflis, M.Hum", unitKerja: "Ka. Prodi Sastra & Dosen NIDN Sastra Inggris", username: "raflis", password: "12345678" },
  { no: 28, nama: "Drs. Risal Abu, S.T, M.Eng", unitKerja: "Dekan Fak.Teknik & Dosen NIDN T. Mesin", username: "risal.abu", password: "12345678" },
  { no: 29, nama: "Adrian Fadhli, S.Pd, M.T", unitKerja: "Kepala LPM & Dosen NIDN T. Sipil", username: "adrian.fadhli", password: "12345678" },
  { no: 30, nama: "Dr Ir Irnawati Siregar, M.Pd.T", unitKerja: "Ka. Prodi Arsitektur & Dosen NIDN Arsitektur", username: "irnawati.siregar", password: "12345678" },
  { no: 31, nama: "Dr Nazili, S.T, M.T", unitKerja: "Ka. Prodi Teknik Sipil & Dosen PNS dpk T. Sipil", username: "nazili", password: "12345678" },
  { no: 32, nama: "Ir Irmayani, M.T", unitKerja: "Ka. Prodi Teknik Industri & Dosen NIDN T. Industri", username: "irmayani", password: "12345678" },
  { no: 33, nama: "Ir Mukhnizar, M.T", unitKerja: "Ka. Prodi Teknik Mesin & Dosen PNS dpk T. Mesin", username: "mukhnizar", password: "12345678" },
  { no: 34, nama: "Rosnita Rauf, S.T, M.T", unitKerja: "Ka. Prodi Teknik Elektro & Dosen NIDN T. Elektro", username: "rosnita.rauf", password: "12345678" },
  { no: 35, nama: "ROBBY HOTTER, S.T, M.T", unitKerja: "Sek. Prodi Teknik Sipil & Dosen NIDN T. Sipil", username: "robby.hotter", password: "12345678" },
  { no: 36, nama: "Merry Thressia, S.Si, M.Si", unitKerja: "Ka. Lab. Dasar & Dosen NIDN T. Sipil", username: "merry.thressia", password: "12345678" },
  { no: 37, nama: "Budiman, S.T, M.T", unitKerja: "Staf Ahli Bidang Kerjasama & Dosen NIDN T. Elektro", username: "budiman", password: "12345678" },
  { no: 38, nama: "Dian Wahyuni Dewi Fitri, S.T, M.T", unitKerja: "Dosen NIDN T. Sipil", username: "dian.wahyuni.dewi.fitri", password: "12345678" },
  { no: 39, nama: "Drs. TARMA SARTIMA, M.Si, Ph.D", unitKerja: "Dekan Fisipol & Dosen PNS dpk I. Adm Negara", username: "tarma.sartima", password: "12345678" },
  { no: 40, nama: "Annisa Fitri, S.Sos, M.AP", unitKerja: "Ka. Prodi Ilmu Adm Negara Fisipol & Dosen NIDN I. Adm Negara", username: "annisa.fitri", password: "12345678" },
  { no: 41, nama: "Doddie Arya Kusuma B, S.Sos, M.Si", unitKerja: "Ka. Prodi Ilmu Pemerintahan Fisipol & Dosen NIDN I. Pemerintahan", username: "doddie.arya.kusuma.b", password: "12345678" },
  { no: 42, nama: "Puryanto, S.A.P, M.A.P", unitKerja: "Ka. GPM Fisipol & Dosen NIDN I. Adm Negara", username: "puryanto", password: "12345678" },
  { no: 43, nama: "Dr Sumartono, M.Si", unitKerja: "Ka.Prodi I. Komunikasi & Dosen PNS dpk I. Komunikasi", username: "sumartono", password: "12345678" },
  { no: 44, nama: "YUMI ARIYATI, S.Sos, M.I.Kom", unitKerja: "Ka. Perpustakaan & Staf Humas & Dosen NIDN I. Komunikasi", username: "yumi.ariyati", password: "12345678" },
  { no: 45, nama: "Dr Feby Meuthia Yusuf, M.Pd", unitKerja: "Dekan FKIP & Dosen PNS dpk Pend. B. Inggris", username: "feby.meuthia.yusuf", password: "12345678" },
  { no: 46, nama: "DWI MUTIA CHAN, S.Pd, M.Pd", unitKerja: "Ka. Prodi Pend. Bhs. Dan Sas Indo FKIP & Dosen NIDN Pend. Bhs & Sas Indo", username: "dwi.mutia.chan", password: "12345678" },
  { no: 47, nama: "KHURNIA BUDI UTAMI, S.Pd, M.Pd", unitKerja: "Ka. Prodi Pend. Mtk FKIP & Dosen NIDN Pend. Mtk", username: "khurnia.budi.utami", password: "12345678" },
  { no: 48, nama: "RENI RESPITA, S.Pd, M.Pd.E", unitKerja: "Ka. Prodi Pend. Ekonomi FKIP & Ka. PPLK & Dosen NIDN Pend. Eko", username: "reni.respita", password: "12345678" },
  { no: 49, nama: "Yessy Marzona, S.Pd, M.Pd", unitKerja: "Ka. Prodi B. Inggris FKIP & Ka. Lab. Bahasa & Dosen NIDN Pend. B. Inggris", username: "yessy.marzona", password: "12345678" },
  { no: 50, nama: "Desmiwerita, S.E., M.Si", unitKerja: "Direktur AAI & Dosen Struktural AAI", username: "desmiwerita", password: "12345678" },
  { no: 51, nama: "Dr. Yuli Ardiany, S.E., M.Si, C.Atr", unitKerja: "Dosen Struktural AAI", username: "yuli.ardiany", password: "12345678" },
  { no: 52, nama: "Dr Nuraeni Dahri, S.Kom, M.Kom", unitKerja: "Ka. Prodi D III MIK & Dosen NIDN D III MIK", username: "nuraeni.dahri", password: "12345678" },
  { no: 53, nama: "HARRY SETYA HADI, S.Kom, M.Kom", unitKerja: "Sek. LPPM", username: "harry.setya.hadi", password: "12345678" }
];

export const generateStrukturalPDF = async () => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 40;

  // Load logo
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

  // Draw letterhead
  const drawLetterhead = (): number => {
    const headerTopY = 40;
    let currentY = headerTopY;

    // Logo
    if (logoData) {
      doc.addImage(logoData, 'PNG', marginX, headerTopY - 10, 60, 60);
    }

    // Header - Kop Surat
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

    // Line separator (double line)
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1.5);
    doc.line(marginX, currentY, pageWidth - marginX, currentY);
    doc.setLineWidth(0.5);
    doc.line(marginX, currentY + 3, pageWidth - marginX, currentY + 3);
    currentY += 25;

    // Title
    doc.setFont('times', 'bold');
    doc.setFontSize(14);
    doc.text('DAFTAR AKUN PENGGUNA STRUKTURAL', pageWidth / 2, currentY, { align: 'center' });
    currentY += 18;
    doc.text('SISTEM ABSENSI UNIVERSITAS EKASAKTI', pageWidth / 2, currentY, { align: 'center' });
    currentY += 25;

    return currentY;
  };

  // Draw first page letterhead
  const tableStartY = drawLetterhead();

  // Prepare table body
  const tableBody = strukturalAccounts.map((account) => {
    return [
      account.no,
      account.nama,
      account.unitKerja,
      account.username,
      account.password
    ];
  });

  // Generate table
  const now = new Date();
  const timestamp = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) + ' ' + now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }) + ' WIB';

  autoTable(doc, {
    head: [['No', 'Nama', 'Unit Kerja (Jabatan/Keterangan)', 'Username', 'Password']],
    body: tableBody,
    startY: tableStartY,
    margin: { left: marginX, right: marginX, top: 40, bottom: 70 },
    styles: {
      font: 'times',
      fontSize: 9,
      cellPadding: 5,
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.5,
    },
    headStyles: {
      font: 'times',
      fontStyle: 'bold',
      fillColor: [220, 220, 220],
      textColor: [0, 0, 0],
      lineWidth: 0.5,
      fontSize: 10,
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 30, halign: 'center' },   // No
      1: { cellWidth: 140, halign: 'left' },    // Nama
      2: { cellWidth: 150, halign: 'left' },    // Unit Kerja
      3: { cellWidth: 90, halign: 'center' },   // Username
      4: { cellWidth: 80, halign: 'center' },   // Password
    },
    didDrawPage: (data) => {
      // Footer with timestamp
      const str = `Dicetak dari Sistem Absensi UNES pada ${timestamp}`;
      doc.setFontSize(8);
      doc.setFont('times', 'italic');
      doc.text(str, pageWidth / 2, pageHeight - 25, { align: 'center' });
      
      // Page number
      const pageStr = "Halaman " + data.pageNumber;
      doc.text(pageStr, pageWidth - marginX, pageHeight - 25, { align: 'right' });

      // Header on continuation pages
      if (data.pageNumber > 1) {
        doc.setFont('times', 'bold');
        doc.setFontSize(10);
        doc.text('DAFTAR AKUN PENGGUNA STRUKTURAL (lanjutan)', marginX, 30);
        doc.setLineWidth(0.5);
        doc.line(marginX, 35, pageWidth - marginX, 35);
      }
    }
  });

  // Save PDF
  doc.save(`Daftar_Akun_Struktural_${new Date().toISOString().split('T')[0]}.pdf`);
};

type KondisiStatistikUser = {
  id: string;
  full_name: string | null;
  role: string | null;
  username: string | null;
  unit_kerja?: string | null;
  is_struktural?: boolean | null;
};

const normalizeUnitKerjaForReport = (unitKerjaRaw: string | null | undefined): string => {
  const unitKerja = (unitKerjaRaw ?? '').trim();
  if (!unitKerja) return 'Tanpa Unit Kerja';

  const lowerUnit = unitKerja.toLowerCase();

  if (lowerUnit.includes('yayasan') || lowerUnit.includes('sekretaris yptp') || lowerUnit.includes('yptp')) {
    return 'Yayasan';
  }

  // Check for Lembaga Diklat, KKN - PRIORITY CHECK
  if (lowerUnit.includes('lembaga diklat') || lowerUnit.includes('diklat, kkn')) {
    return 'Lembaga Diklat, KKN';
  }

  // Check for Staf Ahli Kerjasama and Adrian Fadhli specifically - assign to LPM
  if (lowerUnit.includes('staf ahli') && lowerUnit.includes('kerjasama')) {
    return 'LPM';
  }
  if (lowerUnit.includes('kepala lpm') || lowerUnit.includes('ka. lpm')) {
    return 'LPM';
  }

  if (
    lowerUnit.includes('rektor') ||
    lowerUnit.includes('wr i') ||
    lowerUnit.includes('wr ii') ||
    lowerUnit.includes('wr iii') ||
    lowerUnit.includes('staf ahli rektor') ||
    lowerUnit.includes('senat')
  ) {
    return 'Rektorat';
  }

  // Note: Skip manajemen check for Lembaga Diklat users
  if (lowerUnit.includes('fak. ekonomi') || lowerUnit.includes('akuntansi')) {
    return 'Fakultas Ekonomi';
  }
  
  // Only check manajemen if NOT part of Lembaga Diklat
  if (lowerUnit.includes('manajemen') && !lowerUnit.includes('diklat') && !lowerUnit.includes('kkn')) {
    return 'Fakultas Ekonomi';
  }

  if (lowerUnit.includes('fak. hukum') || lowerUnit.includes('ilmu hukum') || lowerUnit.includes('pasca')) {
    return 'Fakultas Hukum';
  }

  if (lowerUnit.includes('fak. pertanian') || lowerUnit.includes('agribisnis') || lowerUnit.includes('agroteknologi') || lowerUnit.includes('thp')) {
    return 'Fakultas Pertanian';
  }

  if (lowerUnit.includes('fak. sastra') || lowerUnit.includes('sastra inggris')) {
    return 'Fakultas Sastra';
  }

  if (
    lowerUnit.includes('fak.teknik') ||
    lowerUnit.includes('fak. teknik') ||
    lowerUnit.includes('arsitektur') ||
    lowerUnit.includes('t. sipil') ||
    lowerUnit.includes('t. mesin') ||
    lowerUnit.includes('t. elektro') ||
    lowerUnit.includes('t. industri') ||
    lowerUnit.includes('teknik sipil') ||
    lowerUnit.includes('teknik mesin') ||
    lowerUnit.includes('teknik elektro') ||
    lowerUnit.includes('teknik industri') ||
    lowerUnit.includes('teknik arsitek')
  ) {
    return 'Fakultas Teknik & Perencanaan';
  }

  if (
    lowerUnit.includes('fisipol') ||
    lowerUnit.includes('fisipo') ||
    lowerUnit.includes('i. adm negara') ||
    lowerUnit.includes('adm negara') ||
    lowerUnit.includes('i. pemerintahan') ||
    lowerUnit.includes('pemerintahan') ||
    lowerUnit.includes('i. komunikasi') ||
    lowerUnit.includes('komunikasi')
  ) {
    return 'Fakultas Ilmu Sosial dan Ilmu Politik (FISIPOL)';
  }

  if (lowerUnit.includes('fkip') || lowerUnit.includes('pend.') || lowerUnit.includes('pend ') || lowerUnit.includes('pendidikan')) {
    return 'Fakultas Keguruan dan Ilmu Pendidikan (FKIP)';
  }

  if (lowerUnit.includes('aai') || lowerUnit.includes('akademi akuntansi')) {
    return 'Akademi Akuntansi Indonesia (AAI)';
  }

  if (lowerUnit.includes('d iii mik') || lowerUnit.includes('d3 mik') || lowerUnit.includes('diii mik')) {
    return 'Fakultas Ekonomi';
  }

   if (lowerUnit.includes('baak')) return 'BAAK';
  // BAU dan Perlengkapan dipisah, kecuali kepala (syarifuddin.nur) tetap di BAU
  if (lowerUnit.includes('perlengkapan')) {
    // Kepala BAU (Ka. BAU) tetap di BAU
    if (lowerUnit.includes('ka. bau') || lowerUnit.includes('kepala bau')) {
      return 'BAU';
    }
    return 'Perlengkapan';
  }
  if (lowerUnit.includes('bau')) return 'BAU';
  if (lowerUnit.includes('bapsi')) return 'BAPSI';
  if (lowerUnit.includes('bka') || lowerUnit.includes('bkk')) return 'BKK';
  // LPPM: Ketua LPPM, Sek. LPPM, dan unit dengan kata "lppm"
  if (lowerUnit.includes('lppm') || lowerUnit.includes('ketua lppm') || lowerUnit.includes('sek. lppm') || lowerUnit.includes('sekretaris lppm') || lowerUnit.includes('lembaga penelitian dan pengabdian')) return 'LPPM';
  if (lowerUnit.includes('lpm') && !lowerUnit.includes('lppm')) return 'LPM';
  if (lowerUnit.includes('perpustakaan') || lowerUnit.includes('perpus')) return 'UPT Perpustakaan';
  if (lowerUnit.includes('pmb') && !lowerUnit.includes('pengelola informasi')) return 'PMB';
  if (lowerUnit.includes('pengelola informasi dan dokumentasi')) return 'Pengelola Informasi dan Dokumentasi';
  if (lowerUnit.includes('registrasi')) return 'Registrasi';
  if (lowerUnit.includes('lab.') || lowerUnit.includes('lab ')) return 'Laboratorium Komputer';
  if (lowerUnit.includes('staf it') || lowerUnit === 'it') return 'IT';
  if (lowerUnit.includes('cleaning service') || lowerUnit.includes('kebersihan')) return 'Cleaning Service';
  if (lowerUnit.includes('garin')) return 'Garin';
  if (lowerUnit.includes('humas') || lowerUnit.includes('kerjasama')) {
    return 'Humas';
  }

  return unitKerja;
};

type KondisiStatistikAttendance = {
  user_id: string | null;
  attendance_type: string;
  created_at: string | null;
};

type KondisiStatistikStatsSnapshot = {
  totalUsers: number;
  presentToday: number;
  notPresentToday: number;
  missingCheckoutToday: number;

  dosenStrukturalTotal: number;
  tendikTotal: number;
  dosenStrukturalMasuk: number;
  dosenStrukturalPulang: number;
  tendikMasuk: number;
  tendikPulang: number;
};

export const generateKondisiStatistikPDF = async (opts: {
  selectedDate: string;
  stats: KondisiStatistikStatsSnapshot;
  trackedUsers: KondisiStatistikUser[];
  attendancesSelectedDate: KondisiStatistikAttendance[];
  attendancesHistory?: KondisiStatistikAttendance[];
  isSunday: boolean;
  reportTitle?: string;
  filenamePrefix?: string;
  monthOptions?: {
    monthLabel: string;
    monthTitle: string;
    dates: number[];
    monthStart?: string;
    monthEnd?: string;
    categoryLabel?: string;
    holidayDates?: string[];
    holidayLabels?: Record<string, string>;
    leaveByUser?: Record<string, Record<string, 'izin' | 'cuti' | 'dinas_luar'>>;
    weekRanges?: Array<{ index: number; start: string; end: string }>;
    sortedUsers?: KondisiStatistikUser[];
  };
}) => {
  const isMonthlySheet = Boolean(opts.monthOptions);
  const doc = new jsPDF({ orientation: isMonthlySheet ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const baseFontSize = 20;
  doc.setFontSize(baseFontSize);

  const marginX = isMonthlySheet ? 6 : 8;
  const marginY = isMonthlySheet ? 6 : 8;


  const wibDateLong = (dayString: string) => {
    const [y, m, d] = dayString.split('-').map((v) => Number(v));
    const utcDate = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
    return utcDate.toLocaleDateString('id-ID', {
      timeZone: 'Asia/Jakarta',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const wibDateShort = (dayString: string) => {
    const [y, m, d] = dayString.split('-').map((v) => Number(v));
    const utcDate = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
    return utcDate.toLocaleDateString('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: '2-digit',
      month: '2-digit',
    });
  };


  const dayKeyWib = (iso: string) => {
    const d = new Date(iso);
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  };



  const safeText = (value: string | null | undefined) => (value ?? '').trim() || '-';

  const categoryLabel = (user: KondisiStatistikUser) => {
    const role = (user.role || '').toLowerCase();
    const isStruktural = user.is_struktural === true;
    // Admin/superadmin yang is_struktural=true juga dihitung sebagai Dosen Struktural
    return isStruktural && (role === 'dosen' || role === 'admin' || role === 'superadmin') ? 'Dosen Struktural' : 'Tendik';
  };

  // Load logo (optional)
  let logoData: string | null = null;
  try {
    logoData = await fetch('/unes.png')
      .then((response) => response.blob())
      .then(
        (blob) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          })
      );
  } catch {
    // ignore
  }

  const drawLetterhead = (): number => {
    const headerTopY = marginY;
    let currentY = headerTopY;

    if (logoData) {
      doc.addImage(logoData, 'PNG', marginX, headerTopY, 18, 18);
    }

    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text('YAYASAN PERGURUAN TINGGI PADANG', pageWidth / 2, currentY + 2, { align: 'center' });

    doc.setFontSize(16);
    doc.text('UNIVERSITAS EKASAKTI', pageWidth / 2, currentY + 9, { align: 'center' });

    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.text('Jl. Veteran Dalam No. 26 Padang (25113) Telp. (0751) 28859-26770', pageWidth / 2, currentY + 14, {
      align: 'center',
    });
    doc.text('Fax. (0751) 32694; https://unespadang.ac.id/', pageWidth / 2, currentY + 18, { align: 'center' });

    const lineY = currentY + 21.5;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.8);
    doc.line(marginX, lineY, pageWidth - marginX, lineY);
    doc.setLineWidth(0.3);
    doc.line(marginX, lineY + 1.5, pageWidth - marginX, lineY + 1.5);

    currentY = lineY + 6;

    doc.setFont('times', 'bold');
    doc.setFontSize(18);
    doc.text(opts.reportTitle ?? 'LAPORAN KONDISI STATISTIK KEHADIRAN HARIAN', pageWidth / 2, currentY, { align: 'center' });
    currentY += 8;

    doc.setFont('times', 'bold');
    doc.setFontSize(14);
    if (opts.monthOptions) {
      doc.text(`Periode: ${opts.monthOptions.monthLabel}`, pageWidth / 2, currentY, { align: 'center' });
      currentY += 6;
      if (opts.monthOptions.categoryLabel) {
        doc.setFontSize(12);
        doc.text(`Kategori: ${opts.monthOptions.categoryLabel}`, pageWidth / 2, currentY, { align: 'center' });
        currentY += 5;
      }
      doc.setFont('times', 'normal');
      doc.setFontSize(9);
    } else {
      doc.text(`Tanggal Laporan: ${wibDateLong(opts.selectedDate)}`, pageWidth / 2, currentY, { align: 'center' });
      currentY += 6;
    }

    return currentY + 3;
  };

  const contentStartY = drawLetterhead();

  if (opts.monthOptions) {
    const contentWidth = pageWidth - marginX * 2;
    const colNo = 9;
    const colName = 34;
    const colUnit = 40;
    const colNote = 38;
    const dates = opts.monthOptions.dates;
    const dateColWidth = (contentWidth - colNo - colName - colUnit - colNote) / dates.length;

    const monthTitleText = opts.monthOptions.monthTitle;
    const monthHeader = {
      content: monthTitleText,
      colSpan: dates.length,
      styles: { halign: 'center', valign: 'middle', fontStyle: 'bold' as const },
    };

    const headRows = [
      [
        { content: 'No', rowSpan: 2 },
        { content: 'Nama', rowSpan: 2 },
        { content: 'Unit Kerja / Jabatan', rowSpan: 2 },
        monthHeader,
        { content: 'Keterangan', rowSpan: 2 },
      ],
      dates.map((d) => `${d}`),
    ];

    const sortedUsers = (opts.monthOptions.sortedUsers ?? opts.trackedUsers).filter(
      (user) => (user.username ?? '').toLowerCase() !== 'andi.syahrum.makkurade'
    );
    const holidaySet = new Set(opts.monthOptions.holidayDates ?? []);
    const holidayLabels = opts.monthOptions.holidayLabels ?? {};
    const leaveByUser = opts.monthOptions.leaveByUser ?? {};
    const todayKey = dayKeyWib(new Date().toISOString());
    const monthStartDay = opts.monthOptions.monthStart ?? opts.selectedDate;
    const year = Number(monthStartDay.split('-')[0] ?? 0);
    const monthIndex = Number(monthStartDay.split('-')[1] ?? 1) - 1;
    const allAttendances = opts.attendancesHistory ?? opts.attendancesSelectedDate;
    const attendanceMap = new Map<string, { masuk: Set<string>; pulang: Set<string> }>();

    allAttendances.forEach((att) => {
      if (!att.user_id || !att.created_at) return;
      const dayKey = dayKeyWib(att.created_at);
      if (!attendanceMap.has(att.user_id)) {
        attendanceMap.set(att.user_id, { masuk: new Set(), pulang: new Set() });
      }
      const record = attendanceMap.get(att.user_id)!;
      if (att.attendance_type === 'masuk') record.masuk.add(dayKey);
      if (att.attendance_type === 'pulang') record.pulang.add(dayKey);
    });

    const bodyRows = sortedUsers.map((u, idx) => {
      const record = attendanceMap.get(u.id) ?? { masuk: new Set<string>(), pulang: new Set<string>() };
      let totalAbsenMasuk = 0;
      let totalAbsenPulang = 0;
      let totalTidakMasuk = 0;
      let totalTidakPulang = 0;
      let totalHari = 0;
      let totalHadir = 0;
      let totalIzin = 0;
      let totalCuti = 0;
      let totalDinasLuar = 0;

      const dateCells = dates.map((day) => {
        const dateKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dateObj = new Date(year, monthIndex, day);
        const isSunday = dateObj.getDay() === 0;
        if (isSunday) {
          return 'Libur\nMinggu';
        }
        if (holidaySet.has(dateKey)) {
          const holidayLabel = holidayLabels[dateKey];
          return holidayLabel ? `Libur\n${holidayLabel}` : 'Libur';
        }
        totalHari += 1;
        const leaveType = leaveByUser[u.id]?.[dateKey];
        if (leaveType) {
          if (leaveType === 'dinas_luar') {
            totalDinasLuar += 1;
          } else if (leaveType === 'cuti') {
            totalCuti += 1;
          } else {
            totalIzin += 1;
          }
          const leaveSymbol = leaveType === 'dinas_luar' ? 'D' : 'I';
          return `${leaveSymbol}\n${leaveSymbol}`;
        }
        const isFuture = dateKey > todayKey;
        const hasPulang = record.pulang.has(dateKey);
        const hasMasukActual = record.masuk.has(dateKey);
        if (!hasMasukActual && !hasPulang && isFuture) {
          return '';
        }
        if (hasMasukActual) totalAbsenMasuk += 1;
        if (hasPulang) totalAbsenPulang += 1;
        if (hasMasukActual || hasPulang) {
          totalHadir += 1;
        }
        if (!hasMasukActual && !hasPulang) {
          totalTidakMasuk += 1;
          totalTidakPulang += 1;
        } else {
          if (!hasMasukActual) totalTidakMasuk += 1;
          if (!hasPulang) totalTidakPulang += 1;
        }
        const masukText = hasMasukActual ? 'V' : 'X';
        const pulangText = hasPulang ? 'V' : 'X';
        return `${masukText}\n${pulangText}`;
      });

      const noteLines = [
        `Total Hari: ${totalHari}`,
        `Total Hadir: ${totalHadir}`,
        `Total Absen Masuk: ${totalAbsenMasuk}`,
        `Total Absen Pulang: ${totalAbsenPulang}`,
        `Total Tidak Absen Masuk: ${totalTidakMasuk}`,
        `Total Tidak Absen Pulang: ${totalTidakPulang}`,
        `Total Izin: ${totalIzin}`,
        `Total Cuti: ${totalCuti}`,
        `Total Dinas Luar: ${totalDinasLuar}`,
      ];

      return [
        String(idx + 1),
        safeText(u.full_name),
        safeText(u.unit_kerja),
        ...dateCells,
        noteLines.join('\n'),
      ];
    });

    const nowStamp = new Date();
    const footerDate = nowStamp.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Jakarta',
    });
    const footerTime = nowStamp.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'Asia/Jakarta',
    });
    const footerText = `Dicetak dari kehadiran.irfanananda28.com pada ${footerDate} ${footerTime} WIB`;

    autoTable(doc, {
      startY: contentStartY,
      tableWidth: contentWidth,
      margin: { left: marginX, right: marginX, bottom: 8 },
      head: headRows,
      body: bodyRows,
      theme: 'grid',
      rowPageBreak: 'avoid',
      didDrawPage: () => {
        doc.setFont('times', 'italic');
        doc.setFontSize(7);
        doc.text(footerText, pageWidth / 2, pageHeight - 4, { align: 'center' });
      },
      styles: {
        font: 'times',
        fontSize: 6,
        cellPadding: 0.8,
        textColor: [0, 0, 0],
        lineWidth: 0.5,
        lineColor: [0, 0, 0],
        valign: 'middle',
        minCellHeight: 7,
      },
      headStyles: {
        fillColor: [220, 220, 220],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
        fontSize: 6.2,
        cellPadding: 0.6,
      },
      columnStyles: {
        0: { cellWidth: colNo, halign: 'center' },
        1: { cellWidth: colName, halign: 'left' },
        2: { cellWidth: colUnit, halign: 'left' },
        [dates.length + 3]: { cellWidth: colNote, halign: 'left', valign: 'top' },
        ...Object.fromEntries(
          dates.map((_, idx) => [
            idx + 3,
            {
              cellWidth: dateColWidth,
              halign: 'center',
              valign: 'middle',
              fontSize: 5.4,
              cellPadding: 0.4,
              overflow: 'linebreak',
            },
          ])
        )
      },
    });

    const legendText = 'Keterangan: Baris atas = Masuk, baris bawah = Pulang. V = Absen, X = Tidak absen, I = Izin/Cuti, D = Dinas Luar.';
    const totalPages = doc.getNumberOfPages();
    if (totalPages > 0) {
      doc.setPage(totalPages);
      doc.setFont('times', 'normal');
      doc.setFontSize(8);
      doc.text(legendText, marginX, pageHeight - 8);
    }

    const filenamePrefix = opts.filenamePrefix ?? 'Laporan_Kondisi_Statistik';
    const filename = `${filenamePrefix}.pdf`;
    doc.save(filename);
    return;
  }

  const now = new Date();

  const checkins = opts.attendancesSelectedDate.filter((a) => a.attendance_type === 'masuk');
  const checkouts = opts.attendancesSelectedDate.filter((a) => a.attendance_type === 'pulang');

  const presentIds = new Set(checkins.map((a) => a.user_id).filter(Boolean) as string[]);
  const checkoutIds = new Set(checkouts.map((a) => a.user_id).filter(Boolean) as string[]);

  const absentUsers = opts.trackedUsers
    .filter((u) => !presentIds.has(u.id))
    .sort((a, b) => safeText(a.full_name).localeCompare(safeText(b.full_name)));

  const missingCheckoutUsers = opts.trackedUsers
    .filter((u) => presentIds.has(u.id) && !checkoutIds.has(u.id))
    .sort((a, b) => safeText(a.full_name).localeCompare(safeText(b.full_name)));

  const rawPresentRate = opts.stats.totalUsers > 0 ? (opts.stats.presentToday / opts.stats.totalUsers) * 100 : 0;
  const presentRate = Math.min(100, rawPresentRate);
  const rawCheckoutCompliance = opts.stats.presentToday > 0 ? (checkoutIds.size / opts.stats.presentToday) * 100 : 0;
  const checkoutCompliance = Math.min(100, rawCheckoutCompliance);

  const insightLines: string[] = [];
  if (!opts.monthOptions) {
    if (opts.isSunday) {
      insightLines.push('Hari Minggu: kehadiran dihitung 0 (sesuai sistem).');
    } else {
      if (presentRate < 80) insightLines.push(`Tingkat hadir ${presentRate.toFixed(1)}% (perlu perhatian).`);
      if (opts.stats.missingCheckoutToday > 0)
        insightLines.push(`Terdapat ${opts.stats.missingCheckoutToday} pegawai sudah masuk tetapi belum absen pulang.`);
      if (checkoutCompliance < 90) insightLines.push(`Kepatuhan absen pulang ${checkoutCompliance.toFixed(1)}%.`);
    }
    if (insightLines.length === 0) insightLines.push('Kondisi kehadiran dan rekam absensi dalam batas wajar.');
  }

   // === TABLES LAYOUT (stacked) ===
   // Portrait A4 is tighter; keep a single-column flow for predictable 1-page fit.
   const contentWidth = pageWidth - marginX * 2;

    const summaryTitle = opts.monthOptions ? 'Ringkasan Bulanan' : 'Ringkasan Harian';
    const summaryBody: Array<[string, string]> = [
      ['Total pengguna terpantau', String(opts.stats.totalUsers)],
      [
        opts.monthOptions ? 'Dosen Struktural Hadir (masuk/pulang)' : 'Dosen Struktural Masuk (Absen masuk)',
        `${opts.stats.dosenStrukturalMasuk} dari total ${opts.stats.dosenStrukturalTotal}`
      ],
      [
        opts.monthOptions ? 'Dosen Struktural Absen Pulang (periode)' : 'Dosen Struktural Pulang (Absen pulang)',
        `${opts.stats.dosenStrukturalPulang} dari total ${opts.stats.dosenStrukturalTotal}`
      ],
      [
        opts.monthOptions ? 'Tendik Hadir (masuk/pulang)' : 'Tendik Masuk (Absen masuk)',
        `${opts.stats.tendikMasuk} dari total ${opts.stats.tendikTotal}`
      ],
      [
        opts.monthOptions ? 'Tendik Absen Pulang (periode)' : 'Tendik Pulang (Absen pulang)',
        `${opts.stats.tendikPulang} dari total ${opts.stats.tendikTotal}`
      ],
      ...(opts.monthOptions
        ? [["Periode", `${opts.monthOptions.monthStart} s/d ${opts.monthOptions.monthEnd}`] as [string, string]]
        : []),
    ];

   autoTable(doc, {
     startY: contentStartY,
     tableWidth: contentWidth,
     margin: { left: marginX, right: marginX, top: contentStartY },
     head: [[summaryTitle, 'Jumlah']],
     body: summaryBody,
     theme: 'grid',
     styles: { font: 'times', fontSize: 10, cellPadding: 2, textColor: [0, 0, 0], lineWidth: 0.4 },
     headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', fontSize: 11 },
     columnStyles: {
       0: { cellWidth: contentWidth * 0.68 },
       1: { cellWidth: contentWidth * 0.32, halign: 'right' },
     },
   });
   const summaryFinalY = (doc as AutoTableDoc).lastAutoTable?.finalY ?? contentStartY;


    const normalizeUnitWithUsername = (user: KondisiStatistikUser): string => {
      const lppmUsernames = ['i.ketut.budaraga', 'harry.setya.hadi', 'rera.agung.syukra'];
      if (lppmUsernames.includes(user.username || '')) {
        return 'LPPM';
      }
     
     // Adrian Fadhli ke LPM
     if (user.username === 'adrian.fadhli') {
       return 'LPM';
     }
     
     // Yumi Ariyati ke UPT Perpustakaan
     if (user.username === 'yumi.ariyati') {
       return 'UPT Perpustakaan';
     }
     
     // Syarifuddin (tanpa .nur) ke Humas
     if (user.username === 'syarifuddin') {
       return 'Humas';
     }
     
     // Syarifuddin Nur ke BAU (Ka. Perlengkapan & Plt. Ka. BAU)
     if (user.username === 'syarifuddin.nur') {
       return 'BAU';
     }
     
     // BKK untuk susi.yuliastanty
     if (user.username === 'susi.yuliastanty') {
       return 'BKK';
     }
     
     // AAI - Desmiwerita dan Yuli Ardiany ke AAI
     if (user.username === 'desmiwerita' || user.username === 'yuli.ardiany') {
       return 'Akademi Akuntansi Indonesia (AAI)';
     }
     
     return normalizeUnitKerjaForReport(user.unit_kerja);
   };

    const userById = new Map(opts.trackedUsers.map((u) => [u.id, u] as const));
    const masukIds = presentIds;
    const pulangIds = checkoutIds;

    type UnitRow = {
      unit: string;
      totalAkun: number;
      masuk: number;
      pulang: number;
      tidakMasuk: number;
      tidakPulang: number;
      tidakMasukKerja: number; // tidak ada absen masuk DAN tidak ada absen pulang
      persentaseKehadiran: number;
      persentaseKehadiranPagi: number; // persentase absen masuk
      persentaseKehadiranSore: number; // persentase absen pulang
      weekly?: Record<number, { masuk: number; tidakMasuk: number }>;
    };

    const unitMap = new Map<string, UnitRow>();
    const ensureUnit = (unit: string): UnitRow => {
      const existing = unitMap.get(unit);
      if (existing) return existing;
      const created: UnitRow = {
        unit,
        totalAkun: 0,
        masuk: 0,
        pulang: 0,
        tidakMasuk: 0,
        tidakPulang: 0,
        tidakMasukKerja: 0,
        persentaseKehadiran: 0,
        persentaseKehadiranPagi: 0,
        persentaseKehadiranSore: 0,
        weekly: opts.monthOptions ? {} : undefined
      };
      unitMap.set(unit, created);
      return created;
    };

    const weekRanges = opts.monthOptions?.weekRanges ?? [];

    const weekAttendanceByUser = opts.monthOptions
      ? (() => {
          const historySource = opts.attendancesHistory ?? opts.attendancesSelectedDate;
          const byUser = new Map<string, Map<number, boolean>>();
          for (const att of historySource) {
            if (!att.created_at || !att.user_id) continue;
            if (!userById.has(att.user_id)) continue;
            const day = dayKeyWib(att.created_at);
            if (day < opts.monthOptions!.monthStart || day > opts.monthOptions!.monthEnd) continue;

            const weekIndex = weekRanges.find((range) => day >= range.start && day <= range.end)?.index;
            if (!weekIndex) continue;

            let userWeeks = byUser.get(att.user_id);
            if (!userWeeks) {
              userWeeks = new Map();
              byUser.set(att.user_id, userWeeks);
            }
            userWeeks.set(weekIndex, true);
          }
          return byUser;
        })()
      : new Map<string, Map<number, boolean>>();

    // Track processed users to avoid counting duplicates
    const processedUserIds = new Set<string>();

    for (const user of opts.trackedUsers) {
      if (processedUserIds.has(user.id)) {
        continue;
      }
      processedUserIds.add(user.id);

      const unit = normalizeUnitWithUsername(user);
      const row = ensureUnit(unit);
      row.totalAkun += 1;

      const hasMasuk = masukIds.has(user.id);
      const hasPulang = pulangIds.has(user.id);

      if (hasMasuk) row.masuk += 1;
      if (hasPulang) row.pulang += 1;

      if (!hasMasuk && !hasPulang) {
        row.tidakMasukKerja += 1;
      }

      if (opts.monthOptions && row.weekly) {
        for (const range of weekRanges) {
          if (!row.weekly[range.index]) {
            row.weekly[range.index] = { masuk: 0, tidakMasuk: 0 };
          }
        }

        const userWeeks = weekAttendanceByUser.get(user.id) ?? new Map<number, boolean>();
        for (const range of weekRanges) {
          if (userWeeks.get(range.index)) {
            row.weekly[range.index]!.masuk += 1;
          } else {
            row.weekly[range.index]!.tidakMasuk += 1;
          }
        }
      }
    }

    // Calculate tidakMasuk, tidakPulang, and persentaseKehadiran after loop
    for (const row of unitMap.values()) {
      row.tidakMasuk = row.totalAkun - row.masuk;
      row.tidakPulang = row.totalAkun - row.pulang;
      row.persentaseKehadiran = row.totalAkun > 0 ? Math.round((row.masuk / row.totalAkun) * 100) : 0;
      row.persentaseKehadiranPagi = row.totalAkun > 0 ? Math.round((row.masuk / row.totalAkun) * 100) : 0;
      row.persentaseKehadiranSore = row.totalAkun > 0 ? Math.round((row.pulang / row.totalAkun) * 100) : 0;
    }

    const orderedUnits = [
    'Yayasan',
    'Rektorat',
    'Fakultas Ekonomi',
    'Fakultas Hukum',
    'Fakultas Pertanian',
    'Fakultas Sastra',
    'Fakultas Teknik & Perencanaan',
    'Fakultas Ilmu Sosial dan Ilmu Politik (FISIPOL)',
    'Fakultas Keguruan dan Ilmu Pendidikan (FKIP)',
    'Akademi Akuntansi Indonesia (AAI)',
    'LPPM',
    'LPM',
    'Lembaga Diklat, KKN',
    'BAPSI',
    'BAAK',
    'BAU',
    'BKK',
    'Perlengkapan',
    'UPT Perpustakaan',
    'PMB',
    'Registrasi',
    'Pengelola Informasi dan Dokumentasi',
    'Humas',
    'IT',
    'Laboratorium Komputer',
  ];

 
  const unitNames = [
    ...orderedUnits,
    ...Array.from(unitMap.keys())
      .filter((unit) => !orderedUnits.includes(unit))
      .sort((a, b) => a.localeCompare(b)),
  ];

  const unitRows = unitNames
    .map((name) => unitMap.get(name))
    .filter((r): r is UnitRow => Boolean(r));

   const weeklyRanges = opts.monthOptions?.weekRanges ?? [];
   const weekHeaders = weeklyRanges.map((range) => {
     const startLabel = wibDateShort(range.start);
     const endLabel = wibDateShort(range.end);
     return `Minggu ${range.index}\n${startLabel}-${endLabel}`;
   });
   const weekCount = weekHeaders.length || 1;

   const unitTableBody = unitRows.map((r) => {
     if (opts.monthOptions) {
       const weeklyValues = weeklyRanges.map((range) => {
         const data = r.weekly?.[range.index];
         const masuk = data?.masuk ?? 0;
         const tidakMasuk = data?.tidakMasuk ?? r.totalAkun;
         return `${masuk}/${tidakMasuk}`;
       });

       return [r.unit, String(r.totalAkun), ...weeklyValues];
     }

     return [
       r.unit,
       String(r.totalAkun),
       String(r.masuk),
       String(r.pulang),
       String(r.tidakMasuk),
       String(r.tidakPulang),
       String(r.tidakMasukKerja),
       `${r.persentaseKehadiranPagi}%`,
       `${r.persentaseKehadiranSore}%`,
     ];
   });

  autoTable(doc, {
    startY: summaryFinalY + 3,
    tableWidth: contentWidth,
    margin: { left: marginX, right: marginX },
    head: opts.monthOptions
      ? [["Nama Unit Kerja", "Total Pegawai", ...weekHeaders]]
      : [["Nama Unit Kerja", "Total Pegawai", "Absen Masuk", "Absen Pulang", "Total Tidak Absen Masuk", "Total Tidak Absen Pulang", "Total Tidak Masuk Kerja", "Persentase Kehadiran Pagi", "Persentase Kehadiran Sore"]],
    body: unitTableBody,
    theme: 'grid',
    styles: { font: 'times', fontSize: opts.monthOptions ? 6.6 : 7, cellPadding: 1.1, textColor: [0, 0, 0], lineWidth: 0.5 },
    headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', fontSize: opts.monthOptions ? 6.6 : 7, cellPadding: 1.1 },
    columnStyles: opts.monthOptions
      ? {
          0: { cellWidth: contentWidth * 0.22, halign: 'left' },
          1: { cellWidth: contentWidth * 0.10, halign: 'center' },
          ...Object.fromEntries(
            weekHeaders.map((_, idx) => [idx + 2, { cellWidth: (contentWidth * 0.68) / weekCount, halign: 'center' }])
          ),
        }
      : {
          0: { cellWidth: contentWidth * 0.20, halign: 'left' },
          1: { cellWidth: contentWidth * 0.09, halign: 'center' },
          2: { cellWidth: contentWidth * 0.09, halign: 'center' },
          3: { cellWidth: contentWidth * 0.09, halign: 'center' },
          4: { cellWidth: contentWidth * 0.12, halign: 'center' },
          5: { cellWidth: contentWidth * 0.12, halign: 'center' },
          6: { cellWidth: contentWidth * 0.12, halign: 'center' },
          7: { cellWidth: contentWidth * 0.085, halign: 'center' },
          8: { cellWidth: contentWidth * 0.085, halign: 'center' },
        },
  });
   const unitFinalY = (doc as AutoTableDoc).lastAutoTable?.finalY ?? (summaryFinalY + 2.5);

   if (opts.monthOptions) {
     doc.setFont('times', 'bold');
     doc.setFontSize(8);
     doc.text('Keterangan: Minggu = pegawai dengan absen (masuk/pulang) / tidak absen.', marginX, unitFinalY + 4);
     doc.text('Absen dihitung jika ada masuk atau pulang pada minggu tersebut.', marginX, unitFinalY + 8);
   }

   // === REKAM KEHADIRAN TERBAIK (BERDASARKAN KELENGKAPAN) ===
   // Top berdasarkan jumlah hari lengkap (masuk + pulang) pada bulan berjalan s/d tanggal laporan.
   type BestAttendanceRow = {
     userId: string;
     name: string;
     unit: string;
     category: string;
     completeDays: number;
   };

   const isSundayWibFromDayString = (dayString: string): boolean => {
     const [yearStr, monthStr, dayStr] = dayString.split('-');
     const year = Number(yearStr);
     const month = Number(monthStr);
     const day = Number(dayStr);

     const wibMidnightUtc = new Date(Date.UTC(year, month - 1, day, -7, 0, 0, 0));
     const weekday = new Intl.DateTimeFormat('en-US', {
       timeZone: 'Asia/Jakarta',
       weekday: 'short',
     }).format(wibMidnightUtc);

     return weekday.toLowerCase() === 'sun';
   };

   const historySource = opts.attendancesHistory ?? opts.attendancesSelectedDate;

   const monthStartDay = opts.monthOptions?.monthStart ?? `${opts.selectedDate.split('-')[0]}-${opts.selectedDate.split('-')[1]}-01`;
   const monthEndDay = opts.monthOptions?.monthEnd ?? opts.selectedDate;

   const filteredHistory = historySource.filter((att) => {
     if (!att.created_at) return false;
     if (!att.user_id) return false;
     if (!userById.has(att.user_id)) return false;

     const day = dayKeyWib(att.created_at);
     return day >= monthStartDay && day <= monthEndDay;
   });

   const historyByUser = new Map<string, Map<string, { hasMasuk: boolean; hasPulang: boolean }>>();
   for (const att of filteredHistory) {
     if (!att.created_at) continue;
     if (!att.user_id) continue;

     const day = dayKeyWib(att.created_at);
     let perDay = historyByUser.get(att.user_id);
     if (!perDay) {
       perDay = new Map();
       historyByUser.set(att.user_id, perDay);
     }

     const current = perDay.get(day) ?? { hasMasuk: false, hasPulang: false };
     if (att.attendance_type === 'masuk') current.hasMasuk = true;
     if (att.attendance_type === 'pulang') current.hasPulang = true;
     perDay.set(day, current);
   }

   const bestRows: BestAttendanceRow[] = [];
   const processedBestUserIds = new Set<string>();

   for (const user of opts.trackedUsers) {
     if (processedBestUserIds.has(user.id)) continue;
     processedBestUserIds.add(user.id);

     const perDay = historyByUser.get(user.id);
     if (!perDay) continue;

     let completeDays = 0;
     for (const [day, dayEntry] of perDay.entries()) {
       if (isSundayWibFromDayString(day)) continue;
       if (dayEntry.hasMasuk && dayEntry.hasPulang) completeDays += 1;
     }

     if (completeDays === 0) continue;

     bestRows.push({
       userId: user.id,
       name: safeText(user.full_name),
       unit: normalizeUnitWithUsername(user),
       category: categoryLabel(user),
       completeDays,
     });
   }

   bestRows.sort((a, b) => b.completeDays - a.completeDays || a.name.localeCompare(b.name));

   const dosenBest = bestRows.filter((s) => s.category === 'Dosen Struktural');
   const tendikBest = bestRows.filter((s) => s.category === 'Tendik');

   const bestDosenTop = dosenBest.slice(0, 3);
   const bestTendikTop = tendikBest.slice(0, 3);

   const bestDosenBody = bestDosenTop.map((s, idx) => [String(idx + 1), s.name, s.unit, String(s.completeDays)]);
   const bestTendikBody = bestTendikTop.map((s, idx) => [String(idx + 1), s.name, s.unit, String(s.completeDays)]);

   // Check if we need a new page for best compliance section
   let bestStartY = (opts.monthOptions ? unitFinalY + 8 : unitFinalY + 8);
   const estimatedBestSectionHeight = 70;
   if (bestStartY + estimatedBestSectionHeight > pageHeight - 15) {
     doc.addPage();
     const newPageStartY = drawLetterhead();
     doc.setFont('times', 'bold');
     doc.setFontSize(14);
     doc.text('REKAM KEHADIRAN TERBAIK', pageWidth / 2, newPageStartY, { align: 'center' });
     bestStartY = newPageStartY + 10;
   } else {
     doc.setFont('times', 'bold');
     doc.setFontSize(12);
     doc.text('REKAM KEHADIRAN TERBAIK', pageWidth / 2, bestStartY - 2, { align: 'center' });
   }

    // Dosen Struktural Table
    autoTable(doc, {
      startY: bestStartY,
      margin: { left: marginX, right: marginX },
      tableWidth: contentWidth,
      head: [['#', 'Dosen Struktural', 'Unit Kerja', 'Hari Lengkap']],
      body: bestDosenBody.length ? bestDosenBody : [['-', 'Tidak ada data', '-', '-']],
      theme: 'grid',
      styles: { font: 'times', fontSize: 10, cellPadding: 2, textColor: [0, 0, 0], lineWidth: 0.4 },
      headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', fontSize: 9 },
      columnStyles: {
        0: { cellWidth: contentWidth * 0.06, halign: 'center' },
        1: { cellWidth: contentWidth * 0.42, halign: 'left' },
        2: { cellWidth: contentWidth * 0.42, halign: 'left' },
        3: { cellWidth: contentWidth * 0.10, halign: 'center' },
      },
    });


   const dosenTableFinalY = (doc as AutoTableDoc).lastAutoTable?.finalY ?? bestStartY;

    // Tendik Table
    autoTable(doc, {
      startY: dosenTableFinalY + 2,
      margin: { left: marginX, right: marginX },
      tableWidth: contentWidth,
      head: [['#', 'Tenaga Kependidikan', 'Unit Kerja', 'Hari Lengkap']],
      body: bestTendikBody.length ? bestTendikBody : [['-', 'Tidak ada data', '-', '-']],
      theme: 'grid',
      styles: { font: 'times', fontSize: 10, cellPadding: 2, textColor: [0, 0, 0], lineWidth: 0.4 },
      headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', fontSize: 9 },
      columnStyles: {
        0: { cellWidth: contentWidth * 0.06, halign: 'center' },
        1: { cellWidth: contentWidth * 0.42, halign: 'left' },
        2: { cellWidth: contentWidth * 0.42, halign: 'left' },
        3: { cellWidth: contentWidth * 0.10, halign: 'center' },
      },
    });


   const bestTableFinalY = (doc as AutoTableDoc).lastAutoTable?.finalY ?? (dosenTableFinalY + 2);

    // Formula explanation
    const lineHeight = 3.5;
    let formulaStartY = bestTableFinalY + 5;

    doc.setFont('times', 'bold');
    doc.setFontSize(8);
    doc.text('Formula: REKAM KEHADIRAN TERBAIK = jumlah "Hari Lengkap" terbanyak.', marginX, formulaStartY);
    formulaStartY += lineHeight + 1;

    doc.setFont('times', 'normal');
    doc.setFontSize(7);
    doc.text('Hari Lengkap: pada tanggal yang sama (WIB) terdapat absen masuk dan absen pulang (Hari Minggu tidak dihitung).', marginX, formulaStartY);
    formulaStartY += lineHeight + 1;

    doc.text(`Periode: ${monthStartDay} s/d ${monthEndDay}.`, marginX, formulaStartY);


   // Add footer/timestamp
   doc.setFontSize(8);
   doc.setFont('times', 'italic');
    const timestampDate = new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Jakarta',
    });
    const timestampTime = new Date().toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'Asia/Jakarta',
    });
    const timestamp = `${timestampDate} ${timestampTime} WIB`;
    doc.text(`Dicetak dari kehadiran.irfanananda28.com pada ${timestamp}`, pageWidth / 2, pageHeight - 10, { align: 'center' });


   // === DETAILED EMPLOYEE LISTINGS ===
   // Add new pages with employee listings grouped by unit kerja

  // Prepare data: group users by normalized unit kerja
  const dosenStrukturalUsers = opts.trackedUsers.filter((u) => {
    const role = (u.role || '').toLowerCase();
    const isStruktural = u.is_struktural === true;
    return u.username !== 'tesx' && u.username !== 'andi.syahrum.makkurade' && isStruktural && (role === 'dosen' || role === 'admin' || role === 'superadmin');
  });

  const tendikUsers = opts.trackedUsers.filter((u) => {
    // Special case: Irfan Ananda Ismail (superadmin)
    if (u.username === 'irfan.ananda.ismail') return true;
    // Special case: Asmara Indah (admin but tendik)
    if (u.username === 'asmara.indah') return true;
    // Exclude tesx
    if (u.username === 'tesx' || u.username === 'andi.syahrum.makkurade') return false;


    const role = (u.role || '').toLowerCase();
    if (role !== 'pegawai') return false;

    const unitKerja = (u.unit_kerja || '').toLowerCase();
    const excludedKeywords = [
      'satpam',
      'guru',
      'driver',
      'garin',
      'tk ekasakti',
      'sma ekasakti',
      'ka. kebersihan',
      'komandan satpam',
      'wakil komandan satpam',
      'cleaning service',
      'kebersihan',
    ];

    if (excludedKeywords.some((keyword) => unitKerja.includes(keyword))) return false;

    const includedKeywords = [
      'staf',
      'ka.',
      'kepala',
      'koordinator',
      'bendahara',
      'sekretaris',
      'operator',
      'koor.',
      'komandan',
      'kepsek',
      'waka',
      'pengelola',
    ];

    return includedKeywords.some((keyword) => unitKerja.includes(keyword));
  });

  // Group by unit kerja
  const dosenByUnit = new Map<string, KondisiStatistikUser[]>();
  const tendikByUnit = new Map<string, KondisiStatistikUser[]>();

  // Track processed users to prevent duplicates in listing
  const processedDosenIds = new Set<string>();
  const processedTendikIds = new Set<string>();

   for (const user of dosenStrukturalUsers) {
     // Skip if already processed
     if (processedDosenIds.has(user.id)) {
       continue;
     }
     processedDosenIds.add(user.id);
     
     const unit = normalizeUnitWithUsername(user);
    if (!dosenByUnit.has(unit)) {
      dosenByUnit.set(unit, []);
    }
    dosenByUnit.get(unit)!.push(user);
  }

   for (const user of tendikUsers) {
     // Skip if already processed
     if (processedTendikIds.has(user.id)) {
       continue;
     }
     processedTendikIds.add(user.id);
     
     const unit = normalizeUnitWithUsername(user);
    if (!tendikByUnit.has(unit)) {
      tendikByUnit.set(unit, []);
    }
    tendikByUnit.get(unit)!.push(user);
  }

  // Function to determine position priority based on job title
  const getPositionPriority = (unitKerja: string | null | undefined, username?: string | null): number => {
    const unit = (unitKerja || '').toLowerCase();
    
    // Special cases for specific users
    if (username === 'pandu.aji.putra.utama') return 1; // IT nomor 1
    if (username === 'syarifuddin.nur') return 1; // BAU nomor 1 (Ka. Perlengkapan & Plt. Ka. BAU)
    
    // AAI ordering - Desmiwerita first, then Yuli Ardiany
    if (username === 'desmiwerita') return 20; // Direktur AAI
    if (username === 'yuli.ardiany') return 21; // Dosen Struktural AAI, dibawah desmiwerita
    
    // LPPM Dosen Struktural ordering
    if (username === 'i.ketut.budaraga') return 30; // Ketua LPPM
    if (username === 'harry.setya.hadi') return 31; // Sek. LPPM
    if (username === 'rera.agung.syukra') return 32; // Dosen struktural LPPM, dibawah harry
    
    // Rektor (highest priority in Rektorat)
    if (unit.includes('rektor') && !unit.includes('wakil') && !unit.includes('wr')) return 1;
    
    // Wakil Rektor (WR I, WR II, WR III)
    // Catatan: beberapa jabatan memuat "WR I/II/III" tetapi bukan "Wakil Rektor" (mis. Staf Ahli WR I).
    // Handle kasus ini sebelum deteksi WR.
    if (unit.includes('staf ahli wr i')) return 7;
    if (unit.includes('staf ahli wr ii')) return 8;
    if (unit.includes('staf ahli wr iii')) return 9;

    if (unit.includes('wakil rektor i') || unit.includes('wr i')) return 2;
    if (unit.includes('wakil rektor ii') || unit.includes('wr ii')) return 3;
    if (unit.includes('wakil rektor iii') || unit.includes('wr iii')) return 4;
    if (unit.includes('wakil rektor') || unit.includes('wr ')) return 5;
    
    // Staf Ahli Rektor (setelah WR)
    if (unit.includes('staf ahli rektor')) return 6;
    
    // Staf WR I
    if (unit.includes('staf wr i')) return 7;
    
    // Staf WR II (tanpa operator siaga)
    if (unit.includes('staf wr ii') && !unit.includes('operator siaga')) return 8;
    
    // Staf WR II & Operator Siaga
    if (unit.includes('staf wr ii') && unit.includes('operator siaga')) return 9;
    
    // Staf WR III
    if (unit.includes('staf wr iii')) return 10;
    
    // Dekan (highest priority in fakultas)
    if (unit.includes('dekan') && !unit.includes('wadek') && !unit.includes('wakil')) return 20;
    
    // Wakil Dekan
    if (unit.includes('wadek') || (unit.includes('wakil') && unit.includes('dekan'))) return 21;
    
    // Direktur (for AAI)
    if (unit.includes('direktur') && !unit.includes('wakil')) return 20;
    
    // Wakil Direktur
    if (unit.includes('wakil direktur')) return 21;
    
     // Kepala LPM, LPPM, atau unit lainnya
     const lowerUnitForPriority = (unit || '').toLowerCase();
     if (lowerUnitForPriority.includes('kepala lpm') || lowerUnitForPriority.includes('ka. lpm') || lowerUnitForPriority === 'lpm') return 30;
     if (lowerUnitForPriority.includes('ketua lppm') || lowerUnitForPriority.includes('kepala lppm')) return 30;
     
     // Sekretaris LPPM
     if (lowerUnitForPriority.includes('sek. lppm') || lowerUnitForPriority.includes('sekretaris lppm')) return 31;
    
    // Koordinator Registrasi
    if (unit.includes('koordinator registrasi') || unit.includes('koor. registrasi')) return 1;
    
    // Kepala Prodi / Ka. Prodi
    if (unit.includes('ka. prodi') || unit.includes('kepala prodi')) return 40;
    if (unit.includes('ka.prodi')) return 40;
    
    // Sekretaris Prodi
    if (unit.includes('sek. prodi') || unit.includes('sekretaris prodi')) return 50;
    
    // Kepala unit lainnya (Ka. GPM, Ka. BKK, Ka. Lab, dll)
    if (unit.includes('ka. gpm')) return 60;
    if (unit.includes('ka. bkk')) return 61;
    if (unit.includes('ka. lab')) return 62;
    if (unit.includes('ka. perpustakaan')) return 63;
    if (unit.includes('ka. pmb')) return 64;
    if (unit.includes('ka.')) return 65;
    
    // Staf Ahli
    if (unit.includes('staf ahli')) return 70;
    
    // Staf biasa
    if (unit.includes('staf')) return 80;
    
    // Dosen biasa (tidak ada jabatan khusus)
    if (unit.includes('dosen')) return 90;
    
    // Default (no specific position detected)
    return 100;
  };

  // Sort users within each unit by position priority, then by full_name
  for (const users of dosenByUnit.values()) {
    users.sort((a, b) => {
      const priorityA = getPositionPriority(a.unit_kerja, a.username);
      const priorityB = getPositionPriority(b.unit_kerja, b.username);
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB; // Lower priority number = higher rank
      }
      
      // If same priority, sort alphabetically
      return safeText(a.full_name).localeCompare(safeText(b.full_name));
    });
  }
  
  for (const users of tendikByUnit.values()) {
    users.sort((a, b) => {
      const priorityA = getPositionPriority(a.unit_kerja, a.username);
      const priorityB = getPositionPriority(b.unit_kerja, b.username);
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB; // Lower priority number = higher rank
      }
      
      // If same priority, sort alphabetically
      return safeText(a.full_name).localeCompare(safeText(b.full_name));
    });
  }

  // Filter units to only include units that have users
  const dosenUnitsWithData = unitNames.filter((unit) => dosenByUnit.has(unit) && dosenByUnit.get(unit)!.length > 0);
  const tendikUnitsWithData = unitNames.filter((unit) => tendikByUnit.has(unit) && tendikByUnit.get(unit)!.length > 0);

  // === DOSEN STRUKTURAL LISTING PAGE ===
  if (dosenUnitsWithData.length > 0) {
    doc.addPage();
    
    // Draw letterhead on new page
    const dosenPageStartY = drawLetterhead();
    
    // Title
    doc.setFont('times', 'bold');
    doc.setFontSize(14);
    doc.text('DAFTAR DOSEN STRUKTURAL PER UNIT KERJA', pageWidth / 2, dosenPageStartY, { align: 'center' });
    
    let dosenCurrentY = dosenPageStartY + 8;

    for (const unitName of dosenUnitsWithData) {
      const usersInUnit = dosenByUnit.get(unitName)!;
      
      // Check if we need a new page
      const estimatedHeight = 15 + (usersInUnit.length * 6) + 5;
      if (dosenCurrentY + estimatedHeight > pageHeight - 20) {
        doc.addPage();
        dosenCurrentY = marginY + 10;
      }

      // Unit header
      doc.setFont('times', 'bold');
      doc.setFontSize(11);
      doc.text(`${unitName} (${usersInUnit.length} orang)`, marginX, dosenCurrentY);
      dosenCurrentY += 5;

      // Table for this unit
      const dosenTableBody = usersInUnit.map((user, idx) => [
        String(idx + 1),
        safeText(user.full_name),
        safeText(user.unit_kerja),
      ]);

      autoTable(doc, {
        startY: dosenCurrentY,
        tableWidth: contentWidth,
        margin: { left: marginX, right: marginX },
        head: [['No', 'Nama Lengkap', 'Unit Kerja / Jabatan']],
        body: dosenTableBody,
        theme: 'grid',
        styles: { font: 'times', fontSize: 9, cellPadding: 2, textColor: [0, 0, 0], lineWidth: 0.4 },
        headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', fontSize: 9.5 },
        columnStyles: {
          0: { cellWidth: contentWidth * 0.08, halign: 'center' },
          1: { cellWidth: contentWidth * 0.35, halign: 'left' },
          2: { cellWidth: contentWidth * 0.57, halign: 'left' },
        },
      });

      dosenCurrentY = (doc as AutoTableDoc).lastAutoTable?.finalY ?? dosenCurrentY;
      dosenCurrentY += 8; // Space between units
    }

    // Check if we have space for footer, otherwise add new page
    if (dosenCurrentY > pageHeight - 25) {
      doc.addPage();
      dosenCurrentY = marginY + 10;
    }

    // Footer on last page of dosen listing
    doc.setFontSize(8);
    doc.setFont('times', 'italic');
    const timestamp = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }) + ' ' + new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) + ' WIB';
    doc.text(`Dicetak dari https://kehadiran.irfanananda28.com pada ${timestamp}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  // === TENDIK LISTING PAGE ===
  if (tendikUnitsWithData.length > 0) {
    doc.addPage();
    
    // Draw letterhead on new page
    const tendikPageStartY = drawLetterhead();
    
    // Title
    doc.setFont('times', 'bold');
    doc.setFontSize(14);
    doc.text('DAFTAR TENAGA KEPENDIDIKAN (TENDIK) PER UNIT KERJA', pageWidth / 2, tendikPageStartY, { align: 'center' });
    
    let tendikCurrentY = tendikPageStartY + 8;

    for (const unitName of tendikUnitsWithData) {
      const usersInUnit = tendikByUnit.get(unitName)!;
      
      // Check if we need a new page
      const estimatedHeight = 15 + (usersInUnit.length * 6) + 5;
      if (tendikCurrentY + estimatedHeight > pageHeight - 20) {
        doc.addPage();
        tendikCurrentY = marginY + 10;
      }

      // Unit header
      doc.setFont('times', 'bold');
      doc.setFontSize(11);
      doc.text(`${unitName} (${usersInUnit.length} orang)`, marginX, tendikCurrentY);
      tendikCurrentY += 5;

      // Table for this unit
      const tendikTableBody = usersInUnit.map((user, idx) => [
        String(idx + 1),
        safeText(user.full_name),
        safeText(user.unit_kerja),
      ]);

      autoTable(doc, {
        startY: tendikCurrentY,
        tableWidth: contentWidth,
        margin: { left: marginX, right: marginX },
        head: [['No', 'Nama Lengkap', 'Unit Kerja / Jabatan']],
        body: tendikTableBody,
        theme: 'grid',
        styles: { font: 'times', fontSize: 9, cellPadding: 2, textColor: [0, 0, 0], lineWidth: 0.4 },
        headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', fontSize: 9.5 },
        columnStyles: {
          0: { cellWidth: contentWidth * 0.08, halign: 'center' },
          1: { cellWidth: contentWidth * 0.35, halign: 'left' },
          2: { cellWidth: contentWidth * 0.57, halign: 'left' },
        },
      });

      tendikCurrentY = (doc as AutoTableDoc).lastAutoTable?.finalY ?? tendikCurrentY;
      tendikCurrentY += 8; // Space between units
    }

    // Check if we have space for footer, otherwise add new page
    if (tendikCurrentY > pageHeight - 25) {
      doc.addPage();
      tendikCurrentY = marginY + 10;
    }

    // Footer on last page of tendik listing
    doc.setFontSize(8);
    doc.setFont('times', 'italic');
    const timestamp = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }) + ' ' + new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) + ' WIB';
    doc.text(`Dicetak dari https://kehadiran.irfanananda28.com pada ${timestamp}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
   }

   const filenamePrefix = opts.filenamePrefix ?? 'Laporan_Kondisi_Statistik';
   const filenameSuffix = opts.monthOptions ? opts.monthOptions.monthStart.slice(0, 7) : opts.selectedDate;
   const filename = `${filenamePrefix}_${filenameSuffix}.pdf`;
   doc.save(filename);
};

// === LAPORAN KEHADIRAN 5 PDF (RINGKAS 4 KOLOM) ===

export const generateLaporanKehadiran5PDF = async (opts: {
  selectedMonth?: string;
  stats?: KondisiStatistikStatsSnapshot;
  trackedUsers: KondisiStatistikUser[];
  attendances: KondisiStatistikAttendance[];
  reportTitle?: string;
  filenamePrefix?: string;
  monthOptions: {
    monthLabel: string;
    monthTitle: string;
    dates: number[];
    monthStart: string;
    monthEnd: string;
    categoryLabel?: string;
    holidayDates?: string[];
    holidayLabels?: Record<string, string>;
    leaveByUser?: Record<string, Record<string, 'izin' | 'cuti' | 'dinas_luar'>>;
    sortedUsers?: KondisiStatistikUser[];
  };
}) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 10;
  const marginY = 10;

  const dayKeyWib = (iso: string) => {
    const d = new Date(iso);
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  };

  const safeText = (value: string | null | undefined) => (value ?? '').trim() || '-';

  let logoData: string | null = null;
  try {
    logoData = await fetch('/unes.png')
      .then((response) => response.blob())
      .then(
        (blob) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          })
      );
  } catch {
    // ignore
  }

  const drawLetterhead = (): number => {
    const headerTopY = marginY;
    let currentY = headerTopY;

    if (logoData) {
      doc.addImage(logoData, 'PNG', marginX, headerTopY, 18, 18);
    }

    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text('YAYASAN PERGURUAN TINGGI PADANG', pageWidth / 2, currentY + 2, { align: 'center' });

    doc.setFontSize(15);
    doc.text('UNIVERSITAS EKASAKTI', pageWidth / 2, currentY + 8.5, { align: 'center' });

    doc.setFont('times', 'normal');
    doc.setFontSize(8.5);
    doc.text('Jl. Veteran Dalam No. 26 Padang (25113) Telp. (0751) 28859-26770', pageWidth / 2, currentY + 13.5, {
      align: 'center',
    });
    doc.text('Fax. (0751) 32694; https://unespadang.ac.id/', pageWidth / 2, currentY + 17.5, { align: 'center' });

    const lineY = currentY + 21;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.8);
    doc.line(marginX, lineY, pageWidth - marginX, lineY);
    doc.setLineWidth(0.3);
    doc.line(marginX, lineY + 1.2, pageWidth - marginX, lineY + 1.2);

    currentY = lineY + 6;

    doc.setFont('times', 'bold');
    doc.setFontSize(14);
    doc.text(opts.reportTitle ?? 'LAPORAN REKAPITULASI KEHADIRAN', pageWidth / 2, currentY, { align: 'center' });
    currentY += 6;

    doc.setFontSize(11);
    doc.text(`Periode: ${opts.monthOptions.monthLabel}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;

    if (opts.monthOptions.categoryLabel) {
      doc.setFontSize(10);
      doc.text(`Kategori: ${opts.monthOptions.categoryLabel}`, pageWidth / 2, currentY, { align: 'center' });
      currentY += 5;
    }

    return currentY + 2;
  };

  const contentStartY = drawLetterhead();
  const contentWidth = pageWidth - marginX * 2; // 190mm

  const holidaySet = new Set(opts.monthOptions.holidayDates ?? []);
  const leaveByUser = opts.monthOptions.leaveByUser ?? {};
  const todayKey = dayKeyWib(new Date().toISOString());
  const monthStartDay = opts.monthOptions.monthStart;
  const year = Number(monthStartDay.split('-')[0] ?? 0);
  const monthIndex = Number(monthStartDay.split('-')[1] ?? 1) - 1;
  const dates = opts.monthOptions.dates;

  const attendanceMap = new Map<string, { masuk: Set<string>; pulang: Set<string> }>();

  opts.attendances.forEach((att) => {
    if (!att.user_id || !att.created_at) return;
    const dayKey = dayKeyWib(att.created_at);
    if (!attendanceMap.has(att.user_id)) {
      attendanceMap.set(att.user_id, { masuk: new Set(), pulang: new Set() });
    }
    const record = attendanceMap.get(att.user_id)!;
    if (att.attendance_type === 'masuk') record.masuk.add(dayKey);
    if (att.attendance_type === 'pulang') record.pulang.add(dayKey);
  });

  const sortedUsers = (opts.monthOptions.sortedUsers ?? opts.trackedUsers).filter(
    (user) => (user.username ?? '').toLowerCase() !== 'andi.syahrum.makkurade' && (user.username ?? '').toLowerCase() !== 'tesx'
  );

  const colNo = 10;
  const colName = 55;
  const colUnit = 55;
  const colKeterangan = 70;

  const headRows = [
    [
      { content: 'No', styles: { halign: 'center' as const } },
      { content: 'Nama', styles: { halign: 'center' as const } },
      { content: 'Unit Kerja / Jabatan', styles: { halign: 'center' as const } },
      { content: `Keterangan Bulan ${opts.monthOptions.monthLabel}`, styles: { halign: 'center' as const } },
    ],
  ];

  const bodyRows = sortedUsers.map((u, idx) => {
    const record = attendanceMap.get(u.id) ?? { masuk: new Set<string>(), pulang: new Set<string>() };
    let totalAbsenMasuk = 0;
    let totalAbsenPulang = 0;
    let totalTidakMasuk = 0;
    let totalTidakPulang = 0;
    let totalHariKerja = 0;
    let totalHadir = 0;
    let totalIzin = 0;
    let totalCuti = 0;
    let totalDinasLuar = 0;

    dates.forEach((day) => {
      const dateKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dateObj = new Date(year, monthIndex, day);
      const isSunday = dateObj.getDay() === 0;
      if (isSunday || holidaySet.has(dateKey)) {
        return;
      }
      totalHariKerja += 1;
      const leaveType = leaveByUser[u.id]?.[dateKey];
      if (leaveType) {
        if (leaveType === 'dinas_luar') totalDinasLuar += 1;
        else if (leaveType === 'cuti') totalCuti += 1;
        else totalIzin += 1;
        return;
      }

      const isFuture = dateKey > todayKey;
      const hasMasukActual = record.masuk.has(dateKey);
      const hasPulang = record.pulang.has(dateKey);

      if (!hasMasukActual && !hasPulang && isFuture) {
        return;
      }

      if (hasMasukActual) totalAbsenMasuk += 1;
      if (hasPulang) totalAbsenPulang += 1;
      if (hasMasukActual || hasPulang) {
        totalHadir += 1;
      }
      if (!hasMasukActual) totalTidakMasuk += 1;
      if (!hasPulang) totalTidakPulang += 1;
    });

    const noteLines = [
      `Total Hari Kerja: ${totalHariKerja}`,
      `Total Hadir: ${totalHadir}`,
      `Total Absen Masuk: ${totalAbsenMasuk}`,
      `Total Absen Pulang: ${totalAbsenPulang}`,
      `Total Tidak Absen Masuk: ${totalTidakMasuk}`,
      `Total Tidak Absen Pulang: ${totalTidakPulang}`,
      `Total Izin: ${totalIzin}`,
      `Total Cuti: ${totalCuti}`,
      `Total Dinas Luar: ${totalDinasLuar}`,
    ];

    return [
      String(idx + 1),
      safeText(u.full_name),
      safeText(u.unit_kerja),
      noteLines.join('\n'),
    ];
  });

  const nowStamp = new Date();
  const footerDate = nowStamp.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  });
  const footerTime = nowStamp.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta',
  });
  const footerText = `Dicetak dari kehadiran.irfanananda28.com pada ${footerDate} ${footerTime} WIB`;

  autoTable(doc, {
    startY: contentStartY,
    tableWidth: contentWidth,
    margin: { left: marginX, right: marginX, bottom: 10 },
    head: headRows,
    body: bodyRows,
    theme: 'grid',
    rowPageBreak: 'avoid',
    didDrawPage: (data) => {
      doc.setFont('times', 'italic');
      doc.setFontSize(7.5);
      doc.text(footerText, marginX, pageHeight - 4);
      doc.text(`Halaman ${data.pageNumber}`, pageWidth - marginX, pageHeight - 4, { align: 'right' });
    },
    styles: {
      font: 'times',
      fontSize: 14,
      cellPadding: 2,
      textColor: [0, 0, 0],
      lineWidth: 0.4,
      lineColor: [0, 0, 0],
      valign: 'middle',
    },
    headStyles: {
      fillColor: [225, 225, 225],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      fontSize: 14,
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { cellWidth: colNo, halign: 'center', valign: 'middle' },
      1: { cellWidth: colName, halign: 'left', valign: 'middle', fontStyle: 'bold' },
      2: { cellWidth: colUnit, halign: 'left', valign: 'middle' },
      3: { cellWidth: colKeterangan, halign: 'left', valign: 'middle' },
    },
  });

  const filenamePrefix = opts.filenamePrefix ?? `Rekap_${opts.monthOptions.monthLabel}_Ringkas`;
  const filename = `${filenamePrefix}.pdf`;
  doc.save(filename);
};

// === LAPORAN INDIVIDU PDF ===

interface IndividualReportData {
  user: {
    id: string;
    full_name: string;
    username: string;
    role: string;
    unit_kerja: string;
    created_at: string;
  };
  stats: {
    totalHadir: number;
    totalKurangJam: number;
    totalIzin: number;
    totalCuti: number;
    totalDinasLuar: number;
    attendancePercentage: number;
    radarMetrics: { metric: string; value: number; fullMark: number }[];
    statusDistribution: { name: string; value: number; color: string }[];
    monthlyTrend: { month: string; Hadir: number; Izin: number }[];
    recentAttendances: Array<{
      id?: string;
      created_at: string;
      attendance_type: 'masuk' | 'pulang' | string;
      status: string;
      note?: string;
    }>;
  };
  timeFilter: 'minggu' | 'bulan' | 'tahun';
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export const generateIndividualDashboardPDF = async (opts: {
  element: HTMLElement;
  filename?: string;
}) => {
  const element = opts.element;

  // A4 portrait (mm)
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    useCORS: true,
    scale: Math.max(2, Math.min(3, window.devicePixelRatio || 2)),
    scrollX: 0,
    scrollY: -window.scrollY,
  });

  const imgData = canvas.toDataURL('image/png');

  const margin = 8;
  const usableWidth = pageWidth - margin * 2;

  // Image size in PDF units.
  const imgWidth = usableWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let renderedHeight = 0;
  let pageIndex = 0;

  while (renderedHeight < imgHeight - 0.01) {
    if (pageIndex > 0) pdf.addPage();

    const remainingHeight = imgHeight - renderedHeight;
    const usableHeight = pageHeight - margin * 2;
    const heightOnThisPage = Math.min(usableHeight, remainingHeight);

    // Draw the same image shifted upward to simulate cropping.
    const yOffset = margin - renderedHeight;
    pdf.addImage(imgData, 'PNG', margin, yOffset, imgWidth, imgHeight);

    renderedHeight += heightOnThisPage;
    pageIndex += 1;
  }

  const filename = opts.filename || `Laporan_Individu_${new Date().toISOString().slice(0, 10)}.pdf`;
  pdf.save(filename);
};

const fetchAttendancePhoto = async (photoUrl: string | null | undefined): Promise<string | null> => {
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
      const blob = await response.blob();
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    }

    return null;
  } catch {
    return null;
  }
};

const generateFallbackPhotoBadge = (label: string): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="200" viewBox="0 0 180 200">
    <rect width="180" height="200" rx="8" fill="#f8fafc" stroke="#8c1b1d" stroke-width="2"/>
    <circle cx="90" cy="70" r="32" fill="#8c1b1d"/>
    <circle cx="90" cy="60" r="14" fill="#ffffff"/>
    <path d="M60 100 c 0 -18 60 -18 60 0 Z" fill="#ffffff"/>
    <rect x="15" y="145" width="150" height="38" rx="6" fill="#8c1b1d"/>
    <text x="90" y="168" font-family="sans-serif" font-size="13" font-weight="bold" fill="#ffffff" text-anchor="middle">PRESENSI UNES</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

export const generateIndividualReportPDF = async (opts: IndividualReportPDFParams) => {
  const { user, stats, selectedMonth, selectedYear, holidays = [], permits = [] } = opts;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const periodText = `${monthNames[selectedMonth - 1]} ${selectedYear}`;

  // Load logo
  let logoData: string | null = null;
  try {
    logoData = await fetch('/unes.png')
      .then((res) => res.blob())
      .then((blob) => new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      }));
  } catch (err) {
    console.warn("Logo unesp.png tidak dapat dimuat:", err);
  }

  // Pre-fetch all photos in parallel
  const photoCache: Record<string, string | null> = {};
  const photoPromises = stats.recentAttendances
    .filter(a => a.photo_url)
    .map(async a => {
      if (a.photo_url && !photoCache[a.photo_url]) {
        photoCache[a.photo_url] = await fetchAttendancePhoto(a.photo_url);
      }
    });
  await Promise.all(photoPromises);

  // Draw Kop Surat
  const drawHeader = () => {
    let currentY = 12;
    if (logoData) {
      doc.addImage(logoData, 'PNG', marginX, currentY, 20, 20);
    }

    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.text('YAYASAN PERGURUAN TINGGI PADANG', pageWidth / 2, currentY + 3, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text('UNIVERSITAS EKASAKTI', pageWidth / 2, currentY + 9, { align: 'center' });
    
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.text('Jl. Veteran Dalam No. 26 Padang (25113) Telp. (0751) 28859-26770', pageWidth / 2, currentY + 14, { align: 'center' });
    doc.text('Fax. (0751) 32694; https://unespadang.ac.id/', pageWidth / 2, currentY + 18, { align: 'center' });
    
    currentY += 22;

    // Double line
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.8);
    doc.line(marginX, currentY, pageWidth - marginX, currentY);
    doc.setLineWidth(0.3);
    doc.line(marginX, currentY + 1, pageWidth - marginX, currentY + 1);
    
    currentY += 7;

    // Document Title
    doc.setFont('times', 'bold');
    doc.setFontSize(13);
    doc.text('LAPORAN REKAPITULASI PRESENSI KEHADIRAN INDIVIDU', pageWidth / 2, currentY, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('times', 'bold');
    doc.text(`Periode: ${periodText}`, pageWidth / 2, currentY + 5, { align: 'center' });

    return currentY + 10;
  };

  let currentY = drawHeader();

  // User Profile & Metadata Table (Full-Width 2-Column Format - No Wrapping!)
  const profileTableData = [
    [
      { content: 'Nama Lengkap', styles: { fontStyle: 'bold' } },
      { content: `: ${user.full_name}` }
    ],
    [
      { content: 'Unit Kerja', styles: { fontStyle: 'bold' } },
      { content: `: ${user.unit_kerja || 'Universitas Ekasakti'}` }
    ],
    [
      { content: 'Total Presensi Hadir', styles: { fontStyle: 'bold' } },
      { content: `: ${stats.totalHadir} Rekam presensi` }
    ],
    [
      { content: 'Persentase Kehadiran', styles: { fontStyle: 'bold' } },
      { content: `: ${stats.attendancePercentage}%` }
    ]
  ];

  autoTable(doc, {
    startY: currentY,
    body: profileTableData as any,
    theme: 'plain',
    margin: { left: marginX, right: marginX },
    styles: {
      font: 'times',
      fontSize: 9.5,
      cellPadding: 1.2,
      textColor: [0, 0, 0],
    },
    columnStyles: {
      0: { cellWidth: 42 },
      1: { cellWidth: 'auto' }, // 140mm full width! Fits long names & unit kerja on 1 clean line!
    }
  });

  currentY = (doc as AutoTableDoc).lastAutoTable?.finalY ? (doc as AutoTableDoc).lastAutoTable!.finalY + 6 : currentY + 30;

  // Build Monthly Daily Presensi Data (1 to lastDay)
  const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();

  // 1. Map holidays by date "YYYY-MM-DD"
  const holidayMap: Record<string, string> = {};
  holidays.forEach(h => {
    if (h.holiday_date) {
      holidayMap[h.holiday_date] = h.description;
    }
  });

  // 2. Map permits by date range
  const permitMap: Record<string, string> = {};
  permits.forEach(p => {
    if (p.start_date && p.end_date) {
      const start = new Date(p.start_date);
      const end = new Date(p.end_date);
      for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
        const key = dt.toLocaleDateString('sv-SE');
        permitMap[key] = p.permit_type.toUpperCase() + (p.reason ? ` (${p.reason})` : '');
      }
    }
  });

  // 3. Map attendances by date "YYYY-MM-DD"
  const attMap: Record<string, { masukTime?: string; masukPhoto?: string | null; pulangTime?: string; pulangPhoto?: string | null; note?: string }> = {};
  stats.recentAttendances.forEach(att => {
    const d = new Date(att.created_at);
    const key = d.toLocaleDateString('sv-SE');
    const timeStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    const photoDataUrl = att.photo_url ? photoCache[att.photo_url] || null : null;

    if (!attMap[key]) {
      attMap[key] = {};
    }

    const isMasuk = att.attendance_type === 'masuk' || (!att.attendance_type && !attMap[key].masukTime);
    if (isMasuk) {
      attMap[key].masukTime = timeStr;
      attMap[key].masukPhoto = photoDataUrl;
    } else {
      attMap[key].pulangTime = timeStr;
      attMap[key].pulangPhoto = photoDataUrl;
    }
    if (att.note) attMap[key].note = att.note;
  });

  // Build table rows for day 1 to lastDay
  const monthlyRows: any[] = [];
  const cellPhotoMap: Record<string, { photoUrl: string; timeStr: string }> = {}; // key: "${rowIndex}_${colIndex}"
  const rowsWithPhoto = new Set<number>();

  for (let d = 1; d <= lastDay; d++) {
    const padM = String(selectedMonth).padStart(2, '0');
    const padD = String(d).padStart(2, '0');
    const dateKey = `${selectedYear}-${padM}-${padD}`;
    const dateObj = new Date(selectedYear, selectedMonth - 1, d);
    const dayOfWeek = dateObj.getDay(); // 0 = Sunday

    const dayName = dateObj.toLocaleDateString('id-ID', { weekday: 'long' });
    const formattedDate = `${dayName}, ${padD}/${padM}/${selectedYear}`;

    let masukText = '-';
    let pulangText = '-';
    let ketText = '-';

    const isSunday = dayOfWeek === 0;
    const holidayDesc = holidayMap[dateKey];
    const permitDesc = permitMap[dateKey];
    const attRecord = attMap[dateKey];
    const rowIndex = d - 1;

    if (holidayDesc) {
      masukText = `Libur: ${holidayDesc}`;
      pulangText = `Libur: ${holidayDesc}`;
      ketText = `Hari Libur Nasional (${holidayDesc})`;
    } else if (isSunday) {
      masukText = 'Libur Akhir Pekan';
      pulangText = 'Libur Akhir Pekan';
      ketText = 'Libur Minggu';
    } else if (permitDesc) {
      masukText = '-';
      pulangText = '-';
      ketText = `Izin/Cuti: ${permitDesc}`;
    } else if (attRecord && (attRecord.masukTime || attRecord.pulangTime)) {
      ketText = 'Hadir Presensi';

      if (attRecord.masukTime) {
        masukText = ''; // Clear background text
        const photo = attRecord.masukPhoto || generateFallbackPhotoBadge('Masuk');
        cellPhotoMap[`${rowIndex}_2`] = { photoUrl: photo, timeStr: attRecord.masukTime };
        rowsWithPhoto.add(rowIndex);
      } else {
        masukText = '-';
      }

      if (attRecord.pulangTime) {
        pulangText = ''; // Clear background text
        const photo = attRecord.pulangPhoto || generateFallbackPhotoBadge('Pulang');
        cellPhotoMap[`${rowIndex}_3`] = { photoUrl: photo, timeStr: attRecord.pulangTime };
        rowsWithPhoto.add(rowIndex);
      } else {
        pulangText = '-';
      }
    } else {
      masukText = '-';
      pulangText = '-';
      ketText = 'Tidak Ada Presensi';
    }

    monthlyRows.push([
      d,
      formattedDate,
      masukText,
      pulangText,
      ketText
    ]);
  }

  // Draw Main Presensi Table with Embedded Photos (Strict 7 Rows Per Page Chunking!)
  const ROWS_PER_PAGE = 7;
  const rowChunks: any[][] = [];
  for (let i = 0; i < monthlyRows.length; i += ROWS_PER_PAGE) {
    rowChunks.push(monthlyRows.slice(i, i + ROWS_PER_PAGE));
  }

  rowChunks.forEach((chunkRows, chunkIdx) => {
    if (chunkIdx > 0) {
      doc.addPage();
      let topY = 14;
      
      // Continuation Page Mini Header
      doc.setFont('times', 'bold');
      doc.setFontSize(11);
      doc.text('UNIVERSITAS EKASAKTI', pageWidth / 2, topY, { align: 'center' });
      doc.setFontSize(10);
      doc.text(`LAPORAN REKAPITULASI PRESENSI KEHADIRAN INDIVIDU (Lanjutan - Hal ${chunkIdx + 1})`, pageWidth / 2, topY + 5, { align: 'center' });
      doc.setFont('times', 'normal');
      doc.setFontSize(9);
      doc.text(`Nama: ${user.full_name} | Periode: ${periodText}`, pageWidth / 2, topY + 9.5, { align: 'center' });
      
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.line(marginX, topY + 12, pageWidth - marginX, topY + 12);
      
      currentY = topY + 16;
    }

    autoTable(doc, {
      startY: currentY,
      head: [['No', 'Hari / Tanggal', 'Presensi Masuk', 'Presensi Pulang', 'Keterangan Presensi']],
      body: chunkRows,
      theme: 'grid',
      margin: { left: marginX, right: marginX },
      styles: {
        font: 'times',
        fontSize: 8.5,
        cellPadding: 2,
        textColor: [0, 0, 0],
        lineWidth: 0.3,
        valign: 'middle',
      },
      headStyles: {
        fillColor: [140, 27, 29], // UNES Maroon #8c1b1d
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
        fontSize: 9,
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 40, halign: 'left' },
        2: { cellWidth: 44, halign: 'center' },
        3: { cellWidth: 44, halign: 'center' },
        4: { cellWidth: 'auto', halign: 'left' },
      },
      didParseCell: (data) => {
        if (data.section === 'body') {
          const globalRowIdx = chunkIdx * ROWS_PER_PAGE + data.row.index;
          if (rowsWithPhoto.has(globalRowIdx)) {
            data.cell.styles.minCellHeight = 30; // Enforce 30mm row height on all cells in photo rows
            data.row.height = 30;
          }
        }
      },
      didDrawCell: (data) => {
        if (data.section === 'body') {
          const globalRowIdx = chunkIdx * ROWS_PER_PAGE + data.row.index;
          const key = `${globalRowIdx}_${data.column.index}`;
          const photoInfo = cellPhotoMap[key];
          if (photoInfo) {
            try {
              const imgWidth = 18;  // 1.5x enlarged width
              const imgHeight = 20; // 1.5x enlarged height
              const posX = data.cell.x + (data.cell.width - imgWidth) / 2;
              const posY = data.cell.y + 2;
              const format = photoInfo.photoUrl.startsWith('data:image/svg') ? 'SVG' : 'JPEG';

              // 1. Draw 1.5x enlarged photo or fallback SVG badge
              doc.addImage(photoInfo.photoUrl, format, posX, posY, imgWidth, imgHeight);

              // 2. Draw time text directly BELOW photo (centered, bold, no clashing!)
              doc.setFont('times', 'bold');
              doc.setFontSize(8);
              doc.setTextColor(0, 0, 0);
              doc.text(
                photoInfo.timeStr,
                data.cell.x + data.cell.width / 2,
                posY + imgHeight + 4.2,
                { align: 'center' }
              );
            } catch (e) {
              console.warn("Failed to render cell image:", e);
            }
          }
        }
      }
    });

    currentY = (doc as AutoTableDoc).lastAutoTable?.finalY ? (doc as AutoTableDoc).lastAutoTable!.finalY + 6 : currentY + 150;
  });

  const finalY = currentY;

  // Add new page if signature section won't fit
  if (finalY > pageHeight - 45) {
    doc.addPage();
    currentY = 25;
  }

  const sigY = finalY > pageHeight - 45 ? 25 : finalY;
  const rightX = pageWidth - marginX - 60;

  doc.setFont('times', 'normal');
  doc.setFontSize(9.5);
  doc.text(`Padang, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, rightX, sigY);
  doc.text('Wakil Rektor II,', rightX, sigY + 5);

  doc.setFont('times', 'bold');
  doc.text('Dr. Susi Delmiati, S.H, M.H', rightX, sigY + 28);
  doc.setFont('times', 'normal');
  doc.text('NIDN / NIP. YPTP 10129201', rightX, sigY + 33);

  // Footer page numbering on ALL pages
  const totalPages = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setFont('times', 'italic');
    doc.text(
      `Dokumen Resmi Sistem Informasi Presensi UNES-AAI • Halaman ${p} dari ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  // Save PDF file
  const sanitizeName = user.full_name.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Laporan_Presensi_${sanitizeName}_${monthNames[selectedMonth - 1]}_${selectedYear}.pdf`;
  doc.save(filename);
};

