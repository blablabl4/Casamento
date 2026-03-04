/* ================================================
   ADMIN PANEL — JavaScript
   Login, Tabs, RSVP, Gifts, Settings
   ================================================ */

(function () {
    'use strict';

    let TOKEN = localStorage.getItem('admin_token') || '';

    // ---------- HELPERS ----------
    async function api(path, options = {}) {
        const headers = { 'Content-Type': 'application/json' };
        if (TOKEN) headers['x-admin-token'] = TOKEN;
        const res = await fetch(path, { ...options, headers });
        if (res.status === 401) {
            logout();
            throw new Error('Sessão expirada');
        }
        return res.json();
    }

    // ---------- LOGIN ----------
    const loginScreen = document.getElementById('login-screen');
    const adminApp = document.getElementById('admin-app');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');

    if (TOKEN) {
        showApp();
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginError.textContent = '';
        const username = document.getElementById('login-user').value;
        const password = document.getElementById('login-pass').value;

        try {
            const data = await api('/api/login', {
                method: 'POST',
                body: JSON.stringify({ username, password }),
            });
            if (data.token) {
                TOKEN = data.token;
                localStorage.setItem('admin_token', TOKEN);
                showApp();
            }
        } catch {
            loginError.textContent = 'Credenciais inválidas.';
        }
    });

    function showApp() {
        loginScreen.style.display = 'none';
        adminApp.style.display = 'flex';
        loadDashboard();
    }

    function logout() {
        TOKEN = '';
        localStorage.removeItem('admin_token');
        loginScreen.style.display = 'flex';
        adminApp.style.display = 'none';
    }

    document.getElementById('logout-btn').addEventListener('click', logout);

    // ---------- TABS ----------
    const tabButtons = document.querySelectorAll('.sidebar__link[data-tab]');
    const tabs = document.querySelectorAll('.tab');

    tabButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;

            tabButtons.forEach((b) => b.classList.remove('sidebar__link--active'));
            btn.classList.add('sidebar__link--active');

            tabs.forEach((t) => (t.style.display = 'none'));
            document.getElementById('tab-' + tabId).style.display = 'block';

            // Load data when tab is activated
            if (tabId === 'dashboard') loadDashboard();
            if (tabId === 'rsvp') loadRSVP();
            if (tabId === 'gifts') loadGifts();
            if (tabId === 'photos') loadPhotos();
        });
    });

    // ============================================
    // DASHBOARD
    // ============================================
    async function loadDashboard() {
        try {
            const stats = await api('/api/stats');

            document.getElementById('stat-confirmed').textContent = stats.confirmed;
            document.getElementById('stat-declined').textContent = stats.declined;
            document.getElementById('stat-total').textContent = stats.total;
            document.getElementById('stat-gifts').textContent = stats.giftsCount;

            const recentDiv = document.getElementById('recent-rsvps');
            if (stats.recent.length === 0) {
                recentDiv.innerHTML = '<p class="empty-state">Nenhuma confirmação ainda.</p>';
            } else {
                recentDiv.innerHTML = stats.recent.map((r) => `
          <div class="recent-item">
            <div>
              <span class="recent-item__name">${esc(r.name)}</span>
              <span class="badge ${r.presence === 'sim' ? 'badge--confirmed' : 'badge--declined'}" style="margin-left: 8px;">
                ${r.presence === 'sim' ? 'Confirmado' : 'Recusou'}
              </span>
            </div>
            <span class="recent-item__time">${formatDate(r.created_at)}</span>
          </div>
        `).join('');
            }
        } catch (err) {
            console.error(err);
        }
    }

    // ============================================
    // RSVP LIST
    // ============================================
    let allRsvps = [];
    let rsvpFilter = 'all';

    async function loadRSVP() {
        try {
            allRsvps = await api('/api/rsvp');
            renderRSVP();
        } catch (err) {
            console.error(err);
        }
    }

    function renderRSVP() {
        const filtered = rsvpFilter === 'all'
            ? allRsvps
            : allRsvps.filter((r) => r.presence === rsvpFilter);

        document.getElementById('rsvp-count').textContent = filtered.length + ' convidado' + (filtered.length !== 1 ? 's' : '');

        const tbody = document.getElementById('rsvp-tbody');
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-state">Nenhum registro encontrado.</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.map((r) => `
      <tr>
        <td style="color: var(--text-primary); font-weight: 500;">${esc(r.name)}</td>
        <td>
          <span class="badge ${r.presence === 'sim' ? 'badge--confirmed' : 'badge--declined'}">
            ${r.presence === 'sim' ? '✅ Confirmado' : '❌ Recusou'}
          </span>
        </td>
        <td>${formatDate(r.created_at)}</td>
        <td>
          <button class="btn-icon" onclick="deleteRSVP(${r.id})" title="Excluir">🗑️</button>
        </td>
      </tr>
    `).join('');
    }

    // Filters
    document.querySelectorAll('.filter-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('filter-btn--active'));
            btn.classList.add('filter-btn--active');
            rsvpFilter = btn.dataset.filter;
            renderRSVP();
        });
    });

    // Delete
    window.deleteRSVP = async function (id) {
        if (!confirm('Tem certeza que deseja excluir este registro?')) return;
        try {
            await api('/api/rsvp/' + id, { method: 'DELETE' });
            loadRSVP();
            loadDashboard();
        } catch (err) {
            console.error(err);
        }
    };

    // Export CSV
    document.getElementById('export-csv').addEventListener('click', () => {
        window.open('/api/rsvp/export?token=' + TOKEN);
    });

    // ============================================
    // GIFTS
    // ============================================
    async function loadGifts() {
        try {
            const gifts = await api('/api/gifts');
            document.getElementById('gifts-count').textContent = gifts.length + ' contribuiç' + (gifts.length !== 1 ? 'ões' : 'ão');

            const tbody = document.getElementById('gifts-tbody');
            if (gifts.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Nenhuma contribuição registrada.</td></tr>';
                return;
            }

            tbody.innerHTML = gifts.map((g) => `
        <tr>
          <td style="color: var(--text-primary); font-weight: 500;">${esc(g.guest_name)}</td>
          <td>${g.gift_emoji} ${esc(g.gift_name)}</td>
          <td style="color: var(--gold); font-weight: 600;">${esc(g.amount)}</td>
          <td>
            <button class="btn-icon" onclick="toggleGiftConfirm(${g.id})" title="Alterar status">
              ${g.confirmed ? '<span class="badge badge--confirmed">Confirmado</span>' : '<span class="badge badge--pending">Pendente</span>'}
            </button>
          </td>
          <td>${formatDate(g.created_at)}</td>
          <td>
            <button class="btn-icon" onclick="deleteGift(${g.id})" title="Excluir">🗑️</button>
          </td>
        </tr>
      `).join('');
        } catch (err) {
            console.error(err);
        }
    }

    window.toggleGiftConfirm = async function (id) {
        try {
            await api('/api/gifts/' + id + '/confirm', { method: 'PATCH' });
            loadGifts();
        } catch (err) {
            console.error(err);
        }
    };

    window.deleteGift = async function (id) {
        if (!confirm('Excluir esta contribuição?')) return;
        try {
            await api('/api/gifts/' + id, { method: 'DELETE' });
            loadGifts();
        } catch (err) {
            console.error(err);
        }
    };

    // ============================================
    // SETTINGS
    // ============================================
    document.getElementById('password-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const feedback = document.getElementById('pass-feedback');
        const current = document.getElementById('current-pass').value;
        const newPass = document.getElementById('new-pass').value;

        if (newPass.length < 4) {
            feedback.textContent = 'A nova senha deve ter pelo menos 4 caracteres.';
            feedback.className = 'feedback feedback--error';
            return;
        }

        try {
            const data = await api('/api/change-password', {
                method: 'POST',
                body: JSON.stringify({ current_password: current, new_password: newPass }),
            });
            if (data.success) {
                feedback.textContent = 'Senha alterada com sucesso!';
                feedback.className = 'feedback feedback--success';
                document.getElementById('current-pass').value = '';
                document.getElementById('new-pass').value = '';
            }
        } catch {
            feedback.textContent = 'Senha atual incorreta.';
            feedback.className = 'feedback feedback--error';
        }
    });

    // ============================================
    // PHOTOS
    // ============================================
    async function loadPhotos() {
        try {
            const [photos, stats] = await Promise.all([
                api('/api/photos'),
                api('/api/photos/stats')
            ]);

            document.getElementById('photos-count').textContent = stats.total + ' foto' + (stats.total !== 1 ? 's' : '');
            document.getElementById('photos-size').textContent = stats.totalSizeMB + ' MB';

            const grid = document.getElementById('photos-grid');
            if (photos.length === 0) {
                grid.innerHTML = '<p class="empty-state">Nenhuma foto enviada ainda.</p>';
                return;
            }

            grid.innerHTML = photos.map((p) => `
                <div style="position:relative; aspect-ratio:1; overflow:hidden; background:var(--bg-hover);">
                    <img src="/uploads/thumbs/${p.thumb_filename}" alt="" style="width:100%; height:100%; object-fit:cover; display:block;" loading="lazy" />
                    <div style="position:absolute; bottom:0; left:0; right:0; padding:4px 6px; background:linear-gradient(transparent, rgba(0,0,0,0.6));">
                        <span style="color:white; font-size:0.65rem;">${esc(p.guest_name || 'Anônimo')}</span>
                    </div>
                    <button class="btn-icon" onclick="deletePhoto(${p.id})" title="Excluir" style="position:absolute; top:4px; right:4px; background:rgba(0,0,0,0.5); color:white; border-radius:50%; width:24px; height:24px; display:flex; align-items:center; justify-content:center; font-size:0.7rem; opacity:0.7;">🗑️</button>
                </div>
            `).join('');
        } catch (err) {
            console.error(err);
        }
    }

    window.deletePhoto = async function (id) {
        if (!confirm('Excluir esta foto?')) return;
        try {
            await api('/api/photos/' + id, { method: 'DELETE' });
            loadPhotos();
        } catch (err) {
            console.error(err);
        }
    };

    // ---------- UTILS ----------
    function esc(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function formatDate(dateStr) {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
            + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }

})();
