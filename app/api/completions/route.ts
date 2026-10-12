import { NextResponse } from "next/server";
import { complete } from "@/lib/llm/client";
import { LlmError } from "@/lib/llm/types";
import { completionRequestSchema } from "@/lib/validation/completion-request";

export async function POST(request: Request) {
  const started = Date.now();
  try {
    if (Number(request.headers.get("content-length") ?? "0") > 30000) return NextResponse.json({ error: "请求内容过大。" }, { status: 413 });
    const raw = await request.text();
    if (Buffer.byteLength(raw) > 30000) return NextResponse.json({ error: "请求内容过大。" }, { status: 413 });
    const { connection, ...input } = completionRequestSchema.parse(JSON.parse(raw));
    const output = await complete(input, connection);
    return NextResponse.json({ ...output, elapsedMs: Date.now() - started }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof LlmError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    return NextResponse.json({ error: "请求格式无效，请检查输入和参数。" }, { status: 400 });
  }
}
