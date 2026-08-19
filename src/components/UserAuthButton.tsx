import { useState, useEffect } from "react";
import {
  Loader2,
  BarChart3,
  UtensilsCrossed,
  User,
} from "lucide-react";
import { supabase, signInWithGoogle, signInWithFacebook } from "../lib/supabase";
import { LoginModal } from "./LoginModal";

import { CompleteProfileModal } from "./CompleteProfileModal";

interface UserAuthButtonProps {
  textColorClass: string;
}

export function UserAuthButton({ textColorClass }: UserAuthButtonProps) {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  // ── Cargar sesión y perfil ──────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const { data: { session: s } } = await supabase.auth.getSession();
      setSession(s);
      if (s) await fetchProfile(s.user.id, s.user, true);
      setLoading(false);
    };
    init();

    const handleAuthSync = async () => {
      const { data: { session: s } } = await supabase.auth.getSession();
      setSession(s);
      if (s) await fetchProfile(s.user.id, s.user, true);
    };

    window.addEventListener("message", handleAuthSync);
    window.addEventListener("storage", handleAuthSync);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      setSession(s);
      if (s) {
        await fetchProfile(s.user.id, s.user, true);
      } else {
        setProfile(null);
        setShowCompleteModal(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("message", handleAuthSync);
      window.removeEventListener("storage", handleAuthSync);
    };
  }, []);

  const fetchProfile = async (userId: string, userObj?: any, promptIfIncomplete = false) => {
    try {
      let { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      // Si no existe fila en la tabla profiles para este usuario OAuth, crearla automáticamente
      if (!data && userObj) {
        const newProfile = {
          id: userId,
          email: userObj.email,
          full_name: userObj.user_metadata?.full_name || userObj.user_metadata?.name || "",
          avatar_url: userObj.user_metadata?.avatar_url || userObj.user_metadata?.picture || "",
          role: "client",
          created_at: new Date().toISOString(),
        };

        const { data: inserted } = await supabase
          .from("profiles")
          .upsert(newProfile)
          .select()
          .maybeSingle();

        if (inserted) data = inserted;
      }

      setProfile(data || null);

      // Si el celular (phone) falta en la base de datos, solicitarlo obligatoriamente
      if (promptIfIncomplete) {
        const phoneVal = data?.phone;
        if (!phoneVal) {
          setShowCompleteModal(true);
        }
      }
    } catch (e) {
      console.warn("Profile fetch warning:", e);
    }
  };

  const handleLoginClick = () => {
    setShowLoginModal(true);
  };

  const handleLoginGoogle = async () => {
    if (signingIn) return;
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      console.error(e);
    } finally {
      setSigningIn(false);
      setShowLoginModal(false);
    }
  };

  const handleLoginFacebook = async () => {
    if (signingIn) return;
    setSigningIn(true);
    try {
      await signInWithFacebook();
    } catch (e) {
      console.error(e);
    } finally {
      setSigningIn(false);
      setShowLoginModal(false);
    }
  };

  const handleClick = () => {
    if (!session) {
      setShowLoginModal(true);
      return;
    }
    // Siempre abre el historial de cliente sin importar el rol (el pie de página ya tiene los links ocultos para admin/caja)
    window.dispatchEvent(new Event("open_customer_history"));
  };

  // ── Loading ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <button className={`flex items-center justify-center p-1 pointer-events-auto ${textColorClass}`}>
        <Loader2 size={24} className="animate-spin opacity-60" />
      </button>
    );
  }

  // ── Sin sesión ─────────────────────────────────────────────────────
  if (!session) {
    return (
      <>
        <button
          onClick={handleLoginClick}
          disabled={signingIn}
          className={`flex items-center justify-center p-1 pointer-events-auto ${textColorClass}`}
          aria-label="Iniciar sesión"
          title="Iniciar sesión"
        >
          {signingIn ? (
            <Loader2 size={24} className="animate-spin" />
          ) : (
            <User size={26} className="transition-transform active:scale-95" />
          )}
        </button>

        {showLoginModal && (
          <LoginModal
            onClose={() => setShowLoginModal(false)}
            onGoogle={handleLoginGoogle}
            onFacebook={handleLoginFacebook}
            loading={signingIn}
          />
        )}
      </>
    );
  }

  const role = profile?.role;
  const avatarUrl =
    session.user?.user_metadata?.avatar_url ||
    session.user?.user_metadata?.picture ||
    profile?.avatar_url;
  const initials = (
    session.user?.user_metadata?.full_name ||
    session.user?.user_metadata?.name ||
    session.user?.email ||
    "?"
  )
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase();

  // Avatar con punto verde — abre el CustomerHistoryModal del CartSidebar (o redirige a admin según lógica en el modal)
  return (
    <>
      <button
        onClick={handleClick}
        className={`relative flex items-center justify-center p-0.5 rounded-full hover:bg-black/10 transition-colors pointer-events-auto ${textColorClass}`}
        aria-label="Mi cuenta y pedidos"
        title="Ver mis pedidos y reservas"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar"
            className="w-7 h-7 rounded-full object-cover border-2 border-white/40 shadow-sm"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-eucalipto text-chilca flex items-center justify-center text-[11px] font-black border-2 border-white/30">
            {initials}
          </div>
        )}
        <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border border-white shadow-xs" />
      </button>

      {showCompleteModal && (
        <CompleteProfileModal
          userId={session.user.id}
          initialName={
            session.user?.user_metadata?.full_name ||
            session.user?.user_metadata?.name ||
            profile?.full_name ||
            ""
          }
          initialPhone={profile?.phone || session.user?.user_metadata?.phone || ""}
          initialBirthdate={profile?.birthdate || session.user?.user_metadata?.birth_date || ""}
          initialEmail={profile?.email || session.user?.email || ""}
          onSuccess={(updated) => {
            setProfile((prev: any) => ({ ...prev, ...updated }));
            setShowCompleteModal(false);
          }}
          onClose={() => setShowCompleteModal(false)}
        />
      )}
    </>
  );
}
