import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Filter, LogOut, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { getCurrentUser, isSuperAdmin, logout } from "@/lib/auth";
import { resolveBuildingIdFromLocationName } from "@/lib/buildings";

type FilterMode = "all" | "struktural" | "tendik";

interface UserData {
  id: string;
  username: string;
  full_name: string;
  unit_kerja: string | null;
  role: string | null;
  is_struktural: boolean | null;
}

interface AttendanceLocation {
  id: string;
  user_id: string | null;
  building_id: string | null;
  location_name: string | null;
  is_active: boolean;
  is_primary: boolean | null;
  priority: number | null;
  created_at: string;
}

interface Building {
  id: string;
  name: string;
  short_name: string | null;
}

const MAX_SLOTS = 6;

const buildEmptySlots = () => Array.from({ length: MAX_SLOTS }, () => "");

const isDosenStruktural = (user: UserData) => user.role === "dosen" && user.is_struktural === true;

const isTenagaKependidikan = (user: UserData): boolean => {
  if (user.username === "tesx" || user.username === "andi.syahrum.makkurade") return false;

  if (user.username === "irfan.ananda.ismail" || user.username === "asmara.indah") {
    return true;
  }

  if (user.role !== "pegawai") return false;

  const unitKerja = (user.unit_kerja || "").toLowerCase();
  const excludedKeywords = [
    "satpam",
    "guru",
    "driver",
    "garin",
    "tk ekasakti",
    "sma ekasakti",
    "ka. kebersihan",
    "komandan satpam",
    "wakil komandan satpam",
    "cleaning service",
    "kebersihan",
  ];

  if (excludedKeywords.some((keyword) => unitKerja.includes(keyword))) {
    return false;
  }

  const includedKeywords = [
    "staf",
    "ka.",
    "kepala",
    "koordinator",
    "bendahara",
    "sekretaris",
    "operator",
    "koor.",
    "komandan",
    "kepsek",
    "waka",
    "pengelola",
  ];

  return includedKeywords.some((keyword) => unitKerja.includes(keyword));
};

const resolveLocationBuildingId = (location: AttendanceLocation, buildings: Building[]) => {
  if (location.building_id) return location.building_id;
  const fallback = resolveBuildingIdFromLocationName(location.location_name);
  if (fallback) return fallback;
  const match = buildings.find((building) => building.name === location.location_name);
  return match?.id ?? null;
};

export default function TitikAbsenV2() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const canSeeBebas = isSuperAdmin();

  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [users, setUsers] = useState<UserData[]>([]);
  const [locations, setLocations] = useState<AttendanceLocation[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [userSlots, setUserSlots] = useState<Record<string, string[]>>({});
  const [initialSlots, setInitialSlots] = useState<Record<string, string[]>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [userRes, locationRes, buildingRes] = await Promise.all([
        supabase
          .from("users")
          .select("id,username,full_name,unit_kerja,role,is_struktural")
          .order("full_name"),
        supabase
          .from("attendance_locations")
          .select("id,user_id,building_id,location_name,is_active,is_primary,priority,created_at")
          .eq("is_active", true),
        supabase
          .from("campus_buildings")
          .select("id,name,short_name")
          .order("name"),
      ]);

      if (userRes.error) throw userRes.error;
      if (locationRes.error) throw locationRes.error;
      if (buildingRes.error) throw buildingRes.error;

      const userList = (userRes.data || []) as UserData[];
      const locationList = (locationRes.data || []) as AttendanceLocation[];
      const buildingList = (buildingRes.data || []) as Building[];

      setUsers(userList);
      setLocations(locationList);
      setBuildings(buildingList);

      const locationMap = new Map<string, AttendanceLocation[]>();
      locationList.forEach((location) => {
        if (!location.user_id) return;
        const bucket = locationMap.get(location.user_id) || [];
        bucket.push(location);
        locationMap.set(location.user_id, bucket);
      });

      const nextSlots: Record<string, string[]> = {};

      userList.forEach((user) => {
        const slots = buildEmptySlots();
        const userLocations = locationMap.get(user.id) || [];
        const sorted = [...userLocations].sort((a, b) => {
          const priorityA = a.priority ?? Number.MAX_SAFE_INTEGER;
          const priorityB = b.priority ?? Number.MAX_SAFE_INTEGER;
          if (priorityA !== priorityB) return priorityA - priorityB;
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });

        sorted.forEach((location) => {
          const resolvedBuildingId = resolveLocationBuildingId(location, buildingList);
          if (!resolvedBuildingId) return;

          let index = location.priority ? location.priority - 1 : -1;
          if (index < 0 || index >= MAX_SLOTS || slots[index]) {
            index = slots.findIndex((value) => value === "");
          }
          if (index < 0 || index >= MAX_SLOTS) return;
          slots[index] = resolvedBuildingId;
        });

        nextSlots[user.id] = slots;
      });

      setUserSlots(nextSlots);
      setInitialSlots(nextSlots);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Gagal memuat data titik absensi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const buildingOptions = useMemo(() => {
    const base = buildings.filter((building) => building.id !== "bebas");
    const bebas = buildings.find((building) => building.id === "bebas");
    return { base, bebas };
  }, [buildings]);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return users.filter((user) => {
      if (filterMode === "struktural" && !isDosenStruktural(user)) return false;
      if (filterMode === "tendik" && !isTenagaKependidikan(user)) return false;

      if (!query) return true;
      return (
        user.full_name.toLowerCase().includes(query) ||
        user.username.toLowerCase().includes(query) ||
        (user.unit_kerja || "").toLowerCase().includes(query)
      );
    });
  }, [filterMode, searchQuery, users]);

  const isSlotChanged = (userId: string) => {
    const current = userSlots[userId] || buildEmptySlots();
    const initial = initialSlots[userId] || buildEmptySlots();
    if (current.length !== initial.length) return true;
    return current.some((value, index) => value !== initial[index]);
  };

  const handleSlotChange = (userId: string, index: number, value: string) => {
    setUserSlots((prev) => {
      const next = { ...prev };
      const slots = [...(next[userId] || buildEmptySlots())];
      slots[index] = value;
      next[userId] = slots;
      return next;
    });
  };

  const handleSave = async (user: UserData) => {
    const slots = userSlots[user.id] || buildEmptySlots();
    const slot1 = slots[0];
    const otherSlotsFilled = slots.slice(1).some((value) => value);
    if (!slot1 && otherSlotsFilled) {
      toast.error("Lokasi 1 harus diisi sebelum lokasi lainnya");
      return;
    }

    const normalizedValues = slots.filter((value) => value);
    const uniqueValues = new Set(normalizedValues);
    if (normalizedValues.length !== uniqueValues.size) {
      toast.error("Lokasi tidak boleh duplikat");
      return;
    }

    setSavingUserId(user.id);
    try {
      const payload = slots.map((value) => (value ? value : null));
      const { error } = await supabase.rpc("set_user_attendance_locations_v2", {
        user_id_input: user.id,
        building_ids: payload,
      });

      if (error) throw error;

      toast.success(`Lokasi absensi "${user.full_name}" berhasil disimpan`);
      await fetchData();
    } catch (error) {
      console.error("Error saving locations:", error);
      const message = error instanceof Error ? error.message : "Gagal menyimpan lokasi";
      toast.error(message);
    } finally {
      setSavingUserId(null);
    }
  };

  const renderBuildingOptions = (slots: string[]) => {
    const options = [...buildingOptions.base];
    const bebasSlot = buildingOptions.bebas;
    const hasBebas = slots.includes("bebas");
    if (bebasSlot && (canSeeBebas || hasBebas)) {
      options.push(bebasSlot);
    }
    return options;
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 w-full overflow-x-hidden">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 w-full">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 w-full">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin")}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <img src="/unes.png" alt="UNES Logo" className="h-8 w-8" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">Titik Absen V2</h1>
              <p className="text-xs text-gray-500">Panel Administrator</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleLogout} className="p-2 hover:bg-gray-100 rounded-lg">
              <LogOut className="w-5 h-5 text-gray-600" />
            </button>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {currentUser?.full_name?.charAt(0) || "A"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 w-full">
        <div className="space-y-4 sm:space-y-6 animate-fade-in">
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Pengaturan Lokasi per User</h2>
                <p className="text-sm text-gray-600">Atur hingga 6 lokasi absensi untuk setiap user.</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Filter className="w-4 h-4" />
                {filteredUsers.length} pengguna tampil
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari nama, username, atau unit kerja..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "all", label: "Semua" },
                  { id: "struktural", label: "Dosen Struktural" },
                  { id: "tendik", label: "Tenaga Kependidikan" },
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setFilterMode(option.id as FilterMode)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                      filterMode === option.id
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="p-8 flex items-center justify-center text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Memuat data...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[1400px] w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="px-4 py-3 text-left">No</th>
                      <th className="px-4 py-3 text-left">Nama User</th>
                      <th className="px-4 py-3 text-left">Unit Kerja</th>
                      <th className="px-4 py-3 text-left">Kategori</th>
                      {Array.from({ length: MAX_SLOTS }).map((_, index) => (
                        <th key={index} className="px-4 py-3 text-left">
                          Lokasi {index + 1}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-left">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                          Tidak ada data yang cocok.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user, index) => {
                        const slots = userSlots[user.id] || buildEmptySlots();
                        const options = renderBuildingOptions(slots);
                        const isSaving = savingUserId === user.id;
                        const isDirty = isSlotChanged(user.id);

                        return (
                          <tr key={user.id} className="border-t border-gray-100">
                            <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                            <td className="px-4 py-3">
                              <div className="font-semibold text-gray-900">{user.full_name}</div>
                              <div className="text-xs text-gray-500">{user.username}</div>
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {user.unit_kerja || "-"}
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                                {isDosenStruktural(user)
                                  ? "Struktural"
                                  : isTenagaKependidikan(user)
                                    ? "Tendik"
                                    : "Lainnya"}
                              </span>
                            </td>
                            {slots.map((value, slotIndex) => (
                              <td key={slotIndex} className="px-4 py-3">
                                <select
                                  value={value}
                                  onChange={(event) =>
                                    handleSlotChange(user.id, slotIndex, event.target.value)
                                  }
                                  className="w-44 rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                >
                                  <option value="">Belum diset</option>
                                  {options.map((building) => {
                                    const isBebas = building.id === "bebas";
                                    const isDisabled = isBebas && !canSeeBebas;
                                    const label = building.short_name || building.name;
                                    return (
                                      <option key={building.id} value={building.id} disabled={isDisabled}>
                                        {isDisabled ? `${label} (Terkunci)` : label}
                                      </option>
                                    );
                                  })}
                                </select>
                              </td>
                            ))}
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleSave(user)}
                                disabled={isSaving || !isDirty}
                                className={`inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                                  isSaving
                                    ? "bg-gray-200 text-gray-500"
                                    : !isDirty
                                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                      : "bg-blue-600 text-white hover:bg-blue-700"
                                }`}
                              >
                                {isSaving ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    Menyimpan
                                  </>
                                ) : (
                                  "Simpan"
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
