export function llmConfig() {
  const key = process.env.LLM_API_KEY; const baseUrl = process.env.LLM_BASE_URL; const model = process.env.LLM_MODEL;
  if (!key || !baseUrl || !model) return null;
  let url: URL;
  try { url = new URL(baseUrl); } catch { return null; }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const timeout = Number(process.env.LLM_TIMEOUT_MS ?? "30000");
  return { key, baseUrl: url.toString().replace(/\/$/, ""), model, timeout: Number.isFinite(timeout) && timeout > 0 ? Math.min(timeout, 120000) : 30000 };
}
