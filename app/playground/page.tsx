import { Suspense } from "react";
import { Playground } from "@/components/playground";
export default function PlaygroundPage() { return <div className="shell playground"><header className="page-head"><p className="eyebrow">PROMPT 实验室</p><h1>看见变化，再判断效果。</h1><p>用同一份材料运行 A / B，审阅内容差异，再检查它是否更符合任务。</p></header><Suspense fallback={<p className="loading">正在加载实验室…</p>}><Playground /></Suspense></div> }
