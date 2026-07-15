import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BookOpen,
  CheckCircle2,
  Circle,
  ExternalLink,
  Eye,
  EyeOff,
  Menu,
  RotateCcw,
  Search,
  Shuffle,
  XCircle,
  X,
} from "lucide-react";
import { customCodePracticeByLanguage, codeTypePracticeExplanations } from "./data/codePractice";
import { exams } from "./data/exams";
import "./styles.css";

const STORAGE_KEY = "engineer-practical-exam-trainer";

const CODE_LANGUAGE_TYPES = [
  { id: "코드기출-C", title: "코드 기출 C", language: "c", label: "C" },
  { id: "코드기출-Java", title: "코드 기출 Java", language: "java", label: "Java" },
  { id: "코드기출-Python", title: "코드 기출 Python", language: "python", label: "Python" },
];

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

function detectCodeLanguage(text) {
  if (/(C언어|C코드|C 언어|다음은 C\b)/i.test(text)) return "c";
  if (/(Java|JAVA|자바)/i.test(text)) return "java";
  if (/(Python|Pyhon|파이썬)/i.test(text)) return "python";
  return null;
}

function buildCodeTypeExams(baseExams) {
  const buckets = new Map(CODE_LANGUAGE_TYPES.map((type) => [type.language, []]));

  baseExams.forEach((exam) => {
    exam.questions.forEach((question) => {
      const promptText = plainText(question.promptHtml);
      const language = detectCodeLanguage(promptText);
      if (!language || !/(코드|출력값|출력 값|실행 결과|출력되는 값|알맞는 출력)/i.test(promptText)) return;

      const bucket = buckets.get(language);
      const type = CODE_LANGUAGE_TYPES.find((item) => item.language === language);
      bucket.push({
        ...question,
        number: bucket.length + 1,
        sourceUrl: exam.sourceUrl,
        explanationKey: `${exam.id}-${question.number}`,
        promptHtml: `<p><b>[${exam.title} ${question.number}번] ${type.label} 코드 기출</b></p>${question.promptHtml}`,
      });
    });
  });

  customCodePracticeByLanguage.forEach((customExam) => {
    const bucket = buckets.get(customExam.language);
    customExam.questions.forEach((question) => {
      bucket.push({
        ...question,
        number: bucket.length + 1,
      });
    });
  });

  return CODE_LANGUAGE_TYPES.map((type) => ({
    id: type.id,
    title: type.title,
    sourceUrl: "",
    questions: buckets.get(type.language),
  }));
}

const detailedCodeExplanations = {
  ...codeTypePracticeExplanations,
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
  "2026년-1회-12": {
    title: "C 포인터/함수 포인터 흐름",
    summary:
      "구조체 안의 함수 포인터 fn에 dummy가 저장되고, dummy(n)는 배열 n의 두 번째 원소 주소를 반환합니다. 그 주소를 역참조하므로 값 32가 나오고, %x 출력이라 16진수 20이 됩니다.",
    trace: [
      { code: "int n[] = {16, 32};", note: "n[0]=16, n[1]=32입니다. 배열 이름 n은 첫 번째 원소의 주소처럼 사용됩니다." },
      { code: "int *dummy(int *d) { return d + 1; }", note: "dummy는 int 포인터를 받아서 한 칸 뒤 주소를 반환합니다. d가 n[0] 주소라면 d+1은 n[1] 주소입니다." },
      { code: "mine.fn = dummy;", note: "구조체 변수 mine의 함수 포인터 fn이 dummy 함수를 가리키게 됩니다." },
      { code: "mine.fn(n)", note: "dummy(n)과 같습니다. n의 시작 주소를 넘기므로 반환값은 n+1, 즉 n[1]의 주소입니다." },
      { code: "*mine.fn(n)", note: "반환된 n[1] 주소를 *로 역참조하므로 실제 값 32를 꺼냅니다." },
      { code: "printf(\"%x\", 32);", note: "32를 16진수로 출력하면 20입니다. 따라서 출력값은 20입니다." },
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
  "2026년-1회-14": {
    title: "Python 얕은 복사/리스트 누적 흐름",
    summary:
      "b = m[:]는 바깥 리스트만 새로 만들고 안쪽 리스트는 같은 객체를 공유합니다. 그래서 b에서 안쪽 리스트를 +=로 늘리면 m의 안쪽 리스트 길이도 같이 바뀌어 최종 길이 합이 10이 됩니다.",
    trace: [
      { code: "print(f([1, 2, 3, 4]))", note: "함수 f의 매개변수 a는 [1,2,3,4]입니다." },
      { code: "m = [[x] for x in a]", note: "m은 [[1], [2], [3], [4]]가 됩니다. 안쪽 리스트가 각각 따로 만들어집니다." },
      { code: "b = m[:]", note: "b는 새 바깥 리스트지만, b[0]~b[3]는 m[0]~m[3]와 같은 안쪽 리스트를 가리킵니다." },
      { code: "i=0: b[i+1] += b[i]", note: "b[1]에 b[0]을 이어 붙여 b[1]은 [2,1]이 됩니다. 같은 객체라 m[1]도 [2,1]입니다." },
      { code: "i=1: b[i+1] += b[i]", note: "b[2]에 b[1]의 [2,1]을 붙여 b[2]는 [3,2,1]이 됩니다. m[2]도 같이 바뀝니다." },
      { code: "i=2: b[i+1] += b[i]", note: "b[3]에 b[2]의 [3,2,1]을 붙여 b[3]은 [4,3,2,1]이 됩니다. m[3]도 같이 바뀝니다." },
      { code: "sum(len(x) for x in m)", note: "m의 각 길이는 1, 2, 3, 4입니다. 합은 10입니다." },
      { code: "print(10)", note: "따라서 출력값은 10입니다." },
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
  "2026년-1회-18": {
    title: "SQL 집계 흐름",
    summary:
      "dept 테이블의 평균 예산보다 큰 부서를 먼저 찾고, employee와 dept를 부서번호로 조인한 뒤 그 부서에 속한 직원 행 수를 COUNT합니다. 조건을 만족하는 직원 행이 2개라 결과는 2입니다.",
    trace: [
      { code: "SELECT AVG(budget) FROM dept", note: "먼저 dept 테이블 전체 예산의 평균값을 계산합니다." },
      { code: "WHERE d.budget > (평균 예산)", note: "각 부서의 budget이 평균보다 큰 부서만 남깁니다." },
      { code: "employee e JOIN dept d ON e.dep_id = d.dept_id", note: "직원의 dep_id와 부서의 dept_id가 같은 행끼리 붙입니다." },
      { code: "COUNT(*)", note: "조인된 결과 중 평균 예산보다 큰 부서에 속한 직원 행만 셉니다." },
      { code: "결과 행 수", note: "조건을 만족하는 직원 행이 2개이므로 출력값은 2입니다." },
    ],
  },
  "2025년-1회-5": {
    title: "Java 예외 처리 흐름",
    summary:
      "a / b에서 b가 0이라 ArithmeticException이 발생합니다. 해당 catch가 출력1을 찍고, finally는 예외 처리 여부와 관계없이 실행되어 출력5를 이어서 찍습니다.",
    trace: [
      { code: "int a = 5, b = 0;", note: "a는 5, b는 0입니다." },
      { code: "System.out.print(a / b);", note: "5를 0으로 나누려 하므로 ArithmeticException이 발생합니다. 이 print는 정상 출력되지 않습니다." },
      { code: "catch (ArithmeticException e)", note: "발생한 예외 타입과 일치하므로 이 블록으로 이동합니다." },
      { code: "System.out.print(\"출력1\");", note: "먼저 출력1이 화면에 찍힙니다." },
      { code: "finally { System.out.print(\"출력5\"); }", note: "finally는 마지막에 반드시 실행됩니다. 출력1 뒤에 출력5가 붙습니다." },
      { code: "최종 출력", note: "줄바꿈 없이 이어서 찍히므로 출력값은 출력1출력5입니다." },
    ],
  },
  "2025년-1회-10": {
    title: "C 배열 삽입 흐름",
    summary:
      "먼저 문자 코드 차이로 4가 출력됩니다. 그다음 정렬된 문자 배열 BADE 안에서 C가 들어갈 위치를 찾아 D와 E를 한 칸씩 밀어 BACDE를 만듭니다.",
    trace: [
      { code: "char Data[5] = {'B', 'A', 'D', 'E'};", note: "전역 배열이라 남은 Data[4]는 널 문자로 초기화됩니다. 현재 유효 문자는 B, A, D, E입니다." },
      { code: "printf(\"%d\\n\", Data[3] - Data[1]);", note: "Data[3]은 'E'(69), Data[1]은 'A'(65)이므로 69-65=4가 먼저 출력됩니다." },
      { code: "c = 'C';", note: "삽입할 문자는 C입니다." },
      { code: "for (i = 0; i < 5; ++i) if (Data[i] > c) break;", note: "B>C는 거짓, A>C도 거짓, D>C는 참입니다. 따라서 i=2에서 멈춥니다." },
      { code: "temp = Data[i]; Data[i] = c;", note: "Data[2]의 D를 temp에 보관하고 Data[2]를 C로 바꿉니다. 배열은 B A C E 입니다." },
      { code: "i++; for (; i < 5; ++i)", note: "i=3부터 뒤 원소를 한 칸씩 밀어 넣습니다. E 자리에는 D가 들어가고, 마지막 자리에는 E가 들어갑니다." },
      { code: "for (i = 0; i < 5; i++) printf(\"%c\", Data[i]);", note: "최종 배열은 B A C D E이므로 BACDE가 출력됩니다." },
      { code: "최종 출력", note: "첫 줄의 4와 다음 출력 BACDE를 합치면 정답은 4 BACDE입니다." },
    ],
  },
  "2025년-1회-11": {
    title: "C 2차원 배열 배치 흐름",
    summary:
      "set 함수가 data 값을 일반적인 순서가 아니라 계산된 행/열에 배치합니다. 만들어진 3x3 배열을 앞에서부터 읽으며 짝수 위치는 더하고 홀수 위치는 빼서 최종 합 13이 됩니다.",
    trace: [
      { code: "rows = 3, cols = 3", note: "배열은 3행 3열입니다." },
      { code: "data = {5,2,7,4,1,8,3,6,9}", note: "data[0]부터 data[8]까지 순서대로 set 함수에서 배치됩니다." },
      { code: "arr[((i+1)/rows)%rows][(i+1)%cols] = data[i];", note: "정수 나눗셈 기준으로 i=0..8을 넣으면 행렬은 [9,5,2] / [7,4,1] / [8,3,6]이 됩니다." },
      { code: "i=0..2", note: "sum = +arr[0][0] - arr[0][1] + arr[0][2] = 9 - 5 + 2 = 6입니다." },
      { code: "i=3..5", note: "sum에 -arr[1][0] + arr[1][1] - arr[1][2]가 이어져 6 - 7 + 4 - 1 = 2입니다." },
      { code: "i=6..8", note: "sum에 +arr[2][0] - arr[2][1] + arr[2][2]가 이어져 2 + 8 - 3 + 6 = 13입니다." },
      { code: "printf(\"%d\", sum);", note: "최종 출력은 13입니다." },
    ],
  },
  "2025년-1회-13": {
    title: "Java 생성자/오버라이딩 흐름",
    summary:
      "Child 객체를 만들 때 Parent 생성자가 먼저 실행됩니다. Parent 생성자 안의 show()도 실제 객체가 Child라서 Child.show()가 호출되고, 이후 Child 생성자에서 total이 다시 커져 최종 54가 됩니다.",
    trace: [
      { code: "new Child();", note: "Child를 만들기 전에 부모 Parent의 필드와 생성자가 먼저 처리됩니다." },
      { code: "Parent.v = 1; total = 0;", note: "Parent 쪽 인스턴스 변수 v는 1, static total은 0에서 시작합니다." },
      { code: "Parent(): total += (++v);", note: "Parent.v가 1에서 2로 증가하고 total은 0+2=2가 됩니다." },
      { code: "Parent(): show();", note: "생성자 안이지만 실제 객체는 Child이므로 Child.show()가 호출됩니다." },
      { code: "Child.show(): total += total * 2;", note: "total은 2 + 2*2 = 6이 됩니다." },
      { code: "Child.v = 10; Child(): v += 2;", note: "Child 필드 v가 10으로 초기화된 뒤 12가 됩니다." },
      { code: "total += v++;", note: "현재 Child.v 12를 더해 total은 18이 되고, 그 뒤 Child.v는 13이 됩니다." },
      { code: "show();", note: "다시 Child.show()가 실행되어 total은 18 + 18*2 = 54가 됩니다." },
      { code: "System.out.println(Parent.total);", note: "static 변수 total의 최종값 54가 출력됩니다." },
    ],
  },
  "2025년-1회-16": {
    title: "Java 재귀 데이터 흐름",
    summary:
      "배열 data는 [3, 5, 8, 12, 17]이고 main에서 func(data, 0, 4)를 호출합니다. 각 호출은 가운데 값 a[mid]를 더하고, 왼쪽 구간 재귀값과 오른쪽 구간 재귀값 중 큰 값을 더합니다. 최종적으로 8 + max(5, 12) = 20이 출력됩니다.",
    trace: [
      {
        code: "int[] data = {3, 5, 8, 12, 17};",
        note: "인덱스별 값은 a[0]=3, a[1]=5, a[2]=8, a[3]=12, a[4]=17입니다.",
      },
      {
        code: "System.out.println(func(data, 0, data.length - 1));",
        note: "data.length는 5이므로 최초 호출은 func(data, 0, 4)입니다.",
      },
      {
        code: "func(a, 0, 4): if (st >= end) return 0;",
        note: "0 >= 4는 거짓입니다. 바로 0을 반환하지 않고 mid를 계산합니다.",
      },
      {
        code: "int mid = (0 + 4) / 2;",
        note: "정수 나눗셈 결과 mid=2입니다. 따라서 현재 호출의 기준값은 a[2]=8입니다.",
      },
      {
        code: "return a[2] + Math.max(func(a, 0, 2), func(a, 3, 4));",
        note: "현재 반환값은 8 + max(왼쪽 구간 결과, 오른쪽 구간 결과) 형태가 됩니다.",
      },
      {
        code: "func(a, 0, 2)",
        note: "0 >= 2는 거짓, mid=(0+2)/2=1입니다. a[1]=5를 기준으로 다시 func(a,0,1), func(a,2,2)를 비교합니다.",
      },
      {
        code: "func(a, 0, 1)",
        note: "0 >= 1은 거짓, mid=(0+1)/2=0입니다. a[0]=3 + max(func(a,0,0), func(a,1,1))가 됩니다. 두 하위 호출은 st>=end라서 모두 0을 반환하므로 결과는 3입니다.",
      },
      {
        code: "func(a, 2, 2)",
        note: "2 >= 2가 참이라서 0을 반환합니다.",
      },
      {
        code: "func(a, 0, 2) 결과",
        note: "a[1]=5 + max(3, 0) = 8입니다. 왼쪽 구간 결과는 8입니다.",
      },
      {
        code: "func(a, 3, 4)",
        note: "3 >= 4는 거짓, mid=(3+4)/2=3입니다. a[3]=12 + max(func(a,3,3), func(a,4,4))가 됩니다.",
      },
      {
        code: "func(a, 3, 3), func(a, 4, 4)",
        note: "두 호출 모두 st>=end 조건이 참이므로 각각 0을 반환합니다.",
      },
      {
        code: "func(a, 3, 4) 결과",
        note: "a[3]=12 + max(0, 0) = 12입니다. 오른쪽 구간 결과는 12입니다.",
      },
      {
        code: "func(a, 0, 4) 최종 결과",
        note: "처음 호출로 돌아오면 a[2]=8 + max(왼쪽 8, 오른쪽 12) = 8 + 12 = 20입니다.",
      },
      {
        code: "System.out.println(20);",
        note: "따라서 화면에 출력되는 값은 20입니다.",
      },
    ],
  },
  "2025년-1회-17": {
    title: "Python 트리 레벨 합산 흐름",
    summary:
      "리스트를 완전이진트리처럼 연결한 뒤, level이 홀수인 노드 값만 더합니다. 루트 3은 level 0이라 제외되고, level 1의 5와 8만 더해 13이 됩니다.",
    trace: [
      { code: "li = [3, 5, 8, 12, 15, 18, 21]", note: "각 값이 Node 객체가 됩니다." },
      { code: "nodes[(i - 1) // 2].children.append(nodes[i])", note: "i=1,2는 루트 3의 자식이 되어 5와 8이 level 1에 놓입니다." },
      { code: "i=3,4,5,6", note: "12와 15는 5의 자식, 18과 21은 8의 자식이 되어 level 2에 놓입니다." },
      { code: "calc(root, level=0)", note: "루트 3은 level 0입니다. level % 2 == 1이 아니므로 3은 더하지 않습니다." },
      { code: "calc(5, level=1), calc(8, level=1)", note: "level 1은 홀수이므로 5와 8을 더합니다." },
      { code: "calc(12,15,18,21, level=2)", note: "level 2는 짝수라 네 값은 모두 0으로 처리됩니다." },
      { code: "print(calc(root))", note: "홀수 레벨 합은 5 + 8 = 13입니다." },
    ],
  },
  "2025년-1회-18": {
    title: "C 연결 리스트 재배치 흐름",
    summary:
      "insert는 새 노드를 항상 머리에 붙이므로 1부터 5까지 넣으면 리스트는 5→4→3→2→1입니다. reconnect(head, 3)은 값 3인 노드를 떼어 머리로 옮겨 3→5→4→2→1이 됩니다.",
    trace: [
      { code: "head = NULL; for (i=1; i<=5; i++) head = insert(head, i);", note: "insert는 새 노드의 next를 기존 head로 두기 때문에 순서가 앞에 계속 붙습니다." },
      { code: "insert 1,2,3,4,5", note: "각 단계 후 리스트는 1, 2→1, 3→2→1, 4→3→2→1, 5→4→3→2→1입니다." },
      { code: "head = reconnect(head, 3);", note: "head 값은 5라서 바로 반환하지 않고, 값 3인 노드를 찾습니다." },
      { code: "while (curr != NULL && curr->value != value)", note: "prev=5 curr=4, 다음에 prev=4 curr=3이 되어 탐색이 멈춥니다." },
      { code: "prev->next = curr->next;", note: "4의 next를 3이 아니라 2로 바꿔 3을 기존 자리에서 뗍니다." },
      { code: "curr->next = head; head = curr;", note: "3의 next를 기존 head 5로 두고, head를 3으로 바꿉니다. 리스트는 3→5→4→2→1입니다." },
      { code: "printf(\"%d\", curr->value)", note: "머리부터 끝까지 출력하므로 35421이 됩니다." },
    ],
  },
  "2025년-1회-19": {
    title: "C 구조체/비트 AND 흐름",
    summary:
      "각 score 값은 dec에서 0xA5와 비트 AND 됩니다. Kim과 Lee의 세 점수 합이 각각 454가 되고 두 학생 합계가 908이 됩니다.",
    trace: [
      { code: "dec(enc) { return enc & 0xA5; }", note: "enc의 비트 중 0xA5에서 1인 자리만 남기는 비트 AND 연산입니다." },
      { code: "Kim: {0xA0, 0xA5, 0xDB}", note: "0xA0&0xA5=0xA0(160), 0xA5&0xA5=0xA5(165), 0xDB&0xA5=0x81(129)입니다." },
      { code: "sum(&s[0])", note: "Kim의 합은 160+165+129=454입니다." },
      { code: "Lee: {0xA0, 0xED, 0x81}", note: "0xA0&0xA5=160, 0xED&0xA5=0xA5(165), 0x81&0xA5=0x81(129)입니다." },
      { code: "sum(&s[1])", note: "Lee의 합도 160+165+129=454입니다." },
      { code: "result += sum(&s[i])", note: "두 학생 합계는 454+454=908입니다." },
      { code: "printf(\"%d\", result);", note: "최종 출력은 908입니다." },
    ],
  },
  "2025년-1회-20": {
    title: "Java 오버로딩/재귀 흐름",
    summary:
      "처음 인자는 문자열 \"5\"라 calc(String)이 선택됩니다. 그 안에서 정수 5로 바꾼 뒤 calc(4)와 calc(2)를 호출하고, 정수 버전 재귀 결과 3과 1을 더해 4가 됩니다.",
    trace: [
      { code: "System.out.println(calc(\"5\"));", note: "인자가 문자열이므로 calc(String str)이 호출됩니다." },
      { code: "int value = Integer.valueOf(str);", note: "문자열 \"5\"가 정수 5로 바뀝니다." },
      { code: "return calc(value - 1) + calc(value - 3);", note: "value가 5라서 calc(4) + calc(2)를 계산합니다. 이 호출들은 int 버전입니다." },
      { code: "calc(int): f(0)=0, f(1)=1", note: "정수 버전은 value<=1이면 그대로 반환합니다." },
      { code: "calc(2)", note: "calc(1)+calc(0)=1+0=1입니다." },
      { code: "calc(3)", note: "calc(2)+calc(1)=1+1=2입니다." },
      { code: "calc(4)", note: "calc(3)+calc(2)=2+1=3입니다." },
      { code: "calc(\"5\") 결과", note: "calc(4)+calc(2)=3+1=4이므로 최종 출력은 4입니다." },
    ],
  },
  "2025년-2회-5": {
    title: "Java 배열 참조/문자열 전달 흐름",
    summary:
      "배열 data 자체는 참조가 전달되어 data[0] 변경이 main에도 반영됩니다. 하지만 매개변수 s에 새 문자열 Z를 넣는 것은 main의 s를 바꾸지 못해 최종 BB가 됩니다.",
    trace: [
      { code: "String data[] = {\"A\"}; String s = \"B\";", note: "main에서 data[0]은 A, s는 B입니다." },
      { code: "change(data, s);", note: "배열 참조와 문자열 값 B가 매개변수로 전달됩니다." },
      { code: "data[0] = s;", note: "change 안의 s는 B이므로 전달받은 배열의 0번 칸이 B로 바뀝니다. main의 data[0]도 B입니다." },
      { code: "s = \"Z\";", note: "change 안의 지역 변수 s만 Z를 가리키게 됩니다. main의 s는 여전히 B입니다." },
      { code: "System.out.print(data[0] + s);", note: "main 기준 data[0]=B, s=B라서 BB가 출력됩니다." },
    ],
  },
  "2025년-2회-9": {
    title: "Java 람다/예외 흐름",
    summary:
      "첫 번째 람다는 x=3에서 예외를 던져 run이 7을 반환합니다. 두 번째 람다는 3+9=12를 정상 반환하므로 두 결과를 더해 19가 됩니다.",
    trace: [
      { code: "run(f)", note: "run은 내부에서 f.apply(3)을 호출합니다." },
      { code: "if (x > 2) throw new Exception();", note: "x가 3이라 조건이 참입니다. 예외가 발생합니다." },
      { code: "catch (Exception e) { return 7; }", note: "예외를 잡아서 첫 번째 run(f)는 7을 반환합니다." },
      { code: "run((int n) -> n + 9)", note: "두 번째 람다도 n=3으로 호출됩니다." },
      { code: "n + 9", note: "3+9=12이고 예외가 없으므로 run은 12를 반환합니다." },
      { code: "System.out.print(7 + 12);", note: "최종 출력은 19입니다." },
    ],
  },
  "2025년-2회-10": {
    title: "Java 동적 바인딩/static 메서드 흐름",
    summary:
      "ref의 실제 객체는 Child라서 인스턴스 메서드 x(2)는 Child.x가 실행되어 5가 됩니다. 하지만 static 메서드 id는 참조 타입 Parent 기준으로 결정되어 P가 붙습니다.",
    trace: [
      { code: "Parent ref = new Child();", note: "참조 타입은 Parent, 실제 객체 타입은 Child입니다." },
      { code: "ref.x(2)", note: "x(int)는 인스턴스 메서드라 실제 객체 기준으로 Child.x(int)가 호출됩니다." },
      { code: "Child.x(int i) { return i + 3; }", note: "i=2이므로 2+3=5입니다." },
      { code: "ref.id()", note: "id는 static 메서드라 오버라이딩 대상이 아니고 참조 타입 Parent 기준으로 선택됩니다." },
      { code: "Parent.id() { return \"P\"; }", note: "문자열 P가 반환됩니다." },
      { code: "ref.x(2) + ref.id()", note: "5 + \"P\"는 문자열 결합이 되어 5P가 출력됩니다." },
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
  const questionKey = question.explanationKey ?? `${question.examId}-${question.number}`;
  const detailed = detailedCodeExplanations[questionKey];
  if (detailed) return { ...detailed, answer, mode: "detailed" };

  const isCoding =
    /(C언어|자바|Java|JAVA|파이썬|Python|Pyhon|코드|소스코드|출력값|출력 값|SQL)/i.test(prompt);

  if (!isCoding) return null;

  const codeLines = extractCodeLines(question.promptHtml);
  const trace = [];

  return {
    title: /sql/i.test(prompt) ? "SQL 풀이 포인트" : "코드 추적 풀이",
    answer,
    summary: codeLines.length
      ? "이 문제는 아직 값 변화까지 검증한 상세 풀이가 준비되지 않았습니다. 일반 문법 설명으로 대체하지 않기 위해 정답만 표시합니다."
      : "이 문제는 코드 블록이 표 형태로 추출되지 않아 정답만 표시합니다.",
    trace,
    mode: "summary",
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
  const codeTypeExams = useMemo(() => buildCodeTypeExams(exams), []);
  const trainingExams = useMemo(() => [...codeTypeExams, ...exams], [codeTypeExams]);
  const [selectedExamId, setSelectedExamId] = useState(CODE_LANGUAGE_TYPES[0].id);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [revealed, setRevealed] = useState({});
  const [progress, setProgress] = useState(loadProgress);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [practiceMode, setPracticeMode] = useState("sequence");
  const [examPanelOpen, setExamPanelOpen] = useState(false);
  const [numberPanelOpen, setNumberPanelOpen] = useState(false);

  const selectedExam = trainingExams.find((exam) => exam.id === selectedExamId) ?? trainingExams[0];

  const allQuestions = useMemo(
    () =>
      trainingExams.flatMap((exam) =>
        exam.questions.map((question, index) => ({
          ...question,
          examId: exam.id,
          examTitle: exam.title,
          sourceUrl: question.sourceUrl ?? exam.sourceUrl,
          localIndex: index,
          key: `${exam.id}-${question.number}`,
        })),
      ),
    [trainingExams],
  );

  const visibleQuestions = useMemo(() => {
    const base =
      practiceMode === "all"
        ? allQuestions
        : selectedExam.questions.map((question, index) => ({
            ...question,
            examId: selectedExam.id,
            examTitle: selectedExam.title,
            sourceUrl: question.sourceUrl ?? selectedExam.sourceUrl,
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
    setNumberPanelOpen(false);
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
    setExamPanelOpen(false);
  }

  return (
    <main className={`app ${examPanelOpen || numberPanelOpen ? "panelOpen" : ""}`}>
      {(examPanelOpen || numberPanelOpen) && (
        <button
          className="panelBackdrop"
          aria-label="패널 닫기"
          onClick={() => {
            setExamPanelOpen(false);
            setNumberPanelOpen(false);
          }}
        />
      )}

      <aside className={`sidebar ${examPanelOpen ? "open" : ""}`}>
        <button className="drawerClose" aria-label="회차 패널 닫기" onClick={() => setExamPanelOpen(false)}>
          <X size={18} />
        </button>
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
          {trainingExams.map((exam) => {
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
          <div className="mobilePanelActions" aria-label="학습 패널 열기">
            <button
              className={examPanelOpen ? "active" : ""}
              onClick={() => {
                setExamPanelOpen((open) => !open);
                setNumberPanelOpen(false);
              }}
            >
              <Menu size={16} />
              회차
            </button>
            <button
              className={numberPanelOpen ? "active" : ""}
              onClick={() => {
                setNumberPanelOpen((open) => !open);
                setExamPanelOpen(false);
              }}
            >
              <Menu size={16} />
              문제 번호
            </button>
          </div>
          <div>
            <p>{currentQuestion?.examTitle ?? "문제 없음"}</p>
            <h2>
              {currentQuestion ? `${currentQuestion.number}번 문제` : "불러온 문제가 없습니다"}
            </h2>
          </div>
          {currentQuestion?.sourceUrl && (
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
            <div className={`questionNav ${numberPanelOpen ? "open" : ""}`} aria-label="문제 목록">
              <div className="numberPanelHeader">
                <strong>문제 번호</strong>
                <button aria-label="문제 번호 패널 닫기" onClick={() => setNumberPanelOpen(false)}>
                  <X size={18} />
                </button>
              </div>
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
