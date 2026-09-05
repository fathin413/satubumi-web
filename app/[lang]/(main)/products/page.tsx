"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Map,
  Trees,
  Satellite,
  Bell,
  FileText,
  Eye,
  ShieldCheck,
  Leaf,
  LineChart,
  Globe2,
} from "lucide-react";

// Komponen Reveal Inline untuk Animasi Scroll
const Reveal = ({
  children,
  className = "",
  delay = 0,
  slide = "up", // Pilihan arah: 'up', 'left', 'right', 'none'
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  slide?: "up" | "left" | "right" | "none";
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Hanya memutar animasi sekali
        }
      },
      { threshold: 0.15 } // Terpicu saat 15% elemen terlihat
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  let slideClass = "";
  if (!isVisible) {
    if (slide === "up") slideClass = "translate-y-12";
    if (slide === "left") slideClass = "-translate-x-12";
    if (slide === "right") slideClass = "translate-x-12";
  } else {
    if (slide !== "none") slideClass = "translate-y-0 translate-x-0";
  }

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-1000 ease-out ${
        isVisible ? "opacity-100" : "opacity-0"
      } ${slideClass} ${className}`}
    >
      {children}
    </div>
  );
};

export default function ProductsPage() {
  const params = useParams();
  const lang = (params?.lang as string) || "en";
  const isId = lang === "id";

  const rapidVariables = [
    { icon: ShieldCheck, title: "Feasibility Score", value: "85 / 100" },
    { icon: Leaf, title: "Carbon Stock", value: "2.4M tCO₂e" },
    { icon: LineChart, title: "Revenue Projection", value: "$90M" },
    { icon: Globe2, title: "Spatial Risk", value: "Low" },
  ];

  const monitorPoints = isId
    ? [
        {
          icon: Map,
          title: "Peta sebagai pusat",
          body: "Batas proyek, plot, dan titik tanam dalam satu layar. Klien tidak perlu ahli GIS.",
        },
        {
          icon: Trees,
          title: "Pohon yang masih hidup",
          body: "Bukan hanya ‘sudah ditanam’. Survival, pertumbuhan, dan kondisi tampil sebagai angka.",
        },
        {
          icon: Bell,
          title: "Alert, bukan tebak-tebakan",
          body: "Survival rendah, pemantauan telat, anomali tapak — sistem yang menegur, bukan folder yang menunggu dibuka.",
        },
        {
          icon: Satellite,
          title: "Lapangan + satelit",
          body: "Catatan petugas bertemu overlay spasial. Dua sumber, satu proyek.",
        },
        {
          icon: FileText,
          title: "Laporan untuk direksi",
          body: "Ringkasan yang bisa diunduh. Karbon di sini estimasi pemantauan, bukan kredit.",
        },
      ]
    : [
        {
          icon: Map,
          title: "Map first",
          body: "Boundaries, plots, and planting points on one screen. Clients should not need to be GIS analysts.",
        },
        {
          icon: Trees,
          title: "Trees that still stand",
          body: "Not just ‘planted’. Survival, growth, and condition as numbers a director can read.",
        },
        {
          icon: Bell,
          title: "Alerts, not guesswork",
          body: "Low survival, overdue monitoring, site anomalies — the system taps you. The folder does not.",
        },
        {
          icon: Satellite,
          title: "Field plus satellite",
          body: "Officer notes meet spatial overlay. Two sources, one project.",
        },
        {
          icon: FileText,
          title: "A report for the board",
          body: "A snapshot you can export. Carbon here is a monitoring estimate, not a credit.",
        },
      ];

  return (
    <main className="bg-[#F1F6F4] min-h-screen pt-28 font-sans overflow-x-hidden">
      
      {/* ========== RAPID-FS ========== */}
      <section className="relative pt-8 pb-16 lg:pb-20">
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-12 xl:px-16">
          <Reveal slide="right">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-emerald-700 mb-4">
              {isId ? "Produk 01" : "Product 01"}
            </p>
          </Reveal>
          
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 xl:gap-24 items-center">
            
            {/* KONTEN TEKS KIRI */}
            <Reveal slide="right" delay={100} className="w-full">
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-emerald-950 leading-[1.05] mb-6">
                Rapid-FS
              </h1>
              <p className="text-xl md:text-2xl font-semibold text-emerald-900/80 mb-6 leading-snug">
                {isId
                  ? "Apakah tapak ini layak jadi proyek karbon — sebelum modal dan janji keluar."
                  : "Is this site worth a carbon project — before capital and promises leave the room."}
              </p>
              <p className="text-[16px] text-emerald-900/65 font-medium leading-relaxed mb-8">
                {isId
                  ? "Sebagian besar calon klien di tahap awal hanya punya dua hal: luas (hektare) dan koordinat atau poligon. Rapid-FS memakai itu untuk overlay spasial dan menghasilkan Indicative Carbon Project Feasibility Score (ICPFS). Bukan presisi laboratorium. Kecepatannya yang dijual: skor, estimasi karbon, biaya, pendapatan, dan risiko — dalam satu sesi."
                  : "Most prospects at the start have two things: area in hectares, and a coordinate or polygon. Rapid-FS overlays spatial layers and returns an Indicative Carbon Project Feasibility Score (ICPFS). Not lab precision. Speed is the product: score, carbon, cost, revenue, and risk — in a single sitting."}
              </p>
              <ul className="space-y-3 text-[14px] font-semibold text-emerald-950 mb-10">
                <li className="flex gap-3">
                  <BarChart3 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  {isId
                    ? "Skor 0–100 dengan kategori layak / hati-hati / tidak."
                    : "A 0–100 score with clear feasibility bands."}
                </li>
                <li className="flex gap-3">
                  <Map className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  {isId
                    ? "Shapefile atau input manual. Sembilan lapisan overlay."
                    : "Shapefile or manual input. Nine overlay layers."}
                </li>
                <li className="flex gap-3">
                  <Eye className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  {isId
                    ? "Hasil tersimpan di akun. Siap dibawa ke rapat internal."
                    : "Results save to the account. Ready for an internal review."}
                </li>
              </ul>
              <Link
                href={`/${lang}/products/rapid-fs`}
                className="inline-flex items-center gap-2 px-7 py-4 bg-emerald-800 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-900/20"
              >
                {isId ? "Jalankan penilaian" : "Run an assessment"}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="mt-4 text-[12px] font-medium text-amber-800/80">
                {isId
                  ? "Estimasi kelayakan. Bukan kredit karbon tersertifikasi."
                  : "A feasibility estimate. Not a certified carbon credit."}
              </p>
            </Reveal>

            {/* ANIMASI MESIN PERHITUNGAN KANAN */}
            <Reveal slide="left" delay={300} className="flex justify-center relative mt-10 lg:mt-0">
              <div className="relative w-full max-w-[340px] md:max-w-[420px] aspect-square flex items-center justify-center m-auto">
                <div className="absolute inset-0 bg-emerald-400/10 blur-[80px] rounded-full pointer-events-none" />
                <div className="absolute inset-2 border border-emerald-900/10 rounded-full" />
                <div className="absolute inset-6 md:inset-8 border-2 border-dashed border-emerald-500/30 rounded-full animate-[spin_24s_linear_infinite]" />
                <div className="absolute inset-14 md:inset-16 border-[3px] border-dotted border-cyan-400/40 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
                <div className="absolute inset-20 md:inset-24 border border-emerald-300/40 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
                
                <div className="w-28 h-28 md:w-40 md:h-40 bg-white border-4 border-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.3)] relative overflow-hidden z-10 p-5 md:p-8">
                   <div className="absolute inset-0 bg-emerald-100/50 animate-pulse" />
                   <Image 
                     src="/loggo1.png" 
                     alt="Satubumi Center Core" 
                     width={1441} 
                     height={1441} 
                     className="w-full h-full object-contain relative z-10 drop-shadow-md"
                     priority
                   />
                </div>

                <div className="absolute inset-0 w-full h-full animate-product-orbit z-20">
                  {rapidVariables.map((item, index) => {
                    const Icon = item.icon;
                    const positions = [
                      "top-[0%] left-[-10%] md:top-[2%] md:left-[-5%]",
                      "top-[20%] right-[-15%] md:top-[20%] md:right-[-12%]",
                      "bottom-[20%] left-[-15%] md:bottom-[20%] md:left-[-12%]",
                      "bottom-[0%] right-[-10%] md:bottom-[2%] md:right-[-5%]",
                    ];

                    return (
                      <div key={index} className={`absolute ${positions[index]}`}>
                        <div className="animate-product-orbit-reverse">
                          <div className="bg-white/95 backdrop-blur-md shadow-lg border border-slate-100 rounded-2xl p-3 md:p-4 flex items-center gap-3 hover:-translate-y-1 hover:shadow-emerald-500/20 transition-all duration-300 group cursor-pointer">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                              <Icon className="w-4 h-4 md:w-5 md:h-5" />
                            </div>
                            <div className="w-[100px] md:w-[120px]">
                              <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5 truncate" title={item.title}>
                                {item.title}
                              </p>
                              <div className="relative h-7 md:h-9">
                                <div className="absolute inset-0 flex flex-col justify-start transition-opacity duration-300 group-hover:opacity-0 pt-0.5">
                                   <span className="text-[13px] md:text-[14px] font-bold text-slate-300 tracking-wide">[ Data ]</span>
                                </div>
                                <div className="absolute inset-0 flex flex-col justify-start transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                                   <span className="text-[12px] md:text-[15px] font-extrabold text-emerald-700 leading-tight truncate">{item.value}</span>
                                   <span className="text-[8px] md:text-[9px] font-bold text-emerald-600/60 uppercase tracking-widest mt-0.5">
                                     {isId ? "Contoh" : "Example"}
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
            </Reveal>

          </div>
        </div>
      </section>

      {/* ========== MONITOR (FULL SCREEN SECTION) ========== */}
      <section className="relative bg-white min-h-screen flex flex-col border-t border-slate-200/60 overflow-hidden">
        <div className="grid lg:grid-cols-2 flex-1 w-full h-full">
          
          {/* KONTEN KIRI */}
          <div className="px-6 md:px-12 xl:px-24 py-20 flex flex-col justify-center bg-white">
            <Reveal slide="up" delay={0}>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-emerald-700 mb-4">
                {isId ? "Produk 02" : "Product 02"}
              </p>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-emerald-950 leading-tight mb-5">
                Satubumi Monitor
              </h2>
            </Reveal>
            
            <Reveal slide="up" delay={150}>
              <p className="text-[18px] font-semibold text-emerald-900/80 mb-4 max-w-lg">
                {isId
                  ? "Mata digital proyek. Klien memantau dari jauh."
                  : "The project’s digital eye. Clients watch from afar."}
              </p>
              <p className="text-[15px] text-emerald-900/60 font-medium leading-relaxed max-w-xl mb-10">
                {isId
                  ? "Where, what, when, how much, progress — tanpa terbang ke tapak. Petugas mengisi data. Klien melihat kondisi."
                  : "Where, what, when, how much, progress — without flying to site. Officers enter data. Clients see condition."}
              </p>
            </Reveal>

            <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-8 max-w-2xl">
              {monitorPoints.map((item, i) => {
                const Icon = item.icon;
                return (
                  <Reveal key={item.title} slide="up" delay={300 + (i * 100)} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[14px] font-extrabold text-emerald-950 leading-tight mb-1.5">
                        {item.title}
                      </p>
                      <p className="text-[13px] text-emerald-900/60 font-medium leading-relaxed">
                        {item.body}
                      </p>
                    </div>
                  </Reveal>
                );
              })}
            </ul>

            <Reveal slide="up" delay={600} className="mt-12 pt-8 border-t border-slate-100">
              <p className="text-[12px] font-bold text-emerald-900/40 uppercase tracking-widest max-w-md">
                {isId
                  ? "Platform terpisah. Akses per proyek, diberikan tim SATUBUMI."
                  : "A separate platform. Access per project, granted by SATUBUMI."}
              </p>
            </Reveal>
          </div>

          {/* GAMBAR KANAN (Full Height Cover) */}
          <Reveal slide="none" delay={400} className="relative min-h-[500px] lg:min-h-screen w-full bg-emerald-950">
            <Image
              src="/monitor-devicesa.png"
              alt="Satubumi Monitor Platform"
              fill
              className="object-cover object-center scale-[1.02] hover:scale-[1.05] transition-transform duration-1000 ease-out"
              sizes="(min-width: 1024px) 50vw, 100vw"
              quality={90}
            />
            {/* Overlay Halus untuk Blend ke warna background */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/20 to-transparent pointer-events-none" />
          </Reveal>
          
        </div>
      </section>
    </main>
  );
}