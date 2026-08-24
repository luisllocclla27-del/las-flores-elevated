import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { categories as staticCategories } from "@/components/MenuModal";
import { MenuModal } from "@/components/MenuModal";
import { SiteFooter } from "@/components/site-footer";
import { useLiveMenuCategories, Dish } from "@/lib/liveProducts";
import { CartSidebar } from "@/components/CartSidebar";
import { useCart } from "@/context/CartContext";
import { MobileCategoryFilter } from "@/components/MobileCategoryFilter";

export const Route = createFileRoute("/carta")({
  head: () => ({
    meta: [
      { title: "Carta Digital y Menú — Restaurante Las Flores Ayacucho | Platos Típicos & Delivery" },
      {
        name: "description",
        content:
          "Consulta la carta completa de Restaurante Las Flores en Ayacucho: Puca Picante, Cuy Frito, Pachamanca, Trucha, Chicharrones y postres tradicionales en Jr. José Olaya 106, Huamanga. ¡Pide delivery a domicilio!",
      },
      {
        name: "keywords",
        content:
          "carta restaurante las flores, menu restaurante las flores, precios restaurante las flores, platos tipicos ayacucho, puca picante ayacucho, cuy frito ayacucho, delivery comida ayacucho, chicharrones ayacucho",
      },
      { property: "og:title", content: "Carta Digital y Menú — Restaurante Las Flores Ayacucho" },
      {
        property: "og:description",
        content: "Conoce nuestra variada carta de platos típicos ayacuchanos, desayunos y bebidas tradicionales. Pide delivery o reserva tu mesa.",
      },
      { property: "og:image", content: "https://www.restaurantelasflores.com/images.png" },
      { property: "og:url", content: "https://www.restaurantelasflores.com/carta" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://www.restaurantelasflores.com/carta" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Menu",
          "name": "Carta Digital Restaurante Las Flores Ayacucho",
          "url": "https://www.restaurantelasflores.com/carta",
          "mainEntityOfPage": "https://www.restaurantelasflores.com/carta",
          "inLanguage": "es-PE",
          "hasMenuSection": [
            {
              "@type": "MenuSection",
              "name": "Platos Típicos Ayacuchanos",
              "hasMenuItem": [
                {
                  "@type": "MenuItem",
                  "name": "Puca Picante con Chicharrón",
                  "description": "El plato bandera de Ayacucho preparado a base de maní, ají panca y chicharrón crocante de cerdo.",
                  "offers": { "@type": "Offer", "price": "38.00", "priceCurrency": "PEN" }
                },
                {
                  "@type": "MenuItem",
                  "name": "Cuy Frito Tradicional",
                  "description": "Cuy crocante macerado en hierbas andinas, acompañado de papas doradas y qapchi ayacuchano.",
                  "offers": { "@type": "Offer", "price": "55.00", "priceCurrency": "PEN" }
                },
                {
                  "@type": "MenuItem",
                  "name": "Mondongo Ayacuchano",
                  "description": "Sopa reconfortante de maíz blanco pelado, mote y carne de res cocida a fuego lento.",
                  "offers": { "@type": "Offer", "price": "32.00", "priceCurrency": "PEN" }
                }
              ]
            }
          ]
        }),
      },
    ],
  }),
  component: CartaPage,
});

function CartaPage() {
  const { categories: liveCategories } = useLiveMenuCategories();
  const [activeId, setActiveId] = useState("desayuno");
  const { totalItems, setIsOpen: setIsCartOpen } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleOpenMenu = () => setIsMenuOpen(true);
    window.addEventListener("open_menu_modal", handleOpenMenu);
    return () => window.removeEventListener("open_menu_modal", handleOpenMenu);
  }, []);

  const currentCategories = liveCategories.length > 0 ? liveCategories : staticCategories;

  const goToMenuContent = () => {
    if (window.innerWidth < 768) {
      window.scrollTo({
        top: document.getElementById("menu-content")?.offsetTop || 0,
        behavior: "smooth",
      });
    }
  };
  const active = currentCategories.find((c) => c.id === activeId) || currentCategories[0];

  return (
    <div className="min-h-screen bg-piedra text-nogal font-sans flex flex-col">
      {/* ── HEADER UNIFICADO ── */}
      <SiteHeader
        isAlwaysSolid={true}
        showDelivery={true}
        onDeliveryClick={() => setIsMenuOpen(true)}
      />

      {/* Page Title */}
      <div className="bg-piedra pt-10 pb-4 text-center">
        <h1 className="font-serif text-4xl md:text-6xl text-nogal font-normal leading-tight">Nuestra Carta</h1>
      </div>

      {/* Filtros móvil: carrusel + botón "..." con hoja de todas las categorías */}
      <div className="md:hidden sticky top-[56px] z-20 w-full bg-piedra border-b border-nogal/10 shadow-[0_6px_16px_-8px_rgba(0,0,0,0.15)]">
        <div className="pl-6">
          <MobileCategoryFilter
            categories={currentCategories.map((c) => ({ key: c.id, label: c.label }))}
            activeKey={activeId}
            onSelect={(key) => {
              setActiveId(key);
              goToMenuContent();
            }}
            accentColor="#A32638"
            accentTextColor="#F9F0DE"
          />
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div className="flex flex-col md:flex-row max-w-7xl mx-auto w-full flex-1">
        {/* Vertical Category Sidebar (solo escritorio) */}
        <aside className="hidden md:block w-72 bg-piedra border-r border-nogal/10 flex-shrink-0 sticky top-24 h-[calc(100vh-100px)] overflow-y-auto z-20 scrollbar-none shadow-[6px_0_16px_-10px_rgba(0,0,0,0.15)]">
          <div className="flex flex-col py-8 pr-8">
            {currentCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveId(cat.id)}
                className={`text-left whitespace-normal px-8 py-3.5 text-xs font-bold uppercase tracking-[0.15em] transition-all border-l-4 rounded-r-full ${
                  activeId === cat.id
                    ? "border-cochinilla text-cochinilla bg-cochinilla/10"
                    : "border-transparent text-nogal/50 hover:text-nogal hover:bg-nogal/5"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Menu Content */}
        <main id="menu-content" className="flex-1 p-6 md:p-12">
          {/* Título de Categoría */}
          <div className="flex justify-between items-end mb-5">
            <h2 className="font-serif text-3xl md:text-4xl text-nogal">{active.label}</h2>
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-nogal/40 bg-nogal/5 px-4 py-2 rounded-full hidden sm:inline-block">
              {active.dishes.length} platos
            </span>
          </div>
          
          {/* Separador elegante con rombo (manteniendo el color nogal/20) */}
          <div className="relative flex items-center justify-center mb-10 w-full">
            <div className="absolute inset-0 flex items-center w-full">
              <div className="w-full border-t border-nogal/20"></div>
            </div>
            <div className="relative flex justify-center bg-piedra px-2">
              <div className="w-2 h-2 bg-nogal/30 transform rotate-45"></div>
            </div>
          </div>

          <div
            key={activeId}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {active.dishes.map((dish, i) => {
              return (
                <div
                  key={i}
                  className="bg-piedra border border-pacay/50 rounded-md overflow-hidden flex flex-col h-full shadow-md hover:shadow-xl transition-all duration-300 group hover:border-pacay"
                >
                  {dish.image ? (
                    <div className="h-48 overflow-hidden relative">
                      <div className="absolute inset-0 bg-nogal/10 group-hover:bg-transparent transition-colors z-10 pointer-events-none" />
                      <img
                        src={dish.image}
                        alt={dish.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-nogal/5 flex items-center justify-center relative border-b border-pacay/30">
                      <span className="font-serif italic text-nogal/30 text-xl px-4 text-center">
                        {dish.name}
                      </span>
                    </div>
                  )}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start gap-3 mb-3">
                      <h3 className="text-base font-serif leading-tight text-nogal group-hover:text-cochinilla transition-colors">
                        {dish.name}
                      </h3>
                      <span className="text-adobe-new font-bold text-sm flex-shrink-0 tracking-wide bg-adobe-new/10 px-2 py-1 rounded-sm">
                        {dish.price}
                      </span>
                    </div>
                    <p className="text-nogal/70 text-xs flex-1 mb-4 leading-relaxed font-light">
                      {dish.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      <SiteFooter />

      <CartSidebar />
      
      {isMenuOpen && <MenuModal open={isMenuOpen} onClose={() => setIsMenuOpen(false)} />}
    </div>
  );
}
