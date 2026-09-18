import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, LogOut, Save, MapPin, Loader2 } from "lucide-react";
import { getCurrentUser, logout } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface CampusBuilding {
  id: string;
  name: string;
  short_name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
}

export default function TitikAbsensi() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [buildings, setBuildings] = useState<CampusBuilding[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [radiusValues, setRadiusValues] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch buildings on component mount
  useEffect(() => {
    fetchBuildings();
  }, []);

  const fetchBuildings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("campus_buildings")
        .select("id, name, short_name, latitude, longitude, radius_meters")
        .order("name", { ascending: true });

      if (error) throw error;

      setBuildings(data || []);
      
      // Initialize radius values for each building
      const initialRadiusValues: Record<string, string> = {};
      data?.forEach((building) => {
        initialRadiusValues[building.id] = String(building.radius_meters || 75);
      });
      setRadiusValues(initialRadiusValues);
    } catch (err) {
      console.error("Error fetching buildings:", err);
      toast.error("Gagal memuat data gedung");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleRadiusChange = (buildingId: string, value: string) => {
    setRadiusValues((prev) => ({
      ...prev,
      [buildingId]: value,
    }));
  };

  const handleSaveRadius = async (building: CampusBuilding) => {
    const radiusValue = parseInt(radiusValues[building.id], 10);

    if (!radiusValue || radiusValue <= 0) {
      toast.error("Radius harus berupa angka positif");
      return;
    }

    setSavingId(building.id);
    try {
      const { data, error } = await supabase.rpc("update_building_radius_and_sync_locations", {
        building_id_input: building.id,
        radius_meters_input: radiusValue,
      });

      if (error) throw error;

      const updatedLocations =
        data && typeof data === "object" && "updated_locations" in data
          ? Number((data as { updated_locations?: number }).updated_locations || 0)
          : 0;

      // Update local state
      setBuildings((prev) =>
        prev.map((b) =>
          b.id === building.id ? { ...b, radius_meters: radiusValue } : b
        )
      );

      setSuccessMessage(
        `Radius untuk "${building.name}" berhasil diperbarui menjadi ${radiusValue}m (${updatedLocations} lokasi user tersinkron).`
      );
    } catch (err) {
      console.error("Error updating radius:", err);
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("401") || message.toLowerCase().includes("unauthorized")) {
        toast.error("Tidak punya izin mengubah radius. Silakan login ulang sebagai super administrator.");
      } else {
        toast.error(`Gagal memperbarui radius: ${message}`);
      }
    } finally {
      setSavingId(null);
    }
  };

  return (
    <>
      {successMessage && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-200 p-6 text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Berhasil</h3>
            <p className="text-sm text-gray-600 mb-5">{successMessage}</p>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              className="inline-flex items-center justify-center rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-700"
            >
              Oke
            </button>
          </div>
        </div>
      )}

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
              <h1 className="text-lg font-bold text-gray-900">Titik Absensi</h1>
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

      {/* Main Content */}
      <div className="w-full">
        <div className="p-4 sm:p-6 lg:p-8 w-full">
          <div className="max-w-2xl mx-auto">
            {/* Header Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Daftar Titik Absensi</h2>
                  <p className="text-sm text-gray-600">Kelola radius untuk setiap lokasi gedung</p>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                <span className="ml-3 text-gray-600">Memuat data gedung...</span>
              </div>
            )}

            {/* Buildings List */}
            {!loading && buildings.length === 0 && (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 text-center">
                <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Tidak ada data gedung</p>
              </div>
            )}

            {!loading && buildings.length > 0 && (
              <div className="space-y-4">
                {buildings.map((building) => (
                  <div
                    key={building.id}
                    className="bg-white rounded-xl p-5 shadow-sm border border-gray-200"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      {/* Building Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="w-4 h-4 text-purple-500" />
                          <span className="text-xs text-gray-500 uppercase tracking-wide">
                            {building.short_name}
                          </span>
                        </div>
                        <h3 className="text-base font-semibold text-gray-900">
                          {building.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Koordinat: {Number(building.latitude).toFixed(6)}, {Number(building.longitude).toFixed(6)}
                        </p>
                      </div>

                      {/* Radius Input and Save Button */}
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <label
                            htmlFor={`radius-${building.id}`}
                            className="text-xs text-gray-500 mb-1"
                          >
                            Radius (meter)
                          </label>
                          <input
                            id={`radius-${building.id}`}
                            type="number"
                            value={radiusValues[building.id] || "75"}
                            onChange={(e) => handleRadiusChange(building.id, e.target.value)}
                            min="1"
                            className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center"
                          />
                        </div>
                        <button
                          onClick={() => handleSaveRadius(building)}
                          disabled={savingId === building.id}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4 sm:mt-0"
                        >
                          {savingId === building.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Menyimpan...</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              <span>Simpan</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Info Card */}
            {!loading && buildings.length > 0 && (
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-700">
                  <strong>Catatan:</strong> Radius menentukan area absensi dalam meter dari titik koordinat gedung. 
                  Pegawai hanya dapat absen jika berada dalam radius yang ditentukan.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
