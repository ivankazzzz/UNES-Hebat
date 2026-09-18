import { useState, useEffect, useMemo } from "react";
import { BUILDINGS } from "@/lib/buildings";
import { supabase } from "@/lib/supabase";
import { Map as MapIcon, Loader2, Info, Users } from "lucide-react";

interface AttendanceLocation {
  location_name: string;
  latitude: number;
  longitude: number;
}

interface AttendanceData {
  id: string;
  latitude: number;
  longitude: number;
  created_at: string;
  user: {
    id: string;
    full_name: string;
    unit_kerja: string;
  }[] | null;
}

interface BuildingStats {
  name: string;
  count: number;
  users: string[];
}

interface AttendanceMappingProps {
  selectedDate: string;
}

const BUILDING_STYLE_BY_ID = {
  "rektorat": {
    color: "bg-blue-600",
    hoverColor: "hover:bg-blue-700",
  },
  "gedung-e": {
    color: "bg-indigo-600",
    hoverColor: "hover:bg-indigo-700",
  },
  "gedung-a": {
    color: "bg-purple-600",
    hoverColor: "hover:bg-purple-700",
  },
  "fkip": {
    color: "bg-emerald-600",
    hoverColor: "hover:bg-emerald-700",
  },
  "hukum": {
    color: "bg-orange-600",
    hoverColor: "hover:bg-orange-700",
  },
  "pascasarjana": {
    color: "bg-slate-600",
    hoverColor: "hover:bg-slate-700",
  },
} as const;

// Calculate position on canvas based on lat/lng bounds
// Main campus bounds (excluding Pascasarjana for better view)
const CAMPUS_BOUNDS = {
  minLat: -0.9392,  // South (below Gedung A)
  maxLat: -0.9368,  // North (above Fak. Hukum)
  minLng: 100.3554, // West
  maxLng: 100.3567, // East
};

function latLngToXY(lat: number, lng: number): { x: number; y: number } {
  // Normalize to 0-100 range
  const x = ((lng - CAMPUS_BOUNDS.minLng) / (CAMPUS_BOUNDS.maxLng - CAMPUS_BOUNDS.minLng)) * 100;
  // Invert Y because CSS Y goes down but lat goes up
  const y = ((CAMPUS_BOUNDS.maxLat - lat) / (CAMPUS_BOUNDS.maxLat - CAMPUS_BOUNDS.minLat)) * 100;
  
  return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
}

export default function AttendanceMapping({ selectedDate }: AttendanceMappingProps) {
  const [attendances, setAttendances] = useState<AttendanceData[]>([]);
  const [locations, setLocations] = useState<AttendanceLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredBuilding, setHoveredBuilding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch attendance locations for reference
      const { data: locData, error: locError } = await supabase
        .from('attendance_locations')
        .select('location_name, latitude, longitude')
        .eq('is_active', true);

      if (locError) throw locError;
      
      // Get unique locations
      const uniqueLocations = new Map<string, AttendanceLocation>();
      locData?.forEach((loc: any) => {
        if (!uniqueLocations.has(loc.location_name)) {
          uniqueLocations.set(loc.location_name, {
            location_name: loc.location_name,
            latitude: parseFloat(loc.latitude),
            longitude: parseFloat(loc.longitude)
          });
        }
      });
      setLocations(Array.from(uniqueLocations.values()));

      // Fetch attendances for the selected date with user info
      // Use local date range (the date picker returns local date in YYYY-MM-DD format)
      // We need to query from start of day to end of day in local timezone
      const startOfDay = `${selectedDate}T00:00:00`;
      const endOfDay = `${selectedDate}T23:59:59`;

      const { data: attData, error: attError } = await supabase
        .from('attendances')
        .select(`
          id,
          latitude,
          longitude,
          created_at,
          user:users(id, full_name, unit_kerja)
        `)
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay)
        .eq('attendance_type', 'masuk');

      if (attError) throw attError;
      setAttendances(attData || []);
      
    } catch (err: any) {
      console.error("Error fetching mapping data:", err);
      setError(err.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  // Match attendances to buildings based on proximity
  const buildingStats = useMemo(() => {
    const stats: Record<string, BuildingStats> = {};
    
    BUILDINGS.forEach(b => {
      stats[b.id] = { name: b.name, count: 0, users: [] };
    });

    attendances.forEach(att => {
      if (!att.latitude || !att.longitude) return;
      
      const attLat = parseFloat(String(att.latitude));
      const attLng = parseFloat(String(att.longitude));
      
      // Find the closest building within threshold (about 50 meters ~ 0.0005 degrees)
      let closestBuilding: typeof BUILDINGS[0] | null = null;
      let closestDistance = Infinity;
      
      BUILDINGS.forEach(b => {
        const distance = Math.sqrt(
          Math.pow(attLat - b.lat, 2) + Math.pow(attLng - b.lng, 2)
        );
        if (distance < closestDistance && distance < 0.001) { // ~100m threshold
          closestDistance = distance;
          closestBuilding = b;
        }
      });

      // Get the first user from the array (Supabase returns array for joins)
      const user = Array.isArray(att.user) ? att.user[0] : att.user;

      // If no close building found, try to match by unit_kerja from locations
      if (!closestBuilding && user?.unit_kerja) {
        const matchingLoc = locations.find(loc => 
          loc.location_name && user?.unit_kerja && 
          locations.some(l => l.location_name === loc.location_name)
        );
        
        if (matchingLoc) {
          BUILDINGS.forEach(b => {
            const distance = Math.sqrt(
              Math.pow(matchingLoc.latitude - b.lat, 2) + 
              Math.pow(matchingLoc.longitude - b.lng, 2)
            );
            if (distance < 0.0005) {
              closestBuilding = b;
            }
          });
        }
      }

      if (closestBuilding) {
        stats[closestBuilding.id].count++;
        if (user?.full_name && !stats[closestBuilding.id].users.includes(user.full_name)) {
          stats[closestBuilding.id].users.push(user.full_name);
        }
      }
    });

    return stats;
  }, [attendances, locations]);

  const totalAttendance = useMemo(() => {
    return Object.values(buildingStats).reduce((sum, b) => sum + b.count, 0);
  }, [buildingStats]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <MapIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Mapping Kehadiran Kampus</h2>
              <p className="text-xs text-gray-500">{formatDate(selectedDate)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-bold text-gray-900">{totalAttendance}</span>
              <span className="text-xs text-gray-500">hadir</span>
            </div>
          </div>
        </div>
      </div>

      {/* Map Content */}
      <div className="p-4 sm:p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64 text-red-500">
            <p>{error}</p>
          </div>
        ) : (
          <>
            {/* Campus Map - Bird's Eye View */}
            <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] bg-gradient-to-br from-green-100 via-green-50 to-emerald-100 rounded-xl border-2 border-green-200 overflow-hidden shadow-inner">
              {/* Background Elements - Roads & Paths */}
              <div className="absolute inset-0">
                {/* Main vertical road (Jl. Veteran Dalam) */}
                <div className="absolute left-[45%] top-0 bottom-0 w-4 sm:w-6 bg-gray-300 opacity-60" />
                
                {/* Horizontal paths */}
                <div className="absolute left-0 right-0 top-[30%] h-2 sm:h-3 bg-gray-200 opacity-50" />
                <div className="absolute left-0 right-0 top-[70%] h-2 sm:h-3 bg-gray-200 opacity-50" />
                
                {/* Grass/Garden areas */}
                <div className="absolute left-[10%] top-[45%] w-16 h-16 sm:w-24 sm:h-24 bg-green-300/40 rounded-full blur-sm" />
                <div className="absolute right-[15%] top-[50%] w-12 h-12 sm:w-20 sm:h-20 bg-green-300/40 rounded-full blur-sm" />
              </div>

              {/* Compass */}
              <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg border border-gray-200 shadow-sm z-20">
                <div className="text-[10px] sm:text-xs font-bold text-gray-700 flex items-center gap-1">
                  <span className="text-blue-600">N</span>
                  <span className="text-gray-400">|</span>
                  <span>UTARA</span>
                </div>
              </div>

              {/* Info */}
              <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg border border-gray-200 shadow-sm z-20 hidden sm:flex items-center gap-1">
                <Info className="w-3 h-3 text-blue-500" />
                <span className="text-[10px] text-gray-600">Hover untuk detail</span>
              </div>

              {/* Buildings */}
              {BUILDINGS.map((building) => {
                const pos = latLngToXY(building.lat, building.lng);
                const stats = buildingStats[building.id];
                const isHovered = hoveredBuilding === building.id;
                const hasAttendance = stats.count > 0;

                // Special handling for Pascasarjana (outside main bounds)
                const isPascasarjana = building.id === "pascasarjana";
                const adjustedPos = isPascasarjana 
                  ? { x: 50, y: 95 } 
                  : pos;

                return (
                  <div
                    key={building.id}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 cursor-pointer z-10
                      ${isHovered ? 'z-30 scale-110' : 'hover:z-20'}
                    `}
                    style={{
                      left: `${adjustedPos.x}%`,
                      top: `${adjustedPos.y}%`,
                    }}
                    onMouseEnter={() => setHoveredBuilding(building.id)}
                    onMouseLeave={() => setHoveredBuilding(null)}
                    onClick={() => setHoveredBuilding(isHovered ? null : building.id)}
                  >
                    {/* Building Shape */}
                    <div 
                      className={`
                        relative flex flex-col items-center justify-center
                        ${isPascasarjana ? 'w-20 h-6 sm:w-32 sm:h-8' : 'w-14 h-10 sm:w-24 sm:h-16'}
                        ${BUILDING_STYLE_BY_ID[building.id].color} ${BUILDING_STYLE_BY_ID[building.id].hoverColor}

                        rounded-lg shadow-lg border-2 border-white/50
                        transition-all duration-300
                        ${isHovered ? 'ring-4 ring-blue-400/50 shadow-xl' : ''}
                        ${hasAttendance ? 'opacity-100' : 'opacity-70'}
                      `}
                    >
                      {/* Building Label */}
                      <span className="text-[8px] sm:text-[10px] font-bold text-white text-center leading-tight px-1 drop-shadow">
                        {building.shortName}
                      </span>
                      
                      {/* Attendance Badge */}
                      {hasAttendance && (
                        <div className="absolute -top-2 -right-2 sm:-top-2 sm:-right-2 bg-white text-blue-600 rounded-full min-w-[20px] h-5 sm:min-w-[24px] sm:h-6 flex items-center justify-center text-[10px] sm:text-xs font-black shadow-md border border-blue-100">
                          {stats.count}
                        </div>
                      )}
                    </div>

                    {/* Tooltip */}
                    {isHovered && (
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 sm:w-64 bg-gray-900/95 backdrop-blur text-white p-3 rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-gray-900/95" />
                        
                        <p className="font-bold text-sm border-b border-gray-700 pb-2 mb-2">
                          {building.name}
                        </p>
                        
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-300 text-xs">Kehadiran:</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${hasAttendance ? 'bg-green-500' : 'bg-gray-600'}`}>
                            {stats.count} orang
                          </span>
                        </div>

                        {stats.users.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-700">
                            <p className="text-[10px] text-gray-400 mb-1">Tendik yang hadir:</p>
                            <div className="max-h-24 overflow-y-auto space-y-0.5">
                              {stats.users.slice(0, 5).map((name, i) => (
                                <p key={i} className="text-[11px] text-gray-200 truncate">
                                  {name}
                                </p>
                              ))}
                              {stats.users.length > 5 && (
                                <p className="text-[10px] text-gray-400 italic">
                                  +{stats.users.length - 5} lainnya
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {!hasAttendance && (
                          <p className="text-[10px] text-gray-400 italic mt-1">
                            Belum ada kehadiran tercatat
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Campus Label */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg border border-gray-200 shadow-sm">
                <p className="text-[10px] sm:text-xs font-bold text-gray-700">
                  KAMPUS UNIVERSITAS EKASAKTI
                </p>
                <p className="text-[8px] sm:text-[10px] text-gray-500 text-center">
                  Jl. Veteran Dalam No. 26B, Padang
                </p>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {BUILDINGS.map((building) => {
                const stats = buildingStats[building.id];
                return (
                  <div 
                    key={building.id}
                    className={`
                      flex items-center gap-2 p-2 rounded-lg border transition-all cursor-pointer
                      ${hoveredBuilding === building.id 
                        ? 'border-blue-400 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }
                    `}
                    onMouseEnter={() => setHoveredBuilding(building.id)}
                    onMouseLeave={() => setHoveredBuilding(null)}
                  >
                     <div className={`w-3 h-3 rounded ${BUILDING_STYLE_BY_ID[building.id].color}`} />

                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] sm:text-xs font-medium text-gray-700 truncate">
                        {building.shortName}
                      </p>
                    </div>
                    <span className={`text-xs font-bold ${stats.count > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                      {stats.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
