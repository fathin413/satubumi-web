"use client";

import { FileText, Download, ArrowDownToLine } from "lucide-react";
import { useEffect, useState } from "react";
import DownloadRulebookModal from "./DownloadRulebookModal";
import ScrollReveal from "../../components/ScrollReveal";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

type Rulebook = {
  id: number;
  title: string;
  description?: string;
  file_url: string;
  download_count: number;
};

export default function RulebookSection({
  searchQuery = "",
  isId = false,
}: {
  searchQuery?: string;
  isId?: boolean;
}) {
  const [rulebooks, setRulebooks] = useState<Rulebook[]>([]);
  const [selectedRulebook, setSelectedRulebook] = useState<Rulebook | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/rulebooks/`)
      .then((res) => res.json())
      .then((data) => {
        setRulebooks(Array.isArray(data) ? data : []);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredRulebooks = rulebooks.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      item.title.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32">
        <div className="w-10 h-10 border-4 border-stone-200 border-t-emerald-600 rounded-full animate-spin" />
        <p className="text-xs font-bold uppercase tracking-widest text-stone-400 animate-pulse">
          {isId ? "Memuat Rulebooks..." : "Loading Rulebooks..."}
        </p>
      </div>
    );
  }

  if (rulebooks.length === 0) {
    return (
      <div className="bg-white rounded-[2rem] border border-stone-100 p-16 text-center shadow-sm">
        <div className="w-16 h-16 rounded-full bg-stone-50 flex items-center justify-center mx-auto mb-4 border border-stone-100">
          <FileText className="w-6 h-6 text-stone-300" />
        </div>
        <p className="text-stone-500 font-medium text-[15px]">
          {isId ? "Belum ada rulebook yang diterbitkan." : "No rulebooks published yet."}
        </p>
      </div>
    );
  }

  if (filteredRulebooks.length === 0) {
    return (
      <div className="bg-white rounded-[2rem] border border-stone-100 p-16 text-center shadow-sm">
        <div className="w-16 h-16 rounded-full bg-stone-50 flex items-center justify-center mx-auto mb-4 border border-stone-100">
          <FileText className="w-6 h-6 text-stone-300" />
        </div>
        <p className="text-stone-500 font-medium text-[15px]">
          {isId
            ? "Tidak ada rulebook yang sesuai dengan pencarian."
            : "No rulebooks match your search."}
        </p>
      </div>
    );
  }

  return (
    <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
      {filteredRulebooks.map((item, index) => (
        <ScrollReveal key={item.id} delay={`delay-${Math.min((index % 3) * 100, 300)}`}>
          <div className="group h-full flex flex-col bg-white rounded-[2rem] border border-stone-100 p-6 md:p-8 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all duration-300 hover:-translate-y-1">
            
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-6 border border-emerald-100 group-hover:scale-110 transition-transform duration-300 shadow-sm shrink-0">
              <FileText className="text-emerald-600 w-6 h-6" />
            </div>

            <h3 className="text-xl font-extrabold text-stone-900 leading-snug group-hover:text-emerald-700 transition-colors line-clamp-2">
              {item.title}
            </h3>

            <p className="mt-4 text-[14px] text-stone-500 leading-relaxed font-medium line-clamp-3 flex-grow">
              {item.description || "Tidak ada deskripsi untuk rulebook ini."}
            </p>

            <div className="mt-8 pt-6 border-t border-stone-100 flex items-center justify-between">
              <button
                onClick={() => setSelectedRulebook(item)}
                className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-500 hover:shadow-md hover:shadow-emerald-600/20 transition-all duration-300 active:scale-95"
              >
                <ArrowDownToLine size={16} />
                Download PDF
              </button>

              <div className="flex items-center gap-1.5 text-stone-400 group-hover:text-emerald-600 transition-colors bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-100">
                <Download size={14} />
                <span className="text-xs font-extrabold">{item.download_count}</span>
              </div>
            </div>
          </div>
        </ScrollReveal>
      ))}

      {selectedRulebook && (
        <DownloadRulebookModal
          rulebook={selectedRulebook}
          onClose={() => setSelectedRulebook(null)}
        />
      )}
    </section>
  );
}