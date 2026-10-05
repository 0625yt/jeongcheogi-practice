import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("./");
});

test("panels stay open and never overlap the question", async ({
  page,
}, info) => {
  const numbers = page.getByRole("navigation", { name: "문제 목록" });
  await expect(numbers).toBeVisible();
  await numbers.getByRole("button", { name: /^2번째 문제,/ }).click();
  await expect(
    page.getByRole("heading", { name: "2번 문제", exact: true }),
  ).toBeVisible();
  await expect(numbers).toBeVisible();
  await numbers.getByRole("button", { name: /^1번째 문제,/ }).click();
  await page.getByRole("button", { name: "회차", exact: true }).click();
  await expect(
    page.getByRole("complementary", { name: "회차 선택" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /2025년 1회/ }).click();
  await expect(
    page.getByRole("complementary", { name: "회차 선택" }),
  ).toBeVisible();
  await expect(numbers).toBeVisible();
  const question = await page.locator(".questionCard").boundingBox();
  const nav = await numbers.boundingBox();
  expect(
    question.x + question.width <= nav.x + 1 ||
      question.y >= nav.y + nav.height - 1,
  ).toBeTruthy();
  await page.getByRole("button", { name: "문제 번호", exact: true }).click();
  await expect(numbers).toBeHidden();
  await page.getByRole("button", { name: "문제 번호", exact: true }).click();
  await expect(numbers).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: `test-results/${info.project.name}-panels.png`,
    fullPage: false,
  });
});

test("answers persist and grading in a filtered list does not skip a question", async ({
  page,
}) => {
  await page.getByRole("button", { name: "미풀이", exact: true }).click();
  await page.getByLabel("내 답안").fill("106.00");
  await page.getByRole("button", { name: "정답 및 풀이", exact: true }).click();
  await page.getByRole("button", { name: "틀렸어요", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "1번 문제", exact: true }),
  ).toBeAttached();
  await page.getByRole("button", { name: "다음 문제", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "2번 문제", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "이전 문제", exact: true }).click();
  await expect(page.getByLabel(/^내 답안/)).toHaveValue("106.00");
  await page.reload();
  await expect(page.getByLabel(/^내 답안/)).toHaveValue("106.00");
  await page.getByRole("button", { name: "회차", exact: true }).click();
  await page.getByRole("button", { name: /C 코드 문제/ }).click();
  await expect(page.locator(".recordStatus")).toHaveText("오답");
  await expect(page.getByLabel(/^내 답안/)).toHaveValue("106.00");
});

test("code rows stay aligned and explanations show concrete steps", async ({
  page,
}, info) => {
  const sizes = await page.locator(".sourceLine").evaluateAll((rows) =>
    rows.map((row) => {
      const n = row.querySelector(".lineNumber").getBoundingClientRect(),
        c = row.querySelector("code").getBoundingClientRect();
      return {
        numberTop: n.top,
        codeTop: c.top,
        numberHeight: n.height,
        codeHeight: c.height,
      };
    }),
  );
  expect(sizes.length).toBeGreaterThan(20);
  expect(
    sizes.every(
      (r) => r.numberTop === r.codeTop && r.numberHeight === r.codeHeight,
    ),
  ).toBeTruthy();
  await page.getByRole("button", { name: "정답 및 풀이", exact: true }).click();
  await expect(page.locator(".answerTextBlock")).toHaveText("106.00");
  await page.getByRole("button", { name: "다음 단계", exact: true }).click();
  await expect(page.locator(".stepLabel")).toHaveText("STEP 02");
  await page.getByRole("button", { name: "전체 흐름", exact: true }).click();
  await expect(page.locator(".traceRow")).toHaveCount(7);
  await page.screenshot({
    path: `test-results/${info.project.name}-explanation.png`,
    fullPage: false,
  });
});

test("bookmark and frequency filtering stay usable", async ({ page }) => {
  await page.getByRole("button", { name: "문제 북마크", exact: true }).click();
  await page.getByRole("button", { name: "북마크", exact: true }).click();
  await expect(page.locator(".numberGrid button")).toHaveCount(1);
  await page.locator(".frequencyInfo summary").click();
  await expect(page.locator(".frequencyInfo")).toContainText("20회차");
  await page.getByRole("button", { name: "문제 북마크", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "1번 문제", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "북마크", exact: true }).click();
  await expect(
    page.getByText("조건에 맞는 문제가 없습니다", { exact: true }),
  ).toBeVisible();
});

test("question diagrams load from durable local assets", async ({ page }) => {
  await page
    .getByRole("navigation", { name: "문제 목록" })
    .getByRole("button", { name: /^3번째 문제,/ })
    .click();
  const diagram = page.locator(".questionContent img").first();
  await diagram.scrollIntoViewIfNeeded();
  await expect(diagram).toHaveAttribute("src", /question-assets/);
  await expect
    .poll(() => diagram.evaluate((img) => img.complete && img.naturalWidth > 0))
    .toBeTruthy();
});

test("language list numbering and filtered exam numbers remain consistent", async ({
  page,
}) => {
  await page.getByRole("button", { name: "회차", exact: true }).click();
  await page.getByRole("button", { name: /C 코드 문제/ }).click();
  const numbers = page.getByRole("navigation", { name: "문제 목록" });
  await numbers.getByRole("button", { name: /^2번째 문제,/ }).click();
  await expect(
    page.getByRole("heading", { name: "2번 문제", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".topbar p")).toContainText("원문 12번");
  await expect(numbers.locator('button[aria-current="true"]')).toHaveText("2");
  await page
    .getByRole("complementary", { name: "회차 선택" })
    .getByRole("button", { name: /2026년 1회/ })
    .click();
  await numbers.getByRole("button", { name: /^1번째 문제,/ }).click();
  await page.getByRole("button", { name: "정답 및 풀이", exact: true }).click();
  await page.getByRole("button", { name: "틀렸어요", exact: true }).click();
  await page.getByRole("button", { name: "미풀이", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "2번 문제", exact: true }),
  ).toBeVisible();
  await expect(numbers.getByRole("button").nth(1)).toHaveText("2");
});

test("backup restores written answers and marks after a confirmed reset", async ({
  page,
}) => {
  await page.getByLabel("내 답안").fill("복원할 답안");
  await page.getByRole("button", { name: "문제 북마크", exact: true }).click();
  await page.getByRole("button", { name: "회차", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "백업", exact: true }).click();
  const file = await download;
  const path = await file.path();
  await page.getByRole("button", { name: "기록 초기화", exact: true }).click();
  await expect(page.getByLabel("내 답안")).toHaveValue("복원할 답안");
  await page.getByRole("button", { name: "모두 지우기", exact: true }).click();
  await expect(page.getByLabel("내 답안")).toHaveValue("");
  await page.locator('input[type="file"]').setInputFiles(path);
  await expect(page.getByLabel("내 답안")).toHaveValue("복원할 답안");
  await expect(
    page.getByRole("button", { name: "문제 북마크", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});
