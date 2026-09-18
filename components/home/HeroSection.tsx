"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import ScrollReveal from "../ScrollReveal";

// =====================================================================
// KOMPONEN KHUSUS: Mengunci Teks 1 Baris & Mengecilkan Font Otomatis
// =====================================================================
function FitOneLineText({ text, className }: { text: string; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const resizeTextToFit = () => {
      if (!containerRef.current || !textRef.current) return;
      
      // 1. Reset font-size ke ukuran bawaan dari kelas Tailwind (clamp)
      textRef.current.style.fontSize = "";
      
      const containerWidth = containerRef.current.clientWidth;
      const textWidth = textRef.current.scrollWidth;
      
      // 2. Jika lebar teks melebihi lebar kontainer, kecilkan font-nya
      if (textWidth > containerWidth && containerWidth > 0) {
        // Ambil ukuran font saat ini (dalam pixel)
        const currentFontSize = parseFloat(window.getComputedStyle(textRef.current).fontSize);
        
        // Cari rasio penyusutan yang dibutuhkan
        const ratio = containerWidth / textWidth;
        
        // Terapkan ukuran baru (dikurangi 2px sebagai jarak aman/buffer)
        const newSize = (currentFontSize * ratio) - 2;
        textRef.current.style.fontSize = `${newSize}px`;
      }
    };

    resizeTextToFit();
    window.addEventListener("resize", resizeTextToFit);
    
    // Pastikan font sudah termuat sebelum kalkulasi dijalankan ulang
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(resizeTextToFit);
    }
    
    return () => window.removeEventListener("resize", resizeTextToFit);
  }, [text]);

  return (
    // overflow-visible memastikan ekor huruf (seperti 'g' atau 'y') tidak terpotong
    <div ref={containerRef} className="w-full flex justify-center items-center overflow-visible">
      {/* whitespace-nowrap adalah kunci absolut agar teks HARAM turun ke baris kedua */}
      <span 
        ref={textRef} 
        className={`whitespace-nowrap inline-block px-2 pb-3 md:pb-4 ${className || ""}`}
      >
        {text}
      </span>
    </div>
  );
}

// =====================================================================
// MAIN HERO SECTION COMPONENT
// =====================================================================
interface HeroSectionProps {
  lang: string;
  isId: boolean;
  title: string;
  highlight?: string;
  subtitle: string;
  images: string[];
}

export default function HeroSection({
  lang,
  isId,
  title,
  highlight,
  subtitle,
  images,
}: HeroSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  // Logika rotasi gambar & trigger awal untuk animasi zoom
  useEffect(() => {
    setIsMounted(true); 

    if (!images || images.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 6000); 
    
    return () => clearInterval(interval);
  }, [images]);

  return (
    // min-h-screen memastikan hero selalu memenuhi satu layar penuh (tidak mengecil saat teks pendek/panjang)
    <section className="relative w-full flex flex-col justify-center min-h-screen min-h-[100dvh] pt-28 pb-20 z-0 overflow-hidden font-sans">
      
      {/* ================= BACKGROUND IMAGE ANIMATION & GREEN FILTER ================= */}
      <div className="absolute inset-0 z-0 bg-[#01140a] overflow-hidden pointer-events-none">
        
        {/* Render gambar dengan perbaikan logika transisi yang dijamin mulus */}
        {images.map((src, index) => {
          const isActive = index === currentIndex;
          
          return (
            <div
              key={index}
              className="absolute inset-0 w-full h-full"
              style={{
                opacity: isActive ? 1 : 0,
                zIndex: isActive ? 10 : 0,
                transition: "opacity 2.5s ease-in-out", 
              }}
            >
              <img
                src={src}
                alt={`Hero Background ${index + 1}`}
                className="w-full h-full object-cover"
                style={{
                  transform: isMounted && isActive ? "scale(1.15)" : "scale(1)",
                  transition: "transform 10s linear", 
                }}
              />
            </div>
          );
        })}

        {/* Lapis 1: Multiply Emerald dikurangi opacity-nya agar gambar lebih terlihat */}
        <div className="absolute inset-0 bg-emerald-950/50 mix-blend-multiply z-20" />
        
        {/* Lapis 2: Overlay hijau gelap dikurangi opacity-nya */}
        <div className="absolute inset-0 bg-[#02180e]/60 z-20" />
        
        {/* Lapis 3: Transisi Mulus ke Section Bawah */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#052e16] via-[#052e16]/40 to-transparent z-20" />
      </div>

      {/* ================= CONTENT CONTAINER ================= */}
      {/* my-auto memastikan konten selalu vertikal di tengah layar 100vh */}
      <div className="relative z-30 w-full max-w-[1440px] mx-auto px-4 lg:px-12 flex flex-col items-center justify-center text-center my-auto">
        <ScrollReveal baseClass="opacity-0 translate-y-12" className="flex flex-col items-center relative w-full overflow-visible">
          
          {/* Badge / Eyebrow */}
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-emerald-500/30 bg-[#052e16]/50 backdrop-blur-md mb-8 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold text-emerald-100 uppercase tracking-[0.25em]">
              {isId ? "Inisiatif Keberlanjutan" : "Sustainability Initiative"}
            </span>
          </div>

          {/* HEADLINE: Memanggil komponen FitOneLineText yang menjamin 1 baris */}
          <h1 className="w-full max-w-full flex flex-col items-center font-extrabold text-white leading-[0.9] drop-shadow-2xl mb-8">
            <FitOneLineText 
              text={title} 
              className="font-extrabold tracking-tight text-[clamp(2rem,7vw,6.5rem)] text-white" 
            />
            
            {highlight && (
              <FitOneLineText 
                text={highlight} 
                className="font-serif italic font-light text-emerald-400 drop-shadow-xl -mt-2 md:-mt-4 text-[clamp(2.5rem,8vw,7.5rem)] tracking-tight" 
              />
            )}
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl lg:text-2xl text-emerald-50 font-medium leading-relaxed mb-12 max-w-3xl drop-shadow-md whitespace-normal">
            {subtitle}
          </p>

          {/* Grup Tombol */}
          <div className="flex flex-col sm:flex-row items-center gap-5 w-full sm:w-auto">
            <Link
              href={`/${lang}/about`}
              className="w-full sm:w-auto px-8 py-4 bg-emerald-600 text-white text-[15px] font-bold rounded-full hover:bg-emerald-500 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(16,185,129,0.4)] group focus:outline-none focus:ring-4 focus:ring-emerald-500/50"
            >
              {isId ? "Pelajari Pendekatan Kami" : "Discover Our Approach"}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link
              href={`/${lang}/products`}
              className="w-full sm:w-auto px-8 py-4 bg-transparent border border-white/40 text-white text-[15px] font-bold rounded-full hover:bg-white/10 hover:border-white transition-all duration-300 text-center focus:outline-none focus:ring-4 focus:ring-emerald-500/50 backdrop-blur-sm"
            >
              {isId ? "Lihat Produk" : "Explore Products"}
            </Link>
          </div>

        </ScrollReveal>
      </div>
    </section>
  );
}