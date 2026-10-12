import { ScenarioBrowser } from "@/components/scenario-browser";
import { templateCategories } from "@/lib/content";

export default async function ScenariosPage({ searchParams }: { searchParams: Promise<{ category?: string | string[] }> }) {
  const value = (await searchParams).category;
  const category = typeof value === "string" && templateCategories.includes(value) ? value : "全部";
  return <div className="shell"><header className="page-head"><p className="eyebrow">六类业务 · 十二个案例</p><h1>别找万能 Prompt，先拆真实任务</h1><p>每个案例都包括差 Prompt 诊断、可编辑模板、测试样本、验收标准和风险边界。</p></header><ScenarioBrowser key={category} initialCategory={category} /></div>;
}
