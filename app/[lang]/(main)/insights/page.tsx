"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowUpRight,
  Newspaper,
  Star,
  Users,
  Clock,
  TrendingUp,
  Tag,
  ChevronRight,
  Eye,
  Search,
} from "lucide-react";
import ScrollReveal from "../../../../components/ScrollReveal";
import InsightTabs from "@/components/insights/InsightTabs";
import RulebookSection from "@/components/insights/RulebookSection";
import { parseBlocks } from "@/components/admin/ContentBlocksEditor";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const BACKEND_ORIGIN = API_URL.replace(/\/api\/v1\/?$/, "");

type Article = {
  id: number;
  category: string;
  title: string;
  slug: string;
  content: string;
  status: string;
  image_url?: string | null;
  created_at?: string;
  author?: string | null;
  author_profile_image?: string | null;
  topic?: string | null;
  is_featured?: boolean;
  view_count?: number;
};

type TopAuthor = {
  author: string;
  count: number;
  profile_image?: string | null;
  author_profile_image?: string | null;
};

type TopicItem = { topic: string; count: number };

const TOPIC_LABELS: Record<string, { id: string; en: string }> = {
  carbon: { id: "Karbon", en: "Carbon" },
  esg: { id: "ESG", en: "ESG" },
  policy: { id: "Kebijakan", en: "Policy" },
  nature: { id: "Alam & Bentang", en: "Nature & Landscape" },
  other: { id: "Lainnya", en: "Other" },
};

function topicLabel(topic: string | null | undefined, isId: boolean) {
  if (!topic) return isId ? "Insight" : "Insight";
  const t = TOPIC_LABELS[topic];
  return t ? (isId ? t.id : t.en) : topic;
}

function resolveImageUrl(url?: string | null) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${BACKEND_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
}

function stripHtml(html: string) {
  return (html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function excerptFromContent(content: string, max = 160) {
  const blocks = parseBlocks(content);
  const plain = blocks
    .map((b) =>
      b.type === "text" ? stripHtml(b.htmlId || b.htmlEn || "") : "",
    )
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
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function InsightCard({
  item,
  lang,
  isId,
  index,
}: {
  item: Article;
  lang: string;
  isId: boolean;
  index: number;
}) {
  const img =
    resolveImageUrl(item.image_url) ||
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80";

  return (
    <ScrollReveal
      delay={`delay-${Math.min((index % 2) * 100, 300)}`}
      className="h-full"
    >
      <Link
        href={`/${lang}/insights/${item.slug}`}
        className="group flex flex-col h-full bg-white rounded-3xl border border-stone-100 overflow-hidden transition-all duration-300 hover:border-emerald-300 hover:shadow-xl hover:-translate-y-1"
      >
        <div className="aspect-[16/10] overflow-hidden relative bg-stone-100 p-2">
          <div className="w-full h-full rounded-2xl overflow-hidden relative">
            <img
              src={img}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
          </div>

          <span className="absolute top-5 left-5 inline-flex items-center px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-sm text-emerald-800 text-[10px] font-extrabold uppercase tracking-[0.12em] shadow-sm">
            {topicLabel(item.topic, isId)}
          </span>
          {item.is_featured && (
            <span className="absolute top-5 right-5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold uppercase tracking-[0.12em] shadow-sm">
              <Star className="w-3 h-3 fill-current" />
              Top
            </span>
          )}
        </div>

        <div className="p-6 md:p-7 flex flex-col flex-grow">
          <h2 className="text-lg md:text-xl font-extrabold text-stone-900 leading-snug mb-3 group-hover:text-emerald-700 transition-colors line-clamp-2">
            {item.title}
          </h2>

          <p className="text-[13.5px] text-stone-600 font-medium leading-relaxed flex-grow line-clamp-3 mb-5">
            {excerptFromContent(item.content, 120)}
          </p>

          <div className="mt-auto flex items-center justify-between border-t border-stone-100 pt-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                {item.author_profile_image ? (
                  <img
                    src={resolveImageUrl(item.author_profile_image) || ""}
                    alt={item.author || "Author"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[11px] font-extrabold text-emerald-600">
                    {(item.author || "S").charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-stone-900 leading-none mb-1 line-clamp-1">
                  {item.author || "Satubumi Team"}
                </span>
                <span className="text-[10px] font-medium text-stone-400 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {formatDate(item.created_at, lang)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-[10px] font-bold text-stone-400">
                <Eye className="w-3 h-3" />
                <span>{item.view_count || 0}</span>
              </div>
              <span className="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center text-stone-400 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </ScrollReveal>
  );
}

export default function InsightsPage() {
  const params = useParams();
  const lang = (params?.lang as string) || "en";
  const isId = lang === "id";

  const [items, setItems] = useState<Article[]>([]);
  const [topInsights, setTopInsights] = useState<Article[]>([]);
  const [topAuthors, setTopAuthors] = useState<TopAuthor[]>([]);
  const [topics, setTopics] = useState<TopicItem[]>([]);

  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"article" | "rulebook">("article");

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const apiLang = lang === "en" ? "en" : "id";
      const topicQ = activeTopic
        ? `&topic=${encodeURIComponent(activeTopic)}`
        : "";

      try {
        const listRes = await fetch(
          `${API_URL}/articles/?category=insight&lang=${apiLang}${topicQ}`,
          { cache: "no-store" }
        );

        if (!listRes.ok) {
          throw new Error(`Articles API error: ${listRes.status}`);
        }

        const list = await listRes.json();

        const publishedArticles = Array.isArray(list)
          ? list.filter((a: Article) => a.status === "published")
          : [];

        // Featured dulu, lalu terbaru
        setItems(
          [...publishedArticles].sort((a, b) => {
            const fa = a.is_featured ? 1 : 0;
            const fb = b.is_featured ? 1 : 0;
            if (fb !== fa) return fb - fa;
            return b.id - a.id;
          })
        );

        // Hero: prioritas is_featured, fallback view tertinggi
        const featured =
          publishedArticles.find((a) => a.is_featured) ||
          [...publishedArticles].sort(
            (a, b) => (b.view_count || 0) - (a.view_count || 0)
          )[0] ||
          null;

        setTopInsights(
          featured
            ? [
                featured,
                ...publishedArticles.filter((a) => a.id !== featured.id),
              ]
            : publishedArticles
        );

        const [authorsResult, topicsResult] = await Promise.allSettled([
          fetch(`${API_URL}/articles/insights/top-authors?limit=5`, {
            cache: "no-store",
          }).then((res) => (res.ok ? res.json() : [])),
          fetch(`${API_URL}/articles/insights/topics`).then((res) =>
            res.ok ? res.json() : []
          ),
        ]);

        if (authorsResult.status === "fulfilled") {
          setTopAuthors(
            Array.isArray(authorsResult.value) ? authorsResult.value : []
          );
        } else {
          setTopAuthors([]);
        }

        if (topicsResult.status === "fulfilled") {
          setTopics(
            Array.isArray(topicsResult.value) ? topicsResult.value : []
          );
        } else {
          setTopics([]);
        }
      } catch (err) {
        console.error("Failed to load articles:", err);
        setItems([]);
        setTopInsights([]);
        setTopAuthors([]);
        setTopics([]);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === "article") {
      load();
    } else {
      setLoading(false);
    }
  }, [lang, activeTopic, activeTab]);

  const filterTopics: TopicItem[] =
    topics.length > 0
      ? topics
      : Object.keys(TOPIC_LABELS).map((t) => ({ topic: t, count: 0 }));

  const displayedArticles = items.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      excerptFromContent(item.content).toLowerCase().includes(q)
    );
  });

  const featuredArticle = topInsights.length > 0 ? topInsights[0] : null;
  const sidebarPicks = topInsights.length > 1 ? topInsights.slice(1, 4) : [];

  return (
    <main className="bg-[#f7f6f2] min-h-screen selection:bg-emerald-200 selection:text-emerald-950 font-sans pb-28">
      {/* ================= HEADER ================= */}
      <div className="relative overflow-hidden bg-emerald-950 text-white pt-36 pb-32 px-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.2),_transparent_55%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(4,20,15,0.6))] pointer-events-none" />

        <div className="relative z-10 max-w-[1200px] mx-auto text-center">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2.5 mb-6">
              <span className="w-6 h-px bg-emerald-400/60" />
              <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-emerald-400/90">
                {isId ? "Pengetahuan & Analisis" : "Knowledge & Analysis"}
              </p>
              <span className="w-6 h-px bg-emerald-400/60" />
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6">
              Insights
            </h1>

            <p className="text-lg md:text-xl text-emerald-50/80 font-medium max-w-2xl mx-auto leading-relaxed mb-10">
              {isId
                ? "Perspektif ilmiah dan praktis seputar iklim, karbon, dan keberlanjutan."
                : "Scientific and practical perspectives on climate, carbon, and sustainability."}
            </p>

            {activeTab === "article" && (
              <div className="relative w-full max-w-2xl mx-auto mb-8">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  type="text"
                  placeholder={
                    isId
                      ? "Cari wawasan, topik, atau penulis..."
                      : "Search insights, topics, or authors..."
                  }
                  className="w-full pl-14 pr-6 py-4 bg-white rounded-full text-[15px] font-medium text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/30 transition-all shadow-2xl"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}

            <InsightTabs
              activeTab={activeTab}
              setActiveTab={(tab) => {
                setActiveTab(tab);
                if (tab === "rulebook") {
                  setSearchQuery("");
                }
              }}
            />
          </ScrollReveal>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-[1440px] mx-auto px-6 -mt-12 relative z-10">
        {activeTab === "article" && loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-32">
            <div className="w-10 h-10 border-4 border-stone-200 border-t-emerald-600 rounded-full animate-spin" />
            <p className="text-xs font-bold uppercase tracking-widest text-stone-400 animate-pulse">
              {isId ? "Memuat insights…" : "Loading insights…"}
            </p>
          </div>
        ) : activeTab === "article" ? (
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-start">
            {/* KOLOM KIRI */}
            <div className="w-full lg:w-[65%] flex flex-col gap-10">
              {/* FEATURED */}
              {!activeTopic && !searchQuery && featuredArticle && (
                <ScrollReveal>
                  <div className="bg-white rounded-[2rem] border border-stone-100 shadow-sm overflow-hidden p-2">
                    <div className="relative w-full aspect-[16/10] md:aspect-[2/1] rounded-[1.5rem] overflow-hidden bg-stone-100">
                      <img
                        src={
                          resolveImageUrl(featuredArticle.image_url) ||
                          "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80"
                        }
                        alt={featuredArticle.title}
                        className="w-full h-full object-cover transition-transform duration-[1.5s] hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

                      <div className="absolute top-5 left-5">
                        <span className="px-4 py-1.5 bg-white/95 backdrop-blur-md text-emerald-800 text-[11px] font-extrabold uppercase tracking-widest rounded-full shadow-sm">
                          {topicLabel(featuredArticle.topic, isId)}
                        </span>
                      </div>

                      <div className="absolute top-5 right-5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-700/95 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-widest shadow-md">
                        <TrendingUp className="w-3.5 h-3.5" />
                        {isId ? "Paling Diminati" : "Trending"}
                      </div>
                    </div>

                    <Link
                      href={`/${lang}/insights/${featuredArticle.slug}`}
                      className="group block px-6 md:px-8 py-8"
                    >
                      <h3 className="text-3xl md:text-4xl font-extrabold text-stone-900 leading-[1.2] mb-4 group-hover:text-emerald-700 transition-colors tracking-tight">
                        {featuredArticle.title}
                      </h3>

                      <p className="text-base text-stone-600 font-medium leading-relaxed mb-8 line-clamp-3">
                        {excerptFromContent(featuredArticle.content, 250)}
                      </p>

                      <div className="flex items-center justify-between border-t border-stone-100 pt-6">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 shadow-sm">
                            {featuredArticle.author_profile_image ? (
                              <img
                                src={
                                  resolveImageUrl(
                                    featuredArticle.author_profile_image
                                  ) || ""
                                }
                                alt={featuredArticle.author || "Author"}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-extrabold text-emerald-600">
                                {(featuredArticle.author || "S")
                                  .charAt(0)
                                  .toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[14px] font-extrabold text-stone-900">
                              {featuredArticle.author || "Satubumi Team"}
                            </span>
                            <div className="flex items-center gap-3 text-xs font-medium text-stone-500 mt-0.5">
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-stone-400" />
                                {formatDate(featuredArticle.created_at, lang)}
                              </span>
                              <span className="w-1 h-1 rounded-full bg-stone-300" />
                              <span className="flex items-center gap-1.5">
                                <Eye className="w-3.5 h-3.5 text-stone-400" />
                                {featuredArticle.view_count || 0}
                              </span>
                            </div>
                          </div>
                        </div>

                        <span className="hidden sm:inline-flex items-center justify-center w-10 h-10 rounded-full bg-stone-50 text-stone-400 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                          <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </span>
                      </div>
                    </Link>
                  </div>
                </ScrollReveal>
              )}

              {/* ALL PUBLICATIONS */}
              <div className="bg-white rounded-[2rem] border border-stone-100 p-6 md:p-8 shadow-sm">
                <div className="flex items-center justify-between border-b border-stone-100 pb-5 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Newspaper className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-[15px] font-extrabold text-stone-900">
                        {searchQuery
                          ? isId
                            ? "Hasil Pencarian"
                            : "Search Results"
                          : activeTopic
                            ? topicLabel(activeTopic, isId)
                            : isId
                              ? "Seluruh Publikasi"
                              : "All Publications"}
                      </h2>
                      <p className="text-[12px] font-medium text-stone-400">
                        {displayedArticles.length}{" "}
                        {isId ? "artikel ditemukan" : "articles found"}
                      </p>
                    </div>
                  </div>
                </div>

                {displayedArticles.length === 0 ? (
                  <div className="py-20 text-center">
                    <div className="w-16 h-16 rounded-full bg-stone-50 border border-stone-100 flex items-center justify-center mx-auto mb-4">
                      <Newspaper className="w-6 h-6 text-stone-300" />
                    </div>
                    <p className="text-stone-500 font-medium text-[15px]">
                      {isId
                        ? "Tidak ada artikel yang sesuai dengan pencarian."
                        : "No articles match your search."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                    {displayedArticles.map((item, i) => (
                      <InsightCard
                        key={item.id}
                        item={item}
                        lang={lang}
                        isId={isId}
                        index={i}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* KOLOM KANAN */}
            <div className="w-full lg:w-[35%] flex flex-col gap-6">
              {/* TOPICS */}
              <ScrollReveal className="bg-white rounded-[2rem] border border-stone-100 p-6 md:p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Tag className="w-4 h-4" />
                  </div>
                  <h3 className="text-[15px] font-extrabold text-stone-900">
                    {isId ? "Eksplorasi Topik" : "Explore Topics"}
                  </h3>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <button
                    onClick={() => {
                      setActiveTopic(null);
                      setSearchQuery("");
                    }}
                    className={`px-4 py-2 rounded-xl text-[13px] font-bold border transition-all duration-300 ${
                      activeTopic === null
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20"
                        : "bg-white hover:bg-stone-50 border-stone-200 text-stone-600"
                    }`}
                  >
                    {isId ? "Semua Topik" : "All Topics"}
                  </button>
                  {filterTopics.map((t) => (
                    <button
                      key={t.topic}
                      onClick={() => {
                        setActiveTopic(t.topic);
                        setSearchQuery("");
                      }}
                      className={`px-4 py-2 rounded-xl text-[13px] font-bold border transition-all duration-300 ${
                        activeTopic === t.topic
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20"
                          : "bg-white hover:bg-stone-50 border-stone-200 text-stone-600"
                      }`}
                    >
                      {topicLabel(t.topic, isId)}{" "}
                      <span
                        className={
                          activeTopic === t.topic
                            ? "text-emerald-200 ml-1"
                            : "text-stone-400 ml-1"
                        }
                      >
                        {t.count}
                      </span>
                    </button>
                  ))}
                </div>
              </ScrollReveal>

              {/* LATEST / PER TOPIK */}
              <ScrollReveal className="bg-white rounded-[2rem] border border-stone-100 p-6 md:p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Newspaper className="w-4 h-4" />
                  </div>
                  <h3 className="text-[15px] font-extrabold text-stone-900">
                    {activeTopic
                      ? topicLabel(activeTopic, isId)
                      : isId
                        ? "Artikel terbaru"
                        : "Latest articles"}
                  </h3>
                </div>

                <div className="flex flex-col divide-y divide-stone-100">
                  {items.slice(0, 8).map((article) => (
                    <Link
                      key={`side-list-${article.id}`}
                      href={`/${lang}/insights/${article.slug}`}
                      className="group py-4 first:pt-0 last:pb-0 flex gap-3"
                    >
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-100 shrink-0">
                        <img
                          src={
                            resolveImageUrl(article.image_url) ||
                            "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=200&q=80"
                          }
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 mb-1">
                          {topicLabel(article.topic, isId)}
                        </p>
                        <h4 className="text-[13.5px] font-extrabold text-stone-800 leading-snug group-hover:text-emerald-700 line-clamp-2">
                          {article.title}
                        </h4>
                      </div>
                    </Link>
                  ))}
                </div>
              </ScrollReveal>

              {/* TRENDING */}
              {sidebarPicks.length > 0 && (
                <ScrollReveal className="bg-white rounded-[2rem] border border-stone-100 p-6 md:p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center relative">
                      <span className="absolute inset-0 rounded-full border border-rose-200 animate-ping opacity-50" />
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <h3 className="text-[15px] font-extrabold text-stone-900">
                      {isId ? "Sedang Tren" : "Trending Now"}
                    </h3>
                  </div>

                  <div className="flex flex-col gap-6">
                    {sidebarPicks.map((article, idx) => (
                      <Link
                        key={`side-${article.id}`}
                        href={`/${lang}/insights/${article.slug}`}
                        className="group flex gap-4 items-start"
                      >
                        <span className="text-3xl font-black text-stone-200 group-hover:text-emerald-300 transition-colors shrink-0 leading-none pt-1">
                          0{idx + 2}
                        </span>
                        <div className="flex flex-col flex-grow">
                          <h4 className="text-[14.5px] font-extrabold text-stone-800 leading-snug group-hover:text-emerald-700 transition-colors line-clamp-2 mb-2">
                            {article.title}
                          </h4>
                          <div className="flex items-center gap-3 text-[11px] font-bold text-stone-400">
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3 h-3" />
                              {formatDate(article.created_at, lang)}
                            </span>
                            <span className="flex items-center gap-1.5 text-emerald-600/70">
                              <Eye className="w-3 h-3" />
                              {article.view_count || 0}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </ScrollReveal>
              )}

              {/* TOP AUTHORS */}
              {topAuthors.length > 0 && (
                <ScrollReveal className="bg-white rounded-[2rem] border border-stone-100 p-6 md:p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                    <h3 className="text-[15px] font-extrabold text-stone-900">
                      {isId ? "Penulis Utama" : "Top Authors"}
                    </h3>
                  </div>

                  <div className="flex flex-col gap-2">
                    {topAuthors.slice(0, 5).map((a) => {
                      const authorImage =
                        a.author_profile_image || a.profile_image;

                      return (
                        <div
                          key={a.author}
                          className="flex items-center justify-between p-3 rounded-2xl hover:bg-stone-50 border border-transparent hover:border-stone-100 transition-all cursor-default"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                              {authorImage ? (
                                <img
                                  src={resolveImageUrl(authorImage) || ""}
                                  alt={a.author}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-[13px] font-extrabold text-emerald-600">
                                  {(a.author || "S").charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[14px] font-extrabold text-stone-800">
                                {a.author}
                              </span>
                              <span className="text-[11px] font-bold text-emerald-600 mt-0.5">
                                {a.count} {isId ? "Artikel" : "Articles"}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-stone-300 shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                </ScrollReveal>
              )}
            </div>
          </div>
        ) : (
          <RulebookSection />
        )}
      </div>
    </main>
  );
}