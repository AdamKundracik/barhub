import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { t, i18n } = useTranslation();

  const changeLanguage = (value: string) => {
    if (value) {
      i18n.changeLanguage(value);
    }
  };

  const languages = [
    {
      label: 'English',
      value: 'en',
      icon: require('./../../../../../assets/flags/uk.png'),
    },
    {
      label: 'Slovak',
      value: 'sk',
      icon: require('./../../../../../assets/flags/sk.png'),
    },
  ];

  return (
    <View style={styles.container}>
      <RNPickerSelect
        onValueChange={changeLanguage}
        items={languages}
        value={i18n.language}
        style={pickerSelectStyles}
        useNativeAndroidPickerStyle={false}
        Icon={() => {
          const selectedLanguage = languages.find(
            lang => lang.value === i18n.language
          );
          return selectedLanguage ? (
            <Image source={selectedLanguage.icon} style={styles.flagIcon} />
          ) : null;
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    maxWidth: 150,
    borderRadius: 12,
  },
  flagIcon: {
    width: 28,
    height: 28,
    marginRight: 10,
    marginTop: 8,
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderRadius: 0,
    color: 'black',
    paddingRight: 30,
  },
  inputAndroid: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderRadius: 0,
    color: 'black',
    paddingRight: 30,
  },
});

export default LanguageSwitcher;
