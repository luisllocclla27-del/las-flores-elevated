import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteNavigationMenu } from "@/components/SiteNavigationMenu";
import { categories as staticCategories } from "@/components/MenuModal";
import { MenuModal } from "@/components/MenuModal";
import { SiteFooter } from "@/components/site-footer";
import { useLiveMenuCategories, Dish } from "@/lib/liveProducts";
import { CartSidebar } from "@/components/CartSidebar";
import { useCart } from "@/context/CartContext";
import { ShoppingCart } from "lucide-react";

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

  const currentCategories = liveCategories.length > 0 ? liveCategories : staticCategories;
  const active = currentCategories.find((c) => c.id === activeId) || currentCategories[0];

  return (
    <div className="min-h-screen bg-piedra text-nogal font-sans flex flex-col">
      {/* Unified Top Nav Bar - Premium Style (Matches Homepage & Reservas) */}
      <nav className="bg-[#f8f4e6] text-nogal px-4 md:px-10 py-3 flex items-center justify-between shadow-xs border-b border-nogal/10 sticky top-0 z-50">
        <div className="flex-1 flex justify-start items-center">
          <SiteNavigationMenu isScrolled={true} />
        </div>

        <Link
          to="/"
          className="flex-none pointer-events-auto"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <img
            src="/images.png"
            alt="Las Flores Logo"
            className="h-8 md:h-10 w-auto object-contain"
          />
        </Link>

        <div className="flex-1 flex justify-end items-center gap-4 md:gap-6 text-[11px] md:text-sm uppercase tracking-[0.15em] font-semibold pointer-events-auto">
          {totalItems > 0 && (
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative hover:text-chilca transition-colors text-nogal mr-2"
            >
              <ShoppingCart size={20} />
              <span className="absolute -top-2 -right-2 bg-chilca text-nogal text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {totalItems}
              </span>
            </button>
          )}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="hidden sm:inline-block hover:text-chilca transition-colors text-nogal leading-none"
          >
            DELIVERY
          </button>
          <Link
            to="/reservas"
            className="pointer-events-auto px-4.5 py-1.5 md:px-5 md:py-2 text-[11px] md:text-xs font-bold uppercase tracking-widest transition-all rounded-full border border-nogal text-nogal hover:bg-nogal hover:text-white shadow-sm"
          >
            Reservar
          </Link>
        </div>
      </nav>

      {/* Page Title */}
      <div className="bg-piedra pt-10 pb-4 text-center">
        <h1 className="font-serif text-4xl md:text-6xl text-nogal font-normal leading-tight">Nuestra Carta</h1>
      </div>

      {/* Main Content with Sidebar */}
      <div className="flex flex-col md:flex-row max-w-7xl mx-auto w-full flex-1">
        {/* Vertical Category Sidebar (Desktop) / Horizontal Tabs (Mobile) */}
        <aside className="w-full md:w-72 bg-piedra border-b md:border-b-0 md:border-r border-nogal/10 flex-shrink-0 md:sticky md:top-24 md:h-[calc(100vh-100px)] overflow-x-auto md:overflow-y-auto z-20 scrollbar-none">
          <div className="flex flex-row md:flex-col py-0 md:py-8 w-max min-w-full md:w-auto md:pr-8">
            {currentCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveId(cat.id);
                  if (window.innerWidth < 768) {
                    window.scrollTo({
                      top: document.getElementById("menu-content")?.offsetTop || 0,
                      behavior: "smooth",
                    });
                  }
                }}
                className={`text-center md:text-left whitespace-nowrap md:whitespace-normal px-6 md:px-8 py-4 md:py-3.5 text-[11px] font-bold uppercase tracking-[0.15em] transition-all border-b-4 md:border-b-0 md:border-l-4 md:rounded-r-full ${
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
