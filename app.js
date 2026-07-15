// app.js
// Ana uygulama mantığı, durum takibi ve sayfa render işlemlerini burada yönetir.
(() => {
  const state = { products: [], announcements: [], query: "", category: "Tümü", editingProductId: null, isAdminAuthenticated: false, adminError: "" };
  const app = document.querySelector("#app");
  const WHATSAPP_NUMBER = "905528832902";
  const STORAGE_KEY_PRODUCTS = "atakan-katalog-products";
  const STORAGE_KEY_ANNOUNCEMENTS = "atakan-katalog-announcements";
  const STORAGE_KEY_ADMIN_AUTH = "atakan-admin-auth";
  const ADMIN_USERNAME = "ATAKAN";
  const ADMIN_PASSWORD = "AtakaN1986ReklaM";
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

  function slugify(value) {
    return String(value)
      .toLocaleLowerCase("tr")
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      || "urun";
  }

  function normalizeProduct(product) {
    const safeProduct = product || {};
    return {
      id: safeProduct.id || slugify(safeProduct.name || "urun"),
      code: safeProduct.code || "",
      name: safeProduct.name || "",
      category: safeProduct.category || "",
      description: safeProduct.description || "",
      images: Array.isArray(safeProduct.images) && safeProduct.images.length ? safeProduct.images.filter(Boolean) : [""],
      features: Array.isArray(safeProduct.features) && safeProduct.features.length ? safeProduct.features.filter(Boolean) : [],
      whatsappMessage: safeProduct.whatsappMessage || ""
    };
  }

  function parseList(value) {
    return String(value)
      .split(",")
      .map(item => item.trim())
      .filter(Boolean);
  }

  function downloadJsonFile(fileName, data) {
    const payload = JSON.stringify(data, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function exportProductsJson() {
    downloadJsonFile("products.json", state.products);
  }

  function exportAnnouncementsJson() {
    downloadJsonFile("announcements.json", state.announcements);
  }

  function persistState() {
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(state.products));
    localStorage.setItem(STORAGE_KEY_ANNOUNCEMENTS, JSON.stringify(state.announcements));
  }

  function loadInitialProducts() {
    try {
      const storedProducts = localStorage.getItem(STORAGE_KEY_PRODUCTS);
      if (storedProducts) {
        state.products = JSON.parse(storedProducts).map(normalizeProduct);
        return;
      }
    } catch (error) {
      console.error("Kaydedilmiş ürünler okunamadı.", error);
    }

    state.products = fallbackProducts.map(normalizeProduct);
    persistState();
  }

  function loadInitialAnnouncements() {
    try {
      const storedAnnouncements = localStorage.getItem(STORAGE_KEY_ANNOUNCEMENTS);
      if (storedAnnouncements) {
        state.announcements = JSON.parse(storedAnnouncements);
      }
    } catch (error) {
      console.error("Kaydedilmiş duyurular okunamadı.", error);
    }
  }

  function loadAdminSession() {
    try {
      state.isAdminAuthenticated = sessionStorage.getItem(STORAGE_KEY_ADMIN_AUTH) === "true";
    } catch (error) {
      console.error("Admin oturumu okunamadı.", error);
    }
  }

  function saveAdminSession(value) {
    try {
      sessionStorage.setItem(STORAGE_KEY_ADMIN_AUTH, value ? "true" : "false");
    } catch (error) {
      console.error("Admin oturumu kaydedilemedi.", error);
    }
  }

  function normalizeWhatsAppNumber(number) {
    const raw = String(number).replace(/\D/g, "");
    if (!raw) return "";
    if (raw.startsWith("90")) return raw;
    if (raw.startsWith("0")) return `90${raw.slice(1)}`;
    return raw;
  }

  function buildWhatsAppUrl(message) {
    const normalized = normalizeWhatsAppNumber(WHATSAPP_NUMBER);
    const whatsappNumber = normalized ? `+${normalized}` : "";
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  }

  function getCategories() {
    return ["Tümü", ...new Set(state.products.map(product => product.category).filter(Boolean))];
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

  function renderAnnouncements() {
    if (!state.announcements.length) return "";
    return `
      <div class="announcement-stack">
        ${state.announcements.slice(0, 2).map(announcement => `
          <div class="announcement-card">
            <strong>${escapeHtml(announcement.title || "Duyuru")}</strong>
            <p>${escapeHtml(announcement.message || "")}</p>
          </div>
        `).join("")}
      </div>
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
          ${renderAnnouncements()}
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

  function renderAdminLogin() {
    app.innerHTML = `
      <section class="admin-page">
        <div class="container">
          <div class="login-card">
            <p class="eyebrow">Admin Girişi</p>
            <h1>Yönetim paneline erişin</h1>
            <p class="login-copy">Ürün ve duyuru yönetimi için kullanıcı adı ve şifre girin.</p>
            <form id="admin-login-form" class="admin-form">
              <label class="form-group">
                <span>Kullanıcı adı</span>
                <input name="username" type="text" required />
              </label>
              <label class="form-group">
                <span>Şifre</span>
                <input name="password" type="password" required />
              </label>
              ${state.adminError ? `<p class="login-error">${escapeHtml(state.adminError)}</p>` : ""}
              <div class="form-actions">
                <button class="button button-primary" type="submit">Giriş yap</button>
                <button class="button button-secondary" id="back-to-catalog-login" type="button">Kataloğa dön</button>
              </div>
            </form>
          </div>
        </div>
      </section>
    `;

    document.querySelector("#admin-login-form").addEventListener("submit", event => {
      event.preventDefault();
      const form = event.currentTarget;
      const username = form.username.value.trim();
      const password = form.password.value.trim();

      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        state.isAdminAuthenticated = true;
        state.adminError = "";
        saveAdminSession(true);
        renderAdmin();
      } else {
        state.adminError = "Kullanıcı adı veya şifre hatalı.";
        renderAdminLogin();
      }
    });

    document.querySelector("#back-to-catalog-login").addEventListener("click", () => {
      location.hash = "/";
    });
  }

  function renderAdmin() {
    const editingProduct = state.products.find(product => product.id === state.editingProductId) || null;
    const productFormData = editingProduct || { id: "", code: "", name: "", category: "", description: "", images: [""], features: [], whatsappMessage: "" };

    app.innerHTML = `
      <section class="admin-page">
        <div class="container">
          <div class="admin-top">
            <div>
              <p class="eyebrow">Admin Paneli</p>
              <h1>Ürün ve duyuru yönetimi</h1>
            </div>
            <div class="admin-actions-row">
              <button class="button button-secondary" id="back-to-catalog-admin" type="button">Kataloğa dön</button>
              <button class="button button-secondary" id="export-products-json" type="button">products.json indir</button>
              <button class="button button-secondary" id="export-announcements-json" type="button">duyurular.json indir</button>
              <button class="button button-secondary" id="logout-admin" type="button">Çıkış yap</button>
            </div>
          </div>

          <div class="admin-grid">
            <section class="admin-card">
              <h2>${editingProduct ? "Ürünü düzenle" : "Yeni ürün ekle"}</h2>
              <form id="product-form" class="admin-form">
                <input type="hidden" name="id" value="${escapeHtml(productFormData.id)}" />
                <label class="form-group">
                  <span>Ürün adı</span>
                  <input name="name" type="text" required value="${escapeHtml(productFormData.name)}" />
                </label>
                <label class="form-group">
                  <span>Ürün kodu</span>
                  <input name="code" type="text" value="${escapeHtml(productFormData.code)}" />
                </label>
                <label class="form-group">
                  <span>Kategori</span>
                  <input name="category" type="text" value="${escapeHtml(productFormData.category)}" />
                </label>
                <label class="form-group">
                  <span>Açıklama</span>
                  <textarea name="description">${escapeHtml(productFormData.description)}</textarea>
                </label>
                <label class="form-group">
                  <span>Görsel linkleri (virgülle ayırın)</span>
                  <input name="images" type="text" value="${escapeHtml((productFormData.images || []).join(", "))}" />
                </label>
                <label class="form-group">
                  <span>Özellikler (virgülle ayırın)</span>
                  <input name="features" type="text" value="${escapeHtml((productFormData.features || []).join(", "))}" />
                </label>
                <label class="form-group">
                  <span>WhatsApp mesajı</span>
                  <input name="whatsappMessage" type="text" value="${escapeHtml(productFormData.whatsappMessage)}" />
                </label>
                <div class="form-actions">
                  <button class="button button-primary" type="submit">${editingProduct ? "Kaydet" : "Ekle"}</button>
                  ${editingProduct ? '<button class="button button-secondary" id="cancel-edit" type="button">İptal</button>' : ""}
                </div>
              </form>
            </section>

            <section class="admin-card">
              <h2>Yeni duyuru ekle</h2>
              <form id="announcement-form" class="admin-form">
                <label class="form-group">
                  <span>Duyuru başlığı</span>
                  <input name="title" type="text" required />
                </label>
                <label class="form-group">
                  <span>Duyuru metni</span>
                  <textarea name="message" required></textarea>
                </label>
                <div class="form-actions">
                  <button class="button button-primary" type="submit">Duyuru yayınla</button>
                </div>
              </form>
            </section>
          </div>

          <section class="admin-card">
            <h2>Ürün listesi</h2>
            <div class="admin-list">
              ${state.products.length ? state.products.map(product => `
                <article class="admin-item">
                  <div>
                    <strong>${escapeHtml(product.name)}</strong>
                    <p>${escapeHtml(product.category || "Kategori yok")}</p>
                  </div>
                  <div class="admin-actions">
                    <button class="button button-secondary" type="button" data-edit-product="${escapeHtml(product.id)}">Düzenle</button>
                    <button class="button button-secondary" type="button" data-delete-product="${escapeHtml(product.id)}">Sil</button>
                  </div>
                </article>
              `).join("") : '<p class="empty-state-inline">Henüz ürün yok.</p>'}
            </div>
          </section>

          <section class="admin-card">
            <h2>Duyuru listesi</h2>
            <div class="admin-list">
              ${state.announcements.length ? state.announcements.map(announcement => `
                <article class="admin-item">
                  <div>
                    <strong>${escapeHtml(announcement.title)}</strong>
                    <p>${escapeHtml(announcement.message)}</p>
                  </div>
                  <div class="admin-actions">
                    <button class="button button-secondary" type="button" data-delete-announcement="${escapeHtml(announcement.id)}">Sil</button>
                  </div>
                </article>
              `).join("") : '<p class="empty-state-inline">Henüz duyuru yok.</p>'}
            </div>
          </section>
        </div>
      </section>
    `;

    document.querySelector("#back-to-catalog-admin").addEventListener("click", () => {
      location.hash = "/";
    });

    document.querySelector("#export-products-json").addEventListener("click", () => exportProductsJson());
    document.querySelector("#export-announcements-json").addEventListener("click", () => exportAnnouncementsJson());

    document.querySelector("#logout-admin").addEventListener("click", () => {
      state.isAdminAuthenticated = false;
      state.adminError = "";
      saveAdminSession(false);
      location.hash = "/admin";
    });

    document.querySelector("#product-form").addEventListener("submit", event => {
      event.preventDefault();
      const form = event.currentTarget;
      const name = form.name.value.trim();
      if (!name) return;

      const product = normalizeProduct({
        id: form.id.value.trim() || slugify(name),
        code: form.code.value.trim(),
        name,
        category: form.category.value.trim(),
        description: form.description.value.trim(),
        images: parseList(form.images.value),
        features: parseList(form.features.value),
        whatsappMessage: form.whatsappMessage.value.trim()
      });

      if (state.editingProductId) {
        state.products = state.products.map(item => item.id === state.editingProductId ? product : item);
      } else {
        state.products.unshift(product);
      }

      state.editingProductId = null;
      persistState();
      renderAdmin();
    });

    document.querySelector("#announcement-form").addEventListener("submit", event => {
      event.preventDefault();
      const form = event.currentTarget;
      const title = form.title.value.trim();
      const message = form.message.value.trim();
      if (!title || !message) return;

      state.announcements.unshift({
        id: `announcement-${Date.now()}`,
        title,
        message
      });
      persistState();
      form.reset();
      renderAdmin();
    });

    const cancelButton = document.querySelector("#cancel-edit");
    if (cancelButton) {
      cancelButton.addEventListener("click", () => {
        state.editingProductId = null;
        renderAdmin();
      });
    }

    document.querySelectorAll("[data-edit-product]").forEach(button => {
      button.addEventListener("click", () => {
        state.editingProductId = button.dataset.editProduct;
        renderAdmin();
      });
    });

    document.querySelectorAll("[data-delete-product]").forEach(button => {
      button.addEventListener("click", () => {
        const id = button.dataset.deleteProduct;
        if (confirm("Bu ürünü silmek istediğinize emin misiniz?")) {
          state.products = state.products.filter(product => product.id !== id);
          persistState();
          renderAdmin();
        }
      });
    });

    document.querySelectorAll("[data-delete-announcement]").forEach(button => {
      button.addEventListener("click", () => {
        const id = button.dataset.deleteAnnouncement;
        if (confirm("Bu duyuruyu silmek istediğinize emin misiniz?")) {
          state.announcements = state.announcements.filter(announcement => announcement.id !== id);
          persistState();
          renderAdmin();
        }
      });
    });
  }

  function renderApp() {
    const product = getProductFromHash();

    if (location.hash.startsWith("#/urun/") && !product) {
      location.hash = "/";
      return;
    }

    if (location.hash === "#/admin") {
      if (!state.isAdminAuthenticated) {
        renderAdminLogin();
      } else {
        renderAdmin();
      }
    } else if (product) {
      renderDetail(product);
    } else {
      renderCatalog();
    }

    app.focus();
  }

  async function init() {
    loadInitialProducts();
    loadInitialAnnouncements();
    loadAdminSession();

    if (!state.products.length) {
      try {
        const response = await fetch("products.json", { cache: "no-store" });
        if (!response.ok) throw new Error("Ürün verisi alınamadı.");
        state.products = (await response.json()).map(normalizeProduct);
        persistState();
      } catch (error) {
        app.innerHTML = `
          <section class="loading-screen">
            <div class="loader" aria-hidden="true"></div>
            <p>Katalog yüklenemedi. Lütfen sayfayı yenileyin.</p>
          </section>
        `;
        console.error(error);
        return;
      }
    }

    renderApp();
    window.addEventListener("hashchange", renderApp);
  }

  init();
})();
