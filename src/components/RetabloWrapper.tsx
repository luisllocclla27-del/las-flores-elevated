import React, { ReactNode, useEffect, useRef, useState } from "react";

/* ─────────────────────────────────────────────────────────────────
   EXPORTS
───────────────────────────────────────────────────────────────── */

/** Pequeña flor para usar como separador ornamental inline */
export const AyacuchoFlowerInline = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
      <g key={i} transform={`rotate(${angle} 12 12)`}>
        <path d="M12 3 C9 7, 8 10, 12 12 C16 10, 15 7, 12 3 Z" fill={i % 2 === 0 ? "#8B2500" : "#C0392B"} />
      </g>
    ))}
    <circle cx="12" cy="12" r="3" fill="#F39C12" />
    <circle cx="12" cy="12" r="1.5" fill="#E67E22" />
  </svg>
);

/* ─────────────────────────────────────────────────────────────────
   FLORA AYACUCHANA — 8 pétalos con hojas lanceoladas y estambres
───────────────────────────────────────────────────────────────── */
const AyacuchoFlower = ({
  className = "",
  primary = "#C0392B",
  secondary = "#E74C3C",
  leaf = "#27AE60",
  accent = "#F39C12",
  outline = "#5D2E0C",
}: {
  className?: string;
  primary?: string;
  secondary?: string;
  leaf?: string;
  accent?: string;
  outline?: string;
}) => (
  <svg viewBox="0 0 120 120" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    {/* Hojas diagonales */}
    {[45, 135, 225, 315].map((angle, i) => (
      <g key={i} transform={`rotate(${angle} 60 60)`}>
        <ellipse cx="60" cy="22" rx="6" ry="18" fill={leaf} stroke={outline} strokeWidth="0.8" />
        <line x1="60" y1="10" x2="60" y2="40" stroke={outline} strokeWidth="0.6" strokeDasharray="2,2" />
      </g>
    ))}
    {/* 8 pétalos */}
    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
      <g key={i} transform={`rotate(${angle} 60 60)`}>
        <path d="M60 12 C52 28, 48 42, 60 50 C72 42, 68 28, 60 12 Z"
          fill={i % 2 === 0 ? primary : secondary} stroke={outline} strokeWidth="0.8" />
        <line x1="60" y1="16" x2="60" y2="44" stroke={outline} strokeWidth="0.5" opacity="0.5" />
      </g>
    ))}
    {/* Centro */}
    <circle cx="60" cy="60" r="16" fill={accent} stroke={outline} strokeWidth="1.5" />
    <circle cx="60" cy="60" r="10" fill="#F1C40F" stroke={outline} strokeWidth="1" />
    <circle cx="60" cy="60" r="5" fill="#E67E22" />
    {/* Estambres */}
    {[0, 60, 120, 180, 240, 300].map((a, i) => {
      const rad = (a * Math.PI) / 180;
      return <circle key={i} cx={60 + 12 * Math.cos(rad)} cy={60 + 12 * Math.sin(rad)} r="1.8" fill={outline} />;
    })}
  </svg>
);

/** Enredadera de relleno para las puertas */
const VinePattern = () => (
  <svg className="w-full h-full opacity-25" viewBox="0 0 80 200" preserveAspectRatio="xMidYMid slice"
    xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M40 0 Q 55 20 40 40 Q 25 60 40 80 Q 55 100 40 120 Q 25 140 40 160 Q 55 180 40 200"
      stroke="#27AE60" strokeWidth="2" fill="none" />
    {[20, 60, 100, 140, 180].map((y, i) => (
      <ellipse key={i} cx={i % 2 === 0 ? 55 : 25} cy={y} rx="8" ry="4"
        fill="#2ECC71" stroke="#27AE60" strokeWidth="0.5"
        transform={`rotate(${i % 2 === 0 ? 30 : -30} ${i % 2 === 0 ? 55 : 25} ${y})`} />
    ))}
  </svg>
);

/* ─────────────────────────────────────────────────────────────────
   RETABLO WRAPPER — 3D Retablo con dimensiones restringidas por vw/vh
───────────────────────────────────────────────────────────────── */
const RetabloWrapper = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  // Una vez abierto, nunca se vuelve a cerrar en esta sesión de página
  const hasOpenedRef = useRef(false);

  /* Scroll Trigger: se dispara una sola vez al entrar al viewport por primera vez */
  useEffect(() => {
    let openTimer: ReturnType<typeof setTimeout>;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasOpenedRef.current) {
          /* 0.4s de retardo para apreciar la caja de madera cerrada antes de abrirse */
          openTimer = setTimeout(() => {
            setIsOpen(true);
            hasOpenedRef.current = true;
            // Ya no necesitamos seguir observando
            observer.disconnect();
          }, 400);
        }
      },
      { threshold: 0.65 }
    );
    if (wrapperRef.current) observer.observe(wrapperRef.current);
    return () => {
      observer.disconnect();
      clearTimeout(openTimer);
    };
  }, []);

  const doorAngle = isOpen ? 165 : 0;

  return (
    <div
      ref={wrapperRef}
      /*
       * La Fórmula Dorada (Desktop lg: >= 1024px):
       * - Contenedor Central: w-[44vw] max-w-[900px]
       * - Puertas (50% cada una): 22vw (max 450px cada una)
       * - Retablo Abierto: 22vw + 44vw + 22vw = 88vw TOTAL (12vw de margen libre sin scrollbar)
       */
      className="relative mx-auto mt-8 lg:mt-12 mb-12 w-[90vw] max-w-xl lg:w-[44vw] lg:max-w-[900px] flex flex-col justify-center"
      style={{
        perspective: "1400px",
        perspectiveOrigin: "50% 40%",
      }}
    >
      {/* ── CSS embebido ── */}
      <style>{`
        /* Textura de madera oscura */
        .retablo-frame {
          background-color: #3b1f10;
          background-image:
            repeating-linear-gradient(
              88deg,
              transparent 0px, transparent 3px,
              rgba(255,220,180,0.035) 3px, rgba(255,220,180,0.035) 4px
            ),
            repeating-linear-gradient(
              0deg,
              transparent 0px, transparent 7px,
              rgba(0,0,0,0.07) 7px, rgba(0,0,0,0.07) 8px
            );
        }

        /* Fondo interior pergamino con grano y sombra hundida 3D (Inset Shadow) */
        .retablo-interior {
          background-color: #fdf8f0;
          background-image:
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          box-shadow:
            inset 0px 18px 30px rgba(45,27,21,0.35),
            inset 0px -12px 20px rgba(45,27,21,0.2),
            inset 15px 0px 25px rgba(45,27,21,0.18),
            inset -15px 0px 25px rgba(45,27,21,0.18);
        }

        .retablo-house-frame {
          clip-path: polygon(
            50% 0%,
            100% 4rem,
            100% 100%,
            0%   100%,
            0%   4rem
          );
          filter:
            drop-shadow(0 12px 28px rgba(35,18,10,0.65))
            drop-shadow(0 4px 10px rgba(0,0,0,0.4));
        }
        @media (min-width: 1024px) {
          .retablo-house-frame {
            clip-path: polygon(
              50% 0%,
              100% 6rem,
              100% 100%,
              0%   100%,
              0%   6rem
            );
          }
        }

        /* Transición 3D de puertas (sin CSS filter para evitar flatten de contexto 3D) */
        .door-left {
          transform-origin: left center;
          transform-style: preserve-3d;
          transition: transform 2.5s cubic-bezier(0.25, 1, 0.5, 1) 0.2s;
        }
        .door-right {
          transform-origin: right center;
          transform-style: preserve-3d;
          transition: transform 2.5s cubic-bezier(0.25, 1, 0.5, 1) 0.2s;
        }

        /* Caras 3D aisladas con separación física translateZ (evita Z-fighting y bleed-through) */
        .door-face {
          transform: rotateY(0deg) translateZ(1px);
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          position: absolute;
          inset: 0;
          z-index: 10;
          background-color: #3b1f10;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
        }
        .door-inner {
          transform: rotateY(180deg) translateZ(-1px);
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          position: absolute;
          inset: 0;
          z-index: 5;
          background-color: #ffffff;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
        }
      `}</style>

      {/* CAPA 1: Marco unificado de madera (house shape) — z-0 */}
      <div
        className="retablo-frame retablo-house-frame absolute inset-0 z-0"
        aria-hidden="true"
        style={{ pointerEvents: "none" }}
      />

      {/* CAPA 2: Frontón / Copete triangular con Marco de Madera caoba alineado a ras — z-50 */}
      <div
        className="absolute top-0 left-0 right-0 z-50 h-16 lg:h-24 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        <svg
          className="w-full h-full block"
          viewBox="0 0 1000 240"
          preserveAspectRatio="none"
        >
          <defs>
            {/* ClipPath para la ilustración floral recortada exactamente dentro del marco */}
            <clipPath id="copeteFlowerClip">
              <polygon points="500,38 946,224 54,224" />
            </clipPath>
          </defs>

          {/* 1. Base triangular de madera caoba (#3b1f10) alineada 100% a ras (x: 0 a 1000) sin aleros */}
          <polygon
            points="500,0 1000,240 0,240"
            fill="#3b1f10"
          />

          {/* 2. Fondo pergamino blanco interior para la ilustración floral */}
          <polygon
            points="500,36 948,226 52,226"
            fill="#ffffff"
          />

          {/* 3. Ilustración floral interior recortada por el clipPath */}
          <image
            href="/retablo-copete.png"
            x="0"
            y="0"
            width="1000"
            height="240"
            preserveAspectRatio="none"
            clipPath="url(#copeteFlowerClip)"
          />

          {/* 4. Bisel interior de separación de madera (#3b1f10) */}
          <polygon
            points="500,36 948,226 52,226"
            fill="none"
            stroke="#3b1f10"
            strokeWidth="3"
            strokeLinejoin="miter"
          />

          {/* 5. Filete en Pan de Oro interior (#d4a373) que enmarca artesanalmente las flores */}
          <polygon
            points="500,36 948,226 52,226"
            fill="none"
            stroke="#d4a373"
            strokeWidth="2.5"
            strokeOpacity="0.75"
            strokeLinejoin="miter"
          />
        </svg>
      </div>

      {/* CAPA 3: Contenido rectangular — z-10 (overflow-visible para despliegue 3D) */}
      <div className="relative z-10 pt-16 lg:pt-24 flex-1 flex flex-col justify-center overflow-visible" style={{ transformStyle: "preserve-3d" }}>
        <div className="relative h-full flex flex-col overflow-visible" style={{ transformStyle: "preserve-3d" }}>

          {/* Interior crema con Marco Oscuro de 10-12px y Sombra Inset 3D */}
          <div className="retablo-interior mx-[10px] lg:mx-[14px] mb-[10px] lg:mb-[14px] border-[8px] lg:border-[12px] border-[#3b1f10] rounded-xs flex-1 flex flex-col justify-center overflow-hidden">
            {children}
          </div>

          {/* ── PUERTA IZQUIERDA (50% ancho central) ── */}
          <div
            className="door-left hidden lg:block absolute top-0 bottom-0 left-0 w-[50%] z-20 pointer-events-none"
            style={{
              transform: `rotateY(-${doorAngle}deg)`,
              transformStyle: "preserve-3d",
            }}
          >
            {/* Cara Exterior (CERRADO - rotateY 0deg + translateZ 1px): Madera caoba artesanal con Logo oficial en Pan de Oro */}
            <div
              className="door-face retablo-frame border-[10px] lg:border-[12px] border-[#3b1f10] overflow-hidden"
              style={{
                transform: "rotateY(0deg) translateZ(1px)",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                backgroundColor: "#3b1f10",
                zIndex: 10,
                boxShadow: "inset 0 0 30px rgba(0,0,0,0.85)",
              }}
            >
              {/* Madera caoba con doble filete dorado y Sello del Logo Oficial */}
              <div className="relative w-full h-full retablo-frame flex items-center justify-center p-3">
                <div className="w-full h-full border-2 border-[#d4a373]/40 flex flex-col items-center justify-center p-4 bg-[#2d1b15]/50 shadow-inner">
                  {/* Círculo con Logo Oficial Único */}
                  <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-full border-2 border-[#d4a373]/60 flex items-center justify-center bg-[#3b1f10] p-4 shadow-2xl ring-2 ring-[#d4a373]/30">
                    <img
                      src="/favicon.png"
                      alt="Logo Las Flores"
                      className="w-full h-full object-contain"
                      draggable={false}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Cara Interior (ABIERTO - rotateY 180deg + translateZ -1px): Ilustración Floral con garantía nuclear de opacidad */}
            <div
              className="door-inner bg-white border-[10px] lg:border-[12px] border-[#3b1f10] overflow-hidden"
              style={{
                transform: "rotateY(180deg) translateZ(-1px)",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                backgroundColor: "#ffffff",
                zIndex: 5,
                opacity: isOpen ? 1 : 0,
                visibility: isOpen ? "visible" : "hidden",
                transition: "opacity 0.4s ease 0.3s, visibility 0.4s ease 0.3s",
              }}
            >
              <div className="relative w-full h-full bg-white overflow-hidden">
                <img
                  src="/retablo-puerta.png"
                  alt="Ilustración floral ayacuchana - Puerta Izquierda"
                  className="w-full h-full"
                  style={{ objectFit: "fill" }}
                  draggable={false}
                />
              </div>
            </div>

            {/* Bisagra derecha */}
            <div className="absolute top-0 right-0 bottom-0 w-2 bg-gradient-to-r from-[#5D2E0C] via-[#8B4513] to-[#5D2E0C] z-30" />
          </div>

          {/* ── PUERTA DERECHA (50% ancho central) ── */}
          <div
            className="door-right hidden lg:block absolute top-0 bottom-0 right-0 w-[50%] z-20 pointer-events-none"
            style={{
              transform: `rotateY(${doorAngle}deg)`,
              transformStyle: "preserve-3d",
            }}
          >
            {/* Cara Exterior (CERRADO - rotateY 0deg + translateZ 1px): Madera caoba artesanal con Logo oficial en Pan de Oro */}
            <div
              className="door-face retablo-frame border-[10px] lg:border-[12px] border-[#3b1f10] overflow-hidden"
              style={{
                transform: "rotateY(0deg) translateZ(1px)",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                backgroundColor: "#3b1f10",
                zIndex: 10,
                boxShadow: "inset 0 0 30px rgba(0,0,0,0.85)",
              }}
            >
              {/* Madera caoba con doble filete dorado y Sello del Logo Oficial */}
              <div className="relative w-full h-full retablo-frame flex items-center justify-center p-3">
                <div className="w-full h-full border-2 border-[#d4a373]/40 flex flex-col items-center justify-center p-4 bg-[#2d1b15]/50 shadow-inner">
                  {/* Círculo con Logo Oficial Único */}
                  <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-full border-2 border-[#d4a373]/60 flex items-center justify-center bg-[#3b1f10] p-4 shadow-2xl ring-2 ring-[#d4a373]/30">
                    <img
                      src="/favicon.png"
                      alt="Logo Las Flores"
                      className="w-full h-full object-contain"
                      draggable={false}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Cara Interior (ABIERTO - rotateY 180deg + translateZ -1px): Ilustración Floral espejada sólida */}
            <div
              className="door-inner bg-white border-[10px] lg:border-[12px] border-[#3b1f10] overflow-hidden"
              style={{
                transform: "rotateY(180deg) translateZ(-1px)",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                backgroundColor: "#ffffff",
                zIndex: 5,
                opacity: isOpen ? 1 : 0,
                visibility: isOpen ? "visible" : "hidden",
                transition: "opacity 0.4s ease 0.3s, visibility 0.4s ease 0.3s",
              }}
            >
              <div className="relative w-full h-full bg-white overflow-hidden">
                <img
                  src="/retablo-puerta.png"
                  alt="Ilustración floral ayacuchana - Puerta Derecha"
                  className="w-full h-full"
                  style={{ objectFit: "fill", transform: "scaleX(-1)" }}
                  draggable={false}
                />
              </div>
            </div>

            {/* Bisagra izquierda */}
            <div className="absolute top-0 left-0 bottom-0 w-2 bg-gradient-to-r from-[#5D2E0C] via-[#8B4513] to-[#5D2E0C] z-30" />
          </div>

        </div>
      </div>
    </div>
  );
};

export default RetabloWrapper;
