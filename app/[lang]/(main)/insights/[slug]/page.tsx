"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Eye, Clock, ArrowUpRight, Tag, User as UserIcon } from "lucide-react";
import ScrollReveal from "../../../../../components/ScrollReveal";
import { parseBlocks } from "@/components/admin/ContentBlocksEditor";
import { sanitizeHtml } from "@/lib/sanitize";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const BACKEND_ORIGIN = API_URL.replace(/\/api\/v1\/?$/, "");

type Article = {
  id: number;
  title: string;
  slug: string;
  content: string;
  status: string;
  image_url?: string | null;
  created_at?: string;
  author?: string | null;
  author_profile_image?: string | null;
  topic?: string | null;
  view_count?: number;
};

const TOPIC_LABELS: Record<string, { id: string; en: string }> = {
  carbon: { id: "Karbon", en: "Carbon" },
  esg: { id: "ESG", en: "ESG" },
  policy: { id: "Kebijakan", en: "Policy" },
  nature: { id: "Alam & Bentang", en: "Nature & Landscape" },
  other: { id: "Lainnya", en: "Other" },
};

function topicLabel(topic: string | null | undefined, isId: boolean) {
  if (!topic) return isId ? "Artikel" : "Article";
  const t = TOPIC_LABELS[topic];
  return t ? (isId ? t.id : t.en) : topic;
}

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

function excerptFromContent(content: string, max = 120) {
  const blocks = parseBlocks(content);
  const plain = blocks
    .map((b) => (b.type === "text" ? stripHtml(b.htmlId || b.htmlEn || "") : ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  if (!plain) return "";
  if (plain.length <= max) return plain;
  return plain.slice(0, max).trim() + "…";
}

function formatDate(iso?: string, lang?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(lang === "id" ? "id-ID" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function RelatedCard({ item, lang, isId }: { item: Article; lang: string; isId: boolean }) {
  const img = resolveImageUrl(item.image_url) || "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80";
  return (
    <Link
      href={`/${lang}/insights/${item.slug}`}
      className="group flex flex-col h-full bg-white rounded-2xl border border-slate-200/80 overflow-hidden transition-all duration-300 hover:border-emerald-300 hover:shadow-xl hover:-translate-y-1"
    >
      <div className="aspect-[16/10] overflow-hidden relative bg-slate-100">
        <img
          src={img}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
        <span className="absolute top-4 left-4 inline-flex items-center px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-sm text-emerald-800 text-[10px] font-extrabold uppercase tracking-widest shadow-sm">
          {topicLabel(item.topic, isId)}
        </span>
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <h2 className="text-[1.1rem] md:text-[1.2rem] font-extrabold text-slate-900 leading-snug mb-3 group-hover:text-emerald-700 transition-colors line-clamp-2">
          {item.title}
        </h2>
        <p className="text-[13.5px] text-slate-600 font-medium leading-relaxed flex-grow line-clamp-3 mb-4">
          {excerptFromContent(item.content, 100)}
        </p>
        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatDate(item.created_at, lang)}</span>
            </div>
          </div>
          <span className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function AutoFitTitle({
  title,
  maxHeight = 240,
}: {
  title: string;
  maxHeight?: number;
}) {
  const textRef = useRef<HTMLHeadingElement>(null);

  const getBaseSize = (len: number, isXl: boolean) => {
    if (len <= 45) return isXl ? 60 : 54;
    if (len <= 75) return isXl ? 50 : 45;
    if (len <= 110) return isXl ? 42 : 38;
    if (len <= 150) return isXl ? 35 : 31;
    return isXl ? 28 : 24;
  };

  const [fontSize, setFontSize] = useState<number>(() => {
    const len = title?.length || 0;
    return getBaseSize(len, true);
  });

  useEffect(() => {
    const computeFit = () => {
      if (!textRef.current) return;

      if (window.innerWidth < 1024) {
        textRef.current.style.fontSize = "";
        textRef.current.style.lineHeight = "";
        return;
      }

      const isXl = window.innerWidth >= 1280;
      const len = title?.length || 0;
      let size = getBaseSize(len, isXl);
      const minSize = 20;
      const limitHeight = maxHeight > 0 ? maxHeight : 240;

      textRef.current.style.fontSize = `${size}px`;
      textRef.current.style.lineHeight = "1.25";

      let iterations = 0;
      while (size > minSize && textRef.current.scrollHeight > limitHeight && iterations < 80) {
        size -= 0.5;
        textRef.current.style.fontSize = `${size}px`;
        iterations++;
      }

      setFontSize(size);
    };

    computeFit();
    window.addEventListener("resize", computeFit);

    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(computeFit);
    }

    return () => {
      window.removeEventListener("resize", computeFit);
    };
  }, [title, maxHeight]);

  return (
    <h1
      ref={textRef}
      className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-wide leading-[1.22] break-words"
      style={
        typeof window !== "undefined" && window.innerWidth >= 1024
          ? {
              fontSize: `${fontSize}px`,
              lineHeight: 1.22,
            }
          : undefined
      }
    >
      {title}
    </h1>
  );
}

export default function InsightDetailPage() {
  const params = useParams();
  const lang = (params?.lang as string) || "en";
  const slug = (params?.slug as string) || "";
  const isId = lang === "id";

  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [popularArticles, setPopularArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const viewedRef = useRef(false);

  const [maxTitleHeight, setMaxTitleHeight] = useState<number>(240);
  const [titleMarginTop, setTitleMarginTop] = useState<number>(0);
  const coverRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const backBtnRef = useRef<HTMLDivElement>(null);
  const titleContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const measureBounds = () => {
      if (typeof window === "undefined" || window.innerWidth < 1024) return;
      if (coverRef.current && sectionRef.current && backBtnRef.current) {
        const coverRect = coverRef.current.getBoundingClientRect();
        const sectionRect = sectionRef.current.getBoundingClientRect();
        const backBtnRect = backBtnRef.current.getBoundingClientRect();

        const topBoundY = coverRect.top;
        
        // Margin aman diperkecil sedikit agar sesuai dengan padding bawah yang baru
        const bottomBoundY = sectionRect.bottom - 60;
        
        const totalAllowedHeight = Math.max(100, Math.floor(bottomBoundY - topBoundY));

        // Menurunkan titik mulai ideal dari 0.38 (38%) menjadi 0.45 (45%)
        const preferredStartY = coverRect.top + coverRect.height * 0.45;
        const defaultMt = Math.max(12, Math.floor(preferredStartY - backBtnRect.bottom));
        const heightFromPreferred = Math.max(80, Math.floor(bottomBoundY - preferredStartY));

        let textHeight = 0;
        if (titleContainerRef.current) {
          const h1 = titleContainerRef.current.querySelector("h1");
          if (h1) textHeight = h1.scrollHeight;
        }

        if (textHeight > 0 && textHeight <= heightFromPreferred) {
          setTitleMarginTop(defaultMt);
          setMaxTitleHeight(heightFromPreferred);
        } else if (textHeight > 0 && textHeight <= totalAllowedHeight) {
          const neededStartY = Math.max(topBoundY, bottomBoundY - textHeight);
          const shiftMt = Math.max(12, Math.floor(neededStartY - backBtnRect.bottom));
          setTitleMarginTop(shiftMt);
          setMaxTitleHeight(totalAllowedHeight);
        } else {
          const minMt = Math.max(12, Math.floor(topBoundY - backBtnRect.bottom));
          setTitleMarginTop(minMt);
          setMaxTitleHeight(totalAllowedHeight);
        }
      }
    };

    measureBounds();
    window.addEventListener("resize", measureBounds);
    const t1 = setTimeout(measureBounds, 100);
    const t2 = setTimeout(measureBounds, 300);
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(measureBounds);
    }
    return () => {
      window.removeEventListener("resize", measureBounds);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [article?.title]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      viewedRef.current = false;
      try {
        const apiLang = lang === "en" ? "en" : "id";
        const res = await fetch(
          `${API_URL}/articles/?category=insight&lang=${apiLang}`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error("fail");
        
        const data = await res.json();
        const list: Article[] = Array.isArray(data) ? data : [];

        const cleanSlug = decodeURIComponent(slug || "").trim().toLowerCase();
        const slugifyText = (text?: string | null) =>
          (text || "")
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .trim()
            .replace(/\s+/g, "-");

        let found =
          list.find(
            (a) =>
              a.status === "published" &&
              (a.slug?.toLowerCase() === cleanSlug ||
                String(a.id) === cleanSlug ||
                slugifyText(a.title) === cleanSlug ||
                ((a as any).title_en &&
                  slugifyText((a as any).title_en) === cleanSlug) ||
                (cleanSlug.length >= 10 &&
                  (a.slug?.toLowerCase().startsWith(cleanSlug) ||
                    cleanSlug.startsWith(a.slug?.toLowerCase()))))
          ) || null;

        // Fallback: jika parameter berupa ID numerik
        if (!found && !isNaN(Number(cleanSlug)) && Number(cleanSlug) > 0) {
          try {
            const singleRes = await fetch(`${API_URL}/articles/${cleanSlug}`);
            if (singleRes.ok) {
              const singleData = await singleRes.json();
              if (singleData && singleData.status === "published") {
                found = singleData;
              }
            }
          } catch {
            // Abaikan
          }
        }

        setArticle(found);

        if (found) {
          const publishedList = list.filter((a) => a.status === "published");
          const others = publishedList.filter((a) => a.id !== found?.id && a.slug !== found?.slug);
          
          const sameTopic = others.filter((a) => a.topic === found.topic);
          const diffTopic = others.filter((a) => a.topic !== found.topic);
          setRelatedArticles([...sameTopic, ...diffTopic].slice(0, 3));

          const popular = [...others]
            .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
            .slice(0, 3);
          setPopularArticles(popular);
        }

        if (found?.id && typeof window !== "undefined") {
          const key = `viewed-insight-${found.id}`;
          if (!sessionStorage.getItem(key) && !viewedRef.current) {
            viewedRef.current = true;
            sessionStorage.setItem(key, "1");
            try {
              const viewRes = await fetch(`${API_URL}/articles/${found.id}/view`, { method: "POST" });
              if (viewRes.ok) {
                const updated = await viewRes.json();
                setArticle((prev) =>
                  prev
                    ? {
                        ...prev,
                        view_count: updated.view_count ?? (prev.view_count || 0) + 1,
                      }
                    : prev
                );
              }
            } catch {
              // Abaikan
            }
          }
        }
      } catch {
        setArticle(null);
      } finally {
        setLoading(false);
      }
    };
    if (slug) load();
  }, [lang, slug]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">
            {isId ? "Memuat Artikel..." : "Loading Article..."}
          </p>
        </div>
      </main>
    );
  }

  if (!article) {
    return (
      <main className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-6">
          <span className="text-slate-400 font-bold text-2xl">?</span>
        </div>
        <h2 className="text-2xl font-extrabold text-slate-800 mb-2">
          {isId ? "Tidak Ditemukan" : "Not Found"}
        </h2>
        <p className="text-slate-500 font-medium mb-8">
          {isId
            ? "Artikel yang Anda cari tidak tersedia atau telah dihapus."
            : "The article you are looking for is unavailable or has been deleted."}
        </p>
        <Link
          href={`/${lang}/insights`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-50 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          {isId ? "Kembali ke Artikel" : "Back to Articles"}
        </Link>
      </main>
    );
  }

  const img = resolveImageUrl(article.image_url) || "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80";

  return (
    <main className="bg-[#FAFAFA] min-h-screen pb-28 font-sans selection:bg-emerald-200 selection:text-emerald-950">
      
      {/* ================= HERO SECTION ================= */}
      <section
        ref={sectionRef}
        // Mengurangi padding bottom untuk mengurangi bg hijaunya sedikit
        className="bg-emerald-950 pt-12 pb-4 md:pt-16 md:pb-6 lg:pt-20 lg:pb-8 px-8 md:px-12 lg:px-16 xl:px-20 relative z-10"
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-900/40 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-[1440px] mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 xl:gap-10 lg:items-start">
            
            <div className="flex flex-col min-h-0 lg:pr-2 xl:pr-4">
              <div ref={backBtnRef} className="pt-6 lg:pt-8">
                <Link
                  href={`/${lang}/insights`}
                  className="inline-flex items-center gap-2 text-[12px] md:text-[13px] font-bold text-emerald-400 hover:text-white transition-colors uppercase tracking-widest"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {isId ? "Kembali" : "Back"}
                </Link>
              </div>

              <div
                ref={titleContainerRef}
                className="flex flex-col min-h-0 overflow-hidden py-1"
                style={{
                  marginTop: titleMarginTop > 0 ? `${titleMarginTop}px` : "2.5rem",
                  maxHeight: maxTitleHeight > 0 ? `${maxTitleHeight}px` : undefined,
                }}
              >
                <ScrollReveal className="flex flex-col min-h-0">
                  <AutoFitTitle title={article.title} maxHeight={maxTitleHeight} />
                </ScrollReveal>
              </div>
            </div>

            <div
              ref={coverRef}
              className="w-full translate-y-[20%] lg:-mr-6 xl:-mr-10 shrink-0 flex justify-end items-start relative z-20"
            >
              <ScrollReveal delay="delay-100" className="w-full flex justify-end items-start">
                <div className="w-full max-w-[750px] xl:max-w-[840px] aspect-[16/9] h-auto self-start rounded-[2rem] overflow-hidden shadow-2xl border border-white/15 relative bg-emerald-900/30">
                  <img
                    src={img}
                    alt={article.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/40 to-transparent" />
                </div>
              </ScrollReveal>
            </div>

          </div>
        </div>
      </section>

      {/* ================= BODY CONTENT & SIDEBAR ================= */}
      <section className="max-w-[1440px] mx-auto px-8 md:px-12 lg:px-16 xl:px-20 pt-16 md:pt-20 lg:pt-28 xl:pt-32 pb-16 lg:pb-24 relative z-0">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-start">
          
          <div className="lg:col-span-8">
            <ScrollReveal>
              <div className="w-full space-y-10">
                {parseBlocks(article.content).map((block, idx) => {
                  if (block.type === "image" && block.url) {
                    const caption = block.captionId || block.captionEn || "";
                    return (
                      <figure key={idx} className="my-8">
                        <div className="w-full overflow-hidden rounded-[1.5rem] border border-slate-200/70 bg-slate-50/50 flex justify-center items-center">
                          <img
                            src={resolveImageUrl(block.url) || block.url}
                            alt={caption || article.title}
                            className="max-w-full h-auto rounded-[1.5rem] block"
                          />
                        </div>
                        {caption ? (
                          <figcaption className="mt-3 text-center text-[13px] font-extrabold text-slate-700">
                            {caption}
                          </figcaption>
                        ) : null}
                      </figure>
                    );
                  }

                  if (block.type === "text") {
                    const html = block.htmlId || block.htmlEn || "";
                    if (!html) return null;

                    if (isHtml(html)) {
                      return (
                        <div
                          key={idx}
                          className="max-w-none text-slate-800 font-medium leading-[1.85] text-[17px] md:text-[18px]
                                    [&_p]:text-justify [&_p]:mb-6
                                    [&_h1]:text-3xl [&_h1]:font-extrabold [&_h1]:text-slate-900 [&_h1]:mb-5 [&_h1]:mt-10
                                    [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:text-slate-900 [&_h2]:mb-5 [&_h2]:mt-10
                                    [&_h3]:text-xl [&_h3]:font-extrabold [&_h3]:text-slate-900 [&_h3]:mb-4 [&_h3]:mt-8
                                    [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-6
                                    [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-6
                                    [&_li]:mb-2 [&_li]:pl-1 [&_li]:text-left
                                    [&_strong]:font-bold [&_b]:font-bold
                                    [&_em]:italic [&_i]:italic
                                    [&_a]:text-emerald-600 [&_a]:underline hover:[&_a]:text-emerald-700"
                          dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
                        />
                      );
                    }

                    return (
                      <div
                        key={idx}
                        className="text-[17px] md:text-[18px] text-slate-800 font-medium leading-[1.85] text-justify"
                      >
                        {html.split("\n").map((paragraph, pIdx) =>
                          paragraph.trim() ? (
                            <p key={pIdx} className="mb-6">
                              {paragraph}
                            </p>
                          ) : null,
                        )}
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            </ScrollReveal>
          </div>

          <div className="lg:col-span-4">
            <div className="sticky top-[110px] flex flex-col gap-6 h-fit">
              
              <ScrollReveal delay="delay-200">
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/60 flex flex-col">
                  <h3 className="text-lg font-extrabold text-slate-900 mb-6 border-b border-slate-100 pb-4">
                    {isId ? "Informasi Artikel" : "Article Information"}
                  </h3>

                  <div className="flex flex-col mb-8">
                    <div className="w-full aspect-square rounded-2xl overflow-hidden bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 shadow-sm mb-5">
                      {article.author_profile_image ? (
                        <img
                          src={resolveImageUrl(article.author_profile_image) || ""}
                          alt={article.author || "Author"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <UserIcon className="w-16 h-16 text-emerald-600/30" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        {article.author || "Satubumi Team"}
                      </span>
                      <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-emerald-600 mb-2.5">
                        {isId ? "Penulis" : "Author"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5 text-slate-500">
                        <Clock className="w-4 h-4" />
                        <span className="text-[13px] font-bold">{isId ? "Tanggal Publish" : "Published Date"}</span>
                      </div>
                      <span className="text-[13.5px] font-bold text-slate-900">
                        {formatDate(article.created_at, lang)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5 text-slate-500">
                        <Eye className="w-4 h-4" />
                        <span className="text-[13px] font-bold">{isId ? "Tayangan" : "Views"}</span>
                      </div>
                      <span className="text-[13.5px] font-bold text-slate-900">
                        {article.view_count?.toLocaleString(isId ? "id-ID" : "en-US") || 0}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2.5 text-slate-500">
                        <Tag className="w-4 h-4" />
                        <span className="text-[13px] font-bold">{isId ? "Kategori" : "Category"}</span>
                      </div>
                      <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold uppercase tracking-widest rounded-md">
                        {topicLabel(article.topic, isId)}
                      </span>
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              {popularArticles.length > 0 && (
                <ScrollReveal delay="delay-300">
                  <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/60 flex flex-col">
                    <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                      <h3 className="text-lg font-extrabold text-slate-900">
                        {isId ? "Artikel Populer" : "Popular Insights"}
                      </h3>
                    </div>
                    
                    <div className="flex flex-col gap-5">
                      {popularArticles.map((art) => (
                        <Link
                          key={art.id}
                          href={`/${lang}/insights/${art.slug}`}
                          className="group flex items-center gap-4 hover:-translate-y-0.5 transition-transform"
                        >
                          <div className="w-[84px] h-[84px] rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200/50">
                            <img
                              src={resolveImageUrl(art.image_url) || "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=200&q=80"}
                              alt={art.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          </div>
                          <div className="flex flex-col justify-center">
                            <h4 className="text-[13px] font-extrabold text-slate-900 leading-snug line-clamp-2 group-hover:text-emerald-700 transition-colors">
                              {art.title}
                            </h4>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                              <Clock className="w-3.5 h-3.5" />
                              {formatDate(art.created_at, lang)}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </ScrollReveal>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* ================= RELATED ARTICLES ================= */}
      {relatedArticles.length > 0 && (
        <section className="max-w-[1440px] mx-auto px-6 pb-20">
          <div className="border-t border-slate-200/80 pt-16">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <h3 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                {isId ? "Artikel Terkait" : "Related Articles"}
              </h3>
              <Link 
                href={`/${lang}/insights`}
                className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                {isId ? "Lihat Semua" : "View All"} <ArrowRight className="w-4 h-4"/>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedArticles.map((item) => (
                <ScrollReveal key={item.id}>
                  <RelatedCard item={item} lang={lang} isId={isId} />
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

    </main>
  );
}