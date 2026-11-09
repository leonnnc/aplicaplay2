/**
 * CristianPlay - Capa de almacenamiento local (localStorage)
 * Versión 0.01
 */

const STORAGE_KEYS = {
  USER: 'cp_user_v1',
  PLAYLISTS: 'cp_playlists_v1',
  HISTORY: 'cp_history_v1',
};

const storage = {
  // Usuario
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

  // Playlists
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

  // Historial
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
};

window.__cpStorage = storage;