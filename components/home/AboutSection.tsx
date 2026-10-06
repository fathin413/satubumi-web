import Link from "next/link";
import { ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";

import ScrollReveal from "../ScrollReveal";

interface AboutSectionProps {
  lang: string;
  isId: boolean;
  content: string;
}

export default function AboutSection({
  lang,
  isId,
  content,
}: AboutSectionProps) {
  return (
    // Padding atas-bawah (py) dipangkas drastis agar tidak memakan full screen
    <section className="relative w-full py-12 lg:py-16 bg-[#fdfdfd] border-t border-slate-100 font-sans overflow-hidden">
      
      {/* ================= BACKGROUND ELEMENTS ================= */}
      {/* Soft Emerald Glow di sudut */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-400/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-[-10%] w-[500px] h-[500px] bg-emerald-600/5 blur-[120px] rounded-full pointer-events-none" />

      {/* ================= MAIN CONTENT ================= */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 relative z-10">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* ================= KIRI: EDITORIAL COPY ================= */}
          <ScrollReveal className="lg:col-span-6 flex flex-col items-start text-left">
            
            {/* Badge Kategori */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-50 border border-emerald-100 mb-6">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-700">
                {isId ? "Tentang Kami" : "About Us"}
              </span>
            </div>

            {/* Judul Utama dengan Text Gradient */}
            <h2 className="text-4xl md:text-5xl lg:text-[4rem] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-950 via-emerald-800 to-emerald-600 leading-[1.05] tracking-tight mb-4">
              Satubumi
            </h2>

            {/* Subjudul */}
            <p className="text-[16px] md:text-[17px] text-slate-600 font-medium max-w-[500px] mb-8 leading-[1.7]">
              {isId
                ? "Konsultan pengembangan solusi iklim dan keberlanjutan berbasis keahlian spesifik."
                : "Climate and sustainability solutions development consultant driven by specific expertise."}
            </p>

            {/* Feature Checklist */}
            <div className="flex flex-col gap-3 w-full max-w-md mb-8">
              <div className="flex items-center gap-4 bg-white px-4 py-3 rounded-lg shadow-sm border border-slate-100">
                <div className="w-8 h-8 rounded-md bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-[13px] md:text-[14px] text-emerald-950 font-bold tracking-wide">
                  {isId ? "Pendekatan Berbasis Ilmiah" : "Science-Based Approach"}
                </span>
              </div>

              <div className="flex items-center gap-4 bg-white px-4 py-3 rounded-lg shadow-sm border border-slate-100">
                <div className="w-8 h-8 rounded-md bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-[13px] md:text-[14px] text-emerald-950 font-bold tracking-wide">
                  {isId ? "Dampak Nyata & Terukur" : "Measurable Real Impact"}
                </span>
              </div>
            </div>

            {/* CTA Button */}
            <Link
              href={`/${lang}/about`}
              className="group inline-flex items-center justify-center gap-3 px-6 py-3 rounded-md bg-emerald-800 text-white text-[12px] font-bold uppercase tracking-widest hover:bg-emerald-950 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              {isId ? "Pelajari Profil Kami" : "Read Our Full Profile"}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

          </ScrollReveal>

          {/* ================= KANAN: CLEAN CARD ================= */}
          <ScrollReveal
            delay="delay-200"
            className="lg:col-span-6 w-full lg:pl-10"
          >
            <div className="relative w-full">
              
              {/* Ornamen Dot Pattern Halus */}
              <div className="absolute -top-5 -right-5 w-24 h-24 bg-[radial-gradient(#10b981_2px,transparent_2px)] [background-size:16px_16px] opacity-20" />
              
              {/* Kartu Utama (Padding disesuaikan p-8 md:p-10 agar lebih ringkas) */}
              <div className="relative bg-white rounded-xl p-8 md:p-10 shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                
                {/* Garis Aksen Tipis di Atas Kartu */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-600" />
                
                <div className="relative z-10">
                  {/* Header Panel */}
                  <h3 className="text-2xl md:text-3xl font-extrabold text-emerald-950 mb-4 leading-tight tracking-tight">
                    {isId ? "Lingkup Jasa Konsultan" : "Scope of Consultancy"}
                  </h3>

                  {/* Teks Deskripsi */}
                  <p className="text-[15px] md:text-[16px] text-slate-600 leading-[1.8] font-medium">
                    {content}
                  </p>
                </div>

              </div>
            </div>
          </ScrollReveal>

        </div>
      </div>
    </section>
  );
}