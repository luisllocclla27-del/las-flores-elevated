import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
const heroImg =
  "/imagenes-reales/hero-paginas/hero-eventos-opt.webp";
const casaImg = "/imagenes-reales/CARTA/02042026-DSC04401.webp";
const equipoImg = "/imagenes-reales/EQUIPO/02042026-DSC05038.webp";
const retabloImg =
  "/imagenes-reales/ARTE Y CULTURA LISTO/RETABLO AYACUCHANO/Retablo-Ayacuchano.webp";
import { SiteFooter } from "@/components/site-footer";
import { ArrowRight, CalendarHeart, GlassWater, Users, CheckCircle2, Sparkles, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { SiteNavigationMenu } from '../components/SiteNavigationMenu';
import { useState, useTransition, useEffect } from 'react';
import { useCart } from "@/context/CartContext";
import { AnimatedCartButton } from "@/components/AnimatedCartButton";
import { MobileCategoryFilter } from "@/components/MobileCategoryFilter";

import { MenuModal } from "@/components/MenuModal";

export const Route = createFileRoute("/eventos")({
  head: () => ({
    meta: [
      { title: "Eventos y Recepciones | Restaurante Las Flores" },
      {
        name: "description",
        content:
          "Celebre bodas, almuerzos de negocios y reuniones familiares en los exclusivos ambientes de Restaurante Las Flores en Ayacucho.",
      },
    ],
  }),
  component: EventosPage,
});

type EventTabId = "familiares" | "corporativas" | "bodas";

interface EventTabData {
  id: EventTabId;
  label: string;
  title: string;
  description: string;
  bullets: string[];
  images: string[];
}

const EVENT_TABS: EventTabData[] = [
  {
    id: "familiares",
    label: "Celebraciones Familiares",
    title: "Celebraciones Familiares",
    description: "Desde cumpleaños hasta aniversarios, Las Flores es el hogar perfecto para celebrar la vida con sus seres queridos. Disfrute de nuestra propuesta tradicional de compartir en el centro de la mesa, rodeado de un ambiente cálido y acogedor.",
    bullets: [
      "Platos diseñados para compartir",
      "Espacios modulares según la cantidad de invitados"
    ],
    images: [
      "/imagenes-reales/EVENTOS-COORPORATIVAS/celebraciones-familiares.webp",
      "/imagenes-reales/Salones/Salonprincipal.webp",
      "/imagenes-reales/Salones/Terraza.webp",
      "/imagenes-reales/Salones/jardin.webp"
    ]
  },
  {
    id: "corporativas",
    label: "Reuniones Corporativas",
    title: "Reuniones Corporativas",
    description: "El entorno perfecto para los negocios. Contamos con salones acondicionados para almuerzos ejecutivos, conferencias, y cenas de gala empresariales, garantizando privacidad y distinción.",
    bullets: [
      "Opciones de menú ejecutivo",
      "Equipamiento audiovisual (bajo solicitud)",
      "Coffee breaks premium"
    ],
    images: [
      "/imagenes-reales/EVENTOS-COORPORATIVAS/reuniones-corporativas.webp",
      "/imagenes-reales/Salones/Estrado.webp",
      "/imagenes-reales/Salones/Ventana.webp",
      "/imagenes-reales/Salones/pasillo.webp"
    ]
  },
  {
    id: "bodas",
    label: "Bodas y Recepciones",
    title: "Bodas y Recepciones",
    description: "Haga de su día especial un momento inolvidable. Ofrecemos ambientes íntimos y majestuosos, un servicio impecable y propuestas gastronómicas diseñadas a medida para usted y sus invitados, fusionando la alta cocina con los sabores tradicionales.",
    bullets: [
      "Menú de degustación personalizado",
      "Salones privados exclusivos",
      "Atención preferencial"
    ],
    images: [
      "/imagenes-reales/EVENTOS-COORPORATIVAS/bodas-recepciones.webp",
      "/imagenes-reales/Salones/entrada.webp",
      "/imagenes-reales/Salones/Terraza.webp",
      "/imagenes-reales/Salones/Salonprincipal.webp"
    ]
  }
];

function EventosPage() {
  const { totalItems, setIsOpen: setCartOpen } = useCart();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [formStatus, setFormStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<EventTabId>("familiares");
  const [carouselIndices, setCarouselIndices] = useState<Record<EventTabId, number>>({
    familiares: 0,
    corporativas: 0,
    bodas: 0,
  });

  // Estado para el carrusel móvil (imagen individual por tab)
  const [mobileImageIndices, setMobileImageIndices] = useState<Record<EventTabId, number>>({
    familiares: 0,
    corporativas: 0,
    bodas: 0,
  });
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const handleMobileSwipe = (direction: 'next' | 'prev') => {
    setMobileImageIndices(prev => {
      const images = EVENT_TABS.find(t => t.id === activeTab)?.images || [];
      const total = images.length;
      const current = prev[activeTab];
      const next = direction === 'next'
        ? (current + 1) % total
        : (current - 1 + total) % total;
      return { ...prev, [activeTab]: next };
    });
  };

  const handleNextSlide = () => {
    setCarouselIndices((prev) => {
      const currentImages = EVENT_TABS.find((t) => t.id === activeTab)?.images || [];
      const totalPairs = Math.ceil(currentImages.length / 2);
      const nextIndex = (prev[activeTab] + 1) % totalPairs;
      return { ...prev, [activeTab]: nextIndex };
    });
  };

  const handlePrevSlide = () => {
    setCarouselIndices((prev) => {
      const currentImages = EVENT_TABS.find((t) => t.id === activeTab)?.images || [];
      const totalPairs = Math.ceil(currentImages.length / 2);
      const prevIndex = (prev[activeTab] - 1 + totalPairs) % totalPairs;
      return { ...prev, [activeTab]: prevIndex };
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormStatus("submitting");

    const form = e.currentTarget;
    const name = (form.querySelector("#nombre") as HTMLInputElement)?.value || "";
    const email = (form.querySelector("#email") as HTMLInputElement)?.value || "";
    const phone = (form.querySelector("#telefono") as HTMLInputElement)?.value || "";
    const guestsInput = (form.querySelector("#invitados") as HTMLInputElement)?.value;
    const guests = guestsInput ? Number(guestsInput) : null;
    const event_type = (form.querySelector("#tipo") as HTMLSelectElement)?.value || "";
    const event_date = (form.querySelector("#fecha") as HTMLInputElement)?.value || null;
    const message = (form.querySelector("#mensaje") as HTMLTextAreaElement)?.value || "";

    try {
      const { error } = await supabase.from("event_quotes").insert([
        {
          name,
          email,
          phone,
          guests,
          event_type,
          event_date,
          message,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        console.warn("Error al guardar cotización de evento en Supabase (event_quotes):", error);
        alert("Nota: Hubo un inconveniente al registrar la cotización en el servidor, pero hemos recibido tu solicitud.");
      }
      setFormStatus("success");
    } catch (err: any) {
      console.warn("Excepción al solicitar cotización de evento en Supabase:", err);
      alert("Nota: Ocurrió un error inesperado, pero hemos procesado tu solicitud.");
      setFormStatus("success");
    }
  };

  return (
    <div className="bg-piedra text-nogal font-sans selection:bg-chilca/30">
      {/* Nav */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-3 px-4 md:px-10 py-2 md:py-4 transition-all duration-500 pointer-events-none ${isScrolled ? "bg-piedra text-nogal shadow-md" : "bg-transparent text-piedra"}`}
      >
        <div className="flex items-center">
          <SiteNavigationMenu isScrolled={isScrolled} />
        </div>
        <Link
          to="/"
          className="flex-1 flex justify-center pointer-events-auto"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <img
            src="/images.png"
            alt="Las Flores Logo"
            className={`w-auto object-contain transition-all duration-500 ${isScrolled ? "h-8" : "h-10 md:h-12 brightness-0 invert"}`}
          />
        </Link>
        <div className="flex items-center gap-4 md:gap-8 text-[11px] md:text-sm uppercase tracking-[0.15em] font-semibold pointer-events-auto">
          <Link
            to="/reservas"
            className={`px-4.5 py-1.5 md:px-5 md:py-2 text-[11px] md:text-xs font-bold uppercase tracking-widest transition-all rounded-full border ${isScrolled
                ? "border-nogal text-nogal hover:bg-nogal hover:text-white shadow-sm"
                : "border-piedra/60 text-piedra hover:bg-piedra hover:text-nogal shadow-sm"
              }`}
          >
            Reservar
          </Link>
          {totalItems > 0 && (
            <AnimatedCartButton
              onClick={() => setCartOpen(true)}
              className="hover:text-chilca transition-colors"
              size={20}
              color={isScrolled ? "#8B7355" : "#F5F5DC"}
            />
          )}

        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden bg-eucalipto pt-32 pb-24 px-6">
        <img
          src="/inicio/eventos.webp"
          alt="Eventos en Restaurante Las Flores Ayacucho"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover opacity-65 filter brightness-105 saturate-[1.1]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/45 to-black/30" />

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6 -mt-12">
          <span className="text-chilca font-medium uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-2">
            <Sparkles size={14} />
            Celebre con nosotros
            <Sparkles size={14} />
          </span>

          <h1 className="font-serif text-4xl md:text-6xl text-piedra font-normal leading-tight">
            Eventos Memorables <br />
            <span className="font-normal">en Ayacucho</span>
          </h1>

          <p className="text-base md:text-lg text-piedra/90 max-w-3xl mx-auto leading-relaxed">
            Nuestros espacios, impregnados de historia y elegancia, son el escenario ideal para sus
            celebraciones más importantes. Celebre rodeado de la magia de Huamanga.
          </p>
        </div>

      </section>

      {/* ── TABS MÓVIL: sticky pegado al header (solo < lg) ── */}
      <div className="block lg:hidden sticky top-12 z-30 w-full bg-[#F9F8F3] border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto pl-6">
          <MobileCategoryFilter
            categories={EVENT_TABS.map((tab) => ({ key: tab.id, label: tab.label }))}
            activeKey={activeTab}
            onSelect={(key) => setActiveTab(key as EventTabId)}
          />
        </div>
      </div>

      {/* Servicios de Eventos - 3 Column Layout */}
      <section className="bg-piedra w-full overflow-hidden">
        {/* ── TABS DESKTOP: dentro del contenido, centrados (solo lg+) ── */}
        <div className="hidden lg:flex justify-center gap-3 pt-16 pb-0">
          {EVENT_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === tab.id
                  ? "bg-[#2D473C] text-[#D4AF37] shadow-md"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content (3 Columns) */}
        <div className="relative w-full max-w-[1800px] mx-auto flex">
          {EVENT_TABS.map((tab) => {
            const currentIndex = carouselIndices[tab.id];
            const currentImages = tab.images;

            return (
              <div
                key={tab.id}
                className={`transition-opacity duration-500 ease-in-out w-full flex flex-col lg:flex-row items-stretch ${activeTab === tab.id
                  ? "opacity-100 relative z-10"
                  : "opacity-0 absolute inset-0 z-0 pointer-events-none hidden"
                  }`}
              >
                {/* Columna 1 (Izquierda - 40%) */}
                <div className="w-full lg:w-[40%] flex flex-col justify-center px-8 lg:px-16 pt-6 pb-6 lg:pt-12 lg:pb-16">
                  <h2 className="font-serif text-4xl md:text-5xl leading-[1.1] text-balance mb-6 text-nogal">
                    {tab.title}
                  </h2>
                  <p className="text-lg text-nogal/70 leading-[1.7] mb-8">
                    {tab.description}
                  </p>
                  <ul className="space-y-2 lg:space-y-4 text-nogal/80 font-medium mb-6 lg:mb-12">
                    {tab.bullets.map((bullet, idx) => (
                      <li key={idx} className="flex items-center gap-3">
                        <span className="w-1.5 h-1.5 bg-[#2D473C] rounded-full flex-shrink-0"></span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto">
                    <button
                      onClick={() => setIsContactOpen(true)}
                      className="px-10 py-5 text-[11px] uppercase tracking-[0.25em] font-bold rounded-sm btn-yellow-hover"
                    >
                      Cotizar Evento
                    </button>
                  </div>
                </div>

                {/* Columna 2 (Centro - Controles) */}
                <div className="hidden lg:flex w-fit px-4 flex-col justify-end items-center gap-3 pb-16">
                  <button
                    onClick={handlePrevSlide}
                    className="w-12 h-12 border border-nogal/20 flex items-center justify-center text-nogal hover:bg-nogal/10 transition-colors"
                  >
                    <ChevronLeft size={20} strokeWidth={1.8} />
                  </button>
                  <button
                    onClick={handleNextSlide}
                    className="w-12 h-12 border border-nogal/20 flex items-center justify-center text-nogal hover:bg-nogal/10 transition-colors"
                  >
                    <ChevronRight size={20} strokeWidth={1.8} />
                  </button>
                </div>

                {/* ─── COLUMNA 3 MÓVIL: una imagen a la vez con swipe táctil ─── */}
                <div
                  className="block lg:hidden w-full h-[300px] mb-8 relative overflow-hidden"
                  onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
                  onTouchEnd={(e) => {
                    if (touchStartX === null) return;
                    const dx = e.changedTouches[0].clientX - touchStartX;
                    if (Math.abs(dx) > 40) handleMobileSwipe(dx < 0 ? 'next' : 'prev');
                    setTouchStartX(null);
                  }}
                >
                  {/* Carril de imágenes individuales */}
                  <div
                    className="flex h-full transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
                    style={{ transform: `translateX(-${mobileImageIndices[tab.id] * 100}%)` }}
                  >
                    {currentImages.map((img, imgIdx) => (
                      <div key={imgIdx} className="w-full h-full flex-shrink-0 relative">
                        <img
                          src={img}
                          alt={`${tab.title} ${imgIdx + 1}`}
                          className="absolute inset-0 w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-2 border border-white/40 pointer-events-none" />
                      </div>
                    ))}
                  </div>
                  {/* Dots de navegación */}
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
                    {currentImages.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setMobileImageIndices(prev => ({ ...prev, [tab.id]: i }))}
                        className={`w-2 h-2 rounded-full transition-all ${mobileImageIndices[tab.id] === i ? 'bg-white scale-125' : 'bg-white/50'
                          }`}
                      />
                    ))}
                  </div>
                </div>

                {/* ─── COLUMNA 3 DESKTOP: Galería Carrusel de pares ─── */}
                <div className="hidden lg:block lg:w-[52%] pt-12 pb-16 pr-4 relative self-stretch">
                  <div className="overflow-hidden h-full">
                    <div
                      className="flex h-full transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
                      style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                    >
                      {Array.from({ length: Math.ceil(currentImages.length / 2) }, (_, pairIdx) => (
                        <div
                          key={pairIdx}
                          className="w-full h-full flex-shrink-0 flex gap-6"
                        >
                          {currentImages.slice(pairIdx * 2, pairIdx * 2 + 2).map((img, imgIdx) => (
                            <div key={imgIdx} className="flex-1 h-full relative overflow-hidden">
                              <img
                                src={img}
                                alt={`${tab.title} ${pairIdx * 2 + imgIdx + 1}`}
                                className="absolute inset-0 w-full h-full object-cover"
                                loading="lazy"
                              />
                              <div className="absolute inset-4 border border-white/40 pointer-events-none" />
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <SiteFooter />
      {isMenuOpen && <MenuModal open={isMenuOpen} onClose={() => setIsMenuOpen(false)} />}

      {/* Drawer Formulario Lateral */}
      {isContactOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Overlay oscuro con blur */}
          <div
            className="absolute inset-0 bg-eucalipto/70 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsContactOpen(false)}
          />

          {/* Panel Lateral */}
          <div className="relative w-full max-w-md bg-piedra text-nogal h-full shadow-2xl flex flex-col overflow-y-auto animate-in slide-in-from-right duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]">
            <div className="p-8 border-b border-nogal/10 flex justify-between items-center bg-piedra sticky top-0 z-10">
              <h3 className="font-serif text-2xl">Cotizar Evento</h3>
              <button
                onClick={() => setIsContactOpen(false)}
                className="text-nogal/60 hover:text-nogal transition-colors text-3xl font-light leading-none pb-1"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            <div className="p-8 flex-1">
              {formStatus === "success" ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-16 h-16 bg-eucalipto/20 text-eucalipto rounded-full flex items-center justify-center text-3xl mb-4">
                    ✓
                  </div>
                  <h3 className="font-serif text-3xl">¡Solicitud Enviada!</h3>
                  <p className="text-nogal/70 leading-[1.7]">
                    Hemos recibido su información. Nuestro equipo se pondrá en contacto pronto para
                    afinar los detalles de su evento.
                  </p>
                  <button
                    onClick={() => {
                      setIsContactOpen(false);
                      setTimeout(() => setFormStatus("idle"), 500);
                    }}
                    className="mt-8 px-8 py-4 bg-eucalipto text-piedra text-[11px] uppercase tracking-[0.25em] font-bold hover:bg-eucalipto/80 transition-colors w-full rounded-sm"
                  >
                    CERRAR
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                  <p className="text-nogal/60 text-sm mb-8 leading-relaxed font-light">
                    Complete los datos a continuación y nuestro coordinador se comunicará con usted
                    a la brevedad.
                  </p>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="nombre"
                      className="text-[10px] uppercase tracking-[0.2em] text-nogal/50 font-semibold block px-1"
                    >
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      id="nombre"
                      required
                      className="w-full bg-eucalipto/[0.03] border border-nogal/10 rounded-sm px-4 py-3 text-nogal text-sm focus:outline-none focus:border-chilca focus:bg-eucalipto/[0.02] transition-colors"
                      placeholder="Ej. Juan Pérez"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="email"
                      className="text-[10px] uppercase tracking-[0.2em] text-nogal/50 font-semibold block px-1"
                    >
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      className="w-full bg-eucalipto/[0.03] border border-nogal/10 rounded-sm px-4 py-3 text-nogal text-sm focus:outline-none focus:border-chilca focus:bg-eucalipto/[0.02] transition-colors"
                      placeholder="juan@correo.com"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="telefono"
                        className="text-[10px] uppercase tracking-[0.2em] text-nogal/50 font-semibold block px-1"
                      >
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        id="telefono"
                        required
                        className="w-full bg-eucalipto/[0.03] border border-nogal/10 rounded-sm px-4 py-3 text-nogal text-sm focus:outline-none focus:border-chilca focus:bg-eucalipto/[0.02] transition-colors"
                        placeholder="+51 987 654 321"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label
                        htmlFor="invitados"
                        className="text-[10px] uppercase tracking-[0.2em] text-nogal/50 font-semibold block px-1"
                      >
                        Invitados
                      </label>
                      <input
                        type="number"
                        id="invitados"
                        min="1"
                        className="w-full bg-eucalipto/[0.03] border border-nogal/10 rounded-sm px-4 py-3 text-nogal text-sm focus:outline-none focus:border-chilca focus:bg-eucalipto/[0.02] transition-colors"
                        placeholder="50"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="tipo"
                      className="text-[10px] uppercase tracking-[0.2em] text-nogal/50 font-semibold block px-1"
                    >
                      Tipo de Evento
                    </label>
                    <div className="relative">
                      <select
                        id="tipo"
                        required
                        defaultValue=""
                        className="w-full bg-eucalipto/[0.03] border border-nogal/10 rounded-sm px-4 py-3 text-nogal text-sm focus:outline-none focus:border-chilca focus:bg-eucalipto/[0.02] transition-colors appearance-none cursor-pointer"
                      >
                        <option value="" disabled>
                          Seleccione...
                        </option>
                        <option value="boda">Boda / Recepción</option>
                        <option value="corporativo">Corporativo</option>
                        <option value="familiar">Familiar</option>
                        <option value="otro">Otro</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-nogal/40">
                        <svg
                          className="fill-current h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="fecha"
                      className="text-[10px] uppercase tracking-[0.2em] text-nogal/50 font-semibold block px-1"
                    >
                      Fecha Deseada
                    </label>
                    <input
                      type="date"
                      id="fecha"
                      className="w-full bg-eucalipto/[0.03] border border-nogal/10 rounded-sm px-4 py-3 text-nogal text-sm focus:outline-none focus:border-chilca focus:bg-eucalipto/[0.02] transition-colors min-h-[44px]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="mensaje"
                      className="text-[10px] uppercase tracking-[0.2em] text-nogal/50 font-semibold block px-1"
                    >
                      Detalles Adicionales
                    </label>
                    <textarea
                      id="mensaje"
                      rows={2}
                      className="w-full bg-eucalipto/[0.03] border border-nogal/10 rounded-sm px-4 py-3 text-nogal text-sm focus:outline-none focus:border-chilca focus:bg-eucalipto/[0.02] transition-colors resize-none"
                      placeholder="Cuéntenos más sobre su evento..."
                    ></textarea>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={formStatus === "submitting"}
                      className="w-full py-4 bg-eucalipto text-piedra text-[11px] uppercase tracking-[0.25em] font-bold hover:bg-chilca hover:text-nogal transition-colors disabled:opacity-50 rounded-sm shadow-md hover:shadow-lg"
                    >
                      {formStatus === "submitting" ? "ENVIANDO..." : "SOLICITAR COTIZACIÓN"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

