import { describe, expect, it } from "vitest";
import { createDraft, generateDesign, resolvePrompt, draftError, completionInput, parameterChanges } from "@/lib/experiment";
import { scenarios } from "@/lib/content";
import { inspectJson } from "@/lib/evaluation";

describe("实验配置与实际请求", () => {
  it("所有场景预设都可运行，且参数消融只改变温度", () => {
    for (const scenario of scenarios) for (const preset of scenario.experiments) {
      const draft = createDraft(scenario.slug, preset.id);
      expect(draftError(draft), scenario.slug + preset.id).toBeNull();
      if (preset.kind === "parameter") {
        expect(resolvePrompt(draft, "a")).toBe(resolvePrompt(draft, "b"));
        expect(parameterChanges(draft.a.parameters, draft.b.parameters)).toEqual(["随机性（Temperature）：0.1 → 0.9"]);
      }
    }
  });
  it("替换共享材料后两侧都不残留示例；模板没引用的材料也会被传入", () => {
    const draft = createDraft("办公-a", undefined, { meeting_notes: "唯一的新会议材料" });
    for (const side of ["a", "b"] as const) {
      const prompt = resolvePrompt(draft, side);
      expect(prompt.match(/唯一的新会议材料/g)).toHaveLength(1);
      expect(prompt).not.toContain("王琳");
    }
    draft.a.prompt = "请简要总结。";
    expect(resolvePrompt(draft, "a")).toContain("唯一的新会议材料");
  });
  it("结构化单项实验没有互相冲突的旧字段要求", () => {
    const draft = generateDesign({ ...createDraft("办公-a"), mode: "single", technique: "structured", fields: "summary, evidence" });
    expect(draft.a.prompt).not.toContain("输出 JSON");
    expect(draft.b.prompt).toContain("字段为：summary, evidence");
    expect(draft.b.prompt).not.toContain("open_questions");
    expect(draft.expectedFields).toBe("summary, evidence");
  });
  it("空白实验不默认要求 JSON，共享材料只附加一次", () => {
    const draft = createDraft("__custom__");
    expect(draft.checkJson).toBe(false); expect(draftError(draft)).toContain("Prompt");
    draft.a.prompt = "总结"; draft.b.prompt = "分点总结"; draft.task = "待处理材料";
    expect(draftError(draft)).toBeNull();
    expect(completionInput(draft, "b").prompt.match(/待处理材料/g)).toHaveLength(1);
  });
  it("缺示例、矛盾技术、缺变量和越界参数都不能发送", () => {
    const base = createDraft();
    expect(draftError(generateDesign({ ...base, mode: "single", technique: "few-shot", examples: "" }))).toContain("少样本");
    expect(draftError(generateDesign({ ...base, mode: "combo", combo: ["few-shot", "zero-shot"] }))).toContain("不能同时");
    expect(draftError({ ...base, a: { ...base.a, prompt: "{{unknown}}" } })).toContain("unknown");
    expect(draftError({ ...base, a: { ...base.a, parameters: { ...base.a.parameters, temperature: 3 } } })).toContain("temperature");
  });
  it("JSON 语法与字段要求分别检查，不把继承属性当成字段", () => {
    expect(inspectJson("null", ["actions"])).toEqual({ valid: true, missing: ["actions"] });
    expect(inspectJson("[]", [])).toEqual({ valid: true, missing: [] });
    expect(inspectJson("{}", ["toString"])).toEqual({ valid: true, missing: ["toString"] });
  });
});
