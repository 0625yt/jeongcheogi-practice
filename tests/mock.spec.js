import { test, expect } from "@playwright/test";

async function startMock(page) {
  await page.goto("./");
  await page.getByRole("button", { name: "모의시험", exact: true }).click();
  await page
    .getByRole("button", { name: "모의시험 시작", exact: true })
    .click();
}

test("mock saves answers, conceals solutions, submits and preserves graded review", async ({
  page,
}, info) => {
  await startMock(page);
  await expect(page.getByRole("timer")).toContainText("02:29");
  await expect(
    page.getByRole("button", { name: "정답 및 풀이", exact: true }),
  ).toHaveCount(0);
  if(info.project.name === "phone") {
    const panel=await page.getByRole("navigation",{name:"모의시험 문제 목록"}).boundingBox();
    const last=await page.getByRole("navigation",{name:"모의시험 문제 목록"}).getByRole("button",{name:"20번 문제",exact:true}).boundingBox();
    expect(last.y+last.height).toBeLessThanOrEqual(panel.y+panel.height);
  }
  await page.getByLabel("내 답안", { exact: true }).fill("모의시험 답안");
  await page.getByRole("button", { name: "다시 볼 문제", exact: true }).click();
  await page
    .getByRole("navigation", { name: "모의시험 문제 목록" })
    .getByRole("button", { name: "2번 문제", exact: true })
    .click();
  await page
    .getByRole("navigation", { name: "모의시험 문제 목록" })
    .getByRole("button", { name: "1번 문제", exact: true })
    .click();
  await expect(page.getByLabel("내 답안", { exact: true })).toHaveValue(
    "모의시험 답안",
  );
  const keys = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("engineer-mock-exam-v1")).session.keys,
  );
  await page.reload();
  await expect(page.getByLabel("내 답안", { exact: true })).toHaveValue(
    "모의시험 답안",
  );
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("engineer-mock-exam-v1")).session.keys,
    ),
  ).toEqual(keys);
  await page.getByRole("button", { name: "기출 학습", exact: true }).click();
  await page.getByRole("button", { name: "모의시험", exact: true }).click();
  await expect(page.getByLabel("내 답안", { exact: true })).toHaveValue(
    "모의시험 답안",
  );
  await page.getByRole("button", { name: "제출", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("19문제");
  await page.getByRole("button", { name: "계속 풀기", exact: true }).click();
  await expect(page.getByLabel("내 답안", { exact: true })).toBeEditable();
  await page.getByRole("button", { name: "제출", exact: true }).click();
  await page.getByRole("button", { name: "제출 확정", exact: true }).click();
  await expect(
    page.getByLabel("제출한 답안", { exact: true }),
  ).not.toBeEditable();
  await page.getByRole("button", { name: "정답 및 풀이", exact: true }).click();
  await page.getByRole("button", { name: "5점", exact: true }).click();
  await expect(page.locator(".examResult")).toContainText("1 / 20 채점");
  await page.reload();
  await expect(page.locator(".examResult")).toContainText("1 / 20 채점");
  await page.screenshot({
    path: `test-results/${info.project.name}-mock-review.png`,
  });
});

test("mock automatically submits at the deadline including after reload", async ({
  page,
}) => {
  await page.clock.install();
  await startMock(page);
  await page.getByLabel("내 답안", { exact: true }).fill("시간 종료 답안");
  await page.clock.fastForward(150 * 60 * 1000 + 1000);
  await expect(
    page.getByText("제한 시간이 끝나 답안이 자동 제출되었습니다.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(page.getByLabel("제출한 답안", { exact: true })).toHaveValue(
    "시간 종료 답안",
  );
  await expect(
    page.getByLabel("제출한 답안", { exact: true }),
  ).not.toBeEditable();
  await page.reload();
  await expect(
    page.getByLabel("제출한 답안", { exact: true }),
  ).not.toBeEditable();
});

test("2026 round 2 has images, all 20 questions and readable state tables", async ({
  page,
}, info) => {
  await page.goto("./");
  await page.getByRole("button", { name: "회차", exact: true }).click();
  await page
    .getByRole("complementary", { name: "회차 선택" })
    .getByRole("button", { name: /2026년 2회/ })
    .click();
  const nav = page.getByRole("navigation", { name: "문제 목록" });
  await expect(nav.locator(".numberGrid button")).toHaveCount(20);
  await page
    .getByRole("button", { name: "회차 패널 닫기", exact: true })
    .click();
  await nav.getByRole("button", { name: /^7번째 문제,/ }).click();
  await page.getByRole("button", { name: "정답 및 풀이", exact: true }).click();
  await page.getByRole("button", { name: "2단계로 이동", exact: true }).click();
  await expect(page.locator(".iterationTable tbody tr")).toHaveCount(5);
  await page.getByRole("button", { name: "3단계로 이동", exact: true }).click();
  await expect(page.locator(".stateChanges")).toContainText("12");
  await page.getByRole("button", { name: "4단계로 이동", exact: true }).click();
  await expect(page.locator(".traceOutput pre")).toHaveText("12");
  await page.getByRole("button", { name: "전체 흐름", exact: true }).click();
  await expect(page.locator(".traceTree")).toBeVisible();
  expect(await page.locator(".traceBody").first().evaluate((body) => Math.abs(body.getBoundingClientRect().left-body.querySelector(".traceNarrative p").getBoundingClientRect().left))).toBeLessThan(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: `test-results/${info.project.name}-new-flow.png`,
    fullPage: false,
  });
  await nav.getByRole("button", { name: /^8번째 문제,/ }).click();
  const image = page.locator(".questionContent img").first();
  await image.scrollIntoViewIfNeeded();
  await expect
    .poll(() => image.evaluate((img) => img.complete && img.naturalWidth > 0))
    .toBeTruthy();
});

test("completed mock scores can update the shared study records", async ({
  page,
}) => {
  await startMock(page);
  const first = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem("engineer-mock-exam-v1"));
    saved.session.status = "submitted";
    saved.session.reason = "manual";
    saved.session.scores = Object.fromEntries(
      saved.session.keys.map((key, i) => [key, i === 0 ? 0 : 5]),
    );
    localStorage.setItem("engineer-mock-exam-v1", JSON.stringify(saved));
    return saved.session.keys[0];
  });
  await page.reload();
  await expect(page.locator(".examResult")).toContainText("95 / 100");
  await page
    .getByRole("button", { name: "학습 기록에 반영", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "학습 기록에 반영됨", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "기출 학습", exact: true }).click();
  const records = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("engineer-practical-study-v2")).records,
  );
  expect(records[first]).toBe("wrong");
  expect(Object.values(records).filter((s) => s === "correct")).toHaveLength(
    19,
  );
});
