import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { CartProvider } from "../context/CartContext";
import { CartSidebar } from "../components/CartSidebar";
import { supabase } from "../lib/supabase";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Restaurante Las Flores — El Mejor Restaurante en Ayacucho | Comida Típica & Parrillas" },
      {
        name: "description",
        content:
          "Descubre el mejor restaurante en Ayacucho. Restaurante Las Flores ofrece platos típicos ayacuchanos (Puca Picante, Cuy, Mondongo), cocina de autor y ambiente acogedor en Jr. José Olaya 106. ¡Reserva tu mesa o pide delivery!",
      },
      {
        name: "keywords",
        content:
          "restaurante las flores, restaurante las flores ayacucho, restaurantes ayacucho, mejor restaurante ayacucho, donde comer en ayacucho, comida tipica ayacuchana, puca picante ayacucho, cuy ayacucho, delivery ayacucho, reservas restaurante ayacucho",
      },
      { name: "google-site-verification", content: "googleffddf4f084c15495" },
      { name: "google-site-verification", content: "PVG5Mt598l5OmFVAXef31ZLlxFEVcq_PbERBYKQ9AgQ" },
      { name: "robots", content: "index, follow, max-image-preview:large" },
      { property: "og:title", content: "Restaurante Las Flores — El Mejor Restaurante en Ayacucho" },
      {
        property: "og:description",
        content: "Cocina ayacuchana de autor y platos típicos de tradición. Reservas en línea y delivery en Ayacucho.",
      },
      { property: "og:type", content: "restaurant" },
      { property: "og:url", content: "https://www.restaurantelasflores.com/" },
      { property: "og:site_name", content: "Restaurante Las Flores Ayacucho" },
      { property: "og:locale", content: "es_PE" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "geo.region", content: "PE-AYA" },
      { name: "geo.placename", content: "Ayacucho, Huamanga" },
      { name: "geo.position", content: "-13.1611;-74.2236" },
      { name: "ICBM", content: "-13.1611, -74.2236" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Spectral:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap",
        fetchPriority: "high",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

const restaurantSchema = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "name": "Restaurante Las Flores",
  "alternateName": ["Las Flores Ayacucho", "Restaurante Las Flores Ayacucho"],
  "image": "https://www.restaurantelasflores.com/gastronomia/Puca-picante.webp",
  "@id": "https://www.restaurantelasflores.com/#restaurant",
  "url": "https://www.restaurantelasflores.com/",
  "telephone": "+51980723422",
  "priceRange": "S/ 25 - S/ 70",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Jr. José Olaya 106",
    "addressLocality": "Huamanga",
    "addressRegion": "Ayacucho",
    "postalCode": "05001",
    "addressCountry": "PE"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": -13.1611,
    "longitude": -74.2236
  },
  "servesCuisine": [
    "Peruana",
    "Típica Ayacuchana",
    "Parrillas",
    "Desayunos Ayacuchanos"
  ],
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      "opens": "07:30",
      "closes": "22:00"
    }
  ],
  "acceptsReservations": "True",
  "menu": "https://www.restaurantelasflores.com/carta",
  "hasMenu": "https://www.restaurantelasflores.com/carta"
};

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantSchema) }}
        />
        {/* Culqi JS V4 - Pasarela de pagos */}
        <script src="https://checkout.culqi.com/js/v4" />
      </head>
      <body className="overflow-x-hidden">
        {children}
        {/* ScrollRestoration is deprecated in recent versions of Tanstack Router, handled in createRouter instead */}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  // ── Detectar si estamos dentro de la ventana popup de OAuth ───────
  const isPopup = typeof window !== "undefined" && (
    window.name === "google_auth_popup" ||
    (window.opener !== null && window.opener !== window) ||
    window.location.search.includes("auth_popup=1") ||
    window.location.search.includes("is_popup=true")
  );

  // ── Mostrar spinner mientras Supabase procesa el callback OAuth ─────
  // Solo aplica a la ventana PRINCIPAL (no al popup) con ?code= o #access_token=
  const [oauthLoading, setOauthLoading] = useState(() => {
    if (typeof window === "undefined" || isPopup) return false;
    const url = new URL(window.location.href);
    return url.searchParams.has("code") ||
           window.location.hash.includes("access_token");
  });

  // ── Lógica para el POPUP: detectar sesión, notificar y cerrar automáticamente ──
  useEffect(() => {
    if (!isPopup) return;

    const closeWindow = () => {
      try { window.close(); } catch {}
      setTimeout(() => { try { window.close(); } catch {} }, 300);
    };

    // Notificar al opener y cerrar
    const notifyAndClose = () => {
      if (window.opener) {
        try {
          window.opener.postMessage({ type: "SUPABASE_AUTH_SUCCESS" }, "*");
        } catch {}
      }
      try {
        localStorage.setItem("supabase_auth_broadcast", Date.now().toString());
      } catch {}

      closeWindow();
    };

    // Si la sesión ya existe (popup regresa con token), cerrar de inmediato
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        notifyAndClose();
        return;
      }

      // Si no hay sesión aún, esperar el evento SIGNED_IN
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || currentSession) {
          subscription.unsubscribe();
          notifyAndClose();
        }
      });

      // Timeout: si en 4s no cierra, forzar cierre
      setTimeout(() => {
        subscription.unsubscribe();
        notifyAndClose();
      }, 4000);
    });
  }, [isPopup]);

  // ── Lógica para la ventana PRINCIPAL: escuchar mensaje y storage broadcast ────
  useEffect(() => {
    if (isPopup) return;

    const handleMessage = async (e: MessageEvent) => {
      if (e.data?.type === "SUPABASE_AUTH_SUCCESS") {
        await supabase.auth.getSession();
      }
    };

    const handleStorage = async (e: StorageEvent) => {
      if (e.key === "supabase_auth_broadcast") {
        await supabase.auth.getSession();
      }
    };

    window.addEventListener("message", handleMessage);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("storage", handleStorage);
    };
  }, [isPopup]);

  // ── Limpiar errores OAuth de la URL ────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || isPopup) return;
    const url = new URL(window.location.href);
    if (url.searchParams.has("error") || url.searchParams.has("error_code")) {
      url.searchParams.delete("error");
      url.searchParams.delete("error_code");
      url.searchParams.delete("error_description");
      url.hash = "";
      window.history.replaceState({}, "", url.toString());
    }
  }, [isPopup]);

  // ── Lógica de loading para callback de Facebook (redirect) ─────────
  useEffect(() => {
    if (!oauthLoading) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete("code");
        cleanUrl.hash = "";
        window.history.replaceState({}, "", cleanUrl.toString());
        setOauthLoading(false);
        subscription.unsubscribe();
      }
    });

    const timeout = setTimeout(() => {
      setOauthLoading(false);
      subscription.unsubscribe();
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete("code");
      cleanUrl.hash = "";
      window.history.replaceState({}, "", cleanUrl.toString());
    }, 8000);

    return () => { clearTimeout(timeout); subscription.unsubscribe(); };
  }, [oauthLoading]);

  // ── Render del POPUP ───────────────────────────────────────────────
  if (isPopup) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#FBF5E6] flex flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="w-10 h-10 border-[3px] border-[#2C4A3E] border-t-transparent rounded-full animate-spin" />
        <p className="font-serif text-[#2C4A3E] font-semibold text-base">¡Autenticación exitosa!</p>
        <p className="text-xs text-black/40">Cerrando ventana…</p>
        <button
          onClick={() => { try { window.close(); } catch {} }}
          className="mt-2 text-xs px-5 py-2 bg-[#2C4A3E] text-[#FBF5E6] rounded-xl font-bold hover:opacity-90 transition-all"
        >
          Cerrar ventana
        </button>
      </div>
    );
  }

  // ── Render loading de Facebook redirect ───────────────────────────
  if (oauthLoading) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#FBF5E6] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-[3px] border-[#2C4A3E] border-t-transparent rounded-full animate-spin" />
        <p className="font-serif text-[#2C4A3E] font-semibold text-base">Iniciando sesión…</p>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <Outlet />
        <CartSidebar />
      </CartProvider>
    </QueryClientProvider>
  );
}
