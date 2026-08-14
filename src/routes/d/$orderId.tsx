import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { CheckCircle2, Navigation2, Package, MapPin, ExternalLink, Loader2, AlertTriangle, ShieldCheck, Phone, Clock, ArrowRight, Banknote, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { sendReviewRequestEmail } from "@/lib/emailService";

export const Route = createFileRoute("/d/$orderId")({
  component: DriverMagicLink,
  head: () => ({
    meta: [{ title: "Ruta de Despacho | Motorizado" }],
  }),
});

interface OrderData {
  id: string;
  order_number: string;
  client_name: string;
  client_phone: string;
  address: string;
  reference: string;
  latitude: number | null;
  longitude: number | null;
  total: number;
  status: string;
  payment_method: string;
  order_items?: { quantity: number; product_name: string; subtotal: number }[];
}

function DriverMagicLink() {
  const { orderId } = Route.useParams();
  
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [deliveryPhase, setDeliveryPhase] = useState<'pending' | 'to_restaurant' | 'to_customer' | 'delivered'>('pending');
  const [processingState, setProcessingState] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [isDriverAuthenticated, setIsDriverAuthenticated] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(`driver_auth_${orderId}`) === "true";
  });

  const channelRef = useRef<any>(null);

  // Cargar datos reales del pedido desde Supabase
  useEffect(() => {
    const fetchOrder = async () => {
      setLoadingOrder(true);
      try {
        const { data: order, error: fetchErr } = await supabase
          .from("orders")
          .select("*, order_items(*)")
          .eq("id", orderId)
          .single();

        if (fetchErr || !order) {
          setOrderError("Pedido no encontrado o enlace caducado.");
          return;
        }

        const normalizedStatus = (order.status || "").toLowerCase().trim();
        if (["entregado", "delivered", "completado", "cancelado", "cancelled"].includes(normalizedStatus)) {
          setDeliveryPhase('delivered');
        } else if (normalizedStatus === "en_camino" || normalizedStatus === "on_the_way") {
          setDeliveryPhase('to_customer');
        } else if (normalizedStatus === "en_preparacion" || normalizedStatus === "to_restaurant") {
          setDeliveryPhase('to_restaurant');
        }

        setOrderData(order);
      } catch (err) {
        console.error(err);
        setOrderError("Error de conexión. Intenta recargar la página.");
      } finally {
        setLoadingOrder(false);
      }
    };

    fetchOrder();

    // Crear canal de comunicación Realtime broadcast
    try {
      const channelName = `delivery_tracking_${orderId}`;
      const channel = supabase.channel(channelName, {
        config: { broadcast: { self: true, ack: false } },
      });
      channelRef.current = channel;
      channel.subscribe();
    } catch (e) {
      console.warn("Realtime channel init warning:", e);
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [orderId]);

  // Coordenadas de entrega del cliente
  const customerLocation = orderData?.latitude && orderData?.longitude 
    ? { lat: orderData.latitude, lng: orderData.longitude }
    : null;

  const startJourney = async () => {
    setProcessingState(true);
    setDeliveryPhase('to_restaurant');

    if (channelRef.current) {
      try {
        channelRef.current.send({
          type: "broadcast",
          event: "status_update",
          payload: { status: 'to_restaurant', timestamp: Date.now() }
        });
      } catch (e) {
        // Broadcast no crítico
      }
    }

    // Persistir en la BD para que el motorizado no pierda progreso al refrescar
    try {
      await supabase
        .from("orders")
        .update({ status: "en_preparacion" })
        .eq("id", orderId);
    } catch (err) {
      console.error("Error al actualizar estado en DB:", err);
    } finally {
      setProcessingState(false);
    }
  };

  const markPickedUp = async () => {
    setProcessingState(true);
    setDeliveryPhase('to_customer');

    if (channelRef.current) {
      try {
        channelRef.current.send({
          type: "broadcast",
          event: "status_update",
          payload: { status: 'to_customer', timestamp: Date.now() }
        });
      } catch (e) {
        console.warn("Broadcast error:", e);
      }
    }

    // Actualizar estado del pedido en Supabase DB a 'en_camino'
    try {
      await supabase
        .from("orders")
        .update({ status: "en_camino" })
        .eq("id", orderId);
    } catch (err) {
      console.error("Error al actualizar estado en DB:", err);
    } finally {
      setProcessingState(false);
    }
  };

  const markDelivered = async () => {
    setProcessingState(true);
    if (channelRef.current) {
      try {
        channelRef.current.send({
          type: "broadcast",
          event: "status_update",
          payload: { status: 'delivered', timestamp: Date.now() }
        });
      } catch (e) {
        console.warn("Broadcast error:", e);
      }
    }

    setDeliveryPhase('delivered');

    // Actualizar estado del pedido en Supabase a 'entregado'
    try {
      await supabase
        .from("orders")
        .update({ status: "entregado" })
        .eq("id", orderId);

      // Disparar correo de solicitud de reseña de 5 estrellas al cliente
      const emailToUse = (orderData as any)?.client_email || (orderData as any)?.customer_email || (orderData as any)?.email;
      const nameToUse = orderData?.client_name || "Cliente";
      if (emailToUse && emailToUse.includes("@")) {
        sendReviewRequestEmail({
          name: nameToUse,
          email: emailToUse,
        }).catch((e) => console.warn("Driver view review email warning:", e));
      }
    } catch (err) {
      console.error("Error al actualizar estado en DB:", err);
    } finally {
      setProcessingState(false);
    }
  };

  // Estado 1: Cargando datos del pedido
  if (loadingOrder) {
    return (
      <div className="min-h-screen bg-[#f8f4e6] flex items-center justify-center p-6 font-sans">
        <div className="text-center space-y-4">
          <Loader2 size={40} className="animate-spin text-eucalipto mx-auto" />
          <p className="text-xs font-bold text-nogal/60 uppercase tracking-widest">Cargando comanda de entrega...</p>
        </div>
      </div>
    );
  }

  // Estado 2: Error (pedido no encontrado)
  if (orderError || !orderData) {
    return (
      <div className="min-h-screen bg-[#f8f4e6] flex items-center justify-center p-6 font-sans">
        <div className="max-w-sm w-full bg-white rounded-3xl p-8 text-center shadow-xl border border-nogal/10 space-y-4">
          <AlertTriangle size={40} className="text-amber-500 mx-auto" />
          <h2 className="font-serif text-xl font-bold text-nogal">Enlace No Válido</h2>
          <p className="text-xs text-nogal/60">{orderError || "No se pudo cargar el pedido especificado."}</p>
        </div>
      </div>
    );
  }

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = pinInput.trim();
    if (!cleanInput) return;

    try {
      const { data: isValid, error } = await supabase.rpc("verify_driver_pin", {
        p_order_id: orderId,
        p_pin: cleanInput
      });

      if (!error && isValid === true) {
        localStorage.setItem(`driver_auth_${orderId}`, "true");
        setIsDriverAuthenticated(true);
        setPinError(false);
        return;
      }
    } catch (err) {
      console.warn("RPC verify_driver_pin error:", err);
    }

    const exactDriverPin = (orderData as any)?.driver_pin;
    if (exactDriverPin && cleanInput === String(exactDriverPin).trim()) {
      localStorage.setItem(`driver_auth_${orderId}`, "true");
      setIsDriverAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  // Estado 2.5: PIN de Motorizado no autenticado
  if (!isDriverAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f8f4e6] flex items-center justify-center p-6 font-sans">
        <form
          onSubmit={handleVerifyPin}
          className="max-w-sm w-full bg-white rounded-3xl p-8 text-center shadow-xl border border-nogal/10 space-y-5 animate-in fade-in zoom-in-95 duration-300"
        >
          <div className="w-16 h-16 bg-eucalipto/10 text-eucalipto rounded-2xl flex items-center justify-center mx-auto">
            <ShieldCheck size={36} />
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold text-nogal">Acceso de Motorizado</h2>
            <p className="text-xs text-nogal/60 mt-1">
              Ingresa el PIN de despacho o los últimos 4 dígitos del celular del cliente para ver los datos de entrega.
            </p>
          </div>

          <div className="space-y-2">
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              autoFocus
              placeholder="Ej: 1234 o 2026"
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                setPinError(false);
              }}
              className="w-full text-center text-2xl font-bold tracking-widest py-3 px-4 rounded-xl border border-nogal/20 bg-piedra/30 focus:outline-none focus:ring-2 focus:ring-eucalipto"
            />
            {pinError && (
              <p className="text-xs text-red-600 font-bold animate-pulse">
                PIN incorrecto. Intenta con los 4 últimos dígitos del cliente o PIN de caja.
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl font-serif font-bold text-sm bg-eucalipto text-piedra hover:bg-eucalipto/90 transition-all shadow-md"
          >
            Verificar y Acceder
          </button>
        </form>
      </div>
    );
  }

  // Estado 3: Enlace Colapsado / Pedido Completado o Cancelado
  if (deliveryPhase === 'delivered' || ["entregado", "delivered", "completado", "cancelado", "cancelled"].includes((orderData.status || "").toLowerCase().trim())) {
    return (
      <div className="min-h-screen bg-[#f8f4e6] flex flex-col items-center justify-center p-6 text-center text-nogal font-sans">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-nogal/10 text-center space-y-5">
          <div className="w-20 h-20 bg-eucalipto/10 text-eucalipto rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={44} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-eucalipto bg-eucalipto/10 px-3 py-1 rounded-full">
              Entrega Completada
            </span>
            <h1 className="font-serif text-2xl font-bold text-nogal mt-3">Misión Cumplida</h1>
            <p className="text-xs text-nogal/60 mt-2 leading-relaxed">
              El pedido <strong>#{orderData.order_number || orderId}</strong> ya fue entregado y finalizado.
            </p>
          </div>
          <div className="bg-piedra p-4 rounded-2xl border border-nogal/5 text-left text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-nogal text-xs mb-1">
              <ShieldCheck size={16} className="text-eucalipto" />
              <span>Enlace Desactivado</span>
            </div>
            <p className="text-[11px] text-nogal/60">
              Este enlace de despacho ha sido cerrado para liberar recursos y mantener la plataforma segura.
            </p>
          </div>
          <a
            href="/"
            className="block w-full py-3.5 bg-nogal text-piedra rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-nogal/90 transition-all shadow-md"
          >
            Volver al Inicio
          </a>
        </div>
      </div>
    );
  }

  const rawPaymentMethod = (orderData.payment_method || "yape").toLowerCase();
  const isCashPayment = rawPaymentMethod.includes("efectivo") || rawPaymentMethod.includes("cash");
  const paymentLabel = isCashPayment ? "Efectivo (Pago al entregar)" : orderData.payment_method || "Yape / Plin";

  return (
    <div className="min-h-screen bg-[#f8f4e6] font-sans flex flex-col p-4 md:p-6 justify-center">
      <div className="max-w-md w-full mx-auto bg-white rounded-3xl shadow-xl shadow-nogal/5 overflow-hidden border border-nogal/10">
        {/* Cabecera corporativa */}
        <div className="bg-nogal text-piedra p-6 text-center">
          <div className="w-14 h-14 mx-auto bg-white/10 rounded-full flex items-center justify-center mb-3">
            <Navigation2 size={28} className="text-chilca" />
          </div>
          <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-chilca mb-1 block">
            Panel de Despacho Motorizado
          </span>
          <h2 className="text-2xl font-serif font-bold">#{orderData.order_number}</h2>
        </div>

        {/* Cuerpo */}
        <div className="p-6 md:p-8 flex flex-col gap-5 text-center">
          {/* Información del Cliente */}
          <div className="bg-piedra/30 rounded-2xl p-4 text-left border border-nogal/5 space-y-3">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-nogal/5">
                <MapPin className="text-nogal" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase font-bold tracking-widest text-nogal/50 mb-0.5">Cliente & Destino:</p>
                <p className="font-bold text-sm text-nogal truncate">{orderData.client_name || "Cliente Las Flores"}</p>
                <p className="text-xs text-nogal/80 font-medium leading-snug mt-1">{orderData.address || "Dirección no especificada"}</p>
                {orderData.reference && (
                  <p className="text-[11px] text-nogal/60 mt-1 italic">Ref: {orderData.reference}</p>
                )}
              </div>
            </div>

            {orderData.client_phone && (
              <div className="pt-2 border-t border-nogal/10 flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold text-nogal/50">Teléfono del cliente:</span>
                <a
                  href={`tel:${orderData.client_phone}`}
                  className="text-xs font-bold text-eucalipto hover:underline flex items-center gap-1"
                >
                  <Phone size={13} />
                  {orderData.client_phone}
                </a>
              </div>
            )}
            
            {/* Detalle de Comanda */}
            <div className="border-t border-nogal/10 pt-3 space-y-1.5">
              <p className="text-[10px] uppercase font-bold tracking-widest text-nogal/50">Platos de la Comanda:</p>
              {orderData.order_items?.map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs font-medium">
                  <span className="text-nogal/80">{item.quantity}x {item.product_name}</span>
                  <span className="font-bold text-nogal">S/ {Number(item.subtotal).toFixed(2)}</span>
                </div>
              ))}

              {/* BANNER DISTINTIVO DE COBRO DE DINERO */}
              {isCashPayment ? (
                <div className="bg-amber-50 border-2 border-amber-300 p-3.5 rounded-xl text-left space-y-1 mt-3">
                  <div className="flex justify-between items-center text-xs font-bold text-amber-950">
                    <span className="flex items-center gap-1.5">
                      <Banknote size={16} className="text-amber-600" />
                      COBRAR AL CLIENTE (EFECTIVO):
                    </span>
                    <span className="text-base text-amber-700 font-serif font-black">S/ {Number(orderData.total).toFixed(2)}</span>
                  </div>
                  <p className="text-[10px] text-amber-900 font-bold uppercase tracking-wider">
                    Cobrar el dinero en efectivo al entregar el pedido.
                  </p>
                </div>
              ) : (
                <div className="bg-emerald-50 border-2 border-emerald-300 p-3.5 rounded-xl text-left space-y-1 mt-3">
                  <div className="flex justify-between items-center text-xs font-bold text-emerald-950">
                    <span className="flex items-center gap-1.5">
                      <Check size={16} className="text-emerald-600" />
                      MONTO YA PAGADO (NO COBRAR):
                    </span>
                    <span className="text-base text-emerald-700 font-serif font-black">S/ {Number(orderData.total).toFixed(2)}</span>
                  </div>
                  <p className="text-[10px] text-emerald-900 font-bold uppercase tracking-wider">
                    Pagado online ({paymentLabel}) — No solicitar dinero.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* FASES DE NAVEGACIÓN Y ACCIÓN */}
          {deliveryPhase === 'pending' && (
            <div className="space-y-3">
              <p className="text-nogal/70 text-xs leading-relaxed font-serif italic">
                Paso 1: Presiona el botón al iniciar tu recorrido hacia el restaurante.
              </p>
              <button 
                onClick={startJourney}
                disabled={processingState}
                className="w-full py-4 bg-eucalipto hover:bg-[#2c4a3e] text-piedra rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Voy a Recoger el Pedido</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {deliveryPhase === 'to_restaurant' && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-300">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-widest flex items-center justify-center gap-2 mb-1">
                  <Clock size={15} className="animate-spin text-amber-600" />
                  En camino a la cocina
                </p>
                <p className="text-[11px] text-nogal/60 mt-1">
                  Cuando la cocina te entregue el paquete listo, presiona el botón.
                </p>
              </div>

              <button 
                onClick={markPickedUp}
                disabled={processingState}
                className="w-full py-4 bg-nogal hover:bg-nogal/90 text-piedra rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Package size={18} />
                <span>Pedido Recogido (En camino al cliente)</span>
              </button>
            </div>
          )}

          {deliveryPhase === 'to_customer' && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-300">
              <div className="bg-eucalipto/10 border border-eucalipto/20 p-4 rounded-2xl">
                <p className="text-xs font-bold text-eucalipto uppercase tracking-widest flex items-center justify-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-eucalipto animate-ping" />
                  En camino al domicilio
                </p>
                <p className="text-[11px] text-nogal/60 mt-1">
                  Te estás dirigiendo a la dirección del cliente. Al entregar el pedido, presiona Confirmar.
                </p>
              </div>

              {/* Botones de Navegación GPS Externa */}
              <div className="flex gap-2.5">
                <a 
                  href={customerLocation 
                    ? `https://www.google.com/maps/dir/?api=1&destination=${customerLocation.lat},${customerLocation.lng}`
                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(orderData.address + ", Ayacucho")}`
                  }
                  target="_blank" rel="noreferrer"
                  className="flex-1 py-3 bg-white border border-nogal/15 hover:bg-piedra text-nogal rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all shadow-sm flex flex-col items-center justify-center gap-1"
                >
                  <ExternalLink size={15} />
                  Google Maps
                </a>
                <a 
                  href={customerLocation 
                    ? `https://waze.com/ul?ll=${customerLocation.lat},${customerLocation.lng}&navigate=yes`
                    : `https://waze.com/ul?q=${encodeURIComponent(orderData.address + ", Ayacucho")}&navigate=yes`
                  }
                  target="_blank" rel="noreferrer"
                  className="flex-1 py-3 bg-white border border-nogal/15 hover:bg-piedra text-nogal rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all shadow-sm flex flex-col items-center justify-center gap-1"
                >
                  <ExternalLink size={15} />
                  Waze
                </a>
              </div>

              <button 
                onClick={markDelivered}
                disabled={processingState}
                className="w-full py-4 mt-2 bg-pacay hover:bg-pacay/90 text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 size={18} />
                <span>Confirmar Entrega al Cliente</span>
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8 text-center text-nogal/40 text-[10px] uppercase font-bold tracking-widest flex items-center justify-center gap-2">
        <img src="/images.png" className="h-4 brightness-0 opacity-40 grayscale" alt="Logo" />
        Sistema de Seguimiento Las Flores
      </div>
    </div>
  );
}
