import { exams } from "./data/exams.js";
import { exam2026Round2 } from "./data/exam2026Round2.js";
import { customCodePracticeByLanguage } from "./data/codePractice.js";
import { externalLanguageCodeQuestions } from "./data/languageCodePages.js";
import { predictedExams } from "./data/predictedExams.js";
import {
  plainText,
  extractCodeLines,
  detectCodeLanguage,
} from "./codeContent.js";

const theoryTopics = [
  [
    "디자인 패턴",
    /디자인\s*패턴|design pattern|singleton|observer|bridge|factory method/i,
  ],
  [
    "소프트웨어 테스트",
    /테스트|테스팅|커버리지|coverage|JUnit|살충제|동등\s*분할|경계값/i,
  ],
  [
    "데이터베이스·SQL",
    /SQL|데이터베이스|정규화|트랜잭션|관계\s*대수|참조\s*무결성|관계형|릴레이션/i,
  ],
  [
    "네트워크",
    /프로토콜|TCP|UDP|IP\s*주소|라우팅|서브넷|OSI|네트워크|패킷|IPv[46]/i,
  ],
  [
    "정보 보안",
    /암호|보안|공격|해킹|랜섬|악성|인증|스푸핑|스니핑|XSS|CSRF|방화벽/i,
  ],
  [
    "운영체제",
    /스케줄링|페이지\s*교체|교착|프로세스|운영체제|세마포어|LRU|페이징/i,
  ],
  [
    "설계·요구사항",
    /요구사항|UML|결합도|응집도|객체지향|애자일|형상\s*관리|개발\s*방법론/i,
  ],
];

export function questionTopics(question) {
  const source = extractCodeLines(question.promptHtml).join("\n");
  const text = plainText(question.promptHtml + " " + question.answerHtml);
  if (source && question.language) {
    const topics = [];
    const calls = [
      ...source.matchAll(/(?:int|void|String|double|def)\s+(\w+)\s*\(/g),
    ]
      .map((m) => m[1])
      .filter((name) => name !== "main");
    if (
      calls.some(
        (name) =>
          (source.match(new RegExp(`\\b${name}\\s*\\(`, "g")) ?? []).length >=
          3,
      )
    )
      topics.push("재귀·함수 호출");
    if (/struct\b|->|\*\s*\w+|&\w+/.test(source) && question.language === "c")
      topics.push("포인터·구조체");
    if (/extends|super\s*[.(]|implements|static.*_inst/.test(source))
      topics.push("상속·객체·메서드");
    if (/try\s*\{|catch\s*\(|throw\s/.test(source)) topics.push("예외 처리");
    if (
      /\[[^\]]*:[^\]]*\]|\.split\(|char\s*\*|char\s+\w+\[|String\s+\w+\s*=/.test(
        source,
      )
    )
      topics.push("문자열·슬라이싱");
    if (/\[|\.add\(|\.update\(/.test(source)) topics.push("배열·컬렉션");
    if (/<<|>>|\^|\s&\s|\s\|\s/.test(source)) topics.push("비트·논리 연산");
    if (/for\s*\(|for\s+\w+\s+in|while\s*\(|switch\s*\(/.test(source))
      topics.push("반복·분기");
    return topics.length ? topics : ["변수·출력"];
  }
  return theoryTopics
    .filter(([, rule]) => rule.test(text))
    .map(([topic]) => topic);
}

export function buildCatalog() {
  const allExams = [
    ...exams.filter((e) => e.id !== exam2026Round2.id),
    exam2026Round2,
  ];
  const original = allExams.flatMap((exam) =>
    exam.questions.map((q) => ({
      ...q,
      key: `${exam.id}-${q.number}`,
      examId: exam.id,
      examTitle: exam.title,
      sourceUrl: q.sourceUrl ?? exam.sourceUrl,
      origin: "past",
      language: extractCodeLines(q.promptHtml).length
        ? detectCodeLanguage(plainText(q.promptHtml))
        : null,
    })),
  );
  const additional = [
    ...Object.entries(externalLanguageCodeQuestions).flatMap(
      ([language, questions]) =>
        questions.map((q) => ({
          ...q,
          language,
          origin: "collection",
          examTitle: "언어별 기출 모음",
        })),
    ),
    ...customCodePracticeByLanguage.flatMap((e) =>
      e.questions.map((q) => ({
        ...q,
        language: e.language,
        origin: "practice",
        examTitle: "직접 제작 연습",
      })),
    ),
  ].map((q, i) => ({
    ...q,
    key: `${q.origin}:${q.explanationKey ?? i}`,
    examId: q.origin,
  }));
  const predicted = predictedExams.flatMap((exam) =>
    exam.questions.map((q) => ({
      ...q,
      key: `${exam.id}-${q.number}`,
      examId: exam.id,
      examTitle: exam.title,
      origin: "predicted",
      sourceUrl: "",
    })),
  );
  const questions = [...original, ...additional, ...predicted].map((q) => ({
    ...q,
    topics: q.topics ?? questionTopics(q),
  }));
  const frequencies = {};
  for (const q of questions.filter((q) => q.origin === "past")) {
    for (const topic of q.topics) {
      frequencies[topic] ??= { questionCount: 0, exams: new Set() };
      frequencies[topic].questionCount++;
      frequencies[topic].exams.add(q.examId);
    }
  }
  const groups = [
    ...[
      ["c", "C"],
      ["java", "Java"],
      ["python", "Python"],
    ].map(([language, label]) => ({
      id: `코드기출-${label}`,
      title: `${label} 코드 문제`,
      kind: "language",
      keys: questions.filter((q) => q.language === language).map((q) => q.key),
    })),
    ...predictedExams.map((e) => ({
      ...e,
      keys: predicted.filter((q) => q.examId === e.id).map((q) => q.key),
    })),
    ...[exam2026Round2, ...exams.filter((e) => e.id !== exam2026Round2.id)].map(
      (e) => ({
        ...e,
        kind: "past",
        keys: original.filter((q) => q.examId === e.id).map((q) => q.key),
      }),
    ),
  ];
  const recent = questions.filter(
    (q) => q.origin === "past" && /^202[56]/.test(q.examId),
  );
  const predictionAnalysis = {
    totalCount: original.length,
    recentCount: recent.length,
    codeCount: recent.filter((q) => q.language).length,
    years: [2024, 2025, 2026].map((year) => {
      const rows = original.filter((q) => q.examId.startsWith(String(year)));
      return {
        year,
        total: rows.length,
        c: rows.filter((q) => q.language === "c").length,
        java: rows.filter((q) => q.language === "java").length,
        python: rows.filter((q) => q.language === "python").length,
      };
    }),
  };
  for (const q of questions.filter((q) => q.origin === "predicted")) {
    q.evidenceKeys = recent
      .filter((p) => p.topics.some((t) => q.topics.includes(t)))
      .sort((a, b) => b.examId.localeCompare(a.examId) || a.number - b.number)
      .slice(0, 3)
      .map((p) => p.key);
  }
  return {
    questions,
    groups,
    frequencies,
    examCount: allExams.length,
    predictionAnalysis,
  };
}

export function migrateProgress(old, catalog) {
  const next = {};
  for (const q of catalog.questions) {
    if (["correct", "wrong"].includes(old[q.key])) next[q.key] = old[q.key];
  }
  // Old language lists used positional keys; reproduce their original selection order.
  for (const [language, label] of [
    ["c", "C"],
    ["java", "Java"],
    ["python", "Python"],
  ]) {
    const legacy = catalog.questions.filter((q) => {
      if (q.origin === "predicted") return false;
      if (q.examId === "2026년-2회") return false;
      if (q.origin !== "past") return q.language === language;
      const text = plainText(q.promptHtml);
      const detected = /(C언어|C코드|C 언어|다음은 C\b)/i.test(text)
        ? "c"
        : /(Java|자바)/i.test(text)
          ? "java"
          : /(Python|Pyhon|파이썬)/i.test(text)
            ? "python"
            : null;
      return (
        detected === language &&
        /(코드|출력값|출력 값|실행 결과|출력되는 값|알맞는 출력)/i.test(text)
      );
    });
    legacy.forEach((q, i) => {
      const record = old[`코드기출-${label}-${i + 1}`];
      if (!next[q.key] && ["correct", "wrong"].includes(record))
        next[q.key] = record;
    });
  }
  return next;
}

export function filterQuestions(
  questions,
  { groupKeys, filter, query, topic, records, bookmarks, frequencies },
) {
  const keys = groupKeys && new Set(groupKeys);
  return questions.filter(
    (q) =>
      (!keys || keys.has(q.key)) &&
      (filter === "all" ||
        (filter === "unseen" && !records[q.key]) ||
        records[q.key] === filter ||
        (filter === "bookmarked" && bookmarks[q.key])) &&
      (!topic || q.topics.includes(topic)) &&
      (!query ||
        `${q.examTitle} ${q.number} ${plainText(q.promptHtml)}`
          .toLowerCase()
          .includes(query.toLowerCase())),
  );
}
