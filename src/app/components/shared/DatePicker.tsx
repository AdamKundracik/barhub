import React, { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { InputWrapper } from './InputWrapper';
import {
  primaryBgColor,
  primaryColor,
  secondaryTextColor,
} from '../../utils/styles/colors';
import { useTranslation } from 'react-i18next';

type DatePickerProps = {
  onDateChange: (date: string) => void;
};

const DatePicker = (props: DatePickerProps) => {
  // Accept a prop from the parent component
  const { t } = useTranslation();

  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [year, setYear] = useState('');

  const days = Array.from({ length: 31 }, (_, i) => ({
    label: String(i + 1).padStart(2, '0'),
    value: String(i + 1).padStart(2, '0'),
  }));

  const months = Array.from({ length: 12 }, (_, i) => ({
    label: String(i + 1).padStart(2, '0'),
    value: String(i + 1).padStart(2, '0'),
  }));

  const years = Array.from({ length: 201 }, (_, i) => ({
    label: String(1900 + i),
    value: String(1900 + i),
  }));

  // Generate ISO date string whenever the user selects a complete date
  useEffect(() => {
    if (month && day && year) {
      const date = new Date(`${year}-${month}-${day}T00:00:00Z`);
      props.onDateChange(date.toISOString()); // Pass the ISO string to the parent
    }
  }, [month, day, year]);

  return (
    <View style={styles.container}>
      <View style={styles.datePickerContainer}>
        <View style={styles.inputWrapper}>
          <InputWrapper inputLabel={t('month')}>
            <RNPickerSelect
              onValueChange={value => setMonth(value)}
              items={months}
              placeholder={{ label: 'MM', value: null }}
              value={month}
              style={pickerSelectStyles}
              useNativeAndroidPickerStyle={false}
            />
          </InputWrapper>
        </View>

        <View style={styles.inputWrapper}>
          <InputWrapper inputLabel={t('day')}>
            <RNPickerSelect
              onValueChange={value => setDay(value)}
              items={days}
              placeholder={{ label: 'DD', value: null }}
              value={day}
              style={pickerSelectStyles}
              useNativeAndroidPickerStyle={false}
            />
          </InputWrapper>
        </View>

        <View style={styles.inputWrapper}>
          <InputWrapper inputLabel={t('year')}>
            <RNPickerSelect
              onValueChange={value => setYear(value)}
              items={years}
              placeholder={{ label: 'YYYY', value: null }}
              value={year}
              style={pickerSelectStyles}
              useNativeAndroidPickerStyle={false}
            />
          </InputWrapper>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  inputWrapper: {
    flex: 1,
  },
});

// Custom styles for the picker select component
const pickerSelectStyles = {
  inputIOS: {
    backgroundColor: primaryBgColor,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: primaryColor,
    borderRadius: 20,
    color: secondaryTextColor,
    paddingRight: 30,
  },
  inputAndroid: {
    backgroundColor: primaryBgColor,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: primaryColor,
    borderRadius: 20,
    color: secondaryTextColor,
    paddingRight: 30,
  },
};

export default DatePicker;
