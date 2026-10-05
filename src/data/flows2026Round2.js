export const flows2026Round2 = {
  "2026년-2회-2": {
    title: "부모 생성자와 메서드 호출",
    answer: "10a20b",
    trace: [
      {
        code: "B obj = new B(10, 20);",
        note: "B 생성자의 a=10, b=20으로 시작합니다. 먼저 super(a)를 통해 부모 생성자를 호출합니다.",
        state: [
          { name: "B 생성자 a", after: "10" },
          { name: "B 생성자 b", after: "20" },
        ],
      },
      {
        code: "super(a); → A(int a) → this.a = a;",
        note: "부모 A의 private 필드 a에 10이 저장됩니다. 이어 자식 생성자로 돌아와 this.b=20을 저장합니다.",
        state: [
          { name: "부모 필드 a", before: "0", after: "10" },
          { name: "자식 필드 b", before: "0", after: "20" },
        ],
      },
      {
        code: "obj.print(); → B.print() → super.print();",
        note: "B.print()가 실행됩니다. 그 안의 super.print()는 A.print()를 실행해 부모 a=10 뒤에 문자 a를 붙여 출력합니다.",
        output: "10a",
      },
      {
        code: 'System.out.print(b + "b");',
        note: "자식 b=20 뒤에 문자 b를 붙입니다. print는 줄바꿈 없이 이어 쓰므로 전체 출력은 10a20b입니다.",
        output: "10a20b",
      },
    ],
  },
  "2026년-2회-5": {
    title: "딕셔너리 순회와 문자열 누적",
    answer: "CNNLRPYT",
    trace: [
      {
        code: 'tmpdict = LocationDict(); str01 = ""',
        note: "딕셔너리는 NYC, LON, PAR, TKY의 삽입 순서로 순회합니다. 각 키의 마지막 문자와 도시 이름의 첫 문자를 합칩니다.",
        state: [{ name: "str01", after: '""' }],
      },
      {
        code: "keyk = key[-1]; locationk = location[0]",
        note: "NYC의 마지막 문자 C와 New York의 첫 문자 N을 붙입니다.",
        state: [
          { name: "keyk", after: "C" },
          { name: "locationk", after: "N" },
          { name: "str01", before: '""', after: "CN" },
        ],
      },
      {
        code: "str01 += keyk + locationk",
        note: "LON에서는 N+L, PAR에서는 R+P, TKY에서는 Y+T를 기존 문자열 뒤에 차례로 붙입니다.",
        table: {
          columns: ["key", "도시", "추가", "str01"],
          rows: [
            ["NYC", "New York", "CN", "CN"],
            ["LON", "London", "NL", "CNNL"],
            ["PAR", "Paris", "RP", "CNNLRP"],
            ["TKY", "Tokyo", "YT", "CNNLRPYT"],
          ],
        },
      },
      {
        code: 'print(str01, end="")',
        note: "누적 문자열을 출력합니다. end가 빈 문자열이므로 끝에 줄바꿈을 붙이지 않습니다.",
        output: "CNNLRPYT",
      },
    ],
  },
  "2026년-2회-6": {
    title: "슬라이스 인덱스와 문자열 결합",
    answer: "_THIISING",
    trace: [
      {
        code: 'a = "_THIS_IS_KIM_SPEAKING"',
        note: "문자열의 공백 아닌 밑줄도 한 문자로 셉니다. 인덱스는 0부터 시작합니다.",
        table: {
          columns: ["인덱스", "문자"],
          rows: [
            ["0..3", "_ T H I"],
            ["4..7", "S _ I S"],
            ["8..11", "_ K I M"],
            ["12..15", "_ S P E"],
            ["16..19", "A K I N"],
            ["20", "G"],
          ],
        },
      },
      {
        code: "b=a[:4]; c=a[6:8]; d=a[18:]",
        note: "끝 인덱스는 포함하지 않습니다. b는 0..3의 _THI, c는 6..7의 IS, d는 18부터 끝까지 ING입니다.",
        state: [
          { name: "b", after: "_THI" },
          { name: "c", after: "IS" },
          { name: "d", after: "ING" },
        ],
      },
      {
        code: "e=b+c+d; print(e)",
        note: "_THI + IS + ING = _THIISING입니다. IS와 ING가 만나는 위치의 I 두 개를 빠뜨리지 않습니다.",
        output: "_THIISING",
      },
    ],
  },
  "2026년-2회-7": {
    title: "후위 순회에서 세 번째 노드 찾기",
    answer: "12",
    trace: [
      {
        code: "na={21,&nb,&nd}; nb={12,&ne,&nc};",
        note: "루트 21의 왼쪽은 12, 오른쪽은 64입니다. 노드 12의 왼쪽은 35, 오른쪽은 53입니다. 전역 c=0, ans=0으로 시작합니다.",
        state: [
          { name: "c", after: "0" },
          { name: "ans", after: "0" },
        ],
        diagram: "tree",
      },
      {
        code: "pst(n->a); pst(n->b); if(++c==3) ans=n->v;",
        note: "왼쪽 자식, 오른쪽 자식, 현재 노드 순으로 처리합니다. NULL 호출은 즉시 반환하여 c를 증가시키지 않습니다.",
        table: {
          columns: ["처리 순서", "n->v", "++c", "ans"],
          rows: [
            [1, 35, 1, 0],
            [2, 53, 2, 0],
            [3, 12, 3, 12],
            [4, 64, 4, 12],
            [5, 21, 5, 12],
          ],
        },
      },
      {
        code: "if (++c == 3) ans = n->v;",
        note: "세 번째 처리 노드는 12입니다. c가 2에서 3으로 바뀌는 순간 조건이 참이라 ans=12를 저장합니다.",
        state: [
          { name: "c", before: "2", after: "3" },
          { name: "ans", before: "0", after: "12" },
        ],
      },
      {
        code: 'printf("%d\\n", ans);',
        note: "이후 64와 21에서는 c=4,5로 조건이 거짓입니다. ans=12가 유지되어 12를 출력합니다.",
        output: "12",
      },
    ],
  },
  "2026년-2회-9": {
    title: "주소 전달과 값 전달의 차이",
    answer: "1. 50\n2. 50\n3. 2\n4. 8",
    trace: [
      {
        code: "int i=30; int list[]={2,4,6,8,10};",
        note: "main의 i=30이며 list의 0..4번 칸에는 2,4,6,8,10이 있습니다.",
        state: [
          { name: "main.i", after: "30" },
          { name: "list", after: "[2,4,6,8,10]" },
        ],
      },
      {
        code: "fn1(&i); → *i=50;",
        note: "main 변수의 주소를 넘기므로 역참조 대입이 원래 i를 바꿉니다. 첫 출력은 1. 50입니다.",
        state: [{ name: "main.i", before: "30", after: "50" }],
        output: "1. 50",
      },
      {
        code: "fn2(i); → i=60;",
        note: "50의 복사본이 fn2의 지역 매개변수에 들어갑니다. 지역 변수만 60으로 바뀌고 main.i는 50을 유지합니다.",
        state: [
          { name: "fn2.i", before: "50", after: "60" },
          { name: "main.i", before: "50", after: "50" },
        ],
        output: "1. 50\n2. 50",
      },
      {
        code: "fn34(list); → *p; *(p+3);",
        note: "p는 list[0]을 가리킵니다. *p=2, p+3은 list[3]의 주소라 *(p+3)=8입니다.",
        state: [
          { name: "*p", after: "2" },
          { name: "*(p+3)", after: "8" },
        ],
        output: "1. 50\n2. 50\n3. 2\n4. 8",
      },
    ],
  },
  "2026년-2회-15": {
    title: "객체별 필드와 재정의된 메서드",
    answer: "509",
    trace: [
      {
        code: "A aaa=new A(); B bbb=new B();",
        note: "aaa와 bbb는 서로 다른 객체입니다. 각 객체에 부모 클래스의 a,b,c가 따로 있습니다.",
      },
      {
        code: "aaa.set(1,5,3); bbb.set(10,30,50);",
        note: "상속받은 set 메서드는 각 객체의 필드를 초기화합니다. private b도 부모의 set 내부에서 저장할 수 있습니다.",
        table: {
          columns: ["객체", "a", "b", "c"],
          rows: [
            ["aaa", 1, 5, 3],
            ["bbb", 10, 30, 50],
          ],
        },
      },
      {
        code: "aaa.hap(); → return a+b+c;",
        note: "aaa는 A 객체이므로 부모 구현으로 1+5+3=9를 반환합니다.",
        state: [{ name: "aaa.hap()", after: "9" }],
      },
      {
        code: "bbb.hap(); → return a*c;",
        note: "bbb는 B 객체이므로 자식 구현으로 10*50=500을 반환합니다. b=30은 이 식에서 사용하지 않습니다.",
        state: [{ name: "bbb.hap()", after: "500" }],
      },
      {
        code: "System.out.print(aaa.hap()+bbb.hap());",
        note: "두 반환값 9+500=509를 더하여 출력합니다.",
        output: "509",
      },
    ],
  },
  "2026년-2회-18": {
    title: "재귀 반환값을 작은 입력부터 계산하기",
    answer: "1",
    trace: [
      {
        code: "c(5); if(n<=1) return n;",
        note: "c(5)는 종료 조건이 거짓이라 재귀 계산을 합니다. n<=1이면 n을 그대로 반환하므로 음수 입력의 반환값도 음수입니다.",
        state: [
          { name: "c(-1)", after: "-1" },
          { name: "c(0)", after: "0" },
          { name: "c(1)", after: "1" },
        ],
      },
      {
        code: "return c(n-1)+c(n-3);",
        note: "같은 입력의 반환값은 같으므로 작은 입력부터 계산하면 중복 호출을 따라가기 쉽습니다.",
        table: {
          columns: ["호출", "대입한 식", "반환값"],
          rows: [
            ["c(2)", "c(1)+c(-1) = 1-1", 0],
            ["c(3)", "c(2)+c(0) = 0+0", 0],
            ["c(4)", "c(3)+c(1) = 0+1", 1],
            ["c(5)", "c(4)+c(2) = 1+0", 1],
          ],
        },
      },
      {
        code: 'printf("%d",c(5));',
        note: "c(5)의 반환값 1을 출력합니다. 종료 조건을 n==1로 잘못 읽거나 음수를 0으로 처리하면 계산이 달라집니다.",
        output: "1",
      },
    ],
  },
};
