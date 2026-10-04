import { parseHTML } from "linkedom";
import { exams } from "../src/data/exams.js";
import {
  extractCodeLines,
  plainText,
  detectCodeLanguage,
} from "../src/codeContent.js";
globalThis.document = parseHTML("<html></html>").document;
const start = Number(process.argv[2] ?? 0);
const end = Number(process.argv[3] ?? exams.length);
for (const exam of exams.slice(start, end)) {
  for (const q of exam.questions) {
    const lines = extractCodeLines(q.promptHtml);
    if (!lines.length) continue;
    console.log(
      `\n${exam.id}-${q.number} [${detectCodeLanguage(plainText(q.promptHtml))}] ANSWER: ${q.answerText}\n${lines.join("\n")}`,
    );
  }
}
