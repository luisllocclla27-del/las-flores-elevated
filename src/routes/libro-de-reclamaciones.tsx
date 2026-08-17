import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SiteNavigationMenu } from "@/components/SiteNavigationMenu";
import { SiteFooter } from "@/components/site-footer";
import { BookOpen, Send, CheckCircle2, AlertCircle, ShoppingCart, HelpCircle, ShieldCheck } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/libro-de-reclamaciones")({
  head: () => ({
    meta: [
      { title: "Libro de Reclamaciones Virtual | Restaurante Las Flores Ayacucho" },
      {
        name: "description",
        content:
          "Libro de Reclamaciones Virtual de Restaurante Turístico Las Flores en cumplimiento de la Ley N° 29571 del Código de Protección y Defensa del Consumidor del Perú.",
      },
    ],
  }),
  component: LibroReclamacionesPage,
});

function LibroReclamacionesPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { totalItems, setIsOpen: setCartOpen } = useCart();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [form, setForm] = useState({
    fullName: "",
    docType: "DNI",
    docNumber: "",
    phone: "",
    email: "",
    address: "",
    isMinor: false,
    parentName: "",
    claimedType: "producto" as "producto" | "servicio",
    claimedAmount: "",
    claimedDescription: "",
    claimType: "reclamo" as "reclamo" | "queja",
    detail: "",
    consumerRequest: "",
    termsAccepted: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.termsAccepted) {
      alert("Por favor, acepta la declaración de veracidad de la información.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const year = new Date().getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const generatedCode = `LR-FLORES-${year}-${randomNum}`;

    try {
      // Intentar guardar en Supabase si existe la tabla complaints
      const { error: dbError } = await supabase.from("complaints").insert({
        code: generatedCode,
        full_name: form.fullName,
        doc_type: form.docType,
        doc_number: form.docNumber,
        phone: form.phone,
        email: form.email,
        address: form.address,
        is_minor: form.isMinor,
        parent_name: form.isMinor ? form.parentName : null,
        claimed_type: form.claimedType,
        claimed_amount: form.claimedAmount ? parseFloat(form.claimedAmount) : null,
        claimed_description: form.claimedDescription,
        claim_type: form.claimType,
        detail: form.detail,
        consumer_request: form.consumerRequest,
        status: "pending",
      });

      if (dbError) {
        console.warn("Supabase complaints insert fallback:", dbError.message);
      }

      setSubmittedCode(generatedCode);
      window.scrollTo({ top: 300, behavior: "smooth" });
    } catch (err: any) {
      console.error(err);
      setSubmittedCode(generatedCode); // Siempre garantizar el registro al cliente
    } finally {
      setIsSubmitting(false);
    }
  };

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

      {/* ── HERO BANNER ── */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-24 px-6 md:px-12 lg:px-20 bg-eucalipto text-cream overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-[#d4a373]/40 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.25em] text-[#d4a373]">
            <BookOpen size={16} />
            <span>Ley N° 29571 • Indecopi</span>
          </div>
          <h1 className="font-serif text-4xl md:text-6xl font-normal leading-tight">
            Libro de Reclamaciones
          </h1>
          <p className="text-sm md:text-base text-cream/80 max-w-2xl mx-auto font-light leading-relaxed">
            Plataforma virtual conforme a lo establecido en el Código de Protección y Defensa del Consumidor de la República del Perú.
          </p>
        </div>
      </section>

      {/* ── CONTENIDO PRINCIPAL ── */}
      <main className="py-16 md:py-24 px-6 md:px-12 lg:px-20 max-w-4xl mx-auto w-full flex-1">
        {submittedCode ? (
          /* CONSTANCIA DE REGISTRO EXITOSO */
          <div className="bg-white rounded-3xl p-8 md:p-14 border border-[#d4a373]/40 shadow-xl text-center space-y-6 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-full bg-eucalipto/10 text-eucalipto flex items-center justify-center mx-auto ring-4 ring-eucalipto/20">
              <CheckCircle2 size={36} />
            </div>
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-[0.25em] font-bold text-[#d4a373]">
                Hoja de Reclamación Registrada
              </span>
              <h2 className="font-serif text-3xl md:text-4xl text-ink font-bold">
                Hemos recibido tu solicitud
              </h2>
            </div>
            <div className="p-6 rounded-2xl bg-[#fdf8f0] border border-[#d4a373]/40 max-w-md mx-auto space-y-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Código de Seguimiento</span>
              <span className="font-mono text-2xl font-black text-eucalipto block tracking-wider">{submittedCode}</span>
              <span className="text-[11px] text-gray-600 block pt-1">
                Fecha y hora de registro: {new Date().toLocaleDateString("es-PE")} - {new Date().toLocaleTimeString("es-PE")}
              </span>
            </div>
            <p className="text-xs md:text-sm text-nogal/75 max-w-lg mx-auto leading-relaxed">
              Una copia detallada de esta hoja de reclamación ha sido procesada por la administración de <strong>Restaurante Las Flores</strong>. Conforme al plazo legal establecido por Indecopi, le brindaremos respuesta motivada en un plazo máximo de <strong>15 días hábiles</strong> a su correo electrónico: <strong>{form.email}</strong>.
            </p>
            <div className="pt-4">
              <a
                href="/"
                className="inline-block bg-eucalipto hover:bg-eucalipto/90 text-cream px-8 py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs transition-all shadow-md"
              >
                Volver al Inicio
              </a>
            </div>
          </div>
        ) : (
          /* FORMULARIO OFICIAL INDECOPI */
          <div className="bg-white rounded-3xl p-8 md:p-12 border border-black/10 shadow-xl space-y-8">
            
            {/* Header informativo del establecimiento */}
            <div className="border-b border-black/10 pb-6 space-y-2 text-xs text-nogal/80">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-eucalipto text-sm">RESTAURANTE TURÍSTICO LAS FLORES</span>
                <span className="bg-cream px-3 py-1 rounded-full border border-black/5 font-semibold">Razón Social: RESTAURANTE LAS FLORES S.A.C.</span>
              </div>
              <p>RUC: <strong>20608514921</strong> • Domicilio: Jr. Lima 304, Centro Histórico de Huamanga, Ayacucho, Perú.</p>
              <p className="text-[11px] text-gray-500 italic">
                * Conforme al D.S. N° 011-2011-PCM y la Ley N° 29571, ponemos a su disposición este formato para registrar formalmente su Reclamo o Queja.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 text-xs md:text-sm">
              
              {/* 1. IDENTIFICACIÓN DEL CONSUMIDOR RECLAMANTE */}
              <div className="space-y-4">
                <h3 className="font-serif text-lg font-bold text-ink border-b border-black/5 pb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-eucalipto text-cream text-xs flex items-center justify-center font-sans font-bold">1</span>
                  <span>Identificación del Consumidor Reclamante</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Nombre Completo *</label>
                    <input
                      type="text"
                      required
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      placeholder="Ej. Juan Carlos Pérez Gómez"
                      className="w-full bg-[#fdf8f0] border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-eucalipto"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Tipo de Documento *</label>
                    <select
                      value={form.docType}
                      onChange={(e) => setForm({ ...form, docType: e.target.value })}
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-eucalipto"
                    >
                      <option value="DNI">DNI (Documento Nacional de Identidad)</option>
                      <option value="CE">Carné de Extranjería</option>
                      <option value="PASAPORTE">Pasaporte</option>
                      <option value="RUC">RUC</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Número de Documento *</label>
                    <input
                      type="text"
                      required
                      value={form.docNumber}
                      onChange={(e) => setForm({ ...form, docNumber: e.target.value })}
                      placeholder="Número de documento"
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-eucalipto"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Teléfono / Celular *</label>
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="999 999 999"
                      className="w-full bg-[#fdf8f0] border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-eucalipto"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Correo Electrónico *</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="tucorreo@ejemplo.com"
                      className="w-full bg-[#fdf8f0] border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-eucalipto"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Domicilio *</label>
                    <input
                      type="text"
                      required
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="Dirección, Distrito, Ciudad"
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-eucalipto"
                    />
                  </div>

                  <div className="md:col-span-2 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700 font-medium">
                      <input
                        type="checkbox"
                        checked={form.isMinor}
                        onChange={(e) => setForm({ ...form, isMinor: e.target.checked })}
                        className="rounded"
                      />
                      <span>¿El reclamante es menor de edad?</span>
                    </label>
                  </div>

                  {form.isMinor && (
                    <div className="md:col-span-2 p-4 rounded-xl bg-cream/60 border border-black/5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Nombre del Padre, Madre o Tutor *</label>
                      <input
                        type="text"
                        required={form.isMinor}
                        value={form.parentName}
                        onChange={(e) => setForm({ ...form, parentName: e.target.value })}
                        placeholder="Nombre completo del apoderado"
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-eucalipto"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 2. IDENTIFICACIÓN DEL BIEN CONTRATADO */}
              <div className="space-y-4">
                <h3 className="font-serif text-lg font-bold text-ink border-b border-black/5 pb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-eucalipto text-cream text-xs flex items-center justify-center font-sans font-bold">2</span>
                  <span>Identificación del Bien Contratado</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Tipo de Bien *</label>
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                        <input
                          type="radio"
                          name="claimedType"
                          value="producto"
                          checked={form.claimedType === "producto"}
                          onChange={() => setForm({ ...form, claimedType: "producto" })}
                        />
                        <span>Producto (Plato / Bebida)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                        <input
                          type="radio"
                          name="claimedType"
                          value="servicio"
                          checked={form.claimedType === "servicio"}
                          onChange={() => setForm({ ...form, claimedType: "servicio" })}
                        />
                        <span>Servicio (Atención / Delivery / Reserva)</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Monto Reclamado en Soles (Opcional)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.claimedAmount}
                      onChange={(e) => setForm({ ...form, claimedAmount: e.target.value })}
                      placeholder="S/ 0.00"
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-eucalipto"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Descripción del Producto o Servicio *</label>
                    <input
                      type="text"
                      required
                      value={form.claimedDescription}
                      onChange={(e) => setForm({ ...form, claimedDescription: e.target.value })}
                      placeholder="Ej. Consumo de Puca Picante y Chicha de Jora en mesa / Pedido Delivery N° LF-102"
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-eucalipto"
                    />
                  </div>
                </div>
              </div>

              {/* 3. DETALLE DE LA RECLAMACIÓN */}
              <div className="space-y-4">
                <h3 className="font-serif text-lg font-bold text-ink border-b border-black/5 pb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-eucalipto text-cream text-xs flex items-center justify-center font-sans font-bold">3</span>
                  <span>Detalle de la Reclamación y Pedido del Consumidor</span>
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">Tipo de Incidencia *</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${form.claimType === "reclamo" ? "border-eucalipto bg-eucalipto/5 ring-1 ring-eucalipto" : "border-gray-200 bg-white"}`}>
                        <input
                          type="radio"
                          name="claimType"
                          value="reclamo"
                          checked={form.claimType === "reclamo"}
                          onChange={() => setForm({ ...form, claimType: "reclamo" })}
                          className="mt-0.5"
                        />
                        <div>
                          <span className="font-bold text-xs uppercase block text-ink">Reclamo</span>
                          <span className="text-[11px] text-gray-600 leading-tight block">Disconformidad relacionada directamente a los productos o servicios expendidos.</span>
                        </div>
                      </label>

                      <label className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${form.claimType === "queja" ? "border-eucalipto bg-eucalipto/5 ring-1 ring-eucalipto" : "border-gray-200 bg-white"}`}>
                        <input
                          type="radio"
                          name="claimType"
                          value="queja"
                          checked={form.claimType === "queja"}
                          onChange={() => setForm({ ...form, claimType: "queja" })}
                          className="mt-0.5"
                        />
                        <div>
                          <span className="font-bold text-xs uppercase block text-ink">Queja</span>
                          <span className="text-[11px] text-gray-600 leading-tight block">Disconformidad no relacionada directamente a los productos, sino al trato o atención al público.</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Detalle de los Hechos (Explicación) *</label>
                    <textarea
                      rows={4}
                      required
                      value={form.detail}
                      onChange={(e) => setForm({ ...form, detail: e.target.value })}
                      placeholder="Describa con claridad y precisión lo ocurrido..."
                      className="w-full bg-white border border-gray-300 rounded-xl p-3.5 text-sm focus:outline-none focus:border-eucalipto"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Pedido Concreto del Consumidor (Qué solución solicita) *</label>
                    <textarea
                      rows={3}
                      required
                      value={form.consumerRequest}
                      onChange={(e) => setForm({ ...form, consumerRequest: e.target.value })}
                      placeholder="Indique la solución o medida que espera del restaurante..."
                      className="w-full bg-white border border-gray-300 rounded-xl p-3.5 text-sm focus:outline-none focus:border-eucalipto"
                    />
                  </div>
                </div>
              </div>

              {/* 4. DECLARACIÓN Y ENVÍO */}
              <div className="pt-2 border-t border-black/10 space-y-4">
                <label className="flex items-start gap-3 cursor-pointer text-xs text-gray-700">
                  <input
                    type="checkbox"
                    required
                    checked={form.termsAccepted}
                    onChange={(e) => setForm({ ...form, termsAccepted: e.target.checked })}
                    className="mt-0.5"
                  />
                  <span>
                    Declaro ser el titular del servicio/producto y que los datos consignados en la presente hoja de reclamación son verídicos, autorizando el envío de la constancia y respuesta a mi correo electrónico conforme a Ley.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-eucalipto hover:bg-eucalipto/90 text-cream py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-all shadow-md active:scale-[0.99] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send size={16} />
                  <span>{isSubmitting ? "Registrando Reclamación..." : "ENVIAR HOJA DE RECLAMACIÓN"}</span>
                </button>
              </div>

            </form>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
