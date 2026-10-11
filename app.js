// Warstwa UI symulatora — stan dwóch wariantów i renderowanie.
(function () {
  "use strict";

  const DEFAULT_CATEGORIES = ["Social media", "WWW", "Radio", "TV", "Prasa", "Outdoor"];

  function defaultScenario() {
    const shares = Calc.evenShares(DEFAULT_CATEGORIES.length);
    return {
      budget: 100000,
      categories: DEFAULT_CATEGORIES.map((name, i) => ({ name, share: shares[i], roi: 20 })),
    };
  }

  const state = { active: "A", variants: { A: defaultScenario(), B: defaultScenario() } };
  const other = (v) => (v === "A" ? "B" : "A");
  const current = () => state.variants[state.active];

  const $ = (id) => document.getElementById(id);
  const fmtPLN = Calc.formatPLN;
  const fmtPct = (v) => Calc.formatNumber(v) + "%";

  // Akceptuje polski przecinek dziesiętny i spacje tysięcy; pusty tekst = NaN.
  function parseNum(text) {
    const cleaned = String(text).replace(/\s/g, "").replace(",", ".");
    return cleaned === "" ? NaN : Number(cleaned);
  }
  const showNum = (v) => (Number.isFinite(v) ? String(v).replace(".", ",") : "");

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
    );
  }

  // ---------- Edytor (renderowany przy zmianie zakładki / liczby kategorii) ----------

  function renderEditor() {
    const s = current();
    document.querySelectorAll(".tabs [role=tab]").forEach((t) => {
      t.setAttribute("aria-selected", String(t.dataset.variant === state.active));
    });
    $("editor").setAttribute("aria-labelledby", "tab-" + state.active);
    $("copy").textContent = "Kopiuj do wariantu " + other(state.active);
    $("result-variant").textContent = "Wariant " + state.active;
    $("budget").value = showNum(s.budget);

    $("cat-body").innerHTML = s.categories
      .map(
        (c, i) => `
        <tr data-index="${i}">
          <td data-label="Kategoria">
            <input type="text" data-field="name" value="${escapeHtml(c.name)}"
                   aria-label="Nazwa kategorii ${i + 1}">
          </td>
          <td data-label="% budżetu">
            <input type="text" inputmode="decimal" data-field="share" value="${showNum(c.share)}"
                   aria-label="% budżetu dla kategorii ${i + 1}">
          </td>
          <td data-label="ROI %">
            <input type="text" inputmode="decimal" data-field="roi" value="${showNum(c.roi)}"
                   aria-label="Oczekiwany ROI % dla kategorii ${i + 1}">
          </td>
          <td data-label="Kwota" class="num amount"></td>
          <td>
            <button type="button" class="remove" data-remove="${i}"
                    aria-label="Usuń kategorię ${i + 1}" ${s.categories.length <= 1 ? "disabled" : ""}>×</button>
          </td>
        </tr>`
      )
      .join("");

    renderResults();
  }

  // ---------- Wyniki (renderowane przy każdej zmianie wartości) ----------

  function renderResults() {
    const s = current();
    const calc = Calc.calculate(s);

    // Kwoty przy kategoriach, jeśli budżet i udział są poprawne.
    document.querySelectorAll("#cat-body tr").forEach((tr) => {
      const c = s.categories[Number(tr.dataset.index)];
      const ok = s.budget > 0 && Number.isFinite(c.share);
      tr.querySelector(".amount").textContent = ok ? fmtPLN((s.budget * c.share) / 100) : "—";
      tr.querySelector("[data-field=share]").classList.toggle("invalid",
        !Number.isFinite(c.share) || c.share < 0 || c.share > 100);
      tr.querySelector("[data-field=roi]").classList.toggle("invalid",
        !Number.isFinite(c.roi) || c.roi < -100);
    });
    $("budget").classList.toggle("invalid", !(s.budget > 0));

    const sumOk = Math.abs(calc.shareSum - 100) <= Calc.SHARE_TOLERANCE;
    const status = $("share-status");
    status.className = "share-status " + (sumOk ? "ok" : "bad");
    status.textContent = (sumOk ? "✓ " : "✗ ") + "Suma udziałów: " + fmtPct(calc.shareSum)
      + (sumOk ? "" : " (musi wynosić 100%)");

    $("result").innerHTML = calc.result ? resultHtml(calc.result) : errorsHtml(calc.errors);
    renderCompare();
  }

  function errorsHtml(errors) {
    return `<div class="errors"><p><strong>Nie można policzyć wyniku:</strong></p><ul>${
      errors.map((e) => `<li>${escapeHtml(e)}</li>`).join("")}</ul></div>`;
  }

  const signed = (cls, v, text) => `<span class="${v < 0 ? "neg" : v > 0 ? "pos" : ""} ${cls}">${text}</span>`;

  function resultHtml(r) {
    const rows = r.rows
      .map((row) => `
        <tr>
          <td data-label="Kategoria">${escapeHtml(row.name || "—")}</td>
          <td data-label="Kwota" class="num">${fmtPLN(row.amount)}</td>
          <td data-label="ROI" class="num">${fmtPct(row.roi)}</td>
          <td data-label="Zysk" class="num">${signed("", row.profit, fmtPLN(row.profit))}</td>
          <td data-label="Przychód" class="num">${fmtPLN(row.revenue)}</td>
        </tr>`)
      .join("");

    return `
      <div class="kpis">
        <div class="kpi"><span>Zainwestowano</span><strong>${fmtPLN(r.invested)}</strong></div>
        <div class="kpi"><span>Całkowity zysk</span><strong>${signed("", r.profit, fmtPLN(r.profit))}</strong></div>
        <div class="kpi"><span>Przychód</span><strong>${fmtPLN(r.revenue)}</strong></div>
        <div class="kpi main"><span>Całkowity ROI</span><strong>${signed("", r.roi, fmtPct(r.roi))}</strong></div>
      </div>
      <table class="res-table">
        <thead><tr>
          <th scope="col">Kategoria</th><th scope="col" class="num">Kwota</th>
          <th scope="col" class="num">ROI</th><th scope="col" class="num">Zysk</th>
          <th scope="col" class="num">Przychód</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
  }

  // ---------- Porównanie ----------

  function renderCompare() {
    const c = Calc.compare(state.variants.A, state.variants.B);
    const el = $("compare");

    if (!c.diff) {
      const bad = ["A", "B"].filter((v) => !c[v.toLowerCase()].valid);
      el.innerHTML = `<div class="errors"><p>Porównanie będzie dostępne, gdy oba warianty będą poprawne.</p><ul>${
        bad.map((v) => `<li>Wariant ${v}: ${escapeHtml(c[v.toLowerCase()].errors[0])}</li>`).join("")}</ul></div>`;
      return;
    }

    const a = c.a.result, b = c.b.result;
    const sign = (v) => (v > 0 ? "+" : v < 0 ? "−" : "");
    const line = (label, key, fmt, fmtDiff = fmt) => `
      <tr>
        <th scope="row">${label}</th>
        <td class="num">${fmt(a[key])}</td>
        <td class="num">${fmt(b[key])}</td>
        <td class="num">${signed("", c.diff[key], sign(c.diff[key]) + fmtDiff(Math.abs(c.diff[key])))}</td>
      </tr>`;

    const verdict = c.winner === "tie"
      ? "Oba warianty dają taki sam zysk."
      : `Lepszy jest <strong>Wariant ${c.winner}</strong> — zysk wyższy o ${fmtPLN(Math.abs(c.diff.profit))}.`;

    el.innerHTML = `
      <p class="verdict">${verdict}</p>
      <div class="table-scroll"><table class="cmp-table">
        <thead><tr>
          <th scope="col"></th><th scope="col" class="num">Wariant A</th>
          <th scope="col" class="num">Wariant B</th><th scope="col" class="num">Różnica (B − A)</th>
        </tr></thead>
        <tbody>
          ${line("Budżet", "invested", fmtPLN)}
          ${line("Zysk", "profit", fmtPLN)}
          ${line("Przychód", "revenue", fmtPLN)}
          ${line("ROI", "roi", fmtPct, (v) => Calc.formatNumber(v) + " pp")}
        </tbody>
      </table></div>`;
  }

  // ---------- Zdarzenia ----------

  document.querySelector(".tabs").addEventListener("click", (e) => {
    const v = e.target.dataset && e.target.dataset.variant;
    if (v && v !== state.active) {
      state.active = v;
      renderEditor();
    }
  });

  $("budget").addEventListener("input", (e) => {
    current().budget = parseNum(e.target.value);
    renderResults();
  });

  $("cat-body").addEventListener("input", (e) => {
    const field = e.target.dataset.field;
    if (!field) return;
    const cat = current().categories[Number(e.target.closest("tr").dataset.index)];
    cat[field] = field === "name" ? e.target.value : parseNum(e.target.value);
    renderResults();
  });

  $("cat-body").addEventListener("click", (e) => {
    const idx = e.target.dataset.remove;
    if (idx === undefined || current().categories.length <= 1) return;
    current().categories.splice(Number(idx), 1);
    renderEditor();
  });

  $("add-cat").addEventListener("click", () => {
    const cats = current().categories;
    cats.push({ name: "Nowa kategoria", share: 0, roi: 0 });
    renderEditor();
    const inputs = document.querySelectorAll("#cat-body [data-field=name]");
    inputs[inputs.length - 1].select();
  });

  $("even").addEventListener("click", () => {
    const cats = current().categories;
    Calc.evenShares(cats.length).forEach((v, i) => (cats[i].share = v));
    renderEditor();
  });

  $("copy").addEventListener("click", () => {
    const target = other(state.active);
    state.variants[target] = structuredClone(current());
    renderResults();
    const btn = $("copy");
    btn.textContent = "Skopiowano ✓";
    setTimeout(() => (btn.textContent = "Kopiuj do wariantu " + other(state.active)), 1200);
  });

  renderEditor();
})();
