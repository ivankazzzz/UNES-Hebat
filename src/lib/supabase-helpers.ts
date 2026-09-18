import { supabase } from './supabase';
import type { Attendance, Student } from './supabase';

// ============================================
// ATTENDANCE FUNCTIONS
// ============================================

/**
 * Upload foto ke Supabase Storage
 */
export async function uploadAttendancePhoto(
  file: Blob,
  studentId: string
): Promise<string | null> {
  try {
    const fileName = `${studentId}_${Date.now()}.png`;
    const filePath = `${studentId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('attendance-photos')
      .upload(filePath, file, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('attendance-photos')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading photo:', error);
    return null;
  }
}

/**
 * Simpan data absensi ke database
 */
const normalizeEvidencePhotoUrl = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;

  // Format modern yang dipakai aplikasi untuk PDF evidence.
  if (trimmed.startsWith('telegram:file:')) return trimmed;

  // Jika masih ada format lama `t.me/...`, biarkan tapi jangan dipakai untuk save baru.
  // (Caller seharusnya mengirim file_id, bukan message link.)
  if (trimmed.includes('t.me/')) return trimmed;

  // Jika hanya file_id mentah, normalisasi.
  if (/^[A-Za-z0-9_-]{10,}$/.test(trimmed)) {
    return `telegram:file:${trimmed}`;
  }

  return trimmed;
};

export async function saveAttendance(
  studentId: string,
  photoUrl: string,
  latitude: number,
  longitude: number,
  status: 'hadir' | 'alpa' = 'hadir'
): Promise<Attendance | null> {
  try {
    const { data, error } = await supabase
      .from('attendances')
      .insert([
        {
          student_id: studentId,
          photo_url: normalizeEvidencePhotoUrl(photoUrl),
          latitude,
          longitude,
          status,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data as Attendance;
  } catch (error) {
    console.error('Error saving attendance:', error);
    return null;
  }
}

/**
 * Get riwayat absensi mahasiswa
 */
export async function getStudentAttendances(
  studentId: string,
  limit: number = 50
): Promise<Attendance[]> {
  try {
    const { data, error } = await supabase
      .from('attendances')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as Attendance[];
  } catch (error) {
    console.error('Error fetching attendances:', error);
    return [];
  }
}

/**
 * Get statistik kehadiran mahasiswa
 */
export async function getAttendanceStats(studentId: string) {
  try {
    const { data, error } = await supabase
      .from('attendances')
      .select('status')
      .eq('student_id', studentId);

    if (error) throw error;

    const total = data.length;
    const hadir = data.filter((a) => a.status === 'hadir').length;
    const alpa = data.filter((a) => a.status === 'alpa').length;
    const percentage = total > 0 ? Math.round((hadir / total) * 100) : 0;

    return { total, hadir, alpa, percentage };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return { total: 0, hadir: 0, alpa: 0, percentage: 0 };
  }
}

// ============================================
// STUDENT FUNCTIONS
// ============================================

/**
 * Get data mahasiswa by ID
 */
export async function getStudent(studentId: string): Promise<Student | null> {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (error) throw error;
    return data as Student;
  } catch (error) {
    console.error('Error fetching student:', error);
    return null;
  }
}

/**
 * Get data mahasiswa by NIM
 */
export async function getStudentByNim(nim: string): Promise<Student | null> {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('nim', nim)
      .single();

    if (error) throw error;
    return data as Student;
  } catch (error) {
    console.error('Error fetching student by NIM:', error);
    return null;
  }
}

/**
 * Create mahasiswa baru
 */
export async function createStudent(
  nim: string,
  name: string,
  email: string,
  programStudi: string,
  semester: number
): Promise<Student | null> {
  try {
    const { data, error } = await supabase
      .from('students')
      .insert([
        {
          nim,
          name,
          email,
          program_studi: programStudi,
          semester,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data as Student;
  } catch (error) {
    console.error('Error creating student:', error);
    return null;
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Convert canvas to blob untuk upload
 */
export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/png');
  });
}

/**
 * Format tanggal untuk display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  const dayName = days[date.getDay()];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  return `${dayName}, ${day} ${month} ${year} - ${hours}:${minutes} WIB`;
}

/**
 * Get status badge color
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'hadir':
      return 'bg-green-100 text-green-700';
    case 'kurang_jam':
      return 'bg-yellow-100 text-yellow-700';
    case 'alpa':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

/**
 * Get status label
 */
export function getStatusLabel(status: string): string {
  switch (status) {
    case 'hadir':
      return 'Hadir';
    case 'kurang_jam':
      return 'Kurang Jam';
    case 'alpa':
      return 'Alpa';
    default:
      return status;
  }
}
