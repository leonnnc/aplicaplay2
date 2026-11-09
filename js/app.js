/**
 * CristianPlay - Aplicación principal
 * Versión 0.02
 *
 * Buscador de música cristiana, alabanzas, adoración, predicaciones y podcasts.
 * Sistema de cola tipo DJ: selecciona las canciones que quieras escuchar (1, 2, 3…)
 * y se reproducen en secuencia en el mismo entorno, sin modal.
 */

const app = {
  currentCategory: null,
  currentQuery: '',
  results: [],
  queue: [],        // cola de reproducción tipo DJ
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

    // Auto-avance al terminar audio (cola tipo DJ)
    player.audioEl.addEventListener('ended', () => {
      this.next();
    });

    // Cerrar modales al hacer clic fuera (auth y usuario)
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('open');
      });
    });

    // Inicializar reproductor
    player.init();

    // Render inicial
    this.renderResults();
  },

  /* ---------- Cola tipo DJ ---------- */

  getCurrentQueueItem() {
    return this.queue[this.queueIndex] || null;
  },

  addToQueue(item) {
    const exists = this.queue.some(q => q.id === item.id);
    if (!exists) {
      this.queue.push(item);
    }
  },

  playItem(item) {
    // Clic en el cuadro: agregar a cola y reproducir inmediatamente
    this.addToQueue(item);
    this.queueIndex = this.queue.findIndex(q => q.id === item.id);
    this.playCurrent();
  },

  addToQueueOnly(item) {
    // Botón +: solo agregar a la cola sin reproducir todavía
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

    // Mostrar en reproductor integrado
    this.renderNowPlaying(item);
    document.getElementById('nowPlaying').classList.add('visible');

    // Reproducir (video o audio)
    player.play(item);

    // Actualizar mini indicadores (títulos solo, no mostrar mini player)
    document.getElementById('miniTitle').textContent = item.title;
    document.getElementById('miniArtist').textContent = `${item.channel} • ${item.category}`;
    document.getElementById('miniPlayPause').textContent = player.isPlaying ? '⏸' : '▶';

    this.renderQueue();
  },

  togglePlayPause() {
    const item = this.getCurrentQueueItem();
    if (!item) return;
    if (player.isPlaying && player.audioEl) {
      player.audioEl.pause();
      document.getElementById('miniPlayPause').textContent = '▶';
    } else {
      this.playCurrent();
    }
  },

  clearQueue() {
    this.queue = [];
    this.queueIndex = -1;
    player.audioEl.pause();
    player.audioEl.src = '';
    player.isPlaying = false;
    document.getElementById('miniPlayPause').textContent = '▶';
    document.getElementById('nowPlaying').classList.remove('visible');
    document.getElementById('npMedia').innerHTML = `
      <div class="np-empty">
        <div style="font-size:3rem;margin-bottom:1rem;">🎵</div>
        <p>Selecciona una canción para comenzar a reproducir</p>
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
          <div style="font-size:3rem;margin-bottom:1rem;">🎵</div>
          <p>Selecciona una canción para comenzar a reproducir</p>
        </div>
      `;
    }
    this.renderQueue();
  },

  renderQueue() {
    const list = document.getElementById('queueList');
    list.innerHTML = '';

    if (this.queue.length === 0) {
      list.innerHTML = '<div class="queue-empty">La cola está vacía. Agrega canciones presionando <strong>+</strong> en cualquier cuadro.</div>';
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
    if (item.type === 'video' && item.youtubeId) {
      media.innerHTML = `
        <iframe
          width="560" height="315"
          src="https://www.youtube.com/embed/${item.youtubeId}?modestbranding=1&rel=0&showinfo=0&controls=1&autoplay=1"
          title="${item.title}"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      `;
    } else {
      media.innerHTML = `
        <div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#94a3b8;background:#000;border-radius:12px;">
          <div style="font-size:3rem;margin-bottom:1rem;">🎵</div>
          <div style="font-weight:700;">${this.escapeHtml(item.title)}</div>
          <div style="margin-top:0.5rem;color:#64748b;">Modo audio - demostración</div>
          <audio controls style="margin-top:1rem;width:80%;max-width:320px;" onended="app.next()">
            <source src="${item.previewUrl || ''}" type="audio/mpeg">
            Tu navegador no soporta audio.
          </audio>
        </div>
      `;
    }
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
          <div class="card-badge">${item.type === 'video' ? 'VIDEO' : 'AUDIO'}</div>
          <div style="position:absolute;bottom:10px;right:10px;background:rgba(0,0,0,0.7);color:#fff;padding:0.35rem 0.6rem;border-radius:6px;font-size:0.75rem;font-weight:700;border:1px solid rgba(255,255,255,0.1);">
            ${item.duration}
          </div>
          ${isCurrent ? '<div style="position:absolute;top:10px;left:10px;background:var(--primary);color:#fff;padding:0.35rem 0.6rem;border-radius:6px;font-size:0.7rem;font-weight:800;">REPRODUCIENDO</div>' : ''}
        </div>
        <div class="card-body">
          <div class="card-title">${this.escapeHtml(item.title)}</div>
          <div class="card-channel">${this.escapeHtml(item.channel)}</div>
          <div class="card-actions">
            <button class="btn-play" data-item-id="${item.id}" title="Reproducir ahora">
              ▶
            </button>
            <button class="btn-add" data-item-id="${item.id}" title="Agregar a la cola">
              +
            </button>
          </div>
        </div>
      `;

      // Todo el cuadro es clickeable para reproducir
      card.addEventListener('click', (e) => {
        // Si el clic fue en los botones de acción, no disparar doble acción
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