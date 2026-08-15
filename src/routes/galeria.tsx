import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteNavigationMenu } from "@/components/SiteNavigationMenu";
import { Sparkles, ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/galeria")({
  head: () => ({
    meta: [
      { title: "Galería | Restaurante Las Flores Ayacucho" },
      {
        name: "description",
        content:
          "Galería fotográfica del Restaurante Las Flores en Ayacucho. Descubre nuestros platos, ambiente y momentos especiales.",
      },
    ],
  }),
  component: GaleriaPage,
});

type Category = {
  id: string;
  label: string;
  images: string[];
};

const GALLERY_CATEGORIES: Category[] = [
  {
    id: "arte-cultura",
    label: "Arte y Cultura",
    images: [
      "/imagenes-reales/galeria/arte-cultura/textil-uno.webp",
      "/imagenes-reales/galeria/arte-cultura/textil-dos.webp",
      "/imagenes-reales/galeria/arte-cultura/textil-tres.webp",
      "/imagenes-reales/galeria/arte-cultura/ceramica-uno.webp",
      "/imagenes-reales/galeria/arte-cultura/ceramica-dos.webp",
      "/imagenes-reales/galeria/arte-cultura/ceramica-tres.webp",
      "/imagenes-reales/galeria/arte-cultura/ceramica-cuatro.webp",
      "/imagenes-reales/galeria/arte-cultura/retablo-uno.webp",
      "/imagenes-reales/galeria/arte-cultura/retablo-dos.webp",
      "/imagenes-reales/galeria/arte-cultura/retablo-tres.webp",
      "/imagenes-reales/galeria/arte-cultura/piedra-huamanga-uno.webp",
      "/imagenes-reales/galeria/arte-cultura/piedra-huamanga-dos.webp",
      "/imagenes-reales/galeria/arte-cultura/piedra-huamanga-tres.webp",
      "/imagenes-reales/galeria/arte-cultura/piedra-huamanga-cuatro.webp",
      "/imagenes-reales/galeria/arte-cultura/cereria-uno.webp",
      "/imagenes-reales/galeria/arte-cultura/cereria-dos.webp",
      "/imagenes-reales/galeria/arte-cultura/cereria-tres.webp",
      "/imagenes-reales/galeria/arte-cultura/telar-uno.webp",
      "/imagenes-reales/galeria/arte-cultura/telar-dos.webp",
      "/imagenes-reales/galeria/arte-cultura/telar-tres.webp",
      "/imagenes-reales/galeria/arte-cultura/orfebreria-uno.webp",
      "/imagenes-reales/galeria/arte-cultura/orfebreria-dos.webp",
    ],
  },
  {
    id: "festividades",
    label: "Festividades",
    images: [
      "/imagenes-reales/galeria/festividades/carnaval-uno.webp",
      "/imagenes-reales/galeria/festividades/carnaval-tres.webp",
      "/imagenes-reales/galeria/festividades/carnaval-dos.webp",
      "/imagenes-reales/galeria/festividades/samana-santa-uno.webp",
      "/imagenes-reales/galeria/festividades/semana-santa-dos.webp",
      "/imagenes-reales/galeria/festividades/semana-santa-tres.webp",
      "/imagenes-reales/galeria/festividades/hatun-yacu-raymi-uno.webp",
      "/imagenes-reales/galeria/festividades/hatun-yacu-raymi-dos.webp",
      "/imagenes-reales/galeria/festividades/vilcas-raymi-uno.webp",
      "/imagenes-reales/galeria/festividades/vilcas-raymi-dos.webp",
      "/imagenes-reales/galeria/festividades/chaccu-uno.webp",
      "/imagenes-reales/galeria/festividades/chaccu-dos.webp",
    ],
  },
  {
    id: "destino",
    label: "Destino",
    images: [
      "/imagenes-reales/galeria/destino/Cañon1.webp",
      "/imagenes-reales/galeria/destino/Cañon2.webp",
      "/imagenes-reales/galeria/destino/Cañon3.webp",
      "/imagenes-reales/galeria/destino/Arco1.webp",
      "/imagenes-reales/galeria/destino/Arco2.webp",
      "/imagenes-reales/galeria/destino/Arco3.webp",
      "/imagenes-reales/galeria/destino/Catedral1.webp",
      "/imagenes-reales/galeria/destino/Catedral2.webp",
      "/imagenes-reales/galeria/destino/Catedral3.webp",
      "/imagenes-reales/galeria/destino/Plaza1.webp",
      "/imagenes-reales/galeria/destino/Plaza2.webp",
      "/imagenes-reales/galeria/destino/Plaza3.webp",
      "/imagenes-reales/galeria/destino/Pullas1.webp",
      "/imagenes-reales/galeria/destino/Pullas2.webp",
      "/imagenes-reales/galeria/destino/Pullas3.webp",
      "/imagenes-reales/galeria/destino/Acuchimay1.webp",
      "/imagenes-reales/galeria/destino/Acuchimay2.webp",
      "/imagenes-reales/galeria/destino/Acuchimay3.webp",
      "/imagenes-reales/galeria/destino/Quinua1.webp",
      "/imagenes-reales/galeria/destino/Quinua2.webp",
      "/imagenes-reales/galeria/destino/Quinua3.webp",
      "/imagenes-reales/galeria/destino/Vilcas1.webp",
      "/imagenes-reales/galeria/destino/Vilcas2.webp",
      "/imagenes-reales/galeria/destino/Vilcas3.webp",
      "/imagenes-reales/galeria/destino/Turquesa1.webp",
      "/imagenes-reales/galeria/destino/Turquesa2.webp",
      "/imagenes-reales/galeria/destino/Turquesa3.webp",
      "/imagenes-reales/galeria/destino/Cascadas1.webp",
      "/imagenes-reales/galeria/destino/Cascadas2.webp",
      "/imagenes-reales/galeria/destino/Cascadas3.webp",
      "/imagenes-reales/galeria/destino/Iglesia1.webp",
      "/imagenes-reales/galeria/destino/Iglesia2.webp",
      "/imagenes-reales/galeria/destino/Iglesia3.webp",
    ],
  },
  {
    id: "postres-bebidas",
    label: "Postres y Bebidas",
    images: [
      "/imagenes-reales/galeria/postres-bebidas/chicha-uno.webp",
      "/imagenes-reales/galeria/postres-bebidas/chicha-dos.webp",
      "/imagenes-reales/galeria/postres-bebidas/chicha-tres.webp",
      "/imagenes-reales/galeria/postres-bebidas/chicha-cinco.webp",
      "/imagenes-reales/galeria/postres-bebidas/panes-dos.webp",
      "/imagenes-reales/galeria/postres-bebidas/wawa-uno.webp",
      "/imagenes-reales/galeria/postres-bebidas/galleta-tres.webp",
      "/imagenes-reales/galeria/postres-bebidas/galleta-cuatro.webp",
    ],
  },
  {
    id: "experiencia",
    label: "Experiencia",
    images: [
      "/imagenes-reales/EVENTOS-COORPORATIVAS/reuniones-corporativas.webp",
      "/imagenes-reales/EVENTOS-COORPORATIVAS/celebraciones-familiares.webp",
      "/imagenes-reales/EVENTOS-COORPORATIVAS/bodas-recepciones.webp",
    ],
  }
];

function GaleriaPage() {
  const [activeCategory, setActiveCategory] = useState<string>("arte-cultura");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const currentCategory = GALLERY_CATEGORIES.find((cat) => cat.id === activeCategory);
  const images = currentCategory?.images ?? [];

  const openImage = (idx: number) => setSelectedIndex(idx);
  const closeImage = () => setSelectedIndex(null);
  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIndex((i) => (i !== null ? (i - 1 + images.length) % images.length : null));
  };
  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIndex((i) => (i !== null ? (i + 1) % images.length : null));
  };

  return (
    <div className="min-h-screen bg-piedra flex flex-col">
      {/* Navigation Bar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-10 py-3 transition-all duration-300 pointer-events-none ${
          isScrolled
            ? "bg-piedra/95 backdrop-blur-sm border-b border-nogal/10"
            : "bg-transparent border-b border-transparent"
        }`}>
        <div className="flex-1 flex justify-start items-center">
          <SiteNavigationMenu isScrolled={isScrolled} isAlwaysDark={false} />
        </div>
        <div className="flex-none pointer-events-auto">
          <img
            src="/images.png"
            alt="Restaurante Las Flores"
            className="h-10 w-auto object-contain transition-all"
            style={
              isScrolled
                ? {
                    filter:
                      "brightness(0) saturate(100%) invert(19%) sepia(16%) saturate(740%) hue-rotate(346deg) brightness(96%) contrast(89%)",
                  }
                : { filter: "brightness(0) invert(1)" }
            }
          />
        </div>
        <div className="flex-1 flex justify-end items-center gap-4 md:gap-8 pointer-events-auto">
          <Link
            to="/reservas"
            className={`px-4.5 py-1.5 md:px-5 md:py-2 text-[11px] md:text-xs font-bold uppercase tracking-widest transition-all rounded-full border ${
              isScrolled
                ? "border-nogal text-nogal hover:bg-nogal hover:text-white shadow-sm"
                : "border-piedra/60 text-piedra hover:bg-piedra hover:text-nogal shadow-sm"
            }`}
          >
            Reservar
          </Link>
        </div>
      </nav>

      {/* Header Banner */}
      <section className="relative min-h-[60vh] flex items-center justify-center pt-32 pb-24 px-6 bg-eucalipto-dark text-piedra overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/imagenes-reales/hero-paginas/hero-galeria.webp"
            alt="Galería Las Flores"
            loading="eager"
            decoding="async"
            className="w-full h-full object-cover opacity-65 filter brightness-105 saturate-[1.1]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/45 to-black/30" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          <span className="text-chilca font-medium uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-2">
            <Sparkles size={14} />
            Nuestra Galería · Momentos que inspiran
            <Sparkles size={14} />
          </span>
          <h1 className="font-serif text-4xl md:text-6xl text-piedra font-normal leading-tight">
            Galería de Momentos
          </h1>
          <p className="text-base md:text-lg text-piedra/90 max-w-3xl mx-auto leading-relaxed">
            Descubre a través de imágenes la esencia de nuestro restaurante, nuestra cultura ayacuchana y los sabores que nos definen.
          </p>
        </div>
      </section>

      {/* ── FILTROS MÓVIL: sticky pegado al header (solo < lg) ── */}
      <div className="block lg:hidden sticky top-[56px] z-30 w-full bg-[#F9F8F3] border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div
            className="flex items-center gap-2.5 overflow-x-auto py-3 scrollbar-none"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {GALLERY_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 whitespace-nowrap px-5 py-2 rounded-full text-xs font-bold transition-all ${
                  activeCategory === cat.id
                    ? "bg-[#2D473C] text-[#D4AF37] shadow-md"
                    : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* ── FILTROS DESKTOP: centrados dentro del contenido (solo lg+) ── */}
        <div className="hidden lg:flex justify-center gap-3 mb-12">
          {GALLERY_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                activeCategory === cat.id
                  ? "bg-[#2D473C] text-[#D4AF37] shadow-md"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentCategory?.images.map((img, idx) => (
            <div
              key={idx}
              onClick={() => openImage(idx)}
              className="relative aspect-[3/4] overflow-hidden group cursor-pointer shadow-md hover:shadow-xl transition-shadow duration-300"
            >
              <img
                src={img}
                alt={`${currentCategory.label} ${idx + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              {/* Borde interno delgado */}
              <div className="absolute inset-3 border border-white/40 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          ))}
        </div>
      </main>

      {/* Lightbox Modal */}
      {selectedIndex !== null && images[selectedIndex] && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={closeImage}
        >
          {/* Cerrar */}
          <button
            onClick={closeImage}
            className="absolute top-4 right-4 text-white text-4xl font-light hover:text-piedra transition-colors z-10"
            aria-label="Cerrar"
          >
            ×
          </button>

          {/* Contador */}
          <span className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-xs uppercase tracking-widest">
            {selectedIndex + 1} / {images.length}
          </span>

          {/* Flecha izquierda */}
          <button
            onClick={prevImage}
            className="absolute left-4 md:left-8 text-white/70 hover:text-white transition-colors z-10 bg-black/30 hover:bg-black/60 rounded-full p-2"
            aria-label="Anterior"
          >
            <ChevronLeft size={32} />
          </button>

          {/* Imagen */}
          <img
            src={images[selectedIndex]}
            alt="Vista ampliada"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Flecha derecha */}
          <button
            onClick={nextImage}
            className="absolute right-4 md:right-8 text-white/70 hover:text-white transition-colors z-10 bg-black/30 hover:bg-black/60 rounded-full p-2"
            aria-label="Siguiente"
          >
            <ChevronRight size={32} />
          </button>
        </div>
      )}

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}
