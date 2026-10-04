"use client";

import { useRef, useState } from "react";
import Image from "next/image";

export interface ScreenshotItem {
  type: "BEFORE" | "AFTER";
  url: string;
}

export function ScreenshotUpload({
  type,
  label,
  value,
  onChange,
}: {
  type: "BEFORE" | "AFTER";
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Chyba uploadu");
      onChange(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chyba uploadu");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label>{label}</label>
      <div className="border border-dashed border-card-border rounded-lg p-3 flex flex-col items-center gap-2 bg-surface-2">
        {value ? (
          <div className="relative w-full h-40">
            <Image src={value} alt={label} fill className="object-contain rounded-md" unoptimized />
          </div>
        ) : (
          <span className="text-xs text-muted-2 py-6">{uploading ? "Nahrávám..." : "PNG, JPG nebo WEBP"}</span>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-xs px-3 py-1.5 rounded-md bg-surface border border-card-border hover:border-accent"
          >
            {value ? "Nahradit" : "Vybrat soubor"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-xs px-3 py-1.5 rounded-md text-red hover:bg-red-soft"
            >
              Odstranit
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {error && <span className="text-xs text-red">{error}</span>}
      </div>
    </div>
  );
}
