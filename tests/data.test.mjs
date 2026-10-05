import test from "node:test";
import assert from "node:assert/strict";
import { parseHTML } from "linkedom";
import { buildCatalog, migrateProgress } from "../src/studyModel.js";
import { codeFlows } from "../src/data/codeFlows.js";
import { detailedCodeExplanations } from "../src/data/detailedExplanations.js";
import { flows2026Round2 } from "../src/data/flows2026Round2.js";
import { extractCodeLines, prepareQuestionHtml } from "../src/codeContent.js";
import { existsSync } from "node:fs";
import {
  blueprintCounts,
  generateMockQuestions,
  createMockSession,
  restoreMockSession,
  scoreSummary,
  examCategory,
  MOCK_DURATION_MS,
} from "../src/mockExamModel.js";
globalThis.document = parseHTML("<html></html>").document;
const catalog = buildCatalog();
test("original questions are unique and frequency counts exclude language copies", () => {
  assert.equal(
    catalog.questions.filter((q) => q.origin === "past").length,
    420,
  );
  assert.equal(
    new Set(catalog.questions.map((q) => q.key)).size,
    catalog.questions.length,
  );
  for (const [topic, frequency] of Object.entries(catalog.frequencies)) {
    const actual = catalog.questions.filter(
      (q) => q.origin === "past" && q.topics.includes(topic),
    );
    assert.equal(frequency.questionCount, actual.length);
    assert.equal(
      frequency.exams.size,
      new Set(actual.map((q) => q.examId)).size,
    );
  }
});
test("all code questions have dedicated data flow and stable code lines", () => {
  const explanations = {
    ...detailedCodeExplanations,
    ...codeFlows,
    ...flows2026Round2,
  };
  const code = catalog.questions.filter((q) => q.language);
  assert.equal(code.length, 164);
  for (const q of code) {
    const exp = explanations[q.explanationKey ?? q.key];
    assert.ok(exp?.trace?.length >= 2, q.key);
    const prepared = document.createElement("div");
    prepared.innerHTML = prepareQuestionHtml(q.promptHtml);
    assert.equal(
      prepared.querySelectorAll(".sourceLine").length,
      extractCodeLines(q.promptHtml).length,
      q.key,
    );
    assert.ok(
      !JSON.stringify(exp).includes("이 줄의 식을 현재 변수 상태로"),
      q.key,
    );
  }
});
test("legacy language progress migrates to original question, not custom practice", () => {
  const records = migrateProgress(
    { "코드기출-C-1": "wrong", "2025년-1회-1": "correct" },
    catalog,
  );
  assert.equal(records["2026년-1회-1"], "wrong");
  assert.equal(records["2025년-1회-1"], "correct");
  assert.equal(records["practice:코드기출-C-1"], undefined);
});

test("every original diagram has a local file", () => {
  for (const q of catalog.questions) {
    const root = document.createElement("div");
    root.innerHTML = prepareQuestionHtml(q.promptHtml + q.answerHtml);
    for (const img of root.querySelectorAll("img")) {
      const src = img.getAttribute("src");
      assert.ok(
        src.startsWith("/jeongcheogi-practice/question-assets/"),
        q.key,
      );
      assert.ok(
        existsSync(src.replace("/jeongcheogi-practice/", "public/")),
        src,
      );
    }
  }
});

test("mock exam samples 20 unique original questions with the chosen distribution", () => {
  const counts = blueprintCounts(catalog.questions, "2026년-2회");
  assert.deepEqual(counts, { c: 3, java: 2, python: 2, sql: 4, theory: 9 });
  for (let n = 0; n < 25; n++) {
    const selected = generateMockQuestions(catalog.questions, "2026년-2회");
    assert.equal(selected.length, 20);
    assert.equal(new Set(selected.map((q) => q.key)).size, 20);
    assert.ok(selected.every((q) => q.origin === "past"));
    for (const [category, count] of Object.entries(counts))
      assert.equal(
        selected.filter((q) => examCategory(q) === category).length,
        count,
      );
  }
});

test("mock session restores answers and fixed deadline and expires offline", () => {
  const session = createMockSession(
    catalog.questions,
    "2026년-2회",
    1000,
    () => 0.5,
  );
  session.answers[session.keys[0]] = "내 답";
  session.flags[session.keys[1]] = true;
  const restored = restoreMockSession(
    JSON.parse(JSON.stringify(session)),
    catalog.questions,
    5000,
  );
  assert.equal(restored.deadline, 1000 + MOCK_DURATION_MS);
  assert.equal(restored.answers[session.keys[0]], "내 답");
  assert.equal(restored.status, "running");
  assert.equal(
    restoreMockSession(session, catalog.questions, session.deadline + 1).status,
    "submitted",
  );
  assert.equal(
    restoreMockSession(
      { ...session, keys: Array(20).fill(session.keys[0]) },
      catalog.questions,
    ),
    null,
  );
});

test("score reaches 60 only after all questions have been graded", () => {
  const session = createMockSession(catalog.questions, "2026년-2회");
  for (const key of session.keys.slice(0, 12)) session.scores[key] = 5;
  assert.equal(scoreSummary(session).score, 60);
  assert.equal(scoreSummary(session).passed, false);
  for (const key of session.keys.slice(12)) session.scores[key] = 0;
  assert.equal(scoreSummary(session).passed, true);
  session.scores[session.keys[0]] = 4.75;
  assert.equal(scoreSummary(session).score, 59.75);
  assert.equal(scoreSummary(session).passed, false);
});
