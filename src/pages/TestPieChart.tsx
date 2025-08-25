import React from 'react';
import DailyEmotionPieChart from '../components/DailyEmotionPieChart';

const TestPieChart: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Daily Emotion Pie Chart Test
        </h1>
        <DailyEmotionPieChart />
      </div>
    </div>
  );
};

export default TestPieChart;