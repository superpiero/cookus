"use client";

import { useActionState, useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { createPostAction } from "@/actions/posts";
import type { FormState } from "@/actions/auth";
import { Button } from "@/components/ui/Button";
import { Label, Textarea, FieldError, FieldHint } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ImageCropModal, readFileAsDataUrl, type AspectChoice } from "@/components/media/ImageCropModal";
import { uploadImage } from "@/components/media/crop";

const ASPECTS: AspectChoice[] = [
  { label: "1:1 čtverec", value: 1, outWidth: 1080, outHeight: 1080 },
  { label: "4:5 portrét", value: 4 / 5, outWidth: 1080, outHeight: 1350 },
];

export function PostComposer() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ url: string; imageId: string; aspect: "SQUARE" | "PORTRAIT" } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [state, action] = useActionState<FormState, FormData>(createPostAction, null);

  return (
    <form action={action} className="space-y-4">
      {preview ? (
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview.url}
            alt="Náhled fotky"
            className={`w-full rounded-card border-2 border-vinyl object-cover ${
              preview.aspect === "SQUARE" ? "aspect-square" : "aspect-4/5"
            }`}
          />
          <input type="hidden" name="imageId" value={preview.imageId} />
          <input type="hidden" name="aspect" value={preview.aspect} />
          <div className="mt-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => inputRef.current?.click()}>
              Vybrat jinou fotku
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed border-vinyl bg-porcelain text-smoke hover:bg-chrome-light"
        >
          <ImagePlus className="size-10" aria-hidden />
          <span className="font-extrabold">{uploading ? "Nahrávám…" : "Vybrat fotku"}</span>
          <span className="text-xs">JPEG, PNG nebo WebP · ořízneme na 1:1 nebo 4:5</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          if (file.size > 10 * 1024 * 1024) {
            setUploadError("Soubor je moc velký (max 10 MB).");
            return;
          }
          setUploadError(null);
          setCropSrc(await readFileAsDataUrl(file));
        }}
      />

      <ImageCropModal
        src={cropSrc}
        aspects={ASPECTS}
        onCancel={() => setCropSrc(null)}
        onDone={async (blob, aspect) => {
          setCropSrc(null);
          setUploading(true);
          const result = await uploadImage(blob);
          setUploading(false);
          if (result.error || !result.id) {
            setUploadError(result.error ?? "Nahrávání selhalo.");
            return;
          }
          setPreview({
            url: URL.createObjectURL(blob),
            imageId: result.id,
            aspect: aspect.value === 1 ? "SQUARE" : "PORTRAIT",
          });
        }}
      />
      <FieldError>{uploadError}</FieldError>

      <div>
        <Label htmlFor="caption">Popisek</Label>
        <Textarea id="caption" name="caption" maxLength={2200} rows={3} placeholder="Co je na fotce? Emoji vítány 🔥" />
        <FieldHint>Popisek se použije i jako alt text fotky.</FieldHint>
      </div>

      <FieldError>{state?.error}</FieldError>
      <SubmitButton disabled={!preview}>Publikovat</SubmitButton>
    </form>
  );
}
