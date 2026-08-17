import { createFileRoute, Link } from "@tanstack/react-router";
import { Star, MapPin, ChefHat, Info, ArrowRight, ArrowRightCircle, ShoppingCart } from "lucide-react";
import { SiteNavigationMenu } from "../components/SiteNavigationMenu";
import { useState, useEffect, useRef } from "react";
import { useCart } from "@/context/CartContext";
const ayacuchoHero = "/inicio/ayacucho.webp";
const culturaImg = "/imagenes-reales/ARTE Y CULTURA LISTO/CERAMICA/CERAMICA-AYACUCHANA.webp";
const retabloImg =
  "/imagenes-reales/ARTE Y CULTURA LISTO/RETABLO AYACUCHANO/LopezA.webp";
const platoPucaImg = "/imagenes-reales/seccion-gastronomia/puca-picante.webp";
const platoCuyImg = "/imagenes-reales/seccion-gastronomia/cuy-frito-ayacuchano.webp";
const platoMondongoImg = "/imagenes-reales/seccion-gastronomia/mondongo ayacuchano.webp";
const platoMaizImg = "/imagenes-reales/seccion-gastronomia/chorizo-ayacuchano.webp";
import { SiteFooter } from "@/components/site-footer";
import { LocationSelector } from "../components/LocationSelector";
import RetabloWrapper, { AyacuchoFlowerInline } from "../components/RetabloWrapper";
import { MenuModal } from "@/components/MenuModal";
import { FamiliaLasFloresSection } from "../components/FamiliaLasFloresSection";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Restaurante Las Flores Ayacucho — Dónde Comer en Ayacucho | Carta & Reservas" },
      {
        name: "description",
        content:
          "¿Dónde comer en Ayacucho? Disfruta la mejor gastronomía tradicional ayacuchana (Puca Picante, Cuy Frito, Pachamanca) y parrillas en Restaurante Las Flores. Jr. José Olaya 106, Huamanga. ¡Reserva online o pide delivery!",
      },
      {
        name: "keywords",
        content:
          "restaurante las flores, restaurante las flores ayacucho, restaurantes ayacucho, restaurantes en ayacucho, donde comer en ayacucho, mejor restaurante ayacucho, restaurante turistico ayacucho, puca picante ayacucho, cuy frito ayacucho, desayunos ayacucho, delivery ayacucho, reservas restaurante ayacucho",
      },
      { property: "og:title", content: "Restaurante Las Flores Ayacucho — Dónde Comer en Ayacucho" },
      {
        property: "og:description",
        content:
          "Disfruta la verdadera gastronomía ayacuchana en Restaurante Las Flores. Ubicados en Jr. José Olaya 106, Huamanga — Ayacucho.",
      },
      {
        property: "og:image",
        content: "https://www.restaurantelasflores.com/images.png",
      },
      {
        name: "twitter:image",
        content: "https://www.restaurantelasflores.com/images.png",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Restaurant",
          "name": "Restaurante Las Flores",
          "alternateName": ["Las Flores Ayacucho", "Restaurante Turístico Las Flores"],
          "url": "https://www.restaurantelasflores.com",
          "logo": "https://www.restaurantelasflores.com/images.png",
          "image": "https://www.restaurantelasflores.com/images.png",
          "telephone": "+51980723422",
          "priceRange": "S/ 30 - S/ 80",
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
            "latitude": -13.158,
            "longitude": -74.223
          },
          "openingHoursSpecification": [
            {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
              "opens": "07:00",
              "closes": "22:00"
            }
          ],
          "servesCuisine": ["Peruana", "Ayacuchana", "Tradicional", "Parrillas", "Desayunos", "Almuerzos", "Cenas"],
          "acceptsReservations": "True",
          "hasMenu": "https://www.restaurantelasflores.com/carta"
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "¿Cuál es el mejor lugar para comer en Ayacucho?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Restaurante Las Flores es uno de los mejores y más emblemáticos lugares para comer en Ayacucho. Ofrece gastronomía típica ayacuchana como Puca Picante, Cuy Frito, Mondongo y Parrillas en un ambiente tradicional en Jr. José Olaya 106, Huamanga."
              }
            },
            {
              "@type": "Question",
              "name": "¿Dónde tomar desayuno en Ayacucho?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "En Restaurante Las Flores servimos desayunos tradicionales ayacuchanos con pan chapla, queso ayacuchano, caldos tradicionales y café artesanal todos los días desde las 07:00 a.m."
              }
            },
            {
              "@type": "Question",
              "name": "¿Cuáles son los platos típicos de Ayacucho?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Los platos típicos de Ayacucho incluyen el Puca Picante, Cuy Frito, Mondongo Ayacuchano, Pachamanca y Qapchi, todos preparados con insumos autóctonos en Restaurante Las Flores."
              }
            },
            {
              "@type": "Question",
              "name": "¿Qué restaurantes hay cerca de la Plaza de Armas de Ayacucho?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Restaurante Las Flores se encuentra ubicado a pocas cuadras del centro histórico en Jr. José Olaya 106, Huamanga — Ayacucho."
              }
            }
          ]
        }),
      },
    ],
  }),
  component: Index,
});

// ─── TIPOS ────────────────────────────────────────────────────────────────────

type Festividad = {
  id: number;
  nombre: string;
  fecha: string;
  colorAccent: string; // clase tailwind para el detalle de color
  imagen: string;
  descripcionCorta: string;
  descripcion: string;
  tradiciones: string[];
  dato: string;
};

type Lugar = {
  id: number;
  numeral: string; // I, II, III…
  nombre: string;
  categoria: string; // solo texto, sin emojis
  imagen: string;
  descripcion: string;
  consejo: string;
};

// ─── DATA ─────────────────────────────────────────────────────────────────────

const festividades: Festividad[] = [
  {
    id: 1,
    nombre: "Semana Santa Ayacuchana",
    fecha: "Marzo / Abril",
    colorAccent: "bg-cochinilla",
    imagen: "/imagenes-reales/seccion-festividades/semana-santa.webp",
    descripcionCorta:
      "La mayor expresión de fe y fervor religioso en el Perú, con impresionantes alfombras de flores.",
    descripcion:
      "Celebrada habitualmente entre marzo y abril, la Semana Santa Ayacuchana, reconocida oficialmente como Patrimonio Cultural de la Nación, es la mayor expresión de fe y fervor religioso en el Perú, destacando por sus multitudinarias y solemnes procesiones, impresionantes alfombras de flores y profunda devoción andina. Una experiencia espiritual e histórica verdaderamente inigualable.",
    tradiciones: [
      "Procesión del Señor de los Ramos el Domingo de Ramos",
      "Quema del Judas y Pascua Toro el Sábado de Gloria",
      "Alfombras florales en las calles coloniales de Huamanga",
      "Certamen de pasos procesionales entre barrios rivales",
      "Degustación de los 12 platos típicos durante la semana",
    ],
    dato: "Más de 600 años de tradición ininterrumpida. La ciudad recibe hasta 80,000 visitantes en Semana Santa.",
  },
  {
    id: 2,
    nombre: "Carnaval Ayacuchano",
    fecha: "Febrero / Marzo",
    colorAccent: "bg-chilca",
    imagen: "/imagenes-reales/seccion-festividades/carnaval-ayacuchano.webp",
    descripcionCorta:
      "Vibrante festividad que preserva la identidad andina a través de multitudinarias comparsas.",
    descripcion:
      "Celebrado entre febrero y marzo, el Carnaval Ayacuchano, reconocido oficialmente como Patrimonio Cultural de la Nación, es una vibrante festividad que preserva la identidad andina a través de multitudinarias comparsas, música y coloridos trajes tradicionales de danza. Una excelente oportunidad para vivir esta alegre tradición.",
    tradiciones: [
      "Yunzas o umishadas: tala del árbol adornado al ritmo del huayno",
      "Comparsas de danza con trajes típicos de cada barrio",
      "Batalla de agua, talco y serpentinas entre vecinos",
      "Concurso de huaynos y canciones de carnaval propias de Huamanga",
      "Preparación del ponche de frutas y la chicha de jora",
    ],
    dato: "El carnaval ayacuchano tiene melodías propias — los huaynos de carnaval — reconocidas a nivel internacional.",
  },
  {
    id: 3,
    nombre: "Hatun Yaku Raymi",
    fecha: "Agosto / Septiembre",
    colorAccent: "bg-eucalipto",
    imagen:
      "/imagenes-reales/seccion-festividades/hatun-yaku-raymi.webp",
    descripcionCorta: "Un ancestral tributo al agua y a la Pachamama con los Danzantes de Tijeras.",
    descripcion:
      "Celebrado entre agosto y septiembre en Paras, el Hatun Yaku Raymi es un ancestral tributo al agua y a la Pachamama. Destaca la participación de los Danzantes de Tijeras, quienes actúan como mediadores espirituales ante los Apus para bendecir el inicio del ciclo agrícola. Una gran oportunidad para presenciar esta milenaria tradición andina.",
    tradiciones: [
      "Duelos de Danza de las Tijeras entre competidores",
      "Rituales de ofrenda al agua y a la Pachamama",
      "Ferias de artesanía y retablos en torno a la festividad",
      "Banquetes comunales con los platos típicos del ande",
    ],
    dato: "La Danza de las Tijeras fue inscrita en la Lista del Patrimonio Cultural Inmaterial de la UNESCO en 2010.",
  },
  {
    id: 4,
    nombre: "Fiesta de las Cruces",
    fecha: "Mayo",
    colorAccent: "bg-retablo-blue",
    imagen: "/imagenes-reales/seccion-festividades/fiestas-de-cruces.webp",
    descripcionCorta:
      "Fusiona la fe católica y andina con el tradicional descenso de cruces al ritmo de música.",
    descripcion:
      "Celebrada en mayo, especialmente en Luricocha (Huanta), la Fiesta de las Cruces fusiona la fe católica y andina con el tradicional descenso de cruces al ritmo de música costumbrista. Una gran oportunidad para vivir esta profunda devoción popular.",
    tradiciones: [
      "Peregrinación a los cerros al amanecer para adornar las cruces",
      "Bajada procesional de cruces hacia la Plaza de Armas",
      "Misas solemnes y velatones de toda la noche",
      "Festivales de música costumbrista y danzas",
      "Preparación de platos festivos comunales",
    ],
    dato: "Cada barrio tiene su propia cruz con nombre e historia propios. La Puca Cruz es la más antigua.",
  },
  {
    id: 5,
    nombre: "Vilcas Raymi",
    fecha: "Julio",
    colorAccent: "bg-adobe",
    imagen: "/imagenes-reales/seccion-festividades/vilcas-raymi.webp",
    descripcionCorta:
      "Escenificación de la guerra Inca-Chanca en el antiguo centro administrativo inca.",
    descripcion:
      "Celebrado a fines de julio, el Vilcas Raymi escenifica la guerra Inca-Chanca en Vilcashuamán. Este antiguo centro administrativo inca, cuya imponente arquitectura está estrechamente ligada al diseño original del Cusco, ofrece la gran ventaja de disfrutar su majestuoso legado histórico con mucha menor afluencia turística y total tranquilidad.",
    tradiciones: [
      "Escenificación histórica en la plaza principal de Vilcashuamán",
      "Danzas folclóricas y representaciones teatrales",
      "Celebraciones en el imponente Ushnu incaico",
      "Ferias gastronómicas y artesanales",
      "Recorridos por el Templo del Sol y la Luna",
    ],
    dato: "Vilcashuamán es considerado el centro geográfico del antiguo Imperio Inca (Tahuantinsuyo).",
  },
];

const lugares: Lugar[] = [
  {
    id: 1,
    numeral: "I",
    nombre: "Aguas Turquesas de Millpu",
    categoria: "Naturaleza",
    imagen: "/imagenes-reales/seccion-turs/millpu.webp",
    descripcion:
      "Ubicadas a casi 4 horas de Huamanga, las Aguas Turquesas de Millpu conforman una impresionante sucesión de piscinas naturales escalonadas en el interior de un cañón.",
    consejo:
      "Visitar de mayo a noviembre para disfrutar del vibrante color, llevar calzado de trekking.",
  },
  {
    id: 2,
    numeral: "II",
    nombre: "Pampa de Quinua",
    categoria: "Historia",
    imagen: "/imagenes-reales/seccion-turs/pampa-quinua.webp",
    descripcion:
      "A solo 45 minutos de Huamanga, la Pampa de Quinua es un majestuoso escenario histórico coronado por un obelisco que conmemora la Batalla de Ayacucho.",
    consejo: "Complementar la visita explorando la tradicional alfarería del pueblo aledaño.",
  },
  {
    id: 3,
    numeral: "III",
    nombre: "Complejo Arqueológico Wari",
    categoria: "Arqueología",
    imagen: "/imagenes-reales/seccion-turs/complejo-wari.webp",
    descripcion:
      "A solo 30 minutos de Huamanga, destaca por haber sido la imponente capital del primer gran imperio andino, siendo pionero en la planificación urbana preincaica.",
    consejo:
      "Llevar protector solar y calzado cómodo para explorar sus extensas edificaciones de piedra.",
  },
  {
    id: 4,
    numeral: "IV",
    nombre: "Intihuatana",
    categoria: "Patrimonio Inca",
    imagen: "/imagenes-reales/seccion-turs/ruinas-de-intihuatana.webp",
    descripcion:
      "A 3 horas de Huamanga, el Complejo Arqueológico de Intihuatana destaca por sus finas edificaciones de piedra y su famoso reloj solar a orillas de la hermosa laguna de Pumacocha.",
    consejo:
      "Llevar ropa abrigadora y calzado cómodo para explorar la magia de este antiguo refugio de descanso de la nobleza incaica.",
  },
  {
    id: 5,
    numeral: "V",
    nombre: "Bosque de Titankayocc",
    categoria: "Naturaleza Andina",
    imagen: "/imagenes-reales/seccion-turs/puyas-de-raimondi.titankayocc.webp",
    descripcion:
      "A poco más de 2 horas de Huamanga, el bosque de Titankayocc alberga el santuario más grande de Puyas de Raimondi, imponentes plantas andinas que superan los 10 metros de altura.",
    consejo:
      "Llevar ropa abrigadora y aclimatarse previamente a la altitud para disfrutar plenamente de este espectacular paisaje natural.",
  },
  {
    id: 6,
    numeral: "VI",
    nombre: "Vilcashuamán",
    categoria: "Patrimonio Inca",
    imagen: "/imagenes-reales/seccion-turs/vilcas-huaman.webp",
    descripcion:
      "A 3 horas de Huamanga, este imponente complejo arqueológico fue un importante centro administrativo inca, conectado estratégicamente con el Cusco.",
    consejo:
      "Llevar ropa abrigadora y recorrer sus majestuosas edificaciones de piedra como el Templo del Sol.",
  },
];

// ─── COMPONENTES ──────────────────────────────────────────────────────────────

function Modal({
  imagen,
  titulo,
  subtitulo,
  accentBar,
  cuerpo,
  onClose,
}: {
  imagen: string;
  titulo: string;
  subtitulo: string;
  accentBar?: string;
  cuerpo: React.ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", fn);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", fn);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-cafe/85 backdrop-blur-sm" />
      <div
        className="relative bg-piedra text-nogal max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Imagen cabecera con arco en CSS */}
        <div className="relative overflow-hidden" style={{ height: "18rem" }}>
          <img src={imagen} alt={titulo} loading="lazy" decoding="async" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center border border-piedra/40 text-piedra hover:bg-piedra/10 transition-colors text-sm"
            aria-label="Cerrar"
          >
            ✕
          </button>
          <div className="absolute bottom-0 left-0 p-7">
            <p className="text-[10px] uppercase tracking-[0.35em] text-piedra/60 mb-2">
              {subtitulo}
            </p>
            <h2 className="font-serif italic text-2xl md:text-3xl text-piedra leading-snug">
              {titulo}
            </h2>
          </div>
        </div>

        {accentBar && <div className={`${accentBar} h-[3px] w-full`} />}

        <div className="px-8 py-9">{cuerpo}</div>
      </div>
    </div>
  );
}

// ─── PLATOS TÍPICOS — Tap-to-reveal en móvil ─────────────────────────────────

function PlatosTipicosGrid({ platos }: { platos: { img: string; nombre: string; desc: string }[] }) {
  const [activeNombre, setActiveNombre] = useState<string | null>(null);

  const handleCardClick = (nombre: string) => {
    setActiveNombre((prev) => (prev === nombre ? null : nombre));
  };

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      onTouchStart={(e) => {
        // Si el toque fue fuera de un card, cierra el activo
        if (!(e.target as Element).closest(".dish-card-hover")) {
          setActiveNombre(null);
        }
      }}
    >
      {platos.map((p) => {
        const isActive = activeNombre === p.nombre;
        return (
          <article key={p.nombre} className="flex flex-col group">
            <div
              className={`dish-card-hover aspect-[5/4] bg-cafe/40 rounded-lg${isActive ? " dish-card-active" : ""}`}
              onClick={() => handleCardClick(p.nombre)}
            >
              <img
                src={p.img}
                alt={p.nombre}
                width={1000}
                height={800}
                loading="eager"
                decoding="async"
                fetchPriority="high"
                className="w-full h-full object-cover"
              />
              <div className="dish-card-overlay">
                <span className="text-chilca font-bold text-[10px] uppercase tracking-[0.25em] mb-1">
                  Plato Tradicional
                </span>
                <h4 className="font-serif text-lg font-bold text-piedra mb-1">{p.nombre}</h4>
                <p className="text-xs text-piedra/80 leading-relaxed">{p.desc}</p>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

// ─── SECCIÓN FESTIVIDADES — Carrusel / Slider ───────────────────────────────────

function FestividadesSlider({ onSelect }: { onSelect: (f: Festividad) => void }) {
  const [activo, setActivo] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setActivo((p) => (p + 1) % festividades.length), 5000);
  };

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const goTo = (i: number) => {
    setActivo(i);
    resetTimer();
  };
  const prev = () => {
    setActivo((p) => (p - 1 + festividades.length) % festividades.length);
    resetTimer();
  };
  const next = () => {
    setActivo((p) => (p + 1) % festividades.length);
    resetTimer();
  };

  const fest = festividades[activo];

  return (
    <div className="relative overflow-hidden bg-cafe w-full aspect-[4/3] md:aspect-[21/9] rounded-3xl shadow-xl group">

      {festividades.map((f, i) => (
        <div
          key={f.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${i === activo ? "opacity-100" : "opacity-0"}`}
        >
          <img src={f.imagen} alt={f.nombre} loading="lazy" decoding="async" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
          {/* Línea de color de la festividad arriba */}
          <div className={`absolute top-0 left-0 w-full h-1 ${f.colorAccent} z-20 opacity-80`} />
        </div>
      ))}

      <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 z-10 text-piedra">
        <div className="max-w-3xl">
          <p className="text-[10px] uppercase tracking-[0.35em] mb-3 text-piedra/70">{fest.fecha}</p>
          <h3 className="font-serif italic text-3xl md:text-5xl mb-4 leading-tight">
            {fest.nombre}
          </h3>
          <p className="text-sm md:text-base text-piedra/80 leading-relaxed mb-6 max-w-2xl hidden md:block">
            {fest.descripcionCorta}
          </p>
          <button
            onClick={() => onSelect(fest)}
            className="inline-flex items-center gap-3 px-6 py-3 bg-piedra/10 hover:bg-piedra text-piedra hover:text-nogal transition-colors text-[10px] uppercase tracking-[0.2em] font-semibold rounded-sm border border-piedra/20"
          >
            Descubrir Festividad <span aria-hidden>→</span>
          </button>
        </div>
      </div>

      {/* Flechas de navegación */}
      <div className="absolute top-1/2 -translate-y-1/2 left-4 md:left-8 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button
          onClick={prev}
          className="p-3 bg-cafe/40 hover:bg-cafe/80 rounded-full text-piedra backdrop-blur-sm transition-all"
          aria-label="Anterior"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
      </div>
      <div className="absolute top-1/2 -translate-y-1/2 right-4 md:right-8 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button
          onClick={next}
          className="p-3 bg-cafe/40 hover:bg-cafe/80 rounded-full text-piedra backdrop-blur-sm transition-all"
          aria-label="Siguiente"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Indicadores de carga tipo barra */}
      <div className="absolute bottom-6 md:bottom-12 right-6 md:right-12 z-10 flex gap-3 items-center">
        {festividades.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`relative overflow-hidden transition-all duration-500 ${i === activo ? "w-12 h-1.5 rounded-full bg-piedra/30" : "w-1.5 h-1.5 rounded-full bg-piedra/50 hover:bg-piedra"}`}
            aria-label={`Ver festividad ${i + 1}`}
          >
            {i === activo && (
              <div
                key={activo}
                className="absolute top-0 left-0 h-full bg-piedra"
                style={{ animation: "fillProgress 5s linear forwards" }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── SECCIÓN LUGARES — Acordeón Expandible ───────────────────────────────────

function LugaresAccordion({ onSelect }: { onSelect: (l: Lugar) => void }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [activeId, setActiveId] = useState<number>(lugares[0].id);
  const [isMobile, setIsMobile] = useState(false);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateIsMobile = () => setIsMobile(mediaQuery.matches);
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

        const id = Number(bestEntry.target.getAttribute("data-lugar-id"));
        if (!Number.isNaN(id)) {
          setActiveId(id);
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
    <div className="flex flex-col md:flex-row h-[750px] md:h-[500px] w-full gap-3 md:gap-5 overflow-hidden">
      {lugares.map((lugar, i) => {
        const isExpanded = isMobile
          ? lugar.id === activeId
          : hovered === null
          ? i === 0
          : hovered === lugar.id;

        return (
          <div
            key={lugar.id}
            ref={(el) => { itemRefs.current[i] = el; }}
            data-lugar-id={lugar.id}
            onMouseEnter={() => setHovered(lugar.id)}
            onClick={() => {
              setActiveId(lugar.id);
              onSelect(lugar);
            }}
            className={`relative rounded-3xl overflow-hidden transition-all duration-500 ease-out cursor-pointer shadow-sm group ${
              isExpanded ? "flex-[4] md:flex-[5]" : "flex-[1]"
            }`}
          >
            <img
              src={lugar.imagen}
              alt={lugar.nombre}
              loading={isMobile && isExpanded ? "eager" : "lazy"}
              fetchPriority={isMobile && isExpanded ? "high" : "low"}
              decoding="async"
              width={1600}
              height={900}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 will-change-transform"
            />
            {/* Gradiente más oscuro abajo para que lea el texto */}
            <div
              className={`absolute inset-0 transition-opacity duration-500 ${isExpanded ? "bg-gradient-to-t from-ink via-ink/20 to-transparent" : "bg-cafe/60 hover:bg-cafe/40"}`}
            />

            {/* Número Romano */}
            <div
              className={`absolute top-4 transition-all duration-700 z-20 ${isExpanded ? "right-5 md:right-8" : "left-1/2 -translate-x-1/2 md:left-4 md:translate-x-0"}`}
            >
              <span
                className={`font-serif text-piedra/40 select-none transition-all duration-700 ${isExpanded ? "text-4xl" : "text-xl md:text-2xl"}`}
              >
                {lugar.numeral}
              </span>
            </div>

            {/* Contenido expandido */}
            <div
              className={`absolute bottom-0 left-0 w-full p-6 md:p-8 flex flex-col justify-end transition-all duration-500 z-20 ${
                isExpanded
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8 pointer-events-none"
              }`}
            >
              <span className="text-eucalipto text-[10px] uppercase tracking-[0.35em] font-semibold mb-2 block">
                {lugar.categoria}
              </span>
              <h3 className="font-serif text-piedra text-2xl md:text-4xl leading-tight mb-3">
                {lugar.nombre}
              </h3>
              <p className="text-piedra/70 text-sm line-clamp-2 mb-5 hidden md:block max-w-[40ch]">
                {lugar.descripcion}
              </p>
              <div className="flex items-center gap-3 text-piedra text-[10px] uppercase tracking-[0.2em] font-semibold mt-auto">
                <span className="w-8 h-[1px] bg-chilca block"></span> Descubrir
              </div>
            </div>

            {/* Título para versión colapsada (Desktop) */}
            <div
              className={`absolute inset-0 flex items-center justify-center pointer-events-none hidden md:flex transition-opacity duration-500 z-10 ${
                isExpanded ? "opacity-0" : "opacity-100"
              }`}
            >
              <span className="text-piedra font-serif text-xl tracking-wider whitespace-nowrap -rotate-90">
                {lugar.nombre}
              </span>
            </div>

            {/* Título para versión colapsada (Mobile) */}
            <div
              className={`absolute inset-0 flex items-center justify-center pointer-events-none md:hidden transition-opacity duration-500 z-10 ${
                isExpanded ? "opacity-0" : "opacity-100"
              }`}
            >
              <span className="text-piedra font-serif text-sm tracking-widest text-center px-4 drop-shadow-md">
                {lugar.nombre}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────

function Index() {
  const { totalItems, setIsOpen: setCartOpen } = useCart();
  const [festividadActiva, setFestividadActiva] = useState<Festividad | null>(null);
  const [lugarActivo, setLugarActivo] = useState<Lugar | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="bg-piedra text-nogal font-sans selection:bg-chilca/30">
      {/* MODAL — Festividad */}
      {festividadActiva && (
        <Modal
          imagen={festividadActiva.imagen}
          titulo={festividadActiva.nombre}
          subtitulo={festividadActiva.fecha}
          accentBar={festividadActiva.colorAccent}
          onClose={() => setFestividadActiva(null)}
          cuerpo={
            <>
              <p className="text-nogal/80 text-base md:text-lg leading-[1.85] mb-8">
                {festividadActiva.descripcion}
              </p>
              <h4 className="font-serif text-xl mb-5">Tradiciones</h4>
              <ul className="space-y-3 mb-8">
                {festividadActiva.tradiciones.map((t, i) => (
                  <li key={i} className="flex items-start gap-4 text-nogal/75">
                    <span className="w-px h-4 bg-cochinilla shrink-0 mt-1" />
                    <span className="text-sm leading-relaxed">{t}</span>
                  </li>
                ))}
              </ul>
              <div className="border-t border-nogal/10 pt-6">
                <p className="text-sm text-nogal/55 leading-relaxed">
                  <span className="font-semibold text-eucalipto">Dato cultural — </span>
                  {festividadActiva.dato}
                </p>
              </div>
            </>
          }
        />
      )}

      {/* MODAL — Lugar */}
      {lugarActivo && (
        <Modal
          imagen={lugarActivo.imagen}
          titulo={lugarActivo.nombre}
          subtitulo={lugarActivo.categoria}
          accentBar="bg-eucalipto"
          onClose={() => setLugarActivo(null)}
          cuerpo={
            <>
              <p className="text-nogal/80 text-base md:text-lg leading-[1.85] mb-8">
                {lugarActivo.descripcion}
              </p>
              <div className="border-l-2 border-eucalipto pl-6 py-1">
                <p className="text-[10px] uppercase tracking-[0.3em] text-eucalipto font-semibold mb-2">
                  Consejo de visita
                </p>
                <p className="text-sm text-nogal/70 leading-relaxed">{lugarActivo.consejo}</p>
              </div>
            </>
          }
        />
      )}

      {/* NAV */}
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
        
        <div className="flex items-center gap-4 md:gap-6">
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
          
          {/* Carrito */}
          {totalItems > 0 && (
            <button
              onClick={() => setCartOpen(true)}
              className={`pointer-events-auto relative transition-colors ${
                isScrolled ? "hover:text-chilca text-nogal" : "hover:text-chilca text-piedra"
              }`}
            >
              <ShoppingCart size={20} />
              <span className="absolute -top-2 -right-2 bg-chilca text-nogal text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {totalItems}
              </span>
            </button>
          )}
        </div>
      </nav>

      {/* HERO — Recorrido cinemático en Video por Ayacucho */}
      <header className="relative h-screen w-full overflow-hidden bg-eucalipto">
        {/* Video cinemático de alta velocidad optimizado */}
        <video
          autoPlay
          loop
          muted
          playsInline
          poster={ayacuchoHero}
          className="absolute inset-0 w-full h-full object-cover opacity-75 scale-[1.02] pointer-events-none"
        >
          <source src="/inicio/videoweb.mp4" type="video/mp4" />
          <source src="/inicio/videoweb.mov" type="video/quicktime" />
          {/* Imagen de reserva si el navegador restringe video */}
          <img
            src={ayacuchoHero}
            alt="Vista panorámica de Ayacucho al atardecer"
            className="w-full h-full object-cover"
          />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-ink/60 via-ink/20 to-ink/90" />
        <div className="relative h-full flex flex-col items-center justify-center text-center px-6">
          <span className="text-chilca/90 uppercase tracking-[0.4em] text-xs md:text-sm mb-6 animate-reveal font-semibold">
            Huamanga · Perú
          </span>
          <h1 className="font-serif italic text-4xl sm:text-5xl md:text-7xl lg:text-8xl text-piedra leading-[1.05] text-balance max-w-[20ch] animate-reveal [animation-delay:200ms]">
            Guardianes de la Cultura Ayacuchana
          </h1>
          <p className="mt-8 max-w-[52ch] text-piedra/80 text-sm sm:text-base md:text-lg leading-[1.7] animate-reveal [animation-delay:400ms]">
            Treinta y tres iglesias, retablos que guardan siglos y calles donde la tradición
            respira. Nosotros no solo servimos comida, preservamos el alma de Ayacucho.
          </p>
          <Link
            to="/restaurante"
            className="mt-14 inline-flex items-center gap-3 px-8 py-4 text-[11px] uppercase tracking-[0.25em] font-bold animate-reveal [animation-delay:600ms] rounded-sm btn-yellow-hover"
          >
            <span>Nuestra Historia</span> <span aria-hidden>→</span>
          </Link>
        </div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-piedra/60 text-[10px] uppercase tracking-[0.4em]">
          Desliza
        </div>
      </header>

      {/* CULTURA Y TRADICIÓN */}
      <section className="flex justify-center items-center w-full min-h-screen overflow-x-hidden relative pt-4 lg:pt-6 pb-12">
        <RetabloWrapper>
          {/* Layout Responsivo: Vertical en Móvil (<lg), Side-by-Side en Desktop (lg: >=1024px) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center p-5 lg:p-10 overflow-hidden">
            
            {/* Columna Izquierda: Foto del retablo */}
            <div className="lg:col-span-5 w-full max-w-[220px] lg:max-w-none mx-auto shrink-0">
              <div className="relative">
                <div
                  className="absolute -inset-2 z-0"
                  style={{
                    background: "linear-gradient(135deg, #5D2E0C 0%, #8B4513 50%, #5D2E0C 100%)",
                    boxShadow: "0 6px 20px rgba(93,46,12,0.5)",
                  }}
                />
                <img
                  src={retabloImg}
                  alt="Retablo ayacuchano tallado a mano con figuras policromadas"
                  width={600}
                  height={750}
                  loading="lazy"
                  decoding="async"
                  className="relative z-10 w-full aspect-[4/5] object-cover shadow-lg"
                  style={{ boxShadow: "inset 0 0 0 1px rgba(255,220,150,0.15)" }}
                />
              </div>
            </div>

            {/* Columna Derecha: Bloque Narrativo y CTAs */}
            <div className="lg:col-span-7 flex flex-col gap-3 lg:gap-4 text-center lg:text-left">
              
              {/* Eyebrow label */}
              <span
                className="font-sans font-semibold uppercase tracking-[0.3em] text-[10px] lg:text-[11px]"
                style={{ color: "#8B4513" }}
              >
                Cultura y Tradición
              </span>

              {/* Título Serif elegante */}
              <h2
                className="font-serif font-light leading-[1.08] text-balance"
                style={{
                  fontSize: "clamp(1.5rem, 2.8vw, 2.5rem)",
                  color: "#2d1b15",
                  letterSpacing: "-0.01em",
                }}
              >
                El retablo, la <span className="italic">textilería</span> y el fogón
              </h2>

              {/* Separador ornamental */}
              <div className="flex items-center gap-2 justify-center lg:justify-start my-0.5" aria-hidden="true">
                <span className="block h-px w-8 bg-[#8B4513]/40" />
                <AyacuchoFlowerInline />
                <span className="block h-px w-8 bg-[#8B4513]/40" />
              </div>

              {/* Cuerpo de texto */}
              <p
                className="font-sans font-light leading-[1.65] text-pretty"
                style={{
                  fontSize: "clamp(0.8rem, 1.05vw, 0.95rem)",
                  color: "#3d2010",
                }}
              >
                En Ayacucho el arte y la comida comparten origen: manos que tallan
                retablos, tejen mantas y avivan el fogón con la misma paciencia.
                Cada grano de maíz morado, cada aroma a leña y cada textura de la
                piedra volcánica cuentan la historia de una tierra que se niega a
                olvidar su esencia.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mt-2">
                <a
                  href="/restaurante"
                  className="group inline-flex items-center justify-center gap-2 px-6 py-2.5 font-sans font-semibold text-[10px] lg:text-[11px] uppercase tracking-[0.2em] transition-all duration-300"
                  style={{
                    background: "linear-gradient(135deg, #8B2500 0%, #C0392B 100%)",
                    color: "#fdf8f0",
                    boxShadow: "0 4px 14px rgba(139,37,0,0.35)",
                    border: "1px solid #6B1A00",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  Descubrir la historia
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="group-hover:translate-x-1 transition-transform duration-300">
                    <path d="M1 7H13M8 2L13 7L8 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
                <a
                  href="/carta"
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 font-sans font-semibold text-[10px] lg:text-[11px] uppercase tracking-[0.25em] transition-all duration-300"
                  style={{
                    background: "transparent",
                    color: "#5D2E0C",
                    border: "1px solid #8B4513",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#5D2E0C";
                    e.currentTarget.style.color = "#fdf8f0";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#5D2E0C";
                  }}
                >
                  Ver el menú
                </a>
              </div>

            </div>

          </div>
        </RetabloWrapper>
      </section>

      {/* LUGARES PARA VISITAR */}
      <section className="py-20 md:py-32 px-6 bg-piedra">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <span className="text-eucalipto font-medium uppercase tracking-[0.3em] text-xs mb-4 block">
                Lugares para Visitar
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl leading-[1.05] text-balance max-w-[24ch]">
                Ayacucho más allá de la mesa
              </h2>
            </div>
            <p className="text-sm sm:text-base text-nogal/60 leading-[1.7] max-w-[36ch] md:text-right">
              Historia, naturaleza y arte vivo en cada rincón. Conoce la tierra que inspira nuestros
              sabores.
            </p>
          </div>
          {/* Acordeón expandible */}
          <LugaresAccordion onSelect={setLugarActivo} />
        </div>
      </section>

      {/* FESTIVIDADES DE HUAMANGA */}
      <section className="py-20 md:py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <span className="text-eucalipto font-medium uppercase tracking-[0.3em] text-xs mb-4 block">
                Festividades de Huamanga
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl leading-[1.05] text-balance max-w-[28ch]">
                El calendario que da vida a nuestra cocina
              </h2>
            </div>
            <p className="text-base text-nogal/60 leading-[1.7] max-w-[36ch] md:text-right">
              Cada plato de Las Flores tiene una celebración detrás. Estas son las fiestas de
              nuestra tierra.
            </p>
          </div>
          <FestividadesSlider onSelect={setFestividadActiva} />
        </div>
      </section>

      {/* PLATOS TÍPICOS */}
      <section className="py-12 md:py-16 px-6 bg-cafe text-piedra selection:bg-chilca/30">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 max-w-3xl">
            <span className="text-chilca font-medium uppercase tracking-[0.3em] text-[10px] mb-4 block">
              Platos Típicos
            </span>
            <h2 className="font-serif text-3xl md:text-5xl leading-[1.1] text-balance">
              La despensa de la sierra en cuatro sabores
            </h2>
            <p className="mt-4 text-base text-piedra/70 leading-[1.6] max-w-2xl">
              Recetas que definen la identidad ayacuchana. El fruto del fogón y las festividades que
              atraviesan generaciones.
            </p>
          </div>
          {(() => {
            const PLATOS = [
              {
                img: "/imagenes-reales/seccion-gastronomia/puca-picante.webp",
                nombre: "Puca Picante",
                desc: "Emblemático guiso de intenso color rojo a base de papa, maní tostado, betarraga y chicharrón de cerdo. Un clásico de festividades y picanterías ayacuchanas.",
              },
              {
                img: "/imagenes-reales/seccion-gastronomia/mondongo ayacuchano.webp",
                nombre: "Mondongo Ayacuchano",
                desc: "Contundente caldo dominical preparado con maíz mote, carnes, panza y hierbabuena. Un reparador desayuno tradicional de la sierra.",
              },
              {
                img: "/imagenes-reales/seccion-gastronomia/cuy-frito-ayacuchano.webp",
                nombre: "Cuy Frito Ayacuchano",
                desc: "Plato crujiente y emblemático de la gastronomía andina. Una herencia culinaria prehispánica presente en celebraciones tradicionales.",
              },
              {
                img: "/imagenes-reales/seccion-gastronomia/chorizo-ayacuchano.webp",
                nombre: "Chorizo Ayacuchano",
                desc: "Carne de cerdo finamente picada y macerada en ají panca, servida sin embutir. Un manjar tradicional especialmente popular en Semana Santa.",
              },
            ];
            return <PlatosTipicosGrid platos={PLATOS} />;
          })()}
        </div>
      </section>

      {/* PREMIOS */}
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          <div className="md:col-span-6">
            <span className="text-eucalipto font-medium uppercase tracking-[0.3em] text-xs mb-6 block">
              Excelencia Reconocida
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-6xl leading-[1.05] text-balance mb-8">
              Reconocidos por nuestro compromiso con la calidad.
            </h2>
            <p className="text-base sm:text-lg leading-[1.7] text-pretty max-w-[48ch] text-nogal/75 mb-10">
              Ser el mejor restaurante de Ayacucho no es solo un título, es una responsabilidad.
              Estos galardones reflejan nuestro respeto inquebrantable por la herencia culinaria.
            </p>
            <ul className="space-y-6 max-w-md">
              <li className="flex items-start gap-5 w-full">
                <span className="w-px h-10 bg-cochinilla shrink-0 mt-1" />
                <div className="w-full">
                  <h4 className="font-serif text-xl font-semibold mb-0.5">
                    Mejor Restaurante Regional
                  </h4>
                  <div className="flex items-start justify-between gap-4 w-full min-w-0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-10 h-10 flex-none text-nogal/70" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14 2v6h6" />
                    </svg>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">Documento en PDF</div>
                      <div className="text-xs text-nogal/50">Municipalidad distrital de Andres Avelino Cáceres Dorregaray</div>
                    </div>
                    <a href="/docs/resolucion_andres_avelino.pdf" target="_blank" rel="noopener noreferrer" className="self-start inline-flex items-center justify-center flex-none w-36 h-10 bg-eucalipto text-white rounded-md text-sm text-center">
                      Ver documento
                    </a>
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-5 w-full">
                <span className="w-px h-10 bg-cochinilla shrink-0 mt-1" />
                <div className="w-full">
                  <h4 className="font-serif text-xl font-semibold mb-0.5">
                    Guardianes de la Tradición
                  </h4>
                  <div className="flex items-start justify-between gap-4 w-full min-w-0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-10 h-10 flex-none text-nogal/70" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14 2v6h6" />
                    </svg>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">Documento en PDF</div>
                      <div className="text-xs text-nogal/50">Camara de Comercio</div>
                    </div>
                    <a href="/docs/documento_camara_comercio.pdf" target="_blank" rel="noopener noreferrer" className="self-start inline-flex items-center justify-center flex-none w-36 h-10 bg-eucalipto text-white rounded-md text-sm text-center">
                      Ver documento
                    </a>
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-5 w-full">
                <span className="w-px h-10 bg-cochinilla shrink-0 mt-1" />
                <div className="w-full">
                  <h4 className="font-serif text-xl font-semibold mb-0.5">Excelencia Sanitaria</h4>
                  <div className="flex items-start justify-between gap-4 w-full min-w-0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-10 h-10 flex-none text-nogal/70" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14 2v6h6" />
                    </svg>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">Documento en PDF</div>
                      <div className="text-xs text-nogal/50">Municipalidad distrital de Andres Avelino Cáceres Dorregaray</div>
                    </div>
                    <a href="/docs/Resolucion_andres_avelino_caceres.pdf" target="_blank" rel="noopener noreferrer" className="self-start inline-flex items-center justify-center flex-none w-36 h-10 bg-eucalipto text-white rounded-md text-sm text-center">
                      Ver documento
                    </a>
                  </div>
                </div>
              </li>
            </ul>
          </div>
          <div className="md:col-span-5 md:col-start-8">
            <img
              src="/imagenes-reales/premios-restaurante/premios-las-flores.webp"
              alt="Premios de Restaurante Las Flores"
              width={800}
              height={1200}
              loading="lazy"
              decoding="async"
              className="w-full h-full min-h-[500px] md:min-h-[600px] object-cover rounded-3xl"
            />
          </div>
        </div>
      </section>

      {/* CITA DEL PERSONAL */}
      <section className="relative bg-eucalipto py-24 md:py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-chilca font-medium uppercase tracking-[0.3em] text-xs block mb-8">
            El Orgullo de nuestro Personal
          </span>
          <blockquote className="font-serif italic text-3xl md:text-5xl leading-[1.15] text-piedra/95 text-balance">
            «Siento un profundo respeto al portar los colores de nuestra tierra. Aquí no solo
            atendemos, aquí somos embajadores de Ayacucho.»
          </blockquote>
          <cite className="not-italic block mt-10 text-xs uppercase tracking-[0.3em] text-piedra/60">
            — Carmen R., Anfitriona
          </cite>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="relative w-full">
        <img
          src={ayacuchoHero}
          alt="Vista andina al atardecer"
          width={1920}
          height={800}
          loading="lazy"
          decoding="async"
          className="w-full h-[60vh] md:h-[600px] object-cover"
        />
        <div className="absolute inset-0 bg-cafe/75" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <span className="text-piedra/70 uppercase tracking-[0.35em] text-xs block mb-6">
            Vive la Experiencia
          </span>
          <h2 className="font-serif italic text-piedra text-4xl md:text-6xl max-w-[24ch] leading-tight text-balance">
            De esta tierra nace Las Flores
          </h2>
          <p className="mt-6 max-w-[40ch] text-piedra/80 text-sm md:text-base leading-relaxed">
            Reserva una mesa en nuestro santuario de tradición o recibe el sabor de Ayacucho en tu
            hogar.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link
              to="/reservas"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 font-serif font-bold text-lg tracking-wide rounded-xl btn-yellow-hover"
            >
              <span>Reserva tu Mesa</span>
            </Link>
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="inline-flex items-center justify-center gap-3 px-8 py-4 border border-piedra/30 text-piedra text-[11px] uppercase tracking-[0.25em] font-bold hover:bg-piedra/10 transition-colors rounded-sm cursor-pointer"
            >
              Pedir por Delivery
            </button>
          </div>
        </div>
      </section>

      <MenuModal open={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <SiteFooter />
    </div>
  );
}


