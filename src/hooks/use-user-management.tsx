import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { AuthUser } from "@/lib/auth";

const getErrorMessage = (err: unknown, fallback: string) => {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err.trim()) return err;
  if (typeof err === "object" && err !== null && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
};

export interface UserFormValues {
  username: string;
  full_name: string;
  role: 'admin' | 'dosen' | 'pegawai' | 'mahasiswa';
  password?: string;
  unit_kerja?: string;
  secondary_location?: string[] | null;
}

export interface UserData extends Omit<AuthUser, 'id'> {
  id: string;
  created_at: string;
  unit_kerja?: string | null;
  updated_at?: string | null;
  is_struktural?: boolean;
}

export const useUserManagement = () => {
  const [app_users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Use RPC function for secure data access
      const { data, error } = await supabase.rpc('get_all_users');

      if (error) {
        console.error("Error loading users:", error);
        throw new Error("Gagal memuat data pengguna: " + error.message);
      }
      setUsers((data as UserData[]) || []);
    } catch (err: unknown) {
      console.error("Error loading users:", err);
      setError(getErrorMessage(err, "Gagal memuat data pengguna."));
    } finally {
      setLoading(false);
    }
  }, []);

  const createUser = async (values: UserFormValues) => {
    setError(null);
    
    // Validate input
    if (!values.username?.trim()) {
      const errorMessage = "Username harus diisi.";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
    
    if (!values.full_name?.trim()) {
      const errorMessage = "Nama lengkap harus diisi.";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
    
    if (!values.password) {
      const errorMessage = "Password harus diisi untuk pengguna baru.";
      setError(errorMessage);
      throw new Error(errorMessage);
    }

    if (values.password.length < 6) {
      const errorMessage = "Password minimal 6 karakter.";
      setError(errorMessage);
      throw new Error(errorMessage);
    }

    try {
      // Use RPC function for secure user creation (handles password hashing internally)
      const { error } = await supabase.rpc('create_user', {
        p_username: values.username.trim(),
        p_password: values.password,
        p_full_name: values.full_name.trim(),
        p_role: values.role,
        p_unit_kerja: values.unit_kerja?.trim() || null,
        p_secondary_location: values.secondary_location || null,
      });

      if (error) {
        console.error("Database error:", error);
        if (error.message?.includes('sudah ada') || error.code === '23505') {
          const errorMessage = `Username '${values.username}' sudah digunakan.`;
          setError(errorMessage);
          throw new Error(errorMessage);
        }
        throw new Error("Gagal menambahkan pengguna: " + error.message);
      }
      
      // Reload users to get fresh data
      await loadUsers();
      return true;
    } catch (err: unknown) {
      console.error("Error creating user:", err);
      const errorMessage = getErrorMessage(err, "Gagal menambahkan pengguna.");
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateUser = async (id: string, values: Partial<UserFormValues>) => {
    setError(null);
    
    // Validate input
    if (values.username !== undefined && !values.username?.trim()) {
      const errorMessage = "Username tidak boleh kosong.";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
    
    if (values.full_name !== undefined && !values.full_name?.trim()) {
      const errorMessage = "Nama lengkap tidak boleh kosong.";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
    
    if (values.password && values.password.length < 6) {
      const errorMessage = "Password minimal 6 karakter.";
      setError(errorMessage);
      throw new Error(errorMessage);
    }

    try {
      // Use RPC function for secure user update (handles password hashing internally)
      const updatePayload: Record<string, unknown> = {
        p_user_id: id,
        p_username: values.username?.trim() || null,
        p_password: values.password || null,
        p_full_name: values.full_name?.trim() || null,
        p_role: values.role || null,
        p_unit_kerja: values.unit_kerja?.trim() || null,
      };

      if (values.secondary_location !== undefined) {
        updatePayload.p_secondary_location = values.secondary_location ?? null;
      }

      const { data: success, error } = await supabase.rpc('update_user', updatePayload);

      if (error) {
        console.error("Database error:", error);
        if (error.message?.includes('sudah ada') || error.code === '23505') {
          const errorMessage = `Username '${values.username}' sudah digunakan.`;
          setError(errorMessage);
          throw new Error(errorMessage);
        }
        throw new Error("Gagal memperbarui pengguna: " + error.message);
      }

      if (!success) {
        throw new Error("Pengguna tidak ditemukan.");
      }

      // Reload users to get fresh data
      await loadUsers();
      return true;
    } catch (err: unknown) {
      console.error("Error updating user:", err);
      const errorMessage = getErrorMessage(err, "Gagal memperbarui pengguna.");
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteUser = async (id: string) => {
    setError(null);
    try {
      // First check if user exists using select (still allowed by RLS)
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('id', id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          throw new Error("Pengguna tidak ditemukan.");
        }
        throw fetchError;
      }

      // Use RPC function for secure user deletion (handles cascade internally)
      const { data: success, error } = await supabase.rpc('delete_user', {
        p_user_id: id
      });

      if (error) {
        console.error("Delete error:", error);
        throw new Error("Gagal menghapus pengguna: " + error.message);
      }

      if (!success) {
        throw new Error(`Pengguna '${existingUser.full_name}' tidak ditemukan.`);
      }

      setUsers(prev => prev.filter(u => u.id !== id));
      return true;
    } catch (err: unknown) {
      console.error("Error deleting user:", err);
      const errorMessage = getErrorMessage(err, "Gagal menghapus pengguna.");
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return {
    users: app_users,
    loading,
    error,
    loadUsers,
    createUser,
    updateUser,
    deleteUser,
  };
};
