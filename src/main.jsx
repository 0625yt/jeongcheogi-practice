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

function getCodingExplanation(question) {
  const prompt = plainText(question.promptHtml);
  const answer = question.answerText;
  const isCoding =
    /(C언어|자바|Java|JAVA|파이썬|Python|Pyhon|코드|소스코드|출력값|출력 값|SQL)/i.test(prompt);

  if (!isCoding) return null;

  const lowerPrompt = prompt.toLowerCase();
  const points = [];

  if (/sql/i.test(prompt)) {
    points.push("FROM/JOIN으로 먼저 대상 행을 만들고, ON 조건과 WHERE 조건으로 남는 행을 줄입니다.");
    points.push("DISTINCT, COUNT, GROUP BY가 있으면 중복 제거가 어느 시점에 적용되는지 따로 계산합니다.");
    points.push("최종 SELECT 절이 값 자체를 보여주는지, 행 개수나 집계값을 보여주는지 확인합니다.");
  } else if (/python|pyhon|파이썬/i.test(prompt)) {
    points.push("리스트, 딕셔너리, 집합처럼 값이 바뀌는 객체는 변경 전후 상태를 표로 적어가며 추적합니다.");
    points.push("슬라이싱, 얕은 복사, join, comprehension이 있으면 새 객체를 만드는지 기존 객체를 바꾸는지 구분합니다.");
    points.push("print의 end 값과 문자열 결합 순서를 마지막에 반영해 실제 출력 모양을 맞춥니다.");
  } else if (/java|자바/i.test(prompt)) {
    points.push("오버라이딩은 실행 시점의 실제 객체 타입, 오버로딩은 컴파일 시점의 매개변수 타입을 기준으로 봅니다.");
    points.push("생성자, static 멤버, 예외 처리, 재귀 호출이 있으면 실행 순서대로 호출 스택을 적어봅니다.");
    points.push("문자열과 숫자가 함께 더해질 때는 왼쪽부터 계산되며, 문자열을 만난 뒤에는 이어붙이기가 됩니다.");
  } else if (/c언어|#include|stdio|printf|scanf|struct|pointer|\*/i.test(prompt)) {
    points.push("배열 인덱스, 포인터 이동, 구조체 멤버 접근이 있으면 각 변수의 현재 값을 한 줄씩 갱신합니다.");
    points.push("전위/후위 증가, 형 변환, 나눗셈, 주소 참조 연산은 계산되는 순간의 값을 기준으로 확인합니다.");
    points.push("printf의 서식 지정자와 줄바꿈 여부를 마지막에 적용해 출력 형태를 맞춥니다.");
  } else {
    points.push("초기값을 먼저 적고, 반복문/조건문/함수 호출 순서대로 변수 값을 갱신합니다.");
    points.push("출력문이 여러 개면 출력되는 순서와 줄바꿈 여부를 마지막에 합칩니다.");
  }

  if (/for|while|range|반복/i.test(lowerPrompt)) {
    points.push("반복문은 시작값, 종료 조건, 증가식을 먼저 확인한 뒤 각 반복마다 바뀐 값만 따로 적습니다.");
  }

  if (/재귀|recursive|return\s+\w+\(/i.test(lowerPrompt)) {
    points.push("재귀는 종료 조건에서 되돌아오며 더해지거나 곱해지는 값을 역순으로 계산합니다.");
  }

  if (/try|catch|exception|예외/i.test(lowerPrompt)) {
    points.push("예외가 발생하면 그 시점의 일반 실행 흐름은 멈추고, 맞는 catch/finally 블록으로 이동합니다.");
  }

  return {
    title: /sql/i.test(prompt) ? "SQL 풀이 포인트" : "코드 추적 풀이",
    answer,
    points: [...new Set(points)].slice(0, 5),
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
                      <p>
                        최종 답은 <strong>{codingExplanation.answer}</strong> 입니다. 아래 순서로 코드를 따라가면
                        정답이 나오는지 확인할 수 있습니다.
                      </p>
                      <ol>
                        {codingExplanation.points.map((point) => (
                          <li key={point}>{point}</li>
                        ))}
                      </ol>
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
