"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  ExternalLink,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const BACKEND_ORIGIN = API_URL.replace(/\/api\/v1\/?$/, "");

type Article = {
  id: number;
  title: string;
  title_en?: string | null;
  slug: string;
  status: string;
  topic?: string | null;
  image_url?: string | null;
  created_at?: string;
};

type TopicOption = {
  slug: string;
  label_id: string;
  label_en: string;
};

function resolveImageUrl(url?: string | null) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${BACKEND_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
}

function formatDate(dateString?: string) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function displayTitle(item: Article, isId: boolean) {
  if (!isId && item.title_en?.trim()) return item.title_en;
  return item.title || "—";
}

export default function AdminInsightsListPage() {
  const params = useParams();
  const lang = (params?.lang as string) || "en";
  const isId = lang === "id";

  const [items, setItems] = useState<Article[]>([]);
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [activeTopic, setActiveTopic] = useState<string>("all");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Article | null>(null);
  const [deleting, setDeleting] = useState(false);

  const token = () => localStorage.getItem("access_token");

  const load = async () => {
    setLoading(true);
    try {
      const apiLang = lang === "en" ? "en" : "id";
      const res = await fetch(
        `${API_URL}/articles/?category=insight&lang=${apiLang}`
      );
      if (!res.ok) {
        throw new Error(
          isId ? "Gagal memuat insights" : "Failed to load insights"
        );
      }
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => {
    const loadTopics = async () => {
      try {
        const res = await fetch(`${API_URL}/insight-topics/`);
        if (!res.ok) return;
        const data = await res.json();
        setTopics(Array.isArray(data) ? data : []);
      } catch {
        setTopics([]);
      }
    };
    loadTopics();
  }, []);

  useEffect(() => {
    if (!success && !error) return;
    const t = setTimeout(() => {
      setSuccess(null);
      setError(null);
    }, 4000);
    return () => clearTimeout(t);
  }, [success, error]);

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/articles/${toDelete.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error(isId ? "Gagal menghapus" : "Delete failed");
      setItems((prev) => prev.filter((x) => x.id !== toDelete.id));
      setSuccess(isId ? "Insight berhasil dihapus." : "Insight deleted.");
      setToDelete(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setDeleting(false);
    }
  };

  const visible = items.filter((item) => {
    if (activeTopic !== "all" && item.topic !== activeTopic) return false;
    if (!q.trim()) return true;
    const hay = `${displayTitle(item, isId)} ${item.slug}`.toLowerCase();
    return hay.includes(q.trim().toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin mb-4" />
        <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">
          {isId ? "Memuat Data..." : "Loading Data..."}
        </p>
      </div>
    );
  }

  return (
    <div className="pb-16 font-sans relative">
      {/* SUCCESS / ERROR */}
      {(error || success) && !toDelete && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center animate-in zoom-in-[0.95] fade-in duration-300 border border-slate-100">
            {error ? (
              <>
                <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
                  <AlertTriangle className="w-6 h-6 text-rose-500" />
                </div>
                <h3 className="text-[18px] font-extrabold text-slate-800 mb-2">
                  {isId ? "Gagal Memproses" : "Action Failed"}
                </h3>
                <p className="text-[13px] font-medium text-slate-500 mb-6 leading-relaxed">
                  {error}
                </p>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="w-full py-3 bg-rose-50 hover:bg-rose-100 transition-colors text-rose-600 text-[14px] font-bold rounded-xl active:scale-95"
                >
                  {isId ? "Tutup" : "Close"}
                </button>
              </>
            ) : (
              <>
                <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </div>
                <h3 className="text-[18px] font-extrabold text-slate-800 mb-2">
                  {isId ? "Berhasil" : "Success"}
                </h3>
                <p className="text-[13px] font-medium text-slate-500 mb-6 leading-relaxed">
                  {success}
                </p>
                <button
                  type="button"
                  onClick={() => setSuccess(null)}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 transition-all text-white text-[14px] font-bold rounded-xl shadow-sm active:scale-95"
                >
                  {isId ? "Tutup" : "Close"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {toDelete && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[400px] p-8 text-center animate-in zoom-in-[0.95] fade-in duration-300 border border-slate-100">
            <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <AlertTriangle className="w-6 h-6 text-rose-500" />
            </div>
            <h3 className="text-[18px] font-extrabold text-slate-900 mb-2">
              {isId ? "Hapus Insight Ini?" : "Delete This Insight?"}
            </h3>
            <p className="text-[13.5px] text-slate-500 mb-8 leading-relaxed">
              <span className="font-extrabold text-slate-800">
                {displayTitle(toDelete, isId)}
              </span>
              <br />
              {isId
                ? "Artikel ini akan dihapus secara permanen."
                : "This article will be permanently deleted."}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setToDelete(null)}
                className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 transition-colors text-[13.5px] font-bold text-slate-600 rounded-xl active:scale-95"
              >
                {isId ? "Batal" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-rose-600 hover:bg-rose-700 transition-all text-white text-[13.5px] font-bold rounded-xl shadow-sm disabled:opacity-70 active:scale-95"
              >
                {deleting ? (
                  <div className="w-4 h-4 border-2 border-rose-200 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    {isId ? "Hapus" : "Delete"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
            Insights Library
          </h1>
          <p className="text-slate-500 font-medium text-[13.5px]">
            {isId
              ? "Kelola semua artikel dan perspektif analisis publik Anda."
              : "Manage all your published articles and public perspectives."}
          </p>
        </div>
        <Link
          href={`/${lang}/admin/insights/new`}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-[14px] font-bold hover:bg-emerald-700 hover:-translate-y-0.5 hover:shadow-lg transition-all active:scale-95 shrink-0 shadow-md"
        >
          <Plus className="w-4 h-4" />
          {isId ? "Insight Baru" : "New Insight"}
        </Link>
      </div>

      {/* FILTER + SEARCH */}
      <div className="mb-5 flex flex-col lg:flex-row gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={isId ? "Cari judul…" : "Search title…"}
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-[14px] font-medium outline-none focus:border-emerald-500"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTopic("all")}
            className={`px-3 py-2 rounded-xl text-[12px] font-bold border ${
              activeTopic === "all"
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-slate-600 border-slate-200"
            }`}
          >
            {isId ? "Semua" : "All"}
          </button>
          {topics.map((t) => (
            <button
              key={t.slug}
              type="button"
              onClick={() => setActiveTopic(t.slug)}
              className={`px-3 py-2 rounded-xl text-[12px] font-bold border ${
                activeTopic === t.slug
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white text-slate-600 border-slate-200"
              }`}
            >
              {isId ? t.label_id : t.label_en}
            </button>
          ))}
        </div>
      </div>

      {/* LIST */}
      {items.length === 0 ? (
        <div className="bg-white border border-slate-200 border-dashed rounded-[2rem] p-16 text-center animate-in fade-in duration-700 flex flex-col items-center">
          <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mb-5">
            <FileText className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-[18px] font-extrabold text-slate-900 mb-2">
            {isId ? "Belum Ada Insight" : "No Insights Published"}
          </h3>
          <p className="text-slate-500 font-medium text-[13.5px] max-w-sm mb-8">
            {isId
              ? "Mulai bagikan artikel, analisis, dan perspektif pertama Anda."
              : "Start sharing your first article, analysis, and perspective."}
          </p>
          <Link
            href={`/${lang}/admin/insights/new`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white text-[14px] font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            {isId ? "Mulai Menulis" : "Start Writing"}
          </Link>
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-[1.5rem] p-12 text-center">
          <p className="text-slate-500 font-medium text-[14px]">
            {isId
              ? "Tidak ada insight yang cocok dengan filter atau pencarian."
              : "No insights match your filter or search."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((item, index) => {
            const img = resolveImageUrl(item.image_url);
            const isPub = item.status === "published";

            return (
              <div
                key={item.id}
                className="group bg-white border border-slate-200 hover:border-emerald-300/80 rounded-[1.25rem] p-4 flex flex-col md:flex-row md:items-center gap-5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <div className="w-full sm:w-28 md:w-32 aspect-[16/10] rounded-xl overflow-hidden bg-slate-50 shrink-0 border border-slate-100 relative">
                  {img ? (
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span
                      className={`text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded border ${
                        isPub
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200/50"
                          : "bg-slate-50 text-slate-600 border-slate-200"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <h3
                    className="text-[16px] md:text-[17px] font-extrabold text-slate-900 truncate mb-1 group-hover:text-emerald-700 transition-colors"
                    title={displayTitle(item, isId)}
                  >
                    {displayTitle(item, isId)}
                  </h3>

                  <p
                    className="text-[13px] text-slate-500 font-medium truncate flex items-center gap-2"
                    title={`/${lang}/insights/${item.slug}`}
                  >
                    <span>{formatDate(item.created_at)}</span>
                    {item.slug && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0" />
                        <span className="truncate">
                          /{lang}/insights/{item.slug}
                        </span>
                      </>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-0 border-slate-100">
                  <Link
                    href={`/${lang}/insights/${item.slug}`}
                    target="_blank"
                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-slate-50 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                    title={isId ? "Pratinjau Publik" : "Preview"}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>

                  <Link
                    href={`/${lang}/admin/insights/${item.id}/edit`}
                    className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-emerald-50 text-emerald-700 text-[13px] font-bold hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Edit</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => setToDelete(item)}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                    title={isId ? "Hapus" : "Delete"}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}