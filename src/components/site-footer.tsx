import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, BookOpen, Lock, Loader2 } from "lucide-react";
import { useState } from "react";
import { signInWithGoogle, supabase } from "../lib/supabase";

export function SiteFooter() {
  const [signingIn, setSigningIn] = useState(false);

  const handleAdminLogin = async () => {
    if (signingIn) return;
    setSigningIn(true);

    try {
      // Revisa si ya hay sesión
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
        if (profile?.role === 'admin') {
          window.location.href = "/admin";
        } else {
          window.location.href = "/restaurante";
        }
        setSigningIn(false);
        return;
      }

      await signInWithGoogle();
      
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
        if (newSession) {
          subscription.unsubscribe();
          const { data: profile } = await supabase.from('profiles').select('role').eq('id', newSession.user.id).single();
          if (profile?.role === 'admin') {
            window.location.href = "/admin";
          } else {
            window.location.href = "/restaurante";
          }
          setSigningIn(false);
        }
      });
    } catch (e) {
      console.error(e);
      setSigningIn(false);
    }
  };

  return (
    <footer className="bg-eucalipto-dark text-piedra/80 py-16 md:py-20 text-sm border-t border-cream/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 pb-16">
          {/* Logo and Policies */}
          <div className="md:col-span-4 flex flex-col items-start space-y-6">
            <Link
              to="/restaurante"
              className="inline-block mb-2"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <img
                src="/images.png"
                alt="Las Flores Logo"
                className="h-12 md:h-16 w-auto object-contain brightness-0 invert"
              />
            </Link>

            <div className="flex flex-col space-y-2 text-sm">
              <Link to="/familia-las-flores" className="hover:text-chilca transition-colors">
                Familia Las Flores
              </Link>
              <Link to="/politica-de-privacidad" className="hover:text-chilca transition-colors">
                Política de Privacidad
              </Link>
              <Link to="/terminos-y-condiciones" className="hover:text-chilca transition-colors">
                Términos y Condiciones
              </Link>
              <Link to="/unete-al-equipo" className="hover:text-chilca transition-colors font-semibold">
                Únete al Equipo
              </Link>
            </div>

            <Link
              to="/libro-de-reclamaciones"
              className="flex items-center gap-3 mt-4 hover:opacity-90 transition-all bg-white text-nogal py-2 px-3 rounded-md shadow-sm border border-black/10 group"
            >
              <BookOpen size={24} className="text-eucalipto group-hover:scale-110 transition-transform" />
              <div className="leading-none text-left">
                <span className="text-[10px] uppercase font-bold text-eucalipto tracking-wider">Libro de</span>
                <br />
                <span className="text-[10px] uppercase font-extrabold text-eucalipto tracking-wider">
                  Reclamaciones
                </span>
              </div>
            </Link>
          </div>

          {/* Central info (Address, Email, Phone) */}
          <div className="md:col-span-4 flex flex-col items-start md:items-center justify-center text-left md:text-center space-y-4">
            <span className="text-piedra font-medium tracking-[0.2em] uppercase text-xs">
              @RESTLASFLORES
            </span>
            <p className="leading-[1.8]">
              Jr. José Olaya 106, Ayacucho, Perú.
              <br />
              967 456 230 / +51 980 723 422
              <br />
              contacto@restaurantelasflores.com
            </p>
          </div>

          {/* Schedule and Socials */}
          <div className="md:col-span-4 flex flex-col items-start md:items-end justify-center space-y-4 text-left md:text-right">
            <div className="space-y-1">
              <p className="font-semibold text-piedra">Horario de Atención</p>
              <p>Lunes a Viernes</p>
              <p>7:00 a. m. - 5:00 p. m.</p>
              <p>Sábado y Domingo</p>
              <p>7:00 a. m. - 5:30 p. m.</p>
            </div>

            <div className="flex gap-4 pt-4">
              <a
                href="https://www.facebook.com/restaurantelasfloressac?locale=es_LA"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 border border-cream/20 rounded-full hover:bg-piedra/10 hover:text-chilca transition-all"
                aria-label="Facebook"
              >
                <Facebook size={18} />
              </a>
              <a
                href="https://www.instagram.com/restaurantelasflores/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 border border-cream/20 rounded-full hover:bg-piedra/10 hover:text-chilca transition-all"
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>
              <a
                href="https://www.tiktok.com/@lasfloresayacucho"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 border border-cream/20 rounded-full hover:bg-piedra/10 hover:text-chilca transition-all"
                aria-label="TikTok"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Credits */}
        <div className="pt-8 border-t border-cream/10 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] tracking-wider text-piedra/40">
          <span>© 2026 Restaurante Las Flores S.A.C.</span>
          <div className="flex items-center gap-4">
            <button
              onClick={handleAdminLogin}
              disabled={signingIn}
              className="hover:text-piedra transition-colors"
              title="Acceso Administrativo"
            >
              {signingIn ? <Loader2 size={12} className="animate-spin" /> : <Lock size={12} />}
            </button>
            <span>Todos los derechos reservados</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

