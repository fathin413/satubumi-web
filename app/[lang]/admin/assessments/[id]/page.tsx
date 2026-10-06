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
  Clock,
  User,
  Mail,
  Phone,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { extractErrorMessage, getErrorMessage } from "@/lib/error";
import {
  translateSpatialKey,
  translateSpatialValue,
  translateFeasibilityCategory,
  translateRecommendation,
  translateEcosystemType,
} from "@/lib/spatialTranslation";

const MapPreview = dynamic(() => import("@/components/MapPreview"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[380px] bg-emerald-50 rounded-2xl animate-pulse border border-emerald-100 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  ),
});

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function AdminAssessmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const lang = (params?.lang as string) || "en";
  const id = params?.id as string;
  const isId = lang === "id";

  const [data, setData] = useState<any>(null);
  const [submitterUser, setSubmitterUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Currency & conversion
  const [selectedCurrency, setSelectedCurrency] = useState<"USD" | "IDR">("USD");
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [usdToIdrRate, setUsdToIdrRate] = useState<number>(16000);

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
      const token =
        localStorage.getItem("access_token") || localStorage.getItem("token");
      if (!token) {
        router.push(`/${lang}/login`);
        return;
      }

      try {
        // 1. Verify admin privilege
        const meRes = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!meRes.ok) {
          router.push(`/${lang}/login`);
          return;
        }
        const meData = await meRes.json();
        if (meData.role !== "admin" && meData.role !== "super_admin") {
          router.push(`/${lang}/dashboard/${id}`);
          return;
        }

        // 2. Fetch assessment detail
        let res = await fetch(`${API_URL}/assessments/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok && res.status === 404) {
          res = await fetch(`${API_URL}/assessments/${id}/`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
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

        // 3. If user_id exists, fetch submitter user record for full profile details
        if (json.user_id) {
          try {
            let uRes = await fetch(`${API_URL}/users/${json.user_id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!uRes.ok && uRes.status === 404) {
              uRes = await fetch(`${API_URL}/users/${json.user_id}/`, {
                headers: { Authorization: `Bearer ${token}` },
              });
            }
            if (uRes.ok) {
              const uData = await uRes.json();
              setSubmitterUser(uData);
            }
          } catch {
            // Non-critical: continue with assessment embedded data
          }
        }
      } catch (err: unknown) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    if (id) load();
  }, [id, lang, router, isId]);

  const handleDownloadPDF = async () => {
    try {
      const token =
        localStorage.getItem("access_token") || localStorage.getItem("token");
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
      a.download = `Satubumi-Admin-Report-${id}.pdf`;
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
      const token =
        localStorage.getItem("access_token") || localStorage.getItem("token");
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
      router.push(`/${lang}/admin/assessments`);
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
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-4" />
        <p className="text-emerald-900/50 font-medium text-sm">
          {isId ? "Memuat detail assessment admin..." : "Loading assessment details..."}
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white border border-rose-100 rounded-3xl p-10 text-center max-w-xl mx-auto shadow-sm my-12">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          {isId ? "Assessment Tidak Ditemukan" : "Assessment Not Found"}
        </h2>
        <p className="text-slate-500 mb-6 text-sm">
          {isId
            ? "Data assessment ini tidak ditemukan dalam sistem."
            : "This assessment could not be found in the database."}
        </p>
        <Link
          href={`/${lang}/admin/assessments`}
          className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          {isId ? "Kembali ke Semua Assessment" : "Back to All Assessments"}
        </Link>
      </div>
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

  const submitterName =
    data.submitter_name ||
    submitterUser?.full_name ||
    submitterUser?.name ||
    null;
  const submitterEmail =
    data.submitter_email ||
    submitterUser?.email ||
    null;
  const submitterPhone =
    data.submitter_phone ||
    submitterUser?.phone ||
    submitterUser?.phone_number ||
    null;
  const hasFullAccess = Boolean(
    submitterUser?.has_rapidfs_access ||
    data.is_unlocked === true
  );
  const isPendingRequest = Boolean(
    submitterUser?.rapidfs_request_status === "pending"
  );

  return (
    <div className="space-y-6">
      {/* GLOBAL POPUP (ERROR / SUCCESS) */}
      {(error || success) && !showDeleteModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-8 text-center relative animate-in zoom-in-95 duration-300">
            {error ? (
              <>
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-rose-100">
                  <AlertTriangle className="w-8 h-8 text-rose-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  {isId ? "Pemberitahuan" : "Notice"}
                </h3>
                <p className="text-[13px] text-slate-600 font-medium mb-6 leading-relaxed">
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
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-emerald-100">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  {isId ? "Berhasil!" : "Success!"}
                </h3>
                <p className="text-[13px] text-slate-500 font-medium mb-6 leading-relaxed">
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

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden p-8 text-center relative animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-rose-100 relative">
              <div className="absolute inset-0 rounded-2xl border-2 border-rose-200 animate-ping opacity-50 duration-1000" />
              <AlertTriangle className="w-8 h-8 text-rose-500 relative z-10" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-800 mb-2">
              {isId ? "Hapus Assessment Ini?" : "Delete This Assessment?"}
            </h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed px-2">
              {isId
                ? "Apakah Anda yakin ingin menghapus assessment untuk proyek"
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

      {/* TOP NAVIGATION BREADCRUMB & BACK BUTTON */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-1">
        <Link
          href={`/${lang}/admin/assessments`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-emerald-100 text-emerald-800 font-bold hover:bg-emerald-50 hover:text-emerald-950 transition-colors text-sm shadow-xs group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>{isId ? "Kembali ke Semua Assessment" : "Back to All Assessments"}</span>
        </Link>

        {/* View on user page quick link if needed */}
        <Link
          href={`/${lang}/dashboard/${id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800/60 hover:text-emerald-800 transition-colors"
        >
          <span>{isId ? "Lihat Tampilan Pengguna" : "Preview User View"}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* HEADER TITLE & ACTION BUTTONS */}
      <div className="bg-white border border-emerald-100/90 rounded-[2rem] p-6 md:p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-emerald-950 tracking-tight mb-3">
              {data.location_name || data.locationName || "Unnamed Project"}
            </h1>

            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-emerald-900/60 font-medium">
              {data.ecosystem_type && (
                <span className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-bold capitalize border border-emerald-100">
                  {translateEcosystemType(data.ecosystem_type, isId)}
                </span>
              )}
              {data.area_ha != null && (
                <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold border border-slate-200/60">
                  {formatNumber(data.area_ha)} Ha
                </span>
              )}
              {data.project_duration_years != null && (
                <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold border border-slate-200/60">
                  {data.project_duration_years} {isId ? "Tahun" : "Years"}
                </span>
              )}
              {data.carbon_price_usd != null && (
                <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold border border-slate-200/60">
                  ${data.carbon_price_usd}/tCO₂e
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold bg-emerald-700 text-white hover:bg-emerald-600 rounded-xl transition-all shadow-sm active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>{isId ? "Unduh PDF Resmi" : "Download PDF"}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              disabled={deleting}
              className="inline-flex items-center gap-2 px-4 py-3 border border-rose-200 text-rose-600 text-sm font-bold rounded-xl hover:bg-rose-50 transition-colors disabled:opacity-50 active:scale-95"
              title={isId ? "Hapus Assessment" : "Delete Assessment"}
            >
              <Trash2 className="w-4 h-4" />
              <span>{isId ? "Hapus" : "Delete"}</span>
            </button>
          </div>
        </div>

        {/* SUBMITTER & USER CONTACT CARD */}
        <div className="mt-6 pt-6 border-t border-emerald-100/80 bg-emerald-50/40 rounded-2xl p-4 sm:p-5 border border-emerald-100">
          <p className="text-[11px] font-extrabold text-emerald-950 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-600" />
            <span>{isId ? "Informasi Pemilik / Pengaju Proyek" : "Submitter & Account Information"}</span>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-medium">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-emerald-800/50">
                  {isId ? "Nama Pengaju" : "Submitter Name"}
                </p>
                <p className="text-sm font-bold text-emerald-950 truncate">
                  {submitterName || (isId ? "Tidak tertera" : "Not specified")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-emerald-800/50">Email</p>
                {submitterEmail ? (
                  <a
                    href={`mailto:${submitterEmail}`}
                    className="text-sm font-bold text-emerald-700 hover:underline truncate block"
                  >
                    {submitterEmail}
                  </a>
                ) : (
                  <p className="text-sm font-medium text-emerald-900/40">
                    {isId ? "Tidak ada" : "No email"}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-emerald-800/50">
                  {isId ? "Telepon / WhatsApp" : "Phone Number"}
                </p>
                {submitterPhone ? (
                  <a
                    href={`tel:${submitterPhone}`}
                    className="text-sm font-bold text-emerald-700 hover:underline truncate block"
                  >
                    {submitterPhone}
                  </a>
                ) : (
                  <p className="text-sm font-medium text-emerald-900/40">
                    {isId ? "Tidak ada" : "No phone"}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold text-emerald-800/50">
                  {isId ? "Hak Akses User" : "User Access"}
                </p>
                {hasFullAccess ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {isId ? "Akses Penuh" : "Full Access"}
                  </span>
                ) : isPendingRequest ? (
                  <Link
                    href={`/${lang}/admin/rapid-requests`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:underline"
                  >
                    <Clock className="w-3.5 h-3.5 animate-pulse" />
                    {isId ? "Menunggu Peninjauan →" : "Pending Review →"}
                  </Link>
                ) : (
                  <span className="text-xs font-medium text-slate-500">
                    {isId ? "Akses Dasar" : "Basic Access"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT CARD */}
      <div className="bg-white rounded-[2rem] border border-emerald-100/90 p-6 sm:p-8 md:p-10 space-y-8 shadow-sm">
        
        {/* 1. SKOR KELAYAKAN INDIKATIF (ICPFS) */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-emerald-100">
          <div>
            <p className="text-[12px] font-extrabold tracking-widest uppercase text-emerald-950 mb-0.5">
              {isId ? "Skor Kelayakan Indikatif (ICPFS)" : "Indicative Feasibility Score (ICPFS)"}
            </p>
            <p className="text-[11px] font-semibold text-emerald-700/70 mb-2">
              {isId
                ? "ICPFS (Indicative Carbon Project Feasibility Score): Skala 0 - 100"
                : "ICPFS (Indicative Carbon Project Feasibility Score): Scale 0 - 100"}
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-emerald-600 to-cyan-600 leading-none">
                {typeof data.feasibility_score === "number"
                  ? data.feasibility_score.toFixed(1)
                  : "-"}
              </span>
              <span className="text-xl md:text-2xl font-bold text-emerald-900/20">/100</span>
            </div>
          </div>
          {data.feasibility_category && (
            <span className="px-6 py-3 bg-emerald-50 text-emerald-700 text-sm font-extrabold tracking-widest uppercase rounded-full border border-emerald-200 shadow-xs">
              {translateFeasibilityCategory(data.feasibility_category, isId)}
            </span>
          )}
        </div>

        {/* 2. METRIK DASAR EKOSISTEM */}
        <div>
          <p className="text-[12px] font-extrabold text-emerald-950 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Leaf className="w-4 h-4 text-emerald-600" />
            {isId ? "Hasil Analisis Ekosistem Dasar" : "Basic Ecosystem Analysis Results"}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
            <Metric
              label={isId ? "Biomassa" : "Biomass"}
              sublabel={
                isId
                  ? "AGB (Aboveground Biomass): Total estimasi biomassa vegetasi di atas tanah"
                  : "AGB (Aboveground Biomass): Total estimated above-ground vegetation biomass"
              }
              value={formatNumber(data.agb_ton)}
              unit={isId ? "ton" : "tons"}
              icon={Trees}
            />
            <Metric
              label={isId ? "Cadangan Karbon" : "Carbon Stock"}
              sublabel={
                isId
                  ? "tC (Ton Karbon): Total kandungan karbon murni tersimpan dalam biomassa"
                  : "tC (Tonnes of Carbon): Pure stored carbon content in vegetation biomass"
              }
              value={formatNumber(data.carbon_stock_tc)}
              unit="tC"
              icon={Leaf}
            />
            <Metric
              label={isId ? "Potensi Emisi" : "Emissions Potential"}
              sublabel={
                isId
                  ? "CO₂e (Carbon Dioxide Equivalent): Setara emisi gas rumah kaca"
                  : "CO₂e (Carbon Dioxide Equivalent): Greenhouse gas emissions equivalent"
              }
              value={formatNumber(data.co2e_ton)}
              unit="tCO₂e"
              icon={Wind}
            />
          </div>
        </div>

        {/* 3. PETA SPASIAL & CATATAN */}
        <div className="grid md:grid-cols-2 gap-6 items-stretch">
          {geometry ? (
            <div className="h-full flex flex-col">
              <p className="text-[12px] font-extrabold text-emerald-950 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Map className="w-4 h-4 text-emerald-500" />
                {isId ? "Preview Pemetaan Spasial" : "Spatial Mapping Preview"}
              </p>
              <div className="rounded-2xl overflow-hidden border border-emerald-100 flex-1 shadow-inner bg-slate-50 min-h-[380px] flex flex-col relative">
                <MapPreview
                  key={JSON.stringify(geometry)}
                  geometry={geometry}
                  className="w-full h-full flex-1"
                />
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col justify-center items-center p-8 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/20 text-center text-emerald-900/50 text-sm">
              <Map className="w-8 h-8 text-emerald-300 mb-2" />
              <p>
                {isId
                  ? "Data polygon peta spasial tidak tersedia untuk analisis ini."
                  : "Spatial map polygon data not available for this calculation."}
              </p>
            </div>
          )}

          <div
            className={`h-full flex flex-col p-6 bg-slate-50 rounded-2xl border border-slate-200/80 ${
              !geometry ? "md:col-span-2" : ""
            }`}
          >
            <div className="flex items-center gap-2.5 mb-4">
              <AlertCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-[12px] font-extrabold text-slate-900 uppercase tracking-widest">
                {isId ? "Catatan Operasional Admin" : "Admin Operational Notice"}
              </p>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
              <p className="bg-white p-3.5 rounded-xl border border-slate-200">
                {isId ? (
                  <>
                    Laporan ini menampilkan <strong>data lengkap & tidak terkunci</strong> karena diakses melalui portal administrasi. Anda dapat memeriksa rincian biaya, proyeksi finansial, dan mengunduh laporan PDF resmi untuk koordinasi dengan pengaju.
                  </>
                ) : (
                  <>
                    This view displays <strong>full unlocked metrics</strong> because it is accessed through the admin portal. You can review all cost breakdowns, financial projections, and download the official report for follow-up.
                  </>
                )}
              </p>
              {data.created_at && (
                <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {isId ? "Dibuat pada: " : "Submitted on: "}
                    {new Date(data.created_at).toLocaleString(isId ? "id-ID" : "en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4. PROYEKSI FINANSIAL & KREDIT KARBON (SELALU TERBUKA UNTUK ADMIN) */}
        <div className="pt-4 border-t border-emerald-100 space-y-6">
          {/* Currency Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 md:px-6 md:py-4 bg-emerald-50/60 rounded-2xl border border-emerald-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-xs shrink-0">
                <Coins className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-emerald-950">
                  {isId ? "Konversi Mata Uang Finansial" : "Financial Currency Conversion"}
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
                className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-white border border-emerald-200 rounded-xl font-bold text-[13px] text-emerald-950 hover:border-emerald-400 transition-all shadow-xs active:scale-95"
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
                  <div className="absolute right-0 z-40 mt-2 w-56 bg-white border border-emerald-100 rounded-2xl shadow-xl py-2 animate-in fade-in duration-200">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
            <Metric
              label={isId ? "Kredit Karbon" : "Carbon Credits"}
              sublabel={
                isId
                  ? "ACC (Annual Carbon Credits): Estimasi kredit terverifikasi per tahun"
                  : "ACC (Annual Carbon Credits): Estimated verified credits issuable annually"
              }
              value={formatNumber(data.acc_total_credits)}
              unit={isId ? "kredit (tCO₂e)" : "credits (tCO₂e)"}
              icon={TrendingUp}
            />
            <Metric
              label={isId ? "Pendapatan Kotor" : "Gross Revenue"}
              sublabel={
                isId
                  ? "Estimasi total akumulasi pendapatan kotor proyek karbon"
                  : "Estimated total gross revenue from carbon project"
              }
              value={formatCurrency(data.gross_revenue_usd)}
              icon={CircleDollarSign}
            />
            <Metric
              label={isId ? "Total Biaya Proyek" : "Total Project Cost"}
              sublabel={
                isId
                  ? "Akumulasi belanja modal (CAPEX) & operasional (OPEX)"
                  : "Accumulated capital expenditure (CAPEX) & operating costs (OPEX)"
              }
              value={formatCurrency(costBreakdown?.total_cost_usd ?? data.total_cost_usd)}
              icon={Wallet}
            />
            <Metric
              label={isId ? "Pendapatan Bersih" : "Net Revenue"}
              sublabel={
                isId
                  ? "Estimasi keuntungan bersih proyek setelah dikurangi seluruh biaya"
                  : "Estimated net project profit after deducting all costs"
              }
              value={formatCurrency(data.net_revenue_usd)}
              highlight
              icon={LineChart}
            />
          </div>

          {/* Komponen Skor */}
          {componentScores && (
            <div className="p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100">
              <p className="text-[12px] font-extrabold text-emerald-950 uppercase tracking-widest mb-4">
                {isId ? "Komponen Skor Kelayakan" : "Feasibility Score Components"}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  {
                    k: "carbon_score",
                    l: isId ? "Karbon" : "Carbon",
                    desc: isId ? "ER: Potensi serapan karbon" : "ER: Carbon sequestration",
                    ic: Leaf,
                    color: "text-emerald-500",
                  },
                  {
                    k: "legality_score",
                    l: isId ? "Legalitas" : "Legality",
                    desc: isId ? "HGU & Status Kawasan" : "HGU & Land Tenure",
                    ic: Scale,
                    color: "text-amber-500",
                  },
                  {
                    k: "biodiversity_score",
                    l: isId ? "Biodiversitas" : "Biodiversity",
                    desc: isId ? "Keanekaragaman hayati" : "Biodiversity & species",
                    ic: Sprout,
                    color: "text-green-500",
                  },
                  {
                    k: "social_score",
                    l: isId ? "Sosial" : "Social",
                    desc: isId ? "Dampak masyarakat lokal" : "Community impact",
                    ic: Users,
                    color: "text-sky-500",
                  },
                  {
                    k: "economy_score",
                    l: isId ? "Ekonomi" : "Economy",
                    desc: isId ? "Kelayakan margin pasar" : "Financial viability",
                    ic: CircleDollarSign,
                    color: "text-indigo-500",
                  },
                ].map((c) => {
                  const ScoreIcon = c.ic;
                  const val = componentScores[c.k];
                  return (
                    <div
                      key={c.k}
                      className="p-4 rounded-xl bg-white border border-emerald-100/60 text-center shadow-xs flex flex-col justify-between"
                    >
                      <div className="flex flex-col items-center">
                        <ScoreIcon className={`w-5 h-5 mb-2 ${c.color}`} />
                        <p className="text-[11px] font-extrabold tracking-widest uppercase text-emerald-900 mb-0.5">
                          {c.l}
                        </p>
                        <p className="text-[10px] font-medium text-emerald-700/60 mb-2 leading-tight">
                          {c.desc}
                        </p>
                        <p className="text-xl font-extrabold text-emerald-950">
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
            <div className="p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100">
              <p className="text-[12px] font-extrabold text-emerald-950 uppercase tracking-widest mb-4">
                {isId ? "Rincian Biaya Proyek" : "Project Cost Breakdown"}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Metric
                  label={isId ? "Biaya Pengembangan" : "Development Cost"}
                  sublabel={
                    isId
                      ? "CAPEX (Capital Expenditure): Studi kelayakan teknis, PDD, dan perizinan"
                      : "CAPEX (Capital Expenditure): Technical feasibility study, PDD, and permits"
                  }
                  value={formatCurrency(costBreakdown.development_cost_usd)}
                  icon={TrendingUp}
                />
                <Metric
                  label={isId ? "Biaya MRV" : "MRV Cost"}
                  sublabel={
                    isId
                      ? "MRV: Pengukuran biomassa dan audit satelit"
                      : "MRV: Biomass measurement and satellite monitoring"
                  }
                  value={formatCurrency(costBreakdown.mrv_cost_usd)}
                  icon={BarChart3}
                />
                <Metric
                  label={isId ? "Biaya Validasi" : "Validation Cost"}
                  sublabel={
                    isId
                      ? "VVB (Validation & Verification Body): Audit pihak ketiga"
                      : "VVB (Validation & Verification Body): Third-party independent audit"
                  }
                  value={formatCurrency(costBreakdown.validation_cost_usd)}
                  icon={ShieldCheck}
                />
                <Metric
                  label={isId ? "Biaya Operasional" : "Operational Cost"}
                  sublabel={
                    isId
                      ? "OPEX: Pemeliharaan rutin dan patroli penjagaan hutan"
                      : "OPEX: Routine maintenance and forest patrols"
                  }
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
              <div className="p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                <p className="text-[12px] font-extrabold text-emerald-950 uppercase tracking-widest mb-4">
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
                          className="p-3.5 rounded-xl bg-white border border-emerald-100/60 shadow-xs flex items-center justify-between gap-3"
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
            <div className="p-6 bg-emerald-50/40 rounded-2xl border border-emerald-100/80">
              <p className="text-[12px] font-extrabold text-emerald-950 uppercase tracking-widest mb-3">
                {isId ? "Rekomendasi Strategis Kelayakan" : "Strategic Feasibility Recommendations"}
              </p>
              <ul className="space-y-2.5">
                {recommendations.map((rec: string, i: number) => (
                  <li
                    key={i}
                    className="text-xs sm:text-sm text-emerald-900/80 font-medium flex items-start gap-2.5 leading-relaxed"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span>{translateRecommendation(rec, isId)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-emerald-100">
          <Link
            href={`/${lang}/admin/assessments`}
            className="flex-1 px-5 py-3.5 bg-white border border-emerald-200 text-emerald-800 text-sm font-bold rounded-xl flex justify-center items-center gap-2 hover:bg-emerald-50 transition-colors shadow-xs active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            {isId ? "Kembali ke Semua Assessment" : "Back to All Assessments"}
          </Link>
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="flex-1 px-5 py-3.5 text-sm font-bold bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl flex justify-center items-center gap-2 transition-all shadow-sm active:scale-95"
          >
            <Download className="w-4 h-4" />
            {isId ? "Unduh Laporan PDF Resmi" : "Download Official PDF"}
          </button>
        </div>

      </div>
    </div>
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
      className={`relative p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden ${
        highlight
          ? "bg-gradient-to-br from-emerald-600 to-emerald-800 border-emerald-500 shadow-md text-white"
          : "bg-white border-emerald-100/70 shadow-xs text-emerald-950"
      }`}
    >
      <div className="flex items-start justify-between mb-2 relative z-10 gap-2">
        <div className="flex-1 min-w-0">
          <p
            className={`text-[11px] font-extrabold tracking-widest uppercase ${
              highlight ? "text-emerald-50" : "text-emerald-900"
            }`}
          >
            {label}
          </p>
          {sublabel && (
            <p
              className={`text-[10px] sm:text-[11px] font-medium mt-0.5 leading-snug break-words ${
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
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="relative z-10 mt-2">
        <p className="text-xl sm:text-2xl font-extrabold leading-tight break-words">
          {value}
          {unit && (
            <span
              className={`text-xs sm:text-sm font-bold ml-1.5 ${
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
