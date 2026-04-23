import { SafeAreaView, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { ReactNode } from 'react';
import { authPageStyles } from '../../utils/styles/styles';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

type LayoutProps = {
  children: ReactNode | ReactNode[];
  pageTitle: string;
};

export const AuthLayout = ({ children }: LayoutProps) => {
  return (
    <SafeAreaView style={styles.wrapper}>
      <Svg
        style={StyleSheet.absoluteFillObject}
        viewBox="0 0 397 860"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        <Defs>
          <LinearGradient id="grad1" x1="0%" y1="100%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#CC2ECC" />
            <Stop offset="50%" stopColor="#FF4E8A" />
            <Stop offset="100%" stopColor="#FF9A5C" />
          </LinearGradient>
          <LinearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FF9A5C" />
            <Stop offset="50%" stopColor="#FF4E8A" />
            <Stop offset="100%" stopColor="#CC2ECC" />
          </LinearGradient>
        </Defs>

        {/* Top-left arc */}
        <Path
          d="M -30 220 Q 150 250 300 -30"
          stroke="url(#grad1)"
          strokeWidth={40}
          strokeLinecap="round"
          fill="none"
        />

        {/* Bottom-right arc */}
        <Path
          d="M 100 890 Q 250 610 430 640"
          stroke="url(#grad2)"
          strokeWidth={40}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>

      <KeyboardAwareScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollView}
        keyboardShouldPersistTaps="handled"
        bottomOffset={16}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainContent}>
          <View style={authPageStyles.authPageContainer}>{children}</View>
        </View>
      </KeyboardAwareScrollView>
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
