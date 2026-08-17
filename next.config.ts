import type { NextConfig } from "next";

// Node 26 与当前 Next 的 TypeScript CLI 配置解析存在兼容问题；
// 类型检查仍由 `npm run typecheck` 在构建前独立执行。
const nextConfig: NextConfig = { typescript: { ignoreBuildErrors: true } };

export default nextConfig;
