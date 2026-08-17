import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Phone, Calendar, Check, Loader2, X, Mail, ShieldCheck } from "lucide-react";
import { supabase } from "../lib/supabase";

interface CompleteProfileModalProps {
  userId: string;
  initialName?: string;
  initialPhone?: string;
  initialBirthdate?: string;
  initialEmail?: string;
  onSuccess: (updatedProfile: any) => void;
  onClose?: () => void;
}

const MONTHS = [
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Setiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];

const DAYS = Array.from({ length: 31 }, (_, i) => {
  const d = i + 1;
  return { value: d < 10 ? `0${d}` : `${d}`, label: `${d}` };
});

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 80 }, (_, i) => {
  const y = currentYear - 6 - i;
  return { value: `${y}`, label: `${y}` };
});

export function CompleteProfileModal({
  userId,
  initialName = "",
  initialPhone = "",
  initialBirthdate = "",
  initialEmail = "",
  onSuccess,
  onClose,
}: CompleteProfileModalProps) {
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);
  
  // Parse initial birthdate (YYYY-MM-DD) if present
  const parts = (initialBirthdate || "").split("-");
  const [year, setYear] = useState(parts[0] || "");
  const [month, setMonth] = useState(parts[1] || "");
  const [day, setDay] = useState(parts[2] || "");

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Bloquear el scroll de la web mientras el modal está abierto
  useEffect(() => {
    setMounted(true);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Validar Celular (WhatsApp) - Estrictamente 9 dígitos iniciando en 9
    const cleanPhone = phone.replace(/\D/g, "");
    if (!/^9\d{8}$/.test(cleanPhone)) {
      setErrorMsg("Ingresa un número de celular válido de 9 dígitos (ejemplo: 980723422).");
      return;
    }

    // Validar correo si no venía inicializado
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMsg("Por favor ingresa tu correo electrónico.");
      return;
    }

    // Fecha de cumpleaños (OPCIONAL)
    let birthdateFormatted: string | null = null;
    if (day && month && year) {
      birthdateFormatted = `${year}-${month}-${day}`;
    }

    setSaving(true);
    try {
      // 1. UPDATE directo en public.profiles
      const updatePayload: Record<string, any> = {
        phone: cleanPhone,
        email: cleanEmail,
        updated_at: new Date().toISOString(),
      };
      if (birthdateFormatted) {
        updatePayload.birth_date = birthdateFormatted;
      }
      if (name.trim()) updatePayload.full_name = name.trim();

      const { data: updatedData, error: updateErr } = await supabase
        .from("profiles")
        .update(updatePayload)
        .eq("id", userId)
        .select();

      let isSavedInDb = updatedData && updatedData.length > 0;

      // Fallback a UPSERT si la fila aún no existía en profiles
      if (!isSavedInDb || updateErr) {
        const upsertPayload: Record<string, any> = {
          id: userId,
          email: cleanEmail,
          phone: cleanPhone,
          role: "client",
          updated_at: new Date().toISOString(),
        };
        if (birthdateFormatted) {
          upsertPayload.birth_date = birthdateFormatted;
        }
        if (name.trim()) upsertPayload.full_name = name.trim();

        const { error: finalUpsertErr } = await supabase
          .from("profiles")
          .upsert(upsertPayload);

        if (finalUpsertErr) {
          console.error("Error al guardar en base de datos:", finalUpsertErr);
          setErrorMsg(`No se pudo guardar en la BD (${finalUpsertErr.message}). Reintenta.`);
          setSaving(false);
          return;
        }
      }

      // 2. Actualizar user_metadata en Supabase Auth
      await supabase.auth.updateUser({
        data: {
          phone: cleanPhone,
          birth_date: birthdateFormatted || undefined,
          full_name: name.trim() || undefined,
        },
      });

      onSuccess({
        phone: cleanPhone,
        birthdate: birthdateFormatted,
        full_name: name,
        email: cleanEmail,
      });
    } catch (err: any) {
      console.error("Error al actualizar perfil:", err);
      setErrorMsg("No se pudieron guardar los datos. Intenta nuevamente.");
    } finally {
      setSaving(false);
    }
  };

  // Solo permitir cerrar con la "X" si el usuario YA tenía un celular válido previamente registrado
  const canClose = Boolean(initialPhone && /^9\d{8}$/.test(initialPhone.replace(/\D/g, "")));

  const content = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-[#1b2a24]/85 backdrop-blur-md animate-in fade-in duration-200 pointer-events-auto select-none">
      <div className="bg-[#FAF6ED] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-[#2C4A3E]/15 animate-in zoom-in-95 duration-200 relative pointer-events-auto">
        
        {/* Botón Cerrar X (Solo si ya tenía celular previo) */}
        {onClose && canClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-all cursor-pointer border border-white/20 active:scale-95"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        )}

        {/* Header Elegante */}
        <div className="bg-[#2C4A3E] text-[#FAF6ED] p-7 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center mx-auto mb-3 border border-[#D4AF37]/30 shadow-inner">
            <ShieldCheck size={24} />
          </div>
          <h2 className="font-serif font-bold text-2xl tracking-wide text-white">
            Completa tu Perfil
          </h2>
          <p className="text-xs text-[#FAF6ED]/75 mt-1.5 max-w-xs mx-auto leading-relaxed font-sans">
            Ingresa tu número de WhatsApp para confirmar y coordinar tus entregas de delivery de forma segura.
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-4">
          
          {/* Nombre Completo */}
          <div>
            <label className="block text-[11px] font-bold text-[#2C4A3E] uppercase tracking-wider mb-1.5">
              Nombre Completo *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: María García"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#2C4A3E]/20 bg-white text-xs font-semibold text-[#1b2a24] focus:outline-none focus:ring-2 focus:ring-[#2C4A3E] transition-all shadow-xs"
            />
          </div>

          {/* Correo Electrónico (BLOQUEADO SI YA TIENE CUENTA) */}
          <div>
            <label className="block text-[11px] font-bold text-[#2C4A3E] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Mail size={13} className="text-[#2C4A3E]/70" /> Correo Electrónico {initialEmail ? "(Asociado a tu cuenta)" : "*"}
            </label>
            <input
              type="email"
              required
              disabled={Boolean(initialEmail)}
              readOnly={Boolean(initialEmail)}
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border text-xs font-semibold transition-all shadow-xs ${
                initialEmail
                  ? "bg-[#2C4A3E]/5 border-[#2C4A3E]/15 text-[#2C4A3E]/60 cursor-not-allowed"
                  : "bg-white border-[#2C4A3E]/20 text-[#1b2a24] focus:outline-none focus:ring-2 focus:ring-[#2C4A3E]"
              }`}
            />
          </div>

          {/* Celular / WhatsApp (OBLIGATORIO) */}
          <div>
            <label className="block text-[11px] font-bold text-[#2C4A3E] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Phone size={13} className="text-[#2C4A3E]" /> Celular / WhatsApp (Obligatorio) *
            </label>
            <input
              type="tel"
              required
              inputMode="numeric"
              maxLength={9}
              placeholder="Ej: 980723422"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))}
              className="w-full px-4 py-3 rounded-xl border-2 border-[#2C4A3E]/30 bg-white text-xs font-bold text-[#1b2a24] focus:outline-none focus:ring-2 focus:ring-[#2C4A3E] focus:border-[#2C4A3E] transition-all shadow-xs"
            />
          </div>

          {/* Fecha de Nacimiento (OPCIONAL) */}
          <div>
            <label className="block text-[11px] font-bold text-[#2C4A3E]/80 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar size={13} className="text-[#2C4A3E]/70" /> Fecha de Nacimiento (Opcional)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-[#2C4A3E]/20 bg-white text-xs font-semibold text-[#1b2a24] focus:outline-none focus:ring-2 focus:ring-[#2C4A3E] cursor-pointer shadow-xs"
              >
                <option value="">Día</option>
                {DAYS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>

              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-[#2C4A3E]/20 bg-white text-xs font-semibold text-[#1b2a24] focus:outline-none focus:ring-2 focus:ring-[#2C4A3E] cursor-pointer shadow-xs"
              >
                <option value="">Mes</option>
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>

              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-[#2C4A3E]/20 bg-white text-xs font-semibold text-[#1b2a24] focus:outline-none focus:ring-2 focus:ring-[#2C4A3E] cursor-pointer shadow-xs"
              >
                <option value="">Año</option>
                {YEARS.map((y) => (
                  <option key={y.value} value={y.value}>
                    {y.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs font-bold text-red-700 bg-red-50 p-3 rounded-xl border border-red-200 text-center">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 rounded-xl font-serif font-bold text-sm tracking-wide bg-[#2C4A3E] text-[#FAF6ED] hover:bg-[#233b31] active:scale-[0.99] transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 mt-2"
          >
            {saving ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Guardando...
              </>
            ) : (
              <>
                <Check size={18} /> Guardar y Continuar
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );

  if (!mounted || typeof document === "undefined") return null;
  return createPortal(content, document.body);
}
