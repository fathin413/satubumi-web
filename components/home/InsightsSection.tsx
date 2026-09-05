import Link from "next/link";
import { ArrowRight, Clock, Eye } from "lucide-react";
import ScrollReveal from "../ScrollReveal";

interface Article {
  id: number;
  title: string;
  slug?: string;
  image_url?: string | null;
  content: string;
  created_at?: string;
  views?: number;
  view_count?: number;
  is_featured?: boolean;
  author?: string | null;
  author_profile_image?: string | null;
}

interface InsightsSectionProps {
  lang: string;
  isId: boolean;
  articles: Article[];
  resolveImageUrl: (url?: string | null) => string | null;
  fallbackImage: string;
  plainText: (content: string) => string;
  formatDate: (date?: string, isId?: boolean) => string;
}

function parseExcerpt(
  content: string,
  plainText: (s: string) => string,
  maxLength = 100
) {
  let html = content || "";
  try {
    const data = JSON.parse(content);
    if (Array.isArray(data) && data[0]?.type) {
      html = data
        .filter((b: any) => b.type === "text")
        .map((b: any) => b.html || b.htmlId || b.htmlEn || "")
        .join(" ");
    }
  } catch {
    /* content lama: HTML biasa */
  }
  const plain = plainText(html).replace(/\s+/g, " ").trim();
  if (!plain) return "";
  return plain.length > maxLength
    ? plain.slice(0, maxLength) + "..."
    : plain;
}

export default function InsightsSection({
  lang,
  isId,
  articles,
  resolveImageUrl,
  fallbackImage,
  plainText,
  formatDate,
}: InsightsSectionProps) {
  const viewOf = (a: Article) => a.view_count || a.views || 0;

  const getExcerpt = (content: string, maxLength = 100) =>
    parseExcerpt(content, plainText, maxLength);

  const ranked = [...articles].sort((a, b) => {
    const fa = a.is_featured ? 1 : 0;
    const fb = b.is_featured ? 1 : 0;
    if (fb !== fa) return fb - fa;
    return viewOf(b) - viewOf(a);
  });

  const featuredArticle = ranked[0];
  const sideArticles = ranked.slice(1, 4);

  return (
    <section className="relative w-full pt-16 pb-24 bg-emerald-950 border-t border-emerald-900/50 overflow-hidden font-sans">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 relative z-10">
        <ScrollReveal className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-10 md:mb-12 border-b border-emerald-800/30 pb-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-[1.1] tracking-tight">
              {isId ? "Artikel Terpopuler Kami" : "Our Top Read Articles"}
            </h2>
          </div>

          <Link
            href={`/${lang}/insights`}
            className="inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-full bg-white text-emerald-900 text-[11px] font-bold uppercase tracking-widest hover:bg-emerald-50 hover:shadow-lg transition-all duration-300"
          >
            {isId ? "Lihat Semua Artikel" : "View All Articles"}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </ScrollReveal>

        {ranked.length > 0 && featuredArticle ? (
          <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 lg:h-[620px]">
            <div className="lg:col-span-7 h-[450px] lg:h-full">
              <ScrollReveal className="h-full w-full">
                <Link
                  href={`/${lang}/insights/${featuredArticle.slug || featuredArticle.id}`}
                  className="group relative flex flex-col w-full h-full rounded-[2rem] overflow-hidden shadow-xl border border-emerald-700/30 transition-all duration-500 hover:border-emerald-500/80"
                >
                  <img
                    src={
                      resolveImageUrl(featuredArticle.image_url) ||
                      fallbackImage
                    }
                    alt={featuredArticle.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1.5s] ease-out"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/70 to-transparent opacity-95" />

                  <div className="absolute bottom-0 left-0 p-6 md:p-10 z-10 w-full">
                    <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold uppercase tracking-widest mb-4">
                      <div className="flex items-center gap-2.5 text-emerald-300 bg-emerald-900/60 px-3 py-1.5 rounded-full backdrop-blur-md border border-emerald-800/50 shadow-sm">
                        <div className="w-5 h-5 rounded-full bg-emerald-700 border border-emerald-600 flex items-center justify-center text-white text-[10px] font-bold overflow-hidden shrink-0">
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
                          ) : featuredArticle.author ? (
                            featuredArticle.author.charAt(0).toUpperCase()
                          ) : (
                            "S"
                          )}
                        </div>
                        <span className="font-extrabold">
                          {featuredArticle.author || "Satubumi Team"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-emerald-100/70">
                        <Eye className="w-3.5 h-3.5" />
                        {viewOf(featuredArticle).toLocaleString(
                          isId ? "id-ID" : "en-US"
                        )}{" "}
                        {isId ? "Tayangan" : "Views"}
                      </div>

                      <div className="flex items-center gap-1.5 text-emerald-100/70">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDate(featuredArticle.created_at, isId)}
                      </div>
                    </div>

                    <h3 className="text-3xl md:text-4xl lg:text-[2.5rem] font-extrabold text-white mb-4 leading-[1.15] tracking-tight group-hover:text-emerald-300 transition-colors">
                      {featuredArticle.title}
                    </h3>

                    <p className="text-[15px] md:text-[16px] text-emerald-50/80 leading-relaxed font-medium line-clamp-2 max-w-2xl">
                      {getExcerpt(featuredArticle.content, 180)}
                    </p>
                  </div>
                </Link>
              </ScrollReveal>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-4 lg:gap-5 h-[500px] sm:h-[550px] lg:h-full">
              {sideArticles.map((article, index) => (
                <ScrollReveal
                  key={article.id}
                  delay={`delay-${(index + 1) * 100}`}
                  className="flex-1 w-full h-full"
                >
                  <Link
                    href={`/${lang}/insights/${article.slug || article.id}`}
                    className="flex flex-row items-stretch h-full gap-4 lg:gap-5 bg-emerald-800/40 border border-emerald-700/50 rounded-[1.5rem] p-3 md:p-4 hover:bg-emerald-800/70 hover:border-emerald-500/50 hover:shadow-xl transition-all duration-300 group overflow-hidden"
                  >
                    <div className="relative h-full w-[110px] sm:w-[150px] shrink-0 rounded-xl overflow-hidden bg-emerald-900/80">
                      <img
                        src={
                          resolveImageUrl(article.image_url) || fallbackImage
                        }
                        alt={article.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                      />
                    </div>

                    <div className="flex flex-col justify-center flex-grow py-1 min-w-0">
                      <h3 className="text-[15px] md:text-[16px] font-extrabold text-white leading-snug line-clamp-2 group-hover:text-emerald-400 transition-colors mb-2.5">
                        {article.title}
                      </h3>

                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 rounded-full bg-emerald-700 border border-emerald-600 flex items-center justify-center text-white text-[9px] font-bold overflow-hidden shrink-0">
                          {article.author_profile_image ? (
                            <img
                              src={
                                resolveImageUrl(
                                  article.author_profile_image
                                ) || ""
                              }
                              alt={article.author || "Author"}
                              className="w-full h-full object-cover"
                            />
                          ) : article.author ? (
                            article.author.charAt(0).toUpperCase()
                          ) : (
                            "S"
                          )}
                        </div>
                        <p className="text-[10px] md:text-[11px] font-extrabold uppercase tracking-[0.15em] text-emerald-300/90 truncate">
                          {article.author || "Satubumi Team"}
                        </p>
                      </div>

                      <p className="text-[12px] md:text-[13px] text-emerald-100/60 font-medium leading-relaxed line-clamp-2 mb-3">
                        {getExcerpt(article.content, 90)}
                      </p>

                      <div className="mt-auto flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-emerald-100/40">
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {viewOf(article).toLocaleString(
                            isId ? "id-ID" : "en-US"
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(article.created_at, isId)}
                        </div>
                      </div>
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-20 bg-emerald-900/40 border border-emerald-800/50 rounded-[2rem]">
            <div className="w-16 h-16 rounded-full bg-emerald-950/50 flex items-center justify-center mx-auto mb-4 border border-emerald-800/50">
              <Eye className="w-6 h-6 text-emerald-400/50" />
            </div>
            <p className="text-emerald-100/70 font-medium text-lg">
              {isId
                ? "Belum ada artikel wawasan yang dipublikasikan."
                : "No insight articles published yet."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}