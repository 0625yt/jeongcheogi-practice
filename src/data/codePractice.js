const escapeHtml = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const codeBlock = (code) => `
<div class="colorscripter-code custom-code">
  <pre><code>${escapeHtml(code.trim())}</code></pre>
</div>
`;

const question = (number, language, code, answerText) => ({
  number,
  promptHtml: `
    <p><b>${number}. 다음 ${language} 코드의 출력값을 작성하시오.</b></p>
    ${codeBlock(code)}
  `,
  answerHtml: `<p>${answerText}</p>`,
  answerText,
});

export const codePracticeExam = {
  id: "코드기출-유형",
  title: "코드 기출 유형",
  sourceUrl: "",
  questions: [
    question(
      1,
      "C언어",
      `
#include <stdio.h>

int main() {
    int a[] = {4, 7, 10};
    int *p = a;
    printf("%d", *p + *(p + 2) + ++p[1]);
    return 0;
}
      `,
      "22",
    ),
    question(
      2,
      "C언어",
      `
#include <stdio.h>

typedef struct {
    char *name;
    int score;
} Score;

int main() {
    Score s[] = {{"A", 80}, {"B", 75}, {"C", 90}};
    Score *p = s;
    p++;
    p->score += 5;
    printf("%s %d", p->name, (p + 1)->score - p->score);
    return 0;
}
      `,
      "B 10",
    ),
    question(
      3,
      "C언어",
      `
#include <stdio.h>

int f(int n) {
    if (n <= 1) return n;
    return f(n - 1) + f(n - 2) + 1;
}

int main() {
    printf("%d", f(4));
    return 0;
}
      `,
      "7",
    ),
    question(
      4,
      "C언어",
      `
#include <stdio.h>

int main() {
    int x = 2;
    int y = 0;

    switch (x) {
        case 1: y += 3;
        case 2: y += 5;
        case 3: y += 7; break;
        default: y = 9;
    }

    printf("%d", y);
    return 0;
}
      `,
      "12",
    ),
    question(
      5,
      "Java",
      `
class Parent {
    static int v = 1;
    int f() { return v + 1; }
}

class Child extends Parent {
    static int v = 5;
    int f() { return v + 2; }
}

public class Main {
    public static void main(String[] args) {
        Parent p = new Child();
        System.out.print(p.f() + Parent.v + Child.v);
    }
}
      `,
      "13",
    ),
    question(
      6,
      "Java",
      `
public class Main {
    static void edit(StringBuilder a, String b) {
        a.append(b);
        b = "Z";
        a.append(b);
    }

    public static void main(String[] args) {
        StringBuilder sb = new StringBuilder("A");
        String s = "B";
        edit(sb, s);
        System.out.print(sb.toString() + s);
    }
}
      `,
      "ABZB",
    ),
    question(
      7,
      "Java",
      `
public class Main {
    static int f() {
        try {
            return 3;
        } finally {
            return 5;
        }
    }

    public static void main(String[] args) {
        System.out.print(f());
    }
}
      `,
      "5",
    ),
    question(
      8,
      "Java",
      `
public class Main {
    static int calc(int[] a) {
        int r = 0;
        for (int i = 0; i < a.length; i++) {
            a[i] += i;
            if (a[i] % 2 == 0) r += a[i];
        }
        return r;
    }

    public static void main(String[] args) {
        int[] data = {2, 3, 4, 5};
        System.out.print(calc(data));
    }
}
      `,
      "20",
    ),
    question(
      9,
      "Python",
      `
a = [[1], [2]]
b = a[:]
b[0].append(3)
b.append([4])
print(len(a), sum(len(x) for x in a))
      `,
      "2 3",
    ),
    question(
      10,
      "Python",
      `
data = [1, 2, 3, 4]
result = {x: x * x for x in data if x % 2 == 0}
print(sum(result.values()))
      `,
      "20",
    ),
    question(
      11,
      "Python",
      `
def f(x, arr=[]):
    arr.append(x)
    return sum(arr)

print(f(1), f(2), f(3, []), f(4))
      `,
      "1 3 3 7",
    ),
    question(
      12,
      "Python",
      `
s = "INFORMATION"
print(s[1::3] + s[-2::-4])
      `,
      "NRTNOMN",
    ),
  ],
};

export const codePracticeExplanations = {
  "코드기출-유형-1": {
    title: "C 포인터/전위 증가 흐름",
    summary: "p는 배열 a의 첫 원소를 가리킵니다. *p는 a[0], *(p+2)는 a[2], ++p[1]은 a[1]을 먼저 8로 증가시킨 뒤 그 값을 사용합니다.",
    trace: [
      { code: "int a[] = {4, 7, 10};", note: "a[0]=4, a[1]=7, a[2]=10입니다." },
      { code: "int *p = a;", note: "p는 a[0]의 주소를 가리킵니다." },
      { code: "*p", note: "p가 a[0]을 가리키므로 *p는 4입니다." },
      { code: "*(p + 2)", note: "p에서 두 칸 이동하면 a[2]이므로 값은 10입니다." },
      { code: "++p[1]", note: "p[1]은 a[1]입니다. 전위 증가라 7이 먼저 8이 되고, 식에는 8이 사용됩니다." },
      { code: "printf(\"%d\", 4 + 10 + 8);", note: "합은 22이므로 출력값은 22입니다." },
    ],
  },
  "코드기출-유형-2": {
    title: "C 구조체 포인터 흐름",
    summary: "p++로 포인터가 두 번째 구조체 B를 가리키고, B의 score가 75에서 80으로 바뀝니다. 그 다음 C의 90에서 B의 80을 빼서 10이 됩니다.",
    trace: [
      { code: "Score s[] = {{\"A\",80}, {\"B\",75}, {\"C\",90}};", note: "s[0]=A 80, s[1]=B 75, s[2]=C 90입니다." },
      { code: "Score *p = s;", note: "p는 처음에 s[0]을 가리킵니다." },
      { code: "p++;", note: "구조체 배열에서 한 칸 이동해 p는 s[1], 즉 B를 가리킵니다." },
      { code: "p->score += 5;", note: "p가 가리키는 B의 점수 75가 80으로 바뀝니다." },
      { code: "(p + 1)->score - p->score", note: "p+1은 s[2] C입니다. 90 - 80 = 10입니다." },
      { code: "printf(\"%s %d\", p->name, 10);", note: "p->name은 B이므로 B 10이 출력됩니다." },
    ],
  },
  "코드기출-유형-3": {
    title: "C 재귀 흐름",
    summary: "f(0)=0, f(1)=1이고, 그 이후는 f(n-1)+f(n-2)+1입니다. f(4)는 7입니다.",
    trace: [
      { code: "f(0), f(1)", note: "n<=1 조건 때문에 각각 0, 1을 반환합니다." },
      { code: "f(2)", note: "f(1)+f(0)+1 = 1+0+1 = 2입니다." },
      { code: "f(3)", note: "f(2)+f(1)+1 = 2+1+1 = 4입니다." },
      { code: "f(4)", note: "f(3)+f(2)+1 = 4+2+1 = 7입니다." },
      { code: "printf(\"%d\", f(4));", note: "최종 출력은 7입니다." },
    ],
  },
  "코드기출-유형-4": {
    title: "C switch fall-through 흐름",
    summary: "x가 2라 case 2부터 실행됩니다. case 2 뒤에 break가 없어서 case 3까지 이어서 실행되고, case 3에서 break로 종료됩니다.",
    trace: [
      { code: "int x = 2; int y = 0;", note: "x는 2, y는 0입니다." },
      { code: "switch (x)", note: "x가 2이므로 case 2 위치로 이동합니다." },
      { code: "case 2: y += 5;", note: "y는 0+5=5가 됩니다." },
      { code: "case 3: y += 7; break;", note: "case 2에 break가 없어 case 3도 실행됩니다. y는 5+7=12가 되고 break로 switch를 빠져나갑니다." },
      { code: "default", note: "이미 break로 빠져나갔으므로 default는 실행되지 않습니다." },
      { code: "printf(\"%d\", y);", note: "최종 출력은 12입니다." },
    ],
  },
  "코드기출-유형-5": {
    title: "Java 상속/static 흐름",
    summary: "p.f()는 실제 객체 Child 기준으로 실행되지만, Parent.v와 Child.v는 각각 클래스 이름으로 직접 접근합니다.",
    trace: [
      { code: "Parent p = new Child();", note: "참조 타입은 Parent, 실제 객체는 Child입니다." },
      { code: "p.f()", note: "f는 인스턴스 메서드라 실제 객체 Child의 f가 호출됩니다." },
      { code: "Child.f(): return v + 2;", note: "Child 안에서 v는 Child.v=5를 의미하므로 5+2=7입니다." },
      { code: "Parent.v", note: "Parent 클래스의 static 변수 v는 1입니다." },
      { code: "Child.v", note: "Child 클래스의 static 변수 v는 5입니다." },
      { code: "System.out.print(7 + 1 + 5);", note: "합은 13이므로 출력값은 13입니다." },
    ],
  },
  "코드기출-유형-6": {
    title: "Java 참조 전달/String 흐름",
    summary: "StringBuilder는 같은 객체가 전달되어 append 결과가 main에도 남습니다. String b는 지역 변수만 Z로 바뀌고 main의 s는 그대로 B입니다.",
    trace: [
      { code: "StringBuilder sb = new StringBuilder(\"A\"); String s = \"B\";", note: "main에서 sb는 A, s는 B입니다." },
      { code: "edit(sb, s);", note: "StringBuilder 객체 참조와 문자열 B가 전달됩니다." },
      { code: "a.append(b);", note: "a는 sb와 같은 객체라 A 뒤에 B가 붙어 sb는 AB가 됩니다." },
      { code: "b = \"Z\";", note: "edit 함수의 지역 변수 b만 Z를 가리킵니다. main의 s는 여전히 B입니다." },
      { code: "a.append(b);", note: "같은 StringBuilder에 Z가 붙어 sb는 ABZ가 됩니다." },
      { code: "sb.toString() + s", note: "ABZ에 main의 s인 B를 붙여 ABZB가 출력됩니다." },
    ],
  },
  "코드기출-유형-7": {
    title: "Java try/finally 반환 흐름",
    summary: "try에서 return 3이 준비되지만 finally가 반드시 실행되고, finally의 return 5가 앞의 반환값을 덮습니다.",
    trace: [
      { code: "f() 호출", note: "main에서 f()를 호출합니다." },
      { code: "try { return 3; }", note: "먼저 3을 반환하려고 준비합니다." },
      { code: "finally { return 5; }", note: "반환 직전에 finally가 실행되고, 여기서 다시 5를 반환합니다." },
      { code: "System.out.print(f());", note: "finally의 반환값 5가 최종 출력됩니다." },
    ],
  },
  "코드기출-유형-8": {
    title: "Java 배열 갱신 흐름",
    summary: "반복문에서 각 원소에 인덱스 i를 더한 뒤, 짝수인 값만 r에 누적합니다. 네 값이 모두 짝수가 되어 20이 됩니다.",
    trace: [
      { code: "int[] data = {2, 3, 4, 5};", note: "초기 배열은 [2,3,4,5]입니다." },
      { code: "i=0: a[0] += 0", note: "a[0]은 2입니다. 짝수라 r=2가 됩니다." },
      { code: "i=1: a[1] += 1", note: "3+1=4입니다. 짝수라 r=2+4=6입니다." },
      { code: "i=2: a[2] += 2", note: "4+2=6입니다. 짝수라 r=6+6=12입니다." },
      { code: "i=3: a[3] += 3", note: "5+3=8입니다. 짝수라 r=12+8=20입니다." },
      { code: "return r;", note: "calc(data)는 20을 반환하고 출력값은 20입니다." },
    ],
  },
  "코드기출-유형-9": {
    title: "Python 얕은 복사 흐름",
    summary: "b = a[:]는 바깥 리스트만 복사합니다. 안쪽 리스트는 공유하므로 b[0].append(3)은 a[0]에도 반영되지만, b.append([4])는 b에만 추가됩니다.",
    trace: [
      { code: "a = [[1], [2]]", note: "a는 안쪽 리스트 두 개를 가진 리스트입니다." },
      { code: "b = a[:]", note: "b는 새 바깥 리스트지만 b[0]과 a[0], b[1]과 a[1]은 같은 안쪽 리스트입니다." },
      { code: "b[0].append(3)", note: "공유 중인 첫 번째 안쪽 리스트가 [1,3]이 됩니다. a도 [[1,3],[2]]로 보입니다." },
      { code: "b.append([4])", note: "b의 바깥 리스트에만 [4]가 추가됩니다. a의 길이는 여전히 2입니다." },
      { code: "len(a)", note: "a의 바깥 리스트 길이는 2입니다." },
      { code: "sum(len(x) for x in a)", note: "a 안쪽 리스트 길이는 2와 1이므로 합은 3입니다." },
      { code: "print(2, 3)", note: "출력값은 2 3입니다." },
    ],
  },
  "코드기출-유형-10": {
    title: "Python 딕셔너리 컴프리헨션 흐름",
    summary: "data에서 짝수 2와 4만 남기고, 각 값을 제곱해 딕셔너리에 저장합니다. 저장된 값 4와 16의 합은 20입니다.",
    trace: [
      { code: "data = [1, 2, 3, 4]", note: "검사할 값은 1, 2, 3, 4입니다." },
      { code: "if x % 2 == 0", note: "짝수인 2와 4만 통과합니다." },
      { code: "{x: x * x ...}", note: "2는 4로, 4는 16으로 저장되어 result는 {2:4, 4:16}입니다." },
      { code: "sum(result.values())", note: "딕셔너리의 값 4와 16을 더해 20입니다." },
      { code: "print(20)", note: "최종 출력은 20입니다." },
    ],
  },
  "코드기출-유형-11": {
    title: "Python 기본 인자 리스트 흐름",
    summary: "기본 인자 arr=[]는 함수 정의 시 한 번 만들어져 계속 공유됩니다. 단, f(3, [])은 새 리스트를 직접 넘기므로 기본 리스트에 영향을 주지 않습니다.",
    trace: [
      { code: "f(1)", note: "기본 리스트 []에 1을 넣어 [1]이 되고 합 1을 반환합니다." },
      { code: "f(2)", note: "같은 기본 리스트 [1]을 재사용합니다. 2를 넣어 [1,2], 합 3을 반환합니다." },
      { code: "f(3, [])", note: "새 리스트를 직접 넘겼으므로 [3]의 합 3을 반환합니다. 기본 리스트 [1,2]는 그대로입니다." },
      { code: "f(4)", note: "다시 기본 리스트 [1,2]를 사용합니다. 4를 넣어 [1,2,4], 합 7을 반환합니다." },
      { code: "print(...)", note: "각 반환값이 순서대로 1 3 3 7로 출력됩니다." },
    ],
  },
  "코드기출-유형-12": {
    title: "Python 문자열 슬라이싱 흐름",
    summary: "s[1::3]은 1번 인덱스부터 3칸씩 오른쪽으로, s[-2::-4]는 뒤에서 두 번째 문자부터 4칸씩 왼쪽으로 읽습니다.",
    trace: [
      { code: "s = \"INFORMATION\"", note: "인덱스는 0:I, 1:N, 2:F, 3:O, 4:R, 5:M, 6:A, 7:T, 8:I, 9:O, 10:N입니다." },
      { code: "s[1::3]", note: "1,4,7,10번 문자를 읽어 N, R, T, N이 됩니다." },
      { code: "s[-2::-4]", note: "-2는 인덱스 9의 O입니다. 9,5,1번 문자를 읽어 O, M, N이 됩니다." },
      { code: "s[1::3] + s[-2::-4]", note: "NRTN과 OMN을 붙여 NRTNOMN입니다." },
      { code: "print(...)", note: "최종 출력은 NRTNOMN입니다." },
    ],
  },
};

export const customCodePracticeByLanguage = [
  {
    id: "코드기출-C",
    title: "코드 기출 C",
    language: "c",
    questions: codePracticeExam.questions.slice(0, 4).map((item, index) => ({
      ...item,
      number: index + 1,
      explanationKey: `코드기출-C-${index + 1}`,
    })),
  },
  {
    id: "코드기출-Java",
    title: "코드 기출 Java",
    language: "java",
    questions: codePracticeExam.questions.slice(4, 8).map((item, index) => ({
      ...item,
      number: index + 1,
      explanationKey: `코드기출-Java-${index + 1}`,
    })),
  },
  {
    id: "코드기출-Python",
    title: "코드 기출 Python",
    language: "python",
    questions: codePracticeExam.questions.slice(8, 12).map((item, index) => ({
      ...item,
      number: index + 1,
      explanationKey: `코드기출-Python-${index + 1}`,
    })),
  },
];

export const codeTypePracticeExplanations = {
  "코드기출-C-1": codePracticeExplanations["코드기출-유형-1"],
  "코드기출-C-2": codePracticeExplanations["코드기출-유형-2"],
  "코드기출-C-3": codePracticeExplanations["코드기출-유형-3"],
  "코드기출-C-4": codePracticeExplanations["코드기출-유형-4"],
  "코드기출-Java-1": codePracticeExplanations["코드기출-유형-5"],
  "코드기출-Java-2": codePracticeExplanations["코드기출-유형-6"],
  "코드기출-Java-3": codePracticeExplanations["코드기출-유형-7"],
  "코드기출-Java-4": codePracticeExplanations["코드기출-유형-8"],
  "코드기출-Python-1": codePracticeExplanations["코드기출-유형-9"],
  "코드기출-Python-2": codePracticeExplanations["코드기출-유형-10"],
  "코드기출-Python-3": codePracticeExplanations["코드기출-유형-11"],
  "코드기출-Python-4": codePracticeExplanations["코드기출-유형-12"],
};
