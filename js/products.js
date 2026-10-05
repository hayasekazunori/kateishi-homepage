/* =========================================================
   取扱商品
   - トップページのカテゴリ一覧（#category-tiles）
   - 商品ページのカタログ（#catalog）：カテゴリ切替・検索・用途・詳細ダイアログ
   - 写真がない商品は、カテゴリ別のイラスト（SVG）を表示
   ========================================================= */
(function () {
  "use strict";

  const PRODUCTS = window.PRODUCTS || [];
  const CATS = window.PRODUCT_CATEGORIES || [];
  const USES = window.PRODUCT_USES || [];
  const esc = (window.SiteUtil && window.SiteUtil.esc) || ((s) => String(s));

  // ---- イラスト（viewBox 160×120。色は style.css の .art で指定）----
  const ART = {
    rolls(o) {
      let s = "";
      for (let i = 0; i < 3; i++) {
        const x = 27 + i * 36;
        const cx = x + 17;
        s += `<path class="p" d="M${x} 38V96A17 6 0 0 0 ${x + 34} 96V38Z"/>` +
          `<ellipse class="p" cx="${cx}" cy="38" rx="17" ry="6"/>` +
          `<ellipse class="c" cx="${cx}" cy="38" rx="6.5" ry="2.4"/>` +
          `<ellipse class="h" cx="${cx}" cy="38" rx="3.8" ry="1.4"/>`;
      }
      return s + `<rect class="${o.band}" x="25" y="60" width="110" height="15" rx="2"/>` +
        '<rect class="w" x="33" y="66" width="34" height="3" rx="1.5"/>';
    },
    jumbo() {
      return '<circle class="p" cx="68" cy="60" r="46"/>' +
        '<circle class="r" cx="68" cy="60" r="36"/><circle class="r" cx="68" cy="60" r="26"/>' +
        '<circle class="c" cx="68" cy="60" r="13"/><circle class="h" cx="68" cy="60" r="8.5"/>' +
        '<path class="l" d="M68 106H146"/>';
    },
    box(o) {
      return '<path class="t" d="M30 52L50 38H134L114 52Z"/>' +
        '<path class="s" d="M114 52L134 38V80L114 94Z"/>' +
        '<rect class="p" x="30" y="52" width="84" height="42"/>' +
        `<rect class="${o.band}" x="30" y="76" width="84" height="8"/>` +
        '<path class="sl" d="M66 45H98"/>' +
        '<path class="p" d="M70 45C70 36 78 30 80 21C84 28 94 33 95 45Z"/>';
    },
    pocket() {
      return '<g transform="rotate(-8 62 65)"><rect class="p" x="30" y="44" width="64" height="42" rx="5"/>' +
        '<path class="d" d="M36 65H88"/><rect class="b" x="38" y="50" width="22" height="10" rx="1.5"/></g>' +
        '<g transform="rotate(7 102 61)"><rect class="p" x="70" y="40" width="64" height="42" rx="5"/>' +
        '<path class="d" d="M76 61H128"/><rect class="bk" x="78" y="46" width="22" height="10" rx="1.5"/></g>';
    },
    kitchen() {
      return '<rect class="p" x="70" y="40" width="74" height="56"/><path class="d" d="M107 42V94"/>' +
        '<path class="p" d="M36 34V98A19 6.5 0 0 0 74 98V34Z"/>' +
        '<ellipse class="p" cx="55" cy="34" rx="19" ry="6.5"/>' +
        '<ellipse class="c" cx="55" cy="34" rx="7" ry="2.6"/><ellipse class="h" cx="55" cy="34" rx="4.2" ry="1.5"/>';
    },
    towel(o) {
      return '<path class="t" d="M28 44L40 34H136L124 44Z"/>' +
        '<path class="s" d="M124 44L136 34V84L124 94Z"/>' +
        '<rect class="p" x="28" y="44" width="96" height="50"/>' +
        '<path class="r" d="M28 54H124M28 64H124M28 74H124M28 84H124"/>' +
        `<rect class="${o.band}" x="62" y="44" width="28" height="50"/>` +
        `<path class="${o.band}" d="M62 44L74 34H102L90 44Z"/>`;
    },
    carton() {
      return '<path class="ks" d="M32 46L50 32H128L110 46Z"/>' +
        '<path class="ks" d="M110 46L128 32V82L110 96Z"/>' +
        '<rect class="k" x="32" y="46" width="78" height="50"/>' +
        '<path class="kt" d="M64 46L82 32H94L76 46Z"/><rect class="kt" x="64" y="46" width="12" height="14"/>' +
        '<rect class="p" x="42" y="66" width="46" height="22" rx="1"/><path class="l" d="M48 73H76M48 80H68"/>';
    },
    bag() {
      return '<rect class="f" x="40" y="38" width="84" height="56" rx="3"/>' +
        '<rect class="f" x="34" y="46" width="84" height="56" rx="3"/>' +
        '<path class="d" d="M34 66H118"/><rect class="bk" x="44" y="76" width="34" height="16" rx="2"/>';
    }
  };

  function art(kind, tone) {
    const draw = ART[kind] || ART.carton;
    return `<svg class="art" viewBox="0 0 160 120" aria-hidden="true" focusable="false">${draw({ band: tone === "kraft" ? "bk" : "b" })}</svg>`;
  }

  const catOf = (key) => CATS.find((c) => c.key === key);
  const countIn = (key) => PRODUCTS.filter((p) => p.category === key).length;
  const findProduct = (id) => PRODUCTS.find((p) => p.id === id);
  const toneOf = (p) => (/再生紙/.test(p.material || "") ? "kraft" : "ai");

  function mediaHTML(p) {
    if (p.image) return `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy">`;
    return art(p.art || (catOf(p.category) || {}).art, toneOf(p));
  }

  // 入数の表示。「48ロール」のように荷姿と1ケースの数量が同じときは繰り返さない
  const perCase = (p) => `${p.qty}${p.unit}`;
  const packForCard = (p) => (p.pack === perCase(p) ? "" : p.pack);
  const packForDetail = (p) => (p.pack.startsWith(perCase(p))
    ? `${p.pack}／ケース`
    : `${p.pack}（計${perCase(p)}／ケース）`);

  const ECO = /エコ|再生紙|グリーン/;
  const tagsHTML = (tags) => (tags || []).map((t) =>
    `<span class="tag${ECO.test(t) ? " tag-eco" : ""}">${esc(t)}</span>`
  ).join("");

  // 検索用：全角英数→半角、ひらがな→カタカナ、小文字にそろえる
  function normalize(text) {
    return String(text || "")
      .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
      .replace(/[ぁ-ゖ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) + 0x60))
      .replace(/[\s　]+/g, " ")
      .toLowerCase();
  }
  const haystack = new Map(PRODUCTS.map((p) => [p.id, normalize([
    p.id, p.name, p.spec, p.pack, p.material, p.description, (catOf(p.category) || {}).name
  ].concat(p.tags || [], p.uses || []).join(" "))]));

  // ---- トップページ：カテゴリ一覧 ----
  function renderTiles(el) {
    el.innerHTML = CATS.map((c) => `
      <li>
        <a class="cat-card" href="products.html#${c.key}">
          <span class="cat-art">${art(c.art, "ai")}</span>
          <span class="cat-text">
            <span class="cat-name">${esc(c.name)}</span>
            <span class="cat-lead">${esc(c.lead)}</span>
            <span class="cat-count">${countIn(c.key)}品を掲載</span>
          </span>
        </a>
      </li>`).join("");
  }

  // ---- 商品ページ：カタログ ----
  function cardHTML(p) {
    const cat = catOf(p.category) || {};
    const label = `<span class="visually-hidden">（${esc(p.name)}）</span>`;
    return `
    <li class="product-card">
      <div class="product-media">${mediaHTML(p)}<div class="product-tags">${tagsHTML((p.tags || []).slice(0, 3))}</div></div>
      <div class="case-label">
        <p class="case-id"><span>品番 ${esc(p.id)}</span><span>${esc(cat.short || cat.name || "")}</span></p>
        <h3 class="case-name">${esc(p.name)}</h3>
        <dl class="case-specs">
          <div><dt>規格</dt><dd>${esc(p.spec)}</dd></div>
          <div><dt>入数</dt><dd>${esc(packForCard(p))}<span class="case-qty"><span class="num">${esc(p.qty)}</span><span class="u">${esc(p.unit)}／ケース</span></span></dd></div>
        </dl>
        <div class="case-actions">
          <button type="button" class="btn btn-ghost" data-open="${esc(p.id)}" aria-haspopup="dialog">詳細を見る${label}</button>
          <a class="btn btn-primary" href="contact.html#${esc(p.id)}">問い合わせる${label}</a>
        </div>
      </div>
    </li>`;
  }

  function detailHTML(p) {
    const cat = catOf(p.category) || {};
    return `
    <div class="dialog-inner">
      <div class="dialog-media">${mediaHTML(p)}</div>
      <div class="dialog-body">
        <p class="case-id"><span>品番 ${esc(p.id)}</span><span>${esc(cat.name || "")}</span></p>
        <h2 id="dialog-title">${esc(p.name)}</h2>
        <div class="dialog-tags">${tagsHTML(p.tags)}</div>
        <p>${esc(p.description)}</p>
        <table class="spec-table"><tbody>
          <tr><th scope="row">規格</th><td>${esc(p.spec)}</td></tr>
          <tr><th scope="row">入数</th><td>${esc(packForDetail(p))}</td></tr>
          <tr><th scope="row">ケース寸法</th><td>${esc(p.caseSize)}</td></tr>
          <tr><th scope="row">原料・素材</th><td>${esc(p.material)}</td></tr>
          <tr><th scope="row">主な用途</th><td>${esc((p.uses || []).join("、"))}</td></tr>
        </tbody></table>
        <p class="dialog-note">価格と納期は、数量や配送の条件によって変わります。お気軽にお問い合わせください。</p>
        <div class="dialog-actions">
          <a class="btn btn-primary" href="contact.html#${esc(p.id)}">この商品を問い合わせる</a>
          <button type="button" class="btn btn-ghost" data-close>閉じる</button>
        </div>
      </div>
    </div>`;
  }

  function initCatalog(root) {
    const tabs = root.querySelector("[data-tabs]");
    const grid = root.querySelector("[data-grid]");
    const search = root.querySelector("#catalog-q");
    const useSelect = root.querySelector("#catalog-use");
    const count = root.querySelector("[data-count]");
    const empty = root.querySelector("[data-empty]");
    const reset = root.querySelector("[data-reset]");
    const dialog = document.getElementById("product-dialog");
    const state = { cat: "all", q: "", use: "" };

    tabs.innerHTML = [{ key: "all", name: "すべて", n: PRODUCTS.length }]
      .concat(CATS.map((c) => ({ key: c.key, name: c.name, n: countIn(c.key) })))
      .map((t) => `<button type="button" class="cat-tab" data-cat="${t.key}" aria-pressed="false">${esc(t.name)}<span class="count">${t.n}</span></button>`)
      .join("");
    useSelect.innerHTML = '<option value="">すべての用途</option>' +
      USES.map((u) => `<option value="${esc(u)}">${esc(u)}</option>`).join("");

    function matches(p) {
      if (state.cat !== "all" && p.category !== state.cat) return false;
      if (state.use && !(p.uses || []).includes(state.use)) return false;
      const hay = haystack.get(p.id);
      return normalize(state.q).split(" ").filter(Boolean).every((t) => hay.includes(t));
    }
    function apply() {
      const list = PRODUCTS.filter(matches);
      grid.innerHTML = list.map(cardHTML).join("");
      empty.hidden = list.length > 0;
      count.textContent = `${list.length}件を表示`;
      tabs.querySelectorAll("[data-cat]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.cat === state.cat)));
    }
    function setHash(value) {
      try {
        history.replaceState(null, "", value ? "#" + value : location.pathname + location.search);
      } catch (e) { /* 使えない環境では URL を変えずに続ける */ }
    }

    tabs.addEventListener("click", (e) => {
      const button = e.target.closest("[data-cat]");
      if (!button) return;
      state.cat = button.dataset.cat;
      setHash(state.cat === "all" ? "" : state.cat);
      apply();
    });
    search.addEventListener("input", () => { state.q = search.value; apply(); });
    useSelect.addEventListener("change", () => { state.use = useSelect.value; apply(); });
    if (reset) {
      reset.addEventListener("click", () => {
        Object.assign(state, { cat: "all", q: "", use: "" });
        search.value = "";
        useSelect.value = "";
        setHash("");
        apply();
      });
    }

    // ---- 詳細ダイアログ ----
    let opener = null;
    function openDetail(id, from) {
      const p = findProduct(id);
      if (!p || !dialog) return;
      dialog.querySelector("[data-dialog-body]").innerHTML = detailHTML(p);
      opener = from || null;
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    }
    function closeDetail() {
      if (typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
    }
    grid.addEventListener("click", (e) => {
      const button = e.target.closest("[data-open]");
      if (button) openDetail(button.dataset.open, button);
    });
    if (dialog) {
      dialog.addEventListener("click", (e) => {
        if (e.target === dialog || e.target.closest("[data-close]")) closeDetail();
      });
      dialog.addEventListener("close", () => { if (opener) opener.focus(); });
    }

    // URL の #toilet（カテゴリ）や #TP-S60-48（品番）に合わせて表示
    function fromHash() {
      const key = decodeURIComponent(location.hash.slice(1));
      const product = findProduct(key);
      if (catOf(key)) state.cat = key;
      else if (product) state.cat = product.category;
      apply();
      if (product) openDetail(product.id);
    }
    window.addEventListener("hashchange", fromHash);
    fromHash();
  }

  const tiles = document.getElementById("category-tiles");
  if (tiles) renderTiles(tiles);
  const catalog = document.getElementById("catalog");
  if (catalog) initCatalog(catalog);
})();
