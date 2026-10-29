"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import InsightForm from "../../../../../components/admin/InsightForm";

function NewInsightContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const lang = (params?.lang as string) || "en";
  const isId = lang === "id";

  // /admin/insights/new?category=news -> form News, selain itu form Insight
  const category = searchParams.get("category") === "news" ? "news" : "insight";
  const isNews = category === "news";

  return (
    <div>
      <Link
        href={isNews ? `/${lang}/admin/insights?category=news` : `/${lang}/admin/insights`}
        className="inline-flex items-center gap-2 text-sm font-bold text-emerald-800/60 hover:text-emerald-800 mb-6">
        <ArrowLeft className="w-4 h-4" />
        {isId ? "Kembali ke daftar" : "Back to list"}
      </Link>

      <h1 className="text-2xl md:text-3xl font-extrabold text-emerald-950 mb-2">
        {isNews ? (isId ? "Tambah Berita" : "Add News") : isId ? "Tambah Insight" : "Add Insight"}
      </h1>
      <p className="text-emerald-900/50 font-medium text-sm mb-8">
        {isId ? "Isi form lalu simpan" : "Fill the form and save"}
      </p>

      <InsightForm mode="create" category={category} />
    </div>
  );
}

export default function NewInsightPage() {
  return (
    <Suspense fallback={null}>
      <NewInsightContent />
    </Suspense>
  );
}
