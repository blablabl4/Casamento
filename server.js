/* ================================================
   WEDDING SITE — Express Server + SQLite
   ================================================ */

const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const multer = require('multer');
const sharp = require('sharp');

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
const uploadsDir = path.join(__dirname, 'uploads', 'photos');
const thumbsDir = path.join(__dirname, 'uploads', 'thumbs');
[path.join(__dirname, 'data'), uploadsDir, thumbsDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

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

  CREATE TABLE IF NOT EXISTS photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    thumb_filename TEXT NOT NULL,
    original_name TEXT,
    guest_name TEXT DEFAULT 'Anônimo',
    size INTEGER DEFAULT 0,
    width INTEGER DEFAULT 0,
    height INTEGER DEFAULT 0,
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

// ---------- PHOTO UPLOAD SYSTEM ----------

// Multer storage config
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname) || '.jpg';
        const name = `photo_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`;
        cb(null, name);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|heic|heif|webp|gif/i;
        const ext = path.extname(file.originalname).replace('.', '');
        const mime = file.mimetype.startsWith('image/');
        if (mime || allowed.test(ext)) cb(null, true);
        else cb(new Error('Apenas imagens são permitidas.'));
    }
});

// SSE clients for real-time gallery
const sseClients = new Set();

function broadcastPhoto(photo) {
    const data = JSON.stringify(photo);
    sseClients.forEach(res => {
        res.write(`data: ${data}\n\n`);
    });
}

// SSE stream endpoint
app.get('/api/photos/stream', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
    });
    res.write('\n');
    sseClients.add(res);
    req.on('close', () => sseClients.delete(res));
});

// Upload photo (public)
app.post('/api/photos', upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Nenhuma foto enviada.' });

        const guestName = (req.body.guest_name || 'Anônimo').trim();
        const filename = req.file.filename;
        const thumbFilename = `thumb_${filename.replace(path.extname(filename), '.webp')}`;

        // Generate thumbnail with sharp
        const meta = await sharp(req.file.path)
            .rotate() // auto-rotate based on EXIF
            .metadata();

        await sharp(req.file.path)
            .rotate()
            .resize(600, 600, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 80 })
            .toFile(path.join(thumbsDir, thumbFilename));

        const result = db.prepare(
            'INSERT INTO photos (filename, thumb_filename, original_name, guest_name, size, width, height) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).run(filename, thumbFilename, req.file.originalname, guestName, req.file.size, meta.width || 0, meta.height || 0);

        const photo = {
            id: result.lastInsertRowid,
            filename, thumb_filename: thumbFilename,
            guest_name: guestName,
            width: meta.width || 0, height: meta.height || 0,
            created_at: new Date().toISOString()
        };

        // Broadcast to connected telão clients
        broadcastPhoto(photo);

        res.json({ success: true, photo });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: 'Erro ao processar a foto.' });
    }
});

// List photos (public, for gallery)
app.get('/api/photos', (req, res) => {
    const list = db.prepare('SELECT * FROM photos ORDER BY created_at DESC').all();
    res.json(list);
});

// Serve uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Delete photo (admin)
app.delete('/api/photos/:id', requireAdmin, (req, res) => {
    const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(req.params.id);
    if (!photo) return res.status(404).json({ error: 'Foto não encontrada.' });

    // Delete files
    const photoPath = path.join(uploadsDir, photo.filename);
    const thumbPath = path.join(thumbsDir, photo.thumb_filename);
    if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
    if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);

    db.prepare('DELETE FROM photos WHERE id = ?').run(req.params.id);
    res.json({ success: true });
});

// Photo stats (admin)
app.get('/api/photos/stats', requireAdmin, (req, res) => {
    const total = db.prepare('SELECT count(*) as c FROM photos').get().c;
    const totalSize = db.prepare('SELECT COALESCE(SUM(size), 0) as s FROM photos').get().s;
    res.json({ total, totalSizeMB: (totalSize / (1024 * 1024)).toFixed(1) });
});

// ---------- START ----------
app.listen(PORT, () => {
    console.log(`🎊  Wedding server running on http://localhost:${PORT}`);
    console.log(`📋  Admin panel: http://localhost:${PORT}/admin.html`);
    console.log(`📸  Photo upload: http://localhost:${PORT}/fotos.html`);
    console.log(`📺  Telão: http://localhost:${PORT}/telao.html`);
    console.log(`🔑  Default login: admin / casamento2026`);
});
