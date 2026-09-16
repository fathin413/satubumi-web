"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ImagePlus,
  Trash2,
  Save,
  LayoutTemplate,
  Info,
  Sparkles,
  Package,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import ImageCropModal from "@/components/ImageCropModal";
import { extractErrorMessage, getErrorMessage } from "@/lib/error";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const BACKEND_ORIGIN = API_URL.replace(/\/api\/v1\/?$/, "");

const SLUGS = {
  hero: "home-hero",
  heroBg2: "home-hero-bg-2",
  heroBg3: "home-hero-bg-3",
  about: "home-card-about",
  services: "home-card-services",
  products: "home-card-products",
} as const;

type Article = {
  id: number;
  category: string;
  title: string;
  title_en?: string | null;
  slug: string;
  content: string;
  content_en?: string | null;
  status: string;
  image_url?: string | null;
};

type ImgSlot = { preview: string | null; file: File | null };
type CropTarget = "hero" | "heroBg2" | "heroBg3" | "about" | "products";
type IdKey = keyof typeof SLUGS;

function resolveImageUrl(url?: string | null) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${BACKEND_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
}

function isHtml(content: string) {
  return /<\/?[a-z][\s\S]*>/i.test(content || "");
}

function stripHtml(html: string) {
  return (html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseHeroContent(raw: string) {
  if (!raw) return { highlight: "", subtitle: "" };
  if (raw.includes("<<<")) {
    const [hl, sub] = raw.split("<<<");
    return { highlight: (hl || "").trim(), subtitle: (sub || "").trim() };
  }
  return {
    highlight: "",
    subtitle: isHtml(raw) ? stripHtml(raw) : raw.trim(),
  };
}

function plain(content?: string | null) {
  if (!content) return "";
  return isHtml(content) ? stripHtml(content) : content.trim();
}

export default function AdminHomePage() {
  const params = useParams();
  const lang = (params?.lang as string) || "en";
  const isId = lang === "id";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deletingImg, setDeletingImg] = useState<IdKey | null>(null);
  
  // State untuk mengontrol pop-up konfirmasi hapus gambar custom
  const [deleteConfirm, setDeleteConfirm] = useState<{ key: IdKey; onClear: () => void } | null>(null);

    const [ids, setIds] = useState<Record<IdKey, number | null>>({
    hero: null,
    heroBg2: null,
    heroBg3: null,
    about: null,
    services: null,
    products: null,
  });

  // ID
  const [heroTitle, setHeroTitle] = useState("");
  const [heroHighlight, setHeroHighlight] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [aboutTitle, setAboutTitle] = useState("");
  const [aboutDesc, setAboutDesc] = useState("");
  const [servicesTitle, setServicesTitle] = useState("");
  const [servicesDesc, setServicesDesc] = useState("");
  const [productsTitle, setProductsTitle] = useState("");
  const [productsDesc, setProductsDesc] = useState("");

  // EN
  const [heroTitleEn, setHeroTitleEn] = useState("");
  const [heroHighlightEn, setHeroHighlightEn] = useState("");
  const [heroSubtitleEn, setHeroSubtitleEn] = useState("");
  const [aboutTitleEn, setAboutTitleEn] = useState("");
  const [aboutDescEn, setAboutDescEn] = useState("");
  const [servicesTitleEn, setServicesTitleEn] = useState("");
  const [servicesDescEn, setServicesDescEn] = useState("");
  const [productsTitleEn, setProductsTitleEn] = useState("");
  const [productsDescEn, setProductsDescEn] = useState("");

  const [heroImg, setHeroImg] = useState<ImgSlot>({ preview: null, file: null });
  const [heroImg2, setHeroImg2] = useState<ImgSlot>({ preview: null, file: null });
  const [heroImg3, setHeroImg3] = useState<ImgSlot>({ preview: null, file: null });
  const [aboutImg, setAboutImg] = useState<ImgSlot>({ preview: null, file: null });
  const [productsImg, setProductsImg] = useState<ImgSlot>({ preview: null, file: null });

  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<CropTarget | null>(null);

  const token = () => localStorage.getItem("access_token");

  // Auto-dismiss popup modal
  useEffect(() => {
    if (success || (error && !deleteConfirm)) {
      const timer = setTimeout(() => {
        setSuccess(null);
        if (!deleteConfirm) setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error, deleteConfirm]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/articles/?lang=id`);
        if (!res.ok) {
          throw new Error(await extractErrorMessage(res, isId ? "Gagal memuat konten" : "Failed to load content", lang));
        }
        const data = await res.json();
        const list: Article[] = Array.isArray(data) ? data : [];
        const find = (slug: string) => list.find((a) => a.slug === slug);

        const hero = find(SLUGS.hero);
        const about = find(SLUGS.about);
        const services = find(SLUGS.services);
        const products = find(SLUGS.products);
        const heroBg2 = find(SLUGS.heroBg2);
        const heroBg3 = find(SLUGS.heroBg3);

        setIds({
          hero: hero?.id ?? null,
          about: about?.id ?? null,
          services: services?.id ?? null,
          products: products?.id ?? null,
          heroBg2: heroBg2?.id ?? null,
          heroBg3: heroBg3?.id ?? null,
        });

        if (hero) {
          setHeroTitle(hero.title || "");
          setHeroTitleEn(hero.title_en || "");
          const parsed = parseHeroContent(hero.content || "");
          setHeroHighlight(parsed.highlight);
          setHeroSubtitle(parsed.subtitle);
          const parsedEn = parseHeroContent(hero.content_en || "");
          setHeroHighlightEn(parsedEn.highlight);
          setHeroSubtitleEn(parsedEn.subtitle);
          setHeroImg({ preview: resolveImageUrl(hero.image_url), file: null });
        }
        if (heroBg2) {
          setHeroImg2({ preview: resolveImageUrl(heroBg2.image_url), file: null });
        }
        if (heroBg3) {
          setHeroImg3({ preview: resolveImageUrl(heroBg3.image_url), file: null });
        }
        if (about) {
          setAboutTitle(about.title || "");
          setAboutTitleEn(about.title_en || "");
          setAboutDesc(plain(about.content));
          setAboutDescEn(plain(about.content_en));
          setAboutImg({ preview: resolveImageUrl(about.image_url), file: null });
        }
        if (services) {
          setServicesTitle(services.title || "");
          setServicesTitleEn(services.title_en || "");
          setServicesDesc(plain(services.content));
          setServicesDescEn(plain(services.content_en));
        }
        if (products) {
          setProductsTitle(products.title || "");
          setProductsTitleEn(products.title_en || "");
          setProductsDesc(plain(products.content));
          setProductsDescEn(plain(products.content_en));
          setProductsImg({ preview: resolveImageUrl(products.image_url), file: null });
        }
      } catch (err: unknown) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const upsert = async (
    key: IdKey,
    payload: {
      title: string;
      title_en?: string;
      content: string;
      content_en?: string;
      slug: string;
    }
  ) => {
    const t = token();
    const existingId = ids[key];
    const body = {
      category: "home",
      title: payload.title,
      title_en: payload.title_en || null,
      slug: payload.slug,
      content: payload.content || "-",
      content_en: payload.content_en || null,
      status: "published",
      author: "Satubumi Team",
    };

    if (existingId) {
      const res = await fetch(`${API_URL}/articles/${existingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${t}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        throw new Error(await extractErrorMessage(res, `Gagal update ${key}`, lang));
      }
      return (await res.json()) as Article;
    }

    const res = await fetch(`${API_URL}/articles/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${t}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(await extractErrorMessage(res, `Gagal buat ${key}`, lang));
    }
    const saved = (await res.json()) as Article;
    setIds((prev) => ({ ...prev, [key]: saved.id }));
    return saved;
  };

  const uploadImage = async (articleId: number, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${API_URL}/articles/${articleId}/image`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token()}` },
      body: fd,
    });
    if (!res.ok) {
      throw new Error(await extractErrorMessage(res, isId ? "Upload gambar gagal" : "Image upload failed", lang));
    }
  };

  // Memicu pop-up kustom (bukan alert bawaan browser)
  const promptDeleteImage = (key: IdKey, slot: ImgSlot, onClear: () => void) => {
    // Jika gambar baru yang belum disimpan ke server (hanya ada di lokal),
    // langsung hapus preview tanpa perlu konfirmasi atau panggil API server.
    if (slot.file) {
      onClear();
      return;
    }

    const articleId = ids[key];
    if (!articleId) {
      onClear();
      return;
    }
    setDeleteConfirm({ key, onClear });
    setError(null);
  };

  // Menjalankan proses hapus dari server
  const executeDeleteImage = async () => {
    if (!deleteConfirm) return;
    const { key, onClear } = deleteConfirm;
    const articleId = ids[key];

    setDeletingImg(key);
    setError(null);
    try {
      const t = token();
      if (!t) throw new Error(isId ? "Silakan login ulang" : "Please sign in again");

      const res = await fetch(`${API_URL}/articles/${articleId}/image`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${t}` },
      });

      if (!res.ok) {
        throw new Error(await extractErrorMessage(res, isId ? "Gagal menghapus gambar" : "Failed to delete image", lang));
      }

      onClear();
      setSuccess(isId ? "Gambar berhasil dihapus!" : "Image successfully deleted!");
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setDeletingImg(null);
      setDeleteConfirm(null);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const heroContent = `${heroHighlight || ""}\n<<<\n${heroSubtitle || ""}`;
      const heroContentEn = `${heroHighlightEn || ""}\n<<<\n${heroSubtitleEn || ""}`;

      const heroSaved = await upsert("hero", {
        title: heroTitle || "Home Hero",
        title_en: heroTitleEn,
        content: heroContent,
        content_en: heroContentEn,
        slug: SLUGS.hero,
      });
      if (heroImg.file) await uploadImage(heroSaved.id, heroImg.file);

            const bg2Saved = await upsert("heroBg2", {
        title: "Hero background 2",
        title_en: "Hero background 2",
        content: "-",
        content_en: "-",
        slug: SLUGS.heroBg2,
      });
      if (heroImg2.file) await uploadImage(bg2Saved.id, heroImg2.file);

      const bg3Saved = await upsert("heroBg3", {
        title: "Hero background 3",
        title_en: "Hero background 3",
        content: "-",
        content_en: "-",
        slug: SLUGS.heroBg3,
      });
      if (heroImg3.file) await uploadImage(bg3Saved.id, heroImg3.file);

      const aboutSaved = await upsert("about", {
        title: aboutTitle || "About",
        title_en: aboutTitleEn,
        content: aboutDesc || "-",
        content_en: aboutDescEn,
        slug: SLUGS.about,
      });
      if (aboutImg.file) await uploadImage(aboutSaved.id, aboutImg.file);

      await upsert("services", {
        title: servicesTitle || "Services",
        title_en: servicesTitleEn,
        content: servicesDesc || "-",
        content_en: servicesDescEn,
        slug: SLUGS.services,
      });

      const productsSaved = await upsert("products", {
        title: productsTitle || "Products",
        title_en: productsTitleEn,
        content: productsDesc || "-",
        content_en: productsDescEn,
        slug: SLUGS.products,
      });
      if (productsImg.file) await uploadImage(productsSaved.id, productsImg.file);

      setHeroImg((p) => ({ ...p, file: null }));
      setHeroImg2((p) => ({ ...p, file: null }));
      setHeroImg3((p) => ({ ...p, file: null }));
      setAboutImg((p) => ({ ...p, file: null }));
      setProductsImg((p) => ({ ...p, file: null }));

      setSuccess(isId ? "Semua perubahan berhasil disimpan!" : "All changes saved successfully!");
    } catch (err: unknown) {
      setError(getErrorMessage(err, isId ? "Terjadi kesalahan saat menyimpan." : "An error occurred while saving."));
    } finally {
      setSaving(false);
    }
  };

  const openCrop = (target: CropTarget, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropTarget(target);
    setCropSrc(URL.createObjectURL(file));
    e.target.value = "";
  };

    const cropAspect =
    cropTarget === "about" ? 4 / 3 : 16 / 9;

  const ImageField = ({
    label,
    slot,
    target,
    ratio,
    idKey,
    onClear,
  }: {
    label: string;
    slot: ImgSlot;
    target: CropTarget;
    ratio: "16/9" | "4/3";
    idKey: IdKey;
    onClear: () => void;
  }) => (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <label className="block text-[13px] font-bold text-slate-700 uppercase tracking-wide">
          {label}
        </label>
        <span className="text-[11px] font-bold px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full">
          Ratio: {ratio}
        </span>
      </div>

      {slot.preview ? (
        <div
          className={`relative w-full rounded-2xl overflow-hidden border-4 border-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] group ${
            ratio === "4/3" ? "aspect-[4/3]" : "aspect-video"
          }`}
        >
          <img
            src={slot.preview}
            alt="Preview"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-colors duration-300 flex items-start justify-end p-4 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              disabled={deletingImg === idKey}
              onClick={() => promptDeleteImage(idKey, slot, onClear)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600/90 backdrop-blur-md text-white text-sm font-bold rounded-xl hover:bg-rose-600 hover:scale-105 transition-all shadow-lg disabled:opacity-60"
            >
              <Trash2 className="w-4 h-4" />
              {deletingImg === idKey
                ? isId
                  ? "Menghapus..."
                  : "Removing..."
                : isId
                ? "Hapus Gambar"
                : "Remove Image"}
            </button>
          </div>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 transition-all cursor-pointer group">
          <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:text-emerald-600 transition-all text-slate-400">
            <ImagePlus className="w-5 h-5" />
          </div>
          <span className="text-[13px] font-bold text-slate-700 mb-1">
            {isId ? "Pilih & Crop Gambar" : "Choose & Crop Image"}
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => openCrop(target, e)}
          />
        </label>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">
          {isId ? "Memuat Konten..." : "Loading Content..."}
        </p>
      </div>
    );
  }

  const box =
    "bg-white border border-slate-200/60 rounded-[2rem] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-6 relative overflow-hidden";
  const inputCls = 
    "w-full px-5 py-4 rounded-2xl border border-slate-300 bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-medium text-slate-900 placeholder:text-slate-400 shadow-sm";

  return (
    <div className="max-w-5xl mx-auto pb-20 font-sans relative">
      
      {/* GLOBAL POPUP MODAL NOTIFICATION (Success / General Error) */}
      {(error && !deleteConfirm) || success ? (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden p-8 text-center relative animate-in zoom-in-[0.5] fade-in duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
            {error ? (
              <>
                <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-100 relative">
                  <div className="absolute inset-0 rounded-full border-2 border-rose-200 animate-ping opacity-50 duration-1000" />
                  <AlertTriangle className="w-10 h-10 text-rose-500 relative z-10" />
                </div>
                <h3 className="text-2xl font-extrabold text-slate-800 mb-2 tracking-tight">
                  {isId ? "Terjadi Kesalahan" : "Action Failed"}
                </h3>
                <p className="text-[14px] text-slate-500 font-medium mb-8 leading-relaxed px-2">
                  {error}
                </p>
                <button
                  onClick={() => setError(null)}
                  className="w-full py-4 bg-rose-50 border border-rose-100 text-rose-600 font-bold rounded-2xl hover:bg-rose-100 hover:text-rose-700 transition-all duration-300 active:scale-95"
                >
                  {isId ? "Tutup Modal" : "Close"}
                </button>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100 relative">
                  <div className="absolute inset-0 rounded-full border-2 border-emerald-200 animate-ping opacity-50 duration-1000" />
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 relative z-10" />
                </div>
                <h3 className="text-2xl font-extrabold text-slate-800 mb-2 tracking-tight">
                  {isId ? "Berhasil!" : "Success!"}
                </h3>
                <p className="text-[14px] text-slate-500 font-medium mb-8 leading-relaxed px-2">
                  {success}
                </p>
                <button
                  onClick={() => setSuccess(null)}
                  className="w-full py-4 bg-emerald-700 text-white font-bold rounded-2xl hover:bg-emerald-800 transition-all duration-300 shadow-md shadow-emerald-950/20 active:scale-95"
                >
                  {isId ? "Tutup Modal" : "Close"}
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}

      {/* CONFIRMATION POPUP MODAL FOR DELETING IMAGE */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden relative animate-in zoom-in-[0.5] fade-in duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
            <div className="p-10 text-center">
              <div className="w-20 h-20 bg-rose-50 rounded-[1.8rem] flex items-center justify-center mx-auto mb-6 border border-rose-100 relative">
                <div className="absolute inset-0 rounded-[1.8rem] border-2 border-rose-200 animate-ping opacity-50 duration-1000" />
                <AlertTriangle className="w-10 h-10 text-rose-500 relative z-10" />
              </div>

              <h3 className="text-2xl font-extrabold text-slate-800 mb-3 tracking-tight">
                {isId ? "Hapus Gambar Ini?" : "Delete This Image?"}
              </h3>

              <p className="text-slate-500 text-[14.5px] mb-8 leading-relaxed px-2">
                {isId
                  ? "Apakah Anda yakin ingin menghapus gambar ini dari server? Tindakan ini permanen."
                  : "Are you sure you want to delete this image from the server? This action is permanent."}
              </p>

              {error && (
                <p className="text-[13px] text-rose-700 font-bold mb-6 bg-rose-50 p-4 rounded-xl border border-rose-200">
                  {error}
                </p>
              )}

              <div className="flex flex-col-reverse sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setDeleteConfirm(null);
                    setError(null);
                  }}
                  disabled={deletingImg !== null}
                  className="flex-1 py-4 bg-slate-50 border border-slate-200 text-slate-600 text-[14.5px] font-bold rounded-2xl hover:bg-slate-100 transition-colors disabled:opacity-50 active:scale-95"
                >
                  {isId ? "Batalkan" : "Cancel"}
                </button>
                <button
                  onClick={executeDeleteImage}
                  disabled={deletingImg !== null}
                  className="flex-1 py-4 bg-rose-600 text-white text-[14.5px] font-bold rounded-2xl hover:bg-rose-700 disabled:opacity-80 flex items-center justify-center gap-2 transition-all duration-300 shadow-md shadow-rose-600/20 active:scale-95"
                >
                  {deletingImg !== null ? (
                    <div className="w-5 h-5 border-2 border-rose-200 border-t-white rounded-full animate-spin" />
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
        </div>
      )}

      {/* STICKY TOP BAR */}
      <div className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-4 p-4 md:px-8 md:py-5 mb-10 bg-white/80 backdrop-blur-2xl border-b border-slate-200/60 rounded-b-3xl md:rounded-3xl shadow-[0_10px_30px_-15px_rgba(0,0,0,0.08)] mx-[-1rem] md:mx-0 translate-y-[-1rem] md:translate-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-1 flex items-center gap-3">
            <ShieldCheck className="w-7 h-7 text-emerald-500" />
            {isId ? "Kelola Beranda" : "Manage Home Page"}
          </h1>
          <p className="text-slate-500 font-medium text-[13px] hidden md:block">
            {isId
              ? "Isi versi Indonesia (ID) dan English (EN) untuk hero & kartu bento."
              : "Fill Indonesian (ID) and English (EN) for hero & bento cards."}
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 disabled:opacity-60 transition-all duration-300 active:scale-95"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">
            {saving ? (isId ? "Menyimpan..." : "Saving...") : isId ? "Simpan Semua" : "Save All Changes"}
          </span>
        </button>
      </div>

      <div className="space-y-8">
        {/* HERO */}
        <section className={box}>
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <LayoutTemplate className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">1. Hero Section</h2>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                slug: {SLUGS.hero}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wide">
                Judul Utama (ID)
              </label>
              <input className={inputCls} value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wide">
                Main Title (EN)
              </label>
              <input className={inputCls} value={heroTitleEn} onChange={(e) => setHeroTitleEn(e.target.value)} />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-[12px] font-bold text-emerald-700 uppercase tracking-wide">
                Highlight (ID)
              </label>
              <input
                className={`${inputCls} border-emerald-100 bg-emerald-50/30`}
                value={heroHighlight}
                onChange={(e) => setHeroHighlight(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[12px] font-bold text-emerald-700 uppercase tracking-wide">
                Highlight (EN)
              </label>
              <input
                className={`${inputCls} border-emerald-100 bg-emerald-50/30`}
                value={heroHighlightEn}
                onChange={(e) => setHeroHighlightEn(e.target.value)}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wide">
                Subtitle (ID)
              </label>
              <textarea
                rows={3}
                className={`${inputCls} resize-none`}
                value={heroSubtitle}
                onChange={(e) => setHeroSubtitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wide">
                Subtitle (EN)
              </label>
              <textarea
                rows={3}
                className={`${inputCls} resize-none`}
                value={heroSubtitleEn}
                onChange={(e) => setHeroSubtitleEn(e.target.value)}
              />
            </div>
          </div>

          <ImageField
            label={isId ? "Latar Belakang Hero" : "Hero Background"}
            slot={heroImg}
            target="hero"
            ratio="16/9"
            idKey="hero"
            onClear={() => setHeroImg({ preview: null, file: null })}
          />
                    <ImageField
            label={isId ? "Latar Hero 2 (opsional)" : "Hero background 2 (optional)"}
            slot={heroImg2}
            target="heroBg2"
            ratio="16/9"
            idKey="heroBg2"
            onClear={() => setHeroImg2({ preview: null, file: null })}
          />

          <ImageField
            label={isId ? "Latar Hero 3 (opsional)" : "Hero background 3 (optional)"}
            slot={heroImg3}
            target="heroBg3"
            ratio="16/9"
            idKey="heroBg3"
            onClear={() => setHeroImg3({ preview: null, file: null })}
          />
        </section>

        {/* ABOUT CARD */}
        <section className={box}>
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-2">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">2. Card: About</h2>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wide">Judul (ID)</label>
              <input className={inputCls} value={aboutTitle} onChange={(e) => setAboutTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wide">Title (EN)</label>
              <input className={inputCls} value={aboutTitleEn} onChange={(e) => setAboutTitleEn(e.target.value)} />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wide">Deskripsi (ID)</label>
              <textarea rows={4} className={`${inputCls} resize-none`} value={aboutDesc} onChange={(e) => setAboutDesc(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wide">Description (EN)</label>
              <textarea rows={4} className={`${inputCls} resize-none`} value={aboutDescEn} onChange={(e) => setAboutDescEn(e.target.value)} />
            </div>
          </div>
          <ImageField
            label="Hover Image"
            slot={aboutImg}
            target="about"
            ratio="4/3"
            idKey="about"
            onClear={() => setAboutImg({ preview: null, file: null })}
          />
        </section>

        {/* SERVICES CARD */}
        <section className={box}>
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">3. Card: Services</h2>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wide">Judul (ID)</label>
              <input className={inputCls} value={servicesTitle} onChange={(e) => setServicesTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wide">Title (EN)</label>
              <input className={inputCls} value={servicesTitleEn} onChange={(e) => setServicesTitleEn(e.target.value)} />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wide">Deskripsi (ID)</label>
              <textarea rows={4} className={`${inputCls} resize-none`} value={servicesDesc} onChange={(e) => setServicesDesc(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wide">Description (EN)</label>
              <textarea rows={4} className={`${inputCls} resize-none`} value={servicesDescEn} onChange={(e) => setServicesDescEn(e.target.value)} />
            </div>
          </div>
        </section>

        {/* PRODUCTS CARD */}
        <section className={box}>
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">4. Card: Products</h2>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wide">Judul (ID)</label>
              <input className={inputCls} value={productsTitle} onChange={(e) => setProductsTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wide">Title (EN)</label>
              <input className={inputCls} value={productsTitleEn} onChange={(e) => setProductsTitleEn(e.target.value)} />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wide">Deskripsi (ID)</label>
              <textarea rows={4} className={`${inputCls} resize-none`} value={productsDesc} onChange={(e) => setProductsDesc(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wide">Description (EN)</label>
              <textarea rows={4} className={`${inputCls} resize-none`} value={productsDescEn} onChange={(e) => setProductsDescEn(e.target.value)} />
            </div>
          </div>
          <ImageField
            label={isId ? "Gambar Produk" : "Product Image"}
            slot={productsImg}
            target="products"
            ratio="16/9"
            idKey="products"
            onClear={() => setProductsImg({ preview: null, file: null })}
          />
        </section>
      </div>

      {/* BOTTOM ACTION BAR */}
      <div className="mt-10 pt-8 border-t border-slate-200/60 flex justify-end pb-12">
        <button
          type="button"
          onClick={handleSaveAll}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-500 hover:shadow-xl hover:shadow-emerald-600/20 hover:-translate-y-1 active:scale-95 transition-all duration-300 disabled:opacity-60 text-[15px] w-full sm:w-auto min-w-[240px]"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {saving 
            ? (isId ? "Menyimpan ke Server..." : "Saving to Server...") 
            : (isId ? "Simpan Semua Perubahan" : "Save All Changes")}
        </button>
      </div>

      {cropSrc && cropTarget && (
        <ImageCropModal
          imageSrc={cropSrc}
          aspect={cropAspect}
          onCancel={() => {
            setCropSrc(null);
            setCropTarget(null);
          }}
          onComplete={(file) => {
            const preview = URL.createObjectURL(file);
            const slot = { preview, file };
            if (cropTarget === "hero") setHeroImg(slot);
            if (cropTarget === "heroBg2") setHeroImg2(slot);
            if (cropTarget === "heroBg3") setHeroImg3(slot);
            if (cropTarget === "about") setAboutImg(slot);
            if (cropTarget === "products") setProductsImg(slot);
            setCropSrc(null);
            setCropTarget(null);
          }}
        />
      )}
    </div>
  );
}