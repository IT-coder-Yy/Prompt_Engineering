// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiConfigSchema } from "@/lib/validation/api-config";
import { apiConfigStorageKey, readBrowserApiConfig, saveBrowserApiConfig } from "@/lib/browser-api-config";

const config = { baseUrl: "https://api.example.com/v1", model: "test-model", apiKey: "test-key-only" };

const items = new Map<string, string>();
const storage = {
  getItem: (key: string) => items.get(key) ?? null,
  setItem: (key: string, value: string) => { items.set(key, value); },
  removeItem: (key: string) => { items.delete(key); },
};
beforeEach(() => { items.clear(); vi.stubGlobal("window", { localStorage: storage, dispatchEvent: vi.fn() }); });
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("浏览器 API 配置", () => {
  it("保存并恢复配置，清除后恢复默认来源", () => {
    expect(readBrowserApiConfig()).toBeNull();
    saveBrowserApiConfig({ ...config, baseUrl: config.baseUrl + "/chat/completions/" });
    expect(readBrowserApiConfig()).toEqual(config);
    saveBrowserApiConfig(null);
    expect(readBrowserApiConfig()).toBeNull();
  });
  it.each(["not a URL", "file:///etc/passwd", "https://user:secret@example.com/v1", "https://api.example.com/v1?key=secret", "https://api.example.com/v1#fragment"])("拒绝无效地址 %s", (baseUrl) => {
    expect(apiConfigSchema.safeParse({ ...config, baseUrl }).success).toBe(false);
  });
  it("拒绝缺失字段和密钥换行", () => {
    expect(apiConfigSchema.safeParse({ ...config, model: " " }).success).toBe(false);
    expect(apiConfigSchema.safeParse({ ...config, apiKey: "bad\nkey" }).success).toBe(false);
  });
  it("配置损坏时明确报错，不静默使用其他密钥", () => {
    window.localStorage.setItem(apiConfigStorageKey, "bad-json");
    expect(readBrowserApiConfig).toThrow("重新保存或清除配置");
  });
  it("浏览器拒绝存储时不会误报保存成功", () => {
    vi.spyOn(storage, "setItem").mockImplementation(() => { throw new Error("denied"); });
    expect(() => saveBrowserApiConfig(config)).toThrow("存储权限");
  });
});
