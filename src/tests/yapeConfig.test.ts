import { describe, it, expect, beforeEach, vi, beforeAll } from "vitest";
import {
  DEFAULT_YAPE_CONFIG,
  DEFAULT_YAPE_ACCOUNTS,
  getYapeConfig,
  saveYapeConfig,
  getActiveYapeAccount,
  normalizeYapeConfig,
  YapeConfig,
  YapeAccount,
} from "../lib/yapeService";

describe("Yape Config Service", () => {
  let mockStorage: Record<string, string> = {};

  beforeAll(() => {
    // Setup in-memory localStorage for Node test runner
    const localStorageMock = {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, value: string) => {
        mockStorage[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete mockStorage[key];
      },
      clear: () => {
        mockStorage = {};
      },
    };
    (globalThis as any).localStorage = localStorageMock;

    if (typeof window === "undefined") {
      (globalThis as any).window = {
        dispatchEvent: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
    }
    if (typeof CustomEvent === "undefined") {
      (globalThis as any).CustomEvent = class CustomEvent {
        type: string;
        detail: any;
        constructor(type: string, params: any) {
          this.type = type;
          this.detail = params?.detail;
        }
      };
    }
  });

  beforeEach(() => {
    mockStorage = {};
    vi.restoreAllMocks();
  });

  it("returns default config and accounts when storage is empty", async () => {
    const config = await getYapeConfig();
    expect(config.mode).toBe("business");
    expect(config.accounts.length).toBeGreaterThanOrEqual(2);
    expect(config.businessQrUrl).toBeDefined();
    expect(config.personalQrUrl).toBeDefined();

    const active = getActiveYapeAccount(config);
    expect(active.id).toBe("business");
    expect(active.name).toBe("Corporación Las Flores SAC");
  });

  it("persists multiple dynamic Yape accounts and switches active account", async () => {
    const customAccount: YapeAccount = {
      id: "account_caja_3",
      type: "custom",
      label: "Yape Caja Secundaria",
      name: "Administración Las Flores 2",
      phone: "911 222 333",
      qrUrl: "https://example.com/qr3.webp",
      enabled: true,
    };

    const newConfig: YapeConfig = {
      ...DEFAULT_YAPE_CONFIG,
      activeAccountId: "account_caja_3",
      accounts: [...DEFAULT_YAPE_ACCOUNTS, customAccount],
    };

    await saveYapeConfig(newConfig);

    const loaded = await getYapeConfig();
    expect(loaded.accounts.length).toBe(3);
    expect(loaded.activeAccountId).toBe("account_caja_3");

    const active = getActiveYapeAccount(loaded);
    expect(active.id).toBe("account_caja_3");
    expect(active.name).toBe("Administración Las Flores 2");
    expect(active.phone).toBe("911 222 333");
  });

  it("automatically falls back to another enabled account if active account is disabled", async () => {
    const configWithDisabled: YapeConfig = {
      ...DEFAULT_YAPE_CONFIG,
      activeAccountId: "business",
      accounts: [
        {
          ...DEFAULT_YAPE_ACCOUNTS[0],
          enabled: false, // Empresa deshabilitada
        },
        {
          ...DEFAULT_YAPE_ACCOUNTS[1],
          enabled: true, // Personal habilitada
        },
      ],
    };

    const normalized = normalizeYapeConfig(configWithDisabled);
    const active = getActiveYapeAccount(normalized);
    expect(active.id).toBe("personal");
    expect(active.name).toBe(DEFAULT_YAPE_ACCOUNTS[1].name);
  });

  it("can restore full factory default configuration", async () => {
    // 1. Modificar
    const modified: YapeConfig = {
      ...DEFAULT_YAPE_CONFIG,
      activeAccountId: "personal",
      personalName: "Nombre Modificado",
      personalPhone: "000 000 000",
      accounts: [],
    };
    await saveYapeConfig(modified);

    // 2. Restaurar original completo
    await saveYapeConfig(DEFAULT_YAPE_CONFIG);

    const loaded = await getYapeConfig();
    expect(loaded.activeAccountId).toBe("business");
    expect(loaded.accounts.length).toBe(2);
    expect(loaded.businessName).toBe("Corporación Las Flores SAC");
    expect(loaded.personalName).toBe("Ivinovith Chu*");
  });
});
