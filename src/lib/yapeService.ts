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

const DEFAULT_YAPE_CONFIG: YapeConfig = {
  mode: "business",
  businessName: "Corporación Las Flores SAC",
  businessQrUrl: "/QRyape/2a6c600f-3d18-46b8-b46a-1bfceb3c4d11.jpg",
  businessPhone: "967 456 230",
  personalName: "Luis Gerardo Llocclla Saune",
  personalQrUrl: "/QRyape/2a6c600f-3d18-46b8-b46a-1bfceb3c4d11.jpg",
  personalPhone: "980 723 422",
};

const STORAGE_KEY = "las_flores_yape_config";

export async function getYapeConfig(): Promise<YapeConfig> {
  try {
    // 1. Intentar consultar en Supabase si existe la tabla app_settings
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
    // Silencioso, fallback a local
  }

  // 2. Fallback a LocalStorage o default
  const local = localStorage.getItem(STORAGE_KEY);
  if (local) {
    try {
      return JSON.parse(local);
    } catch {
      // Ignorar error de parseo
    }
  }

  return DEFAULT_YAPE_CONFIG;
}

export async function saveYapeConfig(config: YapeConfig): Promise<boolean> {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));

  try {
    const { error } = await supabase
      .from("app_settings")
      .upsert({
        key: "yape_config",
        value: config,
        updated_at: new Date().toISOString(),
      }, { onConflict: "key" });

    if (!error) {
      return true;
    }
  } catch (err) {
    console.warn("Could not save to Supabase app_settings, saved locally:", err);
  }

  return true;
}
