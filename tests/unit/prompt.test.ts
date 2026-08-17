import { describe, expect, it } from "vitest";
import { fillPrompt, extractVariables } from "@/lib/prompt";
import { inspectJson } from "@/lib/evaluation";
import { completionRequestSchema } from "@/lib/validation/completion-request";
describe("Prompt 工具", () => { it("替换变量但保留空变量", () => expect(fillPrompt("任务：{{task}}；资料：{{source}}", { task: "总结" })).toBe("任务：总结；资料：{{source}}")); it("提取去重变量", () => expect(extractVariables("{{a}} {{b}} {{a}}")).toEqual(["a", "b"])); it("检查结果 JSON", () => expect(inspectJson('{"summary":"x","key_points":[],"missing_information":[],"review_note":"x"}')).toEqual({ valid: true, missing: [] })); it("接受可选模型参数", () => expect(completionRequestSchema.parse({ system: "系统", prompt: "任务", topP: 0.8, stop: ["END"], frequencyPenalty: 0.2, presencePenalty: 0.3 })).toMatchObject({ topP: 0.8, stop: ["END"], frequencyPenalty: 0.2, presencePenalty: 0.3 })); });
