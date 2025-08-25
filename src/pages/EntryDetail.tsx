import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit3, Save, X, Trash2, Camera, Mic, Calendar, Clock, Heart } from 'lucide-react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import type { MoodEntry, MediaFile } from '../../shared/types';

const getEmotions = (t: any) => [
  { value: 'happy', label: t('emotions.happy'), emoji: '😊', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'sad', label: t('emotions.sad'), emoji: '😢', color: 'bg-blue-100 text-blue-800' },
  { value: 'angry', label: t('emotions.angry'), emoji: '😠', color: 'bg-red-100 text-red-800' },
  { value: 'anxious', label: t('emotions.anxious'), emoji: '😰', color: 'bg-orange-100 text-orange-800' },
  { value: 'excited', label: t('emotions.excited'), emoji: '🤩', color: 'bg-pink-100 text-pink-800' },
  { value: 'calm', label: t('emotions.calm'), emoji: '😌', color: 'bg-green-100 text-green-800' },
  { value: 'stressed', label: t('emotions.stressed'), emoji: '😫', color: 'bg-purple-100 text-purple-800' },
  { value: 'grateful', label: t('emotions.grateful'), emoji: '🙏', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'content', label: t('emotions.content'), emoji: '😊', color: 'bg-teal-100 text-teal-800' },
  { value: 'peaceful', label: t('emotions.peaceful'), emoji: '😌', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'frustrated', label: t('emotions.frustrated'), emoji: '😤', color: 'bg-red-200 text-red-900' },
  { value: 'overwhelmed', label: t('emotions.overwhelmed'), emoji: '😵', color: 'bg-gray-100 text-gray-800' }
];

const getMoodLevels = (t: any) => [
  { value: 1, label: t('moodLevels.veryLow'), emoji: '😞', color: 'bg-red-500' },
  { value: 2, label: t('moodLevels.low'), emoji: '😔', color: 'bg-orange-500' },
  { value: 3, label: t('moodLevels.neutral'), emoji: '😐', color: 'bg-yellow-500' },
  { value: 4, label: t('moodLevels.good'), emoji: '😊', color: 'bg-lime-500' },
  { value: 5, label: t('moodLevels.excellent'), emoji: '😄', color: 'bg-green-500' }
];

const EntryDetail: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<MoodEntry | null>(null);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  
  const emotions = getEmotions(t);
  const moodLevels = getMoodLevels(t);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    mood_level: 3,
    emotion: 'happy',
    notes: '',
    tags: ''
  });

  useEffect(() => {
    if (id) {
      fetchEntry();
    }
  }, [id]);

  const fetchEntry = async () => {
    try {
      const response = await fetch(`/api/entries/${id}`);
      if (response.ok) {
        const data = await response.json();
        setEntry(data.data);
        setEditForm({
          mood_level: data.data.mood_level,
          emotion: data.data.emotion,
          notes: data.data.notes || '',
          tags: data.data.tags || ''
        });
        
        // Fetch media files
        const mediaResponse = await fetch(`/api/upload/files/${id}`);
        if (mediaResponse.ok) {
          const mediaData = await mediaResponse.json();
          setMediaFiles(mediaData.data || []);
        }
      } else {
        console.error('Entry not found');
        navigate('/history');
      }
    } catch (error) {
      console.error('Error fetching entry:', error);
      navigate('/history');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!entry) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/entries/${entry.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });
      
      if (response.ok) {
        const data = await response.json();
        setEntry(data.data);
        setIsEditing(false);
      } else {
        console.error('Failed to update entry');
      }
    } catch (error) {
      console.error('Error updating entry:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!entry || !confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
      return;
    }
    
    setDeleting(true);
    try {
      const response = await fetch(`/api/entries/${entry.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        navigate('/history');
      } else {
        console.error('Failed to delete entry');
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
    } finally {
      setDeleting(false);
    }
  };

  const handleFileDelete = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/upload/files/${fileId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setMediaFiles(prev => prev.filter(file => file.id !== fileId));
      } else {
        console.error('Failed to delete file');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const getEmotionInfo = (emotion: string) => {
    return emotions.find(e => e.value === emotion) || emotions[0];
  };

  const getMoodInfo = (level: number) => {
    return moodLevels.find(m => m.value === level) || moodLevels[2];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('entryDetail.loading')}</p>
        </div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">{t('entryDetail.notFound')}</p>
          <button
            onClick={() => navigate('/history')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('entryDetail.backToHistory')}
          </button>
        </div>
      </div>
    );
  }

  const emotionInfo = getEmotionInfo(entry.emotion);
  const moodInfo = getMoodInfo(entry.mood_level);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/history')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{t('entryDetail.backToHistory')}</span>
          </button>
          
          <div className="flex items-center space-x-3">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>{t('entryDetail.edit')}</span>
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{deleting ? t('entryDetail.deleting') : t('entryDetail.delete')}</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? t('entryDetail.saving') : t('entryDetail.save')}</span>
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditForm({
                      mood_level: entry.mood_level,
                      emotion: entry.emotion,
                      notes: entry.notes || '',
                      tags: entry.tags || ''
                    });
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>{t('entryDetail.cancel')}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Entry Content */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-lg border border-white/50 overflow-hidden">
          {/* Date and Time Header */}
          <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Calendar className="w-6 h-6" />
                <div>
                  <h1 className="text-2xl font-light">
                    {format(new Date(entry.created_at), 'EEEE, MMMM d, yyyy')}
                  </h1>
                  <div className="flex items-center space-x-2 text-rose-100">
                    <Clock className="w-4 h-4" />
                    <span>{format(new Date(entry.created_at), 'h:mm a')}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl mb-1">{emotionInfo.emoji}</div>
                <div className="text-sm text-rose-100">{emotionInfo.label}</div>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Mood and Emotion */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800 flex items-center">
                  <Heart className="w-5 h-5 mr-2 text-rose-500" />
                  {t('entryDetail.moodLevel')}
                </h3>
                {isEditing ? (
                  <div className="space-y-3">
                    {moodLevels.map(mood => (
                      <label key={mood.value} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="mood_level"
                          value={mood.value}
                          checked={editForm.mood_level === mood.value}
                          onChange={(e) => setEditForm(prev => ({ ...prev, mood_level: parseInt(e.target.value) }))}
                          className="text-rose-500"
                        />
                        <div className="flex items-center space-x-2">
                          <div className={`w-4 h-4 rounded-full ${mood.color}`}></div>
                          <span className="text-2xl">{mood.emoji}</span>
                          <span className="text-gray-700">{mood.label}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
                    <div className={`w-6 h-6 rounded-full ${moodInfo.color}`}></div>
                    <span className="text-3xl">{moodInfo.emoji}</span>
                    <span className="text-xl font-medium text-gray-800">{moodInfo.label}</span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800">{t('entryDetail.primaryEmotion')}</h3>
                {isEditing ? (
                  <div className="grid grid-cols-2 gap-2">
                    {emotions.map(emotion => (
                      <label key={emotion.value} className="flex items-center space-x-2 cursor-pointer p-2 rounded-xl hover:bg-gray-50">
                        <input
                          type="radio"
                          name="emotion"
                          value={emotion.value}
                          checked={editForm.emotion === emotion.value}
                          onChange={(e) => setEditForm(prev => ({ ...prev, emotion: e.target.value }))}
                          className="text-rose-500"
                        />
                        <span className="text-xl">{emotion.emoji}</span>
                        <span className="text-sm text-gray-700">{emotion.label}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl ${emotionInfo.color}`}>
                    <span className="text-2xl">{emotionInfo.emoji}</span>
                    <span className="font-medium">{emotionInfo.label}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-800">{t('entryDetail.notes')}</h3>
              {isEditing ? (
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="How are you feeling? What's on your mind?"
                  className="w-full h-32 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
                />
              ) : (
                <div className="p-4 bg-gray-50 rounded-xl min-h-[100px]">
                  {entry.notes ? (
                    <p className="text-gray-700 whitespace-pre-wrap">{entry.notes}</p>
                  ) : (
                    <p className="text-gray-400 italic">No notes added</p>
                  )}
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-800">{t('entryDetail.tags')}</h3>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.tags}
                  onChange={(e) => setEditForm(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder={t('entryDetail.tagsPlaceholder')}
                  className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {entry.tags ? (
                    entry.tags.split(',').map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-sm"
                      >
                        {tag.trim()}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-400 italic">No tags added</p>
                  )}
                </div>
              )}
            </div>

            {/* Media Files */}
            {mediaFiles.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800">{t('entryDetail.mediaFiles')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mediaFiles.map(file => (
                    <div key={file.id} className="relative group">
                      {file.file_type.startsWith('image/') ? (
                        <div className="relative">
                          <img
                            src={`/uploads/${file.file_path}`}
                            alt="Mood entry attachment"
                            className="w-full h-48 object-cover rounded-xl"
                          />
                          <div className="absolute top-2 left-2 p-1 bg-white/80 rounded-lg">
                            <Camera className="w-4 h-4 text-gray-600" />
                          </div>
                        </div>
                      ) : file.file_type.startsWith('audio/') ? (
                        <div className="flex items-center justify-center h-48 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl">
                          <div className="text-center">
                            <Mic className="w-12 h-12 text-purple-500 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">Voice Note</p>
                            <audio controls className="mt-2">
                              <source src={`/uploads/${file.file_path}`} type={file.file_type} />
                            </audio>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-48 bg-gray-100 rounded-xl">
                          <div className="text-center">
                            <div className="text-4xl mb-2">📎</div>
                            <p className="text-sm text-gray-600">{file.original_name}</p>
                          </div>
                        </div>
                      )}
                      
                      {isEditing && (
                        <button
                          onClick={() => handleFileDelete(file.id)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          title={t('entryDetail.deleteFile')}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EntryDetail;