import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Package, MapPin, Navigation2, Loader2, AlertTriangle, CheckCircle2, Utensils, Truck, Clock, ShieldCheck, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/rastreo/$orderId")({
  head: () => ({
    meta: [{ title: "Estado de Pedido en Vivo | Las Flores" }],
  }),
  component: ClientTrackingLink,
});

interface OrderDetails {
  id: string;
  order_number: string;
  address: string;
  reference: string;
  status: string;
  total: number;
}

function ClientTrackingLink() {
  const { orderId } = Route.useParams();

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string>("pendiente");

  useEffect(() => {
    const fetchOrderDetails = async () => {
      setLoading(true);
      try {
        // Se usa el RPC de rastreo porque las políticas RLS ya no permiten leer
        // `orders` directamente a un visitante anónimo.
        const { data, error: err } = await supabase
          .rpc("get_order_tracking", { p_order_id: orderId })
          .maybeSingle();

        if (err || !data) {
          setError("No pudimos encontrar la orden de compra especificada.");
          return;
        }

        setOrder(data as OrderDetails);
        setCurrentStatus((data as OrderDetails).status || "pendiente");
      } catch (e) {
        console.error("Error al cargar orden de rastreo:", e);
        setError("Ocurrió un error al cargar la información del pedido.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();

    // Escuchar cambios en vivo de la orden vía Supabase Realtime en la tabla 'orders'
    const subscription = supabase
      .channel(`order_status_sync_${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload: any) => {
          if (payload.new && payload.new.status) {
            setCurrentStatus(payload.new.status);
          }
        }
      )
      .subscribe();

    // Escuchar canal broadcast enviado por el motorizado
    const broadcastChannel = supabase.channel(`delivery_tracking_${orderId}`);
    broadcastChannel.on("broadcast", { event: "status_update" }, (payload: any) => {
      if (payload?.payload?.status) {
        const s = payload.payload.status;
        if (s === "to_customer") setCurrentStatus("en_camino");
        else if (s === "delivered") setCurrentStatus("entregado");
        else if (s === "to_restaurant") setCurrentStatus("en_preparacion");
      }
    }).subscribe();

    return () => {
      supabase.removeChannel(subscription);
      supabase.removeChannel(broadcastChannel);
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f4e6] flex flex-col items-center justify-center p-6 text-nogal font-sans">
        <Loader2 size={40} className="animate-spin text-eucalipto mb-4" />
        <p className="font-bold text-xs uppercase tracking-widest text-nogal/60">Cargando estado del pedido en vivo...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#f8f4e6] flex flex-col items-center justify-center p-6 text-nogal font-sans">
        <div className="bg-white p-8 rounded-3xl border border-nogal/10 shadow-xl max-w-sm text-center space-y-4">
          <AlertTriangle size={40} className="text-amber-500 mx-auto" />
          <h2 className="font-serif font-bold text-xl">Pedido No Encontrado</h2>
          <p className="text-xs text-nogal/60 leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  // Normalización del estado actual
  const norm = (currentStatus || "").toLowerCase().trim();
  const isDelivered = norm.includes("entregad") || norm.includes("delivered") || norm.includes("complet");
  const isOnWay = norm.includes("camino") || norm.includes("listo") || norm.includes("to_customer");
  const isKitchen = norm.includes("preparac") || norm.includes("cocina") || norm.includes("to_restaurant");
  const isPending = norm.includes("pendient") || norm.includes("received");

  // Determinar paso activo (1 a 4)
  let activeStep = 1;
  if (isDelivered) activeStep = 4;
  else if (isOnWay) activeStep = 3;
  else if (isKitchen) activeStep = 2;

  const steps = [
    {
      num: 1,
      title: "Comanda Confirmada",
      desc: "Tu pedido ha sido recibido y registrado en caja.",
      icon: Package,
    },
    {
      num: 2,
      title: "En Preparación en Cocina",
      desc: "Nuestros chefs están preparando tus platos.",
      icon: Utensils,
    },
    {
      num: 3,
      title: "Repartidor en Camino",
      desc: "Tu motorizado ya tiene la orden y se dirige a tu domicilio.",
      icon: Truck,
    },
    {
      num: 4,
      title: "Entregado en Domicilio",
      desc: "¡Pedido entregado! Buen provecho con la experiencia Las Flores.",
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8f4e6] text-[#2c2a29] font-sans flex flex-col pt-12 pb-16 px-4 md:px-10 selection:bg-chilca/20">
      
      <div className="max-w-3xl mx-auto w-full flex flex-col gap-6 md:gap-8">
        
        {/* Cabecera Editorial */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative">
          <div className="relative z-10">
            <span className="text-[10px] md:text-xs uppercase tracking-[0.4em] font-extrabold text-chilca block mb-2">
              Experiencia Las Flores
            </span>
            <h1 className="font-serif italic text-4xl md:text-5xl text-nogal tracking-tight leading-[1.1]">
              {isDelivered 
                ? "¡Pedido Entregado!" 
                : isOnWay 
                ? "Tu repartidor está en camino." 
                : isKitchen 
                ? "Tu pedido está en cocina." 
                : "Tu pedido ha sido recibido."}
            </h1>
          </div>
          
          <div className="relative z-10 bg-white/90 backdrop-blur-md px-5 py-3.5 rounded-2xl shadow-xl shadow-nogal/5 border border-white flex items-center gap-4">
            <div className="w-10 h-10 bg-eucalipto/10 rounded-full flex items-center justify-center shrink-0">
              <Package className="text-eucalipto" size={20} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[9px] uppercase font-bold text-nogal/40 tracking-[0.2em] mb-0.5">Orden de Compra</p>
              <p className="text-sm font-bold text-nogal tracking-wide">#{order.order_number || orderId}</p>
            </div>
          </div>
        </header>

        {/* LÍNEA DE TIEMPO / TIMELINE DE ESTADO EN VIVO (Solo visible mientras el pedido está en proceso) */}
        {!isDelivered && (
          <section className="bg-white p-6 md:p-8 rounded-[2rem] shadow-xl shadow-nogal/5 border border-nogal/10 relative z-10 space-y-8">
            <div className="flex items-center justify-between border-b border-nogal/10 pb-4">
              <h2 className="font-serif text-xl font-bold text-nogal">Seguimiento en Tiempo Real</h2>
              <span className="text-[10px] uppercase font-extrabold tracking-widest bg-eucalipto/10 text-eucalipto px-3 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-eucalipto animate-ping" />
                Sincronizado en Vivo
              </span>
            </div>

            <div className="relative pl-6 md:pl-8 border-l-2 border-nogal/15 space-y-8 my-2">
              {steps.map((step) => {
                const Icon = step.icon;
                const isCompleted = step.num < activeStep;
                const isCurrent = step.num === activeStep;

                return (
                  <div key={step.num} className="relative flex items-start gap-4 group">
                    {/* Marcador del Nodo */}
                    <div 
                      className={`absolute -left-[31px] md:-left-[39px] top-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-500 ${
                        isCompleted
                          ? "bg-eucalipto text-white shadow-md scale-100"
                          : isCurrent
                          ? "bg-nogal text-chilca shadow-xl ring-4 ring-eucalipto/20 scale-110"
                          : "bg-piedra text-nogal/40 border border-nogal/20"
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-serif text-lg font-bold transition-colors ${
                          isCurrent ? "text-nogal font-black" : isCompleted ? "text-eucalipto" : "text-nogal/40"
                        }`}>
                          {step.title}
                        </h3>
                        {isCurrent && (
                          <span className="text-[9px] uppercase font-extrabold px-2 py-0.5 bg-nogal text-chilca rounded-full animate-pulse">
                            En Proceso
                          </span>
                        )}
                      </div>
                      <p className={`text-xs mt-1 leading-relaxed ${
                        isCurrent ? "text-nogal/80 font-medium" : "text-nogal/50"
                      }`}>
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
          {/* BANNER OFICIAL DE RESEÑAS GOOGLE MAPS */}
        {isDelivered && (
          <section className="bg-[#2c4a3e] text-[#faf6ed] p-6 md:p-8 rounded-[2rem] shadow-xl text-center border-2 border-[#d4af37] space-y-4 relative z-10">
            <div className="flex justify-center gap-1.5 text-[#d4af37]">
              <Star size={26} fill="#d4af37" />
              <Star size={26} fill="#d4af37" />
              <Star size={26} fill="#d4af37" />
              <Star size={26} fill="#d4af37" />
              <Star size={26} fill="#d4af37" />
            </div>
            <h3 className="font-serif text-2xl text-white font-bold">
              ¿Qué tal tu experiencia con Las Flores?
            </h3>
            <p className="text-xs md:text-sm opacity-90 max-w-md mx-auto leading-relaxed">
              ¡Esperamos que disfrutes tus alimentos! Nos ayuda enormemente que compartas tu opinión de 5 estrellas en nuestra ficha oficial de Google Maps.
            </p>
            <a
              href="https://www.google.com/maps/place/Restaurante+Las+Flores/@-13.1629067,-74.222784,17z/data=!4m8!3m7!1s0x911287600027a52b:0x1c3e775f879b7bbe!8m2!3d-13.1629067!4d-74.2179131!9m1!1b1!16s%2Fg%2F11bw_7shlg"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-[#d4af37] text-[#1b2a24] font-bold text-xs uppercase tracking-wider px-7 py-3.5 rounded-xl shadow-lg hover:bg-white transition-all transform hover:scale-105"
            >
              <Star size={16} fill="#1b2a24" /> Calificar en Google Maps
            </a>
          </section>
        )}

        {/* Info Box Abajo */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 relative z-10">
          <div className="bg-white/80 backdrop-blur-sm p-6 md:p-8 rounded-3xl border border-nogal/10 flex items-start gap-5 shadow-sm">
            <div className="w-12 h-12 bg-piedra rounded-2xl flex items-center justify-center shrink-0 border border-nogal/5">
              <MapPin className="text-nogal" size={22} />
            </div>
            <div>
              <h3 className="font-bold text-xs uppercase tracking-[0.15em] text-nogal/50 mb-2">Destino Registrado</h3>
              <p className="text-nogal text-sm font-medium leading-relaxed">{order.address || "Dirección registrada"}</p>
              {order.reference && (
                <p className="text-nogal/50 text-[11px] mt-1 italic">Ref: {order.reference}</p>
              )}
            </div>
          </div>

          <div className="bg-nogal p-6 md:p-8 rounded-3xl border border-nogal/10 flex flex-col justify-center items-center text-center text-piedra shadow-xl">
             <Navigation2 className="text-chilca opacity-50 mb-3" size={24} />
             <h3 className="font-serif italic text-xl mb-1">¿Algún inconveniente?</h3>
             <p className="text-[11px] text-piedra/60 mb-5 max-w-[200px] leading-relaxed">Nuestro equipo de soporte está listo para ayudarte con tu orden.</p>
             <a href="https://wa.me/51980723422" target="_blank" rel="noreferrer" className="w-full max-w-[200px] py-3.5 bg-pacay text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-pacay/90 transition-all shadow-md active:scale-95">
               Contactar Soporte
             </a>
          </div>
        </section>
        
      </div>
    </div>
  );
}
