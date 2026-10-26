import { notFound } from "next/navigation";
import Link from "next/link";
import { findLesson, learningReference, lessons } from "@/lib/content";
import { PromptComparison } from "@/components/prompt-comparison";

export function generateStaticParams() { return lessons.map(({ slug }) => ({ slug })); }

export default async function LessonDetail({ params }: { params: Promise<{ slug: string }> }) {
  const lesson = findLesson((await params).slug);
  if (!lesson) notFound();
  const index = lessons.indexOf(lesson);
  const nextLesson = lessons[index + 1];

  return <article className="shell detail">
    <p className="breadcrumb"><Link href="/learn">学习路径</Link> / {lesson.unit}</p>
    <header className="detail-header">
      <p className="eyebrow">{lesson.unit} · {lesson.minutes} 分钟</p>
      <h1>{lesson.title}</h1>
      <p>{lesson.summary}</p>
      <a className="text-link" href="#sources">查看本课出处 ↓</a>
    </header>
    <div className="detail-layout">
      <div>
        <h2>本课学会什么</h2>
        <ul>{lesson.goals.map((goal) => <li key={goal}>{goal}</li>)}</ul>
        <h2>关键概念</h2>
        {lesson.concepts.map((concept) => <section className="panel" key={concept.title}><h3>{concept.title}</h3><p>{concept.text}</p></section>)}
        <h2>同一个需求，两种写法</h2>
        <PromptComparison weak={lesson.weakPrompt} improved={lesson.improvedPrompt} />
        <section className="panel">
          <p className="eyebrow">动手练习</p>
          <h2>{lesson.practice}</h2>
          <p>文字提示可以送进实验室比较；涉及检索、工具执行、图片或训练的练习，请按本课说明准备相应环境。</p>
          <Link className="button small" href="/playground">打开实验室</Link>
        </section>
        <section className="panel lesson-sources" id="sources" aria-labelledby="sources-title">
          <p className="eyebrow">延伸阅读</p>
          <h2 id="sources-title">参考与出处</h2>
          <p>主要参考：{learningReference.publisher} · {learningReference.title}。以下链接对应本课章节或补充论文；知识点由本站归纳，提示词示例、练习及工程建议由本站编写。</p>
          <ul>{lesson.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title} ↗</a></li>)}</ul>
          {lesson.sourceNote && <p className="notice">{lesson.sourceNote}</p>}
          <p className="meta">资料核对：<time dateTime={learningReference.reviewedAt}>{learningReference.reviewedAt}</time></p>
        </section>
      </div>
      <aside className="sticky-note">
        <h3>本课检查</h3>
        <ol>{lesson.goals.map((goal) => <li key={goal}>{goal}</li>)}</ol>
        <hr />
        <Link className="text-link" href={nextLesson ? `/learn/${nextLesson.slug}` : "/scenarios"}>{nextLesson ? "下一课 →" : "开始业务案例 →"}</Link>
      </aside>
    </div>
  </article>;
}
