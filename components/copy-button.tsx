"use client";
import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
  const [status, setStatus] = useState("复制 Prompt");
  async function copy() {
    try { await navigator.clipboard.writeText(text); setStatus("已复制"); }
    catch { setStatus("复制失败，请手动选择"); }
    window.setTimeout(() => setStatus("复制 Prompt"), 1800);
  }
  return <button className="button secondary small" onClick={copy}>{status}</button>;
}
