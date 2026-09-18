import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  FileText,
  Calendar,
  User,
  Link as LinkIcon,
  Save,
  X,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

interface LeavePermit {
  id: string;
  user_id: string;
  permit_type: "izin" | "cuti" | "dinas_luar";
  start_date: string;
  end_date: string;
  description: string | null;
  document_url: string | null;
  created_at: string;
  user?: {
    id: string;
    full_name: string;
    username: string;
  };
  created_by?: string | null;
  updated_at?: string;
}

interface UserData {
  id: string;
  full_name: string;
  username: string;
}

const permitTypeLabels: Record<string, string> = {
  izin: "Izin",
  cuti: "Cuti",
  dinas_luar: "Dinas Luar",
};

const permitTypeColors: Record<string, string> = {
  izin: "bg-blue-100 text-blue-800",
  cuti: "bg-green-100 text-green-800",
  dinas_luar: "bg-purple-100 text-purple-800",
};

export default function KelolaIzinCuti() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [users, setUsers] = useState<UserData[]>([]);
  const [permits, setPermits] = useState<LeavePermit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filter states
  const [filterUser, setFilterUser] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");
  const [filterMonth, setFilterMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    user_id: "",
    permit_type: "izin" as "izin" | "cuti" | "dinas_luar",
    start_date: "",
    end_date: "",
    description: "",
    document_url: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load users
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, full_name, username")
        .neq("role", "mahasiswa")
        .order("full_name");

      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Load leave permits
      const { data: permitsData, error: permitsError } = await supabase
        .from("leave_permits")
        .select("*")
        .order("created_at", { ascending: false });

      if (permitsError) throw permitsError;
      setPermits(permitsData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  const filteredPermits = permits.filter((permit) => {
    const matchUser = filterUser ? permit.user_id === filterUser : true;
    const matchType = filterType ? permit.permit_type === filterType : true;
    const matchMonth = filterMonth
      ? permit.start_date.startsWith(filterMonth) ||
        permit.end_date.startsWith(filterMonth)
      : true;
    return matchUser && matchType && matchMonth;
  });

  // Get user name by ID
  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.full_name || "-";
  };

  const resetForm = () => {
    setFormData({
      user_id: "",
      permit_type: "izin",
      start_date: "",
      end_date: "",
      description: "",
      document_url: "",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (permit: LeavePermit) => {
    setFormData({
      user_id: permit.user_id,
      permit_type: permit.permit_type,
      start_date: permit.start_date,
      end_date: permit.end_date,
      description: permit.description || "",
      document_url: permit.document_url || "",
    });
    setEditingId(permit.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.user_id) {
      toast.error("Pilih tendik terlebih dahulu");
      return;
    }
    if (!formData.start_date || !formData.end_date) {
      toast.error("Tanggal harus diisi");
      return;
    }
    if (formData.end_date < formData.start_date) {
      toast.error("Tanggal selesai tidak boleh sebelum tanggal mulai");
      return;
    }

    const documentUrl = formData.document_url.trim();
    if (!documentUrl) {
      toast.error("Link Dokumen wajib diisi");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        user_id: formData.user_id,
        permit_type: formData.permit_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        description: formData.description?.trim() || null,
        document_url: documentUrl,
        created_by: currentUser?.id || null,
      };

      if (editingId) {
        const { error } = await supabase
          .from("leave_permits")
          .update(payload)
          .eq("id", editingId);

        if (error) throw error;
        toast.success("Data berhasil diupdate");
      } else {
        const { error } = await supabase
          .from("leave_permits")
          .insert(payload);

        if (error) throw error;
        toast.success("Data berhasil ditambahkan");
      }

      resetForm();
      loadData();
    } catch (error) {
      console.error("Error saving data:", error);
      toast.error("Gagal menyimpan data");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus data ini?")) return;

    try {
      const { error } = await supabase
        .from("leave_permits")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Data berhasil dihapus");
      loadData();
    } catch (error) {
      console.error("Error deleting data:", error);
      toast.error("Gagal menghapus data");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateShort = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Mobile Optimized */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin")}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                Kelola Izin / Cuti
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                Input dan kelola data izin, cuti, dan dinas luar
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 sm:px-6 sm:py-6">
        {/* Filters & Add Button - Mobile Optimized */}
        <div className="mb-4 space-y-3">
          {/* Filters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="col-span-2 sm:col-span-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Semua Tendik</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name}
                </option>
              ))}
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Semua Tipe</option>
              <option value="izin">Izin</option>
              <option value="cuti">Cuti</option>
              <option value="dinas_luar">Dinas Luar</option>
            </select>

            <input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Add Button */}
          <button
            onClick={() => setShowForm(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Tambah Data
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
            <div className="bg-white w-full sm:rounded-xl shadow-xl sm:w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">
                  {editingId ? "Edit Data" : "Tambah Data Baru"}
                </h2>
                <button
                  onClick={resetForm}
                  className="p-2 hover:bg-gray-100 rounded-lg -mr-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
                {/* Pilih Tendik */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <User className="w-4 h-4 inline mr-1" />
                        Tendik

                  </label>
                  <select
                    value={formData.user_id}
                    onChange={(e) =>
                      setFormData({ ...formData, user_id: e.target.value })
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    required
                  >
                    <option value="">-- Pilih Tendik --</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tipe */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FileText className="w-4 h-4 inline mr-1" />
                    Tipe
                  </label>
                  <select
                    value={formData.permit_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        permit_type: e.target.value as
                          | "izin"
                          | "cuti"
                          | "dinas_luar",
                      })
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="izin">Izin</option>
                    <option value="cuti">Cuti</option>
                    <option value="dinas_luar">Dinas Luar</option>
                  </select>
                </div>

                {/* Tanggal */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Mulai
                    </label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          start_date: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Selesai
                    </label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) =>
                        setFormData({ ...formData, end_date: e.target.value })
                      }
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      required
                    />
                  </div>
                </div>

                {/* Keterangan */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Keterangan
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={2}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Keterangan izin/cuti..."
                  />
                </div>

                {/* Link Surat */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <LinkIcon className="w-4 h-4 inline mr-1" />
                    Link Surat (URL)
                  </label>
                  <input
                    type="url"
                    value={formData.document_url}
                    onChange={(e) =>
                      setFormData({ ...formData, document_url: e.target.value })
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="https://drive.google.com/..."
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Link ini akan muncul di rekap PDF
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !formData.document_url.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {editingId ? "Update" : "Simpan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : filteredPermits.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">Belum ada data izin/cuti</p>
            </div>
          ) : (
            <>
              {/* Mobile View - Card Style */}
              <div className="block sm:hidden divide-y divide-gray-100">
                {filteredPermits.map((permit) => (
                  <div key={permit.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 truncate">
                          {getUserName(permit.user_id)}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${permitTypeColors[permit.permit_type]}`}>
                            {permitTypeLabels[permit.permit_type]}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDateShort(permit.start_date)}
                            {permit.start_date !== permit.end_date && (
                              <> - {formatDateShort(permit.end_date)}</>
                            )}
                          </span>
                        </div>
                        {permit.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                            {permit.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {permit.document_url && (
                          <a
                            href={permit.document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => handleEdit(permit)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(permit.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View - Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        No
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tendik

                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Tipe
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Tanggal
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Keterangan
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Surat
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredPermits.map((permit, index) => (
                      <tr key={permit.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">
                            {getUserName(permit.user_id)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${permitTypeColors[permit.permit_type]}`}>
                            {permitTypeLabels[permit.permit_type]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatDate(permit.start_date)}
                          {permit.start_date !== permit.end_date && (
                            <> - {formatDate(permit.end_date)}</>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                          {permit.description || "-"}
                        </td>
                        <td className="px-4 py-3">
                          {permit.document_url ? (
                            <a
                              href={permit.document_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Surat
                            </a>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleEdit(permit)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(permit.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
