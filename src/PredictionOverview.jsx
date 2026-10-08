import React from "react";
import { ChevronRight, Clock3 } from "lucide-react";

export default function PredictionOverview({
  catalog,
  group,
  current,
  onRelated,
  onExam,
}) {
  const analysis = catalog.predictionAnalysis;
  return (
    <section className="predictionContext" aria-label="예상 문제집 분석 근거">
      <div className="predictionHeading">
        <div>
          <strong>{group.title}</strong>
          <p>{group.focus}</p>
        </div>
        <button onClick={onExam}>
          <Clock3 size={16} />
          150분 실전 모드
        </button>
      </div>
      <p className="predictionCaution">
        기출 패턴을 바탕으로 새로 만든 연습 문제입니다. 실제 기출이나 출제
        확률·적중 보장이 아닙니다.
      </p>
      <details className="predictionAnalysis">
        <summary>최근 흐름과 구성 근거</summary>
        <p>
          수록된 2020~2026년 {catalog.examCount}회차 {analysis.totalCount}문항을
          참고했습니다. 최근 2025~2026년 {analysis.recentCount}문항 중 코드
          문항은 {analysis.codeCount}개입니다.
        </p>
        <div className="predictionTable">
          <table>
            <thead>
              <tr>
                <th>연도</th>
                <th>전체</th>
                <th>C</th>
                <th>Java</th>
                <th>Python</th>
              </tr>
            </thead>
            <tbody>
              {analysis.years.map((row) => (
                <tr key={row.year}>
                  <th scope="row">{row.year}</th>
                  <td>{row.total}</td>
                  <td>{row.c}</td>
                  <td>{row.java}</td>
                  <td>{row.python}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          최근 코드에서는 포인터·구조체, 재귀 반환값, 객체·상속, 문자열·리스트
          상태 추적이 반복됩니다. 2026년 2회 복원본의 C 3·Java 2·Python 2·SQL
          4·이론 9 구성을 참고하되, 다섯 권의 세부 유형은 다르게 구성했습니다.
        </p>
        <p>
          SQL의 NULL·집계·조인, 서브넷 계산, 테스트 기법 구분, 보안·설계 개념도
          포함했습니다. 이는 수록 자료에서 도출한 학습 방향이며 공식 출제 비율은
          아닙니다. 이미지에만 있는 문항은 텍스트 기반 유형 집계에서 누락될 수
          있습니다.
        </p>
      </details>
      {!!current.evidenceKeys?.length && (
        <details className="predictionEvidence">
          <summary>
            이 문제와 같은 유형의 최근 기출 · {current.topics.join(" · ")}
          </summary>
          <div>
            {current.evidenceKeys.map((key) => {
              const q = catalog.questions.find((q) => q.key === key);
              return (
                <button key={key} onClick={() => onRelated(q)}>
                  {q.examTitle} {q.number}번<ChevronRight size={14} />
                </button>
              );
            })}
          </div>
        </details>
      )}
    </section>
  );
}
