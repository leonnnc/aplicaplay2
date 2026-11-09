/**
 * CristianPlay - Reproductor de video integrado
 * Versión 0.02
 *
 * Solo video de YouTube embebido en la misma página. Sin audio, sin modal.
 */

const player = {
  currentItem: null,

  init() {
    // No hay elemento de audio; todo es video embebido en iframes de YouTube
  },

  play(item) {
    this.currentItem = item;
    window.__cpStorage.addHistory(item);
  },

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },
};

window.__cpPlayer = player;