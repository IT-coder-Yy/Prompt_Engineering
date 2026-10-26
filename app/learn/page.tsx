import Link from "next/link";
import ArrowUpRight from "reicon-react/icons/ArrowUpRight";
import { furtherReading, lessons, lessonTracks } from "@/lib/content";
import { LessonArt } from "@/components/lesson-art";

export default function LearnPage() {
  return <div className="shell">
    <header className="page-head">
      <p className="eyebrow">{lessons.length} 节课程 · 约 {lessons.reduce((total, lesson) => total + lesson.minutes, 0)} 分钟</p>
      <h1>从概念到业务可用</h1>
      <p>从入门到研究与应用，每课都有关键概念、Prompt 对比、动手练习和具体出处。可以按顺序学，也可以从当前问题跳入。</p>
    </header>
    <nav className="category-row learning-nav" aria-label="课程分组">
      {lessonTracks.map((track, index) => <a key={track} href={`#track-${index}`}>{track} · {lessons.filter((lesson) => lesson.track === track).length}</a>)}
    </nav>
    {lessonTracks.map((track, trackIndex) => <section className="learning-track" id={`track-${trackIndex}`} key={track} aria-labelledby={`track-title-${trackIndex}`}>
      <h2 id={`track-title-${trackIndex}`}>{track}</h2>
      <div className="lesson-grid">{lessons.filter((lesson) => lesson.track === track).map((lesson) => {
        const index = lessons.indexOf(lesson);
        return <article className="lesson-card" key={lesson.slug}>
          <LessonArt index={index} />
          <div><p className="meta">第 {String(index + 1).padStart(2, "0")} 课 · {lesson.minutes} 分钟</p><h3>{lesson.title}</h3><p>{lesson.summary}</p><Link className="text-link" href={`/learn/${lesson.slug}`}>进入课程 <ArrowUpRight size={17} aria-hidden="true" /></Link></div>
        </article>;
      })}</div>
    </section>)}
    <section className="panel learning-resources" aria-labelledby="reading-title">
      <h2 id="reading-title">继续阅读原指南</h2>
      <p>课程覆盖主要提示技术、应用与风险。模型专题、研究动态和工具目录可从这些原文入口继续查阅，使用前留意各条目的发布时间。</p>
      <ul>{furtherReading.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title} ↗</a></li>)}</ul>
    </section>
  </div>;
}
