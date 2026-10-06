"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Trees,
  Leaf,
  Wind,
  TrendingUp,
  CircleDollarSign,
  Wallet,
  LineChart,
  Scale,
  Sprout,
  Users,
  BarChart3,
  ShieldCheck,
  Activity,
  Map,
  ChevronDown,
  Coins,
  AlertCircle,
  LockKeyhole,
  Clock,
  Unlock,
  ExternalLink,
} from "lucide-react";
import { extractErrorMessage, getErrorMessage } from "@/lib/error";
import {
  translateSpatialKey,
  translateSpatialValue,
  translateFeasibilityCategory,
  translateRecommendation,
} from "@/lib/spatialTranslation";

const MapPreview = dynamic(() => import("../../../../../components/MapPreview"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[380px] bg-emerald-50 rounded-2xl animate-pulse border border-emerald-100 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  ),
});

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function AssessmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const lang = (params?.lang as string) || "en";
  const id = params?.id as string;
  const isId = lang === "id";

  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Currency & conversion
  const [selectedCurrency, setSelectedCurrency] = useState<"USD" | "IDR">("USD");
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [usdToIdrRate, setUsdToIdrRate] = useState<number>(16000);

  // Request Access state
  const [isRequestingAccess, setIsRequestingAccess] = useState(false);
  const [hasRequestedAccess, setHasRequestedAccess] = useState(false);
  const [showAccessSuccessModal, setShowAccessSuccessModal] = useState(false);

  useEffect(() => {
    fetch("https://open.er-api.com/v6/latest/USD")
      .then((r) => r.json())
      .then((resData) => {
        if (resData?.rates?.IDR && typeof resData.rates.IDR === "number") {
          setUsdToIdrRate(Math.round(resData.rates.IDR));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.push(`/${lang}/login`);
        return;
      }

      try {
        // Fetch current user info for access check
        const meRes = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (meRes.ok) {
          const meData = await meRes.json();
          setUser(meData);
        }

        // Fetch assessment data
        const res = await fetch(`${API_URL}/assessments/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          throw new Error(
            await extractErrorMessage(
              res,
              isId ? "Assessment tidak ditemukan" : "Assessment not found",
              lang
            )
          );
        }
        const json = await res.json();
        setData(json);
      } catch (err: unknown) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    if (id) load();
  }, [id, lang, router, isId]);

  const isUnlocked = Boolean(
    user?.role === "admin" ||
      user?.role === "super_admin" ||
      user?.has_rapidfs_access ||
      data?.is_unlocked === true
  );

  const isPending =
    (user?.rapidfs_request_status === "pending" || hasRequestedAccess) && !isUnlocked;

  const handleRequestAccess = async () => {
    setIsRequestingAccess(true);
    setError(null);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.push(`/${lang}/login`);
        return;
      }

      const projectName = data?.location_name || data?.locationName || "Project Assessment";
      const res = await fetch(`${API_URL}/users/request-rapidfs-access`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ project_name: projectName }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Gagal mengajukan permintaan akses.");
      }

      setHasRequestedAccess(true);
      setShowAccessSuccessModal(true);
      setUser((prev: any) => ({ ...prev, rapidfs_request_status: "pending" }));
    } catch (err: any) {
      setError(err.message || "Gagal mengajukan permintaan akses.");
    } finally {
      setIsRequestingAccess(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!isUnlocked) {
      setError(
        isId
          ? "Unduh laporan PDF resmi hanya dapat dilakukan setelah admin menyetujui hak akses penuh akun Anda."
          : "Official PDF report download is only available once full access has been approved by admin."
      );
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_URL}/reports/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error(
          await extractErrorMessage(
            res,
            isId ? "Gagal mengunduh PDF" : "Failed to download PDF",
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

  const executeDelete = async () => {
    setDeleting(true);
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
      setShowDeleteModal(false);
      router.push(`/${lang}/dashboard`);
    } catch (err: unknown) {
      setShowDeleteModal(false);
      setError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const formatNumber = (n: number | null | undefined) =>
    new Intl.NumberFormat(isId ? "id-ID" : "en-US", { maximumFractionDigits: 0 }).format(
      Number(n) || 0
    );

  const formatCurrency = (n: number | null | undefined) => {
    const val = Number(n) || 0;
    if (selectedCurrency === "IDR") {
      const idrVal = val * usdToIdrRate;
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(idrVal);
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8faf9] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-4" />
          <p className="text-emerald-900/50 font-medium">
            {isId ? "Memuat detail assessment..." : "Loading assessment details..."}
          </p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-[#f8faf9] pt-32 pb-24 px-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            {isId ? "Assessment Tidak Ditemukan" : "Assessment Not Found"}
          </h2>
          <p className="text-slate-500 mb-6 text-sm">
            {isId
              ? "Data assessment ini tidak ditemukan atau Anda tidak memiliki akses."
              : "This assessment could not be found or you do not have permission."}
          </p>
          <Link
            href={`/${lang}/dashboard`}
            className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {isId ? "Kembali ke Dashboard" : "Back to Dashboard"}
          </Link>
        </div>
      </main>
    );
  }

  // Normalisasi data dari schema database / response API
  const componentScores = data.component_scores || data.component_scores_json || null;
  const costBreakdown = data.cost_breakdown || data.cost_breakdown_json || null;
  const geometry = data.geometry || data.geometry_geojson || null;
  const recommendations: string[] = Array.isArray(data.recommendations)
    ? data.recommendations
    : Array.isArray(data.recommendations_json)
    ? data.recommendations_json
    : [];
  const spatialOverlay =
    data.spatial_overlay_layers ||
    data.spatial_overlay_layers_json ||
    componentScores?.spatial_overlay_layers ||
    null;

  return (
    <main className="min-h-screen bg-[#f8faf9] pt-28 pb-24 px-4 sm:px-6 relative font-sans">
      {/* GLOBAL POPUP (SUCCESS / ERROR) */}
      {(error || success) && !showDeleteModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-8 text-center relative animate-in zoom-in-[0.5] fade-in duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
            {error ? (
              <>
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-rose-100 relative">
                  <div className="absolute inset-0 rounded-full border-2 border-rose-200 animate-ping opacity-50 duration-1000" />
                  <AlertTriangle className="w-8 h-8 text-rose-500 relative z-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2 tracking-tight">
                  {isId ? "Pemberitahuan" : "Notice"}
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
                  {error || success}
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

      {/* POPUP SUKSES MINTA AKSES */}
      {showAccessSuccessModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden p-8 text-center relative animate-in zoom-in-[0.8] fade-in duration-400">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-emerald-200">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">
              {isId ? "Permintaan Berhasil Dikirim" : "Request Successfully Sent"}
            </h3>
            <p className="text-slate-600 text-sm mb-6 leading-relaxed">
              {isId
                ? "Permintaan akses laporan penuh telah diteruskan ke admin. Anda dapat mengecek status persetujuan secara berkala di menu Dashboard atau profil Anda."
                : "Your request has been forwarded to the admin. You can periodically check your approval status in the Dashboard or your profile."}
            </p>
            <button
              type="button"
              onClick={() => setShowAccessSuccessModal(false)}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md active:scale-95"
            >
              {isId ? "Mengerti, Terima Kasih" : "Got it, Thank You"}
            </button>
          </div>
        </div>
      )}

      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
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
              {isId
                ? "Apakah Anda yakin ingin menghapus assessment untuk"
                : "Are you sure you want to delete assessment for"}{" "}
              <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md inline-block mx-1 truncate max-w-[200px] align-bottom">
                {data.location_name || data.locationName || "Project"}
              </span>
              ? {isId ? "Tindakan ini tidak dapat dibatalkan." : "This action cannot be undone."}
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 py-3 bg-slate-50 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50 active:scale-95"
              >
                {isId ? "Batalkan" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={executeDelete}
                disabled={deleting}
                className="flex-1 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 disabled:opacity-80 flex items-center justify-center gap-2 transition-all shadow-md shadow-rose-600/20 active:scale-95"
              >
                {deleting ? (
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

      <div className="max-w-5xl mx-auto space-y-6">
        {/* NAVIGASI KEMBALI DI BAGIAN ATAS */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/${lang}/dashboard`}
              className="inline-flex items-center gap-2 text-emerald-800/70 font-bold hover:text-emerald-950 transition-colors text-sm group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span>{isId ? "Kembali ke Dashboard" : "Back to Dashboard"}</span>
            </Link>

            {(user?.role === "admin" || user?.role === "super_admin") && (
              <>
                <span className="text-emerald-900/20">|</span>
                <Link
                  href={`/${lang}/admin/assessments`}
                  className="inline-flex items-center gap-1.5 text-emerald-700 font-bold hover:text-emerald-900 transition-colors text-sm"
                >
                  <span>{isId ? "Semua Assessment (Admin)" : "All Assessments (Admin)"}</span>
                </Link>
              </>
            )}
          </div>

          {(user?.role === "admin" || user?.role === "super_admin") && (
            <Link
              href={`/${lang}/admin/assessments/${id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-900 text-emerald-100 font-bold text-xs hover:bg-emerald-800 transition-all shadow-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isId ? "Buka di Portal Admin" : "Open in Admin Portal"}</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>

        {/* Header Title & Actions */}
        <div className="flex flex-wrap items-start justify-between gap-6 pb-2">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <p className="text-[12px] font-extrabold tracking-[0.15em] uppercase text-emerald-700">
                {isId ? "Detail Laporan Assessment" : "Assessment Report Detail"}
              </p>
              {isUnlocked ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>{isId ? "Akses Terbuka" : "Full Access"}</span>
                </span>
              ) : isPending ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-900 border border-amber-300">
                  <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                  <span>{isId ? "Menunggu Peninjauan Admin" : "Review Pending"}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
                  <LockKeyhole className="w-3 h-3 text-slate-500" />
                  <span>{isId ? "Laporan Dasar" : "Basic Report"}</span>
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-emerald-950 tracking-tight mb-3">
              {data.location_name || data.locationName || "Unnamed Project"}
            </h1>

            <div className="flex flex-wrap items-center gap-2.5 text-sm text-emerald-900/60 font-medium">
              {data.ecosystem_type && (
                <span className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-bold capitalize border border-emerald-100">
                  {String(data.ecosystem_type).replace(/_/g, " ")}
                </span>
              )}
              {data.area_ha && (
                <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold border border-slate-200/60">
                  {formatNumber(data.area_ha)} Ha
                </span>
              )}
              {data.project_duration_years && (
                <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold border border-slate-200/60">
                  {data.project_duration_years} {isId ? "Tahun" : "Years"}
                </span>
              )}
              {data.carbon_price_usd && (
                <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold border border-slate-200/60">
                  ${data.carbon_price_usd}/tCO₂e
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDownloadPDF}
              className={`inline-flex items-center gap-2 px-6 py-3.5 text-[14px] font-bold rounded-2xl transition-all shadow-sm active:scale-95 ${
                isUnlocked
                  ? "bg-emerald-700 text-white hover:bg-emerald-600"
                  : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
              }`}
              title={
                isUnlocked
                  ? isId
                    ? "Unduh PDF"
                    : "Download PDF"
                  : isId
                  ? "Perlu Akses Penuh untuk Unduh PDF"
                  : "Full Access Needed to Download PDF"
              }
            >
              <Download className="w-4 h-4" />
              {isId ? "Unduh PDF" : "Download PDF"}
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              disabled={deleting}
              className="inline-flex items-center gap-2 px-5 py-3.5 border border-rose-200 text-rose-600 text-[14px] font-bold rounded-2xl hover:bg-rose-50 transition-colors disabled:opacity-50 active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? "..." : isId ? "Hapus" : "Delete"}
            </button>
          </div>
        </div>

        {/* ================= HASIL PERSIS SEPERTI RAPID-FS ================= */}
        <div className="bg-white/90 backdrop-blur-2xl rounded-[2.5rem] border border-white p-8 md:p-10 space-y-8 shadow-[0_10px_40px_-10px_rgba(4,43,34,0.08)]">
          
          {/* 1. Skor Kelayakan Indikatif (ICPFS) - HASIL TERBUKA */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-emerald-50">
            <div>
              <p className="text-[12px] font-extrabold tracking-widest uppercase text-emerald-950 mb-0.5">
                {isId ? "Skor Kelayakan Indikatif" : "Indicative Feasibility Score"}
              </p>
              <p className="text-[11px] font-semibold text-emerald-700/70 mb-2">
                {isId
                  ? "ICPFS (Indicative Carbon Project Feasibility Score): Skala 0 - 100"
                  : "ICPFS (Indicative Carbon Project Feasibility Score): Scale 0 - 100"}
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-6xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-emerald-500 to-cyan-600 leading-none">
                  {typeof data.feasibility_score === "number"
                    ? data.feasibility_score.toFixed(1)
                    : "-"}
                </span>
                <span className="text-xl md:text-2xl font-bold text-emerald-900/20">/100</span>
              </div>
            </div>
            {data.feasibility_category && (
              <span className="px-6 py-3 bg-emerald-50 text-emerald-700 text-[14px] font-extrabold tracking-widest uppercase rounded-full border border-emerald-200/50 shadow-sm hover:bg-emerald-100 transition-colors cursor-default">
                {translateFeasibilityCategory(data.feasibility_category, isId)}
              </span>
            )}
          </div>

          {/* 2. Metrik Dasar Ekosistem - HASIL TERBUKA PERSIS RAPID-FS */}
          <div>
            <p className="text-[12px] font-extrabold text-emerald-950 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Leaf className="w-4 h-4 text-emerald-600" />
              {isId ? "Hasil Analisis Ekosistem Dasar" : "Basic Ecosystem Analysis Results"}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
              <Metric
                label={isId ? "Biomassa" : "Biomass"}
                sublabel={isId ? "AGB (Aboveground Biomass): Total estimasi biomassa vegetasi di atas tanah" : "AGB (Aboveground Biomass): Total estimated above-ground vegetation biomass"}
                value={formatNumber(data.agb_ton)}
                unit={isId ? "ton" : "tons"}
                icon={Trees}
              />
              <Metric
                label={isId ? "Cadangan Karbon" : "Carbon Stock"}
                sublabel={isId ? "tC (Ton Karbon): Total kandungan karbon murni tersimpan dalam biomassa" : "tC (Tonnes of Carbon): Pure stored carbon content in vegetation biomass"}
                value={formatNumber(data.carbon_stock_tc)}
                unit="tC"
                icon={Leaf}
              />
              <Metric
                label={isId ? "Potensi Emisi" : "Emissions Potential"}
                sublabel={isId ? "CO₂e (Carbon Dioxide Equivalent): Setara emisi gas rumah kaca" : "CO₂e (Carbon Dioxide Equivalent): Greenhouse gas emissions equivalent"}
                value={formatNumber(data.co2e_ton)}
                unit="tCO₂e"
                icon={Wind}
              />
            </div>
          </div>

          {/* 3. Peta Spasial & Catatan - HASIL TERBUKA PERSIS RAPID-FS */}
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-stretch">
            {geometry ? (
              <div className="h-full flex flex-col">
                <p className="text-[12px] font-extrabold text-emerald-950 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Map className="w-4 h-4 text-emerald-500" />
                  {isId ? "Preview Pemetaan Spasial" : "Spatial Mapping Preview"}
                </p>
                <div className="rounded-[1.5rem] overflow-hidden border border-emerald-100 flex-1 shadow-inner bg-slate-50 min-h-[380px] hover:shadow-md transition-shadow flex flex-col relative">
                  <MapPreview
                    key={JSON.stringify(geometry)}
                    geometry={geometry}
                    className="w-full h-full flex-1"
                  />
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col justify-center items-center p-8 rounded-[1.5rem] border border-dashed border-emerald-200 bg-emerald-50/20 text-center text-emerald-900/50 text-sm">
                <Map className="w-8 h-8 text-emerald-300 mb-2" />
                <p>
                  {isId
                    ? "Data peta spasial tidak tersedia untuk analisis manual."
                    : "Spatial map data not available for manual calculation."}
                </p>
              </div>
            )}

            <div
              className={`h-full flex flex-col p-6 md:p-8 bg-amber-50/40 rounded-[1.5rem] border border-amber-200/60 hover:shadow-sm transition-all duration-300 ${
                !geometry ? "md:col-span-2" : ""
              }`}
            >
              <div className="flex items-center gap-2.5 mb-5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <p className="text-[12px] font-extrabold text-amber-950 uppercase tracking-widest">
                  {isId ? "Perhatian" : "Important Notice"}
                </p>
              </div>

              <ul className="space-y-4">
                <li className="text-[14px] text-amber-950/90 font-medium flex items-start gap-3 leading-relaxed bg-white/80 p-4 rounded-xl border border-amber-200/50 shadow-xs">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                  <span>
                    {isId ? (
                      <>
                        Hasil analisis ini merupakan <strong>perhitungan indikatif awal</strong>.
                        Untuk membuka proyeksi finansial penuh, rincian biaya, dan kredit karbon,
                        pastikan akun Anda telah disetujui memiliki akses penuh.
                      </>
                    ) : (
                      <>
                        This result represents an <strong>initial indicative calculation</strong>.
                        To unlock full financial projections, cost breakdowns, and carbon credits,
                        ensure full report access is approved for your account.
                      </>
                    )}
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* ================= 4. KONTEN LANJUTAN: CONDITIONAL BERDASARKAN isUnlocked ================= */}
          <div className="relative mt-8 pt-4 border-t border-emerald-50">
            {/* OVERLAY GEMBOK — HANYA MUNCUL JIKA isUnlocked === false */}
            {!isUnlocked && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-white/85 backdrop-blur-xl border border-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] rounded-[2.5rem] p-8 md:p-10 max-w-lg w-full flex flex-col items-center animate-in zoom-in-95 duration-500">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl flex items-center justify-center shadow-inner mb-5 border border-emerald-200">
                    <LockKeyhole className="w-7 h-7 text-emerald-600" />
                  </div>
                  <h4 className="text-xl md:text-2xl font-extrabold text-slate-900 mb-3 tracking-tight">
                    {isId ? "Analisis Lanjutan Terkunci" : "Advanced Analysis Locked"}
                  </h4>
                  <p className="text-[13.5px] text-slate-600 font-medium leading-relaxed mb-6">
                    {isId
                      ? "Analisis ekosistem dasar dan pemetaan spasial berhasil ditampilkan. Namun, proyeksi finansial (biaya & pendapatan), kredit karbon, rincian skor, dan data GIS spesifik disembunyikan. Minta admin untuk membuka laporan penuh."
                      : "Basic ecosystem analysis and spatial mapping are visible. However, financial projections, carbon credits, detailed scoring, and specific GIS data are hidden. Request admin to unlock the full report."}
                  </p>

                  <button
                    type="button"
                    onClick={handleRequestAccess}
                    disabled={isRequestingAccess || isPending}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 disabled:opacity-85"
                  >
                    {isRequestingAccess ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>{isId ? "Mengirim Permintaan…" : "Submitting Request…"}</span>
                      </>
                    ) : isPending ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                        <span>{isId ? "Permintaan Akses Sedang Ditinjau" : "Access Request Under Review"}</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-5 h-5" />
                        <span>{isId ? "Minta Akses Laporan Penuh" : "Request Full Report Access"}</span>
                      </>
                    )}
                  </button>

                  {isPending && (
                    <p className="mt-3 text-[12px] text-emerald-800 font-semibold flex items-center justify-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        {isId
                          ? "Permintaan telah dikirim ke admin. Cek berkala di menu Dashboard Anda."
                          : "Request submitted to admin. Check periodically in your Dashboard."}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* KONTEN LANJUTAN (BLUR JIKA TERKUNCI, JELAS DAN TERBUKA JIKA DI-ACC) */}
            <div
              className={
                !isUnlocked
                  ? "opacity-35 blur-[8px] pointer-events-none select-none flex flex-col gap-8"
                  : "flex flex-col gap-8 animate-in fade-in duration-500"
              }
            >
              {/* Currency Switcher */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 md:px-6 md:py-4 bg-emerald-50/60 rounded-2xl border border-emerald-100/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-emerald-200/60 flex items-center justify-center text-emerald-700 shadow-sm shrink-0">
                    <Coins className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-emerald-950">
                      {isId ? "Konversi Mata Uang" : "Currency Conversion"}
                    </p>
                    <p className="text-[11px] text-emerald-800/70 font-medium">
                      {selectedCurrency === "IDR"
                        ? isId
                          ? `Konversi aktif (Kurs acuan: 1 USD ≈ Rp ${usdToIdrRate.toLocaleString("id-ID")})`
                          : `Conversion active (Reference rate: 1 USD ≈ IDR ${usdToIdrRate.toLocaleString("en-US")})`
                        : isId
                        ? "Menampilkan nilai dalam Dollar AS ($)"
                        : "Displaying values in US Dollar ($)"}
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setCurrencyDropdownOpen((prev) => !prev)}
                    className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-white border border-emerald-200 rounded-xl font-bold text-[13px] text-emerald-950 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all shadow-sm active:scale-95"
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        selectedCurrency === "IDR" ? "bg-emerald-500 animate-pulse" : "bg-sky-500"
                      }`}
                    />
                    <span>{selectedCurrency === "IDR" ? "🇮🇩 IDR (Rupiah)" : "🇺🇸 USD (Dollar)"}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-emerald-700 transition-transform duration-200 ${
                        currencyDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {currencyDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setCurrencyDropdownOpen(false)}
                      />
                      <div className="absolute right-0 z-40 mt-2 w-56 bg-white border border-emerald-100 rounded-2xl shadow-xl py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCurrency("USD");
                            setCurrencyDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-2.5 text-left text-[13px] flex items-center justify-between transition-colors ${
                            selectedCurrency === "USD"
                              ? "bg-emerald-50 text-emerald-800 font-bold"
                              : "text-slate-700 font-medium hover:bg-slate-50"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span>🇺🇸</span>
                            <span>{isId ? "USD (Dollar AS - $)" : "USD (US Dollar - $)"}</span>
                          </span>
                          {selectedCurrency === "USD" && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCurrency("IDR");
                            setCurrencyDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-2.5 text-left text-[13px] flex items-center justify-between transition-colors ${
                            selectedCurrency === "IDR"
                              ? "bg-emerald-50 text-emerald-800 font-bold"
                              : "text-slate-700 font-medium hover:bg-slate-50"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span>🇮🇩</span>
                            <span>{isId ? "IDR (Rupiah - Rp)" : "IDR (Indonesian Rupiah - Rp)"}</span>
                          </span>
                          {selectedCurrency === "IDR" && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Financial Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <Metric
                  label={isId ? "Kredit Karbon" : "Carbon Credits"}
                  sublabel={isId ? "ACC (Annual Carbon Credits): Estimasi kredit terverifikasi per tahun" : "ACC (Annual Carbon Credits): Estimated verified credits issuable annually"}
                  value={formatNumber(data.acc_total_credits)}
                  unit={isId ? "kredit (tCO₂e)" : "credits (tCO₂e)"}
                  icon={TrendingUp}
                />
                <Metric
                  label={isId ? "Pendapatan Kotor" : "Gross Revenue"}
                  sublabel={isId ? "Estimasi total akumulasi pendapatan kotor proyek karbon" : "Estimated total gross revenue from carbon project"}
                  value={formatCurrency(data.gross_revenue_usd)}
                  icon={CircleDollarSign}
                />
                <Metric
                  label={isId ? "Total Biaya Proyek" : "Total Project Cost"}
                  sublabel={isId ? "Akumulasi belanja modal (CAPEX) & operasional (OPEX)" : "Accumulated capital expenditure (CAPEX) & operating costs (OPEX)"}
                  value={formatCurrency(costBreakdown?.total_cost_usd ?? data.total_cost_usd)}
                  icon={Wallet}
                />
                <Metric
                  label={isId ? "Pendapatan Bersih" : "Net Revenue"}
                  sublabel={isId ? "Estimasi keuntungan bersih proyek setelah dikurangi seluruh biaya" : "Estimated net project profit after deducting all costs"}
                  value={formatCurrency(data.net_revenue_usd)}
                  highlight
                  icon={LineChart}
                />
              </div>

              {/* Komponen Skor */}
              {componentScores && (
                <div className="p-6 md:p-8 bg-emerald-50/50 rounded-[1.5rem] border border-emerald-100">
                  <p className="text-[12px] font-extrabold text-emerald-950 uppercase tracking-widest mb-5">
                    {isId ? "Komponen Skor Kelayakan" : "Feasibility Score Components"}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {[
                      {
                        k: "carbon_score",
                        l: isId ? "Karbon" : "Carbon",
                        desc: isId ? "ER (Emission Reduction): Potensi serapan karbon" : "ER (Emission Reduction): Carbon sequestration",
                        ic: Leaf,
                        color: "text-emerald-500",
                      },
                      {
                        k: "legality_score",
                        l: isId ? "Legalitas" : "Legality",
                        desc: isId ? "HGU & Status Kawasan: Kepatuhan hukum lahan" : "HGU & Land Tenure: Legal compliance",
                        ic: Scale,
                        color: "text-amber-500",
                      },
                      {
                        k: "biodiversity_score",
                        l: isId ? "Biodiversitas" : "Biodiversity",
                        desc: isId ? "Keanekaragaman hayati & spesies kunci" : "Biodiversity & key species",
                        ic: Sprout,
                        color: "text-green-500",
                      },
                      {
                        k: "social_score",
                        l: isId ? "Sosial" : "Social",
                        desc: isId ? "Dampak & keterlibatan masyarakat lokal" : "Community engagement & impact",
                        ic: Users,
                        color: "text-sky-500",
                      },
                      {
                        k: "economy_score",
                        l: isId ? "Ekonomi" : "Economy",
                        desc: isId ? "Kelayakan pasar & margin finansial" : "Financial viability & returns",
                        ic: CircleDollarSign,
                        color: "text-indigo-500",
                      },
                    ].map((c) => {
                      const ScoreIcon = c.ic;
                      const val = componentScores[c.k];
                      return (
                        <div
                          key={c.k}
                          className="p-4 rounded-[1.25rem] bg-white border border-emerald-100/60 text-center shadow-sm hover:shadow-md transition-all relative overflow-hidden group hover:-translate-y-1 flex flex-col justify-between"
                        >
                          <div className="absolute inset-0 bg-emerald-50/0 group-hover:bg-emerald-50/50 transition-colors duration-300" />
                          <div className="relative z-10 flex flex-col items-center">
                            <ScoreIcon className={`w-5 h-5 mb-2 ${c.color} opacity-80`} />
                            <p className="text-[11px] font-extrabold tracking-widest uppercase text-emerald-900 mb-0.5">
                              {c.l}
                            </p>
                            <p className="text-[10px] font-medium text-emerald-700/60 mb-2 leading-tight">
                              {c.desc}
                            </p>
                            <p className="text-2xl font-extrabold text-emerald-950">
                              {val != null ? Number(val).toFixed(0) : "—"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Rincian Biaya */}
              {costBreakdown && (
                <div className="p-6 md:p-8 bg-emerald-50/50 rounded-[1.5rem] border border-emerald-100">
                  <p className="text-[12px] font-extrabold text-emerald-950 uppercase tracking-widest mb-5">
                    {isId ? "Rincian Biaya Proyek" : "Project Cost Breakdown"}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Metric
                      label={isId ? "Biaya Pengembangan" : "Development Cost"}
                      sublabel={isId ? "CAPEX (Capital Expenditure): Studi kelayakan teknis, PDD, dan perizinan" : "CAPEX (Capital Expenditure): Technical feasibility study, PDD, and permits"}
                      value={formatCurrency(costBreakdown.development_cost_usd)}
                      icon={TrendingUp}
                    />
                    <Metric
                      label={isId ? "Biaya MRV" : "MRV Cost"}
                      sublabel={isId ? "MRV (Measurement, Reporting & Verification): Pengukuran biomassa dan audit satelit" : "MRV (Measurement, Reporting & Verification): Biomass measurement and satellite monitoring"}
                      value={formatCurrency(costBreakdown.mrv_cost_usd)}
                      icon={BarChart3}
                    />
                    <Metric
                      label={isId ? "Biaya Validasi" : "Validation Cost"}
                      sublabel={isId ? "VVB (Validation & Verification Body): Audit pihak ketiga metodologi karbon" : "VVB (Validation & Verification Body): Third-party independent carbon audit"}
                      value={formatCurrency(costBreakdown.validation_cost_usd)}
                      icon={ShieldCheck}
                    />
                    <Metric
                      label={isId ? "Biaya Operasional" : "Operational Cost"}
                      sublabel={isId ? "OPEX (Operational Expenditure): Pemeliharaan rutin dan patroli penjagaan hutan" : "OPEX (Operational Expenditure): Routine maintenance and forest patrols"}
                      value={formatCurrency(costBreakdown.operational_cost_usd)}
                      icon={Activity}
                    />
                  </div>
                </div>
              )}

              {/* Overlay Spasial */}
              {spatialOverlay &&
                typeof spatialOverlay === "object" &&
                Object.keys(spatialOverlay).length > 0 && (
                  <div className="p-6 md:p-8 bg-emerald-50/50 rounded-[1.5rem] border border-emerald-100">
                    <p className="text-[12px] font-extrabold text-emerald-950 uppercase tracking-widest mb-5">
                      {isId ? "Lapisan Analisis Spasial" : "Spatial Analysis Layers"}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(spatialOverlay)
                        .filter(([key]) => !key.toLowerCase().includes("slop"))
                        .map(([key, val]) => {
                          const label = translateSpatialKey(key, isId);
                          let rawValue: unknown = val;
                          let fungsi = "";

                          if (val != null && typeof val === "object" && !Array.isArray(val)) {
                            const obj = val as { value?: unknown; fungsi?: string };
                            rawValue = obj.value ?? val;
                            if (obj.fungsi) fungsi = String(obj.fungsi);
                          }

                          const displayValue = translateSpatialValue(rawValue, isId);

                          return (
                            <div
                              key={key}
                              className="p-4 rounded-xl bg-white border border-emerald-100/60 shadow-xs flex items-center justify-between gap-3"
                            >
                              <div className="min-w-0">
                                <p className="text-[11px] font-bold text-emerald-800/60 uppercase tracking-wider truncate">
                                  {label}
                                </p>
                                {fungsi ? (
                                  <p className="text-[11px] text-emerald-900/60 font-medium truncate">
                                    {translateSpatialValue(fungsi, isId)}
                                  </p>
                                ) : null}
                              </div>
                              <span className="text-[13px] font-extrabold text-emerald-950 shrink-0 text-right">
                                {displayValue}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

              {/* Rekomendasi */}
              {recommendations && recommendations.length > 0 && (
                <div className="p-6 md:p-8 bg-emerald-50/40 rounded-[1.5rem] border border-emerald-100/80">
                  <p className="text-[12px] font-extrabold text-emerald-950 uppercase tracking-widest mb-4">
                    {isId ? "Rekomendasi Strategis Kelayakan" : "Strategic Feasibility Recommendations"}
                  </p>
                  <ul className="space-y-3">
                    {recommendations.map((rec: string, i: number) => (
                      <li
                        key={i}
                        className="text-[14px] text-emerald-900/80 font-medium flex items-start gap-3 leading-relaxed"
                      >
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                        <span>{translateRecommendation(rec, isId)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* 5. Bottom Action Bar */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-emerald-50">
            <button
              type="button"
              onClick={handleDownloadPDF}
              className={`flex-1 px-6 py-4 text-[15px] font-bold rounded-2xl flex justify-center items-center gap-2 transition-all duration-300 shadow-md active:scale-95 ${
                isUnlocked
                  ? "bg-emerald-800 hover:bg-emerald-900 text-white shadow-emerald-950/20"
                  : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
              }`}
            >
              <Download className="w-5 h-5" />
              {isId ? "Unduh Laporan (PDF)" : "Download Report (PDF)"}
            </button>
            {user?.role === "admin" || user?.role === "super_admin" ? (
              <Link
                href={`/${lang}/admin/assessments`}
                className="flex-1 px-6 py-4 bg-white border border-emerald-200/80 text-emerald-800 text-[15px] font-bold rounded-2xl flex justify-center items-center gap-2 hover:bg-emerald-50 transition-all duration-300 shadow-xs active:scale-95"
              >
                <ArrowLeft className="w-5 h-5" />
                {isId ? "Kembali ke Semua Assessment (Admin)" : "Back to All Assessments (Admin)"}
              </Link>
            ) : (
              <Link
                href={`/${lang}/dashboard`}
                className="flex-1 px-6 py-4 bg-white border border-emerald-200/80 text-emerald-800 text-[15px] font-bold rounded-2xl flex justify-center items-center gap-2 hover:bg-emerald-50 transition-all duration-300 shadow-xs active:scale-95"
              >
                <ArrowLeft className="w-5 h-5" />
                {isId ? "Kembali ke Dashboard" : "Back to Dashboard"}
              </Link>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}

function Metric({
  label,
  sublabel,
  value,
  unit,
  highlight = false,
  icon: Icon,
}: {
  label: string;
  sublabel?: string;
  value: string;
  unit?: string;
  highlight?: boolean;
  icon?: any;
}) {
  return (
    <div
      className={`relative p-5 md:p-6 rounded-[1.5rem] border transition-all duration-300 ease-out flex flex-col justify-between hover:-translate-y-1.5 overflow-hidden ${
        highlight
          ? "bg-gradient-to-br from-emerald-600 to-emerald-800 border-emerald-500 shadow-lg shadow-emerald-900/20 text-white"
          : "bg-white border-emerald-100/60 shadow-xs hover:shadow-md text-emerald-950"
      }`}
    >
      {highlight && (
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      )}
      <div className="flex items-start justify-between mb-3 relative z-10 gap-3">
        <div className="flex-1 min-w-0">
          <p
            className={`text-[11px] md:text-[12px] font-extrabold tracking-widest uppercase ${
              highlight ? "text-emerald-50" : "text-emerald-900"
            }`}
          >
            {label}
          </p>
          {sublabel && (
            <p
              className={`text-[11px] font-medium tracking-normal mt-0.5 leading-snug break-words ${
                highlight ? "text-emerald-100/80" : "text-emerald-700/70"
              }`}
            >
              {sublabel}
            </p>
          )}
        </div>
        {Icon && (
          <div
            className={`p-2 rounded-xl shrink-0 ${
              highlight ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-600"
            }`}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="relative z-10 mt-2">
        <p className="text-[20px] sm:text-[24px] font-extrabold leading-tight break-words">
          {value}
          {unit && (
            <span
              className={`text-[14px] sm:text-[15px] font-bold ml-1.5 ${
                highlight ? "text-emerald-200" : "text-emerald-700"
              }`}
            >
              {unit}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}