import { describe, it, expect, beforeEach, vi, beforeAll } from "vitest";
import { DEFAULT_YAPE_CONFIG, getYapeConfig, saveYapeConfig, YapeConfig } from "../lib/yapeService";

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

  it("returns default config when storage is empty", async () => {
    const config = await getYapeConfig();
    expect(config.mode).toBe("business");
    expect(config.businessQrUrl).toBeDefined();
    expect(config.personalQrUrl).toBeDefined();
  });

  it("persists updated QR URLs and settings", async () => {
    const newConfig: YapeConfig = {
      ...DEFAULT_YAPE_CONFIG,
      mode: "personal",
      personalQrUrl: "https://example.com/new-personal-qr.webp",
      personalName: "Juan Perez",
      personalPhone: "999 888 777",
    };

    const saved = await saveYapeConfig(newConfig);
    expect(saved).toBe(true);

    const loaded = await getYapeConfig();
    expect(loaded.mode).toBe("personal");
    expect(loaded.personalQrUrl).toBe("https://example.com/new-personal-qr.webp");
    expect(loaded.personalName).toBe("Juan Perez");
    expect(loaded.personalPhone).toBe("999 888 777");
  });

  it("persists updated business QR URL and settings", async () => {
    const updatedBusiness: YapeConfig = {
      ...DEFAULT_YAPE_CONFIG,
      mode: "business",
      businessQrUrl: "data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAQAcJaACdLoAAP7/2QAA",
      businessName: "Corporación Las Flores 2026",
    };

    const saved = await saveYapeConfig(updatedBusiness);
    expect(saved).toBe(true);

    const loaded = await getYapeConfig();
    expect(loaded.mode).toBe("business");
    expect(loaded.businessQrUrl).toContain("data:image/webp;base64");
    expect(loaded.businessName).toBe("Corporación Las Flores 2026");
  });
});
