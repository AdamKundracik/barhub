import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ReactNode } from 'react';
import { authPageStyles, commonAppStyles } from '../../utils/styles/styles';
import LanguageSwitcher from '../shared/settings/LanguageSwitcher';
import ScrollView = Animated.ScrollView;

type LayoutProps = {
  children: ReactNode | ReactNode[];
  pageTitle: string;
};

export const AuthLayout = ({ children, pageTitle }: LayoutProps) => {
  return (
    <SafeAreaView style={styles.wrapper}>
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollView}>
          <View style={styles.mainContent}>
            <View style={authPageStyles.authPageContainer}>
              <View
                style={{
                  display: 'flex',
                  alignSelf: 'center',
                  marginBottom: 20,
                }}
              >
                <Text
                  style={[
                    commonAppStyles.textPrimary,
                    {
                      fontSize: 50,
                      fontFamily: 'Inter-Black',
                    },
                  ]}
                >
                  BARUJ
                </Text>
              </View>
              {children}
            </View>
          </View>
        </ScrollView>
        <LanguageSwitcher />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#020213',
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mainContent: {
    flex: 1,
  },
  bottomBar: {
    height: 60, // Adjust the height as needed
    justifyContent: 'flex-end',
  },
  backButton: {
    paddingRight: 10,
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scrollView: {
    flexGrow: 1,
  },
});

export default AuthLayout;
