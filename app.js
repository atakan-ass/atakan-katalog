// app.js
// Ana uygulama mantığı, durum takibi ve sayfa render işlemlerini burada yönetir.
(() => {
  const state = { products: [], query: "", category: "Tümü" };
  const app = document.querySelector("#app");
  const WHATSAPP_NUMBER = "05528832902";
  const fallbackProducts = (() => {
    const source = document.querySelector("#products-data");
    if (!source) return [];
    try {
      return JSON.parse(source.textContent);
    } catch (error) {
      console.error("Yedek ürün verisi okunamadı.", error);
      return [];
    }
  })();

  const icons = {
    search: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>',
    arrow: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    back: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M19 12H5m6 6-6-6 6-6"/></svg>',
    check: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>',
    whatsapp: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20.5 11.8a8.4 8.4 0 0 1-12.4 7.4L3.5 20.5l1.3-4.4A8.4 8.4 0 1 1 20.5 11.8Z"/><path d="M8.3 7.9c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.7 1.7c.1.3.1.5-.1.7l-.5.6c.6 1.2 1.5 2 2.7 2.7l.6-.5c.2-.2.4-.2.7-.1l1.7.7c.3.1.4.3.4.5v.5c0 .3 0 .5-.4.7-.4.2-1.1.4-1.8.2-1.1-.3-2.7-1.2-4-2.5-1.3-1.3-2.2-2.9-2.5-4-.2-.7 0-1.4.2-1.8Z"/></svg>'
  };

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function normalizeWhatsAppNumber(number) {
    const raw = String(number).replace(/\D/g, "");
    if (!raw) return "";
    if (raw.startsWith("90")) return raw;
    if (raw.startsWith("0")) return `9${raw.slice(1)}`;
    return raw;
  }

  function buildWhatsAppUrl(message) {
    const normalized = normalizeWhatsAppNumber(WHATSAPP_NUMBER);
    return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
  }

  function getCategories() {
    return ["Tümü", ...new Set(state.products.map(product => product.category))];
  }

  function getVisibleProducts() {
    const term = state.query.trim().toLocaleLowerCase("tr");
    return state.products.filter(product => {
      const matchesCategory = state.category === "Tümü" || product.category === state.category;
      const haystack = [product.name, product.code, product.category, product.description].join(" ").toLocaleLowerCase("tr");
      const matchesSearch = !term || haystack.includes(term);
      return matchesCategory && matchesSearch;
    });
  }

  function getProductFromHash() {
    const match = location.hash.match(/^#\/urun\/([^/]+)$/);
    return match ? state.products.find(product => product.id === decodeURIComponent(match[1])) : null;
  }

  function createMessage(product) {
    return [
      "Merhaba Atakan Reklam.",
      "",
      "Katalogdan aşağıdaki ürünü seçtim.",
      "",
      "Ürün:",
      product.name,
      "",
      "Ürün Kodu:",
      product.code,
      "",
      "Bilgi alabilir miyim?"
    ].join("\n");
  }

  function openWhatsApp(product, isSelection = false) {
    const message = isSelection ? createMessage(product) : product.whatsappMessage;
    window.open(buildWhatsAppUrl(message), "_blank", "noopener,noreferrer");
  }

  function productCard(product) {
    return `
      <article class="product-card">
        <img class="product-image" src="${escapeHtml(product.images[0])}" alt="${escapeHtml(product.name)}" loading="lazy" />
        <div class="product-content">
          <span class="category-tag">${escapeHtml(product.category)}</span>
          <h3>${escapeHtml(product.name)}</h3>
          <p>${escapeHtml(product.description)}</p>
          <button class="text-button" type="button" data-product-id="${escapeHtml(product.id)}" aria-label="${escapeHtml(product.name)} ürününü incele">
            İncele <span>${icons.arrow}</span>
          </button>
        </div>
      </article>
    `;
  }

  function renderCatalog() {
    const visibleProducts = getVisibleProducts();
    app.innerHTML = `
      <section class="hero">
        <div class="container">
          <p class="eyebrow">Dijital Ürün Kataloğu</p>
          <h1>Markanızı güçlü bir deneyimle öne çıkarın.</h1>
          <p class="hero-copy">Promosyon, matbaa, tabela ve tekstil ürünlerini keşfedin. Seçtiğiniz ürünü doğrudan WhatsApp üzerinden bize iletin.</p>
        </div>
      </section>

      <section class="catalog">
        <div class="container">
          <div class="catalog-toolbar">
            <label class="search-wrap" for="search-input">
              <span class="search-icon">${icons.search}</span>
              <input id="search-input" class="search-input" type="search" autocomplete="off" placeholder="Ürün, kod veya kategori ara" value="${escapeHtml(state.query)}" aria-label="Ürün ara" />
            </label>

            <div class="filter-row" role="group" aria-label="Ürün kategorileri">
              ${getCategories().map(category => `<button class="filter ${category === state.category ? "active" : ""}" data-category="${escapeHtml(category)}" type="button">${escapeHtml(category)}</button>`).join("")}
            </div>
          </div>

          <div class="catalog-heading">
            <h2>Ürünler</h2>
            <span class="result-count">${visibleProducts.length} ürün bulundu</span>
          </div>

          <div class="product-grid">
            ${visibleProducts.length ? visibleProducts.map(productCard).join("") : `
              <div class="empty-state">
                <h2>Sonuç bulunamadı</h2>
                <p>Arama terimini değiştirin veya farklı bir kategori seçin.</p>
              </div>
            `}
          </div>
        </div>
      </section>
    `;

    const searchInput = document.querySelector("#search-input");
    if (searchInput) {
      searchInput.addEventListener("input", event => {
        state.query = event.target.value;
        renderCatalog();
        searchInput.focus();
      });
    }

    document.querySelectorAll("[data-category]").forEach(button => {
      button.addEventListener("click", () => {
        state.category = button.dataset.category;
        renderCatalog();
      });
    });

    document.querySelectorAll("[data-product-id]").forEach(button => {
      button.addEventListener("click", () => {
        location.hash = `/urun/${encodeURIComponent(button.dataset.productId)}`;
      });
    });
  }

  function renderDetail(product) {
    const featuresMarkup = product.features.map(feature => `<li><span class="check">${icons.check}</span>${escapeHtml(feature)}</li>`).join("");

    app.innerHTML = `
      <section class="detail-page">
        <div class="container">
          <button class="back-button" id="back-to-catalog" type="button">${icons.back} Kataloğa dön</button>

          <div class="detail-layout">
            <div>
              <img id="main-product-image" class="main-image" src="${escapeHtml(product.images[0])}" alt="${escapeHtml(product.name)}" />
              <div class="thumbnail-row" aria-label="Ürün görselleri">
                ${product.images.map((image, index) => `
                  <button class="thumbnail ${index === 0 ? "active" : ""}" type="button" data-image="${escapeHtml(image)}" aria-label="${index + 1}. ürün görselini göster">
                    <img src="${escapeHtml(image)}" alt="" loading="lazy" />
                  </button>
                `).join("")}
              </div>
            </div>

            <div>
              <p class="detail-category">${escapeHtml(product.category)}</p>
              <h1 class="detail-title">${escapeHtml(product.name)}</h1>
              <p class="product-code">Ürün kodu: <strong>${escapeHtml(product.code)}</strong></p>
              <p class="detail-description">${escapeHtml(product.description)}</p>

              <section class="feature-section">
                <h2>Teknik özellikler</h2>
                <ul class="feature-list">${featuresMarkup}</ul>
              </section>

              <div class="action-buttons">
                <button class="button button-primary" id="select-product" type="button">${icons.whatsapp} Bu Ürünü Seç</button>
                <button class="button button-secondary" id="ask-whatsapp" type="button">WhatsApp Sor</button>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;

    document.querySelector("#back-to-catalog").addEventListener("click", () => {
      location.hash = "/";
    });

    document.querySelectorAll("[data-image]").forEach(button => {
      button.addEventListener("click", () => {
        const mainImage = document.querySelector("#main-product-image");
        if (!mainImage) return;
        mainImage.src = button.dataset.image;
        document.querySelectorAll(".thumbnail").forEach(item => item.classList.toggle("active", item === button));
      });
    });

    document.querySelector("#select-product").addEventListener("click", () => openWhatsApp(product, true));
    document.querySelector("#ask-whatsapp").addEventListener("click", () => openWhatsApp(product));
  }

  function renderApp() {
    const product = getProductFromHash();

    if (location.hash.startsWith("#/urun/") && !product) {
      location.hash = "/";
      return;
    }

    if (product) {
      renderDetail(product);
    } else {
      renderCatalog();
    }

    app.focus();
  }

  async function init() {
    try {
      const response = await fetch("products.json", { cache: "no-store" });
      if (!response.ok) throw new Error("Ürün verisi alınamadı.");

      state.products = await response.json();
      renderApp();
      window.addEventListener("hashchange", renderApp);
    } catch (error) {
      if (fallbackProducts.length) {
        state.products = fallbackProducts;
        renderApp();
        window.addEventListener("hashchange", renderApp);
        return;
      }

      app.innerHTML = `
        <section class="loading-screen">
          <div class="loader" aria-hidden="true"></div>
          <p>Katalog yüklenemedi. Lütfen sayfayı yenileyin.</p>
        </section>
      `;
      console.error(error);
    }
  }

  init();
})();
