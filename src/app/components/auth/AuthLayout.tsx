import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  View,
} from 'react-native';
import { ReactNode } from 'react';
import { authPageStyles } from '../../utils/styles/styles';
import Svg, { Path } from 'react-native-svg';
import ScrollView = Animated.ScrollView;

type LayoutProps = {
  children: ReactNode | ReactNode[];
  pageTitle: string;
};

export const AuthLayout = ({ children }: LayoutProps) => {
  return (
    <SafeAreaView style={styles.wrapper}>
      <Svg
        style={{
          position: 'absolute',
          left: 0,
          top: 125,
        }}
        width="390"
        height="379"
        viewBox="0 0 390 379"
        fill="none"
      >
        <Path
          d="M340.897 8.988L279.707 49.9378V184.304L243.7 169.88L217.496 186.38V52.9053L185.401 20.5505L90.2854 0L54.7047 31.7905V118.668L17.771 106.274L0 121.046V127.228L15.7241 114.154V200.517L20.0333 203.429V112.274L54.7047 123.907V306.615L59.0139 309.522V34.2793L88.6781 7.77885V375.123L92.9872 378.035V5.70819L181.092 24.7422V356.391L185.401 353.479V27.2008L213.187 55.2127V310.02L217.496 307.113V192.103L241.739 176.838V288.13L246.048 285.223V176.153L279.707 189.62V333.392L284.016 336.309V52.6836L338.786 16.4746V370.15L343.095 367.238V16.2026L390 45.7814V40.0127L340.897 8.988Z"
          fill="#031824"
        />
      </Svg>
      <Svg
        style={{
          position: 'absolute',
          left: '50%',
          top: 75,
        }}
        width="60"
        height="60"
        viewBox="0 0 60 60"
        fill="none"
      >
        <Path
          d="M30 60C46.5406 60 60 46.5406 60 30C60 13.4594 46.5406 0 30 0C13.4594 0 0 13.4594 0 30C0 46.5406 13.4594 60 30 60ZM30 3.87097C44.4077 3.87097 56.129 15.5923 56.129 30C56.129 44.4077 44.4077 56.129 30 56.129C15.5923 56.129 3.87097 44.4077 3.87097 30C3.87097 15.5923 15.5923 3.87097 30 3.87097Z"
          fill="#031824"
        />
      </Svg>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollView}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={true}
        >
          <View style={styles.mainContent}>
            <View style={authPageStyles.authPageContainer}>{children}</View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#020213',
    padding: 15,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mainContent: {
    paddingHorizontal: 10,
    flex: 1,
  },
  bottomBar: {
    height: 60,
    justifyContent: 'flex-end',
  },
  backButton: {
    paddingRight: 10,
    justifyContent: 'center',
  },
  scrollView: {
    flexGrow: 1,
  },
});

export default AuthLayout;
