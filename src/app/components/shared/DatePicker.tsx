import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import {
  primaryColor,
  primaryGrey,
  primaryTextColor,
} from '../../utils/styles/colors';
import { useTranslation } from 'react-i18next';

type DatePickerProps = {
  onDateChange: (date: string) => void;
  initialValue?: Date | null;
};

const DatePicker = ({ onDateChange, initialValue }: DatePickerProps) => {
  const { t } = useTranslation();

  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [year, setYear] = useState('');

  const [monthError, setMonthError] = useState('');
  const [dayError, setDayError] = useState('');
  const [yearError, setYearError] = useState('');

  useEffect(() => {
    if (initialValue && !month && !day && !year) {
      const initDate = initialValue;
      setMonth(String(initDate.getMonth() + 1));
      setDay(String(initDate.getDate()));
      setYear(String(initDate.getFullYear()));
    }
  }, [initialValue]);

  // Validate inputs on change
  useEffect(() => {
    // Validate month
    const monthNum = Number(month);
    if (!month || monthNum < 1 || monthNum > 12)
      setMonthError(t('invalid-month'));
    else setMonthError('');

    // Validate year
    const yearNum = Number(year);
    if (!year || yearNum < 1900 || yearNum > new Date().getFullYear())
      setYearError(t('invalid-year'));
    else setYearError('');

    // Validate day
    const dayNum = Number(day);
    const maxDay =
      month && year ? new Date(Number(year), Number(month), 0).getDate() : 31;
    if (!day || dayNum < 1 || dayNum > maxDay) setDayError(t('invalid-day'));
    else setDayError('');

    // Emit valid date
    if (!monthError && !dayError && !yearError && month && day && year) {
      const paddedMonth = month.padStart(2, '0');
      const paddedDay = day.padStart(2, '0');
      const date = new Date(`${year}-${paddedMonth}-${paddedDay}T00:00:00`);
      if (!isNaN(date.getTime())) onDateChange(date.toISOString());
    }
  }, [month, day, year, monthError, dayError, yearError]);

  const renderInput = (
    label: string,
    value: string,
    onChange: (text: string) => void,
    error: string,
    placeholder: string
  ) => (
    <View style={{ flex: 1 }}>
      <TextInput
        style={[styles.input, error && { borderColor: '#ff4d4d' }]}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.5)"
        keyboardType="numeric"
        value={value}
        onChangeText={onChange}
        maxLength={label === t('year') ? 4 : 2}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.datePickerContainer}>
        <View style={{ flex: 1 }}>
          {renderInput(t('month'), month, setMonth, monthError, 'MM')}
        </View>
        <View style={{ flex: 1 }}>
          {renderInput(t('day'), day, setDay, dayError, 'DD')}
        </View>
        <View style={{ flex: 2 }}>
          {renderInput(t('year'), year, setYear, yearError, 'YYYY')}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 12,
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    gap: 14,
  },
  input: {
    backgroundColor: primaryGrey,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1.2,
    borderColor: primaryColor,
    borderRadius: 20,
    color: primaryTextColor,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '500',
  },
  errorText: {
    color: '#ff4d4d',
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
    opacity: 0.85,
  },
});

export default DatePicker;
