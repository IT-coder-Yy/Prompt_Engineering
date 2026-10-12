// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { complete } from "@/lib/llm/client";
import { publicApiRequest } from "@/lib/llm/public-api-request";

vi.mock("@/lib/llm/public-api-request", () => ({ publicApiRequest: vi.fn() }));
const connection = { baseUrl: "https://api.example.com/v1", model: "browser-model", apiKey: "browser-key-only" };
const input = { system: "系统", prompt: "任务", temperature: 0.4, maxTokens: 100 };
const output = { choices: [{ message: { content: "模型输出" } }], usage: { total_tokens: 15 } };
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetAllMocks(); });

describe("模型配置选择与转发", () => {
  it("浏览器配置覆盖环境变量并用于真实请求参数", async () => {
    vi.stubEnv("LLM_API_KEY", "server-secret");
    vi.stubEnv("LLM_BASE_URL", "https://server.example/v1");
    vi.stubEnv("LLM_MODEL", "server-model");
    vi.mocked(publicApiRequest).mockResolvedValue(Response.json(output));
    expect(await complete(input, connection)).toMatchObject({ demo: false, model: "browser-model", content: "模型输出", usage: { totalTokens: 15 } });
    const [url, payload, key] = vi.mocked(publicApiRequest).mock.calls[0];
    expect(url.toString()).toBe("https://api.example.com/v1/chat/completions");
    expect(key).toBe(connection.apiKey);
    expect(JSON.parse(payload)).toMatchObject({ model: connection.model, messages: [{ role: "system", content: "系统" }, { role: "user", content: "任务" }], temperature: 0.4, max_tokens: 100 });
    expect(payload).not.toContain(connection.apiKey);
  });
  it("无浏览器配置时保留环境变量来源", async () => {
    vi.stubEnv("LLM_API_KEY", "server-secret"); vi.stubEnv("LLM_BASE_URL", "http://localhost:9000/v1"); vi.stubEnv("LLM_MODEL", "server-model");
    const fetcher = vi.fn().mockResolvedValue(Response.json(output)); vi.stubGlobal("fetch", fetcher);
    expect(await complete(input)).toMatchObject({ demo: false, model: "server-model" });
    expect(publicApiRequest).not.toHaveBeenCalled();
    expect(fetcher.mock.calls[0][1].headers.Authorization).toBe("Bearer server-secret");
  });
  it("均未配置时仍然返回明确的演示结果", async () => {
    vi.stubEnv("LLM_API_KEY", "");
    expect(await complete(input)).toMatchObject({ demo: true });
    expect(publicApiRequest).not.toHaveBeenCalled();
  });
  it("不将上游回显的密钥放进错误信息", async () => {
    vi.mocked(publicApiRequest).mockResolvedValue(Response.json({ error: { message: `invalid key ${connection.apiKey}` } }, { status: 401 }));
    await expect(complete(input, connection)).rejects.toMatchObject({ code: "UPSTREAM_401", message: "模型服务返回 401：鉴权失败，请检查 API Key。" });
  });
});
