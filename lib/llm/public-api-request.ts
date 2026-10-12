import { lookup } from "node:dns";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { BlockList, isIP, type LookupFunction } from "node:net";
import { LlmError } from "./types";

const blocked = new BlockList();
for (const [address, prefix] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8],
  ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24],
  ["192.88.99.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24],
  ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4],
] as const) blocked.addSubnet(address, prefix, "ipv4");
blocked.addAddress("168.63.129.16", "ipv4");
blocked.addSubnet("2001::", 23, "ipv6");
blocked.addSubnet("2001:db8::", 32, "ipv6");
blocked.addSubnet("2002::", 16, "ipv6");
const globalV6 = new BlockList();
globalV6.addSubnet("2000::", 3, "ipv6");

export function isPublicApiAddress(address: string) {
  const family = isIP(address);
  return family === 4 ? !blocked.check(address, "ipv4") : family === 6 && globalV6.check(address, "ipv6") && !blocked.check(address, "ipv6");
}

const blockedAddressError = () => new LlmError("INVALID_API_ADDRESS", "页面配置仅支持公网 API 地址。本地或内网模型请使用服务器环境变量配置。", 400);

// 在实际连接的 DNS lookup 中校验地址，避免校验后再次解析导致 DNS 重绑定。
export const publicApiLookup: LookupFunction = (hostname, options, callback) => {
  lookup(hostname, { all: true, family: options.family }, (error, addresses) => {
    if (error) { callback(error, ""); return; }
    if (!addresses.length || addresses.some(({ address }) => !isPublicApiAddress(address))) { callback(blockedAddressError(), ""); return; }
    if (options.all) callback(null, addresses);
    else callback(null, addresses[0].address, addresses[0].family);
  });
};

export async function publicApiRequest(url: URL, body: string, apiKey: string, signal: AbortSignal): Promise<Response> {
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || (isIP(hostname) && !isPublicApiAddress(hostname))) throw blockedAddressError();
  return new Promise((resolve, reject) => {
    const request = (url.protocol === "https:" ? httpsRequest : httpRequest)(url, {
      method: "POST", signal, lookup: publicApiLookup, agent: false,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}`, "Content-Length": Buffer.byteLength(body) },
    }, (response) => {
      const chunks: Buffer[] = [];
      let size = 0;
      response.on("data", (chunk: Buffer) => {
        size += chunk.length;
        if (size > 1_000_000) response.destroy(new LlmError("RESPONSE_TOO_LARGE", "模型返回内容过大，请减少输出长度。"));
        else chunks.push(chunk);
      });
      response.on("error", reject);
      response.on("end", () => {
        const status = response.statusCode ?? 502;
        resolve(new Response([204, 205, 304].includes(status) ? null : Buffer.concat(chunks), { status }));
      });
    });
    // 原生 request 不跟随重定向，密钥不会被转发给另一个地址。
    request.on("error", reject);
    request.end(body);
  });
}
