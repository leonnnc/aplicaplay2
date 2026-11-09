/**
 * CristianPlay - Autenticación simulada (localStorage)
 * Versión 0.01
 *
 * NOTA: Esto es una simulación para el prototipo. En producción
 * conecta con Firebase Authentication, Auth0, Supabase Auth o tu propio backend.
 */

const auth = {
  isLoggedIn() {
    return !!window.__cpStorage.getUser();
  },

  getUser() {
    return window.__cpStorage.getUser();
  },

  toggleAuthModal() {
    const modal = document.getElementById('authModal');
    if (this.isLoggedIn()) {
      // Si ya está logueado, abrir panel de usuario
      app.openUserPanel();
      return;
    }
    modal.classList.toggle('open');
  },

  closeAuthModal() {
    document.getElementById('authModal').classList.remove('open');
  },

  switchTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(el => {
      el.classList.toggle('active', el.dataset.tab === tab);
    });
    document.getElementById('loginForm').classList.toggle('hidden', tab !== 'login');
    document.getElementById('registerForm').classList.toggle('hidden', tab !== 'register');
  },

  async handleLogin(event) {
    event.preventDefault();
    const email = event.target.querySelector('input[type="email"]').value;
    const password = event.target.querySelector('input[type="password"]').value;

    if (!email || !password) {
      this.showToast('Por favor completa todos los campos', 'warning');
      return;
    }

    // Simulación de login exitoso (en producción valida contra backend)
    const user = {
      id: 'user_' + Date.now(),
      name: email.split('@')[0],
      email,
      createdAt: new Date().toISOString(),
    };
    window.__cpStorage.setUser(user);
    this.updateUI();
    this.closeAuthModal();
    this.showToast(`Bienvenido, ${user.name}`, 'success');
  },

  async handleRegister(event) {
    event.preventDefault();
    const name = event.target.querySelector('input[type="text"]').value;
    const email = event.target.querySelector('input[type="email"]').value;
    const password = event.target.querySelector('input[type="password"]').value;
    const confirm = event.target.querySelectorAll('input[type="password"]')[1].value;

    if (!name || !email || !password) {
      this.showToast('Completa todos los campos', 'warning');
      return;
    }
    if (password !== confirm) {
      this.showToast('Las contraseñas no coinciden', 'warning');
      return;
    }

    const user = {
      id: 'user_' + Date.now(),
      name,
      email,
      createdAt: new Date().toISOString(),
    };
    window.__cpStorage.setUser(user);
    this.updateUI();
    this.closeAuthModal();
    this.showToast(`Cuenta creada para ${user.name}`, 'success');
  },

  logout() {
    window.__cpStorage.clearUser();
    this.updateUI();
    app.closeUserPanel();
    this.showToast('Sesión cerrada', 'success');
  },

  updateUI() {
    const user = this.getUser();
    const loginBtn = document.getElementById('loginBtn');
    const loginBtnText = document.getElementById('loginBtnText');
    const userBtn = document.getElementById('userBtn');
    const userBtnText = document.getElementById('userBtnText');

    if (user) {
      loginBtn.style.display = 'none';
      userBtn.style.display = 'flex';
      userBtnText.textContent = user.name;
    } else {
      loginBtn.style.display = 'flex';
      userBtn.style.display = 'none';
    }
  },

  showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const msg = document.getElementById('toastMessage');
    msg.textContent = message;
    toast.className = 'toast';
    if (type === 'success') {
      toast.style.borderLeft = `4px solid var(--success)`;
    } else if (type === 'warning') {
      toast.style.borderLeft = `4px solid var(--warning)`;
    } else if (type === 'danger') {
      toast.style.borderLeft = `4px solid var(--danger)`;
    }
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  },
};

// Inicializar UI de auth al cargar
document.addEventListener('DOMContentLoaded', () => {
  auth.updateUI();
});

window.__cpAuth = auth;