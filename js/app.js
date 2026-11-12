/**
 * CristianPlay - Aplicación principal
 * Versión 0.07
 *
 * Orden: Búsqueda arriba → Contenido (destacados o resultados) → Reproductor → Cola abajo
 * Cola tipo DJ: no interrumpe el video actual.
 */

const app = {
  currentCategory: null,
  currentQuery: '',
  results: [],
  queue: [],
  queueIndex: -1,
  isMusicMode: false,

  init() {
    document.getElementById('searchBtn').addEventListener('click', () => this.handleSearch());
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleSearch();
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('open');
      });
    });

    if (auth.isAdmin()) {
      document.getElementById('adminBtn').style.display = 'flex';
    }

    this.renderFeatured();
    this.updateMusicModeUI();
  },

  /* ---------- Panel Admin ---------- */
  toggleAdminPanel() {
    const m = document.getElementById('adminModal');
    if (m.classList.contains('open')) this.closeAdminPanel();
    else this.openAdminPanel();
  },
  openAdminPanel() {
    if (!auth.isAdmin()) { app.showToast('Acceso denegado: solo el administrador', 'danger'); return; }
    document.getElementById('adminModal').classList.add('open');
    this.switchAdminTab('stats');
  },
  closeAdminPanel() { document.getElementById('adminModal').classList.remove('open'); },
  switchAdminTab(tab) {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    document.querySelectorAll('.admin-panel').forEach(p => p.classList.toggle('hidden', p.id !== 'admin' + tab.charAt(0).toUpperCase() + tab.slice(1)));
    if (tab === 'stats') this.renderAdminStats();
    if (tab === 'users') this.renderAdminUsers();
    if (tab === 'ranking') this.renderAdminRanking();
  },
  renderAdminStats() {
    const s = window.__cpStorage.getStats();
    const p = window.__cpStorage.getPlaylists();
    const h = window.__cpStorage.getHistory();
    document.getElementById('statTotalUsers').textContent = s.totalUsers || 0;
    document.getElementById('statTotalPlays').textContent = s.totalPlays || 0;
    document.getElementById('statTotalVideos').textContent = s.totalVideosAdded || 0;
    document.getElementById('statTotalPlaylists').textContent = p.length;
    const act = document.getElementById('adminRecentActivity');
    if (h.length === 0) act.innerHTML = '<div class="activity-item">Sin actividad registrada</div>';
    else act.innerHTML = h.slice(0,10).map(x => `<div class="activity-item"><div class="activity-title">${this.escapeHtml(x.title)}</div><div class="activity-meta">${this.escapeHtml(x.channel)} • ${new Date(x.playedAt).toLocaleDateString('es-ES')}</div></div>`).join('');
  },
  renderAdminUsers() {
    const u = window.__cpAuth.getUser();
    const list = document.getElementById('adminUsersList');
    if (!u) { list.innerHTML = '<div class="user-item"><div class="user-info"><strong>No hay usuarios</strong></div></div>'; return; }
    list.innerHTML = `<div class="user-item ${auth.isAdmin()?'admin-user':''}"><div class="user-info"><strong>${this.escapeHtml(u.name)}</strong><span>${this.escapeHtml(u.email)} ${auth.isAdmin()?'• Admin':''}</span></div><div class="user-actions"><button class="btn btn-outline btn-sm" onclick="app.deleteUser()">Eliminar</button></div></div>`;
  },
  deleteUser() { if(confirm('¿Eliminar cuenta?')){ auth.logout(); app.showToast('Cuenta eliminada','success'); } },
  renderAdminRanking() {
    const r = window.__cpStorage.getRanking();
    const list = document.getElementById('adminRankingList');
    if (r.length === 0) { list.innerHTML = '<div class="ranking-item"><div class="ranking-position">-</div><div class="ranking-info"><strong>Sin datos</strong></div></div>'; return; }
    list.innerHTML = r.slice(0,10).map((x,i) => `<div class="ranking-item"><div class="ranking-position">${i+1}</div><div class="ranking-info"><strong>${this.escapeHtml(x.title)}</strong><span>${this.escapeHtml(x.channel)}</span><div class="ranking-count">${x.count} reproducción${x.count!==1?'es':''}</div></div></div>`).join('');
  },

  /* ---------- Contenido (destacados o resultados) ---------- */
  renderFeatured() {
    const grid = document.getElementById('contentGrid');
    const title = document.getElementById('contentTitle');
    const featured = window.__cpMock.getMockResults('', this.currentCategory).slice(0, 8);
    grid.innerHTML = '';
    const labels = {
      alabanza: '🎵 Alabanzas Cristianas',
      adoracion: '🙏 Adoración y Alabanza',
      predicacion: '📖 Predicaciones y Sermones',
      podcast: '🎙️ Podcasts Cristianos',
      'en vivo': '🔴 En Vivo - Catedral de Fe Centro de Avivamiento'
    };
    title.textContent = this.currentCategory ? labels[this.currentCategory] : '🎵 Videos Cristianos Destacados';
    document.getElementById('emptyState').style.display = 'none';
    featured.forEach(item => grid.appendChild(this.createCard(item, false)));
  },
  handleSearch() {
    const input = document.getElementById('searchInput').value.trim();
    this.currentQuery = input;
    this.currentCategory = null;
    this.renderSearchResults();
  },
  goHome() {
    this.currentCategory = null;
    this.currentQuery = '';
    document.getElementById('searchInput').value = '';
    this.setActiveChip(null);
    this.renderFeatured();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },
  filterByCategory(category, el) {
    this.currentCategory = category;
    this.currentQuery = '';
    document.getElementById('searchInput').value = '';
    this.setActiveChip(el ? category : null);
    this.renderFeatured();
    document.getElementById('contentSection').scrollIntoView({ behavior: 'smooth' });
  },
  setActiveChip(category) {
    document.querySelectorAll('#categories .chip').forEach(chip => {
      const isActive = chip.dataset.category === category;
      chip.classList.toggle('chip-active', isActive);
    });
  },
  renderSearchResults() {
    const grid = document.getElementById('contentGrid');
    const title = document.getElementById('contentTitle');
    const empty = document.getElementById('emptyState');
    const results = window.__cpMock.getMockResults(this.currentQuery, this.currentCategory);
    grid.innerHTML = '';
    title.textContent = this.currentQuery ? `Resultados para "${this.currentQuery}"` : (this.currentCategory ? {
      alabanza: '🎵 Alabanzas Cristianas',
      adoracion: '🙏 Adoración y Alabanza',
      predicacion: '📖 Predicaciones y Sermones',
      podcast: '🎙️ Podcasts Cristianos',
      'en vivo': '🔴 En Vivo - Catedral de Fe Centro de Avivamiento'
    }[this.currentCategory] : 'Resultados');
    if (results.length === 0) { empty.style.display='block'; grid.style.display='none'; return; }
    empty.style.display='none'; grid.style.display='grid';
    results.forEach(item => grid.appendChild(this.createCard(item, false)));
  },
  createCard(item, isCurrent) {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-thumb">
        <img src="${item.thumbnail}" alt="${item.title}" loading="lazy" />
        <div class="card-badge">${item.isLive ? 'EN VIVO' : 'VIDEO'}</div>
        <div style="position:absolute;bottom:10px;right:10px;background:rgba(0,0,0,0.7);color:#fff;padding:0.35rem 0.6rem;border-radius:6px;font-size:0.75rem;font-weight:700;border:1px solid rgba(255,255,255,0.1);">${item.duration}</div>
        ${item.isLive ? '<div style="position:absolute;top:10px;left:10px;background:linear-gradient(135deg, #ef4444, #dc2626);color:#fff;padding:0.35rem 0.6rem;border-radius:6px;font-size:0.7rem;font-weight:800;">🔴 EN VIVO</div>' : ''}
        ${isCurrent ? '<div style="position:absolute;top:10px;left:10px;background:var(--primary);color:#fff;padding:0.35rem 0.6rem;border-radius:6px;font-size:0.7rem;font-weight:800;">EN VIVO</div>' : ''}
      </div>
      <div class="card-body">
        <div class="card-title">${this.escapeHtml(item.title)}</div>
        <div class="card-channel">${this.escapeHtml(item.channel)}</div>
      </div>
    `;
    card.addEventListener('click', (e) => {
      this.addToQueueOnly(item);
    });
    return card;
  },

  /* ---------- Cola tipo DJ ---------- */
  getCurrentQueueItem() { return this.queue[this.queueIndex] || null; },
  addToQueue(item) {
    if (!this.queue.some(q => q.id === item.id)) {
      this.queue.push(item);
      window.__cpStorage.incrementVideosAdded();
    }
  },
  playNow(item) {
    this.addToQueue(item);
    this.queueIndex = this.queue.findIndex(q => q.id === item.id);
    this.playCurrent();
    app.showToast(`Reproduciendo ahora: ${item.title}`, 'success');
  },
  addToQueueOnly(item) {
    const wasEmpty = this.queue.length === 0;
    this.addToQueue(item);
    this.renderQueue();
    // Si la cola estaba vacía, empezar a reproducir este video inmediatamente
    if (wasEmpty) {
      this.queueIndex = 0;
      this.playCurrent();
    }
    app.showToast('Agregado a la lista de espera', 'success');
  },
  next() {
    if (this.queue.length === 0) return;
    this.queueIndex = (this.queueIndex + 1) % this.queue.length;
    this.playCurrent();
  },
  prev() {
    if (this.queue.length === 0) return;
    this.queueIndex = (this.queueIndex - 1 + this.queue.length) % this.queue.length;
    this.playCurrent();
  },
  playCurrent() {
    const item = this.getCurrentQueueItem();
    if (!item) return;
    this.renderNowPlaying(item);
    document.getElementById('nowPlaying').classList.add('visible');
    player.play(item);
    window.__cpStorage.incrementPlays();
    window.__cpStorage.addToRanking(item);
    window.__cpStorage.addHistory(item);
    if (auth.isAdmin() && document.getElementById('adminModal').classList.contains('open')) {
      this.renderAdminStats(); this.renderAdminRanking();
    }
    this.renderQueue();
  },
  togglePlayPause() {
    const item = this.getCurrentQueueItem();
    if (!item) return;
    app.showToast('Usa los controles del video para pausar/reproducir', 'info');
  },
  clearQueue() {
    this.queue = []; this.queueIndex = -1;
    document.getElementById('nowPlaying').classList.remove('visible');
    document.getElementById('npMedia').innerHTML = `<div class="np-empty"><div style="font-size:3rem;margin-bottom:1rem;">📺</div><p>Selecciona un video para comenzar a reproducir</p></div>`;
    this.renderQueue(); app.showToast('Lista limpiada', 'success');
  },
  removeFromQueue(index) {
    this.queue.splice(index,1);
    if (this.queueIndex >= this.queue.length) this.queueIndex = this.queue.length>0 ? this.queue.length-1 : -1;
    if (this.queueIndex >= 0) this.playCurrent();
    else { document.getElementById('nowPlaying').classList.remove('visible'); document.getElementById('npMedia').innerHTML = `<div class="np-empty"><div style="font-size:3rem;margin-bottom:1rem;">📺</div><p>Selecciona un video para comenzar a reproducir</p></div>`; }
    this.renderQueue();
  },
  renderQueue() {
    const list = document.getElementById('queueList');
    list.innerHTML = '';
    if (this.queue.length === 0) { list.innerHTML = '<div class="queue-empty">La lista está vacía. Presiona <strong>+</strong> en cualquier video para agregarlo.</div>'; return; }
    this.queue.forEach((item, idx) => {
      const isCurrent = idx === this.queueIndex;
      const div = document.createElement('div');
      div.className = `queue-item ${isCurrent?'current':''}`;
      div.onclick = () => { this.queueIndex = idx; this.playCurrent(); };
      div.innerHTML = `<div class="queue-number">${idx+1}</div><div class="queue-item-info"><div class="queue-title">${this.escapeHtml(item.title)}</div><div class="queue-channel">${this.escapeHtml(item.channel)} • ${item.category}</div></div><div class="queue-item-actions"><button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); app.removeFromQueue(${idx})" title="Quitar">✕</button></div>`;
      list.appendChild(div);
    });
  },
  renderNowPlaying(item) {
    document.getElementById('npMedia').innerHTML = `
      <div class="yt-wrapper">
        <iframe width="560" height="315" src="https://www.youtube.com/embed/${item.youtubeId}?modestbranding=1&rel=0&showinfo=0&controls=1&autoplay=1&fs=1&cc_load_policy=0&iv_load_policy=3" title="${item.title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe>
        <div class="yt-note"><small>Reproducido desde YouTube. Los anuncios (si los hay) son gestionados por YouTube.</small></div>
      </div>`;
  },

  /* ---------- Auth / Usuario ---------- */
  openUserPanel() {
    if (!window.__cpAuth.isLoggedIn()) { auth.toggleAuthModal(); return; }
    const u = window.__cpAuth.getUser();
    document.getElementById('userName').textContent = u.name;
    document.getElementById('userEmail').textContent = u.email;
    document.getElementById('userAvatar').textContent = u.name.charAt(0).toUpperCase();
    const list = document.getElementById('playlistsList');
    list.innerHTML = '';
    const pls = window.__cpStorage.getPlaylists();
    if (pls.length === 0) list.innerHTML = '<div class="history-item">No tienes playlists todavía</div>';
    else pls.forEach(p => {
      const d = document.createElement('div'); d.className='playlist-item';
      d.innerHTML = `<div class="playlist-info"><strong>${this.escapeHtml(p.name)}</strong><span>${p.items.length} ${p.items.length===1?'canción':'canciones'}</span></div><button class="btn btn-outline btn-sm" onclick="app.openPlaylist('${p.id}')">Ver</button>`;
      list.appendChild(d);
    });
    const h = document.getElementById('historyList');
    const hist = window.__cpStorage.getHistory();
    h.innerHTML = '';
    if (hist.length === 0) h.innerHTML = '<div class="history-item">No hay historial todavía</div>';
    else hist.slice(0,10).forEach(x => { const d = document.createElement('div'); d.className='history-item'; d.textContent = x.title; d.onclick = () => this.playNow(x); h.appendChild(d); });
    document.getElementById('userModal').classList.add('open');
  },
  closeUserPanel() { document.getElementById('userModal').classList.remove('open'); },
  createPlaylist() {
    const n = prompt('Nombre de la nueva playlist:'); if (!n || !n.trim()) return;
    window.__cpStorage.addPlaylist(n.trim()); app.showToast('Playlist creada','success'); this.openUserPanel();
  },
  openPlaylist(playlistId) {
    const pls = window.__cpStorage.getPlaylists(); const p = pls.find(x => x.id === playlistId); if (!p) return;
    const items = p.items; let html = `<h3 style="margin-bottom:1rem;">${this.escapeHtml(p.name)}</h3>`;
    if (items.length === 0) html += '<div class="history-item">Esta playlist está vacía</div>';
    else items.forEach((x, i) => html += `<div class="playlist-item" style="flex-direction:column;align-items:flex-start;gap:0.5rem;"><div style="font-weight:600;">${i+1}. ${this.escapeHtml(x.title)}</div><div style="font-size:0.8rem;color:var(--text-muted);">${this.escapeHtml(x.channel)}</div></div>`);
    html += `<button class="btn btn-primary btn-block mt-3" onclick="app.closeUserPanel(); app.playNowFromPlaylist()">Reproducir primera AHORA</button>`;
    document.getElementById('playlistsList').innerHTML = html;
  },
  playNowFromPlaylist() { if (this._playlistFirstItem) this.playNow(this._playlistFirstItem); },
  showToast(message, type='success') {
    const t = document.getElementById('toast'); const m = document.getElementById('toastMessage');
    m.textContent = message; t.className='toast';
    if (type==='success') t.style.borderLeft='4px solid var(--success)';
    else if (type==='warning') t.style.borderLeft='4px solid var(--warning)';
    else if (type==='danger') t.style.borderLeft='4px solid var(--danger)';
    else if (type==='info') t.style.borderLeft='4px solid var(--secondary)';
    t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),3000);
  },
  escapeHtml(t){ if(!t) return ''; const d=document.createElement('div'); d.textContent=t; return d.innerHTML; },
};

document.addEventListener('DOMContentLoaded', () => app.init());
window.__cpApp = app;