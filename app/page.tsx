import Image from "next/image";
import Link from "next/link";
import ArrowRight from "reicon-react/icons/ArrowRight";
import ArrowUpRight from "reicon-react/icons/ArrowUpRight";
import { PromptAnatomy } from "@/components/prompt-anatomy";
import { LessonArt } from "@/components/lesson-art";
import { CategoryIcon } from "@/components/category-icon";
import { lessons, scenarios } from "@/lib/content";

const steps = [
  ["看清任务", "明确业务目标、材料和不适用范围。"],
  ["写出结构", "用六部分组织 Prompt，而不是堆砌形容词。"],
  ["控制变量", "一次只调整 Prompt、参数或提示技术。"],
  ["观察结果", "比较输出结构、差异、耗时与 Token 用量。"],
];

export default function Home() {
  return <>
    <section className="hero shell">
      <div className="hero-copy">
        <p className="hero-kicker">学一点，动手试一点。</p>
        <h1>把想法<span className="hand-underline">说清楚</span>。<br />让 AI 帮你做好。</h1>
        <p className="hero-text">从真实任务出发，学会写提示词。<br />在一次次小实验里，找到更好的方法。</p>
        <div className="actions">
          <Link className="button" href="/learn">从第一课开始 <ArrowUpRight size={20} aria-hidden="true" /></Link>
          <Link className="text-link" href="/scenarios">探索业务场景 <ArrowRight size={20} aria-hidden="true" /></Link>
        </div>
      </div>
      <div className="hero-art">
        <Image src="/illustrations/prompt-workshop.png" alt="零散想法经过提示词工作台，变成清晰、有结构的输出" width={1536} height={1024} sizes="(max-width: 800px) 95vw, 55vw" loading="eager" fetchPriority="high" />
      </div>
    </section>

    <section className="learning-strip shell" aria-labelledby="learning-process">
      <h2 id="learning-process">从理解到实践</h2>
      <ol>{steps.map(([title, description], index) => <li key={title}><span title={description}>{title}</span>{index < steps.length - 1 && <ArrowRight size={18} aria-hidden="true" />}</li>)}</ol>
    </section>

    <section className="section shell home-lessons">
      <div className="section-heading split"><div><h2>先从一节小课开始</h2><p>{lessons.length} 节课程，从基础到研究与应用。</p></div><Link className="text-link" href="/learn">查看完整学习路径 <ArrowUpRight size={18} aria-hidden="true" /></Link></div>
      <div className="lesson-preview-grid">
        {lessons.slice(0, 3).map((lesson, index) => <article className={index === 0 ? "lesson-preview featured" : "lesson-preview"} key={lesson.slug}>
          <LessonArt index={index} />
          <div><p className="meta">第 0{index + 1} 课 · {lesson.minutes} 分钟</p><h3><Link href={`/learn/${lesson.slug}`}>{lesson.title}</Link></h3>{index === 0 && <><p className="lesson-intro">先理解模型，再提出好问题。</p><Link className="text-link" href={`/learn/${lesson.slug}`}>进入课程 <ArrowUpRight size={18} aria-hidden="true" /></Link></>}</div>
          {index > 0 && <Link className="icon-button" href={`/learn/${lesson.slug}`} aria-label={`进入课程：${lesson.title}`}><ArrowRight size={22} aria-hidden="true" /></Link>}
        </article>)}
      </div>
    </section>

    <section className="scenario-strip shell">
      <h2>带着你的问题，来练习。</h2>
      <div className="category-row">{[...new Set(scenarios.map((s) => s.category))].map((category) => <Link key={category} href={`/scenarios?category=${encodeURIComponent(category)}`}><CategoryIcon category={category} size={17} />{category}</Link>)}</div>
    </section>

    <section className="section shell anatomy-section">
      <div className="section-heading"><h2>每个 Prompt，先过六部分检查</h2><p>信息够用即可。明确、可检查，比“越长越好”更重要。</p></div>
      <PromptAnatomy />
    </section>
    <section className="shell callout">
      <div><h2>没有 API Key，也能开始。</h2><p>先用标注清楚的演示结果熟悉流程，再连接你的模型服务。</p></div>
      <Link className="button ink" href="/playground">开始实验 <ArrowUpRight size={20} aria-hidden="true" /></Link>
    </section>
  </>;
}
