import { describe, expect, it } from "vitest";
import { lessons, lessonTracks, scenarios } from "@/lib/content";

describe("课程与场景内容", () => {
  it("包含五组二十七节课程与十二个可运行场景", () => {
    expect(lessons).toHaveLength(27);
    expect(lessonTracks).toEqual(["基础入门", "核心技术", "研究进阶", "应用实践", "评测与安全"]);
    expect(scenarios).toHaveLength(12);
  });

  it("每节课程都有独立地址、练习和可追溯的参考来源", () => {
    expect(new Set(lessons.map((lesson) => lesson.slug)).size).toBe(lessons.length);
    for (const lesson of lessons) {
      expect(lesson.concepts.length).toBeGreaterThanOrEqual(3);
      expect(lesson.practice.trim()).not.toBe("");
      expect(lesson.weakPrompt).not.toBe(lesson.improvedPrompt);
      expect(lesson.sources.length).toBeGreaterThan(0);
      expect(new Set(lesson.sources.map((source) => source.url)).size).toBe(lesson.sources.length);
      for (const source of lesson.sources) {
        expect(source.title.trim()).not.toBe("");
        const url = new URL(source.url);
        expect(url.protocol).toBe("https:");
        expect(["www.promptingguide.ai", "arxiv.org"]).toContain(url.hostname);
      }
    }
  });

  it("每个场景都有可比较提示词、边界测试和三类实验", () => {
    for (const scenario of scenarios) {
      expect(scenario.weakPrompt).not.toBe(scenario.improvedPrompt);
      expect(scenario.testCases).toHaveLength(5);
      expect(scenario.improvedPrompt).toContain("{{");
      expect(scenario.experiments.map((experiment) => experiment.id)).toContain("prompt-comparison");
      expect(scenario.experiments.map((experiment) => experiment.id)).toContain("temperature-ablation");
      if (scenario.expectedFields?.length) expect(scenario.experiments.map((experiment) => experiment.id)).toContain("structured-output-ablation");
    }
  });
});
