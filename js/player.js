/**
 * CristianPlay - Reproductor de música y video
 * Versión 0.01
 *
 * Permite reproducir contenido simulado y abrir en YouTube.
 * En producción, integra YouTube IFrame Player API o YouTube Data API.
 */

const player = {
  currentItem: null,
  audioEl: null,
  isPlaying: false,

  init() {
    // Crear elemento de audio oculto para modo sonido
    this.audioEl = new Audio();
    this.audioEl.preload = 'metadata';

    this.audioEl.addEventListener('play', () => { this.isPlaying = true; this.updateMiniPlayBtn(); });
    this.audioEl.addEventListener('pause', () => { this.isPlaying = false; this.updateMiniPlayBtn(); });
    this.audioEl.addEventListener('ended', () => { this.isPlaying = false; this.updateMiniPlayBtn(); });

    // Eventos mini player
    document.getElementById('miniPlayPause').addEventListener('click', () => this.togglePlayPause());
    document.getElementById('miniPrev').addEventListener('click', () => app.showToast('Anterior - función en próxima versión', 'warning'));
    document.getElementById('miniNext').addEventListener('click', () => app.showToast('Siguiente - función en próxima versión', 'warning'));
    // miniExpand se inicializa también desde app.init(); se deja aquí como respaldo
    document.getElementById('miniExpand').addEventListener('click', () => {
      if (this.currentItem) this.openFull(this.currentItem);
    });
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
        if (e.target === overlay) {
          overlay.classList.remove('open');
        }
      });
    });
  },

  play(item) {
    this.currentItem = item;
    window.__cpStorage.addHistory(item);
    this.updateMiniPlayer(item);
    document.getElementById('miniPlayer').style.display = 'flex';

    if (item.type === 'audio') {
      this.openFull(item);
      // Simular reproducción de audio (en producción sería una URL real de audio)
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

    // Si es video, embed de YouTube. Si es audio, placeholder con controles de audio.
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
          <div style="font-weight:700;">${item.title}</div>
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

  openInYoutube() {
    if (!this.currentItem || !this.currentItem.youtubeId) return;
    window.open(`https://www.youtube.com/watch?v=${this.currentItem.youtubeId}`, '_blank');
  },

  toggleFullscreen() {
    const modal = document.getElementById('playerModal');
    const embed = document.getElementById('playerEmbed');
    const target = embed.querySelector('iframe') || embed;
    if (!target) return;

    if (!document.fullscreenElement) {
      target.requestFullscreen().catch(() => {
        // Fallback: maximizar el modal
        modal.classList.add('fullscreen-modal');
      });
    } else {
      document.exitFullscreen().then(() => {
        modal.classList.remove('fullscreen-modal');
      });
    }
  },

  updateMiniPlayer(item) {
    document.getElementById('miniTitle').textContent = item.title;
    document.getElementById('miniArtist').textContent = `${item.channel} • ${item.category}`;
    this.updateMiniPlayBtn();
  },

  togglePlayPause() {
    if (!this.currentItem) return;
    if (this.isPlaying && this.audioEl) {
      this.audioEl.pause();
    } else {
      app.showToast('Reproducción simulada - en la versión completa se conectará al stream de audio', 'info');
    }
  },

  updateMiniPlayBtn() {
    const btn = document.getElementById('miniPlayPause');
    btn.textContent = this.isPlaying ? '⏸' : '▶';
  },

  setCurrent(item) {
    this.currentItem = item;
  },
};

let currentItem = null;
Object.defineProperty(player, 'currentItemProxy', {
  get() { return currentItem; },
  set(v) { currentItem = v; player.currentItem = v; },
});

window.__cpPlayer = player;