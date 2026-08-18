import { createFileRoute, Link } from "@tanstack/react-router";
const equipoImg = "/imagenes-reales/EQUIPO/02042026-DSC04926.webp";
const casaImg = "/imagenes-reales/EQUIPO/Gregoria.webp";
const cocinaImg = "/imagenes-reales/EQUIPO/02042026-DSC05081-opt.webp";
const platoPucaImg = "/gastronomia/puca-picante.webp"; // placeholder
const platoCuyImg = "/gastronomia/cuy-chactado.webp"; // placeholder
const platoMaizImg = "/gastronomia/chicharron.webp"; // placeholder
import { SiteFooter } from "@/components/site-footer";
import { useState, useTransition, useEffect, useRef } from "react";
import { Calendar, CreditCard, ChevronRight, Check, ChevronDown } from "lucide-react";
import { SiteNavigationMenu } from "../components/SiteNavigationMenu";
import { useCart } from "@/context/CartContext";
import { AnimatedCartButton } from "@/components/AnimatedCartButton";

import { MenuModal } from "@/components/MenuModal";
import { FamiliaLasFloresSection } from "../components/FamiliaLasFloresSection";

export const Route = createFileRoute("/restaurante")({
  head: () => ({
    meta: [
      { title: "Nuestro Restaurante — Las Flores | Tres generaciones" },
      {
        name: "description",
        content:
          "Tres generaciones cocinando Ayacucho. Conozca la historia, el equipo y las recomendaciones del chef de Restaurante Las Flores.",
      },
      { property: "og:title", content: "Nuestro Restaurante — Las Flores" },
      {
        property: "og:description",
        content: "La historia, el equipo y la firma del chef de Restaurante Las Flores.",
      },
      {
        property: "og:image",
        content: new URL(casaImg, "https://www.restaurantelasflores.com").toString(),
      },
      {
        name: "twitter:image",
        content: new URL(casaImg, "https://www.restaurantelasflores.com").toString(),
      },
      { property: "og:url", content: "https://www.restaurantelasflores.com/restaurante" },
    ],
    links: [{ rel: "canonical", href: "https://www.restaurantelasflores.com/restaurante" }],
  }),
  component: RestaurantePage,
});

type GenerationStory = {
  generation: string;
  name: string;
  image: string;
  alt: string;
  summary: string;
  contribution: string;
};

const generationStories: GenerationStory[] = [
  {
    generation: "Origen",
    name: "Mamina",
    image: "/imagenes-reales/FAMILIA-HISTORIA/mamina.webp",
    alt: "Fundadora de Las Flores en la cocina",
    summary:
      "Mamina abrió la primera casa de sabor, donde la hospitalidad, el fuego y la memoria compartida dieron forma a la identidad de Las Flores.",
    contribution:
      "Puso la base de la cocina familiar y consolidó el vínculo entre tradición, hogar y mesa.",
  },
  {
    generation: "Consolidación",
    name: "Gloria",
    image: "/imagenes-reales/FAMILIA-HISTORIA/gloria.webp",
    alt: "Gloria en la etapa de consolidación del restaurante Las Flores",
    summary:
      "Gloria tomó las riendas y transformó el comedor familiar en un santuario gastronómico, formalizando el negocio y llevando el sabor de Ayacucho a nuevos horizontes sin perder la esencia.",
    contribution: "Formalizó el negocio y proyectó la cocina de Ayacucho hacia nuevos horizontes.",
  },
  {
    generation: "Legado",
    name: "Mijail",
    image: "/imagenes-reales/FAMILIA-HISTORIA/mijail.webp",
    alt: "Mijail junto a la tercera generación de Las Flores",
    summary:
      "Mijail lidera la tercera generación, preservando el fuego original y llevando nuestra tradición culinaria hacia una experiencia contemporánea.",
    contribution:
      "Mantiene viva la esencia familiar mientras proyecta la cocina hacia el presente.",
  },
];

const chefRecommendations = [
  {
    name: "Puca Picante",
    price: "S/ 65",
    description:
      "Guiso de papa vieja en salsa de ají panca con maní tostado, trozos de carne de cerdo y especias, servido con arroz blanco, ensalada regional y una presa de chicharrón huamanguino.",
    image: "/imagenes-reales/RECOMENDACIONES-CHEF/puca.webp",
    alt: "Puca Picante",
  },
  {
    name: "Cuy las Flores",
    price: "S/ 85",
    description:
      "Plato insignia, acompañado con papas nativas doradas, qapchi, choclo salteado en especias, ensalada criolla y chips de papas.",
    image: "/imagenes-reales/RECOMENDACIONES-CHEF/cuy-chactado.webp",
    alt: "Cuy las Flores",
  },
  {
    name: "Chicharrón Huamanguino",
    price: "S/ 70",
    description:
      "Trozos de carne de cerdo dorados en su propia manteca, acompañado de papas sancochadas, qapchi, chips de camote y ensalada criolla.",
    image: "/imagenes-reales/RECOMENDACIONES-CHEF/chicharon.webp",
    alt: "Chicharrón Huamanguino",
  },
];

function GenerationFlipCard({
  generation,
  isActive,
  onSelect,
}: {
  generation: GenerationStory;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <article className="group h-full [perspective:1400px]">
      <div
        tabIndex={0}
        role="button"
        onClick={onSelect}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect();
          }
        }}
        className="relative h-[380px] md:h-[420px] w-full overflow-hidden rounded-[2rem] bg-transparent text-left cursor-pointer focus:outline-none"
      >
        <div className={`relative h-full w-full transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] [transform-style:preserve-3d] md:group-hover:[transform:rotateY(180deg)] md:group-focus:[transform:rotateY(180deg)] ${isActive ? "[transform:rotateY(180deg)] md:[transform:none]" : ""} shadow-xl`}>
          {/* Front Face */}
          <div
            className="absolute inset-0 h-full w-full rounded-[2rem] overflow-hidden bg-eucalipto"
            style={{ backfaceVisibility: "hidden" }}
          >
            <img
              src={generation.image}
              alt={generation.alt}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-8 text-piedra">
              <span className="inline-flex rounded-full border border-piedra/30 bg-eucalipto/30 backdrop-blur-md px-4 py-1.5 text-[10px] uppercase tracking-[0.35em] text-piedra/90 mb-4">
                {generation.generation}
              </span>
              <h3 className="font-serif text-3xl md:text-4xl leading-tight text-balance">
                {generation.name}
              </h3>
            </div>
          </div>

          {/* Back Face */}
          <div
            className="absolute inset-0 flex h-full w-full flex-col justify-between rounded-[2rem] bg-[#f8f4e6] p-8 md:p-10 text-nogal shadow-inner border border-nogal/5"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <div>
              <span className="inline-flex rounded-full border border-nogal/20 bg-piedra px-4 py-1.5 text-[10px] uppercase tracking-[0.35em] text-nogal/80 mb-5">
                {generation.generation}
              </span>
              <h3 className="font-serif text-3xl leading-tight text-nogal text-balance mb-6">
                {generation.name}
              </h3>
              <p className="text-base leading-relaxed text-nogal/80 text-pretty">
                {generation.summary}
              </p>
            </div>

            <div className="mt-auto pt-6 border-t border-nogal/10">
              <span className="block text-[10px] uppercase tracking-[0.3em] text-nogal/60 mb-2 font-bold">
                Su Legado
              </span>
              <p className="text-sm leading-relaxed text-nogal/80">{generation.contribution}</p>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function GenerationsSection() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <section id="historia" className="bg-piedra py-16 md:py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-3xl mb-8 md:mb-12">
          <span className="text-eucalipto font-medium uppercase tracking-[0.3em] text-xs mb-4 block">
            Las Tres Generaciones
          </span>
          <h2 className="font-serif text-4xl md:text-5xl leading-[1.05] text-balance">
            La historia y el legado familiar de Las Flores
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 xl:gap-8">
          {generationStories.map((generation, index) => (
            <GenerationFlipCard
              key={generation.name}
              generation={generation}
              isActive={activeIndex === index}
              onSelect={() => setActiveIndex((prev) => (prev === index ? null : index))}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ChefAccordionSection() {
  const [activeIndex, setActiveIndex] = useState<number | null>(1);
  const [isMobile, setIsMobile] = useState(false);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateIsMobile = () => {
      const mobile = mediaQuery.matches;
      setIsMobile(mobile);
      if (!mobile) {
        setActiveIndex(1);
      }
    };
    updateIsMobile();
    mediaQuery.addEventListener("change", updateIsMobile);
    return () => mediaQuery.removeEventListener("change", updateIsMobile);
  }, []);

  useEffect(() => {
    if (!isMobile) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length === 0) return;

        const bestEntry = visible.reduce((best, current) =>
          current.intersectionRatio > best.intersectionRatio ? current : best
        );

        const index = Number(bestEntry.target.getAttribute("data-plate-index"));
        if (!Number.isNaN(index)) {
          setActiveIndex(index);
        }
      },
      {
        root: null,
        rootMargin: "-45% 0px -45% 0px",
        threshold: 0.5,
      }
    );

    itemRefs.current.forEach((node) => node && observer.observe(node));
    return () => observer.disconnect();
  }, [isMobile]);

  return (
    <section className="bg-piedra py-16 md:py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <span className="text-eucalipto font-medium uppercase tracking-[0.3em] text-xs mb-4 block">
            Especialidad de Casa
          </span>
          <h2 className="font-serif text-4xl md:text-5xl leading-[1.05] text-balance">
            Recomendaciones del Chef
          </h2>
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row md:h-[400px]">
          {chefRecommendations.map((plate, index) => {
            const isActive = !isMobile || activeIndex === index;
            return (
              <button
                key={plate.name}
                ref={(el) => { itemRefs.current[index] = el; }}
                data-plate-index={index}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`group relative overflow-hidden rounded-[1.75rem] border border-nogal/10 bg-white text-left shadow-md transition-all duration-500 ease-out ${isActive ? "md:flex-[2.2]" : "md:flex-[0.9]"} ${isActive ? "min-h-[280px]" : "min-h-[120px]"}`}
              >
                <img
                  src={plate.image}
                  alt={plate.alt}
                  loading={isMobile && isActive ? "eager" : "lazy"}
                  fetchPriority={isMobile && isActive ? "high" : "low"}
                  decoding="async"
                  width={1000}
                  height={800}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 will-change-transform"
                />
                <div
                  className={`absolute inset-0 transition-all duration-500 ${isActive ? "bg-gradient-to-t from-ink/90 via-ink/40 to-transparent" : "bg-gradient-to-t from-ink/70 via-ink/20 to-transparent"}`}
                />
                <div className="absolute inset-x-0 bottom-0 p-5 md:p-6 text-piedra">
                  <div
                    className={`transition-all duration-500 ${isActive ? "translate-y-0 opacity-100" : "translate-y-3 opacity-90"}`}
                  >
                    <h3 className="text-lg md:text-xl font-serif leading-tight">{plate.name}</h3>
                    <p
                      className={`mt-3 text-sm leading-relaxed text-piedra/80 transition-all duration-500 ${isActive ? "max-h-32 opacity-100" : "max-h-0 opacity-0 overflow-hidden"}`}
                    >
                      {plate.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function RestaurantePage() {
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
  const [isPending, startTransition] = useTransition();

  return (
    <div className="bg-piedra text-nogal font-sans selection:bg-chilca/30">
      {/* Nav: nuestra historia | logo | reservas y delivery */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-3 px-4 md:px-10 py-2 md:py-4 transition-all duration-500 pointer-events-none ${isScrolled ? "bg-piedra text-nogal shadow-md" : "bg-transparent text-piedra"}`}
      >
        <div className="flex items-center">
          <SiteNavigationMenu isScrolled={isScrolled} />
        </div>
        <Link
          to="/restaurante"
          className="flex-1 flex justify-center pointer-events-auto"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <img
            src="/images.png"
            alt="Las Flores Logo"
            className={`w-auto object-contain transition-all duration-500 ${isScrolled ? "h-8" : "h-10 md:h-12 brightness-0 invert"}`}
          />
        </Link>
        <div className="flex items-center gap-4 md:gap-6 text-[11px] md:text-sm uppercase tracking-[0.15em] font-semibold pointer-events-auto">
          <button
            onClick={() => startTransition(() => setIsMenuOpen(true))}
            className="hidden sm:inline-block hover:text-chilca transition-colors leading-none"
          >
            DELIVERY
          </button>
          <Link
            to="/reservas"
            className={`pointer-events-auto px-4.5 py-1.5 md:px-5 md:py-2 text-[11px] md:text-xs font-bold uppercase tracking-widest transition-all rounded-full border ${
              isScrolled
                ? "border-nogal text-nogal hover:bg-nogal hover:text-white shadow-sm"
                : "border-piedra/60 text-piedra hover:bg-piedra hover:text-nogal shadow-sm"
            }`}
          >
            Reservar
          </Link>
          {totalItems > 0 && (
            <AnimatedCartButton
              onClick={() => setCartOpen(true)}
              className="hover:text-chilca transition-colors ml-1"
              size={20}
              color={isScrolled ? "#8B7355" : "#F5F5DC"}
            />
          )}
        </div>
      </nav>

      <header
        id="historia"
        className="relative min-h-[100svh] w-full overflow-hidden bg-eucalipto flex items-center pt-32 pb-24"
      >
        <img
          src={casaImg}
          alt="Gregoria, parte de la familia detrás de cada plato"
          width={1920}
          fetchPriority="high"
          height={800}
          className="absolute inset-0 w-full h-full object-cover opacity-55 animate-hero"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/35 to-ink/90" />

        <div className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-center px-4 sm:px-6 lg:px-8 text-piedra">
          <div className="max-w-3xl text-center">
            <h1 className="font-serif text-4xl md:text-6xl text-piedra font-normal leading-tight animate-reveal [animation-delay:200ms]">
              La familia detrás de cada plato
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-base md:text-lg text-piedra/90 leading-relaxed">
              Cada generación ha dejado una huella distinta: una fundadora que abrió el fuego, una
              segunda etapa que consolidó el proyecto y una tercera que lo lleva al presente con una
              mirada contemporánea.
            </p>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-piedra/60 text-[10px] uppercase tracking-[0.4em] font-medium">Desliza</span>
          <ChevronDown size={24} className="text-piedra/60" strokeWidth={1.5} />
        </div>
      </header>

      <GenerationsSection />

      <ChefAccordionSection />

      {/* Tesoros de Ayacucho */}
      <section id="tesoros" className="bg-eucalipto text-piedra py-16 md:py-32 px-6">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 md:gap-20">
          <div className="flex-1 max-w-[50ch]">
            <span className="text-chilca font-medium uppercase tracking-[0.3em] text-xs mb-6 block">
              Tesoros de Ayacucho
            </span>
            <h2 className="font-serif text-4xl md:text-5xl leading-[1.1] text-balance mb-6">
              Productos ayacuchanos de temporada
            </h2>
            <p className="text-lg text-piedra/70 leading-[1.7] mb-8">
              Descubre los ingredientes autóctonos que dan vida a nuestra cocina: papa nativa, 
              quinoa, nísperos, airampo, tunas y más. Cada temporada trae consigo los mejores 
              productos de nuestra tierra, cosechados en su punto perfecto para ofrecerte 
              el auténtico sabor de Ayacucho.
            </p>
            <Link
              to="/tesoros-ayacucho"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="inline-flex items-center justify-center px-10 py-5 text-[11px] uppercase tracking-[0.25em] font-bold rounded-sm btn-yellow-hover"
            >
              <span>DESCUBRE MÁS</span>
            </Link>
          </div>
          <div className="flex-1 w-full">
            <div className="relative aspect-4/3 rounded-sm overflow-hidden group">
              <img
                src="/inicio/Variedade.png"
                alt="Productos ayacuchanos de temporada"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 border border-piedra/20 m-4 rounded-sm pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Reservas y Delivery */}
      <section id="reservas" className="bg-piedra py-16 md:py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-eucalipto font-medium uppercase tracking-[0.3em] text-xs block mb-6">
            Reservas y Delivery
          </span>
          <h2 className="font-serif text-4xl md:text-6xl leading-[1.05] mb-8 text-balance">
            Reserve su mesa o disfrute Las Flores en casa
          </h2>
          <p className="text-lg text-nogal/70 leading-[1.7] max-w-[52ch] mx-auto mb-12">
            Separe su lugar con anticipación o pida nuestros platos con delivery y recojo en
            Ayacucho.
          </p>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 mt-4">
            <Link
              to="/reservas"
              className="px-10 py-5 font-serif font-bold text-lg tracking-wide rounded-xl btn-yellow-hover inline-block"
            >
              <span>Reservar mesa</span>
            </Link>
            <button
              onClick={() => startTransition(() => setIsMenuOpen(true))}
              className="px-10 py-5 font-serif font-bold text-lg tracking-wide transition-all shadow-md hover:shadow-lg rounded-xl hover:-translate-y-0.5 bg-eucalipto text-piedra"
            >
              Pedir delivery
            </button>
          </div>
        </div>
      </section>

      <SiteFooter />
      {isMenuOpen && <MenuModal open={isMenuOpen} onClose={() => setIsMenuOpen(false)} />}
    </div>
  );
}

