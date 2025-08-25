import React from 'react';
import { format, subDays, isAfter, isBefore } from 'date-fns';
import { Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface DateSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  minDate?: string;
  maxDate?: string;
  className?: string;
}

export default function DateSelector({ 
  selectedDate, 
  onDateChange, 
  minDate,
  maxDate = format(new Date(), 'yyyy-MM-dd'),
  className = '' 
}: DateSelectorProps) {
  const { t } = useTranslation();
  const currentDate = new Date(selectedDate);
  

  
  // 处理直接输入日期
  const handleDateInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = event.target.value;
    if (newDate) {
      // 验证日期范围
      const dateObj = new Date(newDate);
      const isValidMin = !minDate || !isBefore(dateObj, new Date(minDate));
      const isValidMax = !isAfter(dateObj, new Date(maxDate));
      
      if (isValidMin && isValidMax) {
        onDateChange(newDate);
      }
    }
  };
  
  // 快速选择选项
  const quickSelectOptions = [
    {
      label: t('dateSelector.today'),
      value: format(new Date(), 'yyyy-MM-dd'),
      disabled: isAfter(new Date(), new Date(maxDate))
    },
    {
      label: t('dateSelector.yesterday'),
      value: format(subDays(new Date(), 1), 'yyyy-MM-dd'),
      disabled: minDate ? isBefore(subDays(new Date(), 1), new Date(minDate)) : false
    },
    {
      label: t('dateSelector.threeDaysAgo'),
      value: format(subDays(new Date(), 3), 'yyyy-MM-dd'),
      disabled: minDate ? isBefore(subDays(new Date(), 3), new Date(minDate)) : false
    },
    {
      label: t('dateSelector.oneWeekAgo'),
      value: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
      disabled: minDate ? isBefore(subDays(new Date(), 7), new Date(minDate)) : false
    }
  ];
  
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">{t('dateSelector.selectDate')}</h3>
        </div>
      </div>
      
      {/* 日期输入框 */}
      <div className="mb-4">
        <input
          id="date-input"
          type="date"
          value={selectedDate}
          onChange={handleDateInputChange}
          min={minDate}
          max={maxDate}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
      </div>
      
      {/* 快速选择选项 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('dateSelector.quickSelect')}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {quickSelectOptions.map((option) => (
            <button
              key={option.label}
              onClick={() => !option.disabled && onDateChange(option.value)}
              disabled={option.disabled}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                selectedDate === option.value
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : option.disabled
                  ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* 日期范围提示 */}
      {(minDate || maxDate) && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            {t('dateSelector.availableDateRange')}: 
            {minDate && (
              <span className="font-medium">
                {format(new Date(minDate), 'MMM d, yyyy')}
              </span>
            )}
            {minDate && maxDate && ` ${t('dateSelector.to')} `}
            {maxDate && (
              <span className="font-medium">
                {format(new Date(maxDate), 'MMM d, yyyy')}
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}