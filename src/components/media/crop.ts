import type { Area } from "react-easy-crop";

/** Vyřízne oblast z obrázku do JPEG blobu (max výstupní šířka dle formátu). */
export async function cropToJpeg(
  imageSrc: string,
  cropArea: Area,
  outWidth: number,
  outHeight: number
): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  canvas.width = outWidth;
  canvas.height = outHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    image,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    outWidth,
    outHeight
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Export selhal"))),
      "image/jpeg",
      0.82
    );
  });
}

export async function uploadImage(blob: Blob): Promise<{ id?: string; error?: string }> {
  const formData = new FormData();
  formData.append("file", blob, "photo.jpg");
  try {
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    return await res.json();
  } catch {
    return { error: "Nahrávání selhalo. Zkus to znovu." };
  }
}
