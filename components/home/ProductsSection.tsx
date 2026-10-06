"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  ArrowRight,
  Activity,
  Database,
  Leaf,
  LineChart,
  ShieldCheck,
  Globe2,
} from "lucide-react";

import ScrollReveal from "../ScrollReveal";

interface ProductsSectionProps {
  lang: string;
  isId: boolean;
}

const products = {
  rapid: {
    title: {
      id: "Rapid-FS Scoring",
      en: "Rapid-FS Scoring",
    },
    subtitle: {
      id: "Climate Project Feasibility Intelligence",
      en: "Climate Project Feasibility Intelligence",
    },
    description: {
      id: "Platform analisis cepat untuk mengevaluasi kelayakan proyek karbon berbasis data spasial, risiko, karbon, dan ekonomi.",
      en: "A rapid intelligence platform to evaluate carbon project feasibility using spatial, risk, carbon, and economic analysis.",
    },
    variables: [
      { icon: ShieldCheck, title: "Feasibility Score", value: "85 / 100" },
      { icon: Leaf, title: "Carbon Stock", value: "2.4M tCO₂e" },
      { icon: LineChart, title: "Revenue Projection", value: "$90M" },
      { icon: Globe2, title: "Spatial Risk", value: "Low" },
    ],
    // Rute diperbaiki ke /products
    href: "/products",
  },

  monitor: {
    title: {
      id: "Satubumi Monitor",
      en: "Satubumi Monitor",
    },
    subtitle: {
      id: "Sustainability Impact Monitoring",
      en: "Sustainability Impact Monitoring",
    },
    description: {
      id: "Platform monitoring untuk melihat perkembangan dampak keberlanjutan melalui data lingkungan dan indikator ESG.",
      en: "A monitoring platform to track sustainability impact through environmental data and ESG indicators.",
    },
    variables: [
      { icon: Activity, title: "Impact Status", value: "Active" },
      { icon: Database, title: "Data Stream", value: "Live" },
      { icon: LineChart, title: "ESG Metrics", value: "120+" },
      { icon: Globe2, title: "Project Status", value: "Updated" },
    ],
    // Rute diperbaiki ke /monitor
    href: "/monitor",
  },
};

export default function ProductsSection({
  lang,
  isId,
}: ProductsSectionProps) {
  const [active, setActive] = useState<"rapid" | "monitor">("rapid");
  const product = products[active];

  return (
    <section className="relative py-24 lg:py-32 bg-[#fdfdfd] border-t border-slate-100 overflow-hidden font-sans">
      
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f8fafc_1px,transparent_1px),linear-gradient(to_bottom,#f8fafc_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      <div className="absolute right-[-10%] top-0 w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 relative z-10">
        
        {/* ======================= HEADER SECTION ======================= */}
        <div className="mb-16 md:mb-20 max-w-4xl">
          <ScrollReveal>
            <div className="flex items-center gap-4 mb-6">
              <div className="h-[1px] w-12 bg-emerald-600" />
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-emerald-600">
                {isId ? "Produk Kami" : "Our Products"}
              </span>
            </div>
            
            <h2 className="text-4xl md:text-5xl lg:text-[4rem] font-extrabold text-emerald-950 leading-[1.1] tracking-tight">
              {isId ? "Teknologi Cerdas untuk Keputusan Iklim" : "Smart Technology for Climate Decisions"}
            </h2>
            
            <p className="mt-6 text-[16px] md:text-[18px] text-slate-600 leading-[1.8] font-medium max-w-2xl">
              {isId 
                ? "Ubah data kompleks menjadi langkah strategis yang menguntungkan. Platform intelijen kami dirancang untuk meminimalisasi risiko dan memaksimalkan dampak." 
                : "Transform complex data into profitable strategic moves. Our intelligence platform is designed to minimize risk and maximize impact."}
            </p>
          </ScrollReveal>
        </div>

        {/* ======================= MAIN CONTENT GRID ======================= */}
        <div className="grid lg:grid-cols-12 gap-16 lg:gap-0 items-center relative">
          
          {/* ======================= KIRI: ENGINE ANIMATION ======================= */}
          <div className="lg:col-span-6 flex justify-center lg:justify-start lg:pr-8 xl:pr-16 relative">
            <div className="relative w-full max-w-[320px] sm:max-w-[360px] md:max-w-[400px] lg:max-w-[420px] aspect-square flex items-center justify-center m-auto">
              
              {/* Cincin Statis */}
              <div className="absolute inset-0 border border-slate-200/70 rounded-full" />
              <div className="absolute inset-6 md:inset-10 border border-slate-200/50 rounded-full" />

              {/* Cincin Animasi */}
              <div className="absolute inset-8 md:inset-12 border-2 border-emerald-300/40 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
              <div className="absolute inset-16 md:inset-20 border border-emerald-200/50 rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '1.5s' }} />
              
              {/* Core Engine (Logo Center) */}
              <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-48 md:h-48 bg-white border-2 border-emerald-500 rounded-full flex items-center justify-center shadow-xl shadow-slate-200/50 relative overflow-hidden z-10 p-5 md:p-8">
                 <Image 
                   src="/loggo1.png" 
                   alt="Satubumi Center Core" 
                   width={1441} 
                   height={1441} 
                   className="w-full h-full object-contain relative z-10"
                   priority
                 />
              </div>

              {/* Kontainer Orbit */}
              <div className="absolute inset-0 w-full h-full animate-product-orbit z-20">
                {product.variables.map((item, index) => {
                  const Icon = item.icon;
                  const positions = [
                    "top-[2%] left-[0%] md:top-[2%] md:left-[0%]",
                    "top-[12%] right-[0%] md:top-[12%] md:right-[0%]",
                    "bottom-[12%] left-[0%] md:bottom-[12%] md:left-[0%]",
                    "bottom-[2%] right-[0%] md:bottom-[2%] md:right-[0%]",
                  ];

                  return (
                    <div key={index} className={`absolute ${positions[index]}`}>
                      <div className="animate-product-orbit-reverse">
                        
                        {/* Box Data */}
                        <div className="bg-white/95 backdrop-blur-md shadow-md hover:shadow-xl rounded-2xl p-3 sm:p-3.5 flex items-center gap-2.5 sm:gap-3 transition-all duration-300 group cursor-pointer hover:scale-105 relative z-20 hover:z-30 border border-slate-100">
                          
                          {/* Icon Box */}
                          <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-xl bg-slate-50 flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-100/40">
                            <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5" />
                          </div>
                          
                          <div className="min-w-[120px] sm:min-w-[135px] md:min-w-[150px]">
                            <p className="text-[9px] sm:text-[9.5px] md:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 whitespace-nowrap">
                              {item.title}
                            </p>
                            
                            {/* Efek Hover Animasi Transisi Data - ruang vertikal lega tanpa terpotong */}
                            <div className="relative min-h-[38px] sm:min-h-[40px] md:min-h-[42px] flex flex-col justify-center">
                              <div className="flex items-center transition-all duration-300 group-hover:opacity-0 group-hover:invisible">
                                 <span className="text-[13px] sm:text-[14px] font-bold text-slate-300 tracking-wide">[ Data ]</span>
                              </div>
                              <div className="absolute inset-0 flex flex-col justify-center transition-all duration-300 opacity-0 invisible group-hover:opacity-100 group-hover:visible pointer-events-none">
                                 <span className="text-[13px] sm:text-[14px] md:text-[15px] font-extrabold text-emerald-700 leading-snug whitespace-nowrap">
                                   {item.value}
                                 </span>
                                 <span className="text-[8px] sm:text-[8.5px] md:text-[9px] font-bold text-emerald-600/70 uppercase tracking-widest leading-none mt-0.5 whitespace-nowrap">
                                   {active === "rapid" ? (isId ? "Contoh" : "Example") : (isId ? "Metrik" : "Metric")}
                                 </span>
                              </div>
                            </div>

                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ======================= KANAN: KONTEN TEKS & TOMBOL CTA ======================= */}
          <div className="lg:col-span-6 lg:pl-16">
            
            {/* Tab Navigasi - Diubah menjadi rounded-full */}
            <div className="inline-flex p-1.5 bg-slate-100 rounded-full mb-10 w-full sm:w-auto">
              <button
                onClick={() => setActive("rapid")}
                className={`flex-1 sm:flex-none px-8 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all duration-300 ${
                  active === "rapid"
                    ? "bg-emerald-700 text-white shadow-md"
                    : "text-slate-500 hover:text-emerald-700 hover:bg-slate-200/50"
                }`}
              >
                Rapid-FS
              </button>
              <button
                onClick={() => setActive("monitor")}
                className={`flex-1 sm:flex-none px-8 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all duration-300 ${
                  active === "monitor"
                    ? "bg-emerald-700 text-white shadow-md"
                    : "text-slate-500 hover:text-emerald-700 hover:bg-slate-200/50"
                }`}
              >
                Monitor
              </button>
            </div>

            <ScrollReveal key={active}>
              <h3 className="text-3xl md:text-4xl font-extrabold text-emerald-950 leading-tight">
                {product.title[isId ? "id" : "en"]}
              </h3>

              <p className="mt-3 font-bold text-emerald-600 text-[15px] md:text-[16px] tracking-wide">
                {product.subtitle[isId ? "id" : "en"]}
              </p>

              <p className="mt-6 text-[15px] md:text-[16px] text-slate-600 leading-[1.8] font-medium max-w-[480px]">
                {product.description[isId ? "id" : "en"]}
              </p>

              {/* Tombol CTA - Diubah menjadi rounded-full dan hanya satu tombol */}
              <div className="mt-12 flex flex-col sm:flex-row gap-4">
                <Link
                  href={`/${lang}${product.href}`}
                  className="group inline-flex items-center justify-center gap-3 px-10 py-4 rounded-full bg-emerald-800 text-white text-[12px] font-bold uppercase tracking-widest hover:bg-emerald-950 transition-colors shadow-sm w-full sm:w-auto"
                >
                  {isId ? "Eksplorasi Produk" : "Explore Product"}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </ScrollReveal>
          </div>
          
        </div>
      </div>
    </section>
  );
}