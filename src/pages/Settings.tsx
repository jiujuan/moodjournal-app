import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Bell, Moon, Sun, Download, Upload, Trash2, Save, User, Shield, Palette, Database } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { UserSetting } from '../../shared/types';

interface SettingsData {
  notifications: boolean;
  darkMode: boolean;
  reminderTime: string;
  reminderDays: string[];
  exportFormat: 'json' | 'csv';
  autoBackup: boolean;
  dataRetention: number; // days
  theme: 'light' | 'dark';
}

const defaultSettings: SettingsData = {
  notifications: true,
  darkMode: false,
  reminderTime: '20:00',
  reminderDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
  exportFormat: 'json',
  autoBackup: false,
  dataRetention: 365,
  theme: 'light'
};

const themes = [
  { value: 'light', label: 'Light', colors: 'from-rose-50 via-pink-50 to-purple-50' },
  { value: 'dark', label: 'Dark', colors: 'from-gray-800 via-gray-900 to-black' }
];

const weekDays = [
  { value: 'monday', label: 'Mon' },
  { value: 'tuesday', label: 'Tue' },
  { value: 'wednesday', label: 'Wed' },
  { value: 'thursday', label: 'Thu' },
  { value: 'friday', label: 'Fri' },
  { value: 'saturday', label: 'Sat' },
  { value: 'sunday', label: 'Sun' }
];

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'data' | 'appearance'>('general');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        const loadedSettings = { ...defaultSettings };
        
        // Parse settings from API response
        data.data.forEach((setting: UserSetting) => {
          if (setting.key === 'notifications_enabled') {
            loadedSettings.notifications = setting.value === 'true';
          } else if (setting.key === 'reminder_time') {
            loadedSettings.reminderTime = setting.value;
          } else if (setting.key === 'theme') {
            loadedSettings.theme = setting.value as 'light' | 'dark';
          } else if (setting.key === 'data_retention_days') {
            loadedSettings.dataRetention = parseInt(setting.value);
          } else {
            (loadedSettings as any)[setting.key] = setting.value;
          }
        });
        
        setSettings(loadedSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const settingsArray = Object.entries(settings).map(([key, value]) => ({
        setting_key: key,
        setting_value: Array.isArray(value) ? JSON.stringify(value) : String(value)
      }));

      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ settings: settingsArray })
      });

      if (response.ok) {
        // Settings saved successfully
        console.log('Settings saved successfully');
      } else {
        console.error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const exportData = async () => {
    setExportLoading(true);
    try {
      const response = await fetch(`/api/entries/export?format=${settings.exportFormat}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mood-journal-export.${settings.exportFormat}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Failed to export data');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
    } finally {
      setExportLoading(false);
    }
  };

  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/entries/import', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        console.log('Data imported successfully');
        // Refresh the page or update the UI
        window.location.reload();
      } else {
        console.error('Failed to import data');
      }
    } catch (error) {
      console.error('Error importing data:', error);
    } finally {
      setImportLoading(false);
    }
  };

  const clearAllData = async () => {
    if (!confirm(t('settings.data.confirmClearData'))) {
      return;
    }

    try {
      const response = await fetch('/api/entries', {
        method: 'DELETE'
      });

      if (response.ok) {
        console.log('All data cleared successfully');
        // Refresh the page or update the UI
        window.location.reload();
      } else {
        console.error('Failed to clear data');
      }
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  };

  const updateSetting = <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const toggleReminderDay = (day: string) => {
    const newDays = settings.reminderDays.includes(day)
      ? settings.reminderDays.filter(d => d !== day)
      : [...settings.reminderDays, day];
    updateSetting('reminderDays', newDays);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('settings.loading')}</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: 'general', label: t('settings.tabs.general'), icon: User },
    { key: 'notifications', label: t('settings.tabs.notifications'), icon: Bell },
    { key: 'appearance', label: t('settings.tabs.appearance'), icon: Palette },
    { key: 'data', label: t('settings.tabs.data'), icon: Database }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-light text-gray-800 mb-2 flex items-center justify-center">
            <SettingsIcon className="w-8 h-8 mr-3 text-indigo-500" />
            {t('settings.title')}
          </h1>
          <p className="text-lg text-gray-600">
            {t('settings.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-white/50 sticky top-8">
              <nav className="space-y-2">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        activeTab === tab.key
                          ? 'bg-indigo-500 text-white shadow-md'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-white/50">
              {/* General Settings */}
              {activeTab === 'general' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-light text-gray-800 mb-6">{t('settings.general.title')}</h2>
                    
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <h3 className="font-medium text-gray-800">{t('settings.general.autoBackup')}</h3>
                          <p className="text-sm text-gray-600">{t('settings.general.autoBackupDesc')}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.autoBackup}
                            onChange={(e) => updateSetting('autoBackup', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-xl">
                        <h3 className="font-medium text-gray-800 mb-3">{t('settings.general.dataRetention')}</h3>
                        <p className="text-sm text-gray-600 mb-4">{t('settings.general.dataRetentionDesc')}</p>
                        <input
                          type="number"
                          min="30"
                          max="3650"
                          value={settings.dataRetention}
                          onChange={(e) => updateSetting('dataRetention', parseInt(e.target.value))}
                          className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notification Settings */}
              {activeTab === 'notifications' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-light text-gray-800 mb-6">{t('settings.notifications.title')}</h2>
                    
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <h3 className="font-medium text-gray-800">{t('settings.notifications.enable')}</h3>
                          <p className="text-sm text-gray-600">{t('settings.notifications.enableDesc')}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.notifications}
                            onChange={(e) => updateSetting('notifications', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>

                      {settings.notifications && (
                        <>
                          <div className="p-4 bg-gray-50 rounded-xl">
                            <h3 className="font-medium text-gray-800 mb-3">{t('settings.notifications.reminderTime')}</h3>
                            <input
                              type="time"
                              value={settings.reminderTime}
                              onChange={(e) => updateSetting('reminderTime', e.target.value)}
                              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                          </div>

                          <div className="p-4 bg-gray-50 rounded-xl">
                            <h3 className="font-medium text-gray-800 mb-3">{t('settings.notifications.reminderDays')}</h3>
                            <div className="grid grid-cols-7 gap-2">
                              {weekDays.map(day => (
                                <button
                                  key={day.value}
                                  onClick={() => toggleReminderDay(day.value)}
                                  className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                                    settings.reminderDays.includes(day.value)
                                      ? 'bg-indigo-500 text-white'
                                      : 'bg-white text-gray-600 hover:bg-gray-100'
                                  }`}
                                >
                                  {day.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Appearance Settings */}
              {activeTab === 'appearance' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-light text-gray-800 mb-6">{t('settings.appearance.title')}</h2>
                    
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <h3 className="font-medium text-gray-800">{t('settings.appearance.darkMode')}</h3>
                          <p className="text-sm text-gray-600">{t('settings.appearance.darkModeDesc')}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.darkMode}
                            onChange={(e) => updateSetting('darkMode', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-xl">
                        <h3 className="font-medium text-gray-800 mb-4">{t('settings.appearance.colorTheme')}</h3>
                        <div className="grid grid-cols-2 gap-4">
                          {themes.map(theme => (
                            <button
                              key={theme.value}
                              onClick={() => updateSetting('theme', theme.value as any)}
                              className={`p-4 rounded-xl border-2 transition-all ${
                                settings.theme === theme.value
                                  ? 'border-indigo-500 ring-2 ring-indigo-200'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className={`h-16 rounded-lg bg-gradient-to-r ${theme.colors} mb-2`}></div>
                              <p className="text-sm font-medium text-gray-800">{theme.label}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Data & Privacy Settings */}
              {activeTab === 'data' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-light text-gray-800 mb-6">{t('settings.data.title')}</h2>
                    
                    <div className="space-y-6">
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <h3 className="font-medium text-gray-800 mb-3">{t('settings.data.exportFormat')}</h3>
                        <div className="flex space-x-4">
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="exportFormat"
                              value="json"
                              checked={settings.exportFormat === 'json'}
                              onChange={(e) => updateSetting('exportFormat', e.target.value as any)}
                              className="text-indigo-500"
                            />
                            <span className="text-gray-700">JSON</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="exportFormat"
                              value="csv"
                              checked={settings.exportFormat === 'csv'}
                              onChange={(e) => updateSetting('exportFormat', e.target.value as any)}
                              className="text-indigo-500"
                            />
                            <span className="text-gray-700">CSV</span>
                          </label>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                          onClick={exportData}
                          disabled={exportLoading}
                          className="flex items-center justify-center space-x-2 p-4 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50"
                        >
                          <Download className="w-5 h-5" />
                          <span>{exportLoading ? t('settings.data.exporting') : t('settings.data.exportData')}</span>
                        </button>

                        <label className="flex items-center justify-center space-x-2 p-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors cursor-pointer">
                          <Upload className="w-5 h-5" />
                          <span>{importLoading ? t('settings.data.importing') : t('settings.data.importData')}</span>
                          <input
                            type="file"
                            accept=".json,.csv"
                            onChange={importData}
                            className="hidden"
                            disabled={importLoading}
                          />
                        </label>
                      </div>

                      <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                        <h3 className="font-medium text-red-800 mb-2 flex items-center">
                          <Shield className="w-5 h-5 mr-2" />
                          {t('settings.data.dangerZone')}
                        </h3>
                        <p className="text-sm text-red-600 mb-4">
                          {t('settings.data.dangerZoneDesc')}
                        </p>
                        <button
                          onClick={clearAllData}
                          className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>{t('settings.data.clearAllData')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="flex justify-end pt-8 border-t border-gray-200">
                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="flex items-center space-x-2 px-6 py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  <span>{saving ? t('settings.saving') : t('settings.saveSettings')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;