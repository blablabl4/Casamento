/* ================================================
   WEDDING SITE — Express Server + SQLite
   ================================================ */

const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- MIDDLEWARE ----------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// ---------- DATABASE ----------
const dbPath = path.join(__dirname, 'data', 'wedding.db');

// Ensure data directory exists
const fs = require('fs');
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS rsvp (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    presence TEXT NOT NULL CHECK(presence IN ('sim', 'nao')),
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS gifts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guest_name TEXT NOT NULL,
    gift_name TEXT NOT NULL,
    gift_emoji TEXT DEFAULT '',
    amount TEXT NOT NULL,
    confirmed INTEGER DEFAULT 0,
    notes TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS admin (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );
`);

// Create default admin if not exists
const adminExists = db.prepare('SELECT count(*) as c FROM admin').get();
if (adminExists.c === 0) {
    const hash = bcrypt.hashSync('casamento2026', 10);
    db.prepare('INSERT INTO admin (username, password_hash) VALUES (?, ?)').run('admin', hash);
}

// ---------- AUTH MIDDLEWARE ----------
function requireAdmin(req, res, next) {
    const token = req.headers['x-admin-token'];
    if (!token) return res.status(401).json({ error: 'Token obrigatório' });

    const session = db.prepare('SELECT token FROM sessions WHERE token = ?').get(token);
    if (!session) return res.status(401).json({ error: 'Sessão inválida' });

    next();
}

// ============================================
// PUBLIC API
// ============================================

// RSVP — Submit confirmation
app.post('/api/rsvp', (req, res) => {
    const { name, presence } = req.body;

    if (!name || !presence || !['sim', 'nao'].includes(presence)) {
        return res.status(400).json({ error: 'Nome e presença são obrigatórios.' });
    }

    // Check for duplicate
    const existing = db.prepare('SELECT id FROM rsvp WHERE LOWER(name) = LOWER(?)').get(name.trim());
    if (existing) {
        // Update existing
        db.prepare('UPDATE rsvp SET presence = ?, created_at = datetime("now", "localtime") WHERE id = ?')
            .run(presence, existing.id);
        return res.json({ success: true, message: 'Confirmação atualizada!', updated: true });
    }

    const result = db.prepare('INSERT INTO rsvp (name, presence) VALUES (?, ?)')
        .run(name.trim(), presence);

    res.json({ success: true, message: 'Confirmação registrada!', id: result.lastInsertRowid });
});

// Gift — Register contribution
app.post('/api/gifts', (req, res) => {
    const { guest_name, gift_name, gift_emoji, amount } = req.body;

    if (!guest_name || !gift_name || !amount) {
        return res.status(400).json({ error: 'Dados incompletos.' });
    }

    const result = db.prepare(
        'INSERT INTO gifts (guest_name, gift_name, gift_emoji, amount) VALUES (?, ?, ?, ?)'
    ).run(guest_name.trim(), gift_name, gift_emoji || '', amount);

    res.json({ success: true, id: result.lastInsertRowid });
});

// ============================================
// ADMIN API
// ============================================

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    const admin = db.prepare('SELECT * FROM admin WHERE username = ?').get(username);
    if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
        return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    db.prepare('INSERT INTO sessions (token) VALUES (?)').run(token);

    res.json({ success: true, token });
});

// Change password
app.post('/api/change-password', requireAdmin, (req, res) => {
    const { current_password, new_password } = req.body;

    const admin = db.prepare('SELECT * FROM admin WHERE id = 1').get();
    if (!bcrypt.compareSync(current_password, admin.password_hash)) {
        return res.status(400).json({ error: 'Senha atual incorreta.' });
    }

    const hash = bcrypt.hashSync(new_password, 10);
    db.prepare('UPDATE admin SET password_hash = ? WHERE id = 1').run(hash);

    res.json({ success: true });
});

// Dashboard stats
app.get('/api/stats', requireAdmin, (req, res) => {
    const total = db.prepare('SELECT count(*) as c FROM rsvp').get().c;
    const confirmed = db.prepare("SELECT count(*) as c FROM rsvp WHERE presence = 'sim'").get().c;
    const declined = db.prepare("SELECT count(*) as c FROM rsvp WHERE presence = 'nao'").get().c;
    const giftsCount = db.prepare('SELECT count(*) as c FROM gifts').get().c;
    const giftsConfirmed = db.prepare('SELECT count(*) as c FROM gifts WHERE confirmed = 1').get().c;

    // Recent RSVPs
    const recent = db.prepare('SELECT * FROM rsvp ORDER BY created_at DESC LIMIT 5').all();

    res.json({ total, confirmed, declined, giftsCount, giftsConfirmed, recent });
});

// RSVP list
app.get('/api/rsvp', requireAdmin, (req, res) => {
    const list = db.prepare('SELECT * FROM rsvp ORDER BY created_at DESC').all();
    res.json(list);
});

// Delete RSVP
app.delete('/api/rsvp/:id', requireAdmin, (req, res) => {
    db.prepare('DELETE FROM rsvp WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

// Gift list
app.get('/api/gifts', requireAdmin, (req, res) => {
    const list = db.prepare('SELECT * FROM gifts ORDER BY created_at DESC').all();
    res.json(list);
});

// Toggle gift confirmed
app.patch('/api/gifts/:id/confirm', requireAdmin, (req, res) => {
    const gift = db.prepare('SELECT confirmed FROM gifts WHERE id = ?').get(req.params.id);
    if (!gift) return res.status(404).json({ error: 'Presente não encontrado.' });

    const newVal = gift.confirmed ? 0 : 1;
    db.prepare('UPDATE gifts SET confirmed = ? WHERE id = ?').run(newVal, req.params.id);
    res.json({ success: true, confirmed: newVal });
});

// Delete gift
app.delete('/api/gifts/:id', requireAdmin, (req, res) => {
    db.prepare('DELETE FROM gifts WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

// Export RSVPs as CSV (uses query string token since it's a direct download)
app.get('/api/rsvp/export', (req, res) => {
    const token = req.query.token || req.headers['x-admin-token'];
    if (!token) return res.status(401).json({ error: 'Token obrigatório' });
    const session = db.prepare('SELECT token FROM sessions WHERE token = ?').get(token);
    if (!session) return res.status(401).json({ error: 'Sessão inválida' });

    const list = db.prepare('SELECT name, presence, created_at FROM rsvp ORDER BY name').all();
    let csv = 'Nome,Presença,Data\n';
    list.forEach((r) => {
        csv += `"${r.name}","${r.presence === 'sim' ? 'Confirmado' : 'Recusado'}","${r.created_at}"\n`;
    });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=lista-presenca.csv');
    res.send(csv);
});

// ---------- START ----------
app.listen(PORT, () => {
    console.log(`🎊  Wedding server running on http://localhost:${PORT}`);
    console.log(`📋  Admin panel: http://localhost:${PORT}/admin.html`);
    console.log(`🔑  Default login: admin / casamento2026`);
});
