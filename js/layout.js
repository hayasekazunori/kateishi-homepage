/* =========================================================
   共通レイアウト
   - ヘッダー・フッター・お問い合わせ帯を全ページ共通で描画
   - data-site="項目名" の要素に config.js の値を差し込む
   - data-render="種類" の要素に一覧（お知らせ・沿革など）を描画
   ========================================================= */
(function () {
  "use strict";

  const S = window.SITE || {};

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[c]);
  }
  function telHref(number) {
    return "tel:" + String(number || "").replace(/[^\d+]/g, "");
  }
  function get(path) {
    return String(path).split(".").reduce((obj, key) => (obj == null ? undefined : obj[key]), S);
  }
  window.SiteUtil = { esc, telHref };

  const NAV = [
    { key: "home", href: "index.html", label: "トップ" },
    { key: "products", href: "products.html", label: "取扱商品" },
    { key: "service", href: "service.html", label: "サービス" },
    { key: "company", href: "company.html", label: "会社概要" }
  ];

  const LOGO_SVG =
    '<svg class="logo-mark" viewBox="0 0 40 40" aria-hidden="true" focusable="false">' +
    '<path class="lm-sheet" d="M17 28.5H38V34H17z"/>' +
    '<circle class="lm-roll" cx="17" cy="17" r="15"/>' +
    '<circle class="lm-ring" cx="17" cy="17" r="10"/>' +
    '<circle class="lm-core" cx="17" cy="17" r="5"/></svg>';

  const PHONE_SVG =
    '<svg class="icon-phone" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" ' +
    'd="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.6.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z"/></svg>';

  function logoHTML(fullName) {
    return `<a class="logo" href="index.html">${LOGO_SVG}<span class="logo-text">` +
      `<span class="logo-name">${esc(fullName ? S.name : (S.shortName || S.name))}</span>` +
      `<span class="logo-sub">${esc(S.tagline)}</span></span></a>`;
  }

  function headerHTML(page) {
    const items = NAV.map((n) =>
      `<li><a href="${n.href}"${n.key === page ? ' aria-current="page"' : ""}>${n.label}</a></li>`
    ).join("");
    const tel = `<a class="tel-num" href="${telHref(S.tel)}">${PHONE_SVG}${esc(S.tel)}</a>`;
    return `
    <div class="wrap header-inner">
      ${logoHTML(false)}
      <nav class="global-nav" id="global-nav" aria-label="メインメニュー">
        <ul>
          ${items}
          <li class="nav-contact"><a class="btn btn-primary btn-sm" href="contact.html"${page === "contact" ? ' aria-current="page"' : ""}>お問い合わせ</a></li>
        </ul>
        <div class="nav-tel">
          <span class="nav-tel-label">お電話でのご相談</span>
          ${tel}
          <span class="tel-hours">受付 ${esc(S.hours)}</span>
        </div>
      </nav>
      <div class="header-tel">
        ${tel}
        <span class="tel-hours">受付 ${esc(S.hours)}</span>
      </div>
      <a class="header-call" href="${telHref(S.tel)}" aria-label="電話をかける（${esc(S.tel)}）">${PHONE_SVG}</a>
      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="global-nav">
        <span class="menu-bars" aria-hidden="true"></span><span class="menu-label">メニュー</span>
      </button>
    </div>`;
  }

  function footerHTML() {
    const links = NAV.concat([
      { href: "contact.html", label: "お問い合わせ" },
      { href: "privacy.html", label: "プライバシーポリシー" }
    ]).map((n) => `<li><a href="${n.href}">${n.label}</a></li>`).join("");
    return `
    <div class="wrap footer-inner">
      <div class="footer-company">
        ${logoHTML(true)}
        <address>
          〒${esc(S.zip)} ${esc(S.address)}<br>
          TEL <a href="${telHref(S.tel)}">${esc(S.tel)}</a>　FAX ${esc(S.fax)}<br>
          受付時間 ${esc(S.hours)}（${esc(S.holidays)}はお休み）
        </address>
      </div>
      <nav class="footer-nav" aria-label="フッターメニュー"><ul>${links}</ul></nav>
    </div>
    <div class="footer-bottom"><div class="wrap"><small>&copy; ${esc(S.copyrightYear)} ${esc(S.name)}</small></div></div>`;
  }

  const RENDER = {
    news(el) {
      const limit = Number(el.dataset.limit) || Infinity;
      el.innerHTML = (S.news || []).slice(0, limit).map((n) => `
        <li class="news-item">
          <time datetime="${esc(n.date)}">${esc(String(n.date).replace(/-/g, "."))}</time>
          <span class="news-tag">${esc(n.tag)}</span>
          <span class="news-title">${esc(n.title)}</span>
        </li>`).join("");
    },
    figures(el) {
      el.innerHTML = (S.figures || []).map((f) => `
        <div class="sheet">
          <dt>${esc(f.label)}</dt>
          <dd><span class="sheet-num">${esc(f.value)}</span><span class="sheet-unit">${esc(f.unit)}</span></dd>
        </div>`).join("");
    },
    history(el) {
      el.innerHTML = (S.history || []).map((h) =>
        `<li><span class="history-year">${esc(h.year)}</span><p>${esc(h.text)}</p></li>`
      ).join("");
    },
    company(el) {
      const rows = [
        ["社名", `${S.name}（${S.nameKana}）`],
        ["英文社名", S.nameEn],
        ["設立", S.founded],
        ["代表者", S.representative],
        ["資本金", S.capital],
        ["従業員数", S.employees],
        ["所在地", `〒${S.zip} ${S.address}`],
        ["電話・FAX", `TEL ${S.tel}　FAX ${S.fax}`],
        ["事業内容", S.business],
        ["主な仕入先", S.suppliers],
        ["取引銀行", S.banks]
      ].filter((row) => row[1]);
      el.innerHTML = rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("");
    },
    bases(el) {
      el.innerHTML = (S.bases || []).map((b) => `
        <article class="base-card">
          <h3>${esc(b.name)}</h3>
          <p class="base-address">${esc(b.address)}</p>
          <p class="base-note">${esc(b.note)}</p>
          ${b.map ? `<a class="text-link" href="${esc(b.map)}" target="_blank" rel="noopener">地図を見る（Googleマップ）</a>` : ""}
        </article>`).join("");
    },
    areas(el) {
      el.innerHTML = (S.areas || []).map((a) => `
        <div class="area-row">
          <span class="area-method">${esc(a.method)}</span>
          <span class="area-name">${esc(a.area)}</span>
          <p>${esc(a.detail)}</p>
        </div>`).join("");
    },
    cta(el) {
      el.innerHTML = `
      <div class="wrap cta-inner">
        <div class="cta-copy">
          <p class="eyebrow">お見積り・サンプルは無料です</p>
          <h2>いまお使いの品と数量を、まずお聞かせください</h2>
          <p>現在の使用量や納品場所をうかがい、用途と予算に合う商品と配送方法をご提案します。1ケースからのご相談も歓迎です。</p>
        </div>
        <div class="cta-actions">
          <a class="btn btn-primary" href="contact.html#estimate">見積を依頼する</a>
          <a class="btn btn-ghost" href="contact.html#sample">サンプルを請求する</a>
          <div class="cta-tel">
            <span class="cta-tel-label">お電話でのご相談（${esc(S.hours)}）</span>
            <a class="tel-num" href="${telHref(S.tel)}">${PHONE_SVG}${esc(S.tel)}</a>
            <span class="cta-fax">FAX ${esc(S.fax)}（24時間受付）</span>
          </div>
        </div>
      </div>`;
    }
  };

  function setupMenu() {
    const button = document.querySelector(".menu-toggle");
    const nav = document.getElementById("global-nav");
    if (!button || !nav) return;
    const setOpen = (open) => {
      button.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
    };
    button.addEventListener("click", () => setOpen(button.getAttribute("aria-expanded") !== "true"));
    nav.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("is-open")) { setOpen(false); button.focus(); }
    });
    const desktop = window.matchMedia("(min-width: 861px)");
    const onChange = () => { if (desktop.matches) setOpen(false); };
    if (desktop.addEventListener) desktop.addEventListener("change", onChange);
    else if (desktop.addListener) desktop.addListener(onChange);
  }

  // ---- 描画 ----
  const header = document.getElementById("site-header");
  const page = header ? header.dataset.page : "";
  const title = header ? header.dataset.title : "";

  if (header) header.innerHTML = headerHTML(page);
  const footer = document.getElementById("site-footer");
  if (footer) footer.innerHTML = footerHTML();

  if (S.sampleNotice && header) {
    const bar = document.createElement("div");
    bar.className = "sample-bar";
    bar.innerHTML = '<div class="wrap">このサイトはサンプルです。社名・所在地・電話番号・数字はすべて架空のものです。</div>';
    header.parentNode.insertBefore(bar, header);
  }

  if (S.name) document.title = title ? `${title}｜${S.name}` : `${S.name}｜${S.tagline}`;

  document.querySelectorAll("[data-render]").forEach((el) => {
    const fn = RENDER[el.dataset.render];
    if (fn) fn(el);
  });
  document.querySelectorAll("[data-site]").forEach((el) => {
    const value = get(el.dataset.site);
    if (value != null) el.textContent = value;
  });
  document.querySelectorAll("[data-site-href]").forEach((el) => {
    const key = el.dataset.siteHref;
    const href = key === "tel" ? telHref(S.tel) : key === "mail" ? "mailto:" + S.email : key === "map" ? S.mapUrl : get(key);
    if (href) el.setAttribute("href", href);
  });

  setupMenu();
})();
