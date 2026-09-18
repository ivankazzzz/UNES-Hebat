import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Map, LogOut, Calendar, ExternalLink } from "lucide-react";
import { getCurrentUser, logout } from "@/lib/auth";
import AttendanceMapping from "@/components/AttendanceMapping";

export default function MappingKehadiran() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

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
            <img
              src="/unes.png"
              alt="UNES Logo"
              className="h-8 w-8"
            />
            <div>
              <h1 className="text-lg font-bold text-gray-900">Mapping Kehadiran</h1>
              <p className="text-xs text-gray-500">Panel Administrator</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <LogOut className="w-5 h-5 text-gray-600" />
            </button>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {currentUser?.full_name?.charAt(0) || 'A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full">
        <div className="p-4 sm:p-6 lg:p-8 w-full">
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            {/* Content Header */}
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-cyan-500 rounded-lg flex items-center justify-center">
                    <Map className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold leading-tight text-gray-900">
                      Mapping Kehadiran Kampus
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600">
                      Visualisasi lokasi absensi di kampus UNES
                    </p>
                  </div>
                </div>
                
                {/* Date Picker */}
                <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <label className="text-sm font-medium text-gray-600">Tanggal:</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-1.5 px-2"
                  />
                </div>
              </div>
            </div>

             {/* Peta Kampus */}
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
               <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-3">
                 <div>
                   <h3 className="font-bold text-gray-900">Peta Kampus (OpenStreetMap)</h3>
                   <p className="text-xs text-gray-600">UNES • Jl. Veteran Dalam No. 26B, Padang</p>
                 </div>
                 <a
                   className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                   href="https://www.openstreetmap.org/?mlat=-0.937557&mlon=100.356313#map=18/-0.937557/100.356313"
                   target="_blank"
                   rel="noreferrer"
                 >
                   Buka
                   <ExternalLink className="w-4 h-4" />
                 </a>
               </div>

               <div className="p-4">
                 <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] rounded-lg overflow-hidden border border-gray-200">
                   <iframe
                     title="Peta Kampus UNES"
                     className="absolute inset-0 h-full w-full"
                     loading="lazy"
                     referrerPolicy="no-referrer-when-downgrade"
                     src="https://www.openstreetmap.org/export/embed.html?bbox=100.3549%2C-0.9398%2C100.3579%2C-0.9362&layer=mapnik&marker=-0.937557%2C100.356313"
                   />
                 </div>

                 <p className="mt-2 text-xs text-gray-500">
                   Tip: klik “Buka” untuk melihat peta layar penuh.
                 </p>
               </div>
             </div>

             {/* Mapping Component */}
             <div className="animate-fade-in">
               <AttendanceMapping selectedDate={selectedDate} />
             </div>
             
             {/* Info Card */}

            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 sm:p-6 border border-blue-100">
              <h3 className="font-bold text-gray-900 mb-2">Petunjuk Penggunaan</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>- Hover atau klik gedung untuk melihat detail kehadiran</li>
                <li>- Pilih tanggal untuk melihat data kehadiran hari tertentu</li>
                <li>- Angka pada gedung menunjukkan jumlah tendik yang absen di lokasi tersebut</li>
                <li>- Gedung berwarna lebih terang menandakan belum ada kehadiran tercatat</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
