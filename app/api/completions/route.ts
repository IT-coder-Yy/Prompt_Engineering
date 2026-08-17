import { NextResponse } from "next/server";
import { complete } from "@/lib/llm/client";
import { LlmError } from "@/lib/llm/types";
import { completionRequestSchema } from "@/lib/validation/completion-request";
export async function POST(request: Request) {
  const started = Date.now();
  try { const length = Number(request.headers.get("content-length") ?? "0"); if (length > 30000) return NextResponse.json({ error: "请求内容过大。" }, { status: 413 }); const input = completionRequestSchema.parse(await request.json()); const output = await complete(input); return NextResponse.json({ ...output, elapsedMs: Date.now() - started }); }
  catch (error) { if (error instanceof LlmError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status }); return NextResponse.json({ error: "请求格式无效，请检查输入和参数。" }, { status: 400 }); }
}
