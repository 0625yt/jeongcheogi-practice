import test from "node:test";
import assert from "node:assert/strict";
import { parseHTML } from "linkedom";
import { buildCatalog, migrateProgress } from "../src/studyModel.js";
import { codeFlows } from "../src/data/codeFlows.js";
import { detailedCodeExplanations } from "../src/data/detailedExplanations.js";
import { extractCodeLines, prepareQuestionHtml } from "../src/codeContent.js";
import { existsSync } from "node:fs";
globalThis.document = parseHTML("<html></html>").document;
const catalog = buildCatalog();
test("original questions are unique and frequency counts exclude language copies", () => {
  assert.equal(
    catalog.questions.filter((q) => q.origin === "past").length,
    400,
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
  const explanations = { ...detailedCodeExplanations, ...codeFlows };
  const code = catalog.questions.filter((q) => q.language);
  assert.equal(code.length, 157);
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
