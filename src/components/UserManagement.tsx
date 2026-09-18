import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useUserManagement, UserData, UserFormValues } from "@/hooks/use-user-management";
import { isAdmin, isSuperAdmin, getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { 
  Plus, Edit, Trash2, Loader2, X, ChevronDown,
  Users, Search, Building2, UserCheck, Shield,
  Eye, EyeOff, Copy, Check, Download, Award, MapPin
} from "lucide-react";
import NotificationModal from "./NotificationModal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { generateStrukturalPDF } from "@/lib/pdf-generator";

type JsPdfWithAutoTable = jsPDF & {
  lastAutoTable?: {
    finalY: number;
  };
  internal: jsPDF["internal"] & {
    getNumberOfPages: () => number;
  };
};

// Interface untuk data lokasi absensi
interface AttendanceLocationData {
  id: string;
  user_id: string | null;
  unit_kerja: string;
  location_name: string | null;
  radius_meters: number;
  is_primary?: boolean | null;
  is_active?: boolean | null;
}

// Helper untuk mendapatkan nama gedung singkat
const getShortLocationName = (locationName: string): string => {
  if (locationName.includes('Gedung A')) return 'Gedung A';
  if (locationName.includes('Gedung E')) return 'Gedung E';
  if (locationName.includes('Rektorat')) return 'Rektorat';
  if (locationName.includes('FKIP')) return 'FKIP';
  if (locationName.includes('Fakultas Hukum')) return 'Fak. Hukum';
  if (locationName.includes('Pascasarjana')) return 'Pascasarjana';
  return locationName.split(' ').slice(0, 2).join(' ');
};

// --- Sub-Components ---

interface UserFormProps {
  initialData?: UserData;
  onSave: (values: UserFormValues) => Promise<boolean>;
  onCancel: () => void;
  isSaving: boolean;
  saveError: string | null;
}

const UserForm = ({
  initialData,
  onSave,
  onCancel,
  isSaving,
  saveError,
  existingUnits = [],
  userLocations = [],
}: UserFormProps & {
  existingUnits?: string[];
  userLocations?: AttendanceLocationData[];
}) => {
  const [username, setUsername] = useState(initialData?.username || "");
  const [fullName, setFullName] = useState(initialData?.full_name || "");
  // Jika superadmin, jangan izinkan perubahan role, gunakan 'admin' sebagai default untuk user baru
  const [role, setRole] = useState<'admin' | 'dosen' | 'pegawai' | 'mahasiswa'>(
    initialData?.role === 'superadmin' ? 'admin' : (initialData?.role || 'pegawai')
  );

  const canManageAdmins = isSuperAdmin();
  const canEditUnitKerja = isSuperAdmin(); // Hanya superadmin yang bisa edit unit kerja
  const allowedRoles = useMemo(() => {
    const base = ['pegawai', 'dosen', 'mahasiswa'] as const;
    return canManageAdmins ? (['pegawai', 'dosen', 'mahasiswa', 'admin'] as const) : base;
  }, [canManageAdmins]);

  const roleLabel = (r: 'admin' | 'dosen' | 'pegawai' | 'mahasiswa') => {
    if (r === 'pegawai') return 'Tendik';
    if (r === 'dosen') return 'Dosen';
    if (r === 'mahasiswa') return 'Mahasiswa';
    return 'Admin';
  };

  useEffect(() => {
    // Defensive: jangan biarkan role 'admin' terset lewat manipulasi state
    // ketika target user bukan admin (create/edit user biasa).
    if (!canManageAdmins && initialData?.role !== 'admin' && role === 'admin') {
      setRole('pegawai');
    }
  }, [canManageAdmins, initialData?.role, role]);
  const [unitKerja, setUnitKerja] = useState(initialData?.unit_kerja || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);

  const activeUserLocations = useMemo(() => {
    return (userLocations || [])
      .filter((location) => location.is_active !== false)
      .sort((a, b) => {
        const aPrimary = a.is_primary ? 1 : 0;
        const bPrimary = b.is_primary ? 1 : 0;
        if (aPrimary !== bPrimary) return bPrimary - aPrimary;
        return (a.location_name || "").localeCompare(b.location_name || "");
      });
  }, [userLocations]);

  
  // Cek apakah sedang edit superadmin (tidak boleh ubah role)
  const isEditingSuperAdmin = initialData?.role === 'superadmin';

  // Filter existing units based on input
  const filteredUnits = existingUnits
    .filter(u => u && u.toLowerCase().includes(unitKerja.toLowerCase()))
    .slice(0, 5);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const success = await onSave({
      username,
      full_name: fullName,
      role,
      unit_kerja: unitKerja,
      password: password || undefined,
    });

    if (success) {
      onCancel();
    }
  };

  const getRoleColor = (r: string) => {
    switch(r) {
      case 'admin': return 'bg-red-500';
      case 'dosen': return 'bg-emerald-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={onCancel}
      />

      {/* Modal Container */}
      <div className="flex min-h-full items-end justify-center p-3 text-center sm:items-center sm:p-4">

        {/* Modal Panel */}
        <div className="relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 ease-out max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)] flex flex-col">

          {/* Header */}
          <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 px-5 sm:px-6 py-4 sm:py-5">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-white/20 shadow-inner backdrop-blur-sm">
                {initialData ? <Edit className="h-5 w-5 sm:h-6 sm:w-6 text-white" /> : <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-white" />}
              </div>
              <div className="flex-1 text-left min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-white truncate">
                  {initialData ? "Edit Pengguna" : "Tambah Pengguna"}
                </h3>
                <p className="text-blue-100 text-xs sm:text-sm mt-0.5 line-clamp-2">
                  {initialData ? "Perbarui informasi akun pengguna" : "Lengkapi form untuk membuat akun baru"}
                </p>
              </div>
              <button
                onClick={onCancel}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                aria-label="Tutup"
                type="button"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar px-5 sm:px-6 py-5 sm:py-6">
            {saveError && (
              <div className="mb-5 rounded-xl bg-red-50 border border-red-100 p-4 flex gap-3">
                <div className="shrink-0 text-red-500">
                  <X className="h-5 w-5" />
                </div>
                <div className="text-sm text-red-700">
                  <span className="font-semibold block mb-0.5">Gagal menyimpan</span>
                  {saveError}
                </div>
              </div>
            )}

            <form
              id={initialData ? "user-form-edit" : "user-form-create"}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-900">Nama Lengkap</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Contoh: Budi Santoso, M.Kom"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-900">Username</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      placeholder="username.pengguna"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none font-mono text-sm"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-900">Role & Hak Akses</label>
                  {isEditingSuperAdmin ? (
                    <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
                      <div className="flex items-center gap-2 text-purple-700">
                        <Shield className="w-5 h-5" />
                        <span className="font-bold">Superadmin</span>
                      </div>
                      <p className="text-xs text-purple-600 mt-1">Role superadmin tidak dapat diubah melalui form ini</p>
                    </div>
                  ) : (
                    <div className={`grid ${allowedRoles.length === 2 ? 'grid-cols-2' : 'grid-cols-3'} gap-3`}>
                      {allowedRoles.map((r) => (
                        <div
                          key={r}
                          onClick={() => setRole(r)}
                          className={`cursor-pointer relative overflow-hidden rounded-xl border-2 p-3 text-center transition-all duration-200 ${
                            role === r
                              ? `border-transparent shadow-lg transform scale-[1.02] ${getRoleColor(r)} text-white`
                              : 'border-gray-100 bg-gray-50 hover:bg-gray-100 hover:border-gray-200 text-gray-600'
                          }`}
                        >
                          <span className="relative z-10 font-bold text-sm">{roleLabel(r)}</span>
                          {role === r && (
                            <div className="absolute top-1 right-1">
                              <Check size={12} strokeWidth={4} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2 relative">
                  <label className="text-sm font-semibold text-gray-900">Unit Kerja</label>
                  <input
                    type="text"
                    value={unitKerja}
                    onChange={(e) => {
                      if (!canEditUnitKerja && initialData) return; // Prevent editing if not allowed
                      setUnitKerja(e.target.value);
                      setShowUnitDropdown(true);
                    }}
                    onFocus={() => {
                      if (canEditUnitKerja || !initialData) {
                        setShowUnitDropdown(true);
                      }
                    }}
                    onBlur={() => setTimeout(() => setShowUnitDropdown(false), 200)}
                    placeholder={canEditUnitKerja || !initialData ? "Cari atau ketik nama unit..." : "Unit kerja tidak dapat diubah"}
                    disabled={!canEditUnitKerja && !!initialData}
                    className={`w-full px-4 py-3 rounded-xl border transition-all outline-none ${
                      !canEditUnitKerja && initialData
                        ? 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed'
                        : 'border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                    }`}
                  />
                  {canEditUnitKerja && showUnitDropdown && filteredUnits.length > 0 && (
                    <div className="absolute z-20 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      {filteredUnits.map((unit, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setUnitKerja(unit);
                            setShowUnitDropdown(false);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-blue-50 text-sm text-gray-700 transition-colors border-b border-gray-50 last:border-0 flex items-center gap-2"
                        >
                          <Building2 size={14} className="text-gray-400" />
                          {unit}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-900">Titik Absensi</label>
                  <div className={`rounded-xl border p-3 space-y-2 ${
                    !canEditUnitKerja && initialData
                      ? 'border-gray-200 bg-gray-100'
                      : 'border-gray-200 bg-gray-50'
                  }`}>
                    <p className={`text-xs ${
                      !canEditUnitKerja && initialData ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Pengaturan lokasi absensi dikelola melalui menu Titik Absensi.
                    </p>
                    {activeUserLocations.length === 0 ? (
                      <div className="text-xs text-gray-500">
                        {initialData
                          ? "Belum ada lokasi absensi untuk akun ini."
                          : "Lokasi absensi bisa diatur setelah akun dibuat."}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {activeUserLocations.map((location) => (
                          <div
                            key={location.id}
                            className={`flex items-start gap-2 rounded-lg border px-3 py-2 ${
                              !canEditUnitKerja && initialData
                                ? 'border-gray-200 bg-gray-50'
                                : 'border-gray-200 bg-white/70'
                            }`}
                          >
                            <div className="mt-1">
                              <div className={`w-2 h-2 rounded-full ${
                                location.is_primary ? 'bg-emerald-500' : 'bg-blue-500'
                              }`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className={`text-sm font-semibold truncate ${
                                !canEditUnitKerja && initialData ? 'text-gray-500' : 'text-gray-800'
                              }`}>
                                {location.location_name || location.unit_kerja}
                              </div>
                              <div className="text-xs text-gray-500">
                                {location.is_primary ? "Lokasi Utama" : "Lokasi Sekunder"} • Radius {location.radius_meters}m
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                   <label className="flex items-center justify-between text-sm font-semibold text-gray-900">
                     <span>Password</span>
                     {initialData && <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Opsional</span>}
                   </label>

                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required={!initialData}
                      placeholder={initialData ? "Biarkan kosong jika tidak diubah" : "Minimal 6 karakter"}
                      className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>

          <div className="bg-gray-50 px-5 sm:px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className="w-full sm:w-24 inline-flex justify-center items-center px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Batal
            </button>
            <button
              type="submit"
              form={initialData ? "user-form-edit" : "user-form-create"}
              disabled={isSaving}
              className="w-full sm:w-32 inline-flex justify-center items-center px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 transition-all"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Menyimpan
                </>
              ) : (
                <>Simpan</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Action Menu Component ---
import { MoreVertical } from "lucide-react";

interface ActionMenuProps {
  onEdit: () => void;
  onDelete: () => void;
  canDelete: boolean;
  isTargetSuperAdmin?: boolean;
}

const ActionMenu = ({ onEdit, onDelete, canDelete, isTargetSuperAdmin }: ActionMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-lg transition-all duration-200 ${
          isOpen ? "bg-blue-50 text-blue-600" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        }`}
      >
        <MoreVertical size={18} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-20 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
          <button
            onClick={() => {
              onEdit();
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors text-left"
          >
            <Edit size={14} />
            <span>Edit Data</span>
          </button>
          {canDelete && !isTargetSuperAdmin ? (
            <button
              onClick={() => {
                onDelete();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors text-left"
            >
              <Trash2 size={14} />
              <span>Hapus</span>
            </button>
          ) : (
            <div className="px-4 py-2.5 text-sm text-gray-400 cursor-not-allowed flex items-center gap-2">
              <Trash2 size={14} />
              <span>{isTargetSuperAdmin ? 'Tidak bisa dihapus' : 'Hapus (Admin saja)'}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// --- Unit Kerja Group Component ---
interface UnitKerjaGroupProps {
  unitKerja: string;
  users: UserData[];
  onEdit: (user: UserData) => void;
  onDelete: (id: string) => void;
  isSaving: boolean;
  startNumber: number;
  colorIndex: number;
  userLocationsMap: Map<string, AttendanceLocationData[]>;
  canDelete: boolean;
}


const groupColors = [
  { bg: 'from-blue-500 to-blue-600', light: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  { bg: 'from-emerald-500 to-emerald-600', light: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  { bg: 'from-violet-500 to-violet-600', light: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200' },
  { bg: 'from-amber-500 to-amber-600', light: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  { bg: 'from-rose-500 to-rose-600', light: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' },
  { bg: 'from-cyan-500 to-cyan-600', light: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-200' },
  { bg: 'from-orange-500 to-orange-600', light: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
  { bg: 'from-indigo-500 to-indigo-600', light: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
];

// Username with copy functionality
const CopyableUsername = ({ username }: { username: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(username);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 text-gray-600 font-mono text-sm bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors group"
      title="Klik untuk menyalin"
    >
      <span className="truncate max-w-[100px] sm:max-w-[120px] md:max-w-[180px] lg:max-w-none">{username}</span>
      {copied ? (
        <Check size={12} className="text-green-500 flex-shrink-0" />
      ) : (
        <Copy size={12} className="text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
      )}
    </button>
  );
};

const UnitKerjaGroup = ({ unitKerja, users, onEdit, onDelete, isSaving, startNumber, colorIndex, userLocationsMap, canDelete }: UnitKerjaGroupProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const color = groupColors[colorIndex % groupColors.length];

  // Helper untuk mendapatkan lokasi absensi user
  const getUserLocation = (user: UserData): { primary: string; secondary: string[] } => {
    const locations = userLocationsMap.get(user.id) || [];
    const activeLocations = locations.filter((loc) => loc.is_active !== false);

    if (activeLocations.length === 0) {
      return { primary: '-', secondary: [] };
    }

    const sorted = [...activeLocations].sort((a, b) => {
      const aPrimary = a.is_primary ? 1 : 0;
      const bPrimary = b.is_primary ? 1 : 0;
      if (aPrimary !== bPrimary) return bPrimary - aPrimary;
      return (a.location_name || '').localeCompare(b.location_name || '');
    });

    const primaryLocation = sorted.find((loc) => loc.is_primary) || sorted[0];
    const primaryName = getShortLocationName(primaryLocation.location_name || primaryLocation.unit_kerja);
    const primaryWithRadius = `${primaryName} (${primaryLocation.radius_meters}m)`;

    const secondary = sorted
      .filter((loc) => loc.id !== primaryLocation.id)
      .map((loc) => {
        const secondaryName = getShortLocationName(loc.location_name || loc.unit_kerja);
        return `${secondaryName} (${loc.radius_meters}m)`;
      });

    return { primary: primaryWithRadius, secondary };
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Group Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50/50 hover:bg-gray-50 transition-colors border-b border-gray-100"
      >
        <div className={`p-1.5 rounded-lg bg-white shadow-sm border border-gray-100 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}>
          <ChevronDown size={16} />
        </div>
        
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color.bg} flex items-center justify-center flex-shrink-0 text-white shadow-sm`}>
             <Building2 size={16} />
          </div>
          <div className="flex flex-col items-start min-w-0">
            <span className="font-semibold text-gray-900 truncate w-full text-left text-sm md:text-base">{unitKerja}</span>
            <span className="text-xs text-gray-500 font-medium">{users.length} Anggota</span>
          </div>
        </div>
      </button>

      {/* Group Content */}
      <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        
        {/* Desktop Table Header */}
        <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50/30 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <div className="col-span-1">No</div>
          <div className="col-span-3">Nama Lengkap</div>
          <div className="col-span-2">Username</div>
          <div className="col-span-2">Titik Absensi</div>
          <div className="col-span-3">Unit Kerja</div>
          <div className="col-span-1 text-center">Aksi</div>
        </div>
        
        {/* Table Body */}
        <div className="divide-y divide-gray-50">
          {users.map((user, index) => {
            const locations = getUserLocation(user);
            const isStruktural = user.is_struktural === true;
            
            return (
              <div key={user.id} className="group/row hover:bg-blue-50/30 transition-colors">
                {/* Desktop Row */}
                <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3.5 items-center text-sm">
                  <div className="col-span-1 text-gray-500 font-medium">
                    {startNumber + index}
                  </div>
                  
                  <div className="col-span-3 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${color.bg} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                        {user.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{user.full_name}</p>
                        {isStruktural && (
                           <div className="flex items-center gap-1 mt-0.5">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700">
                              <Award size={10} className="mr-1" />
                              Struktural
                            </span>
                           </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    <CopyableUsername username={user.username} />
                  </div>
                  
                  <div className="col-span-2 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-gray-600" title={`Titik Utama: ${locations.primary}`}>
                      <MapPin size={12} className="text-emerald-500 shrink-0" />
                      <span className="truncate max-w-[140px]">{locations.primary}</span>
                    </div>
                    {locations.secondary.length > 0 &&
                      locations.secondary.map((secondaryLocation, secondaryIndex) => (
                        <div
                          key={secondaryIndex}
                          className="flex items-center gap-1.5 text-xs text-gray-500"
                          title={`Titik Kedua: ${secondaryLocation}`}
                        >
                          <div className="w-3 flex justify-center shrink-0">
                            <div className="w-1 h-1 rounded-full bg-gray-300" />
                          </div>
                          <span className="truncate max-w-[140px]">{secondaryLocation}</span>
                        </div>
                      ))}
                  </div>

                   <div className="col-span-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 truncate max-w-full" title={user.unit_kerja || '-'}>
                      {user.unit_kerja || '-'}
                    </span>
                  </div>

                  <div className="col-span-1 flex justify-center items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                    <ActionMenu 
                      onEdit={() => onEdit(user)}
                      onDelete={() => onDelete(user.id)}
                      canDelete={canDelete}
                      isTargetSuperAdmin={user.role === 'superadmin'}
                    />
                  </div>
                </div>

                {/* Mobile Card Layout */}
                <div className="lg:hidden p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${color.bg} flex items-center justify-center text-white font-bold text-sm shadow-sm`}>
                        {user.full_name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-2">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-gray-900 truncate pr-4">{user.full_name}</p>
                          <span className="text-xs font-mono text-gray-400">#{startNumber + index}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{user.unit_kerja || '-'}</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <CopyableUsername username={user.username} />
                         {isStruktural && (
                           <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                              Struktural
                           </span>
                        )}
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-2 space-y-1.5 border border-gray-100">
                        <div className="flex items-center gap-2 text-xs">
                          <MapPin size={12} className="text-emerald-600 shrink-0" />
                          <span className="text-gray-600 truncate">{locations.primary}</span>
                        </div>
                        {locations.secondary.length > 0 &&
                          locations.secondary.map((secondaryLocation, secondaryIndex) => (
                            <div key={secondaryIndex} className="flex items-center gap-2 text-xs">
                              <MapPin size={12} className="text-blue-600 shrink-0" />
                              <span className="text-gray-500 truncate">{secondaryLocation}</span>
                            </div>
                          ))}
                      </div>

                      <div className="flex items-center gap-3 pt-2 mt-2 border-t border-gray-100">
                        <button
                          onClick={() => onEdit(user)}
                          className="flex-1 inline-flex justify-center items-center gap-2 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <Edit size={14} /> Edit
                        </button>
                        {canDelete && user.role !== 'superadmin' ? (
                          <button
                            onClick={() => onDelete(user.id)}
                            className="flex-1 inline-flex justify-center items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                            disabled={isSaving}
                          >
                            <Trash2 size={14} /> Hapus
                          </button>
                        ) : (
                          <div className="flex-1 inline-flex justify-center items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed">
                            <Trash2 size={14} /> {user.role === 'superadmin' ? 'Terkunci' : 'Hapus'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// --- Statistics Card ---
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  bgColor: string;
  onClick?: () => void;
  isActive?: boolean;
}

const StatCard = ({ icon, label, value, color, bgColor, onClick, isActive }: StatCardProps) => (
  <div 
    className={`bg-white rounded-xl p-4 border transition-all duration-200 ${
      isActive 
        ? 'border-blue-500 ring-1 ring-blue-500 shadow-md scale-[1.02]' 
        : 'border-gray-100 hover:border-gray-300 hover:shadow-sm cursor-pointer'
    }`}
    onClick={onClick}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">{label}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      </div>
      <div className={`p-2.5 rounded-lg ${bgColor} ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);

// --- Helper Functions for Sorting and Grouping ---

const normalizeUnitKerja = (user: UserData): string => {
  const unitKerja = (user.unit_kerja || '').trim();
  if (!unitKerja) return 'Tanpa Unit Kerja';

  // Logika khusus berdasarkan username
  if (user.username === 'syarifuddin.nur') return 'BAU'; // Ka. Perlengkapan & Plt. Ka. BAU
  if (user.username === 'syarifuddin') return 'Humas'; // Staf Ahli Lembaga Kerjasama & Informasi & Humas
  if (user.username === 'susi.yuliastanty') return 'BKK';
  if (user.username === 'yumi.ariyati') return 'UPT Perpustakaan';
  if (user.username === 'adrian.fadhli') return 'LPM';

  const lowerUnit = unitKerja.toLowerCase();

  // 1. Yayasan
  // Sekretaris YPTP & Ketua YPTP termasuk ke group Yayasan
  if (lowerUnit.includes('yayasan') || lowerUnit.includes('sekretaris yptp') || lowerUnit.includes('yptp')) {
    return 'Yayasan';
  }

  // 2. Rektorat (Rektor, Wakil Rektor, Sekretariat Rektorat, Staf WR, Senat, dll)
  if (lowerUnit.includes('rektor') || lowerUnit.includes('wr i') || lowerUnit.includes('wr ii') || lowerUnit.includes('wr iii') || lowerUnit.includes('senat')) {
    return 'Rektorat';
  }

  // 3. Fakultas-Fakultas
  // Fakultas Teknik & Perencanaan (Teknik, Arsitektur, T. Sipil, T. Mesin, T. Elektro, T. Industri)
  // IMPORTANT: Check for Lembaga Diklat BEFORE checking T. Sipil (since Dian is both)
  if (lowerUnit.includes('lembaga diklat') || lowerUnit.includes('diklat, kkn')) {
    return 'Lembaga Diklat, KKN';
  }

  if (lowerUnit.includes('fak.teknik') || lowerUnit.includes('fak. teknik') || lowerUnit.includes('arsitektur') || 
      lowerUnit.includes('t. sipil') || lowerUnit.includes('t. mesin') || lowerUnit.includes('t. elektro') || 
      lowerUnit.includes('t. industri') || lowerUnit.includes('teknik sipil') || lowerUnit.includes('teknik mesin') ||
      lowerUnit.includes('teknik elektro') || lowerUnit.includes('teknik industri') || lowerUnit.includes('teknik arsitek')) {
    return 'Fakultas Teknik & Perencanaan';
  }
  
  // 3a. AAI harus terpisah dari Fakultas Ekonomi
  // Catatan: "akuntansi" sering muncul di AAI, jadi harus dicek lebih dulu.
  if (lowerUnit.includes('aai') || lowerUnit.includes('akademi akuntansi')) {
    return 'Akademi Akuntansi Indonesia (AAI)';
  }

  // Fakultas Ekonomi (Manajemen, Akuntansi)
  // IMPORTANT: Skip manajemen if part of Lembaga Diklat (h.agussalim case)
  if (lowerUnit.includes('fak. ekonomi') || lowerUnit.includes('akuntansi')) {
    return 'Fakultas Ekonomi';
  }
  
  if (lowerUnit.includes('manajemen') && !lowerUnit.includes('diklat') && !lowerUnit.includes('kkn')) {
    return 'Fakultas Ekonomi';
  }
  
  // Fakultas Hukum (Ilmu Hukum, Pasca)
  if (lowerUnit.includes('fak. hukum') || lowerUnit.includes('ilmu hukum') || lowerUnit.includes('pasca')) {
    return 'Fakultas Hukum';
  }
  
  // Fakultas Pertanian (Agribisnis, Agroteknologi, THP)
  if (lowerUnit.includes('fak. pertanian') || lowerUnit.includes('agribisnis') || lowerUnit.includes('agroteknologi') || lowerUnit.includes('thp')) {
    return 'Fakultas Pertanian';
  }
  
  // Fakultas Sastra (Sastra Inggris)
  if (lowerUnit.includes('fak. sastra') || lowerUnit.includes('sastra inggris')) {
    return 'Fakultas Sastra';
  }
  
  // Fakultas FISIPOL (Ilmu Adm Negara, Ilmu Pemerintahan, Ilmu Komunikasi)
  if (lowerUnit.includes('fisipol') || lowerUnit.includes('fisipo') || lowerUnit.includes('i. adm negara') || 
      lowerUnit.includes('adm negara') || lowerUnit.includes('i. pemerintahan') || lowerUnit.includes('pemerintahan') || 
      lowerUnit.includes('i. komunikasi') || lowerUnit.includes('komunikasi')) {
    return 'Fakultas Ilmu Sosial dan Ilmu Politik (FISIPOL)';
  }
  
  // Fakultas FKIP (Pendidikan)
  if (lowerUnit.includes('fkip') || lowerUnit.includes('pend.') || lowerUnit.includes('pend ') || lowerUnit.includes('pendidikan')) {
    return 'Fakultas Keguruan dan Ilmu Pendidikan (FKIP)';
  }
  
  // 4. AAI
  if (lowerUnit.includes('aai')) return 'Akademi Akuntansi Indonesia (AAI)';
  
  // 5. D III MIK (masuk ke Fakultas Ekonomi)
  if (lowerUnit.includes('d iii mik') || lowerUnit.includes('d3 mik') || lowerUnit.includes('diii mik')) {
    return 'Fakultas Ekonomi';
  }
  
  // 6. Biro-Biro
  if (lowerUnit.includes('baak')) return 'BAAK';
  // BAU dan Perlengkapan dipisah
  if (lowerUnit.includes('perlengkapan')) {
    // Kepala BAU tetap di BAU
    if (lowerUnit.includes('ka. bau') || lowerUnit.includes('kepala bau')) {
      return 'BAU';
    }
    return 'Perlengkapan';
  }
  if (lowerUnit.includes('bau')) return 'BAU';
  if (lowerUnit.includes('bapsi')) return 'BAPSI';
  if (lowerUnit.includes('bka') || lowerUnit.includes('bkk')) return 'BKK';
  
  // 6. Lembaga
  if (lowerUnit.includes('lppm')) return 'LPPM';
  if (lowerUnit.includes('lpm') && !lowerUnit.includes('lppm')) return 'LPM';
  
  // 7. Unit-Unit
  if (lowerUnit.includes('perpustakaan') || lowerUnit.includes('perpus')) return 'UPT Perpustakaan';
  if (lowerUnit.includes('pmb')) return 'PMB';
  if (lowerUnit.includes('registrasi')) return 'Registrasi';
  if (lowerUnit.includes('lab.') || lowerUnit.includes('lab ')) return 'Laboratorium Komputer';
  if (lowerUnit.includes('staf it') || lowerUnit === 'it') return 'IT';
  
  // 8. SMA & TK Ekasakti
  if (lowerUnit.includes('sma ekasakti') || lowerUnit.includes('sma ')) return 'SMA Ekasakti';
  if (lowerUnit.includes('tk ekasakti') || lowerUnit.includes('tk ')) return 'TK Ekasakti';
  
  // 9. Dosen LB
  if (lowerUnit === 'dosen lb') return 'Dosen Luar Biasa';
  
  // 10. Support Staff
  if (lowerUnit.includes('cleaning service') || lowerUnit.includes('kebersihan')) return 'Cleaning Service';
  if (lowerUnit.includes('garin')) return 'Garin';
  if (lowerUnit.includes('driver')) return 'Driver';
  if (lowerUnit.includes('satpam')) return 'Satuan Pengamanan (Satpam)';
  
  // 11. Default fallback
  return unitKerja;
};

const getUnitPriority = (unitName: string): number => {
  const lowerUnit = unitName.toLowerCase();
  
  if (lowerUnit === 'yayasan') return 1;
  if (lowerUnit === 'rektorat') return 2;
  if (lowerUnit.includes('fakultas ekonomi')) return 10;
  if (lowerUnit.includes('fakultas hukum')) return 11;
  if (lowerUnit.includes('fakultas pertanian')) return 12;
  if (lowerUnit.includes('fakultas sastra')) return 13;
  if (lowerUnit.includes('fakultas teknik')) return 14;
  if (lowerUnit.includes('fisipol')) return 15;
  if (lowerUnit.includes('fkip')) return 16;
  if (lowerUnit.includes('aai') || lowerUnit.includes('akademi akuntansi')) return 20;
  // DIII MIK sekarang masuk Fakultas Ekonomi (priority 10)
  if (lowerUnit.includes('d iii mik') || lowerUnit.includes('diploma') || lowerUnit.includes('program diploma')) return 10;
  if (lowerUnit === 'baak') return 30;
  if (lowerUnit === 'bau') return 31;
  if (lowerUnit === 'perlengkapan') return 32;
  if (lowerUnit === 'bapsi') return 33;
  if (lowerUnit === 'bkk') return 34;
  if (lowerUnit === 'lppm') return 40;
  if (lowerUnit === 'lpm') return 41;
  if (lowerUnit.includes('lembaga diklat') || lowerUnit.includes('diklat, kkn')) return 42;
  if (lowerUnit.includes('perpustakaan')) return 50;
  if (lowerUnit === 'pmb') return 51;
  if (lowerUnit === 'registrasi') return 52;
  if (lowerUnit.includes('laboratorium')) return 53;
  if (lowerUnit === 'it') return 54;
  if (lowerUnit.includes('sma ekasakti')) return 60;
  if (lowerUnit.includes('tk ekasakti')) return 61;
  if (lowerUnit.includes('dosen luar biasa')) return 70;
  if (lowerUnit.includes('cleaning service')) return 80;
  if (lowerUnit.includes('garin')) return 81;
  if (lowerUnit === 'driver') return 82;
  if (lowerUnit.includes('satpam') || lowerUnit.includes('satuan pengamanan')) return 83;
  if (lowerUnit === 'tanpa unit kerja') return 999;
  
  return 100;
};

const getPositionPriority = (jabatan: string): number => {
  const lower = (jabatan || '').toLowerCase();

  // Yayasan
  if (lower.includes('ketua yptp')) return 0;

  // Pimpinan tertinggi
  if (lower.includes('rektor') && !lower.includes('wakil')) return 1;
  if (lower.includes('wakil rektor')) return 2;
  if (lower.includes('direktur') && !lower.includes('wakil')) return 3;
  if (lower.includes('wakil direktur')) return 4;

  // Pimpinan Fakultas
  if (lower.includes('dekan') && !lower.includes('wadek')) return 5;
  if (lower.includes('wadek') || lower.includes('wakil dekan')) return 6;
  
  // Kepala Unit/Biro
  if (lower.includes('ketua lppm') || lower.includes('kepala lpm') || lower.includes('kepala bapsi')) return 7;
  if (lower.includes('sekretaris lppm') || lower.includes('sek. lppm')) return 8;
  
  // Ka. Prodi
  if (lower.includes('ka. prodi') || lower.includes('kaprodi')) return 10;
  if (lower.includes('sek. prodi') || lower.includes('sekprodi')) return 11;
  
  // Ka. GPM, Ka. Lab, Ka. TU
  if (lower.includes('ka. gpm')) return 12;
  if (lower.includes('ka. lab')) return 13;
  if (lower.includes('ka. tu') || lower.includes('ka.tu')) return 14;
  
  // Kepala lainnya
  if (lower.includes('kepsek') || lower.includes('kepala sekolah')) return 15;
  if (lower.includes('kepala tk')) return 16;
  if (lower.startsWith('ka.') || lower.startsWith('ka ') || lower.startsWith('kepala')) return 17;
  
  // Sekretaris dan Bendahara
  if (lower.includes('sekretaris')) return 20;
  if (lower.includes('bendahara')) return 21;
  
  // Koordinator
  if (lower.includes('koordinator') || lower.includes('koor.')) return 25;
  if (lower.includes('komandan')) return 26;
  if (lower.includes('wakil komandan')) return 27;
  
  // Staf Ahli
  if (lower.includes('staf ahli')) return 30;
  
  // Dosen
  if (lower.includes('dosen pns dpk')) return 40;
  if (lower.includes('dosen nidk')) return 41;
  if (lower.includes('dosen nidn')) return 42;
  if (lower.includes('dosen lb')) return 43;
  if (lower.includes('dosen')) return 44;
  
  // Guru
  if (lower.includes('guru')) return 50;
  
  // Staf
  if (lower.includes('staf')) return 60;
  if (lower.includes('operator')) return 61;
  
  // Support
  if (lower.includes('satpam')) return 70;
  if (lower.includes('driver')) return 71;
  if (lower.includes('cleaning')) return 72;
  if (lower.includes('garin')) return 73;
  
  return 100;
};

const getFakultasEkonomiOrderPriority = (user: UserData): number => {
  const jabatanLower = (user.unit_kerja || '').toLowerCase();

  // Put AAI leadership below FE leadership
  if (jabatanLower.includes('wakil direktur aai')) return 12;

  return getPositionPriority(user.unit_kerja || '');
};

const getRektoratOrderPriority = (jabatan: string): number => {
  const lower = (jabatan || '').toLowerCase().replace(/\s+/g, ' ').trim();

  // Rektor (exclude generic 'rektorat')
  if (
    lower === 'rektor' ||
    (lower.includes('rektor') &&
      !lower.includes('wakil') &&
      !lower.includes('rektorat') &&
      !lower.includes('driver') &&
      !lower.includes('staf'))
  ) {
    return 1;
  }

  if (lower.includes('driver rektor')) return 2;
  if (lower.includes('staf rektor')) return 3;

  const isStafWr = lower.includes('staf wr') || lower.includes('staf wakil rektor');

  const getWrNumber = (): 1 | 2 | 3 | null => {
    if (
      /\bwakil rektor\b\s*[-.]?\s*i\b/.test(lower) ||
      /\bwakil rektor\b\s*[-.]?\s*1\b/.test(lower) ||
      /(?:^|\b)(wr|warek)\s*[-.]?\s*i\b/.test(lower) ||
      /(?:^|\b)(wr|warek)\s*[-.]?\s*1\b/.test(lower) ||
      /(?:^|\b)(wr|warek)1\b/.test(lower)
    ) {
      return 1;
    }

    if (
      /\bwakil rektor\b\s*[-.]?\s*ii\b/.test(lower) ||
      /\bwakil rektor\b\s*[-.]?\s*2\b/.test(lower) ||
      /(?:^|\b)(wr|warek)\s*[-.]?\s*ii\b/.test(lower) ||
      /(?:^|\b)(wr|warek)\s*[-.]?\s*2\b/.test(lower) ||
      /(?:^|\b)(wr|warek)2\b/.test(lower)
    ) {
      return 2;
    }

    if (
      /\bwakil rektor\b\s*[-.]?\s*iii\b/.test(lower) ||
      /\bwakil rektor\b\s*[-.]?\s*3\b/.test(lower) ||
      /(?:^|\b)(wr|warek)\s*[-.]?\s*iii\b/.test(lower) ||
      /(?:^|\b)(wr|warek)\s*[-.]?\s*3\b/.test(lower) ||
      /(?:^|\b)(wr|warek)3\b/.test(lower)
    ) {
      return 3;
    }

    return null;
  };

  const wrNumber = getWrNumber();
  if (wrNumber) {
    // Order: WR1, Staf WR1, WR2, Staf WR2, WR3, Staf WR3
    return (isStafWr ? 5 : 4) + (wrNumber - 1) * 2;
  }

  return 100;
};

const getGroupedUsers = (usersList: UserData[]) => {
  const groups: Record<string, UserData[]> = {};

  usersList.forEach(user => {
    const mainUnit = normalizeUnitKerja(user);
    if (!groups[mainUnit]) {
      groups[mainUnit] = [];
    }
    groups[mainUnit].push(user);
  });

  const sortedKeys = Object.keys(groups).sort((a, b) => {
    const priorityA = getUnitPriority(a);
    const priorityB = getUnitPriority(b);

    if (priorityA !== priorityB) return priorityA - priorityB;
    return a.localeCompare(b);
  });

  return sortedKeys.map(key => ({
    unitKerja: key,
    users: groups[key].sort((a, b) => {
      const unitKeyLower = key.toLowerCase();
      const isRektorat = unitKeyLower === 'rektorat';
      const isFakultasEkonomi = unitKeyLower.includes('fakultas ekonomi');
      const isYayasan = unitKeyLower === 'yayasan';
      const isBAU = unitKeyLower === 'bau';

      // Minimal, deterministic exceptions requested by admin
      if (isYayasan) {
        if (a.username === 'suparman' && b.username === 'refni.elida') return -1;
        if (a.username === 'refni.elida' && b.username === 'suparman') return 1;
      }
      
      // BAU: syarifuddin.nur selalu di posisi nomor 1
      if (isBAU) {
        if (a.username === 'syarifuddin.nur') return -1;
        if (b.username === 'syarifuddin.nur') return 1;
      }

      // Untuk Fakultas Ekonomi, user DIII MIK juga menggunakan sorting yang sama
      const priorityA = isRektorat
        ? getRektoratOrderPriority(a.unit_kerja || '')
        : isFakultasEkonomi
          ? getFakultasEkonomiOrderPriority(a)
          : getPositionPriority(a.unit_kerja || '');
      const priorityB = isRektorat
        ? getRektoratOrderPriority(b.unit_kerja || '')
        : isFakultasEkonomi
          ? getFakultasEkonomiOrderPriority(b)
          : getPositionPriority(b.unit_kerja || '');

      if (priorityA !== priorityB) return priorityA - priorityB;

      if (isRektorat) {
        const fallbackA = getPositionPriority(a.unit_kerja || '');
        const fallbackB = getPositionPriority(b.unit_kerja || '');

        if (fallbackA !== fallbackB) return fallbackA - fallbackB;
      }

      return a.full_name.localeCompare(b.full_name);
    })
  }));
};

// --- Main Component ---

// Helper function to check if user is Tenaga Kependidikan
const isTenagaKependidikan = (user: UserData): boolean => {
  // Exclude tesx
  if (user.username === 'tesx' || user.username === 'andi.syahrum.makkurade') return false;


  // Explicit inclusions for specific admin/superadmin users who are Tendik
  if (user.username === 'irfan.ananda.ismail' || user.username === 'asmara.indah') {
    return true;
  }

  if (user.role !== 'pegawai') return false;
  
  const unitKerja = (user.unit_kerja || '').toLowerCase();
  
  // Exclude Satpam, Guru, Driver, Garin, TK Ekasakti, SMA Ekasakti, Ka. Kebersihan, Komandan Satpam, Cleaning Service
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
  
  if (excludedKeywords.some(keyword => unitKerja.includes(keyword))) {
    return false;
  }

  // Include staff and leadership positions
  const includedKeywords = [
    'staf', 'ka.', 'kepala', 'koordinator', 'bendahara', 'sekretaris',
    'operator', 'koor.', 'komandan', 'kepsek', 'waka', 'pengelola'
  ];

  return includedKeywords.some(keyword => unitKerja.includes(keyword));
};

export default function UserManagement() {
  const { users, loading, error, loadUsers, createUser, updateUser, deleteUser } = useUserManagement();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | undefined>(undefined);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [modal, setModal] = useState<{ isOpen: boolean; type: "success" | "error"; title: string; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<'all' | 'admin' | 'dosen' | 'struktural' | 'tenaga_kependidikan'>('all');
  const [attendanceLocations, setAttendanceLocations] = useState<AttendanceLocationData[]>([]);

  // Load attendance locations
  const loadAttendanceLocations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('attendance_locations')
        .select('id, user_id, unit_kerja, location_name, radius_meters, is_primary, is_active')
        .eq('is_active', true);

      if (error) {
        console.error('Error loading attendance locations:', error);
        return;
      }

      const locations = (data || []) as AttendanceLocationData[];
      setAttendanceLocations(locations);
    } catch (err) {
      console.error('Error loading attendance locations:', err);
    }
  }, []);

  useEffect(() => {
    loadUsers();
    loadAttendanceLocations();
  }, [loadUsers, loadAttendanceLocations]);

  const userLocationsMap = useMemo(() => {
    const map = new Map<string, AttendanceLocationData[]>();
    attendanceLocations.forEach((location) => {
      if (!location.user_id) return;
      const existing = map.get(location.user_id) || [];
      existing.push(location);
      map.set(location.user_id, existing);
    });
    return map;
  }, [attendanceLocations]);

  // Statistics
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const totalAdmin = users.filter(u => u.role === 'admin' || u.role === 'superadmin').length;
    const totalDosen = users.filter(u => u.role === 'dosen' && !u.is_struktural).length;
    const totalStruktural = users.filter(u => u.is_struktural === true).length;
    const totalTenagaKependidikan = users.filter(u => isTenagaKependidikan(u)).length;
    return { totalUsers, totalAdmin, totalDosen, totalStruktural, totalTenagaKependidikan };
  }, [users]);

  // Filter and group users
  const groupedUsers = useMemo(() => {
    let filteredUsers = users;
    
    // Apply category filter
    if (filterCategory === 'admin') {
      filteredUsers = filteredUsers.filter(u => u.role === 'admin' || u.role === 'superadmin');
    } else if (filterCategory === 'dosen') {
      filteredUsers = filteredUsers.filter(u => u.role === 'dosen' && !u.is_struktural);
    } else if (filterCategory === 'struktural') {
      filteredUsers = filteredUsers.filter(u => u.is_struktural === true);
    } else if (filterCategory === 'tenaga_kependidikan') {
      filteredUsers = filteredUsers.filter(u => isTenagaKependidikan(u));
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      filteredUsers = filteredUsers.filter(user =>
        user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.unit_kerja || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return getGroupedUsers(filteredUsers);
  }, [users, searchQuery, filterCategory]);

  const handleOpenCreate = () => {
    setEditingUser(undefined);
    setSaveError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (user: UserData) => {
    const canManageAdmins = isSuperAdmin();

    // Admin biasa tidak boleh membuka form edit untuk akun admin/superadmin
    if (!canManageAdmins && (user.role === 'admin' || user.role === 'superadmin')) {
      setModal({
        isOpen: true,
        type: "error",
        title: "Tidak Diizinkan",
        message: "Hanya Superadmin yang dapat mengubah akun Admin/Superadmin.",
      });
      return;
    }

    setEditingUser(user);
    setSaveError(null);
    setIsFormOpen(true);
  };

  const handleSave = async (values: UserFormValues): Promise<boolean> => {
    setIsSaving(true);
    setSaveError(null);

    try {
      const currentUser = getCurrentUser();
      const canManageAdmins = isSuperAdmin();

      // Admin biasa tidak boleh membuat/mengubah role menjadi admin
      if (!canManageAdmins && values.role === 'admin') {
        throw new Error("Role 'Admin' hanya dapat diatur oleh Superadmin.");
      }

      // Guard tambahan: admin biasa tidak boleh mengedit akun admin/superadmin
      if (
        !canManageAdmins &&
        editingUser &&
        (editingUser.role === 'admin' || editingUser.role === 'superadmin')
      ) {
        throw new Error("Hanya Superadmin yang dapat mengubah akun Admin/Superadmin.");
      }

      // Jika tidak ada session, tetap utamakan restriction UI (defensive)
      if (!currentUser) {
        throw new Error("Sesi tidak valid. Silakan login ulang.");
      }

      if (editingUser) {
        await updateUser(editingUser.id, values);
        setModal({ isOpen: true, type: "success", title: "Berhasil", message: "Data pengguna berhasil diperbarui." });
      } else {
        await createUser(values);
        setModal({ isOpen: true, type: "success", title: "Berhasil", message: "Pengguna baru berhasil ditambahkan." });
      }
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal menyimpan perubahan.";
      setSaveError(message);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsSaving(true);
    setDeleteConfirmId(null);
    
    try {
      await deleteUser(id);
      setModal({ isOpen: true, type: "success", title: "Berhasil", message: "Pengguna berhasil dihapus." });
    } catch (err: unknown) {
       setModal({ isOpen: true, type: "error", title: "Gagal", message: err instanceof Error ? err.message : "Terjadi kesalahan." });
    } finally {
      setIsSaving(false);
    }
  };

  const userToDelete = deleteConfirmId ? users.find(u => u.id === deleteConfirmId) : null;

  // Get filtered users for PDF generation
  const getFilteredUsersForPDF = useCallback(() => {
    let filteredUsers = users;
    
    if (filterCategory === 'admin') {
      filteredUsers = filteredUsers.filter(u => u.role === 'admin' || u.role === 'superadmin');
    } else if (filterCategory === 'dosen') {
      filteredUsers = filteredUsers.filter(u => u.role === 'dosen' && !u.is_struktural);
    } else if (filterCategory === 'struktural') {
      filteredUsers = filteredUsers.filter(u => u.is_struktural === true);
    } else if (filterCategory === 'tenaga_kependidikan') {
      filteredUsers = filteredUsers.filter(u => isTenagaKependidikan(u));
    }
    
    return filteredUsers;
  }, [users, filterCategory]);

  // Get PDF title and filename based on filter
  const getPDFInfo = () => {
    let title = 'SEMUA PENGGUNA';
    let filename = 'Semua_Pengguna';
    let buttonLabel = 'Unduh Semua Akun';
    
    if (filterCategory === 'admin') {
      title = 'ADMIN';
      filename = 'Admin';
      buttonLabel = 'Unduh Admin';
    } else if (filterCategory === 'dosen') {
      title = 'DOSEN';
      filename = 'Dosen';
      buttonLabel = 'Unduh Dosen';
    } else if (filterCategory === 'struktural') {
      title = 'DOSEN STRUKTURAL';
      filename = 'Dosen_Struktural';
      buttonLabel = 'Unduh Dosen Struktural';
    } else if (filterCategory === 'tenaga_kependidikan') {
      title = 'TENAGA KEPENDIDIKAN';
      filename = 'Tenaga_Kependidikan';
      buttonLabel = 'Unduh Tenaga Kependidikan';
    }
    
    return { title, filename, buttonLabel };
  };

  // Generate PDF for user account list - Each unit kerja gets its own page with letterhead
  const generateUserListPDF = async () => {
    // NOTE: Password asli user tidak bisa diambil kembali dari hash.
    // Untuk distribusi, gunakan password sementara (hasil reset massal).
    const distributionPassword = '12345678';

    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pdf = doc as unknown as JsPdfWithAutoTable;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 40;
    const lineHeight = 18;

    doc.setTextColor(0, 0, 0);

    // Load logo once
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

    // Get PDF info based on filter
    const pdfInfo = getPDFInfo();

    // Helper function to draw letterhead (kop surat) for a unit
    const drawLetterhead = (unitName: string): number => {
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
      doc.text('DAFTAR AKUN PENGGUNA SISTEM ABSENSI', pageWidth / 2, currentY, { align: 'center' });
      currentY += 16;
      
      // Category/Filter title
      doc.setFontSize(13);
      doc.text(pdfInfo.title, pageWidth / 2, currentY, { align: 'center' });
      currentY += 20;

      // Unit name
      doc.setFontSize(12);
      doc.text(unitName.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
      currentY += 25;

      // Tips / Information Box
      doc.setFont('times', 'normal');
      doc.setFontSize(9);
      doc.setFillColor(245, 245, 245);
      const tipsBoxHeight = 85;
      doc.roundedRect(marginX, currentY, pageWidth - marginX * 2, tipsBoxHeight, 5, 5, 'F');
      
      doc.setFont('times', 'bold');
      doc.setFontSize(10);
      doc.text('INFORMASI PENTING:', marginX + 10, currentY + 15);
      
      doc.setFont('times', 'normal');
      doc.setFontSize(9);
      const tips = [
        '1. Dimohon untuk membagikan akun ini kepada nama yang tercantum di atas untuk ikut uji coba',
        '   pada aplikasi absensi Universitas Ekasakti di kehadiran.irfanananda28.com',
        '2. Seluruh pengguna WAJIB segera mengganti password setelah akun didapatkan.',
        '3. Selama masa uji coba, absensi di pos satpam masih berlaku.'
      ];

      const ujiCobaText = '4. Masa uji coba absensi online hingga 31 Desember 2025.';
      const ujiCobaEndsAtWib = new Date('2025-12-31T23:59:59+07:00');
      if (now.getTime() <= ujiCobaEndsAtWib.getTime()) {
        tips.push(ujiCobaText);
      }
      
      let tipY = currentY + 30;
      tips.forEach(tip => {
        doc.text(tip, marginX + 10, tipY);
        tipY += 12;
      });

      currentY += tipsBoxHeight + 15;

      return currentY;
    };

    // Use filtered users based on active filter
    const filteredUsers = getFilteredUsersForPDF();
    const groupedData = getGroupedUsers(filteredUsers);

    // Generate timestamp for footer
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

    // Track if this is the first unit (don't add page before first unit)
    let isFirstUnit = true;

    // Generate pages for each unit
    groupedData.forEach((group) => {
      const unitUsers = group.users;
      
      // Add new page for each unit (except the first one)
      if (!isFirstUnit) {
        doc.addPage();
      }
      isFirstUnit = false;

      // Draw letterhead for this unit
      const tableStartY = drawLetterhead(group.unitKerja);

      // Prepare table body for this unit with local numbering (starts from 1 for each unit)
      const tableBody = unitUsers.map((user, index) => {
        return [
          index + 1,
          user.full_name,
          user.unit_kerja || '-', // Original unit_kerja for 'Jabatan' column
          user.username,
          distributionPassword
        ];
      });

      // Generate table for this unit
      autoTable(doc, {
        head: [['No', 'Nama', 'Jabatan / Keterangan', 'Username', 'Password']],
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
          2: { cellWidth: 150, halign: 'left' },    // Jabatan
          3: { cellWidth: 90, halign: 'center' },   // Username
          4: { cellWidth: 80, halign: 'center' },   // Password
        },
        didDrawPage: (data) => {
          // Footer with app name and timestamp (italic)
          const str = `Dicetak dari Sistem Absensi UNES pada ${timestamp}`;
          doc.setFontSize(8);
          doc.setFont('times', 'italic');
          doc.text(str, pageWidth / 2, pageHeight - 25, { align: 'center' });
          
          // Page number - starts from 1 for each unit (using data.pageNumber which is per-table)
          const pageStr = "Halaman " + data.pageNumber;
          doc.text(pageStr, pageWidth - marginX, pageHeight - 25, { align: 'right' });

          // Unit identifier on continuation pages (when table spans multiple pages)
          // Only show on pages after the first page of this unit
          if (data.pageNumber > 1) {
            doc.setFont('times', 'bold');
            doc.setFontSize(10);
            doc.text(`${group.unitKerja.toUpperCase()} (lanjutan)`, marginX, 30);
            doc.setLineWidth(0.5);
            doc.line(marginX, 35, pageWidth - marginX, 35);
          }
        }
      });

    });

    // Save PDF with dynamic filename
    doc.save(`Daftar_Akun_${pdfInfo.filename}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard 
          icon={<Users className="w-5 h-5" />}
          label="Total Pengguna"
          value={stats.totalUsers}
          color="text-blue-600"
          bgColor="bg-blue-50"
          onClick={() => setFilterCategory('all')}
          isActive={filterCategory === 'all'}
        />
        <StatCard 
          icon={<Shield className="w-5 h-5" />}
          label="Admin"
          value={stats.totalAdmin}
          color="text-indigo-600"
          bgColor="bg-indigo-50"
          onClick={() => setFilterCategory('admin')}
          isActive={filterCategory === 'admin'}
        />
        <StatCard 
          icon={<UserCheck className="w-5 h-5" />}
          label="Dosen"
          value={stats.totalDosen}
          color="text-emerald-600"
          bgColor="bg-emerald-50"
          onClick={() => setFilterCategory('dosen')}
          isActive={filterCategory === 'dosen'}
        />
        <StatCard 
          icon={<Award className="w-5 h-5" />}
          label="Struktural"
          value={stats.totalStruktural}
          color="text-amber-600"
          bgColor="bg-amber-50"
          onClick={() => setFilterCategory('struktural')}
          isActive={filterCategory === 'struktural'}
        />
        <StatCard 
          icon={<Building2 className="w-5 h-5" />}
          label="Tenaga Kependidikan"
          value={stats.totalTenagaKependidikan}
          color="text-cyan-600"
          bgColor="bg-cyan-50"
          onClick={() => setFilterCategory('tenaga_kependidikan')}
          isActive={filterCategory === 'tenaga_kependidikan'}
        />
      </div>

      {/* Search and Actions Bar */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          
          {/* Search Input */}
          <div className="relative w-full md:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out shadow-sm"
              placeholder="Cari nama, username, atau unit kerja..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Action Buttons Group */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
             <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
              {/* Download Struktural PDF Button */}
              <button
                onClick={() => { void generateStrukturalPDF(); }}
                className="inline-flex items-center px-3 py-2 border border-gray-200 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors whitespace-nowrap"
                title="Unduh Daftar Akun Struktural"
              >
                <Download className="h-4 w-4 mr-2 text-purple-600" />
                <span>Struktural</span>
              </button>

              {/* Download Filtered Users PDF Button */}
              <button
                onClick={() => { void generateUserListPDF(); }}
                className="inline-flex items-center px-3 py-2 border border-gray-200 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors whitespace-nowrap"
                title={`Unduh Daftar Akun ${getPDFInfo().title}`}
              >
                <Download className="h-4 w-4 mr-2 text-emerald-600" />
                <span className="hidden sm:inline">{getPDFInfo().buttonLabel.replace('Unduh ', '')}</span>
                <span className="sm:hidden">Unduh</span>
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {getFilteredUsersForPDF().length}
                </span>
              </button>
            </div>
            
            {/* Add Button - Primary Action */}
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors whitespace-nowrap ml-auto md:ml-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah
            </button>
          </div>
        </div>

        {/* Active Filter & Results Count */}
        <div className="flex items-center justify-between text-sm">
           <div className="flex items-center gap-2">
            {filterCategory !== 'all' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Filter: {
                  filterCategory === 'admin' ? 'Admin' :
                  filterCategory === 'dosen' ? 'Dosen' :
                  filterCategory === 'struktural' ? 'Struktural' :
                  'Tenaga Kependidikan'
                }
                <button
                  type="button"
                  onClick={() => setFilterCategory('all')}
                  className="flex-shrink-0 ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-blue-600 hover:bg-blue-200 hover:text-blue-500 focus:outline-none focus:bg-blue-500 focus:text-white"
                >
                  <span className="sr-only">Hapus filter</span>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
           </div>
           <div className="text-gray-500">
             Total: <span className="font-medium text-gray-900">{groupedUsers.reduce((acc, g) => acc + g.users.length, 0)}</span> pengguna
           </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-5 py-4 rounded-r-xl flex items-start gap-3">
          <X className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Terjadi Kesalahan</p>
            <p className="text-sm mt-1">{error}</p>
            <button onClick={loadUsers} className="mt-2 text-sm font-medium underline hover:no-underline">
              Coba Muat Ulang
            </button>
          </div>
        </div>
      )}

      {/* User Groups */}
      <div className="space-y-6">
        {loading ? (
          <div className="bg-white rounded-2xl shadow-lg p-16 text-center">
            <div className="w-16 h-16 mx-auto bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
            <p className="text-gray-600 font-medium">Memuat data pengguna...</p>
            <p className="text-gray-400 text-sm mt-1">Mohon tunggu sebentar</p>
          </div>
        ) : groupedUsers.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-16 text-center">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">
              {searchQuery ? "Tidak ada hasil ditemukan" : "Tidak ada data pengguna"}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {searchQuery ? "Coba kata kunci yang berbeda" : "Tambahkan pengguna baru untuk memulai"}
            </p>
          </div>
        ) : (
          groupedUsers.map((group, groupIndex) => {
            const startNumber = groupedUsers
              .slice(0, groupIndex)
              .reduce((acc, g) => acc + g.users.length, 0) + 1;
            
            return (
              <UnitKerjaGroup
                key={group.unitKerja}
                unitKerja={group.unitKerja}
                users={group.users}
                onEdit={handleOpenEdit}
                onDelete={(id) => setDeleteConfirmId(id)}
                isSaving={isSaving}
                startNumber={startNumber}
                colorIndex={groupIndex}
                userLocationsMap={userLocationsMap}
                canDelete={isSuperAdmin()}
              />
            );
          })
        )}
      </div>

      {/* Form Modal */}
      {isFormOpen && (
          <UserForm
            initialData={editingUser}
            onSave={handleSave}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingUser(undefined);
            }}
            isSaving={isSaving}
            saveError={saveError}
            existingUnits={Array.from(new Set(users.map(u => u.unit_kerja).filter(Boolean) as string[])).sort()}
            userLocations={editingUser ? userLocationsMap.get(editingUser.id) ?? [] : []}
          />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-red-500 to-rose-500 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Hapus Pengguna</h3>
                  <p className="text-red-100 text-sm">Tindakan ini tidak dapat dibatalkan</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="bg-red-50 rounded-xl p-4 mb-4">
                <p className="text-gray-700">
                  Anda yakin ingin menghapus pengguna <strong>{userToDelete?.full_name}</strong>?
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Semua data absensi terkait juga akan terhapus secara permanen.
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  disabled={isSaving}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirmId)}
                  disabled={isSaving}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Menghapus...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Ya, Hapus
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {modal?.isOpen && (
        <NotificationModal
          isOpen={modal.isOpen}
          onClose={() => setModal(null)}
          type={modal.type}
          title={modal.title}
          message={modal.message}
        />
      )}
    </div>
  );
}
