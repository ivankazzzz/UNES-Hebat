import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { toast } from "sonner";
import {
  ArrowLeft,
  CalendarOff,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle,
  X,
  Loader2,
  Info,
  Pencil
} from "lucide-react";

interface Holiday {
  id: string;
  holiday_date: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

export default function HariLibur() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);

  // Form state
  const [holidayDate, setHolidayDate] = useState("");
  const [description, setDescription] = useState("");

  // Edit form state
  const [editHolidayDate, setEditHolidayDate] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // Cek apakah hari ini libur
  const [todayHoliday, setTodayHoliday] = useState<Holiday | null>(null);

  useEffect(() => {
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("holidays")
        .select("*")
        .order("holiday_date", { ascending: false });

      if (error) throw error;

      setHolidays(data || []);

      // Cek apakah hari ini libur
      const today = new Date().toISOString().split("T")[0];
      const todayHol = (data || []).find(
        (h) => h.holiday_date === today && h.is_active
      );
      setTodayHoliday(todayHol || null);
    } catch (error) {
      console.error("Error fetching holidays:", error);
      toast.error("Gagal memuat data hari libur");
    } finally {
      setLoading(false);
    }
  };

  const handleAddHoliday = async () => {
    if (!holidayDate || !description.trim()) {
      toast.error("Tanggal dan keterangan harus diisi");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("holidays").insert([
        {
          holiday_date: holidayDate,
          description: description.trim(),
          is_active: true,
          created_by: currentUser?.id
        }
      ]);

      if (error) {
        if (error.code === "23505") {
          toast.error("Tanggal tersebut sudah terdaftar sebagai hari libur");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Hari libur berhasil ditambahkan");
      setShowAddModal(false);
      setHolidayDate("");
      setDescription("");
      fetchHolidays();
    } catch (error) {
      console.error("Error adding holiday:", error);
      toast.error("Gagal menambahkan hari libur");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (holiday: Holiday) => {
    try {
      const { error } = await supabase
        .from("holidays")
        .update({ is_active: !holiday.is_active, updated_at: new Date().toISOString() })
        .eq("id", holiday.id);

      if (error) throw error;

      toast.success(
        holiday.is_active
          ? "Hari libur dinonaktifkan"
          : "Hari libur diaktifkan"
      );
      fetchHolidays();
    } catch (error) {
      console.error("Error toggling holiday:", error);
      toast.error("Gagal mengubah status hari libur");
    }
  };

  const handleDeleteHoliday = async () => {
    if (!selectedHoliday) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("holidays")
        .delete()
        .eq("id", selectedHoliday.id);

      if (error) throw error;

      toast.success("Hari libur berhasil dihapus");
      setShowDeleteModal(false);
      setSelectedHoliday(null);
      fetchHolidays();
    } catch (error) {
      console.error("Error deleting holiday:", error);
      toast.error("Gagal menghapus hari libur");
    } finally {
      setSaving(false);
    }
  };

  const handleEditHoliday = async () => {
    if (!selectedHoliday) return;
    if (!editHolidayDate || !editDescription.trim()) {
      toast.error("Tanggal dan keterangan harus diisi");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("holidays")
        .update({
          holiday_date: editHolidayDate,
          description: editDescription.trim(),
          updated_at: new Date().toISOString()
        })
        .eq("id", selectedHoliday.id);

      if (error) {
        if (error.code === "23505") {
          toast.error("Tanggal tersebut sudah terdaftar sebagai hari libur lain");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Hari libur berhasil diperbarui");
      setShowEditModal(false);
      setSelectedHoliday(null);
      setEditHolidayDate("");
      setEditDescription("");
      fetchHolidays();
    } catch (error) {
      console.error("Error updating holiday:", error);
      toast.error("Gagal memperbarui hari libur");
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (holiday: Holiday) => {
    setSelectedHoliday(holiday);
    setEditHolidayDate(holiday.holiday_date);
    setEditDescription(holiday.description);
    setShowEditModal(true);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(date);
  };

  const isDatePast = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const holidayDate = new Date(dateStr);
    return holidayDate < today;
  };

  const isDateToday = (dateStr: string) => {
    const today = new Date().toISOString().split("T")[0];
    return dateStr === today;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 shadow-sm border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin")}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-800 dark:text-white">
                Pengaturan Hari Libur
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Atur hari libur untuk menonaktifkan absensi
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-medium shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Tambah Libur</span>
          </button>
        </div>
      </header>

      {/* Today Holiday Banner */}
      {todayHoliday && (
        <div className="mx-4 mt-4 p-4 bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl text-white shadow-lg shadow-red-500/25">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <CalendarOff className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">Hari Ini Libur</h3>
              <p className="text-white/90 text-sm mt-1">
                {todayHoliday.description}
              </p>
              <p className="text-white/70 text-xs mt-2">
                Sistem absensi tidak menerima absensi hari ini
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="mx-4 mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="font-medium">Tentang Fitur Hari Libur:</p>
            <ul className="list-disc list-inside mt-1 text-blue-600 dark:text-blue-400 space-y-1">
              <li>Hari libur yang aktif akan menonaktifkan sistem absensi</li>
              <li>Pengguna yang mencoba absen akan mendapat notifikasi libur</li>
              <li>Anda dapat menonaktifkan sementara tanpa menghapus data</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Holiday List */}
      <div className="p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
          </div>
        ) : holidays.length === 0 ? (
          <div className="text-center py-12">
            <CalendarOff className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400">
              Belum Ada Hari Libur
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
              Klik tombol "Tambah Libur" untuk menambahkan hari libur
            </p>
          </div>
        ) : (
          holidays.map((holiday) => (
            <div
              key={holiday.id}
              className={`relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border shadow-sm transition-all ${
                isDateToday(holiday.holiday_date)
                  ? "border-red-300 dark:border-red-800 ring-2 ring-red-200 dark:ring-red-900"
                  : holiday.is_active
                  ? "border-slate-200 dark:border-slate-800"
                  : "border-slate-100 dark:border-slate-800 opacity-60"
              }`}
            >
              {/* Status Badge */}
              {isDateToday(holiday.holiday_date) && holiday.is_active && (
                <div className="absolute top-0 right-0 px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-bl-xl">
                  HARI INI
                </div>
              )}

              <div className="p-4">
                <div className="flex items-start gap-4">
                  {/* Date Icon */}
                  <div
                    className={`shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center ${
                      holiday.is_active
                        ? isDatePast(holiday.holiday_date)
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-500"
                          : "bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/25"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                    }`}
                  >
                    <Calendar className="w-5 h-5" />
                    <span className="text-xs font-bold mt-0.5">
                      {new Date(holiday.holiday_date).getDate()}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`font-bold text-base ${
                        holiday.is_active
                          ? "text-slate-800 dark:text-white"
                          : "text-slate-500 dark:text-slate-500"
                      }`}
                    >
                      {holiday.description}
                    </h3>
                    <p
                      className={`text-sm mt-1 ${
                        holiday.is_active
                          ? "text-slate-600 dark:text-slate-400"
                          : "text-slate-400 dark:text-slate-600"
                      }`}
                    >
                      {formatDate(holiday.holiday_date)}
                    </p>

                    {/* Status */}
                    <div className="flex items-center gap-2 mt-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          holiday.is_active
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-500"
                        }`}
                      >
                        {holiday.is_active ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Aktif
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3" />
                            Nonaktif
                          </>
                        )}
                      </span>
                      {isDatePast(holiday.holiday_date) && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500">
                          Sudah lewat
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => openEditModal(holiday)}
                      className="px-3 py-1.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleActive(holiday)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        holiday.is_active
                          ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50"
                          : "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
                      }`}
                    >
                      {holiday.is_active ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedHoliday(holiday);
                        setShowDeleteModal(true);
                      }}
                      className="px-3 py-1.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => !saving && setShowAddModal(false)}
          />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
                  <CalendarOff className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                  Tambah Hari Libur
                </h2>
              </div>
              <button
                onClick={() => !saving && setShowAddModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Tanggal Libur
                </label>
                <input
                  type="date"
                  value={holidayDate}
                  onChange={(e) => setHolidayDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Keterangan
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contoh: Hari Raya Idul Fitri"
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => !saving && setShowAddModal(false)}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleAddHoliday}
                disabled={saving || !holidayDate || !description.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-medium shadow-lg shadow-red-500/25 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Simpan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedHoliday && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => !saving && setShowEditModal(false)}
          />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <Pencil className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                  Edit Hari Libur
                </h2>
              </div>
              <button
                onClick={() => !saving && setShowEditModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Tanggal Libur
                </label>
                <input
                  type="date"
                  value={editHolidayDate}
                  onChange={(e) => setEditHolidayDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Keterangan
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Contoh: Hari Raya Idul Fitri"
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => !saving && setShowEditModal(false)}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleEditHoliday}
                disabled={saving || !editHolidayDate || !editDescription.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Pencil className="w-4 h-4" />
                    Simpan Perubahan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedHoliday && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => !saving && setShowDeleteModal(false)}
          />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <Trash2 className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
              Hapus Hari Libur?
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Anda akan menghapus libur tanggal{" "}
              <strong>{formatDate(selectedHoliday.holiday_date)}</strong>. Tindakan
              ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => !saving && setShowDeleteModal(false)}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteHoliday}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium shadow-lg shadow-red-500/25 hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  "Hapus"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
