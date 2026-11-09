/**
 * CristianPlay - Capa de almacenamiento local (localStorage)
 * Versión 0.02
 */

const STORAGE_KEYS = {
  USER: 'cp_user_v1',
  PLAYLISTS: 'cp_playlists_v1',
  HISTORY: 'cp_history_v1',
  STATS: 'cp_stats_v1',
  ADMIN_EMAIL: 'cp_admin_email_v1',
};

// Email del administrador (cambia este valor por el que desees)
const ADMIN_EMAIL = 'admin@cristianplay.com';

const storage = {
  // --- Usuario ---
  getUser() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USER);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('Error reading user from storage', e);
      return null;
    }
  },
  setUser(user) {
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (e) {
      console.error('Error saving user to storage', e);
    }
  },
  clearUser() {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER);
    } catch (e) {
      console.error('Error clearing user from storage', e);
    }
  },

  // --- Playlists ---
  getPlaylists() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PLAYLISTS);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Error reading playlists', e);
      return [];
    }
  },
  savePlaylists(playlists) {
    try {
      localStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists));
    } catch (e) {
      console.error('Error saving playlists', e);
    }
  },
  addPlaylist(name) {
    const playlists = this.getPlaylists();
    const newPlaylist = {
      id: Date.now().toString(),
      name,
      createdAt: new Date().toISOString(),
      items: [],
    };
    playlists.push(newPlaylist);
    this.savePlaylists(playlists);
    return newPlaylist;
  },
  addToPlaylist(playlistId, item) {
    const playlists = this.getPlaylists();
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return null;
    const exists = playlist.items.some(i => i.id === item.id);
    if (exists) return playlist;
    playlist.items.push(item);
    this.savePlaylists(playlists);
    return playlist;
  },

  // --- Historial de reproducción ---
  getHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Error reading history', e);
      return [];
    }
  },
  addHistory(item) {
    const history = this.getHistory();
    const filtered = history.filter(h => h.id !== item.id);
    filtered.unshift({ ...item, playedAt: new Date().toISOString() });
    const trimmed = filtered.slice(0, 50);
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(trimmed));
    } catch (e) {
      console.error('Error saving history', e);
    }
  },

  // --- Estadísticas ---
  getStats() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.STATS);
      return raw ? JSON.parse(raw) : {
        totalUsers: 0,
        totalPlays: 0,
        totalVideosAdded: 0,
        lastUpdated: new Date().toISOString(),
      };
    } catch (e) {
      console.error('Error reading stats', e);
      return { totalUsers: 0, totalPlays: 0, totalVideosAdded: 0, lastUpdated: new Date().toISOString() };
    }
  },
  saveStats(stats) {
    try {
      stats.lastUpdated = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
    } catch (e) {
      console.error('Error saving stats', e);
    }
  },
  incrementPlays() {
    const stats = this.getStats();
    stats.totalPlays = (stats.totalPlays || 0) + 1;
    this.saveStats(stats);
  },
  incrementVideosAdded() {
    const stats = this.getStats();
    stats.totalVideosAdded = (stats.totalVideosAdded || 0) + 1;
    this.saveStats(stats);
  },

  // --- Ranking de videos más reproducidos ---
  getRanking() {
    try {
      const raw = localStorage.getItem('cp_ranking_v1');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },
  saveRanking(ranking) {
    try {
      localStorage.setItem('cp_ranking_v1', JSON.stringify(ranking));
    } catch (e) {
      console.error('Error saving ranking', e);
    }
  },
  addToRanking(item) {
    const ranking = this.getRanking();
    const existing = ranking.find(r => r.id === item.id);
    if (existing) {
      existing.count = (existing.count || 0) + 1;
      existing.lastPlayed = new Date().toISOString();
    } else {
      ranking.push({
        id: item.id,
        title: item.title,
        channel: item.channel,
        category: item.category,
        count: 1,
        lastPlayed: new Date().toISOString(),
      });
    }
    // Ordenar por count descendente
    ranking.sort((a, b) => (b.count || 0) - (a.count || 0));
    this.saveRanking(ranking);
  },

  // --- Admin ---
  isAdmin(user) {
    if (!user) return false;
    return user.email === ADMIN_EMAIL;
  },
  setAdminEmail(email) {
    try {
      localStorage.setItem(STORAGE_KEYS.ADMIN_EMAIL, email);
    } catch (e) {
      console.error('Error saving admin email', e);
    }
  },
  getAdminEmail() {
    try {
      return localStorage.getItem(STORAGE_KEYS.ADMIN_EMAIL) || ADMIN_EMAIL;
    } catch (e) {
      return ADMIN_EMAIL;
    }
  },
};

window.__cpStorage = storage;