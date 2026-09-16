"use client";

import { useCallback, useState } from "react";
import Cropper, { Area } from "react-easy-crop";

type Props = {
  imageSrc: string;
  onCancel: () => void;
  onComplete: (file: File) => void;
  aspect?: number;
};

async function getCroppedFile(
  imageSrc: string,
  pixelCrop: Area,
  fileName = "cropped.jpg"
): Promise<File> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Crop failed"));
          return;
        }
        resolve(new File([blob], fileName, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92
    );
  });
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", (e) => reject(e));
    img.setAttribute("crossOrigin", "anonymous");
    img.src = url;
  });
}

export default function ImageCropModal({
  imageSrc,
  onCancel,
  onComplete,
  aspect = 16 / 9,
}: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [cropError, setCropError] = useState<string | null>(null);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setBusy(true);
    setCropError(null);
    try {
      const file = await getCroppedFile(imageSrc, croppedAreaPixels);
      onComplete(file);
    } catch (e) {
      console.error(e);
      setCropError("Gagal memotong gambar. Coba format file lain.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <p className="font-extrabold text-emerald-950">Crop gambar</p>
            <p className="text-xs text-emerald-900/50 font-medium mt-0.5">
              Rasio 16:9 · geser & zoom sesuai kebutuhan
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-sm font-bold text-slate-500 hover:text-slate-800"
          >
            Batal
          </button>
        </div>

        <div className="relative h-72 md:h-96 bg-slate-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="text-xs font-bold text-emerald-900/60 uppercase tracking-wider">
              Zoom
            </label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full mt-2 accent-emerald-600"
            />
          </div>

          {cropError && (
            <p className="text-xs text-rose-600 font-medium bg-rose-50 border border-rose-100 px-3 py-2 rounded-xl">
              {cropError}
            </p>
          )}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl border border-emerald-100 text-emerald-800 font-bold text-sm hover:bg-emerald-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={busy}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 disabled:opacity-60"
            >
              {busy ? "Memproses..." : "Pakai gambar ini"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}