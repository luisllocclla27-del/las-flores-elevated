import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  MapPin,
  CreditCard,
  CheckCircle,
  Truck,
  Store,
  Smartphone,
  Lock,
  ArrowLeft,
  AlertTriangle,
  Clock,
  ClipboardList,
  Ticket,
  Tag,
  Banknote,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import {
  calculateDistanceKm,
  calculateDeliveryCost,
  RESTAURANT_LOCATION,
  DELIVERY_CONFIG,
} from "../utils/deliveryUtils";
import { signInWithGoogle, signInWithFacebook, createOrder, signOut, supabase } from "../lib/supabase";
import { playSuccessChime } from "@/lib/soundUtils";
import { sendOrderEmails } from "../lib/emailService";
import { LocationSelector } from "./LocationSelector";
import { CustomerHistoryModal } from "./CustomerHistoryModal";
import { LoginModal } from "./LoginModal";
import { openCulqiCheckout, formatAmountToCents, getCulqiErrorMessage, type CulqiToken } from "../lib/culqiClient";
import { processCulqiCharge } from "../lib/culqiApi";
import { getYapeConfig, subscribeToYapeConfig, DEFAULT_YAPE_CONFIG, type YapeConfig } from "../lib/yapeService";
import type { User } from "@supabase/supabase-js";

type Step = "cart" | "delivery" | "payment" | "success" | "profile";
type OrderType = "delivery" | "pickup";

interface DeliveryForm {
  name: string;
  phone: string;
  address: string;
  reference: string;
  email: string;
  notes: string;
}
interface PaymentForm {
  cardNumber: string;
  cardName: string;
  expiry: string;
  cvv: string;
}

/* ─── Paleta de Lujo (Eucalipto & Crema) ─── */
const R = {
  rojo: "#8B261D",
  verde: "var(--color-eucalipto)",
  morado: "var(--color-eucalipto)",
  eucalipto: "var(--color-eucalipto)",
  amarillo: "var(--color-eucalipto)",
  crema: "#FBF5E6",
  blanco: "#FFFFFF",
};

const inputCls =
  "w-full border-2 border-transparent border-b-black/15 rounded-t-xl rounded-b-sm px-4 py-3 text-base md:text-sm bg-black/4 focus:border-b-cream/50 focus:bg-white transition-all placeholder:text-black/30 font-medium";

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-xs uppercase tracking-[0.14em] font-bold text-black/50 mb-2">
    {children}
  </label>
);

export function CartSidebar() {
  const {
    items,
    isOpen,
    setIsOpen,
    updateQuantity,
    removeItem,
    clearCart,
    totalPrice,
    totalItems,
  } = useCart();
  const [step, setStep] = useState<Step>("cart");
  const [deliverySubStep, setDeliverySubStep] = useState<"location" | "details">("location");
  const [orderType, setOrderType] = useState<OrderType>("delivery");
  const [paymentMethod, setPaymentMethod] = useState<"yape" | "culqi" | "efectivo">("yape");
  const [yapeTitular, setYapeTitular] = useState("");
  const [yapeOperacion, setYapeOperacion] = useState("");
  const [yapeConfig, setYapeConfig] = useState<YapeConfig>(DEFAULT_YAPE_CONFIG);

  useEffect(() => {
    // Carga inicial
    getYapeConfig().then((cfg) => setYapeConfig(cfg));

    // Suscripción Realtime en vivo
    const unsubscribe = subscribeToYapeConfig((newConfig) => {
      setYapeConfig(newConfig);
    });

    return () => {
      unsubscribe();
    };
  }, []);
  const [culqiToken, setCulqiToken] = useState<CulqiToken | null>(null);
  const [culqiProcessing, setCulqiProcessing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [entered, setEntered] = useState(false);
  const [brokenItemImages, setBrokenItemImages] = useState<Record<string, boolean>>({});
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [createdOrderNumber, setCreatedOrderNumber] = useState<string>("");
  const [completedOrderSummary, setCompletedOrderSummary] = useState<{
    orderNumber: string;
    items: { id: string; name: string; quantity: number; price: number }[];
    total: number;
    address: string;
  } | null>(null);

  const isHistoryTrigger = useRef(false);
  const portalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Crear un nodo portal dedicado directamente en body para evitar
    // problemas de stacking context y pointer-events heredados del árbol del root
    const el = document.createElement("div");
    el.setAttribute("id", "cart-sidebar-portal");
    document.body.appendChild(el);
    portalRef.current = el;
    setIsMounted(true);
    return () => {
      document.body.removeChild(el);
      portalRef.current = null;
    };
  }, []);

  // Controla la entrada/salida deslizada del modal (empuja desde la derecha en
  // escritorio, desde abajo en móvil) usando transform + transition en vez de
  // animaciones por keyframes, para que el movimiento sea limpio en un solo eje.
  useEffect(() => {
    let rafId1: number | undefined;
    let rafId2: number | undefined;
    let timer: number | undefined;
    if (isOpen) {
      setVisible(true);
      // Doble rAF: el primero espera a que React pinte el modal en su posición
      // "cerrada"; recién en el segundo frame activamos la transición, si no
      // el navegador puede fusionar ambos estados en el mismo pintado y el
      // modal aparece de golpe sin animar.
      rafId1 = requestAnimationFrame(() => {
        rafId2 = requestAnimationFrame(() => setEntered(true));
      });
    } else {
      setEntered(false);
      timer = window.setTimeout(() => setVisible(false), 350);
    }
    return () => {
      if (rafId1 !== undefined) cancelAnimationFrame(rafId1);
      if (rafId2 !== undefined) cancelAnimationFrame(rafId2);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (!isHistoryTrigger.current) {
        if (step === "profile" || step === "success") {
          setStep("cart");
          if (step === "success") {
            setDeliverySubStep("location");
            setClientLocation(null);
          }
        }
      }
      isHistoryTrigger.current = false;
    }
  }, [isOpen]);

  // Escuchar sesión activa de Supabase (Google Auth) y sincronizar al volver de la ventana emergente
  useEffect(() => {
    let isCancelled = false;

    const syncSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (isCancelled) return;

        const newUser = session?.user || null;
        setActiveUser(newUser);

        if (session?.user) {
          setDelivery((d) => ({
            ...d,
            email: d.email || session.user.email || "",
            name:
              d.name ||
              session.user.user_metadata?.full_name ||
              session.user.user_metadata?.name ||
              session.user.email ||
              "Cliente Google",
            phone: d.phone || session.user.user_metadata?.phone || session.user.phone || "",
          }));
        }
      } catch (e) {
        console.error("Error syncing cart auth session:", e);
      }
    };

    syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isCancelled) return;
      const newUser = session?.user || null;
      setActiveUser(newUser);

      if (session?.user) {
        setDelivery((d) => ({
          ...d,
          email: d.email || session.user.email || "",
          name:
            d.name ||
            session.user.user_metadata?.full_name ||
            session.user.user_metadata?.name ||
            session.user.email ||
            "Cliente Google",
          phone: d.phone || session.user.user_metadata?.phone || session.user.phone || "",
        }));
      }
    });

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "SUPABASE_AUTH_SUCCESS") {
        syncSession();
      }
    };
    const handleCustomAuth = (e: Event) => {
      const customUser = (e as CustomEvent).detail;
      if (customUser) {
        setActiveUser(customUser);
      }
      syncSession();
    };
    const handleStorage = (e: StorageEvent) => {
      if (e.key?.includes("supabase")) {
        syncSession();
      }
    };

    const handleOpenHistory = () => {
      isHistoryTrigger.current = true;
      setStep("profile");
      setIsOpen(true);
    };

    window.addEventListener("message", handleMessage);
    window.addEventListener("supabase_auth_changed", handleCustomAuth);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("open_customer_history", handleOpenHistory);

    return () => {
      isCancelled = true;
      subscription.unsubscribe();
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("supabase_auth_changed", handleCustomAuth);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("open_customer_history", handleOpenHistory);
    };
  }, []);

  useEffect(() => {
    if (activeUser) {
      setDelivery((d) => ({
        ...d,
        email: d.email || activeUser.email || "",
        name: d.name || activeUser.user_metadata?.full_name || activeUser.email || "Cliente",
        phone: d.phone || activeUser.user_metadata?.phone || activeUser.phone || "",
      }));
    }
  }, [activeUser]);
  const [delivery, setDelivery] = useState<DeliveryForm>(() => ({
    name: activeUser?.user_metadata?.full_name || activeUser?.email || "",
    phone: activeUser?.user_metadata?.phone || activeUser?.phone || "",
    address: "",
    reference: "",
    email: activeUser?.email || "",
    notes: "",
  }));
  const [payment, setPayment] = useState<PaymentForm>({
    cardNumber: "",
    cardName: "",
    expiry: "",
    cvv: "",
  });
  const [processing, setProcessing] = useState(false);
  const [clientLocation, setClientLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const key = import.meta.env.VITE_MAPTILER_API_KEY;
      const res = await fetch(
        `https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${key}&language=es`
      );
      if (!res.ok) return;
      const data = await res.json();
      const feature = data?.features?.[0];
      if (feature?.place_name) {
        setDelivery((d) => ({ ...d, address: d.address || feature.place_name }));
      }
    } catch (e) {
      console.error("Reverse geocoding error:", e);
    }
  };

  const handleUseGPS = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          setClientLocation({ lat, lng });
          reverseGeocode(lat, lng);
        },
        (err) => {
          console.error("GPS error:", err);
        }
      );
    }
  };

  // Solicitar ubicación GPS automáticamente al entrar a la etapa de ubicación.
  // IMPORTANTE: clientLocation NO está en el dep array — si lo estuviera, cada vez que
  // GPS devuelve un valor se re-ejecuta el effect y pide GPS de nuevo (bucle infinito).
  useEffect(() => {
    if (
      step === "delivery" &&
      orderType === "delivery" &&
      deliverySubStep === "location" &&
      !clientLocation
    ) {
      handleUseGPS();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, orderType, deliverySubStep]);

  // Calcular la distancia y el costo
  const distanceKm = clientLocation
    ? calculateDistanceKm(
        RESTAURANT_LOCATION.lat,
        RESTAURANT_LOCATION.lng,
        clientLocation.lat,
        clientLocation.lng,
      )
    : 0;

  const DELIVERY_FEE =
    orderType === "delivery"
      ? clientLocation
        ? calculateDeliveryCost(distanceKm)
        : DELIVERY_CONFIG.baseCost
      : 0;

  // Coupon state
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [couponError, setCouponError] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const handleApplyCoupon = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!couponCodeInput.trim()) return;

    setValidatingCoupon(true);
    setCouponError("");

    const code = couponCodeInput.trim().toUpperCase().replace(/\s+/g, "");

    try {
      const { data: coupon, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", code)
        .single();

      if (error || !coupon) {
        setCouponError(`El código de descuento "${code}" no es válido.`);
        setAppliedCoupon(null);
        return;
      }

      if (!coupon.is_active) {
        setCouponError(`El cupón "${code}" se encuentra inactivo actualmente.`);
        setAppliedCoupon(null);
        return;
      }

      if ((coupon.used_count || 0) >= (coupon.max_uses || 100)) {
        setCouponError(`¡El cupón "${code}" ya alcanzó su límite máximo de ${coupon.max_uses} usos!`);
        setAppliedCoupon(null);
        return;
      }

      if (coupon.order_type_restriction !== "all" && coupon.order_type_restriction !== orderType) {
        setCouponError(`Este cupón solo es válido para pedidos de tipo ${coupon.order_type_restriction === "delivery" ? "Delivery a Domicilio" : "Recojo en Tienda"}.`);
        setAppliedCoupon(null);
        return;
      }

      if (coupon.min_order_total > 0 && totalPrice < coupon.min_order_total) {
        setCouponError(`Este cupón requiere un consumo mínimo de S/ ${Number(coupon.min_order_total).toFixed(2)}.`);
        setAppliedCoupon(null);
        return;
      }

      setAppliedCoupon(coupon);
      setCouponError("");
    } catch (err) {
      console.error("Error validating coupon:", err);
      setCouponError("Error al comprobar el código de descuento.");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const discountAmount = appliedCoupon
    ? appliedCoupon.discount_type === "percent"
      ? Math.round((totalPrice * (appliedCoupon.discount_value / 100)) * 100) / 100
      : Math.min(appliedCoupon.discount_value, totalPrice)
    : 0;

  const isTooFar = distanceKm > DELIVERY_CONFIG.maxRadiusKm;
  const total = Math.max(0, totalPrice - discountAmount + DELIVERY_FEE);

  const formatCard = (v: string) =>
    v
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(.{4})/g, "$1 ")
      .trim();
  const formatExpiry = (v: string) => {
    const c = v.replace(/\D/g, "").slice(0, 4);
    return c.length >= 3 ? `${c.slice(0, 2)}/${c.slice(2)}` : c;
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar ubicación exacta para delivery
    if (orderType === "delivery" && !clientLocation) {
      alert("Por favor, selecciona tu ubicación exacta en el mapa para que el motorizado pueda realizar la entrega con precisión.");
      return;
    }

    // Validar datos de Yape/Plin (de 3 a 8 dígitos numéricos: Yape directo 3+, Plin 6-8)
    if (paymentMethod === "yape") {
      const cleanTitular = yapeTitular.trim();
      const cleanOp = yapeOperacion.trim();

      if (cleanTitular.length < 3) {
        alert("Por favor, ingresa el nombre completo del titular de la cuenta de origen.");
        return;
      }

      if (!/^\d{3,8}$/.test(cleanOp)) {
        alert("El número de operación de Yape/Plin debe contener entre 3 y 8 dígitos numéricos (Ej: 123456 o 789).");
        return;
      }
    }

    // Si el método es Culqi y no hay token, abrir modal de Culqi
    if (paymentMethod === "culqi" && !culqiToken) {
      setCulqiProcessing(true);
      try {
        const token = await openCulqiCheckout({
          title: "Restaurante Las Flores",
          currency: "PEN",
          amount: formatAmountToCents(total),
          // order es opcional - lo eliminamos si causa problemas
        });
        setCulqiToken(token);
        setCulqiProcessing(false);
        // No continuar automáticamente, dejar que el usuario confirme
        alert("Tarjeta validada correctamente. Haz clic en 'Confirmar Pedido' para finalizar.");
        return;
      } catch (error: any) {
        console.error("Error al tokenizar con Culqi:", error);
        alert(getCulqiErrorMessage(error));
        setCulqiProcessing(false);
        return;
      }
    }

    setProcessing(true);

    // Validar disponibilidad de productos antes de confirmar el pedido
    try {
      const productNames = items.map((i) => i.name);
      const { data: availableProducts } = await supabase
        .from("products")
        .select("name, is_available")
        .in("name", productNames);

      if (availableProducts && availableProducts.length > 0) {
        const unavailable = availableProducts.filter((p) => p.is_available === false);
        if (unavailable.length > 0) {
          const names = unavailable.map((p) => p.name).join(", ");
          alert(`Los siguientes platos se agotaron mientras realizabas tu pedido: ${names}. Por favor, retíralos del carrito.`);
          setProcessing(false);
          return;
        }
      }
    } catch (stockErr) {
      // Si no se puede verificar stock, continuar con el pedido
    }

    // Procesar cargo con Culqi si el método de pago es Culqi
    let culqiChargeId: string | null = null;
    let culqiReferenceCode: string | null = null;
    
    if (paymentMethod === "culqi" && culqiToken) {
      try {
        
        const payload = {
          tokenId: culqiToken.id,
          amount: formatAmountToCents(total),
          email: delivery.email || activeUser?.email || "cliente@ejemplo.com",
          description: `Pedido delivery - Restaurante Las Flores`,
          orderNumber: `LF-${Date.now().toString(36).toUpperCase().slice(-6)}`,
          customerName: delivery.name || "Cliente",
          customerPhone: delivery.phone,
          address: delivery.address,
        };
        
        
        let chargeResult: any = null;

        try {
          const apiRes = await fetch("/api/culqi-charge", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          chargeResult = await apiRes.json();
        } catch (fetchErr) {
          // Fallback a createServerFn
          chargeResult = await processCulqiCharge({ data: payload });
        }

        if (!chargeResult || !chargeResult.success) {
          throw new Error(chargeResult?.error || "Error al procesar el pago con Culqi");
        }

        culqiChargeId = chargeResult.chargeId || null;
        culqiReferenceCode = chargeResult.referenceCode || null;
        
      } catch (culqiError: any) {
        console.error("Error procesando cargo Culqi:", culqiError);
        alert(`Error al procesar el pago: ${culqiError.message || "Por favor, intenta nuevamente."}`);
        setProcessing(false);
        return;
      }
    }

    const orderNum = `LF-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    try {
      const orderData = {
        order_number: orderNum,
        order_type: orderType,
        status: "received",
        client_name: delivery.name || "Cliente",
        client_email: delivery.email || activeUser?.email || "cliente@ejemplo.com",
        client_phone: delivery.phone || "",
        address: delivery.address,
        reference: delivery.reference,
        latitude: clientLocation?.lat,
        longitude: clientLocation?.lng,
        distance_km: distanceKm,
        subtotal: totalPrice,
        delivery_fee: DELIVERY_FEE,
        total: total,
        payment_method: paymentMethod === "culqi" ? "card" : paymentMethod,
        notes: [
          delivery.notes,
          paymentMethod === "yape" && yapeTitular ? `Yape Titular: ${yapeTitular}` : "",
          paymentMethod === "yape" && yapeOperacion ? `N° Op: ${yapeOperacion}` : "",
          paymentMethod === "culqi" && culqiToken ? `Culqi Token: ${culqiToken.id}` : "",
          paymentMethod === "culqi" && culqiChargeId ? `Culqi Charge: ${culqiChargeId}` : "",
          paymentMethod === "culqi" && culqiReferenceCode ? `Referencia: ${culqiReferenceCode}` : "",
        ].filter(Boolean).join(" | ") || undefined,
        items: items.map((i) => {
          const opts = i.customizations
            ? [
                i.customizations.bebidaFria,
                i.customizations.bebidaCaliente,
                i.customizations.sandwich,
                i.customizations.acompanamiento,
              ]
                .filter(Boolean)
                .join(", ")
            : "";
          const rawProductId = i.productId || i.id;
          return {
            product_id: rawProductId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawProductId) ? rawProductId : undefined,
            product_name: opts ? `${i.name} (${opts})` : i.name,
            unit_price: i.price,
            quantity: i.quantity,
            subtotal: i.price * i.quantity,
          };
        }),
      };
      const createdOrd = await createOrder(orderData);

      // Reproducir sonido cálido de confirmación
      playSuccessChime();

      // Enviar correo de confirmación al cliente y notificación a la caja (contacto@restaurantelasflores.com)
      sendOrderEmails(
        {
          ...createdOrd,
          customer_email: delivery.email || activeUser?.email,
          customer_name: delivery.name || "Cliente",
          order_type: orderType,
          subtotal: totalPrice,
          delivery_fee: DELIVERY_FEE,
          total_amount: total,
          payment_method: paymentMethod,
          address: delivery.address,
        },
        items
      ).catch((e) => console.warn("Background email notification error:", e));

      // Guardar el ID de la orden en localStorage para garantizar el acceso al historial inmediato
      try {
        if (createdOrd?.id) {
          const savedIds: string[] = JSON.parse(localStorage.getItem("las_flores_recent_orders") || "[]");
          if (!savedIds.includes(createdOrd.id)) {
            savedIds.push(createdOrd.id);
            localStorage.setItem("las_flores_recent_orders", JSON.stringify(savedIds.slice(-20)));
          }
        }
      } catch (lsErr) {
        console.warn("Error guardando orden local:", lsErr);
      }

      // Increment coupon used_count in Supabase & Log redemption record for BI Analytics
      if (appliedCoupon) {
        try {
          await (supabase.rpc("increment_coupon_used_count", { coupon_id: appliedCoupon.id }) as any).catch(() => {
            // Fallback si la función RPC no existe: incremento directo
            return supabase
              .from("coupons")
              .update({ used_count: (appliedCoupon.used_count || 0) + 1 })
              .eq("id", appliedCoupon.id);
          });

          await supabase.from("coupon_redemptions").insert([
            {
              coupon_id: appliedCoupon.id,
              coupon_code: appliedCoupon.code,
              order_number: orderNum,
              client_name: delivery.name || "Cliente",
              client_email: delivery.email || "",
              discount_amount: discountAmount,
              order_total: total,
            },
          ]);
        } catch (coupErr) {
          console.warn("Could not record coupon redemption:", coupErr);
        }
      }

      setCompletedOrderSummary({
        orderNumber: orderNum,
        items: items.map(i => ({ id: i.id, name: i.name, quantity: i.quantity, price: i.price })),
        total: total,
        address: delivery.address,
      });
      setCreatedOrderNumber(orderNum);
      clearCart();
      setStep("success");
    } catch (err) {
      console.error("Order creation error:", err);
      alert("Error al procesar el pedido. Por favor, intenta de nuevo.");
    } finally {
      setProcessing(false);
    }
  };

  // Bloquear scroll de pantalla y escuchar tecla Escape para cerrar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, setIsOpen]);

  const handleClose = () => {
    setIsOpen(false);
    if (step === "success") {
      clearCart();
      setStep("cart");
      setDeliverySubStep("location");
      setClientLocation(null);
      setDelivery({ name: "", phone: "", address: "", reference: "", email: "", notes: "" });
      setPayment({ cardNumber: "", cardName: "", expiry: "", cvv: "" });
      setCulqiToken(null);
      setCulqiProcessing(false);
    }
  };

  if (!isMounted || !portalRef.current || !visible) return null;

  return createPortal(
    <>
      {visible && (
        <div className="fixed inset-0 z-[110] flex flex-col items-center justify-end sm:flex-row sm:items-stretch sm:justify-end">
      {/* Fondo oscuro con blur */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer transition-opacity duration-[350ms] ease-out ${
          entered ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* Modal: bottom-sheet en móvil, panel pegado a la derecha a pantalla completa en escritorio.
          Empuja desde/hacia un solo eje por breakpoint (Y en móvil, X en escritorio). */}
      <div
        className={`doc-legible relative z-10 w-full max-w-[390px] bg-[#f8f4e6] text-nogal shadow-2xl overflow-hidden border border-black/10 sm:border-0 flex flex-col h-[100dvh] shrink-0 transition-transform duration-[350ms] ease-out ${
          entered
            ? "translate-y-0 sm:translate-x-0"
            : "translate-y-full sm:translate-y-0 sm:translate-x-full"
        }`}
      >
        {/* ── HEADER FIJO (estilo Chicha) ── */}
        {step !== "profile" && (
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#f8f4e6] border-b border-nogal/8 z-10 shrink-0">

          {/* Izquierda: Perfil o persona */}
          <div className="w-12 flex items-center justify-start">
            {activeUser ? (
              <button
                type="button"
                onClick={() => setStep("profile")}
                className="flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                aria-label="Mi perfil e historial"
              >
                {activeUser.user_metadata?.avatar_url ? (
                  <img
                    src={activeUser.user_metadata.avatar_url}
                    alt="Foto de perfil"
                    className="w-7 h-7 rounded-full object-cover border border-eucalipto/30 shadow-sm"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-black/5 text-nogal flex items-center justify-center text-xs font-serif font-bold border border-black/10">
                    {(activeUser.user_metadata?.full_name || activeUser.email || "C")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={async () => { try { await signInWithGoogle(); } catch (e) { console.error(e); } }}
                className="flex items-center justify-center text-nogal/50 hover:text-eucalipto transition-colors"
                aria-label="Iniciar sesión"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>
            )}
          </div>

          {/* Centro: Logo */}
          <img
            src="/images.png"
            alt="Logo Las Flores"
            className="h-9 object-contain drop-shadow-sm scale-[1.25] origin-center"
          />

          {/* Derecha: Cerrar */}
          <div className="w-12 flex justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="flex items-center justify-center text-nogal/50 hover:text-eucalipto transition-colors"
              aria-label="Cerrar"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        )}

        {/* ══ BARRA DE PASOS ══ */}
        {step !== "success" && step !== "profile" && (
          <div className="flex flex-shrink-0 bg-white border-b border-black/5 shadow-sm">
            {(["cart", "delivery", "payment"] as const).map((s, i) => {
              const stepList = ["cart", "delivery", "payment"];
              const cur = stepList.indexOf(step);
              const isActive = step === s;
              const isPast = cur > i;

              return (
                <div
                  key={s}
                  className="flex-1 py-3 flex flex-col items-center gap-1.5 text-xs font-bold tracking-wider uppercase transition-all"
                  style={{
                    borderBottom: isActive ? `3px solid var(--color-eucalipto)` : "3px solid transparent",
                  }}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                    style={{
                      background: isActive ? "rgba(36,63,50,0.1)" : isPast ? "var(--color-eucalipto)" : "rgba(0,0,0,0.05)",
                      color: isActive ? "var(--color-eucalipto)" : isPast ? "white" : "rgba(0,0,0,0.3)",
                      border: isActive ? "1.5px solid var(--color-eucalipto)" : "none",
                    }}
                  >
                    {isPast ? "✓" : i + 1}
                  </div>
                  <span
                    style={{ color: isActive || isPast ? "var(--color-eucalipto)" : "rgba(0,0,0,0.3)" }}
                  >
                    {s === "cart" ? "Carrito" : s === "delivery" ? "Entrega" : "Pago"}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* ══ CONTENIDO ══ */}
        {step === "profile" ? (
          <CustomerHistoryModal
            open={true}
            onClose={() => setStep("cart")}
            user={activeUser}
            inline={true}
          />
        ) : (
        <>
        <div className="flex-1 overflow-y-auto">
          {/* PASO 1: CARRITO */}
          {step === "cart" && (
            <div className="p-5 min-h-full">
              {items.length === 0 ? (
                <div className="text-center py-24 px-6 flex flex-col items-center">
                  <div
                    className="relative w-24 h-32 mb-6 flex flex-col items-center justify-center rounded-t-full rounded-b-xl border-[3px] shadow-sm"
                    style={{ borderColor: R.morado, background: `${R.amarillo}15` }}
                  >
                    <div
                      className="absolute inset-1.5 rounded-t-full rounded-b-lg border-2 border-dashed"
                      style={{ borderColor: `${R.rojo}60` }}
                    />
                    <ShoppingBag size={36} style={{ color: R.rojo }} className="relative z-10" />
                  </div>
                  <p className="font-serif text-xl font-bold text-black/80">
                    Tu canasta está vacía
                  </p>
                  <p className="text-sm mt-3 text-black/45 leading-relaxed">
                    Las puertas de nuestro retablo están abiertas. Explora la carta y añade
                    delicias.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item, i) => {
                    // Distribución de colores retablo
                    const accents = [R.rojo, R.verde, R.morado, R.amarillo];
                    const accent = accents[i % accents.length];
                    return (
                      <div
                        key={item.id}
                        className="flex items-start gap-3.5 bg-white rounded-xl p-3.5 shadow-xs border border-black/5 group hover:shadow-sm transition-all"
                      >
                        {item.image && !brokenItemImages[item.id] ? (
                          <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-black/5 shadow-xs bg-white mt-0.5">
                            <img
                              src={item.image}
                              alt={item.name}
                              onError={() => setBrokenItemImages((prev) => ({ ...prev, [item.id]: true }))}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-black/5 shadow-xs bg-black/5 mt-0.5 flex items-center justify-center">
                            <ShoppingBag size={22} className="text-black/25" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0 flex flex-col justify-between min-h-16 py-0.5">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <p className="font-serif text-sm font-bold leading-snug text-nogal">
                                {item.name}
                              </p>
                              {item.customizations && (
                                <div className="mt-1 space-y-0.5">
                                  {item.customizations.bebidaFria && (
                                    <p className="text-xs text-black/60 font-medium">
                                      • <span className="font-bold text-eucalipto">Fría:</span> {item.customizations.bebidaFria}
                                    </p>
                                  )}
                                  {item.customizations.bebidaCaliente && (
                                    <p className="text-xs text-black/60 font-medium">
                                      • <span className="font-bold text-eucalipto">Caliente:</span> {item.customizations.bebidaCaliente}
                                    </p>
                                  )}
                                  {item.customizations.sandwich && (
                                    <p className="text-xs text-black/60 font-medium">
                                      • <span className="font-bold text-eucalipto">Sándwich:</span> {item.customizations.sandwich}
                                    </p>
                                  )}
                                  {item.customizations.acompanamiento && (
                                    <p className="text-xs text-black/60 font-medium">
                                      • <span className="font-bold text-eucalipto">Acompañante:</span> {item.customizations.acompanamiento}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-black/30 hover:text-red-600 transition-colors p-2 -m-1 rounded-lg hover:bg-red-50 flex-shrink-0"
                              title="Eliminar plato"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                          <div className="flex items-center justify-between mt-2 pt-1 border-t border-black/4">
                            <p className="text-xs font-serif font-bold text-eucalipto">
                              S/ {item.price.toFixed(2)}
                            </p>
                            <div className="flex items-center gap-2 bg-black/4 rounded-lg p-1 border border-black/5">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="w-8 h-8 rounded-md flex items-center justify-center font-bold text-nogal/70 hover:text-eucalipto hover:bg-white active:scale-95 transition-all"
                              >
                                <Minus size={13} strokeWidth={2.5} />
                              </button>
                              <span className="text-xs font-bold w-5 text-center text-nogal">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="w-8 h-8 rounded-md flex items-center justify-center font-bold text-nogal/70 hover:text-eucalipto hover:bg-white active:scale-95 transition-all"
                              >
                                <Plus size={13} strokeWidth={2.5} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {items.length > 0 && (
                <div className="mt-6">
                  <p className="text-xs uppercase tracking-[0.14em] font-bold text-black/40 mb-3">
                    Tipo de pedido
                  </p>

                  <div className="grid grid-cols-2 gap-3 mb-5">
                    {[
                      {
                        type: "delivery" as OrderType,
                        label: "Delivery",
                        sub: "A tu puerta",
                        Icon: Truck,
                      },
                      {
                        type: "pickup" as OrderType,
                        label: "Para Llevar",
                        sub: "En restaurante",
                        Icon: Store,
                      },
                    ].map(({ type, label, sub, Icon }) => {
                      const active = orderType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setOrderType(type)}
                          className={`rounded-xl p-3 text-left transition-all border-2 flex items-center gap-3 ${
                            active
                              ? "bg-eucalipto/10 border-eucalipto text-eucalipto shadow-xs"
                              : "bg-white border-black/10 text-nogal/60 hover:border-black/20 hover:text-nogal"
                          }`}
                        >
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                              active ? "bg-eucalipto text-piedra" : "bg-black/5 text-nogal/60"
                            }`}
                          >
                            <Icon size={18} />
                          </div>
                          <div className="min-w-0">
                            <span className="block font-serif font-bold text-xs leading-tight">
                              {label}
                            </span>
                            <span className="block text-xs mt-0.5 opacity-70 truncate font-sans">
                              {sub}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Coupon Input Box */}
                  <div className="bg-amber-50/60 rounded-xl p-3.5 border border-amber-200/60 shadow-xs">
                    <label className="block text-xs font-serif font-bold text-[#14231D] mb-1.5 flex items-center gap-1.5">
                      <Ticket size={14} className="text-[#D4AF37]" /> ¿Tienes un código de descuento?
                    </label>

                    {appliedCoupon ? (
                      <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-emerald-300">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                            {appliedCoupon.code}
                          </span>
                          <span className="text-xs font-bold text-emerald-700">
                            ({appliedCoupon.discount_type === "percent" ? `-${appliedCoupon.discount_value}%` : `-S/ ${appliedCoupon.discount_value}`})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setAppliedCoupon(null);
                            setCouponCodeInput("");
                          }}
                          className="text-xs text-red-600 hover:text-red-800 font-bold underline"
                        >
                          Quitar
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleApplyCoupon} className="flex gap-2">
                        <input
                          type="text"
                          value={couponCodeInput}
                          onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                          placeholder="Ej: FLORES"
                          className="flex-1 font-mono uppercase font-extrabold text-xs bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#14231D]"
                        />
                        <button
                          type="submit"
                          disabled={validatingCoupon || !couponCodeInput.trim()}
                          className="px-3 py-2 bg-[#14231D] hover:bg-[#1E322A] text-[#FAF8F5] font-serif font-bold text-xs rounded-lg shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                          {validatingCoupon ? "..." : "Aplicar"}
                        </button>
                      </form>
                    )}

                    {couponError && (
                      <p className="text-xs font-semibold text-red-600 mt-1.5">
                        {couponError}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 bg-white rounded-xl p-4 border border-black/5 shadow-sm space-y-2 text-sm">
                    <div className="flex justify-between text-black/50 font-medium">
                      <span>
                        Subtotal ({totalItems} {totalItems === 1 ? "plato" : "platos"})
                      </span>
                      <span>S/ {totalPrice.toFixed(2)}</span>
                    </div>

                    {appliedCoupon && discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-700 font-bold">
                        <span className="flex items-center gap-1">
                          <Tag size={13} /> Descuento ({appliedCoupon.code})
                        </span>
                        <span>- S/ {discountAmount.toFixed(2)}</span>
                      </div>
                    )}

                    {orderType === "delivery" && (
                      <div className="flex justify-between text-black/50 font-medium">
                        <span>Costo de delivery</span>
                        <span>S/ {DELIVERY_FEE.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between font-serif font-bold text-base pt-2 border-t border-black/5">
                      <span className="text-nogal/80">Total</span>
                      <span className="text-eucalipto font-serif font-bold text-lg">S/ {total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PASO 2: ENTREGA */}
          {step === "delivery" && (
            <form
              id="delivery-form"
              className="p-5 space-y-4 min-h-full"
              onSubmit={(e) => {
                e.preventDefault();
                setStep("payment");
              }}
            >
              {orderType === "delivery" && (
                <div
                  className="rounded-xl p-3.5 flex gap-2.5 text-sm bg-eucalipto/8 border border-eucalipto/20 text-eucalipto"
                >
                  <MapPin size={15} className="flex-shrink-0 mt-0.5" />
                  <span>
                    Solo en Huamanga, Ayacucho — <strong>30 minutos estimados</strong>
                  </span>
                </div>
              )}

              {!activeUser && !delivery.email ? (
                <div className="py-6 text-center px-6">
                  <button
                    type="button"
                    onClick={() => setShowLoginModal(true)}
                    className="w-full py-4 rounded-xl font-serif font-bold text-base tracking-wide transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                    style={{ background: "var(--color-cochinilla)", color: "#FBF5E6" }}
                  >
                    Iniciar sesión para continuar
                  </button>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-300">
                  {/* Banner de Usuario Google */}
                  <div className="flex items-center gap-2.5 p-3 rounded-xl text-xs font-medium border bg-eucalipto/10 border-eucalipto/20 text-eucalipto">
                    <CheckCircle size={16} />
                    <span className="flex-1 truncate font-bold">
                      {delivery.name || activeUser?.user_metadata?.full_name || activeUser?.email} ({delivery.email || activeUser?.email})
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await signOut();
                        } catch (e) {
                          console.warn("Signout error:", e);
                        }
                        setDelivery({ ...delivery, email: "", name: "" });
                      }}
                      className="text-xs uppercase tracking-wider font-bold underline underline-offset-2 opacity-80 hover:opacity-100 flex-shrink-0"
                    >
                      Cerrar sesión
                    </button>
                  </div>

                  {/* ETAPA A: PINEAR UBICACIÓN (Solo si es Delivery) */}
                  {orderType === "delivery" && deliverySubStep === "location" && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-300">
                      <div className="flex items-center justify-between">
                        <Label>1. Fijar Ubicación en el Mapa *</Label>
                        <button
                          type="button"
                          onClick={handleUseGPS}
                          className="text-xs font-bold text-eucalipto flex items-center gap-1 hover:underline mb-2"
                        >
                          <MapPin size={13} /> usar mi GPS
                        </button>
                      </div>

                      {isMounted && (
                        <LocationSelector
                          initialLocation={clientLocation}
                          onLocationSelect={(lat, lng) => setClientLocation({ lat, lng })}
                          onAddressResolve={(address) =>
                            setDelivery((d) => ({ ...d, address }))
                          }
                        />
                      )}

                      {clientLocation ? (
                        <div className="p-3 bg-white rounded-xl border border-black/5 text-xs text-nogal/80 flex items-center justify-between">
                          <span className="flex items-center gap-1.5"><MapPin size={12} className="text-eucalipto flex-shrink-0" /> Distancia estimada: <strong>{distanceKm.toFixed(1)} km</strong></span>
                          <span className="font-bold text-eucalipto">Costo: S/ {DELIVERY_FEE.toFixed(2)}</span>
                        </div>
                      ) : (
                        <p className="text-xs text-black/50 font-medium">
                          Mueve el pin rojo o haz clic en el mapa para marcar tu ubicación exacta en Huamanga.
                        </p>
                      )}

                      {isTooFar && (
                        <p className="text-xs text-red-600 font-bold flex items-center gap-1">
                          <AlertTriangle size={14} /> Fuera de zona de reparto (Máx {DELIVERY_CONFIG.maxRadiusKm} km)
                        </p>
                      )}

                      <div>
                        <Label>Dirección exacta *</Label>
                        <input
                          required
                          value={delivery.address}
                          onChange={(e) => setDelivery({ ...delivery, address: e.target.value })}
                          placeholder="Av. Principal 123, Dpto 201"
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <Label>Referencia de entrega</Label>
                        <input
                          value={delivery.reference}
                          onChange={(e) => setDelivery({ ...delivery, reference: e.target.value })}
                          placeholder="Frente al parque, portón blanco..."
                          className={inputCls}
                        />
                      </div>
                    </div>
                  )}

                  {/* ETAPA B: TELÉFONO Y NOTAS (O cuando es Para Llevar) */}
                  {(deliverySubStep === "details" || orderType === "pickup") && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-300">
                      {orderType === "delivery" && clientLocation && (
                        <div className="p-3 bg-white rounded-xl border border-black/10 flex items-center justify-between text-xs">
                          <div className="min-w-0 pr-2">
                            <span className="block font-bold text-nogal truncate"><MapPin size={11} className="inline mr-1 text-eucalipto" />{delivery.address || "Ubicación fijada"}</span>
                            <span className="block text-xs text-black/50">A {distanceKm.toFixed(1)} km del restaurante</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setDeliverySubStep("location")}
                            className="text-xs font-bold text-eucalipto hover:underline flex-shrink-0"
                          >
                            Modificar mapa
                          </button>
                        </div>
                      )}

                      <div>
                        <Label>Teléfono / Celular *</Label>
                        <input
                          required
                          value={delivery.phone}
                          onChange={(e) => setDelivery({ ...delivery, phone: e.target.value })}
                          placeholder="987 654 321"
                          className={inputCls}
                        />
                      </div>

                      <div>
                        <Label>Notas o Comentarios del pedido (Opcional)</Label>
                        <textarea
                          value={delivery.notes}
                          onChange={(e) => setDelivery({ ...delivery, notes: e.target.value })}
                          placeholder="Sin cebolla, aliño aparte, o entregar a las 2:00 PM..."
                          className={`${inputCls} resize-none min-h-[90px]`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </form>
          )}

          {/* PASO 3: PAGO */}
          {step === "payment" && (
            <form id="payment-form" className="p-5 space-y-4 min-h-full" onSubmit={handlePayment}>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: "yape", label: "Yape / Plin", image: "/imagenes-reales/metodo-pagos/yape.webp" },
                    { id: "culqi", label: "Tarjeta", image: "/imagenes-reales/metodo-pagos/tarjeta.webp" },
                    { id: "efectivo", label: "Efectivo", image: "/imagenes-reales/metodo-pagos/dinero.webp" },
                  ] as const
                ).map(({ id, label, image }) => {
                  const active = paymentMethod === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setPaymentMethod(id)}
                      className={`py-3 px-2 rounded-2xl font-serif font-bold text-xs flex flex-col items-center gap-2 transition-all border-2 cursor-pointer ${
                        active
                          ? "bg-[#2c4a3e] text-white border-[#2c4a3e] shadow-md scale-[1.02]"
                          : "bg-white text-nogal/70 border-nogal/15 hover:border-nogal/30 hover:bg-piedra/30"
                      }`}
                    >
                      <img 
                        src={image} 
                        alt={label} 
                        className="w-8 h-8 object-contain"
                      />
                      <span className="truncate w-full text-center leading-tight">{label}</span>
                    </button>
                  );
                })}
              </div>

              {paymentMethod === "efectivo" && (
                <div className="bg-white rounded-2xl p-5 border border-nogal/10 shadow-sm space-y-2 text-left animate-in fade-in duration-300">
                  <div className="flex items-center gap-2 font-bold text-xs text-nogal">
                    <Banknote size={18} className="text-eucalipto" />
                    <span>Pago Contra Entrega en Efectivo</span>
                  </div>
                  <p className="text-xs text-nogal/70 leading-relaxed font-medium">
                    Pagarás un total de <strong className="text-eucalipto">S/ {total.toFixed(2)}</strong> directamente al motorizado al recibir tu pedido.
                  </p>
                </div>
              )}

              {paymentMethod === "yape" && (
                <div
                  className="bg-white rounded-2xl p-5 border border-nogal/10 shadow-sm space-y-4 animate-in fade-in duration-300"
                >
                  <div className="flex flex-col items-center">
                    <div
                      className="w-36 h-36 rounded-xl p-3 mb-3 border border-nogal/10 bg-white shadow-xs"
                    >
                      <img
                        src={yapeConfig.mode === "personal" ? yapeConfig.personalQrUrl : yapeConfig.businessQrUrl}
                        alt="QR Yape o Plin"
                        className="w-full h-full object-contain rounded-lg"
                      />
                    </div>
                    <p className="font-serif font-bold text-sm text-black/80">
                      Escanea con Yape o Plin
                    </p>
                    <p className="text-xs text-black/60 mt-0.5 text-center">
                      A nombre de <strong className="text-[#2D473C] font-bold">{yapeConfig.mode === "personal" ? yapeConfig.personalName : yapeConfig.businessName}</strong>
                    </p>
                    {(yapeConfig.mode === "personal" ? yapeConfig.personalPhone : yapeConfig.businessPhone) && (
                      <span className="text-xs text-gray-500 font-mono mt-0.5">
                        Número: {yapeConfig.mode === "personal" ? yapeConfig.personalPhone : yapeConfig.businessPhone}
                      </span>
                    )}
                  </div>
                  <div>
                    <Label>Titular de la cuenta origen *</Label>
                    <input
                      required
                      placeholder="Ej: Juan Pérez"
                      className={inputCls}
                      value={yapeTitular}
                      onChange={(e) => setYapeTitular(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>N° Operación (Yape/Plin) *</Label>
                    <input
                      required
                      type="text"
                      inputMode="numeric"
                      maxLength={8}
                      placeholder="Ej: 123456"
                      className={inputCls}
                      value={yapeOperacion}
                      onChange={(e) => setYapeOperacion(e.target.value.replace(/\D/g, "").slice(0, 8))}
                    />
                    <p className="text-xs text-black/40 mt-1.5 font-medium">
                      Entre 3 y 8 dígitos de aprobación de tu pantalla de éxito.
                    </p>
                  </div>
                </div>
              )}

              {paymentMethod === "culqi" && (
                <div className="bg-white rounded-2xl p-5 border border-[#00A19B]/20 shadow-sm space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="bg-[#00A19B] text-white px-3 py-1 rounded-lg text-sm font-bold">
                        Culqi
                      </div>
                      <span className="text-xs text-black/50 font-medium flex items-center gap-1">
                        <Lock size={12} /> Pago Seguro
                      </span>
                    </div>
                  </div>

                  {!culqiToken ? (
                    <div className="space-y-3">
                      <p className="text-xs text-nogal/80 font-medium leading-relaxed">
                        Paga de forma segura con tu tarjeta de crédito o débito. Culqi procesa tu pago de manera encriptada.
                      </p>
                      <div className="flex flex-wrap gap-3 items-center justify-center py-2">
                        <img 
                          src="/imagenes-reales/metodo-pagos/visa.webp" 
                          alt="Visa" 
                          className="h-8 object-contain"
                        />
                        <img 
                          src="/imagenes-reales/metodo-pagos/master-card.webp" 
                          alt="Mastercard" 
                          className="h-8 object-contain"
                        />
                        <img 
                          src="/imagenes-reales/metodo-pagos/amex.webp" 
                          alt="American Express" 
                          className="h-8 object-contain"
                        />
                        <img 
                          src="/imagenes-reales/metodo-pagos/diners.webp" 
                          alt="Diners Club" 
                          className="h-8 object-contain"
                        />
                      </div>
                      <p className="text-xs text-center text-black/50 italic">
                        Al continuar, se abrirá el formulario seguro de Culqi
                      </p>
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
                      <div className="flex items-center gap-2 text-green-700 font-bold text-sm">
                        <CheckCircle size={18} />
                        <span>Tarjeta tokenizada correctamente</span>
                      </div>
                      <p className="text-xs text-green-600">
                        Terminación: •••• {culqiToken.last_four} ({culqiToken.iin.card_brand})
                      </p>
                      <button
                        type="button"
                        onClick={() => setCulqiToken(null)}
                        className="text-xs text-green-700 underline hover:text-green-900 font-medium"
                      >
                        Usar otra tarjeta
                      </button>
                    </div>
                  )}
                </div>
              )}



              <div className="bg-white rounded-xl p-4 border border-black/5 text-sm space-y-1.5 shadow-sm">
                <div className="flex justify-between text-black/50 font-medium">
                  <span>Subtotal</span>
                  <span>S/ {totalPrice.toFixed(2)}</span>
                </div>
                {orderType === "delivery" && (
                  <div className="flex justify-between text-black/50 font-medium">
                    <span>Delivery</span>
                    <span>S/ {DELIVERY_FEE.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-serif font-bold text-base pt-2 border-t border-black/5">
                  <span className="text-black/70">Total</span>
                  <span style={{ color: R.rojo }}>S/ {total.toFixed(2)}</span>
                </div>
              </div>
            </form>
          )}

          {/* PASO 4: ÉXITO */}
          {step === "success" && (
            <div className="p-8 flex flex-col items-center text-center min-h-full justify-center">
              <div className="relative mb-6">
                <div
                  className="absolute -inset-2 rounded-full"
                  style={{
                    background: `conic-gradient(${R.verde} 0%,${R.amarillo} 25%,${R.rojo} 50%,${R.morado} 75%,${R.verde} 100%)`,
                    opacity: 0.5,
                  }}
                />
                <div
                  className="absolute -inset-2 rounded-full"
                  style={{ boxShadow: `inset 0 0 0 4px ${R.crema}` }}
                />
                <div
                  className="relative w-24 h-24 rounded-full flex items-center justify-center shadow-lg"
                  style={{ background: R.amarillo }}
                >
                  <CheckCircle size={48} className="text-white" strokeWidth={2} />
                </div>
              </div>

              <h3 className="text-2xl font-serif font-bold mb-1" style={{ color: R.morado }}>
                Pedido confirmado
              </h3>
              <p className="text-black/60 text-sm mb-1 font-medium">Tu pedido ha sido recibido.</p>
              {orderType === "delivery" ? (
                <p className="text-black/50 text-xs mb-6">
                  Llegará a{" "}
                  <strong className="text-black/70">{completedOrderSummary?.address || delivery.address || "tu dirección"}</strong> en
                  aprox. <strong style={{ color: R.verde }}>30 min</strong>.
                </p>
              ) : (
                <p className="text-black/50 text-xs mb-6">
                  Listo para recoger en <strong style={{ color: R.verde }}>20 minutos</strong>.
                </p>
              )}
              {delivery.notes && (
                <p className="text-black/60 text-xs mb-6 px-4 py-3 bg-black/5 rounded-lg italic shadow-inner">
                  "{delivery.notes}"
                </p>
              )}

              <div className="w-full bg-white rounded-xl p-4 border border-black/5 text-left mb-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.12em] font-bold text-black/40 mb-3">
                  Resumen
                </p>
                {(completedOrderSummary?.items || items).map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between text-sm text-black/60 font-medium mb-1.5"
                  >
                    <span>
                      {item.quantity}× {item.name}
                    </span>
                    <span>S/ {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-serif font-bold text-base pt-2.5 border-t border-black/5 mt-2">
                  <span className="text-black/70">Total pagado</span>
                  <span style={{ color: R.rojo }}>S/ {(completedOrderSummary?.total ?? total).toFixed(2)}</span>
                </div>
              </div>
              <p className="text-xs text-black/30 font-medium">
                Pedido{" "}
                <strong style={{ color: R.morado }}>#{completedOrderSummary?.orderNumber || createdOrderNumber}</strong>
              </p>
            </div>
          )}
        </div>

        {/* ══ BOTONERA — Eucalipto & Crema ══ */}
        <div className="p-5 flex-shrink-0 border-t border-black/5 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
          {step === "cart" && items.length > 0 && (
            <button
              onClick={() => setStep("delivery")}
              className="w-full py-4 rounded-xl font-serif font-bold text-lg tracking-wide transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
              style={{ background: "var(--color-cochinilla)", color: "#FBF5E6" }}
            >
              Continuar — S/ {total.toFixed(2)}
            </button>
          )}

          {step === "delivery" && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  if (deliverySubStep === "details" && orderType === "delivery") {
                    setDeliverySubStep("location");
                  } else {
                    setStep("cart");
                  }
                }}
                className="flex-none w-12 h-[52px] rounded-xl flex items-center justify-center border-2 transition-colors hover:bg-black/5"
                style={{ borderColor: "var(--color-eucalipto)", color: "var(--color-eucalipto)" }}
              >
                <ArrowLeft size={20} />
              </button>

              {orderType === "delivery" && deliverySubStep === "location" ? (
                <button
                  type="button"
                  onClick={() => setDeliverySubStep("details")}
                  disabled={!clientLocation || isTooFar || !delivery.address}
                  className="flex-1 py-3 rounded-xl font-serif font-bold text-base tracking-wide transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed cursor-pointer"
                  style={{ background: "var(--color-cochinilla)", color: "#FBF5E6" }}
                >
                  Continuar a datos &rarr;
                </button>
              ) : (
                <button
                  type="submit"
                  form="delivery-form"
                  disabled={!delivery.phone || (orderType === "delivery" && (!clientLocation || isTooFar))}
                  className="flex-1 py-3 rounded-xl font-serif font-bold text-base tracking-wide transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed cursor-pointer"
                  style={{ background: "var(--color-cochinilla)", color: "#FBF5E6" }}
                >
                  Ir al pago
                </button>
              )}
            </div>
          )}

          {step === "payment" && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep("delivery")}
                className="flex-none w-12 h-[52px] rounded-xl flex items-center justify-center border-2 transition-colors hover:bg-black/5"
                style={{ borderColor: "var(--color-eucalipto)", color: "var(--color-eucalipto)" }}
              >
                <ArrowLeft size={20} />
              </button>
              <button
                type="submit"
                form="payment-form"
                disabled={
                  processing || 
                  culqiProcessing ||
                  (paymentMethod === "yape" && (!yapeTitular.trim() || !yapeOperacion.trim()))
                }
                className="flex-1 py-3 rounded-xl font-serif font-bold text-base tracking-wide transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed"
                style={{ background: "var(--color-cochinilla)", color: "#FBF5E6" }}
              >
                {culqiProcessing 
                  ? "Procesando Culqi..." 
                  : processing 
                  ? "Procesando..." 
                  : paymentMethod === "culqi" && !culqiToken
                  ? "Validar Tarjeta"
                  : `Confirmar Pedido - S/ ${total.toFixed(2)}`}
              </button>
            </div>
          )}

          {step === "success" && (
            <div className="flex flex-col gap-2.5 w-full">
              <button
                onClick={handleClose}
                className="w-full py-3.5 rounded-xl font-serif font-bold text-base tracking-wide transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.99] flex items-center justify-center gap-2"
                style={{ background: "var(--color-cochinilla)", color: "#FBF5E6" }}
              >
                <Plus size={18} />
                <span>Hacer otro Pedido</span>
              </button>

              <button
                onClick={() => setStep("profile")}
                className="w-full py-2.5 rounded-xl font-serif font-bold text-xs tracking-wide transition-all border border-nogal/20 text-nogal hover:bg-nogal/5 flex items-center justify-center gap-2"
              >
                <Clock size={16} />
                <span>Ver Estado de mis Pedidos</span>
              </button>
            </div>
          )}
        </div>
        </>
        )}
      </div>

      </div>
      )}

      {/* ── MODAL DE LOGIN UNIFICADO ── */}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onGoogle={async () => {
            try {
              await signInWithGoogle();
            } catch (err) {
              console.warn("Supabase Auth local fallback:", err);
            }
            setShowLoginModal(false);
          }}
          onFacebook={async () => {
            try {
              await signInWithFacebook();
            } catch (err) {
              console.error("Facebook auth error:", err);
            }
            setShowLoginModal(false);
          }}
          subtitle="Inicia sesión para calcular el envío y personalizar tus notas."
        />
      )}
    </>,
    portalRef.current
  );
}

