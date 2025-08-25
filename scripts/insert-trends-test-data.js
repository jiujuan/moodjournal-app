import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to the database
const dbPath = path.join(__dirname, '..', 'data', 'mood_journal.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Prepare insert statement
const insertEntry = db.prepare(`
  INSERT INTO entries (emotion, notes, date)
  VALUES (?, ?, ?)
`);

// Define emotions and their corresponding notes
const emotionData = {
  happy: [
    '今天工作顺利，心情很好！',
    '和朋友聚餐，很开心',
    '完成了一个重要项目，感觉很有成就感',
    '天气很好，心情也跟着明朗起来'
  ],
  excited: [
    '明天要去旅行，超级兴奋！',
    '收到了好消息，激动不已',
    '新项目开始了，充满期待',
    '学会了新技能，很兴奋'
  ],
  content: [
    '平静的一天，感觉很满足',
    '生活节奏刚好，很舒适',
    '今天的工作很充实',
    '和家人度过了温馨的时光'
  ],
  peaceful: [
    '在公园散步，内心很平静',
    '冥想了一会儿，感觉很宁静',
    '读书的时候特别安静',
    '听音乐放松，心情平和'
  ],
  calm: [
    '处理问题时保持冷静',
    '今天没有什么特别的事，很平静',
    '瑜伽后感觉很放松',
    '深呼吸让我平静下来'
  ],
  frustrated: [
    '工作遇到了一些困难',
    '计划被打乱了，有点烦躁',
    '技术问题让我很头疼',
    '交通堵塞让我很烦躁'
  ],
  stressed: [
    '工作压力有点大',
    '截止日期临近，感觉压力山大',
    '要处理的事情太多了',
    '考试前的紧张感'
  ],
  anxious: [
    '对未来有些担忧',
    '面试前很紧张',
    '担心项目能否按时完成',
    '健康检查前有点焦虑'
  ],
  sad: [
    '今天心情有点低落',
    '想起了一些不开心的事',
    '天气阴沉，心情也跟着低落',
    '看了一部悲伤的电影'
  ],
  overwhelmed: [
    '事情太多，感觉应付不过来',
    '信息量太大，有点消化不了',
    '同时处理多个任务，感觉力不从心',
    '生活节奏太快，有点跟不上'
  ]
};

// Get current date and generate test data for the past 10 days
const today = new Date();
const testData = [];

for (let i = 9; i >= 0; i--) {
  const date = new Date(today);
  date.setDate(today.getDate() - i);
  const dateStr = date.toISOString().split('T')[0];
  
  // Generate 2-4 entries per day with different emotions
  const entriesPerDay = Math.floor(Math.random() * 3) + 2; // 2-4 entries
  
  for (let j = 0; j < entriesPerDay; j++) {
    // Select random emotion with weighted distribution
    const emotions = Object.keys(emotionData);
    let selectedEmotion;
    
    // Weight positive emotions more heavily for better visualization
    const random = Math.random();
    if (random < 0.4) {
      // 40% chance for positive emotions
      selectedEmotion = ['happy', 'excited', 'content', 'peaceful'][Math.floor(Math.random() * 4)];
    } else if (random < 0.7) {
      // 30% chance for neutral emotions
      selectedEmotion = ['calm'][0];
    } else {
      // 30% chance for negative emotions
      selectedEmotion = ['frustrated', 'stressed', 'anxious', 'sad', 'overwhelmed'][Math.floor(Math.random() * 5)];
    }
    
    // Select random note for the emotion
    const notes = emotionData[selectedEmotion];
    const selectedNote = notes[Math.floor(Math.random() * notes.length)];
    
    // Add some time variation to the date
    const entryDate = new Date(date);
    entryDate.setHours(Math.floor(Math.random() * 24));
    entryDate.setMinutes(Math.floor(Math.random() * 60));
    
    testData.push({
      emotion: selectedEmotion,
      notes: selectedNote,
      date: entryDate.toISOString()
    });
  }
}

// Insert test data
console.log('开始插入测试数据...');
console.log(`准备插入 ${testData.length} 条记录`);

try {
  const insertMany = db.transaction((entries) => {
    for (const entry of entries) {
      insertEntry.run(entry.emotion, entry.notes, entry.date);
    }
  });
  
  insertMany(testData);
  
  console.log('✅ 测试数据插入成功！');
  console.log('\n数据分布：');
  
  // Show data distribution
  const emotionCounts = {};
  testData.forEach(entry => {
    emotionCounts[entry.emotion] = (emotionCounts[entry.emotion] || 0) + 1;
  });
  
  Object.entries(emotionCounts).forEach(([emotion, count]) => {
    console.log(`${emotion}: ${count} 条记录`);
  });
  
  console.log('\n日期范围：');
  const dates = testData.map(entry => entry.date.split('T')[0]);
  const uniqueDates = [...new Set(dates)].sort();
  console.log(`从 ${uniqueDates[0]} 到 ${uniqueDates[uniqueDates.length - 1]}`);
  console.log(`共 ${uniqueDates.length} 天的数据`);
  
} catch (error) {
  console.error('❌ 插入数据时出错：', error);
} finally {
  db.close();
  console.log('\n数据库连接已关闭');
}