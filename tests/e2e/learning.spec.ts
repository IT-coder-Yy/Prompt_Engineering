import { test, expect } from "@playwright/test";
import { lessons } from "../../lib/content";

test("学习路径可进入课程", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /把想法说清楚/ })).toBeVisible();
  await page.getByRole("link", { name: "从第一课开始" }).click();
  await page.getByRole("link", { name: "进入课程" }).first().click();
  await expect(page.getByText("同一个需求，两种写法")).toBeVisible();
  await page.getByRole("link", { name: "查看本课出处 ↓" }).click();
  await expect(page.getByRole("heading", { name: "参考与出处" })).toBeVisible();
  await expect(page.locator("#sources")).toContainText("DAIR.AI");
});

test("扩充课程分组、编号、出处和前后衔接完整", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/learn");
  await expect(page.getByRole("link", { name: "进入课程" })).toHaveCount(27);
  await expect(page.getByText("27 节课程", { exact: false })).toContainText(`${lessons.reduce((sum, lesson) => sum + lesson.minutes, 0)} 分钟`);
  await expect(page.getByText("第 10 课", { exact: false })).toBeVisible();
  await page.getByRole("navigation", { name: "课程分组" }).getByRole("link", { name: "研究进阶", exact: false }).click();
  await expect(page).toHaveURL(/#track-2$/);
  for (const [index, lesson] of lessons.entries()) {
    await page.goto(`/learn/${lesson.slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(lesson.title);
    const sources = page.getByRole("region", { name: "参考与出处" });
    await expect(sources.getByRole("link")).toHaveCount(lesson.sources.length);
    for (const source of lesson.sources) {
      await expect(sources.getByRole("link", { name: `${source.title} ↗`, exact: true })).toHaveAttribute("href", source.url);
    }
    const nextLesson = lessons[index + 1];
    await expect(page.getByRole("link", { name: nextLesson ? "下一课 →" : "开始业务案例 →" })).toHaveAttribute("href", nextLesson ? `/learn/${nextLesson.slug}` : "/scenarios");
  }
});

test("场景库可打开全部案例，旧模板链接会跳转", async ({ page }) => {
  await page.goto("/scenarios");
  await expect(page.getByRole("link", { name: "查看案例 →" })).toHaveCount(12);
  await page.getByRole("link", { name: "查看案例 →" }).first().click();
  await expect(page.getByRole("heading", { name: "会议纪要转行动项" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "推荐消融实验" })).toBeVisible();
  await expect(page.getByRole("link", { name: "上线检查" })).toHaveCount(0);
  await page.getByRole("link", { name: "运行此实验 →" }).first().click();
  await expect(page.getByRole("combobox", { name: "业务场景" })).toHaveValue("办公-a");
  await page.goto("/templates");
  await expect(page).toHaveURL(/\/scenarios$/);
  await expect(page.getByRole("heading", { name: /别找万能 Prompt/ })).toBeVisible();
});

test("实验室主动运行一轮对照组与实验组", async ({ page }) => {
  await page.route("**/api/completions", (route) => route.fulfill({ json: {
    content: '{"actions":[],"open_questions":["测试演示"]}', demo: true, model: "界面测试", elapsedMs: 20,
  } }));
  await page.goto("/playground");
  await page.getByRole("combobox", { name: "业务场景" }).selectOption("__custom__");
  await expect(page.getByRole("textbox", { name: "系统提示词" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "用户任务 / 问题 / 材料" })).toBeVisible();
  await page.getByRole("combobox", { name: "业务场景" }).selectOption("办公-a");
  await page.getByText("模型参数", { exact: true }).first().click();
  await page.getByRole("spinbutton", { name: "Max Length / 输出 Token" }).first().fill("80");
  await page.getByRole("button", { name: "运行本轮实验（调用模型 2 次）" }).click();
  await expect(page.getByRole("heading", { name: "对照组输出", exact: true })).toBeVisible({ timeout: 30000 });
  await expect(page.getByRole("heading", { name: "实验组输出", exact: true })).toBeVisible({ timeout: 30000 });
});

test("首页分类入口、搜索和空状态可以连贯使用", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "办公", exact: true }).click();
  await expect(page.getByRole("button", { name: "办公", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("link", { name: "查看案例 →" })).toHaveCount(2);
  await page.getByRole("searchbox", { name: "搜索场景" }).fill("会议");
  await expect(page.getByRole("link", { name: "查看案例 →" })).toHaveCount(1);
  await page.getByRole("searchbox", { name: "搜索场景" }).fill("没有这项任务");
  await expect(page.getByText("没有匹配的案例。", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "清除筛选" }).click();
  await expect(page.getByRole("link", { name: "查看案例 →" })).toHaveCount(12);
});

test("手机导航与明暗切换可用，主要页面不横向溢出", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await page.getByLabel("菜单", { exact: true }).click();
  await page.getByRole("navigation", { name: "移动导航" }).getByRole("link", { name: "学习", exact: true }).click();
  await expect(page.getByRole("heading", { name: "从概念到业务可用" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "移动导航" })).not.toBeVisible();
  await page.getByRole("button", { name: "切换明暗主题" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "切换明暗主题" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  for (const route of ["/", "/learn", "/scenarios", "/learn/model-and-prompt", "/learn/multimodal-and-graph", "/learn/context-engineering", "/scenarios/%E5%8A%9E%E5%85%AC-a", "/playground", "/setup"]) {
    await page.goto(route);
    await expect(page.locator("h1")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), route).toBe(true);
  }
});

test("页面保存 API 配置后刷新仍保留，实验立即使用，清除后恢复默认", async ({ page }) => {
  const requests: Array<{ connection?: { baseUrl: string; model: string; apiKey: string } }> = [];
  await page.route("**/api/completions", (route) => {
    const data = route.request().postDataJSON(); requests.push(data);
    return route.fulfill({ json: { content: "已使用测试连接", demo: false, model: data.connection?.model ?? "服务器默认模型", elapsedMs: 10 } });
  });
  await page.goto("/setup", { waitUntil: "domcontentloaded" });
  await page.getByRole("textbox", { name: "Base URL", exact: true }).fill("https://api.example.com/v1/");
  await page.getByRole("textbox", { name: "Model", exact: true }).fill("test-browser-model");
  await page.getByLabel("API Key", { exact: true }).fill("test-browser-key-only");
  await page.getByRole("button", { name: "保存配置", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("已保存");
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("textbox", { name: "Base URL", exact: true })).toHaveValue("https://api.example.com/v1");
  await expect(page.getByRole("textbox", { name: "Model", exact: true })).toHaveValue("test-browser-model");
  await expect(page.getByLabel("API Key", { exact: true })).toHaveAttribute("type", "password");
  await expect(page.getByLabel("API Key", { exact: true })).toHaveValue("test-browser-key-only");
  await page.getByRole("link", { name: "去实验室 →" }).click();
  await page.getByRole("button", { name: "运行本轮实验（调用模型 2 次）" }).click();
  await expect(page.getByRole("heading", { name: "对照组输出", exact: true })).toBeVisible();
  expect(requests).toHaveLength(2);
  for (const request of requests) expect(request.connection).toEqual({ baseUrl: "https://api.example.com/v1", model: "test-browser-model", apiKey: "test-browser-key-only" });
  await page.getByRole("link", { name: "API 配置", exact: true }).click();
  await page.getByRole("textbox", { name: "Model", exact: true }).fill("updated-model");
  await page.getByRole("button", { name: "保存配置", exact: true }).click();
  await page.getByRole("link", { name: "去实验室 →" }).click();
  await page.getByRole("button", { name: "运行本轮实验（调用模型 2 次）" }).click();
  await expect(page.getByRole("heading", { name: "对照组输出", exact: true })).toBeVisible();
  expect(requests.at(-1)?.connection?.model).toBe("updated-model");
  await page.getByRole("link", { name: "API 配置", exact: true }).click();
  await page.getByRole("button", { name: "清除已保存配置" }).click();
  await expect(page.getByLabel("API Key", { exact: true })).toHaveValue("");
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("textbox", { name: "Model", exact: true })).toHaveValue("");
  await page.getByRole("link", { name: "去实验室 →" }).click();
  await page.getByRole("button", { name: "运行本轮实验（调用模型 2 次）" }).click();
  await expect(page.getByRole("heading", { name: "对照组输出", exact: true })).toBeVisible();
  expect(requests.at(-1)?.connection).toBeUndefined();
});
