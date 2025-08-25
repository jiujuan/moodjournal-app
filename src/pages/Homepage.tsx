import React, { useState, useEffect } from 'react';
import { Plus, Calendar, TrendingUp, Heart, Smile, Meh, Frown, Angry, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import type { MoodEntry, EmotionType, MoodTrendData } from '../../shared/types';

interface EmotionOption {
  emotion: EmotionType;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  bgColor: string;
}

const getEmotionOptions = (t: any): EmotionOption[] => [
  { emotion: 'happy', icon: Smile, label: t('moods.happy'), color: 'text-green-600', bgColor: 'bg-green-100 hover:bg-green-200' },
  { emotion: 'sad', icon: Frown, label: t('moods.sad'), color: 'text-blue-600', bgColor: 'bg-blue-100 hover:bg-blue-200' },
  { emotion: 'angry', icon: Angry, label: t('moods.angry'), color: 'text-red-600', bgColor: 'bg-red-100 hover:bg-red-200' },
  { emotion: 'anxious', icon: Meh, label: t('moods.anxious'), color: 'text-yellow-600', bgColor: 'bg-yellow-100 hover:bg-yellow-200' },
  { emotion: 'excited', icon: Heart, label: t('moods.excited'), color: 'text-pink-600', bgColor: 'bg-pink-100 hover:bg-pink-200' },
  { emotion: 'calm', icon: Smile, label: t('moods.calm'), color: 'text-purple-600', bgColor: 'bg-purple-100 hover:bg-purple-200' },
  { emotion: 'stressed', icon: Frown, label: t('moods.stressed'), color: 'text-orange-600', bgColor: 'bg-orange-100 hover:bg-orange-200' },
  { emotion: 'grateful', icon: Heart, label: t('moods.grateful'), color: 'text-emerald-600', bgColor: 'bg-emerald-100 hover:bg-emerald-200' }
];

const Homepage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const emotionOptions = getEmotionOptions(t);
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionType | null>(null);
  const [notes, setNotes] = useState('');
  const [todayEntries, setTodayEntries] = useState<MoodEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [moodTrends, setMoodTrends] = useState<MoodTrendData[]>([]);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 8;

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  // Fetch today's entries and mood trends
  useEffect(() => {
    fetchTodayEntries();
    fetchMoodTrends();
  }, []);

  const fetchTodayEntries = async () => {
    try {
      const response = await fetch(`/api/entries?date=${todayStr}`);
      if (response.ok) {
        const data = await response.json();
        setTodayEntries(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching today\'s entries:', error);
    }
  };

  const fetchMoodTrends = async () => {
    setTrendsLoading(true);
    try {
      const response = await fetch('/api/analytics/trends?period=month');
      if (response.ok) {
        const data = await response.json();
        setMoodTrends(data.data?.moodTrends || []);
      }
    } catch (error) {
      console.error('Error fetching mood trends:', error);
    } finally {
      setTrendsLoading(false);
    }
  };

  const formatMoodTrendData = (trends: MoodTrendData[]) => {
    return trends
      .filter(trend => {
        if (!trend.date || typeof trend.date !== 'string') {
          return false;
        }
        const date = new Date(trend.date);
        return !isNaN(date.getTime());
      })
      .map(trend => {
        try {
          return {
            date: format(new Date(trend.date), 'MMM d'),
            avgMood: parseFloat(trend.avg_mood.toFixed(1)),
            entryCount: trend.entry_count
          };
        } catch (error) {
          return {
            date: 'Invalid Date',
            avgMood: 0,
            entryCount: 0
          };
        }
      });
  };

  const handleQuickEntry = async () => {
    if (!selectedEmotion) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emotion: selectedEmotion,
          notes: notes.trim() || undefined,
          date: new Date().toISOString()
        }),
      });

      if (response.ok) {
        setSelectedEmotion(null);
        setNotes('');
        setShowSuccess(true);
        fetchTodayEntries();
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error creating entry:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEmotionOption = (emotion: EmotionType) => {
    return emotionOptions.find(opt => opt.emotion === emotion);
  };

  const getGreeting = () => {
    const hour = today.getHours();
    if (hour < 12) return t('homepage.greeting.morning');
    if (hour < 17) return t('homepage.greeting.afternoon');
    return t('homepage.greeting.evening');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-light text-gray-800 mb-2">
            {getGreeting()}! ✨
          </h1>
          <p className="text-lg text-gray-600">
            {format(today, 'EEEE, MMMM do, yyyy')}
          </p>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 p-4 bg-green-100 border border-green-200 rounded-2xl text-green-800 text-center animate-fade-in">
            ✅ {t('homepage.successMessage')}
          </div>
        )}

        {/* Main Content - Left-Right Layout */}
        <div className="flex gap-8 mb-8">
          {/* Left Side - Quick Emotion Selector */}
          <div className="flex-1">
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/50 h-full">
              <h2 className="text-2xl font-light text-gray-800 mb-6 text-center">
                {t('homepage.howFeeling')}
              </h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                {emotionOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = selectedEmotion === option.emotion;
                  
                  return (
                    <button
                      key={option.emotion}
                      onClick={() => setSelectedEmotion(option.emotion)}
                      className={`
                        p-4 rounded-2xl transition-all duration-300 transform hover:scale-105
                        ${isSelected 
                          ? `${option.bgColor} ring-2 ring-offset-2 ring-gray-300 scale-105` 
                          : `${option.bgColor} hover:shadow-md`
                        }
                      `}
                    >
                      <Icon className={`w-8 h-8 mx-auto mb-2 ${option.color}`} />
                      <span className={`text-sm font-medium ${option.color}`}>
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Notes Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('homepage.addNote')}
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('homepage.notePlaceholder')}
                  className="w-full p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-300 focus:border-transparent resize-none bg-white/50 backdrop-blur-sm"
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleQuickEntry}
                disabled={!selectedEmotion || isSubmitting}
                className="w-full bg-gradient-to-r from-purple-400 to-pink-400 text-white py-4 px-6 rounded-2xl font-medium transition-all duration-300 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] shadow-lg"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {t('homepage.saving')}
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <Plus className="w-5 h-5 mr-2" />
                    {t('homepage.logMood')}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Right Side - Today's Summary */}
          <div className="flex-1">
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/50 h-full">
          <h2 className="text-2xl font-light text-gray-800 mb-6 flex items-center">
            <Calendar className="w-6 h-6 mr-3 text-purple-500" />
            {t('homepage.todaySummary')}
          </h2>
          
          {todayEntries.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🌱</div>
              <p className="text-gray-600 text-lg">
                {t('homepage.noEntries')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600">
                  {todayEntries.length} {todayEntries.length === 1 ? t('homepage.entriesCount_one') : t('homepage.entriesCount_other')}
                </span>
                <button 
                  onClick={() => navigate('/trends')}
                  className="text-purple-500 hover:text-purple-600 transition-colors flex items-center"
                >
                  <TrendingUp className="w-4 h-4 mr-1" />
                  {t('homepage.viewTrends')}
                </button>
              </div>
              
              {(() => {
                const totalPages = Math.ceil(todayEntries.length / entriesPerPage);
                const startIndex = (currentPage - 1) * entriesPerPage;
                const endIndex = startIndex + entriesPerPage;
                const currentEntries = todayEntries.slice(startIndex, endIndex);
                
                return (
                  <>
                    {currentEntries.map((entry) => {
                      const emotionOption = getEmotionOption(entry.emotion);
                      const Icon = emotionOption?.icon || Smile;
                      
                      return (
                        <div key={entry.id} className="bg-white/50 rounded-2xl p-4 border border-gray-100">
                          <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-xl ${emotionOption?.bgColor || 'bg-gray-100'}`}>
                              <Icon className={`w-5 h-5 ${emotionOption?.color || 'text-gray-600'}`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-gray-800 capitalize">
                                  {entry.emotion}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {format(new Date(entry.date), 'h:mm a')}
                                </span>
                              </div>
                              {entry.notes && (
                                <p className="text-gray-600 text-sm">{entry.notes}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center space-x-2 mt-6">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          aria-label={t('homepage.pagination.previous')}
                          title={t('homepage.pagination.previous')}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                               key={page}
                               onClick={() => setCurrentPage(page)}
                               className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                 currentPage === page
                                   ? 'bg-purple-500 text-white'
                                   : 'text-gray-600 hover:bg-gray-100'
                               }`}
                               aria-label={t('homepage.pagination.page', { page })}
                               aria-current={currentPage === page ? 'page' : undefined}
                             >
                               {page}
                             </button>
                          ))}
                        </div>
                        
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          aria-label={t('homepage.pagination.next')}
                          title={t('homepage.pagination.next')}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </>
                );
              })()
              }
            </div>
          )}
        </div>
          </div>
        </div>

        {/* Mood Trends Chart */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('homepage.moodTrendsTitle')}</h2>
        {trendsLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">{t('homepage.loadingTrends')}</div>
          </div>
        ) : moodTrends.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formatMoodTrendData(moodTrends)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  domain={[1, 5]}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.toString()}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'avgMood' ? value.toFixed(1) : value,
                    name === 'avgMood' ? 'Average Mood' : 'Entry Count'
                  ]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="avgMood" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            {t('homepage.noTrendData')}
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default Homepage;