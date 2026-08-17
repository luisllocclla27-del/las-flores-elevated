import { supabase } from "./supabase";

export interface YapeConfig {
  mode: "business" | "personal";
  businessName: string;
  businessQrUrl: string;
  businessPhone?: string;
  personalName: string;
  personalQrUrl: string;
  personalPhone?: string;
}

export const DEFAULT_YAPE_CONFIG: YapeConfig = {
  mode: "business",
  businessName: "Corporación Las Flores SAC",
  businessQrUrl: "/QRyape/2a6c600f-3d18-46b8-b46a-1bfceb3c4d11.webp",
  businessPhone: "967 456 230",
  personalName: "Ivinovith Chu*",
  personalQrUrl: "/QRyape/952bf29a-d177-4682-a5d9-9ae02dd4744b.webp",
  personalPhone: "980 723 422",
};

const STORAGE_KEY = "las_flores_yape_config";
const BROADCAST_EVENT = "las_flores_yape_updated";

export async function getYapeConfig(): Promise<YapeConfig> {
  if (typeof window === "undefined") return DEFAULT_YAPE_CONFIG;
  const local = localStorage.getItem(STORAGE_KEY);
  if (local) {
    try {
      return JSON.parse(local);
    } catch {}
  }
  return DEFAULT_YAPE_CONFIG;
}

export async function saveYapeConfig(config: YapeConfig): Promise<boolean> {
  if (typeof window === "undefined") return true;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  
  // Notificar inmediatamente a las demás pestañas del navegador
  window.dispatchEvent(new CustomEvent(BROADCAST_EVENT, { detail: config }));

  try {
    const channel = supabase.channel("yape_sync_room");
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        channel.send({
          type: "broadcast",
          event: "yape_change",
          payload: config,
        }).finally(() => {
          supabase.removeChannel(channel);
        });
      }
    });
  } catch (err) {
    console.warn("Realtime broadcast error:", err);
  }

  return true;
}

/**
 * Suscriptor en Tiempo Real (Realtime Supabase Broadcast + Eventos de ventana)
 */
export function subscribeToYapeConfig(callback: (config: YapeConfig) => void) {
  if (typeof window === "undefined") return () => {};

  // Listener de evento local (mismo navegador / multi-pestaña)
  const handleLocal = (e: any) => {
    if (e.detail) callback(e.detail);
  };
  window.addEventListener(BROADCAST_EVENT, handleLocal);

  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        callback(JSON.parse(e.newValue));
      } catch {}
    }
  };
  window.addEventListener("storage", handleStorage);

  // Canal Supabase Realtime Broadcast
  const channel = supabase.channel("yape_sync_listener");
  
  channel
    .on("broadcast", { event: "yape_change" }, (payload) => {
      if (payload.payload) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload.payload));
        callback(payload.payload as YapeConfig);
      }
    })
    .subscribe();

  return () => {
    window.removeEventListener(BROADCAST_EVENT, handleLocal);
    window.removeEventListener("storage", handleStorage);
    supabase.removeChannel(channel);
  };
}

