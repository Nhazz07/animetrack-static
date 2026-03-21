/* ============================================================
   AnimeTrack — app.js (External JavaScript File)
   Uses: Jikan API (free, no key needed) + localStorage
   ============================================================ */

const JIKAN = 'https://api.jikan.moe/v4';

/* ── STORAGE HELPERS ── */
const Store = {
  get: (k)    => JSON.parse(localStorage.getItem(k) || '[]'),
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
  has: (k, id) => Store.get(k).some(i => i.mal_id === id),
  add: (k, item) => { const a = Store.get(k); if (!Store.has(k, item.mal_id)) { a.push(item); Store.set(k, a); } },
  remove: (k, id) => Store.set(k, Store.get(k).filter(i => i.mal_id !== id)),
  toggle: (k, item) => {
    if (Store.has(k, item.mal_id)) { Store.remove(k, item.mal_id); return false; }
    else { Store.add(k, item); return true; }
  }
};

/* ── TOAST ── */
const Toast = {
  init() {
    if (!document.getElementById('toast-wrap')) {
      const d = document.createElement('div');
      d.id = 'toast-wrap'; d.className = 'toast-container';
      document.body.appendChild(d);
    }
  },
  show(msg, type = 'default') {
    const icons = { success: '✓', error: '✕', warning: '⚠', default: 'ℹ' };
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<span>${icons[type]||'ℹ'}</span><span class="toast-msg">${msg}</span>`;
    document.getElementById('toast-wrap').appendChild(t);
    setTimeout(() => { t.style.animation = 'toastOut 0.3s ease forwards'; setTimeout(() => t.remove(), 300); }, 3000);
  },
  success: msg => Toast.show(msg, 'success'),
  warning: msg => Toast.show(msg, 'warning'),
  error:   msg => Toast.show(msg, 'error'),
};

/* ── JIKAN API ── */
const API = {
  async get(path) {
    try {
      const r = await fetch(JIKAN + path);
      if (!r.ok) throw new Error('API error');
      return await r.json();
    } catch (e) { console.error('API:', e); return null; }
  },
  top:     (page=1)  => API.get(`/top/anime?page=${page}&limit=20`),
  search:  (q, page=1) => API.get(`/anime?q=${encodeURIComponent(q)}&page=${page}&limit=20&sfw=true`),
  byId:    (id)      => API.get(`/anime/${id}/full`),
  season:  ()        => API.get('/seasons/now?limit=12'),
  genre:   (id,p=1)  => API.get(`/anime?genres=${id}&page=${p}&limit=20&order_by=score&sort=desc`),
  random:  ()        => API.get('/random/anime'),
};

/* ── CARD RENDERER ── */
function renderCard(anime) {
  const isFav  = Store.has('favorites', anime.mal_id);
  const isWatch= Store.has('watchlist', anime.mal_id);
  const score  = anime.score ? `★ ${anime.score}` : '? ';
  const genres = (anime.genres || []).slice(0, 2).map(g => g.name).join(', ') || 'Anime';
  const img    = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || 'images/placeholder.svg';

  const card = document.createElement('div');
  card.className = 'anime-card';
  card.dataset.id = anime.mal_id;
  card.innerHTML = `
    <div class="card-poster">
      <img src="${img}" alt="${anime.title}" loading="lazy" />
      <div class="card-score">${score}</div>
      ${anime.airing ? '<div class="card-badge">AIRING</div>' : ''}
      <div class="card-overlay">
        <button class="btn btn-gold btn-sm fav-btn" data-id="${anime.mal_id}" title="Favorite">
          ${isFav ? '★' : '☆'}
        </button>
        <button class="btn btn-primary btn-sm watch-btn" data-id="${anime.mal_id}" title="Watchlist">
          ${isWatch ? '✓' : '+'}
        </button>
        <button class="btn btn-outline btn-sm info-btn" data-id="${anime.mal_id}" title="Details">ℹ</button>
      </div>
    </div>
    <div class="card-body">
      <div class="card-title" title="${anime.title}">${anime.title}</div>
      <div class="card-meta"><span class="card-genre">${genres}</span></div>
    </div>
  `;

  // Card click → detail modal
  card.querySelector('.info-btn').addEventListener('click', e => { e.stopPropagation(); openModal(anime.mal_id, anime); });
  card.addEventListener('click', () => openModal(anime.mal_id, anime));

  // Favorite button
  card.querySelector('.fav-btn').addEventListener('click', e => {
    e.stopPropagation();
    const btn = e.currentTarget;
    const added = Store.toggle('favorites', anime);
    btn.textContent = added ? '★' : '☆';
    btn.classList.toggle('btn-gold', added);
    Toast[added ? 'success' : 'warning'](added ? `Added "${anime.title}" to favorites!` : `Removed from favorites.`);
  });

  // Watchlist button
  card.querySelector('.watch-btn').addEventListener('click', e => {
    e.stopPropagation();
    const btn = e.currentTarget;
    const added = Store.toggle('watchlist', anime);
    btn.textContent = added ? '✓' : '+';
    btn.classList.toggle('btn-primary', added);
    Toast[added ? 'success' : 'warning'](added ? `Added "${anime.title}" to watchlist!` : `Removed from watchlist.`);
  });

  return card;
}

/* ── SKELETON CARDS ── */
function renderSkeletons(container, count = 10) {
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    container.innerHTML += `
      <div class="skeleton-card">
        <div class="skeleton skeleton-poster"></div>
        <div class="skeleton-body">
          <div class="skeleton skeleton-line" style="width:85%"></div>
          <div class="skeleton skeleton-line short"></div>
        </div>
      </div>`;
  }
}

/* ── MODAL ── */
let modalBackdrop, modalEl;

function initModal() {
  modalBackdrop = document.createElement('div');
  modalBackdrop.className = 'modal-backdrop';
  modalBackdrop.id = 'anime-modal';
  modalBackdrop.innerHTML = `<div class="modal" id="modal-inner"></div>`;
  document.body.appendChild(modalBackdrop);
  modalEl = document.getElementById('modal-inner');
  modalBackdrop.addEventListener('click', e => { if (e.target === modalBackdrop) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}

function closeModal() {
  modalBackdrop.classList.remove('open');
  document.body.style.overflow = '';
}

async function openModal(id, basicData) {
  modalBackdrop.classList.add('open');
  document.body.style.overflow = 'hidden';

  const img = basicData?.images?.jpg?.large_image_url || 'images/placeholder.svg';
  // Show quick skeleton while fetching full data
  modalEl.innerHTML = `
    <div class="modal-hero">
      <div class="modal-hero-bg" style="background-image:url('${img}')"></div>
      <div class="modal-hero-overlay"></div>
      <button class="modal-close-btn" onclick="closeModal()">✕</button>
      <div class="modal-hero-content">
        <div class="modal-poster"><img src="${img}" alt="" /></div>
        <div class="modal-info">
          <div class="modal-title">${basicData?.title || 'Loading...'}</div>
          <div class="modal-meta"><span class="modal-score">${basicData?.score || '?'}</span></div>
        </div>
      </div>
    </div>
    <div class="modal-body"><div class="spinner-wrap"><div class="spinner"></div></div></div>`;

  const data = await API.byId(id);
  if (!data?.data) return;
  const a = data.data;

  const isFav   = Store.has('favorites', a.mal_id);
  const isWatch = Store.has('watchlist', a.mal_id);
  const genres  = (a.genres || []).map(g => `<span class="genre-tag">${g.name}</span>`).join('');
  const trailer = a.trailer?.embed_url ? `
    <div style="margin-top:1.25rem;">
      <div style="font-size:0.8rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:0.6rem;">Trailer</div>
      <iframe src="${a.trailer.embed_url}" width="100%" height="200" frameborder="0" allowfullscreen style="border-radius:var(--r);"></iframe>
    </div>` : '';

  modalEl.innerHTML = `
    <div class="modal-hero">
      <div class="modal-hero-bg" style="background-image:url('${a.images?.jpg?.large_image_url || img}')"></div>
      <div class="modal-hero-overlay"></div>
      <button class="modal-close-btn" onclick="closeModal()">✕</button>
      <div class="modal-hero-content">
        <div class="modal-poster"><img src="${a.images?.jpg?.large_image_url || img}" alt="${a.title}" /></div>
        <div class="modal-info">
          <div class="modal-title">${a.title}</div>
          <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:0.5rem;">${a.title_english && a.title_english !== a.title ? a.title_english : ''}</div>
          <div class="modal-meta">
            <span class="modal-score">★ ${a.score || 'N/A'}</span>
            <span class="modal-meta-item">📺 ${a.type || 'TV'}</span>
            <span class="modal-meta-item">📅 ${a.year || 'N/A'}</span>
            <span class="modal-meta-item">${a.episodes ? a.episodes + ' eps' : 'Ongoing'}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-body">
      <div style="margin-bottom:1rem;">${genres}</div>
      <p class="modal-synopsis">${a.synopsis || 'No synopsis available.'}</p>
      <div class="modal-actions">
        <button class="btn btn-gold modal-fav-btn">${isFav ? '★ Favorited' : '☆ Add to Favorites'}</button>
        <button class="btn btn-primary modal-watch-btn">${isWatch ? '✓ In Watchlist' : '+ Add to Watchlist'}</button>
        <a href="${a.url}" target="_blank" class="btn btn-outline btn-sm">View on MAL ↗</a>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.75rem;margin-top:1rem;">
        <div style="background:var(--bg-deep);border-radius:var(--r);padding:0.75rem;text-align:center;">
          <div style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--gold);">${a.score || '?'}</div>
          <div style="font-size:0.72rem;color:var(--text-muted);text-transform:uppercase;">Score</div>
        </div>
        <div style="background:var(--bg-deep);border-radius:var(--r);padding:0.75rem;text-align:center;">
          <div style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--red);">#${a.rank || '?'}</div>
          <div style="font-size:0.72rem;color:var(--text-muted);text-transform:uppercase;">Rank</div>
        </div>
        <div style="background:var(--bg-deep);border-radius:var(--r);padding:0.75rem;text-align:center;">
          <div style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--cyan);">${a.members ? (a.members/1000).toFixed(0)+'K' : '?'}</div>
          <div style="font-size:0.72rem;color:var(--text-muted);text-transform:uppercase;">Members</div>
        </div>
      </div>
      ${trailer}
    </div>`;

  // Favorite button in modal
  modalEl.querySelector('.modal-fav-btn').addEventListener('click', function() {
    const added = Store.toggle('favorites', a);
    this.textContent = added ? '★ Favorited' : '☆ Add to Favorites';
    this.classList.toggle('btn-gold', added);
    Toast[added ? 'success' : 'warning'](added ? 'Added to favorites!' : 'Removed from favorites.');
  });

  // Watchlist button in modal
  modalEl.querySelector('.modal-watch-btn').addEventListener('click', function() {
    const added = Store.toggle('watchlist', a);
    this.textContent = added ? '✓ In Watchlist' : '+ Add to Watchlist';
    Toast[added ? 'success' : 'warning'](added ? 'Added to watchlist!' : 'Removed from watchlist.');
  });
}

/* ── LIVE SEARCH ── */
let searchTimer;
function initNavSearch() {
  const input = document.getElementById('nav-search-input');
  const dropdown = document.getElementById('search-dropdown');
  if (!input || !dropdown) return;

  const wrap = input.closest('.nav-search');
  if (wrap) wrap.style.position = 'relative';

  input.addEventListener('input', () => {
    clearTimeout(searchTimer);
    const q = input.value.trim();
    if (q.length < 2) { dropdown.style.display = 'none'; return; }
    searchTimer = setTimeout(async () => {
      dropdown.style.display = 'block';
      dropdown.innerHTML = '<div class="search-empty">Searching...</div>';
      const data = await API.search(q);
      if (!data?.data?.length) { dropdown.innerHTML = '<div class="search-empty">No results found.</div>'; return; }
      dropdown.innerHTML = '';
      data.data.slice(0, 7).forEach(anime => {
        const item = document.createElement('div');
        item.className = 'search-item';
        item.innerHTML = `
          <img src="${anime.images?.jpg?.image_url || 'images/placeholder.svg'}" alt="">
          <div>
            <div class="search-item-title">${anime.title}</div>
            <div class="search-item-meta">${(anime.genres||[]).slice(0,2).map(g=>g.name).join(', ')} · ${anime.year||'?'}</div>
          </div>
          <div class="search-item-score">★ ${anime.score||'?'}</div>`;
        item.addEventListener('click', () => { dropdown.style.display = 'none'; input.value = ''; openModal(anime.mal_id, anime); });
        dropdown.appendChild(item);
      });
    }, 400);
  });

  document.addEventListener('click', e => { if (!input.contains(e.target) && !dropdown.contains(e.target)) dropdown.style.display = 'none'; });
}

/* ── RENDER GRID ── */
function renderGrid(container, animeList) {
  container.innerHTML = '';
  if (!animeList?.length) {
    container.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="emoji">（；一_一）</div><p>No anime found.</p></div>`;
    return;
  }
  animeList.forEach(a => container.appendChild(renderCard(a)));
}

/* ── EXPORT GLOBALS ── */
window.AnimeTrack = { Store, Toast, API, renderCard, renderGrid, renderSkeletons, initModal, openModal, closeModal, initNavSearch };
