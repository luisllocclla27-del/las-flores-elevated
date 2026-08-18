import { useState } from "react";
import {
  Calendar,
  Clock,
  Users,
  MessageCircle,
  CheckCircle2,
  XCircle,
  MapPin,
  Utensils,
  BellRing,
  Phone,
  Mail,
  User,
  Sparkles,
} from "lucide-react";

interface CashierReservationCardProps {
  reservation: any;
  onStatusChange: (reservationId: string, newStatus: string) => Promise<void>;
}

export function CashierReservationCard({
  reservation,
  onStatusChange,
}: CashierReservationCardProps) {
  const [updating, setUpdating] = useState(false);

  const normStatus = (reservation.status || "pending").toLowerCase().trim();
  const isConfirmed = normStatus === "confirmed" || normStatus === "confirmada";
  const isCompleted = normStatus === "completed" || normStatus === "completada" || normStatus === "asistio";
  const isCancelled = normStatus === "cancelled" || normStatus === "cancelada";

  // Formatear Fecha (YYYY-MM-DD -> DD/MM/YYYY)
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Sin fecha";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Comprobar si la reserva es de HOY
  const todayStr = new Date().toISOString().split("T")[0];
  const isToday = reservation.reservation_date === todayStr;

  // 1. Mensaje de Confirmación por WhatsApp
  const handleSendWhatsAppConfirmation = () => {
    const rawPhone = (reservation.client_phone || "").replace(/\D/g, "");
    const formattedPhone = rawPhone.startsWith("51") ? rawPhone : `51${rawPhone}`;

    const text = `Hola *${reservation.client_name || "Cliente"}*!
Confirmamos tu reserva en *Restaurante Las Flores*:

*Fecha:* ${formatDate(reservation.reservation_date)}
*Hora:* ${reservation.reservation_time || "Por confirmar"} (${(reservation.service_type || "almuerzo").toUpperCase()})
*Personas:* ${reservation.guest_count || 1} personas
${reservation.zone_id ? `*Zona:* ${reservation.zone_id}` : ""}
${reservation.notes ? `*Nota:* ${reservation.notes}` : ""}

¡Te esperamos para brindarte la mejor experiencia gastronómica de Ayacucho!`;

    const encodedText = encodeURIComponent(text);
    const url = `https://wa.me/${formattedPhone}?text=${encodedText}`;
    window.open(url, "_blank");
  };

  // 2. Mensaje de Recordatorio de Hoy por WhatsApp
  const handleSendWhatsAppReminder = () => {
    const rawPhone = (reservation.client_phone || "").replace(/\D/g, "");
    const formattedPhone = rawPhone.startsWith("51") ? rawPhone : `51${rawPhone}`;

    const text = `¡Hola *${reservation.client_name || "Cliente"}*!
Te recordamos que *HOY* tienes una reserva en *Restaurante Las Flores*:

*Hora:* ${reservation.reservation_time || "Por confirmar"} (${(reservation.service_type || "almuerzo").toUpperCase()})
*Personas:* ${reservation.guest_count || 1} personas
${reservation.zone_id ? `*Zona:* ${reservation.zone_id}` : ""}

Si deseas realizar algún ajuste en tu reserva, no dudes en escribirnos por aquí. ¡Te esperamos!`;

    const encodedText = encodeURIComponent(text);
    const url = `https://wa.me/${formattedPhone}?text=${encodedText}`;
    window.open(url, "_blank");
  };

  const handleUpdateStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      await onStatusChange(reservation.id, newStatus);
    } finally {
      setUpdating(false);
    }
  };

  // Configuración de Colores Análogos — Paleta Andina
  // Principio: Fondo blanco neutro + acento de borde izquierdo semántico
  const theme = isConfirmed
    ? {
        cardBorder: "border-l-4 border-l-[#5E85A8] border-y border-r border-gray-100 hover:shadow-md shadow-sm",
        headerBg: "bg-[#5E85A8]/8 border-b border-[#5E85A8]/15 text-nogal",
        iconBox: "bg-[#5E85A8]/15 text-[#3A6080] border border-[#5E85A8]/25",
        badge: "bg-[#5E85A8] text-white border-none",
        typeText: "text-[#3A6080]",
      }
    : isCompleted
    ? {
        cardBorder: "border-l-4 border-l-[#7C9A5C] border-y border-r border-gray-100 hover:shadow-md shadow-sm",
        headerBg: "bg-[#7C9A5C]/8 border-b border-[#7C9A5C]/15 text-nogal",
        iconBox: "bg-[#7C9A5C]/15 text-[#4A6A30] border border-[#7C9A5C]/25",
        badge: "bg-[#7C9A5C] text-white border-none",
        typeText: "text-[#4A6A30]",
      }
    : isCancelled
    ? {
        cardBorder: "border-l-4 border-l-[#A32638] border-y border-r border-gray-100 opacity-75 shadow-2xs",
        headerBg: "bg-[#A32638]/8 border-b border-[#A32638]/15 text-nogal",
        iconBox: "bg-[#A32638]/15 text-[#A32638] border border-[#A32638]/25",
        badge: "bg-[#A32638] text-white border-none",
        typeText: "text-[#A32638]",
      }
    : {
        // Pendiente — Chilca dorado
        cardBorder: "border-l-4 border-l-[#D9A441] border-y border-r border-gray-100 hover:shadow-md shadow-sm",
        headerBg: "bg-[#D9A441]/8 border-b border-[#D9A441]/15 text-nogal",
        iconBox: "bg-[#D9A441]/15 text-[#8C6010] border border-[#D9A441]/25",
        badge: "bg-[#D9A441] text-[#231A14] border-none font-black",
        typeText: "text-[#8C6010]",
      };

  return (
    <div
      className={`bg-white rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col justify-between font-sans ${theme.cardBorder}`}
    >
      {/* Header Banner Semántico Pastel por Estado */}
      <div className={`p-4 flex items-center justify-between relative overflow-hidden ${theme.headerBg}`}>
        <div className="flex items-center gap-2.5 z-10">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${theme.iconBox}`}>
            <Calendar size={18} />
          </div>
          <div>
            <span className={`text-xs uppercase font-sans font-extrabold tracking-wider flex items-center gap-1.5 ${theme.typeText}`}>
              {isToday ? (
                <span className="bg-[#D4AF37] text-[#2A4237] px-2 py-0.5 rounded-full font-black animate-pulse shadow-2xs">
                  HOY
                </span>
              ) : (
                "RESERVA"
              )}
              • {(reservation.service_type || "almuerzo").toUpperCase()}
            </span>
            <h3 className="font-sans font-black text-base text-gray-900 leading-tight mt-0.5">
              {formatDate(reservation.reservation_date)} — {reservation.reservation_time || "Hora sin fijar"}
            </h3>
          </div>
        </div>

        {/* Status Badge Refinado Semántico */}
        <span className={`text-xs font-sans font-black px-3 py-1 rounded-full uppercase tracking-wider z-10 ${theme.badge}`}>
          {isConfirmed
            ? "Confirmada"
            : isCompleted
            ? "Cliente Llegó"
            : isCancelled
            ? "Cancelada"
            : "Pendiente"}
        </span>
      </div>

      {/* Details */}
      <div className="p-4 space-y-3.5 flex-1 font-sans">
        {/* Client info */}
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
          <div>
            <h4 className="font-sans font-extrabold text-base text-gray-900 flex items-center gap-1.5">
              <User size={16} className="text-[#5F8575]" />
              {reservation.client_name || "Cliente Reserva"}
            </h4>
            {reservation.client_phone && (
              <p className="text-xs text-gray-700 flex items-center gap-1 mt-1 font-semibold">
                <Phone size={13} className="text-gray-400" />
                {reservation.client_phone}
              </p>
            )}
            {reservation.client_email && (
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5 font-medium">
                <Mail size={12} className="text-gray-400" />
                {reservation.client_email}
              </p>
            )}
          </div>

          <div className="bg-[#5F8575]/10 border border-[#5F8575]/20 text-[#2A4237] px-3 py-2 rounded-xl text-center shrink-0">
            <span className="text-xs uppercase font-bold tracking-wider text-[#5F8575] block">
              Personas
            </span>
            <span className="font-sans text-lg font-black tracking-tight tabular-nums text-[#2A4237] flex items-center justify-center gap-1">
              <Users size={16} /> {reservation.guest_count || 1}
            </span>
          </div>
        </div>

        {/* Zone & Table */}
        <div className="space-y-1.5 text-xs bg-amber-50/80 p-2.5 rounded-xl border border-amber-200/80">
          <div className="flex items-center gap-1.5 text-amber-950 font-bold">
            <MapPin size={14} className="text-[#5F8575]" />
            <span>Mesa / Sector: <strong className="text-gray-900 font-extrabold">{reservation.table_number || reservation.zone_id || "Aleatoria (Sin fijar)"}</strong></span>
          </div>
          {reservation.notes && (
            <p className="text-gray-600 italic">"{reservation.notes}"</p>
          )}
        </div>
      </div>

      {/* Actions Bar - Clean Executive Actions */}
      {(!isCompleted && !isCancelled) ? (
        <div className="p-4 bg-gray-50/70 border-t border-gray-100 space-y-2 font-sans">
          {/* ── Pendiente: Confirmar / WhatsApp Confirmación ── */}
          {!isConfirmed && (
            <>
              <div className="grid grid-cols-1 gap-2 mb-2">
                <button
                  onClick={handleSendWhatsAppConfirmation}
                  className="w-full py-2 bg-[#25D366] hover:bg-[#20bd5a] text-gray-950 rounded-xl text-xs font-black transition-all shadow-2xs flex items-center justify-center gap-1.5 active:scale-98"
                >
                  <MessageCircle size={15} />
                  <span>Confirmar WhatsApp</span>
                </button>
              </div>
              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  onClick={() => handleUpdateStatus("confirmed")}
                  disabled={updating}
                  className="flex-1 py-1.5 bg-[#5F8575] hover:bg-[#4d7061] text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1 active:scale-98"
                >
                  <CheckCircle2 size={13} /> Confirmar
                </button>
                <button
                  onClick={() => handleUpdateStatus("cancelled")}
                  disabled={updating}
                  className="py-1.5 px-3 bg-white hover:bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1"
                >
                  <XCircle size={13} /> Cancelar
                </button>
              </div>
            </>
          )}

          {/* ── Confirmada: Recordatorio / Cliente Llegó ── */}
          {isConfirmed && (
            <>
              <div className="grid grid-cols-1 gap-2 mb-2">
                <button
                  onClick={handleSendWhatsAppReminder}
                  className="w-full py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 active:scale-98"
                >
                  <BellRing size={14} className="text-amber-700" />
                  <span>Recordatorio Hoy</span>
                </button>
              </div>
              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  onClick={() => handleUpdateStatus("completed")}
                  disabled={updating}
                  className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1 active:scale-98"
                >
                  <Utensils size={13} /> Cliente Llegó
                </button>
                <button
                  onClick={() => handleUpdateStatus("cancelled")}
                  disabled={updating}
                  className="py-1.5 px-3 bg-white hover:bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1"
                >
                  <XCircle size={13} /> Cancelar
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="p-3 bg-gray-50/70 border-t border-gray-100 font-sans text-center">
           {isCompleted ? (
              <span className="text-xs font-bold text-blue-700 flex items-center justify-center gap-1">
                <Utensils size={14} /> Cliente en local
              </span>
           ) : (
              <span className="text-xs font-bold text-red-600 flex items-center justify-center gap-1">
                <XCircle size={14} /> Reserva cancelada
              </span>
           )}
        </div>
      )}
    </div>
  );
}


