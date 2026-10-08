import test from "node:test";
import assert from "node:assert/strict";
import { parseHTML } from "linkedom";
import { buildCatalog, migrateProgress } from "../src/studyModel.js";
import { codeFlows } from "../src/data/codeFlows.js";
import { detailedCodeExplanations } from "../src/data/detailedExplanations.js";
import { flows2026Round2 } from "../src/data/flows2026Round2.js";
import {
  predictedExams,
  predictedExplanations,
} from "../src/data/predictedExams.js";
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
    ...predictedExplanations,
  };
  const code = catalog.questions.filter((q) => q.language);
  assert.equal(code.length, 199);
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

test("five predicted workbooks have 100 distinct authored questions and recent evidence", () => {
  assert.equal(predictedExams.length, 5);
  const predicted = catalog.questions.filter((q) => q.origin === "predicted");
  assert.equal(predicted.length, 100);
  const prompts = new Set(
    predicted.map((q) => q.promptHtml.replace(/^.*?<\/b>/, "")),
  );
  assert.equal(prompts.size, 100);
  assert.equal(catalog.predictionAnalysis.recentCount, 100);
  assert.equal(catalog.predictionAnalysis.codeCount, 40);
  for (const group of catalog.groups.filter((g) => g.kind === "predicted")) {
    assert.equal(group.keys.length, 20);
    assert.deepEqual(blueprintCounts(catalog.questions, group.id), {
      c: 3,
      java: 2,
      python: 2,
      sql: 4,
      theory: 9,
    });
    for (const key of group.keys) {
      const q = predicted.find((q) => q.key === key);
      assert.ok(q.answerText && q.answerHtml, key);
      assert.ok(q.evidenceKeys.length, key);
      assert.ok(
        q.evidenceKeys.every((k) =>
          catalog.questions.some(
            (p) =>
              p.key === k && p.origin === "past" && /^202[56]/.test(p.examId),
          ),
        ),
        key,
      );
      if (q.language) {
        const flow = predictedExplanations[q.explanationKey];
        assert.equal(flow.answer, q.answerText, key);
        assert.equal(flow.trace.at(-1).output, q.answerText, key);
      } else assert.ok(q.answerHtml.includes("풀이"), key);
    }
  }
});

test("predicted timed exams keep their exact set and never contaminate genuine random exams", () => {
  for (const group of catalog.groups.filter((g) => g.kind === "predicted")) {
    const s = createMockSession(catalog.questions, group.id, 1000);
    assert.equal(s.mode, "predicted");
    assert.deepEqual(s.keys, group.keys);
    s.answers[s.keys[0]] = "저장 답안";
    const r = restoreMockSession(s, catalog.questions, 2000);
    assert.equal(r.answers[r.keys[0]], "저장 답안");
    assert.equal(
      restoreMockSession({ ...s, blueprint: "2026년-2회" }, catalog.questions),
      null,
    );
    assert.equal(
      restoreMockSession({ ...s, mode: "random" }, catalog.questions),
      null,
    );
    assert.throws(() => generateMockQuestions(catalog.questions, group.id));
  }
  assert.ok(
    generateMockQuestions(catalog.questions, "2026년-2회").every(
      (q) => q.origin === "past",
    ),
  );
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
