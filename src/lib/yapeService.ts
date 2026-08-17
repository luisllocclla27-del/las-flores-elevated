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
  try {
    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "yape_config")
      .single();

    if (!error && data?.value) {
      const parsed = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      return parsed;
    }
  } catch (err) {
    // Fallback
  }

  const local = localStorage.getItem(STORAGE_KEY);
  if (local) {
    try {
      return JSON.parse(local);
    } catch {}
  }

  return DEFAULT_YAPE_CONFIG;
}

export async function saveYapeConfig(config: YapeConfig): Promise<boolean> {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  
  // 1. Notificar inmediatamente a las demás pestañas/ventanas abiertas del mismo navegador
  window.dispatchEvent(new CustomEvent(BROADCAST_EVENT, { detail: config }));

  try {
    // 2. Transmitir en vivo por canal Realtime de Supabase (WebSockets) a todos los clientes conectados
    const channel = supabase.channel("realtime-yape-broadcast");
    await channel.send({
      type: "broadcast",
      event: "yape_change",
      payload: config,
    });

    // 3. Persistir en la tabla app_settings de Supabase
    await supabase
      .from("app_settings")
      .upsert({
        key: "yape_config",
        value: config,
        updated_at: new Date().toISOString(),
      }, { onConflict: "key" });

  } catch (err) {
    console.warn("Realtime sync fallback:", err);
  }

  return true;
}

/**
 * Suscriptor en Tiempo Real (Realtime Supabase + Eventos de ventana)
 */
export function subscribeToYapeConfig(callback: (config: YapeConfig) => void) {
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

  // Canal Supabase Realtime Broadcast & Postgres Changes
  const channel = supabase
    .channel("realtime-yape-broadcast")
    .on("broadcast", { event: "yape_change" }, (payload) => {
      if (payload.payload) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload.payload));
        callback(payload.payload as YapeConfig);
      }
    })
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "app_settings", filter: "key=eq.yape_config" },
      (payload) => {
        if (payload.new && (payload.new as any).value) {
          const val = (payload.new as any).value;
          const parsed = typeof val === "string" ? JSON.parse(val) : val;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
          callback(parsed as YapeConfig);
        }
      }
    )
    .subscribe();

  // Retornar función de desuscripción limpia
  return () => {
    window.removeEventListener(BROADCAST_EVENT, handleLocal);
    window.removeEventListener("storage", handleStorage);
    supabase.removeChannel(channel);
  };
}
