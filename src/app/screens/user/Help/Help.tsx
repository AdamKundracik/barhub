import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { InputWrapper } from '../../../components/shared/InputWrapper';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../../utils/icons/icons';
import {
  primaryBgColor,
  primaryColor,
  primaryGrey,
  primaryTextColor,
  secondaryTextColor,
  textInputPlaceholderColor,
} from '../../../utils/styles/colors';
import { formStyles } from '../../../utils/styles/styles';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../../utils/types/screen-types';
import { useTranslation } from 'react-i18next';

const MAX_CHAR_COUNT = 300;

const HelpScreen = () => {
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleMessageChange = (text: string) => {
    if (text.length <= MAX_CHAR_COUNT) {
      setMessage(text);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView style={styles.flex} behavior="padding">
          <View style={styles.flexGrow}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <FontAwesomeIcon
                  icon={Icons.Remove}
                  size={28}
                  color={'white'}
                />
              </TouchableOpacity>
              <View style={styles.headerTitle}>
                <Text style={styles.title}>{t('help')}</Text>
                <Icon
                  name="help-circle-outline"
                  size={30}
                  color={primaryColor}
                />
              </View>
            </View>

            <Text style={styles.description}>{t('contact-us')}</Text>

            <View style={styles.separator} />

            <InputWrapper inputLabel={t('input-email')}>
              <TextInput
                value={email}
                onChangeText={setEmail}
                style={formStyles.inputPrimary}
                placeholder="Email"
                placeholderTextColor={textInputPlaceholderColor}
              />
            </InputWrapper>

            <InputWrapper inputLabel={t('any-questions')}>
              <TextInput
                value={message}
                onChangeText={handleMessageChange}
                style={styles.messageInput}
                placeholder="..."
                multiline
                placeholderTextColor={textInputPlaceholderColor}
              />
              <Text style={styles.characterCount}>
                {message.length}/{MAX_CHAR_COUNT}
              </Text>
            </InputWrapper>

            {/* Submit Button */}
            <TouchableOpacity style={formStyles.buttonPrimary}>
              <Text style={styles.submitText}>{t('send')}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: primaryBgColor,
  },
  flex: {
    flex: 1,
  },
  flexGrow: {
    flexGrow: 1,
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: primaryColor,
    marginRight: 10,
  },
  description: {
    fontSize: 14,
    color: secondaryTextColor,
    textAlign: 'right',
    marginBottom: 16,
  },
  separator: {
    height: 1,
    backgroundColor: primaryColor,
    marginVertical: 15,
  },
  messageInput: {
    minHeight: 120,
    backgroundColor: primaryGrey,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: primaryColor,
    color: primaryTextColor,
    textAlignVertical: 'top',
    padding: 15,
  },
  characterCount: {
    textAlign: 'right',
    color: secondaryTextColor,
    fontSize: 12,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: primaryColor,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HelpScreen;
