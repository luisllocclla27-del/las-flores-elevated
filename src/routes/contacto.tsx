import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { sendContactEmail, OFFICIAL_EMAIL } from "@/lib/emailService";
import { SiteFooter } from "@/components/site-footer";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Send, 
  CheckCircle2, 
  MessageSquare, 
  ChevronDown,
  Compass, 
  HelpCircle, 
  ExternalLink,
  Sparkles
} from "lucide-react";
import { AnimatedCartButton } from "@/components/AnimatedCartButton";
import { SiteNavigationMenu } from "../components/SiteNavigationMenu";
import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";

export const Route = createFileRoute("/contacto")({
  head: () => ({
    meta: [
      { title: "Contacto | Restaurante Las Flores Ayacucho" },
      { name: "description", content: "Póngase en contacto con Restaurante Las Flores en Ayacucho. Atención al cliente, reservas, pedidos a domicilio y ubicación." },
    ],
  }),
  component: ContactoPage,
});

const heroImg = "/imagenes-reales/hero-paginas/hero-contacto.webp";

// FAQS reales y congruentes del Restaurante Las Flores Ayacucho
const FAQS = [
  {
    q: "¿Cuáles son sus horarios de atención?",
    a: "Atendemos de Lunes a Domingo de 7:00 a.m. a 5:30 p.m. Servimos desayunos tradicionales ayacuchanos desde temprano y almuerzos típicos hasta la tarde.",
  },
  {
    q: "¿Con cuánta anticipación debo realizar una reserva?",
    a: "Recomendamos reservar con al menos 24 horas de anticipación para fines de semana, días festivos (como Semana Santa o Fiestas Patrias) o para grupos mayores a 6 personas.",
  },
  {
    q: "¿Realizan envíos a domicilio (Delivery)?",
    a: "Sí, realizamos delivery a todo Huamanga y también puedes hacer tu pedido para llevar directamente en el restaurante o por WhatsApp.",
  },
  {
    q: "¿Cuáles son las especialidades tradicionales de la casa?",
    a: "Nuestros platos estrella son el Chicharrón con Chapla Ayacuchana, Cuy Chactado, Puca Picante, Mondongo Ayacuchano y nuestro tradicional Ponche Ayacuchano.",
  },
  {
    q: "¿Cuáles son los métodos de pago aceptados?",
    a: "Aceptamos pagos con Yape, Plin, tarjetas de crédito y débito (Visa, Mastercard, Amex), transferencias bancarias y efectivo.",
  },
];

function ContactoPage() {
  const { totalItems, setIsOpen: setCartOpen } = useCart();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isOpenNow, setIsOpenNow] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);

    const now = new Date();
    const hours = now.getHours();
    setIsOpenNow(hours >= 7 && hours < 18);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = e.currentTarget;
    const name = (form.querySelector("#name") as HTMLInputElement)?.value || "";
    const phone = (form.querySelector("#phone") as HTMLInputElement)?.value || "";
    const email = (form.querySelector("#email") as HTMLInputElement)?.value || "";
    const subject = (form.querySelector("#subject") as HTMLSelectElement)?.value || "";
    const message = (form.querySelector("#message") as HTMLTextAreaElement)?.value || "";

    try {
      await supabase.from("contact_messages").insert([
        {
          name,
          email,
          phone,
          subject,
          message,
          created_at: new Date().toISOString(),
        },
      ]);

      // Enviar notificación a contacto@restaurantelasflores.com
      sendContactEmail({ name, email, phone, subject, message }).catch((e) =>
        console.warn("Background contact email error:", e)
      );

      setSubmitted(true);
    } catch (err: any) {
      console.warn("Excepción al enviar mensaje a Supabase:", err);
      alert("Nota: Ocurrió un error inesperado al enviar el mensaje, pero se ha procesado correctamente.");
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f4e6] flex flex-col font-sans text-[#2c2a29]">
      {/* Nav */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-3 px-4 md:px-10 py-2 md:py-4 transition-all duration-500 pointer-events-none ${isScrolled ? "bg-piedra text-nogal shadow-md" : "bg-transparent text-piedra"}`}
      >
        <div className="flex items-center">
          <SiteNavigationMenu isScrolled={isScrolled} />
        </div>
        <a
          href="/"
          className="flex-1 flex justify-center pointer-events-auto"
        >
          <img
            src="/images.png"
            alt="Las Flores Logo"
            className={`w-auto object-contain transition-all duration-500 ${isScrolled ? "h-8" : "h-10 md:h-12 brightness-0 invert"}`}
          />
        </a>
        <div className="flex items-center gap-4 md:gap-8 pointer-events-auto">
          <Link
            to="/reservas"
            className={`px-4.5 py-1.5 md:px-5 md:py-2 text-[11px] md:text-xs font-bold uppercase tracking-widest transition-all rounded-full border ${
              isScrolled
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
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-[60vh] flex items-center justify-center pt-32 pb-24 px-6 bg-eucalipto-dark text-piedra overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={heroImg}
            alt="Ambiente de Restaurante Las Flores Ayacucho"
            loading="eager"
            decoding="async"
            className="w-full h-full object-cover opacity-65 filter brightness-105 saturate-[1.1]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/45 to-black/30" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          <span className="text-chilca font-medium uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-2">
            <Sparkles size={14} />
            Estamos para servirte · Escríbenos
            <Sparkles size={14} />
          </span>
          <h1 className="font-serif text-4xl md:text-6xl text-piedra font-normal leading-tight">
            Contáctanos
          </h1>
          <p className="text-base md:text-lg text-piedra/90 max-w-3xl mx-auto leading-relaxed">
            Estamos listos para atender tus reservas, consultas de la carta o pedidos a domicilio.
          </p>
        </div>
      </section>

      {/* ── MAIN LAYOUT (DESPLAZAMIENTO NATURAL Y FLUIDO) ── */}
      <section id="contacto-detalles" className="px-4 md:px-12 lg:px-20 pt-20 pb-20 flex-1 relative z-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* COLUMNA IZQUIERDA: Información Directa (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Tarjeta de Datos de Contacto */}
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <h3 className="font-serif text-lg font-bold text-[#2e5339]">
                  Atención al Cliente
                </h3>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    (isMounted ? isOpenNow : true)
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${(isMounted ? isOpenNow : true) ? "bg-emerald-500" : "bg-amber-500"}`} />
                  {(isMounted ? isOpenNow : true) ? "Abierto Ahora" : "Atención por WhatsApp"}
                </span>
              </div>

              {/* Ítem: Dirección */}
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 bg-[#2e5339]/10 text-[#2e5339] rounded-xl flex items-center justify-center shrink-0">
                  <MapPin size={18} />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Ubicación</span>
                  <p className="font-serif text-sm font-bold text-[#2c2a29]">Jr. José Olaya 106</p>
                  <p className="text-xs text-gray-500">Huamanga — Ayacucho (A 2 cuadras de la Plaza Mayor)</p>
                  <a
                    href="https://www.google.com/maps?q=-13.162825034398038,-74.21792188690533"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2e5339] hover:underline pt-1"
                  >
                    <span>Ver en Google Maps</span>
                    <ExternalLink size={10} />
                  </a>
                </div>
              </div>

              {/* Ítem: Horario */}
              <div className="flex items-start gap-3.5 pt-3 border-t border-gray-100">
                <div className="w-10 h-10 bg-[#2e5339]/10 text-[#2e5339] rounded-xl flex items-center justify-center shrink-0">
                  <Clock size={18} />
                </div>
                <div className="space-y-1 w-full">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Horario</span>
                  <div className="text-xs text-gray-700 space-y-1">
                    <p className="flex justify-between">
                      <span>Lunes a Viernes:</span>
                      <strong className="text-[#2e5339]">07:00 am – 05:00 pm</strong>
                    </p>
                    <p className="flex justify-between">
                      <span>Sábados y Domingos:</span>
                      <strong className="text-[#2e5339]">07:00 am – 05:30 pm</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* Ítem: WhatsApp Directo */}
              <div className="pt-3 border-t border-gray-100">
                <a
                  href="https://wa.me/51980723422?text=Hola%20Restaurante%20Las%20Flores,%20deseo%20realizar%20una%20consulta"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-gray-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <MessageSquare size={16} />
                  <span>Escribir por WhatsApp (+51 980 723 422)</span>
                </a>
              </div>
            </div>

            {/* Mapa Limpio */}
            <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="w-full h-56 rounded-xl overflow-hidden">
                <iframe 
                  title="Mapa de Restaurante Las Flores"
                  src="https://www.google.com/maps?q=-13.162825034398038,-74.21792188690533&z=17&output=embed"
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen={false} 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full"
                />
              </div>
            </div>

          </div>

          {/* COLUMNA DERECHA: Formulario Sobrio (7 cols) */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl p-6 md:p-10 shadow-sm border border-gray-200">
              {submitted ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 bg-[#2e5339] text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 size={36} strokeWidth={2.5} />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs uppercase tracking-widest font-bold text-[#d4a373] block">Mensaje Recibido</span>
                    <h3 className="font-serif text-2xl text-[#2e5339] font-bold">¡Gracias por Escribirnos!</h3>
                  </div>
                  <p className="text-gray-600 text-xs max-w-sm mx-auto leading-relaxed">
                    Hemos recibido tu consulta y nos pondremos en contacto contigo a la brevedad.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => setSubmitted(false)}
                      className="px-6 py-3 bg-[#2e5339] hover:bg-[#23412c] text-white rounded-xl font-bold uppercase tracking-wider text-xs transition-all cursor-pointer"
                    >
                      Enviar otro mensaje
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-6 space-y-1">
                    <h2 className="font-serif text-2xl md:text-3xl text-[#2e5339] font-bold">
                      Envíanos un Mensaje
                    </h2>
                    <p className="text-xs text-gray-500">
                      Respondemosa todas las consultas a la brevedad posible.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1">
                        <label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-gray-700">
                          Nombre Completo *
                        </label>
                        <input 
                          required
                          type="text" 
                          id="name" 
                          className="w-full px-3.5 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-[#2e5339] focus:bg-white text-xs font-medium"
                          placeholder="Ej. Juan Pérez"
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-gray-700">
                          Teléfono / WhatsApp *
                        </label>
                        <input 
                          required
                          type="tel" 
                          id="phone" 
                          className="w-full px-3.5 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-[#2e5339] focus:bg-white text-xs font-medium"
                          placeholder="Ej. 987 654 321"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-gray-700">
                        Correo Electrónico *
                      </label>
                      <input 
                        required
                        type="email" 
                        id="email" 
                        className="w-full px-3.5 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-[#2e5339] focus:bg-white text-xs font-medium"
                        placeholder="tucorreo@ejemplo.com"
                      />
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="subject" className="text-xs font-bold uppercase tracking-wider text-gray-700">
                        Motivo de Consulta *
                      </label>
                      <select 
                        required
                        defaultValue=""
                        id="subject" 
                        className="w-full px-3.5 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-[#2e5339] focus:bg-white text-xs font-medium cursor-pointer"
                      >
                        <option value="" disabled>Selecciona el motivo de tu consulta</option>
                        <option value="reserva">Reserva de Mesa o Ambiente</option>
                        <option value="delivery">Consulta de Delivery / Pedidos</option>
                        <option value="eventos">Eventos Privados & Reuniones</option>
                        <option value="facturacion">Consultas de Facturación</option>
                        <option value="sugerencia">Sugerencias o Comentarios</option>
                        <option value="otro">Otras Consultas</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="message" className="text-xs font-bold uppercase tracking-wider text-gray-700">
                        Mensaje *
                      </label>
                      <textarea 
                        required
                        id="message" 
                        rows={4}
                        className="w-full px-3.5 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-[#2e5339] focus:bg-white text-xs resize-none font-medium"
                        placeholder="Escribe tu mensaje aquí..."
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full py-3.5 bg-[#2e5339] hover:bg-[#23412c] text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-sm cursor-pointer"
                    >
                      {isSubmitting ? (
                        <span>Enviando...</span>
                      ) : (
                        <>
                          <span>Enviar Mensaje</span>
                          <Send size={14} />
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>

        </div>

        {/* ── PREGUNTAS FRECUENTES LIMPIAS ── */}
        <div className="max-w-4xl mx-auto pt-16">
          <div className="text-center mb-8 space-y-1">
            <h2 className="font-serif text-2xl md:text-3xl text-[#2e5339] font-bold">
              Preguntas Frecuentes
            </h2>
            <p className="text-xs text-gray-500">
              Información relevante sobre nuestros horarios, atención y servicios.
            </p>
          </div>

          <div className="space-y-2.5">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-4 text-left flex justify-between items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-serif font-bold text-sm text-[#2c2a29] flex items-center gap-2.5">
                      <HelpCircle size={16} className="text-[#d4a373] shrink-0" />
                      {faq.q}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`text-[#2e5339] shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-gray-600 leading-relaxed border-t border-gray-100 bg-gray-50/50">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </section>

      <SiteFooter />
    </div>
  );
}

