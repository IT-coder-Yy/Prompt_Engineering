import { createElement } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ApiConfigForm } from "@/components/api-config-form";
import { Playground } from "@/components/playground";

vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams() }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it("表单保存和恢复的配置会用于两组实验，清除后不再发送", async () => {
  const items = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => { items.set(key, value); },
    removeItem: (key: string) => { items.delete(key); },
  });
  const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ content: "测试输出", demo: false, model: "test-model" }) });
  vi.stubGlobal("fetch", fetcher);
  render(createElement(ApiConfigForm));
  fireEvent.change(screen.getByLabelText("Base URL", { exact: true }), { target: { value: "https://api.example.com/v1/" } });
  fireEvent.change(screen.getByLabelText("Model", { exact: true }), { target: { value: "test-model" } });
  fireEvent.change(screen.getByLabelText("API Key", { exact: true }), { target: { value: "test-key-only" } });
  fireEvent.click(screen.getByRole("button", { name: "保存配置" }));
  expect(screen.getByRole("status").textContent).toContain("已保存");
  cleanup(); render(createElement(ApiConfigForm));
  expect((screen.getByLabelText("Base URL", { exact: true }) as HTMLInputElement).value).toBe("https://api.example.com/v1");
  expect((screen.getByLabelText("API Key", { exact: true }) as HTMLInputElement).value).toBe("test-key-only");
  fireEvent.change(screen.getByLabelText("Model", { exact: true }), { target: { value: "updated-model" } });
  fireEvent.click(screen.getByRole("button", { name: "保存配置" }));
  cleanup(); render(createElement(Playground));
  fireEvent.click(screen.getByRole("button", { name: "运行本轮实验（调用模型 2 次）" }));
  await waitFor(() => expect(screen.getByRole("heading", { name: "对照组输出" })).toBeTruthy());
  expect(fetcher).toHaveBeenCalledTimes(2);
  for (const [, request] of fetcher.mock.calls) expect(JSON.parse(request.body).connection).toEqual({ baseUrl: "https://api.example.com/v1", model: "updated-model", apiKey: "test-key-only" });
  cleanup(); render(createElement(ApiConfigForm));
  fireEvent.click(screen.getByRole("button", { name: "清除已保存配置" }));
  expect(items.size).toBe(0);
  cleanup(); render(createElement(Playground));
  fireEvent.click(screen.getByRole("button", { name: "运行本轮实验（调用模型 2 次）" }));
  await waitFor(() => expect(screen.getByRole("heading", { name: "对照组输出" })).toBeTruthy());
  expect(fetcher).toHaveBeenCalledTimes(4);
  expect(JSON.parse(fetcher.mock.calls[3][1].body).connection).toBeUndefined();
});
