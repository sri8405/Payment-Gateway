"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import Image from "next/image";

type Props = {
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  label?: string;
};

export function FileUpload({ value, onChange, accept = "image/*", label = "Upload File" }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }
      
      onChange(data.url);
    } catch (err: any) {
      setError(err.message || "Failed to upload file");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const isImage = value && value.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i);

  return (
    <div className="space-y-3">
      {value ? (
        <div className="relative rounded-lg border border-border p-2 flex items-center justify-between gap-3 bg-muted/30">
          <div className="flex items-center gap-3 truncate">
            {isImage ? (
              <div className="h-10 w-10 relative rounded overflow-hidden flex-shrink-0 bg-white">
                <Image src={value} alt="Preview" fill className="object-cover" />
              </div>
            ) : null}
            <span className="text-sm truncate text-muted-foreground">{value}</span>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={() => onChange("")} className="h-8 w-8 flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10">
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={inputRef}
            onChange={handleFileChange}
            accept={accept}
            className="hidden"
          />
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-full sm:w-auto"
          >
            {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            {uploading ? "Uploading..." : label}
          </Button>
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
