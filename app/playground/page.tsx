import { Suspense } from "react";
import { Playground } from "@/components/playground";
export default function PlaygroundPage() { return <div className="shell playground"><header className="page-head"><p className="eyebrow">非流式 · OpenAI-compatible</p><h1>一次只改一个变量，理解它为什么会变</h1><p>每轮实验同时运行对照组与实验组；查看原始输出、格式、耗时和 Token 用量，理解 Prompt、参数与提示技术的作用。</p></header><Suspense fallback={<p className="loading">正在加载实验室…</p>}><Playground /></Suspense></div> }
