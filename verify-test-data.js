import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'data', 'mood_journal.db');
const db = new Database(dbPath);

function verifyTestData() {
  console.log('验证测试数据...');
  
  // 查询12月20-24日的数据
  const query = `
    SELECT 
      DATE(date) as day,
      emotion,
      notes,
      date,
      created_at
    FROM entries 
    WHERE DATE(date) BETWEEN '2024-12-20' AND '2024-12-24'
    ORDER BY date, created_at
  `;
  
  const entries = db.prepare(query).all();
  
  console.log(`\n找到 ${entries.length} 条测试数据记录:`);
  console.log('=' .repeat(80));
  
  // 按日期分组显示
  const groupedByDate = {};
  entries.forEach(entry => {
    const day = entry.day;
    if (!groupedByDate[day]) {
      groupedByDate[day] = [];
    }
    groupedByDate[day].push(entry);
  });
  
  Object.keys(groupedByDate).sort().forEach(day => {
    console.log(`\n📅 ${day} (${groupedByDate[day].length} 条记录):`);
    groupedByDate[day].forEach((entry, index) => {
      console.log(`  ${index + 1}. 情绪: ${entry.emotion}`);
      console.log(`     备注: ${entry.notes || '无'}`);
      console.log(`     时间: ${entry.date}`);
      console.log('');
    });
  });
  
  // 验证Trends页面需要的数据格式
  console.log('\n验证Trends页面数据格式:');
  console.log('=' .repeat(50));
  
  const trendsQuery = `
    SELECT 
      DATE(date) as day,
      emotion,
      COUNT(*) as count,
      AVG(CASE 
        WHEN emotion = 'happy' THEN 5
        WHEN emotion = 'excited' THEN 4
        WHEN emotion = 'calm' THEN 3
        WHEN emotion = 'anxious' THEN 2
        WHEN emotion = 'sad' THEN 1
        ELSE 3
      END) as avg_mood
    FROM entries 
    WHERE DATE(date) BETWEEN '2024-12-20' AND '2024-12-24'
    GROUP BY DATE(date), emotion
    ORDER BY day
  `;
  
  const trendsData = db.prepare(trendsQuery).all();
  
  trendsData.forEach(trend => {
    console.log(`日期: ${trend.day}, 情绪: ${trend.emotion}, 数量: ${trend.count}, 平均心情: ${trend.avg_mood.toFixed(1)}`);
  });
  
  console.log('\n✅ 数据验证完成!');
}

// 运行验证
try {
  verifyTestData();
} catch (error) {
  console.error('验证过程中出错:', error);
} finally {
  db.close();
}