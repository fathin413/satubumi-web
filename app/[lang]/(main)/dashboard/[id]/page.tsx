"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft, Download, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { extractErrorMessage, getErrorMessage } from "@/lib/error";

const MapPreview = dynamic(() => import("../../../../../components/MapPreview"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-72 bg-emerald-50 rounded-2xl animate-pulse border border-emerald-100" />
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
          throw new Error(await extractErrorMessage(res, isId ? "Assessment tidak ditemukan" : "Assessment not found", lang));
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
        throw new Error(await extractErrorMessage(res, isId ? "Gagal menghapus assessment" : "Failed to delete assessment", lang));
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

  const formatNumber = (n: number) =>
    new Intl.NumberFormat(isId ? "id-ID" : "en-US", { maximumFractionDigits: 0 }).format(n || 0);
  const formatCurrency = (n: number) =>
    new Intl.NumberFormat(isId ? "id-ID" : "en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n || 0);

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
          <p className="text-rose-600 font-medium mb-6">{error || (isId ? "Assessment tidak ditemukan" : "Assessment not found")}</p>
          <Link href={`/${lang}/dashboard`} className="text-emerald-700 font-bold hover:underline">
            {isId ? "Kembali ke Dashboard" : "Back to Dashboard"}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8faf9] pt-32 pb-24 px-6 relative font-sans">
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
              {isId ? "Apakah Anda yakin ingin menghapus assessment untuk" : "Are you sure you want to delete assessment for"}{" "}
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
      <div className="max-w-[1000px] mx-auto">
        
        {/* Back */}
        <Link
          href={`/${lang}/dashboard`}
          className="inline-flex items-center gap-2 text-emerald-800/60 font-bold hover:text-emerald-800 mb-10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {isId ? "Kembali ke Dashboard" : "Back to Dashboard"}
        </Link>

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-6 mb-10">
          <div>
            <p className="text-[12px] font-semibold tracking-[0.15em] uppercase text-emerald-700 mb-3">
              Assessment Detail
            </p>
            <h1 className="text-3xl md:text-4xl font-extrabold text-emerald-950 tracking-tight mb-2">
              {data.location_name || data.locationName || "Unnamed Project"}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-emerald-900/50 font-medium">
              {data.ecosystem_type && (
                <span className="capitalize">{String(data.ecosystem_type).replace(/_/g, " ")}</span>
              )}
              {data.area_ha && <span>· {Number(data.area_ha).toLocaleString()} ha</span>}
              {data.project_duration_years && <span>· {data.project_duration_years} years</span>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white text-sm font-bold rounded-2xl hover:bg-emerald-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              disabled={deleting}
              className="inline-flex items-center gap-2 px-5 py-3 border border-rose-200 text-rose-600 text-sm font-bold rounded-2xl hover:bg-rose-50 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? "..." : isId ? "Hapus" : "Delete"}
            </button>
          </div>
        </div>

        {/* Score card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-emerald-100/60 p-8 mb-8 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8 pb-6 border-b border-emerald-50">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-emerald-800/50 mb-2">
                {isId ? "Skor Kelayakan" : "Feasibility Score"}
              </p>
              <div className="flex items-end gap-2">
                <span className="text-5xl font-extrabold text-emerald-700">
                  {typeof data.feasibility_score === "number" ? data.feasibility_score.toFixed(1) : "-"}
                </span>
                <span className="text-xl text-emerald-900/20 mb-1">/100</span>
              </div>
            </div>
            {data.feasibility_category && (
              <span className="px-4 py-1.5 bg-emerald-50 text-emerald-800 text-sm font-bold rounded-full border border-emerald-100">
                {data.feasibility_category}
              </span>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Metric label="Carbon Stock (CO₂e)" value={`${formatNumber(data.co2e_ton)} t`} />
            <Metric label="Total Credits (ACC)" value={`${formatNumber(data.acc_total_credits)} t`} />
            <Metric label="Gross Revenue" value={formatCurrency(data.gross_revenue_usd)} />
            <Metric label="Net Revenue" value={formatCurrency(data.net_revenue_usd)} />
            <Metric label="Total Cost" value={formatCurrency(data.cost_breakdown?.total_cost_usd)} />
            <Metric label="AGB" value={`${formatNumber(data.agb_ton)} ton`} />
          </div>
        </div>

        {/* Map */}
        {data.geometry && (
          <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-emerald-100/60 p-8 mb-8 shadow-sm">
            <p className="text-sm font-bold text-emerald-900 mb-4">
              {isId ? "Pratinjau Peta Area" : "Map Preview"}
            </p>
            <MapPreview geometry={data.geometry} />
          </div>
        )}

        {/* Recommendations */}
        {data.recommendations?.length > 0 && (
          <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-emerald-100/60 p-8 shadow-sm">
            <p className="text-sm font-bold text-emerald-900 mb-4">
              {isId ? "Rekomendasi" : "Recommendations"}
            </p>
            <ul className="space-y-3">
              {data.recommendations.map((rec: string, i: number) => (
                <li key={i} className="text-sm text-emerald-950/70 font-medium flex gap-2">
                  <span className="text-emerald-500">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
      <p className="text-[11px] font-bold tracking-wide uppercase text-emerald-800/50 mb-1">{label}</p>
      <p className="text-xl font-extrabold text-emerald-950">{value}</p>
    </div>
  );
}