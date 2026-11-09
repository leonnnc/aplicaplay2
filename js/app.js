/**
 * CristianPlay - Aplicación principal
 * Versión 0.01
 *
 * Buscador de música cristiana, predicaciones y podcasts.
 * Filtro netamente cristiano. Reproductor libre. Playlists con registro.
 */

const app = {
  currentCategory: null,
  currentQuery: '',
  results: [],

  init() {
    // Botones de búsqueda
    document.getElementById('searchBtn').addEventListener('click', () => this.handleSearch());
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleSearch();
    });
    document.getElementById('heroSearch').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.searchFromHero();
    });

    // Mini player
    document.getElementById('miniExpand').addEventListener('click', () => {
      if (player.currentItem) player.openFull(player.currentItem);
    });

    // Cerrar mini player si se hace clic en expandir (ya está en player.js)
    // Inicializar reproductor
    player.init();

    // Render inicial: mostrar todo el contenido cristiano sin filtro de búsqueda
    this.renderResults();
  },

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
  },

  setActiveChip(category) {
    // Actualizar chips de categoría en la sección de categorías
    document.querySelectorAll('#categories .chip').forEach(chip => {
      const isActive = chip.dataset.category === category;
      chip.classList.toggle('chip-active', isActive);
      if (!isActive) chip.classList.remove('chip-active');
      else chip.classList.add('chip-active');
    });
  },

  renderResults() {
    const grid = document.getElementById('resultsGrid');
    const countEl = document.getElementById('resultsCount');
    const titleEl = document.getElementById('resultsTitle');
    const empty = document.getElementById('emptyState');

    // Obtener resultados simulados filtrados por regla cristiana
    this.results = window.__cpMock.getMockResults(this.currentQuery, this.currentCategory);

    grid.innerHTML = '';
    countEl.textContent = `${this.results.length} resultado${this.results.length !== 1 ? 's' : ''}`;

    // Título de la sección
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
      card.innerHTML = `
        <div class="card-thumb">
          <img src="${item.thumbnail}" alt="${item.title}" loading="lazy" />
          <div class="card-badge">${item.type === 'video' ? 'VIDEO' : 'AUDIO'}</div>
          <div style="position:absolute;bottom:10px;right:10px;background:rgba(0,0,0,0.7);color:#fff;padding:0.35rem 0.6rem;border-radius:6px;font-size:0.75rem;font-weight:700;border:1px solid rgba(255,255,255,0.1);">
            ${item.duration}
          </div>
        </div>
        <div class="card-body">
          <div class="card-title">${this.escapeHtml(item.title)}</div>
          <div class="card-channel">${this.escapeHtml(item.channel)}</div>
          <div class="card-actions">
            <button class="btn-play" onclick="app.playItem(${JSON.stringify(item).replace(/"/g, '&quot;')})" title="Reproducir">
              ▶
            </button>
            <button class="btn-add" onclick="app.addToPlaylistQuick(${JSON.stringify(item).replace(/"/g, '&quot;')})" title="Agregar a playlist">
              +
            </button>
          </div>
        </div>
      `;
      // Doble clic en la card para reproducir
      card.querySelector('.card-body').addEventListener('dblclick', () => this.playItem(item));
      grid.appendChild(card);
    });
  },

  playItem(item) {
    player.setCurrent(item);
    player.play(item);
  },

  addToPlaylistQuick(item) {
    const user = window.__cpAuth.getUser();
    if (!user) {
      app.showToast('Inicia sesión para guardar en playlists', 'warning');
      auth.toggleAuthModal();
      return;
    }
    const playlists = window.__cpStorage.getPlaylists();
    if (playlists.length === 0) {
      window.__cpStorage.addPlaylist('Mis Favoritos');
    }
    const defaultPlaylist = window.__cpStorage.getPlaylists()[0];
    window.__cpStorage.addToPlaylist(defaultPlaylist.id, item);
    app.showToast('Agregado a tu playlist', 'success');
  },

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
    this.openUserPanel(); // refrescar
  },

  openPlaylist(playlistId) {
    const playlists = window.__cpStorage.getPlaylists();
    const p = playlists.find(x => x.id === playlistId);
    if (!p) return;
    const items = p.items;
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
    html += `<button class="btn btn-primary btn-block mt-3" onclick="app.closeUserPanel(); app.playItem(${JSON.stringify(items[0] || {title:'',channel:'',type:'audio'}).replace(/"/g,'&quot;')})">Reproducir primera</button>`;
    document.getElementById('playlistsList').innerHTML = html;
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

// Iniciar la app cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});

window.__cpApp = app;