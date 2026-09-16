"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import {
  ImagePlus,
  Plus,
  Trash2,
  Save,
  LayoutTemplate,
  FileText,
  Images,
  Eye,
  Target,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Edit,
  Users,
  Camera,
} from "lucide-react";
import ImageCropModal from "@/components/ImageCropModal";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { extractErrorMessage, getErrorMessage } from "@/lib/error";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const BACKEND_ORIGIN = API_URL.replace(/\/api\/v1\/?$/, "");

const SLUGS = {
  hero: "about-hero",
  body: "about-body",
  vision: "about-vision",
  mission: "about-mission",
  gallery1: "about-gallery-1",
  gallery2: "about-gallery-2",
  gallery3: "about-gallery-3",
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

type TeamMember = {
  id: number;
  name: string;
  role: string;
  role_en?: string | null;
  description?: string | null;
  description_en?: string | null;
  image_url?: string | null;
  order: number;
  is_active: boolean;
};

type ImgSlot = { preview: string | null; file: File | null };
type CropTarget = "hero" | "body" | "g1" | "g2" | "g3" | "team";
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

function parseList(content: string): string[] {
  if (!content) return [""];
  if (isHtml(content)) {
    const items: string[] = [];
    const re = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    let m;
    while ((m = re.exec(content)) !== null) {
      const t = stripHtml(m[1]);
      if (t) items.push(t);
    }
    return items.length ? items : [""];
  }
  const lines = content
    .split("\n")
    .map((l) =>
      l.replace(/^[-•*]\s*/, "").replace(/^\d+[\.\)]\s*/, "").trim()
    )
    .filter(Boolean);
  return lines.length ? lines : [""];
}

function listToHtml(items: string[]) {
  const lis = items
    .map((i) => i.trim())
    .filter(Boolean)
    .map((i) => `<li>${i}</li>`)
    .join("");
  return lis ? `<ul>${lis}</ul>` : "<p>-</p>";
}

export default function AdminAboutPage() {
  const params = useParams();
  const lang = (params?.lang as string) || "en";
  const isId = lang === "id";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [ids, setIds] = useState<Record<IdKey, number | null>>({
    hero: null,
    body: null,
    vision: null,
    mission: null,
    gallery1: null,
    gallery2: null,
    gallery3: null,
  });

  const [heroTitle, setHeroTitle] = useState("");
  const [heroLabel, setHeroLabel] = useState("");
  const [bodyTitle, setBodyTitle] = useState("");
  const [bodyContent, setBodyContent] = useState("");
  const [visionTitle, setVisionTitle] = useState("");
  const [visionContent, setVisionContent] = useState("");
  const [missionTitle, setMissionTitle] = useState("");
  const [missionItems, setMissionItems] = useState<string[]>([""]);

  const [heroTitleEn, setHeroTitleEn] = useState("");
  const [heroLabelEn, setHeroLabelEn] = useState("");
  const [bodyTitleEn, setBodyTitleEn] = useState("");
  const [bodyContentEn, setBodyContentEn] = useState("");
  const [visionTitleEn, setVisionTitleEn] = useState("");
  const [visionContentEn, setVisionContentEn] = useState("");
  const [missionTitleEn, setMissionTitleEn] = useState("");
  const [missionItemsEn, setMissionItemsEn] = useState<string[]>([""]);

  const [heroImg, setHeroImg] = useState<ImgSlot>({ preview: null, file: null });
  const [bodyImg, setBodyImg] = useState<ImgSlot>({ preview: null, file: null });
  const [g1, setG1] = useState<ImgSlot>({ preview: null, file: null });
  const [g2, setG2] = useState<ImgSlot>({ preview: null, file: null });
  const [g3, setG3] = useState<ImgSlot>({ preview: null, file: null });

  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<CropTarget | null>(null);
  const [deletingImg, setDeletingImg] = useState<IdKey | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    key: IdKey;
    onClear: () => void;
  } | null>(null);

  // Team Member States & Refs
  const teamFormRef = useRef<HTMLDivElement>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamName, setTeamName] = useState("");
  const [teamRole, setTeamRole] = useState("");
  const [teamRoleEn, setTeamRoleEn] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [teamDescriptionEn, setTeamDescriptionEn] = useState("");
  const [teamImg, setTeamImg] = useState<ImgSlot>({ preview: null, file: null });
  const [editingTeamId, setEditingTeamId] = useState<number | null>(null);
  const [savingTeam, setSavingTeam] = useState(false);

  // State Delete Team Member Modal
  const [memberToDelete, setMemberToDelete] = useState<number | null>(null);
  const [isDeletingMember, setIsDeletingMember] = useState(false);

  const token = () =>
    typeof window !== "undefined"
      ? localStorage.getItem("access_token") || localStorage.getItem("token")
      : null;

  useEffect(() => {
    if (success || (error && !deleteConfirm && memberToDelete === null)) {
      const timer = setTimeout(() => {
        setSuccess(null);
        if (!deleteConfirm && memberToDelete === null) setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error, deleteConfirm, memberToDelete]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/articles/?lang=id`);
        if (!res.ok) {
          throw new Error(await extractErrorMessage(res, isId ? "Gagal memuat konten" : "Failed to load content", lang));
        }
        const data = await res.json();
        const list: Article[] = Array.isArray(data) ? data : [];
        const about = list.filter((a) => a.category === "about");
        const find = (slug: string) => about.find((a) => a.slug === slug);

        const hero = find(SLUGS.hero);
        const body = find(SLUGS.body);
        const vision = find(SLUGS.vision);
        const mission = find(SLUGS.mission);
        const gallery1 = find(SLUGS.gallery1);
        const gallery2 = find(SLUGS.gallery2);
        const gallery3 = find(SLUGS.gallery3);

        setIds({
          hero: hero?.id ?? null,
          body: body?.id ?? null,
          vision: vision?.id ?? null,
          mission: mission?.id ?? null,
          gallery1: gallery1?.id ?? null,
          gallery2: gallery2?.id ?? null,
          gallery3: gallery3?.id ?? null,
        });

        if (hero) {
          setHeroTitle(hero.title || "");
          setHeroTitleEn(hero.title_en || "");
          setHeroLabel(
            hero.content
              ? isHtml(hero.content)
                ? stripHtml(hero.content)
                : hero.content
              : ""
          );
          setHeroLabelEn(
            hero.content_en
              ? isHtml(hero.content_en)
                ? stripHtml(hero.content_en)
                : hero.content_en
              : ""
          );
          setHeroImg({ preview: resolveImageUrl(hero.image_url), file: null });
        }

        if (body) {
          setBodyTitle(body.title || "");
          setBodyTitleEn(body.title_en || "");
          setBodyContent(body.content || "");
          setBodyContentEn(body.content_en || "");
          setBodyImg({ preview: resolveImageUrl(body.image_url), file: null });
        }

        if (vision) {
          setVisionTitle(vision.title || "");
          setVisionTitleEn(vision.title_en || "");
          setVisionContent(
            vision.content
              ? isHtml(vision.content)
                ? stripHtml(vision.content)
                : vision.content
              : ""
          );
          setVisionContentEn(
            vision.content_en
              ? isHtml(vision.content_en)
                ? stripHtml(vision.content_en)
                : vision.content_en
              : ""
          );
        }

        if (mission) {
          setMissionTitle(mission.title || "");
          setMissionTitleEn(mission.title_en || "");
          setMissionItems(parseList(mission.content || ""));
          setMissionItemsEn(parseList(mission.content_en || ""));
        }

        if (gallery1)
          setG1({ preview: resolveImageUrl(gallery1.image_url), file: null });
        if (gallery2)
          setG2({ preview: resolveImageUrl(gallery2.image_url), file: null });
        if (gallery3)
          setG3({ preview: resolveImageUrl(gallery3.image_url), file: null });

        // Load team
        const teamRes = await fetch(`${API_URL}/team-members/`);
        if (teamRes.ok) {
          const teamData = await teamRes.json();
          setTeamMembers(Array.isArray(teamData) ? teamData : []);
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
      category: "about",
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

  const uploadTeamMemberImage = async (memberId: number, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${API_URL}/team-members/${memberId}/image`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token()}` },
      body: fd,
    });
    if (!res.ok) {
      throw new Error(await extractErrorMessage(res, isId ? "Upload foto tim gagal" : "Team image upload failed", lang));
    }
    return await res.json();
  };

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

  const executeDeleteImage = async () => {
    if (!deleteConfirm) return;
    const { key, onClear } = deleteConfirm;
    const articleId = ids[key];

    setDeletingImg(key);
    setError(null);
    try {
      const t = token();
      if (!t)
        throw new Error(isId ? "Silakan login ulang" : "Please sign in again");

      const res = await fetch(`${API_URL}/articles/${articleId}/image`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${t}` },
      });

      if (!res.ok) {
        throw new Error(await extractErrorMessage(res, isId ? "Gagal menghapus gambar" : "Failed to delete image", lang));
      }

      onClear();
      setSuccess(
        isId ? "Gambar berhasil dihapus!" : "Image successfully deleted!"
      );
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
      const heroSaved = await upsert("hero", {
        title: heroTitle || "About",
        title_en: heroTitleEn,
        content: heroLabel || "",
        content_en: heroLabelEn,
        slug: SLUGS.hero,
      });
      if (heroImg.file) await uploadImage(heroSaved.id, heroImg.file);

      const bodySaved = await upsert("body", {
        title: bodyTitle || "Satubumi",
        title_en: bodyTitleEn,
        content: bodyContent || "",
        content_en: bodyContentEn,
        slug: SLUGS.body,
      });
      if (bodyImg.file) await uploadImage(bodySaved.id, bodyImg.file);

      await upsert("vision", {
        title: visionTitle || (isId ? "Visi" : "Vision"),
        title_en: visionTitleEn || "Vision",
        content: visionContent || "",
        content_en: visionContentEn,
        slug: SLUGS.vision,
      });

      await upsert("mission", {
        title: missionTitle || (isId ? "Misi" : "Mission"),
        title_en: missionTitleEn || "Mission",
        content: listToHtml(missionItems),
        content_en: listToHtml(missionItemsEn),
        slug: SLUGS.mission,
      });

      const g1Saved = await upsert("gallery1", {
        title: "Gallery 1",
        content: "-",
        slug: SLUGS.gallery1,
      });
      if (g1.file) await uploadImage(g1Saved.id, g1.file);

      const g2Saved = await upsert("gallery2", {
        title: "Gallery 2",
        content: "-",
        slug: SLUGS.gallery2,
      });
      if (g2.file) await uploadImage(g2Saved.id, g2.file);

      const g3Saved = await upsert("gallery3", {
        title: "Gallery 3",
        content: "-",
        slug: SLUGS.gallery3,
      });
      if (g3.file) await uploadImage(g3Saved.id, g3.file);

      setHeroImg((p) => ({ ...p, file: null }));
      setBodyImg((p) => ({ ...p, file: null }));
      setG1((p) => ({ ...p, file: null }));
      setG2((p) => ({ ...p, file: null }));
      setG3((p) => ({ ...p, file: null }));

      setSuccess(
        isId
          ? "Semua perubahan berhasil disimpan!"
          : "All changes saved successfully!"
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      setError(getErrorMessage(err, isId ? "Terjadi kesalahan saat menyimpan." : "Error occurred during save."));
    } finally {
      setSaving(false);
    }
  };

  // Team CRUD
  const saveTeamMember = async () => {
    if (!teamName.trim() || !teamRole.trim()) {
      setError(isId ? "Nama dan Role wajib diisi" : "Name and Role are required");
      return;
    }

    setSavingTeam(true);
    setError(null);

    try {
      const body = {
        name: teamName.trim(),
        role: teamRole.trim(),
        role_en: teamRoleEn.trim() || null,
        description: teamDescription.trim() || null,
        description_en: teamDescriptionEn.trim() || null,
        order: editingTeamId
          ? teamMembers.find((m) => m.id === editingTeamId)?.order ??
            teamMembers.length
          : teamMembers.length,
        is_active: true,
      };

      const url = editingTeamId
        ? `${API_URL}/team-members/${editingTeamId}`
        : `${API_URL}/team-members/`;

      const res = await fetch(url, {
        method: editingTeamId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error(await extractErrorMessage(res, isId ? "Gagal menyimpan anggota" : "Failed to save member", lang));
      }

      let data = await res.json();

      if (teamImg.file && data.id) {
        try {
          const updated = await uploadTeamMemberImage(data.id, teamImg.file);
          if (updated?.image_url) {
            data = {
              ...data,
              image_url: updated.image_url,
            };
          }
        } catch (imgErr: unknown) {
          console.error("Team image upload error:", imgErr);
        }
      }

      if (editingTeamId) {
        setTeamMembers((prev) =>
          prev.map((item) => (item.id === data.id ? data : item))
        );
      } else {
        setTeamMembers((prev) => [...prev, data]);
      }

      setTeamName("");
      setTeamRole("");
      setTeamRoleEn("");
      setTeamDescription("");
      setTeamDescriptionEn("");
      setTeamImg({ preview: null, file: null });
      setEditingTeamId(null);
      setSuccess(
        isId ? "Anggota tim berhasil disimpan!" : "Team member saved!"
      );
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setSavingTeam(false);
    }
  };

  const executeDeleteTeamMember = async () => {
    if (memberToDelete === null) return;

    setIsDeletingMember(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/team-members/${memberToDelete}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) {
        throw new Error(await extractErrorMessage(res, isId ? "Gagal menghapus anggota tim" : "Failed to delete team member", lang));
      }
      
      setTeamMembers((prev) => prev.filter((item) => item.id !== memberToDelete));
      setSuccess(isId ? "Anggota tim berhasil dihapus!" : "Team member successfully deleted!");
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsDeletingMember(false);
      setMemberToDelete(null);
    }
  };

  const editTeamMember = (item: TeamMember) => {
    setEditingTeamId(item.id);
    setTeamName(item.name);
    setTeamRole(item.role);
    setTeamRoleEn(item.role_en || "");
    setTeamDescription(item.description || "");
    setTeamDescriptionEn(item.description_en || "");
    setTeamImg({ preview: resolveImageUrl(item.image_url), file: null });
    
    setTimeout(() => {
      teamFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  const openCrop = (
    target: CropTarget,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropTarget(target);
    setCropSrc(URL.createObjectURL(file));
    e.target.value = "";
  };

  const cropAspect =
    cropTarget === "hero" ? 16 / 9 : cropTarget === "team" ? 1 / 1 : 4 / 3;

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
        <label className="flex flex-col items-center justify-center w-full p-8 border-2 border-dashed border-slate-300 rounded-2xl bg-white hover:bg-emerald-50 hover:border-emerald-400 transition-all cursor-pointer group shadow-sm text-center">
          <div className="w-12 h-12 bg-slate-50 rounded-xl shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 group-hover:text-emerald-600 transition-all text-slate-400">
            <ImagePlus className="w-5 h-5" />
          </div>
          <span className="text-[13px] font-bold text-slate-700 mb-1">
            {isId ? "Pilih & Crop Gambar" : "Choose & Crop Image"}
          </span>
          <span className="text-[11px] font-medium text-slate-400">
            {isId
              ? "Format JPG, PNG, WEBP didukung"
              : "JPG, PNG, WEBP formats supported"}
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
    
  // Unified Input Style: White background, visible border, subtle shadow
  const inputCls =
    "w-full px-5 py-4 rounded-2xl border border-slate-300 bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-medium text-slate-900 placeholder:text-slate-400 shadow-sm";

  return (
    <div className="max-w-5xl mx-auto pb-20 font-sans relative">
      {/* GLOBAL POPUP */}
      {((error && !deleteConfirm && memberToDelete === null) || success) && (
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
      )}

      {/* CUSTOM DELETE TEAM MEMBER CONFIRMATION MODAL */}
      {memberToDelete !== null && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden relative animate-in zoom-in-[0.5] fade-in duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
            <div className="p-10 text-center">
              <div className="w-20 h-20 bg-rose-50 rounded-[1.8rem] flex items-center justify-center mx-auto mb-6 border border-rose-100 relative">
                <div className="absolute inset-0 rounded-[1.8rem] border-2 border-rose-200 animate-ping opacity-50 duration-1000" />
                <AlertTriangle className="w-10 h-10 text-rose-500 relative z-10" />
              </div>

              <h3 className="text-2xl font-extrabold text-slate-800 mb-3 tracking-tight">
                {isId ? "Hapus Anggota Tim Ini?" : "Delete This Team Member?"}
              </h3>

              <p className="text-slate-500 text-[14.5px] mb-8 leading-relaxed px-2">
                {isId ? "Apakah Anda yakin ingin menghapus anggota" : "Are you sure you want to delete member"}{" "}
                <span className="font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md inline-block mx-1 truncate max-w-[200px] align-bottom">
                  {teamMembers.find((m) => m.id === memberToDelete)?.name || (isId ? "Anggota" : "Member")}
                </span>
                ?{" "}
                {isId
                  ? "Tindakan ini permanen dan tidak dapat dibatalkan."
                  : "This action is permanent and cannot be undone."}
              </p>

              <div className="flex flex-col-reverse sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setMemberToDelete(null)}
                  disabled={isDeletingMember}
                  className="flex-1 py-4 bg-slate-50 border border-slate-200 text-slate-600 text-[14.5px] font-bold rounded-2xl hover:bg-slate-100 transition-colors disabled:opacity-50 active:scale-95"
                >
                  {isId ? "Batalkan" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={executeDeleteTeamMember}
                  disabled={isDeletingMember}
                  className="flex-1 py-4 bg-rose-600 text-white text-[14.5px] font-bold rounded-2xl hover:bg-rose-700 disabled:opacity-80 flex items-center justify-center gap-2 transition-all duration-300 shadow-md shadow-rose-600/20 active:scale-95"
                >
                  {isDeletingMember ? (
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

      {/* DELETE IMAGE CONFIRM */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden p-10 text-center">
            <div className="w-20 h-20 bg-rose-50 rounded-[1.8rem] flex items-center justify-center mx-auto mb-6 border border-rose-100">
              <AlertTriangle className="w-10 h-10 text-rose-500" />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-800 mb-3">
              {isId ? "Hapus Gambar Ini?" : "Delete This Image?"}
            </h3>
            <p className="text-slate-500 text-[14.5px] mb-8">
              {isId ? "Tindakan ini permanen." : "This action is permanent."}
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirm(null);
                  setError(null);
                }}
                disabled={deletingImg !== null}
                className="flex-1 py-4 bg-slate-50 border border-slate-200 text-slate-600 font-bold rounded-2xl"
              >
                {isId ? "Batalkan" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={executeDeleteImage}
                disabled={deletingImg !== null}
                className="flex-1 py-4 bg-rose-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2"
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
      )}

      {/* TOP BAR */}
      <div className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-4 p-4 md:px-8 md:py-5 mb-10 bg-white/80 backdrop-blur-2xl border-b border-slate-200/60 rounded-b-3xl md:rounded-3xl shadow-[0_10px_30px_-15px_rgba(0,0,0,0.08)]">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-1 flex items-center gap-3">
            <ShieldCheck className="w-7 h-7 text-emerald-500" />
            {isId ? "Kelola Halaman About" : "Manage About Page"}
          </h1>
          <p className="text-slate-500 font-medium text-[13px] hidden md:block">
            {isId
              ? "Konten About + Team Credit"
              : "About content + Team Credit"}
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 disabled:opacity-60"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving
            ? isId
              ? "Menyimpan..."
              : "Saving..."
            : isId
              ? "Simpan Semua"
              : "Save All Changes"}
        </button>
      </div>

      <div className="space-y-8">
        {/* 1. HERO */}
        <section className={box}>
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <LayoutTemplate className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                1. Hero Section
              </h2>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                slug: {SLUGS.hero}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wide">
                Judul Hero (ID)
              </label>
              <input
                className={inputCls}
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wide">
                Hero Title (EN)
              </label>
              <input
                className={inputCls}
                value={heroTitleEn}
                onChange={(e) => setHeroTitleEn(e.target.value)}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wide">
                Subtitle (ID)
              </label>
              <textarea
                rows={2}
                className={`${inputCls} resize-none`}
                value={heroLabel}
                onChange={(e) => setHeroLabel(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wide">
                Subtitle (EN)
              </label>
              <textarea
                rows={2}
                className={`${inputCls} resize-none`}
                value={heroLabelEn}
                onChange={(e) => setHeroLabelEn(e.target.value)}
              />
            </div>
          </div>

          <ImageField
            label={isId ? "Background Hero" : "Hero Background"}
            slot={heroImg}
            target="hero"
            ratio="16/9"
            idKey="hero"
            onClear={() => setHeroImg({ preview: null, file: null })}
          />
        </section>

        {/* 2. BODY */}
        <section className={box}>
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-2">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                2. {isId ? "Narasi Utama" : "Main Body Content"}
              </h2>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                slug: {SLUGS.body}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wide">
                Judul (ID)
              </label>
              <input
                className={inputCls}
                value={bodyTitle}
                onChange={(e) => setBodyTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wide">
                Title (EN)
              </label>
              <input
                className={inputCls}
                value={bodyTitleEn}
                onChange={(e) => setBodyTitleEn(e.target.value)}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wide">
                Konten (ID)
              </label>
              <div className="rounded-2xl overflow-hidden border border-slate-300 shadow-sm bg-white">
                <RichTextEditor value={bodyContent} onChange={setBodyContent} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wide">
                Content (EN)
              </label>
              <div className="rounded-2xl overflow-hidden border border-slate-300 shadow-sm bg-white">
                <RichTextEditor
                  value={bodyContentEn}
                  onChange={setBodyContentEn}
                />
              </div>
            </div>
          </div>

          <ImageField
            label={isId ? "Gambar Samping" : "Side Image"}
            slot={bodyImg}
            target="body"
            ratio="4/3"
            idKey="body"
            onClear={() => setBodyImg({ preview: null, file: null })}
          />
        </section>

        {/* 3. GALLERY */}
        <section className={box}>
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Images className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                3. {isId ? "Galeri Perusahaan" : "Company Gallery"}
              </h2>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            <ImageField
              label="Gallery 1"
              slot={g1}
              target="g1"
              ratio="4/3"
              idKey="gallery1"
              onClear={() => setG1({ preview: null, file: null })}
            />
            <ImageField
              label="Gallery 2"
              slot={g2}
              target="g2"
              ratio="4/3"
              idKey="gallery2"
              onClear={() => setG2({ preview: null, file: null })}
            />
            <ImageField
              label="Gallery 3"
              slot={g3}
              target="g3"
              ratio="4/3"
              idKey="gallery3"
              onClear={() => setG3({ preview: null, file: null })}
            />
          </div>
        </section>

        {/* 4. VISION */}
        <section className={box}>
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">4. Vision</h2>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wide">
                Judul (ID)
              </label>
              <input
                className={inputCls}
                value={visionTitle}
                onChange={(e) => setVisionTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wide">
                Title (EN)
              </label>
              <input
                className={inputCls}
                value={visionTitleEn}
                onChange={(e) => setVisionTitleEn(e.target.value)}
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wide">
                Visi (ID)
              </label>
              <textarea
                rows={4}
                className={`${inputCls} resize-none`}
                value={visionContent}
                onChange={(e) => setVisionContent(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wide">
                Vision (EN)
              </label>
              <textarea
                rows={4}
                className={`${inputCls} resize-none`}
                value={visionContentEn}
                onChange={(e) => setVisionContentEn(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* 5. MISSION */}
        <section className={box}>
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-2">
            <div className="w-10 h-10 rounded-xl bg-fuchsia-50 text-fuchsia-600 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                5. Mission
              </h2>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wide">
                Judul (ID)
              </label>
              <input
                className={inputCls}
                value={missionTitle}
                onChange={(e) => setMissionTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wide">
                Title (EN)
              </label>
              <input
                className={inputCls}
                value={missionTitleEn}
                onChange={(e) => setMissionTitleEn(e.target.value)}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wide">
                Daftar Misi (ID)
              </label>
              {missionItems.map((item, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <input
                    className={inputCls}
                    value={item}
                    onChange={(e) => {
                      const next = [...missionItems];
                      next[index] = e.target.value;
                      setMissionItems(next);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setMissionItems((prev) =>
                        prev.length <= 1
                          ? [""]
                          : prev.filter((_, i) => i !== index)
                      )
                    }
                    className="p-4 rounded-2xl bg-rose-50 text-rose-600 shrink-0 hover:bg-rose-100 shadow-sm"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setMissionItems((p) => [...p, ""])}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-50 text-sm font-bold text-emerald-700 hover:bg-emerald-100"
              >
                <Plus className="w-4 h-4" /> Tambah (ID)
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wide">
                Mission List (EN)
              </label>
              {missionItemsEn.map((item, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <input
                    className={inputCls}
                    value={item}
                    onChange={(e) => {
                      const next = [...missionItemsEn];
                      next[index] = e.target.value;
                      setMissionItemsEn(next);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setMissionItemsEn((prev) =>
                        prev.length <= 1
                          ? [""]
                          : prev.filter((_, i) => i !== index)
                      )
                    }
                    className="p-4 rounded-2xl bg-rose-50 text-rose-600 shrink-0 hover:bg-rose-100 shadow-sm"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setMissionItemsEn((p) => [...p, ""])}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-50 text-sm font-bold text-emerald-700 hover:bg-emerald-100"
              >
                <Plus className="w-4 h-4" /> Add (EN)
              </button>
            </div>
          </div>
        </section>

        {/* 6. TEAM CREDIT */}
        <section className={box}>
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-2">
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                6. Team Credit
              </h2>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                {isId
                  ? "Kelola profil dan foto anggota tim di halaman About"
                  : "Manage team profile cards and photos on About page"}
              </p>
            </div>
          </div>

          <div ref={teamFormRef} className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-6 space-y-5">
            <div className="grid md:grid-cols-12 gap-6 items-start">
              
              {/* UPLOAD FOTO TEAM MEMBER */}
              <div className="md:col-span-4 flex flex-col items-center">
                <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wide mb-3 self-start">
                  {isId ? "Foto Anggota" : "Member Photo"}
                </label>
                
                {teamImg.preview ? (
                  <div className="relative w-40 h-40 rounded-2xl overflow-hidden border-4 border-white shadow-md group">
                    <img
                      src={teamImg.preview}
                      alt="Team Member Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <label className="p-2 bg-white text-slate-700 rounded-xl shadow hover:bg-emerald-50 hover:text-emerald-600 cursor-pointer transition-all">
                        <Camera className="w-4 h-4" />
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) => openCrop("team", e)}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setTeamImg({ preview: null, file: null })}
                        className="p-2 bg-rose-600 text-white rounded-xl shadow hover:bg-rose-700 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed border-slate-300 rounded-2xl bg-white hover:bg-emerald-50 hover:border-emerald-400 transition-all cursor-pointer group shadow-sm text-center p-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 group-hover:text-emerald-600 text-slate-400 transition-all">
                      <Camera className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-700">
                      {isId ? "Pilih & Crop Foto" : "Choose & Crop"}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 mt-1">
                      Ratio 1:1
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => openCrop("team", e)}
                    />
                  </label>
                )}
              </div>

              {/* INPUT FIELDS TEAM */}
              <div className="md:col-span-8 space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    {isId ? "Nama Lengkap" : "Full Name"}
                  </label>
                  <input
                    className={inputCls}
                    placeholder={isId ? "Misal: John Doe" : "e.g. John Doe"}
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      {isId ? "Jabatan / Role (ID)" : "Role / Position (ID)"}
                    </label>
                    <input
                      className={inputCls}
                      placeholder={isId ? "Misal: Direktur Utama" : "e.g. Direktur Utama"}
                      value={teamRole}
                      onChange={(e) => setTeamRole(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      {isId ? "Jabatan / Role (EN)" : "Role / Position (EN)"}
                    </label>
                    <input
                      className={inputCls}
                      placeholder={isId ? "Misal: Managing Director" : "e.g. Managing Director"}
                      value={teamRoleEn}
                      onChange={(e) => setTeamRoleEn(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      {isId ? "Deskripsi (ID)" : "Description (ID)"}
                    </label>
                    <textarea
                      className={`${inputCls} resize-none`}
                      rows={3}
                      placeholder={isId ? "Latar belakang..." : "Background description..."}
                      value={teamDescription}
                      onChange={(e) => setTeamDescription(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      {isId ? "Deskripsi (EN)" : "Description (EN)"}
                    </label>
                    <textarea
                      className={`${inputCls} resize-none`}
                      rows={3}
                      placeholder={isId ? "Background description..." : "Background description..."}
                      value={teamDescriptionEn}
                      onChange={(e) => setTeamDescriptionEn(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/60">
              {editingTeamId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingTeamId(null);
                    setTeamName("");
                    setTeamRole("");
                    setTeamRoleEn("");
                    setTeamDescription("");
                    setTeamDescriptionEn("");
                    setTeamImg({ preview: null, file: null });
                  }}
                  className="px-5 py-3 rounded-xl border border-slate-300 bg-white text-slate-600 font-bold hover:bg-slate-50 transition-colors shadow-sm"
                >
                  {isId ? "Batal" : "Cancel"}
                </button>
              )}

              <button
                type="button"
                onClick={saveTeamMember}
                disabled={savingTeam}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 disabled:opacity-60 transition-all shadow-md shadow-emerald-600/20"
              >
                {savingTeam ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : editingTeamId ? (
                  <Save className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {editingTeamId
                  ? isId
                    ? "Perbarui Anggota"
                    : "Update Member"
                  : isId
                    ? "Simpan Anggota Baru"
                    : "Add Team Member"}
              </button>
            </div>
          </div>

          {/* DAFTAR CARD ANGGOTA TIM */}
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5 mt-6">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="border border-slate-200/80 rounded-2xl p-5 bg-white shadow-sm flex flex-col justify-between hover:border-emerald-200 transition-all"
              >
                <div>
                  <div className="w-full aspect-square rounded-xl overflow-hidden mb-4 bg-slate-100 border border-slate-100">
                    {member.image_url ? (
                      <img
                        src={resolveImageUrl(member.image_url) || ""}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                        <Users className="w-12 h-12 mb-1" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {isId ? "Tanpa Foto" : "No Photo"}
                        </span>
                      </div>
                    )}
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-base leading-snug">
                    {member.name}
                  </h3>
                  <p className="text-xs text-emerald-600 font-bold mt-1">
                    {isId ? member.role : (member.role_en || member.role)}
                  </p>
                  {member.description && (
                    <p className="text-xs text-slate-500 mt-2.5 line-clamp-3 leading-relaxed">
                      {isId ? member.description : (member.description_en || member.description)}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 mt-5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => editTeamMember(member)}
                    className="flex-1 py-2 rounded-xl bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-blue-100 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setMemberToDelete(member.id)}
                    className="flex-1 py-2 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-rose-100 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* BOTTOM SAVE */}
        <div className="flex justify-end pt-6 pb-12">
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-500 disabled:opacity-60 min-w-[200px] shadow-lg shadow-emerald-600/20"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {saving
              ? isId
                ? "Menyimpan..."
                : "Saving..."
              : isId
                ? "Simpan Semua Perubahan"
                : "Save All Changes"}
          </button>
        </div>
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
            if (cropTarget === "body") setBodyImg(slot);
            if (cropTarget === "g1") setG1(slot);
            if (cropTarget === "g2") setG2(slot);
            if (cropTarget === "g3") setG3(slot);
            if (cropTarget === "team") setTeamImg(slot);
            setCropSrc(null);
            setCropTarget(null);
          }}
        />
      )}
    </div>
  );
}