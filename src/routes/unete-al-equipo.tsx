import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SiteNavigationMenu } from "../components/SiteNavigationMenu";
import { SiteFooter } from "../components/site-footer";
import { JobCard } from "../features/jobs/components/JobCard";
import { JobApplicationForm } from "../features/jobs/components/JobApplicationForm";
import { listPublicJobOffers } from "../features/jobs/api";
import { sortPublicOffers } from "../features/jobs/rules";
import type { PublicJobOffer } from "../features/jobs/types";
import { Heart, Users, Award, Loader2, AlertCircle, Briefcase, FileText, Send, CheckCircle2, ListChecks, Gift, Sparkles } from "lucide-react";
import { AnimatedCartButton } from "@/components/AnimatedCartButton";
import { FamiliaLasFloresSection } from "../components/FamiliaLasFloresSection";
import { useCart } from "@/context/CartContext";

export const Route = createFileRoute("/unete-al-equipo")({
  head: () => ({
    meta: [
      { title: "Únete al Equipo | Restaurante Las Flores" },
      {
        name: "description",
        content:
          "Desarróllate profesionalmente en Restaurante Las Flores Ayacucho. Conoce nuestras convocatorias abiertas y forma parte de nuestra familia.",
      },
    ],
    links: [{ rel: "canonical", href: "https://www.restaurantelasflores.com/unete-al-equipo" }],
  }),
  component: UneteAlEquipoPage,
});

const heroImg = "/imagenes-reales/EQUIPO/02042026-DSC05038.webp";

function UneteAlEquipoPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [offers, setOffers] = useState<PublicJobOffer[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<PublicJobOffer | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<"details" | "apply">("details");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedWorkMode, setSelectedWorkMode] = useState<string>("all");

  const { totalItems, setIsOpen: setCartOpen } = useCart();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const loadOffers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listPublicJobOffers();
      const sorted = sortPublicOffers(data);
      setOffers(sorted);
      if (sorted.length > 0) {
        setSelectedOffer(sorted[0]);
      }
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las convocatorias. Por favor intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOffers();
  }, []);

  // Filtros dinámicos
  const departments = Array.from(new Set(offers.map((o) => o.department))).filter(Boolean);
  const workModes = Array.from(new Set(offers.map((o) => o.work_mode))).filter(Boolean);

  const filteredOffers = offers.filter((offer) => {
    const matchDept = selectedDepartment === "all" || offer.department === selectedDepartment;
    const matchMode = selectedWorkMode === "all" || offer.work_mode === selectedWorkMode;
    return matchDept && matchMode;
  });

  return (
    <div className="min-h-screen bg-piedra flex flex-col font-sans text-nogal selection:bg-chilca/20">
      {/* ── HEADER / NAV FIJO (IGUAL A EVENTOS) ── */}
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

      {/* ── HERO SECTION (FORMATO EXACTO A EVENTOS) ── */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden bg-eucalipto pt-32 pb-24 px-6">
        <img
          src={heroImg}
          alt="Equipo de Restaurante Las Flores Ayacucho"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover opacity-65 filter brightness-105 saturate-[1.1]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/45 to-black/30" />

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6 -mt-12">
          <span className="text-chilca font-medium uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-2">
            <Sparkles size={14} />
            Trabaja con nosotros
            <Sparkles size={14} />
          </span>

          <h1 className="font-serif text-4xl md:text-6xl text-piedra font-normal leading-tight">
            Crece con nosotros <br />
            <span className="font-normal">en Ayacucho</span>
          </h1>

          <p className="text-base md:text-lg text-piedra/90 max-w-3xl mx-auto leading-relaxed">
            Forma parte de la tradición gastronómica y cultural de Ayacucho. Construye tu futuro laboral en la familia de Restaurante Las Flores.
          </p>
        </div>
      </section>

      {/* ── SECCIÓN DE VACANTES Y FORMULARIO (PRIMERO, PARA CONVERSIÓN INMEDIATA) ── */}
      <section className="py-16 md:py-24 px-6 md:px-12 lg:px-20 max-w-[1400px] mx-auto w-full flex-1">
        <div className="mb-10 text-center md:text-left">
          <h2 className="font-serif text-3xl md:text-4xl text-ink mb-2">Convocatorias Abiertas</h2>
          <p className="text-ink/60 text-sm">
            Explora las oportunidades laborales disponibles y envía tu postulación.
          </p>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-ink/50 gap-4">
            <Loader2 size={36} className="animate-spin text-eucalipto" />
            <p className="text-sm font-medium">Cargando convocatorias disponibles…</p>
          </div>
        ) : error ? (
          <div className="p-8 rounded-2xl bg-red-50 border border-red-200 text-center max-w-md mx-auto">
            <AlertCircle size={40} className="text-red-500 mx-auto mb-3" />
            <p className="text-sm text-red-700 mb-4">{error}</p>
            <button
              onClick={loadOffers}
              className="px-5 py-2.5 bg-eucalipto text-cream font-bold text-xs rounded-xl hover:bg-eucalipto/90 transition-all"
            >
              Reintentar
            </button>
          </div>
        ) : offers.length === 0 ? (
          <div className="p-12 rounded-2xl bg-white border border-black/10 text-center max-w-lg mx-auto shadow-sm">
            <Briefcase size={48} className="text-ink/30 mx-auto mb-4" />
            <h3 className="font-serif font-bold text-2xl text-ink mb-2">Sin convocatorias activas</h3>
            <p className="text-sm text-ink/60 leading-relaxed">
              En este momento no tenemos convocatorias abiertas. ¡Vuelve pronto a revisar nuestras publicaciones!
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Filtros dinámicos (solo si hay más de 1 opción) */}
            {(departments.length > 1 || workModes.length > 1) && (
              <div className="flex flex-wrap items-center gap-4 p-4 rounded-2xl bg-white border border-black/5 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-ink/60">Filtrar por:</span>

                {departments.length > 1 && (
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="px-3.5 py-2 rounded-xl bg-cream border border-black/10 text-xs font-semibold text-ink outline-none cursor-pointer focus:border-eucalipto"
                  >
                    <option value="all">Todas las áreas ({departments.length})</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                )}

                {workModes.length > 1 && (
                  <select
                    value={selectedWorkMode}
                    onChange={(e) => setSelectedWorkMode(e.target.value)}
                    className="px-3.5 py-2 rounded-xl bg-cream border border-black/10 text-xs font-semibold text-ink outline-none cursor-pointer focus:border-eucalipto"
                  >
                    <option value="all">Todas las modalidades</option>
                    {workModes.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode === "onsite" ? "Presencial" : mode === "hybrid" ? "Híbrido" : "Remoto"}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Layout Master-Detail: Lista de Vacantes (Izq) y Panel Interactivo con 2 Tabs (Der) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Columna Izquierda (Master): Tarjetas de Ofertas */}
              <div className="lg:col-span-5 space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {filteredOffers.map((offer) => (
                    <JobCard
                      key={offer.id}
                      offer={offer}
                      isSelected={selectedOffer?.id === offer.id}
                      onSelect={(o) => {
                        setSelectedOffer(o);
                        setActiveDetailTab("details");
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Columna Derecha (Detail Panel): Detalle & Formulario en 2 Pestañas */}
              <div className="lg:col-span-7 sticky top-28">
                {selectedOffer ? (
                  <div className="rounded-3xl bg-white border border-black/10 shadow-xl overflow-hidden transition-all">
                    {/* Encabezado del Panel */}
                    <div className="p-6 lg:p-8 bg-[#fcfaf5] border-b border-black/10">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-eucalipto bg-eucalipto/10 px-3.5 py-1 rounded-full">
                          {selectedOffer.department} • {selectedOffer.location}
                        </span>
                        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-black/5 text-ink/80 border border-black/5">
                          {selectedOffer.work_mode === "onsite"
                            ? "Presencial"
                            : selectedOffer.work_mode === "hybrid"
                            ? "Híbrido"
                            : "Remoto"}
                        </span>
                      </div>
                      <h3 className="font-serif font-bold text-2xl lg:text-3xl text-ink leading-tight">
                        {selectedOffer.title}
                      </h3>
                    </div>

                    {/* Barra de Pestañas (Tabs) */}
                    <div className="flex border-b border-black/10 bg-white">
                      <button
                        type="button"
                        onClick={() => setActiveDetailTab("details")}
                        className={`flex-1 py-3.5 px-4 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 border-b-2 ${
                          activeDetailTab === "details"
                            ? "border-eucalipto text-eucalipto bg-eucalipto/5 font-extrabold"
                            : "border-transparent text-ink/60 hover:text-ink hover:bg-black/5"
                        }`}
                      >
                        <FileText size={16} />
                        <span>1. Detalles y Requisitos</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveDetailTab("apply")}
                        className={`flex-1 py-3.5 px-4 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 border-b-2 ${
                          activeDetailTab === "apply"
                            ? "border-eucalipto text-eucalipto bg-eucalipto/5 font-extrabold"
                            : "border-transparent text-ink/60 hover:text-ink hover:bg-black/5"
                        }`}
                      >
                        <Send size={16} />
                        <span>2. Postular Ahora</span>
                      </button>
                    </div>

                    {/* Cuerpo de la Pestaña Activa */}
                    <div className="p-6 lg:p-8">
                      {activeDetailTab === "details" ? (
                        <div className="space-y-6 text-xs text-ink/80 leading-relaxed animate-in fade-in">
                          <div>
                            <h4 className="font-bold text-ink uppercase tracking-wider mb-2 text-[11px] text-eucalipto">
                              Descripción del Puesto
                            </h4>
                            <p className="text-sm text-ink/90 leading-relaxed font-sans">
                              {selectedOffer.description || selectedOffer.summary}
                            </p>
                          </div>

                        {selectedOffer.responsibilities?.length > 0 && (
                          <div>
                            <h4 className="font-bold text-ink uppercase tracking-wider mb-3 text-[11px] flex items-center gap-1.5 text-eucalipto">
                              <CheckCircle2 size={16} />
                              <span>Responsabilidades Principales</span>
                            </h4>
                            <ul className="space-y-2">
                              {selectedOffer.responsibilities.map((resp, i) => (
                                <li key={i} className="flex items-start gap-2.5 bg-cream/50 p-3 rounded-xl border border-black/5 text-ink/90">
                                  <span className="text-eucalipto font-bold mt-0.5">•</span>
                                  <span className="flex-1">{resp}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {selectedOffer.requirements?.length > 0 && (
                          <div>
                            <h4 className="font-bold text-ink uppercase tracking-wider mb-3 text-[11px] flex items-center gap-1.5 text-eucalipto">
                              <ListChecks size={16} />
                              <span>Requisitos del Candidato</span>
                            </h4>
                            <ul className="space-y-2">
                              {selectedOffer.requirements.map((req, i) => (
                                <li key={i} className="flex items-start gap-2.5 bg-cream/50 p-3 rounded-xl border border-black/5 text-ink/90">
                                  <span className="text-eucalipto font-bold mt-0.5">•</span>
                                  <span className="flex-1">{req}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {selectedOffer.benefits?.length > 0 && (
                          <div>
                            <h4 className="font-bold text-ink uppercase tracking-wider mb-3 text-[11px] flex items-center gap-1.5 text-eucalipto">
                              <Gift size={16} />
                              <span>Beneficios & Ofrecimiento</span>
                            </h4>
                            <ul className="space-y-2">
                              {selectedOffer.benefits.map((ben, i) => (
                                <li key={i} className="flex items-start gap-2.5 bg-green-50/60 p-3 rounded-xl border border-green-200/50 text-green-900">
                                  <span className="text-green-600 font-bold mt-0.5">✓</span>
                                  <span className="flex-1 font-medium">{ben}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Botón de Postulación al final del detalle */}
                        <div className="pt-4 border-t border-black/10">
                          <button
                            type="button"
                            onClick={() => setActiveDetailTab("apply")}
                            className="w-full py-4 bg-eucalipto text-cream font-bold text-sm rounded-xl shadow-md hover:bg-eucalipto/90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <span>Postular a esta vacante</span>
                            <Send size={16} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="animate-in fade-in">
                        <JobApplicationForm offer={selectedOffer} />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-12 rounded-3xl bg-white border border-black/10 text-center text-ink/50 shadow-sm space-y-4">
                  <Briefcase size={44} className="mx-auto text-ink/30" />
                  <h3 className="font-serif font-bold text-xl text-ink">Explora las vacantes</h3>
                  <p className="text-sm text-ink/60 max-w-sm mx-auto">
                    Haz clic en cualquier vacante de la lista para explorar sus detalles, requisitos y enviar tu postulación.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        )}
      </section>

      {/* ── PRINCIPIOS DE CULTURA (DEBAJO, COMO RESPALDO DE VALORES) ── */}
      <section className="py-16 md:py-20 px-6 md:px-12 lg:px-20 bg-white/60 border-t border-b border-black/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl text-ink mb-3">Nuestra Cultura Laboral</h2>
            <p className="text-ink/60 text-sm max-w-xl mx-auto">
              Nuestros valores fundamentales nos guían día a día para brindar experiencias inolvidables a nuestros visitantes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-white border border-black/5 shadow-sm text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-eucalipto/10 text-eucalipto flex items-center justify-center mb-5">
                <Heart size={28} />
              </div>
              <h3 className="font-serif font-bold text-xl text-ink mb-3">Pasión por el Servicio</h3>
              <p className="text-xs text-ink/70 leading-relaxed">
                Brindamos calidez, respeto y hospitalidad auténtica a cada uno de nuestros comensales y compañeros de trabajo.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white border border-black/5 shadow-sm text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-eucalipto/10 text-eucalipto flex items-center justify-center mb-5">
                <Users size={28} />
              </div>
              <h3 className="font-serif font-bold text-xl text-ink mb-3">Identidad y Equipo</h3>
              <p className="text-xs text-ink/70 leading-relaxed">
                Promovemos un ambiente colaborativo, inclusivo y orgulloso de la riqueza histórica y cultural de Ayacucho.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white border border-black/5 shadow-sm text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-eucalipto/10 text-eucalipto flex items-center justify-center mb-5">
                <Award size={28} />
              </div>
              <h3 className="font-serif font-bold text-xl text-ink mb-3">Desarrollo Constante</h3>
              <p className="text-xs text-ink/70 leading-relaxed">
                Apostamos por la capacitación continua, el reconocimiento del talento y la línea de carrera interna.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CIERRE EDITORIAL CON FOTO DEL EQUIPO ── */}
      <section className="py-16 md:py-20 px-6 md:px-12 lg:px-20 bg-eucalipto text-cream relative overflow-hidden">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 z-10">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-cream/75">
              Familia Las Flores
            </span>
            <h2 className="font-serif text-4xl md:text-5xl leading-tight">
              Más que un equipo, una familia apasionada por Ayacucho
            </h2>
            <p className="text-cream/90 text-sm md:text-base leading-relaxed">
              En Restaurante Las Flores valoramos la calidez humana, el respeto mutuo y el compromiso con nuestros clientes. Si buscas un ambiente de trabajo enriquecedor y con propósito, te estamos esperando.
            </p>
          </div>

          <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20">
            <img
              src={heroImg}
              alt="Fotografía del equipo Las Flores"
              className="w-full h-80 lg:h-96 object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
