// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import type { LookupAddress, LookupOptions } from "node:dns";
import { isPublicApiAddress, publicApiLookup, publicApiRequest } from "@/lib/llm/public-api-request";

const lookup = vi.hoisted(() => vi.fn<(hostname: string, options: LookupOptions, callback: (error: Error | null, addresses: LookupAddress[]) => void) => void>());
vi.mock("node:dns", () => ({ lookup }));
afterEach(() => vi.resetAllMocks());

describe("页面指定上游的地址边界", () => {
  it.each(["127.0.0.1", "10.0.0.1", "172.16.1.1", "192.168.1.1", "169.254.169.254", "100.100.100.200", "168.63.129.16", "0.0.0.0", "::1", "::ffff:127.0.0.1", "fe80::1", "fd00::1", "2002:7f00:1::", "2001:db8::1"])("阻止内网及保留地址 %s", (address) => expect(isPublicApiAddress(address)).toBe(false));
  it.each(["8.8.8.8", "1.1.1.1", "2606:4700:4700::1111"])("接受公网地址 %s", (address) => expect(isPublicApiAddress(address)).toBe(true));
  it("域名在连接时解析到内网地址也会被拒绝", async () => {
    vi.mocked(lookup).mockImplementation((_host, _options, callback) => { callback(null, [{ address: "127.0.0.1", family: 4 }]); });
    const callback = vi.fn();
    publicApiLookup("api.example.com", { all: true }, callback);
    expect(callback.mock.calls[0][0]).toMatchObject({ code: "INVALID_API_ADDRESS" });
  });
  it("连接使用本次校验后的解析结果", () => {
    const addresses = [{ address: "1.1.1.1", family: 4 }];
    vi.mocked(lookup).mockImplementation((_host, _options, callback) => { callback(null, addresses); });
    const callback = vi.fn(); publicApiLookup("api.example.com", { all: true }, callback);
    expect(callback).toHaveBeenCalledWith(null, addresses);
    expect(lookup).toHaveBeenCalledTimes(1);
  });
  it("直接使用内网 IP 时，在请求之前拒绝", async () => {
    await expect(publicApiRequest(new URL("http://127.0.0.1/v1/chat/completions"), "{}", "test-key", new AbortController().signal)).rejects.toMatchObject({ code: "INVALID_API_ADDRESS" });
    expect(lookup).not.toHaveBeenCalled();
  });
});
