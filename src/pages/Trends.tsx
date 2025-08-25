import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, PieChart as PieChartIcon, Cloud, Calendar, BarChart3, Target, BarChart2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
// import WordCloud from '../components/WordCloud';
import DailyEmotionChart from '../components/DailyEmotionChart';
import EmotionPieChart from '../components/EmotionPieChart';
import DailyEmotionPieChart from '../components/DailyEmotionPieChart';
import { format, subDays, subWeeks, subMonths } from 'date-fns';
import type { MoodTrendData, EmotionBreakdown, WordFrequencyData, StreakData } from '../../shared/types';

interface AnalyticsData {
  moodTrends: MoodTrendData[];
  emotionBreakdown: EmotionBreakdown[];
  wordFrequency: WordFrequencyData[];
  streakData: StreakData;
  totalEntries: number;
}

type TimePeriod = 'week' | 'month' | 'year';

const emotionColors: Record<string, string> = {
  happy: '#10B981',
  sad: '#3B82F6',
  angry: '#EF4444',
  anxious: '#F59E0B',
  excited: '#EC4899',
  calm: '#8B5CF6',
  stressed: '#F97316',
  grateful: '#059669'
};

  // Color mapping for emotions
  const getEmotionColor = (emotion: string): string => {
    const colors: Record<string, string> = {
      happy: '#10B981',
      sad: '#3B82F6', 
      angry: '#EF4444',
      anxious: '#F59E0B',
      excited: '#8B5CF6',
      calm: '#06B6D4',
      grateful: '#84CC16',
      frustrated: '#F97316',
      content: '#6366F1',
      overwhelmed: '#EC4899'
    };
    return colors[emotion.toLowerCase()] || '#9CA3AF';
  };

const COLORS = ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#F97316', '#059669'];

const Trends: React.FC = () => {
  const { t } = useTranslation();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [moodTrends, setMoodTrends] = useState<MoodTrendData[]>([]);
  const [wordFrequency, setWordFrequency] = useState<WordFrequencyData[]>([]);
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [dailyEmotionData, setDailyEmotionData] = useState<any>({});
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('month');
  const [loading, setLoading] = useState(false);
  const [activeChart, setActiveChart] = useState<'mood' | 'emotions' | 'words' | 'daily-emotions' | 'daily-pie'>('mood');

  useEffect(() => {
    fetchAnalytics();
    fetchDailyEmotions();
  }, [selectedPeriod]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics/trends?period=${selectedPeriod}`);
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data.data);
        
        if (data.moodTrends) {
          setMoodTrends(data.moodTrends);
        }
        
        if (data.wordFrequency) {
          setWordFrequency(data.wordFrequency);
        }
        
        if (data.streakData) {
          setStreakData(data.streakData);
        }
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyEmotions = async () => {
    try {
      // Get date range based on selected period
      const now = new Date();
      const endDate = now.toISOString().split('T')[0];
      let startDate: string;
      
      switch (selectedPeriod) {
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          startDate = weekAgo.toISOString().split('T')[0];
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          startDate = monthAgo.toISOString().split('T')[0];
          break;
        case 'year':
          const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          startDate = yearAgo.toISOString().split('T')[0];
          break;
        default:
          const defaultStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          startDate = defaultStart.toISOString().split('T')[0];
      }
      
      const response = await fetch(`/api/analytics/daily-emotions?startDate=${startDate}&endDate=${endDate}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Daily emotions API response:', data);
        console.log('Daily distribution data:', data.data.dailyDistribution);
        setDailyEmotionData(data.data.dailyDistribution || {});
      } else {
        console.error('Failed to fetch daily emotions:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching daily emotions:', error);
    }
  };

  const formatMoodTrendData = (trends: MoodTrendData[]) => {
    return trends
      .filter(trend => {
        // 验证日期字段存在且不为空
        if (!trend.date || typeof trend.date !== 'string') {
          console.warn('Invalid date in trend data:', trend);
          return false;
        }
        
        // 验证日期是否可以被正确解析
        const date = new Date(trend.date);
        if (isNaN(date.getTime())) {
          console.warn('Invalid date format in trend data:', trend.date);
          return false;
        }
        
        return true;
      })
      .map(trend => {
        try {
          return {
            date: format(new Date(trend.date), 'MMM d'),
            avgMood: parseFloat(trend.avg_mood.toFixed(1)),
            entryCount: trend.entry_count
          };
        } catch (error) {
          console.error('Error formatting trend data:', error, trend);
          // 返回一个默认值以防止崩溃
          return {
            date: 'Invalid Date',
            avgMood: 0,
            entryCount: 0
          };
        }
      });
  };

  const formatEmotionData = (emotions: EmotionBreakdown[]) => {
    return emotions.map(emotion => ({
      name: emotion.emotion.charAt(0).toUpperCase() + emotion.emotion.slice(1),
      value: emotion.count,
      percentage: emotion.percentage
    }));
  };

  const WordCloud: React.FC<{ words: WordFrequencyData[] }> = ({ words }) => {
    const maxCount = Math.max(...words.map(w => w.count));
    
    return (
      <div className="flex flex-wrap gap-2 justify-center items-center p-6">
        {words.slice(0, 30).map((word, index) => {
          const fontSize = Math.max(12, (word.count / maxCount) * 32);
          const opacity = Math.max(0.4, word.count / maxCount);
          
          return (
            <span
              key={word.word}
              className="inline-block px-2 py-1 rounded-lg transition-transform hover:scale-110"
              style={{
                fontSize: `${fontSize}px`,
                opacity,
                backgroundColor: COLORS[index % COLORS.length] + '20',
                color: COLORS[index % COLORS.length]
              }}
            >
              {word.word}
            </span>
          );
        })}
      </div>
    );
  };

  const getPeriodLabel = (period: TimePeriod) => {
    switch (period) {
      case 'week': return t('trends.periods.week');
      case 'month': return t('trends.periods.month');
      case 'year': return t('trends.periods.year');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('trends.loading')}</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-gray-600 text-lg">{t('trends.noData')}</p>
        </div>
      </div>
    );
  }

  const moodTrendData = formatMoodTrendData(analyticsData.moodTrends);
  const emotionData = formatEmotionData(analyticsData.emotionBreakdown);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-light text-gray-800 mb-2 flex items-center justify-center">
            <TrendingUp className="w-8 h-8 mr-3 text-emerald-500" />
            {t('trends.title')}
          </h1>
          <p className="text-lg text-gray-600">
            {t('trends.subtitle')}
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-white/50">
            {(['week', 'month', 'year'] as TimePeriod[]).map(period => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-6 py-2 rounded-xl transition-all duration-200 ${
                  selectedPeriod === period
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {getPeriodLabel(period)}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-white/50">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-100 rounded-2xl">
                <Target className="w-6 h-6 text-emerald-600" />
              </div>
              <span className="text-2xl font-bold text-emerald-600">
                {analyticsData.streakData.current_streak}
              </span>
            </div>
            <h3 className="text-lg font-medium text-gray-800">{t('trends.stats.currentStreak')}</h3>
            <p className="text-gray-600 text-sm">{t('trends.stats.daysInRow')}</p>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-white/50">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-2xl">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-blue-600">
                {analyticsData.streakData.longest_streak}
              </span>
            </div>
            <h3 className="text-lg font-medium text-gray-800">{t('trends.stats.longestStreak')}</h3>
            <p className="text-gray-600 text-sm">{t('trends.stats.personalBest')}</p>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-white/50">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-2xl">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-purple-600">
                {analyticsData.streakData.total_entries}
              </span>
            </div>
            <h3 className="text-lg font-medium text-gray-800">{t('trends.stats.totalEntries')}</h3>
            <p className="text-gray-600 text-sm">{t('trends.stats.allTime')}</p>
          </div>
        </div>

        {/* Chart Navigation and Charts - Left-Right Layout */}
        <div className="flex gap-6">
          {/* Left Side - Chart Navigation */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/50">
              <h3 className="text-lg font-medium text-gray-800 mb-4">{t('trends.chartOptions')}</h3>
              <div className="space-y-2">
                {[
                  { key: 'mood', label: t('trends.charts.moodTrends'), icon: TrendingUp },
                  { key: 'emotions', label: t('trends.charts.emotions'), icon: PieChartIcon },
                  { key: 'daily-emotions', label: t('trends.charts.dailyEmotions'), icon: BarChart2 },
                  { key: 'daily-pie', label: t('trends.charts.dailyPie'), icon: Target },
                  { key: 'words', label: t('trends.charts.wordCloud'), icon: Cloud }
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveChart(key as any)}
                    className={`w-full px-4 py-3 rounded-xl transition-all duration-200 flex items-center space-x-3 text-left ${
                      activeChart === key
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side - Charts */}
          <div className="flex-1">
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/50 h-full">
          {activeChart === 'mood' && (
            <div>
              <h2 className="text-2xl font-light text-gray-800 mb-6 text-center">
                {t('trends.charts.moodTrendsTitle')}
              </h2>
              {moodTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={moodTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#6b7280"
                      fontSize={12}
                    />
                    <YAxis 
                      domain={[1, 5]} 
                      stroke="#6b7280"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="avgMood" 
                      stroke="#10B981" 
                      strokeWidth={3}
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8, stroke: '#10B981', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">📈</div>
                  <p className="text-gray-600">{t('trends.noMoodData')}</p>
                </div>
              )}
            </div>
          )}

          {activeChart === 'emotions' && (
            <EmotionPieChart 
              data={analyticsData?.emotionBreakdown || []} 
              totalEntries={analyticsData?.emotionBreakdown?.reduce((sum, item) => sum + item.count, 0) || 0} 
            />
          )}

          {activeChart === 'daily-emotions' && (
            <div>
              <h2 className="text-2xl font-light text-gray-800 mb-6 text-center">
                {t('trends.charts.dailyEmotionDistribution')}
              </h2>
              <DailyEmotionChart data={dailyEmotionData} />
            </div>
          )}

          {activeChart === 'daily-pie' && (
            <div>
              <h2 className="text-2xl font-light text-gray-800 mb-6 text-center">
                {t('trends.charts.dailyEmotionBreakdown')}
              </h2>
              <DailyEmotionPieChart />
            </div>
          )}

          {activeChart === 'words' && (
            <div>
              <h2 className="text-2xl font-light text-gray-800 mb-6 text-center">
                {t('trends.charts.wordCloudTitle')}
              </h2>
              {analyticsData.wordFrequency.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {analyticsData.wordFrequency.slice(0, 20).map((word, index) => (
                    <div key={word.word} className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="font-medium text-gray-800">{word.word}</div>
                      <div className="text-sm text-gray-500">{word.count} {t('trends.times')}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">☁️</div>
                  <p className="text-gray-600">{t('trends.noWordData')}</p>
                </div>
              )}
            </div>
          )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Trends;