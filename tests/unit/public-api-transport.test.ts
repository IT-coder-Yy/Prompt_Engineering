// @vitest-environment node
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import type { ClientRequest, IncomingMessage, RequestOptions } from "node:http";
import { afterEach, expect, it, vi } from "vitest";
import { publicApiRequest, publicApiLookup } from "@/lib/llm/public-api-request";

const send = vi.hoisted(() => vi.fn<(url: URL, options: RequestOptions, callback: (response: IncomingMessage) => void) => ClientRequest>());
vi.mock("node:https", () => ({ request: send }));
afterEach(() => vi.resetAllMocks());

function reply(status: number, content: string) {
  const end = vi.fn();
  send.mockImplementation((_url, _options, callback) => {
    const response = Object.assign(new PassThrough(), { statusCode: status });
    end.mockImplementation(() => { callback(response as unknown as IncomingMessage); response.end(content); });
    return Object.assign(new EventEmitter(), { end }) as unknown as ClientRequest;
  });
  return end;
}

it("将鉴权和 JSON 正确发往指定地址，并读取上游响应", async () => {
  const end = reply(200, '{"choices":[{"message":{"content":"ok"}}]}');
  const url = new URL("https://api.example.com/v1/chat/completions");
  const signal = new AbortController().signal;
  const response = await publicApiRequest(url, '{"model":"test-model"}', "test-key-only", signal);
  expect(send).toHaveBeenCalledWith(url, expect.objectContaining({ method: "POST", signal, agent: false, lookup: publicApiLookup, headers: expect.objectContaining({ Authorization: "Bearer test-key-only", "Content-Type": "application/json" }) }), expect.any(Function));
  expect(end).toHaveBeenCalledWith('{"model":"test-model"}');
  expect(await response.json()).toMatchObject({ choices: [{ message: { content: "ok" } }] });
});

it("将重定向交给错误处理，不发送第二次携带密钥的请求", async () => {
  reply(302, "redirect");
  const response = await publicApiRequest(new URL("https://api.example.com/v1/chat/completions"), "{}", "test-key-only", new AbortController().signal);
  expect(response.status).toBe(302);
  expect(send).toHaveBeenCalledTimes(1);
});

it("上游无内容响应不会导致服务崩溃", async () => {
  reply(204, "");
  const response = await publicApiRequest(new URL("https://api.example.com/v1/chat/completions"), "{}", "test-key-only", new AbortController().signal);
  expect(response.status).toBe(204);
  expect(await response.text()).toBe("");
});
