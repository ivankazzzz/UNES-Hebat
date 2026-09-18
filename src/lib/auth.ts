import { supabase } from './supabase';
import type { User } from './supabase';

const AUTH_STORAGE_KEY = 'absensi_unes_auth';
const SESSION_TIMESTAMP_KEY = 'absensi_unes_session_ts';
const SESSION_VERSION_KEY = 'absensi_unes_session_version';

// Session timeout dalam milidetik (45 menit)
const SESSION_TIMEOUT_MS = 45 * 60 * 1000;

// Versi session saat ini - increment ini untuk force logout semua user
// Updated: 2024-12-25 untuk support multiple secondary locations
const CURRENT_SESSION_VERSION = 3;

export interface AuthUser {
  id: string;
  username: string;
  full_name: string;
  role: 'superadmin' | 'admin' | 'dosen' | 'pegawai' | 'mahasiswa';
  unit_kerja?: string | null;
  is_struktural?: boolean;
  is_dpl_kkn?: boolean;
  is_panitia_kkn?: boolean;
  secondary_location?: string[] | null; // Array of location names for multiple allowed locations
  is_blocked?: boolean;
  revoke_reason?: string | null; // Reason why user was revoked
  bypass_geofencing?: boolean; // Allow attendance from any location
  bypass_time_restrictions?: boolean; // Allow attendance at any time (including Sundays and holidays)
}

// Konfigurasi lokasi sekunder sekarang dikelola langsung melalui database
// di kolom users.secondary_location (array of location names)
// Admin dapat mengelola ini melalui halaman Kelola Pengguna

/**
 * Login user dengan username & password
 * Hanya memverifikasi kredensial, TIDAK menyimpan session
 * Caller harus memanggil saveUserSession() setelah validasi tambahan
 */
export async function login(username: string, password: string): Promise<AuthUser | null> {
  try {
    // Call Supabase function untuk verify password
    const { data, error } = await supabase.rpc('verify_user_password', {
      username_input: username,
      password_input: password
    });

    if (error) {
      console.error('Login error:', error);
      return null;
    }

    if (data && data.length > 0) {
      const userData = data[0];
      
      // Cek apakah akun diblokir/revoked
      if (userData.is_blocked) {
        console.log('User is blocked/revoked:', userData.username);
        // Return user with revoke info so login page can show proper message
        const user: AuthUser = {
          id: userData.id,
          username: userData.username,
          full_name: userData.full_name,
          role: userData.role as 'superadmin' | 'admin' | 'dosen' | 'pegawai' | 'mahasiswa',
          unit_kerja: userData.unit_kerja || null,
          is_struktural: userData.is_struktural || false,
          is_dpl_kkn: userData.is_dpl_kkn || false,
          secondary_location: userData.secondary_location || null,
          is_blocked: true,
          revoke_reason: userData.revoke_reason || null,
          bypass_geofencing: userData.bypass_geofencing || false,
          bypass_time_restrictions: userData.bypass_time_restrictions || false
        };
        return user;
      }
      
      const user: AuthUser = {
        id: userData.id,
        username: userData.username,
        full_name: userData.full_name,
        role: userData.role as 'superadmin' | 'admin' | 'dosen' | 'pegawai' | 'mahasiswa',
        unit_kerja: userData.unit_kerja || null,
        is_struktural: userData.is_struktural || false,
        is_dpl_kkn: userData.is_dpl_kkn || false,
        is_panitia_kkn: userData.is_panitia_kkn || false,
        secondary_location: userData.secondary_location || null,
        is_blocked: userData.is_blocked || false,
        revoke_reason: userData.revoke_reason || null,
        bypass_geofencing: userData.bypass_geofencing || false,
        bypass_time_restrictions: userData.bypass_time_restrictions || false
      };
      
      // TIDAK langsung simpan - biarkan caller yang memutuskan
      return user;
    }

    return null;
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
}

/**
 * Simpan user session ke localStorage
 * Panggil ini setelah semua validasi (termasuk cek struktural) berhasil
 */
export function saveUserSession(user: AuthUser): void {
  saveAuthUser(user);
}

/**
 * Logout user
 */
export function logout(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(SESSION_TIMESTAMP_KEY);
  localStorage.removeItem(SESSION_VERSION_KEY);
  window.location.href = '/login';
}

/**
 * Check if session is still valid (not expired and correct version)
 */
function isSessionValid(): boolean {
  // Check session version - force logout jika versi berbeda
  const storedVersion = localStorage.getItem(SESSION_VERSION_KEY);
  if (!storedVersion || parseInt(storedVersion) !== CURRENT_SESSION_VERSION) {
    return false;
  }

  // Check session timestamp - force logout jika expired (45 menit)
  const storedTimestamp = localStorage.getItem(SESSION_TIMESTAMP_KEY);
  if (!storedTimestamp) {
    return false;
  }

  const sessionTime = parseInt(storedTimestamp);
  const now = Date.now();
  
  if (now - sessionTime > SESSION_TIMEOUT_MS) {
    return false; // Session expired
  }

  return true;
}

/**
 * Update session timestamp (call this on user activity)
 */
export function refreshSessionTimestamp(): void {
  localStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());
}

/**
 * Clear session and redirect to login (used for force logout)
 */
function clearSessionAndRedirect(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(SESSION_TIMESTAMP_KEY);
  localStorage.removeItem(SESSION_VERSION_KEY);
  window.location.href = '/login?session=expired';
}

/**
 * Get current logged in user
 * Also validates session timeout and version
 */
export function getCurrentUser(): AuthUser | null {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) return null;
    
    // Check if session is valid (version & timeout)
    if (!isSessionValid()) {
      // Session expired or invalid version - clear and redirect
      clearSessionAndRedirect();
      return null;
    }
    
    return JSON.parse(stored) as AuthUser;
  } catch {
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

/**
 * Check if current user is admin or superadmin
 */
export function isAdmin(): boolean {
  const user = getCurrentUser();
  return user?.role === 'admin' || user?.role === 'superadmin';
}

/**
 * Check if current user is superadmin
 */
export function isSuperAdmin(): boolean {
  const user = getCurrentUser();
  return user?.role === 'superadmin';
}

/**
 * Check if current user has access to Laporan Individu page
 * Granted to all admin and superadmin users
 */
export function canAccessLaporanIndividu(): boolean {
  return isAdmin();
}

/**
 * Save auth user to localStorage with session data
 */
function saveAuthUser(user: AuthUser): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  // Set session timestamp dan version saat login
  localStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());
  localStorage.setItem(SESSION_VERSION_KEY, CURRENT_SESSION_VERSION.toString());
}

/**
 * Refresh user data from database
 * Useful when user data might have been updated (e.g., unit_kerja)
 */
export async function refreshUserData(): Promise<AuthUser | null> {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) return null;

    // Fetch latest user data from database
    const { data, error } = await supabase
      .from('users')
      .select('id, username, full_name, role, unit_kerja, is_struktural, is_dpl_kkn, secondary_location, is_blocked, revoke_reason, bypass_geofencing, bypass_time_restrictions')
      .eq('id', currentUser.id)
      .single();

    if (error || !data) {
      console.error('Error refreshing user data:', error);
      return currentUser; // Return existing user if refresh fails
    }

    const updatedUser: AuthUser = {
      id: data.id,
      username: data.username,
      full_name: data.full_name,
      role: data.role as 'superadmin' | 'admin' | 'dosen' | 'pegawai' | 'mahasiswa',
      unit_kerja: data.unit_kerja || null,
      is_struktural: data.is_struktural || false,
      is_dpl_kkn: data.is_dpl_kkn || false,
      secondary_location: data.secondary_location || null,
      is_blocked: data.is_blocked || false,
      revoke_reason: data.revoke_reason || null,
      bypass_geofencing: data.bypass_geofencing || false,
      bypass_time_restrictions: data.bypass_time_restrictions || false
    };

    // Update localStorage with fresh data
    saveAuthUser(updatedUser);
    return updatedUser;
  } catch (error) {
    console.error('Error refreshing user data:', error);
    return getCurrentUser();
  }
}

/**
 * Get current user with auto-refresh if unit_kerja is missing
 * This ensures users with outdated localStorage data get updated
 */
export async function getCurrentUserWithRefresh(): Promise<AuthUser | null> {
  const user = getCurrentUser();
  if (!user) return null;

  // If unit_kerja is missing, try to refresh from database
  if (!user.unit_kerja) {
    return await refreshUserData();
  }

  return user;
}

/**
 * Require authentication - redirect to login if not authenticated
 */
export function requireAuth(): AuthUser | null {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = '/login';
    return null;
  }
  return user;
}

/**
 * Require admin or superadmin - redirect if not admin/superadmin
 */
export function requireAdmin(): AuthUser | null {
  const user = requireAuth();
  if (user && user.role !== 'admin' && user.role !== 'superadmin') {
    window.location.href = '/';
    return null;
  }
  return user;
}
