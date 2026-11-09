/**
 * CristianPlay - Aplicación principal
 * Versión 0.03
 *
 * Buscador de videos cristianos: alabanzas, adoración, predicaciones y podcasts.
 * Reproductor de video integrado justo debajo de las categorías.
 * Cola tipo DJ: selecciona los videos que quieras ver (1, 2, 3…) en el mismo entorno.
 * Panel de administración oculto: estadísticas, usuarios y ranking (solo admin).
 */

const app = {
  currentCategory: null,
  currentQuery: '',
  results: [],
  queue: [],        // cola de reproducción tipo DJ (solo video)
  queueIndex: -1,   // índice actual en la cola

  init() {
    // Botones de búsqueda
    document.getElementById('searchBtn').addEventListener('click', () => this.handleSearch());
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleSearch();
    });
    document.getElementById('heroSearch').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.searchFromHero();
    });

    // Cerrar modales al hacer clic fuera (auth, usuario y admin)
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('open');
      });
    });

    // Verificar si es administrador y mostrar botón admin
    if (auth.isAdmin()) {
      document.getElementById('adminBtn').style.display = 'flex';
    }

    // Render inicial
    this.renderResults();
  },

  /* ---------- Panel de Administración ---------- */

  toggleAdminPanel() {
    const modal = document.getElementById('adminModal');
    if (modal.classList.contains('open')) {
      this.closeAdminPanel();
    } else {
      this.openAdminPanel();
    }
  },

  openAdminPanel() {
    if (!auth.isAdmin()) {
      app.showToast('Acceso denegado: solo el administrador puede ingresar', 'danger');
      return;
    }
    document.getElementById('adminModal').classList.add('open');
    this.switchAdminTab('stats');
  },

  closeAdminPanel() {
    document.getElementById('adminModal').classList.remove('open');
  },

  switchAdminTab(tab) {
    // Actualizar pestañas
    document.querySelectorAll('.admin-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tab);
    });
    // Mostrar panel correspondiente
    document.querySelectorAll('.admin-panel').forEach(p => {
      p.classList.toggle('hidden', p.id !== `admin${tab.charAt(0).toUpperCase() + tab.slice(1)}`);
    });

    // Renderizar contenido según la pestaña
    if (tab === 'stats') this.renderAdminStats();
    if (tab === 'users') this.renderAdminUsers();
    if (tab === 'ranking') this.renderAdminRanking();
  },

  renderAdminStats() {
    const stats = window.__cpStorage.getStats();
    const playlists = window.__cpStorage.getPlaylists();
    const history = window.__cpStorage.getHistory();

    document.getElementById('statTotalUsers').textContent = stats.totalUsers || 0;
    document.getElementById('statTotalPlays').textContent = stats.totalPlays || 0;
    document.getElementById('statTotalVideos').textContent = stats.totalVideosAdded || 0;
    document.getElementById('statTotalPlaylists').textContent = playlists.length;

    // Actividad reciente
    const activity = document.getElementById('adminRecentActivity');
    if (history.length === 0) {
      activity.innerHTML = '<div class="activity-item">Sin actividad registrada</div>';
    } else {
      activity.innerHTML = history.slice(0, 10).map(h => `
        <div class="activity-item">
          <div class="activity-title">${this.escapeHtml(h.title)}</div>
          <div class="activity-meta">${this.escapeHtml(h.channel)} • ${new Date(h.playedAt).toLocaleDateString('es-ES')}</div>
        </div>
      `).join('');
    }
  },

  renderAdminUsers() {
    const user = window.__cpAuth.getUser();
    const list = document.getElementById('adminUsersList');
    const isAdminUser = auth.isAdmin();

    if (!user) {
      list.innerHTML = '<div class="user-item"><div class="user-info"><strong>No hay usuarios registrados</strong><span>Inicia sesión para ver tu cuenta</span></div></div>';
      return;
    }

    // En localStorage solo hay un usuario a la vez (simulación), mostramos el actual
    list.innerHTML = `
      <div class="user-item ${isAdminUser ? 'admin-user' : ''}">
        <div class="user-info">
          <strong>${this.escapeHtml(user.name)}</strong>
          <span>${this.escapeHtml(user.email)} ${isAdminUser ? '• (Administrador)' : ''}</span>
        </div>
        <div class="user-actions">
          <button class="btn btn-outline btn-sm" onclick="app.deleteUser()">Eliminar cuenta</button>
        </div>
      </div>
    `;
  },

  deleteUser() {
    if (confirm('¿Estás seguro de que deseas eliminar tu cuenta?')) {
      auth.logout();
      app.showToast('Cuenta eliminada', 'success');
    }
  },

  renderAdminRanking() {
    const ranking = window.__cpStorage.getRanking();
    const list = document.getElementById('adminRankingList');

    if (ranking.length === 0) {
      list.innerHTML = '<div class="ranking-item"><div class="ranking-position">-</div><div class="ranking-info"><strong>Sin datos todavía</strong><span>No se han reproducido videos para el ranking</span></div></div>';
      return;
    }

    list.innerHTML = ranking.slice(0, 10).map((item, idx) => `
      <div class="ranking-item">
        <div class="ranking-position">${idx + 1}</div>
        <div class="ranking-info">
          <strong>${this.escapeHtml(item.title)}</strong>
          <span>${this.escapeHtml(item.channel)} • ${item.category}</span>
          <div class="ranking-count">${item.count} reproducción${item.count !== 1 ? 'es' : ''}</div>
        </div>
      </div>
    `).join('');
  },

  /* ---------- Cola tipo DJ ---------- */

  getCurrentQueueItem() {
    return this.queue[this.queueIndex] || null;
  },

  addToQueue(item) {
    const exists = this.queue.some(q => q.id === item.id);
    if (!exists) {
      this.queue.push(item);
      window.__cpStorage.incrementVideosAdded();
    }
  },

  playItem(item) {
    // Clic en el cuadro: agregar a cola y reproducir video ahora
    this.addToQueue(item);
    this.queueIndex = this.queue.findIndex(q => q.id === item.id);
    this.playCurrent();
  },

  addToQueueOnly(item) {
    // Botón +: solo agregar a la cola sin cambiar el video actual
    this.addToQueue(item);
    app.showToast('Agregado a la cola', 'success');
    this.renderQueue();
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

    // Mostrar reproductor integrado con el video
    this.renderNowPlaying(item);
    document.getElementById('nowPlaying').classList.add('visible');

    // Llamar al reproductor (solo video embebido)
    player.play(item);

    // Registrar en estadísticas y ranking
    window.__cpStorage.incrementPlays();
    window.__cpStorage.addToRanking(item);
    window.__cpStorage.addHistory(item);

    // Si es admin, actualizar stats del panel si está abierto
    if (auth.isAdmin() && document.getElementById('adminModal').classList.contains('open')) {
      this.renderAdminStats();
      this.renderAdminRanking();
    }

    this.renderQueue();
  },

  togglePlayPause() {
    // Para video de YouTube embebido, el control de play/pause está dentro del iframe.
    const item = this.getCurrentQueueItem();
    if (!item) return;
    app.showToast('Usa los controles del video para pausar/reproducir', 'info');
  },

  clearQueue() {
    this.queue = [];
    this.queueIndex = -1;
    document.getElementById('nowPlaying').classList.remove('visible');
    document.getElementById('npMedia').innerHTML = `
      <div class="np-empty">
        <div style="font-size:3rem;margin-bottom:1rem;">📺</div>
        <p>Selecciona un video para comenzar a reproducir</p>
      </div>
    `;
    this.renderQueue();
    app.showToast('Cola limpiada', 'success');
  },

  removeFromQueue(index) {
    this.queue.splice(index, 1);
    if (this.queueIndex >= this.queue.length) {
      this.queueIndex = this.queue.length > 0 ? this.queue.length - 1 : -1;
    }
    if (this.queueIndex >= 0) {
      this.playCurrent();
    } else {
      document.getElementById('nowPlaying').classList.remove('visible');
      document.getElementById('npMedia').innerHTML = `
        <div class="np-empty">
          <div style="font-size:3rem;margin-bottom:1rem;">📺</div>
          <p>Selecciona un video para comenzar a reproducir</p>
        </div>
      `;
    }
    this.renderQueue();
  },

  renderQueue() {
    const list = document.getElementById('queueList');
    list.innerHTML = '';

    if (this.queue.length === 0) {
      list.innerHTML = '<div class="queue-empty">La cola está vacía. Presiona <strong>+</strong> en cualquier video para agregarlo.</div>';
      return;
    }

    this.queue.forEach((item, idx) => {
      const isCurrent = idx === this.queueIndex;
      const div = document.createElement('div');
      div.className = `queue-item ${isCurrent ? 'current' : ''}`;
      div.onclick = () => {
        this.queueIndex = idx;
        this.playCurrent();
      };
      div.innerHTML = `
        <div class="queue-number">${idx + 1}</div>
        <div class="queue-item-info">
          <div class="queue-title">${this.escapeHtml(item.title)}</div>
          <div class="queue-channel">${this.escapeHtml(item.channel)} • ${item.category}</div>
        </div>
        <div class="queue-item-actions">
          <button class="btn btn-outline" onclick="event.stopPropagation(); app.removeFromQueue(${idx})" title="Quitar">✕</button>
        </div>
      `;
      list.appendChild(div);
    });
  },

  renderNowPlaying(item) {
    const media = document.getElementById('npMedia');
    // Solo video de YouTube embebido con mínimas distracciones
    media.innerHTML = `
      <div class="yt-wrapper">
        <iframe
          width="560" height="315"
          src="https://www.youtube.com/embed/${item.youtubeId}?modestbranding=1&rel=0&showinfo=0&controls=1&autoplay=1&fs=1&cc_load_policy=0&iv_load_policy=3"
          title="${item.title}"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowfullscreen
        ></iframe>
        <div class="yt-note">
          <small>Reproducido desde YouTube. Los anuncios (si los hay) son gestionados por YouTube, no por CristianPlay.</small>
        </div>
      </div>
    `;
  },

  /* ---------- Búsqueda y categorías ---------- */

  goHome() {
    this.currentCategory = null;
    this.currentQuery = '';
    document.getElementById('searchInput').value = '';
    document.getElementById('heroSearch').value = '';
    this.setActiveChip(null);
    this.renderResults();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  handleSearch() {
    const input = document.getElementById('searchInput').value.trim();
    this.currentQuery = input;
    this.currentCategory = null;
    this.setActiveChip(null);
    this.renderResults();
  },

  searchFromHero() {
    const input = document.getElementById('heroSearch').value.trim();
    this.currentQuery = input;
    this.currentCategory = null;
    this.setActiveChip(null);
    document.getElementById('searchInput').value = input;
    this.renderResults();
    document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
  },

  filterByCategory(category, el) {
    this.currentCategory = category;
    this.currentQuery = '';
    document.getElementById('searchInput').value = '';
    document.getElementById('heroSearch').value = '';
    this.setActiveChip(el ? category : null);
    this.renderResults();
    document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
  },

  setActiveChip(category) {
    document.querySelectorAll('#categories .chip').forEach(chip => {
      const isActive = chip.dataset.category === category;
      chip.classList.toggle('chip-active', isActive);
    });
  },

  /* ---------- Renderizado de resultados ---------- */

  renderResults() {
    const grid = document.getElementById('resultsGrid');
    const countEl = document.getElementById('resultsCount');
    const titleEl = document.getElementById('resultsTitle');
    const empty = document.getElementById('emptyState');

    this.results = window.__cpMock.getMockResults(this.currentQuery, this.currentCategory);

    grid.innerHTML = '';
    countEl.textContent = `${this.results.length} resultado${this.results.length !== 1 ? 's' : ''}`;

    if (this.currentCategory) {
      const labels = {
        alabanza: 'Alabanzas Cristianas',
        adoracion: 'Adoración y Alabanza',
        predicacion: 'Predicaciones y Sermones',
        podcast: 'Podcasts Cristianos',
      };
      titleEl.textContent = labels[this.currentCategory] || 'Resultados';
    } else if (this.currentQuery) {
      titleEl.textContent = `Resultados para "${this.currentQuery}"`;
    } else {
      titleEl.textContent = 'Contenido Cristiano Destacado';
    }

    if (this.results.length === 0) {
      empty.style.display = 'block';
      grid.style.display = 'none';
      return;
    }
    empty.style.display = 'none';
    grid.style.display = 'grid';

    this.results.forEach(item => {
      const card = document.createElement('article');
      card.className = 'card';
      const isCurrent = this.getCurrentQueueItem() && this.getCurrentQueueItem().id === item.id;

      card.innerHTML = `
        <div class="card-thumb">
          <img src="${item.thumbnail}" alt="${item.title}" loading="lazy" />
          <div class="card-badge">VIDEO</div>
          <div style="position:absolute;bottom:10px;right:10px;background:rgba(0,0,0,0.7);color:#fff;padding:0.35rem 0.6rem;border-radius:6px;font-size:0.75rem;font-weight:700;border:1px solid rgba(255,255,255,0.1);">
            ${item.duration}
          </div>
          ${isCurrent ? '<div style="position:absolute;top:10px;left:10px;background:var(--primary);color:#fff;padding:0.35rem 0.6rem;border-radius:6px;font-size:0.7rem;font-weight:800;">REPRODUCIENDO</div>' : ''}
        </div>
        <div class="card-body">
          <div class="card-title">${this.escapeHtml(item.title)}</div>
          <div class="card-channel">${this.escapeHtml(item.channel)}</div>
          <div class="card-actions">
            <button class="btn-play" data-item-id="${item.id}" title="Reproducir video ahora">
              ▶
            </button>
            <button class="btn-add" data-item-id="${item.id}" title="Agregar a la cola">
              +
            </button>
          </div>
        </div>
      `;

      // Todo el cuadro es clickeable para reproducir video
      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-play') || e.target.closest('.btn-add')) return;
        this.playItem(item);
      });

      const btnPlay = card.querySelector('.btn-play');
      const btnAdd = card.querySelector('.btn-add');
      btnPlay.addEventListener('click', (e) => {
        e.stopPropagation();
        this.playItem(item);
      });
      btnAdd.addEventListener('click', (e) => {
        e.stopPropagation();
        this.addToQueueOnly(item);
      });

      grid.appendChild(card);
    });
  },

  /* ---------- Auth / Usuario ---------- */

  openUserPanel() {
    if (!window.__cpAuth.isLoggedIn()) {
      auth.toggleAuthModal();
      return;
    }
    const user = window.__cpAuth.getUser();
    document.getElementById('userName').textContent = user.name;
    document.getElementById('userEmail').textContent = user.email;
    document.getElementById('userAvatar').textContent = user.name.charAt(0).toUpperCase();

    const list = document.getElementById('playlistsList');
    list.innerHTML = '';
    const playlists = window.__cpStorage.getPlaylists();
    if (playlists.length === 0) {
      list.innerHTML = '<div class="history-item">No tienes playlists todavía</div>';
    } else {
      playlists.forEach(p => {
        const div = document.createElement('div');
        div.className = 'playlist-item';
        div.innerHTML = `
          <div class="playlist-info">
            <strong>${this.escapeHtml(p.name)}</strong>
            <span>${p.items.length} ${p.items.length === 1 ? 'canción' : 'canciones'}</span>
          </div>
          <button class="btn btn-outline btn-sm" onclick="app.openPlaylist('${p.id}')">Ver</button>
        `;
        list.appendChild(div);
      });
    }

    const history = document.getElementById('historyList');
    const hist = window.__cpStorage.getHistory();
    history.innerHTML = '';
    if (hist.length === 0) {
      history.innerHTML = '<div class="history-item">No hay historial todavía</div>';
    } else {
      hist.slice(0, 10).forEach(h => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.textContent = h.title;
        div.onclick = () => this.playItem(h);
        history.appendChild(div);
      });
    }

    document.getElementById('userModal').classList.add('open');
  },

  closeUserPanel() {
    document.getElementById('userModal').classList.remove('open');
  },

  createPlaylist() {
    const name = prompt('Nombre de la nueva playlist:');
    if (!name || !name.trim()) return;
    window.__cpStorage.addPlaylist(name.trim());
    app.showToast('Playlist creada', 'success');
    this.openUserPanel();
  },

  openPlaylist(playlistId) {
    const playlists = window.__cpStorage.getPlaylists();
    const p = playlists.find(x => x.id === playlistId);
    if (!p) return;
    const items = p.items;
    this._playlistFirstItem = items[0] || null;
    let html = `<h3 style="margin-bottom:1rem;">${this.escapeHtml(p.name)}</h3>`;
    if (items.length === 0) {
      html += '<div class="history-item">Esta playlist está vacía</div>';
    } else {
      items.forEach((item, idx) => {
        html += `
          <div class="playlist-item" style="justify-content:flex-start;align-items:flex-start;flex-direction:column;gap:0.5rem;">
            <div style="font-weight:600;">${idx + 1}. ${this.escapeHtml(item.title)}</div>
            <div style="font-size:0.8rem;color:var(--text-muted);">${this.escapeHtml(item.channel)}</div>
          </div>
        `;
      });
    }
    html += `<button class="btn btn-primary btn-block mt-3" onclick="app.closeUserPanel(); app.playItemFromPlaylist()">Reproducir primera</button>`;
    document.getElementById('playlistsList').innerHTML = html;
  },

  playItemFromPlaylist() {
    if (this._playlistFirstItem) {
      this.playItem(this._playlistFirstItem);
    }
  },

  showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const msg = document.getElementById('toastMessage');
    msg.textContent = message;
    toast.className = 'toast';
    if (type === 'success') toast.style.borderLeft = '4px solid var(--success)';
    else if (type === 'warning') toast.style.borderLeft = '4px solid var(--warning)';
    else if (type === 'danger') toast.style.borderLeft = '4px solid var(--danger)';
    else if (type === 'info') toast.style.borderLeft = '4px solid var(--secondary)';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  },

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },
};

document.addEventListener('DOMContentLoaded', () => {
  app.init();
});

window.__cpApp = app;