import { describe, expect, it } from "vitest";
import { lessons, scenarios } from "@/lib/content";

describe("课程与场景内容", () => {
  it("包含六节课程与十二个可运行场景", () => {
    expect(lessons).toHaveLength(6);
    expect(scenarios).toHaveLength(12);
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
