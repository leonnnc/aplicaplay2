/**
 * CristianPlay - Autenticación simulada
 * Versión 0.06
 */
const auth = {
  isLoggedIn() { return !!window.__cpStorage.getUser(); },
  getUser() { return window.__cpStorage.getUser(); },
  isAdmin() { return window.__cpStorage.isAdmin(this.getUser()); },

  toggleAuthModal() {
    const m = document.getElementById('authModal');
    if (this.isLoggedIn()) { app.openUserPanel(); return; }
    m.classList.toggle('open');
  },
  closeAuthModal() { document.getElementById('authModal').classList.remove('open'); },
  switchTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(el => el.classList.toggle('active', el.dataset.tab === tab));
    document.getElementById('loginForm').classList.toggle('hidden', tab !== 'login');
    document.getElementById('registerForm').classList.toggle('hidden', tab !== 'register');
  },
  async handleLogin(e) {
    e.preventDefault();
    const email = e.target.querySelector('input[type="email"]').value;
    const password = e.target.querySelector('input[type="password"]').value;
    if (!email || !password) { this.showToast('Completa todos los campos','warning'); return; }
    const u = { id: 'user_'+Date.now(), name: email.split('@')[0], email, createdAt: new Date().toISOString() };
    window.__cpStorage.setUser(u);
    const s = window.__cpStorage.getStats(); s.totalUsers = (s.totalUsers||0)+1; window.__cpStorage.saveStats(s);
    this.updateUI(); this.closeAuthModal(); this.showToast(`Bienvenido, ${u.name}`,'success');
  },
  async handleRegister(e) {
    e.preventDefault();
    const name = e.target.querySelector('input[type="text"]').value;
    const email = e.target.querySelector('input[type="email"]').value;
    const p1 = e.target.querySelector('input[type="password"]').value;
    const p2 = e.target.querySelectorAll('input[type="password"]')[1].value;
    if (!name || !email || !p1) { this.showToast('Completa todos los campos','warning'); return; }
    if (p1 !== p2) { this.showToast('Las contraseñas no coinciden','warning'); return; }
    const u = { id: 'user_'+Date.now(), name, email, createdAt: new Date().toISOString() };
    window.__cpStorage.setUser(u);
    const s = window.__cpStorage.getStats(); s.totalUsers = (s.totalUsers||0)+1; window.__cpStorage.saveStats(s);
    this.updateUI(); this.closeAuthModal(); this.showToast(`Cuenta creada para ${u.name}`,'success');
  },
  logout() {
    window.__cpStorage.clearUser(); this.updateUI();
    app.closeUserPanel(); app.closeAdminPanel();
    this.showToast('Sesión cerrada','success');
  },
  updateUI() {
    const u = this.getUser();
    document.getElementById('loginBtn').style.display = u ? 'none' : 'flex';
    document.getElementById('userBtn').style.display = u ? 'flex' : 'none';
    document.getElementById('loginBtnText').textContent = u ? u.name : 'Iniciar sesión';
    document.getElementById('userBtnText').textContent = u ? u.name : 'Mi cuenta';
  },
  showToast(message, type='success') {
    const t = document.getElementById('toast'); const m = document.getElementById('toastMessage');
    m.textContent = message; t.className='toast';
    if (type==='success') t.style.borderLeft='4px solid var(--success)';
    else if (type==='warning') t.style.borderLeft='4px solid var(--warning)';
    else if (type==='danger') t.style.borderLeft='4px solid var(--danger)';
    else if (type==='info') t.style.borderLeft='4px solid var(--secondary)';
    t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),3000);
  },
};

document.addEventListener('DOMContentLoaded', () => auth.updateUI());
window.__cpAuth = auth;