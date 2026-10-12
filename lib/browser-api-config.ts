import { apiConfigSchema, type ApiConfig } from "./validation/api-config";

export const apiConfigStorageKey = "prompt-learning:api-config";
const changeEvent = "api-config-changed";

export function readApiConfigSnapshot(): string | null {
  try { return window.localStorage.getItem(apiConfigStorageKey); }
  catch { return "unavailable"; }
}

export function parseStoredApiConfig(value: string | null): ApiConfig | null {
  if (value === null) return null;
  try { return apiConfigSchema.parse(JSON.parse(value)); }
  catch { throw new Error("无法读取浏览器配置，请在 API 配置页重新保存或清除配置。"); }
}

export function readBrowserApiConfig() { return parseStoredApiConfig(readApiConfigSnapshot()); }

export function saveBrowserApiConfig(config: ApiConfig | null) {
  try {
    if (config) window.localStorage.setItem(apiConfigStorageKey, JSON.stringify(apiConfigSchema.parse(config)));
    else window.localStorage.removeItem(apiConfigStorageKey);
  } catch { throw new Error("浏览器未允许保存配置，请检查浏览器的存储权限。"); }
  window.dispatchEvent(new Event(changeEvent));
}

export function subscribeApiConfig(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(changeEvent, callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener(changeEvent, callback); };
}
