// wlsmulti.com main JS

document.addEventListener('DOMContentLoaded', () => {
  let activeFilter = 'all';
  let activeSort = 'price-per-pill';

  // ── Helpers ──────────────────────────────────────────────────────────────

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

  function buildBadge(badge) {
    if (!badge) return '';
    return `<span class="badge">${badge}</span>`;
  }

  function buildCoupon(v) {
    if (!v.coupon) return '—';
    return `<button
      class="coupon-chip"
      aria-label="Copy coupon code ${v.coupon}"
      data-coupon="${v.coupon}"
    >${v.coupon}</button>`;
  }

  function buildFormIcon(form) {
    const icons = { capsule: '💊', chewable: '🍬', 'dissolving tablet': '💧' };
    return icons[form] || '';
  }

  function renderTable() {
    const container = document.getElementById('vitamin-table');
    if (!container) return;

    const data = getSorted(getFiltered());

    if (data.length === 0) {
      container.innerHTML = '<p class="no-results">No vitamins match this filter.</p>';
      return;
    }

    // Desktop table
    const tableHTML = `
      <table class="vitamin-table" aria-label="Bariatric vitamin comparison">
        <thead>
          <tr>
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
              <td class="name-cell">
                ${buildBadge(v.badge)}
                <span class="product-name">${v.name}</span>
                <span class="product-brand">${v.brand}</span>
              </td>
              <td class="hide-mobile">${buildFormIcon(v.form)} ${v.form}</td>
              <td class="hide-mobile center">${v.pillsPerDay}</td>
              <td class="hide-mobile center">${v.iron}</td>
              <td class="hide-mobile center">${v.b12}</td>
              <td class="center"><strong>${formatPPP(v)}</strong></td>
              <td class="hide-mobile center">${formatMonthly(v)}</td>
              <td>${buildCoupon(v)}</td>
              <td>
                <a
                  href="${v.url}"
                  target="_blank"
                  rel="noopener"
                  class="buy-btn"
                  aria-label="Buy ${v.name}"
                >Buy</a>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    // Mobile cards
    const cardsHTML = `
      <div class="vitamin-cards" aria-label="Bariatric vitamin comparison">
        ${data.map(v => `
          <div class="vitamin-card">
            <div class="card-header">
              ${buildBadge(v.badge)}
              <span class="product-name">${v.name}</span>
              <span class="product-brand">${v.brand}</span>
            </div>
            <dl class="card-details">
              <div class="card-row">
                <dt>Form</dt>
                <dd>${buildFormIcon(v.form)} ${v.form}</dd>
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
                <dd>${buildCoupon(v)}</dd>
              </div>` : ''}
            </dl>
            <a
              href="${v.url}"
              target="_blank"
              rel="noopener"
              class="buy-btn buy-btn--full"
              aria-label="Buy ${v.name}"
            >Buy →</a>
          </div>
        `).join('')}
      </div>
    `;

    container.innerHTML = tableHTML + cardsHTML;

    // Coupon click handlers
    container.querySelectorAll('.coupon-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        copyToClipboard(btn.dataset.coupon, btn);
      });
    });
  }

  // ── Init ──────────────────────────────────────────────────────────────────

  renderFilterBar();
  renderTable();
});
