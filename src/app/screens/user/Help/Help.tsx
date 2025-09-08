import React, { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../../utils/icons/icons';
import {
  primaryBgColor,
  primaryColor,
  primaryTextColor,
  secondaryTextColor,
  textInputPlaceholderColor,
} from '../../../utils/styles/colors';
import { formStyles } from '../../../utils/styles/styles';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '../../../utils/types/screen-types';
import { useTranslation } from 'react-i18next';
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from '@/components/ui/form-control';
import { Input, InputField } from '@/components/ui/input';
import { Button, ButtonText } from '@/components/ui/button';
import { Textarea, TextareaInput } from '@/components/ui/textarea';
import { Center } from '@/components/ui/center';

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

            {/* Email input */}
            <FormControl style={formStyles.formControl}>
              <FormControlLabel>
                <FormControlLabelText style={{ color: primaryColor }}>
                  {t('input-email')}
                </FormControlLabelText>
              </FormControlLabel>
              <Input
                variant="rounded"
                size="xl"
                style={formStyles.inputPrimary}
              >
                <InputField
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email"
                  style={{ color: primaryTextColor }}
                />
              </Input>
            </FormControl>

            {/* Message input */}
            <FormControl style={formStyles.formControl}>
              <FormControlLabel>
                <FormControlLabelText style={{ color: primaryColor }}>
                  {t('any-questions')}
                </FormControlLabelText>
              </FormControlLabel>
              <Textarea
                size="md"
                isReadOnly={false}
                isInvalid={false}
                isDisabled={false}
                className="w-full"
                style={[formStyles.inputPrimary, { borderRadius: 20 }]}
              >
                <TextareaInput
                  placeholder="..."
                  placeholderTextColor={textInputPlaceholderColor}
                  style={{ color: primaryTextColor }}
                />
              </Textarea>
              <Text style={styles.characterCount}>
                {message.length}/{MAX_CHAR_COUNT}
              </Text>
            </FormControl>

            {/* Submit Button */}
            <Center>
              <Button
                variant="solid"
                size="md"
                action="primary"
                style={formStyles.buttonPrimary}
                onPress={() => {
                  console.log('Sending help request:', { email, message });
                }}
              >
                <ButtonText style={formStyles.buttonText}>
                  {t('send')}
                </ButtonText>
              </Button>
            </Center>
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
    padding: 0,
  },
  characterCount: {
    textAlign: 'right',
    color: secondaryTextColor,
    fontSize: 12,
    marginTop: 4,
  },
});

export default HelpScreen;
