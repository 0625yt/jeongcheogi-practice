import { parseHTML } from "linkedom";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { buildCatalog } from "../src/studyModel.js";
import { extractCodeLines, plainText } from "../src/codeContent.js";
import { detailedCodeExplanations } from "../src/data/detailedExplanations.js";
import { codeFlows } from "../src/data/codeFlows.js";
import { flows2026Round2 } from "../src/data/flows2026Round2.js";
import { predictedExplanations } from "../src/data/predictedExams.js";
globalThis.document = parseHTML("<html></html>").document;
const flows = {
  ...detailedCodeExplanations,
  ...codeFlows,
  ...flows2026Round2,
  ...predictedExplanations,
};
const result = [];
const compact = (text) => text.replace(/\s+/g, "").trim();
for (const q of buildCatalog().questions.filter(
  (q) =>
    q.language &&
    (!process.argv.includes("--predicted") || q.origin === "predicted") &&
    (!process.argv.includes("--latest") || q.examId === "2026년-2회"),
)) {
  const explanation = flows[q.explanationKey ?? q.key];
  if (!explanation?.trace?.length) throw new Error(`Missing flow: ${q.key}`);
  const source = extractCodeLines(q.promptHtml).join("\n");
  const expected = explanation.answer ?? q.answerText;
  const dir = mkdtempSync(join(tmpdir(), "exam-code-"));
  const run = (cmd, args, input = "") =>
    spawnSync(cmd, args, {
      cwd: dir,
      input,
      encoding: "utf8",
      timeout: 6000,
      maxBuffer: 200000,
    });
  let execution;
  let compile;
  if (q.language === "python") {
    const input = /HumanDev/.test(q.promptHtml) ? "HumanDev\n" : "";
    execution = run("python3", ["-c", source], input);
  } else if (q.language === "java") {
    const name =
      source.match(/public\s+class\s+(\w+)/)?.[1] ??
      source.match(/class\s+(Main|main)\b/)?.[1] ??
      "Main";
    writeFileSync(join(dir, `${name}.java`), source);
    compile = run("javac", ["-encoding", "UTF-8", `${name}.java`]);
    if (compile.status === 0) execution = run("java", ["-cp", dir, name]);
  } else {
    writeFileSync(join(dir, "main.c"), source);
    compile = run("clang", [
      "-std=c17",
      "-Wno-main-return-type",
      "main.c",
      "-o",
      "program",
    ]);
    if (compile.status === 0)
      execution = run(
        join(dir, "program"),
        [],
        q.key === "2022년-1회-14" ? "5\n" : "",
      );
  }
  const output = execution?.stdout?.trim() ?? "";
  const status =
    !execution || execution.status !== 0
      ? "source-check"
      : compact(output) === compact(expected)
        ? "match"
        : "review";
  const diagnostic = (compile?.stderr || execution?.stderr || "").slice(0, 400);
  result.push({
    key: q.key,
    language: q.language,
    status,
    output,
    expected,
    diagnostic,
  });
  if (status !== "match") console.log(JSON.stringify(result.at(-1)));
  rmSync(dir, { recursive: true, force: true });
}
writeFileSync("tools/code-verification.json", JSON.stringify(result, null, 2));
console.log(
  JSON.stringify({
    total: result.length,
    matches: result.filter((r) => r.status === "match").length,
    review: result.filter((r) => r.status === "review").length,
    sourceChecks: result.filter((r) => r.status === "source-check").length,
  }),
);
