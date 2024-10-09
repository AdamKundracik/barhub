import React, { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { InputWrapper } from './InputWrapper';
import {
  primaryGrey,
  primaryColor,
  primaryTextColor,
} from '../../utils/styles/colors';
import { useTranslation } from 'react-i18next';

type DatePickerProps = {
  onDateChange: (date: string) => void;
  initialValue?: Date | null;
};

const DatePicker = (props: DatePickerProps) => {
  const { t } = useTranslation();

  // Initialize state for month, day, year with local state
  const [month, setMonth] = useState<string>('');
  const [day, setDay] = useState<string>('');
  const [year, setYear] = useState<string>('');

  // Set the initial values based on initialValue once (when component mounts)
  useEffect(() => {
    if (props.initialValue) {
      const initDate = props.initialValue;
      setMonth(String(initDate.getMonth() + 1).padStart(2, '0')); // Months are 0-indexed in JS
      setDay(String(initDate.getDate()).padStart(2, '0'));
      setYear(String(initDate.getFullYear()));
    }
  }, []); // Empty dependency array ensures this effect only runs once on mount

  // Generate date objects for the picker values
  const days = Array.from({ length: 31 }, (_, i) => ({
    label: String(i + 1).padStart(2, '0'),
    value: String(i + 1).padStart(2, '0'),
  }));

  const months = Array.from({ length: 12 }, (_, i) => ({
    label: String(i + 1).padStart(2, '0'),
    value: String(i + 1).padStart(2, '0'),
  }));

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1919 }, (_, i) => ({
    label: String(1920 + i),
    value: String(1920 + i),
  }));

  // Call onDateChange only when all three fields (month, day, year) are selected
  useEffect(() => {
    if (month && day && year) {
      const date = new Date(`${year}-${month}-${day}T00:00:00Z`);
      if (!isNaN(date.getTime())) {
        props.onDateChange(date.toISOString());
      }
    }
  }, [month, day, year]); // Removed props from dependency array

  return (
    <View style={styles.container}>
      <View style={styles.datePickerContainer}>
        {/* Month Picker */}
        <View style={styles.inputWrapper}>
          <InputWrapper inputLabel={t('month')}>
            <RNPickerSelect
              onValueChange={value => setMonth(value)} // Update state on picker change
              items={months}
              placeholder={{ label: 'MM', value: null }}
              value={month || null} // Dynamically bind the state to the picker
              style={pickerSelectStyles}
              useNativeAndroidPickerStyle={false}
            />
          </InputWrapper>
        </View>

        {/* Day Picker */}
        <View style={styles.inputWrapper}>
          <InputWrapper inputLabel={t('day')}>
            <RNPickerSelect
              onValueChange={value => setDay(value)} // Update state on picker change
              items={days}
              placeholder={{ label: 'DD', value: null }}
              value={day || null} // Dynamically bind the state to the picker
              style={pickerSelectStyles}
              useNativeAndroidPickerStyle={false}
            />
          </InputWrapper>
        </View>

        {/* Year Picker */}
        <View style={styles.inputWrapper}>
          <InputWrapper inputLabel={t('year')}>
            <RNPickerSelect
              onValueChange={value => setYear(value)} // Update state on picker change
              items={years}
              placeholder={{
                label: 'YYYY',
                value: null,
              }}
              value={year || null} // Dynamically bind the state to the picker
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

const pickerSelectStyles = {
  inputIOS: {
    backgroundColor: primaryGrey,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: primaryColor,
    borderRadius: 20,
    color: primaryTextColor,
    paddingRight: 30,
  },
  inputAndroid: {
    backgroundColor: primaryGrey,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: primaryColor,
    borderRadius: 20,
    color: primaryTextColor,
    paddingRight: 30,
  },
};

export default DatePicker;
