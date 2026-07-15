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

const inputBlock = (input) => `
<div class="custom-input">
  <strong>입력값</strong>
  <pre>${escapeHtml(input.trim())}</pre>
</div>
`;

const answerBlock = (answerText) => `<pre class="answerTextBlock">${escapeHtml(answerText)}</pre>`;

const question = ({ number, sourceUrl, language, prompt, code, answerText, input }) => ({
  number,
  sourceUrl,
  promptHtml: `
    <p><b>${prompt}</b></p>
    ${input ? inputBlock(input) : ""}
    ${codeBlock(code)}
  `,
  answerHtml: answerBlock(answerText),
  answerText,
  externalCodePage: true,
  explanationKey: `external-${language}-${number}`,
});

const cSource = "https://chobopark.tistory.com/425";
const pythonSource = "https://chobopark.tistory.com/273";

export const externalLanguageCodeQuestions = {
  c: [
    question({
      number: 1,
      sourceUrl: cSource,
      language: "c",
      prompt: "[C 정리 페이지] 다음 C언어로 구현된 프로그램을 분석하여 알맞는 출력 결과를 작성하시오.",
      code: `
#include <stdio.h>
void ary(int a[]){
  int temp;
  for(int i=0;i<4;i++)
    for(int j=0;j<4-i;j++)
      if(a[j]>a[j+1]){
        temp=a[j];
        a[j]=a[j+1];
        a[j+1]=temp;
      }
}
int main() {
  int a[]={85, 75, 50, 100, 95};
  ary(a);
  for(int i=0;i<5;i++)
    printf("%d",a[i]);
}
      `,
      answerText: "50758595100",
    }),
    question({
      number: 2,
      sourceUrl: cSource,
      language: "c",
      prompt: "[C 정리 페이지] 다음 C언어로 구현된 프로그램을 분석하여 알맞는 출력 결과를 작성하시오.",
      code: `
#include <stdio.h>
struct stName {
    char nael[12];
    int os, db, hab, hhab;
};
int main() {
    struct stName st[3] = { {"stName1", 95, 88}, {"stName2", 84, 91}, {"stName3", 86, 75} };
    struct stName* p;
    p = &st[0];
    (p + 1)->hab = (p + 1)->os + (p + 2)->db;
    (p + 1)->hhab = (p + 1)->hab + p->os + p->db;
    printf("%d", (p + 1)->hab + (p + 1)->hhab);
}
      `,
      answerText: "501",
    }),
    question({
      number: 3,
      sourceUrl: cSource,
      language: "c",
      prompt: "[C 정리 페이지] 다음 C언어로 구현된 프로그램을 분석하여 알맞는 출력 결과를 작성하시오.",
      code: `
#include <stdio.h>
int main() {
    struct ary {
        char name[10];
        int age;
    } a[] = { {"Kim", 28}, {"Lee", 38}, {"Park", 42}, {"Choi", 31} };
    struct ary* p;
    p = a;
    p++;
    printf("%s\\n", p->name);
    printf("%d\\n", p->age);
}
      `,
      answerText: "Lee\n38",
    }),
    question({
      number: 4,
      sourceUrl: cSource,
      language: "c",
      prompt: "[C 정리 페이지] 다음 C언어로 구현된 프로그램을 분석하여 알맞는 출력 결과를 작성하시오.",
      code: `
#include <stdio.h>
int main() {
    int ary[3];
    int s = 0;
    *(ary + 0) = 1;
    ary[1] = *(ary + 0) + 2;
    ary[2] = *ary + 3;
    for (int i = 0; i < 3; i++)
        s = s + ary[i];
    printf("%d", s);
}
      `,
      answerText: "8",
    }),
  ],
  python: [
    question({
      number: 1,
      sourceUrl: pythonSource,
      language: "python",
      prompt: "[Python 정리 페이지] 다음 Python으로 구현된 프로그램과 입력값을 보고 실행 결과를 작성하시오.",
      input: "python programming",
      code: `
x = input()
x = x.capitalize()
y = x.split()
print(y[0][::2], end = '*')
print(y[1][3:6])
      `,
      answerText: "Pto*gra",
    }),
    question({
      number: 2,
      sourceUrl: pythonSource,
      language: "python",
      prompt: "[Python 정리 페이지] 다음 python의 프로그램과 입력값을 분석하여 실행 결과에 대해 작성하시오.",
      input: "infomation-technology\n12",
      code: `
arr_str = input('input String :').split('-')
arr_len = int(input('input number : '))
arr_val = list(range(0,arr_len,2))
arr_val.remove(4)
print(arr_str[1].find('i') + arr_val[2])
      `,
      answerText: "5",
    }),
    question({
      number: 3,
      sourceUrl: pythonSource,
      language: "python",
      prompt: "[Python 정리 페이지] 다음 python의 프로그램을 분석하여 실행 결과에 대해 작성하시오.",
      code: `
i = 20
f = 123456.789E-3
print('%d\\n%d' % (i, i), end = '/')
print('%.3f' % f)
      `,
      answerText: "20\n20/123.457",
    }),
    question({
      number: 4,
      sourceUrl: pythonSource,
      language: "python",
      prompt: "[Python 정리 페이지] 다음 python의 프로그램을 분석하여 실행 결과에 대해 작성하시오.",
      code: `
class charClass :
  a = ["Seoul", "Inchon", "Kyonggi", "Daejun", "Daegu", "Pusan"]
myVal = charClass()
str01 = ''
for i in myVal.a:
  str01 = str01 + i[0]
print(str01)
      `,
      answerText: "SIKDDP",
    }),
    question({
      number: 5,
      sourceUrl: pythonSource,
      language: "python",
      prompt: "[Python 정리 페이지] 다음 Python으로 구현된 프로그램을 분석하여 그 실행 결과를 쓰시오.",
      code: `
a = "What's this?"
print("%-10.4s" % a)
print("%10.4s" % a)
      `,
      answerText: "What      \n      What",
    }),
    question({
      number: 6,
      sourceUrl: pythonSource,
      language: "python",
      prompt: "[Python 정리 페이지] 다음 Python으로 구현된 프로그램을 분석하여 그 실행 결과를 쓰시오.",
      code: `
i, hap = 1, 0
while i <= 6:
    hap += i
    i += 2
print(f"i={i}, hap={hap}")
      `,
      answerText: "i=7, hap=9",
    }),
    question({
      number: 7,
      sourceUrl: pythonSource,
      language: "python",
      prompt: "[Python 정리 페이지] 다음 Python으로 구현된 프로그램을 분석하여 그 실행 결과를 쓰시오.",
      code: `
a = [[1,1,0,1,0],
     [1,0,1,0]]
tot,totsu = 0, 0
for i in a:
    for j in i:
        tot += j
    totsu = totsu + len(i)
print(totsu, tot)
      `,
      answerText: "9 5",
    }),
    question({
      number: 8,
      sourceUrl: pythonSource,
      language: "python",
      prompt: "[Python 정리 페이지] 다음 Python 코드는 \"30, 200\"을 출력한다. 빈 칸 (1), (2)에 알맞는 코드를 차례로 쓰시오.",
      code: `
(  1  ) Calculator:
    (   2   ) add(self,x,y):
        return x + y
    (   2   ) mul(self,x,y):
        return x * y
cal = Calculator()
x = cal.add(10,20)
y = cal.mul(10,20)
print(x, y)
      `,
      answerText: "class, def",
    }),
    question({
      number: 9,
      sourceUrl: pythonSource,
      language: "python",
      prompt: "[Python 정리 페이지] 다음은 파이선으로 작성된 프로그램이다. 이를 실행한 출력 결과를 쓰시오.",
      code: `
lol = [[1,2,3],[4,5],[6,7,8,9]]
print(lol[0])
print(lol[2][1])
for sub in lol :
    for item in sub :
        print(item, end = " ")
    print()
      `,
      answerText: "[1, 2, 3]\n7\n1 2 3\n4 5\n6 7 8 9",
    }),
    question({
      number: 10,
      sourceUrl: pythonSource,
      language: "python",
      prompt: "[Python 정리 페이지] 다음 Python으로 구현된 프로그램을 분석하여 알맞는 출력 결과를 작성하시오.",
      code: `
a = "REMEMBER NOVEMBER"
b = a[0:3] + a[12:16]
c = "R AND %s" % "STR"
print(b + c)
      `,
      answerText: "REMEMBER AND STR",
    }),
  ],
};

export const externalLanguageCodeExplanations = {
  "external-c-1": {
    title: "C 버블 정렬 흐름",
    summary: "ary(a)가 배열 a 자체를 오름차순으로 바꿉니다. 최종 배열은 50, 75, 85, 95, 100이고 printf가 공백 없이 붙여 출력합니다.",
    trace: [
      { code: "int a[]={85, 75, 50, 100, 95};", note: "시작 배열은 [85,75,50,100,95]입니다." },
      { code: "ary(a);", note: "배열 시작 주소가 함수로 넘어가므로 함수 안의 교환은 main의 a에 그대로 반영됩니다." },
      { code: "i=0, j=0..3", note: "85>75라 교환, 85>50이라 교환, 100>95라 교환되어 [75,50,85,95,100]이 됩니다." },
      { code: "i=1, j=0..2", note: "75>50만 참이라 교환되어 [50,75,85,95,100]이 됩니다." },
      { code: "i=2, i=3", note: "이미 오름차순이라 더 이상 교환이 없습니다." },
      { code: "printf(\"%d\",a[i]);", note: "각 원소를 공백 없이 출력하므로 50 75 85 95 100이 50758595100으로 붙습니다." },
    ],
  },
  "external-c-2": {
    title: "C 구조체 포인터 흐름",
    summary: "p는 st[0]을 가리키고, p+1은 st[1], p+2는 st[2]입니다. st[1].hab=159, st[1].hhab=342라서 합은 501입니다.",
    trace: [
      { code: "p = &st[0];", note: "p는 구조체 배열의 첫 번째 원소 st[0]을 가리킵니다." },
      { code: "(p + 1)->hab = (p + 1)->os + (p + 2)->db;", note: "st[1].os는 84, st[2].db는 75이므로 st[1].hab = 84 + 75 = 159입니다." },
      { code: "(p + 1)->hhab = (p + 1)->hab + p->os + p->db;", note: "st[1].hhab = 159 + st[0].os 95 + st[0].db 88 = 342입니다." },
      { code: "printf(\"%d\", (p + 1)->hab + (p + 1)->hhab);", note: "st[1].hab 159와 st[1].hhab 342를 더해 501을 출력합니다." },
    ],
  },
  "external-c-3": {
    title: "C 구조체 배열 포인터 이동 흐름",
    summary: "p=a로 stuct 배열의 첫 원소를 가리킨 뒤 p++로 두 번째 원소 Lee로 이동합니다. 그래서 이름 Lee와 나이 38이 줄바꿈되어 출력됩니다.",
    trace: [
      { code: "a[] = {{\"Kim\",28}, {\"Lee\",38}, {\"Park\",42}, {\"Choi\",31}};", note: "a[0]은 Kim, a[1]은 Lee입니다." },
      { code: "p = a;", note: "배열 이름 a는 첫 번째 원소 주소로 사용되므로 p는 a[0]을 가리킵니다." },
      { code: "p++;", note: "구조체 포인터가 한 칸 이동해 p는 a[1]을 가리킵니다." },
      { code: "printf(\"%s\\n\", p->name);", note: "p->name은 a[1].name이므로 Lee가 출력되고 줄바꿈됩니다." },
      { code: "printf(\"%d\\n\", p->age);", note: "p->age는 a[1].age이므로 38이 출력됩니다." },
    ],
  },
  "external-c-4": {
    title: "C 배열 주소 연산 흐름",
    summary: "ary[0], ary[1], ary[2]가 차례대로 1, 3, 4가 되고 반복문이 세 값을 합쳐 8을 출력합니다.",
    trace: [
      { code: "int ary[3]; int s = 0;", note: "정수 배열 3칸과 합계 s를 준비하고 s는 0입니다." },
      { code: "*(ary + 0) = 1;", note: "ary+0은 ary[0] 주소이므로 ary[0]=1입니다." },
      { code: "ary[1] = *(ary + 0) + 2;", note: "*(ary+0)은 ary[0]의 값 1입니다. 따라서 ary[1]=1+2=3입니다." },
      { code: "ary[2] = *ary + 3;", note: "*ary는 ary[0]과 같아 1입니다. 따라서 ary[2]=1+3=4입니다." },
      { code: "for (int i = 0; i < 3; i++) s = s + ary[i];", note: "i=0에서 s=1, i=1에서 s=4, i=2에서 s=8입니다." },
      { code: "printf(\"%d\", s);", note: "최종 s 값 8을 출력합니다." },
    ],
  },
  "external-python-1": {
    title: "Python 입력/슬라이싱 흐름",
    summary: "입력 python programming이 Python programming으로 바뀐 뒤 첫 단어에서 Pto, 두 번째 단어에서 gra를 뽑아 Pto*gra가 됩니다.",
    trace: [
      { code: "x = input()", note: "입력값 python programming이 x에 저장됩니다." },
      { code: "x = x.capitalize()", note: "문자열의 첫 글자만 대문자로 바뀌어 x는 Python programming입니다." },
      { code: "y = x.split()", note: "공백 기준으로 y는 ['Python', 'programming']입니다." },
      { code: "y[0][::2]", note: "'Python'의 0,2,4번 문자를 읽어 Pto가 됩니다." },
      { code: "print(..., end='*')", note: "Pto 뒤에 줄바꿈 대신 *가 붙습니다." },
      { code: "y[1][3:6]", note: "'programming'의 3,4,5번 문자는 gra입니다. 최종 출력은 Pto*gra입니다." },
    ],
  },
  "external-python-2": {
    title: "Python 리스트/검색 흐름",
    summary: "technology에는 i가 없어 find가 -1을 반환하고, 4를 제거한 arr_val의 세 번째 값은 6입니다. -1+6으로 5가 출력됩니다.",
    trace: [
      { code: "arr_str = input(...).split('-')", note: "infomation-technology가 '-' 기준으로 나뉘어 ['infomation', 'technology']가 됩니다." },
      { code: "arr_len = int(input(...))", note: "두 번째 입력 12가 정수 12로 저장됩니다." },
      { code: "arr_val = list(range(0,arr_len,2))", note: "0부터 12 전까지 2씩 증가해 [0,2,4,6,8,10]입니다." },
      { code: "arr_val.remove(4)", note: "값 4가 제거되어 [0,2,6,8,10]이 됩니다." },
      { code: "arr_str[1].find('i')", note: "'technology'에는 i가 없으므로 -1입니다." },
      { code: "arr_val[2]", note: "현재 arr_val의 2번 인덱스는 6입니다. 따라서 -1 + 6 = 5입니다." },
    ],
  },
  "external-python-3": {
    title: "Python 서식 출력 흐름",
    summary: "%d 두 개가 20과 20을 출력하고, end='/' 때문에 두 번째 20 뒤에 /가 붙습니다. f는 123.456789라 %.3f로 123.457입니다.",
    trace: [
      { code: "i = 20", note: "정수 i는 20입니다." },
      { code: "f = 123456.789E-3", note: "E-3은 10^-3을 곱한다는 뜻이라 f는 123.456789입니다." },
      { code: "print('%d\\n%d' % (i, i), end = '/')", note: "20, 줄바꿈, 20을 출력한 뒤 줄바꿈 대신 /를 붙입니다." },
      { code: "print('%.3f' % f)", note: "123.456789를 소수 셋째 자리까지 반올림해 123.457을 출력합니다." },
    ],
  },
  "external-python-4": {
    title: "Python 클래스 변수 순회 흐름",
    summary: "리스트의 각 도시 이름 첫 글자를 차례대로 붙입니다. Seoul, Inchon, Kyonggi, Daejun, Daegu, Pusan의 첫 글자라 SIKDDP입니다.",
    trace: [
      { code: "class charClass: a = [...]", note: "클래스 안에 도시 이름 리스트 a가 있습니다." },
      { code: "myVal = charClass()", note: "객체 myVal을 만들고 myVal.a로 리스트에 접근할 수 있습니다." },
      { code: "str01 = ''", note: "누적할 문자열은 빈 문자열로 시작합니다." },
      { code: "for i in myVal.a:", note: "i가 Seoul, Inchon, Kyonggi, Daejun, Daegu, Pusan 순서로 바뀝니다." },
      { code: "str01 = str01 + i[0]", note: "각 문자열의 첫 글자를 붙여 S, SI, SIK, SIKD, SIKDD, SIKDDP가 됩니다." },
      { code: "print(str01)", note: "최종 출력은 SIKDDP입니다." },
    ],
  },
  "external-python-5": {
    title: "Python 문자열 폭 지정 흐름",
    summary: ".4s가 앞 네 글자 What만 남기고, 10칸 폭에서 첫 줄은 왼쪽 정렬, 둘째 줄은 오른쪽 정렬합니다.",
    trace: [
      { code: "a = \"What's this?\"", note: "a의 앞 네 글자는 What입니다." },
      { code: "\"%-10.4s\" % a", note: ".4s로 What만 자르고, -10 때문에 전체 10칸에서 왼쪽 정렬합니다. What 뒤에 공백 6칸이 붙습니다." },
      { code: "\"%10.4s\" % a", note: "전체 10칸에서 오른쪽 정렬합니다. What 앞에 공백 6칸이 붙습니다." },
      { code: "print(...)", note: "따라서 첫 줄은 'What      ', 둘째 줄은 '      What'입니다." },
    ],
  },
  "external-python-6": {
    title: "Python while 누적 흐름",
    summary: "i가 1, 3, 5일 때만 반복하고 hap에 더합니다. 반복 후 i는 7, hap은 9가 됩니다.",
    trace: [
      { code: "i, hap = 1, 0", note: "i는 1, hap은 0에서 시작합니다." },
      { code: "1회차", note: "i=1이라 조건이 참입니다. hap=0+1=1, i=1+2=3입니다." },
      { code: "2회차", note: "i=3이라 조건이 참입니다. hap=1+3=4, i=3+2=5입니다." },
      { code: "3회차", note: "i=5라 조건이 참입니다. hap=4+5=9, i=5+2=7입니다." },
      { code: "while i <= 6", note: "i=7이 되어 조건이 거짓이므로 반복을 끝냅니다." },
      { code: "print(f\"i={i}, hap={hap}\")", note: "i=7, hap=9가 출력됩니다." },
    ],
  },
  "external-python-7": {
    title: "Python 2차원 리스트 합계 흐름",
    summary: "두 행의 길이는 5와 4라 totsu는 9, 모든 원소의 합은 5라 tot는 5입니다.",
    trace: [
      { code: "a = [[1,1,0,1,0], [1,0,1,0]]", note: "첫 행의 합은 3, 길이는 5입니다. 둘째 행의 합은 2, 길이는 4입니다." },
      { code: "tot,totsu = 0, 0", note: "원소 합 tot와 전체 원소 수 totsu가 0에서 시작합니다." },
      { code: "첫 번째 행", note: "j를 돌며 tot가 3이 되고, len(i)=5라 totsu는 5가 됩니다." },
      { code: "두 번째 행", note: "j를 돌며 tot가 5가 되고, len(i)=4를 더해 totsu는 9가 됩니다." },
      { code: "print(totsu, tot)", note: "공백으로 구분되어 9 5가 출력됩니다." },
    ],
  },
  "external-python-8": {
    title: "Python class/def 빈칸 흐름",
    summary: "클래스 선언 자리에는 class, 메서드 선언 자리에는 def가 들어갑니다. 완성된 코드는 30과 200을 출력합니다.",
    trace: [
      { code: "(1) Calculator:", note: "파이썬 클래스 정의 문법은 class Calculator: 입니다." },
      { code: "(2) add(self,x,y):", note: "메서드 정의 문법은 def add(self,x,y): 입니다." },
      { code: "(2) mul(self,x,y):", note: "mul도 함수/메서드 정의이므로 def가 들어갑니다." },
      { code: "x = cal.add(10,20)", note: "add가 10+20을 반환해 x는 30입니다." },
      { code: "y = cal.mul(10,20)", note: "mul이 10*20을 반환해 y는 200입니다." },
      { code: "정답", note: "빈칸 순서대로 class, def입니다." },
    ],
  },
  "external-python-9": {
    title: "Python 중첩 리스트 출력 흐름",
    summary: "처음 두 print는 첫 행과 lol[2][1]을 출력하고, 중첩 반복문이 각 부분 리스트를 한 줄씩 출력합니다.",
    trace: [
      { code: "lol = [[1,2,3],[4,5],[6,7,8,9]]", note: "lol[0]=[1,2,3], lol[1]=[4,5], lol[2]=[6,7,8,9]입니다." },
      { code: "print(lol[0])", note: "파이썬 리스트 출력 형식으로 [1, 2, 3]이 출력됩니다." },
      { code: "print(lol[2][1])", note: "lol[2]의 1번 인덱스는 7입니다." },
      { code: "for sub in lol", note: "sub가 [1,2,3], [4,5], [6,7,8,9] 순서로 바뀝니다." },
      { code: "print(item, end = \" \")", note: "각 item 뒤에 공백을 붙여 같은 줄에 출력합니다." },
      { code: "print()", note: "부분 리스트 하나가 끝날 때마다 줄바꿈합니다." },
    ],
  },
  "external-python-10": {
    title: "Python 문자열 슬라이싱/서식 흐름",
    summary: "a[0:3]은 REM, a[12:16]은 EMBE입니다. 여기에 R AND STR을 붙이면 REMEMBER AND STR이 됩니다.",
    trace: [
      { code: "a = \"REMEMBER NOVEMBER\"", note: "인덱스 0~2는 R,E,M이고 12~15는 E,M,B,E입니다." },
      { code: "b = a[0:3] + a[12:16]", note: "a[0:3]='REM', a[12:16]='EMBE'라 b는 REMEMBE입니다." },
      { code: "c = \"R AND %s\" % \"STR\"", note: "%s 자리에 STR이 들어가 c는 R AND STR입니다." },
      { code: "print(b + c)", note: "REMEMBE + R AND STR이 이어져 REMEMBER AND STR이 출력됩니다." },
    ],
  },
};
