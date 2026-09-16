"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Plus, Pencil, Trash2, FileText, ExternalLink, AlertTriangle, CheckCircle2 } from "lucide-react";
import { extractErrorMessage, getErrorMessage } from "@/lib/error";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const BACKEND_ORIGIN = API_URL.replace(/\/api\/v1\/?$/, "");

type Article = {
  id: number;
  category: string;
  title: string;
  slug: string;
  author: string;
  status: string;
  image_url?: string | null;
};

function resolveImageUrl(url?: string | null) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${BACKEND_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
}

export default function AdminArticlesListPage() {
  const params = useParams();
  const lang = (params?.lang as string) || "en";
  const isId = lang === "id";

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "about" | "services" | "general">("all");
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const token = () => localStorage.getItem("access_token");

  useEffect(() => {
    if (!success && (!error || articleToDelete)) return;
    const t = setTimeout(() => {
      setSuccess(null);
      if (!articleToDelete) setError(null);
    }, 4000);
    return () => clearTimeout(t);
  }, [success, error, articleToDelete]);

  const loadArticles = async () => {
    try {
      const res = await fetch(`${API_URL}/articles/`);
      if (!res.ok) {
        throw new Error(await extractErrorMessage(res, isId ? "Gagal memuat artikel" : "Failed to load", lang));
      }
      const data = await res.json();
      setArticles(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);

  const confirmDelete = async () => {
    if (!articleToDelete) return;
    setIsDeleting(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/articles/${articleToDelete.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok && res.status !== 204) {
        throw new Error(await extractErrorMessage(res, isId ? "Gagal menghapus" : "Delete failed", lang));
      }
      setArticles((prev) => prev.filter((a) => a.id !== articleToDelete.id));
      setSuccess(isId ? "Artikel berhasil dihapus." : "Article successfully deleted.");
      setArticleToDelete(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      setArticleToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered =
    filter === "all" ? articles : articles.filter((a) => a.category === filter);

  const publicPath = (a: Article) => {
    if (a.category === "about") return `/${lang}/about`;
    if (a.category === "services") return `/${lang}/services`;
    return `/${lang}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative font-sans pb-16">
      {/* GLOBAL POPUP (SUCCESS / ERROR) */}
      {(error || success) && !articleToDelete && (
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
      {articleToDelete && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden p-8 text-center relative animate-in zoom-in-[0.5] fade-in duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-rose-100 relative">
              <div className="absolute inset-0 rounded-2xl border-2 border-rose-200 animate-ping opacity-50 duration-1000" />
              <AlertTriangle className="w-8 h-8 text-rose-500 relative z-10" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-800 mb-2">
              {isId ? "Hapus Artikel Ini?" : "Delete This Article?"}
            </h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed px-2">
              {isId ? "Apakah Anda yakin ingin menghapus" : "Are you sure you want to delete"}{" "}
              <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md inline-block mx-1 truncate max-w-[200px] align-bottom">
                {articleToDelete.title}
              </span>
              ? {isId ? "Tindakan ini tidak dapat dibatalkan." : "This action cannot be undone."}
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  setArticleToDelete(null);
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

      <div className="flex flex-wrap items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-emerald-950 tracking-tight mb-1">
            {isId ? "Daftar Konten" : "Content List"}
          </h1>
          <p className="text-emerald-900/50 font-medium text-sm">
            {isId
              ? "Semua artikel About & Services"
              : "All About & Services articles"}
          </p>
        </div>

        <Link
          href={`/${lang}/admin/articles/new`}
          className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all"
        >
          <Plus className="w-5 h-5" />
          {isId ? "Buat Artikel" : "Create Article"}
        </Link>
      </div>

      {/* Filter nav */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(
          [
            ["all", isId ? "Semua" : "All"],
            ["about", "About"],
            ["services", "Services"],
            ["general", "General"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
              filter === key
                ? "bg-emerald-600 text-white"
                : "bg-white border border-emerald-100 text-emerald-800 hover:bg-emerald-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-emerald-200 rounded-2xl py-20 text-center">
          <FileText className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
          <p className="text-emerald-900/50 font-medium mb-6">
            {isId ? "Belum ada artikel" : "No articles yet"}
          </p>
          <Link
            href={`/${lang}/admin/articles/new`}
            className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white font-bold rounded-xl"
          >
            <Plus className="w-5 h-5" />
            {isId ? "Buat Artikel" : "Create Article"}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((article) => {
            const img = resolveImageUrl(article.image_url);
            return (
              <div
                key={article.id}
                className="bg-white border border-emerald-100/80 rounded-2xl p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4 shadow-sm"
              >
                {img ? (
                  <div className="w-full md:w-28 aspect-video rounded-xl overflow-hidden border border-emerald-100 shrink-0">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="hidden md:flex w-28 aspect-video rounded-xl bg-emerald-50 border border-emerald-100 items-center justify-center shrink-0">
                    <FileText className="w-6 h-6 text-emerald-300" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                      {article.category}
                    </span>
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        article.status === "published"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : "bg-slate-50 text-slate-500 border-slate-200"
                      }`}
                    >
                      {article.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-emerald-950 truncate">
                    {article.title}
                  </h3>
                  <p className="text-sm text-emerald-900/40 font-medium mt-0.5">
                    {article.author} · {article.slug}
                  </p>
                </div>

                {/* Nav actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {article.status === "published" && (
                    <Link
                      href={publicPath(article)}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-100 text-emerald-700 text-sm font-bold hover:bg-emerald-50"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {isId ? "Lihat" : "View"}
                    </Link>
                  )}
                  <Link
                    href={`/${lang}/admin/articles/${article.id}/edit`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-100 text-emerald-700 text-sm font-bold hover:bg-emerald-50"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => setArticleToDelete(article)}
                    disabled={isDeleting && articleToDelete?.id === article.id}
                    className="p-2.5 rounded-xl border border-rose-100 text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                    title="Delete"
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