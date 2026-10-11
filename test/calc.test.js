const test = require("node:test");
const assert = require("node:assert/strict");
const Calc = require("../calc.js");

const prdExample = {
  budget: 100000,
  categories: [
    { name: "Social media", share: 50, roi: 40 },
    { name: "WWW", share: 30, roi: 20 },
    { name: "Radio", share: 20, roi: -10 },
  ],
};

test("przykład z PRD daje oczekiwane wartości", () => {
  const { valid, result } = Calc.calculate(prdExample);
  assert.equal(valid, true);
  assert.deepEqual(result.rows.map((r) => r.amount), [50000, 30000, 20000]);
  assert.deepEqual(result.rows.map((r) => r.profit), [20000, 6000, -2000]);
  assert.equal(result.invested, 100000);
  assert.equal(result.profit, 24000);
  assert.equal(result.revenue, 124000);
  assert.equal(result.roi, 24);
});

test("suma 99% jest odrzucana z informacją o brakujących pp", () => {
  const s = structuredClone(prdExample);
  s.categories[2].share = 19;
  const r = Calc.calculate(s);
  assert.equal(r.valid, false);
  assert.equal(r.result, null);
  assert.match(r.errors.join(" "), /brakuje 1 pp/);
});

test("suma 101% jest odrzucana z informacją o przekroczeniu", () => {
  const s = structuredClone(prdExample);
  s.categories[2].share = 21;
  const r = Calc.calculate(s);
  assert.equal(r.valid, false);
  assert.match(r.errors.join(" "), /przekroczono 100% o 1 pp/);
});

test("ułamkowe udziały sumujące się do 100 są akceptowane", () => {
  const r = Calc.calculate({
    budget: 1000,
    categories: [
      { name: "a", share: 33.33, roi: 0 },
      { name: "b", share: 33.33, roi: 0 },
      { name: "c", share: 33.34, roi: 0 },
    ],
  });
  assert.equal(r.valid, true);
});

test("niepoprawny budżet, ROI poniżej -100 i brak kategorii", () => {
  assert.equal(Calc.validate({ ...prdExample, budget: 0 }).valid, false);
  assert.equal(Calc.validate({ ...prdExample, budget: NaN }).valid, false);
  const s = structuredClone(prdExample);
  s.categories[0].roi = -101;
  assert.equal(Calc.validate(s).valid, false);
  assert.equal(Calc.validate({ budget: 100, categories: [] }).valid, false);
});

test("porównanie liczy różnicę B − A i wskazuje lepszy wariant", () => {
  const b = {
    budget: 120000,
    categories: [
      { name: "Social media", share: 70, roi: 40 },
      { name: "WWW", share: 30, roi: 20 },
    ],
  };
  // B: 84000*0.4 + 36000*0.2 = 33600 + 7200 = 40800
  const c = Calc.compare(prdExample, b);
  assert.equal(c.diff.invested, 20000);
  assert.equal(c.diff.profit, 16800);
  assert.equal(c.diff.revenue, 36800);
  assert.equal(c.diff.roi, 10);
  assert.equal(c.winner, "B");
  assert.equal(Calc.compare(b, prdExample).winner, "A");
  assert.equal(Calc.compare(prdExample, prdExample).winner, "tie");
});

test("porównanie z niepoprawnym wariantem nie zwraca różnic", () => {
  const c = Calc.compare(prdExample, { budget: 0, categories: [] });
  assert.equal(c.diff, null);
  assert.equal(c.b.valid, false);
});

test("rozłóż równo daje sumę dokładnie 100", () => {
  for (const n of [1, 3, 6, 7]) {
    const shares = Calc.evenShares(n);
    assert.equal(shares.length, n);
    const sum = shares.reduce((s, v) => s + v, 0);
    assert.ok(Math.abs(sum - 100) < Calc.SHARE_TOLERANCE, `n=${n} sum=${sum}`);
  }
  assert.deepEqual(Calc.evenShares(3), [33.33, 33.33, 33.34]);
});
