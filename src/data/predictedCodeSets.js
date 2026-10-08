const step = (code, note, extra = {}) => ({ code, note, ...extra });
const state = (name, before, after) => ({ name, before, after });
const item = (language, topic, code, answer, title, trace) => ({
  language,
  topic,
  code: code.trim(),
  answer,
  explanation: { title, answer, trace },
});

export const predictedCodeSets = [
  [
    item(
      "c",
      "포인터·구조체",
      `#include <stdio.h>
void edit(int x, int *p) {
    x += 4;
    *p += x;
}
int main(void) {
    int a[] = {2, 5, 9};
    int *p = a + 1;
    edit(a[0], p);
    p++;
    printf("%d %d %d", a[0], a[1], *p);
    return 0;
}`,
      "2 11 9",
      "값 복사와 주소 전달의 차이",
      [
        step(
          "int a[] = {2, 5, 9}; int *p = a + 1;",
          "a=[2,5,9]로 시작합니다. p는 a[1]의 주소를 가리키므로 *p=5입니다.",
          {
            state: [
              state("a", "미생성", "[2,5,9]"),
              state("p", "미설정", "&a[1]"),
            ],
          },
        ),
        step(
          "edit(a[0], p);",
          "a[0]=2는 매개변수 x에 복사됩니다. p에는 a[1]의 주소가 복사되어 같은 배열 원소를 가리킵니다.",
        ),
        step(
          "x += 4;",
          "지역 변수 x만 2+4=6으로 바뀝니다. 원본 a[0]은 2 그대로입니다.",
          { state: [state("x", "2", "6")] },
        ),
        step(
          "*p += x;",
          "*p는 원본 a[1]입니다. 5+6=11이 원본 배열에 저장됩니다.",
          { state: [state("a[1]", "5", "11")] },
        ),
        step(
          "p++;",
          "main의 p가 a[1]에서 a[2]로 한 원소 이동합니다. 이제 *p=9입니다.",
          { state: [state("p", "&a[1]", "&a[2]")] },
        ),
        step(
          'printf("%d %d %d", a[0], a[1], *p);',
          "바뀌지 않은 a[0]=2, 바뀐 a[1]=11, 이동한 포인터의 값 9를 공백으로 구분해 출력합니다.",
          { output: "2 11 9" },
        ),
      ],
    ),
    item(
      "c",
      "재귀·함수 호출",
      `#include <stdio.h>
int f(int n) {
    if (n <= 1) return n + 1;
    return f(n - 1) + f(n - 2);
}
int main(void) {
    printf("%d", f(4));
    return 0;
}`,
      "8",
      "재귀 호출이 반환값으로 합쳐지는 과정",
      [
        step(
          "f(4)",
          "4<=1은 거짓이므로 f(3)+f(2)를 기다립니다. f(3)은 다시 f(2)+f(1)를 기다립니다.",
        ),
        step(
          "if (n <= 1) return n + 1;",
          "종료 조건에서 f(0)=1, f(1)=2입니다. 원래 n을 반환하는 피보나치와 시작값이 다릅니다.",
        ),
        step(
          "return f(n - 1) + f(n - 2);",
          "작은 호출부터 합치면 f(2)=2+1=3, f(3)=3+2=5, f(4)=5+3=8입니다.",
          {
            table: {
              columns: ["호출", "반환식", "반환값"],
              rows: [
                ["f(0)", "0+1", "1"],
                ["f(1)", "1+1", "2"],
                ["f(2)", "f(1)+f(0)", "3"],
                ["f(3)", "f(2)+f(1)", "5"],
                ["f(4)", "f(3)+f(2)", "8"],
              ],
            },
          },
        ),
        step('printf("%d", f(4));', "가장 바깥 호출이 반환한 8을 출력합니다.", {
          output: "8",
        }),
      ],
    ),
    item(
      "c",
      "포인터·구조체",
      `#include <stdio.h>
typedef struct { int score; int bonus; } S;
int main(void) {
    S a[] = {{60, 3}, {70, 4}, {80, 5}};
    S *p = a + 1;
    p->score += (p - 1)->bonus;
    (p + 1)->bonus = p->score / 10;
    printf("%d %d", p->score, a[2].bonus);
    return 0;
}`,
      "73 7",
      "구조체 포인터의 상대 위치",
      [
        step(
          "S *p = a + 1;",
          "p는 두 번째 구조체 a[1]을 가리킵니다. score=70, bonus=4입니다.",
        ),
        step(
          "p->score += (p - 1)->bonus;",
          "p-1은 a[0]이므로 bonus=3을 읽습니다. a[1].score는 70+3=73이 됩니다.",
          { state: [state("a[1].score", "70", "73")] },
        ),
        step(
          "(p + 1)->bonus = p->score / 10;",
          "p+1은 a[2]입니다. 정수 나눗셈 73/10=7을 a[2].bonus에 저장합니다.",
          { state: [state("a[2].bonus", "5", "7")] },
        ),
        step(
          'printf("%d %d", p->score, a[2].bonus);',
          "a[1].score=73과 a[2].bonus=7을 출력합니다.",
          { output: "73 7" },
        ),
      ],
    ),
    item(
      "java",
      "상속·객체·메서드",
      `class A {
    int v = 3;
    int get() { return v + 1; }
}
class B extends A {
    int v = 8;
    int get() { return super.get() + v; }
}
public class Main {
    public static void main(String[] args) {
        A x = new B();
        System.out.print(x.v + " " + x.get());
    }
}`,
      "3 12",
      "필드 선택과 메서드 선택은 다르다",
      [
        step(
          "A x = new B();",
          "참조 변수의 타입은 A이고 실제 객체는 B입니다. 객체 안에는 A.v=3과 B.v=8이 따로 존재합니다.",
        ),
        step(
          "x.v",
          "필드는 참조 타입 A를 기준으로 선택하므로 A.v=3을 읽습니다.",
        ),
        step(
          "x.get()",
          "인스턴스 메서드는 실제 객체 B를 기준으로 선택하므로 B.get()이 실행됩니다.",
        ),
        step(
          "return super.get() + v;",
          "super.get()은 A.get()을 실행해 A.v+1=4를 반환합니다. B.get()의 v는 B.v=8이므로 4+8=12입니다.",
          {
            table: {
              columns: ["식", "선택된 값", "결과"],
              rows: [
                ["x.v", "A.v", "3"],
                ["super.get()", "A.v+1", "4"],
                ["B.get()", "4+B.v", "12"],
              ],
            },
          },
        ),
        step(
          'System.out.print(x.v + " " + x.get());',
          "숫자 3과 12 사이에 문자열 공백이 들어가 3 12가 됩니다.",
          { output: "3 12" },
        ),
      ],
    ),
    item(
      "java",
      "재귀·함수 호출",
      `public class Main {
    static int f(int[] a, int s, int e) {
        if (s >= e) return 0;
        int m = (s + e) / 2;
        return a[m] + Math.max(f(a, s, m), f(a, m + 1, e));
    }
    public static void main(String[] args) {
        int[] a = {2, 6, 9, 15, 20};
        System.out.print(f(a, 0, 4));
    }
}`,
      "24",
      "재귀 구간별 최댓값 반환",
      [
        step(
          "f(a, 0, 4): m=(0+4)/2",
          "m=2이므로 a[2]=9를 더합니다. 남은 값은 왼쪽 f(0,2)와 오른쪽 f(3,4) 중 큰 값입니다.",
        ),
        step(
          "f(a, 0, 2): m=1",
          "a[1]=6입니다. f(0,1)은 m=0에서 2+max(0,0)=2이고 f(2,2)는 종료 조건으로 0입니다. 따라서 f(0,2)=6+max(2,0)=8.",
        ),
        step(
          "f(a, 3, 4): m=3",
          "a[3]=15입니다. f(3,3), f(4,4)는 모두 0이므로 15+max(0,0)=15입니다.",
        ),
        step(
          "return a[2] + Math.max(8, 15);",
          "루트 호출로 돌아오면 9+15=24입니다. 배열 전체 합이나 원소 최댓값을 구하는 함수가 아닙니다.",
          {
            table: {
              columns: ["구간", "중간 원소", "자식 반환값", "결과"],
              rows: [
                ["[0,1]", "2", "0,0", "2"],
                ["[0,2]", "6", "2,0", "8"],
                ["[3,4]", "15", "0,0", "15"],
                ["[0,4]", "9", "8,15", "24"],
              ],
            },
          },
        ),
        step("System.out.print(f(a, 0, 4));", "최종 반환값 24를 출력합니다.", {
          output: "24",
        }),
      ],
    ),
    item(
      "python",
      "문자열·슬라이싱",
      `s = "PRACTICAL"
a = s[1:7:2]
b = s[-1:2:-3]
print(a + b)`,
      "RCILI",
      "슬라이스 인덱스와 문자 대응",
      [
        step(
          's = "PRACTICAL"',
          "인덱스는 0:P, 1:R, 2:A, 3:C, 4:T, 5:I, 6:C, 7:A, 8:L입니다.",
        ),
        step(
          "a = s[1:7:2]",
          "끝 인덱스 7은 제외합니다. 1,3,5를 읽어 R,C,I가 됩니다.",
          { state: [state("a", "미설정", "RCI")] },
        ),
        step(
          "b = s[-1:2:-3]",
          "-1은 인덱스 8입니다. 8,5를 읽고 다음 2는 끝 인덱스라 제외하여 L,I가 됩니다.",
          { state: [state("b", "미설정", "LI")] },
        ),
        step("print(a + b)", "RCI와 LI를 붙인 RCILI를 출력합니다.", {
          output: "RCILI",
        }),
      ],
    ),
    item(
      "python",
      "배열·컬렉션",
      `d = {"ab": "Code", "cd": "Java", "ef": "Python"}
r = ""
for k, v in d.items():
    r += k[-1] + v[1]
print(r)`,
      "bodafy",
      "딕셔너리 순서와 문자열 누적",
      [
        step(
          'r = ""',
          "누적 문자열은 빈 문자열로 시작합니다. 딕셔너리는 작성한 ab,cd,ef 순서로 순회합니다.",
        ),
        step(
          "r += k[-1] + v[1]",
          "첫 항목은 ab와 Code입니다. 마지막 키 문자 b와 값의 1번 문자 o를 붙여 bo를 저장합니다.",
          { state: [state("r", '""', "bo")] },
        ),
        step(
          "k='cd', v='Java'",
          "d와 a를 붙인 da가 기존 bo 뒤에 붙어 boda가 됩니다.",
          { state: [state("r", "bo", "boda")] },
        ),
        step("k='ef', v='Python'", "f와 y를 붙인 fy가 추가되어 bodafy입니다.", {
          state: [state("r", "boda", "bodafy")],
        }),
        step("print(r)", "누적된 문자열을 한 번 출력합니다.", {
          output: "bodafy",
        }),
      ],
    ),
  ],
  [
    item(
      "c",
      "반복·분기",
      `#include <stdio.h>
int main(void) {
    int x = 2, y = 1;
    switch (x) {
        case 1: y += 2;
        case 2: y *= 3;
        case 3: y += 4; break;
        default: y = 0;
    }
    printf("%d", y);
    return 0;
}`,
      "7",
      "switch의 진입 위치와 break",
      [
        step(
          "int x = 2, y = 1;",
          "x=2이므로 case 2로 바로 진입합니다. case 1의 y+=2는 실행하지 않습니다.",
        ),
        step(
          "case 2: y *= 3;",
          "y가 1*3=3으로 바뀝니다. break가 없어서 바로 아래 case 3도 실행합니다.",
          { state: [state("y", "1", "3")] },
        ),
        step(
          "case 3: y += 4; break;",
          "y=3+4=7이 됩니다. break로 switch를 빠져나와 default는 건너뜁니다.",
          { state: [state("y", "3", "7")] },
        ),
        step('printf("%d", y);', "최종 y=7을 출력합니다.", { output: "7" }),
      ],
    ),
    item(
      "c",
      "문자열·슬라이싱",
      `#include <stdio.h>
int main(void) {
    char s[] = "NETWORK";
    char *p = s + 2;
    p[1] = 'X';
    printf("%c %s", *(p - 1), p);
    return 0;
}`,
      "E TXORK",
      "문자 포인터와 문자열의 시작 위치",
      [
        step(
          'char s[] = "NETWORK"; char *p = s + 2;',
          "s의 문자는 0:N,1:E,2:T,3:W,4:O,5:R,6:K입니다. p는 s[2]의 T를 가리킵니다.",
        ),
        step(
          "p[1] = 'X';",
          "p[1]은 *(p+1), 즉 s[3]입니다. W가 X로 바뀌어 전체 문자열은 NETXORK가 됩니다.",
          { state: [state("s", "NETWORK", "NETXORK")] },
        ),
        step("*(p - 1)", "p보다 한 문자 앞인 s[1]=E를 읽습니다."),
        step(
          'printf("%c %s", *(p - 1), p);',
          "%c는 E 한 문자, %s는 p가 가리키는 s[2]부터 널 문자 전까지 TXORK를 출력합니다.",
          { output: "E TXORK" },
        ),
      ],
    ),
    item(
      "c",
      "배열·컬렉션",
      `#include <stdio.h>
int main(void) {
    int a[2][3] = {{1, 2, 3}, {4, 5, 6}};
    int (*p)[3] = a;
    p++;
    (*p)[1] += a[0][2];
    printf("%d %d", **p, a[1][1]);
    return 0;
}`,
      "4 8",
      "행 단위 배열 포인터",
      [
        step(
          "int (*p)[3] = a;",
          "p는 int 3개로 이루어진 첫 번째 행 a[0]을 가리킵니다. int*와 달리 한 번 증가하면 한 행 이동합니다.",
        ),
        step(
          "p++;",
          "p가 a[1]로 이동합니다. *p는 [4,5,6], **p는 첫 원소 4입니다.",
        ),
        step(
          "(*p)[1] += a[0][2];",
          "a[1][1]=5에 a[0][2]=3을 더해 8을 저장합니다.",
          { state: [state("a[1]", "[4,5,6]", "[4,8,6]")] },
        ),
        step(
          'printf("%d %d", **p, a[1][1]);',
          "두 번째 행의 첫 원소 4와 수정한 두 번째 원소 8을 출력합니다.",
          { output: "4 8" },
        ),
      ],
    ),
    item(
      "java",
      "예외 처리",
      `public class Main {
    static int f() {
        int x = 2;
        try {
            x += 3;
            return x;
        } finally {
            x += 10;
            System.out.print(x + " ");
        }
    }
    public static void main(String[] args) {
        System.out.print(f());
    }
}`,
      "15 5",
      "반환값 확정 후 실행되는 finally",
      [
        step("int x=2; x+=3;", "try 안에서 x=2+3=5가 됩니다.", {
          state: [state("x", "2", "5")],
        }),
        step(
          "return x;",
          "반환할 값 5가 먼저 확정됩니다. 함수가 끝나기 전에 finally로 이동합니다.",
        ),
        step(
          'x += 10; System.out.print(x + " " );',
          "지역 x는 15로 바뀌고 finally가 15와 공백을 먼저 출력합니다. 이미 확정된 반환값 5는 바뀌지 않습니다.",
          { state: [state("x", "5", "15")], output: "15 " },
        ),
        step(
          "System.out.print(f());",
          "f가 반환한 5를 기존 출력 뒤에 붙입니다.",
          { output: "15 5" },
        ),
      ],
    ),
    item(
      "java",
      "배열·컬렉션",
      `public class Main {
    static void edit(StringBuilder b, String s) {
        b.append(s);
        s = "Z";
        b.reverse();
    }
    public static void main(String[] args) {
        StringBuilder b = new StringBuilder("XY");
        String s = "A";
        edit(b, s);
        System.out.print(b + ":" + s);
    }
}`,
      "AYX:A",
      "공유 객체 수정과 지역 참조 재할당",
      [
        step(
          'StringBuilder b=new StringBuilder("XY"); String s="A";',
          "main의 b는 수정 가능한 XY 객체를 참조하고 s는 문자열 A를 참조합니다.",
        ),
        step(
          "b.append(s);",
          "매개변수 b도 같은 객체를 가리키므로 원본 객체가 XY에서 XYA로 바뀝니다.",
          { state: [state("b 객체", "XY", "XYA")] },
        ),
        step(
          's = "Z";',
          "함수 안의 s만 Z를 가리키게 바뀝니다. main의 s=A는 유지됩니다.",
        ),
        step(
          "b.reverse();",
          "공유 객체의 문자 순서가 XYA에서 AYX로 뒤집힙니다.",
          { state: [state("b 객체", "XYA", "AYX")] },
        ),
        step(
          'System.out.print(b + ":" + s);',
          "수정된 객체 AYX와 main에 남아 있는 A를 콜론으로 연결합니다.",
          { output: "AYX:A" },
        ),
      ],
    ),
    item(
      "python",
      "배열·컬렉션",
      `a = [[2], [4]]
b = a[:]
b[1].append(6)
b[0] = [9]
print(a, b)`,
      "[[2], [4, 6]] [[9], [4, 6]]",
      "얕은 복사의 공유와 원소 교체",
      [
        step(
          "b = a[:]",
          "바깥 리스트는 새로 만들지만 내부 [2]와 [4] 리스트는 a와 b가 공유합니다.",
        ),
        step(
          "b[1].append(6)",
          "공유된 두 번째 내부 리스트 자체를 바꾸므로 a[1],b[1] 모두 [4,6]입니다.",
          {
            state: [
              state("a", "[[2],[4]]", "[[2],[4,6]]"),
              state("b", "[[2],[4]]", "[[2],[4,6]]"),
            ],
          },
        ),
        step(
          "b[0] = [9]",
          "b의 첫 번째 칸이 새 리스트 [9]를 가리키게 합니다. a[0]은 기존 [2]를 계속 가리킵니다.",
          { state: [state("b", "[[2],[4,6]]", "[[9],[4,6]]")] },
        ),
        step(
          "print(a, b)",
          "각 리스트의 표현 사이에 공백 한 칸이 출력됩니다.",
          { output: "[[2], [4, 6]] [[9], [4, 6]]" },
        ),
      ],
    ),
    item(
      "python",
      "재귀·함수 호출",
      `def f(x, a=[]):
    a.append(x)
    return len(a) + sum(a)
print(f(2), f(3), f(1, []), f(4))`,
      "3 7 2 12",
      "기본 리스트가 유지되는 함수 호출",
      [
        step(
          "f(2)",
          "기본 리스트 []에 2가 추가됩니다. 길이 1+합 2=3을 반환합니다.",
          { state: [state("기본 a", "[]", "[2]")] },
        ),
        step(
          "f(3)",
          "같은 기본 리스트에 3을 추가해 [2,3]입니다. 길이 2+합 5=7입니다.",
          { state: [state("기본 a", "[2]", "[2,3]")] },
        ),
        step(
          "f(1, [])",
          "직접 넘긴 새 리스트에만 1을 넣어 1+1=2입니다. 기본 리스트는 [2,3] 그대로입니다.",
        ),
        step("f(4)", "기본 리스트가 [2,3,4]가 되어 길이 3+합 9=12입니다.", {
          state: [state("기본 a", "[2,3]", "[2,3,4]")],
        }),
        step("print(...)", "왼쪽부터 계산된 반환값을 순서대로 출력합니다.", {
          output: "3 7 2 12",
        }),
      ],
    ),
  ],
  [
    item(
      "c",
      "비트·논리 연산",
      `#include <stdio.h>
int main(void) {
    unsigned int x = 10, y = 6;
    unsigned int r = (x & y) | (x >> 1);
    r ^= 3;
    printf("%u", r);
    return 0;
}`,
      "4",
      "비트 자리에 맞춰 AND·OR·XOR 계산",
      [
        step("x=10, y=6", "4비트로 쓰면 x=1010, y=0110입니다."),
        step(
          "(x & y) | (x >> 1)",
          "1010 AND 0110은 0010=2입니다. x>>1은 0101=5입니다. 0010 OR 0101은 0111=7입니다.",
          { state: [state("r", "미설정", "7 (0111)")] },
        ),
        step(
          "r ^= 3;",
          "0111 XOR 0011은 서로 다른 비트만 1이 되어 0100=4입니다.",
          { state: [state("r", "7 (0111)", "4 (0100)")] },
        ),
        step('printf("%u", r);', "부호 없는 정수 4를 출력합니다.", {
          output: "4",
        }),
      ],
    ),
    item(
      "c",
      "포인터·구조체",
      `#include <stdio.h>
typedef struct N { int v; struct N *next; } N;
int main(void) {
    N c = {7, 0}, b = {5, &c}, a = {2, &b};
    N *p = &a;
    int r = 0;
    while (p) {
        r = r * 10 + p->v;
        p = p->next;
    }
    printf("%d", r);
    return 0;
}`,
      "257",
      "연결 리스트의 이동과 누적값",
      [
        step(
          "N *p=&a; int r=0;",
          "next 연결은 a(2)→b(5)→c(7)→NULL입니다. p는 a에서 시작합니다.",
        ),
        step(
          "r = r * 10 + p->v; p = p->next;",
          "현재 누적값을 한 자리 밀고 노드 값을 더한 뒤 다음 노드로 이동합니다.",
          {
            table: {
              columns: ["현재 p", "계산", "새 r", "다음 p"],
              rows: [
                ["a (2)", "0*10+2", "2", "b"],
                ["b (5)", "2*10+5", "25", "c"],
                ["c (7)", "25*10+7", "257", "NULL"],
              ],
            },
          },
        ),
        step(
          "while (p)",
          "p=NULL이 되어 조건이 거짓입니다. 누적값 r=257을 유지하고 반복을 종료합니다.",
        ),
        step('printf("%d", r);', "연결 순서로 만든 정수 257을 출력합니다.", {
          output: "257",
        }),
      ],
    ),
    item(
      "c",
      "재귀·함수 호출",
      `#include <stdio.h>
int f(int n) {
    static int s = 0;
    if (n == 0) return s;
    s += n;
    return f(n - 1);
}
int main(void) {
    int a = f(3);
    int b = f(2);
    printf("%d %d", a, b);
    return 0;
}`,
      "6 9",
      "재귀 호출과 static 누적 상태",
      [
        step(
          "static int s = 0;",
          "s는 한 번만 0으로 초기화됩니다. 재귀 호출과 다음 f 호출에서도 같은 s를 사용합니다.",
        ),
        step(
          "int a = f(3);",
          "n=3,2,1 순서로 더해 s=0→3→5→6입니다. n=0에서 6을 반환하여 a=6입니다.",
          {
            table: {
              columns: ["호출", "s 이전", "더한 값", "s 이후"],
              rows: [
                ["f(3)", "0", "3", "3"],
                ["f(2)", "3", "2", "5"],
                ["f(1)", "5", "1", "6"],
              ],
            },
          },
        ),
        step(
          "int b = f(2);",
          "이번에는 s=6에서 시작합니다. 2와 1을 더해 6→8→9, n=0에서 9를 반환합니다.",
          { state: [state("s", "6", "9"), state("b", "미설정", "9")] },
        ),
        step(
          'printf("%d %d", a, b);',
          "a에 저장된 6은 변하지 않았고 b=9입니다.",
          { output: "6 9" },
        ),
      ],
    ),
    item(
      "java",
      "상속·객체·메서드",
      `class A {
    A() { show(); }
    void show() { System.out.print("A"); }
}
class B extends A {
    int v = 7;
    B() { System.out.print(v); }
    void show() { System.out.print(v + ":"); }
}
public class Main {
    public static void main(String[] args) {
        new B();
    }
}`,
      "0:7",
      "생성 중의 오버라이딩 호출",
      [
        step(
          "new B();",
          "객체 메모리의 int 필드는 먼저 기본값 0을 갖습니다. B의 v=7 초기화보다 부모 생성자 A()가 먼저 실행됩니다.",
          { state: [state("B.v", "미생성", "0")] },
        ),
        step(
          "A() { show(); }",
          "실제 객체는 B이므로 B.show()를 호출합니다. 아직 v=0이라 0:을 출력합니다.",
          { output: "0:" },
        ),
        step(
          "int v = 7;",
          "부모 생성자가 끝난 뒤 B의 필드 초기화가 실행되어 v=7이 됩니다.",
          { state: [state("B.v", "0", "7")] },
        ),
        step(
          "B() { System.out.print(v); }",
          "B 생성자 본문이 7을 추가합니다.",
          { output: "0:7" },
        ),
      ],
    ),
    item(
      "java",
      "배열·컬렉션",
      `public class Main {
    static int calc(int[] a) {
        int r = 0;
        for (int i = 0; i < a.length; i++) {
            a[i] *= i + 1;
            if (a[i] % 3 == 0) r += a[i];
        }
        return r;
    }
    public static void main(String[] args) {
        int[] a = {2, 3, 4, 5};
        int r = calc(a);
        System.out.print(r + " " + a[2]);
    }
}`,
      "18 12",
      "원본 배열 수정 후 조건부 합산",
      [
        step(
          "int[] a={2,3,4,5}; int r=calc(a);",
          "calc의 a는 main과 같은 배열 객체입니다. 각 칸의 수정은 main에서도 보입니다.",
        ),
        step(
          "a[i] *= i + 1; if (a[i] % 3 == 0) r += a[i];",
          "곱한 뒤의 값으로 3의 배수 여부를 판단합니다.",
          {
            table: {
              columns: ["i", "원소 계산", "3의 배수?", "r"],
              rows: [
                ["0", "2*1=2", "아니오", "0"],
                ["1", "3*2=6", "예", "6"],
                ["2", "4*3=12", "예", "18"],
                ["3", "5*4=20", "아니오", "18"],
              ],
            },
          },
        ),
        step(
          "return r;",
          "합 18을 main의 r에 저장합니다. 원본 배열은 [2,6,12,20]으로 바뀌었습니다.",
          { state: [state("a", "[2,3,4,5]", "[2,6,12,20]")] },
        ),
        step(
          'System.out.print(r + " " + a[2]);',
          "반환값 18과 수정된 a[2]=12를 출력합니다.",
          { output: "18 12" },
        ),
      ],
    ),
    item(
      "python",
      "배열·컬렉션",
      `a = [2, 3, 4, 5]
d = {x: x * 2 for x in a if x % 2 == 1}
d[3] += 1
print(sum(d.values()), len(d))`,
      "17 2",
      "컴프리헨션의 필터와 값 수정",
      [
        step("if x % 2 == 1", "2와 4는 제외하고 홀수 3과 5만 통과합니다."),
        step(
          "d = {x: x * 2 ...}",
          "키 3의 값은 6, 키 5의 값은 10입니다. d={3:6,5:10}이 됩니다.",
          { state: [state("d", "미생성", "{3:6,5:10}")] },
        ),
        step(
          "d[3] += 1",
          "기존 키 3의 값만 6→7로 바꿉니다. 키 개수는 늘어나지 않습니다.",
          { state: [state("d[3]", "6", "7")] },
        ),
        step(
          "print(sum(d.values()), len(d))",
          "값 합은 7+10=17이고 키 개수는 2입니다.",
          { output: "17 2" },
        ),
      ],
    ),
    item(
      "python",
      "재귀·함수 호출",
      `def f(n):
    if n < 2:
        return 1
    return n * f(n - 2)
print(f(5) + f(4))`,
      "23",
      "두 칸씩 줄어드는 재귀",
      [
        step(
          "f(5)",
          "5*f(3), f(3)은 3*f(1), f(1)은 종료 조건에서 1을 반환합니다. 따라서 5*3*1=15입니다.",
        ),
        step(
          "f(4)",
          "4*f(2), f(2)는 2*f(0), f(0)은 1입니다. 따라서 4*2*1=8입니다.",
          {
            table: {
              columns: ["호출", "전개", "결과"],
              rows: [
                ["f(1), f(0)", "종료 조건", "1"],
                ["f(3)", "3*1", "3"],
                ["f(5)", "5*3", "15"],
                ["f(2)", "2*1", "2"],
                ["f(4)", "4*2", "8"],
              ],
            },
          },
        ),
        step("print(f(5) + f(4))", "15와 8을 더한 23을 출력합니다.", {
          output: "23",
        }),
      ],
    ),
  ],
  [
    item(
      "c",
      "포인터·구조체",
      `#include <stdio.h>
int add(int a, int b) { return a + b; }
int sub(int a, int b) { return a - b; }
int main(void) {
    int (*f[])(int, int) = {add, sub};
    int x = f[0](7, 3);
    int y = f[1](x, 4);
    printf("%d", y);
    return 0;
}`,
      "6",
      "함수 포인터 배열이 고르는 함수",
      [
        step(
          "int (*f[])(int, int) = {add, sub};",
          "f[0]에는 add의 주소, f[1]에는 sub의 주소가 들어 있습니다.",
        ),
        step(
          "int x = f[0](7, 3);",
          "f[0]이 add를 호출하므로 7+3=10을 x에 저장합니다.",
          { state: [state("x", "미설정", "10")] },
        ),
        step(
          "int y = f[1](x, 4);",
          "f[1]은 sub입니다. x=10을 넘겨 10-4=6을 반환합니다.",
          { state: [state("y", "미설정", "6")] },
        ),
        step('printf("%d", y);', "선택된 두 함수의 계산 결과 6을 출력합니다.", {
          output: "6",
        }),
      ],
    ),
    item(
      "c",
      "배열·컬렉션",
      `#include <stdio.h>
int main(void) {
    int a[3][3] = {{1,2,3},{4,5,6},{7,8,9}};
    for (int i = 0; i < 3; i++) {
        for (int j = i + 1; j < 3; j++) {
            int t = a[i][j];
            a[i][j] = a[j][i];
            a[j][i] = t;
        }
    }
    printf("%d %d %d", a[0][1], a[1][2], a[2][0]);
    return 0;
}`,
      "4 8 3",
      "행렬의 대각선 위 원소 교환",
      [
        step(
          "for (int j = i + 1; j < 3; j++)",
          "대각선 위쪽 (0,1),(0,2),(1,2)만 방문합니다. 각 위치를 반대쪽 위치와 한 번씩 교환합니다.",
        ),
        step(
          "t=a[i][j]; a[i][j]=a[j][i]; a[j][i]=t;",
          "임시 변수 t 덕분에 첫 값을 잃지 않고 두 원소를 맞바꿉니다.",
          {
            table: {
              columns: ["(i,j)", "교환 전", "교환 후"],
              rows: [
                ["(0,1)", "a[0][1]=2, a[1][0]=4", "4,2"],
                ["(0,2)", "a[0][2]=3, a[2][0]=7", "7,3"],
                ["(1,2)", "a[1][2]=6, a[2][1]=8", "8,6"],
              ],
            },
          },
        ),
        step("반복 종료", "행렬은 [[1,4,7],[2,5,8],[3,6,9]]입니다.", {
          state: [
            state(
              "a",
              "[[1,2,3],[4,5,6],[7,8,9]]",
              "[[1,4,7],[2,5,8],[3,6,9]]",
            ),
          ],
        }),
        step(
          'printf("%d %d %d", a[0][1], a[1][2], a[2][0]);',
          "지정한 세 칸의 값 4,8,3을 출력합니다.",
          { output: "4 8 3" },
        ),
      ],
    ),
    item(
      "c",
      "문자열·슬라이싱",
      `#include <stdio.h>
int main(void) {
    const char *a[] = {"JAVA", "PYTHON", "CLOUD"};
    const char **p = a;
    p++;
    printf("%c %s", (*p)[2], *(p + 1) + 2);
    return 0;
}`,
      "T OUD",
      "문자열 배열의 이중 포인터",
      [
        step(
          "const char **p = a; p++;",
          "p는 문자열 포인터 배열의 첫 칸에서 두 번째 칸 a[1]로 이동합니다. *p는 PYTHON을 가리킵니다.",
        ),
        step("(*p)[2]", "PYTHON의 인덱스 0:P,1:Y,2:T이므로 문자 T입니다."),
        step(
          "*(p + 1) + 2",
          "p+1은 a[2]이고 *(p+1)은 CLOUD의 시작 주소입니다. +2로 인덱스 2의 O부터 읽어 OUD가 됩니다.",
        ),
        step(
          'printf("%c %s", ...);',
          "문자 T와 문자열 OUD를 공백으로 연결합니다.",
          { output: "T OUD" },
        ),
      ],
    ),
    item(
      "java",
      "상속·객체·메서드",
      `class A {
    static int x = 2;
    int f() { return x; }
}
class B extends A {
    static int x = 9;
    int f() { return x + 1; }
}
public class Main {
    public static void main(String[] args) {
        A a = new B();
        A.x += 3;
        System.out.print(a.x + " " + a.f() + " " + B.x);
    }
}`,
      "5 10 9",
      "static 필드와 동적 메서드 연결",
      [
        step(
          "A a=new B(); A.x+=3;",
          "A.x와 B.x는 서로 다른 static 필드입니다. A.x만 2+3=5로 바뀌고 B.x=9는 그대로입니다.",
          { state: [state("A.x", "2", "5")] },
        ),
        step(
          "a.x",
          "a의 선언 타입 A를 기준으로 A.x=5를 읽습니다. 실제 객체가 B라고 B.x를 읽는 것이 아닙니다.",
        ),
        step(
          "a.f()",
          "인스턴스 메서드는 실제 객체 B의 f()입니다. B.x+1=9+1=10을 반환합니다.",
        ),
        step(
          "System.out.print(...);",
          "A.x=5, B.f()=10, B.x=9 순서로 출력합니다.",
          { output: "5 10 9" },
        ),
      ],
    ),
    item(
      "java",
      "반복·분기",
      `public class Main {
    public static void main(String[] args) {
        String r = "";
        for (int i = 1; i <= 3; i++) {
            switch (i) {
                case 1: r += "A";
                case 2: r += "B"; break;
                default: r += "C";
            }
        }
        System.out.print(r);
    }
}`,
      "ABBC",
      "반복마다 switch 경로를 따라 누적",
      [
        step(
          'String r=""; i=1',
          "case 1에서 A를 붙이고 break가 없어 case 2의 B도 붙입니다. r=AB입니다.",
          { state: [state("r", '""', "AB")] },
        ),
        step(
          "i=2",
          "case 2만 실행해 B를 붙인 뒤 break입니다. r=ABB가 됩니다.",
          { state: [state("r", "AB", "ABB")] },
        ),
        step("i=3", "맞는 case가 없어 default의 C를 붙여 ABBC입니다.", {
          state: [state("r", "ABB", "ABBC")],
        }),
        step(
          "System.out.print(r);",
          "i=4에서 반복을 끝낸 후 누적 문자열을 출력합니다.",
          { output: "ABBC" },
        ),
      ],
    ),
    item(
      "python",
      "배열·컬렉션",
      `a = [4, 1, 3, 2]
b = sorted(a)
a.sort(reverse=True)
b.pop(1)
print(a[1], b, len(a))`,
      "3 [1, 3, 4] 4",
      "sorted의 새 리스트와 sort의 원본 변경",
      [
        step(
          "b = sorted(a)",
          "오름차순 새 리스트 b=[1,2,3,4]를 만듭니다. 이때 a=[4,1,3,2]는 바뀌지 않습니다.",
        ),
        step(
          "a.sort(reverse=True)",
          "원본 a를 내림차순 [4,3,2,1]로 바꿉니다. 별도 리스트 b에는 영향이 없습니다.",
          { state: [state("a", "[4,1,3,2]", "[4,3,2,1]")] },
        ),
        step("b.pop(1)", "인덱스 1의 값 2를 제거하여 b=[1,3,4]입니다.", {
          state: [state("b", "[1,2,3,4]", "[1,3,4]")],
        }),
        step(
          "print(a[1], b, len(a))",
          "a[1]=3, b의 리스트 표현, a 길이 4를 출력합니다.",
          { output: "3 [1, 3, 4] 4" },
        ),
      ],
    ),
    item(
      "python",
      "배열·컬렉션",
      `t = ([1, 2], [3])
t[0].append(4)
a, b = t
a[1] = b[0] + 2
print(sum(a), t[1][0])`,
      "10 3",
      "튜플 내부의 수정 가능한 리스트",
      [
        step(
          "t = ([1, 2], [3])",
          "튜플의 두 칸은 리스트 객체를 참조합니다. 튜플 칸 자체를 바꾸는 것과 내부 리스트를 수정하는 것은 다릅니다.",
        ),
        step(
          "t[0].append(4)",
          "첫 내부 리스트가 [1,2,4]로 바뀝니다. 튜플의 참조는 그대로라 허용됩니다.",
          { state: [state("t[0]", "[1,2]", "[1,2,4]")] },
        ),
        step(
          "a, b = t; a[1] = b[0] + 2",
          "a는 첫 내부 리스트, b는 두 번째 내부 리스트입니다. b[0]=3에 2를 더한 5로 a[1]을 바꿔 a=[1,5,4]입니다.",
          { state: [state("a (=t[0])", "[1,2,4]", "[1,5,4]")] },
        ),
        step(
          "print(sum(a), t[1][0])",
          "합 1+5+4=10과 두 번째 리스트의 값 3을 출력합니다.",
          { output: "10 3" },
        ),
      ],
    ),
  ],
  [
    item(
      "c",
      "재귀·함수 호출",
      `#include <stdio.h>
typedef struct N { int v; struct N *l, *r; } N;
int count = 0, answer = 0;
void visit(N *p) {
    if (!p) return;
    visit(p->l);
    visit(p->r);
    if (++count == 4) answer = p->v;
}
int main(void) {
    N d={3,0,0}, e={5,0,0}, b={7,&d,&e};
    N c={11,0,0}, a={13,&b,&c};
    visit(&a);
    printf("%d %d", answer, count);
    return 0;
}`,
      "11 5",
      "후위 순회의 방문 순서와 카운터",
      [
        step(
          "visit(&a);",
          "루트 13의 왼쪽은 7, 오른쪽은 11입니다. 7의 왼쪽 자식은 3, 오른쪽 자식은 5입니다.",
        ),
        step(
          "visit(p->l); visit(p->r);",
          "왼쪽과 오른쪽 재귀 호출을 마친 뒤에 현재 노드를 처리하므로 방문 순서는 3,5,7,11,13입니다.",
        ),
        step(
          "if (++count == 4) answer = p->v;",
          "노드 처리 때마다 먼저 count를 증가시킵니다. 네 번째 노드 11에서만 조건이 참이라 answer=11입니다.",
          {
            table: {
              columns: ["처리 노드", "count", "==4?", "answer"],
              rows: [
                ["3", "1", "거짓", "0"],
                ["5", "2", "거짓", "0"],
                ["7", "3", "거짓", "0"],
                ["11", "4", "참", "11"],
                ["13", "5", "거짓", "11"],
              ],
            },
          },
        ),
        step(
          'printf("%d %d", answer, count);',
          "전체 5개 노드를 방문했습니다. 네 번째 값 11과 최종 횟수 5를 출력합니다.",
          { output: "11 5" },
        ),
      ],
    ),
    item(
      "c",
      "포인터·구조체",
      `#include <stdio.h>
void swap(int *a, int *b) {
    int t = *a;
    *a = *b;
    *b = t;
}
int main(void) {
    int a[] = {4, 8, 12};
    swap(&a[0], &a[2]);
    int *p = a;
    int x = *p++;
    int y = ++*p;
    printf("%d %d %d", x, y, a[2]);
    return 0;
}`,
      "12 9 4",
      "주소로 교환한 뒤 후위·전위 연산",
      [
        step(
          "swap(&a[0], &a[2]);",
          "t에 4를 보관하고 a[0]에 12, a[2]에 t=4를 저장합니다. 배열은 [12,8,4]입니다.",
          { state: [state("a", "[4,8,12]", "[12,8,4]")] },
        ),
        step(
          "int x = *p++;",
          "*(p++)로 해석합니다. 기존 p가 가리키는 12를 x에 저장한 뒤 p를 a[1]로 이동합니다.",
          { state: [state("x", "미설정", "12"), state("p", "&a[0]", "&a[1]")] },
        ),
        step(
          "int y = ++*p;",
          "++(*p)입니다. p가 가리키는 a[1]을 먼저 8→9로 증가시키고 y=9를 저장합니다. 포인터 p는 이동하지 않습니다.",
          { state: [state("a[1]", "8", "9"), state("y", "미설정", "9")] },
        ),
        step(
          'printf("%d %d %d", x, y, a[2]);',
          "저장된 x=12, y=9, 교환 후 a[2]=4를 출력합니다.",
          { output: "12 9 4" },
        ),
      ],
    ),
    item(
      "c",
      "반복·분기",
      `#include <stdio.h>
int main(void) {
    int r = 0;
    for (int i = 1; i <= 7; i++) {
        if (i % 2 == 0) continue;
        r += i;
        if (r > 8) break;
    }
    printf("%d", r);
    return 0;
}`,
      "9",
      "continue와 break가 합산에 미치는 영향",
      [
        step(
          "int r=0; for (int i=1; i<=7; i++)",
          "i는 1부터 시작합니다. 짝수면 continue로 더하기와 break 검사를 모두 건너뜁니다.",
        ),
        step(
          "r += i; if (r > 8) break;",
          "홀수 1,3,5를 차례로 더합니다. 5를 더한 뒤 r=9가 되어 반복 전체를 종료합니다.",
          {
            table: {
              columns: ["i", "실행 경로", "r"],
              rows: [
                ["1", "0+1", "1"],
                ["2", "continue", "1"],
                ["3", "1+3", "4"],
                ["4", "continue", "4"],
                ["5", "4+5, break", "9"],
              ],
            },
          },
        ),
        step(
          'printf("%d", r);',
          "i=6,7은 실행되지 않습니다. 최종 합 9를 출력합니다.",
          { output: "9" },
        ),
      ],
    ),
    item(
      "java",
      "상속·객체·메서드",
      `class Box {
    static int count = 0;
    int id;
    Box() { id = ++count; }
    int value() { return id * 10 + count; }
}
public class Main {
    public static void main(String[] args) {
        Box a = new Box();
        Box b = new Box();
        Box c = a;
        c.id += b.id;
        System.out.print(a.value() + " " + b.value());
    }
}`,
      "32 22",
      "객체별 필드와 공유 static 카운터",
      [
        step(
          "Box a=new Box(); Box b=new Box();",
          "첫 생성 때 count=1,a.id=1입니다. 두 번째 때 count=2,b.id=2입니다. count는 두 객체가 공유합니다.",
        ),
        step(
          "Box c = a;",
          "새 객체가 만들어진 것이 아닙니다. c와 a는 동일한 첫 객체를 가리킵니다.",
        ),
        step(
          "c.id += b.id;",
          "첫 객체의 id를 1+2=3으로 바꿉니다. a.id도 3이고 b.id=2는 그대로입니다.",
          { state: [state("a.id (=c.id)", "1", "3")] },
        ),
        step(
          "a.value(), b.value()",
          "현재 count=2를 사용합니다. a는 3*10+2=32, b는 2*10+2=22입니다.",
        ),
        step(
          "System.out.print(...);",
          "서로 다른 두 객체의 계산 결과를 출력합니다.",
          { output: "32 22" },
        ),
      ],
    ),
    item(
      "java",
      "예외 처리",
      `public class Main {
    public static void main(String[] args) {
        int r = 0;
        for (int i = 0; i < 3; i++) {
            try {
                r += 6 / (i - 1);
            } catch (ArithmeticException e) {
                r += 4;
            } finally {
                r += 1;
            }
        }
        System.out.print(r);
    }
}`,
      "7",
      "예외가 발생한 반복의 계산 경로",
      [
        step(
          "i=0: r += 6 / (i - 1);",
          "6/(-1)=-6을 더한 뒤 finally에서 1을 더해 r=-5입니다.",
          { state: [state("r", "0", "-5")] },
        ),
        step(
          "i=1: 6 / 0",
          "나눗셈에서 예외가 발생해 r+=... 대입은 실행되지 않습니다. catch에서 4를 더해 -1, finally에서 1을 더해 0입니다.",
          { state: [state("r", "-5", "0")] },
        ),
        step(
          "i=2: 6 / 1",
          "try에서 6을 더하고 finally에서 1을 더해 r=7입니다.",
          { state: [state("r", "0", "7")] },
        ),
        step("System.out.print(r);", "i=3에서 반복을 끝내고 7을 출력합니다.", {
          output: "7",
        }),
      ],
    ),
    item(
      "python",
      "배열·컬렉션",
      `a = {1, 2, 3, 4}
b = {3, 4, 5}
c = (a - b) | (a & b)
c.remove(2)
print(sorted(c), sum(c))`,
      "[1, 3, 4] 8",
      "집합 연산 결과와 정렬된 출력",
      [
        step("a - b, a & b", "차집합 a-b는 {1,2}, 교집합 a&b는 {3,4}입니다."),
        step(
          "c = (a - b) | (a & b)",
          "두 결과의 합집합은 {1,2,3,4}입니다. 원래 a,b는 수정되지 않습니다.",
        ),
        step("c.remove(2)", "원소 2를 제거하여 c={1,3,4}입니다.", {
          state: [state("c", "{1,2,3,4}", "{1,3,4}")],
        }),
        step(
          "print(sorted(c), sum(c))",
          "집합 자체의 표시 순서는 보장되지 않지만 sorted가 [1,3,4]로 정렬합니다. 합은 1+3+4=8입니다.",
          { output: "[1, 3, 4] 8" },
        ),
      ],
    ),
    item(
      "python",
      "배열·컬렉션",
      `a = [1, 2, 3]
b = a
c = a[:]
b += [4]
c[0] = 9
print(len(a), sum(b), sum(c))`,
      "4 10 14",
      "리스트 +=와 별도 복사본",
      [
        step(
          "b = a; c = a[:]",
          "b는 a와 같은 리스트를 가리키고 c는 별도 리스트 [1,2,3]입니다.",
        ),
        step(
          "b += [4]",
          "리스트 +=는 기존 객체에 원소를 추가합니다. 공유하는 a와 b 모두 [1,2,3,4]가 됩니다.",
          { state: [state("a (=b)", "[1,2,3]", "[1,2,3,4]")] },
        ),
        step(
          "c[0] = 9",
          "별도 복사본 c만 [9,2,3]이 됩니다. a,b에는 영향이 없습니다.",
          { state: [state("c", "[1,2,3]", "[9,2,3]")] },
        ),
        step(
          "print(len(a), sum(b), sum(c))",
          "a 길이=4, b 합=1+2+3+4=10, c 합=9+2+3=14입니다.",
          { output: "4 10 14" },
        ),
      ],
    ),
  ],
];
