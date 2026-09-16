"use client";

import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useCallback,
} from "react";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface AutoShrinkTextProps {
  children: string;
  className?: string;
  containerClassName?: string;
  as?: "span" | "div" | "h1" | "h2" | "p";
  safetyMargin?: number;
}

export default function AutoShrinkText({
  children,
  className = "",
  containerClassName = "",
  as: Component = "span",
  safetyMargin = 0.95,
}: AutoShrinkTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLElement>(null);
  const [fontSize, setFontSize] = useState<number | null>(null);

  const calculateFit = useCallback(() => {
    if (!containerRef.current || !measureRef.current) return;

    const containerWidth = containerRef.current.clientWidth;
    if (containerWidth <= 0) return;

    // Sediakan margin aman (default 5%) agar drop-shadow atau font italic tidak terpotong
    const availableWidth = containerWidth * safetyMargin;

    // Ukur lebar teks asli pada ukuran clamp CSS default
    const naturalWidth = measureRef.current.offsetWidth;
    const computedStyle = window.getComputedStyle(measureRef.current);
    const baseFontSize = parseFloat(computedStyle.fontSize) || 16;

    if (naturalWidth <= 0) return;

    let targetFontSize: number | null = null;

    if (naturalWidth > availableWidth) {
      // Jika melebihi lebar kontainer, kecilkan font secara proporsional
      const scale = availableWidth / naturalWidth;
      targetFontSize = Math.floor(baseFontSize * scale * 10) / 10;
    }

    // Validasi langsung dengan scrollWidth elemen sebenarnya untuk mencegah font italic atau subpixel terpotong
    if (textRef.current) {
      const currentFontSize = targetFontSize || baseFontSize;
      textRef.current.style.fontSize = `${currentFontSize}px`;
      const actualWidth = textRef.current.scrollWidth;

      if (actualWidth > availableWidth) {
        const correctionScale = availableWidth / actualWidth;
        targetFontSize = Math.floor(currentFontSize * correctionScale * 10) / 10;
        textRef.current.style.fontSize = `${targetFontSize}px`;
      } else if (!targetFontSize) {
        textRef.current.style.fontSize = "";
      }
    }

    setFontSize(targetFontSize);
  }, [safetyMargin]);

  useIsomorphicLayoutEffect(() => {
    calculateFit();
  }, [children, className, calculateFit]);

  useEffect(() => {
    if (!containerRef.current) return;

    calculateFit();

    // Recalculate saat container di-resize
    const resizeObserver = new ResizeObserver(() => {
      calculateFit();
    });
    resizeObserver.observe(containerRef.current);

    // Recalculate saat window di-resize
    const handleResize = () => calculateFit();
    window.addEventListener("resize", handleResize);

    // Recalculate saat custom web font selesai di-load
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(() => {
        calculateFit();
      });
    }

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, [calculateFit]);

  return (
    <div
      ref={containerRef}
      className={`w-full max-w-full overflow-hidden flex items-center justify-center min-w-0 ${containerClassName}`}
    >
      {/* Elemen tersembunyi untuk mengukur lebar asli teks dengan styling bawaan */}
      <span
        ref={measureRef}
        className={`${className} whitespace-nowrap inline-block`}
        aria-hidden="true"
        style={{
          position: "absolute",
          visibility: "hidden",
          pointerEvents: "none",
          top: "-99999px",
          left: "-99999px",
          whiteSpace: "nowrap",
          zIndex: -100,
          opacity: 0,
        }}
      >
        {children}
      </span>

      {/* Elemen teks visual yang otomatis menyesuaikan ukuran font */}
      <Component
        ref={textRef as any}
        className={`${className} whitespace-nowrap inline-block`}
        style={
          fontSize
            ? {
                fontSize: `${fontSize}px`,
                lineHeight: 1.1,
              }
            : undefined
        }
      >
        {children}
      </Component>
    </div>
  );
}
