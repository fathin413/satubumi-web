"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, Trash2, Download, ArrowLeft, Plus, AlertTriangle, CheckCircle2 } from "lucide-react";
import { extractErrorMessage, getErrorMessage } from "@/lib/error";

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
          throw new Error(await extractErrorMessage(listRes, isId ? "Gagal memuat data" : "Failed to load data", lang));
        }

        const listData = await listRes.json();
        const raw = Array.isArray(listData)
          ? listData
          : listData.data || listData.items || [];

        // Halaman user: SELALU hanya assessment milik sendiri
        // (meski API admin mengembalikan semua data)
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
        throw new Error(await extractErrorMessage(res, isId ? "Gagal menghapus assessment" : "Failed to delete assessment", lang));
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
        throw new Error(await extractErrorMessage(res, isId ? "Gagal mengunduh PDF" : "Failed to download PDF", lang));
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
          <p className="text-emerald-900/50 font-medium">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8faf9] pt-32 pb-24 px-6 relative font-sans">
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
                  {isId ? "Terjadi Kesalahan" : "Action Failed"}
                </h3>
                <p className="text-[13px] text-slate-500 font-medium mb-6 leading-relaxed px-2">
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
        
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-[12px] font-semibold tracking-[0.15em] uppercase text-emerald-700 mb-3">
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
                · {isId ? "hanya milik Anda" : "your projects only"}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {(user?.role === "admin" || user?.role === "super_admin") && (
              <Link
                href={`/${lang}/admin/assessments`}
                className="inline-flex items-center gap-2 px-5 py-3.5 border border-emerald-200 text-emerald-800 font-bold rounded-2xl hover:bg-emerald-50 transition-all"
              >
                {isId ? "Semua Assessment (Admin)" : "All Assessments (Admin)"}
              </Link>
            )}
            <Link
              href={`/${lang}/products`}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all"
            >
              <Plus className="w-5 h-5" />
              {isId ? "Assessment Baru" : "New Assessment"}
            </Link>
          </div>
        </div>

        {/* List */}
        {assessments.length === 0 ? (
          <div className="bg-white/60 border-2 border-dashed border-emerald-200 rounded-[2.5rem] py-24 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-100">
              <FileText className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-emerald-950 mb-2">
              {isId ? "Belum ada assessment" : "No assessments yet"}
            </h3>
            <p className="text-emerald-900/50 font-medium mb-8 max-w-sm mx-auto">
              {isId
                ? "Jalankan Rapid-FS lalu simpan hasilnya untuk melihat riwayat di sini."
                : "Run Rapid-FS and save the result to see your history here."}
            </p>
            <Link
              href={`/${lang}/products`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all"
            >
              {isId ? "Mulai Assessment" : "Start Assessment"}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {assessments.map((item) => {
              const id = item.id || item._id;
              return (
                <Link
                  key={id}
                  href={`/${lang}/dashboard/${id}`}
                  className="bg-white/80 backdrop-blur-xl border border-emerald-100/60 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6 hover:shadow-lg hover:shadow-emerald-900/5 hover:border-emerald-200 transition-all block"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-emerald-950 truncate mb-1">
                      {item.location_name || item.locationName || "Unnamed Project"}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-emerald-900/50 font-medium">
                      {item.ecosystem_type && (
                        <span className="capitalize">
                          {String(item.ecosystem_type).replace(/_/g, " ")}
                        </span>
                      )}
                      {item.area_ha != null && (
                        <span>· {Number(item.area_ha).toLocaleString()} ha</span>
                      )}
                      {item.feasibility_category && (
                        <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100">
                          {item.feasibility_category}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-center shrink-0">
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
                      onClick={(e) => handleDownloadPDF(e, id)}
                      className="p-3 rounded-xl border border-emerald-100 text-emerald-700 hover:bg-emerald-50 transition-colors"
                      title="Download PDF"
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
                      disabled={isDeleting && (assessmentToDelete?.id === id || assessmentToDelete?._id === id)}
                      className="p-3 rounded-xl border border-rose-100 text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-12">
          <Link
            href={`/${lang}`}
            className="inline-flex items-center gap-2 text-emerald-800/60 font-bold hover:text-emerald-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {isId ? "Kembali ke Beranda" : "Back to Home"}
          </Link>
        </div>
      </div>
    </main>
  );
}