import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteNavigationMenu } from "@/components/SiteNavigationMenu";
import { MenuModal } from "@/components/MenuModal";
import { Quote, Heart, Award, Utensils, Sparkles, ArrowRight, Star } from "lucide-react";

export const Route = createFileRoute("/familia-las-flores")({
  head: () => ({
    meta: [
      { title: "Familia Las Flores — El Alma Detrás del Sabor | Ayacucho" },
      {
        name: "description",
        content:
          "Conozca al equipo humano de Restaurante Las Flores. Historias de orgullo, pasión y excelencia culinaria de quienes hacen posible la magia ayacuchana.",
      },
    ],
  }),
  component: FamiliaLasFloresPage,
});

interface Collaborator {
  id: string;
  name: string;
  role: string;
  category: "cocina" | "salon" | "reposteria" | "administracion";
  years: string;
  photo: string;
  quote: string;
  recommendedDish: string;
  dishPrice: string;
  badge: string;
}

const COLLABORATORS: Collaborator[] = [
  {
    id: "admin-1",
    name: "Ritney Betsy",
    role: "Jefa Administrativa",
    category: "administracion",
    years: "5 años en Las Flores",
    photo: "/familia/Ritney.webp",
    quote: "Liderar la administración ha sido un honor. Mi enfoque es optimizar procesos para seguir creciendo juntos.",
    recommendedDish: "Pachamanca",
    dishPrice: "S/ 55.00",
    badge: "Líder Estratégico",
  },
  {
    id: "0",
    name: "Mayte Jarumy",
    role: "Jefa de Azafatas",
    category: "salon",
    years: "3 años en Las Flores",
    photo: "/familia/Mayte.webp",
    quote: "Mi misión es la perfección en el salón. Ver a los clientes regresar felices es mi mayor recompensa.",
    recommendedDish: "Puca Picante Especial",
    dishPrice: "S/ 42.00",
    badge: "Líder de Servicio",
  },
  {
    id: "1",
    name: "Paola Zinthia",
    role: "Maestra Repostera",
    category: "reposteria",
    years: "1 año en Las Flores",
    photo: "/familia/Paola.webp",
    quote: "Este año me permitió perfeccionar mi técnica en panes de masa madre y postres tradicionales de la casa.",
    recommendedDish: "Mazamorra de Calabaza y Chapla Tradicional",
    dishPrice: "S/ 18.00",
    badge: "Maestra Dulcera",
  },
  {
    id: "2",
    name: "Marilu Fernanda",
    role: "Logistica",
    category: "administracion",
    years: "3 años en Las Flores",
    photo: "/familia/Fernanda.webp",
    quote: "Estos tres años me enseñaron la verdadera organización detrás del éxito gastronómico.",
    recommendedDish: "Chancho Azado",
    dishPrice: "S/ 16.00",
    badge: "Anfitrión Estrella",
  },
  {
    id: "3",
    name: "Juan Carlos ",
    role: "Inocuidad",
    category: "administracion",
    years: "1 años en Las Flores",
    photo: "/familia/Carlos.webp",
    quote: "Velar por la higiene y la inocuidad garantiza que cada plato llegue seguro a nuestra mesa.",
    recommendedDish: "Cuy Chactado Crujiente Tradicional",
    dishPrice: "S/ 68.00",
    badge: "Maestro Parrillero",
  },
  {
    id: "4",
    name: "Edgar Luis",
    role: "Chef",
    category: "cocina",
    years: "1 año en Las Flores",
    photo: "/familia/chef.webp",
    quote: "Mi secreto es el respeto por los insumos locales, el liderazgo y el control estricto de calidad.",
    recommendedDish: "Puca Picante con Chicharrón",
    dishPrice: "S/ 38.00",
    badge: "Líder de Cocina",
  },
  {
    id: "5",
    name: "Yadira Paris",
    role: "Cocina",
    category: "cocina",
    years: "1 años en Las Flores",
    photo: "/familia/Cocina.webp",
    quote: "Desarrollé habilidades de organización y trabajo en equipo, fundamentales para nuestro servicio.",
    recommendedDish: "Ceviche de Trucha",
    dishPrice: "S/ 28.00",
    badge: "Mixólogo Andino",
  },
  {
    id: "6",
    name: "Kelly Melisa",
    role: "Ventas",
    category: "administracion",
    years: "1 año en Las Flores",
    photo: "/familia/Melisa.webp",
    quote: "Aprender a escuchar a nuestros clientes me enseñó que la clave es una atención amable y eficiente.",
    recommendedDish: "Chorizo Ayacuchano",
    dishPrice: "S/ 34.00",
    badge: "Garantía de Servicio",
  },
  {
    id: "7",
    name: "Jhon Aldahir",
    role: "Mozo",
    category: "salon",
    years: "1 año en Las Flores",
    photo: "/familia/Jhon.webp",
    quote: "Me enorgullece recibir a cada familia. El ambiente cálido de Las Flores es contagioso.",
    recommendedDish: "Puca Picante con Chicharrón",
    dishPrice: "S/ 38.00",
    badge: "Atención Especial",
  },
  {
    id: "8",
    name: "Heidi Jeraldine",
    role: "Anfitriona",
    category: "salon",
    years: "8 meses en Las Flores",
    photo: "/familia/Heidi.webp",
    quote: "Recibirlos con una sonrisa y guiarlos a su mesa es el primer paso de una gran experiencia.",
    recommendedDish: "Chicharrón de Cerdo",
    dishPrice: "S/ 42.00",
    badge: "Sonrisa Acogedora",
  },
  {
    id: "9",
    name: "Dina Luz",
    role: "Moza",
    category: "salon",
    years: "2 años en Las Flores",
    photo: "/familia/Dina.webp",
    quote: "Atender es un arte. Conozco nuestra carta a la perfección para recomendar lo mejor.",
    recommendedDish: "Cuy Chactado",
    dishPrice: "S/ 68.00",
    badge: "Servicio Impecable",
  },
  {
    id: "10",
    name: "Aurelio",
    role: "Capitán de Mozos",
    category: "salon",
    years: "3 años en Las Flores",
    photo: "/familia/Aurelio.webp",
    quote: "Garantizar un trato excepcional es mi pasión y el verdadero significado de la hospitalidad andina.",
    recommendedDish: "Trucha Frita",
    dishPrice: "S/ 35.00",
    badge: "Líder de Salón",
  },
  {
    id: "11",
    name: "Percy Yoni",
    role: "Azafata",
    category: "salon",
    years: "2 años en Las Flores",
    photo: "/familia/Percy.webp",
    quote: "Me dedico a que cada comensal tenga todo lo que necesita. Han sido dos años de hermosas experiencias.",
    recommendedDish: "Mondongo Ayacuchano",
    dishPrice: "S/ 25.00",
    badge: "Atención Dedicada",
  },
  {
    id: "admin-2",
    name: "Paola Sofia",
    role: "Caja",
    category: "administracion",
    years: "2 años en Las Flores",
    photo: "/familia/Sofia.webp",
    quote: "Atiendo con rapidez y amabilidad para que su experiencia termine tan bien como empezó.",
    recommendedDish: "Choclo con Queso",
    dishPrice: "S/ 15.00",
    badge: "Atención Eficiente",
  },
  {
    id: "admin-3",
    name: "Jose",
    role: "Marketing",
    category: "administracion",
    years: "1 año en Las Flores",
    photo: "/familia/Jose.webp",
    quote: "Muestro al mundo nuestra belleza y sabor, transmitiendo el cariño de nuestros platos.",
    recommendedDish: "Helado de Lúcuma",
    dishPrice: "S/ 12.00",
    badge: "Creatividad Visual",
  },
  {
    id: "cocina-1",
    name: "Ronaldiño",
    role: "Cocinero",
    category: "cocina",
    years: "3 años en Las Flores",
    photo: "/familia/Ronaldinho.webp",
    quote: "El secreto está en el respeto a los ingredientes y el amor profundo por cada preparación.",
    recommendedDish: "Mondongo Ayacuchano",
    dishPrice: "S/ 25.00",
    badge: "Sazón Tradicional",
  },
  {
    id: "cocina-2",
    name: "Marina",
    role: "Maestra Cocinera",
    category: "cocina",
    years: "5 años en Las Flores",
    photo: "/familia/Marina.webp",
    quote: "Cuido las recetas de la casa. Mi alegría es que cada bocado sea un pedacito de nuestra tradición.",
    recommendedDish: "Puca Picante con Chicharrón",
    dishPrice: "S/ 38.00",
    badge: "Manos de Oro",
  },
  {
    id: "reposteria-1",
    name: "Nancy Marleny",
    role: "Asistente de Repostería",
    category: "reposteria",
    years: "2 años en Las Flores",
    photo: "/familia/Nancy.webp",
    quote: "Acompañar nuestras comidas con el dulce perfecto combinando técnica y cariño es mi especialidad.",
    recommendedDish: "Helado de Lúcuma",
    dishPrice: "S/ 12.00",
    badge: "Toque Dulce",
  }
];

function FamiliaLasFloresPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeCategory, setActiveCategory] = useState<"all" | "administracion" | "cocina" | "salon" | "barra" | "reposteria">("all");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const filteredCollaborators = COLLABORATORS.filter(
    (c) => activeCategory === "all" || c.category === activeCategory
  );

  return (
    <div className="min-h-screen bg-piedra flex flex-col font-sans text-nogal selection:bg-chilca/20">
      {/* ── HEADER FIJO ── */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b ${isScrolled ? "bg-piedra/90 backdrop-blur-md shadow-sm border-nogal/10 py-3" : "bg-transparent border-transparent py-5"
          }`}
      >
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-20 flex justify-between items-center relative">
          <SiteNavigationMenu isScrolled={isScrolled} />

          <a href="/" className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center group">
            <img
              src="/images.png"
              alt="Las Flores"
              className={`transition-all duration-300 origin-center ${isScrolled ? "h-8 opacity-100" : "h-10 md:h-12 opacity-100 invert brightness-0"}`}
              style={isScrolled ? { filter: "brightness(0) saturate(100%) invert(19%) sepia(16%) saturate(740%) hue-rotate(346deg) brightness(96%) contrast(89%)" } : {}}
            />
          </a>

          <div className="flex items-center gap-4">
            <Link
              to="/reservas"
              className={`hidden sm:inline-flex px-5 py-2 text-xs font-serif uppercase tracking-widest border transition-all rounded-sm ${isScrolled
                  ? "border-nogal/30 text-nogal hover:bg-nogal hover:text-piedra"
                  : "border-piedra/40 text-piedra hover:bg-piedra hover:text-nogal"
                }`}
            >
              Reservar
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section Completa */}
      <section className="relative min-h-[60vh] flex items-center justify-center pt-32 pb-24 px-6 bg-eucalipto-dark text-piedra overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/imagenes-reales/EQUIPO/02042026-DSC05038-opt.webp"
            alt="Familia Las Flores"
            loading="eager"
            decoding="async"
            className="w-full h-full object-cover opacity-65 filter brightness-105 saturate-[1.1]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/45 to-black/30" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          <span className="text-chilca font-medium uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-2">
            <Sparkles size={14} />
            Nuestra Gente · Nuestro Orgullo
            <Sparkles size={14} />
          </span>

          <h1 className="font-serif text-4xl md:text-6xl text-piedra font-normal leading-tight">
            Familia Las Flores
          </h1>

          <p className="text-base md:text-lg text-piedra/90 max-w-3xl mx-auto leading-relaxed">
            "Detrás de cada plato sabroso y cada sonrisa en mesa hay hombres y mujeres ayacuchanos que trabajan con dignidad, pasión y profundo amor por nuestras raíces."
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-16 space-y-12">

        {/* Category Filters */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-2xs ${activeCategory === "all"
                ? "bg-[#2D473C] text-[#D4AF37] font-black shadow-md scale-105"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
              }`}
          >
            Todos ({COLLABORATORS.length})
          </button>
          <button
            onClick={() => setActiveCategory("administracion")}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-2xs ${activeCategory === "administracion"
                ? "bg-[#2D473C] text-[#D4AF37] font-black shadow-md scale-105"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
              }`}
          >
            Administración
          </button>
          <button
            onClick={() => setActiveCategory("cocina")}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-2xs ${activeCategory === "cocina"
                ? "bg-[#2D473C] text-[#D4AF37] font-black shadow-md scale-105"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
              }`}
          >
            Cocina
          </button>
          <button
            onClick={() => setActiveCategory("salon")}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-2xs ${activeCategory === "salon"
                ? "bg-[#2D473C] text-[#D4AF37] font-black shadow-md scale-105"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
              }`}
          >
            Salón
          </button>
          <button
            onClick={() => setActiveCategory("barra")}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-2xs ${activeCategory === "barra"
                ? "bg-[#2D473C] text-[#D4AF37] font-black shadow-md scale-105"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
              }`}
          >
            Barra
          </button>
          <button
            onClick={() => setActiveCategory("reposteria")}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-2xs ${activeCategory === "reposteria"
                ? "bg-[#2D473C] text-[#D4AF37] font-black shadow-md scale-105"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
              }`}
          >
            Repostería
          </button>
        </div>

        {/* Collaborators Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCollaborators.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
            >
              {/* Photo & Badge Header */}
              <div className="relative h-64 overflow-hidden bg-gray-100">
                <img
                  src={c.photo}
                  alt={c.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  style={{
                    objectPosition:
                      c.id === "4" ? "center 5%"
                      : c.id === "3" ? "center 8%"
                      : c.id === "cocina-2" ? "center 10%"
                      : c.id === "10" ? "center 12%"
                      : "center 15%",
                  }}
                />
                <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#D4AF37] text-[#2D473C] text-[10px] font-black uppercase tracking-wider shadow-md">
                  {c.role}
                </span>

                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h3 className="font-serif text-3xl leading-tight">
                    {c.name}
                  </h3>
                  <span className="text-[10px] text-gray-300 font-bold uppercase tracking-wider block mt-1">
                    {c.years}
                  </span>
                </div>
              </div>

              {/* Quote Body */}
              <div className="px-7 pt-7 pb-6 space-y-4 flex-1">
                <Quote size={22} className="text-[#D4AF37]" />
                <p className="text-[14px] italic leading-[1.75] text-gray-600 pr-1">
                  &ldquo;{c.quote}&rdquo;
                </p>
              </div>

              {/* Dish Recommendation Footer */}
              <div className="px-5 py-3.5 bg-[#F9F8F3] border-t border-gray-100 flex items-center gap-3">
                {/* Plato: ocupa el espacio disponible, trunca si es largo */}
                <div className="flex-1 min-w-0">
                  <span className="block text-[9px] uppercase tracking-[0.2em] text-gray-400 font-semibold mb-0.5">Su plato recomendado</span>
                  <p className="font-serif text-sm text-[#2D473C] leading-snug line-clamp-2">
                    {c.recommendedDish}
                  </p>
                </div>

                {/* Botón de ancho fijo para que no se deforme */}
                <button
                  onClick={() => setIsMenuOpen(true)}
                  className="w-[72px] shrink-0 flex flex-col items-center justify-center gap-0.5 py-2.5 rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/8 hover:bg-[#D4AF37]/20 text-[#2D473C] transition-all active:scale-95"
                >
                  <Utensils size={13} className="text-[#D4AF37]" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Pedir</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Join the Team Callout */}
        <div className="bg-[#2D473C] text-white rounded-3xl p-8 md:p-12 shadow-xl border-2 border-[#D4AF37]/40 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-3 text-center lg:text-left max-w-2xl">
            <span className="text-xs uppercase font-black text-[#D4AF37] tracking-widest">
              Únete a Nuestra Historia
            </span>
            <h3 className="font-serif text-3xl md:text-4xl">
              ¿Te gustaría formar parte de la Familia Las Flores?
            </h3>
            <p className="text-sm text-emerald-100/90 leading-relaxed">
              Buscamos personas apasionadas por el buen servicio, la riqueza cultural de Ayacucho y el crecimiento profesional en un ambiente respetuoso y acogedor.
            </p>
          </div>

          <Link
            to="/unete-al-equipo"
            className="px-8 py-4 rounded-2xl bg-[#D4AF37] hover:bg-[#c29e2f] text-[#2D473C] font-black text-sm transition-all shadow-lg shrink-0 flex items-center gap-2 active:scale-95"
          >
            <span>Ver Convocatorias Laborales</span>
            <ArrowRight size={18} />
          </Link>
        </div>

      </main>

      <MenuModal open={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      <SiteFooter />
    </div>
  );
}
