"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Plus, Trash2, Type, AlertTriangle } from "lucide-react";
import RichTextEditor from "@/components/admin/RichTextEditor";

export type ContentBlock =
  | { id: string; type: "text"; htmlId: string; htmlEn: string }
  | {
      id: string;
      type: "image";
      url: string;
      captionId: string;
      captionEn: string;
      file?: File;
    };

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function parseBlocks(
  rawId?: string | null,
  rawEn?: string | null,
): ContentBlock[] {
  const asArr = (raw?: string | null) => {
    if (!raw || raw === "-") return [] as any[];
    try {
      const data = JSON.parse(raw);
      if (Array.isArray(data) && data[0]?.type) return data;
    } catch {
      /* html lama */
    }
    return raw ? [{ type: "text", html: raw }] : [];
  };

  const a = asArr(rawId);
  const b = asArr(rawEn);
  const len = Math.max(a.length, b.length, 1);

  return Array.from({ length: len }, (_, i) => {
    const left = a[i];
    const right = b[i];
    const kind = left?.type || right?.type || "text";

    if (kind === "image") {
      return {
        id: uid(),
        type: "image" as const,
        url: left?.url || right?.url || "",
        captionId: left?.type === "image" ? left.caption || "" : "",
        captionEn: right?.type === "image" ? right.caption || "" : "",
      };
    }

    return {
      id: uid(),
      type: "text" as const,
      htmlId: left?.type === "text" ? left.html || "" : "",
      htmlEn: right?.type === "text" ? right.html || "" : "",
    };
  });
}

export function serializeBlocks(blocks: ContentBlock[], lang: "id" | "en") {
  return JSON.stringify(
    blocks.map((bl) =>
      bl.type === "image"
        ? {
            type: "image",
            url: bl.url,
            caption: lang === "id" ? bl.captionId : bl.captionEn,
          }
        : {
            type: "text",
            html: lang === "id" ? bl.htmlId : bl.htmlEn,
          },
    ),
  );
}

type Props = {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
  lang?: "id" | "en";
};

export default function ContentBlocksEditor({
  blocks,
  onChange,
  lang = "id",
}: Props) {
  const isId = lang === "id";
  
  // State untuk konfirmasi pop up Hapus (Teks/Gambar Isi Artikel)
  const [deletePrompt, setDeletePrompt] = useState<{
    type: "image" | "block";
    index: number;
  } | null>(null);

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const update = (i: number, patch: Partial<ContentBlock>) => {
    const next = [...blocks];
    next[i] = { ...next[i], ...patch } as ContentBlock;
    onChange(next);
  };

  const executeDelete = () => {
    if (!deletePrompt) return;
    
    if (deletePrompt.type === "block") {
      onChange(blocks.filter((_, x) => x !== deletePrompt.index));
    } else if (deletePrompt.type === "image") {
      update(deletePrompt.index, { file: undefined, url: "" });
    }
    
    setDeletePrompt(null);
  };

  return (
    <div className="space-y-4">
      
      {/* CONFIRMATION POPUP MODAL (UNTUK HAPUS BLOK & FOTO DI DALAM ARTIKEL) */}
      {deletePrompt && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden relative animate-in zoom-in-[0.5] fade-in duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]">
            <div className="p-10 text-center">
              <div className="w-20 h-20 bg-rose-50 rounded-[1.8rem] flex items-center justify-center mx-auto mb-6 border border-rose-100 relative">
                <div className="absolute inset-0 rounded-[1.8rem] border-2 border-rose-200 animate-ping opacity-50 duration-1000" />
                <AlertTriangle className="w-10 h-10 text-rose-500 relative z-10" />
              </div>

              <h3 className="text-2xl font-extrabold text-slate-800 mb-3 tracking-tight">
                {deletePrompt.type === "image" 
                  ? (isId ? "Hapus Foto Ini?" : "Delete This Photo?")
                  : (isId ? "Hapus Blok Ini?" : "Delete This Block?")}
              </h3>

              <p className="text-slate-500 text-[14.5px] mb-8 leading-relaxed px-2">
                {deletePrompt.type === "image"
                  ? (isId ? "Apakah Anda yakin ingin menghapus foto di dalam konten ini?" : "Are you sure you want to delete this inline image?")
                  : (isId ? "Apakah Anda yakin ingin menghapus seluruh blok (teks/gambar) ini secara permanen?" : "Are you sure you want to delete this entire block permanently?")}
              </p>

              <div className="flex flex-col-reverse sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setDeletePrompt(null)}
                  className="flex-1 py-4 bg-slate-50 border border-slate-200 text-slate-600 text-[14.5px] font-bold rounded-2xl hover:bg-slate-100 transition-colors active:scale-95"
                >
                  {isId ? "Batalkan" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={executeDelete}
                  className="flex-1 py-4 bg-rose-600 text-white text-[14.5px] font-bold rounded-2xl hover:bg-rose-700 flex items-center justify-center gap-2 transition-all duration-300 shadow-md shadow-rose-600/20 active:scale-95"
                >
                  <Trash2 className="w-4 h-4" />
                  {isId ? "Ya, Hapus" : "Yes, Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {blocks.map((b, i) => (
        <div
          key={b.id}
          className="border border-slate-200 rounded-2xl overflow-hidden bg-white"
        >
          <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-100">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              {b.type === "text"
                ? isId
                  ? "Teks"
                  : "Text"
                : isId
                  ? "Gambar"
                  : "Image"}
              <span className="ml-2 font-medium text-slate-300">
                {isId ? "ID" : "EN"}
              </span>
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                className="p-1.5 rounded-lg hover:bg-white"
                onClick={() => move(i, -1)}
              >
                <ArrowUp className="w-4 h-4 text-slate-500" />
              </button>
              <button
                type="button"
                className="p-1.5 rounded-lg hover:bg-white"
                onClick={() => move(i, 1)}
              >
                <ArrowDown className="w-4 h-4 text-slate-500" />
              </button>
              
              {/* TOMBOL HAPUS BLOK (MEMUNCULKAN POP-UP) */}
              <button
                type="button"
                className="p-1.5 rounded-lg hover:bg-rose-50"
                onClick={() => setDeletePrompt({ type: "block", index: i })}
              >
                <Trash2 className="w-4 h-4 text-rose-500" />
              </button>
            </div>
          </div>

          {b.type === "text" ? (
            <RichTextEditor
              key={`${b.id}-${lang}`}
              value={isId ? b.htmlId : b.htmlEn}
              onChange={(html) =>
                update(i, isId ? { htmlId: html } : { htmlEn: html })
              }
            />
          ) : (
            <div className="p-4 space-y-3">
              {b.url ? (
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden border-4 border-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] group bg-slate-100">
                  <img
                    src={b.url}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/30 flex items-start justify-end gap-2 p-4 opacity-0 group-hover:opacity-100 transition-colors duration-300">
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-white/90 text-slate-700 text-sm font-bold rounded-xl cursor-pointer shadow-lg transition-transform hover:scale-105">
                      <ImagePlus className="w-4 h-4" />
                      {isId ? "Ganti" : "Change"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          update(i, { file: f, url: URL.createObjectURL(f) });
                          e.target.value = "";
                        }}
                      />
                    </label>
                    
                    {/* TOMBOL HAPUS GAMBAR INLINE (MEMUNCULKAN POP-UP) */}
                    <button
                      type="button"
                      onClick={() => setDeletePrompt({ type: "image", index: i })}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600/90 text-white text-sm font-bold rounded-xl shadow-lg transition-transform hover:scale-105"
                    >
                      <Trash2 className="w-4 h-4" />
                      {isId ? "Hapus" : "Delete"}
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full p-8 border-2 border-dashed border-slate-300 rounded-2xl bg-white hover:bg-emerald-50 hover:border-emerald-300 cursor-pointer group transition-all">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-3 text-slate-400 group-hover:text-emerald-600 group-hover:scale-110 transition-all shadow-sm">
                    <ImagePlus className="w-5 h-5" />
                  </div>
                  <span className="text-[13px] font-bold text-slate-700">
                    {isId ? "Pilih gambar isi" : "Choose inline image"}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      update(i, { file: f, url: URL.createObjectURL(f) });
                      e.target.value = "";
                    }}
                  />
                </label>
              )}

              <input
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm"
                placeholder={
                  isId ? "Keterangan foto (ID)" : "Photo caption (EN)"
                }
                value={isId ? b.captionId || "" : b.captionEn || ""}
                onChange={(e) =>
                  update(
                    i,
                    isId
                      ? { captionId: e.target.value }
                      : { captionEn: e.target.value },
                  )
                }
              />
            </div>
          )}
        </div>
      ))}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() =>
            onChange([
              ...blocks,
              { id: uid(), type: "text", htmlId: "", htmlEn: "" },
            ])
          }
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[13px] font-bold text-slate-700 hover:bg-white transition-colors"
        >
          <Type className="w-4 h-4" />
          {isId ? "+ Teks" : "+ Text"}
        </button>
        <button
          type="button"
          onClick={() =>
            onChange([
              ...blocks,
              {
                id: uid(),
                type: "image",
                url: "",
                captionId: "",
                captionEn: "",
              },
            ])
          }
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-[13px] font-bold text-emerald-800 hover:bg-emerald-100 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {isId ? "+ Gambar" : "+ Image"}
        </button>
      </div>
    </div>
  );
}