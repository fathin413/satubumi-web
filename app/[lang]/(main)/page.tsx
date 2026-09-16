import { getDictionary } from "../../../getDictionary";

import {
  HeroSection,
  AboutSection,
  ServicesSection,
  ProductsSection,
  InsightsSection,
} from "../../../components/home";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const BACKEND_ORIGIN = API_URL.replace(/\/api\/v1\/?$/, "");
const FALLBACK_INSIGHT = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop";

export const metadata = {
  title: "Home",
};

type Article = {
  id: number;
  category: string;
  title: string;
  title_en?: string | null;
  content: string;
  content_en?: string | null;
  status: string;
  slug?: string;
  image_url?: string | null;
  created_at?: string;
  view_count?: number;
  views?: number;
};

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

function plainText(content: string) {
  if (!content) return "";
  if (/<\/?[a-z][\s\S]*>/i.test(content)) return stripHtml(content);
  return content.trim();
}

function formatDate(dateString?: string, isId?: boolean) {
  if (!dateString) return isId ? "Baru saja dirilis" : "Recently published";
  const date = new Date(dateString);
  return date.toLocaleDateString(isId ? "id-ID" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

async function getHomeArticles(lang: string): Promise<Article[]> {
  try {
    const apiLang = lang === "en" ? "en" : "id";
    const res = await fetch(`${API_URL}/articles/?lang=${apiLang}`, {
      next: { revalidate: 30 },
    });

    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data.filter((a: Article) => a.status === "published") : [];
  } catch {
    return [];
  }
}

function pickTitle(article: Article | undefined, isId: boolean, fallback: string) {
  if (!article) return fallback;
  if (!isId && article.title_en) return article.title_en;
  return article.title || fallback;
}

function pickContent(article: Article | undefined, isId: boolean) {
  if (!article) return "";
  if (!isId && article.content_en) return article.content_en;
  return article.content;
}

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const isId = lang === "id";

  const articles = await getHomeArticles(lang);
  const bySlug = (slug: string) => articles.find((a) => a.slug === slug);

  const heroArt = bySlug("home-hero");
  const heroBg2 = bySlug("home-hero-bg-2");
  const heroBg3 = bySlug("home-hero-bg-3");

  let heroImages = [
    resolveImageUrl(heroArt?.image_url),
    resolveImageUrl(heroBg2?.image_url),
    resolveImageUrl(heroBg3?.image_url),
  ].filter((x): x is string => Boolean(x));

  if (heroImages.length === 0) {
    heroImages = ["/asset.jpeg", "/asset1.jpeg", "/asset3.jpg"];
  }

  let heroTitle = isId
    ? "Menciptakan Dampak Iklim yang Terukur & Berkelanjutan"
    : "Satubumi bridges science, nature, communities, and business to create measurable climate and sustainability impacts.";

  let heroSubtitle = isId
    ? "Kami mendampingi perusahaan, lembaga, dan pemerintah dalam merancang strategi keseimbangan antara pertumbuhan ekonomi dan kelestarian ekosistem."
    : "We assist companies, institutions, and governments in designing strategies that balance economic growth with ecosystem preservation.";

  let heroHighlight = isId ? "Dampak Iklim yang Terukur" : "Measurable Climate Impact";

  if (heroArt) {
    heroTitle = pickTitle(heroArt, isId, heroTitle);
    const rawContent = pickContent(heroArt, isId);

    if (rawContent) {
      const parts = rawContent.split("<<<");
      if (parts.length > 1) {
        heroHighlight = parts[0].trim();
        heroSubtitle = parts[1].trim();
      } else {
        heroSubtitle = plainText(rawContent);
      }
    }
  }

  const about = bySlug("home-card-about");

  const insightArticles = articles
    .filter((a) => a.category?.toLowerCase() === "insight")
    .map((a) => ({ ...a, views: a.view_count || 0 }))
    .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
    .slice(0, 4);

  return (
    <main className="bg-[#052e16] min-h-screen overflow-x-hidden">
      <HeroSection
        lang={lang}
        isId={isId}
        title={heroTitle}
        highlight={heroHighlight}
        subtitle={heroSubtitle}
        images={heroImages}
      />

      <AboutSection lang={lang} isId={isId} content={plainText(pickContent(about, isId))} />

      <ServicesSection lang={lang} isId={isId} />

      <ProductsSection lang={lang} isId={isId} />

      <InsightsSection
        lang={lang}
        isId={isId}
        articles={insightArticles}
        resolveImageUrl={resolveImageUrl}
        fallbackImage={FALLBACK_INSIGHT}
        plainText={plainText}
        formatDate={formatDate}
      />
    </main>
  );
}