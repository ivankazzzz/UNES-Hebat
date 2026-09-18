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
  Link as LinkIcon,
  Save,
  X,
  Loader2,
  ExternalLink,
  User,
} from "lucide-react";
import { toast } from "sonner";
import BottomNavigation from "@/components/BottomNavigation";

interface LeavePermit {
  id: string;
  user_id: string;
  permit_type: "izin" | "cuti" | "dinas_luar";
  start_date: string;
  end_date: string;
  description: string | null;
  document_url: string | null;
  created_at: string;
}

const permitTypeLabels: Record<string, string> = {
  izin: "Izin",
  cuti: "Cuti",
  dinas_luar: "Dinas Luar",
};

const permitTypeColors: Record<string, string> = {
  izin: "bg-red-100 text-red-800",
  cuti: "bg-green-100 text-green-800",
  dinas_luar: "bg-purple-100 text-purple-800",
};

export default function IzinCutiUser() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [permits, setPermits] = useState<LeavePermit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filter states
  const [filterType, setFilterType] = useState<string>("");
  const [filterMonth, setFilterMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    permit_type: "izin" as "izin" | "cuti" | "dinas_luar",
    start_date: "",
    end_date: "",
    description: "",
    document_url: "",
  });

  useEffect(() => {
    if (currentUser?.id) {
      loadData();
    }
  }, [currentUser?.id]);

  const loadData = async () => {
    if (!currentUser?.id) return;
    
    setLoading(true);
    try {
      // Load leave permits for current user only
      const { data: permitsData, error: permitsError } = await supabase
        .from("leave_permits")
        .select("*")
        .eq("user_id", currentUser.id)
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
    const matchType = filterType ? permit.permit_type === filterType : true;
    const matchMonth = filterMonth
      ? permit.start_date.startsWith(filterMonth) ||
        permit.end_date.startsWith(filterMonth)
      : true;
    return matchType && matchMonth;
  });

  const resetForm = () => {
    setFormData({
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

    if (!currentUser?.id) {
      toast.error("User tidak ditemukan");
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
        user_id: currentUser.id,
        permit_type: formData.permit_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        description: formData.description?.trim() || null,
        document_url: documentUrl,
        created_by: currentUser.id,
      };

      if (editingId) {
        const { error } = await supabase
          .from("leave_permits")
          .update(payload)
          .eq("id", editingId)
          .eq("user_id", currentUser.id); // Extra safety check

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
        .eq("id", id)
        .eq("user_id", currentUser?.id); // Extra safety check

      if (error) throw error;
      toast.success("Data berhasil dihapus");
      loadData();
    } catch (error) {
      console.error("Error deleting data:", error);
      toast.error("Gagal menghapus data");
    }
  };

  const formatDateShort = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <>
    <div className="min-h-screen bg-gray-50 pb-20 animate-page-in">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#8c1b1d] via-[#b52020] to-[#c0392b] text-white sticky top-0 z-40">
        <div className="px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="p-2 -ml-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-bold truncate">
                Pengajuan Izin / Cuti
              </h1>
              <p className="text-xs sm:text-sm text-white/70">
                Input data izin, cuti, dan dinas luar Anda
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 sm:px-6">
        {/* User Info */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#8c1b1d] rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{currentUser?.full_name}</p>
              <p className="text-sm text-gray-500">Data izin/cuti akan tercatat atas nama Anda</p>
            </div>
          </div>
        </div>

        {/* Filters & Add Button */}
        <div className="mb-4 space-y-3">
          {/* Filters */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-2 py-2.5 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#8c1b1d] focus:border-[#8c1b1d] bg-white"
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
              className="px-2 py-2.5 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#8c1b1d] focus:border-[#8c1b1d] bg-white w-full"
              style={{ minWidth: 0 }}
            />
          </div>

          {/* Add Button */}
          <button
            onClick={() => setShowForm(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#8c1b1d] to-[#c0392b] text-white rounded-xl hover:from-[#7a1819] hover:to-[#a02020] active:scale-[0.98] transition-all text-sm font-semibold shadow-lg shadow-[#8c1b1d]/25"
          >
            <Plus className="w-5 h-5" />
            Ajukan Izin / Cuti Baru
          </button>
        </div>

        {/* Form Modal - Centered and mobile optimized */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl shadow-xl">
              {/* Header - Sticky */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10 rounded-t-2xl">
                <h2 className="text-lg font-bold text-gray-900">
                  {editingId ? "Edit Data" : "Ajukan Izin / Cuti Baru"}
                </h2>
                <button
                  onClick={resetForm}
                  className="p-2 hover:bg-gray-100 rounded-lg -mr-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                {/* Info User */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">
                    <User className="w-4 h-4 inline mr-1" />
                    Pengajuan atas nama: <strong>{currentUser?.full_name}</strong>
                  </p>
                </div>

                {/* Tipe */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FileText className="w-4 h-4 inline mr-1" />
                    Tipe Pengajuan
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
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8c1b1d] focus:border-[#8c1b1d] text-sm"
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
                      Tgl Mulai
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
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8c1b1d] focus:border-[#8c1b1d] text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Tgl Selesai
                    </label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) =>
                        setFormData({ ...formData, end_date: e.target.value })
                      }
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8c1b1d] focus:border-[#8c1b1d] text-sm"
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
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8c1b1d] focus:border-[#8c1b1d] text-sm resize-none"
                    placeholder="Jelaskan alasan izin/cuti Anda..."
                  />
                </div>

                {/* Link Surat */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <LinkIcon className="w-4 h-4 inline mr-1" />
                    Link Dokumen
                  </label>
                  <input
                    type="url"
                    value={formData.document_url}
                    onChange={(e) =>
                      setFormData({ ...formData, document_url: e.target.value })
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8c1b1d] focus:border-[#8c1b1d] text-sm"
                    placeholder="https://drive.google.com/..."
                    required
                  />
                  <p className="mt-1.5 text-xs text-gray-500">
                    Berikan link dokumen dinas luar/izin/cuti Anda yang didapat dari Wakil Rektor II untuk dilaporkan.
                  </p>
                </div>

                {/* Buttons - dengan padding bawah untuk dock */}
                <div className="flex gap-3 pt-2 pb-6">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !formData.document_url.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#8c1b1d] text-white rounded-xl hover:bg-[#7a1819] transition-colors disabled:opacity-50 text-sm font-semibold shadow-lg shadow-[#8c1b1d]/25"
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
              <Loader2 className="w-8 h-8 animate-spin text-[#8c1b1d]" />
            </div>
          ) : filteredPermits.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-medium">Belum ada data izin/cuti</p>
              <p className="text-xs text-gray-400 mt-1">Tap tombol di atas untuk mengajukan</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredPermits.map((permit) => (
                <div key={permit.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${permitTypeColors[permit.permit_type]}`}>
                          {permitTypeLabels[permit.permit_type]}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDateShort(permit.start_date)}
                        {permit.start_date !== permit.end_date && (
                          <> - {formatDateShort(permit.end_date)}</>
                        )}
                      </p>
                      {permit.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
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
                          className="p-2 text-[#8c1b1d] hover:bg-red-50 rounded-lg transition-colors"
                          title="Lihat Surat"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => handleEdit(permit)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(permit.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
    {/* Bottom Navigation */}
    <BottomNavigation />
    </>
  );
}
