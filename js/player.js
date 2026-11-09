/**
 * CristianPlay - Reproductor de música y video
 * Versión 0.02
 *
 * Controla el elemento de audio y exp métodos básicos.
 * El reproductor integrado (video/audio) es renderizado por app.js sin modal.
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
    });
    this.audioEl.addEventListener('pause', () => {
      this.isPlaying = false;
    });
    this.audioEl.addEventListener('ended', () => {
      this.isPlaying = false;
    });
  },

  play(item) {
    this.currentItem = item;
    window.__cpStorage.addHistory(item);

    if (item.type === 'audio') {
      // Modo audio: preparar el elemento de audio para reproducir
      this.audioEl.pause();
      this.audioEl.src = '';
      this.isPlaying = false;
      // Nota: en modo demostración no hay URL de audio real;
      // el control de audio se muestra dentro del reproductor integrado.
      app.showToast('Reproduciendo audio (modo demostración)', 'success');
    } else {
      app.showToast('Reproduciendo video (modo demostración)', 'success');
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