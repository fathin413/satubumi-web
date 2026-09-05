"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  UploadCloud,
  FileArchive,
  BarChart3,
  Save,
  Download,
  CheckCircle2,
  AlertCircle,
  Leaf,
  Map,
  LockKeyhole,
  Info,
  Clock,
  X,
  Trash2,
} from "lucide-react";
import ScrollReveal from "../../../../../components/ScrollReveal";
import en from "../../../../../dictionaries/en.json";
import id from "../../../../../dictionaries/id.json";

const MapPreview = dynamic(() => import("../../../../../components/MapPreview"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[250px] bg-emerald-50/50 rounded-[1.5rem] animate-pulse border border-emerald-100 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  ),
});

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const ecosystemOptions = [
  { label: "Hutan Tropis", value: "hutan_tropis" },
  { label: "Mangrove", value: "mangrove" },
  { label: "Gambut", value: "gambut" },
  { label: "Agroforestri", value: "agroforestri" },
  { label: "Lahan Terdegradasi", value: "lahan_terdegradasi" },
];

function humanizeError(raw: string, isId: boolean, mode: "spatial" | "manual") {
  const msg = (raw || "").toLowerCase();

  if (msg.includes("nan") || msg.includes("area_ha") || msg.includes("greater than 0")) {
    return isId
      ? "Luas area dari file peta tidak bisa dihitung. Coba batas lokasi proyek yang lebih kecil, pastikan ZIP berisi .shp, .shx, .dbf, dan .prj, lalu unggah ulang."
      : "We couldn't calculate the area from your map file. Try a smaller project boundary, ensure the ZIP includes .shp, .shx, .dbf, and .prj, then upload again.";
  }
  if (msg.includes("failed to fetch") || msg.includes("network") || msg.includes("fetch")) {
    return isId
      ? "Tidak terhubung ke server. Pastikan koneksi stabil dan backend sedang berjalan."
      : "Could not reach the server. Check your connection and make sure the backend is running.";
  }
  if (msg.includes("401") || msg.includes("unauthorized") || msg.includes("credential")) {
    return isId
      ? "Sesi login sudah berakhir. Silakan masuk lagi, lalu ulangi analisis."
      : "Your session has expired. Please sign in again, then retry.";
  }
  if (msg.includes("413") || msg.includes("too large") || msg.includes("payload")) {
    return isId
      ? "File terlalu besar untuk server. Sederhanakan peta atau potong area menjadi lebih kecil."
      : "The file is too large for the server. Simplify the map or use a smaller area.";
  }
  if (msg.includes("timeout") || msg.includes("timed out")) {
    return isId
      ? "Proses terlalu lama dan terhenti. File besar butuh waktu lebih lama — coba area lebih kecil atau ulangi nanti."
      : "The process timed out. Larger files need more time — try a smaller area or retry later.";
  }
  if (msg.includes("zip") || msg.includes("shapefile") || msg.includes("shp")) {
    return isId
      ? "File peta tidak bisa dibaca. Pastikan format ZIP dan shapefile lengkap (.shp, .shx, .dbf, .prj)."
      : "The map file could not be read. Use a ZIP with a complete shapefile (.shp, .shx, .dbf, .prj).";
  }
  if (msg.includes("upload") && mode === "spatial") {
    return isId
      ? "Unggahan gagal diproses. Periksa file peta Anda, lalu coba lagi."
      : "The upload could not be processed. Check your map file and try again.";
  }
  if (raw.length > 180) {
    return isId
      ? "Analisis belum berhasil. Periksa input Anda, lalu coba lagi. Jika berulang, hubungi tim teknis."
      : "The analysis could not be completed. Check your inputs and try again. If it keeps happening, contact support.";
  }
  return raw;
}

export default function ProductsPage() {
  const params = useParams();
  const lang = (params?.lang as string) || "en";
  const dict = lang === "id" ? id : en;
  const t = dict.products;
  const isId = lang === "id";

  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);
  const [mode, setMode] = useState<"spatial" | "manual">("spatial");

  const [locationName, setLocationName] = useState("");
  const [ecosystemType, setEcosystemType] = useState("hutan_tropis");
  const [area, setArea] = useState("");
  const [duration, setDuration] = useState("30");
  const [carbonPrice, setCarbonPrice] = useState("10");

  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setIsLoggedIn(false);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setUser(await res.json());
          setIsLoggedIn(true);
        } else {
          localStorage.removeItem("access_token");
          setIsLoggedIn(false);
        }
      } catch {
        setIsLoggedIn(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (!results || !resultsRef.current) return;
    const timer = setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
    return () => clearTimeout(timer);
  }, [results]);

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileSelect = (file: File) => {
    if (!file.name.toLowerCase().endsWith(".zip")) {
      setError(
        isId
          ? "File harus berformat ZIP yang berisi peta shapefile (.shp, .shx, .dbf, .prj)."
          : "The file must be a ZIP containing a shapefile (.shp, .shx, .dbf, .prj)."
      );
      return;
    }
    setSelectedFile(file);
    setError(null);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleCancelCalculate = () => {
    abortRef.current?.abort();
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsCalculating(true);
    setError(null);
    setSuccessMsg(null);
    setResults(null);
    setSavedId(null);

    try {
      let response: Response;

      if (mode === "spatial") {
        if (!selectedFile) {
          throw new Error(
            isId
              ? "Silakan unggah file peta (ZIP) terlebih dahulu."
              : "Please upload a map file (ZIP) first."
          );
        }
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("location_name", locationName || "Spatial Project");
        formData.append("ecosystem_type", ecosystemType);
        response = await fetch(`${API_URL}/rapid-fs/upload-shapefile`, {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });
      } else {
                response = await fetch(`${API_URL}/rapid-fs/calculate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location_name: locationName || "Unnamed Project",
            area_ha: parseFloat(area),
            ecosystem_type: ecosystemType,
            project_duration_years: parseInt(duration) || 30,
            carbon_price_usd: parseFloat(carbonPrice) || 10,
            ...(latitude.trim() !== "" && !Number.isNaN(parseFloat(latitude))
              ? { latitude: parseFloat(latitude) }
              : {}),
            ...(longitude.trim() !== "" && !Number.isNaN(parseFloat(longitude))
              ? { longitude: parseFloat(longitude) }
              : {}),
          }),
          signal: controller.signal,
        });
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        let message = isId
          ? "Analisis belum berhasil diselesaikan."
          : "The analysis could not be completed.";
        if (typeof errData.detail === "string") message = errData.detail;
        else if (Array.isArray(errData.detail)) {
          message = errData.detail
            .map((e: any) => e.msg || e.message || "")
            .filter(Boolean)
            .join(", ");
        }
        throw new Error(humanizeError(message, isId, mode));
      }

      const calculatedData = await response.json();
      setResults(calculatedData);

      // FITUR AUTO-SAVE (BACKGROUND)
      try {
        const token = localStorage.getItem("access_token");
        if (token) {
          const payload = {
            rapid_fs_result: calculatedData,
            submitter_name: user?.full_name || undefined,
            submitter_email: user?.email || undefined,
            submitter_phone: user?.phone_number || user?.phone || undefined,
            is_draft: true,
          };
          const autoSaveRes = await fetch(`${API_URL}/assessments`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          });
          if (autoSaveRes.ok) {
            const savedData = await autoSaveRes.json();
            setSavedId(savedData.id || savedData._id || null);
          }
        }
      } catch (autoErr) {
        console.error("Auto-save background process failed", autoErr);
      }

    } catch (err: any) {
      if (err?.name === "AbortError") {
        setError(isId ? "Analisis dibatalkan oleh pengguna." : "Analysis cancelled by user.");
      } else {
        setError(humanizeError(err.message || "Error", isId, mode));
      }
    } finally {
      setIsCalculating(false);
      abortRef.current = null;
    }
  };

  const handleSave = async () => {
    if (!results) return;
    setIsSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error(
          isId
            ? "Sesi login sudah berakhir. Silakan masuk lagi."
            : "Your session has expired. Please sign in again."
        );
      }

      const payload = {
        rapid_fs_result: results,
        submitter_name: user?.full_name || undefined,
        submitter_email: user?.email || undefined,
        submitter_phone: user?.phone_number || user?.phone || undefined,
        is_draft: false,
      };

      let response;

      if (savedId) {
        response = await fetch(`${API_URL}/assessments/${savedId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ is_draft: false }),
        });

        if (!response.ok) {
          response = await fetch(`${API_URL}/assessments`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          });
        }
      } else {
        response = await fetch(`${API_URL}/assessments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        let message = isId
          ? "Hasil belum berhasil disimpan. Coba lagi beberapa saat."
          : "Could not save the results. Please try again shortly.";
        if (typeof errData.detail === "string") message = errData.detail;
        else if (Array.isArray(errData.detail)) {
          message = errData.detail
            .map((e: any) => {
              const loc = Array.isArray(e.loc) ? e.loc.join(".") : "";
              return e.msg ? (loc ? `${loc}: ${e.msg}` : e.msg) : "";
            })
            .filter(Boolean)
            .join(" | ");
        }
        throw new Error(message);
      }

      const data = await response.json();
      if (!savedId) setSavedId(data.id || data._id || null);
      setSuccessMsg(
        isId
          ? "Hasil analisis berhasil disimpan ke akun Anda."
          : "Analysis results were saved to your account."
      );
      setShowSaveSuccess(true);
    } catch (err: any) {
      setError(humanizeError(err.message || "Error", isId, mode));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!savedId) {
      setError(
        isId
          ? "Simpan hasil analisis terlebih dahulu sebelum mengunduh PDF."
          : "Please save the analysis before downloading the PDF."
      );
      return;
    }
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_URL}/reports/${savedId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error(
          isId
            ? "PDF belum bisa diunduh. Coba simpan ulang atau ulangi nanti."
            : "The PDF could not be downloaded. Try saving again or retry later."
        );
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Satubumi-Report-${savedId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(humanizeError(err.message || "Error", isId, mode));
    }
  };

  const formatNumber = (n: number) =>
    new Intl.NumberFormat(isId ? "id-ID" : "en-US", {
      maximumFractionDigits: 0,
    }).format(n || 0);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat(isId ? "id-ID" : "en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n || 0);

  const steps =
    mode === "spatial"
      ? isId
        ? [
            "Unggah file peta ZIP di panel kanan",
            "Isi nama lokasi dan tipe ekosistem",
            "Jalankan analisis dan tunggu hingga selesai",
          ]
        : [
            "Upload a map ZIP on the right panel",
            "Enter location name and ecosystem type",
            "Run the analysis and wait until it finishes",
          ]
      : isId
      ? [
          "Isi nama lokasi dan tipe ekosistem di panel kanan",
          "Masukkan luas (ha), durasi, dan harga karbon",
          "Jalankan analisis dan tunggu hingga selesai",
        ]
      : [
          "Enter location and ecosystem on the right panel",
          "Enter area (ha), duration, and carbon price",
          "Run the analysis and wait until it finishes",
        ];

  const fileSizeMb = selectedFile ? selectedFile.size / (1024 * 1024) : 0;

  if (isLoggedIn === null) {
    return (
      <main className="min-h-screen bg-[#F1F6F4] flex flex-col items-center justify-center font-sans pt-32 pb-24">
        <div className="w-16 h-16 relative flex items-center justify-center mb-6">
          <div className="absolute inset-0 border-4 border-emerald-100 rounded-full" />
          <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin" />
          <Leaf className="w-5 h-5 text-emerald-500" />
        </div>
        <p className="text-emerald-800/60 font-bold tracking-widest uppercase text-sm">
          Authenticating Workspace...
        </p>
      </main>
    );
  }

  if (!isLoggedIn) {
    return (
      <main className="min-h-screen bg-[#F1F6F4] flex flex-col items-center justify-center pt-32 pb-24 px-4 font-sans relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-emerald-300/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-cyan-300/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-[500px] w-full bg-white/70 backdrop-blur-3xl rounded-[3rem] border border-white p-10 md:p-14 text-center shadow-[0_20px_60px_-15px_rgba(4,43,34,0.1)] relative z-10">
          <div className="w-20 h-20 bg-emerald-50 rounded-[1.8rem] flex items-center justify-center mx-auto mb-8 border border-emerald-100 shadow-inner">
            <LockKeyhole className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-emerald-950 mb-4 tracking-tight">
            {t.login_required}
          </h1>
          <p className="text-emerald-900/60 mb-10 font-medium leading-relaxed">
            {isId
              ? "Sistem Rapid-FS membutuhkan autentikasi untuk memproses data spasial dan kalkulasi karbon secara akurat."
              : "Rapid-FS requires authentication to process spatial data and carbon calculations accurately."}
          </p>
          <div className="flex flex-col gap-4">
            <Link
              href={`/${lang}/login`}
              className="w-full py-4 bg-emerald-700 text-white font-bold rounded-2xl hover:bg-emerald-600 transition-colors shadow-sm active:scale-95"
            >
              {t.login_btn}
            </Link>
            <Link
              href={`/${lang}/register`}
              className="w-full py-4 border border-emerald-100 bg-emerald-50/50 text-emerald-800 font-bold rounded-2xl hover:bg-emerald-50 transition-colors active:scale-95"
            >
              {t.register_btn}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-[#F1F6F4] min-h-screen pt-32 pb-32 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-emerald-50/60 to-transparent pointer-events-none z-0" />
      <div className="absolute top-[10%] right-[-5%] w-[600px] h-[600px] bg-emerald-300/15 rounded-full blur-[150px] pointer-events-none z-0" />
      <div className="absolute bottom-[20%] left-[-5%] w-[500px] h-[500px] bg-cyan-300/15 rounded-full blur-[150px] pointer-events-none z-0" />

      {/* ========================================= */}
      {/* MODAL 1: LOADING & CANCEL BUTTON (Spring Bounce) */}
      {/* ========================================= */}
      {isCalculating && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] border border-emerald-100 shadow-2xl max-w-md w-full p-10 text-center relative overflow-hidden animate-in zoom-in-[0.5] fade-in duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
            <div className="w-16 h-16 mx-auto mb-6 relative flex items-center justify-center">
              <div className="absolute inset-0 border-4 border-emerald-100 rounded-full" />
              <div className="absolute inset-0 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <Leaf className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-xl font-extrabold text-emerald-950 mb-2">
              {isId ? "Sedang menganalisis…" : "Analyzing your project…"}
            </h3>
            <p className="text-sm font-medium text-emerald-900/60 leading-relaxed mb-4">
              {mode === "spatial"
                ? isId
                  ? "Sistem membaca peta dan menghitung kelayakan. File lebih besar membutuhkan waktu lebih lama."
                  : "Reading your map and calculating feasibility. Larger files take longer."
                : isId
                ? "Menghitung skor kelayakan dari data Anda."
                : "Calculating feasibility from your inputs."}
            </p>
            {mode === "spatial" && fileSizeMb > 20 && (
              <p className="text-sm font-semibold text-amber-700 mb-3 bg-amber-50 p-2 rounded-lg border border-amber-100">
                {isId
                  ? `Ukuran file ±${fileSizeMb.toFixed(1)} MB — mohon bersabar.`
                  : `File ~${fileSizeMb.toFixed(1)} MB — please wait.`}
              </p>
            )}
            <p className="text-[11px] font-bold text-emerald-700/60 uppercase tracking-widest mb-8">
              {isId ? "Jangan tutup halaman ini" : "Please keep this page open"}
            </p>

            <button
              type="button"
              onClick={handleCancelCalculate}
              className="w-full py-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 font-extrabold text-[13px] hover:bg-rose-100 hover:text-rose-700 transition-all duration-300 flex items-center justify-center gap-2 active:scale-95"
            >
              <X className="w-4 h-4" />
              {isId ? "Batalkan Analisis" : "Cancel Analysis"}
            </button>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* MODAL 2: SAVE SUCCESS (Spring Bounce + Ping) */}
      {/* ========================================= */}
      {showSaveSuccess && (
        <div className="fixed inset-0 z-[110] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-sm w-full overflow-hidden flex flex-col relative animate-in zoom-in-[0.5] fade-in duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
            
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 pt-10 pb-8 px-8 text-center relative overflow-hidden">
              {/* Efek Ping Ring Putih di Belakang */}
              <div className="w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center shadow-lg relative z-10">
                <div className="absolute inset-0 rounded-full border-2 border-white animate-ping opacity-50 duration-1000" />
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
            </div>

            <div className="p-8 pt-6 text-center">
              <h3 className="text-2xl font-extrabold text-emerald-950 mb-2">
                {isId ? "Berhasil Disimpan!" : "Saved Successfully!"}
              </h3>
              <p className="text-[13px] font-medium text-emerald-900/60 leading-relaxed mb-6">
                {isId
                  ? "Hasil Rapid-FS telah diamankan ke database. Anda dapat meninjaunya kembali kapan saja."
                  : "The Rapid-FS result has been secured to the database. You can review it anytime."}
              </p>

              <div className="bg-emerald-50/50 border border-emerald-100/80 rounded-2xl p-4 mb-8 text-left">
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-emerald-100/50">
                  <span className="text-[11px] font-bold text-emerald-900/50 uppercase tracking-widest">
                    {isId ? "Nama Proyek" : "Project"}
                  </span>
                  <span className="text-[13px] font-extrabold text-emerald-950 truncate max-w-[120px]">
                    {locationName || "Unnamed Project"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-emerald-900/50 uppercase tracking-widest">
                    {isId ? "Skor Final" : "Final Score"}
                  </span>
                  <span className="text-[14px] font-extrabold text-emerald-600">
                    {results?.feasibility_score?.toFixed(1)} / 100
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Link
                  href={`/${lang}/dashboard`}
                  className="w-full py-4 bg-emerald-700 text-white font-bold text-[14px] rounded-2xl hover:bg-emerald-600 transition-colors shadow-sm active:scale-95"
                >
                  {isId ? "Buka Dashboard" : "Open Dashboard"}
                </Link>
                <button
                  type="button"
                  onClick={() => setShowSaveSuccess(false)}
                  className="w-full py-4 bg-white border border-slate-200 text-slate-600 font-bold text-[14px] rounded-2xl hover:bg-slate-50 hover:text-slate-800 transition-colors active:scale-95"
                >
                  {isId ? "Tutup Modal" : "Close Modal"}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <ScrollReveal baseClass="opacity-0 translate-y-4" className="max-w-3xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-md border border-emerald-100/80 mb-6 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[12px] font-bold text-emerald-800 uppercase tracking-widest">
              {t.eyebrow}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-cyan-500 pb-1">
            Rapid-FS Scoring
          </h1>
          <p className="text-lg text-emerald-900/60 font-medium leading-relaxed max-w-2xl mx-auto">
            {t.welcome}
            <span className="text-emerald-900 font-bold">
              {user?.full_name ? ` ${user.full_name}` : ""}
            </span>
            . {t.subtitle}
          </p>
        </ScrollReveal>

        <div className="flex flex-col items-center gap-8">
          <div className="flex flex-col lg:flex-row justify-center items-stretch gap-6 lg:gap-8 w-full max-w-5xl">
            <ScrollReveal delay="delay-100" className="w-full lg:w-[340px] shrink-0 flex flex-col">
              <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white p-8 shadow-[0_10px_40px_-10px_rgba(4,43,34,0.06)] flex flex-col flex-1">
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-5">
                    <Info className="w-4 h-4 text-emerald-600" />
                    <p className="text-[12px] font-bold text-emerald-900/50 uppercase tracking-widest">
                      {isId ? "Langkah" : "Steps"}
                    </p>
                  </div>
                  <ol className="space-y-5">
                    {steps.map((text, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-800 text-[12px] font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="text-[13.5px] font-medium text-emerald-900/70 leading-relaxed">
                          {text}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="w-full h-px bg-slate-100 my-4" />

                <div className="space-y-4 mb-6">
                  <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
                    <div className="flex items-center gap-2 mb-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                        {isId ? "Penting" : "Important"}
                      </p>
                    </div>
                    <p className="text-[13px] text-slate-600 font-medium leading-relaxed">
                      {isId
                        ? "Gunakan batas area proyek, bukan peta nasional. (.shp, .shx, .dbf, .prj)"
                        : "Use a project boundary, not national maps. (.shp, .shx, .dbf, .prj)"}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Clock className="w-3.5 h-3.5 text-sky-500" />
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                        {isId ? "Waktu Proses" : "Processing"}
                      </p>
                    </div>
                    <p className="text-[13px] text-slate-600 font-medium leading-relaxed">
                      {isId
                        ? "File di atas 50 MB mungkin membutuhkan waktu beberapa menit."
                        : "Files over 50 MB may take several minutes to process."}
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="p-5 rounded-[1.25rem] bg-gradient-to-b from-emerald-50/50 to-emerald-50/20 border border-emerald-100/60 text-center hover:bg-emerald-50/80 transition-colors">
                    <p className="text-[13px] font-bold text-emerald-950 mb-1">
                      {isId ? "Butuh Bantuan?" : "Need Help?"}
                    </p>
                    <p className="text-[12px] text-emerald-900/60 font-medium leading-relaxed mb-4">
                      {isId
                        ? "Tim kami siap membantu kendala data spasial Anda."
                        : "Our experts are ready to help with your spatial data."}
                    </p>
                    <Link
                      href={`/${lang}/contact`}
                      className="block w-full py-2.5 bg-white border border-emerald-200 text-emerald-800 text-[12px] font-bold rounded-xl hover:bg-emerald-50 transition-all duration-300 shadow-sm active:scale-95"
                    >
                      {isId ? "Hubungi Support" : "Contact Support"}
                    </Link>
                  </div>
                </div>

                <div className="mt-auto pt-6 flex flex-col items-center justify-center gap-2 border-t border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    Powered By
                  </p>
                  <Image
                    src="/logo2.png"
                    alt="Satubumi Logo"
                    width={100}
                    height={24}
                    className="h-5 w-auto object-contain opacity-40 hover:opacity-80 transition-all duration-300"
                    unoptimized
                  />
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay="delay-200" className="w-full lg:w-[460px] shrink-0 flex flex-col">
              <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white p-8 shadow-[0_10px_40px_-10px_rgba(4,43,34,0.06)] flex flex-col flex-1">
                <div className="flex bg-emerald-50/80 border border-emerald-100 p-1.5 rounded-[1.25rem] mb-7 relative">
                  <div
                    className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-emerald-700 rounded-xl shadow-md transition-all duration-500 ${
                      mode === "spatial" ? "left-1.5" : "left-[calc(50%+1.5px)]"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setMode("spatial");
                      setError(null);
                      setResults(null);
                    }}
                    className={`flex-1 py-3 text-[13px] font-bold rounded-xl relative z-10 flex items-center justify-center gap-2 active:scale-95 transition-all duration-200 ${
                      mode === "spatial" ? "text-white" : "text-emerald-900/50 hover:text-emerald-900/70"
                    }`}
                  >
                    <Map className="w-4 h-4" />
                    {t.spatial_mode}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("manual");
                      setError(null);
                      setResults(null);
                    }}
                    className={`flex-1 py-3 text-[13px] font-bold rounded-xl relative z-10 flex items-center justify-center gap-2 active:scale-95 transition-all duration-200 ${
                      mode === "manual" ? "text-white" : "text-emerald-900/50 hover:text-emerald-900/70"
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    {t.quick_mode}
                  </button>
                </div>

                <form onSubmit={handleCalculate} className="space-y-6 flex-1 flex flex-col justify-between">
                  {mode === "spatial" && (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-[12px] font-bold text-emerald-900/70 uppercase tracking-widest mb-3 flex justify-between">
                          <span>{t.upload_label}</span>
                          <span className="text-emerald-500">*</span>
                        </label>
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragging(true);
                          }}
                          onDragLeave={() => setIsDragging(false)}
                          onDrop={onDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className={`rounded-[1.75rem] p-10 text-center cursor-pointer transition-all duration-300 border-2 relative ${
                            isDragging
                              ? "border-emerald-400 bg-emerald-100/50 scale-[1.03]"
                              : selectedFile
                              ? "border-emerald-300 bg-emerald-50"
                              : "border-dashed border-emerald-200 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50/30 hover:shadow-inner"
                          }`}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".zip"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleFileSelect(f);
                            }}
                          />
                          
                          {selectedFile ? (
                            <div className="flex flex-col items-center w-full">
                              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 text-emerald-600 border border-emerald-100 shadow-sm transition-transform hover:scale-105">
                                <FileArchive className="w-8 h-8" strokeWidth={1.5} />
                              </div>
                              <p className="font-extrabold text-emerald-950 text-sm break-all px-2">
                                {selectedFile.name}
                              </p>
                              <p className="text-xs font-medium text-emerald-900/50 mt-1 mb-5">
                                {fileSizeMb < 1
                                  ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                                  : `${fileSizeMb.toFixed(1)} MB`}{" "}
                                · Click to replace
                              </p>
                              
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  clearSelectedFile();
                                }}
                                className="px-5 py-2.5 bg-rose-50 border border-rose-100 text-rose-600 text-[12px] font-bold rounded-xl hover:bg-rose-100 hover:text-rose-700 hover:shadow-sm transition-all duration-300 flex items-center gap-2 active:scale-95"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                {isId ? "Hapus File" : "Remove File"}
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 text-emerald-400 border border-emerald-100 shadow-sm transition-transform hover:-translate-y-1">
                                <UploadCloud className="w-8 h-8" strokeWidth={1.5} />
                              </div>
                              <p className="font-extrabold text-emerald-950 text-[15px] mb-1">
                                {t.upload_hint}
                              </p>
                              <p className="text-xs font-medium text-emerald-900/50 mb-4">
                                {t.upload_note}
                              </p>
                              <p className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-4 py-1.5 rounded-full uppercase tracking-widest">
                                .shp .shx .dbf .prj
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[12px] font-bold text-emerald-900/70 uppercase tracking-widest">
                          {t.location_name}
                        </label>
                        <input
                          type="text"
                          className="w-full px-5 py-4 rounded-2xl border border-emerald-100 bg-slate-50 outline-none font-medium text-emerald-950 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all text-[14px]"
                          value={locationName}
                          onChange={(e) => setLocationName(e.target.value)}
                          placeholder="e.g., Katingan Peatland"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[12px] font-bold text-emerald-900/70 uppercase tracking-widest">
                          {t.ecosystem_type}
                        </label>
                        <select
                          className="w-full px-5 py-4 rounded-2xl border border-emerald-100 bg-slate-50 outline-none font-medium text-emerald-950 text-[14px] appearance-none cursor-pointer focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all"
                          value={ecosystemType}
                          onChange={(e) => setEcosystemType(e.target.value)}
                        >
                          {ecosystemOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {mode === "manual" && (
  <div className="space-y-6">
    <div className="space-y-2">
      <label className="block text-[12px] font-bold text-emerald-900/70 uppercase tracking-widest">
        {t.location_name}
      </label>
      <input
        type="text"
        className="w-full px-5 py-4 rounded-2xl border border-emerald-100 bg-slate-50 outline-none font-medium text-emerald-950 text-[14px] focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all"
        value={locationName}
        onChange={(e) => setLocationName(e.target.value)}
        placeholder="e.g., Alpha Carbon Project"
      />
    </div>

    <div className="space-y-2">
      <label className="block text-[12px] font-bold text-emerald-900/70 uppercase tracking-widest">
        {t.ecosystem_type}
      </label>
      <select
        className="w-full px-5 py-4 rounded-2xl border border-emerald-100 bg-slate-50 outline-none font-medium text-emerald-950 text-[14px] appearance-none cursor-pointer focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all"
        value={ecosystemType}
        onChange={(e) => setEcosystemType(e.target.value)}
      >
        {ecosystemOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <label className="block text-[12px] font-bold text-emerald-900/70 uppercase tracking-widest">
          Latitude
        </label>
        <input
          type="number"
          step="any"
          className="w-full px-5 py-4 rounded-2xl border border-emerald-100 bg-slate-50 outline-none font-medium text-emerald-950 text-[14px] focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all"
          value={latitude}
          onChange={(e) => setLatitude(e.target.value)}
          placeholder="-2.5"
        />
      </div>
      <div className="space-y-2">
        <label className="block text-[12px] font-bold text-emerald-900/70 uppercase tracking-widest">
          Longitude
        </label>
        <input
          type="number"
          step="any"
          className="w-full px-5 py-4 rounded-2xl border border-emerald-100 bg-slate-50 outline-none font-medium text-emerald-950 text-[14px] focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all"
          value={longitude}
          onChange={(e) => setLongitude(e.target.value)}
          placeholder="113.5"
        />
      </div>
    </div>

    <div className="space-y-2">
      <label className="block text-[12px] font-bold text-emerald-900/70 uppercase tracking-widest flex justify-between">
        <span>{t.area_size} (Ha)</span>
        <span className="text-emerald-500">*</span>
      </label>
      <input
        type="number"
        required
        min="1"
        className="w-full px-5 py-4 rounded-2xl border border-emerald-100 bg-slate-50 outline-none font-medium text-emerald-950 text-[14px] focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all"
        value={area}
        onChange={(e) => setArea(e.target.value)}
        placeholder="e.g., 50000"
      />
    </div>
                      <div className="p-5 rounded-2xl border border-emerald-100 bg-white shadow-sm space-y-6 transition-all duration-300 hover:shadow-md">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="block text-[11px] font-bold text-emerald-900/70 uppercase tracking-widest">
                              {t.duration} (Years)
                            </label>
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-extrabold">
                              {duration}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="100"
                            className="w-full h-2 bg-emerald-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                          />
                        </div>
                        <div className="w-full h-px bg-slate-100" />
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="block text-[11px] font-bold text-emerald-900/70 uppercase tracking-widest">
                              {t.carbon_price} (USD)
                            </label>
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-extrabold">
                              ${carbonPrice}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="100"
                            step="0.5"
                            className="w-full h-2 bg-emerald-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                            value={carbonPrice}
                            onChange={(e) => setCarbonPrice(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-8 space-y-4">
                    {error && (
                      <div className="p-4 bg-rose-50 border border-rose-200/60 rounded-2xl text-rose-800 text-[13px] font-medium flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
                        <span className="leading-relaxed">{error}</span>
                      </div>
                    )}
                    
                    <button
                      type="submit"
                      disabled={isCalculating}
                      className="w-full py-4 bg-emerald-800 text-white font-bold rounded-2xl hover:bg-emerald-950 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-[14px] transition-all duration-300 shadow-md shadow-emerald-950/20 active:scale-95"
                    >
                      {isCalculating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-emerald-200 border-t-white rounded-full animate-spin" />
                          {t.processing}
                        </>
                      ) : (
                        t.run_analysis
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </ScrollReveal>
          </div>

          {results && (
            <ScrollReveal delay="delay-100" className="w-full max-w-5xl shrink-0">
              <div
                ref={resultsRef}
                className="bg-white/90 backdrop-blur-2xl rounded-[2.5rem] border border-white p-8 md:p-10 space-y-8 shadow-[0_10px_40px_-10px_rgba(4,43,34,0.08)] scroll-mt-28"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-emerald-50">
                  <div>
                    <p className="text-[11px] font-bold tracking-widest uppercase text-emerald-900/40 mb-1">
                      {isId ? "Skor kelayakan indikatif (ICPFS)" : "Indicative score (ICPFS)"}
                    </p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-6xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-emerald-500 to-cyan-600 leading-none">
                        {results.feasibility_score?.toFixed(1)}
                      </span>
                      <span className="text-xl md:text-2xl font-bold text-emerald-900/20">/100</span>
                    </div>
                  </div>
                  <span className="px-6 py-3 bg-emerald-50 text-emerald-700 text-[14px] font-extrabold tracking-widest uppercase rounded-full border border-emerald-200/50 shadow-sm hover:bg-emerald-100 transition-colors cursor-default">
                    {results.feasibility_category}
                  </span>
                </div>

                               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  <Metric label="AGB" value={formatNumber(results.agb_ton)} unit="t" />
                  <Metric
                    label={isId ? "Cadangan karbon" : "Carbon stock"}
                    value={formatNumber(results.carbon_stock_tc)}
                    unit="tC"
                  />
                  <Metric label="CO₂e" value={formatNumber(results.co2e_ton)} unit="t" />
                  <Metric
                    label={isId ? "Kredit (ACC)" : "Total credits"}
                    value={formatNumber(results.acc_total_credits)}
                    unit="t"
                  />
                  <Metric label="Gross Revenue" value={formatCurrency(results.gross_revenue_usd)} />
                  <Metric
                    label={isId ? "Total biaya" : "Total cost"}
                    value={formatCurrency(
                      results.cost_breakdown?.total_cost_usd ?? results.total_cost_usd
                    )}
                  />
                  <Metric
                    label="Net Revenue"
                    value={formatCurrency(results.net_revenue_usd)}
                    highlight
                  />
                </div>

                                {results.component_scores && (
                  <div className="p-6 md:p-8 bg-emerald-50/50 rounded-[1.5rem] border border-emerald-100">
                    <p className="text-[11px] font-bold text-emerald-900/70 uppercase tracking-widest mb-5">
                      {isId ? "Komponen skor" : "Score components"}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {[
                        { k: "carbon_score", l: isId ? "Karbon" : "Carbon" },
                        { k: "legality_score", l: isId ? "Legal" : "Legal" },
                        { k: "biodiversity_score", l: isId ? "Bio" : "Bio" },
                        { k: "social_score", l: isId ? "Sosial" : "Social" },
                        { k: "economy_score", l: isId ? "Ekonomi" : "Economy" },
                      ].map((c) => (
                        <div
                          key={c.k}
                          className="p-4 rounded-[1.25rem] bg-white border border-emerald-100/60 text-center"
                        >
                          <p className="text-[10px] font-bold tracking-widest uppercase text-emerald-900/40 mb-1">
                            {c.l}
                          </p>
                          <p className="text-xl font-extrabold text-emerald-950">
                            {Number(results.component_scores[c.k] ?? 0).toFixed(0)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {results.cost_breakdown && (
                  <div className="p-6 md:p-8 bg-emerald-50/50 rounded-[1.5rem] border border-emerald-100">
                    <p className="text-[11px] font-bold text-emerald-900/70 uppercase tracking-widest mb-5">
                      {isId ? "Rincian biaya" : "Cost breakdown"}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Metric
                        label={isId ? "Pengembangan" : "Development"}
                        value={formatCurrency(results.cost_breakdown.development_cost_usd)}
                      />
                      <Metric
                        label="MRV"
                        value={formatCurrency(results.cost_breakdown.mrv_cost_usd)}
                      />
                      <Metric
                        label={isId ? "Validasi" : "Validation"}
                        value={formatCurrency(results.cost_breakdown.validation_cost_usd)}
                      />
                      <Metric
                        label={isId ? "Operasional" : "Operational"}
                        value={formatCurrency(results.cost_breakdown.operational_cost_usd)}
                      />
                    </div>
                  </div>
                )}

                {results.spatial_overlay_layers &&
                  typeof results.spatial_overlay_layers === "object" &&
                  Object.keys(results.spatial_overlay_layers).length > 0 && (
                    <div className="p-6 md:p-8 bg-emerald-50/50 rounded-[1.5rem] border border-emerald-100">
                      <p className="text-[11px] font-bold text-emerald-900/70 uppercase tracking-widest mb-5">
                        {isId ? "Lapisan overlay spasial" : "Spatial overlay layers"}
                      </p>
                            <ul className="space-y-3">
        {Object.entries(results.spatial_overlay_layers).map(([key, val]) => {
          const label = key.replace(/_/g, " ");
          let displayValue = "—";
          let fungsi = "";

          if (val != null && typeof val === "object" && !Array.isArray(val)) {
            const obj = val as { value?: unknown; fungsi?: string };
            if (obj.value !== undefined && obj.value !== null) {
              displayValue =
                typeof obj.value === "boolean"
                  ? obj.value
                    ? isId
                      ? "Ya"
                      : "Yes"
                    : isId
                    ? "Tidak"
                    : "No"
                  : String(obj.value);
            }
            if (obj.fungsi) fungsi = String(obj.fungsi);
          } else if (val != null) {
            displayValue = String(val);
          }

          return (
            <li
              key={key}
              className="text-[14px] text-emerald-900/80 font-medium flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between"
            >
              <span className="capitalize text-emerald-900/60 shrink-0">
                {label}
              </span>
              <span className="text-left sm:text-right font-semibold text-emerald-950">
                {displayValue}
                {fungsi ? (
                  <span className="block text-[12px] font-medium text-emerald-900/50 mt-0.5">
                    {fungsi}
                  </span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
                    </div>
                  )}

                <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-stretch">
                  {results.geometry && (
                    <div className="h-full flex flex-col">
                      <p className="text-[11px] font-bold text-emerald-900/70 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Map className="w-4 h-4 text-emerald-500" />
                        {isId ? "Pemetaan Spasial" : "Spatial Mapping"}
                      </p>
                      <div className="rounded-[1.5rem] overflow-hidden border border-emerald-100 flex-1 shadow-inner bg-slate-50 min-h-[300px] hover:shadow-md transition-shadow">
                        <MapPreview
                          key={JSON.stringify(results.geometry)}
                          geometry={results.geometry}
                        />
                      </div>
                    </div>
                  )}
                  {results.recommendations?.length > 0 && (
                    <div className="h-full flex flex-col p-6 md:p-8 bg-emerald-50/50 rounded-[1.5rem] border border-emerald-100 hover:shadow-sm transition-all duration-300">
                      <p className="text-[11px] font-bold text-emerald-900/70 uppercase tracking-widest mb-5">
                        {t.recommendations}
                      </p>
                      <ul className="space-y-4">
                        {results.recommendations.map((rec: string, i: number) => (
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
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-emerald-50">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 px-6 py-4 bg-emerald-800 text-white text-[15px] font-bold rounded-2xl disabled:opacity-60 disabled:cursor-not-allowed flex justify-center items-center gap-2 hover:bg-emerald-950 transition-all duration-300 shadow-md shadow-emerald-950/20 active:scale-95"
                  >
                    <Save className="w-5 h-5" />
                    {isSaving ? (isId ? "Menyimpan…" : "Saving…") : t.save}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadPDF}
                    className="flex-1 px-6 py-4 bg-white border border-emerald-200/80 text-emerald-800 text-[15px] font-bold rounded-2xl flex justify-center items-center gap-2 hover:bg-emerald-50 transition-all duration-300 shadow-sm active:scale-95"
                  >
                    <Download className="w-5 h-5" />
                    {t.download_pdf}
                  </button>
                </div>
              </div>
            </ScrollReveal>
          )}
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
}: {
  label: string;
  value: string;
  unit?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`p-5 md:p-6 rounded-[1.5rem] border transition-all duration-300 ease-out flex flex-col justify-center hover:-translate-y-1.5 ${
        highlight
          ? "bg-emerald-50/80 border-emerald-200/50 shadow-sm hover:shadow-[0_8px_30px_-12px_rgba(16,185,129,0.3)]"
          : "bg-white border-emerald-100/60 shadow-sm hover:shadow-[0_8px_30px_-12px_rgba(16,185,129,0.2)]"
      }`}
    >
      <p
        className={`text-[10px] md:text-[11px] font-bold tracking-widest uppercase mb-2 ${
          highlight ? "text-emerald-700/60" : "text-emerald-900/40"
        }`}
      >
        {label}
      </p>
      <p
        className={`text-[20px] sm:text-[24px] md:text-[28px] font-extrabold leading-tight break-words ${
          highlight ? "text-emerald-900" : "text-emerald-950"
        }`}
      >
        {value}
        {unit && (
          <span
            className={`text-[20px] font-bold ml-1.5 ${
              highlight ? "text-emerald-800" : "text-emerald-800"
            }`}
          >
            {unit}
          </span>
        )}
      </p>
    </div>
  );
}