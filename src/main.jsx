import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BookOpen,
  CheckCircle2,
  Circle,
  ExternalLink,
  Eye,
  EyeOff,
  RotateCcw,
  Search,
  Shuffle,
  XCircle,
} from "lucide-react";
import { exams } from "./data/exams";
import "./styles.css";

const STORAGE_KEY = "engineer-practical-exam-trainer";

function plainText(html) {
  const element = document.createElement("div");
  element.innerHTML = html;
  return element.textContent ?? "";
}

function normalizeCodeLine(line) {
  return line.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function extractCodeLines(html) {
  const element = document.createElement("div");
  element.innerHTML = html;
  const codeBlocks = [...element.querySelectorAll(".colorscripter-code")];

  return codeBlocks.flatMap((block) => {
    const cells = [...block.querySelectorAll("td")];
    const codeCell = cells.find((cell) => !/^\s*\d+(\s+\d+)*\s*$/.test(cell.textContent ?? ""));
    const source = codeCell ?? block;
    return [...source.querySelectorAll("div")]
      .map((line) => normalizeCodeLine(line.textContent ?? ""))
      .filter((line) => line && line !== "cs" && !/^Colored by/i.test(line));
  });
}

const detailedCodeExplanations = {
  "2026년-1회-1": {
    title: "C 코드 흐름",
    summary:
      "arr의 합은 530이고, arr1과 arr2는 같은 배열을 다른 문법으로 순회해 각각 평균 53.00을 반환합니다. 그래서 출력은 53.00 + 53.00 = 106.00입니다.",
    trace: [
      { code: "int arr[10] = {80, 20, 50, 55, 45, 95, 55, 10, 40, 80};", note: "배열 원소 10개의 합은 530입니다." },
      { code: "double arr1(int p[], int len)", note: "p[]는 배열처럼 보이지만 함수 안에서는 첫 원소를 가리키는 포인터처럼 동작합니다." },
      { code: "for (i = 0; i < len; i++) av += (double)p[i];", note: "p[0]부터 p[9]까지 더해서 av는 530이 됩니다." },
      { code: "return av / len;", note: "530 / 10이므로 arr1은 53.00을 반환합니다." },
      { code: "double arr2(int *p, int len)", note: "arr2는 배열을 포인터 p로 받습니다." },
      { code: "av += (double)(*(p + i));", note: "*(p+i)는 p[i]와 같은 값입니다. 결국 같은 10개 원소를 더해 av는 530이 됩니다." },
      { code: "printf(\"%.2f\", arr1(arr, len) + arr2(arr, len));", note: "53.00 + 53.00 = 106.00이고, %.2f라서 소수 둘째 자리까지 출력합니다." },
    ],
  },
  "2026년-1회-7": {
    title: "Java 오버라이딩/오버로딩 흐름",
    summary:
      "g()는 A에 정의되어 있지만 실제 객체가 B이면 f(\"a\") 호출은 B의 오버라이딩된 f(Object)로 동적 바인딩됩니다.",
    trace: [
      { code: "A obj = new B();", note: "참조 타입은 A, 실제 객체 타입은 B입니다." },
      { code: "obj.g()", note: "g 메서드는 A에 있으므로 A.g()가 실행됩니다." },
      { code: "return f(\"a\");", note: "A.g 내부에서 f를 호출하지만, 실제 객체가 B라서 오버라이딩이 적용됩니다." },
      { code: "String f(Object x) { return \"2\"; }", note: "A의 f(Object)를 B가 오버라이딩했으므로 이 메서드가 호출됩니다." },
      { code: "String f(String x) { return \"3\"; }", note: "이 메서드는 B에만 있는 오버로딩입니다. A.g의 컴파일 기준에서는 f(Object)가 선택되어 여기로 가지 않습니다." },
    ],
  },
  "2026년-1회-8": {
    title: "Python 문자열 흐름",
    summary:
      "입력 HumanDev는 공백이 없어서 그대로 리스트에 들어가고, 뒤집은 뒤 o/n/g를 제거해 veDamuH가 됩니다.",
    trace: [
      { code: "i = input()", note: "입력값은 HumanDev입니다." },
      { code: "for word in i.split(): x.append(word)", note: "공백이 없으므로 i.split()은 ['HumanDev']이고 x도 ['HumanDev']가 됩니다." },
      { code: "y = ''.join(x)", note: "리스트를 붙여 y는 'HumanDev'가 됩니다." },
      { code: "y[::-1]", note: "문자열을 뒤집으면 'veDnamuH'입니다." },
      { code: "if c not in 'ong'", note: "뒤집힌 문자열에서 n은 제거되고, o/g는 원래 없어서 결과는 'veDamuH'입니다." },
      { code: "print(z)", note: "최종 출력은 veDamuH입니다." },
    ],
  },
  "2026년-1회-13": {
    title: "Python 슬라이싱 흐름",
    summary:
      "lst[:: -2]는 뒤에서부터 2칸씩 건너뛰므로 9, 7, 5, 3, 1이 선택됩니다.",
    trace: [
      { code: "lst = list(range(10))", note: "lst는 [0,1,2,3,4,5,6,7,8,9]입니다." },
      { code: "lst[::-2]", note: "끝에서 시작해 두 칸씩 왼쪽으로 이동하므로 [9,7,5,3,1]입니다." },
      { code: "print(c, end='A')", note: "각 숫자 뒤에 줄바꿈 대신 A를 붙입니다." },
      { code: "print()", note: "반복이 끝난 뒤 줄바꿈만 추가합니다." },
    ],
  },
  "2026년-1회-17": {
    title: "Java 문자열 결합 흐름",
    summary:
      "덧셈은 왼쪽부터 계산됩니다. 숫자 9+2는 11이지만, 그 뒤 문자열을 만나면서 이후는 모두 문자열 결합입니다.",
    trace: [
      { code: "int x1 = 9; int x2 = 2; String x3 = \"3\";", note: "x1은 9, x2는 2, x3는 문자열 '3'입니다." },
      { code: "x1 + x2", note: "처음 두 값은 둘 다 숫자라서 9 + 2 = 11입니다." },
      { code: "11 + \"2\"", note: "문자열 '2'를 만났으므로 결과는 문자열 '112'가 됩니다." },
      { code: "\"112\" + x3", note: "문자열 '112'에 문자열 '3'을 붙여 '1123'이 됩니다." },
      { code: "System.out.println(...)", note: "최종 출력은 1123입니다." },
    ],
  },
};

function explainCodeLine(line) {
  if (/^\s*(#include|import|using)\b/.test(line)) return "라이브러리나 패키지를 불러오는 줄입니다. 값 변화는 없습니다.";
  if (/^\s*(int|double|float|char|String|boolean|long|short)\b/.test(line) && /=/.test(line)) {
    return "변수를 선언하면서 오른쪽 계산 결과를 왼쪽 변수에 저장합니다.";
  }
  if (/^\s*(int|double|float|char|String|boolean|long|short)\b/.test(line)) {
    return "변수나 함수의 타입을 정하는 선언부입니다.";
  }
  if (/for\s*\(/.test(line) || /^for\b/.test(line)) {
    return "반복문입니다. 초기값, 반복 조건, 증가/감소식을 기준으로 반복 횟수와 변수 변화를 추적해야 합니다.";
  }
  if (/while\s*\(/.test(line)) return "조건이 참인 동안 반복됩니다. 반복마다 조건에 쓰인 값이 어떻게 바뀌는지 확인합니다.";
  if (/if\s*\(/.test(line) || /^if\b/.test(line)) return "조건문입니다. 현재 변수 값으로 조건이 참인지 거짓인지 판단해 실행 경로가 갈립니다.";
  if (/else\b/.test(line)) return "앞의 if 조건이 거짓일 때 실행되는 경로입니다.";
  if (/return\b/.test(line)) return "함수의 결과값을 돌려주고 이 함수 실행을 끝냅니다.";
  if (/(printf|println|print)\s*\(/.test(line)) return "출력문입니다. 이 시점의 변수 값과 서식 문자열이 실제 화면에 찍힙니다.";
  if (/catch\s*\(/.test(line)) return "예외가 발생했을 때 넘어오는 처리 블록입니다.";
  if (/try\b/.test(line)) return "예외가 발생할 수 있는 코드를 실행하는 블록입니다.";
  if (/=\s*.+/.test(line)) return "오른쪽 값을 계산해서 왼쪽 변수나 위치에 저장합니다.";
  if (/\+\+|--|\+=|-=|\*=|\/=/.test(line)) return "기존 변수 값을 증가, 감소, 누적 갱신합니다.";
  if (/class\b/.test(line)) return "클래스 정의입니다. 객체가 가질 메서드나 값을 묶습니다.";
  if (/struct\b/.test(line)) return "구조체 정의입니다. 여러 데이터를 하나의 묶음으로 다룹니다.";
  if (/^\s*[{};]+\s*$/.test(line)) return "블록의 시작/끝 또는 문장 종료입니다. 직접적인 값 변화는 없습니다.";
  return "이 줄의 식이나 호출이 현재 변수 상태를 바탕으로 다음 실행 흐름을 만듭니다.";
}

function getCodingExplanation(question) {
  const prompt = plainText(question.promptHtml);
  const answer = question.answerText;
  const questionKey = `${question.examId}-${question.number}`;
  const detailed = detailedCodeExplanations[questionKey];
  if (detailed) return { ...detailed, answer, mode: "detailed" };

  const isCoding =
    /(C언어|자바|Java|JAVA|파이썬|Python|Pyhon|코드|소스코드|출력값|출력 값|SQL)/i.test(prompt);

  if (!isCoding) return null;

  const codeLines = extractCodeLines(question.promptHtml);
  const trace = codeLines
    .filter((line) => !/^\d+$/.test(line))
    .slice(0, 28)
    .map((line) => ({ code: line, note: explainCodeLine(line) }));

  return {
    title: /sql/i.test(prompt) ? "SQL 풀이 포인트" : "코드 추적 풀이",
    answer,
    summary: trace.length
      ? "아래는 실제 코드 줄을 기준으로 실행 흐름을 따라가는 표입니다. 구체 값 계산이 필요한 문제는 이 흐름에서 변수 값을 옆에 적어가며 확인하세요."
      : "이 문제는 코드 블록이 표 형태로 추출되지 않아 정답과 핵심 흐름만 확인합니다.",
    trace,
    mode: trace.length ? "line" : "summary",
  };
}

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {};
  } catch {
    return {};
  }
}

function saveProgress(next) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

function App() {
  const [selectedExamId, setSelectedExamId] = useState(exams[0]?.id);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [revealed, setRevealed] = useState({});
  const [progress, setProgress] = useState(loadProgress);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [practiceMode, setPracticeMode] = useState("sequence");

  const selectedExam = exams.find((exam) => exam.id === selectedExamId) ?? exams[0];

  const allQuestions = useMemo(
    () =>
      exams.flatMap((exam) =>
        exam.questions.map((question, index) => ({
          ...question,
          examId: exam.id,
          examTitle: exam.title,
          sourceUrl: exam.sourceUrl,
          localIndex: index,
          key: `${exam.id}-${question.number}`,
        })),
      ),
    [],
  );

  const visibleQuestions = useMemo(() => {
    const base =
      practiceMode === "all"
        ? allQuestions
        : selectedExam.questions.map((question, index) => ({
            ...question,
            examId: selectedExam.id,
            examTitle: selectedExam.title,
            sourceUrl: selectedExam.sourceUrl,
            localIndex: index,
            key: `${selectedExam.id}-${question.number}`,
          }));

    return base.filter((question) => {
      const record = progress[question.key];
      const statusMatch =
        filter === "all" ||
        (filter === "wrong" && record === "wrong") ||
        (filter === "unseen" && !record) ||
        (filter === "correct" && record === "correct");
      const queryMatch =
        !query ||
        `${question.examTitle} ${question.number} ${plainText(question.promptHtml)} ${question.answerText}`
          .toLowerCase()
          .includes(query.toLowerCase());
      return statusMatch && queryMatch;
    });
  }, [allQuestions, filter, practiceMode, progress, query, selectedExam]);

  const currentQuestion = visibleQuestions[Math.min(currentIndex, visibleQuestions.length - 1)];
  const codingExplanation = currentQuestion ? getCodingExplanation(currentQuestion) : null;
  const stats = useMemo(() => {
    const keys = allQuestions.map((question) => question.key);
    const correct = keys.filter((key) => progress[key] === "correct").length;
    const wrong = keys.filter((key) => progress[key] === "wrong").length;
    return { total: keys.length, correct, wrong, left: keys.length - correct - wrong };
  }, [allQuestions, progress]);

  function updateRecord(questionKey, value) {
    const next = { ...progress, [questionKey]: value };
    setProgress(next);
    saveProgress(next);
  }

  function resetProgress() {
    setProgress({});
    saveProgress({});
    setRevealed({});
    setAnswers({});
    setFilter("all");
    setQuery("");
    setCurrentIndex(0);
  }

  function jumpTo(index) {
    setCurrentIndex(Math.max(0, Math.min(index, visibleQuestions.length - 1)));
  }

  function randomQuestion() {
    if (visibleQuestions.length < 2) return;
    let next = currentIndex;
    while (next === currentIndex) {
      next = Math.floor(Math.random() * visibleQuestions.length);
    }
    setCurrentIndex(next);
  }

  function changeExam(id) {
    setSelectedExamId(id);
    setCurrentIndex(0);
    setPracticeMode("sequence");
  }

  return (
    <main className="app">
      <aside className="sidebar">
        <div className="brand">
          <BookOpen size={24} />
          <div>
            <h1>정보처리기사 실기</h1>
            <p>기출 훈련장</p>
          </div>
        </div>

        <section className="stats" aria-label="학습 현황">
          <div>
            <strong>{stats.correct}</strong>
            <span>맞힘</span>
          </div>
          <div>
            <strong>{stats.wrong}</strong>
            <span>오답</span>
          </div>
          <div>
            <strong>{stats.left}</strong>
            <span>미풀이</span>
          </div>
        </section>

        <div className="searchBox">
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setCurrentIndex(0);
            }}
            placeholder="회차나 정답 검색"
          />
        </div>

        <div className="modeTabs" role="tablist" aria-label="문제 범위">
          <button
            className={practiceMode === "sequence" ? "active" : ""}
            onClick={() => {
              setPracticeMode("sequence");
              setCurrentIndex(0);
            }}
          >
            선택 회차
          </button>
          <button
            className={practiceMode === "all" ? "active" : ""}
            onClick={() => {
              setPracticeMode("all");
              setCurrentIndex(0);
            }}
          >
            전체 회차
          </button>
        </div>

        <div className="examList">
          {exams.map((exam) => {
            const solved = exam.questions.filter((question) => progress[`${exam.id}-${question.number}`]).length;
            return (
              <button
                key={exam.id}
                className={exam.id === selectedExam.id && practiceMode === "sequence" ? "examButton active" : "examButton"}
                onClick={() => changeExam(exam.id)}
              >
                <span>{exam.title}</span>
                <small>
                  {solved}/{exam.questions.length}
                </small>
              </button>
            );
          })}
        </div>

        <button className="ghostButton" onClick={resetProgress}>
          <RotateCcw size={16} />
          기록 초기화
        </button>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p>{currentQuestion?.examTitle ?? "문제 없음"}</p>
            <h2>
              {currentQuestion ? `${currentQuestion.number}번 문제` : "불러온 문제가 없습니다"}
            </h2>
          </div>
          {currentQuestion && (
            <a className="sourceLink" href={currentQuestion.sourceUrl} target="_blank" rel="noreferrer">
              원문
              <ExternalLink size={16} />
            </a>
          )}
        </header>

        <div className="filters">
          {[
            ["all", "전체"],
            ["unseen", "미풀이"],
            ["wrong", "오답"],
            ["correct", "맞힌 문제"],
          ].map(([value, label]) => (
            <button
              key={value}
              className={filter === value ? "active" : ""}
              onClick={() => {
                setFilter(value);
                setCurrentIndex(0);
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {currentQuestion ? (
          <article className="questionShell">
            <div className="questionNav" aria-label="문제 목록">
              {visibleQuestions.map((question, index) => {
                const record = progress[question.key];
                return (
                  <button
                    key={question.key}
                    className={index === currentIndex ? "active" : ""}
                    onClick={() => jumpTo(index)}
                    title={`${question.examTitle} ${question.number}번`}
                  >
                    {record === "correct" ? <CheckCircle2 size={15} /> : record === "wrong" ? <XCircle size={15} /> : <Circle size={15} />}
                    {question.number}
                  </button>
                );
              })}
            </div>

            <div className="questionCard">
              <div
                className="questionContent"
                dangerouslySetInnerHTML={{ __html: currentQuestion.promptHtml }}
              />

              <div className="answerPanel">
                <label htmlFor="answerInput">내 답안</label>
                <textarea
                  id="answerInput"
                  value={answers[currentQuestion.key] ?? ""}
                  onChange={(event) =>
                    setAnswers({ ...answers, [currentQuestion.key]: event.target.value })
                  }
                  placeholder="답을 적고 정답을 확인해보세요."
                />
                <div className="actions">
                  <button
                    className="primary"
                    onClick={() => setRevealed({ ...revealed, [currentQuestion.key]: true })}
                  >
                    <Eye size={16} />
                    정답 확인
                  </button>
                  <button onClick={randomQuestion}>
                    <Shuffle size={16} />
                    랜덤
                  </button>
                </div>
              </div>

              {revealed[currentQuestion.key] && (
                <section className="solution">
                  <div className="solutionHeader">
                    <h3>정답 및 풀이</h3>
                    <button onClick={() => setRevealed({ ...revealed, [currentQuestion.key]: false })}>
                      <EyeOff size={16} />
                      숨기기
                    </button>
                  </div>
                  <div dangerouslySetInnerHTML={{ __html: currentQuestion.answerHtml }} />
                  {codingExplanation && (
                    <div className="codingExplanation">
                      <h4>{codingExplanation.title}</h4>
                      <p>{codingExplanation.summary}</p>
                      <p>
                        최종 답: <strong>{codingExplanation.answer}</strong>
                      </p>
                      {codingExplanation.trace?.length > 0 && (
                        <div className="traceTable" aria-label="줄별 코드 흐름">
                          {codingExplanation.trace.map((step, index) => (
                            <div className="traceRow" key={`${step.code}-${index}`}>
                              <code>{step.code}</code>
                              <span>{step.note}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="selfCheck">
                    <button className="correct" onClick={() => updateRecord(currentQuestion.key, "correct")}>
                      <CheckCircle2 size={17} />
                      맞았어요
                    </button>
                    <button className="wrong" onClick={() => updateRecord(currentQuestion.key, "wrong")}>
                      <XCircle size={17} />
                      틀렸어요
                    </button>
                  </div>
                </section>
              )}

              <footer className="pager">
                <button onClick={() => jumpTo(currentIndex - 1)} disabled={currentIndex === 0}>
                  이전
                </button>
                <span>
                  {currentIndex + 1} / {visibleQuestions.length}
                </span>
                <button onClick={() => jumpTo(currentIndex + 1)} disabled={currentIndex >= visibleQuestions.length - 1}>
                  다음
                </button>
              </footer>
            </div>
          </article>
        ) : (
          <div className="emptyState">조건에 맞는 문제가 없습니다.</div>
        )}
      </section>
    </main>
  );
}

const rootElement = document.getElementById("root");
window.__examTrainerRoot ??= createRoot(rootElement);
window.__examTrainerRoot.render(<App />);
