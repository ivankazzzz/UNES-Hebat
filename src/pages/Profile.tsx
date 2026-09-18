import { getCurrentUser, logout, saveUserSession, refreshUserData } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { User, ArrowLeft, LogOut, Building2, MapPin, Eye, EyeOff, X, Info, ChevronDown, Check, Loader2, Clock, Key, ChevronRight } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import SuccessModal from "@/components/SuccessModal";
import NotificationModal from "@/components/NotificationModal";

interface AttendanceLocation {
  id: string;
  user_id: string | null;
  building_id?: string | null;
  unit_kerja: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  location_name: string | null;
  is_active: boolean;
  is_primary?: boolean | null;
  priority?: number | null;
  created_at?: string | null;
}

interface UserAllowedLocation {
  unit_kerja: string;
  location_name: string | null;
  is_primary: boolean;
}

interface UserProfileData {
  id: string;
  username: string;
  full_name: string;
  role: 'superadmin' | 'admin' | 'dosen' | 'pegawai' | 'mahasiswa';
  unit_kerja: string | null;
  primary_location: string | null;
}

interface UserWorkSchedule {
  id: string;
  user_id: string;
  check_in_start: string;
  check_in_end: string;
  check_out_start: string;
  check_out_end: string;
  reason: string | null;
  is_active: boolean;
}

const DEFAULT_WORK_SCHEDULE = {
  check_in_start: "08:00:00",
  check_in_end: "08:30:00",
  check_out_start: "15:00:00",
  check_out_end: "17:00:00"
};

const formatTimeDisplay = (timeValue: string): string => {
  const [rawHours = "", rawMinutes = ""] = (timeValue || "").split(":");
  const hours = String(rawHours).padStart(2, "0");
  const minutes = String(rawMinutes).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const formatScheduleRange = (start: string, end: string): string => {
  return `${formatTimeDisplay(start)} - ${formatTimeDisplay(end)} WIB`;
};

export default function Profile() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [attendanceLocation, setAttendanceLocation] = useState<AttendanceLocation | null>(null);
  const [allowedLocations, setAllowedLocations] = useState<UserAllowedLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userWorkSchedule, setUserWorkSchedule] = useState<UserWorkSchedule | null>(null);
  const [workScheduleLoaded, setWorkScheduleLoaded] = useState(false);
  
  // State for password change modal with smooth animation
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [isPasswordModalAnimating, setIsPasswordModalAnimating] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  
  // State for error notification modal
  const [errorModal, setErrorModal] = useState({
    isOpen: false,
    title: "",
    message: ""
  });

  // State for superadmin location selector
  const [allLocations, setAllLocations] = useState<AttendanceLocation[]>([]);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<AttendanceLocation | null>(null);

  // Helper function to show error
  const showError = (title: string, message: string) => {
    setErrorModal({ isOpen: true, title, message });
  };

  // Open password modal with animation
  const openPasswordModal = useCallback(() => {
    setIsPasswordModalVisible(true);
    setIsPasswordModalAnimating(true);
    setTimeout(() => {
      setIsPasswordModalAnimating(false);
      setIsPasswordModalOpen(true);
    }, 50);
  }, []);

  // Close password modal with animation
  const closePasswordModal = useCallback(() => {
    setIsPasswordModalAnimating(true);
    setIsPasswordModalOpen(false);
    setTimeout(() => {
      setIsPasswordModalVisible(false);
      setIsPasswordModalAnimating(false);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      setShowPasswords({ current: false, new: false, confirm: false });
    }, 350);
  }, []);

  // Load user profile data
  useEffect(() => {
    const loadUserProfile = async () => {
      // Refresh supaya data profil terbaru selalu terpakai.
      const user = await refreshUserData();
      if (user?.id) {
        try {
           const { data, error } = await supabase
              .from('users')
              .select('id, username, full_name, role, unit_kerja, primary_location')
              .eq('id', user.id)
              .single();
 
           if (data && !error) {
             const profileData = data as unknown as UserProfileData;
             setUserProfile(profileData);
            
            // Load attendance locations for this user (primary + secondary)
            if (profileData.id) {
              let { data: locationData, error: locationError } = await supabase
                .from('attendance_locations')
                .select('*')
                .eq('user_id', profileData.id)
                .eq('is_active', true)
                .order('priority', { ascending: true, nullsFirst: false })
                .order('is_primary', { ascending: false })
                .order('created_at', { ascending: true });

              if (locationError) {
                console.error('Error loading locations:', locationError);
              }

              // Fallback jika tidak ada data lokasi spesifik user, cari berdasarkan primary_location
              if ((!locationData || locationData.length === 0) && profileData.primary_location) {
                const { data: fallbackData, error: fallbackError } = await supabase
                  .from('attendance_locations')
                  .select('*')
                  .eq('location_name', profileData.primary_location)
                  .eq('is_active', true)
                  .limit(1);
                
                if (!fallbackError && fallbackData && fallbackData.length > 0) {
                  locationData = fallbackData;
                }
              }

              const locationsRaw = (locationData as AttendanceLocation[]) || [];
              const primaryLocation =
                locationsRaw.find((loc) => loc.priority === 1) ??
                locationsRaw.find((loc) => loc.is_primary) ??
                locationsRaw[0];

              if (primaryLocation) {
                setAttendanceLocation(primaryLocation);
              }

              const normalizedNames = new Set<string>();
              const allowed = locationsRaw
                .filter((loc) => !!loc.location_name)
                .filter((loc) => {
                  const normalized = loc.location_name?.toLowerCase().trim() || '';
                  if (!normalized || normalizedNames.has(normalized)) return false;
                  normalizedNames.add(normalized);
                  return true;
                })
                .map((loc) => ({
                  unit_kerja: loc.unit_kerja,
                  location_name: loc.location_name,
                  is_primary: (loc.priority === 1) || (loc.is_primary ?? loc.id === primaryLocation?.id)
                }));

              setAllowedLocations(allowed);
            }
          }
        } catch (error) {
          console.error('Error loading profile:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, []); // Empty dependency array - only run once on mount

  // Load user work schedule (jam kerja khusus)
  useEffect(() => {
    const fetchUserWorkSchedule = async () => {
      if (!currentUser?.id) {
        setWorkScheduleLoaded(true);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_work_schedules")
          .select("*")
          .eq("user_id", currentUser.id)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          setUserWorkSchedule(data as UserWorkSchedule);
        }
        setWorkScheduleLoaded(true);
      } catch (error) {
        console.error("Error fetching user work schedule:", error);
        setWorkScheduleLoaded(true);
      }
    };

    fetchUserWorkSchedule();
  }, [currentUser?.id]);

  // Load all attendance locations for superadmin
  useEffect(() => {
    const loadAllLocations = async () => {
      const user = getCurrentUser();
      if (user?.role === 'superadmin') {
        try {
          const { data, error } = await supabase
            .from('attendance_locations')
            .select('*')
            .eq('is_active', true)
            .order('location_name');
          
          if (data && !error) {
            setAllLocations(data);
          }
        } catch (error) {
          console.error('Error loading locations:', error);
        }
      }
    };

    loadAllLocations();
  }, []);

  // Handle location selection (just select, not save yet)
  const handleLocationSelect = (location: AttendanceLocation) => {
    setSelectedLocation(location);
  };

  // Save selected location for superadmin (testing purposes)
  const saveSelectedLocation = async () => {
    if (currentUser?.role !== 'superadmin' || !selectedLocation) return;
    
    setIsSavingLocation(true);
    try {
      const { data: existingLocations, error: fetchError } = await supabase
        .from('attendance_locations')
        .select('id, location_name, is_primary')
        .eq('user_id', currentUser.id)
        .eq('is_active', true);

      if (fetchError) throw fetchError;

      if (existingLocations && existingLocations.length > 0) {
        const { error: resetError } = await supabase
          .from('attendance_locations')
          .update({ is_primary: false })
          .eq('user_id', currentUser.id)
          .eq('is_active', true);

        if (resetError) throw resetError;
      }

      const matchedLocation = existingLocations?.find(
        (loc) => loc.location_name === selectedLocation.location_name
      );

      let updatedLocation: AttendanceLocation | null = null;

      if (matchedLocation) {
        const { data: updated, error: updateError } = await supabase
          .from('attendance_locations')
          .update({ is_primary: true })
          .eq('id', matchedLocation.id)
          .select('*')
          .single();

        if (updateError) throw updateError;
        updatedLocation = updated as AttendanceLocation;
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from('attendance_locations')
          .insert({
            user_id: currentUser.id,
            unit_kerja: selectedLocation.unit_kerja,
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
            radius_meters: selectedLocation.radius_meters,
            location_name: selectedLocation.location_name,
            building_id: selectedLocation.building_id ?? null,
            is_active: true,
            is_primary: true
          })
          .select('*')
          .single();

        if (insertError) throw insertError;
        updatedLocation = inserted as AttendanceLocation;
      }

      if (updatedLocation) {
        setAttendanceLocation(updatedLocation);
      }

      setIsLocationDropdownOpen(false);
      setSelectedLocation(null);

      // Refresh to keep local session in sync
      const refreshedUser = await refreshUserData();
      if (refreshedUser) {
        saveUserSession(refreshedUser);
      }
      
    } catch (error) {
      console.error('Error changing location:', error);
      showError("Gagal Mengubah Lokasi", "Terjadi kesalahan saat mengubah titik absensi. Silakan coba lagi.");
    } finally {
      setIsSavingLocation(false);
    }
  };

  // Open location modal and set initial selection
  const openLocationModal = () => {
    setSelectedLocation(attendanceLocation);
    setIsLocationDropdownOpen(true);
  };

  // Close location modal
  const closeLocationModal = () => {
    setIsLocationDropdownOpen(false);
    setSelectedLocation(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Handle password change
  const handlePasswordChange = async () => {
    // Validation 1: Check if all fields are filled
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      showError("Lengkapi Formulir", "Semua field harus diisi untuk mengganti password");
      return;
    }

    // Validation 2: Check if current password is numeric only
    const numberOnlyRegex = /^\d+$/;
    if (!numberOnlyRegex.test(passwordForm.currentPassword)) {
      showError("Password Lama Salah Format", "Password lama harus berisi angka saja");
      return;
    }

    // Validation 3: Check if new password is numeric only
    if (!numberOnlyRegex.test(passwordForm.newPassword)) {
      showError("Password Baru Salah Format", "Password baru hanya boleh berisi angka (0-9)");
      return;
    }

    // Validation 4: Check if confirm password is numeric only
    if (!numberOnlyRegex.test(passwordForm.confirmPassword)) {
      showError("Konfirmasi Password Salah Format", "Konfirmasi password hanya boleh berisi angka (0-9)");
      return;
    }

    // Validation 5: Check if new password matches confirmation
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showError("Password Tidak Cocok", "Password baru dan konfirmasi password harus sama");
      return;
    }

    // Validation 6: Check minimum length
    if (passwordForm.newPassword.length < 4) {
      showError("Password Terlalu Pendek", "Password baru minimal 4 angka (contoh: 1234)");
      return;
    }

    // Validation 7: Check if new password same as old password
    if (passwordForm.currentPassword === passwordForm.newPassword) {
      showError("Password Sama", "Password baru harus berbeda dari password lama");
      return;
    }

    // Validation 8: Check maximum length (optional security measure)
    if (passwordForm.newPassword.length > 20) {
      showError("Password Terlalu Panjang", "Password maksimal 20 angka untuk keamanan");
      return;
    }

    setIsChangingPassword(true);

    try {
      // Use secure RPC function to change password
      // This function handles: verification, hashing, updating users table, and user_passwords table
      const { data: result, error: rpcError } = await supabase.rpc('change_user_password', {
        user_id_input: currentUser?.id,
        current_password_input: passwordForm.currentPassword,
        new_password_input: passwordForm.newPassword
      });

      if (rpcError) {
        console.error('Change password RPC error:', rpcError);
        showError("Kesalahan Sistem", "Gagal mengubah password. Silakan coba lagi.");
        setIsChangingPassword(false);
        return;
      }

      // Check result from RPC function
      if (!result?.success) {
        const errorMessage = result?.error || "Gagal mengubah password";
        if (errorMessage.includes("Password lama")) {
          showError("Password Lama Salah", "Password lama yang Anda masukkan tidak sesuai. Periksa kembali.");
        } else {
          showError("Gagal Ubah Password", errorMessage);
        }
        setIsChangingPassword(false);
        return;
      }

      // Success - close modal with animation then show success modal
      setIsPasswordModalAnimating(true);
      setIsPasswordModalOpen(false);
      
      setTimeout(() => {
        setIsPasswordModalVisible(false);
        setIsPasswordModalAnimating(false);
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
        setShowPasswords({ current: false, new: false, confirm: false });
        
        // Show success modal after password modal closes
        setIsSuccessModalOpen(true);
      }, 350);

    } catch (error) {
      console.error('Error changing password:', error);
      showError("Terjadi Kesalahan", "Terjadi kesalahan tidak terduga. Silakan coba lagi atau hubungi admin.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const profileFields = [
    {
      icon: User,
      label: "Username",
      value: currentUser?.username,
      placeholder: "Belum diisi",
      key: "username"
    },
    {
      icon: Building2,
      label: "Unit Kerja",
      value: userProfile?.unit_kerja,
      placeholder: "Belum diisi",
      key: "unit_kerja"
    }
  ];

  const schedule = userWorkSchedule || DEFAULT_WORK_SCHEDULE;
  const checkInRange = formatScheduleRange(schedule.check_in_start, schedule.check_in_end);
  const checkOutRange = formatScheduleRange(schedule.check_out_start, schedule.check_out_end);
  const isScheduleLoading = isLoading || !workScheduleLoaded;

  // Check if user is superadmin
  const isSuperAdmin = currentUser?.role === 'superadmin';

  return (
    <>
    <div className="flex h-screen flex-col w-full bg-[#F6F7F9] overflow-x-hidden animate-page-in">
      {/* Sticky Header Section */}
      <header className="sticky top-0 z-30 bg-white border-b-2 border-[#8c1b1d]/20 flex items-center justify-between px-5 py-4 shadow-sm w-full shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold text-slate-900">Profil Saya</h1>
        <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center p-0.5 border-2 border-[#8c1b1d]/20 bg-white">
          <img src="/unes.png" alt="UNES" className="w-full h-full object-contain" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow overflow-y-auto scrollbar-thin px-4 sm:px-6 lg:px-10 py-6 w-full pb-28 space-y-4">
          {/* Header Profile Card */}
          <div className="bg-white px-5 py-6 flex items-center gap-4 border-2 border-[#8c1b1d] rounded-2xl shadow-sm">
            <div className="relative w-16 h-16 rounded-full bg-slate-100 border-2 border-[#fbbf24] flex items-center justify-center overflow-hidden shadow-inner flex-shrink-0">
              <User className="w-9 h-9 text-[#8c1b1d]" />
              {/* Pulsing Active Status Indicator */}
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-slate-900 truncate leading-snug">
                {currentUser?.full_name || "Nama Pengguna"}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">@{currentUser?.username || "username"}</p>
              <div className="mt-1">
                <span className="inline-block bg-red-50 text-[#8c1b1d] border-2 border-[#8c1b1d]/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {currentUser?.role === 'superadmin' 
                    ? 'Super Admin' 
                    : currentUser?.role === 'admin' 
                    ? 'Administrator' 
                    : currentUser?.role === 'dosen' 
                    ? 'Dosen' 
                    : currentUser?.role === 'mahasiswa'
                    ? 'Mahasiswa'
                    : 'Tendik'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 1: Informasi Kerja */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-5 py-2 block">
              Informasi Kerja
            </span>
            <div className="bg-white border-2 border-[#8c1b1d] divide-y divide-[#8c1b1d]/10 rounded-2xl overflow-hidden shadow-sm">
              {/* Username row */}
              <div className="flex items-center justify-between py-3.5 px-5">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <span className="text-sm font-semibold text-slate-700">Username</span>
                </div>
                <span className="text-sm font-bold text-slate-800">@{currentUser?.username || "---"}</span>
              </div>

              {/* Jadwal Kerja row */}
              <div className="flex items-center justify-between py-3.5 px-5">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <span className="text-sm font-semibold text-slate-700">Jadwal Kerja</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-slate-900 leading-none">
                    {isScheduleLoading ? "---" : checkInRange.split(' ')[0]} - {isScheduleLoading ? "---" : checkOutRange.split(' ')[0]} WIB
                  </span>
                  <span className="block text-[9px] text-[#8c1b1d] font-bold uppercase tracking-wider mt-0.5">Jadwal Kerja Aktif</span>
                </div>
              </div>

              {/* Lokasi Kerja row (expandable list) */}
              <div className="py-3.5 px-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    <span className="text-sm font-semibold text-slate-700">Lokasi Absensi Resmi</span>
                  </div>
                  {isSuperAdmin && (
                    <button
                       onClick={openLocationModal}
                      className="bg-purple-50 hover:bg-purple-100 active:scale-95 text-purple-700 text-xs font-bold py-1 px-3 rounded-lg border-2 border-purple-300 transition-all duration-200 flex-shrink-0"
                    >
                      Pilih Lokasi
                    </button>
                  )}
                </div>

                {/* Location Items */}
                <div className="space-y-2">
                  {isLoading ? (
                    <div className="h-10 bg-slate-50 animate-pulse rounded-xl" />
                  ) : (
                    allowedLocations.map((location, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border-2 border-[#fbbf24] animate-page-in">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${location.is_primary ? 'bg-[#8c1b1d]' : 'bg-emerald-500'}`} />
                          <span className="text-xs font-bold text-slate-800 leading-snug truncate">{location.location_name || location.unit_kerja}</span>
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border-2 flex-shrink-0 ml-2 ${
                          location.is_primary 
                            ? 'bg-red-50 text-[#8c1b1d] border-[#8c1b1d]' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-500'
                        }`}>
                          {location.is_primary ? 'Utama' : 'Sekunder'}
                        </span>
                      </div>
                    ))
                  )}
                  {allowedLocations.length > 1 && (
                    <p className="text-[10px] font-bold text-slate-500 text-center mt-2 italic leading-relaxed">
                      * Absensi Anda diterima di {allowedLocations.length} lokasi resmi di atas.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Keamanan & Akun */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-5 py-2 block">
              Keamanan & Akun
            </span>
            <div className="bg-white border-2 border-[#8c1b1d] divide-y divide-[#8c1b1d]/10 shadow-sm rounded-2xl overflow-hidden">
              {currentUser?.role !== 'mahasiswa' && (
                <button
                  onClick={openPasswordModal}
                  className="w-full flex items-center justify-between py-4 px-5 hover:bg-slate-50 active:bg-slate-100 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <Key className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    <span className="text-sm font-semibold text-slate-700">Ganti Password</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-350 flex-shrink-0" />
                </button>
              )}

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-between py-4 px-5 hover:bg-red-50/30 active:bg-red-55 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <LogOut className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-sm font-semibold text-red-600">Keluar Akun</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
              </button>
            </div>
          </div>
        </main>

        {/* Password Change Modal with Smooth Animation */}
        {isPasswordModalVisible && (
          <div 
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ease-out ${
              isPasswordModalAnimating || !isPasswordModalOpen ? 'bg-black/0' : 'bg-black/60'
            }`}
            style={{ backdropFilter: isPasswordModalAnimating || !isPasswordModalOpen ? 'blur(0px)' : 'blur(6px)' }}
            onClick={closePasswordModal}
          >
            <div 
              className={`relative w-full max-w-md bg-white rounded-[28px] shadow-2xl border-2 border-[#8c1b1d] overflow-hidden transform transition-all duration-300 ease-out ${
                isPasswordModalAnimating || !isPasswordModalOpen
                  ? 'scale-95 opacity-0 translate-y-6' 
                  : 'scale-100 opacity-100 translate-y-0'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top gradient accent */}
              <div className="h-1.5 bg-gradient-to-r from-[#8c1b1d] via-[#b52020] to-[#fbbf24]" />
              
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b-2 border-[#8c1b1d]/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-[#8c1b1d] flex items-center justify-center shadow-inner">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 leading-tight">
                      Ganti Password
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Perbarui Kredensial Anda</p>
                  </div>
                </div>
                <button
                  onClick={closePasswordModal}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-all duration-200 hover:rotate-90 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                {/* Tips Section */}
                <div className="flex gap-3.5 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                  <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-extrabold text-amber-900 leading-tight">
                      Tips Keamanan Password
                    </p>
                    <ul className="text-xs text-amber-800/80 space-y-1 list-disc list-inside mt-1 font-medium">
                      <li>Gunakan kombinasi angka minimal 4 digit</li>
                      <li>Hindari tanggal lahir atau angka berurutan</li>
                      <li>Jangan bagikan password Anda ke siapapun</li>
                    </ul>
                  </div>
                </div>

                {/* Current Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                    Password Lama
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="w-full px-4 py-3.5 pr-12 bg-slate-50 border-2 border-[#8c1b1d]/20 rounded-2xl focus:ring-2 focus:ring-[#8c1b1d]/20 focus:bg-white focus:border-[#8c1b1d] transition-all duration-200 text-slate-800 font-extrabold text-sm"
                      placeholder="Masukkan password lama"
                      inputMode="numeric"
                      pattern="[0-9]*"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                    Password Baru
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="w-full px-4 py-3.5 pr-12 bg-slate-50 border-2 border-[#8c1b1d]/20 rounded-2xl focus:ring-2 focus:ring-[#8c1b1d]/20 focus:bg-white focus:border-[#8c1b1d] transition-all duration-200 text-slate-800 font-extrabold text-sm"
                      placeholder="Minimal 4 angka (contoh: 1234)"
                      inputMode="numeric"
                      pattern="[0-9]*"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                    Konfirmasi Password Baru
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3.5 pr-12 bg-slate-50 border-2 border-[#8c1b1d]/20 rounded-2xl focus:ring-2 focus:ring-[#8c1b1d]/20 focus:bg-white focus:border-[#8c1b1d] transition-all duration-200 text-slate-800 font-extrabold text-sm"
                      placeholder="Ulangi password baru"
                      inputMode="numeric"
                      pattern="[0-9]*"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-3 p-6 border-t border-slate-100 bg-slate-50/50">
                <button
                  onClick={closePasswordModal}
                  className="flex-1 px-4 py-3.5 bg-white border border-slate-200/80 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 hover:text-slate-800 active:scale-[0.98] transition-all duration-200"
                >
                  Batal
                </button>
                <button
                  onClick={handlePasswordChange}
                  disabled={isChangingPassword}
                  className="flex-1 px-4 py-3.5 bg-gradient-to-r from-[#8c1b1d] to-[#c0392b] text-white rounded-2xl font-bold hover:from-[#7a1819] hover:to-[#a02020] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98] shadow-lg shadow-[#8c1b1d]/20 hover:shadow-[#8c1b1d]/30"
                >
                  {isChangingPassword ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        <SuccessModal
          isOpen={isSuccessModalOpen}
          onClose={() => setIsSuccessModalOpen(false)}
          title="Password Berhasil Diubah!"
          message="Password Anda telah berhasil diperbarui. Gunakan password baru untuk login berikutnya."
          buttonText="OK"
        />

        {/* Error Notification Modal */}
        <NotificationModal
          isOpen={errorModal.isOpen}
          onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
          type="error"
          title={errorModal.title}
          message={errorModal.message}
        />

        {/* Location Selector Modal for Superadmin */}
        {isLocationDropdownOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4"
            onClick={closeLocationModal}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            
            {/* Modal Content */}
            <div 
              className="relative w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[28px] shadow-2xl max-h-[80vh] flex flex-col animate-slide-up overflow-hidden border-2 border-[#8c1b1d]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle bar for mobile screen swipe gesture cues */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b-2 border-[#8c1b1d]/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-inner">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 leading-tight">
                      Pilih Titik Absensi
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                      {allLocations.length} Lokasi Tersedia Untuk Simulasi
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeLocationModal}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                {allLocations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <MapPin className="w-14 h-14 mb-4 opacity-20" />
                    <p className="text-sm font-semibold">Tidak ada titik absensi tersedia</p>
                  </div>
                ) : (
                  allLocations.map((loc) => {
                    const isSelected = selectedLocation?.id === loc.id;
                    return (
                      <button
                        key={loc.id}
                        onClick={() => handleLocationSelect(loc)}
                        className={`w-full flex items-center gap-4 p-4 text-left rounded-2xl transition-all duration-200 active:scale-[0.99] border ${
                          isSelected
                            ? 'bg-purple-50/50 border-purple-200 shadow-sm'
                            : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50 hover:border-slate-200'
                        }`}
                      >
                        {/* Radio indicator */}
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                          isSelected
                            ? 'bg-purple-600 border-purple-600 shadow-sm shadow-purple-500/20'
                            : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                          )}
                        </div>
                        
                        {/* Location info */}
                        <div className="flex-1 min-w-0">
                          <p className={`font-black truncate text-sm leading-snug ${
                            isSelected ? 'text-purple-900' : 'text-slate-800'
                          }`}>
                            {loc.location_name || loc.unit_kerja}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 truncate">
                            {loc.unit_kerja}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Footer with Buttons */}
              <div className="flex gap-3 p-6 border-t border-slate-100 bg-slate-50/50">
                <button
                  onClick={closeLocationModal}
                  className="flex-1 px-4 py-3.5 bg-white border border-slate-200 text-slate-655 rounded-2xl font-bold hover:bg-slate-100 hover:text-slate-800 active:scale-[0.98] transition-all duration-200"
                >
                  Batal
                </button>
                <button
                  onClick={saveSelectedLocation}
                  disabled={isSavingLocation || !selectedLocation || selectedLocation?.id === attendanceLocation?.id}
                  className="flex-1 px-4 py-3.5 bg-purple-600 text-white rounded-2xl font-bold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98] shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30"
                >
                  {isSavingLocation ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Menyimpan...
                    </span>
                  ) : (
                    "Simpan"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
    <BottomNavigation />
    </>
  );
}
