import { useState } from "react";
import { supabase } from "../lib/supabase";

interface ProfileCompletionModalProps {
  role: "usuario" | "anfitrion";
  userId: string;
  userEmail: string;
  initialFullName?: string | null;
}

export default function ProfileCompletionModal({
  role,
  userId,
  userEmail,
  initialFullName,
}: ProfileCompletionModalProps) {
  const [dismissed, setDismissed] = useState(false);
  const [fullName, setFullName] = useState(initialFullName ?? "");
  const [ci, setCi] = useState("");
  const [phone, setPhone] = useState("");
  // usuario
  const [professionalType, setProfessionalType] = useState<"medico" | "odontologo" | "otro">("medico");
  const [specialty, setSpecialty] = useState("");
  // anfitrion
  const [clinicType, setClinicType] = useState<"medica" | "dental">("medica");
  const [consultorios, setConsultorios] = useState("1");

  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (dismissed) return null;

  const isHost = role === "anfitrion";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !ci.trim() || !phone.trim()) {
      setError("Completa nombre, CI/RUC y teléfono.");
      return;
    }
    if (!file) {
      setError(
        isHost
          ? "Sube el PDF del permiso de habilitación."
          : "Sube el PDF que habilita tu profesión."
      );
      return;
    }
    if (file.type !== "application/pdf") {
      setError("El archivo debe ser un PDF.");
      return;
    }

    setSubmitting(true);

    const filePath = `${userId}/${crypto.randomUUID()}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("credentials")
      .upload(filePath, file);

    if (uploadError) {
      setError(`No se pudo subir el archivo: ${uploadError.message}`);
      setSubmitting(false);
      return;
    }

    const updatePayload: Record<string, any> = {
      full_name: fullName.trim(),
      ci_ruc: ci.trim(),
      phone: phone.trim(),
      profile_completed: true,
    };

    if (isHost) {
      updatePayload.clinic_type = clinicType;
      updatePayload.consultorios_count = parseInt(consultorios, 10) || 1;
      updatePayload.permit_url = filePath;
    } else {
      updatePayload.professional_type = professionalType;
      updatePayload.specialty = specialty.trim();
      updatePayload.credential_url = filePath;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update(updatePayload)
      .eq("id", userId);

    setSubmitting(false);

    if (updateError) {
      setError(`No se pudo guardar tu registro: ${updateError.message}`);
      return;
    }

    // Recargamos para que el resto de la app (que lee esto server-side
    // vía Astro.locals.profile) vea profile_completed = true.
    window.location.reload();
  }

  const inputClass =
    "w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-shadow";
  const labelClass = "block text-xs font-semibold text-neutral-700 mb-1";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-neutral-100 px-6 py-4 flex items-start justify-between rounded-t-2xl">
          <div>
            <p className="text-lg font-bold text-neutral-900">
              {isHost ? "Completa el registro de tu clínica" : "Completa tu registro profesional"}
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">
              Necesitamos estos datos una sola vez antes de que puedas {isHost ? "publicar espacios" : "reservar espacios médicos"}.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Cerrar"
            className="text-neutral-400 hover:text-neutral-700 shrink-0 ml-3"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={labelClass}>{isHost ? "Nombre" : "Nombre completo"}</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{isHost ? "CI o RUC" : "CI"}</label>
              <input type="text" value={ci} onChange={(e) => setCi(e.target.value)} className={inputClass} required />
            </div>
            <div>
              <label className={labelClass}>{isHost ? "Número de contacto" : "Teléfono"}</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} required />
            </div>
          </div>

          <div>
            <label className={labelClass}>Correo</label>
            <input type="email" value={userEmail} disabled className={`${inputClass} bg-neutral-100 text-neutral-500`} />
          </div>

          {isHost ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Tipo de clínica</label>
                <select
                  value={clinicType}
                  onChange={(e) => setClinicType(e.target.value as any)}
                  className={inputClass}
                >
                  <option value="medica">Médica</option>
                  <option value="dental">Dental</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Consultorios disponibles</label>
                <input
                  type="number"
                  min={1}
                  value={consultorios}
                  onChange={(e) => setConsultorios(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Eres</label>
                <select
                  value={professionalType}
                  onChange={(e) => setProfessionalType(e.target.value as any)}
                  className={inputClass}
                >
                  <option value="medico">Médico</option>
                  <option value="odontologo">Odontólogo</option>
                  <option value="otro">Otro profesional de salud</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Especialidad</label>
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="Ej. Pediatría"
                  className={inputClass}
                />
              </div>
            </div>
          )}

          <div>
            <label className={labelClass}>
              {isHost ? "Permiso de habilitación (PDF)" : "Documento que habilita tu profesión (PDF)"}
            </label>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-900 file:text-white file:px-3 file:py-2 file:text-xs file:font-semibold hover:file:bg-neutral-700"
              required
            />
          </div>

          {error && (
            <div className="rounded-xl bg-[#FFF0F1] border border-[#FFD3D8] px-4 py-3">
              <p className="text-sm text-[#FF385C] font-medium">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="flex-1 rounded-xl border border-neutral-300 text-sm font-medium py-3 hover:border-neutral-900 transition-colors"
            >
              Después
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-[#FF385C] hover:bg-[#E31C5F] text-white font-semibold rounded-xl py-3 text-sm transition-colors disabled:opacity-50"
            >
              {submitting ? "Guardando..." : "Guardar y continuar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
