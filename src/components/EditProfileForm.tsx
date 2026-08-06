import { useRef, useState } from "react";
import { supabase } from "../lib/supabase/client";

export default function EditProfileForm({
  userId,
  initialAvatar,
  initialBio,
}: {
  userId: string;
  initialAvatar: string | null;
  initialBio: string;
}) {
  const [avatarUrl, setAvatarUrl] = useState(initialAvatar);
  const [bio, setBio] = useState(initialBio);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Elige un archivo de imagen.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen no puede pesar más de 5MB.");
      return;
    }

    setUploading(true);
    setError(null);

    const ext = file.name.split(".").pop();
    const filePath = `${userId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, {
      upsert: true,
    });

    if (uploadError) {
      setUploading(false);
      setError("No se pudo subir la foto.");
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    setAvatarUrl(data.publicUrl);
    setUploading(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(false);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl, bio: bio.trim() || null })
      .eq("id", userId);

    setSaving(false);
    if (updateError) {
      setError("No se pudo guardar el perfil.");
      return;
    }
    setSuccess(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Tu foto de perfil" className="w-24 h-24 rounded-full object-cover" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-neutral-300 dark:bg-neutral-600 flex items-center justify-center text-2xl text-white font-bold">
              ?
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center text-white text-xs">
              Subiendo...
            </div>
          )}
        </div>
        <div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="rounded-xl border border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-white text-sm font-medium px-4 py-2 hover:border-neutral-900 dark:hover:border-white transition disabled:opacity-50"
          >
            Cambiar foto
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5">JPG o PNG, hasta 5MB.</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-neutral-900 dark:text-white mb-1.5">
          Reseña personal
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={300}
          rows={4}
          placeholder="Contales un poco de vos a los anfitriones/huéspedes con los que trabajás..."
          className="w-full rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-4 py-3 text-sm text-neutral-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
        />
        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1 text-right">{bio.length}/300</p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && <p className="text-sm text-green-600 dark:text-green-400">Perfil actualizado.</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving || uploading}
        className="rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-5 py-2.5 text-sm font-medium disabled:opacity-50"
      >
        {saving ? "Guardando..." : "Guardar perfil"}
      </button>
    </div>
  );
}
