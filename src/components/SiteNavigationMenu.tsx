import { useState, useEffect } from 'react';
import { Menu, X, Facebook, Instagram, Phone, Mail, MessageCircle } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { UserAuthButton } from './UserAuthButton';

const NAV_LINKS = [
  { label: 'Cultura Ayacuchana', to: '/', hash: '' },
  { label: 'Nuestro Restaurante', to: '/restaurante', hash: '' },
  { label: 'Familia Las Flores', to: '/familia-las-flores', hash: '' },
  { label: 'La Carta', to: '/carta', hash: '' },
  { label: 'Reservas', to: '/reservas', hash: '' },
  { label: 'Eventos', to: '/eventos', hash: '' },
  { label: 'Tesoros de Ayacucho', to: '/tesoros-ayacucho', hash: '' },
  { label: 'Galería', to: '/galeria', hash: '' },
  { label: 'Contacto', to: '/contacto', hash: '' },
];

export function SiteNavigationMenu({
  isScrolled,
  isAlwaysDark = false,
}: {
  isScrolled: boolean;
  isAlwaysDark?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const textColor = isAlwaysDark
    ? 'text-nogal'
    : isScrolled
      ? 'text-nogal'
      : 'text-piedra';

  return (
    <>
      {/* ── Trigger buttons ── */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center p-0.5 rounded-md hover:bg-black/10 transition-colors pointer-events-auto"
          aria-label="Menú principal"
        >
          <Menu size={26} className={textColor} />
        </button>
        <UserAuthButton textColorClass={textColor} />
      </div>

      {/* ── Backdrop ── */}
      <div
        className={`fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* ── Drawer — diseño de una sola pantalla, sin scroll del documento ── */}
      <div
        className={`fixed inset-y-0 left-0 h-[100dvh] max-h-[100dvh] w-[min(100vw,420px)] z-[100] bg-piedra flex flex-col shadow-2xl pointer-events-auto transition-transform duration-300 ease-out overflow-hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* ── Header con logo + cerrar ── */}
        <div className="flex items-center justify-between px-8 pt-6 pb-4 shrink-0">
          <img
            src="/images.png"
            alt="Restaurante Las Flores"
            className="h-10 md:h-12 w-auto object-contain"
            style={{ filter: 'brightness(0) saturate(100%) invert(19%) sepia(16%) saturate(740%) hue-rotate(346deg) brightness(96%) contrast(89%)' }}
          />
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 border border-nogal/20 text-nogal hover:bg-nogal/8 transition-colors rounded-md"
            aria-label="Cerrar menú"
          >
            <X size={22} />
          </button>
        </div>

        {/* ── Separador ── */}
        <div className="mx-8 border-t border-nogal/10 shrink-0" />

        {/* ── Nav links ── */}
        <nav className="flex flex-col flex-1 min-h-0 px-8 py-3 w-full justify-evenly overflow-y-auto">
          {NAV_LINKS.map(({ label, to, hash }) => {
            return (
              <Link
                key={label}
                to={to}
                hash={hash || undefined}
                onClick={() => {
                  if (window.location.pathname === to || (window.location.pathname === '/' && to === '')) {
                    setIsOpen(false);
                  }
                }}
                className="block w-full shrink-0 py-2.5 font-serif text-lg md:text-xl tracking-[0.12em] transition-all duration-300 font-bold leading-tight uppercase border-b border-nogal/10 last:border-b-0 text-nogal hover:text-pacay hover:translate-x-3"
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* ── Footer de contacto y redes ── */}
        <div className="px-8 py-4 shrink-0 border-t border-nogal/10 bg-piedra">
          <div className="flex flex-col gap-2.5 mb-4">
            <a
              href="tel:967456230"
              className="flex items-center gap-3 text-sm text-nogal/75 hover:text-nogal transition-colors font-medium tracking-wide"
            >
              <Phone size={15} strokeWidth={2.5} />
              967 456 230
            </a>
            <a
              href="https://wa.me/51980723422"
              className="flex items-center gap-3 text-sm text-nogal/75 hover:text-nogal transition-colors font-medium tracking-wide"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              +51 980 723 422
            </a>
            <a
              href="mailto:contacto@restaurantelasflores.com"
              className="flex items-center gap-3 text-sm text-nogal/75 hover:text-nogal transition-colors font-medium tracking-wide"
            >
              <Mail size={15} strokeWidth={2.5} />
              contacto@restaurantelasflores.com
            </a>
          </div>

          <div className="flex gap-4 items-center">
            <a
              href="https://www.instagram.com/restaurantelasflores/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-nogal/50 hover:text-nogal transition-colors"
            >
              <Instagram size={20} strokeWidth={1.8} />
            </a>
            <a
              href="https://www.facebook.com/restaurantelasfloressac?locale=es_LA"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="text-nogal/50 hover:text-nogal transition-colors"
            >
              <Facebook size={20} strokeWidth={1.8} />
            </a>
            <a href="https://www.tiktok.com/@lasfloresayacucho" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="text-nogal/50 hover:text-nogal transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
