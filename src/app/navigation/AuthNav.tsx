import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LogIn from '../screens/auth/LogIn';
import Register from '../screens/auth/Register';
import ForgotPassword from '../screens/auth/ForgotPassword';
import ResetPassword from '../screens/auth/ResetPassword';
import VerifyEmail from '../screens/auth/VerifyEmail';
import TermsOfService from '../screens/auth/LegalDocuments/TermsOfService';
import PrivacyPolicy from '../screens/auth/LegalDocuments/PrivacyPolicy';
import CommunityGuidelines from '../screens/auth/LegalDocuments/CommunityGuidelines';

const AuthStack = createNativeStackNavigator();

const AuthNav = () => {
  return (
    <AuthStack.Navigator
      initialRouteName="Login"
      screenOptions={{ headerShown: false }}
    >
      <AuthStack.Screen name="Login" component={LogIn} />
      <AuthStack.Screen name="Register" component={Register} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPassword} />
      <AuthStack.Screen name="ResetPassword" component={ResetPassword} />
      <AuthStack.Screen name="VerifyEmail" component={VerifyEmail} />
      <AuthStack.Screen name="TermsOfService" component={TermsOfService} />
      <AuthStack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
      <AuthStack.Screen name="CommunityGuidelines" component={CommunityGuidelines} />
    </AuthStack.Navigator>
  );
};

export default AuthNav;
