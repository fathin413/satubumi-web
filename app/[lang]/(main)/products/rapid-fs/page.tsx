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
  Trees,
  Wind,
  CircleDollarSign,
  TrendingUp,
  Wallet,
  Scale,
  Users,
  Sprout,
  ShieldCheck,
  Activity,
  LineChart,
  ChevronDown,
  Coins,
} from "lucide-react";
import ScrollReveal from "../../../../../components/ScrollReveal";
import en from "../../../../../dictionaries/en.json";
import id from "../../../../../dictionaries/id.json";
import {
  translateSpatialKey,
  translateSpatialValue,
  translateFeasibilityCategory,
  translateRecommendation,
} from "@/lib/spatialTranslation";

const MapPreview = dynamic(() => import("../../../../../components/MapPreview"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[250px] bg-emerald-50/50 rounded-[1.5rem] animate-pulse border border-emerald-100 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  ),
});

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const getEcosystemOptions = (isId: boolean) => [
  { label: isId ? "Hutan Tropis" : "Tropical Forest", value: "hutan_tropis" },
  { label: isId ? "Mangrove" : "Mangrove", value: "mangrove" },
  { label: isId ? "Gambut" : "Peatland", value: "gambut" },
  { label: isId ? "Agroforestri" : "Agroforestry", value: "agroforestri" },
  { label: isId ? "Lahan Terdegradasi" : "Degraded Land", value: "lahan_terdegradasi" },
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
  const ecosystemOptions = getEcosystemOptions(isId);

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
  const [showDownloadWarning, setShowDownloadWarning] = useState(false);
  const [isOfficiallySaved, setIsOfficiallySaved] = useState(false);

  const [isRequestingAccess, setIsRequestingAccess] = useState(false);
  const [hasRequestedAccess, setHasRequestedAccess] = useState(false);
  const [showRequestSuccess, setShowRequestSuccess] = useState(false);
  const [showRequestLoginModal, setShowRequestLoginModal] = useState(false);

  const [selectedCurrency, setSelectedCurrency] = useState<"USD" | "IDR">("USD");
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [usdToIdrRate, setUsdToIdrRate] = useState<number>(16000);

  const nextPath = `/${lang}/products/rapid-fs`;

  useEffect(() => {
    fetch("https://open.er-api.com/v6/latest/USD")
      .then((r) => r.json())
      .then((data) => {
        if (data?.rates?.IDR && typeof data.rates.IDR === "number") {
          setUsdToIdrRate(Math.round(data.rates.IDR));
        }
      })
      .catch(() => { });
  }, []);

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
          const userData = await res.json();
          setUser(userData);
          setIsLoggedIn(true);
          if (userData?.rapidfs_request_status === "pending") {
            setHasRequestedAccess(true);
          }
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
    setIsOfficiallySaved(false);

    try {
      let response: Response;
      const token = localStorage.getItem("access_token");
      const authHeaders: Record<string, string> = token
        ? { Authorization: `Bearer ${token}` }
        : {};

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

        response = await fetch(`${API_URL}/rapid-fs/upload-shapefile?lang=${lang}`, {
          method: "POST",
          headers: {
            ...authHeaders,
          },
          body: formData,
          signal: controller.signal,
        });
      } else {
        response = await fetch(`${API_URL}/rapid-fs/calculate?lang=${lang}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders,
          },
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
    if (savedId && isOfficiallySaved) {
      setShowSaveSuccess(true);
      return;
    }
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
      };

      const response = await fetch(`${API_URL}/assessments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

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
      setIsOfficiallySaved(true);
    } catch (err: any) {
      setError(humanizeError(err.message || "Error", isId, mode));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestAccess = async () => {
    const token = localStorage.getItem("access_token");
    if (!token || !isLoggedIn) {
      setShowRequestLoginModal(true);
      return;
    }

    if (user?.rapidfs_request_status === "pending" || hasRequestedAccess) {
      setShowRequestSuccess(true);
      return;
    }

    setIsRequestingAccess(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/users/request-rapidfs-access`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          project_name: locationName || (isId ? "Proyek Rapid-FS" : "Rapid-FS Project"),
        }),
      });

      if (!res.ok) {
        // Fallback endpoint
        const fallbackRes = await fetch(`${API_URL}/rapid-fs/request-access`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            project_name: locationName || (isId ? "Proyek Rapid-FS" : "Rapid-FS Project"),
          }),
        });

        if (!fallbackRes.ok) {
          const errData = await fallbackRes.json().catch(() => ({}));
          throw new Error(errData.detail || "Gagal mengajukan permintaan akses.");
        }
        const updatedUser = await fallbackRes.json();
        setUser((prev: any) => ({ ...prev, ...updatedUser }));
      } else {
        const updatedUser = await res.json();
        setUser((prev: any) => ({ ...prev, ...updatedUser }));
      }

      setHasRequestedAccess(true);
      setShowRequestSuccess(true);
    } catch (err: any) {
      setError(
        isId
          ? "Gagal mengirim permintaan akses ke admin. Silakan coba lagi beberapa saat."
          : "Failed to submit access request to admin. Please try again shortly."
      );
    } finally {
      setIsRequestingAccess(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!isOfficiallySaved || !savedId) {
      setShowDownloadWarning(true);
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
              href={`/${lang}/login?next=${encodeURIComponent(nextPath)}`}
              className="w-full py-4 bg-emerald-700 text-white font-bold rounded-2xl hover:bg-emerald-600 transition-colors shadow-sm active:scale-95"
            >
              {t.login_btn}
            </Link>
            <Link
              href={`/${lang}/register?next=${encodeURIComponent(nextPath)}`}
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

      {/* POPUP PERINGATAN DOWNLOAD PDF SEBELUM SAVE */}
      {showDownloadWarning && (
        <div className="fixed inset-0 z-[110] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-sm w-full overflow-hidden flex flex-col relative animate-in zoom-in-[0.5] fade-in duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]">

            <div className="bg-gradient-to-br from-amber-400 to-amber-600 pt-10 pb-8 px-8 text-center relative overflow-hidden">
              <div className="w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center shadow-lg relative z-10">
                <div className="absolute inset-0 rounded-full border-2 border-white animate-ping opacity-50 duration-1000" />
                <AlertCircle className="w-10 h-10 text-amber-500" />
              </div>
            </div>

            <div className="p-8 pt-6 text-center">
              <h3 className="text-2xl font-extrabold text-emerald-950 mb-2">
                {isId ? "Perhatian" : "Action Required"}
              </h3>
              <p className="text-[13px] font-medium text-emerald-900/60 leading-relaxed mb-8">
                {isId
                  ? "Silakan simpan hasil analisis ke akun Anda terlebih dahulu sebelum mengunduh laporan PDF."
                  : "Please save the analysis results to your account before downloading the PDF report."}
              </p>

              <button
                type="button"
                onClick={() => setShowDownloadWarning(false)}
                className="w-full py-4 bg-amber-500 text-white font-bold text-[14px] rounded-2xl hover:bg-amber-600 transition-colors shadow-sm active:scale-95"
              >
                {isId ? "Mengerti" : "Understood"}
              </button>
            </div>

          </div>
        </div>
      )}

      {showSaveSuccess && (
        <div className="fixed inset-0 z-[110] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-sm w-full overflow-hidden flex flex-col relative animate-in zoom-in-[0.5] fade-in duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]">

            <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 pt-10 pb-8 px-8 text-center relative overflow-hidden">
              <button
                type="button"
                onClick={() => setShowSaveSuccess(false)}
                className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
                aria-label={isId ? "Tutup" : "Close"}
              >
                <X className="w-4 h-4" />
              </button>
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
                  ? "Hasil Rapid-FS telah diamankan ke database. Anda dapat langsung mengunduh laporan PDF atau melihatnya di dashboard."
                  : "The Rapid-FS result has been secured to the database. You can download the PDF report immediately or view it on the dashboard."}
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
                    {isId ? "Kategori & Skor" : "Category & Score"}
                  </span>
                  <span className="text-[14px] font-extrabold text-emerald-600">
                    {translateFeasibilityCategory(results?.feasibility_category, isId)} ({results?.feasibility_score?.toFixed(1)} / 100)
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => {
                    handleDownloadPDF();
                  }}
                  className="w-full py-4 bg-emerald-700 text-white font-bold text-[14px] rounded-2xl hover:bg-emerald-600 transition-colors shadow-sm active:scale-95 flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  {isId ? "Unduh Laporan (PDF)" : "Download Report (PDF)"}
                </button>
                <Link
                  href={`/${lang}/dashboard`}
                  className="w-full py-4 bg-white border border-slate-200 text-slate-700 font-bold text-[14px] rounded-2xl hover:bg-slate-50 hover:text-slate-900 transition-colors active:scale-95 flex items-center justify-center gap-2"
                >
                  {isId ? "Buka Dashboard" : "Open Dashboard"}
                </Link>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* POPUP SUKSES PERMINTAAN AKSES RAPID-FS KE ADMIN */}
      {showRequestSuccess && (
        <div className="fixed inset-0 z-[120] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden flex flex-col relative animate-in zoom-in-[0.5] fade-in duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
            <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 pt-10 pb-8 px-8 text-center relative overflow-hidden">
              <button
                type="button"
                onClick={() => setShowRequestSuccess(false)}
                className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
                aria-label={isId ? "Tutup" : "Close"}
              >
                <X className="w-4 h-4" />
              </button>
              <div className="w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center shadow-lg relative z-10">
                <div className="absolute inset-0 rounded-full border-2 border-white animate-ping opacity-50 duration-1000" />
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
            </div>

            <div className="p-8 pt-6 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[11px] font-extrabold uppercase tracking-wider mb-3">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                {isId ? "Permintaan Terkirim ke Admin" : "Request Sent to Admin"}
              </div>

              <h3 className="text-2xl font-extrabold text-emerald-950 mb-3 tracking-tight">
                {isId ? "Permintaan Akses Terkirim!" : "Access Request Sent!"}
              </h3>
              
              <p className="text-[13.5px] font-medium text-slate-600 leading-relaxed mb-6">
                {isId
                  ? "Permintaan akses laporan penuh telah berhasil dikirim ke admin. Silakan cek berkala pada menu Daftar Assessment (My Assessments) di profil Anda untuk melihat pembaruan status begitu disetujui."
                  : "Your request for full report access has been submitted to the admin. Please periodically check 'My Assessments' in your profile to view status updates once approved."}
              </p>

              <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 mb-6 text-left space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-emerald-900/60 uppercase tracking-wider">
                    {isId ? "Nama Proyek" : "Project Name"}
                  </span>
                  <span className="font-extrabold text-emerald-950 truncate max-w-[170px]">
                    {locationName || (isId ? "Proyek Rapid-FS" : "Rapid-FS Project")}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-emerald-900/60 uppercase tracking-wider">
                    {isId ? "Status Pengajuan" : "Request Status"}
                  </span>
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-extrabold">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    {isId ? "Menunggu Peninjauan Admin" : "Pending Admin Review"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Link
                  href={`/${lang}/dashboard`}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[14px] rounded-2xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  {isId ? "Cek Menu My Assessment" : "Check My Assessments"}
                </Link>
                <button
                  type="button"
                  onClick={() => setShowRequestSuccess(false)}
                  className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[14px] rounded-2xl transition-colors active:scale-95"
                >
                  {isId ? "Tutup" : "Close"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POPUP LOGIN JIKA BELUM LOGIN */}
      {showRequestLoginModal && (
        <div className="fixed inset-0 z-[120] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-sm w-full overflow-hidden flex flex-col relative animate-in zoom-in-[0.5] fade-in duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
            <div className="bg-gradient-to-br from-amber-400 to-amber-600 pt-10 pb-8 px-8 text-center relative overflow-hidden">
              <button
                type="button"
                onClick={() => setShowRequestLoginModal(false)}
                className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
                aria-label={isId ? "Tutup" : "Close"}
              >
                <X className="w-4 h-4" />
              </button>
              <div className="w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center shadow-lg relative z-10">
                <AlertCircle className="w-10 h-10 text-amber-500" />
              </div>
            </div>

            <div className="p-8 pt-6 text-center">
              <h3 className="text-2xl font-extrabold text-emerald-950 mb-2">
                {isId ? "Masuk ke Akun Anda" : "Sign In Required"}
              </h3>
              <p className="text-[13px] font-medium text-slate-600 leading-relaxed mb-6">
                {isId
                  ? "Silakan masuk atau daftarkan akun Satubumi terlebih dahulu agar permintaan akses laporan dapat dikirimkan ke admin dan terhubung dengan profil Anda."
                  : "Please sign in or create a Satubumi account first so your access request can be submitted to the admin and connected to your profile."}
              </p>

              <div className="flex flex-col gap-3">
                <Link
                  href={`/${lang}/login?next=${encodeURIComponent(nextPath)}`}
                  className="w-full py-4 bg-emerald-600 text-white font-bold text-[14px] rounded-2xl hover:bg-emerald-700 transition-colors shadow-sm active:scale-95 flex items-center justify-center gap-2"
                >
                  {isId ? "Masuk / Daftar Sekarang" : "Sign In / Register Now"}
                </Link>
                <button
                  type="button"
                  onClick={() => setShowRequestLoginModal(false)}
                  className="w-full py-3 text-slate-500 hover:text-slate-800 text-[13px] font-bold"
                >
                  {isId ? "Batalkan" : "Cancel"}
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
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-cyan-500 py-2 leading-tight">
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
                    className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-emerald-700 rounded-xl shadow-md transition-all duration-500 ${mode === "spatial" ? "left-1.5" : "left-[calc(50%+1.5px)]"
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setMode("spatial");
                      setError(null);
                      setResults(null);
                    }}
                    className={`flex-1 py-3 text-[13px] font-bold rounded-xl relative z-10 flex items-center justify-center gap-2 active:scale-95 transition-all duration-200 ${mode === "spatial" ? "text-white" : "text-emerald-900/50 hover:text-emerald-900/70"
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
                    className={`flex-1 py-3 text-[13px] font-bold rounded-xl relative z-10 flex items-center justify-center gap-2 active:scale-95 transition-all duration-200 ${mode === "manual" ? "text-white" : "text-emerald-900/50 hover:text-emerald-900/70"
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
                          className={`rounded-[1.75rem] p-10 text-center cursor-pointer transition-all duration-300 border-2 relative ${isDragging
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
                          <span>{isId ? "Luas Area (Hektare)" : "Area Size (Hectares)"}</span>
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
                              {isId ? "Durasi Proyek (Tahun)" : "Project Duration (Years)"}
                            </label>
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-extrabold">
                              {duration} {isId ? "Tahun" : "Years"}
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
                              {isId ? "Harga Karbon ($ / tCO₂e)" : "Carbon Price ($ / tCO₂e)"}
                            </label>
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-extrabold">
                              ${carbonPrice} / tCO₂e
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
                className="bg-white/90 backdrop-blur-2xl rounded-[2.5rem] border border-white p-8 md:p-10 shadow-[0_10px_40px_-10px_rgba(4,43,34,0.08)] scroll-mt-28 relative overflow-hidden flex flex-col gap-8"
              >
                
                {/* 1. HASIL TERBUKA: Skor & Metrik Dasar Alam */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-emerald-50 mb-8">
                    <div>
                      <p className="text-[12px] font-extrabold tracking-widest uppercase text-emerald-950 mb-0.5">
                        {isId ? "Skor Kelayakan Indikatif" : "Indicative Feasibility Score"}
                      </p>
                      <p className="text-[11px] font-semibold text-emerald-700/70 mb-2">
                        {isId ? "ICPFS (Indicative Carbon Project Feasibility Score): Skala 0 - 100" : "ICPFS (Indicative Carbon Project Feasibility Score): Scale 0 - 100"}
                      </p>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-6xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-emerald-500 to-cyan-600 leading-none">
                          {results.feasibility_score?.toFixed(1)}
                        </span>
                        <span className="text-xl md:text-2xl font-bold text-emerald-900/20">/100</span>
                      </div>
                    </div>
                    <span className="px-6 py-3 bg-emerald-50 text-emerald-700 text-[14px] font-extrabold tracking-widest uppercase rounded-full border border-emerald-200/50 shadow-sm hover:bg-emerald-100 transition-colors cursor-default">
                      {translateFeasibilityCategory(results.feasibility_category, isId)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                    <Metric
                      label={isId ? "Biomassa" : "Biomass"}
                      sublabel={isId ? "AGB (Aboveground Biomass): Estimasi total biomassa vegetasi di atas tanah" : "AGB (Aboveground Biomass): Total estimated above-ground vegetation biomass"}
                      value={formatNumber(results.agb_ton)}
                      unit={isId ? "ton" : "tons"}
                      icon={Trees}
                    />
                    <Metric
                      label={isId ? "Cadangan Karbon" : "Carbon Stock"}
                      sublabel={isId ? "tC (Ton Karbon): Kandungan karbon murni tersimpan dalam biomassa" : "tC (Tonnes of Carbon): Pure stored carbon content in vegetation biomass"}
                      value={formatNumber(results.carbon_stock_tc)}
                      unit="tC"
                      icon={Leaf}
                    />
                    <Metric
                      label={isId ? "Potensi Emisi" : "Emissions Potential"}
                      sublabel={isId ? "CO₂e (Carbon Dioxide Equivalent): Setara emisi gas rumah kaca" : "CO₂e (Carbon Dioxide Equivalent): Greenhouse gas emissions equivalent"}
                      value={formatNumber(results.co2e_ton)}
                      unit="tCO₂e"
                      icon={Wind}
                    />
                  </div>
                </div>

                {/* 2. HASIL TERBUKA: Preview Map (Bukti spasial valid) */}
                {results.geometry && (
                  <div className="flex flex-col">
                    <p className="text-[12px] font-extrabold text-emerald-950 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Map className="w-4 h-4 text-emerald-500" />
                      {isId ? "Preview Pemetaan Spasial" : "Spatial Mapping Preview"}
                    </p>
                    <div className="rounded-[1.5rem] overflow-hidden border border-emerald-100 shadow-inner bg-slate-50 h-[380px] md:h-[460px] w-full hover:shadow-md transition-shadow relative">
                      <MapPreview
                        key={JSON.stringify(results.geometry)}
                        geometry={results.geometry}
                        className="w-full h-full"
                      />
                    </div>
                  </div>
                )}

                {/* 3. KONTEN LANJUTAN: Conditional Berdasarkan is_unlocked */}
                <div className="relative mt-4">
                  {/* OVERLAY GEMBOK — hanya muncul jika is_unlocked === false */}
                  {!results.is_unlocked && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center">
                      <div className="bg-white/80 backdrop-blur-xl border border-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] rounded-[2.5rem] p-8 md:p-10 max-w-lg w-full flex flex-col items-center animate-in zoom-in-95 duration-500">
                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl flex items-center justify-center shadow-inner mb-5 border border-emerald-200">
                          <LockKeyhole className="w-7 h-7 text-emerald-600" />
                        </div>
                        <h4 className="text-xl md:text-2xl font-extrabold text-slate-900 mb-3 tracking-tight">
                          {isId ? "Analisis Lanjutan Terkunci" : "Advanced Analysis Locked"}
                        </h4>
                        <p className="text-[13.5px] text-slate-600 font-medium leading-relaxed mb-8">
                          {isId 
                            ? "Analisis ekosistem dasar berhasil. Namun, proyeksi finansial (biaya & pendapatan), kredit karbon, rincian skor, dan data GIS spesifik disembunyikan. Hubungi admin untuk membuka laporan penuh." 
                            : "Basic ecosystem analysis successful. However, financial projections, carbon credits, detailed scoring, and specific GIS data are hidden. Contact admin to unlock the full report."}
                        </p>
                        <button 
                          type="button"
                          onClick={handleRequestAccess}
                          disabled={isRequestingAccess}
                          className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 disabled:opacity-75"
                        >
                          {isRequestingAccess ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>{isId ? "Mengirim Permintaan…" : "Submitting Request…"}</span>
                            </>
                          ) : (hasRequestedAccess || user?.rapidfs_request_status === "pending") ? (
                            <>
                              <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                              <span>{isId ? "Permintaan Akses Terkirim" : "Access Request Submitted"}</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-5 h-5" />
                              <span>{isId ? "Minta Akses Laporan Penuh" : "Request Full Report Access"}</span>
                            </>
                          )}
                        </button>
                        {(hasRequestedAccess || user?.rapidfs_request_status === "pending") && (
                          <p className="mt-3 text-[12px] text-emerald-800 font-semibold flex items-center justify-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>
                              {isId
                                ? "Permintaan telah dikirim ke admin. Cek berkala di menu My Assessment di profil Anda."
                                : "Request sent to admin. Check periodically in My Assessments in your profile."}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* KONTEN — blur jika terkunci, normal jika terbuka */}
                  <div className={!results.is_unlocked ? "opacity-40 blur-[8px] pointer-events-none select-none flex flex-col gap-8" : "flex flex-col gap-8"}>
                    
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
                            {selectedCurrency === "USD"
                              ? (isId ? "Menampilkan nilai dalam Dollar AS ($)" : "Displaying values in US Dollar ($)")
                              : (isId ? "Menampilkan nilai dalam Rupiah (Rp)" : "Displaying values in Indonesian Rupiah (Rp)")}
                          </p>
                        </div>
                      </div>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
                          className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-white border border-emerald-200 rounded-xl font-bold text-[13px] text-emerald-950 hover:bg-emerald-50 transition-colors"
                        >
                          <span className="w-2 h-2 rounded-full bg-sky-500" />
                          <span>{selectedCurrency === "USD" ? "🇺🇸 USD (Dollar)" : "🇮🇩 IDR (Rupiah)"}</span>
                          <ChevronDown className={`w-4 h-4 text-emerald-700 transition-transform ${currencyDropdownOpen ? "rotate-180" : ""}`} />
                        </button>
                        {currencyDropdownOpen && (
                          <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-emerald-100 rounded-xl shadow-lg z-30 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <button
                              type="button"
                              onClick={() => { setSelectedCurrency("USD"); setCurrencyDropdownOpen(false); }}
                              className={`w-full text-left px-4 py-3 text-[13px] font-bold transition-colors flex items-center gap-2 ${selectedCurrency === "USD" ? "bg-emerald-50 text-emerald-700" : "text-slate-700 hover:bg-slate-50"}`}
                            >
                              🇺🇸 USD (Dollar)
                            </button>
                            <button
                              type="button"
                              onClick={() => { setSelectedCurrency("IDR"); setCurrencyDropdownOpen(false); }}
                              className={`w-full text-left px-4 py-3 text-[13px] font-bold transition-colors flex items-center gap-2 ${selectedCurrency === "IDR" ? "bg-emerald-50 text-emerald-700" : "text-slate-700 hover:bg-slate-50"}`}
                            >
                              🇮🇩 IDR (Rupiah)
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Finansial Metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                      <Metric
                        label={isId ? "Kredit Karbon" : "Carbon Credits"}
                        sublabel={isId ? "ACC (Annual Carbon Credits): Estimasi kredit terverifikasi per tahun" : "ACC (Annual Carbon Credits): Estimated verified credits issuable annually"}
                        value={formatNumber(results.acc_total_credits)}
                        unit={isId ? "kredit (tCO₂e)" : "credits (tCO₂e)"}
                        icon={TrendingUp}
                      />
                      <Metric
                        label={isId ? "Pendapatan Kotor" : "Gross Revenue"}
                        sublabel={isId ? "Estimasi total akumulasi pendapatan kotor proyek karbon" : "Estimated total gross revenue from carbon project"}
                        value={formatCurrency(results.gross_revenue_usd)}
                        icon={CircleDollarSign}
                      />
                      <Metric
                        label={isId ? "Total Biaya Proyek" : "Total Project Cost"}
                        sublabel={isId ? "Akumulasi belanja modal (CAPEX) & operasional (OPEX)" : "Accumulated capital expenditure (CAPEX) & operating costs (OPEX)"}
                        value={formatCurrency(results.cost_breakdown?.total_cost_usd ?? results.total_cost_usd)}
                        icon={Wallet}
                      />
                      <Metric
                        label={isId ? "Pendapatan Bersih" : "Net Revenue"}
                        sublabel={isId ? "Estimasi keuntungan bersih proyek setelah dikurangi seluruh biaya" : "Estimated net project profit after deducting all costs"}
                        value={formatCurrency(results.net_revenue_usd)}
                        highlight
                        icon={LineChart}
                      />
                    </div>

                    {/* Component Scores */}
                    {results.component_scores && (
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
                          ].map((c) => (
                            <div key={c.k} className="p-4 rounded-[1.25rem] bg-white border border-emerald-100/60 text-center shadow-sm flex flex-col justify-between">
                              <div className="relative z-10 flex flex-col items-center">
                                <c.ic className={`w-5 h-5 mb-2 ${c.color} opacity-80`} />
                                <p className="text-[11px] font-extrabold tracking-widest uppercase text-emerald-900 mb-0.5">{c.l}</p>
                                <p className="text-[10px] font-medium text-emerald-700/60 mb-2 leading-tight">{c.desc}</p>
                                <p className="text-2xl font-extrabold text-emerald-950">{Number(results.component_scores[c.k] ?? 0).toFixed(0)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Cost Breakdown */}
                    {results.cost_breakdown && (
                      <div className="p-6 md:p-8 bg-emerald-50/50 rounded-[1.5rem] border border-emerald-100">
                        <p className="text-[12px] font-extrabold text-emerald-950 uppercase tracking-widest mb-5">
                          {isId ? "Rincian Biaya Proyek" : "Project Cost Breakdown"}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Metric
                            label={isId ? "Biaya Pengembangan" : "Development Cost"}
                            sublabel={isId ? "CAPEX (Capital Expenditure): Studi kelayakan teknis, PDD, dan perizinan" : "CAPEX (Capital Expenditure): Technical feasibility study, PDD, and permits"}
                            value={formatCurrency(results.cost_breakdown.development_cost_usd)}
                            icon={TrendingUp}
                          />
                          <Metric
                            label={isId ? "Biaya MRV" : "MRV Cost"}
                            sublabel={isId ? "MRV (Measurement, Reporting & Verification): Pengukuran biomassa dan audit satelit" : "MRV (Measurement, Reporting & Verification): Biomass measurement and satellite monitoring"}
                            value={formatCurrency(results.cost_breakdown.mrv_cost_usd)}
                            icon={BarChart3}
                          />
                          <Metric
                            label={isId ? "Biaya Validasi" : "Validation Cost"}
                            sublabel={isId ? "VVB (Validation & Verification Body): Audit pihak ketiga metodologi karbon" : "VVB (Validation & Verification Body): Third-party independent carbon audit"}
                            value={formatCurrency(results.cost_breakdown.validation_cost_usd)}
                            icon={ShieldCheck}
                          />
                          <Metric
                            label={isId ? "Biaya Operasional" : "Operational Cost"}
                            sublabel={isId ? "OPEX (Operational Expenditure): Pemeliharaan rutin dan patroli penjagaan hutan" : "OPEX (Operational Expenditure): Routine maintenance and forest patrols"}
                            value={formatCurrency(results.cost_breakdown.operational_cost_usd)}
                            icon={Activity}
                          />
                        </div>
                      </div>
                    )}

                    {/* Overlay Spasial (GEE / GIS Layers) */}
                    {results.spatial_overlay_layers &&
                      typeof results.spatial_overlay_layers === "object" &&
                      Object.keys(results.spatial_overlay_layers).length > 0 && (
                        <div className="p-6 md:p-8 bg-emerald-50/50 rounded-[1.5rem] border border-emerald-100">
                          <p className="text-[12px] font-extrabold text-emerald-950 uppercase tracking-widest mb-5">
                            {isId ? "Lapisan Analisis Spasial" : "Spatial Analysis Layers"}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {Object.entries(results.spatial_overlay_layers)
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

                    {/* Rekomendasi Strategis */}
                    {results.recommendations && results.recommendations.length > 0 && (
                      <div className="p-6 md:p-8 bg-emerald-50/40 rounded-[1.5rem] border border-emerald-100/80">
                        <p className="text-[12px] font-extrabold text-emerald-950 uppercase tracking-widest mb-4">
                          {isId ? "Rekomendasi Strategis Kelayakan" : "Strategic Feasibility Recommendations"}
                        </p>
                        <ul className="space-y-3">
                          {results.recommendations.map((rec: string, i: number) => (
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

                {/* 4. PERINGATAN & TOMBOL SIMPAN/UNDUH (Selalu bisa diklik di paling bawah) */}
                <div className="flex flex-col gap-6 mt-4">
                  <div className="flex flex-col p-6 md:p-8 bg-amber-50/40 rounded-[1.5rem] border border-amber-200/60 hover:shadow-sm transition-all duration-300">
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
                            <>Hasil analisis ini merupakan <strong>perhitungan kasar (estimasi awal)</strong>. Untuk mendapatkan verifikasi detail dan nilai kelayakan finansial yang terbuka, silakan hubungi tim kami.</>
                          ) : (
                            <>This analysis is only a <strong>rough preliminary estimate</strong>. To get detailed verification and unlocked financial feasibility values, please contact our team.</>
                          )}
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-2 border-t border-emerald-50">
                    <button
                      type="button"
                      onClick={handleDownloadPDF}
                      disabled={isSaving}
                      className="flex-1 px-6 py-4 bg-white border border-emerald-200/80 text-emerald-800 text-[15px] font-bold rounded-2xl flex justify-center items-center gap-2 hover:bg-emerald-50 transition-all duration-300 shadow-sm active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-white"
                    >
                      <Download className="w-5 h-5" />
                      {t.download_pdf}
                    </button>

                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex-1 px-6 py-4 bg-emerald-800 text-white text-[15px] font-bold rounded-2xl flex justify-center items-center gap-2 hover:bg-emerald-950 transition-all duration-300 shadow-md shadow-emerald-950/20 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <Save className="w-5 h-5" />
                      {isSaving ? (isId ? "Menyimpan…" : "Saving…") : t.save}
                    </button>
                  </div>
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
      className={`relative p-5 md:p-6 rounded-[1.5rem] border transition-all duration-300 ease-out flex flex-col justify-between hover:-translate-y-1.5 overflow-hidden ${highlight
          ? "bg-gradient-to-br from-emerald-600 to-emerald-800 border-emerald-500 shadow-lg shadow-emerald-900/20 text-white"
          : "bg-white border-emerald-100/60 shadow-sm hover:shadow-md text-emerald-950"
        }`}
    >
      {highlight && (
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      )}
      <div className="flex items-start justify-between mb-3 relative z-10 gap-3">
        <div className="flex-1 min-w-0">
          <p
            className={`text-[11px] md:text-[12px] font-extrabold tracking-widest uppercase ${highlight ? "text-emerald-50" : "text-emerald-900"
              }`}
          >
            {label}
          </p>
          {sublabel && (
            <p
              className={`text-[11px] font-medium tracking-normal mt-0.5 leading-snug break-words ${highlight ? "text-emerald-100/80" : "text-emerald-700/70"
                }`}
            >
              {sublabel}
            </p>
          )}
        </div>
        {Icon && (
          <div
            className={`p-2 rounded-xl shrink-0 ${highlight ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-600"
              }`}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="relative z-10 mt-2">
        <p
          className={`text-[20px] sm:text-[24px] font-extrabold leading-tight break-words`}
        >
          {value}
          {unit && (
            <span
              className={`text-[14px] sm:text-[15px] font-bold ml-1.5 ${highlight ? "text-emerald-200" : "text-emerald-700"
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