import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Filter, Search, Smile, Frown, Heart, Meh, Angry } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from 'date-fns';
import { useTranslation } from 'react-i18next';
import type { MoodEntry, EmotionType } from '../../shared/types';

interface CalendarDay {
  date: Date;
  entries: MoodEntry[];
  isCurrentMonth: boolean;
  isToday: boolean;
}

const emotionIcons: Record<EmotionType, React.ComponentType<{ className?: string }>> = {
  happy: Smile,
  sad: Frown,
  angry: Angry,
  anxious: Meh,
  excited: Heart,
  calm: Smile,
  stressed: Frown,
  grateful: Heart,
  content: Smile,
  peaceful: Heart,
  frustrated: Frown,
  overwhelmed: Meh
};

const emotionColors: Record<EmotionType, string> = {
  happy: 'bg-green-200 text-green-800',
  sad: 'bg-blue-200 text-blue-800',
  angry: 'bg-red-200 text-red-800',
  anxious: 'bg-yellow-200 text-yellow-800',
  excited: 'bg-pink-200 text-pink-800',
  calm: 'bg-purple-200 text-purple-800',
  stressed: 'bg-orange-200 text-orange-800',
  grateful: 'bg-emerald-200 text-emerald-800',
  content: 'bg-teal-200 text-teal-800',
  peaceful: 'bg-indigo-200 text-indigo-800',
  frustrated: 'bg-red-300 text-red-900',
  overwhelmed: 'bg-gray-200 text-gray-800'
};

const History: React.FC = () => {
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<MoodEntry[]>([]);
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionType | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);

  // Fetch entries for the current month
  useEffect(() => {
    fetchMonthEntries();
  }, [currentDate]);

  // Filter entries based on search and emotion filter
  useEffect(() => {
    let filtered = entries;
    
    if (selectedEmotion !== 'all') {
      filtered = filtered.filter(entry => entry.emotion === selectedEmotion);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(entry => 
        entry.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedDate) {
      filtered = filtered.filter(entry => 
        isSameDay(new Date(entry.date), selectedDate)
      );
    }
    
    setFilteredEntries(filtered);
  }, [entries, selectedEmotion, searchTerm, selectedDate]);

  // Generate calendar days
  useEffect(() => {
    generateCalendarDays();
  }, [currentDate, entries]);

  const fetchMonthEntries = async () => {
    setLoading(true);
    try {
      // Use YYYY-MM-DD format for API compatibility
      const startDate = format(startOfMonth(currentDate), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(currentDate), 'yyyy-MM-dd');
      
      const response = await fetch(`/api/entries?startDate=${startDate}&endDate=${endDate}&limit=100`);
      if (response.ok) {
        const result = await response.json();
        console.log('API Response:', result); // Debug log
        if (result.success && result.data) {
          setEntries(result.data);
        } else {
          console.error('API response format error:', result);
          setEntries([]);
        }
      } else {
        console.error('API request failed:', response.status, response.statusText);
        setEntries([]);
      }
    } catch (error) {
      console.error('Error fetching entries:', error);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const generateCalendarDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const today = new Date();
    
    const calendarDays: CalendarDay[] = days.map(date => {
      const dayEntries = entries.filter(entry => 
        isSameDay(new Date(entry.date), date)
      );
      
      return {
        date,
        entries: dayEntries,
        isCurrentMonth: isSameMonth(date, currentDate),
        isToday: isSameDay(date, today)
      };
    });
    
    setCalendarDays(calendarDays);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
    setSelectedDate(null);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(isSameDay(date, selectedDate || new Date('1900-01-01')) ? null : date);
  };

  const getDominantEmotion = (dayEntries: MoodEntry[]): EmotionType | null => {
    if (dayEntries.length === 0) return null;
    
    const emotionCounts: Record<string, number> = {};
    dayEntries.forEach(entry => {
      emotionCounts[entry.emotion] = (emotionCounts[entry.emotion] || 0) + 1;
    });
    
    return Object.entries(emotionCounts)
      .sort(([,a], [,b]) => b - a)[0][0] as EmotionType;
  };

  const emotionOptions: EmotionType[] = ['happy', 'sad', 'angry', 'anxious', 'excited', 'calm', 'stressed', 'grateful'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-light text-gray-800 mb-2 flex items-center justify-center">
            <Calendar className="w-8 h-8 mr-3 text-indigo-500" />
            {t('history.title')}
          </h1>
          <p className="text-lg text-gray-600">
            {t('history.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar View */}
          <div className="lg:col-span-2">
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-white/50">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                
                <h2 className="text-2xl font-light text-gray-800">
                  {format(currentDate, 'MMMM yyyy')}
                </h2>
                
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {/* Day Headers */}
                {[
                  { key: 'sun', label: t('history.days.sun') },
                  { key: 'mon', label: t('history.days.mon') },
                  { key: 'tue', label: t('history.days.tue') },
                  { key: 'wed', label: t('history.days.wed') },
                  { key: 'thu', label: t('history.days.thu') },
                  { key: 'fri', label: t('history.days.fri') },
                  { key: 'sat', label: t('history.days.sat') }
                ].map(({ key, label }) => (
                  <div key={key} className="text-center text-sm font-medium text-gray-500 py-2">
                    {label}
                  </div>
                ))}
                
                {/* Calendar Days */}
                {calendarDays.map((day, index) => {
                  const dominantEmotion = getDominantEmotion(day.entries);
                  const isSelected = selectedDate && isSameDay(day.date, selectedDate);
                  
                  return (
                    <button
                      key={index}
                      onClick={() => handleDateClick(day.date)}
                      className={`
                        relative p-3 rounded-xl transition-all duration-200 hover:scale-105
                        ${day.isToday ? 'ring-2 ring-indigo-400' : ''}
                        ${isSelected ? 'bg-indigo-200 shadow-md' : 'hover:bg-gray-100'}
                        ${!day.isCurrentMonth ? 'opacity-30' : ''}
                      `}
                    >
                      <span className={`text-sm ${day.isToday ? 'font-bold text-indigo-600' : 'text-gray-700'}`}>
                        {format(day.date, 'd')}
                      </span>
                      
                      {/* Emotion Indicator */}
                      {dominantEmotion && (
                        <div className={`absolute bottom-1 right-1 w-2 h-2 rounded-full ${emotionColors[dominantEmotion].split(' ')[0]}`}></div>
                      )}
                      
                      {/* Entry Count */}
                      {day.entries.length > 0 && (
                        <div className="absolute top-1 right-1 text-xs bg-gray-600 text-white rounded-full w-4 h-4 flex items-center justify-center">
                          {day.entries.length}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Filters and Entry List */}
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-white/50">
              <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                <Filter className="w-5 h-5 mr-2 text-indigo-500" />
                {t('history.filters')}
              </h3>
              
              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t('history.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-transparent bg-white/50"
                  />
                </div>
              </div>
              
              {/* Emotion Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('history.filterByEmotion')}
                </label>
                <select
                  value={selectedEmotion}
                  onChange={(e) => setSelectedEmotion(e.target.value as EmotionType | 'all')}
                  className="w-full p-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-300 focus:border-transparent bg-white/50"
                >
                  <option value="all">{t('history.allEmotions')}</option>
                  {emotionOptions.map(emotion => (
                    <option key={emotion} value={emotion}>
                      {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              {selectedDate && (
                <div className="mt-4 p-3 bg-indigo-100 rounded-xl">
                  <p className="text-sm text-indigo-800">
                    {t('history.showingEntriesFor')} {format(selectedDate, 'MMMM d, yyyy')}
                  </p>
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 mt-1"
                  >
                    {t('history.clearDateFilter')}
                  </button>
                </div>
              )}
            </div>

            {/* Entry List */}
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-white/50">
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                {t('history.entries')} ({filteredEntries.length})
              </h3>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto"></div>
                  <p className="text-gray-600 mt-2">{t('history.loading')}</p>
                </div>
              ) : filteredEntries.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📝</div>
                  <p className="text-gray-600">
                    {t('history.noEntries')}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredEntries.map((entry) => {
                    const Icon = emotionIcons[entry.emotion];
                    
                    return (
                      <div key={entry.id} className="bg-white/50 rounded-2xl p-4 border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-xl ${emotionColors[entry.emotion]}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-gray-800 capitalize">
                                {entry.emotion}
                              </span>
                              <span className="text-xs text-gray-500">
                                {format(new Date(entry.date), 'MMM d, h:mm a')}
                              </span>
                            </div>
                            {entry.notes && (
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {entry.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default History;