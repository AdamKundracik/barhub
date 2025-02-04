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

  const [month, setMonth] = useState<string>('');
  const [day, setDay] = useState<string>('');
  const [year, setYear] = useState<string>('');

  useEffect(() => {
    if (props.initialValue) {
      const initDate = props.initialValue;
      setMonth(String(initDate.getMonth() + 1).padStart(2, '0'));
      setDay(String(initDate.getDate()).padStart(2, '0'));
      setYear(String(initDate.getFullYear()));
    }
  }, []);

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

  useEffect(() => {
    if (month && day && year) {
      const date = new Date(`${year}-${month}-${day}T00:00:00Z`);
      if (!isNaN(date.getTime())) {
        props.onDateChange(date.toISOString());
      }
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
              value={month || null}
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
              value={day || null}
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
              placeholder={{
                label: 'YYYY',
                value: null,
              }}
              value={year || null}
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
