import AuthLayout from '../../components/auth/AuthLayout';
import { Alert } from 'react-native';
import { formStyles } from '../../utils/styles/styles';
import * as React from 'react';
import { useState } from 'react';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import { primaryColor, primaryTextColor } from '../../utils/styles/colors';
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from '@/components/ui/form-control';
import { Input, InputField } from '@/components/ui/input';
import { Button, ButtonSpinner, ButtonText } from '@/components/ui/button';
import { Center } from '@/components/ui/center';
import { Text } from '@/components/ui/text';

export const ForgotPassword = ({ navigation }: any) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const triggerResetPassword = async () => {
    const auth = getAuth();
    setLoading(true);
    await sendPasswordResetEmail(auth, email).then(() =>
      triggerResetPasswordAlert()
    );
    setLoading(false);
  };

  const triggerResetPasswordAlert = () => {
    Alert.alert('Reset password', 'Link has been send to your email', [
      { text: 'Ok', onPress: () => navigation.navigate('Login') },
    ]);
  };

  return (
    <AuthLayout pageTitle={'Forgot password'}>
      <Center>
        <Text className={'text-4xl'} style={{ color: primaryTextColor }}>
          {t('forgot-password')}
        </Text>
      </Center>
      <FormControl
        size="lg"
        isDisabled={false}
        isReadOnly={false}
        isRequired={false}
        style={{ paddingHorizontal: 10, marginBottom: 10 }}
      >
        <FormControlLabel>
          <FormControlLabelText style={{ color: primaryColor }}>
            {t('email')}
          </FormControlLabelText>
        </FormControlLabel>
        <Input
          className="my-1"
          variant={'rounded'}
          size="xl"
          style={formStyles.inputPrimary}
        >
          <InputField
            type="text"
            keyboardType={'email-address'}
            placeholder={t('email')}
            style={{ color: primaryTextColor }}
            value={email}
            onChangeText={setEmail}
          />
        </Input>
      </FormControl>
      <Center>
        <Button
          variant="solid"
          size="md"
          action="primary"
          style={formStyles.buttonPrimary}
          onPress={triggerResetPassword}
          isDisabled={!email}
        >
          {!loading && (
            <ButtonText style={formStyles.buttonText}>
              {t('resetPassword')}
            </ButtonText>
          )}
          {loading && <ButtonSpinner />}
        </Button>
      </Center>
    </AuthLayout>
  );
};

export default ForgotPassword;
