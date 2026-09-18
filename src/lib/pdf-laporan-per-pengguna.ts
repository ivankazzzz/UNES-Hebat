import jsPDF from "jspdf";

export interface MonthlyUserReportUser {
  full_name: string;
  username: string;
  role: string;
  unit_kerja: string | null;
  primary_location?: string | null;
  secondary_location?: string[] | null;
  is_struktural?: boolean | null;
}

export interface MonthlyUserReportStats {
  absenMasuk: number;
  absenPulang: number;
  sakit: number;
  cuti: number;
  alpa: number;
  total: number;
  hariKerja: number;
  hadirHari: number;
  izin: number;
  dinasLuar: number;
}

export interface MonthlyUserReportPhoto {
  timeLabel: string;
  dataUrl: string | null;
}

export interface MonthlyUserReportPhotoDay {
  dateKey: string;
  masuk: MonthlyUserReportPhoto | null;
  pulang: MonthlyUserReportPhoto | null;
  leaveLabel: string | null;
}

export interface MonthlyUserReportOptions {
  user: MonthlyUserReportUser;
  month: number;
  year: number;
  printedAt: Date;
  stats: MonthlyUserReportStats;
  photoDays: MonthlyUserReportPhotoDay[];
}

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const safeText = (value: string | null | undefined) => {
  const text = (value ?? "").trim();
  return text || "-";
};

const roleLabel = (role: string) => {
  switch ((role || "").toLowerCase()) {
    case "superadmin":
      return "Superadmin";
    case "admin":
      return "Admin";
    case "dosen":
      return "Dosen";
    case "pegawai":
      return "Pegawai";
    default:
      return safeText(role);
  }
};

const formatDateLong = (date: Date) =>
  date.toLocaleDateString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const formatPrintedAtWib = (date: Date) => {
  const datePart = date.toLocaleDateString("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return `${datePart} ${timePart} WIB`;
};

const formatDateKeyLong = (dateKey: string) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const imageFormatFromDataUrl = (dataUrl: string) => {
  if (dataUrl.startsWith("data:image/png")) return "PNG";
  if (dataUrl.startsWith("data:image/webp")) return "WEBP";
  return "JPEG";
};

const absenceLabel = (type: "masuk" | "pulang", leaveLabel: string | null) => {
  if (leaveLabel) return leaveLabel;
  return type === "masuk" ? "Alpha\nTidak Absen Masuk" : "Alpha\nTidak Absen Pulang";
};

const loadLogoDataUrl = async () => {
  try {
    const response = await fetch("/unes.png");
    const blob = await response.blob();

    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

const drawCell = (
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  text: string,
  options: {
    bold?: boolean;
    fontSize?: number;
    align?: "left" | "center" | "right";
    valign?: "top" | "middle";
    fill?: [number, number, number];
  } = {},
) => {
  if (options.fill) {
    doc.setFillColor(...options.fill);
    doc.rect(x, y, width, height, "F");
  }

  doc.setDrawColor(80, 80, 80);
  doc.setLineWidth(0.2);
  doc.rect(x, y, width, height);
  doc.setFont("helvetica", options.bold ? "bold" : "normal");
  doc.setFontSize(options.fontSize ?? 8);
  doc.setTextColor(0, 0, 0);

  const lines = doc.splitTextToSize(text, width - 4) as string[];
  const lineHeight = (options.fontSize ?? 8) * 0.38;
  const textHeight = lines.length * lineHeight;
  const top =
    options.valign === "middle"
      ? y + (height - textHeight) / 2 + lineHeight - 0.8
      : y + 4;
  const left =
    options.align === "center"
      ? x + width / 2
      : options.align === "right"
        ? x + width - 2
        : x + 2;

  doc.text(lines, left, top, { align: options.align ?? "left" });
};

export const generateMonthlyUserAttendancePDF = async ({
  user,
  month,
  year,
  printedAt,
  stats,
  photoDays,
}: MonthlyUserReportOptions) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 12;
  const contentWidth = pageWidth - marginX * 2;
  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`;
  const logoDataUrl = await loadLogoDataUrl();

  doc.setDrawColor(60, 60, 60);
  doc.setLineWidth(0.25);

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", marginX + 1.5, 10, 18, 18);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("YAYASAN PERGURUAN TINGGI PADANG", marginX + 23, 13);
  doc.setFontSize(12);
  doc.text("UNIVERSITAS EKASAKTI", marginX + 23, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("Jl. Veteran Dalam No. 26 Padang (25113)", marginX + 23, 22.5);
  doc.text("Telp. (0751) 28859 - https://unespadang.ac.id/", marginX + 23, 26.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.6);
  doc.text("Surat ini adalah dokumen rekap internal", pageWidth - marginX - 3, 13, { align: "right" });
  doc.text("yang diterbitkan oleh aplikasi", pageWidth - marginX - 3, 17, { align: "right" });
  doc.text("Absensi UNES-AAI", pageWidth - marginX - 3, 21, { align: "right" });

  let y = 31;
  drawCell(doc, marginX, y, contentWidth - 23, 10, "HASIL REKAPITULASI BULANAN KEHADIRAN PEGAWAI\nUNIVERSITAS EKASAKTI", {
    bold: true,
    fontSize: 8,
    valign: "middle",
  });
  drawCell(doc, marginX + contentWidth - 23, y, 23, 10, "UNES", {
    bold: true,
    fontSize: 14,
    align: "center",
    valign: "middle",
  });

  y += 10;
  drawCell(doc, marginX, y, 42, 8, "Periode rekap", { fontSize: 7, fill: [248, 248, 248], valign: "middle" });
  drawCell(doc, marginX + 42, y, 62, 8, monthLabel, { bold: true, fontSize: 7, valign: "middle" });
  drawCell(doc, marginX + 104, y, 30, 8, "Tgl. Cetak", { fontSize: 7, fill: [248, 248, 248], valign: "middle" });
  drawCell(doc, marginX + 134, y, contentWidth - 134, 8, formatDateLong(printedAt), { fontSize: 7, valign: "middle" });

  y += 11;
  drawCell(doc, marginX, y, contentWidth, 7, "IDENTITAS PENGGUNA", {
    bold: true,
    fontSize: 7,
    fill: [244, 244, 244],
    valign: "middle",
  });

  y += 7;
  const photoX = marginX + contentWidth - 39;
  drawCell(doc, photoX, y, 39, 40, "", {});
  doc.setFillColor(235, 239, 244);
  doc.rect(photoX + 5, y + 5, 29, 30, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(21);
  doc.setTextColor(70, 91, 120);
  doc.text(user.full_name.slice(0, 1).toUpperCase(), photoX + 19.5, y + 24, { align: "center" });
  doc.setTextColor(0, 0, 0);

  const labelW = 37;
  const valueW = contentWidth - 39 - labelW;
  const rowH = 8;
  const identityRows = [
    ["Nama", safeText(user.full_name)],
    ["Username", safeText(user.username)],
    ["Role", roleLabel(user.role)],
    ["Unit Kerja", safeText(user.unit_kerja)],
    ["Status", user.is_struktural ? "Dosen Struktural" : roleLabel(user.role)],
  ];

  identityRows.forEach(([label, value], index) => {
    const rowY = y + index * rowH;
    drawCell(doc, marginX, rowY, labelW, rowH, label, { fontSize: 7, fill: [252, 252, 252], valign: "middle" });
    drawCell(doc, marginX + labelW, rowY, valueW, rowH, value, { fontSize: 7, valign: "middle" });
  });

  y += 43;
  drawCell(doc, marginX, y, contentWidth, 7, "LOKASI / UNIT ABSENSI", {
    bold: true,
    fontSize: 7,
    fill: [244, 244, 244],
    valign: "middle",
  });
  y += 7;
  const secondaryLocations = user.secondary_location?.filter(Boolean).join(", ");
  drawCell(doc, marginX, y, 35, 20, "Lokasi\nabsensi", { fontSize: 7, align: "center", valign: "middle" });
  drawCell(
    doc,
    marginX + 35,
    y,
    contentWidth - 35,
    20,
    `Utama: ${safeText(user.primary_location || user.unit_kerja)}\nSekunder: ${safeText(secondaryLocations)}\nUnit kerja: ${safeText(user.unit_kerja)}`,
    { fontSize: 7, valign: "middle" },
  );

  y += 23;
  drawCell(doc, marginX, y, contentWidth, 7, "DATA ABSENSI", {
    bold: true,
    fontSize: 7,
    fill: [244, 244, 244],
    valign: "middle",
  });
  y += 7;
  const statColW = contentWidth / 5;
  ["Absen Masuk", "Absen Pulang", "Sakit", "Izin", "Alpha"].forEach((label, index) => {
    drawCell(doc, marginX + index * statColW, y, statColW, 8, label, {
      fontSize: 7,
      fill: [252, 252, 252],
      valign: "middle",
    });
  });
  y += 8;
  [stats.absenMasuk, stats.absenPulang, stats.sakit, stats.izin, stats.alpa].forEach((value, index) => {
    drawCell(doc, marginX + index * statColW, y, statColW, 9, String(value), {
      fontSize: 8,
      bold: true,
      valign: "middle",
    });
  });

  y += 13;
  drawCell(doc, marginX, y, contentWidth / 2, 60, "Catatan:\nData dihitung dari hari kerja Senin-Sabtu, dikurangi hari libur aktif serta izin/cuti/dinas luar yang tercatat di aplikasi.\n\nRingkasan:\nHari kerja: " + stats.hariKerja + "\nHari hadir: " + stats.hadirHari + "\nIzin: " + stats.izin + "\nDinas luar: " + stats.dinasLuar, {
    fontSize: 6.5,
  });
  drawCell(doc, marginX + contentWidth / 2, y, contentWidth / 2, 60, `Data di atas telah diperiksa dan dapat digunakan sebagai rekap kehadiran bulanan.\n\nPadang, ${formatDateLong(printedAt)}\nWakil Rektor II,\n\n\n\n\n\nDr. Susi Delmiati, S.H, M.H`, {
    fontSize: 7,
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.text(`Dokumen ini dicetak melalui Aplikasi Absensi UNES-AAI pada ${formatPrintedAtWib(printedAt)}`, marginX, 287);

  const fileSafeName = user.username.replace(/[^a-z0-9_-]+/gi, "_");
  const sortedPhotoDays = [...photoDays].sort((a, b) => a.dateKey.localeCompare(b.dateKey));

  doc.addPage();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("LAMPIRAN FOTO KEHADIRAN", pageWidth / 2, 15, { align: "center" });
  doc.setFontSize(8);
  doc.text(`${safeText(user.full_name)} - ${monthLabel}`, pageWidth / 2, 21, { align: "center" });

  if (sortedPhotoDays.length === 0) {
    drawCell(doc, marginX, 35, contentWidth, 28, "Tidak ada foto attendance pada periode ini.", {
      fontSize: 8,
      align: "center",
      valign: "middle",
    });
  } else {
    const rowsPerPage = 5;
    const tableTopY = 30;
    const headerH = 8;
    const rowH = 47;
    const dateW = 38;
    const evidenceW = (contentWidth - dateW) / 2;
    const imageSize = 32;

    const drawPhotoEvidenceCell = (
      x: number,
      yCell: number,
      width: number,
      height: number,
      photo: MonthlyUserReportPhoto | null,
      emptyLabel: string,
    ) => {
      drawCell(doc, x, yCell, width, height, "", {});
      if (!photo) {
        drawCell(doc, x + 2, yCell + 8, width - 4, height - 16, emptyLabel, {
          fontSize: 7,
          align: "center",
          valign: "middle",
          fill: [248, 248, 248],
        });
        return;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.8);
      doc.text(photo.timeLabel, x + 3, yCell + 6);

      const imgX = x + (width - imageSize) / 2;
      const imgY = yCell + 10;
      if (photo.dataUrl) {
        try {
          doc.addImage(photo.dataUrl, imageFormatFromDataUrl(photo.dataUrl), imgX, imgY, imageSize, imageSize);
          return;
        } catch {
          // fall through to placeholder
        }
      }

      drawCell(doc, imgX, imgY, imageSize, imageSize, "Foto tidak tersedia", {
        fontSize: 6.5,
        align: "center",
        valign: "middle",
        fill: [248, 248, 248],
      });
    };

    sortedPhotoDays.forEach((day, index) => {
      if (index > 0 && index % rowsPerPage === 0) {
        doc.addPage();
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("LAMPIRAN FOTO KEHADIRAN", pageWidth / 2, 15, { align: "center" });
        doc.setFontSize(8);
        doc.text(`${safeText(user.full_name)} - ${monthLabel}`, pageWidth / 2, 21, { align: "center" });
      }

      const rowIndex = index % rowsPerPage;
      const headerY = tableTopY;
      if (rowIndex === 0) {
        drawCell(doc, marginX, headerY, dateW, headerH, "Tanggal", {
          fontSize: 7,
          align: "center",
          valign: "middle",
          bold: true,
          fill: [244, 244, 244],
        });
        drawCell(doc, marginX + dateW, headerY, evidenceW, headerH, "Absen Masuk", {
          fontSize: 7,
          align: "center",
          valign: "middle",
          bold: true,
          fill: [244, 244, 244],
        });
        drawCell(doc, marginX + dateW + evidenceW, headerY, evidenceW, headerH, "Absen Pulang", {
          fontSize: 7,
          align: "center",
          valign: "middle",
          bold: true,
          fill: [244, 244, 244],
        });
      }

      const yRow = tableTopY + headerH + rowIndex * rowH;
      drawCell(doc, marginX, yRow, dateW, rowH, formatDateKeyLong(day.dateKey), {
        fontSize: 6.6,
        align: "center",
        valign: "middle",
      });
      drawPhotoEvidenceCell(marginX + dateW, yRow, evidenceW, rowH, day.masuk, absenceLabel("masuk", day.leaveLabel));
      drawPhotoEvidenceCell(marginX + dateW + evidenceW, yRow, evidenceW, rowH, day.pulang, absenceLabel("pulang", day.leaveLabel));
    });
  }

  doc.save(`Laporan_Kehadiran_${fileSafeName}_${year}-${String(month).padStart(2, "0")}.pdf`);
};
