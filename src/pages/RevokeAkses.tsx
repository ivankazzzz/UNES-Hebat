import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  LogOut,
  Ban,
  Search,
  UserX,
  AlertTriangle,
  CheckCircle,
  RefreshCcw,
  ShieldAlert,
  UserCheck
} from "lucide-react";
import { logout, getCurrentUser, isSuperAdmin } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface User {
  id: string;
  username: string;
  full_name: string;
  role: string;
  unit_kerja: string | null;
  is_struktural: boolean | null;
  is_blocked: boolean | null;
  revoke_reason: string | null;
}

export default function RevokeAkses() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [revokeReason, setRevokeReason] = useState("");
  const [activeTab, setActiveTab] = useState<"active" | "revoked">("active");

  // Check if superadmin
  useEffect(() => {
    if (!isSuperAdmin()) {
      toast.error("Akses ditolak. Hanya superadmin yang dapat mengakses halaman ini.");
      navigate("/admin");
    }
  }, [navigate]);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, username, full_name, role, unit_kerja, is_struktural, is_blocked, revoke_reason")
        .order("full_name", { ascending: true });

      if (error) throw error;

      const typedData = (data || []) as User[];
      setUsers(typedData);
      filterUsers(typedData, searchQuery, activeTab);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Gagal memuat data pengguna");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, activeTab]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filterUsers = (allUsers: User[], query: string, tab: "active" | "revoked") => {
    let filtered = allUsers;

    // Filter by tab
    if (tab === "active") {
      filtered = filtered.filter((u) => !u.is_blocked);
    } else {
      filtered = filtered.filter((u) => u.is_blocked);
    }

    // Filter by search query
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.full_name?.toLowerCase().includes(lowerQuery) ||
          u.username?.toLowerCase().includes(lowerQuery) ||
          u.unit_kerja?.toLowerCase().includes(lowerQuery)
      );
    }

    setFilteredUsers(filtered);
  };

  useEffect(() => {
    filterUsers(users, searchQuery, activeTab);
  }, [searchQuery, activeTab, users]);

  const handleRevoke = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from("users")
        .update({
          is_blocked: true,
          revoke_reason: revokeReason || "Akses dicabut oleh admin",
        })
        .eq("id", selectedUser.id);

      if (error) throw error;

      toast.success(`Akses ${selectedUser.full_name} berhasil dicabut`);
      setIsRevokeDialogOpen(false);
      setRevokeReason("");
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error("Error revoking user:", error);
      toast.error("Gagal mencabut akses pengguna");
    }
  };

  const handleRestore = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from("users")
        .update({
          is_blocked: false,
          revoke_reason: null,
        })
        .eq("id", selectedUser.id);

      if (error) throw error;

      toast.success(`Akses ${selectedUser.full_name} berhasil dikembalikan`);
      setIsRestoreDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error("Error restoring user:", error);
      toast.error("Gagal mengembalikan akses pengguna");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const getUserCategory = (user: User) => {
    if (user.role === "dosen" && user.is_struktural) {
      return "Dosen Struktural";
    } else if (user.role === "pegawai") {
      return "Tenaga Kependidikan";
    } else if (user.role === "admin" || user.role === "superadmin") {
      return "Admin";
    } else {
      return "Dosen";
    }
  };

  const activeCount = users.filter((u) => !u.is_blocked).length;
  const revokedCount = users.filter((u) => u.is_blocked).length;

  return (
    <div className="min-h-screen bg-slate-50 w-full overflow-x-hidden">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 w-full sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 w-full">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin")}
              className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-slate-700" />
            </button>
            <img src="/unes.png" alt="UNES Logo" className="h-10 w-10" />
            <div>
              <h1 className="text-xl font-bold text-slate-800">Revoke Akses</h1>
              <p className="text-sm text-slate-500">Cabut akses pengguna</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all"
          >
            <LogOut className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 pb-24">
        {/* Info Card */}
        <Card className="mb-6 bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-900 mb-1">
                  Informasi Penting
                </h3>
                <p className="text-sm text-amber-800">
                  Fitur ini digunakan untuk mencabut akses pengguna yang sebelumnya merupakan 
                  dosen struktural atau tenaga kependidikan, namun sudah tidak lagi menjabat 
                  (turun jabatan/pensiun/pindah). Pengguna yang di-revoke tidak akan bisa login 
                  dan akan melihat pesan bahwa sistem hanya untuk dosen struktural dan tenaga 
                  kependidikan. Data pengguna tetap tersimpan di database.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="bg-white">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Pengguna Aktif</p>
                <p className="text-2xl font-bold text-slate-800">{activeCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <UserX className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Akses Dicabut</p>
                <p className="text-2xl font-bold text-slate-800">{revokedCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab("active")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === "active"
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            Pengguna Aktif
          </button>
          <button
            onClick={() => setActiveTab("revoked")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === "revoked"
                ? "bg-red-600 text-white"
                : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            Akses Dicabut
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Cari nama, username, atau unit kerja..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12"
          />
        </div>

        {/* Users List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCcw className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <Card className="bg-white">
            <CardContent className="p-8 text-center">
              {activeTab === "active" ? (
                <>
                  <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <p className="text-slate-600">Tidak ada pengguna aktif yang ditemukan</p>
                </>
              ) : (
                <>
                  <Ban className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-600">Belum ada pengguna yang di-revoke</p>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <Card
                key={user.id}
                className={`bg-white hover:shadow-md transition-shadow ${
                  user.is_blocked ? "border-red-200" : ""
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-800 truncate">
                          {user.full_name}
                        </h3>
                        {user.is_blocked && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                            Di-revoke
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mb-1">@{user.username}</p>
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                          {getUserCategory(user)}
                        </span>
                        {user.unit_kerja && (
                          <span className="text-slate-400 truncate max-w-[200px]">
                            {user.unit_kerja}
                          </span>
                        )}
                      </div>
                      {user.is_blocked && user.revoke_reason && (
                        <p className="mt-2 text-sm text-red-600">
                          <span className="font-medium">Alasan:</span> {user.revoke_reason}
                        </p>
                      )}
                    </div>
                    <div>
                      {activeTab === "active" ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsRevokeDialogOpen(true);
                          }}
                          className="gap-2"
                        >
                          <Ban className="w-4 h-4" />
                          Revoke
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsRestoreDialogOpen(true);
                          }}
                          className="gap-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                        >
                          <RefreshCcw className="w-4 h-4" />
                          Kembalikan
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Revoke Dialog */}
      <Dialog open={isRevokeDialogOpen} onOpenChange={setIsRevokeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Cabut Akses Pengguna
            </DialogTitle>
            <DialogDescription>
              Anda akan mencabut akses <strong>{selectedUser?.full_name}</strong>.
              Pengguna ini tidak akan bisa login setelah akses dicabut.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Alasan Revoke (opsional)
            </label>
            <Input
              placeholder="Contoh: Turun jabatan, pensiun, mutasi..."
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
            />
            <p className="mt-2 text-sm text-slate-500">
              Alasan ini akan ditampilkan saat pengguna mencoba login.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRevokeDialogOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleRevoke}>
              Ya, Cabut Akses
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Dialog */}
      <AlertDialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-emerald-600">
              <RefreshCcw className="w-5 h-5" />
              Kembalikan Akses
            </AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan mengembalikan akses <strong>{selectedUser?.full_name}</strong>.
              Pengguna ini akan bisa login kembali setelah akses dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestore}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Ya, Kembalikan Akses
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
