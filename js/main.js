// wlsmulti.com main JS

document.addEventListener('DOMContentLoaded', () => {

  // ── Mobile hamburger menu ─────────────────────────────────────────────────

  const hamburger = document.querySelector('.nav-hamburger');
  const navLinks  = document.getElementById('nav-links');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('is-open');
      hamburger.setAttribute('aria-expanded', isOpen);
      hamburger.textContent = isOpen ? '✕' : '☰';
      hamburger.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
    });

    // Close menu when a nav link is clicked (mobile UX)
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('is-open');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.textContent = '☰';
        hamburger.setAttribute('aria-label', 'Open navigation menu');
      });
    });
  }

  // ── Shared helpers ────────────────────────────────────────────────────────

  function pricePerPill(v) {
    return v.price / v.pillCount;
  }

  function monthlyCost(v) {
    return pricePerPill(v) * v.pillsPerDay * 30;
  }

  function formatPPP(v) {
    return '$' + pricePerPill(v).toFixed(2) + '/pill';
  }

  function formatMonthly(v) {
    return '$' + Math.round(monthlyCost(v)) + '/mo';
  }

  function buildCouponChip(coupon) {
    if (!coupon) return '';
    return `<button
      class="coupon-chip"
      aria-label="Copy coupon code ${coupon}"
      data-coupon="${coupon}"
    >${coupon}</button>`;
  }

  // ── Clipboard ─────────────────────────────────────────────────────────────

  function copyToClipboard(text, btn) {
    const announce = document.getElementById('clipboard-announce');

    const doAnnounce = () => {
      btn.textContent = 'Copied!';
      btn.classList.add('copied');
      if (announce) announce.textContent = 'Copied to clipboard';
      setTimeout(() => {
        btn.textContent = text;
        btn.classList.remove('copied');
        if (announce) announce.textContent = '';
      }, 2000);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(doAnnounce).catch(() => fallbackCopy(text, doAnnounce));
    } else {
      fallbackCopy(text, doAnnounce);
    }
  }

  function fallbackCopy(text, cb) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    cb();
  }

  function bindCouponChips(container) {
    container.querySelectorAll('.coupon-chip').forEach(btn => {
      btn.addEventListener('click', () => copyToClipboard(btn.dataset.coupon, btn));
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // HOMEPAGE
  // ════════════════════════════════════════════════════════════════════════════

  // ── Top 3 cheapest ────────────────────────────────────────────────────────

  const top3Container = document.getElementById('top3-cards');
  if (top3Container && typeof vitamins !== 'undefined') {
    const sorted = [...vitamins]
      .filter(v => v.pillsPerDay === 1 && v.iron >= 45 && v.surgery.includes('bypass'))
      .sort((a, b) => pricePerPill(a) - pricePerPill(b));
    const top3 = sorted.slice(0, 3);

    top3Container.innerHTML = top3.map(v => `
      <div class="top3-card">
        <div class="top3-img">${buildProductImg(v, 80)}</div>
        <div class="top3-price">${formatPPP(v)}</div>
        <div class="top3-name">${v.name}</div>
        <div class="top3-brand">${v.brand}</div>
        <div class="top3-meta">${v.form} · ${v.pillsPerDay} per day · ${v.iron}mg iron</div>
        <div class="top3-footer">
          ${buildCouponChip(v.coupon)}
          <a href="/compare.html" class="top3-link">See full comparison →</a>
        </div>
      </div>
    `).join('');

    bindCouponChips(top3Container);
  }

  // ── FAQ accordion ─────────────────────────────────────────────────────────

  const faqList = document.getElementById('faq-list');
  if (faqList) {
    faqList.querySelectorAll('.faq-question').forEach(btn => {
      btn.addEventListener('click', () => {
        const isOpen = btn.getAttribute('aria-expanded') === 'true';

        // Close all
        faqList.querySelectorAll('.faq-question').forEach(other => {
          other.setAttribute('aria-expanded', 'false');
          const answer = other.nextElementSibling;
          if (answer) answer.hidden = true;
        });

        // If it was closed, open this one
        if (!isOpen) {
          btn.setAttribute('aria-expanded', 'true');
          const answer = btn.nextElementSibling;
          if (answer) answer.hidden = false;
        }
      });
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // COMPARE PAGE
  // ════════════════════════════════════════════════════════════════════════════

  let activeFilter = 'all';
  let activeSort = 'price-per-pill';

  function getFiltered() {
    return vitamins.filter(v =>
      activeFilter === 'all' || v.surgery.includes(activeFilter)
    );
  }

  function getSorted(list) {
    return [...list].sort((a, b) => {
      switch (activeSort) {
        case 'price-per-pill': return pricePerPill(a) - pricePerPill(b);
        case 'monthly-cost':   return monthlyCost(a) - monthlyCost(b);
        case 'iron':           return b.iron - a.iron;
        case 'b12':            return b.b12 - a.b12;
        default:               return 0;
      }
    });
  }

  // ── Filter bar ────────────────────────────────────────────────────────────

  function renderFilterBar() {
    const bar = document.getElementById('filter-bar');
    if (!bar) return;

    const filters = [
      { key: 'all',         label: 'All surgeries' },
      { key: 'bypass',      label: 'Gastric bypass' },
      { key: 'sleeve',      label: 'Gastric sleeve' },
      { key: 'mini-bypass', label: 'Mini bypass' },
    ];

    const sorts = [
      { key: 'price-per-pill', label: 'Price per pill' },
      { key: 'monthly-cost',   label: 'Monthly cost' },
      { key: 'iron',           label: 'Iron (mg)' },
      { key: 'b12',            label: 'B12 (mcg)' },
    ];

    const btnHTML = filters.map(f => `
      <button
        class="filter-btn${f.key === activeFilter ? ' active' : ''}"
        data-filter="${f.key}"
        aria-label="Filter by ${f.label}"
        aria-pressed="${f.key === activeFilter}"
      >${f.label}</button>
    `).join('');

    const optionsHTML = sorts.map(s =>
      `<option value="${s.key}"${s.key === activeSort ? ' selected' : ''}>${s.label}</option>`
    ).join('');

    bar.innerHTML = `
      <div class="filter-bar-inner">
        <div class="filter-pills" role="group" aria-label="Filter by surgery type">
          ${btnHTML}
        </div>
        <div class="sort-wrapper">
          <label for="sort-select" class="sort-label">Sort by:</label>
          <select id="sort-select" aria-label="Sort vitamins by">
            ${optionsHTML}
          </select>
        </div>
      </div>
    `;

    bar.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeFilter = btn.dataset.filter;
        renderFilterBar();
        renderTable();
      });
    });

    bar.querySelector('#sort-select').addEventListener('change', e => {
      activeSort = e.target.value;
      renderTable();
    });
  }

  // ── Table ─────────────────────────────────────────────────────────────────

  function buildProductImg(v, size) {
    const fallback = 'https://placehold.co/300x300/f0fdf4/0F6E56?text=Photo+coming';
    const src = v.image || fallback;
    return `<img
      src="${src}"
      alt="${v.name} bariatric multivitamin"
      width="${size}"
      height="${size}"
      loading="lazy"
      class="product-img"
      onerror="this.onerror=null;this.src='${fallback}'"
    >`;
  }

  function buildBadge(v) {
    // Sleeve-only warning overrides any existing badge when iron < 45 and not bypass
    if (v.iron < 45 && !v.surgery.includes('bypass')) {
      return '<span class="badge badge--sleeve">Sleeve only</span>';
    }
    if (!v.badge) return '';
    return `<span class="badge">${v.badge}</span>`;
  }

  function formatForm(form) {
    const labels = { capsule: 'Capsule', chewable: 'Chewable', 'dissolving tablet': 'Dissolving' };
    return labels[form] || form;
  }

  function buildBuyButtons(v, fullWidth) {
    const fullClass = fullWidth ? ' buy-btn--full' : '';
    return `
      <div class="buy-options${fullWidth ? ' buy-options--full' : ''}">
        <a
          href="${v.amazonUrl}"
          target="_blank"
          rel="noopener noreferrer"
          class="buy-btn${fullClass}"
          aria-label="Buy ${v.name} on Amazon"
        >Buy on Amazon</a>
        <a
          href="${v.url}"
          target="_blank"
          rel="noopener noreferrer"
          class="buy-direct"
          aria-label="Buy ${v.name} direct from brand"
        >Buy direct →</a>
      </div>
    `;
  }

  function renderTable() {
    const container = document.getElementById('vitamin-table');
    if (!container) return;

    const data = getSorted(getFiltered());

    if (data.length === 0) {
      container.innerHTML = '<p class="no-results">No vitamins match this filter.</p>';
      return;
    }

    const tableHTML = `
      <table class="vitamin-table" aria-label="Bariatric vitamin comparison">
        <thead>
          <tr>
            <th scope="col" class="col-photo hide-mobile" aria-label="Product photo"></th>
            <th scope="col">Product</th>
            <th scope="col" class="hide-mobile">Form</th>
            <th scope="col" class="hide-mobile">Pills/day</th>
            <th scope="col" class="hide-mobile">Iron (mg)</th>
            <th scope="col" class="hide-mobile">B12 (mcg)</th>
            <th scope="col">$/pill</th>
            <th scope="col" class="hide-mobile">Monthly</th>
            <th scope="col">Coupon</th>
            <th scope="col">Buy</th>
          </tr>
        </thead>
        <tbody>
          ${data.map((v, i) => `
            <tr class="${i % 2 === 1 ? 'alt-row' : ''}">
              <td class="col-photo hide-mobile">${buildProductImg(v, 56)}</td>
              <td class="name-cell">
                ${buildBadge(v)}
                <span class="product-name">${v.name}</span>
                <span class="product-brand">${v.brand}</span>
              </td>
              <td class="hide-mobile">${formatForm(v.form)}</td>
              <td class="hide-mobile center">${v.pillsPerDay}</td>
              <td class="hide-mobile center">${v.iron}</td>
              <td class="hide-mobile center">${v.b12}</td>
              <td class="ppp-cell">${formatPPP(v)}</td>
              <td class="hide-mobile center">${formatMonthly(v)}</td>
              <td>${v.coupon ? buildCouponChip(v.coupon) : '—'}</td>
              <td>${buildBuyButtons(v, false)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    const cardsHTML = `
      <div class="vitamin-cards" aria-label="Bariatric vitamin comparison">
        ${data.map(v => `
          <div class="vitamin-card">
            <div class="card-header">
              <div class="card-header-text">
                ${buildBadge(v)}
                <span class="product-name">${v.name}</span>
                <span class="product-brand">${v.brand}</span>
              </div>
              <div class="card-header-img">${buildProductImg(v, 72)}</div>
            </div>
            <dl class="card-details">
              <div class="card-row">
                <dt>Form</dt>
                <dd>${formatForm(v.form)}</dd>
              </div>
              <div class="card-row">
                <dt>Pills/day</dt>
                <dd>${v.pillsPerDay}</dd>
              </div>
              <div class="card-row">
                <dt>Iron</dt>
                <dd>${v.iron} mg</dd>
              </div>
              <div class="card-row">
                <dt>B12</dt>
                <dd>${v.b12} mcg</dd>
              </div>
              <div class="card-row highlight">
                <dt>Price/pill</dt>
                <dd><strong>${formatPPP(v)}</strong></dd>
              </div>
              <div class="card-row">
                <dt>Monthly</dt>
                <dd>${formatMonthly(v)}</dd>
              </div>
              ${v.coupon ? `
              <div class="card-row">
                <dt>Coupon</dt>
                <dd>${buildCouponChip(v.coupon)}</dd>
              </div>` : ''}
            </dl>
            ${buildBuyButtons(v, true)}
          </div>
        `).join('')}
      </div>
    `;

    container.innerHTML = tableHTML + cardsHTML;
    bindCouponChips(container);
  }

  // ── Init compare page ─────────────────────────────────────────────────────

  if (document.getElementById('filter-bar') && typeof vitamins !== 'undefined') {
    renderFilterBar();
    renderTable();
  }

});
