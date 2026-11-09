/**
 * CristianPlay - Reproductor de video integrado
 * Versión 0.06
 */
const player = {
  currentItem: null,
  init() {},
  play(item) { this.currentItem = item; window.__cpStorage.addHistory(item); },
  escapeHtml(t){ if(!t) return ''; const d=document.createElement('div'); d.textContent=t; return d.innerHTML; },
};
window.__cpPlayer = player;