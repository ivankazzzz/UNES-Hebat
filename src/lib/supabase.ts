import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for database tables
export interface User {
  id: string;
  username: string;
  password_hash: string;
  full_name: string;
  role: string; // 'superadmin' | 'admin' | 'dosen' | 'pegawai' | 'mahasiswa'
  created_at?: string;
  updated_at?: string;
}

// Supabase App Users (from the database)
export interface AppUser {
  id: string;
  username: string;
  password_hash: string;
  full_name: string;
  role: string;
  created_at?: string;
  updated_at?: string;
  last_login_at?: string;
  is_active?: boolean;
  email?: string;
}

export interface Student {
  id: string;
  nim: string;
  name: string;
  email: string;
  program_studi: string;
  semester: number;
  created_at?: string;
  updated_at?: string;
}

export interface Attendance {
  id: string;
  student_id?: string;
  user_id?: string;
  photo_url?: string;
  latitude?: number;
  longitude?: number;
  attendance_type: 'masuk' | 'pulang';
  status: 'hadir' | 'kurang_jam';
  note?: string;
  created_at?: string;
  has_surat_tugas?: boolean;
  bukti_dinas_luar_url?: string;
}

export interface AttendanceWithUser extends Attendance {
  user?: User;
}

export interface AttendanceWithStudent extends Attendance {
  student?: Student;
}