import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteNavigationMenu } from "@/components/SiteNavigationMenu";
import { Sparkles, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { AnimatedCartButton } from "@/components/AnimatedCartButton";

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
    links: [{ rel: "canonical", href: "https://www.restaurantelasflores.com/familia-las-flores" }],
  }),
  component: FamiliaLasFloresPage,
});

interface Collaborator {
  id: string;
  name: string;
  photo: string;
  quote: string;
}

const COLLABORATORS: Collaborator[] = [
  // ── Cocina ──
  {
    id: "1",
    name: "Betsy",
    photo: "/familia/Cena.webp",
    quote: "Trabajar en el Restaurante Las Flores es una experiencia que me permite crecer tanto profesional como personalmente. Como administradora, me siento comprometida con mis responsabilidades y con el buen funcionamiento del restaurante, pero también valoro mucho los momentos que compartimos como equipo.",
  },
  {
    id: "2",
    name: "Ronaldiño",
    photo: "/familia/Cocina.webp",
    quote: "Trabajar como cocinero en el Restaurante Las Flores me hace sentir orgulloso de aportar con mi trabajo y pasión por la gastronomía. Cada día es una oportunidad para aprender, mejorar y dar lo mejor de mí junto a mis compañeros. Las cenas, paseos y reuniones nos permiten compartir, fortalecer la unión y disfrutar como equipo fuera del trabajo. Estos momentos nos motivan a seguir creciendo, sin olvidar siempre la responsabilidad, el compromiso y la calidad que nuestro trabajo requiere.",
  },
  {
    id: "3",
    name: "Paola",
    photo: "/familia/Danza.webp",
    quote: "Ser parte del equipo del Restaurante Las Flores ha sido una experiencia muy bonita y significativa para mí, especialmente por todo lo que he aprendido en mi labor como cajera. Cada día me esfuerzo por atender con amabilidad, responsabilidad y compromiso, aportando al buen funcionamiento del restaurante. Valoro mucho los momentos de integración y convivencia que compartimos como equipo, porque fortalecen nuestros lazos y nos permiten disfrutar juntos.",
  },
  {
    id: "4",
    name: "Rosmery",
    photo: "/familia/Paseo.webp",
    quote: "Trabajar como maître en el Restaurante Las Flores me hace sentir orgulloso de brindar una atención cercana y de calidad a cada cliente. Cada día es una oportunidad para aprender, liderar y fortalecer el trabajo en equipo.Las actividades realizadas nos permiten compartir, conocernos mejor y crear un ambiente de compañerismo.  ",
  },
];

function FamiliaLasFloresPage() {
  const { totalItems, setIsOpen: setCartOpen } = useCart();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-piedra flex flex-col font-sans text-nogal selection:bg-chilca/20">
      {/* ── HEADER FIJO ── */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b ${isScrolled ? "bg-piedra/90 backdrop-blur-md shadow-sm border-nogal/10 py-3" : "bg-transparent border-transparent py-5"
          }`}
      >
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-20 flex justify-between items-center gap-3 relative">
          <div className="flex items-center">
            <SiteNavigationMenu isScrolled={isScrolled} />
          </div>

          <a href="/" className="flex-1 flex justify-center items-center group">
            <img
              src="/images.png"
              alt="Las Flores"
              className={`transition-all duration-300 origin-center ${isScrolled ? "h-8 opacity-100" : "h-10 md:h-12 opacity-100 invert brightness-0"}`}
              style={isScrolled ? { filter: "brightness(0) saturate(100%) invert(19%) sepia(16%) saturate(740%) hue-rotate(346deg) brightness(96%) contrast(89%)" } : {}}
            />
          </a>

          <div className="flex items-center gap-4 md:gap-6">
            <Link
              to="/reservas"
              className={`px-4.5 py-1.5 md:px-5 md:py-2 text-[11px] md:text-xs font-bold uppercase tracking-widest transition-all rounded-full border ${isScrolled
                  ? "border-nogal text-nogal hover:bg-nogal hover:text-white shadow-sm"
                  : "border-piedra/60 text-piedra hover:bg-piedra hover:text-nogal shadow-sm"
                }`}
            >
              Reservar
            </Link>
            
            {/* Carrito */}
            {totalItems > 0 && (
              <AnimatedCartButton
                onClick={() => setCartOpen(true)}
                className={`transition-colors ${
                  isScrolled ? "hover:text-chilca text-nogal" : "hover:text-chilca text-piedra"
                }`}
                size={20}
                color={isScrolled ? "#8B7355" : "#F5F5DC"}
              />
            )}
          </div>
        </div>
      </header>

      {/* Hero Section Completa */}
      <section className="relative min-h-[60vh] flex items-center justify-center pt-32 pb-24 px-6 bg-eucalipto-dark text-piedra overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/inicio/Equipolasflores.webp"
            alt="Familia Las Flores"
            loading="eager"
            decoding="async"
            className="w-full h-full object-cover object-[center_20%] opacity-65 filter brightness-105 saturate-[1.1]"
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
      <main className="max-w-7xl mx-auto px-6 py-12">

        {/* Collaborators Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {COLLABORATORS.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl hover:ring-2 hover:ring-[#D4AF37]/40 transition-all duration-300 group hover:-translate-y-1"
            >
              <div className="relative h-72 overflow-hidden bg-gray-100">
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
              </div>

              <div className="px-7 pt-7 pb-8">
                <span className="block font-serif text-5xl leading-none text-[#D4AF37]/50">&ldquo;</span>
                <p className="text-[14px] italic leading-[1.75] text-gray-600 pr-1 -mt-4">
                  {c.quote}
                </p>
                <p className="mt-4 text-sm font-bold text-[#2D473C]">— {c.name}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Join the Team Callout */}
        <div className="mt-12 bg-[#2D473C] text-white rounded-3xl p-8 md:p-12 shadow-xl border-2 border-[#D4AF37]/40 flex flex-col lg:flex-row items-center justify-between gap-8">
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

      <SiteFooter />
    </div>
  );
}
