/**
 * CristianPlay - Aplicación principal
 * Versión 0.05
 *
 * Buscador de videos cristianos: alabanzas, adoración, predicaciones y podcasts.
 * Reproductor de video integrado.
 * Cola tipo DJ REAL: el video actual NO se interrumpe al agregar más.
 * Modo aleatorio (shuffle).
 * Similitudes de artistas.
 * Panel de administración oculto: estadísticas, usuarios y ranking (solo admin).
 */

const app = {
  currentCategory: null,
  currentQuery: '',
  results: [],
  queue: [],        // cola de reproducción tipo DJ
  queueIndex: -1,   // índice del video que se está reproduciendo AHORA
  isMusicMode: false, // modo música (audio continuo)
  isShuffle: false,   // modo aleatorio
  currentPlayingItem: null, // item que suena ahora
  similarArtistsVisible: false,

  init() {
    // Botones de búsqueda
    document.getElementById('searchBtn').addEventListener('click', () => this.handleSearch());
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleSearch();
    });
    document.getElementById('heroSearch').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.searchFromHero();
    });

    // Botón modo música
    const musicBtn = document.getElementById('btnMusicMode');
    if (musicBtn) {
      musicBtn.addEventListener('click', () => this.toggleMusicMode());
    }

    // Botón modo aleatorio
    const shuffleBtn = document.getElementById('btnShuffle');
    if (shuffleBtn) {
      shuffleBtn.addEventListener('click', () => this.toggleShuffle());
    }

    // Cerrar modales al hacer clic fuera
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
    this.updateMusicModeUI();
    this.updateShuffleUI();
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
    document.querySelectorAll('.admin-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tab);
    });
    document.querySelectorAll('.admin-panel').forEach(p => {
      p.classList.toggle('hidden', p.id !== `admin${tab.charAt(0).toUpperCase() + tab.slice(1)}`);
    });
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

  /* ---------- Modo Música ---------- */

  toggleMusicMode() {
    this.isMusicMode = !this.isMusicMode;
    this.updateMusicModeUI();
    app.showToast(
      this.isMusicMode ? 'Modo música activado: reproducción continua' : 'Modo música desactivado',
      this.isMusicMode ? 'success' : 'info'
    );
  },

  updateMusicModeUI() {
    const btn = document.getElementById('btnMusicMode');
    const indicator = document.getElementById('musicModeIndicator');
    if (!btn) return;

    if (this.isMusicMode) {
      btn.classList.add('active');
      btn.textContent = '🎵 Modo Música: ON';
      if (indicator) indicator.textContent = '🎵 MÚSICA EN VIVO';
    } else {
      btn.classList.remove('active');
      btn.textContent = '🎵 Modo Música';
      if (indicator) indicator.textContent = '';
    }
  },

  /* ---------- Modo Aleatorio (Shuffle) ---------- */

  toggleShuffle() {
    this.isShuffle = !this.isShuffle;
    this.updateShuffleUI();
    app.showToast(
      this.isShuffle ? 'Modo aleatorio activado' : 'Modo aleatorio desactivado',
      this.isShuffle ? 'success' : 'info'
    );
  },

  updateShuffleUI() {
    const btn = document.getElementById('btnShuffle');
    const indicator = document.getElementById('shuffleIndicator');
    if (!btn) return;

    if (this.isShuffle) {
      btn.classList.add('active');
      btn.textContent = '🔀 Aleatorio: ON';
      if (indicator) indicator.textContent = '🔀 ALEATORIO';
    } else {
      btn.classList.remove('active');
      btn.textContent = '🔀 Aleatorio';
      if (indicator) indicator.textContent = '';
    }
  },

  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },

  /* ---------- Cola tipo DJ (SIN interrumpir el actual) ---------- */

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

  // Reproducir AHORA (cambia el video actual)
  playNow(item) {
    this.addToQueue(item);
    this.queueIndex = this.queue.findIndex(q => q.id === item.id);
    this.playCurrent();
    app.showToast(`Reproduciendo ahora: ${item.title}`, 'success');
  },

  // Agregar a la cola SIN interrumpir el actual (COMPORTAMIENTO DJ)
  addToQueueOnly(item) {
    this.addToQueue(item);
    this.renderQueue();
    app.showToast('Agregado a la cola de espera', 'success');
  },

  next() {
    if (this.queue.length === 0) return;
    if (this.isShuffle) {
      // Aleatorio: elegir cualquier índice diferente al actual
      const candidates = this.queue.map((_, i) => i).filter(i => i !== this.queueIndex);
      if (candidates.length === 0) return;
      this.queueIndex = candidates[Math.floor(Math.random() * candidates.length)];
    } else {
      this.queueIndex = (this.queueIndex + 1) % this.queue.length;
    }
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

    this.currentPlayingItem = item;
    this.renderNowPlaying(item);
    document.getElementById('nowPlaying').classList.add('visible');

    player.play(item);

    window.__cpStorage.incrementPlays();
    window.__cpStorage.addToRanking(item);
    window.__cpStorage.addHistory(item);

    if (auth.isAdmin() && document.getElementById('adminModal').classList.contains('open')) {
      this.renderAdminStats();
      this.renderAdminRanking();
    }

    this.renderQueue();
    this.updateMusicModeUI();
  },

  togglePlayPause() {
    const item = this.getCurrentQueueItem();
    if (!item) return;
    app.showToast('Usa los controles del video para pausar/reproducir', 'info');
  },

  clearQueue() {
    this.queue = [];
    this.queueIndex = -1;
    this.currentPlayingItem = null;
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
      this.currentPlayingItem = null;
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
      list.innerHTML = '<div class="queue-empty">La cola está vacía. Presiona <strong>+</strong> en cualquier video para agregarlo a la espera.</div>';
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
          <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); app.removeFromQueue(${idx})" title="Quitar">✕</button>
        </div>
      `;
      list.appendChild(div);
    });
  },

  renderNowPlaying(item) {
    const media = document.getElementById('npMedia');
    if (this.isMusicMode) {
      media.innerHTML = `
        <div class="music-player">
          <div class="music-cover" style="background-image:url('${item.thumbnail}')"></div>
          <div class="music-info">
            <div class="music-title">${this.escapeHtml(item.title)}</div>
            <div class="music-channel">${this.escapeHtml(item.channel)}</div>
            <div class="music-category">${item.category}</div>
          </div>
          <div class="music-controls">
            <button class="btn btn-outline" onclick="app.prev()">⏮ Anterior</button>
            <button class="btn btn-primary" onclick="app.togglePlayPause()">▶ Pausa</button>
            <button class="btn btn-outline" onclick="app.next()">Siguiente ⏭</button>
          </div>
          <div class="music-note">
            <small>🎵 Modo música: reproducción continua. El siguiente inicia al terminar o al presionar Siguiente.</small>
          </div>
        </div>
      `;
    } else {
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
    }
  },

  /* ---------- Similitudes de artistas ---------- */

  toggleSimilarArtists(artistName) {
    const similar = window.__cpMock.getSimilarArtists(artistName);
    const section = document.getElementById('similarArtistsSection');
    const list = document.getElementById('similarArtistsList');

    if (this.similarArtistsVisible && document.getElementById('currentSimilarArtist').textContent === artistName) {
      // Cerrar si ya está abierto el mismo
      section.style.display = 'none';
      this.similarArtistsVisible = false;
      return;
    }

    document.getElementById('currentSimilarArtist').textContent = artistName;
    list.innerHTML = '';

    if (similar.length === 0) {
      list.innerHTML = '<div class="similar-item">No hay artistas similares registrados para este artista.</div>';
    } else {
      similar.forEach(similarArtist => {
        const div = document.createElement('div');
        div.className = 'similar-item';
        div.innerHTML = `
          <div class="similar-info">
            <strong>${this.escapeHtml(similarArtist)}</strong>
            <span>Artista similar</span>
          </div>
          <div class="similar-actions">
            <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); app.showVideosByArtist('${similarArtist}')">Ver videos</button>
          </div>
        `;
        list.appendChild(div);
      });
    }

    section.style.display = 'block';
    this.similarArtistsVisible = true;
  },

  showVideosByArtist(artistName) {
    const videos = window.__cpMock.getVideosByArtist(artistName);
    this.currentQuery = '';
    this.currentCategory = null;
    document.getElementById('searchInput').value = '';
    document.getElementById('heroSearch').value = '';
    this.setActiveChip(null);

    // Mostrar solo videos de ese artista
    const grid = document.getElementById('resultsGrid');
    const countEl = document.getElementById('resultsCount');
    const titleEl = document.getElementById('resultsTitle');
    const empty = document.getElementById('emptyState');

    grid.innerHTML = '';
    countEl.textContent = `${videos.length} resultado${videos.length !== 1 ? 's' : ''}`;
    titleEl.textContent = `Videos de ${artistName}`;
    empty.style.display = 'none';
    grid.style.display = 'grid';

    videos.forEach(item => {
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
          ${isCurrent ? '<div style="position:absolute;top:10px;left:10px;background:var(--primary);color:#fff;padding:0.35rem 0.6rem;border-radius:6px;font-size:0.7rem;font-weight:800;">EN VIVO</div>' : ''}
        </div>
        <div class="card-body">
          <div class="card-title">${this.escapeHtml(item.title)}</div>
          <div class="card-channel">${this.escapeHtml(item.channel)}</div>
          <div class="card-actions">
            <button class="btn-play" data-item-id="${item.id}" title="Reproducir AHORA">
              ▶ Ahora
            </button>
            <button class="btn-add" data-item-id="${item.id}" title="Agregar a la cola de espera">
              +
            </button>
            <button class="btn-similar" data-artist="${this.escapeHtml(item.artist || item.channel)}" title="Ver artistas similares">
              🔗
            </button>
          </div>
        </div>
      `;

      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-play') || e.target.closest('.btn-add') || e.target.closest('.btn-similar')) return;
        this.addToQueueOnly(item);
      });

      card.querySelector('.btn-play').addEventListener('click', (e) => {
        e.stopPropagation();
        this.playNow(item);
      });
      card.querySelector('.btn-add').addEventListener('click', (e) => {
        e.stopPropagation();
        this.addToQueueOnly(item);
      });
      card.querySelector('.btn-similar').addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleSimilarArtists(item.artist || item.channel);
      });

      grid.appendChild(card);
    });

    document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
  },

  /* ---------- Búsqueda y categorías ---------- */

  goHome() {
    this.currentCategory = null;
    this.currentQuery = '';
    document.getElementById('searchInput').value = '';
    document.getElementById('heroSearch').value = '';
    this.setActiveChip(null);
    this.renderResults();
    const similarSection = document.getElementById('similarArtistsSection');
if (similarSection) similarSection.style.display = 'none';
    this.similarArtistsVisible = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  handleSearch() {
    const input = document.getElementById('searchInput').value.trim();
    this.currentQuery = input;
    this.currentCategory = null;
    this.setActiveChip(null);
    this.renderResults();
    const similarSection = document.getElementById('similarArtistsSection');
if (similarSection) similarSection.style.display = 'none';
    this.similarArtistsVisible = false;
  },

  searchFromHero() {
    const input = document.getElementById('heroSearch').value.trim();
    this.currentQuery = input;
    this.currentCategory = null;
    this.setActiveChip(null);
    document.getElementById('searchInput').value = input;
    this.renderResults();
    document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
    const similarSection = document.getElementById('similarArtistsSection');
if (similarSection) similarSection.style.display = 'none';
    this.similarArtistsVisible = false;
  },

  filterByCategory(category, el) {
    this.currentCategory = category;
    this.currentQuery = '';
    document.getElementById('searchInput').value = '';
    document.getElementById('heroSearch').value = '';
    this.setActiveChip(el ? category : null);
    this.renderResults();
    document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
    const similarSection = document.getElementById('similarArtistsSection');
if (similarSection) similarSection.style.display = 'none';
    this.similarArtistsVisible = false;
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
          ${isCurrent ? '<div style="position:absolute;top:10px;left:10px;background:var(--primary);color:#fff;padding:0.35rem 0.6rem;border-radius:6px;font-size:0.7rem;font-weight:800;">EN VIVO</div>' : ''}
        </div>
        <div class="card-body">
          <div class="card-title">${this.escapeHtml(item.title)}</div>
          <div class="card-channel">${this.escapeHtml(item.channel)}</div>
          <div class="card-actions">
            <button class="btn-play" data-item-id="${item.id}" title="Reproducir AHORA (cambia el actual)">
              ▶ Ahora
            </button>
            <button class="btn-add" data-item-id="${item.id}" title="Agregar a la cola de espera (no interrumpe)">
              +
            </button>
            <button class="btn-similar" data-artist="${this.escapeHtml(item.artist || item.channel)}" title="Ver artistas similares">
              🔗
            </button>
          </div>
        </div>
      `;

      // Clic en el cuadro: agregar a cola de espera (NO interrumpe)
      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-play') || e.target.closest('.btn-add') || e.target.closest('.btn-similar')) return;
        this.addToQueueOnly(item);
      });

      const btnPlay = card.querySelector('.btn-play');
      const btnAdd = card.querySelector('.btn-add');
      const btnSimilar = card.querySelector('.btn-similar');
      btnPlay.addEventListener('click', (e) => {
        e.stopPropagation();
        this.playNow(item);
      });
      btnAdd.addEventListener('click', (e) => {
        e.stopPropagation();
        this.addToQueueOnly(item);
      });
      btnSimilar.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleSimilarArtists(item.artist || item.channel);
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
        div.onclick = () => this.playNow(h);
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
    html += `<button class="btn btn-primary btn-block mt-3" onclick="app.closeUserPanel(); app.playNowFromPlaylist()">Reproducir primera AHORA</button>`;
    html += `<button class="btn btn-outline btn-block mt-2" onclick="app.addPlaylistToQueue()">Agregar toda a la cola de espera</button>`;
    document.getElementById('playlistsList').innerHTML = html;
  },

  playNowFromPlaylist() {
    if (this._playlistFirstItem) {
      this.playNow(this._playlistFirstItem);
    }
  },

  addPlaylistToQueue() {
    const playlists = window.__cpStorage.getPlaylists();
    const p = playlists.find(x => x.id === this._currentPlaylistId);
    if (!p) return;
    p.items.forEach(item => this.addToQueue(item));
    this.renderQueue();
    app.showToast(`${p.items.length} videos agregados a la cola de espera`, 'success');
    this.closeUserPanel();
  },

  playItemFromPlaylist() {
    if (this._playlistFirstItem) {
      this.playNow(this._playlistFirstItem);
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