/**
 * CristianPlay - Reproductor de música y video
 * Versión 0.02
 *
 * Reproduce contenido en el mismo entorno.
 * Soporta cola tipo DJ y auto-avance al terminar audio.
 */

const player = {
  currentItem: null,
  audioEl: null,
  isPlaying: false,

  init() {
    this.audioEl = new Audio();
    this.audioEl.preload = 'metadata';

    this.audioEl.addEventListener('play', () => {
      this.isPlaying = true;
      this.updateMiniPlayBtn();
    });
    this.audioEl.addEventListener('pause', () => {
      this.isPlaying = false;
      this.updateMiniPlayBtn();
    });
    this.audioEl.addEventListener('ended', () => {
      this.isPlaying = false;
      this.updateMiniPlayBtn();
      // El auto-avance lo maneja app.js mediante su propio listener de 'ended'
    });

    // Mini player events (app.js también los vincula, pero dejamos respaldo)
    document.getElementById('miniPlayPause').addEventListener('click', () => {
      if (app.getCurrentQueueItem()) {
        if (this.isPlaying && this.audioEl) this.audioEl.pause();
        else app.playCurrent();
      }
    });
    document.getElementById('miniPrev').addEventListener('click', () => app.prev());
    document.getElementById('miniNext').addEventListener('click', () => app.next());

    document.getElementById('miniVolume').addEventListener('input', (e) => {
      if (this.audioEl) this.audioEl.volume = parseFloat(e.target.value);
    });
    document.getElementById('miniProgress').addEventListener('input', (e) => {
      if (this.audioEl && this.audioEl.duration) {
        this.audioEl.currentTime = (parseFloat(e.target.value) / 100) * this.audioEl.duration;
      }
    });
    this.audioEl.addEventListener('timeupdate', () => {
      if (this.audioEl.duration) {
        const pct = (this.audioEl.currentTime / this.audioEl.duration) * 100;
        document.getElementById('miniProgress').value = pct;
      }
    });

    // Cerrar modales al hacer clic fuera
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('open');
      });
    });
  },

  play(item) {
    this.currentItem = item;
    window.__cpStorage.addHistory(item);
    app.updateMiniPlayer(item);
    document.getElementById('miniPlayer').style.display = 'flex';

    if (item.type === 'audio') {
      this.openFull(item);
      this.audioEl.pause();
      this.audioEl.src = '';
      this.isPlaying = false;
      this.updateMiniPlayBtn();
      app.showToast('Reproduciendo audio (modo demostración)', 'success');
    } else {
      this.openFull(item);
      app.showToast('Reproduciendo video (modo demostración)', 'success');
    }
  },

  openFull(item) {
    this.currentItem = item;
    const modal = document.getElementById('playerModal');
    document.getElementById('playerTitle').textContent = item.title;
    document.getElementById('playerType').textContent = item.type === 'video' ? 'Video' : 'Audio';
    const embed = document.getElementById('playerEmbed');

    if (item.type === 'video' && item.youtubeId) {
      embed.innerHTML = `
        <iframe
          width="560" height="315"
          src="https://www.youtube.com/embed/${item.youtubeId}?modestbranding=1&rel=0&showinfo=0&controls=1&autoplay=1"
          title="${item.title}"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowfullscreen
        ></iframe>
      `;
    } else {
      embed.innerHTML = `
        <div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#94a3b8;background:#000;border-radius:16px;">
          <div style="font-size:3rem;margin-bottom:1rem;">🎵</div>
          <div style="font-weight:700;">${this.escapeHtml(item.title)}</div>
          <div style="margin-top:0.5rem;color:#64748b;">Modo audio - demostración</div>
          <audio controls style="margin-top:1rem;width:80%;max-width:320px;">
            <source src="${item.previewUrl || ''}" type="audio/mpeg">
            Tu navegador no soporta audio.
          </audio>
        </div>
      `;
    }

    modal.classList.add('open');
  },

  close() {
    document.getElementById('playerModal').classList.remove('open');
    const embed = document.getElementById('playerEmbed');
    embed.innerHTML = '';
    if (this.audioEl) this.audioEl.pause();
  },

  addToPlaylist() {
    if (!this.currentItem) return;
    const user = window.__cpAuth.getUser();
    if (!user) {
      app.showToast('Inicia sesión para agregar a una playlist', 'warning');
      auth.toggleAuthModal();
      return;
    }
    const playlists = window.__cpStorage.getPlaylists();
    if (playlists.length === 0) {
      window.__cpStorage.addPlaylist('Mis Favoritos');
    }
    const defaultPlaylist = window.__cpStorage.getPlaylists()[0];
    window.__cpStorage.addToPlaylist(defaultPlaylist.id, this.currentItem);
    app.showToast('Agregado a tu playlist', 'success');
  },

  share() {
    if (!this.currentItem) return;
    const url = `${window.location.origin}/?v=${this.currentItem.id}`;
    if (navigator.share) {
      navigator.share({ title: this.currentItem.title, text: 'Mira este contenido cristiano en CristianPlay', url });
    } else {
      navigator.clipboard.writeText(url).then(() => {
        app.showToast('Enlace copiado al portapapeles', 'success');
      });
    }
  },

  toggleFullscreen() {
    const modal = document.getElementById('playerModal');
    const embed = document.getElementById('playerEmbed');
    const target = embed.querySelector('iframe') || embed;
    if (!target) return;

    if (!document.fullscreenElement) {
      target.requestFullscreen().catch(() => {
        modal.classList.add('fullscreen-modal');
      });
    } else {
      document.exitFullscreen().then(() => {
        modal.classList.remove('fullscreen-modal');
      });
    }
  },

  updateMiniPlayBtn() {
    const btn = document.getElementById('miniPlayPause');
    if (btn) btn.textContent = this.isPlaying ? '⏸' : '▶';
  },

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },
};

window.__cpPlayer = player;