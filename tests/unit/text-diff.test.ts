import { describe, expect, it } from "vitest";
import { compareText, normalizedJsonPair } from "@/lib/text-diff";

describe("差异审阅", () => {
  it.each([
    ["", ""], ["", "新增\n"], ["删除\n", ""],
    ["共同\n旧内容\n尾部", "共同\n新内容\n尾部"],
    ["中文🙂\n\n重复\n重复\r\n", "中文🚀\n重复\n"],
    ["只有换行变化\n", "只有换行变化"],
  ])("行比较保留两侧全文，包括空行、Unicode 与换行 (%s)", (a, b) => {
    const { rows } = compareText(a, b);
    expect(rows.map((row) => row.a?.text ?? "").join("")).toBe(a);
    expect(rows.map((row) => row.b?.text ?? "").join("")).toBe(b);
    expect(rows.filter((row) => row.a).map((row) => row.a!.number)).toEqual(Array.from({ length: rows.filter((row) => row.a).length }, (_, i) => i + 1));
  });
  it("把增删配对，同时保留上下文", () => {
    const result = compareText("相同\n旧行\n结尾\n", "相同\n新行\n多一行\n结尾\n");
    expect(result.additions).toBe(2); expect(result.deletions).toBe(1);
    expect(result.rows.filter((row) => !row.changed)).toHaveLength(2);
  });
  it("JSON 忽略对象键顺序与缩进，但保留数组顺序及 __proto__ 字段", () => {
    const pair = normalizedJsonPair('{"b":[2,1],"a":{"z":0,"y":false},"__proto__":1}', '{"__proto__":1,"a":{"y":false,"z":0},"b":[2,1]}');
    expect(pair?.[0]).toBe(pair?.[1]);
    expect(pair?.[0]).toContain('"__proto__": 1');
    expect(normalizedJsonPair("[1,2]", "[2,1]")?.[0]).not.toBe(normalizedJsonPair("[1,2]", "[2,1]")?.[1]);
    expect(normalizedJsonPair("纯文本", "{}" )).toBeNull();
  });
  it("大量完全不同的行会降级展示，不能静默截断文本", () => {
    const a = Array.from({ length: 2200 }, (_, i) => `旧${i}\n`).join("");
    const b = Array.from({ length: 2200 }, (_, i) => `新${i}\n`).join("");
    const result = compareText(a, b);
    expect(result.simplified).toBe(true);
    expect(result.rows.map((row) => row.b?.text ?? "").join("")).toBe(b);
  });
});
