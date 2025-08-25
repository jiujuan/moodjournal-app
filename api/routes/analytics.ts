import { Router } from 'express';
import { statements } from '../database.js';
import { z } from 'zod';
import type { 
  AnalyticsRequest,
  MoodTrendData,
  EmotionBreakdown,
  WordFrequencyData,
  StreakData
} from '../../shared/types.js';

const router = Router();

// Validation schema
const analyticsSchema = z.object({
  period: z.enum(['week', 'month', 'year']).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

// Helper function to get date range based on period
function getDateRange(period?: string): { startDate: string; endDate: string } {
  const now = new Date();
  const endDate = now.toISOString();
  let startDate: string;
  
  switch (period) {
    case 'week':
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      startDate = weekAgo.toISOString();
      break;
    case 'month':
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      startDate = monthAgo.toISOString();
      break;
    case 'year':
      const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      startDate = yearAgo.toISOString();
      break;
    default:
      // Default to last 30 days
      const defaultStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      startDate = defaultStart.toISOString();
  }
  
  return { startDate, endDate };
}

// Helper function to extract words from text and count frequency
function getWordFrequency(entries: any[]): WordFrequencyData[] {
  const wordCount: { [key: string]: number } = {};
  
  entries.forEach(entry => {
    if (entry.notes) {
      // Simple word extraction (split by spaces, remove punctuation, convert to lowercase)
      const words = entry.notes
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter((word: string) => word.length > 2); // Only words longer than 2 characters
      
      words.forEach((word: string) => {
        wordCount[word] = (wordCount[word] || 0) + 1;
      });
    }
  });
  
  // Convert to array and sort by frequency
  return Object.entries(wordCount)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 50); // Top 50 words
}

// Helper function to calculate streak data
function calculateStreakData(entries: any[]): StreakData {
  if (entries.length === 0) {
    return {
      current_streak: 0,
      longest_streak: 0,
      total_entries: 0
    };
  }
  
  // Group entries by date
  const entriesByDate: { [key: string]: boolean } = {};
  entries.forEach(entry => {
    const date = entry.date.split('T')[0]; // Get just the date part
    entriesByDate[date] = true;
  });
  
  const dates = Object.keys(entriesByDate).sort();
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  
  // Calculate current streak (from today backwards)
  const today = new Date().toISOString().split('T')[0];
  let checkDate = new Date(today);
  
  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (entriesByDate[dateStr]) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  // Calculate longest streak
  for (let i = 0; i < dates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prevDate = new Date(dates[i - 1]);
      const currDate = new Date(dates[i]);
      const dayDiff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (dayDiff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);
  
  return {
    current_streak: currentStreak,
    longest_streak: longestStreak,
    total_entries: entries.length
  };
}

// Helper function to get daily emotion distribution
function getDailyEmotionDistribution(entries: any[], targetDate?: string) {
  let filteredEntries = entries;
  
  if (targetDate) {
    // Filter entries for specific date
    filteredEntries = entries.filter(entry => {
      const entryDate = new Date(entry.date).toISOString().split('T')[0];
      return entryDate === targetDate;
    });
  }
  
  // Group by date and emotion
  const dailyDistribution: { [date: string]: { [emotion: string]: number } } = {};
  
  filteredEntries.forEach(entry => {
    const date = new Date(entry.date).toISOString().split('T')[0];
    if (!dailyDistribution[date]) {
      dailyDistribution[date] = {};
    }
    if (!dailyDistribution[date][entry.emotion]) {
      dailyDistribution[date][entry.emotion] = 0;
    }
    dailyDistribution[date][entry.emotion]++;
  });
  
  return dailyDistribution;
}

// Helper function to get emotion pie chart data
function getEmotionPieData(entries: any[]) {
  const emotionCounts: { [emotion: string]: number } = {};
  
  entries.forEach(entry => {
    if (!emotionCounts[entry.emotion]) {
      emotionCounts[entry.emotion] = 0;
    }
    emotionCounts[entry.emotion]++;
  });
  
  const total = entries.length;
  
  return Object.entries(emotionCounts).map(([emotion, count]) => ({
    emotion,
    count,
    percentage: Math.round((count / total) * 100 * 100) / 100 // Round to 2 decimal places
  })).sort((a, b) => b.count - a.count);
}

// GET /api/analytics/trends - Get mood trends and analytics
router.get('/trends', (req, res) => {
  try {
    const query = analyticsSchema.parse(req.query) as AnalyticsRequest;
    
    // Determine date range
    const dateRange = query.startDate && query.endDate 
      ? { startDate: query.startDate, endDate: query.endDate }
      : getDateRange(query.period);
    
    // Get mood trends data
    const moodTrends = statements.getMoodTrends.all(
      dateRange.startDate, 
      dateRange.endDate
    ) as MoodTrendData[];
    
    // Get emotion breakdown
    const emotionStatsRaw = statements.getEmotionStats.all();
    const emotionBreakdown = emotionStatsRaw.map((stat: any) => ({
      emotion: stat.emotion,
      count: stat.total_count,
      percentage: stat.percentage
    })) as EmotionBreakdown[];
    
    // Get entries for word frequency and streak calculation
    const entries = statements.getEntriesByDateRange.all(
      dateRange.startDate, 
      dateRange.endDate
    );
    
    // Calculate word frequency
    const wordFrequency = getWordFrequency(entries);
    
    // Calculate streak data (use all entries for accurate streak calculation)
    const allEntries = statements.getEntries.all(999999, 0);
    const streakData = calculateStreakData(allEntries);
    
    res.json({
      success: true,
      data: {
        moodTrends,
        emotionBreakdown,
        wordFrequency,
        streakData
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(400).json({
      success: false,
      error: error instanceof z.ZodError ? 'Invalid query parameters' : 'Failed to fetch analytics'
    });
  }
});

// GET /api/analytics/emotions - Get emotion statistics
router.get('/emotions', (req, res) => {
  try {
    const emotionStats = statements.getEmotionStats.all() as EmotionBreakdown[];
    
    res.json({
      success: true,
      data: emotionStats
    });
  } catch (error) {
    console.error('Error fetching emotion stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch emotion statistics'
    });
  }
});

// GET /api/analytics/daily-summary - Get daily mood summary
router.get('/daily-summary', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'startDate and endDate are required'
        }
      });
    }
    
    const dailySummary = statements.getDailyMoodSummary.all(
      startDate as string, 
      endDate as string
    );
    
    res.json({
      success: true,
      data: {
        dailySummary
      },
      message: 'Daily summary retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching daily summary:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch daily summary'
      }
    });
  }
});

// GET /api/analytics/daily-emotions
router.get('/daily-emotions', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'startDate and endDate are required'
        }
      });
    }
    
    const entries = statements.getEntriesByDateRange.all(startDate, endDate);
    const dailyDistribution = getDailyEmotionDistribution(entries);
    
    res.json({
      success: true,
      data: {
        dailyDistribution
      },
      message: 'Daily emotion distribution retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching daily emotions:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch daily emotions'
      }
    });
  }
});

// GET /api/analytics/emotion-pie
router.get('/emotion-pie', (req, res) => {
  try {
    const { startDate, endDate, date } = req.query;
    
    let entries;
    
    if (date) {
      // Get entries for specific date
      const nextDate = new Date(date as string);
      nextDate.setDate(nextDate.getDate() + 1);
      entries = statements.getEntriesByDateRange.all(date, nextDate.toISOString().split('T')[0]);
    } else if (startDate && endDate) {
      // Get entries for date range
      entries = statements.getEntriesByDateRange.all(startDate, endDate);
    } else {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'Either date or both startDate and endDate are required'
        }
      });
    }
    
    const pieData = getEmotionPieData(entries);
    
    res.json({
      success: true,
      data: {
        pieData,
        totalEntries: entries.length,
        date: date || `${startDate} to ${endDate}`
      },
      message: 'Emotion pie chart data retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching emotion pie data:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch emotion pie data'
      }
    });
  }
});

export default router;