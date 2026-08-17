import { test, expect } from "@playwright/test";

test("学习路径可进入课程", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /把“问模型”/ })).toBeVisible();
  await page.getByRole("link", { name: "从第一课开始" }).click();
  await page.getByRole("link", { name: "进入课程" }).first().click();
  await expect(page.getByText("同一个需求，两种写法")).toBeVisible();
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
