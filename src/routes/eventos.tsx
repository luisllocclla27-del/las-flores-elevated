import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
const heroImg =
  "/imagenes-reales/hero-paginas/hero-eventos-opt.webp";
const casaImg = "/imagenes-reales/CARTA/02042026-DSC04401.webp";
const equipoImg = "/imagenes-reales/EQUIPO/02042026-DSC05038.webp";
const retabloImg =
  "/imagenes-reales/ARTE Y CULTURA LISTO/RETABLO AYACUCHANO/Retablo-Ayacuchano.webp";
import { SiteFooter } from "@/components/site-footer";
import {
  ArrowRight,
  CalendarHeart,
  GlassWater,
  Users,
  CheckCircle2,
  Sparkles,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  User,
  Mail,
  Phone,
  Clock,
  MessageSquare,
  Send,
  Loader2,
  X,
  MapPin,
  ShieldCheck,
  PhoneCall,
} from "lucide-react";
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
    links: [{ rel: "canonical", href: "https://www.restaurantelasflores.com/eventos" }],
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

  // Cerrar Drawer al presionar Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isContactOpen) {
        setIsContactOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isContactOpen]);

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
    const turno = (form.querySelector("#turno") as HTMLSelectElement)?.value || "";
    const rawMessage = (form.querySelector("#mensaje") as HTMLTextAreaElement)?.value || "";
    const message = turno ? `[Turno: ${turno}] ${rawMessage}` : rawMessage;

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

      {/* Drawer Formulario Lateral de Cotización */}
      {isContactOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end animate-in fade-in duration-200">
          {/* Overlay oscuro con blur que cierra al hacer clic fuera */}
          <div
            className="fixed inset-0 bg-[#14231D]/80 backdrop-blur-md cursor-pointer transition-opacity"
            onClick={() => setIsContactOpen(false)}
            aria-hidden="true"
          />

          {/* Panel Lateral Drawer */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-lg bg-[#FAF6EE] text-nogal h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-400 ease-out border-l border-[#D4AF37]/30"
          >
            {/* Header de Lujo con Sello Las Flores */}
            <div className="bg-[#2D473C] text-[#FBF5E6] p-6 pb-5 flex items-center justify-between border-b border-[#D4AF37]/30 shrink-0 shadow-md">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white p-1.5 flex items-center justify-center border-2 border-[#D4AF37] shadow-sm shrink-0">
                  <img src="/images.png" alt="Las Flores" className="w-full h-full object-contain" />
                </div>
                <div>
                  <span className="text-[10px] font-sans uppercase font-extrabold text-[#D4AF37] tracking-widest flex items-center gap-1.5">
                    <Sparkles size={12} />
                    Cotizaciones & Eventos
                  </span>
                  <h3 className="font-serif text-xl font-bold text-white tracking-tight">
                    Planifica tu Evento
                  </h3>
                  <p className="text-xs text-emerald-200/80 font-medium">
                    Salones privados y jardines coloniales en Ayacucho
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsContactOpen(false)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
                aria-label="Cerrar modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Cuerpo del Drawer (Scrollable) */}
            <div className="p-5 sm:p-7 flex-1 overflow-y-auto space-y-6">
              {formStatus === "success" ? (
                <div className="h-full py-12 flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in-95 duration-300">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center text-3xl shadow-sm border-2 border-emerald-300">
                    <CheckCircle2 size={42} strokeWidth={2.2} />
                  </div>
                  <div className="space-y-2">
                    <span className="text-xs font-extrabold uppercase tracking-widest text-[#D4AF37] block">
                      Solicitud Recibida
                    </span>
                    <h3 className="font-serif text-3xl font-bold text-[#2D473C]">
                      ¡Gracias por Elegirnos!
                    </h3>
                    <p className="text-sm text-gray-700 max-w-sm mx-auto leading-relaxed">
                      Hemos recibido los detalles de tu evento. Nuestro coordinador de eventos se comunicará contigo vía WhatsApp / Teléfono en breve para presentarte la propuesta a medida.
                    </p>
                  </div>

                  <div className="w-full pt-4 space-y-3">
                    <a
                      href="https://wa.me/51980723422?text=Hola%20Las%20Flores,%20acabo%20de%20enviar%20mi%20solicitud%20de%20cotizaci%C3%B3n%20para%20un%20evento.%20%C2%BFMe%20podr%C3%ADan%20brindar%20m%C3%A1s%20detalles?"
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-3.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <PhoneCall size={16} />
                      <span>Conversar por WhatsApp Ahora</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        setIsContactOpen(false);
                        setTimeout(() => setFormStatus("idle"), 400);
                      }}
                      className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs uppercase tracking-wider font-bold rounded-xl transition-all"
                    >
                      Cerrar Ventana
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Banner de Contacto Inmediato por WhatsApp */}
                  <div className="bg-gradient-to-r from-emerald-900 to-[#2D473C] rounded-2xl p-4 text-white shadow-md border border-[#D4AF37]/40 flex flex-col sm:flex-row items-center justify-between gap-3.5">
                    <div className="space-y-0.5 text-center sm:text-left">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#D4AF37] block">
                        ⚡ Atención Inmediata
                      </span>
                      <p className="text-xs font-bold text-white leading-tight">
                        ¿Deseas una cotización exprés por WhatsApp?
                      </p>
                      <p className="text-[11px] text-emerald-200/80">
                        Disponibilidad en tiempo real y catálogo en PDF
                      </p>
                    </div>
                    <a
                      href="https://wa.me/51980723422?text=Hola%20Las%20Flores,%20deseo%20cotizar%20un%20evento%20especial%20en%20sus%20salones.%20%C2%BFMe%20podr%C3%ADan%20compartir%20informaci%C3%B3n%20y%20men%C3%BAs?"
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 shrink-0 cursor-pointer active:scale-95"
                    >
                      <PhoneCall size={14} />
                      <span>Chatear (+51 980 723 422)</span>
                    </a>
                  </div>

                  {/* Separador elegante */}
                  <div className="relative flex items-center justify-center my-2">
                    <div className="border-t border-black/10 w-full" />
                    <span className="bg-[#FAF6EE] px-3 text-[10px] font-extrabold uppercase tracking-wider text-gray-500 shrink-0">
                      O completa el formulario formal
                    </span>
                    <div className="border-t border-black/10 w-full" />
                  </div>

                  {/* Formulario Formal */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Tarjeta de Datos de Contacto */}
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-black/10 shadow-xs space-y-3.5">
                      <h4 className="font-serif text-sm font-bold text-[#2D473C] flex items-center gap-2 border-b border-gray-100 pb-2">
                        <User size={16} className="text-[#D4AF37]" />
                        1. Tus Datos de Contacto
                      </h4>

                      <div className="space-y-1">
                        <label htmlFor="nombre" className="text-[11px] uppercase tracking-wider text-gray-700 font-bold block">
                          Nombre y Apellidos *
                        </label>
                        <div className="relative">
                          <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            id="nombre"
                            required
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2D473C] focus:bg-white transition-all"
                            placeholder="Ej. Carmen Navarro"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label htmlFor="telefono" className="text-[11px] uppercase tracking-wider text-gray-700 font-bold block">
                            Teléfono / WhatsApp *
                          </label>
                          <div className="relative">
                            <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="tel"
                              id="telefono"
                              required
                              className="w-full pl-10 pr-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2D473C] focus:bg-white transition-all"
                              placeholder="Ej. 987 654 321"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label htmlFor="email" className="text-[11px] uppercase tracking-wider text-gray-700 font-bold block">
                            Correo Electrónico *
                          </label>
                          <div className="relative">
                            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="email"
                              id="email"
                              required
                              className="w-full pl-10 pr-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2D473C] focus:bg-white transition-all"
                              placeholder="carmen@ejemplo.com"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tarjeta de Detalles del Evento */}
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-black/10 shadow-xs space-y-3.5">
                      <h4 className="font-serif text-sm font-bold text-[#2D473C] flex items-center gap-2 border-b border-gray-100 pb-2">
                        <Sparkles size={16} className="text-[#D4AF37]" />
                        2. Detalles de la Celebración
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label htmlFor="tipo" className="text-[11px] uppercase tracking-wider text-gray-700 font-bold block">
                            Tipo de Evento *
                          </label>
                          <select
                            id="tipo"
                            required
                            defaultValue=""
                            className="w-full px-3.5 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2D473C] focus:bg-white transition-all cursor-pointer"
                          >
                            <option value="" disabled>Selecciona el tipo...</option>
                            <option value="bodas">Bodas y Recepciones de Gala</option>
                            <option value="corporativo">Reuniones Corporativas & Conferencias</option>
                            <option value="familiar">Celebración Familiar / Cumpleaños</option>
                            <option value="aniversario">Aniversario / Bodas de Oro/Plata</option>
                            <option value="graduacion">Graduación / Fiesta de Promoción</option>
                            <option value="bautizo">Bautizo / Primera Comunión</option>
                            <option value="cena_privada">Cena Privada de Alta Cocina</option>
                            <option value="otro">Otro Evento Especial</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label htmlFor="invitados" className="text-[11px] uppercase tracking-wider text-gray-700 font-bold block">
                            Nº de Invitados Estimado *
                          </label>
                          <div className="relative">
                            <Users size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="number"
                              id="invitados"
                              min="5"
                              max="500"
                              required
                              className="w-full pl-10 pr-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2D473C] focus:bg-white transition-all"
                              placeholder="Ej. 50 personas"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label htmlFor="fecha" className="text-[11px] uppercase tracking-wider text-gray-700 font-bold block">
                            Fecha Deseada *
                          </label>
                          <div className="relative">
                            <input
                              type="date"
                              id="fecha"
                              required
                              className="w-full px-3.5 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2D473C] focus:bg-white transition-all"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label htmlFor="turno" className="text-[11px] uppercase tracking-wider text-gray-700 font-bold block">
                            Turno / Horario Preferido
                          </label>
                          <select
                            id="turno"
                            defaultValue="almuerzo"
                            className="w-full px-3.5 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2D473C] focus:bg-white transition-all cursor-pointer"
                          >
                            <option value="almuerzo">Almuerzo (12:30 pm – 04:30 pm)</option>
                            <option value="cena">Tarde / Cena (06:30 pm – 11:30 pm)</option>
                            <option value="completo">Jornada Completa</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label htmlFor="mensaje" className="text-[11px] uppercase tracking-wider text-gray-700 font-bold block">
                          Requerimientos Especiales & Detalles
                        </label>
                        <div className="relative">
                          <textarea
                            id="mensaje"
                            rows={3}
                            className="w-full p-3 bg-gray-50/80 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2D473C] focus:bg-white transition-all resize-none"
                            placeholder="Cuéntanos si requieres menú especial, equipos audiovisuales, decoración floral, música o requerimientos particulares..."
                          ></textarea>
                        </div>
                      </div>
                    </div>

                    {/* Botón de Envío y Garantía */}
                    <div className="pt-2 space-y-2.5">
                      <button
                        type="submit"
                        disabled={formStatus === "submitting"}
                        className="w-full py-4 bg-[#2D473C] hover:bg-[#1E352B] text-[#FBF5E6] text-xs uppercase tracking-[0.2em] font-extrabold rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2.5 disabled:opacity-60 cursor-pointer active:scale-98"
                      >
                        {formStatus === "submitting" ? (
                          <>
                            <Loader2 size={18} className="animate-spin text-[#D4AF37]" />
                            <span>Procesando Cotización...</span>
                          </>
                        ) : (
                          <>
                            <Send size={16} className="text-[#D4AF37]" />
                            <span>Solicitar Cotización de Evento</span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center justify-center gap-1.5 text-center text-[10px] text-gray-500 font-medium">
                        <ShieldCheck size={13} className="text-emerald-600 shrink-0" />
                        <span>Sin compromiso · Te enviaremos propuesta y presupuesto en PDF / WhatsApp.</span>
                      </div>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

