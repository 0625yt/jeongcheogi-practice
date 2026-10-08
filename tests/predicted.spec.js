import { test, expect } from "@playwright/test";

async function openWorkbook(page, n) {
  await page.goto("./");
  await page.getByRole("button", { name: "회차", exact: true }).click();
  await page
    .getByRole("complementary", { name: "회차 선택" })
    .getByRole("button", { name: new RegExp(`예상 기출문제 ${n}`) })
    .click();
}

test("all five workbooks retain 20 navigable questions and numbered code rows", async ({
  page,
}, info) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await openWorkbook(page, 1);
  for (let n = 1; n <= 5; n++) {
    if (n > 1)
      await page
        .getByRole("complementary", { name: "회차 선택" })
        .getByRole("button", { name: new RegExp(`예상 기출문제 ${n}`) })
        .click();
    await expect(page.locator(".topbar p")).toContainText(`예상 기출문제 ${n}`);
    await expect(page.locator(".originBadge")).toHaveText("예상 · 창작");
    const nav = page.getByRole("navigation", { name: "문제 목록" });
    await expect(nav.locator(".numberGrid button")).toHaveCount(20);
    if (info.project.name === "phone") {
      const panel = await nav.boundingBox();
      const first = await nav
        .getByRole("button", { name: /^1번째 문제,/ })
        .boundingBox();
      const last = await nav
        .getByRole("button", { name: /^20번째 문제,/ })
        .boundingBox();
      expect(first.y).toBeGreaterThanOrEqual(panel.y);
      expect(last.y + last.height).toBeLessThanOrEqual(panel.y + panel.height);
    }
    await nav.getByRole("button", { name: /^7번째 문제,/ }).click();
    await expect(
      page.getByRole("heading", { name: "7번 문제", exact: true }),
    ).toBeVisible();
    const aligned = await page.locator(".sourceLine").evaluateAll((rows) =>
      rows.every((row) => {
        const n = row.querySelector(".lineNumber").getBoundingClientRect();
        const c = row.querySelector("code").getBoundingClientRect();
        return n.top === c.top && n.height === c.height;
      }),
    );
    expect(aligned).toBeTruthy();
    await nav.getByRole("button", { name: /^20번째 문제,/ }).click();
    await expect(
      page.getByRole("heading", { name: "20번 문제", exact: true }),
    ).toBeVisible();
    await expect(nav).toBeVisible();
    await page
      .getByRole("button", { name: "정답 및 풀이", exact: true })
      .click();
    await expect(page.locator(".originalSolution")).toContainText("풀이");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
  }
  expect(errors).toEqual([]);
  await page.screenshot({
    path: `test-results/${info.project.name}-predicted-workbook.png`,
    fullPage: false,
  });
});

test("predicted explanation shows actual mutations, saves answers and links to genuine evidence", async ({
  page,
}, info) => {
  await openWorkbook(page, 1);
  await page.getByLabel("내 답안").fill("2 11 9");
  await page.getByRole("button", { name: "정답 및 풀이", exact: true }).click();
  await page.getByRole("button", { name: "전체 흐름", exact: true }).click();
  await expect(page.locator(".answerTextBlock")).toHaveText("2 11 9");
  await expect(page.locator(".stateChange")).toContainText([
    "a",
    "p",
    "x",
    "a[1]",
    "p",
  ]);
  await page.screenshot({
    path: `test-results/${info.project.name}-predicted-flow.png`,
    fullPage: false,
  });
  await page.reload();
  await expect(page.getByLabel("내 답안")).toHaveValue("2 11 9");
  await page.locator(".predictionAnalysis summary").click();
  await expect(page.locator(".predictionAnalysis")).toContainText(
    "100문항 중 코드 문항은 40개",
  );
  await page.locator(".predictionEvidence summary").click();
  const evidence = page.locator(".predictionEvidence button").first();
  const name = await evidence.innerText();
  await evidence.click();
  await expect(page.locator(".topbar p")).toContainText(
    name.replace(/ \d+번/, ""),
  );
  await expect(page.locator(".predictionContext")).toHaveCount(0);
});

test("predicted timed mode uses fixed questions, hides answers and survives reload", async ({
  page,
}) => {
  await openWorkbook(page, 3);
  await page
    .getByRole("button", { name: "150분 실전 모드", exact: true })
    .click();
  await expect(page.locator("#blueprint")).toHaveValue("예상-3");
  await page
    .getByRole("button", { name: "모의시험 시작", exact: true })
    .click();
  await expect(page.locator(".mockStatus")).toContainText(
    "예상 기출문제 3 · 예상 문제",
  );
  await expect(page.getByRole("timer")).toContainText("02:30:");
  await expect(page.locator(".solution")).toHaveCount(0);
  await page.getByLabel("내 답안", { exact: true }).fill("4");
  await page.reload();
  await expect(page.getByLabel("내 답안", { exact: true })).toHaveValue("4");
  const keys = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("engineer-mock-exam-v1")).session.keys,
  );
  expect(keys).toEqual(Array.from({ length: 20 }, (_, i) => `예상-3-${i + 1}`));
  await page.getByRole("button", { name: "제출", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "제출 확정", exact: true })
    .click();
  await page.getByRole("button", { name: "정답 및 풀이", exact: true }).click();
  await expect(page.locator(".answerTextBlock")).toHaveText("4");
});
