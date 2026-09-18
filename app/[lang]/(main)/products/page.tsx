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
  Users,
  Sparkles,
  Target,
  CheckCircle2,
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

  const fiveQuestions = isId
    ? [
        { word: "Where?", desc: "Di mana batas & lokasi proyek?" },
        { word: "What?", desc: "Apa kejadian & aksi di tapak?" },
        { word: "When?", desc: "Kapan perubahan berlangsung?" },
        { word: "How much?", desc: "Seberapa besar capaiannya?" },
        { word: "Progress?", desc: "Apakah sesuai target proyek?" },
      ]
    : [
        { word: "Where?", desc: "Where is the project boundary?" },
        { word: "What?", desc: "What activities are happening?" },
        { word: "When?", desc: "When did shifts take place?" },
        { word: "How much?", desc: "Quantified metric outcomes" },
        { word: "Progress?", desc: "Is delivery on milestone?" },
      ];

  const monitorModules = isId
    ? [
        {
          icon: Trees,
          title: "Tree Survival & Pertumbuhan",
          body: "Bukan hanya 'jumlah ditanam'. Sistem menghitung survival rate %, pohon hidup/mati, tinggi, dan DBH per pohon secara akurat.",
        },
        {
          icon: Bell,
          title: "Early Warning & Environmental Alert",
          body: "Peringatan proaktif instan jika terdeteksi hotspot api, deforestasi, anomali tutupan lahan, atau pemantauan yang telat.",
        },
        {
          icon: ShieldCheck,
          title: "Digital Evidence (Audit-Ready)",
          body: "Integritas data mutlak: WHO + WHERE + WHEN + WHAT + EVIDENCE. Foto ber-geotag GPS dari ranger lapangan siap untuk verifikasi.",
        },
        {
          icon: Satellite,
          title: "Multi-Year Satellite Time Series",
          body: "Bandingkan tutupan hutan dari waktu ke waktu (2022 → 2024 → 2026). Perpaduan citra satelit resolusi tinggi dan verifikasi darat.",
        },
        {
          icon: Leaf,
          title: "Pemetaan Biodiversitas & Satwa",
          body: "Pencatatan dan pemetaan titik sebaran flora-fauna langka secara spasial dan temporal lengkap dengan foto per plot monitoring.",
        },
        {
          icon: Users,
          title: "Dampak Komunitas & Sosial",
          body: "Pantau desa binaan, jumlah penerima manfaat (beneficiaries), kelompok agroforestry, dan dampak ekonomi masyarakat lokal.",
        },
      ]
    : [
        {
          icon: Trees,
          title: "Tree Survival & Growth Tracking",
          body: "Beyond 'trees planted', track live vs dead counts, survival rate %, height, and DBH per tree with continuous growth analytics.",
        },
        {
          icon: Bell,
          title: "Early Warning & Environmental Alerts",
          body: "Proactive automated notifications for fire hotspots, deforestation alerts, land cover shifts, and overdue field monitoring.",
        },
        {
          icon: ShieldCheck,
          title: "Audit-Ready Digital Evidence",
          body: "Strict data integrity: WHO + WHERE + WHEN + WHAT + EVIDENCE. Geotagged field photos and GPS logs ready for external audits.",
        },
        {
          icon: Satellite,
          title: "Multi-Year Satellite Time Series",
          body: "Track landscape changes across years (2022 → 2024 → 2026) uniting high-res satellite monitoring with ground-truthing.",
        },
        {
          icon: Leaf,
          title: "Biodiversity & Wildlife Mapping",
          body: "Record and map endangered flora and fauna sightings spatially and temporally with photos, plot locations, and habitat status.",
        },
        {
          icon: Users,
          title: "Community & Socio-Economic Impact",
          body: "Measure assisted villages, beneficiary counts, agroforestry groups, and local livelihood creation alongside ecological impact.",
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

      {/* ========== MONITOR (SELURUH SECTION MENGIKUTI UKURAN GAMBAR) ========== */}
      <section id="monitor" className="relative bg-white border-t border-slate-200/60 overflow-hidden">
        <div className="relative w-full flex flex-col lg:block">

          {/* KONTEN KIRI (Mengikuti Tinggi Gambar & Teratur dengan Scroll Vertikal yang Aman) */}
          <div className="w-full lg:w-1/2 lg:absolute lg:inset-y-0 lg:left-0 bg-white overflow-y-auto z-10 px-6 sm:px-10 md:px-12 lg:px-8 xl:px-14 2xl:px-20 pt-10 sm:pt-12 lg:pt-14 pb-8 sm:pb-10 lg:pb-12">
            <div className="min-h-full flex flex-col justify-center my-auto">
              
              {/* Header Tag & Title */}
              <Reveal slide="up" delay={0}>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-800 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.2em] mb-2.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  {isId ? "Produk 02 • Digital Monitoring Platform" : "Product 02 • Digital Monitoring Platform"}
                </div>
                <h2 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold tracking-tight text-emerald-950 leading-tight mb-2 sm:mb-3">
                  Satubumi Monitor
                </h2>
              </Reveal>
              
              {/* Tagline & Nilai Utama */}
              <Reveal slide="up" delay={100}>
                <p className="text-[14px] sm:text-[16px] xl:text-[17px] font-semibold text-emerald-900/85 leading-snug mb-1.5 sm:mb-2 max-w-2xl">
                  {isId
                    ? "Mata digital proyek berbasis alam. Pantau perkembangan, integritas tapak, dan pencapaian target dari jauh tanpa harus terbang ke lokasi."
                    : "The digital eye for nature-based projects. Monitor site integrity, progress, and target delivery from afar without flying to site."}
                </p>
                <p className="text-[12px] sm:text-[13px] text-emerald-900/65 font-medium leading-relaxed max-w-2xl mb-4 sm:mb-5">
                  {isId
                    ? "Bukan sekadar peta biasa, melainkan ekosistem terpadu yang memadukan citra satelit resolusi tinggi, data lapangan terverifikasi, linimasa bukti foto, dan indikator dampak sosial-ekologis."
                    : "Not just a static map, but an integrated ecosystem combining high-resolution satellite layers, verified field inputs, digital photo evidence, and socio-ecological impact indicators."}
                </p>
              </Reveal>

              {/* 5 PERTANYAAN KUNCI DARI PDF */}
              <Reveal slide="up" delay={180} className="mb-4 sm:mb-5">
                <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3 sm:p-3.5">
                  <p className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-emerald-800/80 mb-2 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-emerald-600" />
                    {isId ? "5 Pertanyaan Utama yang Dijawab Sistem:" : "5 Core Questions Answered by the Platform:"}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    {fiveQuestions.map((q) => (
                      <div key={q.word} className="bg-white rounded-lg p-2 border border-slate-200/60 shadow-xs">
                        <p className="text-[11px] font-black text-emerald-950 uppercase tracking-wider mb-0.5">
                          {q.word}
                        </p>
                        <p className="text-[10px] text-emerald-900/70 font-medium leading-tight line-clamp-2">
                          {q.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>

              {/* MODUL FITUR UTAMA DARI PDF */}
              <div className="grid sm:grid-cols-2 gap-x-4 gap-y-2.5 xl:gap-x-6 xl:gap-y-3.5 max-w-3xl mb-4 sm:mb-5">
                {monitorModules.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <Reveal key={item.title} slide="up" delay={220 + (i * 60)} className="flex gap-2.5 sm:gap-3 items-start group">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300 shadow-xs">
                        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <div>
                        <p className="text-[12px] sm:text-[13px] font-extrabold text-emerald-950 leading-tight mb-0.5">
                          {item.title}
                        </p>
                        <p className="text-[11px] sm:text-[11.5px] text-emerald-900/65 font-medium leading-snug">
                          {item.body}
                        </p>
                      </div>
                    </Reveal>
                  );
                })}
              </div>

              {/* ACTION FOOTER */}
              <Reveal slide="up" delay={550} className="pt-3 sm:pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-[11px] sm:text-[12px] font-semibold text-emerald-900/50 max-w-sm leading-relaxed">
                  {isId
                    ? "Platform terpisah. Hak akses per proyek diberikan secara resmi oleh tim SATUBUMI."
                    : "A dedicated platform. Project-level access provisioned by the SATUBUMI team."}
                </p>
                <Link
                  href={`/${lang}/contact`}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:py-3 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-[12px] sm:text-[13px] rounded-xl transition-all shadow-md shadow-emerald-900/15 shrink-0"
                >
                  {isId ? "Konsultasikan Akses Platform" : "Request Platform Access"}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </Reveal>

            </div>
          </div>

          {/* GAMBAR KANAN: Penentu Tunggal Tinggi Seluruh Section (Master Driver) */}
          <div className="w-full lg:w-1/2 lg:ml-auto relative bg-[#061e16] overflow-hidden block">
            <Reveal
              slide="none"
              delay={150}
              className="relative w-full block"
            >
              <Image
                src="/monitor.png"
                alt="Satubumi Monitor Platform"
                width={3243}
                height={4053}
                className="w-full h-auto block"
                sizes="(min-width: 1024px) 50vw, 100vw"
                quality={100}
                priority
              />
            </Reveal>
          </div>
          
        </div>
      </section>
    </main>
  );
}