import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useTranslation } from 'react-i18next';

interface EmotionPieData {
  emotion: string;
  count: number;
  percentage: number;
}

interface EmotionPieChartProps {
  data: EmotionPieData[];
  totalEntries: number;
  title?: string;
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

// 获取情绪对应的颜色
function getEmotionColor(emotion: string): string {
  return emotionColors[emotion.toLowerCase()] || '#6B7280';
}

// 自定义Tooltip组件
const CustomTooltip = ({ active, payload, t }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <div className="flex items-center gap-2 mb-1">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: payload[0].color }}
          />
          <span className="font-medium text-gray-900 capitalize">{data.emotion}</span>
        </div>
        <div className="text-sm text-gray-600">
          <p>{t('emotionPieChart.count')}: {data.count}</p>
          <p>{t('emotionPieChart.percentage')}: {data.percentage}%</p>
        </div>
      </div>
    );
  }
  return null;
};

// 自定义Legend组件
const CustomLegend = ({ payload }: any) => {
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-gray-700 capitalize">
            {entry.payload.emotion} ({entry.payload.percentage}%)
          </span>
        </div>
      ))}
    </div>
  );
};

// 自定义Label组件
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null; // 不显示小于5%的标签
  
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
      fontSize={12}
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function EmotionPieChart({ 
  data, 
  totalEntries, 
  title,
  className = '' 
}: EmotionPieChartProps) {
  const { t } = useTranslation();
  const defaultTitle = title || t('emotionPieChart.title');
  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 bg-gray-50 rounded-lg ${className}`}>
        <div className="text-center">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">{t('emotionPieChart.noData')}</p>
        </div>
      </div>
    );
  }

  // 为数据添加颜色
  const dataWithColors = data.map(item => ({
    ...item,
    fill: getEmotionColor(item.emotion)
  }));

  return (
    <div className={`w-full ${className}`}>
      {defaultTitle && (
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{defaultTitle}</h3>
          <p className="text-sm text-gray-600">{t('emotionPieChart.totalEntries')}: {totalEntries}</p>
        </div>
      )}
      
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={dataWithColors}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={120}
            fill="#8884d8"
            dataKey="count"
            animationBegin={0}
            animationDuration={800}
          >
            {dataWithColors.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip content={(props: any) => <CustomTooltip {...props} t={t} />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
      
      {/* 统计摘要 */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
        {data.slice(0, 6).map((item, index) => (
          <div key={index} className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: getEmotionColor(item.emotion) }}
              />
              <span className="text-sm font-medium text-gray-900 capitalize">
                {item.emotion}
              </span>
            </div>
            <div className="text-xs text-gray-600">
              <span className="font-medium">{item.count}</span> {t('emotionPieChart.entries')}
              <span className="ml-2">({item.percentage}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 导出类型定义供其他组件使用
export type { EmotionPieData };