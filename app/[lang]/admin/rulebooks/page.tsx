"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Plus,
  FileText,
  Upload,
  Trash2,
  Pencil,
  X,
  Download,
  Users,
  CheckCircle2,
  AlertTriangle,
  Eye,
  File,
  ChevronDown,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

type Rulebook = {
  id: number;
  title: string;
  description?: string | null;
  file_url: string;
  thumbnail_url?: string | null;
  status: string;
  download_count: number;
  created_at?: string;
  updated_at?: string;
};

type DownloadLead = {
  id: number;
  name: string;
  email: string;
  phone: string;
  institution: string;
  created_at?: string;
};

const emptyForm = {
  title: "",
  description: "",
  status: "published",
};

export default function AdminRulebooksPage() {
  const params = useParams();
  const router = useRouter();
  const lang = (params?.lang as string) || "en";
  const isId = lang === "id";

  const [items, setItems] = useState<Rulebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Rulebook | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [statusOpen, setStatusOpen] = useState(false);

  const [deleteItem, setDeleteItem] = useState<Rulebook | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [leadRulebook, setLeadRulebook] = useState<Rulebook | null>(null);
  const [leads, setLeads] = useState<DownloadLead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);

  const token = () => localStorage.getItem("access_token");

  const formatDate = (value?: string) => {
    if (!value) return "-";
    try {
      return new Date(value).toLocaleDateString(isId ? "id-ID" : "en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "-";
    }
  };

  const readError = async (response: Response, fallback: string) => {
    try {
      const data = await response.json();
      if (typeof data.detail === "string") return data.detail;
      return fallback;
    } catch {
      return fallback;
    }
  };

  const validatePdf = (file: File) => {
    if (file.type !== "application/pdf") {
      setError(isId ? "File harus format PDF." : "File must be PDF format.");
      return false;
    }
    if (file.size > 25 * 1024 * 1024) {
      setError(
        isId ? "Ukuran PDF maksimal 25MB." : "Maximum PDF size is 25MB."
      );
      return false;
    }
    setError(null);
    return true;
  };

  const loadRulebooks = async () => {
    try {
      const response = await fetch(`${API_URL}/rulebooks/admin/all`, {
        headers: { Authorization: `Bearer ${token()}` },
      });

      if (response.status === 401) {
        router.push(`/${lang}/login`);
        return;
      }

      if (response.status === 403) {
        throw new Error(
          isId
            ? "Akses ditolak. Halaman ini hanya untuk Admin."
            : "Access denied. Admin only."
        );
      }

      if (!response.ok) {
        throw new Error(
          await readError(
            response,
            isId ? "Gagal memuat Rulebook." : "Failed to load Rulebooks."
          )
        );
      }

      const data = await response.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = token();
    if (!t) {
      router.push(`/${lang}/login`);
      return;
    }
    loadRulebooks();
  }, [lang, router]);

  useEffect(() => {
    if (!success && (!error || deleteItem)) return;
    const timer = setTimeout(() => {
      setSuccess(null);
      if (!deleteItem) setError(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [success, error, deleteItem]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setPdfFile(null);
    setShowForm(true);
    setError(null);
    setStatusOpen(false);
  };

  const openEdit = (item: Rulebook) => {
    setEditing(item);
    setForm({
      title: item.title || "",
      description: item.description || "",
      status: item.status || "published",
    });
    setPdfFile(null);
    setShowForm(true);
    setError(null);
    setStatusOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
    setPdfFile(null);
    setStatusOpen(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (editing) {
        const data = new FormData();
        data.append("title", form.title);
        data.append("description", form.description);
        data.append("status", form.status);
        if (pdfFile) {
          data.append("file", pdfFile);
        }

        const response = await fetch(
          `${API_URL}/rulebooks/admin/${editing.id}`,
          {
            method: "PUT",
            headers: { Authorization: `Bearer ${token()}` },
            body: data,
          }
        );

        if (!response.ok) {
          throw new Error(
            await readError(
              response,
              isId
                ? "Gagal memperbarui Rulebook."
                : "Failed to update Rulebook."
            )
          );
        }

        setSuccess(
          isId
            ? "Rulebook berhasil diperbarui."
            : "Rulebook updated successfully."
        );
      } else {
        if (!pdfFile) {
          throw new Error(
            isId
              ? "Pilih file PDF terlebih dahulu."
              : "Please select a PDF file."
          );
        }

        const data = new FormData();
        data.append("title", form.title);
        data.append("description", form.description);
        data.append("status", form.status);
        data.append("file", pdfFile);

        const response = await fetch(`${API_URL}/rulebooks/admin/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token()}` },
          body: data,
        });

        if (!response.ok) {
          throw new Error(
            await readError(
              response,
              isId ? "Gagal upload Rulebook." : "Failed to upload Rulebook."
            )
          );
        }

        setSuccess(
          isId
            ? "Rulebook berhasil ditambahkan."
            : "Rulebook uploaded successfully."
        );
      }

      closeForm();
      await loadRulebooks();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);

    try {
      const response = await fetch(
        `${API_URL}/rulebooks/admin/${deleteItem.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token()}` },
        }
      );

      if (!response.ok && response.status !== 204) {
        throw new Error(
          isId ? "Gagal menghapus Rulebook." : "Failed to delete Rulebook."
        );
      }

      setDeleteItem(null);
      setSuccess(
        isId
          ? "Rulebook berhasil dihapus."
          : "Rulebook deleted successfully."
      );
      await loadRulebooks();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const openDownloads = async (item: Rulebook) => {
    setLeadRulebook(item);
    setLeads([]);
    setLoadingLeads(true);

    try {
      const response = await fetch(
        `${API_URL}/rulebooks/admin/${item.id}/downloads`,
        {
          headers: { Authorization: `Bearer ${token()}` },
        }
      );

      if (!response.ok) {
        throw new Error(
          isId
            ? "Gagal memuat data download."
            : "Failed to load download data."
        );
      }

      const data = await response.json();
      setLeads(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingLeads(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
      </div>
    );
  }

  const inputClassName =
    "w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all duration-200 shadow-sm bg-slate-50 focus:bg-white text-slate-800 text-sm font-medium";

  return (
    <div className="max-w-5xl mx-auto px-4 pb-8 pt-0 md:-mt-4 font-sans selection:bg-emerald-200">
      {/* HEADER */}
      <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              {isId ? "Manajemen Rulebook" : "Rulebook Management"}
            </h1>
            <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5 max-w-xl">
              {isId
                ? "Kelola dokumen PDF Rulebook dan pantau pengguna yang mengunduhnya."
                : "Manage Rulebook PDF documents and monitor users who download them."}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-500 hover:shadow-md transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          {isId ? "Tambah Rulebook" : "Add Rulebook"}
        </button>
      </div>

      {/* ALERTS */}
      {error && !deleteItem && (
        <div className="mb-6 flex items-center gap-3 px-5 py-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 animate-in fade-in slide-in-from-top-4 duration-300 shadow-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p className="font-bold text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 flex items-center gap-3 px-5 py-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 animate-in fade-in slide-in-from-top-4 duration-300 shadow-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className="font-bold text-sm">{success}</p>
        </div>
      )}

      {/* FORM */}
      {showForm && (
        <div className="mb-8 bg-white border border-slate-100 rounded-2xl p-5 md:p-6 shadow-md animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {editing
                ? isId
                  ? "Edit Rulebook"
                  : "Edit Rulebook"
                : isId
                  ? "Upload Rulebook Baru"
                  : "Upload New Rulebook"}
            </h2>
            <button
              type="button"
              onClick={closeForm}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={submit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  {isId ? "Judul Rulebook" : "Rulebook Title"}
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={inputClassName}
                  placeholder={
                    isId ? "Misal: Panduan ESG 2026" : "e.g. ESG Guide 2026"
                  }
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  {isId ? "Deskripsi" : "Description"}
                </label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className={`${inputClassName} resize-none`}
                  placeholder={
                    isId
                      ? "Tulis deskripsi singkat tentang dokumen ini..."
                      : "Write a brief description..."
                  }
                />
              </div>

              {/* Status */}
              <div className="relative">
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Status
                </label>

                {statusOpen && (
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setStatusOpen(false)}
                  />
                )}

                <button
                  type="button"
                  onClick={() => setStatusOpen((v) => !v)}
                  className="relative z-20 w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all duration-200 shadow-sm text-left text-sm"
                >
                  <span className="font-semibold text-slate-700 capitalize">
                    {form.status}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                      statusOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {statusOpen && (
                  <div className="absolute z-30 mt-1.5 w-full bg-white border border-slate-100 rounded-xl shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-1.5 space-y-0.5">
                      {["published", "draft"].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setForm((prev) => ({ ...prev, status: opt }));
                            setStatusOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors text-sm capitalize ${
                            form.status === opt
                              ? "bg-emerald-50 text-emerald-700 font-bold"
                              : "text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* PDF — create wajib, edit opsional */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  {editing
                    ? isId
                      ? "Ganti PDF (opsional)"
                      : "Replace PDF (optional)"
                    : "PDF File"}
                </label>
                <label className="flex items-center gap-3 h-[42px] px-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 cursor-pointer hover:bg-emerald-50 hover:border-emerald-300 transition-all group">
                  <Upload className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0 transition-colors" />
                  <span className="text-sm font-semibold text-slate-500 group-hover:text-emerald-700 truncate transition-colors">
                    {pdfFile
                      ? pdfFile.name
                      : editing
                        ? isId
                          ? "Biarkan kosong jika tidak diganti"
                          : "Leave empty to keep current PDF"
                        : isId
                          ? "Pilih file PDF..."
                          : "Select PDF file..."}
                  </span>
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (!validatePdf(file)) return;
                      setPdfFile(file);
                    }}
                  />
                </label>
                {editing && (
                  <p className="mt-1.5 text-[11px] text-slate-400 font-medium truncate">
                    {isId ? "File saat ini: " : "Current file: "}
                    <a
                      href={editing.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-600 hover:underline"
                    >
                      {editing.file_url.split("/").pop() || "PDF"}
                    </a>
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-500 shadow-sm disabled:opacity-60 transition-all"
              >
                {saving ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                {saving
                  ? isId
                    ? "Menyimpan..."
                    : "Saving..."
                  : editing
                    ? isId
                      ? "Simpan Perubahan"
                      : "Save Changes"
                    : isId
                      ? "Upload Rulebook"
                      : "Upload Rulebook"}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="px-6 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-colors"
              >
                {isId ? "Batal" : "Cancel"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* LIST */}
      {items.length === 0 ? (
        <div className="py-20 bg-white border border-slate-100 rounded-2xl text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-6 h-6 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-1">
            {isId ? "Belum Ada Rulebook" : "No Rulebooks Yet"}
          </h3>
          <p className="text-sm text-slate-500 font-medium">
            {isId
              ? "Upload PDF pertama untuk mulai menampilkan Rulebook."
              : "Upload your first PDF to start displaying Rulebooks."}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {items.map((item) => (
            <article
              key={item.id}
              className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
                  <File className="w-5 h-5" />
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest border ${
                    item.status === "published"
                      ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                      : "bg-amber-50 border-amber-100 text-amber-700"
                  }`}
                >
                  {item.status}
                </span>
              </div>

              <h2 className="text-lg font-extrabold text-slate-800 leading-snug line-clamp-2 mb-2">
                {item.title}
              </h2>

              <p className="text-sm text-slate-500 font-medium leading-relaxed line-clamp-3 min-h-[60px]">
                {item.description ||
                  (isId ? "Tanpa deskripsi." : "No description.")}
              </p>

              <div className="grid grid-cols-2 gap-3 mt-5">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <Download className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Downloads
                    </span>
                  </div>
                  <strong className="text-lg font-extrabold text-emerald-700">
                    {item.download_count || 0}
                  </strong>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col justify-center">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">
                    {isId ? "Dibuat" : "Created"}
                  </p>
                  <p className="text-xs font-bold text-slate-700">
                    {formatDate(item.created_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 mt-5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => openDownloads(item)}
                  className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-emerald-100 hover:text-emerald-700 transition-colors"
                  title={isId ? "Data Pengunduh" : "Lead Data"}
                >
                  <Users className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2">
                  <a
                    href={item.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-emerald-100 hover:text-emerald-700 transition-colors"
                    title={isId ? "Lihat PDF" : "View PDF"}
                  >
                    <Eye className="w-4 h-4" />
                  </a>

                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-500 shadow-sm transition-all"
                    title={isId ? "Edit" : "Edit"}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteItem(item)}
                    className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-100 hover:text-rose-600 transition-colors"
                    title={isId ? "Hapus" : "Delete"}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteItem && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setDeleteItem(null)}
          />
          <div className="relative bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-300 text-center">
            <div className="w-16 h-16 bg-rose-50 rounded-[1.2rem] flex items-center justify-center mx-auto mb-5 border border-rose-100 relative">
              <div className="absolute inset-0 rounded-[1.2rem] border-2 border-rose-200 animate-ping opacity-50 duration-1000" />
              <AlertTriangle className="w-8 h-8 text-rose-500 relative z-10" />
            </div>

            <h3 className="text-xl font-bold text-slate-800 mb-2 tracking-tight">
              {isId ? "Hapus Rulebook Ini?" : "Delete This Rulebook?"}
            </h3>

            <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed px-2">
              {isId
                ? "PDF beserta data unduhan untuk "
                : "The PDF and download data for "}
              <span className="font-bold text-rose-600">
                &quot;{deleteItem.title}&quot;
              </span>
              {isId
                ? " akan dihapus permanen."
                : " will be permanently deleted."}
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteItem(null)}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                {isId ? "Batal" : "Cancel"}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                className="flex-1 py-3 rounded-xl bg-rose-600 text-white text-sm font-bold hover:bg-rose-700 disabled:opacity-80 flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                {deleting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    {isId ? "Ya, Hapus" : "Delete"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LEADS MODAL */}
      {leadRulebook && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setLeadRulebook(null)}
          />
          <div className="relative bg-white w-full max-w-4xl max-h-[90vh] flex flex-col rounded-[2rem] shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-[2rem]">
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  {leadRulebook.title}
                </h3>
                <p className="text-xs font-medium text-slate-500 mt-1">
                  {isId
                    ? "Daftar pengguna yang mengunduh dokumen ini."
                    : "List of users who downloaded this document."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLeadRulebook(null)}
                className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 transition-colors shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6 bg-white">
              {loadingLeads ? (
                <div className="py-20 flex flex-col justify-center items-center gap-4">
                  <div className="w-10 h-10 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Loading data...
                  </span>
                </div>
              ) : leads.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4 border border-slate-100">
                    <Users className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium text-sm">
                    {isId
                      ? "Belum ada yang mengunduh Rulebook ini."
                      : "No downloads yet."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[700px] text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-left">
                        <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                          Nama
                        </th>
                        <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                          Email
                        </th>
                        <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                          Telepon
                        </th>
                        <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                          Instansi
                        </th>
                        <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">
                          Tanggal
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {leads.map((lead) => (
                        <tr
                          key={lead.id}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="py-3.5 px-4 font-bold text-slate-800">
                            {lead.name}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-600">
                            {lead.email}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-600">
                            {lead.phone}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-600">
                            {lead.institution}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-500 text-right">
                            {formatDate(lead.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}