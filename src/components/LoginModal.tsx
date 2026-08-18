import { useState } from "react";
import { User, Loader2, Mail, Lock, KeyRound, ArrowRight } from "lucide-react";
import { signInWithEmail, signUpWithEmail } from "../lib/supabase";

interface LoginModalProps {
  onClose: () => void;
  onGoogle: () => void;
  onFacebook: () => void;
  loading?: boolean;
  subtitle?: string;
}

export function LoginModal({
  onClose,
  onGoogle,
  onFacebook,
  loading = false,
  subtitle = "Accede a tu cuenta para ver tus pedidos y personalizar tus datos.",
}: LoginModalProps) {
  const [authMode, setAuthMode] = useState<"social" | "email_login" | "email_register">("social");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setIsSubmitting(true);

    try {
      if (authMode === "email_login") {
        await signInWithEmail(email.trim(), password);
        onClose();
      } else {
        await signUpWithEmail(email.trim(), password, fullName.trim());
        setSuccessMsg("¡Registro exitoso! Ya puedes iniciar sesión con tus credenciales.");
        setAuthMode("email_login");
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setErrorMsg(err.message || "No se pudo completar el inicio de sesión. Verifica tus datos.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-end sm:justify-center pb-4 sm:pb-0 bg-black/60 backdrop-blur-sm p-4 pointer-events-auto">
      {/* Card del modal */}
      <div className="bg-[#f8f4e6] rounded-3xl w-full max-w-[400px] overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 border border-black/8">
        {/* Header — logo centrado + cerrar */}
        <div className="relative flex items-center justify-center px-5 py-3.5 border-b border-ink/8">
          <img
            src="/images.png"
            alt="Logo Las Flores"
            className="h-9 object-contain drop-shadow-sm scale-[1.25] origin-center"
          />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center justify-center text-nogal/50 hover:text-eucalipto transition-colors"
            aria-label="Cerrar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cuerpo */}
        <div className="py-8 px-7 flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-cochinilla/10 text-cochinilla flex items-center justify-center mb-3">
            <User size={26} strokeWidth={1.8} />
          </div>

          <h3 className="font-serif font-bold text-2xl text-ink mb-1 text-center">
            {authMode === "email_register"
              ? "Crear Cuenta"
              : authMode === "email_login"
              ? "Ingresar con Correo"
              : "Iniciar Sesión"}
          </h3>
          <p className="text-xs text-ink/50 text-center mb-6 leading-relaxed max-w-[280px]">
            {subtitle}
          </p>

          {authMode === "social" ? (
            <div className="w-full space-y-3">
              {/* Google */}
              <button
                type="button"
                onClick={onGoogle}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white border-2 border-black/10 hover:border-black/20 rounded-xl px-4 py-3.5 text-sm font-bold text-ink/75 transition-all shadow-sm active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
                Continuar con Google
              </button>

              {/* Facebook */}
              <button
                type="button"
                onClick={onFacebook}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-[#1877F2] hover:bg-[#166FE5] rounded-xl px-4 py-3.5 text-sm font-bold text-white transition-all shadow-sm active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="white">
                  <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.027 4.388 11.02 10.125 11.927v-8.437H7.078v-3.49h3.047V9.413c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796v8.437C19.612 23.093 24 18.1 24 12.073z" />
                </svg>
                Continuar con Facebook
              </button>

              <div className="relative my-4 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-black/10" />
                </div>
                <span className="relative bg-[#f8f4e6] px-3 text-[11px] font-bold uppercase tracking-widest text-ink/40">
                  o con correo
                </span>
              </div>

              <button
                type="button"
                onClick={() => setAuthMode("email_login")}
                className="w-full flex items-center justify-center gap-2 bg-cochinilla/10 hover:bg-cochinilla/20 text-cochinilla rounded-xl px-4 py-3 text-xs font-bold transition-all border border-cochinilla/20 cursor-pointer"
              >
                <Mail size={16} /> Usar Correo y Contraseña
              </button>
            </div>
          ) : (
            <form onSubmit={handleEmailSubmit} className="w-full space-y-3">
              {authMode === "email_register" && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-ink/60 mb-1">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Juan Pérez"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 bg-white text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-cochinilla"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-ink/60 mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 bg-white text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-cochinilla"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-ink/60 mb-1">
                  Contraseña
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="******"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/15 bg-white text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-cochinilla"
                />
              </div>

              {errorMsg && (
                <p className="text-[11px] font-bold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200 text-center">
                  {errorMsg}
                </p>
              )}

              {successMsg && (
                <p className="text-[11px] font-bold text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-center">
                  {successMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl font-serif font-bold text-sm bg-cochinilla text-piedra hover:bg-cochinilla/90 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <span>
                      {authMode === "email_login" ? "Ingresar" : "Crear Cuenta"}
                    </span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() =>
                    setAuthMode(
                      authMode === "email_login" ? "email_register" : "email_login"
                    )
                  }
                  className="text-[11px] font-bold text-cochinilla hover:underline cursor-pointer"
                >
                  {authMode === "email_login"
                    ? "¿No tienes cuenta? Regístrate"
                    : "¿Ya tienes cuenta? Inicia sesión"}
                </button>

                <button
                  type="button"
                  onClick={() => setAuthMode("social")}
                  className="text-[11px] font-bold text-ink/40 hover:underline cursor-pointer"
                >
                  Volver a redes
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
