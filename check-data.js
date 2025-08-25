import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to the database
const dbPath = path.join(__dirname, 'data', 'mood_journal.db');
console.log('Database path:', dbPath);

const db = new Database(dbPath);

// Check if database file exists and has data
try {
  // Check all entries
  const allEntries = db.prepare('SELECT * FROM entries ORDER BY date DESC').all();
  console.log('Total entries:', allEntries.length);
  
  if (allEntries.length > 0) {
    console.log('\nFirst 5 entries:');
    allEntries.slice(0, 5).forEach(entry => {
      console.log(`Date: ${entry.date}, Emotion: ${entry.emotion}, Notes: ${entry.notes}`);
    });
  }
  
  // Check specifically for 2025-08-22
  const targetDate = '2025-08-22';
  const targetEntries = db.prepare('SELECT * FROM entries WHERE date = ?').all(targetDate);
  console.log(`\nEntries for ${targetDate}:`, targetEntries.length);
  
  if (targetEntries.length > 0) {
    targetEntries.forEach(entry => {
      console.log(`- ${entry.emotion}: ${entry.notes}`);
    });
  }
  
  // Check date range around target date
  const rangeEntries = db.prepare('SELECT date, emotion FROM entries WHERE date BETWEEN ? AND ? ORDER BY date').all('2025-08-20', '2025-08-25');
  console.log('\nEntries between 2025-08-20 and 2025-08-25:');
  rangeEntries.forEach(entry => {
    console.log(`${entry.date}: ${entry.emotion}`);
  });
  
} catch (error) {
  console.error('Database error:', error);
} finally {
  db.close();
}