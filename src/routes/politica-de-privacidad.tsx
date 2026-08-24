import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/site-footer";
import { ShieldCheck, Lock, Eye, FileText, CheckCircle2, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/politica-de-privacidad")({
  head: () => ({
    meta: [
      { title: "Política de Privacidad | Restaurante Las Flores Ayacucho" },
      {
        name: "description",
        content:
          "Conoce nuestra Política de Privacidad y Tratamiento de Datos Personales en Restaurante Las Flores conforme a la Ley N° 29733 de la República del Perú.",
      },
    ],
    links: [{ rel: "canonical", href: "https://www.restaurantelasflores.com/politica-de-privacidad" }],
  }),
  component: PoliticaPrivacidadPage,
});

function PoliticaPrivacidadPage() {
  return (
    <div className="min-h-screen bg-piedra flex flex-col font-sans text-nogal selection:bg-chilca/20">
      {/* ── HEADER UNIFICADO ── */}
      <SiteHeader />

      {/* ── HERO BANNER ── */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-24 px-6 md:px-12 lg:px-20 bg-eucalipto text-cream overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-[#d4a373]/40 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.25em] text-[#d4a373]">
            <ShieldCheck size={16} />
            <span>Marco Legal & Confidencialidad</span>
          </div>
          <h1 className="font-serif text-4xl md:text-6xl font-normal leading-tight">
            Política de Privacidad
          </h1>
          <p className="text-sm md:text-base text-cream/80 max-w-2xl mx-auto font-light leading-relaxed">
            Compromiso de protección y tratamiento responsable de los datos personales de nuestros comensales y visitantes, conforme a la Ley N° 29733 de la República del Perú.
          </p>
        </div>
      </section>

      {/* ── CONTENIDO PRINCIPAL EDITORIAL ── */}
      <main className="doc-legible py-16 md:py-24 px-6 md:px-12 lg:px-20 max-w-4xl mx-auto w-full flex-1">
        <div className="bg-white rounded-3xl p-8 md:p-12 border border-black/10 shadow-lg space-y-10 text-sm md:text-base text-nogal/85 leading-relaxed">
          
          {/* Introducción */}
          <div className="border-b border-black/10 pb-6 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-widest text-eucalipto block">
              Última actualización: Agosto de 2026
            </span>
            <p className="text-base font-serif italic text-ink">
              En <strong>Restaurante Turístico Las Flores</strong> (en adelante, "Las Flores"), valoramos profundamente la confianza de nuestros clientes. Esta política detalla de qué manera recopilamos, utilizamos, almacenamos y protegemos su información personal a través de nuestra plataforma web y servicios presenciales en Huamanga, Ayacucho.
            </p>
          </div>

          {/* 1. Marco Normativo */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl md:text-2xl font-bold text-ink flex items-center gap-2">
              <span className="text-eucalipto">1.</span>
              <span>Marco Legal y Normativa Aplicable</span>
            </h2>
            <p>
              El tratamiento de datos personales realizado por Las Flores se rige de forma estricta por la <strong>Ley N° 29733 — Ley de Protección de Datos Personales</strong>, su Reglamento aprobado mediante Decreto Supremo N° 003-2013-JUS, y las directivas emitidas por la Autoridad Nacional de Protección de Datos Personales (APDP) del Ministerio de Justicia y Derechos Humanos del Perú.
            </p>
          </section>

          {/* 2. Información que recopilamos */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl md:text-2xl font-bold text-ink flex items-center gap-2">
              <span className="text-eucalipto">2.</span>
              <span>Datos Personales Recopilados</span>
            </h2>
            <p>Para brindarle un servicio gastronómico seguro y personalizado, recopilamos la siguiente información:</p>
            <ul className="space-y-2 pl-4">
              <li className="flex items-start gap-2">
                <span className="text-eucalipto font-bold">•</span>
                <span><strong>Para Reservas de Mesa:</strong> Nombres, apellidos, teléfono de contacto, correo electrónico, fecha y hora de la visita, zona seleccionada, notas sobre intolerancias alimentarias o requerimientos de accesibilidad.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-eucalipto font-bold">•</span>
                <span><strong>Para Pedidos Delivery y Compras en Línea:</strong> Nombres, apellidos, número telefónico, dirección exacta de entrega, referencias geográficas y detalles del pedido.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-eucalipto font-bold">•</span>
                <span><strong>Para Postulaciones Laborales (Únete al Equipo):</strong> Datos de identificación, currículum vitae (CV), historial laboral, teléfono, ciudad y disponibilidad.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-eucalipto font-bold">•</span>
                <span><strong>Para el Libro de Reclamaciones:</strong> Datos de identificación según formato estipulado por el Código de Protección y Defensa del Consumidor (Ley N° 29571).</span>
              </li>
            </ul>
          </section>

          {/* 3. Finalidad del Tratamiento */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl md:text-2xl font-bold text-ink flex items-center gap-2">
              <span className="text-eucalipto">3.</span>
              <span>Finalidad del Tratamiento de Datos</span>
            </h2>
            <p>Sus datos personales son tratados con las siguientes finalidades legítimas:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-cream/50 border border-black/5 space-y-1">
                <span className="font-bold text-eucalipto block">Gestión Operativa</span>
                <p className="text-sm text-nogal/75">Confirmación de reservas, despacho de delivery, rastreo en vivo y emisión de comprobantes de pago.</p>
              </div>
              <div className="p-4 rounded-2xl bg-cream/50 border border-black/5 space-y-1">
                <span className="font-bold text-eucalipto block">Seguridad del Comensal</span>
                <p className="text-sm text-nogal/75">Adaptación de insumos ante alergias alimentarias o preparación de accesos para movilidad reducida.</p>
              </div>
              <div className="p-4 rounded-2xl bg-cream/50 border border-black/5 space-y-1">
                <span className="font-bold text-eucalipto block">Atención al Cliente</span>
                <p className="text-sm text-nogal/75">Respuesta a consultas, solicitudes, coordinación por WhatsApp y atención de reclamos.</p>
              </div>
              <div className="p-4 rounded-2xl bg-cream/50 border border-black/5 space-y-1">
                <span className="font-bold text-eucalipto block">Comunicaciones Oficiales</span>
                <p className="text-sm text-nogal/75">Envío de novedades sobre eventos y festividades solo si el usuario ha brindado su consentimiento previo.</p>
              </div>
            </div>
          </section>

          {/* 4. Seguridad y No Transferencia a Terceros */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl md:text-2xl font-bold text-ink flex items-center gap-2">
              <span className="text-eucalipto">4.</span>
              <span>Confidencialidad y Seguridad de la Información</span>
            </h2>
            <p>
              Las Flores aplica rigurosos estándares técnicos, organizativos y de cifrado para salvaguardar sus datos contra accesos no autorizados, pérdida o alteración.
            </p>
            <div className="p-4 rounded-2xl bg-green-50/80 border border-green-200 text-green-900 font-medium">
              ✓ <strong>Garantía de Confidencialidad:</strong> Sus datos personales no serán vendidos, transferidos ni comercializados a terceras empresas bajo ningún concepto.
            </div>
          </section>

          {/* 5. Derechos ARCO */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl md:text-2xl font-bold text-ink flex items-center gap-2">
              <span className="text-eucalipto">5.</span>
              <span>Ejercicio de Derechos ARCO</span>
            </h2>
            <p>
              Usted tiene derecho a ejercer en cualquier momento sus derechos de <strong>Acceso, Rectificación, Cancelación y Oposición (ARCO)</strong> respecto a su información personal.
            </p>
            <p>
              Para solicitarlo, solo debe enviar una comunicación formal a nuestro correo electrónico oficial:{" "}
              <a href="mailto:contacto@restaurantelasflores.com" className="text-eucalipto font-bold underline">
                contacto@restaurantelasflores.com
              </a>{" "}
              adjuntando copia de su documento de identidad y detallando el requerimiento.
            </p>
          </section>

          {/* 6. Contacto y Domicilio Legal */}
          <section className="space-y-3 border-t border-black/10 pt-6">
            <h2 className="font-serif text-xl md:text-2xl font-bold text-ink flex items-center gap-2">
              <span className="text-eucalipto">6.</span>
              <span>Domicilio Legal y Canales de Atención</span>
            </h2>
            <p>
              <strong>Restaurante Turístico Las Flores</strong><br />
              Dirección: Jr. Lima 304, Centro Histórico de Huamanga, Ayacucho, Perú.<br />
              Correo Electrónico: contacto@restaurantelasflores.com<br />
              Teléfono: 967 456 230 / WhatsApp: +51 980 723 422
            </p>
          </section>

        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
