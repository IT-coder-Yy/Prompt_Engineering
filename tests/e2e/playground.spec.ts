import { test, expect, type Page } from "@playwright/test";

const runButton = (page: Page) => page.getByRole("button", { name: /运行本轮实验/ });
async function blank(page: Page) {
  await page.goto("/playground?scenario=__custom__");
  await page.getByRole("textbox", { name: "A Prompt", exact: true }).fill("A 基础指令");
  await page.getByRole("textbox", { name: "B Prompt", exact: true }).fill("B 改进指令");
  await page.getByRole("textbox", { name: "用户任务 / 问题 / 材料" }).fill("共享材料：下周交付。");
}

test("共享材料替换示例，深链接预设与真实发送参数一致", async ({ page }) => {
  const requests: Array<{ prompt: string; temperature: number }> = [];
  await page.addInitScript(() => sessionStorage.setItem("playground-input:办公-a", JSON.stringify({ meeting_notes: "来自案例页的材料" })));
  await page.route("**/api/completions", (route) => {
    requests.push(route.request().postDataJSON());
    return route.fulfill({ json: { content: '{"actions":[],"open_questions":[]}', demo: true } });
  });
  await page.goto("/playground?scenario=办公-a&experiment=temperature-ablation");
  await expect(page.getByRole("combobox", { name: "预设实验" })).toHaveValue("temperature-ablation");
  await expect(page.getByRole("textbox", { name: "会议记录（必填）" })).toHaveValue("来自案例页的材料");
  await page.getByRole("textbox", { name: "会议记录（必填）" }).fill("新材料：负责人待确认。");
  await runButton(page).click();
  await expect(page.getByText("本轮已完成", { exact: true })).toBeVisible();
  expect(requests).toHaveLength(2);
  expect(requests.map((item) => item.temperature).sort()).toEqual([0.1, 0.9]);
  expect(requests[0].prompt).toBe(requests[1].prompt);
  for (const item of requests) { expect(item.prompt.match(/新材料：负责人待确认。/g)).toHaveLength(1); expect(item.prompt).not.toContain("王琳"); expect(item.prompt).not.toContain("来自案例页"); }
});

test("技术配置即时应用，手工内容必须明确替换，场景草稿可恢复", async ({ page }) => {
  await page.goto("/playground");
  await page.getByRole("combobox", { name: "实验模式" }).selectOption("single");
  await expect(page.getByRole("textbox", { name: "少样本示例", exact: true })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "方向关键词" })).toHaveCount(0);
  await page.getByRole("combobox", { name: "提示技术", exact: true }).selectOption("structured");
  await page.getByRole("textbox", { name: "结构化字段", exact: true }).fill("summary, evidence");
  await expect(page.getByRole("textbox", { name: "B Prompt", exact: true })).toHaveValue(/字段为：summary, evidence/);
  await expect(page.getByRole("textbox", { name: "A Prompt", exact: true })).not.toHaveValue(/输出 JSON/);
  await page.getByRole("textbox", { name: "A Prompt", exact: true }).fill("保留我的手工写法");
  await page.getByRole("combobox", { name: "实验模式" }).selectOption("preset");
  await expect(page.getByRole("region", { name: "确认替换手工编辑" })).toBeVisible();
  await expect(runButton(page)).toBeDisabled();
  await page.getByRole("button", { name: "保留当前编辑" }).click();
  await expect(page.getByRole("textbox", { name: "A Prompt", exact: true })).toHaveValue("保留我的手工写法");
  await page.getByRole("button", { name: "空白实验 ＋" }).click();
  await page.getByRole("button", { name: "应用并替换" }).click();
  await expect(page.getByRole("textbox", { name: "A Prompt", exact: true })).toHaveValue("");
  await page.getByRole("combobox", { name: "业务场景" }).selectOption("办公-a");
  await expect(page.getByRole("textbox", { name: "A Prompt", exact: true })).toHaveValue("保留我的手工写法");
});

test("部分结果立即可见，失败侧按原快照重试，编辑草稿不污染结果", async ({ page }) => {
  let releaseB!: () => void;
  const gate = new Promise<void>((resolve) => { releaseB = resolve; });
  const bodies: Array<{ prompt: string }> = [];
  let bCalls = 0;
  await page.route("**/api/completions", async (route) => {
    const body = route.request().postDataJSON(); bodies.push(body);
    if (body.prompt.startsWith("B")) {
      bCalls++;
      if (bCalls === 1) { await gate; return route.fulfill({ status: 503, json: { error: "模拟 B 暂时失败" } }); }
      return route.fulfill({ json: { content: "共同内容\n新的结论\n<script>文本不是脚本</script>", demo: false, model: "测试模型", elapsedMs: 20, usage: { totalTokens: 0 } } });
    }
    return route.fulfill({ json: { content: "共同内容\n旧的结论", demo: false, model: "测试模型" } });
  });
  await blank(page);
  await page.getByText("任务验收要求", { exact: true }).click();
  await page.getByRole("textbox", { name: "人工验收项（每行一项）" }).fill("不编造日期");
  await runButton(page).click();
  await expect(page.getByText("旧的结论", { exact: false })).toBeVisible();
  await expect(page.getByText("已返回 1 / 2", { exact: true })).toBeVisible();
  releaseB();
  await expect(page.getByText("模拟 B 暂时失败", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "配置实验", exact: true }).click();
  await page.getByRole("textbox", { name: "B Prompt", exact: true }).fill("B 新草稿不应进入重试");
  await page.getByRole("textbox", { name: "用户任务 / 问题 / 材料" }).fill("新材料也不进入重试");
  await page.getByRole("button", { name: "查看结果 · 已返回", exact: true }).click();
  await page.getByRole("button", { name: "仅重试 B 第 1 次" }).click();
  const diff = page.getByRole("region", { name: "输出差异", exact: true });
  await expect(diff.locator(".diff-added").first()).toBeVisible();
  await expect(diff.locator(".diff-removed").first()).toBeVisible();
  await expect(diff.locator("script")).toHaveCount(0);
  expect(bodies).toHaveLength(3); expect(bodies[2]).toEqual(bodies[1]);
  await expect(page.getByText("草稿已修改，尚未重新运行。", { exact: false })).toBeVisible();
  await expect(page.getByRole("region", { name: "A 运行状态" }).getByText("未提供", { exact: true })).toHaveCount(2);
  await expect(page.getByRole("region", { name: "B 运行状态" }).getByText("0", { exact: true })).toBeVisible();
  await page.getByRole("combobox", { name: "A：不编造日期", exact: true }).press("ArrowDown");
  await page.getByRole("button", { name: "原始输出", exact: true }).click();
  await expect(page.getByRole("combobox", { name: "A：不编造日期", exact: true })).toHaveValue("pass");
});

test("多次采样逐对显示，JSON 格式化和原文切换都保留真实内容", async ({ page }) => {
  const count = { a: 0, b: 0 };
  await page.route("**/api/completions", (route) => {
    const side = route.request().postDataJSON().prompt.startsWith("A") ? "a" : "b";
    const n = ++count[side];
    return route.fulfill({ json: { content: side === "a" ? `{"z":${n},"a":true}` : `{ "a": true, "z": ${n} }`, demo: true } });
  });
  await blank(page);
  await page.getByRole("combobox", { name: "每组独立采样次数" }).selectOption("2");
  await runButton(page).click();
  await expect(page.getByText("本轮已完成", { exact: true })).toBeVisible();
  await page.getByRole("combobox", { name: "采样配对" }).selectOption("1");
  const diff = page.getByRole("region", { name: "输出差异", exact: true });
  await expect(diff.getByText("格式化后的 JSON 内容相同。", { exact: true })).toBeVisible();
  await diff.getByLabel("格式化 JSON", { exact: true }).uncheck();
  await expect(diff.locator(".diff-added")).toHaveCount(1);
  await page.getByRole("button", { name: "原始输出", exact: true }).click();
  await expect(page.locator(".raw-output").filter({ visible: true }).first()).toHaveText('{"z":2,"a":true}');
  expect(count).toEqual({ a: 2, b: 2 });
});

test("手机工作区、差异导航和长文本不会溢出，验收可以键盘操作", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const lines = Array.from({ length: 20 }, (_, i) => "相同的中文行 " + i);
  await page.route("**/api/completions", (route) => {
    const result = [...lines];
    if (route.request().postDataJSON().prompt.startsWith("B")) { result[4] = "新内容".repeat(150); result[15] = "另一处变化"; }
    return route.fulfill({ json: { content: result.join("\n"), demo: true } });
  });
  await blank(page);
  await runButton(page).click();
  await expect(page.getByRole("region", { name: "实验配置", exact: true })).not.toBeVisible();
  const diff = page.getByRole("region", { name: "输出差异", exact: true });
  await expect(diff).toBeVisible();
  await diff.getByRole("button", { name: "输出差异：下一处变化" }).click();
  await expect(diff.locator("[data-diff-row='4']")).toBeFocused();
  await diff.getByRole("button", { name: "输出差异：下一处变化" }).click();
  await expect(diff.locator("[data-diff-row='15']")).toBeFocused();
  await diff.getByLabel("只看差异", { exact: true }).check();
  await expect(diff.locator(".diff-equal-row")).toHaveCount(0);
  await diff.getByLabel("只看差异", { exact: true }).uncheck();
  await diff.getByLabel("展开未变内容", { exact: true }).check();
  await expect(diff.locator(".diff-equal-row")).toHaveCount(18);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const button = await runButton(page).boundingBox();
  expect(button?.y).toBeGreaterThanOrEqual(0); expect(button!.y + button!.height).toBeLessThan(844);
  await page.getByRole("button", { name: "配置实验", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "A Prompt", exact: true })).toHaveValue("A 基础指令");
  await expect(page.getByRole("region", { name: "实验结果", exact: true })).not.toBeVisible();
});
