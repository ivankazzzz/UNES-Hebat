import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Loader2, Save, Search, X } from "lucide-react";

import { getCurrentUser, logout } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

type UserRow = {
  id: string;
  username: string;
  full_name: string;
  role: string;
  unit_kerja: string | null;
  is_struktural: boolean | null;
};

type UserWorkScheduleRow = {
  id: string;
  user_id: string;
  check_in_start: string;
  check_in_end: string;
  check_out_start: string;
  check_out_end: string;
  is_active: boolean;
};

type EditableSchedule = {
  user_id: string;
  check_in_end: string;
  check_out_start: string;
  isDirty: boolean;
};

const pad2 = (value: number) => String(value).padStart(2, "0");

const normalizeToHHMM = (raw: string): string => {
  // Values may be "HH:MM" or "HH:MM:SS" from Postgres time
  const [h = "", m = ""] = raw.split(":");
  const hh = pad2(Number(h || 0));
  const mm = pad2(Number(m || 0));
  return `${hh}:${mm}`;
};

const hhmmToTime = (value: string): string => {
  const normalized = normalizeToHHMM(value);
  return `${normalized}:00`;
};

export default function JamKerja() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [users, setUsers] = useState<UserRow[]>([]);
  const [existingSchedules, setExistingSchedules] = useState<Record<string, UserWorkScheduleRow>>({});
  const [drafts, setDrafts] = useState<Record<string, EditableSchedule>>({});

  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [{ data: usersData, error: usersError }, { data: schedulesData, error: schedulesError }] =
        await Promise.all([
          supabase
            .from("users")
            .select("id, username, full_name, role, unit_kerja, is_struktural")
            .or("role.eq.pegawai,is_struktural.eq.true")
            .order("full_name", { ascending: true }),
          supabase
            .from("user_work_schedules")
            .select("id, user_id, check_in_start, check_in_end, check_out_start, check_out_end, is_active")
            .eq("is_active", true),
        ]);

      if (usersError) throw usersError;
      if (schedulesError) throw schedulesError;

      const safeUsers = (usersData || []) as UserRow[];
      const safeSchedules = (schedulesData || []) as UserWorkScheduleRow[];

      const scheduleByUser: Record<string, UserWorkScheduleRow> = {};
      for (const schedule of safeSchedules) {
        scheduleByUser[schedule.user_id] = schedule;
      }

      setUsers(safeUsers);
      setExistingSchedules(scheduleByUser);

      const defaultDrafts: Record<string, EditableSchedule> = {};
      for (const user of safeUsers) {
        const existing = scheduleByUser[user.id];

        defaultDrafts[user.id] = {
          user_id: user.id,
          check_in_end: normalizeToHHMM(existing?.check_in_end ?? "09:00:00"),
          check_out_start: normalizeToHHMM(existing?.check_out_start ?? "15:00:00"),
          isDirty: false,
        };
      }
      setDrafts(defaultDrafts);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Gagal memuat data.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase();

    return users.filter((u) => {
      return (
        u.full_name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.unit_kerja || "").toLowerCase().includes(q)
      );
    });
  }, [users, searchQuery]);

  const dirtyCount = useMemo(() => {
    return Object.values(drafts).filter((d) => d.isDirty).length;
  }, [drafts]);

  const updateDraft = (userId: string, patch: Partial<Pick<EditableSchedule, "check_in_end" | "check_out_start">>) => {
    setDrafts((prev) => {
      const current = prev[userId];
      if (!current) return prev;

      return {
        ...prev,
        [userId]: {
          ...current,
          ...patch,
          isDirty: true,
        },
      };
    });
  };

  const resetDraft = (userId: string) => {
    setDrafts((prev) => {
      const current = prev[userId];
      if (!current) return prev;
      const existing = existingSchedules[userId];

      return {
        ...prev,
        [userId]: {
          ...current,
          check_in_end: normalizeToHHMM(existing?.check_in_end ?? "09:00:00"),
          check_out_start: normalizeToHHMM(existing?.check_out_start ?? "15:00:00"),
          isDirty: false,
        },
      };
    });
  };

  const saveChanges = async () => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const dirtyDrafts = Object.values(drafts).filter((d) => d.isDirty);
      if (dirtyDrafts.length === 0) {
        setSuccessMessage("Tidak ada perubahan untuk disimpan.");
        return;
      }

      const payload = dirtyDrafts.map((d) => ({
        user_id: d.user_id,
        check_in_end: hhmmToTime(d.check_in_end),
        check_out_start: hhmmToTime(d.check_out_start),
        is_active: true,
      }));

      // Use upsert so operator can set quickly
      const { error: upsertError } = await supabase
        .from("user_work_schedules")
        .upsert(payload, { onConflict: "user_id" });

      if (upsertError) throw upsertError;

      setSuccessMessage(`Berhasil menyimpan ${dirtyDrafts.length} perubahan.`);
      await loadData();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Gagal menyimpan perubahan.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 w-full">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/admin")}
                className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="bg-purple-600/10 p-1.5 rounded-lg">
                  <img src="/unes.png" alt="UNES Logo" className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-gray-900 leading-none">Jam Kerja</h1>
                  <p className="text-[10px] font-medium text-gray-500 mt-0.5">Administrator Panel</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-sm font-semibold text-gray-700">{currentUser?.full_name || "Admin"}</span>
                <span className="text-xs text-gray-500">Administrator</span>
              </div>
              <div className="h-8 w-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-sm ring-2 ring-purple-100">
                {currentUser?.full_name?.charAt(0) || "A"}
              </div>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-full transition-colors ml-1"
                title="Keluar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pengaturan Jam Kerja</h1>
              <p className="text-gray-500 mt-1">
                Atur batas akhir absen masuk dan awal absen pulang per user (opsional).
              </p>
            </div>

            <button
              onClick={() => void saveChanges()}
              disabled={isSaving || dirtyCount === 0}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white font-semibold bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm"
              title={dirtyCount === 0 ? "Tidak ada perubahan" : "Simpan perubahan"}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Simpan {dirtyCount > 0 ? `(${dirtyCount})` : ""}
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm transition duration-150 ease-in-out shadow-sm"
                  placeholder="Cari nama, username, atau unit kerja..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="text-sm text-gray-500 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>
                  Jam yang diatur: <span className="font-semibold text-gray-800">Jam masuk & Jam pulang</span>
                </span>
              </div>
            </div>

            {error && <div className="px-4 py-3 bg-red-50 text-red-700 text-sm">{error}</div>}
            {successMessage && <div className="px-4 py-3 bg-emerald-50 text-emerald-700 text-sm">{successMessage}</div>}

            {isLoading ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-purple-600" />
                <p className="text-gray-500 mt-3">Memuat data...</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50/30 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <div className="col-span-3">Nama</div>
                  <div className="col-span-2">Username</div>
                  <div className="col-span-2">Unit Kerja</div>
                  <div className="col-span-2">Jam Masuk (batas)</div>
                  <div className="col-span-2">Jam Pulang (mulai)</div>
                  <div className="col-span-1 text-right">Simpan</div>
                </div>

                {filteredUsers.map((user) => {
                  const draft = drafts[user.id];
                  if (!draft) return null;
                  return (
                    <div key={user.id} className="px-4 py-4 lg:px-6 lg:py-3.5">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
                        <div className="lg:col-span-3 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{user.full_name}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {user.is_struktural ? "Dosen Struktural" : "Tendik"}
                          </p>
                        </div>

                        <div className="lg:col-span-2">
                          <p className="font-mono text-sm text-gray-700 break-all">{user.username}</p>
                        </div>

                        <div className="lg:col-span-2">
                          <p className="text-sm text-gray-700 truncate" title={user.unit_kerja || "-"}>
                            {user.unit_kerja || "-"}
                          </p>
                        </div>

                        <div className="lg:col-span-2">
                          <label className="lg:hidden text-xs font-semibold text-gray-500">Jam Masuk (batas)</label>
                          <input
                            type="time"
                            value={draft.check_in_end}
                            onChange={(e) => updateDraft(user.id, { check_in_end: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none"
                          />
                        </div>

                        <div className="lg:col-span-2">
                          <label className="lg:hidden text-xs font-semibold text-gray-500">Jam Pulang (mulai)</label>
                          <div className="flex gap-2">
                            <input
                              type="time"
                              value={draft.check_out_start}
                              onChange={(e) => updateDraft(user.id, { check_out_start: e.target.value })}
                              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => resetDraft(user.id)}
                              disabled={!draft.isDirty || isSaving}
                              className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Reset"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="lg:col-span-1 lg:flex lg:justify-end">
                          <button
                            type="button"
                            onClick={() => void saveChanges()}
                            disabled={isSaving || !draft.isDirty}
                            className="w-full lg:w-auto inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-white font-semibold bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            title={!draft.isDirty ? "Belum ada perubahan" : "Simpan perubahan"}
                          >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            <span className="lg:hidden">Simpan</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
