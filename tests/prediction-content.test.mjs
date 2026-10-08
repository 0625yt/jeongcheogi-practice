import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

test("predicted SQL result questions are independently checked by a database engine", () => {
  const cases = [
    [
      "CREATE TABLE T(id,score); INSERT INTO T VALUES(1,80),(2,NULL),(3,60),(4,NULL);",
      "SELECT COUNT(*),COUNT(score),SUM(score) FROM T",
      [[4, 2, 140]],
    ],
    [
      "CREATE TABLE EMP(dept,pay); INSERT INTO EMP VALUES('A',30),('A',50),('B',20),('B',25),('C',90);",
      "SELECT dept,SUM(pay) FROM EMP GROUP BY dept HAVING COUNT(*)>=2 AND SUM(pay)>=70",
      [["A", 80]],
    ],
    [
      "CREATE TABLE EMP(id,dept); CREATE TABLE DEPT(id,active); INSERT INTO EMP VALUES(1,10),(2,20),(3,20),(4,NULL); INSERT INTO DEPT VALUES(10,'Y'),(20,'N');",
      "SELECT COUNT(*) FROM EMP e JOIN DEPT d ON e.dept=d.id WHERE d.active='Y'",
      [[1]],
    ],
    [
      "CREATE TABLE T(x);CREATE TABLE B(x);INSERT INTO T VALUES(1),(2),(3);INSERT INTO B VALUES(2),(NULL);",
      "SELECT x FROM T WHERE x NOT IN(SELECT x FROM B)",
      [],
    ],
    [
      "CREATE TABLE A(x);CREATE TABLE B(x);INSERT INTO A VALUES(1),(2),(2);INSERT INTO B VALUES(2),(3);",
      "SELECT x FROM A UNION SELECT x FROM B",
      [[1], [2], [3]],
    ],
    [
      "CREATE TABLE A(x);CREATE TABLE B(x);INSERT INTO A VALUES(1),(2),(2);INSERT INTO B VALUES(2),(3);",
      "SELECT COUNT(*) FROM(SELECT x FROM A UNION ALL SELECT x FROM B)",
      [[5]],
    ],
    [
      "CREATE TABLE N(name);INSERT INTO N VALUES('Kim'),('Ki'),('Kite'),('Aki'),('Kimchi');",
      "SELECT COUNT(*) FROM N WHERE name LIKE 'Ki_'",
      [[1]],
    ],
    [
      "CREATE TABLE T(x);INSERT INTO T VALUES(1),(1),(2),(NULL),(NULL);",
      "SELECT COUNT(x),COUNT(DISTINCT x),COUNT(*) FROM T",
      [[3, 2, 5]],
    ],
    [
      "CREATE TABLE A(id);CREATE TABLE B(id,value);INSERT INTO A VALUES(1),(2),(3);INSERT INTO B VALUES(1,10),(1,20),(2,NULL);",
      "SELECT COUNT(*),COUNT(b.value) FROM A a LEFT JOIN B b ON a.id=b.id",
      [[4, 2]],
    ],
    [
      "CREATE TABLE T(id,score);INSERT INTO T VALUES(1,70),(2,90),(3,90),(4,60);",
      "SELECT id FROM T WHERE score=(SELECT MAX(score) FROM T) ORDER BY id",
      [[2], [3]],
    ],
    [
      "CREATE TABLE T(id,x,y);INSERT INTO T VALUES(1,4,10),(2,8,20);UPDATE T SET x=x+2,y=x*3 WHERE id=1;",
      "SELECT x,y FROM T WHERE id=1",
      [[6, 12]],
    ],
    [
      "CREATE TABLE A(id);CREATE TABLE B(id);INSERT INTO A VALUES(1),(2),(3),(4);INSERT INTO B VALUES(2),(2),(4);",
      "SELECT COUNT(*) FROM A a WHERE EXISTS(SELECT 1 FROM B b WHERE b.id=a.id)",
      [[2]],
    ],
    [
      "CREATE TABLE SALE(dept,price);INSERT INTO SALE VALUES('A',20),('A',40),('B',30),('B',50),('C',100);",
      "SELECT dept,SUM(price) FROM SALE WHERE price>=30 GROUP BY dept HAVING SUM(price)>=70 ORDER BY dept",
      [
        ["B", 80],
        ["C", 100],
      ],
    ],
    [
      "PRAGMA foreign_keys=ON;CREATE TABLE P(id PRIMARY KEY);CREATE TABLE C(cid,pid REFERENCES P(id) ON DELETE CASCADE);INSERT INTO P VALUES(1),(2);INSERT INTO C VALUES(10,1),(11,1),(12,2);DELETE FROM P WHERE id=1;",
      "SELECT cid FROM C",
      [[12]],
    ],
    [
      "CREATE TABLE A(id);CREATE TABLE B(id);INSERT INTO A VALUES(1),(2),(3);INSERT INTO B VALUES(2),(NULL);",
      "SELECT a.id FROM A a WHERE NOT EXISTS(SELECT 1 FROM B b WHERE b.id=a.id) ORDER BY a.id",
      [[1], [3]],
    ],
    [
      "CREATE TABLE T(id,score);INSERT INTO T VALUES(1,80),(2,90),(3,90),(4,70);",
      "SELECT id FROM T ORDER BY score DESC,id ASC LIMIT 2",
      [[2], [3]],
    ],
    [
      "CREATE TABLE T(x);INSERT INTO T VALUES(10),(NULL),(20);",
      "SELECT SUM(COALESCE(x,5)),AVG(COALESCE(x,5)) FROM T",
      [[35, 35 / 3]],
    ],
  ];
  const script = `import sqlite3,json,sys\nresults=[]\nfor setup,query,expected in json.loads(sys.stdin.read()):\n c=sqlite3.connect(':memory:')\n c.executescript(setup)\n results.append(c.execute(query).fetchall())\n c.close()\nprint(json.dumps(results))`;
  const result = spawnSync("python3", ["-c", script], {
    input: JSON.stringify(cases),
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(
    JSON.parse(result.stdout),
    cases.map((c) => c[2]),
  );
});

test("subnet and scheduling calculations are independently recomputed", () => {
  const subnet = (octet, prefix) => {
    const size = 2 ** (32 - prefix),
      first = Math.floor(octet / size) * size;
    return [first, first + size - 1, size - 2];
  };
  assert.deepEqual(subnet(77, 26), [64, 127, 62]);
  assert.deepEqual(subnet(150, 25), [128, 255, 126]);
  assert.deepEqual(subnet(16, 28), [16, 31, 14]);
  const arrival = [0, 2, 3],
    burst = [7, 3, 1],
    remaining = [...burst],
    finish = [];
  for (let t = 0; remaining.some((n) => n > 0); t++) {
    const candidates = remaining
      .map((n, i) => ({ n, i }))
      .filter((x) => x.n > 0 && arrival[x.i] <= t)
      .sort((a, b) => a.n - b.n || a.i - b.i);
    if (!candidates.length) continue;
    const i = candidates[0].i;
    if (--remaining[i] === 0) finish[i] = t + 1;
  }
  assert.deepEqual(
    finish.map((t, i) => t - arrival[i] - burst[i]),
    [4, 1, 0],
  );
  const rr = [5, 3, 1],
    queue = [0, 1, 2],
    completed = [],
    left = [...rr];
  let clock = 0;
  while (queue.length) {
    const i = queue.shift(),
      used = Math.min(2, left[i]);
    left[i] -= used;
    clock += used;
    if (left[i]) queue.push(i);
    else completed[i] = clock;
  }
  assert.deepEqual(
    completed.map((t, i) => t - rr[i]),
    [4, 5, 4],
  );
});
