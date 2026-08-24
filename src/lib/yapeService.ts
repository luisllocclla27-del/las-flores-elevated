import { supabase } from "./supabase";

export interface YapeAccount {
  id: string;
  type: "business" | "personal" | "custom";
  label: string;
  name: string;
  phone?: string;
  qrUrl: string;
  enabled: boolean;
  isDefault?: boolean;
}

export interface YapeConfig {
  activeAccountId: string;
  accounts: YapeAccount[];
  // Legacy compatibility
  mode: "business" | "personal";
  businessName: string;
  businessQrUrl: string;
  businessPhone?: string;
  personalName: string;
  personalQrUrl: string;
  personalPhone?: string;
}

export const DEFAULT_YAPE_ACCOUNTS: YapeAccount[] = [
  {
    id: "business",
    type: "business",
    label: "Yape Empresa",
    name: "Corporación Las Flores SAC",
    phone: "967 456 230",
    qrUrl: "/QRyape/2a6c600f-3d18-46b8-b46a-1bfceb3c4d11.webp",
    enabled: true,
    isDefault: true,
  },
  {
    id: "personal",
    type: "personal",
    label: "Yape Personal",
    name: "Ivinovith Chu*",
    phone: "980 723 422",
    qrUrl: "/QRyape/952bf29a-d177-4682-a5d9-9ae02dd4744b.webp",
    enabled: true,
    isDefault: true,
  },
];

export const DEFAULT_YAPE_CONFIG: YapeConfig = {
  activeAccountId: "business",
  accounts: DEFAULT_YAPE_ACCOUNTS,
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

export function normalizeYapeConfig(raw: any): YapeConfig {
  if (!raw || typeof raw !== "object") return DEFAULT_YAPE_CONFIG;

  let accounts: YapeAccount[] = Array.isArray(raw.accounts) && raw.accounts.length > 0
    ? raw.accounts
    : [
        {
          id: "business",
          type: "business",
          label: "Yape Empresa",
          name: raw.businessName || DEFAULT_YAPE_CONFIG.businessName,
          phone: raw.businessPhone || DEFAULT_YAPE_CONFIG.businessPhone,
          qrUrl: raw.businessQrUrl || DEFAULT_YAPE_CONFIG.businessQrUrl,
          enabled: true,
          isDefault: true,
        },
        {
          id: "personal",
          type: "personal",
          label: "Yape Personal",
          name: raw.personalName || DEFAULT_YAPE_CONFIG.personalName,
          phone: raw.personalPhone || DEFAULT_YAPE_CONFIG.personalPhone,
          qrUrl: raw.personalQrUrl || DEFAULT_YAPE_CONFIG.personalQrUrl,
          enabled: true,
          isDefault: true,
        },
      ];

  let activeAccountId = raw.activeAccountId || (raw.mode === "personal" ? "personal" : "business");
  
  // Si la cuenta activa no existe o está deshabilitada, buscar la primera habilitada
  const activeAccount = accounts.find((a) => a.id === activeAccountId && a.enabled) ||
    accounts.find((a) => a.enabled) ||
    accounts[0] ||
    DEFAULT_YAPE_ACCOUNTS[0];

  activeAccountId = activeAccount.id;

  const bizAccount = accounts.find((a) => a.id === "business" || a.type === "business") || activeAccount;
  const persAccount = accounts.find((a) => a.id === "personal" || a.type === "personal") || activeAccount;

  return {
    activeAccountId,
    accounts,
    mode: activeAccount.type === "personal" ? "personal" : "business",
    businessName: bizAccount.name,
    businessQrUrl: bizAccount.qrUrl,
    businessPhone: bizAccount.phone,
    personalName: persAccount.name,
    personalQrUrl: persAccount.qrUrl,
    personalPhone: persAccount.phone,
  };
}

export function getActiveYapeAccount(config: YapeConfig): YapeAccount {
  const normalized = normalizeYapeConfig(config);
  const found = normalized.accounts.find((a) => a.id === normalized.activeAccountId && a.enabled);
  if (found) return found;
  const firstEnabled = normalized.accounts.find((a) => a.enabled);
  if (firstEnabled) return firstEnabled;
  return DEFAULT_YAPE_ACCOUNTS[0];
}

export async function getYapeConfig(): Promise<YapeConfig> {
  if (typeof window === "undefined") return DEFAULT_YAPE_CONFIG;
  const local = localStorage.getItem(STORAGE_KEY);
  if (local) {
    try {
      return normalizeYapeConfig(JSON.parse(local));
    } catch {}
  }
  return DEFAULT_YAPE_CONFIG;
}

export async function saveYapeConfig(config: YapeConfig): Promise<boolean> {
  if (typeof window === "undefined") return true;

  const normalized = normalizeYapeConfig(config);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  
  // Notificar inmediatamente a las demás pestañas del navegador
  window.dispatchEvent(new CustomEvent(BROADCAST_EVENT, { detail: normalized }));

  try {
    const channel = supabase.channel("yape_sync_room");
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        channel.send({
          type: "broadcast",
          event: "yape_change",
          payload: normalized,
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
    if (e.detail) callback(normalizeYapeConfig(e.detail));
  };
  window.addEventListener(BROADCAST_EVENT, handleLocal);

  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        callback(normalizeYapeConfig(JSON.parse(e.newValue)));
      } catch {}
    }
  };
  window.addEventListener("storage", handleStorage);

  // Canal Supabase Realtime Broadcast
  const channel = supabase.channel("yape_sync_listener");
  
  channel
    .on("broadcast", { event: "yape_change" }, (payload) => {
      if (payload.payload) {
        const normalized = normalizeYapeConfig(payload.payload);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        callback(normalized);
      }
    })
    .subscribe();

  return () => {
    window.removeEventListener(BROADCAST_EVENT, handleLocal);
    window.removeEventListener("storage", handleStorage);
    supabase.removeChannel(channel);
  };
}
