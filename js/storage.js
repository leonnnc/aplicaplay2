/**
 * CristianPlay - Almacenamiento local (localStorage)
 * Versión 0.06
 */
const STORAGE_KEYS = {
  USER: 'cp_user_v1',
  PLAYLISTS: 'cp_playlists_v1',
  HISTORY: 'cp_history_v1',
  STATS: 'cp_stats_v1',
  ADMIN_EMAIL: 'cp_admin_email_v1',
};
const ADMIN_EMAIL = 'admin@cristianplay.com';

const storage = {
  getUser() { try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || 'null'); } catch(e){ return null; } },
  setUser(u) { try { localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(u)); } catch(e){} },
  clearUser() { try { localStorage.removeItem(STORAGE_KEYS.USER); } catch(e){} },

  getPlaylists() { try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.PLAYLISTS) || '[]'); } catch(e){ return []; } },
  savePlaylists(p) { try { localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(p)); } catch(e){} },
  addPlaylist(name) {
    const p = this.getPlaylists();
    const np = { id: Date.now().toString(), name, createdAt: new Date().toISOString(), items: [] };
    p.push(np); this.savePlaylists(p); return np;
  },
  addToPlaylist(pid, item) {
    const p = this.getPlaylists(); const pl = p.find(x => x.id === pid);
    if (!pl) return null; if (pl.items.some(i => i.id === item.id)) return pl;
    pl.items.push(item); this.savePlaylists(p); return pl;
  },

  getHistory() { try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY) || '[]'); } catch(e){ return []; } },
  addHistory(item) {
    const h = this.getHistory(); const f = h.filter(x => x.id !== item.id);
    f.unshift({ ...item, playedAt: new Date().toISOString() });
    try { localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(f.slice(0,50))); } catch(e){}
  },

  getStats() { try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.STATS) || '{"totalUsers":0,"totalPlays":0,"totalVideosAdded":0,"lastUpdated":""}'); } catch(e){ return { totalUsers:0,totalPlays:0,totalVideosAdded:0,lastUpdated:'' }; } },
  saveStats(s) { try { s.lastUpdated = new Date().toISOString(); localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(s)); } catch(e){} },
  incrementPlays() { const s = this.getStats(); s.totalPlays = (s.totalPlays||0)+1; this.saveStats(s); },
  incrementVideosAdded() { const s = this.getStats(); s.totalVideosAdded = (s.totalVideosAdded||0)+1; this.saveStats(s); },

  getRanking() { try { return JSON.parse(localStorage.getItem('cp_ranking_v1') || '[]'); } catch(e){ return []; } },
  saveRanking(r) { try { localStorage.setItem('cp_ranking_v1', JSON.stringify(r)); } catch(e){} },
  addToRanking(item) {
    const r = this.getRanking(); const ex = r.find(x => x.id === item.id);
    if (ex) { ex.count = (ex.count||0)+1; ex.lastPlayed = new Date().toISOString(); }
    else r.push({ id: item.id, title: item.title, channel: item.channel, category: item.category, count: 1, lastPlayed: new Date().toISOString() });
    r.sort((a,b) => (b.count||0)-(a.count||0)); this.saveRanking(r);
  },

  isAdmin(u) { return !!u && u.email === ADMIN_EMAIL; },
  getAdminEmail() { try { return localStorage.getItem(STORAGE_KEYS.ADMIN_EMAIL) || ADMIN_EMAIL; } catch(e){ return ADMIN_EMAIL; } },
};

window.__cpStorage = storage;