import { statements } from '../api/database.ts';

// 测试数据：包含多样化的情绪和包含关键词的notes
const testEntries = [
  // 最近7天的数据 - 用于Daily Emotions图表
  {
    emotion: 'happy',
    notes: '今天工作进展顺利，完成了重要的项目milestone。团队合作很愉快，感觉很有成就感。',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 昨天
  },
  {
    emotion: 'excited',
    notes: '收到了心仪公司的面试邀请！准备充分迎接新的挑战和机会。',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    emotion: 'content',
    notes: '和朋友一起喝咖啡聊天，分享了最近的生活感悟。友谊让人感到温暖。',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 前天
  },
  {
    emotion: 'calm',
    notes: '早晨做了瑜伽和冥想，身心都得到了很好的放松。内心平静祥和。',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    emotion: 'stressed',
    notes: '工作deadline临近，任务繁重。需要更好地管理时间和优先级。',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3天前
  },
  {
    emotion: 'frustrated',
    notes: '遇到了技术bug，调试了很久才找到问题根源。学习是个持续的过程。',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    emotion: 'peaceful',
    notes: '晚上在公园散步，欣赏夜景。城市的灯火让人感到宁静美好。',
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() // 4天前
  },
  {
    emotion: 'anxious',
    notes: '明天有重要的presentation，有些紧张。但准备充分，相信自己能做好。',
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    emotion: 'happy',
    notes: '家人聚餐，大家一起分享美食和欢声笑语。家庭温暖是最大的幸福。',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5天前
  },
  {
    emotion: 'overwhelmed',
    notes: '今天事情太多了，感觉有点应接不暇。需要学会说不，保护自己的精力。',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    emotion: 'content',
    notes: '读了一本好书，获得了很多启发。知识的力量让人感到充实满足。',
    date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() // 6天前
  },
  {
    emotion: 'excited',
    notes: '计划周末去旅行，已经开始期待美好的假期时光了。',
    date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    emotion: 'calm',
    notes: '听音乐放松心情，古典音乐总能让我内心平静下来。',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7天前
  },
  {
    emotion: 'sad',
    notes: '想念远方的朋友，距离让友谊变得珍贵。希望很快能再次相聚。',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  },

  // 今天的多个记录 - 用于Daily Pie图表测试
  {
    emotion: 'happy',
    notes: '早晨阳光明媚，心情特别好。新的一天充满希望和可能性。',
    date: new Date().toISOString() // 今天
  },
  {
    emotion: 'excited',
    notes: '刚刚完成了一个重要的功能开发，代码运行完美！成就感满满。',
    date: new Date().toISOString()
  },
  {
    emotion: 'content',
    notes: '午餐时间和同事聊天，分享工作心得。团队氛围很棒。',
    date: new Date().toISOString()
  },
  {
    emotion: 'calm',
    notes: '下午茶时间，品味咖啡的香醇。小憩片刻，为下午的工作充电。',
    date: new Date().toISOString()
  },

  // 包含丰富关键词的notes - 用于Word Cloud测试
  {
    emotion: 'happy',
    notes: '学习 编程 技术 成长 进步 知识 代码 开发 创新 解决问题 逻辑思维 算法 数据结构',
    date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    emotion: 'excited',
    notes: '工作 项目 团队 合作 沟通 效率 目标 成就 挑战 机会 职业发展 技能提升',
    date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    emotion: 'content',
    notes: '生活 健康 运动 瑜伽 冥想 平衡 休息 放松 自我关爱 身心健康 正念 感恩',
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    emotion: 'peaceful',
    notes: '家庭 朋友 爱情 关系 支持 理解 陪伴 温暖 幸福 归属感 安全感 信任',
    date: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    emotion: 'calm',
    notes: '阅读 书籍 知识 思考 哲学 智慧 启发 成长 反思 学习 探索 发现',
    date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    emotion: 'happy',
    notes: '旅行 探险 风景 文化 体验 记忆 摄影 美食 当地特色 历史 艺术 博物馆',
    date: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    emotion: 'excited',
    notes: '创意 设计 艺术 音乐 绘画 写作 表达 灵感 想象力 美学 创作 作品',
    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    emotion: 'content',
    notes: '自然 环境 绿色 可持续 环保 生态 动物 植物 季节 天气 户外活动',
    date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  }
];

console.log('开始插入测试数据...');

try {
  let insertedCount = 0;
  
  for (const entry of testEntries) {
    try {
      const result = statements.insertEntry.run(
        entry.emotion,
        entry.notes,
        entry.date
      );
      insertedCount++;
      console.log(`✓ 插入记录 ${insertedCount}: ${entry.emotion} - ${entry.date.split('T')[0]}`);
    } catch (error) {
      console.error(`✗ 插入失败:`, error.message);
    }
  }
  
  console.log(`\n成功插入 ${insertedCount} 条测试数据！`);
  console.log('\n数据包含:');
  console.log('- 最近7天的多样化情绪记录（用于Daily Emotions图表）');
  console.log('- 今天的多个情绪记录（用于Daily Pie图表）');
  console.log('- 包含丰富关键词的notes（用于Word Cloud功能）');
  
} catch (error) {
  console.error('插入数据时发生错误:', error);
}