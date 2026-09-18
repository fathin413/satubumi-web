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
} from "lucide-react";
import { extractErrorMessage, getErrorMessage } from "@/lib/error";

const MapPreview = dynamic(() => import("../../../../../components/MapPreview"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-72 bg-emerald-50 rounded-2xl animate-pulse border border-emerald-100 flex items-center justify-center">
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

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.push(`/${lang}/login`);
        return;
      }

      try {
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

  const handleDownloadPDF = async () => {
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
  const formatCurrency = (n: number | null | undefined) =>
    new Intl.NumberFormat(isId ? "id-ID" : "en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(Number(n) || 0);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8faf9] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-[#f8faf9] flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-rose-600 font-medium mb-6">
            {error || (isId ? "Assessment tidak ditemukan" : "Assessment not found")}
          </p>
          <Link
            href={`/${lang}/dashboard`}
            className="text-emerald-700 font-bold hover:underline"
          >
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
    <main className="min-h-screen bg-[#f8faf9] pt-32 pb-24 px-4 sm:px-6 relative font-sans">
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

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Back Link */}
        <Link
          href={`/${lang}/dashboard`}
          className="inline-flex items-center gap-2 text-emerald-800/60 font-bold hover:text-emerald-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {isId ? "Kembali ke Dashboard" : "Back to Dashboard"}
        </Link>

        {/* Header Title & Actions */}
        <div className="flex flex-wrap items-start justify-between gap-6 pb-2">
          <div>
            <p className="text-[12px] font-extrabold tracking-[0.15em] uppercase text-emerald-700 mb-2">
              {isId ? "Detail Laporan Assessment" : "Assessment Report Detail"}
            </p>
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
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-emerald-700 text-white text-[14px] font-bold rounded-2xl hover:bg-emerald-600 transition-colors shadow-sm active:scale-95"
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

        {/* ================= UTAMA: HASIL PERSIS RAPID-FS ================= */}
        <div className="bg-white/90 backdrop-blur-2xl rounded-[2.5rem] border border-white p-8 md:p-10 space-y-8 shadow-[0_10px_40px_-10px_rgba(4,43,34,0.08)]">
          
          {/* 1. Skor Kelayakan Indikatif (ICPFS) */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-emerald-50">
            <div>
              <p className="text-[12px] font-extrabold tracking-widest uppercase text-emerald-950 mb-2">
                {isId ? "Skor kelayakan indikatif (ICPFS)" : "Indicative score (ICPFS)"}
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
                {data.feasibility_category}
              </span>
            )}
          </div>

          {/* 2. Primary Metrics Grid (Persis Rapid-FS) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            <Metric label="AGB" value={formatNumber(data.agb_ton)} unit="t" icon={Trees} />
            <Metric
              label={isId ? "Cadangan karbon" : "Carbon stock"}
              value={formatNumber(data.carbon_stock_tc)}
              unit="tC"
              icon={Leaf}
            />
            <Metric label="CO₂e" value={formatNumber(data.co2e_ton)} unit="t" icon={Wind} />
            <Metric
              label={isId ? "Kredit (ACC)" : "Total credits"}
              value={formatNumber(data.acc_total_credits)}
              unit="t"
              icon={TrendingUp}
            />
            <Metric
              label="Gross Revenue"
              value={formatCurrency(data.gross_revenue_usd)}
              icon={CircleDollarSign}
            />
            <Metric
              label={isId ? "Total biaya" : "Total cost"}
              value={formatCurrency(costBreakdown?.total_cost_usd ?? data.total_cost_usd)}
              icon={Wallet}
            />
            <Metric
              label="Net Revenue"
              value={formatCurrency(data.net_revenue_usd)}
              highlight
              icon={LineChart}
            />
          </div>

          {/* 3. Komponen Skor (Carbon, Legal, Bio, Sosial, Ekonomi) */}
          {componentScores && (
            <div className="p-6 md:p-8 bg-emerald-50/50 rounded-[1.5rem] border border-emerald-100">
              <p className="text-[12px] font-extrabold text-emerald-950 uppercase tracking-widest mb-5">
                {isId ? "Komponen skor" : "Score components"}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { k: "carbon_score", l: isId ? "Karbon" : "Carbon", ic: Leaf, color: "text-emerald-500" },
                  { k: "legality_score", l: isId ? "Legal" : "Legal", ic: Scale, color: "text-amber-500" },
                  { k: "biodiversity_score", l: isId ? "Bio" : "Bio", ic: Sprout, color: "text-green-500" },
                  { k: "social_score", l: isId ? "Sosial" : "Social", ic: Users, color: "text-sky-500" },
                  { k: "economy_score", l: isId ? "Ekonomi" : "Economy", ic: CircleDollarSign, color: "text-indigo-500" },
                ].map((c) => {
                  const ScoreIcon = c.ic;
                  const val = componentScores[c.k];
                  return (
                    <div
                      key={c.k}
                      className="p-4 rounded-[1.25rem] bg-white border border-emerald-100/60 text-center shadow-sm hover:shadow-md transition-all relative overflow-hidden group hover:-translate-y-1"
                    >
                      <div className="absolute inset-0 bg-emerald-50/0 group-hover:bg-emerald-50/50 transition-colors duration-300" />
                      <div className="relative z-10 flex flex-col items-center">
                        <ScoreIcon className={`w-5 h-5 mb-2 ${c.color} opacity-80`} />
                        <p className="text-[11px] font-extrabold tracking-widest uppercase text-emerald-900 mb-1">
                          {c.l}
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

          {/* 4. Rincian Biaya (Cost Breakdown) */}
          {costBreakdown && (
            <div className="p-6 md:p-8 bg-emerald-50/50 rounded-[1.5rem] border border-emerald-100">
              <p className="text-[12px] font-extrabold text-emerald-950 uppercase tracking-widest mb-5">
                {isId ? "Rincian biaya" : "Cost breakdown"}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Metric
                  label={isId ? "Pengembangan" : "Development"}
                  value={formatCurrency(costBreakdown.development_cost_usd)}
                  icon={TrendingUp}
                />
                <Metric
                  label="MRV"
                  value={formatCurrency(costBreakdown.mrv_cost_usd)}
                  icon={BarChart3}
                />
                <Metric
                  label={isId ? "Validasi" : "Validation"}
                  value={formatCurrency(costBreakdown.validation_cost_usd)}
                  icon={ShieldCheck}
                />
                <Metric
                  label={isId ? "Operasional" : "Operational"}
                  value={formatCurrency(costBreakdown.operational_cost_usd)}
                  icon={Activity}
                />
              </div>
            </div>
          )}

          {/* 5. Lapisan Overlay Spasial (Jika Ada) */}
          {spatialOverlay &&
            typeof spatialOverlay === "object" &&
            Object.keys(spatialOverlay).length > 0 && (
              <div className="p-6 md:p-8 bg-emerald-50/50 rounded-[1.5rem] border border-emerald-100">
                <p className="text-[12px] font-extrabold text-emerald-950 uppercase tracking-widest mb-5">
                  {isId ? "Lapisan overlay spasial" : "Spatial overlay layers"}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(spatialOverlay)
                    .filter(([key]) => !key.toLowerCase().includes("slop"))
                    .map(([key, val]) => {
                      const label = key.replace(/^\d+_/, "").replace(/_/g, " ");
                      let displayValue = "—";
                      let fungsi = "";

                      if (val != null && typeof val === "object" && !Array.isArray(val)) {
                        const obj = val as { value?: unknown; fungsi?: string };
                        if (obj.value !== undefined && obj.value !== null) {
                          displayValue =
                            typeof obj.value === "boolean"
                              ? obj.value
                                ? isId ? "Ya" : "Yes"
                                : isId ? "Tidak" : "No"
                              : String(obj.value);
                        }
                        if (obj.fungsi) fungsi = String(obj.fungsi);
                      } else if (val != null) {
                        displayValue = String(val);
                      }

                      return (
                        <div
                          key={key}
                          className="bg-white border border-emerald-100 p-4 rounded-[1rem] shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
                        >
                          <span className="capitalize text-[12px] font-extrabold text-emerald-900 tracking-widest uppercase mb-1">
                            {label}
                          </span>
                          <div className="flex flex-col">
                            <span className="text-[15px] font-extrabold text-emerald-950">
                              {displayValue}
                            </span>
                            {fungsi && (
                              <span className="text-[12px] font-medium text-emerald-700/70 mt-1 bg-emerald-50 self-start px-2 py-0.5 rounded-md">
                                {fungsi}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

          {/* 6. Grid 2 Kolom: Peta Spasial & Rekomendasi */}
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-stretch">
            {geometry ? (
              <div className="h-full flex flex-col">
                <p className="text-[12px] font-extrabold text-emerald-950 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Map className="w-4 h-4 text-emerald-500" />
                  {isId ? "Pemetaan Spasial" : "Spatial Mapping"}
                </p>
                <div className="rounded-[1.5rem] overflow-hidden border border-emerald-100 flex-1 shadow-inner bg-slate-50 min-h-[300px] hover:shadow-md transition-shadow">
                  <MapPreview key={JSON.stringify(geometry)} geometry={geometry} />
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col justify-center items-center p-8 rounded-[1.5rem] border border-dashed border-emerald-200 bg-emerald-50/20 text-center text-emerald-900/50 text-sm">
                <Map className="w-8 h-8 text-emerald-300 mb-2" />
                <p>{isId ? "Data peta spasial tidak tersedia untuk analisis manual." : "Spatial map data not available for manual calculation."}</p>
              </div>
            )}

            {recommendations.length > 0 ? (
              <div className="h-full flex flex-col p-6 md:p-8 bg-emerald-50/50 rounded-[1.5rem] border border-emerald-100 hover:shadow-sm transition-all duration-300">
                <p className="text-[12px] font-extrabold text-emerald-950 uppercase tracking-widest mb-5">
                  {isId ? "Rekomendasi" : "Recommendations"}
                </p>
                <ul className="space-y-4">
                  {recommendations.map((rec: string, i: number) => (
                    <li
                      key={i}
                      className="text-[14px] text-emerald-900/80 font-medium flex items-start gap-3 leading-relaxed hover:text-emerald-950 transition-colors"
                    >
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="h-full flex flex-col justify-center items-center p-8 rounded-[1.5rem] border border-dashed border-emerald-200 bg-emerald-50/20 text-center text-emerald-900/50 text-sm">
                <CheckCircle2 className="w-8 h-8 text-emerald-300 mb-2" />
                <p>{isId ? "Belum ada rekomendasi khusus untuk proyek ini." : "No specific recommendations available for this project."}</p>
              </div>
            )}
          </div>

          {/* 7. Bottom Action Bar */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-emerald-50">
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="flex-1 px-6 py-4 bg-emerald-800 text-white text-[15px] font-bold rounded-2xl flex justify-center items-center gap-2 hover:bg-emerald-900 transition-all duration-300 shadow-md shadow-emerald-950/20 active:scale-95"
            >
              <Download className="w-5 h-5" />
              {isId ? "Unduh Laporan (PDF)" : "Download Report (PDF)"}
            </button>
            <Link
              href={`/${lang}/dashboard`}
              className="flex-1 px-6 py-4 bg-white border border-emerald-200/80 text-emerald-800 text-[15px] font-bold rounded-2xl flex justify-center items-center gap-2 hover:bg-emerald-50 transition-all duration-300 shadow-sm active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
              {isId ? "Kembali ke Dashboard" : "Back to Dashboard"}
            </Link>
          </div>

        </div>
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
  unit,
  highlight = false,
  icon: Icon,
}: {
  label: string;
  value: string;
  unit?: string;
  highlight?: boolean;
  icon?: any;
}) {
  return (
    <div
      className={`relative p-5 md:p-6 rounded-[1.5rem] border transition-all duration-300 ease-out flex flex-col justify-center hover:-translate-y-1.5 overflow-hidden ${
        highlight
          ? "bg-gradient-to-br from-emerald-600 to-emerald-800 border-emerald-500 shadow-lg shadow-emerald-900/20 text-white"
          : "bg-white border-emerald-100/60 shadow-sm hover:shadow-md text-emerald-950"
      }`}
    >
      {highlight && (
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      )}
      <div className="flex items-center justify-between mb-3 relative z-10">
        <p
          className={`text-[11px] md:text-[12px] font-extrabold tracking-widest uppercase ${
            highlight ? "text-emerald-50" : "text-emerald-900"
          }`}
        >
          {label}
        </p>
        {Icon && (
          <div
            className={`p-2 rounded-xl ${
              highlight ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-600"
            }`}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-1 relative z-10">
        <span
          className={`text-2xl md:text-3xl font-extrabold tracking-tight ${
            highlight ? "text-white" : "text-emerald-950"
          }`}
        >
          {value}
        </span>
        {unit && (
          <span
            className={`text-xs md:text-sm font-bold ${
              highlight ? "text-emerald-100" : "text-emerald-800/40"
            }`}
          >
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}