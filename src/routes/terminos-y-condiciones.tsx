import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SiteNavigationMenu } from "@/components/SiteNavigationMenu";
import { SiteFooter } from "@/components/site-footer";
import { FileText, Scale, Clock, ShieldAlert, CheckCircle } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { AnimatedCartButton } from "@/components/AnimatedCartButton";

export const Route = createFileRoute("/terminos-y-condiciones")({
  head: () => ({
    meta: [
      { title: "Términos y Condiciones | Restaurante Las Flores Ayacucho" },
      {
        name: "description",
        content:
          "Términos y Condiciones de contratación de servicios gastronómicos, reservas de mesa y compras delivery en Restaurante Turístico Las Flores de Ayacucho.",
      },
    ],
  }),
  component: TerminosCondicionesPage,
});

function TerminosCondicionesPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { totalItems, setIsOpen: setCartOpen } = useCart();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
              <AnimatedCartButton
                onClick={() => setCartOpen(true)}
                className="p-2 rounded-full bg-eucalipto text-cream hover:bg-eucalipto/90 transition-all"
                size={20}
                color="#8B7355"
              />
            )}
          </div>
        </div>
      </header>

      {/* ── HERO BANNER ── */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-24 px-6 md:px-12 lg:px-20 bg-eucalipto text-cream overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-[#d4a373]/40 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.25em] text-[#d4a373]">
            <Scale size={16} />
            <span>Condiciones de Servicio</span>
          </div>
          <h1 className="font-serif text-4xl md:text-6xl font-normal leading-tight">
            Términos y Condiciones
          </h1>
          <p className="text-sm md:text-base text-cream/80 max-w-2xl mx-auto font-light leading-relaxed">
            Reglas, políticas operativas y compromisos de calidad aplicables a nuestros comensales, reservas y compras en línea.
          </p>
        </div>
      </section>

      {/* ── CONTENIDO PRINCIPAL EDITORIAL ── */}
      <main className="doc-legible py-16 md:py-24 px-6 md:px-12 lg:px-20 max-w-4xl mx-auto w-full flex-1">
        <div className="bg-white rounded-3xl p-8 md:p-12 border border-black/10 shadow-lg space-y-10 text-sm md:text-base text-nogal/85 leading-relaxed">
          
          {/* Introducción */}
          <div className="border-b border-black/10 pb-6 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-widest text-eucalipto block">
              Vigencia General — Restaurante Turístico Las Flores
            </span>
            <p className="text-base font-serif italic text-ink">
              El presente documento establece las condiciones generales que regulan el acceso, reservas presenciales y compras de servicios gastronómicos en el establecimiento físico y portal web oficial de <strong>Restaurante Turístico Las Flores</strong> en la ciudad de Ayacucho.
            </p>
          </div>

          {/* 1. Política de Reservas y Tolerancia */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl md:text-2xl font-bold text-ink flex items-center gap-2">
              <span className="text-eucalipto">1.</span>
              <span>Reservas de Mesa y Política de Puntualidad</span>
            </h2>
            <ul className="space-y-2 pl-4">
              <li className="flex items-start gap-2">
                <span className="text-eucalipto font-bold">•</span>
                <span><strong>Tolerancia de Llegada:</strong> Toda reserva confirmada cuenta con una tolerancia máxima de cortesía de <strong>15 minutos</strong> a partir del horario pactado. Transcurrido dicho tiempo sin comunicación previa del cliente, la mesa será liberada para asignación general.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-eucalipto font-bold">•</span>
                <span><strong>Aviso de Retrasos:</strong> Si el comensal prevé un retraso en su llegada, debe notificarlo oportunamente al canal oficial de WhatsApp (<strong>+51 980 723 422</strong>) para retener la asignación.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-eucalipto font-bold">•</span>
                <span><strong>Distribución de Salones:</strong> La asignación de ambientes (Salón Principal, Entrada, Ventana, Estrado, Pasillo, Terraza o Jardín) se sujeta a disponibilidad de aforo según orden de confirmación.</span>
              </li>
            </ul>
          </section>

          {/* 2. Servicio de Delivery y Pedidos */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl md:text-2xl font-bold text-ink flex items-center gap-2">
              <span className="text-eucalipto">2.</span>
              <span>Pedidos Delivery y Modalidad Recojo</span>
            </h2>
            <ul className="space-y-2 pl-4">
              <li className="flex items-start gap-2">
                <span className="text-eucalipto font-bold">•</span>
                <span><strong>Zona de Cobertura:</strong> El servicio de delivery atiende el ámbito metropolitano de Huamanga. La tarifa de envío se calcula de forma transparente según la distancia en kilómetros al local.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-eucalipto font-bold">•</span>
                <span><strong>Tiempo de Entrega:</strong> Los tiempos aproximados de despacho (30 a 50 minutos) pueden variar ante alta demanda en cocina, condiciones climatológicas o cortes de tránsito en fechas festivas.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-eucalipto font-bold">•</span>
                <span><strong>Verificación de Pedido:</strong> El cliente debe verificar que el empaque cuente con su precinto de seguridad sellado y reportar cualquier anomalía de inmediato con el repartidor o al canal de soporte.</span>
              </li>
            </ul>
          </section>

          {/* 3. Precios y Formas de Pago */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl md:text-2xl font-bold text-ink flex items-center gap-2">
              <span className="text-eucalipto">3.</span>
              <span>Precios, Moneda y Medios de Pago</span>
            </h2>
            <p>
              Todos los precios consignados en nuestra carta física y plataforma digital están expresados en <strong>Soles peruanos (S/)</strong> e incluyen el Impuesto General a las Ventas (IGV).
            </p>
            <p>
              Aceptamos pagos a través de la pasarela segura Culqi (tarjetas de crédito y débito Visa, Mastercard, Amex, Diners), billeteras digitales (Yape / Plin) y efectivo contra entrega en moneda nacional.
            </p>
          </section>

          {/* 4. Cancelaciones y Devoluciones */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl md:text-2xl font-bold text-ink flex items-center gap-2">
              <span className="text-eucalipto">4.</span>
              <span>Cancelaciones y Reprogramaciones</span>
            </h2>
            <p>
              Las reservas de mesa pueden ser canceladas o reprogramadas sin costo alguno con un mínimo de <strong>2 horas de anticipación</strong>. Para pedidos delivery ya en proceso de cocina o en ruta con el repartidor, no procede la anulación de la comanda por tratarse de alimentos preparados de consumo perecible inmediato.
            </p>
          </section>

          {/* 5. Libro de Reclamaciones */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl md:text-2xl font-bold text-ink flex items-center gap-2">
              <span className="text-eucalipto">5.</span>
              <span>Libro de Reclamaciones y Atención al Consumidor</span>
            </h2>
            <p>
              Conforme a lo dispuesto por el <strong>Código de Protección y Defensa del Consumidor (Ley N° 29571)</strong>, Las Flores pone a disposición de todos sus clientes su <strong>Libro de Reclamaciones Virtual</strong> a través de nuestra web oficial, así como el formato físico en el establecimiento.
            </p>
            <p>
              Todo reclamo o queja será atendido de manera obligatoria dentro del plazo legal máximo de <strong>15 días hábiles</strong>.
            </p>
          </section>

          {/* 6. Jurisdicción y Legislación */}
          <section className="space-y-3 border-t border-black/10 pt-6">
            <h2 className="font-serif text-xl md:text-2xl font-bold text-ink flex items-center gap-2">
              <span className="text-eucalipto">6.</span>
              <span>Legislación Aplicable y Jurisdicción</span>
            </h2>
            <p>
              Los presentes términos se rigen íntegramente por las leyes de la República del Perú. Ante cualquier controversia derivada del servicio, las partes se someten a la competencia de los jueces y tribunales de la provincia de Huamanga, departamento de Ayacucho.
            </p>
          </section>

        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
