const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class Settings {
  constructor() {
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    this.db = new Database(path.join(dataDir, 'settings.db'));
    this.db.pragma('journal_mode = WAL');
    this.init();
  }

  init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
      
      CREATE TABLE IF NOT EXISTS post_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        blog_id TEXT UNIQUE,
        title TEXT,
        link TEXT,
        status TEXT,
        posted_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS pending_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        blog_id TEXT UNIQUE,
        title TEXT,
        link TEXT,
        image_url TEXT,
        excerpt TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const defaults = {
      mode: 'quote',
      show_image: 'true',
      check_interval: '5',
      tutorial_link: process.env.DEFAULT_TUTORIAL_LINK || 'https://t.me/animethic2/195',
      blog_url: process.env.BLOG_URL || 'https://www.animethic.in',
      channel_id: process.env.CHANNEL_ID || '-1002225247609',
      last_check: '0',
      post_mode: 'auto'
    };

    const insert = this.db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
    for (const [key, value] of Object.entries(defaults)) {
      insert.run(key, value);
    }
  }

  get(key) {
    const row = this.db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    return row ? row.value : null;
  }

  set(key, value) {
    this.db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, String(value));
  }

  getAll() {
    const rows = this.db.prepare('SELECT * FROM settings').all();
    const obj = {};
    rows.forEach(r => obj[r.key] = r.value);
    return obj;
  }

  isPosted(blogId) {
    if (!blogId) return false;
    const row = this.db.prepare('SELECT id FROM post_log WHERE blog_id = ?').get(blogId);
    return !!row;
  }

  addPostLog(blogId, title, link, status) {
    if (!blogId) return;
    try {
      this.db.prepare('INSERT OR IGNORE INTO post_log (blog_id, title, link, status) VALUES (?, ?, ?, ?)')
        .run(blogId, title, link, status);
      console.log(`📝 Logged: ${title}`);
    } catch (e) {
      console.error('Log error:', e.message);
    }
  }

  getPendingPosts() {
    return this.db.prepare('SELECT * FROM pending_posts ORDER BY created_at DESC LIMIT 10').all();
  }

  addPendingPost(post) {
    if (!post.blogId) return;
    this.db.prepare('INSERT OR IGNORE INTO pending_posts (blog_id, title, link, image_url, excerpt) VALUES (?, ?, ?, ?, ?)')
      .run(post.blogId, post.title, post.link, post.imageUrl || null, post.excerpt || '');
  }

  removePendingPost(blogId) {
    this.db.prepare('DELETE FROM pending_posts WHERE blog_id = ?').run(blogId);
  }

  getRecentLogs(limit = 10) {
    return this.db.prepare('SELECT * FROM post_log ORDER BY posted_at DESC LIMIT ?').all(limit);
  }

  getStats() {
    const today = new Date().toISOString().split('T')[0];
    const total = this.db.prepare("SELECT COUNT(*) as count FROM post_log WHERE date(posted_at) = ?").get(today);
    const autoPosted = this.db.prepare("SELECT COUNT(*) as count FROM post_log WHERE status = 'auto' AND date(posted_at) = ?").get(today);
    const manualPosted = this.db.prepare("SELECT COUNT(*) as count FROM post_log WHERE status = 'manual' AND date(posted_at) = ?").get(today);
    const pending = this.db.prepare("SELECT COUNT(*) as count FROM pending_posts").get();
    
    return {
      todayTotal: total?.count || 0,
      todayAuto: autoPosted?.count || 0,
      todayManual: manualPosted?.count || 0,
      pending: pending?.count || 0
    };
  }

  close() {
    this.db.close();
  }
}

module.exports = Settings;
