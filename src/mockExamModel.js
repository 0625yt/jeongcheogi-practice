import { extractCodeLines, plainText } from "./codeContent.js";

export const MOCK_DURATION_MS = 150 * 60 * 1000;
export const OFFICIAL_RULES_URL =
  "https://www.q-net.or.kr/crf005.do?gSite=Q&id=crf00503s02&jmCd=1320&jmInfoDivCcd=B0";

export function examCategory(question) {
  if (question.language) return question.language;
  return /\bSQL\b|SELECT\s|CREATE\s|UPDATE\s/i.test(
    plainText(question.promptHtml),
  )
    ? "sql"
    : "theory";
}

export function blueprintCounts(questions, examId) {
  const counts = { c: 0, java: 0, python: 0, sql: 0, theory: 0 };
  questions
    .filter((q) => q.examId === examId && q.origin === "past")
    .forEach((q) => counts[examCategory(q)]++);
  if (Object.values(counts).reduce((a, b) => a + b, 0) !== 20)
    throw new Error("20문제로 구성된 회차가 필요합니다.");
  return counts;
}

function fingerprint(question) {
  const code = extractCodeLines(question.promptHtml).join("");
  const prompt = plainText(question.promptHtml).replace(/^\s*\d+\s*[.]/, "");
  return (code || prompt).replace(/\s+/g, "").toLowerCase();
}

function shuffle(items, random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function generateMockQuestions(questions, examId, random = Math.random) {
  const counts = blueprintCounts(questions, examId);
  const pool = questions.filter((q) => q.origin === "past");
  const used = new Set();
  const selected = [];
  for (const [category, count] of Object.entries(counts)) {
    if (count === 0) continue;
    const candidates = shuffle(
      pool.filter((q) => examCategory(q) === category),
      random,
    );
    const chosen = [];
    for (const q of candidates) {
      const identity = fingerprint(q);
      if (!used.has(identity)) {
        chosen.push(q);
        used.add(identity);
      }
      if (chosen.length === count) break;
    }
    if (chosen.length < count)
      throw new Error(`${category} 유형의 중복 없는 문제가 부족합니다.`);
    selected.push(...chosen);
  }
  return shuffle(selected, random);
}

export function createMockSession(
  questions,
  examId,
  now = Date.now(),
  random = Math.random,
) {
  return {
    id: crypto.randomUUID(),
    version: 1,
    blueprint: examId,
    keys: generateMockQuestions(questions, examId, random).map((q) => q.key),
    startedAt: now,
    deadline: now + MOCK_DURATION_MS,
    status: "running",
    index: 0,
    answers: {},
    flags: {},
    scores: {},
  };
}

export function restoreMockSession(value, questions, now = Date.now()) {
  const keys = new Set(
    questions.filter((q) => q.origin === "past").map((q) => q.key),
  );
  if (
    !value ||
    value.version !== 1 ||
    typeof value.id !== "string" ||
    !Array.isArray(value.keys) ||
    value.keys.length !== 20 ||
    new Set(value.keys).size !== 20 ||
    !value.keys.every((k) => keys.has(k)) ||
    !Number.isFinite(value.startedAt) ||
    value.deadline !== value.startedAt + MOCK_DURATION_MS ||
    !["running", "submitted"].includes(value.status)
  )
    return null;
  const map = (values, valid) =>
    Object.fromEntries(
      Object.entries(values ?? {}).filter(
        ([key, v]) => value.keys.includes(key) && valid(v),
      ),
    );
  return {
    ...value,
    index: Number.isInteger(value.index)
      ? Math.max(0, Math.min(19, value.index))
      : 0,
    answers: map(value.answers, (v) => typeof v === "string"),
    flags: map(value.flags, (v) => v === true),
    scores: map(
      value.scores,
      (v) => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 5,
    ),
    ...(value.status === "running" && now >= value.deadline
      ? { status: "submitted", submittedAt: value.deadline, reason: "timeout" }
      : {}),
  };
}

export function scoreSummary(session) {
  const graded = session.keys.filter((k) =>
    Number.isFinite(session.scores[k]),
  ).length;
  const score = session.keys.reduce(
    (sum, k) => sum + (session.scores[k] ?? 0),
    0,
  );
  return {
    graded,
    score,
    complete: graded === 20,
    passed: graded === 20 && score >= 60,
  };
}
