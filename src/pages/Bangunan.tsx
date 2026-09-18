import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, LogOut, RefreshCw, Save } from "lucide-react";
import { toast } from "sonner";
import { getCurrentUser, logout } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import {
  BUILDINGS,
  type Building,
  type BuildingId,
  resolveBuildingIdFromLocationName
} from "@/lib/buildings";

interface AttendanceLocation {
  id: string;
  user_id: string | null;
  building_id: string | null;
  location_name: string | null;
  radius_meters: number | null;
  is_active: boolean;
}

const DEFAULT_RADIUS_METERS = 75;

function normalizeLocationName(value: string | null) {
  return (value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

function formatNumber(value: number) {
  return Number.isFinite(value) ? value.toFixed(6).replace(/0+$/, "").replace(/\.$/, "") : "";
}

function resolveLocationBuildingId(
  location: AttendanceLocation,
  buildings: Building[]
): BuildingId | null {
  if (location.building_id) return location.building_id as BuildingId;

  const fallback = resolveBuildingIdFromLocationName(location.location_name);
  if (fallback) return fallback;

  const normalized = normalizeLocationName(location.location_name);
  const exact = buildings.find((building) => {
    const normalizedName = normalizeLocationName(building.name);
    const normalizedShort = normalizeLocationName(building.shortName);
    return normalized === normalizedName || normalized === normalizedShort;
  });

  return exact?.id ?? null;
}

export default function Bangunan() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [buildings, setBuildings] = useState<Building[]>([...BUILDINGS]);
  const [buildingsSource, setBuildingsSource] = useState<"supabase" | "fallback">("fallback");
  const [locations, setLocations] = useState<AttendanceLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingBuilding, setSavingBuilding] = useState<BuildingId | null>(null);
  const [draftRadius, setDraftRadius] = useState<Record<string, string>>({});

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [buildingRes, locationRes] = await Promise.all([
        supabase
          .from("campus_buildings")
          .select("id,name,short_name,latitude,longitude")
          .order("name"),
        supabase
          .from("attendance_locations")
          .select("id,user_id,building_id,location_name,radius_meters,is_active")
          .eq("is_active", true)
      ]);

      if (locationRes.error) throw locationRes.error;

      if (buildingRes.error) {
        console.warn("Gagal memuat master gedung dari Supabase:", buildingRes.error);
        setBuildings([...BUILDINGS]);
        setBuildingsSource("fallback");
      } else {
        const mapped = (buildingRes.data ?? [])
          .map((row) => ({
            id: row.id as BuildingId,
            name: row.name,
            shortName: row.short_name || row.name,
            lat: Number(row.latitude),
            lng: Number(row.longitude)
          }))
          .filter((b) => b.id && Number.isFinite(b.lat) && Number.isFinite(b.lng));

        if (mapped.length === 0) {
          setBuildings([...BUILDINGS]);
          setBuildingsSource("fallback");
        } else {
          setBuildings(mapped);
          setBuildingsSource("supabase");
        }
      }

      setLocations((locationRes.data as AttendanceLocation[]) || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Gagal memuat data bangunan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const visibleBuildings = useMemo(
    () => buildings.filter((building) => building.id !== "bebas"),
    [buildings]
  );

  const buildingLocations = useMemo(() => {
    const map = new Map<BuildingId, AttendanceLocation[]>();
    buildings.forEach((building) => {
      map.set(building.id, []);
    });

    locations.forEach((location) => {
      const buildingId = resolveLocationBuildingId(location, buildings);
      if (!buildingId) return;
      const bucket = map.get(buildingId);
      if (!bucket) return;
      if (location.is_active) {
        bucket.push(location);
      }
    });

    return map;
  }, [buildings, locations]);

  useEffect(() => {
    if (loading) return;
    const nextDraft: Record<string, string> = {};

    visibleBuildings.forEach((building) => {
      const activeLocations = buildingLocations.get(building.id) ?? [];
      const radii = activeLocations
        .map((loc) => Number(loc.radius_meters))
        .filter((value) => Number.isFinite(value));
      const uniqueRadii = new Set(radii.map((value) => Math.round(value)));

      if (uniqueRadii.size === 1) {
        nextDraft[building.id] = String([...uniqueRadii][0]);
      } else if (uniqueRadii.size > 1) {
        nextDraft[building.id] = "";
      } else {
        nextDraft[building.id] = String(DEFAULT_RADIUS_METERS);
      }
    });

    setDraftRadius(nextDraft);
  }, [loading, visibleBuildings, buildingLocations]);

  const totalActiveUsers = useMemo(() => {
    const unique = new Set<string>();
    locations
      .filter((loc) => loc.is_active)
      .forEach((loc) => {
        unique.add(loc.user_id ?? `legacy:${loc.id}`);
      });
    return unique.size;
  }, [locations]);

  const handleSaveRadius = async (building: Building) => {
    const draftValue = draftRadius[building.id];
    const newRadius = Number.parseInt(draftValue ?? "", 10);

    if (!Number.isFinite(newRadius) || newRadius <= 0) {
      toast.error("Radius tidak valid");
      return;
    }

    const activeLocations = buildingLocations.get(building.id) ?? [];
    if (activeLocations.length === 0) {
      toast.error(`Belum ada user aktif di ${building.shortName}`);
      return;
    }

    setSavingBuilding(building.id);
    try {
      const locationIds = activeLocations.map((loc) => loc.id);
      const { error } = await supabase
        .from("attendance_locations")
        .update({ radius_meters: newRadius })
        .in("id", locationIds);

      if (error) throw error;

      toast.success(
        `Radius ${building.shortName} disimpan untuk ${activeLocations.length} user aktif`
      );
      await fetchData();
    } catch (error) {
      console.error("Error saving radius:", error);
      toast.error("Gagal menyimpan radius");
    } finally {
      setSavingBuilding(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <div className="bg-white border-b border-gray-200 w-full">
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
              <h1 className="text-lg font-bold text-gray-900">Bangunan</h1>
              <p className="text-xs text-gray-500">Panel Administrator</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? "animate-spin" : ""}`} />
            </button>
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

      <div className="w-full">
        <div className="p-4 sm:p-6 lg:p-8 w-full">
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold leading-tight text-gray-900">
                    Radius Absensi per Bangunan
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600">
                    Atur radius untuk semua user yang ditetapkan ke bangunan terkait.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Master gedung: {buildingsSource === "supabase" ? "Supabase" : "fallback (cek tabel campus_buildings)"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-gray-900">{visibleBuildings.length}</p>
                  <p className="text-xs text-gray-600">Total Bangunan</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">{totalActiveUsers}</p>
                  <p className="text-xs text-gray-600">User Aktif</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-600">{DEFAULT_RADIUS_METERS}m</p>
                  <p className="text-xs text-gray-600">Default Radius</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="bg-white rounded-xl p-8 text-center">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                  <p className="mt-2 text-gray-600">Memuat data...</p>
                </div>
              ) : (
                visibleBuildings.map((building) => {
                  const activeLocations = buildingLocations.get(building.id) ?? [];
                  const uniqueUsers = new Set(
                    activeLocations.map((loc) => loc.user_id ?? `legacy:${loc.id}`)
                  );
                  const radii = activeLocations
                    .map((loc) => Number(loc.radius_meters))
                    .filter((value) => Number.isFinite(value))
                    .map((value) => Math.round(value));
                  const uniqueRadii = new Set(radii);
                  const currentRadiusLabel =
                    uniqueRadii.size === 0
                      ? "Belum diatur"
                      : uniqueRadii.size === 1
                        ? `${[...uniqueRadii][0]} m`
                        : "Bervariasi";
                  const isMixedRadius = uniqueRadii.size > 1;
                  const inputValue = draftRadius[building.id] ?? "";
                  const isSaving = savingBuilding === building.id;
                  const isDisabled = activeLocations.length === 0 || isSaving;

                  return (
                    <div
                      key={building.id}
                      className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-200"
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="w-11 h-11 rounded-lg flex items-center justify-center bg-blue-100">
                              <Building2 className="w-5 h-5 text-blue-700" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{building.shortName}</h3>
                              <p className="text-xs text-gray-500">{building.name}</p>
                              <div className="mt-1 text-xs text-gray-600 font-mono">
                                {formatNumber(building.lat)}, {formatNumber(building.lng)}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                              {uniqueUsers.size} user aktif
                            </span>
                            <span
                              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                                isMixedRadius
                                  ? "bg-orange-50 text-orange-700"
                                  : "bg-emerald-50 text-emerald-700"
                              }`}
                            >
                              Radius: {currentRadiusLabel}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                          <div className="flex-1">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Radius baru (meter)
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={inputValue}
                              onChange={(e) =>
                                setDraftRadius((prev) => ({
                                  ...prev,
                                  [building.id]: e.target.value
                                }))
                              }
                              placeholder={isMixedRadius ? "Masukkan radius baru" : ""}
                              disabled={isDisabled}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                            />
                            <p className="text-[11px] text-gray-500 mt-1">
                              Berlaku untuk user aktif di bangunan ini.
                            </p>
                          </div>
                          <button
                            onClick={() => handleSaveRadius(building)}
                            disabled={isDisabled}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {isSaving ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                            Simpan
                          </button>
                        </div>

                        {activeLocations.length === 0 && (
                          <p className="text-xs text-gray-500">
                            Belum ada user aktif yang ditetapkan ke bangunan ini.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
