// Database entity types
export interface MoodEntry {
  id: string;
  emotion: EmotionType;
  mood_level: number;
  notes?: string;
  date: string; // ISO 8601 format
  tags?: string;
  created_at: string;
  updated_at: string;
}

export interface MediaFile {
  id: string;
  entry_id: string;
  file_path: string;
  file_type: string;
  file_size: number;
  original_name: string;
  created_at: string;
}

export interface UserSetting {
  key: string;
  value: string;
  updated_at: string;
}

export interface UserSettings {
  theme: 'light' | 'dark';
  notifications_enabled: boolean;
  reminder_time: string;
  first_day_of_week: number;
  data_retention_days: number;
}

// Emotion types
export type EmotionType = 
  | 'happy'
  | 'sad'
  | 'anxious'
  | 'calm'
  | 'excited'
  | 'stressed'
  | 'peaceful'
  | 'frustrated'
  | 'content'
  | 'overwhelmed'
  | 'angry'
  | 'grateful';

// API request/response types
export interface CreateEntryRequest {
  emotion: EmotionType;
  notes?: string;
  date: string;
  photoPath?: string;
  voicePath?: string;
}

export interface UpdateEntryRequest {
  emotion?: EmotionType;
  notes?: string;
  date?: string;
}

export interface GetEntriesRequest {
  startDate?: string;
  endDate?: string;
  emotion?: EmotionType;
  limit?: number;
  offset?: number;
}

export interface GetEntriesResponse {
  success: boolean;
  data: MoodEntry[];
  total: number;
}

export interface CreateEntryResponse {
  success: boolean;
  data: MoodEntry;
}

export interface AnalyticsRequest {
  period?: 'week' | 'month' | 'year';
  startDate?: string;
  endDate?: string;
}

export interface MoodTrendData {
  date: string;
  avg_mood: number;
  entry_count: number;
}

export interface EmotionBreakdown {
  emotion: string;
  count: number;
  percentage: number;
}

export interface WordFrequencyData {
  word: string;
  count: number;
}

export interface StreakData {
  current_streak: number;
  longest_streak: number;
  total_entries: number;
}

export interface AnalyticsResponse {
  success: boolean;
  data: {
    moodTrends: MoodTrendData[];
    emotionBreakdown: EmotionBreakdown[];
    wordFrequency: WordFrequencyData[];
    streakData: StreakData;
  };
}

export interface UploadResponse {
  success: boolean;
  filePath: string;
  fileSize: number;
}

// UI component types
export interface EmotionOption {
  value: EmotionType;
  label: string;
  icon: string;
  color: string;
}

export interface CalendarDay {
  date: string;
  entries: MoodEntry[];
  hasEntries: boolean;
}

export interface ChartDataPoint {
  date: string;
  [emotion: string]: string | number;
}

// Form types
export interface EntryFormData {
  emotion: EmotionType;
  notes: string;
  date: string;
  photo?: File;
  voice?: File;
}

export interface SettingsFormData {
  theme: 'light' | 'dark';
  notifications_enabled: boolean;
  reminder_time: string;
  first_day_of_week: number;
  data_retention_days: number;
}

// Error types
export interface ApiError {
  success: false;
  error: string;
  code?: string;
}

export type ApiResponse<T> = T | ApiError;