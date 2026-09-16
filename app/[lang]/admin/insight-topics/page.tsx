"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Tag,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { extractErrorMessage, getErrorMessage } from "@/lib/error";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

type Topic = {
  id: number;
  slug: string;
  label_id: string;
  label_en: string;
  created_by?: string | null;
  created_at?: string;
};

type FormState = {
  label_id: string;
  label_en: string;
  slug: string;
};

const emptyForm: FormState = { label_id: "", label_en: "", slug: "" };

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 50);
}

export default function AdminInsightTopicsPage() {
  const params = useParams();
  const lang = (params?.lang as string) || "en";
  const isId = lang === "id";

  const [items, setItems] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [mode, setMode] = useState<"idle" | "create" | "edit">("idle");
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const token = () =>
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null;

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/insight-topics/`);
      if (!res.ok) {
        throw new Error(await extractErrorMessage(res, isId ? "Gagal memuat topic." : "Failed to load topics.", lang));
      }
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setItems([]);
      setError(getErrorMessage(err, isId ? "Gagal memuat topic." : "Failed to load topics."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setMode("create");
    setEditId(null);
    setForm(emptyForm);
    setError(null);
  };

  const openEdit = (t: Topic) => {
    setMode("edit");
    setEditId(t.id);
    setForm({
      label_id: t.label_id,
      label_en: t.label_en,
      slug: t.slug,
    });
    setError(null);
  };

  const closeForm = () => {
    setMode("idle");
    setEditId(null);
    setForm(emptyForm);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.label_id.trim() || !form.label_en.trim()) {
      setError(isId ? "Label ID dan EN wajib diisi." : "ID and EN labels are required.");
      return;
    }

    const t = token();
    if (!t) {
      setError(isId ? "Sesi login habis. Login ulang." : "Session expired. Login again.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        label_id: form.label_id.trim(),
        label_en: form.label_en.trim(),
        slug: form.slug.trim() ? slugify(form.slug) : undefined,
      };

      let res: Response;
      if (mode === "create") {
        res = await fetch(`${API_URL}/insight-topics/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${t}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_URL}/insight-topics/${editId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${t}`,
          },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        throw new Error(
          await extractErrorMessage(res, isId ? "Gagal menyimpan topic." : "Failed to save topic.", lang)
        );
      }

      setSuccess(isId ? "Topic berhasil disimpan." : "Topic saved successfully.");
      closeForm();
      await load();
      setTimeout(() => setSuccess(null), 2500);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteId == null) return;
    const t = token();
    if (!t) {
      setError(isId ? "Sesi login habis." : "Session expired.");
      setDeleteId(null);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/insight-topics/${deleteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!res.ok) {
        throw new Error(
          await extractErrorMessage(
            res,
            isId
              ? "Gagal menghapus. Topic mungkin masih dipakai artikel."
              : "Delete failed. Topic may still be in use.",
            lang
          )
        );
      }
      setSuccess(isId ? "Topic dihapus." : "Topic deleted.");
      setDeleteId(null);
      await load();
      setTimeout(() => setSuccess(null), 2500);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      setDeleteId(null);
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 outline-none font-medium text-slate-900 text-sm";

  return (
    <div className="max-w-4xl mx-auto pb-16 font-sans">
      {/* Toast / modal pesan */}
      {(error || success) && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[1.5rem] p-8 max-w-sm w-full text-center shadow-2xl">
            {error ? (
              <>
                <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
                <p className="text-slate-600 mb-4 text-sm font-medium">{error}</p>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="w-full py-3 bg-rose-50 text-rose-600 font-bold rounded-xl text-sm"
                >
                  {isId ? "Tutup" : "Close"}
                </button>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                <p className="text-slate-600 text-sm font-medium">{success}</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {deleteId != null && (
        <div className="fixed inset-0 z-[240] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[1.5rem] p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-extrabold text-slate-900 mb-2">
              {isId ? "Hapus topic?" : "Delete topic?"}
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              {isId
                ? "Tidak bisa dihapus jika masih dipakai insight."
                : "Cannot delete if still used by insights."}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 text-sm"
              >
                {isId ? "Batal" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="flex-1 py-3 rounded-xl bg-rose-500 text-white font-bold text-sm disabled:opacity-60"
              >
                {isId ? "Hapus" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Link
        href={`/${lang}/admin`}
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-emerald-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {isId ? "Kembali ke dashboard" : "Back to dashboard"}
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Tag className="w-5 h-5 text-emerald-600" />
            <h1 className="text-2xl md:text-3xl font-extrabold text-emerald-950">
              {isId ? "Topic Insight" : "Insight Topics"}
            </h1>
          </div>
          <p className="text-sm text-slate-500 font-medium">
            {isId
              ? "Kelola kategori filter untuk halaman Insights (bilingual)."
              : "Manage filter categories for the Insights page (bilingual)."}
          </p>
        </div>
        {mode === "idle" && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 transition text-sm"
          >
            <Plus className="w-4 h-4" />
            {isId ? "Tambah topic" : "Add topic"}
          </button>
        )}
      </div>

      {/* Form create / edit */}
      {mode !== "idle" && (
        <form
          onSubmit={handleSave}
          className="bg-white border border-slate-200 rounded-[1.5rem] p-6 md:p-8 mb-8 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-extrabold text-slate-900">
              {mode === "create"
                ? isId
                  ? "Topic baru"
                  : "New topic"
                : isId
                ? "Edit topic"
                : "Edit topic"}
            </h2>
            <button
              type="button"
              onClick={closeForm}
              className="p-2 rounded-lg text-slate-400 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Label (ID)
              </label>
              <input
                className={inputCls}
                value={form.label_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, label_id: e.target.value }))
                }
                placeholder="Karbon"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Label (EN)
              </label>
              <input
                className={inputCls}
                value={form.label_en}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    label_en: e.target.value,
                    slug:
                      mode === "create" && !f.slug
                        ? slugify(e.target.value)
                        : f.slug,
                  }))
                }
                placeholder="Carbon"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Slug{" "}
              <span className="font-medium normal-case text-slate-400">
                ({isId ? "opsional, unik" : "optional, unique"})
              </span>
            </label>
            <input
              className={inputCls}
              value={form.slug}
              onChange={(e) =>
                setForm((f) => ({ ...f, slug: slugify(e.target.value) }))
              }
              placeholder="carbon"
            />
            <p className="mt-1.5 text-[11px] text-slate-400">
              {isId
                ? "Dipakai di URL filter & field topic artikel. Contoh: carbon, esg."
                : "Used in filters & article topic field. e.g. carbon, esg."}
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl text-sm disabled:opacity-60"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isId ? "Simpan" : "Save"}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 text-sm"
            >
              {isId ? "Batal" : "Cancel"}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="bg-white border border-slate-200 rounded-[1.5rem] overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm font-medium">
            {isId
              ? "Belum ada topic. Klik “Tambah topic”."
              : "No topics yet. Click “Add topic”."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-5 py-3.5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-5 py-3.5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-5 py-3.5 font-bold text-slate-500 text-[11px] uppercase tracking-wider">
                    EN
                  </th>
                  <th className="px-5 py-3.5 font-bold text-slate-500 text-[11px] uppercase tracking-wider hidden md:table-cell">
                    {isId ? "Dibuat" : "By"}
                  </th>
                  <th className="px-5 py-3.5 font-bold text-slate-500 text-[11px] uppercase tracking-wider text-right">
                    {isId ? "Aksi" : "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-slate-50 hover:bg-emerald-50/30 transition-colors"
                  >
                    <td className="px-5 py-4 font-mono text-xs text-emerald-800 font-bold">
                      {t.slug}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {t.label_id}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {t.label_en}
                    </td>
                    <td className="px-5 py-4 text-slate-400 text-xs hidden md:table-cell">
                      {t.created_by || "—"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(t)}
                          className="p-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(t.id)}
                          className="p-2 rounded-lg bg-rose-50/80 text-rose-400 hover:bg-rose-100 hover:text-rose-600 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}