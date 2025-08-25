import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { format } from 'date-fns';
import DateSelector from './DateSelector';
import { Loader2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface EmotionData {
  emotion: string;
  count: number;
  percentage: number;
}

interface DailyEmotionPieChartProps {
  className?: string;
}

const EMOTION_COLORS: Record<string, string> = {
  happy: '#10B981',
  sad: '#3B82F6',
  angry: '#EF4444',
  anxious: '#F59E0B',
  excited: '#8B5CF6',
  calm: '#06B6D4',
  grateful: '#84CC16',
  frustrated: '#F97316',
  content: '#6366F1',
  overwhelmed: '#EC4899',
  hopeful: '#14B8A6',
  lonely: '#6B7280'
};

const getEmotionColor = (emotion: string): string => {
  return EMOTION_COLORS[emotion.toLowerCase()] || '#9CA3AF';
};

const CustomTooltip = ({ active, payload, t }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 capitalize">{data.emotion}</p>
        <p className="text-sm text-gray-600">
          {t('dailyEmotionPieChart.count')}: <span className="font-medium">{data.count}</span>
        </p>
        <p className="text-sm text-gray-600">
          {t('dailyEmotionPieChart.percentage')}: <span className="font-medium">{data.percentage.toFixed(1)}%</span>
        </p>
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ payload }: any) => {
  if (!payload || payload.length === 0) return null;
  
  return (
    <div className="flex flex-wrap justify-center gap-2 mt-4">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-1 text-sm">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-700 capitalize">{entry.payload.emotion}</span>
          <span className="text-gray-500">({entry.payload.count})</span>
        </div>
      ))}
    </div>
  );
};

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }: any) => {
  if (percentage < 5) return null; // 不显示小于5%的标签
  
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      {`${percentage.toFixed(0)}%`}
    </text>
  );
};

export default function DailyEmotionPieChart({ className = '' }: DailyEmotionPieChartProps) {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState('2025-08-22');
  const [emotionData, setEmotionData] = useState<EmotionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [minDate, setMinDate] = useState<string>('');

  // 获取可用日期范围
  useEffect(() => {
    const fetchDateRange = async () => {
      try {
        const response = await fetch('/api/analytics/trends?startDate=2020-01-01&endDate=' + format(new Date(), 'yyyy-MM-dd'));
        if (response.ok) {
          const data = await response.json();
          if (data.moodTrends && data.moodTrends.length > 0) {
            const dates = data.moodTrends.map((item: any) => item.date).sort();
            setMinDate(dates[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching date range:', error);
      }
    };
    
    fetchDateRange();
  }, []);

  // 获取特定日期的情绪数据
  useEffect(() => {
    const fetchDailyEmotions = async () => {
      if (!selectedDate) {
        console.log('No selectedDate, returning');
        return;
      }
      
      console.log('Fetching emotions for date:', selectedDate);
      setLoading(true);
      setError(null);
      
      try {
        // 添加时间戳避免缓存问题
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/analytics/emotion-pie?date=${selectedDate}&_t=${timestamp}`);
        
        console.log('Response status:', response.status, response.ok);
        
        if (!response.ok) {
          throw new Error('Failed to fetch emotion data');
        }
        
        const data = await response.json();
        
        console.log('API Response:', data);
        console.log('data.success:', data.success);
        console.log('data.data:', data.data);
        console.log('pieData:', data.data?.pieData);
        console.log('pieData length:', data.data?.pieData?.length);
        
        if (data.success && data.data && data.data.pieData && Array.isArray(data.data.pieData) && data.data.pieData.length > 0) {
          // API返回的数据已经包含了count和percentage
          const processedData: EmotionData[] = data.data.pieData.map((item: any) => ({
            emotion: item.emotion,
            count: item.count,
            percentage: item.percentage
          }));
          
          console.log('Processed data:', processedData);
          console.log('Setting emotionData to:', processedData);
          setEmotionData(processedData);
        } else {
          console.log('No valid pieData found or empty array, setting empty array');
          console.log('Conditions check:');
          console.log('- data.success:', data.success);
          console.log('- data.data exists:', !!data.data);
          console.log('- data.data.pieData exists:', !!data.data?.pieData);
          console.log('- is array:', Array.isArray(data.data?.pieData));
          console.log('- length > 0:', data.data?.pieData?.length > 0);
          setEmotionData([]);
        }
      } catch (error) {
        console.error('Error fetching daily emotions:', error);
        setError('Failed to load emotion data');
        setEmotionData([]);
      } finally {
        console.log('Setting loading to false');
        setLoading(false);
      }
    };
    
    fetchDailyEmotions();
  }, [selectedDate]);

  const totalEntries = emotionData.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">{t('dailyEmotionPieChart.title')}</h3>
        
        {/* 主要内容区域 - 左右布局 */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 左侧内容区域 */}
          <div className="flex-1">
            
            {/* 加载状态 */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-600">{t('dailyEmotionPieChart.loading')}</span>
              </div>
            )}
            
            {/* 错误状态 */}
            {error && (
              <div className="flex items-center justify-center py-12 text-red-600">
                <AlertCircle className="w-6 h-6 mr-2" />
                <span>{error}</span>
              </div>
            )}
            
            {/* 无数据状态 */}
            {!loading && !error && emotionData.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-2">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                </div>
                <p className="text-gray-600">{t('dailyEmotionPieChart.noData', { date: format(new Date(selectedDate), 'MMMM d, yyyy') })}</p>
                <p className="text-sm text-gray-500 mt-2">{t('dailyEmotionPieChart.tryDifferentDate')}</p>
              </div>
            )}
            
            {/* 饼图和统计 */}
            {!loading && !error && emotionData.length > 0 && (
              <>
                {/* 日期和总数信息 */}
                <div className="text-center mb-6">
                  <h4 className="text-lg font-medium text-gray-900">
                    {format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {t('dailyEmotionPieChart.totalEntries')}: <span className="font-medium">{totalEntries}</span>
                  </p>
                </div>
                
                {/* 饼图 */}
                <div className="h-80 mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={emotionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomLabel}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {emotionData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={getEmotionColor(entry.emotion)} 
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip t={t} />} />
                      <Legend content={<CustomLegend />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* 详细统计 */}
                <div className="border-t border-gray-200 pt-4">
                  <h5 className="text-sm font-medium text-gray-900 mb-3">{t('dailyEmotionPieChart.detailedStatistics')}</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {emotionData
                      .sort((a, b) => b.count - a.count)
                      .map((emotion, index) => (
                        <div 
                          key={emotion.emotion}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: getEmotionColor(emotion.emotion) }}
                            />
                            <span className="text-sm font-medium text-gray-900 capitalize">
                              {emotion.emotion}
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-gray-900">
                              {emotion.count}
                            </div>
                            <div className="text-xs text-gray-500">
                              {emotion.percentage.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* 右侧日期选择器 */}
          <div className="lg:w-80 lg:flex-shrink-0">
            <DateSelector
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              minDate={minDate}
              maxDate={format(new Date(), 'yyyy-MM-dd')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}