import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'mood_journal.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
export function initDatabase() {
  // Create entries table
  db.exec(`
    CREATE TABLE IF NOT EXISTS entries (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      emotion TEXT NOT NULL CHECK (emotion IN ('happy', 'sad', 'anxious', 'calm', 'excited', 'stressed', 'peaceful', 'frustrated', 'content', 'overwhelmed')),
      notes TEXT,
      date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Create indexes for better query performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(date DESC);
    CREATE INDEX IF NOT EXISTS idx_entries_emotion ON entries(emotion);
    CREATE INDEX IF NOT EXISTS idx_entries_created_at ON entries(created_at DESC);
  `);

  // Create trigger to update updated_at timestamp
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_entries_timestamp 
      AFTER UPDATE ON entries
      FOR EACH ROW
      BEGIN
        UPDATE entries SET updated_at = datetime('now') WHERE id = NEW.id;
      END;
  `);

  // Create media files table
  db.exec(`
    CREATE TABLE IF NOT EXISTS media_files (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      entry_id TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_type TEXT NOT NULL CHECK (file_type IN ('photo', 'voice')),
      file_size INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (entry_id) REFERENCES entries (id) ON DELETE CASCADE
    );
  `);

  // Create indexes for media files
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_media_files_entry_id ON media_files(entry_id);
    CREATE INDEX IF NOT EXISTS idx_media_files_type ON media_files(file_type);
  `);

  // Create user settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Insert default settings if they don't exist
  const defaultSettings = [
    ['theme', 'light'],
    ['notifications_enabled', 'true'],
    ['reminder_time', '20:00'],
    ['first_day_of_week', '0'],
    ['data_retention_days', '365']
  ];

  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO user_settings (key, value) VALUES (?, ?)
  `);

  for (const [key, value] of defaultSettings) {
    insertSetting.run(key, value);
  }

  // Create views for analytics
  db.exec(`
    CREATE VIEW IF NOT EXISTS daily_mood_summary AS
    SELECT 
      DATE(date) as day,
      emotion,
      COUNT(*) as entry_count,
      GROUP_CONCAT(notes, ' ') as combined_notes
    FROM entries 
    GROUP BY DATE(date), emotion
    ORDER BY day DESC;
  `);

  db.exec(`
    CREATE VIEW IF NOT EXISTS emotion_stats AS
    SELECT 
      emotion,
      COUNT(*) as total_count,
      ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM entries), 2) as percentage,
      DATE(MIN(date)) as first_occurrence,
      DATE(MAX(date)) as last_occurrence
    FROM entries 
    GROUP BY emotion
    ORDER BY total_count DESC;
  `);

  console.log('Database initialized successfully');
}

// Initialize the database
initDatabase();

// Prepared statements for common operations
export const statements = {
  // Entry operations
  insertEntry: db.prepare(`
    INSERT INTO entries (emotion, notes, date)
    VALUES (?, ?, ?)
  `),
  
  getEntries: db.prepare(`
    SELECT * FROM entries
    ORDER BY date DESC
    LIMIT ? OFFSET ?
  `),
  
  getEntryById: db.prepare(`
    SELECT * FROM entries WHERE id = ?
  `),
  
  updateEntry: db.prepare(`
    UPDATE entries 
    SET emotion = ?, notes = ?, date = ?, updated_at = datetime('now')
    WHERE id = ?
  `),
  
  deleteEntry: db.prepare(`
    DELETE FROM entries WHERE id = ?
  `),
  
  getEntriesByDateRange: db.prepare(`
    SELECT * FROM entries
    WHERE date BETWEEN ? AND ?
    ORDER BY date DESC
  `),
  
  getEntriesByEmotion: db.prepare(`
    SELECT * FROM entries
    WHERE emotion = ?
    ORDER BY date DESC
  `),
  
  // Media file operations
  insertMediaFile: db.prepare(`
    INSERT INTO media_files (entry_id, file_path, file_type, file_size)
    VALUES (?, ?, ?, ?)
  `),
  
  getMediaFilesByEntry: db.prepare(`
    SELECT * FROM media_files WHERE entry_id = ?
  `),
  
  getMediaFileById: db.prepare(`
    SELECT * FROM media_files WHERE id = ?
  `),
  
  deleteMediaFile: db.prepare(`
    DELETE FROM media_files WHERE id = ?
  `),
  
  // Analytics queries
  getEmotionStats: db.prepare(`
    SELECT * FROM emotion_stats
  `),
  
  getDailyMoodSummary: db.prepare(`
    SELECT * FROM daily_mood_summary
    WHERE day BETWEEN ? AND ?
  `),
  
  getMoodTrends: db.prepare(`
    SELECT 
      DATE(date) as date,
      AVG(
        CASE emotion
          WHEN 'happy' THEN 5
          WHEN 'excited' THEN 5
          WHEN 'content' THEN 4
          WHEN 'peaceful' THEN 4
          WHEN 'calm' THEN 3
          WHEN 'frustrated' THEN 2
          WHEN 'stressed' THEN 2
          WHEN 'anxious' THEN 1
          WHEN 'sad' THEN 1
          WHEN 'overwhelmed' THEN 1
          ELSE 3
        END
      ) as avg_mood,
      COUNT(*) as entry_count
    FROM entries
    WHERE date BETWEEN ? AND ?
    GROUP BY DATE(date)
    ORDER BY date ASC
  `),
  
  // Settings operations
  getSetting: db.prepare(`
    SELECT value FROM user_settings WHERE key = ?
  `),
  
  setSetting: db.prepare(`
    INSERT OR REPLACE INTO user_settings (key, value, updated_at)
    VALUES (?, ?, datetime('now'))
  `),
  
  getAllSettings: db.prepare(`
    SELECT * FROM user_settings
  `)
};

export default db;