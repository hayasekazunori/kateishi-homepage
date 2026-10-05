/* =========================================================
   お問い合わせフォーム
   入力 → 確認 → 送信完了 の3段階。
   送信先は config.js の form.endpoint（空ならデモ動作で送信しない）。
   ========================================================= */
(function () {
  "use strict";

  const S = window.SITE || {};
  const esc = (window.SiteUtil && window.SiteUtil.esc) || ((s) => String(s));
  const form = document.getElementById("contact-form");
  if (!form) return;

  const area = document.getElementById("form-area");
  const steps = document.querySelectorAll(".form-steps [data-step]");
  const panels = {
    input: form,
    confirm: document.getElementById("confirm-step"),
    done: document.getElementById("done-step")
  };
  const summary = document.getElementById("form-summary");
  const confirmList = document.getElementById("confirm-list");
  const sendButton = document.getElementById("send-btn");
  const sendError = document.getElementById("send-error");
  const prefillNote = document.getElementById("prefill-note");
  const SAMPLE = "サンプルのご請求";

  const RE = {
    kana: /^[ァ-ヶぁ-ゖー\s　]+$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    tel: /^0\d{9,10}$/,
    zip: /^\d{3}-?\d{4}$/
  };

  // name: フォーム項目名 / label: 確認画面の見出し
  const FIELDS = [
    { name: "type", label: "お問い合わせの種類", required: true, choose: true },
    { name: "company", label: "会社・団体名" },
    { name: "department", label: "部署名" },
    { name: "name", label: "お名前", required: true, max: 50 },
    { name: "kana", label: "フリガナ", required: true, max: 50,
      test: (v) => RE.kana.test(v), message: "フリガナはカタカナかひらがなで入力してください" },
    { name: "email", label: "メールアドレス", required: true,
      test: (v) => RE.email.test(v), message: "メールアドレスの形式を確認してください（例：info@example.com）" },
    { name: "tel", label: "電話番号", required: true,
      test: (v) => RE.tel.test(v.replace(/[-\s]/g, "")), message: "電話番号を数字で入力してください（例：052-000-0000）" },
    { name: "industry", label: "業種" },
    { name: "zip", label: "郵便番号", sampleOnly: true,
      test: (v) => RE.zip.test(v), message: "郵便番号は7桁の数字で入力してください（例：460-0000）" },
    { name: "address", label: "ご住所", sampleOnly: true, max: 200 },
    { name: "interest", label: "関心のある商品", max: 200 },
    { name: "volume", label: "月間ご使用量の目安", max: 200 },
    { name: "message", label: "お問い合わせ内容", required: true, max: 2000, multiline: true }
  ];

  const control = (name) => form.elements.namedItem(name);
  const isSample = () => {
    const checked = form.querySelector('input[name="type"]:checked');
    return !!checked && checked.value === SAMPLE;
  };

  // 全角の数字・記号を半角に
  function toHalf(text) {
    return String(text || "")
      .replace(/[０-９Ａ-Ｚａ-ｚ＠．]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
      .replace(/[－ー―‐−]/g, "-")
      .trim();
  }
  function valueOf(field) {
    const el = control(field.name);
    if (!el) return "";
    const raw = el.value || "";
    return ["email", "tel", "zip"].includes(field.name) ? toHalf(raw) : raw.trim();
  }

  function errorFor(field) {
    const v = valueOf(field);
    const required = field.required || (field.sampleOnly && isSample());
    if (!v) {
      if (!required) return "";
      return field.choose ? `${field.label}を選んでください` : `${field.label}を入力してください`;
    }
    if (field.max && v.length > field.max) return `${field.label}は${field.max}文字以内で入力してください`;
    if (field.test && !field.test(v)) return field.message;
    return "";
  }

  function showError(name, message) {
    const box = document.getElementById("e-" + name);
    const inputs = form.querySelectorAll(`[name="${name}"]`);
    if (box) {
      box.textContent = message;
      box.hidden = !message;
    }
    inputs.forEach((el) => {
      if (message) el.setAttribute("aria-invalid", "true");
      else el.removeAttribute("aria-invalid");
    });
  }

  function validateAll() {
    const errors = [];
    FIELDS.forEach((field) => {
      const message = errorFor(field);
      showError(field.name, message);
      if (message) errors.push(field.name);
    });
    const agree = control("agree");
    const agreeMessage = agree && agree.checked ? "" : "個人情報の取り扱いへの同意が必要です";
    showError("agree", agreeMessage);
    if (agreeMessage) errors.push("agree");
    return errors;
  }

  // サンプル請求のときだけ住所を必須にする
  function updateSampleRequirement() {
    const sample = isSample();
    form.querySelectorAll("[data-sample-badge]").forEach((badge) => {
      badge.className = sample ? "req" : "opt";
      badge.textContent = sample ? "必須" : "サンプル請求時は必須";
    });
    ["zip", "address"].forEach((name) => {
      const el = control(name);
      if (el) el.setAttribute("aria-required", String(sample));
    });
  }

  function goTo(step) {
    Object.keys(panels).forEach((key) => { panels[key].hidden = key !== step; });
    const order = ["input", "confirm", "done"];
    steps.forEach((li) => {
      const index = order.indexOf(li.dataset.step);
      const current = order.indexOf(step);
      li.classList.toggle("is-current", index === current);
      li.classList.toggle("is-done", index < current);
      if (index === current) li.setAttribute("aria-current", "step");
      else li.removeAttribute("aria-current");
    });
    area.scrollIntoView({ block: "start" });
    const heading = panels[step].querySelector("[data-step-heading]");
    if (heading) heading.focus({ preventScroll: true });
  }

  function buildConfirm() {
    confirmList.innerHTML = FIELDS.map((field) => {
      const v = valueOf(field);
      const value = v ? esc(v) : '<span class="empty">未入力</span>';
      return `<div><dt>${esc(field.label)}</dt><dd${field.multiline ? ' class="multiline"' : ""}>${value}</dd></div>`;
    }).join("");
  }

  function showDone(demo) {
    const mode = demo ? "demo" : "real";
    panels.done.querySelectorAll("[data-done]").forEach((el) => { el.hidden = el.dataset.done !== mode; });
    form.reset();
    updateSampleRequirement();
    goTo("done");
  }

  async function send() {
    const endpoint = String((S.form && S.form.endpoint) || "").trim();
    const trap = control("_gotcha");
    if (trap && trap.value) { showDone(false); return; } // 自動送信（スパム）は送らずに終了
    if (!endpoint) { showDone(true); return; }

    sendButton.disabled = true;
    sendButton.textContent = "送信しています…";
    sendError.hidden = true;
    try {
      const data = new FormData(form);
      FIELDS.forEach((field) => data.set(field.name, valueOf(field)));
      data.set("_subject", `【ホームページ】${valueOf(FIELDS[0])}（${valueOf(FIELDS[3])} 様）`);
      const response = await fetch(endpoint, { method: "POST", body: data, headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("HTTP " + response.status);
      showDone(false);
    } catch (err) {
      sendError.textContent = `送信できませんでした。時間をおいてもう一度お試しいただくか、お電話（${S.tel || ""}）でご連絡ください。`;
      sendError.hidden = false;
    } finally {
      sendButton.disabled = false;
      sendButton.textContent = "この内容で送信する";
    }
  }

  // ---- イベント ----
  let submitted = false;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    submitted = true;
    const errors = validateAll();
    if (errors.length) {
      summary.textContent = `入力内容に${errors.length}件の確認事項があります。赤い表示の項目をご確認ください。`;
      summary.hidden = false;
      const first = form.querySelector(`[name="${errors[0]}"]`);
      if (first) first.focus();
      return;
    }
    summary.hidden = true;
    buildConfirm();
    goTo("confirm");
  });

  form.addEventListener("change", (e) => {
    if (e.target.name === "type") updateSampleRequirement();
    if (submitted) validateAll();
  });
  form.addEventListener("input", (e) => {
    if (!submitted) return;
    const field = FIELDS.find((f) => f.name === e.target.name);
    if (field) showError(field.name, errorFor(field));
  });

  document.getElementById("back-btn").addEventListener("click", () => {
    sendError.hidden = true;
    goTo("input");
  });
  sendButton.addEventListener("click", send);

  // ---- 商品ページなどから来たときの自動入力 ----
  function setType(value) {
    const radio = form.querySelector(`input[name="type"][value="${value}"]`);
    if (radio) radio.checked = true;
    updateSampleRequirement();
  }
  const key = decodeURIComponent(location.hash.slice(1));
  const product = (window.PRODUCTS || []).find((p) => p.id === key);
  const typeByHash = { estimate: "見積のご依頼", sample: SAMPLE, new: "新規お取引のご相談" };
  if (product) {
    setType("見積のご依頼");
    control("interest").value = `${product.name}（品番 ${product.id}）`;
    prefillNote.textContent = `「${product.name}」についてのお問い合わせとして入力しました。内容は変更できます。`;
    prefillNote.hidden = false;
  } else if (typeByHash[key]) {
    setType(typeByHash[key]);
  }
  updateSampleRequirement();
})();
