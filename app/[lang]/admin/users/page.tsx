"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Users,
  X,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Pencil,
  ShieldCheck,
  User as UserIcon,
  Crown,
  ChevronDown,
  Mail,
  Phone,
  Lock,
  Camera,
} from "lucide-react";
import { extractErrorMessage, getErrorMessage } from "@/lib/error";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

type UserItem = {
  id: number;
  email: string;
  full_name: string;
  role: string;
  phone_number?: string | null;
  is_active?: boolean;
  profile_image?: string | null;
};

const emptyForm = {
  email: "",
  password: "",
  full_name: "",
  phone_number: "",
  role: "client",
};

const roleOptions = [
  { value: "client", label: "Client (Pengguna Standar)" },
  { value: "admin", label: "Admin (Akses Dasar)" },
  { value: "super_admin", label: "Super Admin (Akses Penuh)" },
];

const rolePriority: Record<string, number> = {
  super_admin: 1,
  admin: 2,
  client: 3,
};

export default function AdminUsersPage() {
  const params = useParams();
  const router = useRouter();
  const lang = (params?.lang as string) || "en";
  const isId = lang === "id";

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // States untuk UI
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  
  // Dropdown States
  const [roleOpen, setRoleOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [filterRole, setFilterRole] = useState("all");

  const filterOptions = [
    { value: "all", label: isId ? "Semua Role" : "All Roles" },
    { value: "super_admin", label: "Super Admin" },
    { value: "admin", label: "Admin" },
    { value: "client", label: "Client" },
  ];

  const token = () => localStorage.getItem("access_token");

  const getImageUrl = (path?: string | null) => {
    if (!path) return null;
    if (path.startsWith("blob:") || path.startsWith("http")) return path;
    return `${API_URL.replace("/api/v1", "")}${path.startsWith("/") ? "" : "/"}${path}`;
  };

  const uploadProfileImage = async (userId: number) => {
    if (!profileImage) return;

    const formData = new FormData();
    formData.append("file", profileImage);

    const res = await fetch(`${API_URL}/users/${userId}/profile-image`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token()}`,
      },
      body: formData,
    });

    if (!res.ok) {
      throw new Error(
        await extractErrorMessage(
          res,
          isId ? "Gagal upload foto profil" : "Failed to upload profile image",
          lang
        )
      );
    }
  };

  // Auto-dismiss popup modal
  useEffect(() => {
    if (success || (error && !userToDelete)) {
      const timer = setTimeout(() => {
        setSuccess(null);
        if (!userToDelete) setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error, userToDelete]);

  const loadUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/users/`, {
        headers: {
          Authorization: `Bearer ${token()}`,
        },
      });

      if (res.status === 403) {
        setError(
          isId
            ? "Hanya Super Admin yang dapat mengakses."
            : "Super Admin only."
        );
        setUsers([]);
        return;
      }

      if (!res.ok) {
        throw new Error(
          await extractErrorMessage(
            res,
            isId ? "Gagal memuat pengguna" : "Failed to load users",
            lang
          )
        );
      }

      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const t = token();
      if (!t) {
        router.push(`/${lang}/login`);
        return;
      }

      try {
        const meRes = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${t}`,
          },
        });

        if (!meRes.ok) {
          router.push(`/${lang}/login`);
          return;
        }

        const me = await meRes.json();
        if (me.role !== "super_admin") {
          setError(
            isId
              ? "Hanya Super Admin yang dapat mengakses."
              : "Super Admin only."
          );
          setLoading(false);
          return;
        }

        await loadUsers();
      } catch {
        router.push(`/${lang}/login`);
      }
    };

    init();
  }, [lang, router, isId]);

  const openCreate = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setProfileImage(null);
    setPreviewImage(null);
    setShowForm(true);
    setError(null);
    setSuccess(null);
    setRoleOpen(false);
  };

  const openEdit = (user: UserItem) => {
    setEditingUser(user);
    setForm({
      email: user.email,
      password: "",
      full_name: user.full_name || "",
      phone_number: user.phone_number || "",
      role: user.role || "client",
    });
    setProfileImage(null);
    setPreviewImage(user.profile_image || null);
    setShowForm(true);
    setError(null);
    setSuccess(null);
    setRoleOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingUser(null);
    setForm(emptyForm);
    setProfileImage(null);
    setPreviewImage(null);
    setRoleOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (editingUser) {
        const payload: Record<string, string> = {
          email: form.email.trim(),
          full_name: form.full_name,
          phone_number: form.phone_number,
          role: form.role,
        };

        if (form.password.trim()) {
          payload.password = form.password;
        }

        const res = await fetch(`${API_URL}/users/${editingUser.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token()}`,
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error(
            await extractErrorMessage(
              res,
              isId ? "Gagal memperbarui pengguna" : "Failed to update user",
              lang
            )
          );
        }

        await uploadProfileImage(editingUser.id);
        setSuccess(
          isId ? "Pengguna berhasil diperbarui!" : "User successfully updated!"
        );
      } else {
        const res = await fetch(`${API_URL}/users/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token()}`,
          },
          body: JSON.stringify({
            email: form.email,
            password: form.password,
            full_name: form.full_name,
            phone_number: form.phone_number || undefined,
            role: form.role,
          }),
        });

        if (!res.ok) {
          throw new Error(
            await extractErrorMessage(
              res,
              isId ? "Gagal membuat pengguna" : "Failed to create user",
              lang
            )
          );
        }

        const createdUser = await res.json();
        await uploadProfileImage(createdUser.id);
        setSuccess(
          isId ? "Pengguna berhasil dibuat!" : "User successfully created!"
        );
      }

      closeForm();
      await loadUsers();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;

    setDeletingId(userToDelete.id);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/users/${userToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token()}`,
        },
      });

      if (!res.ok) {
        throw new Error(
          await extractErrorMessage(
            res,
            isId ? "Gagal menghapus pengguna" : "Failed to delete user",
            lang
          )
        );
      }

      setSuccess(
        isId ? "Pengguna berhasil dihapus!" : "User successfully deleted!"
      );
      setUserToDelete(null);
      await loadUsers();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      setUserToDelete(null);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredUsers = users
    .filter((u) => (filterRole === "all" ? true : u.role === filterRole))
    .sort(
      (a, b) =>
        (rolePriority[a.role] || 99) - (rolePriority[b.role] || 99)
    );

  const roleBadge = (role: string) => {
    if (role === "super_admin") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 shadow-sm">
          <Crown className="w-3 h-3" />
          Super Admin
        </span>
      );
    }
    if (role === "admin") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 shadow-sm">
          <ShieldCheck className="w-3 h-3" />
          Admin
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 shadow-sm">
        <UserIcon className="w-3 h-3" />
        Client
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
      </div>
    );
  }

  // Input styling yang lebih kecil & proporsional
  const inputClassName = "w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all duration-200 shadow-sm bg-slate-50 focus:bg-white text-slate-800 text-sm font-medium";

  return (
    // Padding atas dikurangi (pt-0 atau pt-2) dan margin atas negatif (-mt-4 atau -mt-6) agar menempel/mendekati header
    <div className="max-w-5xl mx-auto px-4 pb-8 pt-0 md:-mt-4 font-sans selection:bg-emerald-200">
      
      {/* HEADER CARD: Skala diturunkan (p-6, rounded-2xl) */}
      <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              {isId ? "Manajemen Pengguna" : "User Management"}
            </h1>
            <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
              {isId
                ? "Kelola akun, role, dan foto profil pengguna."
                : "Manage accounts, roles, and profile photos."}
            </p>
          </div>
        </div>

        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-500 hover:shadow-md transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          {isId ? "Tambah Pengguna" : "Add User"}
        </button>
      </div>

      {/* GLOBAL POPUP MODAL NOTIFICATION */}
      {(error || success) && userToDelete === null && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-8 text-center relative animate-in zoom-in-[0.5] fade-in duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
            {error ? (
              <>
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-rose-100 relative">
                  <div className="absolute inset-0 rounded-full border-2 border-rose-200 animate-ping opacity-50 duration-1000" />
                  <AlertTriangle className="w-8 h-8 text-rose-500 relative z-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2 tracking-tight">
                  {isId ? "Terjadi Kesalahan" : "Action Failed"}
                </h3>
                <p className="text-[13px] text-slate-500 font-medium mb-6 leading-relaxed px-2">
                  {error}
                </p>
                <button
                  onClick={() => setError(null)}
                  className="w-full py-3 bg-rose-50 border border-rose-100 text-rose-600 font-bold rounded-xl hover:bg-rose-100 hover:text-rose-700 transition-all duration-300 active:scale-95 text-sm"
                >
                  {isId ? "Tutup Modal" : "Close"}
                </button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-emerald-100 relative">
                  <div className="absolute inset-0 rounded-full border-2 border-emerald-200 animate-ping opacity-50 duration-1000" />
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 relative z-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2 tracking-tight">
                  {isId ? "Berhasil!" : "Success!"}
                </h3>
                <p className="text-[13px] text-slate-500 font-medium mb-6 leading-relaxed px-2">
                  {success}
                </p>
                <button
                  onClick={() => setSuccess(null)}
                  className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 transition-all duration-300 shadow-md shadow-emerald-900/20 active:scale-95 text-sm"
                >
                  {isId ? "Tutup Modal" : "Close"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* FORM MODAL / CARD */}
      {showForm && (
        <div className="mb-6 bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-md animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {editingUser
                ? isId
                  ? "Edit Pengguna"
                  : "Edit User"
                : isId
                  ? "Tambah Pengguna Baru"
                  : "Create New User"}
            </h2>
            <button
              onClick={closeForm}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* PROFILE IMAGE UPLOAD */}
            <div className="flex items-center gap-5 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-white shadow-sm bg-emerald-100 flex items-center justify-center shrink-0">
                {previewImage ? (
                  <img
                    src={getImageUrl(previewImage) || ""}
                    alt="Profile Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-8 h-8 text-emerald-600/50" />
                )}
              </div>

              <div>
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold cursor-pointer hover:border-emerald-500 hover:text-emerald-700 shadow-sm transition-all">
                  <Camera className="w-3.5 h-3.5" />
                  {isId ? "Ganti Foto Profil" : "Upload Photo"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setProfileImage(file);
                        setPreviewImage(URL.createObjectURL(file));
                      }
                    }}
                  />
                </label>
                <p className="text-[11px] text-slate-400 mt-2 font-medium">
                  JPG / PNG maksimal 5MB
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  {isId ? "Nama Lengkap" : "Full Name"}
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={form.full_name}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, full_name: e.target.value }))
                    }
                    className={inputClassName}
                    placeholder="e.g. John Doe"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className={inputClassName}
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  {isId ? "No. Telepon" : "Phone Number"}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={form.phone_number}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        phone_number: e.target.value,
                      }))
                    }
                    className={inputClassName}
                    placeholder="+62 812 3456 7890"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Password{" "}
                  {editingUser && (
                    <span className="text-slate-400 font-medium">
                      ({isId ? "opsional" : "optional"})
                    </span>
                  )}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required={!editingUser}
                    value={form.password}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, password: e.target.value }))
                    }
                    className={inputClassName}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Role Dropdown */}
              <div className="md:col-span-2 relative">
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Role Akses
                </label>
                
                {roleOpen && (
                  <div className="fixed inset-0 z-10" onClick={() => setRoleOpen(false)} />
                )}

                <button
                  type="button"
                  onClick={() => setRoleOpen((v) => !v)}
                  className="relative z-20 w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all duration-200 shadow-sm text-left text-sm"
                >
                  <span className="font-semibold text-slate-700">
                    {roleOptions.find((r) => r.value === form.role)?.label}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${roleOpen ? "rotate-180" : ""}`} />
                </button>

                {roleOpen && (
                  <div className="absolute z-30 mt-1.5 w-full bg-white border border-slate-100 rounded-xl shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-1.5 space-y-0.5">
                      {roleOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setForm((prev) => ({ ...prev, role: opt.value }));
                            setRoleOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors text-sm ${
                            form.role === opt.value
                              ? "bg-emerald-50 text-emerald-700 font-bold"
                              : "text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-500 shadow-sm disabled:opacity-60 transition-all"
              >
                {saving ? (
                   <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                   <CheckCircle2 className="w-4 h-4" />
                )}
                {saving
                  ? isId
                    ? "Menyimpan..."
                    : "Saving..."
                  : editingUser
                    ? isId
                      ? "Simpan"
                      : "Save"
                    : isId
                      ? "Buat Pengguna"
                      : "Create User"}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="px-6 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-colors"
              >
                {isId ? "Batal" : "Cancel"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FILTER & TOOLS */}
      <div className="mb-4 flex items-center justify-between">
        
        {/* Custom Filter Dropdown */}
        <div className="relative inline-block">
          {filterOpen && (
            <div className="fixed inset-0 z-10" onClick={() => setFilterOpen(false)} />
          )}

          <button
            onClick={() => setFilterOpen((v) => !v)}
            className="relative z-20 flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all duration-200 shadow-sm"
          >
            <Filter className="w-3.5 h-3.5 text-emerald-600" />
            {filterOptions.find(o => o.value === filterRole)?.label}
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 ml-1 transition-transform duration-200 ${filterOpen ? "rotate-180" : ""}`} />
          </button>

          {filterOpen && (
            <div className="absolute left-0 z-30 mt-1.5 w-40 bg-white border border-slate-100 rounded-xl shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-1.5 space-y-0.5">
                {filterOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setFilterRole(opt.value);
                      setFilterOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                      filterRole === opt.value
                        ? "bg-emerald-50 text-emerald-700 font-bold"
                        : "text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="text-xs font-bold text-slate-400">
          Total: <span className="text-emerald-600">{filteredUsers.length}</span>
        </p>
      </div>

      {/* USERS LIST CARDS */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
             <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-3">
               <Users className="w-5 h-5 text-slate-300" />
             </div>
             <p className="text-slate-500 font-medium text-sm">
               {isId ? "Belum ada pengguna yang sesuai." : "No users found."}
             </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors duration-150"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-sm shrink-0">
                    {user.profile_image ? (
                      <img
                        src={getImageUrl(user.profile_image) || ""}
                        alt={user.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserIcon className="w-5 h-5 text-emerald-600/50" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-sm font-bold text-slate-900 leading-none">
                        {user.full_name}
                      </h3>
                      {roleBadge(user.role)}
                    </div>
                    <div className="flex items-center gap-3 text-xs font-medium text-slate-500 mt-1.5">
                      <span className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-slate-400"/> {user.email}</span>
                      {user.phone_number && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-slate-300" />
                          <span className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-400"/> {user.phone_number}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(user)}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm hover:shadow-md transition-all"
                    title={isId ? "Edit" : "Edit"}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setUserToDelete(user)}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 transition-all"
                    title={isId ? "Hapus" : "Delete"}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      {userToDelete !== null && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in zoom-in-[0.5] fade-in duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
            <div className="p-8 md:p-10 text-center">
              <div className="w-16 h-16 bg-rose-50 rounded-[1.2rem] flex items-center justify-center mx-auto mb-5 border border-rose-100 relative">
                <div className="absolute inset-0 rounded-[1.2rem] border-2 border-rose-200 animate-ping opacity-50 duration-1000" />
                <AlertTriangle className="w-8 h-8 text-rose-500 relative z-10" />
              </div>

              <h3 className="text-xl font-bold text-slate-800 mb-2 tracking-tight">
                {isId ? "Hapus Pengguna Ini?" : "Delete This User?"}
              </h3>

              <p className="text-slate-500 text-sm mb-8 leading-relaxed px-2">
                {isId ? "Apakah Anda yakin ingin menghapus akun" : "Are you sure you want to delete account"}{" "}
                <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded inline-block mx-1 truncate max-w-[200px] align-bottom">
                  {userToDelete?.full_name}
                </span>
                ?{" "}
                {isId
                  ? "Tindakan ini permanen dan tidak dapat dibatalkan."
                  : "This action is permanent and cannot be undone."}
              </p>

              <div className="flex flex-col-reverse sm:flex-row gap-3">
                <button
                  onClick={() => setUserToDelete(null)}
                  disabled={deletingId !== null}
                  className="flex-1 py-3 bg-slate-50 border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50 active:scale-95"
                >
                  {isId ? "Batalkan" : "Cancel"}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deletingId !== null}
                  className="flex-1 py-3 bg-rose-600 text-white text-sm font-bold rounded-xl hover:bg-rose-700 disabled:opacity-80 flex items-center justify-center gap-2 transition-all duration-300 shadow-md shadow-rose-600/20 active:scale-95"
                >
                  {deletingId !== null ? (
                    <div className="w-4 h-4 border-2 border-rose-200 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      {isId ? "Ya, Hapus" : "Yes, Delete"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}