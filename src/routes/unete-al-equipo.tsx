import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SiteNavigationMenu } from "../components/SiteNavigationMenu";
import { SiteFooter } from "../components/site-footer";
import { JobCard } from "../features/jobs/components/JobCard";
import { JobApplicationForm } from "../features/jobs/components/JobApplicationForm";
import { listPublicJobOffers } from "../features/jobs/api";
import { sortPublicOffers } from "../features/jobs/rules";
import type { PublicJobOffer } from "../features/jobs/types";
import { Heart, Users, Award, Loader2, AlertCircle, Briefcase, FileText, Send, CheckCircle2, ListChecks, Gift, ShoppingCart } from "lucide-react";
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
      {/* ── HEADER FIJO ── */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b ${
          isScrolled
            ? "bg-piedra/90 backdrop-blur-md shadow-sm border-nogal/10 py-3"
            : "bg-transparent border-transparent py-5"
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-20 flex justify-between items-center gap-3">
          <div className="flex items-center">
            <SiteNavigationMenu isScrolled={isScrolled} />
          </div>

          <a href="/" className="flex-1 flex justify-center items-center group">
            <img
              src="/images.png"
              alt="Las Flores"
              className={`transition-all duration-300 origin-center ${
                isScrolled ? "h-8 opacity-100" : "h-10 md:h-12 opacity-100 invert brightness-0"
              }`}
              style={
                isScrolled
                  ? {
                      filter:
                        "brightness(0) saturate(100%) invert(19%) sepia(16%) saturate(740%) hue-rotate(346deg) brightness(96%) contrast(89%)",
                    }
                  : {}
              }
            />
          </a>

          <div className="flex items-center gap-3">
            <a
              href="/reservas"
              className={`px-4 py-2 rounded-full font-semibold text-xs transition-all ${
                isScrolled
                  ? "bg-eucalipto text-cream hover:bg-eucalipto/90"
                  : "bg-cream text-ink hover:bg-cream/90"
              }`}
            >
              Reservar
            </a>

            {totalItems > 0 && (
              <button
                onClick={() => setCartOpen(true)}
                className="relative p-2 rounded-full bg-eucalipto text-cream hover:bg-eucalipto/90 transition-all"
              >
                <ShoppingCart size={20} />
                <span className="absolute -top-2 -right-2 bg-chilca text-nogal text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO PORTADA COMPLETA (FULLSCREEN 100VH) ── */}
      <section className="relative min-h-screen w-full overflow-hidden flex flex-col justify-center items-center px-6 md:px-12 lg:px-20">
        <div className="absolute inset-0 z-0">
          <img
            src={heroImg}
            alt="Equipo de Restaurante Las Flores"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/45" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/70" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10 pt-16">
          <span className="inline-block text-xs uppercase tracking-[0.3em] font-bold text-cream/90 bg-eucalipto/80 backdrop-blur-md px-4 py-1.5 rounded-full mb-6 border border-white/20 shadow-md">
            Trabaja con nosotros
          </span>
          <h1 className="font-serif text-4xl md:text-6xl text-piedra font-normal leading-tight mb-6">
            Crece con nosotros
          </h1>
          <p className="text-base md:text-lg text-piedra/90 max-w-3xl mx-auto leading-relaxed">
            Forma parte de la tradición gastronómica y cultural de Ayacucho. Construye tu futuro laboral en la familia de Restaurante Las Flores.
          </p>
        </div>

        {/* Indicador de scroll "Desliza" */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5 text-piedra/70 text-[10px] uppercase tracking-[0.4em] font-bold animate-bounce">
          <span>Desliza</span>
          <div className="w-1 h-3 rounded-full border border-piedra/50" />
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Lista lateral de vacantes */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-black/10">
                <span className="text-xs uppercase tracking-wider font-bold text-ink/60">
                  {offers.length} {offers.length === 1 ? "Puesto disponible" : "Puestos disponibles"}
                </span>
                <span className="text-[11px] text-eucalipto font-medium">
                  Actualizado en vivo
                </span>
              </div>

              <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1">
                {offers.map((offer) => {
                  const isSelected = selectedOffer?.id === offer.id;
                  const isExpiringSoon = offer.application_deadline && (() => {
                    const diffDays = Math.ceil((new Date(offer.application_deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    return diffDays >= 0 && diffDays <= 5;
                  })();

                  return (
                    <div
                      key={offer.id}
                      onClick={() => {
                        setSelectedOffer(offer);
                        setActiveDetailTab("details");
                      }}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer text-left relative overflow-hidden ${
                        isSelected
                          ? "bg-white border-eucalipto shadow-md ring-2 ring-eucalipto/20"
                          : "bg-white/70 border-black/10 hover:border-black/25 hover:bg-white"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-eucalipto" />
                      )}

                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="font-serif font-bold text-lg text-ink leading-tight">
                          {offer.title}
                        </h3>
                        <span className="text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full bg-cream border border-black/10 text-ink/80 shrink-0">
                          {offer.contract_type}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink/60 mb-3">
                        <span className="flex items-center gap-1">
                          <Users size={13} className="text-eucalipto" />
                          {offer.department}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={13} className="text-eucalipto" />
                          {offer.location || "Ayacucho"}
                        </span>
                        {offer.salary_range && (
                          <span className="font-semibold text-eucalipto">
                            {offer.salary_range}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-ink/75 line-clamp-2 leading-relaxed mb-3">
                        {offer.description}
                      </p>

                      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-black/5">
                        {offer.application_deadline ? (
                          <span className={`flex items-center gap-1 ${isExpiringSoon ? "text-amber-700 font-bold" : "text-ink/50"}`}>
                            <Clock size={12} />
                            <span>Cierra: {new Date(offer.application_deadline).toLocaleDateString("es-PE", { day: "numeric", month: "short" })}</span>
                          </span>
                        ) : (
                          <span className="text-ink/40">Convocatoria continua</span>
                        )}
                        <span className="text-eucalipto font-bold flex items-center gap-1 group">
                          Ver detalle
                          <ChevronRight size={14} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Panel de Detalle o Formulario de Postulación */}
            <div className="lg:col-span-7 sticky top-24">
              {selectedOffer ? (
                <div className="bg-white rounded-3xl border border-black/10 shadow-lg overflow-hidden">
                  {/* Pestañas Detalle vs Postulación */}
                  <div className="flex border-b border-black/10 bg-cream/30">
                    <button
                      type="button"
                      onClick={() => setActiveDetailTab("details")}
                      className={`flex-1 py-4 px-6 text-xs uppercase tracking-wider font-bold transition-all border-b-2 ${
                        activeDetailTab === "details"
                          ? "border-eucalipto text-eucalipto bg-white font-extrabold"
                          : "border-transparent text-ink/50 hover:text-ink hover:bg-white/50"
                      }`}
                    >
                      1. Detalle del Puesto
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveDetailTab("apply")}
                      className={`flex-1 py-4 px-6 text-xs uppercase tracking-wider font-bold transition-all border-b-2 flex items-center justify-center gap-1.5 ${
                        activeDetailTab === "apply"
                          ? "border-eucalipto text-eucalipto bg-white font-extrabold"
                          : "border-transparent text-ink/50 hover:text-ink hover:bg-white/50"
                      }`}
                    >
                      <Send size={14} />
                      <span>2. Postular Ahora</span>
                    </button>
                  </div>

                  <div className="p-6 md:p-8 max-h-[700px] overflow-y-auto">
                    {activeDetailTab === "details" ? (
                      <div className="space-y-6 text-sm">
                        <div>
                          <span className="text-xs uppercase tracking-widest font-bold text-eucalipto block mb-1">
                            {selectedOffer.department} • {selectedOffer.contract_type}
                          </span>
                          <h3 className="font-serif text-2xl md:text-3xl font-bold text-ink mb-2">
                            {selectedOffer.title}
                          </h3>
                          <div className="flex flex-wrap gap-3 text-xs text-ink/70">
                            <span className="bg-cream px-3 py-1 rounded-full border border-black/5">
                              📍 {selectedOffer.location || "Ayacucho, Perú"}
                            </span>
                            {selectedOffer.salary_range && (
                              <span className="bg-green-50 text-green-800 px-3 py-1 rounded-full border border-green-200 font-bold">
                                💰 {selectedOffer.salary_range}
                              </span>
                            )}
                            {selectedOffer.application_deadline && (
                              <span className="bg-amber-50 text-amber-900 px-3 py-1 rounded-full border border-amber-200">
                                ⏳ Postula hasta: {new Date(selectedOffer.application_deadline).toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" })}
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-bold text-ink uppercase tracking-wider mb-2 text-[11px] text-ink/60">
                            Descripción del puesto
                          </h4>
                          <p className="text-ink/80 leading-relaxed whitespace-pre-line">
                            {selectedOffer.description}
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
      <section className="py-20 px-6 md:px-12 lg:px-20 bg-eucalipto text-cream relative overflow-hidden">
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
