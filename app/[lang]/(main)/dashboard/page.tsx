"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Trash2,
  Download,
  ArrowLeft,
  ArrowRight,
  Plus,
  AlertTriangle,
  CheckCircle2,
  User,
  Clock,
  ShieldCheck,
  LockKeyhole,
  Unlock,
} from "lucide-react";
import { extractErrorMessage, getErrorMessage } from "@/lib/error";
import { translateFeasibilityCategory, translateEcosystemType } from "@/lib/spatialTranslation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const lang = (params?.lang as string) || "en";
  const isId = lang === "id";

  const [user, setUser] = useState<any>(null);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [assessmentToDelete, setAssessmentToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!success && (!error || assessmentToDelete)) return;
    const t = setTimeout(() => {
      setSuccess(null);
      if (!assessmentToDelete) setError(null);
    }, 4000);
    return () => clearTimeout(t);
  }, [success, error, assessmentToDelete]);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.push(`/${lang}/login`);
        return;
      }

      try {
        const meRes = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!meRes.ok) {
          localStorage.removeItem("access_token");
          router.push(`/${lang}/login`);
          return;
        }
        const meData = await meRes.json();
        setUser(meData);

        const listRes = await fetch(`${API_URL}/assessments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!listRes.ok) {
          throw new Error(
            await extractErrorMessage(
              listRes,
              isId ? "Gagal memuat data" : "Failed to load data",
              lang
            )
          );
        }

        const listData = await listRes.json();
        const raw = Array.isArray(listData)
          ? listData
          : listData.data || listData.items || [];

        // Halaman user: SELALU hanya assessment milik sendiri
        const myId = meData.id;
        const mine = raw.filter((a: any) => {
          if (a.user_id == null) return false;
          return Number(a.user_id) === Number(myId);
        });

        setAssessments(mine);
      } catch (err: unknown) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [lang, router, isId]);

  const confirmDelete = async () => {
    if (!assessmentToDelete) return;
    const id = assessmentToDelete.id || assessmentToDelete._id;
    setIsDeleting(true);
    setError(null);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_URL}/assessments/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error(
          await extractErrorMessage(
            res,
            isId ? "Gagal menghapus assessment" : "Failed to delete assessment",
            lang
          )
        );
      }
      setAssessments((prev) => prev.filter((a) => (a.id || a._id) !== id));
      setSuccess(isId ? "Assessment berhasil dihapus." : "Assessment successfully deleted.");
      setAssessmentToDelete(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      setAssessmentToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadPDF = async (e: React.MouseEvent, id: string | number) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_URL}/reports/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error(
          await extractErrorMessage(
            res,
            isId
              ? "Gagal mengunduh PDF. Pastikan hak akses laporan penuh telah disetujui admin."
              : "Failed to download PDF. Ensure full report access has been approved by admin.",
            lang
          )
        );
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Satubumi-Report-${id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  };

  const formatScore = (score: number) =>
    typeof score === "number" ? score.toFixed(1) : "-";

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8faf9] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
          <p className="text-emerald-900/50 font-medium">
            {isId ? "Memuat dashboard..." : "Loading dashboard..."}
          </p>
        </div>
      </main>
    );
  }

  const hasFullAccess = Boolean(
    user?.role === "admin" || user?.role === "super_admin" || user?.has_rapidfs_access
  );
  const isRequestPending = user?.rapidfs_request_status === "pending" && !hasFullAccess;

  return (
    <main className="min-h-screen bg-[#f8faf9] pt-28 pb-24 px-6 relative font-sans">
      {/* GLOBAL POPUP (SUCCESS / ERROR) */}
      {(error || success) && !assessmentToDelete && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-8 text-center relative animate-in zoom-in-[0.5] fade-in duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
            {error ? (
              <>
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-rose-100 relative">
                  <div className="absolute inset-0 rounded-full border-2 border-rose-200 animate-ping opacity-50 duration-1000" />
                  <AlertTriangle className="w-8 h-8 text-rose-500 relative z-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2 tracking-tight">
                  {isId ? "Perhatian" : "Notice"}
                </h3>
                <p className="text-[13px] text-slate-600 font-medium mb-6 leading-relaxed px-2">
                  {error}
                </p>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="w-full py-3 bg-rose-50 border border-rose-100 text-rose-600 font-bold rounded-xl hover:bg-rose-100 transition-all active:scale-95"
                >
                  {isId ? "Tutup" : "Close"}
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
                  type="button"
                  onClick={() => setSuccess(null)}
                  className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-md active:scale-95"
                >
                  {isId ? "Tutup" : "Close"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      {assessmentToDelete && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden p-8 text-center relative animate-in zoom-in-[0.5] fade-in duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-rose-100 relative">
              <div className="absolute inset-0 rounded-2xl border-2 border-rose-200 animate-ping opacity-50 duration-1000" />
              <AlertTriangle className="w-8 h-8 text-rose-500 relative z-10" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-800 mb-2">
              {isId ? "Hapus Assessment Ini?" : "Delete This Assessment?"}
            </h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed px-2">
              {isId ? "Apakah Anda yakin ingin menghapus assessment untuk" : "Are you sure you want to delete assessment for"}{" "}
              <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md inline-block mx-1 truncate max-w-[200px] align-bottom">
                {assessmentToDelete.location_name || assessmentToDelete.locationName || "Project"}
              </span>
              ? {isId ? "Tindakan ini tidak dapat dibatalkan." : "This action cannot be undone."}
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  setAssessmentToDelete(null);
                  setError(null);
                }}
                disabled={isDeleting}
                className="flex-1 py-3 bg-slate-50 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50 active:scale-95"
              >
                {isId ? "Batalkan" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 disabled:opacity-80 flex items-center justify-center gap-2 transition-all shadow-md shadow-rose-600/20 active:scale-95"
              >
                {isDeleting ? (
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
      )}

      <div className="max-w-[1200px] mx-auto">
        {/* NAVIGASI KEMBALI DI BAGIAN ATAS (BUKAN DI BAWAH) */}
        <div className="mb-6">
          <Link
            href={`/${lang}`}
            className="inline-flex items-center gap-2 text-emerald-800/70 font-bold hover:text-emerald-950 transition-colors text-sm group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>{isId ? "Kembali ke Beranda" : "Back to Home"}</span>
          </Link>
        </div>

        {/* Header Title & Actions */}
        <div className="flex flex-wrap items-end justify-between gap-6 mb-8">
          <div>
            <p className="text-[12px] font-semibold tracking-[0.15em] uppercase text-emerald-700 mb-2">
              Dashboard
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold text-emerald-950 tracking-tight mb-2">
              {isId ? "Riwayat Assessment" : "Assessment History"}
            </h1>
            <p className="text-emerald-900/60 font-medium">
              {isId ? "Halo" : "Hello"}
              {user?.full_name ? `, ${user.full_name}` : ""}
              <span className="text-emerald-900/40">
                {" "}
                · {isId ? "proyek assessment Anda" : "your projects"}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/${lang}/profile`}
              className="inline-flex items-center gap-2 px-5 py-3.5 border border-emerald-200 bg-white text-emerald-800 font-bold rounded-2xl hover:bg-emerald-50 transition-all shadow-xs"
            >
              <User className="w-4 h-4 text-emerald-600" />
              <span>{isId ? "Pengaturan Profil" : "Profile Settings"}</span>
            </Link>

            {(user?.role === "admin" || user?.role === "super_admin") && (
              <Link
                href={`/${lang}/admin/assessments`}
                className="inline-flex items-center gap-2 px-5 py-3.5 border border-emerald-200 text-emerald-800 font-bold rounded-2xl hover:bg-emerald-50 transition-all"
              >
                {isId ? "Semua Assessment (Admin)" : "All Assessments (Admin)"}
              </Link>
            )}
            <Link
              href={`/${lang}/products/rapid-fs`}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-sm"
            >
              <Plus className="w-5 h-5" />
              {isId ? "Assessment Baru" : "New Assessment"}
            </Link>
          </div>
        </div>

        {/* Rapid-FS Access Status Banner */}
        {isRequestPending ? (
          <div className="mb-8 p-5 bg-amber-50/80 border border-amber-200/90 rounded-2xl flex items-start sm:items-center gap-4 shadow-xs animate-in fade-in duration-300">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-amber-600 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-extrabold text-amber-950">
                {isId
                  ? "Permintaan Akses Laporan Penuh Sedang Ditinjau Admin"
                  : "Full Report Access Request Under Review"}
              </p>
              <p className="text-xs text-amber-900/80 font-medium mt-0.5 leading-relaxed">
                {isId
                  ? "Permintaan akses Anda telah tercatat. Begitu admin menyetujui, proyeksi finansial, kredit karbon, dan unduh PDF resmi pada daftar assessment Anda akan otomatis terbuka."
                  : "Your request has been recorded. Once approved by administrator, financial projections, carbon credits, and official PDF downloads for your assessments will automatically unlock."}
              </p>
            </div>
          </div>
        ) : hasFullAccess ? (
          <div className="mb-8 p-4 bg-emerald-50/80 border border-emerald-100 rounded-2xl flex items-center gap-3 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-xs font-bold text-emerald-900 leading-snug">
              {isId
                ? "Akun Anda memiliki Akses Penuh Rapid-FS. Semua laporan assessment di bawah ini terbuka lengkap dan dapat diunduh dalam format PDF resmi."
                : "Your account has Full Rapid-FS Access. All assessment reports below are fully unlocked and downloadable as official PDFs."}
            </p>
          </div>
        ) : null}

        {/* Admin Distinction Notice */}
        {(user?.role === "admin" || user?.role === "super_admin") && (
          <div className="mb-8 p-4 sm:p-5 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-emerald-950/10 border border-emerald-800/40 animate-in fade-in duration-300">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {isId ? "Tampilan Pengguna" : "User View"}
                  </span>
                  <span className="text-xs text-white/60 font-medium">
                    {user?.role?.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-white/90 font-medium leading-snug">
                  {isId
                    ? "Halaman ini hanya menampilkan riwayat assessment pribadi Anda. Untuk meninjau & mengelola seluruh assessment dari semua user, buka Semua Assessment di Panel Admin."
                    : "This page displays only your personal assessment projects. To review and manage all submissions from all users, open All Assessments in Admin."}
                </p>
              </div>
            </div>
            <Link
              href={`/${lang}/admin/assessments`}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-bold text-xs rounded-xl shrink-0 transition-colors shadow-sm"
            >
              <span>{isId ? "Buka Semua Assessment Admin" : "Open Admin Assessments"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* List of Assessments */}
        {assessments.length === 0 ? (
          <div className="bg-white/60 border-2 border-dashed border-emerald-200 rounded-[2.5rem] py-20 px-6 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-100">
              <FileText className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-emerald-950 mb-2">
              {isId ? "Belum ada assessment pribadi" : "No personal assessments yet"}
            </h3>
            <p className="text-emerald-900/50 font-medium mb-6 max-w-md mx-auto text-sm">
              {(user?.role === "admin" || user?.role === "super_admin")
                ? isId
                  ? "Anda belum menyimpan assessment pribadi. Seluruh assessment dari semua pengguna dapat Anda pantau dan kelola di Panel Admin."
                  : "You haven't saved any personal assessments. All assessments from all users can be managed in the Admin Panel."
                : isId
                ? "Jalankan Rapid-FS lalu simpan hasilnya untuk melihat riwayat di sini."
                : "Run Rapid-FS and save the result to see your history here."}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href={`/${lang}/products/rapid-fs`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all text-sm shadow-sm"
              >
                {isId ? "Mulai Assessment" : "Start Assessment"}
              </Link>
              {(user?.role === "admin" || user?.role === "super_admin") && (
                <Link
                  href={`/${lang}/admin/assessments`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-emerald-200 text-emerald-800 font-bold rounded-2xl hover:bg-emerald-50 transition-all text-sm"
                >
                  {isId ? "Lihat Semua Assessment Admin" : "View All Admin Assessments"}
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {assessments.map((item) => {
              const id = item.id || item._id;
              const isItemUnlocked = Boolean(
                hasFullAccess || item.is_unlocked === true
              );
              const isItemPending = isRequestPending && !isItemUnlocked;

              return (
                <Link
                  key={id}
                  href={`/${lang}/dashboard/${id}`}
                  className="bg-white/90 backdrop-blur-xl border border-emerald-100/70 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6 hover:shadow-lg hover:shadow-emerald-900/5 hover:border-emerald-300 transition-all block group"
                >
                  <div className="flex-1 min-w-0">
                    {/* Status Badge pada Setiap Item List */}
                    <div className="flex flex-wrap items-center gap-2 mb-2.5">
                      {isItemUnlocked ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{isId ? "Akses Laporan Terbuka" : "Full Report Unlocked"}</span>
                        </span>
                      ) : isItemPending ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-900 border border-amber-300">
                          <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                          <span>{isId ? "Menunggu Persetujuan Admin" : "Pending Admin Review"}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
                          <LockKeyhole className="w-3.5 h-3.5 text-slate-500" />
                          <span>{isId ? "Laporan Dasar (Perlu Akses)" : "Basic Report (Needs Access)"}</span>
                        </span>
                      )}

                      {item.feasibility_category && (
                        <span className="px-2.5 py-0.5 bg-emerald-50/80 text-emerald-700 rounded-full text-[11px] font-bold border border-emerald-100">
                          {translateFeasibilityCategory(item.feasibility_category, isId)}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg md:text-xl font-bold text-emerald-950 truncate mb-1 group-hover:text-emerald-700 transition-colors">
                      {item.location_name || item.locationName || "Unnamed Project"}
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-3 text-sm text-emerald-900/60 font-medium">
                      {item.ecosystem_type && (
                        <span className="capitalize">
                          {translateEcosystemType(item.ecosystem_type, isId)}
                        </span>
                      )}
                      {item.area_ha != null && (
                        <span>· {Number(item.area_ha).toLocaleString()} ha</span>
                      )}
                      {item.created_at && (
                        <span className="text-xs text-slate-400">
                          · {new Date(item.created_at).toLocaleDateString(isId ? "id-ID" : "en-US", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-center shrink-0 min-w-[90px]">
                    <p className="text-[11px] font-bold text-emerald-800/40 uppercase tracking-widest mb-1">
                      Score
                    </p>
                    <p className="text-3xl font-extrabold text-emerald-700">
                      {formatScore(item.feasibility_score)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!isItemUnlocked) {
                          setError(
                            isId
                              ? "Unduh PDF laporan resmi hanya tersedia untuk akun yang telah disetujui memiliki akses penuh. Silakan buka detail assessment untuk melihat status atau mengajukan akses."
                              : "Official PDF download is only available for accounts approved with full access. Open assessment detail to view status or request access."
                          );
                          return;
                        }
                        handleDownloadPDF(e, id);
                      }}
                      className={`p-3 rounded-xl border transition-colors ${
                        isItemUnlocked
                          ? "border-emerald-100 text-emerald-700 hover:bg-emerald-50 shadow-xs"
                          : "border-slate-200 text-slate-400 hover:bg-slate-50 cursor-pointer"
                      }`}
                      title={
                        isItemUnlocked
                          ? isId
                            ? "Unduh Laporan (PDF)"
                            : "Download PDF"
                          : isId
                          ? "Perlu Akses Penuh untuk Unduh PDF"
                          : "Full Access Needed to Download PDF"
                      }
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setAssessmentToDelete(item);
                      }}
                      disabled={
                        isDeleting &&
                        (assessmentToDelete?.id === id || assessmentToDelete?._id === id)
                      }
                      className="p-3 rounded-xl border border-rose-100 text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                      title={isId ? "Hapus Assessment" : "Delete Assessment"}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}