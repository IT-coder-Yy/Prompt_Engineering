import Link from "next/link";
import ArrowUpRight from "reicon-react/icons/ArrowUpRight";
import { lessons } from "@/lib/content";
import { LessonArt } from "@/components/lesson-art";

export default function LearnPage() {
  return <div className="shell">
    <header className="page-head"><p className="eyebrow">六节主路径 · 约 70 分钟</p><h1>从概念到业务可用</h1><p>每一课都配有术语解释、前后对比、业务例子和一道能真正动手的练习。按顺序学，也可以从当前问题跳入。</p></header>
    <div className="lesson-grid">{lessons.map((lesson, index) => <article className="lesson-card" key={lesson.slug}>
      <LessonArt index={index} />
      <div><p className="meta">第 0{index + 1} 课 · {lesson.minutes} 分钟</p><h2>{lesson.title}</h2><p>{lesson.summary}</p><Link className="text-link" href={`/learn/${lesson.slug}`}>进入课程 <ArrowUpRight size={17} aria-hidden="true" /></Link></div>
    </article>)}</div>
  </div>;
}
