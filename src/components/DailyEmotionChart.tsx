import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';

interface DailyEmotionData {
  [date: string]: {
    [emotion: string]: number;
  };
}

interface DailyEmotionChartProps {
  data: DailyEmotionData;
  className?: string;
}

// 情绪颜色映射
const emotionColors: { [emotion: string]: string } = {
  happy: '#10B981',
  excited: '#F59E0B',
  content: '#3B82F6',
  peaceful: '#8B5CF6',
  calm: '#06B6D4',
  frustrated: '#EF4444',
  stressed: '#DC2626',
  anxious: '#F97316',
  sad: '#6B7280',
  overwhelmed: '#991B1B'
};

// 转换数据格式为recharts需要的格式
function transformDataForChart(data: DailyEmotionData) {
  const chartData = Object.entries(data).map(([date, emotions]) => {
    const formattedDate = format(parseISO(date), 'MMM d');
    return {
      date: formattedDate,
      fullDate: date,
      ...emotions
    };
  }).sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());

  return chartData;
}

// 获取所有出现的情绪类型
function getAllEmotions(data: DailyEmotionData): string[] {
  const emotions = new Set<string>();
  Object.values(data).forEach(dayEmotions => {
    Object.keys(dayEmotions).forEach(emotion => emotions.add(emotion));
  });
  return Array.from(emotions).sort();
}

// 自定义Tooltip组件
const CustomTooltip = ({ active, payload, label, t }: any) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
    
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900 mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-gray-700 capitalize">{entry.dataKey}</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {entry.value} ({Math.round((entry.value / total) * 100)}%)
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 pt-2 border-t border-gray-100">
          <span className="text-sm font-medium text-gray-900">{t('dailyEmotionChart.total')}: {total}</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function DailyEmotionChart({ data, className = '' }: DailyEmotionChartProps) {
  const { t } = useTranslation();
  console.log('DailyEmotionChart received data:', data);
  const chartData = transformDataForChart(data);
  console.log('Transformed chart data:', chartData);
  const emotions = getAllEmotions(data);
  console.log('Available emotions:', emotions);

  if (chartData.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 bg-gray-50 rounded-lg ${className}`}>
        <div className="text-center">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">{t('dailyEmotionChart.noData')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={(props: any) => <CustomTooltip {...props} t={t} />} />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />
          {emotions.map((emotion) => (
            <Bar
              key={emotion}
              dataKey={emotion}
              stackId="emotions"
              fill={emotionColors[emotion] || '#6B7280'}
              name={emotion.charAt(0).toUpperCase() + emotion.slice(1)}
              radius={[0, 0, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// 导出类型定义供其他组件使用
export type { DailyEmotionData };