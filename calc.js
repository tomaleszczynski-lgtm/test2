// Logika symulatora budżetu i ROI — bez zależności od DOM, testowana w Node.
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.Calc = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const SHARE_TOLERANCE = 0.001; // tolerancja sumy udziałów w punktach procentowych
  const MIN_ROI = -100;

  function isNumber(v) {
    return typeof v === "number" && Number.isFinite(v);
  }

  // Sprawdza wariant; zwraca listę błędów (pusta = poprawny) i sumę udziałów.
  function validate(scenario) {
    const errors = [];
    const { budget, categories } = scenario;

    if (!isNumber(budget) || budget <= 0) {
      errors.push("Podaj roczny budżet większy od zera.");
    }
    if (!Array.isArray(categories) || categories.length === 0) {
      errors.push("Dodaj co najmniej jedną kategorię.");
      return { valid: false, errors, shareSum: 0 };
    }

    let shareSum = 0;
    categories.forEach((c, i) => {
      const label = c.name && c.name.trim() ? `„${c.name.trim()}”` : `nr ${i + 1}`;
      if (!isNumber(c.share) || c.share < 0 || c.share > 100) {
        errors.push(`Kategoria ${label}: udział musi być liczbą od 0 do 100.`);
      } else {
        shareSum += c.share;
      }
      if (!isNumber(c.roi) || c.roi < MIN_ROI) {
        errors.push(`Kategoria ${label}: ROI musi być liczbą nie mniejszą niż ${MIN_ROI}%.`);
      }
    });

    const diff = shareSum - 100;
    if (Math.abs(diff) > SHARE_TOLERANCE) {
      const pp = formatNumber(Math.abs(diff));
      errors.push(
        diff < 0
          ? `Suma udziałów wynosi ${formatNumber(shareSum)}% — brakuje ${pp} pp do 100%.`
          : `Suma udziałów wynosi ${formatNumber(shareSum)}% — przekroczono 100% o ${pp} pp.`
      );
    }

    return { valid: errors.length === 0, errors, shareSum };
  }

  // Liczy wynik wariantu. Zwraca null w polu result, jeśli dane są niepoprawne.
  function calculate(scenario) {
    const validation = validate(scenario);
    if (!validation.valid) return { ...validation, result: null };

    const rows = scenario.categories.map((c) => {
      const amount = (scenario.budget * c.share) / 100;
      const profit = (amount * c.roi) / 100;
      return { name: c.name, share: c.share, roi: c.roi, amount, profit, revenue: amount + profit };
    });

    const invested = rows.reduce((s, r) => s + r.amount, 0);
    const profit = rows.reduce((s, r) => s + r.profit, 0);
    const result = {
      rows,
      invested,
      profit,
      revenue: invested + profit,
      roi: invested > 0 ? (profit / invested) * 100 : 0,
    };
    return { ...validation, result };
  }

  // Porównanie dwóch wariantów: różnice B − A i lepszy wariant wg całkowitego zysku.
  function compare(a, b) {
    const ra = calculate(a);
    const rb = calculate(b);
    if (!ra.result || !rb.result) return { a: ra, b: rb, diff: null, winner: null };

    const keys = ["invested", "profit", "revenue", "roi"];
    const diff = {};
    keys.forEach((k) => (diff[k] = rb.result[k] - ra.result[k]));

    let winner = "tie";
    if (Math.abs(diff.profit) > 0.005) winner = diff.profit > 0 ? "B" : "A";
    return { a: ra, b: rb, diff, winner };
  }

  // Dzieli 100% po równo; reszta z zaokrągleń trafia do ostatniej kategorii.
  function evenShares(count, decimals = 2) {
    if (count <= 0) return [];
    const factor = Math.pow(10, decimals);
    const base = Math.floor((100 / count) * factor) / factor;
    const shares = Array(count).fill(base);
    shares[count - 1] = Math.round((100 - base * (count - 1)) * factor) / factor;
    return shares;
  }

  function formatNumber(v, maxDigits = 2) {
    return new Intl.NumberFormat("pl-PL", { maximumFractionDigits: maxDigits }).format(v);
  }

  function formatPLN(v) {
    return new Intl.NumberFormat("pl-PL", {
      style: "currency",
      currency: "PLN",
      maximumFractionDigits: 2,
    }).format(v);
  }

  return { validate, calculate, compare, evenShares, formatNumber, formatPLN, SHARE_TOLERANCE };
});
