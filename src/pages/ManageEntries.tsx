import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, Edit3, Save, X, Calendar, Heart } from 'lucide-react';
import type { MoodEntry, EmotionType } from '../../shared/types';

interface EditingEntry {
  id: string;
  emotion: EmotionType;
  notes: string;
  date: string;
}

const ManageEntries: React.FC = () => {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<EditingEntry | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEmotion, setFilterEmotion] = useState<EmotionType | 'all'>('all');
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  const emotions: EmotionType[] = [
    'happy', 'sad', 'angry', 'anxious', 'calm', 'excited',
    'stressed', 'peaceful', 'frustrated', 'content', 'overwhelmed', 'grateful'
  ];

  const emotionColors: Record<EmotionType, string> = {
    happy: 'bg-yellow-100 text-yellow-800',
    sad: 'bg-blue-100 text-blue-800',
    angry: 'bg-red-100 text-red-800',
    anxious: 'bg-orange-100 text-orange-800',
    calm: 'bg-green-100 text-green-800',
    excited: 'bg-pink-100 text-pink-800',
    stressed: 'bg-red-100 text-red-800',
    peaceful: 'bg-green-100 text-green-800',
    frustrated: 'bg-red-100 text-red-800',
    content: 'bg-blue-100 text-blue-800',
    overwhelmed: 'bg-purple-100 text-purple-800',
    grateful: 'bg-emerald-100 text-emerald-800'
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/entries?limit=100');
      const data = await response.json();
      if (data.success) {
        setEntries(data.data);
      }
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (entry: MoodEntry) => {
    setEditingEntry({
      id: entry.id,
      emotion: entry.emotion,
      notes: entry.notes || '',
      date: entry.date.split('T')[0] // Convert to YYYY-MM-DD format
    });
  };

  const handleSaveEdit = async () => {
    if (!editingEntry) return;

    try {
      const response = await fetch(`/api/entries/${editingEntry.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emotion: editingEntry.emotion,
          notes: editingEntry.notes,
          date: new Date(editingEntry.date + 'T12:00:00.000Z').toISOString()
        }),
      });

      const data = await response.json();
      if (data.success) {
        setEntries(entries.map(entry => 
          entry.id === editingEntry.id ? data.data : entry
        ));
        setEditingEntry(null);
      }
    } catch (error) {
      console.error('Error updating entry:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/entries/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        setEntries(entries.filter(entry => entry.id !== id));
        setDeleteConfirm(null);
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.notes?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         entry.emotion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEmotion = filterEmotion === 'all' || entry.emotion === filterEmotion;
    return matchesSearch && matchesEmotion;
  });

  // 分页计算
  const totalItems = filteredEntries.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEntries = filteredEntries.slice(startIndex, endIndex);

  // 当筛选条件改变时重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterEmotion]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">{t('manage.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl text-white">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('manage.title')}</h1>
              <p className="text-gray-600">{t('manage.subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder={t('manage.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
            <div className="md:w-48">
              <select
                value={filterEmotion}
                onChange={(e) => setFilterEmotion(e.target.value as EmotionType | 'all')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="all">{t('manage.allEmotions')}</option>
                {emotions.map(emotion => (
                  <option key={emotion} value={emotion}>
                    {t(`emotions.${emotion}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Entries List */}
        <div className="space-y-4">
          {totalItems === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('manage.noEntries')}</h3>
              <p className="text-gray-600">{t('manage.noEntriesDesc')}</p>
            </div>
          ) : (
            currentEntries.map(entry => (
              <div key={entry.id} className="bg-white rounded-xl shadow-sm p-6">
                {editingEntry?.id === entry.id ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('manage.emotion')}
                        </label>
                        <select
                          value={editingEntry.emotion}
                          onChange={(e) => setEditingEntry({
                            ...editingEntry,
                            emotion: e.target.value as EmotionType
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        >
                          {emotions.map(emotion => (
                            <option key={emotion} value={emotion}>
                              {t(`emotions.${emotion}`)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="md:w-48">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('manage.date')}
                        </label>
                        <input
                          type="date"
                          value={editingEntry.date}
                          onChange={(e) => setEditingEntry({
                            ...editingEntry,
                            date: e.target.value
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('manage.notes')}
                      </label>
                      <textarea
                        value={editingEntry.notes}
                        onChange={(e) => setEditingEntry({
                          ...editingEntry,
                          notes: e.target.value
                        })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder={t('manage.notesPlaceholder')}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveEdit}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        {t('common.save')}
                      </button>
                      <button
                        onClick={() => setEditingEntry(null)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        {t('common.cancel')}
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${emotionColors[entry.emotion]}`}>
                          {t(`emotions.${entry.emotion}`)}
                        </span>
                        <div className="flex items-center gap-1 text-gray-500 text-sm">
                          <Calendar className="w-4 h-4" />
                          {formatDate(entry.date)}
                        </div>
                      </div>
                      {entry.notes && (
                        <p className="text-gray-700 mb-3">{entry.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(entry)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title={t('common.edit')}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {deleteConfirm === entry.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                          >
                            {t('common.confirm')}
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                          >
                            {t('common.cancel')}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(entry.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title={t('common.delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                {t('manage.pagination.showing', {
                  start: startIndex + 1,
                  end: Math.min(endIndex, totalItems),
                  total: totalItems
                })}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {t('manage.pagination.previous')}
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (currentPage <= 4) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 3) {
                      pageNum = totalPages - 6 + i;
                    } else {
                      pageNum = currentPage - 3 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                          currentPage === pageNum
                            ? 'bg-pink-500 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {t('manage.pagination.next')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Summary */}
        {totalItems > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('manage.summary')}</h3>
            <p className="text-gray-600">
              {t('manage.totalEntries', { count: totalItems })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageEntries;