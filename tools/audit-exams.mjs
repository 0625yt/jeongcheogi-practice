import { exams } from "../src/data/exams.js";

const stripHtml = (html) =>
  html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

const issues = [];
const warnings = [];
let total = 0;

for (const exam of exams) {
  if (exam.questions.length !== 20) {
    issues.push({
      type: "question-count",
      exam: exam.title,
      detail: `${exam.questions.length} questions`,
    });
  }

  const seen = new Set();
  for (const question of exam.questions) {
    total += 1;
    const id = `${exam.title} ${question.number}번`;
    const promptText = stripHtml(question.promptHtml);
    const answerText = stripHtml(question.answerHtml);

    if (seen.has(question.number)) {
      issues.push({ type: "duplicate-number", exam: exam.title, detail: `${question.number}` });
    }
    seen.add(question.number);

    if (!promptText || promptText.length < 12) {
      issues.push({ type: "short-prompt", exam: exam.title, detail: id });
    }

    if (!answerText || answerText.length < 1) {
      issues.push({ type: "empty-answer", exam: exam.title, detail: id });
    }

    if (answerText.match(/다음|아래|보기|작성하시오|출력값/) && answerText.length > 160) {
      warnings.push({
        type: "long-explanation-answer",
        exam: exam.title,
        detail: `${id}: ${answerText.slice(0, 120)}`,
      });
    }

    if (question.answerHtml.includes("moreless-content") || question.promptHtml.includes("moreless-content")) {
      issues.push({ type: "unremoved-moreless", exam: exam.title, detail: id });
    }

    if (question.promptHtml.includes("<script") || question.answerHtml.includes("<script")) {
      issues.push({ type: "script-leftover", exam: exam.title, detail: id });
    }

    if (question.promptHtml.length > 50000) {
      issues.push({ type: "huge-prompt", exam: exam.title, detail: `${id}: ${question.promptHtml.length}` });
    }
  }

  const expected = Array.from({ length: 20 }, (_, index) => index + 1);
  const missing = expected.filter((number) => !seen.has(number));
  if (missing.length) {
    issues.push({ type: "missing-number", exam: exam.title, detail: missing.join(", ") });
  }
}

console.log(`총 ${exams.length}회차, ${total}문제 검사`);

if (warnings.length) {
  console.log(`경고 ${warnings.length}건`);
  for (const warning of warnings) {
    console.log(`[${warning.type}] ${warning.exam} - ${warning.detail}`);
  }
}

if (issues.length) {
  console.log(`이상 징후 ${issues.length}건`);
  for (const issue of issues) {
    console.log(`[${issue.type}] ${issue.exam} - ${issue.detail}`);
  }
  process.exitCode = 1;
} else {
  console.log("치명적 이상 징후 없음");
}
