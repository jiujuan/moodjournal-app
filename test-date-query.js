import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to the database
const dbPath = path.join(__dirname, 'data', 'mood_journal.db');
const db = new Database(dbPath);

try {
  const targetDate = '2025-08-22';
  const nextDate = new Date(targetDate);
  nextDate.setDate(nextDate.getDate() + 1);
  const nextDateStr = nextDate.toISOString().split('T')[0]; // '2025-08-23'
  
  console.log('Target date:', targetDate);
  console.log('Next date:', nextDateStr);
  
  // Test the exact query used in the API
  const getEntriesByDateRange = db.prepare(`
    SELECT * FROM entries
    WHERE date BETWEEN ? AND ?
    ORDER BY date DESC
  `);
  
  const entries = getEntriesByDateRange.all(targetDate, nextDateStr);
  console.log('\nEntries found with BETWEEN query:', entries.length);
  
  if (entries.length > 0) {
    entries.forEach(entry => {
      console.log(`- Date: ${entry.date}, Emotion: ${entry.emotion}`);
    });
  }
  
  // Test with DATE() function
  const dateQuery = db.prepare(`
    SELECT * FROM entries
    WHERE DATE(date) = ?
    ORDER BY date DESC
  `);
  
  const dateEntries = dateQuery.all(targetDate);
  console.log('\nEntries found with DATE() function:', dateEntries.length);
  
  if (dateEntries.length > 0) {
    dateEntries.forEach(entry => {
      console.log(`- Date: ${entry.date}, Emotion: ${entry.emotion}`);
    });
  }
  
  // Test with LIKE pattern
  const likeQuery = db.prepare(`
    SELECT * FROM entries
    WHERE date LIKE ?
    ORDER BY date DESC
  `);
  
  const likeEntries = likeQuery.all(targetDate + '%');
  console.log('\nEntries found with LIKE pattern:', likeEntries.length);
  
  if (likeEntries.length > 0) {
    likeEntries.forEach(entry => {
      console.log(`- Date: ${entry.date}, Emotion: ${entry.emotion}`);
    });
  }
  
} catch (error) {
  console.error('Database error:', error);
} finally {
  db.close();
}