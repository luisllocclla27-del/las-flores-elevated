import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site-footer";
import { useState, useEffect } from "react";
import { SiteHeader } from "../components/SiteHeader";
import { Sparkles } from "lucide-react";
import { MobileCategoryFilter } from "@/components/MobileCategoryFilter";

export const Route = createFileRoute("/tesoros-ayacucho")({
  head: () => ({
    meta: [
      { title: "Tesoros de Ayacucho — Las Flores | Productos de Temporada" },
      {
        name: "description",
        content:
          "Descubre los productos ayacuchanos de temporada: papa nativa, quinoa, nísperos, airampo, tunas y más ingredientes autóctonos que dan vida a nuestra cocina.",
      },
      { property: "og:title", content: "Tesoros de Ayacucho — Las Flores" },
      {
        property: "og:description",
        content: "Productos ayacuchanos de temporada que dan vida a nuestra cocina tradicional.",
      },
      { property: "og:url", content: "https://www.restaurantelasflores.com/tesoros-ayacucho" },
    ],
    links: [{ rel: "canonical", href: "https://www.restaurantelasflores.com/tesoros-ayacucho" }],
  }),
  component: TesorosAyacuchoPage,
});

type Producto = {
  nombre: string;
  nombreCientifico?: string;
  descripcion: string;
  temporada: string;
  meses: string;
  imagen: string;
  usos: string[];
};

const productosPorTemporada: Record<string, Producto[]> = {
  Verano: [
    {
      nombre: "Tuna",
      nombreCientifico: "Opuntia ficus-indica",
      descripcion:
        "Fruto del nopal, dulce y refrescante. Rico en vitamina C y fibra. Se consume fresco o en jugos y mermeladas.",
      temporada: "Verano",
      meses: "Diciembre - Marzo",
      imagen: "/imagenes-reales/productosAyacucho/Tuna.webp",
      usos: ["Fresco", "Jugos", "Mermeladas", "Postres"],
    },
    {
      nombre: "Durazno",
      nombreCientifico: "Prunus persica",
      descripcion: "Fruta dulce de hueso cosechada en esta época.",
      temporada: "Verano",
      meses: "Diciembre - Marzo",
      imagen: "/imagenes-reales/productosAyacucho/durazno.webp",
      usos: ["Fresco", "Postres", "Jugos", "Mermeladas"],
    },
    {
      nombre: "Lúcuma",
      nombreCientifico: "Pouteria lucuma",
      descripcion: "Fruta nativa cremosa ideal para postres tradicionales.",
      temporada: "Verano",
      meses: "Diciembre - Mayo",
      imagen: "/imagenes-reales/productosAyacucho/lucuma.webp",
      usos: ["Helados", "Postres", "Batidos", "Dulces"],
    },
    {
      nombre: "Maíz Choclo",
      nombreCientifico: "Zea mays",
      descripcion: "Cosechas tiernas perfectas para humitas.",
      temporada: "Verano",
      meses: "Enero - Mayo",
      imagen: "/imagenes-reales/productosAyacucho/choclo.webp",
      usos: ["Sancochado", "Humitas", "Sopas", "Guisos"],
    },
    {
      nombre: "Sanky",
      nombreCientifico: "Corryocactus brevistylus",
      descripcion: "Fruto ácido de cactácea silvestre que madura antes de las lluvias, para bebidas y jugos.",
      temporada: "Verano",
      meses: "Enero - Mayo",
      imagen: "/imagenes-reales/productosAyacucho/sanky.webp",
      usos: ["Jugos", "Bebidas", "Postres", "Mermeladas"],
    },
    {
      nombre: "Ciruelo",
      descripcion: "Fruta de verano jugosa y dulce, apreciada fresca y en preparaciones caseras.",
      temporada: "Verano",
      meses: "Diciembre - Marzo",
      imagen: "/imagenes-reales/productosAyacucho/Verano/Ciruelo.webp",
      usos: ["Fresco", "Jugos", "Postres", "Mermeladas"],
    },
    {
      nombre: "Mango",
      descripcion: "Fruta tropical de pulpa dulce y aromática, ideal para bebidas y postres.",
      temporada: "Verano",
      meses: "Diciembre - Marzo",
      imagen: "/imagenes-reales/productosAyacucho/Verano/Mango.webp",
      usos: ["Fresco", "Jugos", "Postres", "Mermeladas"],
    },
    {
      nombre: "Aguaje",
      descripcion: "Fruto tropical de pulpa aromática, utilizado en bebidas y preparaciones dulces.",
      temporada: "Verano",
      meses: "Diciembre - Marzo",
      imagen: "/imagenes-reales/productosAyacucho/Verano/Aguaje.webp",
      usos: ["Fresco", "Jugos", "Bebidas", "Postres"],
    },
    {
      nombre: "Camote",
      descripcion: "Tubérculo dulce y nutritivo, versátil para preparaciones tradicionales.",
      temporada: "Verano",
      meses: "Diciembre - Marzo",
      imagen: "/imagenes-reales/productosAyacucho/Verano/Camote.webp",
      usos: ["Sancochado", "Guisos", "Postres", "Acompañamientos"],
    },
    {
      nombre: "Melón",
      descripcion: "Fruta jugosa y refrescante, perfecta para consumir fresca o en bebidas.",
      temporada: "Verano",
      meses: "Diciembre - Marzo",
      imagen: "/imagenes-reales/productosAyacucho/Verano/Melon.webp",
      usos: ["Fresco", "Jugos", "Ensaladas", "Postres"],
    },
    {
      nombre: "Papaya",
      descripcion: "Fruta de pulpa suave y dulce, apreciada fresca y en jugos.",
      temporada: "Verano",
      meses: "Diciembre - Marzo",
      imagen: "/imagenes-reales/productosAyacucho/Verano/Papaya.webp",
      usos: ["Fresco", "Jugos", "Batidos", "Postres"],
    },
    {
      nombre: "Piña",
      descripcion: "Fruta tropical aromática y refrescante, ideal para bebidas y postres.",
      temporada: "Verano",
      meses: "Diciembre - Marzo",
      imagen: "/imagenes-reales/productosAyacucho/Verano/Piña.webp",
      usos: ["Fresco", "Jugos", "Bebidas", "Postres"],
    },
    {
      nombre: "Sandía",
      descripcion: "Fruta de pulpa dulce y abundante agua, especialmente refrescante en verano.",
      temporada: "Verano",
      meses: "Diciembre - Marzo",
      imagen: "/imagenes-reales/productosAyacucho/Verano/Sandia.webp",
      usos: ["Fresco", "Jugos", "Bebidas", "Postres"],
    },
    {
      nombre: "Yuca",
      descripcion: "Raíz de textura firme y sabor suave, base de diversas preparaciones tradicionales.",
      temporada: "Verano",
      meses: "Diciembre - Marzo",
      imagen: "/imagenes-reales/productosAyacucho/Verano/Yuca.webp",
      usos: ["Sancochado", "Guisos", "Frituras", "Acompañamientos"],
    }
  ],
  Otoño: [
    {
      nombre: "Palta",
      nombreCientifico: "Persea americana",
      descripcion: "Variedades locales que inician su maduración óptima.",
      temporada: "Otoño",
      meses: "Marzo y Septiembre",
      imagen: "/imagenes-reales/productosAyacucho/palta.webp",
      usos: ["Ensaladas", "Acompañamientos", "Sopas", "Salsas"],
    },
    {
      nombre: "Papa Nativa",
      nombreCientifico: "Solanum spp.",
      descripcion:
        "Variedades ancestrales de papa con colores y sabores únicos. Base fundamental de la gastronomía ayacuchana.",
      temporada: "Otoño",
      meses: "Abril - Junio",
      imagen: "/imagenes-reales/productosAyacucho/Papa-Nativa.webp",
      usos: ["Guisos", "Sopas", "Puca picante", "Papas fritas"],
    },
    {
      nombre: "Quinoa",
      nombreCientifico: "Chenopodium quinoa",
      descripcion:
        "Grano andino considerado superalimento. Rico en proteínas y minerales esenciales.",
      temporada: "Otoño",
      meses: "Mayo - Julio",
      imagen: "/imagenes-reales/productosAyacucho/Quinoa.webp",
      usos: ["Sopas", "Ensaladas", "Guarniciones", "Postres"],
    },
    {
      nombre: "Kiwicha",
      nombreCientifico: "Amaranthus caudatus",
      descripcion: "Súper grano que se seca y cosecha en estos meses.",
      temporada: "Otoño",
      meses: "Abril - Junio",
      imagen: "/imagenes-reales/productosAyacucho/kiwicha.webp",
      usos: ["Bebidas", "Postres", "Sopas", "Desayunos"],
    },
    {
      nombre: "Oca",
      nombreCientifico: "Oxalis tuberosa",
      descripcion: "Tubérculo dulce andino tradicional que sale junto a la papa.",
      temporada: "Otoño",
      meses: "Marzo - Junio",
      imagen: "/imagenes-reales/productosAyacucho/oca.webp",
      usos: ["Sancochado", "Guisos", "Mermeladas", "Postres"],
    },
    {
      nombre: "Mashua",
      nombreCientifico: "Tropaeolum tuberosum",
      descripcion: "Tubérculo medicinal cosechado al decaer las lluvias.",
      temporada: "Otoño",
      meses: "Abril - Junio",
      imagen: "/imagenes-reales/productosAyacucho/mashua.webp",
      usos: ["Sancochado", "Guisos", "Postres medicinales"],
    },
    {
      nombre: "Olluco",
      nombreCientifico: "Ullucus tuberosus",
      descripcion: "Infaltable en los guisos, fresco de la cosecha estacional.",
      temporada: "Otoño",
      meses: "Marzo - Julio",
      imagen: "/imagenes-reales/productosAyacucho/olluco.webp",
      usos: ["Guisos", "Sopas", "Acompañamientos"],
    },
    {
      nombre: "Calabaza",
      nombreCientifico: "Cucurbita maxima",
      descripcion: "Frutos tiernos ideales para las mazamorras primaverales.",
      temporada: "Otoño",
      meses: "Marzo - Agosto",
      imagen: "/imagenes-reales/productosAyacucho/calabaza.webp",
      usos: ["Mazamorras", "Sopas", "Guisos", "Dulces"],
    },
    {
      nombre: "Airampo",
      nombreCientifico: "Opuntia soehrensii",
      descripcion:
        "Cactus cuya fruta produce un colorante natural rojo intenso. Usado en bebidas tradicionales.",
      temporada: "Otoño",
      meses: "Marzo y Junio",
      imagen: "/imagenes-reales/productosAyacucho/Airampo.webp",
      usos: ["Bebidas", "Colorante natural", "Postres", "Chicha"],
    },
    {
      nombre: "Aceituna",
      descripcion: "Fruto de sabor intenso utilizado en preparaciones saladas y conservas.",
      temporada: "Otoño",
      meses: "Marzo - Junio",
      imagen: "/imagenes-reales/productosAyacucho/Otoño/Aceituna.webp",
      usos: ["Ensaladas", "Salsas", "Conservas", "Acompañamientos"],
    },
    {
      nombre: "Café",
      descripcion: "Grano aromático de tostado profundo, apreciado en bebidas calientes.",
      temporada: "Otoño",
      meses: "Marzo - Junio",
      imagen: "/imagenes-reales/productosAyacucho/Otoño/Cafe.webp",
      usos: ["Bebidas calientes", "Postres", "Dulces", "Infusiones"],
    },
    {
      nombre: "Caña de azúcar",
      descripcion: "Cultivo dulce utilizado para elaborar bebidas, mieles y derivados tradicionales.",
      temporada: "Otoño",
      meses: "Marzo - Junio",
      imagen: "/imagenes-reales/productosAyacucho/Otoño/Caña de azucar.webp",
      usos: ["Bebidas", "Mieles", "Dulces", "Derivados"],
    },
    {
      nombre: "Frejol",
      descripcion: "Legumbre nutritiva y versátil, presente en guisos y acompañamientos.",
      temporada: "Otoño",
      meses: "Marzo - Junio",
      imagen: "/imagenes-reales/productosAyacucho/Otoño/Frejol.webp",
      usos: ["Guisos", "Sopas", "Ensaladas", "Acompañamientos"],
    },
    {
      nombre: "Granada",
      descripcion: "Fruta de granos jugosos y sabor equilibrado, rica en color y frescura.",
      temporada: "Otoño",
      meses: "Marzo - Junio",
      imagen: "/imagenes-reales/productosAyacucho/Otoño/Granada.webp",
      usos: ["Fresco", "Jugos", "Ensaladas", "Postres"],
    },
    {
      nombre: "Higo",
      descripcion: "Fruto suave y dulce de temporada, usado fresco o en preparaciones dulces.",
      temporada: "Otoño",
      meses: "Marzo - Junio",
      imagen: "/imagenes-reales/productosAyacucho/Otoño/Higo.webp",
      usos: ["Fresco", "Postres", "Mermeladas", "Dulces"],
    },
    {
      nombre: "Lenteja",
      descripcion: "Legumbre de alto valor nutritivo, ideal para sopas y guisos caseros.",
      temporada: "Otoño",
      meses: "Marzo - Junio",
      imagen: "/imagenes-reales/productosAyacucho/Otoño/Lenteja.webp",
      usos: ["Sopas", "Guisos", "Ensaladas", "Acompañamientos"],
    }
  ],
  Invierno: [
    {
      nombre: "Trigo",
      nombreCientifico: "Triticum aestivum",
      descripcion: "Cosechado a mitad de año para panes tradicionales.",
      temporada: "Invierno",
      meses: "Junio - Agosto",
      imagen: "/imagenes-reales/productosAyacucho/trigo.webp",
      usos: ["Panes", "Sopas", "Guisos", "Postres"],
    },
    {
      nombre: "Chuño",
      nombreCientifico: "Solanum tuberosum",
      descripcion: "Tubérculos procesados aprovechando las heladas nocturnas.",
      temporada: "Invierno",
      meses: "Junio - Agosto",
      imagen: "/imagenes-reales/productosAyacucho/chuño.webp",
      usos: ["Sopas", "Guisos", "Mazamorras", "Acompañamientos"],
    },
    {
      nombre: "Arveja Verde",
      nombreCientifico: "Pisum sativum",
      descripcion: "Primeras vainas verdes recolectadas en los valles.",
      temporada: "Invierno",
      meses: "Abril - Agosto",
      imagen: "/imagenes-reales/productosAyacucho/arveja.webp",
      usos: ["Guisos", "Sopas", "Arroces", "Ensaladas"],
    },
    {
      nombre: "Charqui",
      nombreCientifico: "Lama glama",
      descripcion: "Carne deshidratada de camélido u ovino típica de la estación.",
      temporada: "Invierno",
      meses: "Mayo - Agosto",
      imagen: "/imagenes-reales/productosAyacucho/charqui.webp",
      usos: ["Sopas", "Olluquito", "Guisos", "Saltados"],
    },
    {
      nombre: "Cebada",
      nombreCientifico: "Hordeum vulgare",
      descripcion: "Grano seco recolectado para harinas (máchica) y bebidas.",
      temporada: "Invierno",
      meses: "Octubre - Noviembre",
      imagen: "/imagenes-reales/productosAyacucho/cebada.webp",
      usos: ["Máchica", "Bebidas calientes", "Refrescos", "Sopas"],
    },
    {
      nombre: "Ajo",
      descripcion: "Bulbo aromático esencial para aderezos y preparaciones tradicionales.",
      temporada: "Invierno",
      meses: "Junio - Agosto",
      imagen: "/imagenes-reales/productosAyacucho/Invierno/Ajo.webp",
      usos: ["Aderezos", "Salsas", "Guisos", "Sopas"],
    },
    {
      nombre: "Beterraga",
      descripcion: "Raíz de color intenso y sabor terroso, ideal para ensaladas y bebidas.",
      temporada: "Invierno",
      meses: "Junio - Agosto",
      imagen: "/imagenes-reales/productosAyacucho/Invierno/Beterraga.webp",
      usos: ["Ensaladas", "Jugos", "Sopas", "Acompañamientos"],
    },
    {
      nombre: "Brócoli",
      descripcion: "Hortaliza nutritiva y fresca, utilizada en sopas, ensaladas y guisos.",
      temporada: "Invierno",
      meses: "Junio - Agosto",
      imagen: "/imagenes-reales/productosAyacucho/Invierno/Brocoli.webp",
      usos: ["Sopas", "Ensaladas", "Guisos", "Acompañamientos"],
    },
    {
      nombre: "Coliflor",
      descripcion: "Hortaliza de textura suave y sabor delicado para preparaciones caseras.",
      temporada: "Invierno",
      meses: "Junio - Agosto",
      imagen: "/imagenes-reales/productosAyacucho/Invierno/Colifor.webp",
      usos: ["Sopas", "Ensaladas", "Guisos", "Acompañamientos"],
    },
    {
      nombre: "Limón",
      descripcion: "Cítrico aromático y refrescante que realza bebidas y preparaciones de nuestra cocina.",
      temporada: "Invierno",
      meses: "Junio - Agosto",
      imagen: "/imagenes-reales/productosAyacucho/Invierno/Limon.webp",
      usos: ["Bebidas", "Aderezos", "Salsas", "Postres"],
    },
    {
      nombre: "Mandarina",
      descripcion: "Cítrico dulce y jugoso, perfecto para consumir fresco o preparar bebidas.",
      temporada: "Invierno",
      meses: "Junio - Agosto",
      imagen: "/imagenes-reales/productosAyacucho/Invierno/Mandarina.webp",
      usos: ["Fresco", "Jugos", "Postres", "Mermeladas"],
    },
    {
      nombre: "Zanahoria",
      descripcion: "Raíz crocante y nutritiva, utilizada en ensaladas, sopas y guisos.",
      temporada: "Invierno",
      meses: "Junio - Agosto",
      imagen: "/imagenes-reales/productosAyacucho/Invierno/Zanahoria.webp",
      usos: ["Ensaladas", "Sopas", "Guisos", "Jugos"],
    }
  ],
  Primavera: [
    {
      nombre: "Níspero",
      nombreCientifico: "Eriobotrya japonica",
      descripcion:
        "Fruta dulce y jugosa de pulpa anaranjada. Excelente fuente de vitamina A y antioxidantes.",
      temporada: "Primavera",
      meses: "Septiembre - Noviembre",
      imagen: "/imagenes-reales/productosAyacucho/Níspero.webp",
      usos: ["Fresco", "Jugos", "Compotas", "Ensaladas de frutas"],
    },
    {
      nombre: "Habas Verdes",
      nombreCientifico: "Vicia faba",
      descripcion:
        "Legumbre tierna y nutritiva. Se consume en sopas, guisos y como acompañamiento.",
      temporada: "Primavera",
      meses: "Septiembre - Noviembre",
      imagen: "/imagenes-reales/productosAyacucho/Habas-Verdes.webp",
      usos: ["Sopas", "Guisos", "Ensaladas", "Saltados"],
    },
    {
      nombre: "Hierba Buena",
      nombreCientifico: "Mentha spicata",
      descripcion: "Hierbas aromáticas frescas que reviven con el calor, para mondingo.",
      temporada: "Primavera",
      meses: "Septiembre - Marzo",
      imagen: "/imagenes-reales/productosAyacucho/hierba-buena.webp",
      usos: ["Mondongo", "Sopas", "Bebidas", "Aderezos"],
    },
    {
      nombre: "Muña",
      nombreCientifico: "Minthostachys mollis",
      descripcion: "Hierba digestiva ancestral en su punto más aromático, bebidas.",
      temporada: "Primavera",
      meses: "Septiembre - Marzo",
      imagen: "/imagenes-reales/productosAyacucho/muña.webp",
      usos: ["Infusiones", "Sopas", "Aderezos", "Digestivos"],
    },
    {
      nombre: "Ají Limo",
      descripcion: "Ají aromático y de sabor intenso, utilizado para realzar preparaciones.",
      temporada: "Primavera",
      meses: "Septiembre - Marzo",
      imagen: "/imagenes-reales/productosAyacucho/Primvera/Aji Limo.webp",
      usos: ["Salsas", "Aderezos", "Guisos", "Ceviches"],
    },
    {
      nombre: "Alcachofa",
      descripcion: "Hortaliza de sabor delicado, ideal para ensaladas y guisos.",
      temporada: "Primavera",
      meses: "Septiembre - Noviembre",
      imagen: "/imagenes-reales/productosAyacucho/Primvera/Alcachofa.webp",
      usos: ["Ensaladas", "Guisos", "Entradas", "Acompañamientos"],
    },
    {
      nombre: "Arándano",
      descripcion: "Fruto pequeño de sabor dulce y ligeramente ácido, ideal para preparaciones frescas.",
      temporada: "Primavera",
      meses: "Septiembre - Noviembre",
      imagen: "/imagenes-reales/productosAyacucho/Primvera/Arandano.webp",
      usos: ["Fresco", "Jugos", "Postres", "Mermeladas"],
    },
    {
      nombre: "Ciruelo",
      descripcion: "Fruta jugosa y dulce, apreciada fresca y en preparaciones caseras.",
      temporada: "Primavera",
      meses: "Septiembre - Noviembre",
      imagen: "/imagenes-reales/productosAyacucho/Primvera/Ciruelo.webp",
      usos: ["Fresco", "Jugos", "Postres", "Mermeladas"],
    },
    {
      nombre: "Espárrago",
      descripcion: "Hortaliza tierna y versátil, utilizada en ensaladas y preparaciones saladas.",
      temporada: "Primavera",
      meses: "Septiembre - Noviembre",
      imagen: "/imagenes-reales/productosAyacucho/Primvera/Esparrago.webp",
      usos: ["Ensaladas", "Sopas", "Guisos", "Acompañamientos"],
    },
    {
      nombre: "Fresa",
      descripcion: "Fruto aromático y dulce que aporta frescura y color a bebidas y postres.",
      temporada: "Primavera",
      meses: "Septiembre - Noviembre",
      imagen: "/imagenes-reales/productosAyacucho/Primvera/Fresa.webp",
      usos: ["Fresco", "Jugos", "Postres", "Mermeladas"],
    },
    {
      nombre: "Pepino",
      descripcion: "Hortaliza fresca y crocante, ideal para ensaladas y bebidas refrescantes.",
      temporada: "Primavera",
      meses: "Septiembre - Noviembre",
      imagen: "/imagenes-reales/productosAyacucho/Primvera/Pepino.webp",
      usos: ["Ensaladas", "Bebidas", "Aderezos", "Acompañamientos"],
    },
    {
      nombre: "Pimentón",
      descripcion: "Hortaliza colorida y aromática que aporta sabor y frescura a diversos platos.",
      temporada: "Primavera",
      meses: "Septiembre - Noviembre",
      imagen: "/imagenes-reales/productosAyacucho/Primvera/Pimenton.webp",
      usos: ["Ensaladas", "Guisos", "Salsas", "Acompañamientos"],
    }
  ],
};

function TesorosAyacuchoPage() {
  const [activeTemporada, setActiveTemporada] = useState<string>("Verano");

  return (
    <div className="bg-piedra text-nogal font-sans selection:bg-chilca/30">
      {/* ── HEADER UNIFICADO ── */}
      <SiteHeader />

      {/* Hero */}
      <header className="relative min-h-[60vh] w-full overflow-hidden bg-eucalipto flex items-center pt-32 pb-24">
        <img
          src="/imagenes-reales/productosAyacucho/temporadas.webp"
          alt="Tesoros de Ayacucho — productos nativos de temporada"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover opacity-65 filter brightness-105 saturate-[1.1]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/45 to-black/30" />

        <div className="relative z-10 mx-auto flex w-full max-w-4xl items-center justify-center px-6 text-piedra">
          <div className="max-w-3xl text-center space-y-6">

            <span className="text-chilca font-medium uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-2">
              <Sparkles size={14} />
              Productos de Temporada · Ayacucho
              <Sparkles size={14} />
            </span>

            <h1 className="font-serif text-4xl md:text-6xl text-piedra font-normal leading-tight">
              Tesoros de Ayacucho
            </h1>

            <p className="text-base md:text-lg text-piedra/90 max-w-3xl mx-auto leading-relaxed">
              Ingredientes autóctonos que dan vida a nuestra cocina. Cada temporada trae los mejores
              productos de nuestra tierra, cosechados en su punto perfecto.
            </p>
          </div>
        </div>
      </header>

      {/* ── FILTROS MÓVIL: sticky pegado al header (solo < lg) ── */}
      <div className="block lg:hidden sticky top-12 z-30 w-full bg-[#F9F8F3] border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto pl-6">
          <MobileCategoryFilter
            categories={Object.keys(productosPorTemporada).map((temporada) => ({ key: temporada, label: temporada }))}
            activeKey={activeTemporada}
            onSelect={setActiveTemporada}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* ── FILTROS DESKTOP: centrados dentro del contenido (solo lg+) ── */}
        <div className="hidden lg:flex justify-center gap-3 mb-12">
          {Object.keys(productosPorTemporada).map((temporada) => (
            <button
              key={temporada}
              onClick={() => setActiveTemporada(temporada)}
              className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                activeTemporada === temporada
                  ? "bg-[#2D473C] text-[#D4AF37] shadow-md"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
              }`}
            >
              {temporada}
            </button>
          ))}
        </div>

        {/* Grid de Productos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {productosPorTemporada[activeTemporada].map((producto, index) => (
              <article
                key={index}
                className="group relative h-[420px] rounded-2xl overflow-hidden shadow-lg cursor-pointer"
              >
                {/* Imagen de fondo absoluto con zoom en hover */}
                <img
                  src={producto.imagen}
                  alt={producto.nombre}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
                />
                
                {/* Gradiente base (más oscuro en móvil porque el texto siempre está visible, en PC se oscurece al hacer hover) */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-90 md:opacity-70 transition-opacity duration-500 md:group-hover:opacity-90" />
                
                {/* Contenido (Textos superpuestos) */}
                <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end">
                  
                  {/* Título y nombre científico (Aparece con leve movimiento arriba en desktop) */}
                  <div className="transform md:translate-y-4 group-hover:!translate-y-0 md:group-hover:-translate-y-2 transition-all duration-500 ease-out">
                    <h3 className="font-serif text-3xl text-white font-bold mb-1 drop-shadow-md">
                      {producto.nombre}
                    </h3>
                    {producto.nombreCientifico && (
                      <p className="text-sm italic text-white/70 mb-2">{producto.nombreCientifico}</p>
                    )}
                  </div>
                  
                  {/* Temporada (Visible en móvil, Delay 1 en desktop) */}
                  <div className="transform translate-y-0 opacity-100 md:translate-y-8 md:opacity-0 group-hover:!translate-y-0 group-hover:!opacity-100 transition-all duration-500 md:delay-100 ease-out mb-5 mt-3 md:mt-0">
                    <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-chilca bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
                      Temporada: {producto.meses}
                    </span>
                  </div>
                  
                  {/* Etiquetas de usos (Visible en móvil, Delay 2 en desktop) */}
                  <div className="transform translate-y-0 opacity-100 md:translate-y-8 md:opacity-0 group-hover:!translate-y-0 group-hover:!opacity-100 transition-all duration-500 md:delay-200 ease-out">
                    <div className="flex flex-wrap gap-2">
                      {producto.usos.map((uso, i) => (
                        <span
                          key={i}
                          className="text-[10px] uppercase tracking-wider px-3 py-1 bg-white/10 backdrop-blur-md text-white rounded-full border border-white/20"
                        >
                          {uso}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                </div>
              </article>
            ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
