import { useState } from "react";
import EditProfileForm from "./EditProfileForm";

export default function EditProfileModalTrigger({
  userId,
  initialAvatar,
  initialBio,
}: {
  userId: string;
  initialAvatar: string | null;
  initialBio: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl border border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-white text-sm font-semibold px-4 py-2 hover:border-neutral-900 dark:hover:border-white transition-colors"
      >
        ✏️ Editar perfil
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-neutral-900 p-6 shadow-2xl animate-[message-in_0.25s_ease-out] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Editar perfil</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white text-xl leading-none"
              >
                ✕
              </button>
            </div>
            <EditProfileForm userId={userId} initialAvatar={initialAvatar} initialBio={initialBio} />
          </div>
        </div>
      )}
    </>
  );
}
