"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  ShieldCheck,
  Search,
  Users,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight,
  Clock,
  Check,
  X,
  Inbox,
  Folder,
  SlidersHorizontal,
  HelpCircle,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

type UserRow = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  has_rapidfs_access: boolean;
  rapidfs_request_status?: "pending" | "approved" | "rejected" | null;
  rapidfs_requested_at?: string | null;
  rapidfs_request_project?: string | null;
  profile_image?: string | null;
};

export default function RapidRequestsPage() {
  const params = useParams();
  const lang = (params?.lang as string) || "en";
  const isId = lang === "id";

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAccess, setFilterAccess] = useState<"all" | "pending" | "granted" | "locked">("all");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 15;

  const getToken = () =>
    localStorage.getItem("access_token") || localStorage.getItem("token") || "";

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      let res = await fetch(`${API_URL}/users/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok && res.status === 404) {
        res = await fetch(`${API_URL}/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      if (!res.ok) throw new Error(isId ? "Gagal mengambil data pengguna" : "Failed to load users");
      const data = await res.json();
      const rawList = Array.isArray(data) ? data : data.users || data.items || data.data || [];
      const list: UserRow[] = rawList.map(
        (u: any) => ({
          id: String(u.id || u._id),
          full_name: u.full_name || u.name || "—",
          email: u.email || "",
          role: u.role || "client",
          has_rapidfs_access: !!u.has_rapidfs_access,
          rapidfs_request_status: u.rapidfs_request_status || null,
          rapidfs_requested_at: u.rapidfs_requested_at || null,
          rapidfs_request_project: u.rapidfs_request_project || null,
          profile_image: u.profile_image || u.avatar || u.image_url || null,
        })
      );
      // Tampilkan semua client/user dan siapa saja yang meminta akses atau telah memiliki akses
      setUsers(
        list.filter(
          (u) =>
            u.rapidfs_request_status === "pending" ||
            u.has_rapidfs_access ||
            (u.role !== "admin" && u.role !== "super_admin")
        )
      );
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat memuat data.");
    } finally {
      setLoading(false);
    }
  }, [isId]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleAccess = async (userId: string, currentAccess: boolean) => {
    setTogglingId(userId);
    setError(null);
    setSuccessMsg(null);
    try {
      const token = getToken();
      const newAccess = !currentAccess;
      const res = await fetch(
        `${API_URL}/users/${userId}/rapidfs-access?has_access=${newAccess}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Gagal mengubah hak akses.");
      }
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                has_rapidfs_access: newAccess,
                rapidfs_request_status: newAccess
                  ? "approved"
                  : u.rapidfs_request_status === "pending"
                  ? "rejected"
                  : null,
              }
            : u
        )
      );
      const user = users.find((u) => u.id === userId);
      setSuccessMsg(
        isId
          ? `Izin akses laporan penuh untuk ${user?.full_name || "pengguna"} berhasil ${
              newAccess ? "diaktifkan" : "dimatikan"
            }.`
          : `Full report access for ${user?.full_name || "user"} has been ${
              newAccess ? "activated" : "deactivated"
            }.`
      );
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || "Gagal memperbarui izin akses.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleRejectRequest = async (userId: string) => {
    setTogglingId(userId);
    setError(null);
    setSuccessMsg(null);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/users/${userId}/rapidfs-reject`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Gagal menolak permintaan.");
      }
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, has_rapidfs_access: false, rapidfs_request_status: "rejected" }
            : u
        )
      );
      const user = users.find((u) => u.id === userId);
      setSuccessMsg(
        isId
          ? `Permintaan akses dari ${user?.full_name || "pengguna"} telah ditolak.`
          : `Access request from ${user?.full_name || "user"} has been rejected.`
      );
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || "Gagal menolak permintaan.");
    } finally {
      setTogglingId(null);
    }
  };

  const pendingCount = users.filter(
    (u) => u.rapidfs_request_status === "pending" && !u.has_rapidfs_access
  ).length;
  const grantedCount = users.filter((u) => u.has_rapidfs_access).length;
  const lockedCount = users.filter((u) => !u.has_rapidfs_access).length;

  const filteredUsers = users
    .filter((u) => {
      const matchesSearch =
        u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.rapidfs_request_project &&
          u.rapidfs_request_project.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesFilter =
        filterAccess === "all" ||
        (filterAccess === "pending" &&
          u.rapidfs_request_status === "pending" &&
          !u.has_rapidfs_access) ||
        (filterAccess === "granted" && u.has_rapidfs_access) ||
        (filterAccess === "locked" && !u.has_rapidfs_access);
      return matchesSearch && matchesFilter;
    })
    // Urutkan permintaan pending di paling atas
    .sort((a, b) => {
      const aPending = a.rapidfs_request_status === "pending" && !a.has_rapidfs_access ? 1 : 0;
      const bPending = b.rapidfs_request_status === "pending" && !b.has_rapidfs_access ? 1 : 0;
      if (aPending !== bPending) return bPending - aPending;
      return a.full_name.localeCompare(b.full_name);
    });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / perPage));
  const paginatedUsers = filteredUsers.slice((page - 1) * perPage, page * perPage);

  const BACKEND_ORIGIN = API_URL.replace(/\/api\/v1\/?$/, "");
  const resolveImage = (url?: string | null) => {
    if (!url) return null;
    if (url.startsWith("http") || url.startsWith("data:")) return url;
    return `${BACKEND_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const formatRequestedDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat(isId ? "id-ID" : "en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              {isId ? "Kelola Akses Rapid-FS" : "Manage Rapid-FS Access"}
            </h1>
          </div>
          <p className="text-sm text-slate-500 font-medium pl-[52px]">
            {isId
              ? "Atur siapa saja pengguna yang boleh membuka laporan lengkap Rapid-FS (analisis keuangan, karbon, dan unduh PDF)."
              : "Control which users can unlock the full Rapid-FS report (financial projections, carbon stock, and PDF download)."}
          </p>
        </div>
        <button
          type="button"
          onClick={fetchUsers}
          disabled={loading}
          className="inline-flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-60 shadow-xs shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-600" : ""}`} />
          {isId ? "Muat Ulang" : "Refresh"}
        </button>
      </div>

      {/* Banner Permintaan Baru (Pending) */}
      {pendingCount > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/80 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-amber-950">
                {isId
                  ? `Ada ${pendingCount} Permintaan Akses yang Perlu Ditinjau`
                  : `${pendingCount} Access Requests Need Review`}
              </p>
              <p className="text-xs text-amber-900/80 font-medium mt-0.5">
                {isId
                  ? "Pengguna telah menjalankan analisis awal dan meminta izin membuka hasil lengkap. Cukup geser sakelar (switch) ke kanan untuk mengizinkan."
                  : "Users have run a preliminary analysis and requested full report access. Simply toggle their switch to grant permission."}
              </p>
            </div>
          </div>
          {filterAccess !== "pending" && (
            <button
              type="button"
              onClick={() => {
                setFilterAccess("pending");
                setPage(1);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs shrink-0 active:scale-95"
            >
              <span>{isId ? "Tinjau Permintaan" : "Review Requests"}</span>
              <span className="w-5 h-5 rounded-full bg-white text-amber-700 text-[11px] font-extrabold flex items-center justify-center">
                {pendingCount}
              </span>
            </button>
          )}
        </div>
      )}

      {/* Ringkasan Status (Stats Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pengguna */}
        <div
          onClick={() => {
            setFilterAccess("all");
            setPage(1);
          }}
          className={`cursor-pointer rounded-2xl border p-5 shadow-xs flex items-center gap-4 transition-all hover:scale-[1.01] ${
            filterAccess === "all"
              ? "bg-emerald-50/60 border-emerald-300 ring-2 ring-emerald-500/20"
              : "bg-white border-slate-200/80"
          }`}
        >
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200/60 shrink-0">
            <Users className="w-6 h-6 text-slate-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest truncate">
              {isId ? "Semua Pengguna" : "Total Users"}
            </p>
            <p className="text-2xl font-extrabold text-slate-900">{users.length}</p>
          </div>
        </div>

        {/* Perlu Ditinjau */}
        <div
          onClick={() => {
            setFilterAccess("pending");
            setPage(1);
          }}
          className={`cursor-pointer rounded-2xl border p-5 shadow-xs flex items-center gap-4 transition-all hover:scale-[1.01] ${
            filterAccess === "pending"
              ? "bg-amber-50/90 border-amber-300 ring-2 ring-amber-400/20"
              : "bg-white border-amber-200"
          }`}
        >
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-200 shrink-0 relative">
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-ping" />
            )}
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-amber-700 uppercase tracking-widest truncate">
              {isId ? "Perlu Ditinjau" : "Needs Review"}
            </p>
            <p className="text-2xl font-extrabold text-amber-600">{pendingCount}</p>
          </div>
        </div>

        {/* Akses Terbuka */}
        <div
          onClick={() => {
            setFilterAccess("granted");
            setPage(1);
          }}
          className={`cursor-pointer rounded-2xl border p-5 shadow-xs flex items-center gap-4 transition-all hover:scale-[1.01] ${
            filterAccess === "granted"
              ? "bg-emerald-50/90 border-emerald-300 ring-2 ring-emerald-500/20"
              : "bg-white border-emerald-100"
          }`}
        >
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100 shrink-0">
            <Unlock className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-widest truncate">
              {isId ? "Akses Terbuka" : "Access Active"}
            </p>
            <p className="text-2xl font-extrabold text-emerald-700">{grantedCount}</p>
          </div>
        </div>

        {/* Akses Terkunci */}
        <div
          onClick={() => {
            setFilterAccess("locked");
            setPage(1);
          }}
          className={`cursor-pointer rounded-2xl border p-5 shadow-xs flex items-center gap-4 transition-all hover:scale-[1.01] ${
            filterAccess === "locked"
              ? "bg-slate-100 border-slate-300 ring-2 ring-slate-400/20"
              : "bg-white border-slate-200"
          }`}
        >
          <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200 shrink-0">
            <Lock className="w-6 h-6 text-slate-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest truncate">
              {isId ? "Akses Terkunci" : "Access Locked"}
            </p>
            <p className="text-2xl font-extrabold text-slate-700">{lockedCount}</p>
          </div>
        </div>
      </div>

      {/* Pesan Toast / Alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-[13px] font-medium flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-[13px] font-medium flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 shadow-xs">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Pencarian & Filter Tab */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={
              isId
                ? "Cari nama pengguna, email, atau nama proyek..."
                : "Search user name, email, or project..."
            }
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-[13px] font-medium text-slate-800 outline-none focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100 transition-all shadow-xs"
          />
        </div>
        <div className="flex flex-wrap bg-white border border-slate-200 p-1 rounded-xl shrink-0 gap-1">
          {(
            [
              { id: "all", label: isId ? "Semua" : "All", count: users.length },
              {
                id: "pending",
                label: isId ? "Perlu Ditinjau" : "Needs Review",
                count: pendingCount,
              },
              {
                id: "granted",
                label: isId ? "Sudah Diberi Akses" : "Has Access",
                count: grantedCount,
              },
              {
                id: "locked",
                label: isId ? "Belum Diberi Akses" : "No Access",
                count: lockedCount,
              },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setFilterAccess(f.id);
                setPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-bold rounded-lg transition-all ${
                filterAccess === f.id
                  ? f.id === "pending"
                    ? "bg-amber-500 text-white shadow-xs"
                    : "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <span>{f.label}</span>
              <span
                className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                  filterAccess === f.id
                    ? "bg-white/20 text-white"
                    : f.id === "pending" && f.count > 0
                    ? "bg-amber-100 text-amber-800"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {f.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Tabel & Daftar Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-4" />
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                {isId ? "Memuat data pengguna..." : "Loading users..."}
              </p>
            </div>
          </div>
        ) : paginatedUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
              <Inbox className="w-7 h-7 text-slate-300" />
            </div>
            <p className="text-sm font-bold text-slate-700 mb-1">
              {filterAccess === "pending"
                ? isId
                  ? "Tidak ada permohonan yang menunggu peninjauan"
                  : "No requests waiting for review"
                : isId
                ? "Tidak ada data pengguna yang sesuai"
                : "No matching users found"}
            </p>
            <p className="text-xs text-slate-400 font-medium">
              {isId ? "Coba ganti kata kunci pencarian atau ubah filter tab." : "Try adjusting your search or filter tab."}
            </p>
          </div>
        ) : (
          <>
            {/* Tabel Desktop */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    <th className="text-left px-6 py-4 text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">
                      {isId ? "Pengguna" : "User"}
                    </th>
                    <th className="text-left px-6 py-4 text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">
                      Email
                    </th>
                    <th className="text-left px-6 py-4 text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">
                      {isId ? "Keterangan Permintaan" : "Request Details"}
                    </th>
                    <th className="text-center px-6 py-4 text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">
                      {isId ? "Status" : "Status"}
                    </th>
                    <th className="text-center px-6 py-4 text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">
                      {isId ? "Beri Akses" : "Grant Access"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((user, idx) => {
                    const imgSrc = resolveImage(user.profile_image);
                    const isToggling = togglingId === user.id;
                    const isPending =
                      user.rapidfs_request_status === "pending" && !user.has_rapidfs_access;

                    return (
                      <tr
                        key={user.id}
                        className={`border-b border-slate-100 hover:bg-slate-50/80 transition-colors ${
                          isPending
                            ? "bg-amber-50/40"
                            : idx % 2 === 0
                            ? "bg-white"
                            : "bg-slate-50/20"
                        }`}
                      >
                        {/* Kolom Pengguna */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center font-extrabold text-xs shrink-0">
                              {imgSrc ? (
                                <img src={imgSrc} alt="" className="w-full h-full object-cover" />
                              ) : (
                                getInitials(user.full_name)
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[14px] font-bold text-slate-900 truncate max-w-[200px]">
                                {user.full_name}
                              </p>
                              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                                {user.role.replace("_", " ")}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Kolom Email */}
                        <td className="px-6 py-4 text-[13px] text-slate-600 font-medium truncate max-w-[220px]">
                          {user.email}
                        </td>

                        {/* Kolom Keterangan Permintaan */}
                        <td className="px-6 py-4">
                          {isPending ? (
                            <div className="space-y-1">
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[11px] font-extrabold">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                {isId ? "Minta Akses Laporan" : "Requested Full Access"}
                              </div>
                              {user.rapidfs_request_project && (
                                <p className="text-[12px] font-semibold text-slate-700 truncate max-w-[220px]">
                                  📁 {user.rapidfs_request_project}
                                </p>
                              )}
                              {user.rapidfs_requested_at && (
                                <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  {formatRequestedDate(user.rapidfs_requested_at)}
                                </p>
                              )}
                            </div>
                          ) : user.has_rapidfs_access ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-emerald-700">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                {isId ? "Laporan Lengkap Terbuka" : "Full Access Granted"}
                              </span>
                              {user.rapidfs_request_project && (
                                <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                                  {user.rapidfs_request_project}
                                </p>
                              )}
                            </div>
                          ) : user.rapidfs_request_status === "rejected" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 text-[11px] font-bold border border-rose-200/60">
                              <X className="w-3 h-3" />
                              {isId ? "Permintaan Pernah Ditolak" : "Request Rejected"}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">
                              {isId ? "Belum mengajukan permintaan" : "No request yet"}
                            </span>
                          )}
                        </td>

                        {/* Kolom Status */}
                        <td className="px-6 py-4 text-center">
                          {user.has_rapidfs_access ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-extrabold rounded-xl border border-emerald-200">
                              <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                              {isId ? "Terbuka" : "Active"}
                            </span>
                          ) : isPending ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 text-[11px] font-extrabold rounded-xl border border-amber-300 animate-pulse">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              {isId ? "Menunggu" : "Pending"}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 text-[11px] font-extrabold rounded-xl border border-slate-200">
                              <Lock className="w-3.5 h-3.5 text-slate-400" />
                              {isId ? "Terkunci" : "Locked"}
                            </span>
                          )}
                        </td>

                        {/* Kolom Beri Akses (Switch Animasi) */}
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-3">
                            {/* Tombol Toggle Switch Animasi */}
                            <button
                              type="button"
                              role="switch"
                              aria-checked={user.has_rapidfs_access}
                              onClick={() =>
                                handleToggleAccess(user.id, user.has_rapidfs_access)
                              }
                              disabled={isToggling}
                              title={
                                user.has_rapidfs_access
                                  ? isId
                                    ? "Klik untuk mematikan/mengunci akses"
                                    : "Click to lock access"
                                  : isId
                                  ? "Klik untuk membuka/memberikan akses"
                                  : "Click to grant access"
                              }
                              className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full p-0.5 border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-wait ${
                                user.has_rapidfs_access
                                  ? "bg-emerald-600"
                                  : isPending
                                  ? "bg-amber-300 hover:bg-amber-400"
                                  : "bg-slate-200 hover:bg-slate-300"
                              }`}
                            >
                              <span
                                className={`pointer-events-none flex h-5 w-5 transform items-center justify-center rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${
                                  user.has_rapidfs_access ? "translate-x-5" : "translate-x-0"
                                }`}
                              >
                                {isToggling ? (
                                  <div className="w-3 h-3 border-2 border-slate-300 border-t-emerald-600 rounded-full animate-spin" />
                                ) : user.has_rapidfs_access ? (
                                  <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                                ) : (
                                  <Lock className="w-2.5 h-2.5 text-slate-400" />
                                )}
                              </span>
                            </button>

                            {/* Label status teks switch */}
                            <span
                              className={`text-[12px] font-bold select-none min-w-[50px] text-left ${
                                user.has_rapidfs_access
                                  ? "text-emerald-700"
                                  : isPending
                                  ? "text-amber-700"
                                  : "text-slate-500"
                              }`}
                            >
                              {user.has_rapidfs_access
                                ? isId
                                  ? "Aktif"
                                  : "Active"
                                : isPending
                                ? isId
                                  ? "Nyalakan"
                                  : "Turn ON"
                                : isId
                                ? "Mati"
                                : "Off"}
                            </span>

                            {/* Tombol Tolak jika ada permintaan pending */}
                            {isPending && (
                              <button
                                type="button"
                                onClick={() => handleRejectRequest(user.id)}
                                disabled={isToggling}
                                title={isId ? "Tolak permintaan ini" : "Reject this request"}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all active:scale-95 disabled:opacity-50"
                              >
                                <X className="w-3 h-3" />
                                <span>{isId ? "Tolak" : "Reject"}</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Tampilan Mobile Card */}
            <div className="lg:hidden divide-y divide-slate-100">
              {paginatedUsers.map((user) => {
                const imgSrc = resolveImage(user.profile_image);
                const isToggling = togglingId === user.id;
                const isPending =
                  user.rapidfs_request_status === "pending" && !user.has_rapidfs_access;

                return (
                  <div
                    key={user.id}
                    className={`p-5 flex flex-col gap-4 ${isPending ? "bg-amber-50/40" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-xl overflow-hidden bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center font-extrabold text-xs shrink-0">
                          {imgSrc ? (
                            <img src={imgSrc} alt="" className="w-full h-full object-cover" />
                          ) : (
                            getInitials(user.full_name)
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[14px] font-bold text-slate-800 truncate">
                            {user.full_name}
                          </p>
                          <p className="text-[12px] text-slate-500 font-medium truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>

                      {user.has_rapidfs_access ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-extrabold rounded-lg border border-emerald-100 shrink-0">
                          <Unlock className="w-3 h-3" />
                          {isId ? "Terbuka" : "Active"}
                        </span>
                      ) : isPending ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 text-[11px] font-extrabold rounded-lg border border-amber-200 shrink-0 animate-pulse">
                          <Clock className="w-3 h-3 text-amber-600" />
                          {isId ? "Menunggu" : "Pending"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 text-[11px] font-extrabold rounded-lg border border-slate-200 shrink-0">
                          <Lock className="w-3 h-3" />
                          {isId ? "Terkunci" : "Locked"}
                        </span>
                      )}
                    </div>

                    {/* Detail Permintaan Mobile */}
                    {isPending && (
                      <div className="p-3 bg-amber-100/70 rounded-xl border border-amber-200 space-y-1 text-xs text-amber-950 font-medium">
                        <p className="font-extrabold flex items-center gap-1.5 text-amber-900">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          {isId ? "Mengajukan Permintaan Akses Laporan" : "Requested Full Report Access"}
                        </p>
                        {user.rapidfs_request_project && (
                          <p className="text-slate-700">📁 {user.rapidfs_request_project}</p>
                        )}
                        {user.rapidfs_requested_at && (
                          <p className="text-slate-500 text-[11px]">
                            {formatRequestedDate(user.rapidfs_requested_at)}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Baris Switch Akses Mobile */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          {isId ? "Izin Laporan Penuh" : "Full Report Access"}
                        </span>
                        <span
                          className={`text-[13px] font-extrabold ${
                            user.has_rapidfs_access
                              ? "text-emerald-700"
                              : isPending
                              ? "text-amber-700"
                              : "text-slate-600"
                          }`}
                        >
                          {user.has_rapidfs_access
                            ? isId
                              ? "Akses Aktif (Terbuka)"
                              : "Active (Granted)"
                            : isPending
                            ? isId
                              ? "Perlu Ditinjau"
                              : "Needs Review"
                            : isId
                            ? "Akses Terkunci"
                            : "Locked"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {isPending && (
                          <button
                            type="button"
                            onClick={() => handleRejectRequest(user.id)}
                            disabled={isToggling}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all active:scale-95"
                          >
                            {isId ? "Tolak" : "Reject"}
                          </button>
                        )}

                        {/* Switch Mobile */}
                        <button
                          type="button"
                          role="switch"
                          aria-checked={user.has_rapidfs_access}
                          onClick={() =>
                            handleToggleAccess(user.id, user.has_rapidfs_access)
                          }
                          disabled={isToggling}
                          className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full p-0.5 border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none disabled:opacity-50 ${
                            user.has_rapidfs_access
                              ? "bg-emerald-600"
                              : isPending
                              ? "bg-amber-300"
                              : "bg-slate-300"
                          }`}
                        >
                          <span
                            className={`pointer-events-none flex h-5 w-5 transform items-center justify-center rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${
                              user.has_rapidfs_access ? "translate-x-5" : "translate-x-0"
                            }`}
                          >
                            {isToggling ? (
                              <div className="w-3 h-3 border-2 border-slate-300 border-t-emerald-600 rounded-full animate-spin" />
                            ) : user.has_rapidfs_access ? (
                              <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                            ) : (
                              <Lock className="w-2.5 h-2.5 text-slate-400" />
                            )}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/40">
                <p className="text-[12px] font-medium text-slate-500">
                  {isId
                    ? `Halaman ${page} dari ${totalPages} · Total ${filteredUsers.length} pengguna`
                    : `Page ${page} of ${totalPages} · Total ${filteredUsers.length} users`}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Petunjuk Penggunaan Sederhana */}
      <div className="p-6 bg-slate-50/80 border border-slate-200 rounded-2xl">
        <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-emerald-600" />
          <span>{isId ? "Petunjuk Pengelolaan Akses" : "Access Management Guide"}</span>
        </p>
        <ul className="space-y-2.5 text-[13px] text-slate-600 font-medium leading-relaxed">
          <li className="flex items-start gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
            <span>
              {isId ? (
                <>
                  <strong>Sakelar Aktif (Hijau):</strong> Pengguna dapat melihat semua hasil analisis lanjutan seperti proyeksi finansial (biaya & pendapatan), cadangan karbon, skor kelayakan, serta mengunduh berkas laporan PDF.
                </>
              ) : (
                <>
                  <strong>Switch Active (Green):</strong> User can see all advanced analysis metrics including financial projections, carbon credits, feasibility scoring, and download PDF reports.
                </>
              )}
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-2 h-2 rounded-full bg-slate-400 mt-2 shrink-0" />
            <span>
              {isId ? (
                <>
                  <strong>Sakelar Mati (Abu-abu):</strong> Hasil analisis lanjutan pengguna terkunci. Pengguna hanya dapat melihat preview peta spasial dan metrik dasar ekosistem.
                </>
              ) : (
                <>
                  <strong>Switch Off (Gray):</strong> User&apos;s advanced results are locked. They can only view the spatial map preview and basic ecosystem metrics.
                </>
              )}
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 mt-2 shrink-0" />
            <span>
              {isId ? (
                <>
                  <strong>Permintaan Masuk:</strong> Jika pengguna menekan tombol minta akses di halaman Rapid-FS, akun mereka otomatis diberi tanda kuning dan ditempatkan di paling atas daftar agar Anda mudah menyetujuinya.
                </>
              ) : (
                <>
                  <strong>Incoming Requests:</strong> When users click the request access button in Rapid-FS, their account is flagged in amber and placed at the top of the list for easy approval.
                </>
              )}
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
