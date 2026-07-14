"use client";

import Cropper, { type Area } from "react-easy-crop";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cropToJpeg } from "./crop";

export type AspectChoice = { label: string; value: number; outWidth: number; outHeight: number };

export function ImageCropModal({
  src,
  aspects,
  title = "Ořízni fotku",
  onCancel,
  onDone,
}: {
  src: string | null;
  aspects: AspectChoice[];
  title?: string;
  onCancel: () => void;
  onDone: (blob: Blob, aspect: AspectChoice) => void | Promise<void>;
}) {
  const [aspect, setAspect] = useState(aspects[0]!);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPixels, setAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  if (!src) return null;

  return (
    <Modal open={!!src} onClose={onCancel} title={title}>
      <div className="relative h-80 overflow-hidden rounded-card border-2 border-vinyl bg-vinyl">
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          aspect={aspect.value}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(_area, px) => setAreaPixels(px)}
        />
      </div>

      {aspects.length > 1 && (
        <div className="mt-3 flex gap-2" role="radiogroup" aria-label="Formát fotky">
          {aspects.map((a) => (
            <button
              key={a.label}
              type="button"
              role="radio"
              aria-checked={aspect.label === a.label}
              onClick={() => setAspect(a)}
              className={`rounded-full border-2 border-vinyl px-3 py-1 text-xs font-extrabold ${
                aspect.label === a.label ? "bg-vinyl text-vanilla" : "bg-porcelain"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-3">
        <label htmlFor="zoom" className="text-xs font-extrabold uppercase">
          Zoom
        </label>
        <input
          id="zoom"
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-full accent-cherry"
        />
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel} type="button">
          Zrušit
        </Button>
        <Button
          size="sm"
          type="button"
          disabled={busy || !areaPixels}
          onClick={async () => {
            if (!areaPixels) return;
            setBusy(true);
            try {
              const blob = await cropToJpeg(src, areaPixels, aspect.outWidth, aspect.outHeight);
              await onDone(blob, aspect);
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Zpracovávám…" : "Použít výřez"}
        </Button>
      </div>
    </Modal>
  );
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
