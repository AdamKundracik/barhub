import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import RNPickerSelect from 'react-native-picker-select'; // Import the picker component
import { InputWrapper } from './InputWrapper'; // Adjust the import path as necessary
import {
  primaryBgColor,
  primaryColor,
  secondaryTextColor,
} from '../../utils/styles/colors'; // Adjust the path as necessary

const DatePicker = () => {
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [year, setYear] = useState('');

  // Generate days (1-31)
  const days = Array.from({ length: 31 }, (_, i) => ({
    label: String(i + 1).padStart(2, '0'),
    value: String(i + 1).padStart(2, '0'),
  }));

  // Generate months (1-12)
  const months = Array.from({ length: 12 }, (_, i) => ({
    label: String(i + 1).padStart(2, '0'),
    value: String(i + 1).padStart(2, '0'),
  }));

  // Generate years (1900-2100)
  const years = Array.from({ length: 201 }, (_, i) => ({
    label: String(1900 + i),
    value: String(1900 + i),
  }));

  return (
    <View style={styles.container}>
      <View style={styles.datePickerContainer}>
        {/* Month Picker */}
        <View style={styles.inputWrapper}>
          <InputWrapper inputLabel="Month">
            <RNPickerSelect
              onValueChange={value => setMonth(value)}
              items={months}
              placeholder={{ label: 'MM', value: null }}
              value={month}
              style={pickerSelectStyles}
              useNativeAndroidPickerStyle={false} // Disable native picker styles on Android
            />
          </InputWrapper>
        </View>

        <Text style={styles.separator}>/</Text>

        {/* Day Picker */}
        <View style={styles.inputWrapper}>
          <InputWrapper inputLabel="Day">
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

        <Text style={styles.separator}>/</Text>

        {/* Year Picker */}
        <View style={styles.inputWrapper}>
          <InputWrapper inputLabel="Year">
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
    flex: 1, // Takes up equal space for each input field
  },
  separator: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 5,
  },
});

// Custom styles for the picker select component
const pickerSelectStyles = {
  inputIOS: {
    backgroundColor: primaryBgColor,
    fontSize: 18,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: primaryColor,
    borderRadius: 20,
    color: secondaryTextColor,
    paddingRight: 30, // Add padding to ensure the text is not clipped
  },
  inputAndroid: {
    backgroundColor: primaryBgColor,
    fontSize: 18,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: primaryColor,
    borderRadius: 20,
    color: secondaryTextColor,
    paddingRight: 30, // Add padding to ensure the text is not clipped
  },
};

export default DatePicker;
