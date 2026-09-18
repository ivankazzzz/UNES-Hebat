import type { IncomingMessage, ServerResponse } from "http";

interface TelegramRequestBody {
    fileName?: string;
    fileType?: string;
    fileBase64?: string;
    caption?: string;
    meta?: unknown;
    targetChatId?: string | number;
    chatId?: string | number;
}

interface TelegramPhotoSize {
    file_id: string;
    file_unique_id: string;
    width: number;
    height: number;
    file_size?: number;
}

interface TelegramMessage {
    message_id: number;
    chat: {
        id: number;
        type: string;
        title?: string;
        username?: string;
    };
    caption?: string;
    photo?: TelegramPhotoSize[];
}

interface TelegramSendPhotoResponse {
    ok: boolean;
    result: TelegramMessage;
    description?: string;
}

interface TelegramEvidenceMeta {
    lecturerName?: string | null;
    lecturerStatusLabel?: string | null;
    lecturerStatus?: string | null;
    courseName?: string | null;
    courseCode?: string | null;
    classCode?: string | null;
    sks?: number | string | null;
    pertemuanKe?: number | string | null;
    tanggalPertemuan?: string | null;
    jamMulai?: string | null;
    jamSelesai?: string | null;
    jumlahMahasiswaHadir?: number | string | null;
    materiTopik?: string | null;

    module?: string | null;

    attendanceType?: string | null;
    attendanceTypeLabel?: string | null;
    attendanceStatus?: string | null;
    attendanceStatusLabel?: string | null;

    userId?: string | number | null;
    username?: string | null;
    fullName?: string | null;
    role?: string | null;
    isStruktural?: boolean | null;
    unitKerja?: string | null;

    timestamp?: string | null;
    attendanceTimes?: Record<string, unknown> | null;

    profileGolJafung?: string | null;
    profile?: Record<string, unknown> | null;

    location?: Record<string, unknown> | null;
    distanceFromCampusMeters?: number | string | null;
    campusRadiusMeters?: number | string | null;
    campusAreaLabel?: string | null;
    locationNote?: string | null;

    hasSuratTugas?: boolean;
    suratTugas?: string | null;
}


const TELEGRAM_API_TIMEOUT_MS = 15000;

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null;

const toTrimmedString = (value: unknown): string | null => {
    if (value === null || value === undefined) return null;
    const asString = String(value).trim();
    return asString.length ? asString : null;
};

const truncateString = (value: string, maxLength: number): string =>
    value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;

const sanitizeChatId = (value: unknown): string | null => {
    if (value === null || value === undefined) return null;
    const asString = String(value).trim();
    return /^-?\d+$/.test(asString) ? asString : null;
};

const toNumber = (value: unknown): number | null => {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === "string") {
        const parsed = Number.parseFloat(value);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
};

const formatAttendanceStatus = (value: string | null): string | null => {
    if (!value) return null;
    const lower = value.toLowerCase();
    if (lower === "kurang_jam") return "Kurang Jam";
    return value.charAt(0).toUpperCase() + value.slice(1);
};

const formatAttendanceType = (value: string | null): string | null => {
    if (!value) return null;
    const lower = value.toLowerCase();
    if (lower === "masuk") return "Masuk";
    if (lower === "pulang") return "Pulang";
    return value.charAt(0).toUpperCase() + value.slice(1);
};

const formatTimeWIB = (value: unknown): string | null => {
    const iso = toTrimmedString(value);
    if (!iso) return null;
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return null;
    const formatted = new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit"
    }).format(date);
    return `${formatted} WIB`;
};

const formatDateTimeWIB = (value: unknown): string | null => {
    const iso = toTrimmedString(value);
    if (!iso) return null;
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta",
        dateStyle: "long",
        timeStyle: "medium"
    }).format(date);
};

const getRecordString = (record: Record<string, unknown> | null | undefined, key: string): string | null => {
    if (!record || !(key in record)) return null;
    return toTrimmedString(record[key]);
};

const isAttendanceMeta = (meta: TelegramEvidenceMeta): boolean => {
    const moduleName = toTrimmedString(meta.module);
    if (moduleName && moduleName.toLowerCase() === "attendance") {
        return true;
    }

    return [
        meta.attendanceType,
        meta.attendanceStatus,
        meta.attendanceTimes,
        meta.profileGolJafung,
        meta.locationNote,
        meta.campusRadiusMeters,
        meta.hasSuratTugas
    ].some((value) => value !== undefined);
};

const buildTeachingCaption = (meta: TelegramEvidenceMeta): string => {
    const lecturerName = toTrimmedString(meta.lecturerName) || toTrimmedString(meta.fullName);
    const statusText = toTrimmedString(meta.lecturerStatusLabel) || toTrimmedString(meta.lecturerStatus);
    const golongan = toTrimmedString(meta.profileGolJafung);
    const courseName = toTrimmedString(meta.courseName);
    const courseCode = toTrimmedString(meta.courseCode);
    const classCode = toTrimmedString(meta.classCode);
    const sks = toTrimmedString(meta.sks);
    const pertemuanKe = toTrimmedString(meta.pertemuanKe);
    const tanggalPertemuan = toTrimmedString(meta.tanggalPertemuan);
    const jamMulai = toTrimmedString(meta.jamMulai);
    const jamSelesai = toTrimmedString(meta.jamSelesai);
    const jumlahMahasiswaHadir = toTrimmedString(meta.jumlahMahasiswaHadir);
    const materiTopikRaw = toTrimmedString(meta.materiTopik);
    const materiTopik = materiTopikRaw ? truncateString(materiTopikRaw, 250) : null;
    const jamPertemuan = jamMulai || jamSelesai ? `${jamMulai || "--:--"} - ${jamSelesai || "--:--"} WIB` : null;

    const lines: string[] = [
        "✅ Absensi diterima berikut :",
        "===== Profil Dosen ====="
    ];

    if (lecturerName) {
        lines.push(`👩‍🏫 Nama Dosen: ${lecturerName}`);
    }

    lines.push(`🎖️ Gol/Jafung : ${golongan ?? ""}`);

    if (statusText) {
        lines.push(`🛡️ Status: ${statusText}`);
    }

    lines.push("===== Detail Perkuliahan =====");
    lines.push("📚 Absensi Kehadiran Dosen UNES dlm Mengajar");

    if (courseName) {
        lines.push(`🎓 Mata Kuliah: ${courseName}`);
    }

    if (courseCode) {
        lines.push(`🆔 Kode MK: ${courseCode}`);
    }

    if (classCode) {
        lines.push(`🏫 Kelas: ${classCode}`);
    }

    if (pertemuanKe) {
        lines.push(`🔢 Pertemuan: ${pertemuanKe}`);
    }

    if (tanggalPertemuan) {
        lines.push(`📅 Tanggal: ${tanggalPertemuan}`);
    }

    if (jamPertemuan) {
        lines.push(`⏰ Jam: ${jamPertemuan}`);
    }

    if (sks) {
        lines.push(`📘 SKS: ${sks}`);
    }

    if (jumlahMahasiswaHadir) {
        lines.push(`👥 Mahasiswa Hadir: ${jumlahMahasiswaHadir}`);
    }

    if (materiTopik) {
        lines.push(`📝 Materi: ${materiTopik}`);
    }

    lines.push("===== UNES | 2025 =====");

    return lines.join("\n");
};

const formatDateTimeCaptionWIB = (value: unknown): string | null => {
    const iso = toTrimmedString(value);
    if (!iso) return null;
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return null;

    const dateText = new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta",
        day: "2-digit",
        month: "long",
        year: "numeric"
    }).format(date);

    const timeParts = new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    }).formatToParts(date);

    const hour = timeParts.find((part) => part.type === "hour")?.value ?? "00";
    const minute = timeParts.find((part) => part.type === "minute")?.value ?? "00";
    const second = timeParts.find((part) => part.type === "second")?.value ?? "00";

    return `${dateText} | ${hour}.${minute}.${second} WIB`;
};

const formatJenisAbsensi = (value: string | null): string | null => {
    if (!value) return null;
    const lower = value.toLowerCase();
    if (lower === "masuk") return "Absensi Masuk";
    if (lower === "pulang") return "Absensi Keluar";
    return `Absensi ${value}`;
};

const buildAttendanceCaption = (meta: TelegramEvidenceMeta): string => {
    const attendanceTimesRecord = isRecord(meta.attendanceTimes) ? meta.attendanceTimes : undefined;
    const locationRecord = isRecord(meta.location) ? meta.location : undefined;

    const roleLower = toTrimmedString(meta.role)?.toLowerCase() ?? null;
    const isStruktural = meta.isStruktural === true;
    const isDosenStruktural = roleLower === "dosen" && isStruktural;

    const absensiTitle = isDosenStruktural
        ? "📘 Notifikasi Absensi – Dosen Struktural"
        : "🧑‍💼 Notifikasi Absensi – Tenaga Kependidikan";

    const unitKerja = toTrimmedString(meta.unitKerja);
    const displayName =
        toTrimmedString(meta.fullName) ||
        toTrimmedString(meta.username) ||
        toTrimmedString(meta.userId) ||
        null;

    const masukTimeRaw =
        getRecordString(attendanceTimesRecord, "masuk") ||
        (toTrimmedString(meta.attendanceType)?.toLowerCase() === "masuk" ? toTrimmedString(meta.timestamp) : null);
    const pulangTimeRaw =
        getRecordString(attendanceTimesRecord, "pulang") ||
        (toTrimmedString(meta.attendanceType)?.toLowerCase() === "pulang" ? toTrimmedString(meta.timestamp) : null);

    const masukTime = formatTimeWIB(masukTimeRaw) ?? "-";
    const pulangTime = formatTimeWIB(pulangTimeRaw) ?? "-";

    const attendanceTypeLabel =
        formatAttendanceType(toTrimmedString(meta.attendanceTypeLabel) || toTrimmedString(meta.attendanceType)) ??
        toTrimmedString(meta.attendanceType);

    const jenisAbsensi = formatJenisAbsensi(attendanceTypeLabel);

    const attendanceStatusLabel =
        formatAttendanceStatus(toTrimmedString(meta.attendanceStatusLabel) || toTrimmedString(meta.attendanceStatus)) ??
        "Hadir";

    const timestampLabel = formatDateTimeCaptionWIB(meta.timestamp) ?? "-";

    const latitude = toNumber(locationRecord ? locationRecord["latitude"] : undefined);
    const longitude = toNumber(locationRecord ? locationRecord["longitude"] : undefined);
    const coordinateLabel =
        latitude !== null && longitude !== null ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` : "-";

    const distanceMeters =
        toNumber(meta.distanceFromCampusMeters) ?? toNumber(locationRecord ? locationRecord["distanceMeters"] : undefined);
    const campusRadius = toNumber(meta.campusRadiusMeters);
    const distanceLabel = distanceMeters !== null ? `${Math.round(distanceMeters)} m` : "-";
    const radiusLabel = campusRadius !== null ? `${Math.round(campusRadius)} m` : "-";

    const campusAreaLabel =
        toTrimmedString(meta.campusAreaLabel) || getRecordString(locationRecord, "campusAreaLabel") || "-";

    const locationStatusLabel =
        toTrimmedString(getRecordString(locationRecord, "locationStatusLabel")) ||
        toTrimmedString(getRecordString(locationRecord, "locationStatus")) ||
        "-";

    const lines: string[] = [absensiTitle, "", "✅ Absensi Berhasil Dicatat", ""];

    if (isDosenStruktural) {
        lines.push("===== Profil Dosen =====");
        lines.push(`👩‍🏫 Nama: ${displayName ?? ""}`);
        lines.push(`🎓 Jabatan Struktural: ${unitKerja ?? ""}`);
    } else {
        lines.push("===== Profil Pegawai =====");
        lines.push(`🧑‍💼 Nama: ${displayName ?? ""}`);
        lines.push(`🗂️ Unit Kerja: ${unitKerja ?? ""}`);
    }

    lines.push("");
    lines.push("===== Detail Kehadiran =====");
    lines.push(
        isDosenStruktural
            ? "📚 Sistem Absensi Dosen Struktural UNES"
            : "📚 Sistem Absensi Tenaga Kependidikan UNES"
    );
    lines.push(`🕘 Jenis Absensi: ${jenisAbsensi ?? ""}`);
    lines.push(`🏢 Absen Masuk: ${masukTime}`);
    lines.push(`🏠 Absen Pulang: ${pulangTime}`);
    lines.push(`✅ Status: ${attendanceStatusLabel}`);

    lines.push("");
    lines.push("===== Waktu & Lokasi =====");
    lines.push(`📅 ${timestampLabel}`);
    lines.push("📍 Universitas Ekasakti (UNES), Padang");
    lines.push(`🏛️ Area: ${campusAreaLabel}`);
    lines.push(`📏 Jarak: ${distanceLabel} (radius ${radiusLabel})`);
    lines.push(`🛰️ Koordinat: ${coordinateLabel}`);
    lines.push(`📌 Zona: ${locationStatusLabel}`);

    lines.push("");
    lines.push("===== UNES | 2025 =====");

    return lines.join("\n");
};

const buildCaptionFromMeta = (
    meta?: TelegramEvidenceMeta,
    fallbackCaption?: string
): string | undefined => {
    if (!meta) {
        return fallbackCaption && fallbackCaption.trim().length
            ? fallbackCaption
            : undefined;
    }

    const caption = isAttendanceMeta(meta)
        ? buildAttendanceCaption(meta)
        : buildTeachingCaption(meta);

    if (caption && caption.trim().length) {
        return caption;
    }

    return fallbackCaption && fallbackCaption.trim().length ? fallbackCaption : undefined;
};

const buildMessageLink = (chat: TelegramMessage["chat"], messageId: number): string | null => {
    if (!chat) return null;

    if (chat.username) {
        return `https://t.me/${chat.username}/${messageId}`;
    }

    const chatIdString = String(chat.id);
    if (chatIdString.startsWith("-100")) {
        const channelId = chatIdString.slice(4);
        return `https://t.me/c/${channelId}/${messageId}`;
    }

    return null;
};

const parseRequestBody = async (req: IncomingMessage): Promise<TelegramRequestBody> => {
    const chunks: Buffer[] = [];

    for await (const chunk of req) {
        chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }

    if (!chunks.length) return {};

    try {
        const bodyString = Buffer.concat(chunks).toString("utf8");
        return JSON.parse(bodyString) as TelegramRequestBody;
    } catch (error) {
        console.error("Failed to parse request body", error);
        return {};
    }
};

export default async function handler(req: IncomingMessage, res: ServerResponse) {
    if (req.method !== "POST") {
        res.statusCode = 405;
        res.setHeader("Allow", "POST");
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Method not allowed" }));
        return;
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const defaultChatId = process.env.TELEGRAM_TARGET_CHAT_ID;

    if (!botToken || !defaultChatId) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Konfigurasi Telegram belum lengkap." }));
        return;
    }

    try {
        const { fileName, fileType, fileBase64, caption, meta, targetChatId, chatId } = await parseRequestBody(req);

        const requestChatId = sanitizeChatId(targetChatId ?? chatId);
        const effectiveChatId = requestChatId ?? defaultChatId;

        if (!effectiveChatId) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Chat ID Telegram tidak tersedia." }));
            return;
        }

        if (!fileBase64 || typeof fileBase64 !== "string") {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Payload tidak valid. Sertakan fileBase64." }));
            return;
        }

        const cleanedBase64 = fileBase64.includes(",") ? fileBase64.split(",").pop() || "" : fileBase64;
        const binary = Buffer.from(cleanedBase64, "base64");

        if (!binary.length) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "File bukti tidak dapat diproses." }));
            return;
        }

        const photoBlob = new Blob([binary], { type: fileType || "image/jpeg" });
        const formData = new FormData();
        formData.append("chat_id", effectiveChatId);

        const metaPayload = isRecord(meta) ? (meta as TelegramEvidenceMeta) : undefined;
        const finalCaption = buildCaptionFromMeta(metaPayload, caption);

        if (finalCaption) {
            formData.append("caption", finalCaption.slice(0, 1024));
        }

        formData.append("photo", photoBlob, fileName || `evidence-${Date.now()}.jpg`);

        const sendPhoto = async (): Promise<Response> => {
            const sendController = new AbortController();
            const sendTimeout = setTimeout(() => sendController.abort(), TELEGRAM_API_TIMEOUT_MS);
            try {
                return await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
                    method: "POST",
                    body: formData,
                    signal: sendController.signal
                });
            } catch (error) {
                if ((error as Error).name === "AbortError") {
                    throw new Error("Permintaan ke Telegram melebihi batas waktu.");
                }
                throw error;
            } finally {
                clearTimeout(sendTimeout);
            }
        };

        const parseSendPhotoResult = async (
            response: Response
        ): Promise<{ ok: boolean; message?: TelegramMessage; error?: string }> => {
            const telegramJson = (await response.json()) as TelegramSendPhotoResponse;

            if (!response.ok || !telegramJson.ok) {
                const description = telegramJson.description || "Telegram API error";
                return { ok: false, error: description };
            }

            return { ok: true, message: telegramJson.result };
        };

        let telegramResponse = await sendPhoto();
        let parsed = await parseSendPhotoResult(telegramResponse);

        // Retry 1x untuk mengurangi kemungkinan user harus mengulang.
        if (parsed.ok && parsed.message && !parsed.message.photo?.length) {
            await new Promise((resolve) => setTimeout(resolve, 400));
            telegramResponse = await sendPhoto();
            parsed = await parseSendPhotoResult(telegramResponse);
        }

        if (!parsed.ok || !parsed.message) {
            console.error("Telegram API error", parsed.error, parsed);
            res.statusCode = telegramResponse.status || 502;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: parsed.error || "Telegram API error" }));
            return;
        }

        const message = parsed.message;
        const fileId = message.photo?.[message.photo.length - 1]?.file_id || null;

        // CRITICAL: fileId HARUS ada agar foto bisa ditampilkan di PDF
        // Jika fileId tidak ada, tolak request dan minta user coba lagi
        if (!fileId) {
            console.error("Telegram photo uploaded but fileId not found in response", message);
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({
                ok: false,
                error: "Upload foto berhasil dikirim ke Telegram, tapi sistem gagal mengambil File ID untuk PDF. Silakan ulangi sekali lagi."
            }));
            return;
        }

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        const deliveredCaption = message.caption ?? finalCaption ?? null;

        // Kunci: hanya expose format "telegram:file:" ke client.
        const canonicalPhoto = `telegram:file:${fileId}`;

        res.end(
            JSON.stringify({
                ok: true,
                result: {
                    messageId: message.message_id,
                    chatId: message.chat.id,
                    fileId,
                    photoRef: canonicalPhoto,
                    photoUrl: canonicalPhoto,
                    // Hindari pemakaian link t.me oleh client.
                    messageLink: null,
                    caption: deliveredCaption,
                    sentAt: new Date().toISOString(),
                    meta: meta || null
                }
            })
        );
    } catch (error) {
        console.error("Failed forwarding evidence to Telegram", error);
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Gagal meneruskan bukti ke Telegram." }));
    }
}
