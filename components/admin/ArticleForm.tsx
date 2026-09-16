"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ImagePlus } from "lucide-react";
import ImageCropModal from "../ImageCropModal";
import RichTextEditor from "./RichTextEditor";
import { extractErrorMessage, getErrorMessage } from "@/lib/error";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const BACKEND_ORIGIN = API_URL.replace(/\/api\/v1\/?$/, "");

type Article = {
  id?: number;
  category?: string;
  title?: string;
  slug?: string;
  author?: string;
  content?: string;
  status?: string;
  tags?: string;
  image_url?: string | null;
};

type Props = {
  mode: "create" | "edit";
  articleId?: number;
  initial?: Article;
};

function resolveImageUrl(url?: string | null) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${BACKEND_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
}

export default function ArticleForm({ mode, articleId, initial }: Props) {
  const params = useParams();
  const router = useRouter();
  const lang = (params?.lang as string) || "en";
  const isId = lang === "id";

  const [form, setForm] = useState({
    category: initial?.category || "services",
    title: initial?.title || "",
    slug: initial?.slug || "",
    author: initial?.author || "Satubumi Team",
    content: initial?.content || "",
    status: initial?.status || "published",
    tags: initial?.tags || "",
  });

  const [imagePreview, setImagePreview] = useState<string | null>(
    resolveImageUrl(initial?.image_url)
  );
  const [croppedFile, setCroppedFile] = useState<File | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const token = () => localStorage.getItem("access_token");

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropSrc(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleDeleteImage = async () => {
    if (mode !== "edit" || !articleId) {
      setImagePreview(null);
      setCroppedFile(null);
      return;
    }
    if (!confirm(isId ? "Hapus gambar?" : "Delete image?")) return;
    try {
      const res = await fetch(`${API_URL}/articles/${articleId}/image`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error("Failed");
      setImagePreview(null);
      setCroppedFile(null);
      setSuccess(isId ? "Gambar dihapus" : "Image deleted");
    } catch {
      setError(isId ? "Gagal menghapus gambar" : "Failed to delete image");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const t = token();
      const body = {
        category: form.category,
        title: form.title,
        slug: form.slug || undefined,
        author: form.author,
        content: form.content,
        status: form.status,
        tags: form.tags || undefined,
      };

      let res: Response;
      if (mode === "edit" && articleId) {
        res = await fetch(`${API_URL}/articles/${articleId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${t}`,
          },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch(`${API_URL}/articles/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${t}`,
          },
          body: JSON.stringify(body),
        });
      }

      if (!res.ok) {
        throw new Error(
          await extractErrorMessage(res, isId ? "Gagal menyimpan" : "Failed to save", lang)
        );
      }

      const saved = await res.json();
      const id = saved.id || articleId;

      if (croppedFile && id) {
        setImageUploading(true);
        const fd = new FormData();
        fd.append("file", croppedFile);
        const imgRes = await fetch(`${API_URL}/articles/${id}/image`, {
          method: "POST",
          headers: { Authorization: `Bearer ${t}` },
          body: fd,
        });
        if (!imgRes.ok) {
          throw new Error(
            await extractErrorMessage(
              imgRes,
              isId
                ? "Artikel tersimpan, upload gambar gagal"
                : "Saved, but image upload failed",
              lang
            )
          );
        }
      }

      setSuccess(isId ? "Berhasil disimpan" : "Saved successfully");
      setTimeout(() => {
        router.push(`/${lang}/admin/articles`);
      }, 600);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
      setImageUploading(false);
    }
  };

  return (
    <>
      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm font-medium">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium">
          {success}
        </div>
      )}

      <form
        onSubmit={handleSave}
        className="bg-white border border-emerald-100 rounded-2xl p-6 md:p-8 shadow-sm space-y-5"
      >
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-bold text-emerald-900 mb-2">Category</label>
            <select
              className="w-full px-4 py-3 rounded-xl border border-emerald-100 bg-emerald-50/50 outline-none focus:border-emerald-400 font-medium"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="about">About</option>
              <option value="services">Services</option>
              <option value="general">General</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-emerald-900 mb-2">Status</label>
            <select
              className="w-full px-4 py-3 rounded-xl border border-emerald-100 bg-emerald-50/50 outline-none focus:border-emerald-400 font-medium"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-emerald-900 mb-2">Title</label>
          <input
            required
            className="w-full px-4 py-3 rounded-xl border border-emerald-100 bg-emerald-50/50 outline-none focus:border-emerald-400 font-medium"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-bold text-emerald-900 mb-2">Slug (optional)</label>
            <input
              className="w-full px-4 py-3 rounded-xl border border-emerald-100 bg-emerald-50/50 outline-none focus:border-emerald-400 font-medium"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-emerald-900 mb-2">Author</label>
            <input
              className="w-full px-4 py-3 rounded-xl border border-emerald-100 bg-emerald-50/50 outline-none focus:border-emerald-400 font-medium"
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-emerald-900 mb-2">Tags</label>
          <input
            className="w-full px-4 py-3 rounded-xl border border-emerald-100 bg-emerald-50/50 outline-none focus:border-emerald-400 font-medium"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="carbon, climate, esg"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-emerald-900 mb-2">
            {isId ? "Gambar" : "Image"}{" "}
            <span className="font-medium text-emerald-900/40">(crop 16:9)</span>
          </label>

          {imagePreview && (
            <div className="mb-3 relative w-full max-w-md aspect-video rounded-xl overflow-hidden border border-emerald-100">
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={handleDeleteImage}
                className="absolute top-2 right-2 px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700"
              >
                {isId ? "Hapus" : "Remove"}
              </button>
            </div>
          )}

          <label className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 text-emerald-800 font-bold text-sm cursor-pointer hover:bg-emerald-50">
            <ImagePlus className="w-4 h-4" />
            {isId ? "Pilih & crop gambar" : "Choose & crop image"}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={onFileChange}
            />
          </label>
        </div>

        <div>
  <label className="block text-sm font-bold text-emerald-900 mb-2">Content</label>
  <RichTextEditor
    value={form.content}
    onChange={(html) => setForm({ ...form, content: html })}
    placeholder={
      isId
        ? "Tulis deskripsi... Gunakan toolbar untuk tebal, underline, list."
        : "Write description... Use toolbar for bold, underline, lists."
    }
  />
  <p className="text-xs text-emerald-900/40 mt-2 font-medium">
    {isId
      ? "List di editor akan tampil sebagai scope di halaman Services."
      : "Lists in the editor become scope items on the Services page."}
  </p>
</div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving || imageUploading}
            className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving || imageUploading ? "..." : isId ? "Simpan" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/${lang}/admin/articles`)}
            className="px-6 py-3 border border-emerald-100 text-emerald-800 font-bold rounded-xl hover:bg-emerald-50"
          >
            {isId ? "Batal" : "Cancel"}
          </button>
        </div>
      </form>

      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          aspect={16 / 9}
          onCancel={() => setCropSrc(null)}
          onComplete={(file) => {
            setCroppedFile(file);
            setImagePreview(URL.createObjectURL(file));
            setCropSrc(null);
          }}
        />
      )}
    </>
  );
}