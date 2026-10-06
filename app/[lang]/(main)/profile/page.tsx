"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Mail,
  Phone,
  Lock,
  Camera,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Shield,
  Calendar,
  Eye,
  EyeOff,
  LogOut,
  ClipboardList,
  Save,
  KeyRound,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { extractErrorMessage, getErrorMessage } from "@/lib/error";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

function resolveImageUrl(url?: string | null) {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const baseUrl = API_URL.replace(/\/api\/v1\/?$/, "");
  return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
}

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const lang = (params?.lang as string) || "en";
  const isId = lang === "id";

  // Data user dari backend
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form Profile Info
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [savingInfo, setSavingInfo] = useState(false);

  // Form Password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Upload Foto
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Notifikasi Feedback
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto dismiss notification
  useEffect(() => {
    if (!successMsg && !errorMsg) return;
    const timer = setTimeout(() => {
      setSuccessMsg(null);
      setErrorMsg(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [successMsg, errorMsg]);

  // Load user data
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.push(`/${lang}/login?next=/${lang}/profile`);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          localStorage.removeItem("access_token");
          router.push(`/${lang}/login?next=/${lang}/profile`);
          return;
        }

        const data = await res.json();
        setUser(data);
        setFullName(data.full_name || "");
        setEmail(data.email || "");
        setPhoneNumber(data.phone_number || "");
        if (data.profile_image) {
          setImagePreview(resolveImageUrl(data.profile_image));
        }
      } catch (err: unknown) {
        setErrorMsg(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [lang, router]);

  // Handle pilih file foto profil
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.type)) {
      setErrorMsg(
        isId
          ? "Format foto harus JPG, PNG, atau WEBP."
          : "Photo format must be JPG, PNG, or WEBP."
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg(
        isId
          ? "Ukuran foto terlalu besar. Maksimal 5 MB."
          : "Photo file is too large. Maximum size is 5 MB."
      );
      return;
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // Upload foto ke server
  const handleUploadImage = async () => {
    if (!selectedImage) return;
    const token = localStorage.getItem("access_token");
    if (!token) return;

    setUploadingImage(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedImage);

      const res = await fetch(`${API_URL}/auth/me/profile-image`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error(
          await extractErrorMessage(
            res,
            isId ? "Gagal mengunggah foto profil" : "Failed to upload profile photo",
            lang
          )
        );
      }

      const resData = await res.json();
      const newImg = resolveImageUrl(resData.profile_image);
      setImagePreview(newImg);
      setSelectedImage(null);
      setUser((prev: any) => ({ ...prev, profile_image: resData.profile_image }));
      setSuccessMsg(
        isId ? "Foto profil berhasil diperbarui!" : "Profile photo updated successfully!"
      );

      // Notifikasi ke Navbar untuk update avatar
      window.dispatchEvent(new Event("profile-updated"));
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setUploadingImage(false);
    }
  };

  // Simpan data profil (Nama, Email, No. Telp)
  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("access_token");
    if (!token) return;

    if (!fullName.trim()) {
      setErrorMsg(isId ? "Nama lengkap tidak boleh kosong." : "Full name cannot be empty.");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setErrorMsg(isId ? "Alamat email tidak valid." : "Invalid email address.");
      return;
    }

    setSavingInfo(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload: Record<string, string> = {
        full_name: fullName.trim(),
        email: email.trim(),
      };

      if (phoneNumber.trim()) {
        payload.phone_number = phoneNumber.trim();
      }

      const res = await fetch(`${API_URL}/auth/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(
          await extractErrorMessage(
            res,
            isId ? "Gagal memperbarui profil" : "Failed to update profile",
            lang
          )
        );
      }

      const updated = await res.json();
      setUser(updated);
      setSuccessMsg(
        isId
          ? "Data profil Anda berhasil disimpan!"
          : "Your profile details have been saved successfully!"
      );

      // Sinkronisasi dengan Navbar
      window.dispatchEvent(new Event("profile-updated"));
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setSavingInfo(false);
    }
  };

  // Simpan kata sandi baru
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("access_token");
    if (!token) return;

    if (!newPassword) {
      setErrorMsg(isId ? "Masukkan kata sandi baru." : "Please enter a new password.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg(
        isId
          ? "Kata sandi baru minimal harus 6 karakter."
          : "New password must be at least 6 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg(
        isId
          ? "Konfirmasi kata sandi tidak cocok."
          : "Password confirmation does not match."
      );
      return;
    }

    setSavingPassword(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          password: newPassword,
        }),
      });

      if (!res.ok) {
        throw new Error(
          await extractErrorMessage(
            res,
            isId ? "Gagal mengubah kata sandi" : "Failed to change password",
            lang
          )
        );
      }

      setNewPassword("");
      setConfirmPassword("");
      setSuccessMsg(
        isId
          ? "Kata sandi Anda berhasil diperbarui!"
          : "Your password has been updated successfully!"
      );
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setSavingPassword(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    window.location.href = `/${lang}`;
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(isId ? "id-ID" : "en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAF9] pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="h-8 w-48 bg-emerald-100/60 rounded-xl animate-pulse" />
          <div className="h-44 bg-white rounded-3xl border border-slate-200/80 animate-pulse" />
          <div className="grid md:grid-cols-3 gap-6">
            <div className="h-96 bg-white rounded-3xl border border-slate-200/80 animate-pulse md:col-span-2" />
            <div className="h-96 bg-white rounded-3xl border border-slate-200/80 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAF9] pt-28 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* BREADCRUMB & BACK */}
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined" && window.history.length > 1) {
                router.back();
              } else {
                router.push(`/${lang}`);
              }
            }}
            className="inline-flex items-center gap-2 text-sm font-bold text-emerald-800 hover:text-emerald-950 transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>{isId ? "Kembali" : "Back"}</span>
          </button>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Link
              href={`/${lang}`}
              className="hover:text-emerald-800 transition-colors"
            >
              {isId ? "Beranda" : "Home"}
            </Link>
            <span>/</span>
            <span className="text-emerald-800 font-bold">
              {isId ? "Pengaturan Profil" : "Profile Settings"}
            </span>
          </div>
        </div>

        {/* FEEDBACK TOASTS */}
        {successMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3 shadow-sm animate-in fade-in duration-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-sm font-semibold flex-1">{successMsg}</div>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3 shadow-sm animate-in fade-in duration-300">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-sm font-semibold flex-1">{errorMsg}</div>
          </div>
        )}

        {/* TOP PROFILE HERO CARD */}
        <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-slate-200/80 shadow-sm mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-emerald-100/40 via-emerald-50/20 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
            {/* AVATAR + UPLOAD TRIGGER */}
            <div className="flex flex-col items-center shrink-0">
              <div className="relative group">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-100 to-emerald-200 border-2 border-emerald-200/80 text-emerald-900 flex items-center justify-center font-extrabold text-3xl shadow-md">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt={user?.full_name || "Profile"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getInitials(user?.full_name)
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title={isId ? "Ganti foto profil" : "Change profile photo"}
                  className="absolute inset-0 rounded-3xl bg-emerald-950/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs cursor-pointer"
                >
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    {isId ? "Ubah Foto" : "Change"}
                  </span>
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  className="hidden"
                />
              </div>

              {selectedImage && (
                <div className="mt-3 flex flex-col items-center gap-2 animate-in fade-in">
                  <span className="text-[11px] text-slate-500 font-semibold max-w-[140px] truncate text-center">
                    {selectedImage.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleUploadImage}
                      disabled={uploadingImage}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {uploadingImage ? (
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      <span>{isId ? "Simpan Foto" : "Save Photo"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview(resolveImageUrl(user?.profile_image));
                      }}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-colors"
                    >
                      {isId ? "Batal" : "Cancel"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* USER INFO & BADGES */}
            <div className="flex-1 text-center sm:text-left min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200/60">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {user?.role === "super_admin"
                    ? "Super Admin"
                    : user?.role === "admin"
                    ? "Admin"
                    : isId
                    ? "Klien Satubumi"
                    : "Satubumi Client"}
                </span>

                {user?.has_rapidfs_access ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    {isId ? "Akses Rapid-FS Penuh" : "Full Rapid-FS Access"}
                  </span>
                ) : user?.rapidfs_request_status === "pending" ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                    <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                    {isId ? "Permintaan Akses Sedang Ditinjau" : "Access Request Under Review"}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200/80">
                    {isId ? "Akses Standar" : "Standard Access"}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-950 tracking-tight truncate">
                {user?.full_name || (isId ? "Pengguna Satubumi" : "Satubumi User")}
              </h1>
              <p className="text-sm font-medium text-slate-600 mt-1 truncate">
                {user?.email}
              </p>

              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs font-medium text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  {isId ? "Terdaftar sejak:" : "Member since:"} {formatDate(user?.created_at)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  ID: #{user?.id}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN SETTINGS GRID */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* LEFT 2 COLUMNS: EDIT PROFILE & PASSWORD */}
          <div className="md:col-span-2 space-y-8">
            {/* CARD 1: EDIT DATA DIRI */}
            <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-slate-200/80 shadow-sm">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-emerald-950">
                    {isId ? "Data Pribadi" : "Personal Information"}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    {isId
                      ? "Perbarui nama lengkap, email, dan kontak Anda"
                      : "Update your full name, email, and contact number"}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveInfo} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    {isId ? "Nama Lengkap" : "Full Name"} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={isId ? "Contoh: John Doe" : "e.g. John Doe"}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all pl-11"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    {isId ? "Alamat Email" : "Email Address"} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all pl-11"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium mt-1.5">
                    {isId
                      ? "Email digunakan untuk masuk ke akun dan menerima pemberitahuan."
                      : "Email is used to sign in and receive notifications."}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    {isId ? "Nomor Telepon / WhatsApp" : "Phone / WhatsApp Number"}
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="081234567890"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all pl-11"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingInfo}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
                  >
                    {savingInfo ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{isId ? "Simpan Perubahan" : "Save Changes"}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* CARD 2: GANTI KATA SANDI */}
            <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-slate-200/80 shadow-sm">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-emerald-950">
                    {isId ? "Keamanan & Kata Sandi" : "Security & Password"}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    {isId
                      ? "Perbarui kata sandi untuk mengamankan akun Anda"
                      : "Update your password to keep your account safe"}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSavePassword} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    {isId ? "Kata Sandi Baru" : "New Password"}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all pl-11 pr-11"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium mt-1.5">
                    {isId ? "Minimal 6 karakter." : "At least 6 characters."}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    {isId ? "Konfirmasi Kata Sandi Baru" : "Confirm New Password"}
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all pl-11 pr-11"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingPassword || !newPassword}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
                  >
                    {savingPassword ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <KeyRound className="w-4 h-4" />
                    )}
                    <span>{isId ? "Perbarui Kata Sandi" : "Update Password"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* RIGHT 1 COLUMN: QUICK LINKS & ACCOUNT STATUS */}
          <div className="space-y-6">
            <div className="bg-white rounded-[2rem] p-6 border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700">
                {isId ? "Menu Cepat" : "Quick Actions"}
              </h3>

              <div className="space-y-2">
                <Link
                  href={`/${lang}/dashboard`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 font-bold text-sm transition-all border border-slate-100 hover:border-emerald-100"
                >
                  <ClipboardList className="w-4 h-4 text-emerald-600" />
                  <span>{isId ? "Daftar Assessment Saya" : "My Assessments"}</span>
                </Link>

                {isAdmin && (
                  <Link
                    href={`/${lang}/admin`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 font-bold text-sm transition-all border border-slate-100 hover:border-emerald-100"
                  >
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <span>Admin Panel</span>
                  </Link>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-rose-50/60 hover:bg-rose-100/80 text-rose-700 font-bold text-sm transition-all border border-rose-100"
                >
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>{isId ? "Keluar dari Akun" : "Sign Out"}</span>
                </button>
              </div>
            </div>

            {/* RAPID-FS NOTICE */}
            <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white rounded-[2rem] p-6 shadow-md relative overflow-hidden">
              <div className="absolute -bottom-6 -right-6 w-28 h-28 bg-emerald-500/20 rounded-full blur-xl pointer-events-none" />

              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-300">
                  Rapid-FS Engine
                </span>
              </div>

              <h4 className="text-base font-extrabold text-white mb-2">
                {user?.has_rapidfs_access
                  ? isId
                    ? "Akses Penuh Aktif"
                    : "Full Access Active"
                  : user?.rapidfs_request_status === "pending"
                  ? isId
                    ? "Permintaan Akses Sedang Ditinjau"
                    : "Access Request Under Review"
                  : isId
                  ? "Butuh Akses Lengkap?"
                  : "Need Full Access?"}
              </h4>

              <p className="text-xs text-emerald-100/80 leading-relaxed font-medium mb-4">
                {user?.has_rapidfs_access
                  ? isId
                    ? "Akun Anda telah diverifikasi oleh tim Satu Bumi untuk melihat detail finansial dan mengunduh laporan PDF resmi."
                    : "Your account is verified by Satu Bumi to access full financial projections and download official PDF reports."
                  : user?.rapidfs_request_status === "pending"
                  ? isId
                    ? "Permintaan akses Anda telah terkirim ke admin dan sedang dalam tahap verifikasi. Silakan cek menu Daftar Assessment secara berkala untuk melihat laporan lengkap begitu disetujui."
                    : "Your access request has been sent to the admin and is currently under verification. Please check My Assessments periodically to view full reports once approved."
                  : isId
                  ? "Hubungi admin kami atau ajukan permintaan dari halaman Rapid-FS untuk memverifikasi akun Anda dan membuka analisis mendalam serta unduhan laporan PDF."
                  : "Contact our team or submit a request via Rapid-FS to verify your account and unlock in-depth financial metrics and official PDF downloads."}
              </p>

              {user?.rapidfs_request_status === "pending" && !user?.has_rapidfs_access ? (
                <Link
                  href={`/${lang}/dashboard`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-amber-950 font-extrabold text-xs rounded-xl transition-all shadow-xs"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{isId ? "Cek Daftar Assessment" : "Check My Assessments"}</span>
                </Link>
              ) : !user?.has_rapidfs_access ? (
                <Link
                  href={`/${lang}/contact`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-extrabold text-xs rounded-xl transition-all shadow-xs"
                >
                  <span>{isId ? "Hubungi Satu Bumi" : "Contact Satu Bumi"}</span>
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
