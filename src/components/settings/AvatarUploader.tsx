"use client";

import { useRef, useState, useTransition } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/Field";
import { ImageCropModal, readFileAsDataUrl } from "@/components/media/ImageCropModal";
import { uploadImage } from "@/components/media/crop";
import { setAvatarAction } from "@/actions/profile";

export function AvatarUploader({ name, avatarImageId }: { name: string; avatarImageId: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-4">
      <Avatar name={name} imageId={avatarImageId} size="xl" />
      <div>
        <Button
          variant="secondary"
          size="sm"
          type="button"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
        >
          {pending ? "Nahrávám…" : "Změnit avatar"}
        </Button>
        <FieldError>{error}</FieldError>
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
              setError("Soubor je moc velký (max 10 MB).");
              return;
            }
            setError(null);
            setSrc(await readFileAsDataUrl(file));
          }}
        />
      </div>
      <ImageCropModal
        src={src}
        title="Ořízni avatar"
        aspects={[{ label: "1:1", value: 1, outWidth: 512, outHeight: 512 }]}
        onCancel={() => setSrc(null)}
        onDone={async (blob) => {
          setSrc(null);
          const result = await uploadImage(blob);
          if (result.error || !result.id) {
            setError(result.error ?? "Nahrávání selhalo.");
            return;
          }
          startTransition(async () => {
            const res = await setAvatarAction(result.id!);
            if (res?.error) setError(res.error);
          });
        }}
      />
    </div>
  );
}
