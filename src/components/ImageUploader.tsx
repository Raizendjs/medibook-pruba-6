import { useState } from "react";
import { supabase } from "../lib/supabase";

interface ImageUploaderProps {
  onImagesUploaded: (urls: string[]) => void;
}

export default function ImageUploader({ onImagesUploaded }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  async function uploadFiles(files: FileList) {
    setUploading(true);
    setError(null);

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setError("Debes iniciar sesión para subir imágenes.");
      setUploading(false);
      return;
    }

    const userId = userData.user.id;
    const uploadedUrls: string[] = [];

    for (const file of Array.from(files)) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("listing-images")
        .upload(filePath, file);

      if (uploadError) {
        setError(`Error subiendo ${file.name}: ${uploadError.message}`);
        continue;
      }

      const { data: publicUrlData } = supabase.storage
        .from("listing-images")
        .getPublicUrl(filePath);

      uploadedUrls.push(publicUrlData.publicUrl);
      setPreviews((prev) => [...prev, publicUrlData.publicUrl]);
    }

    onImagesUploaded(uploadedUrls);
    setUploading(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) uploadFiles(e.target.files);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  }

  function removePreview(index: number) {
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div>
      <label className="block text-sm font-semibold text-neutral-900 mb-3">
        Fotos de la propiedad
      </label>

      <label
        htmlFor="file-upload"
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center gap-2 w-full border-2 border-dashed rounded-2xl px-6 py-10 cursor-pointer transition-colors
          ${dragActive ? "border-neutral-900 bg-neutral-50" : "border-neutral-300 hover:border-neutral-400"}
        `}
      >
        <svg
          className="w-8 h-8 text-neutral-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9m0 0l-3 3m3-3l3 3M6 20.25h12A2.25 2.25 0 0020.25 18V7.5A2.25 2.25 0 0018 5.25H6A2.25 2.25 0 003.75 7.5V18A2.25 2.25 0 006 20.25z" />
        </svg>
        <p className="text-sm font-medium text-neutral-900">
          Arrastra tus fotos aquí
        </p>
        <p className="text-xs text-neutral-500">o haz clic para elegirlas</p>
        <input
          id="file-upload"
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />
      </label>

      {uploading && (
        <p className="text-sm text-neutral-500 mt-3 flex items-center gap-2">
          <span className="w-3.5 h-3.5 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
          Subiendo...
        </p>
      )}
      {error && <p className="text-sm text-[#FF385C] mt-3">{error}</p>}

      {previews.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
          {previews.map((url, i) => (
            <div key={i} className="relative group aspect-square">
              <img
                src={url}
                alt={`preview-${i}`}
                className="w-full h-full object-cover rounded-xl shadow-sm"
              />
              <button
                type="button"
                onClick={() => removePreview(i)}
                className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded-full bg-white/90 text-neutral-700 shadow opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Quitar foto"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}