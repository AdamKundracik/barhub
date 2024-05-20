import AuthLayout from "../../components/auth/AuthLayout";
import {InputWrapper} from "../../components/shared/InputWrapper";
import {Alert, Text, TextInput, TouchableOpacity, View} from "react-native";
import {commonAppStyles, formStyles} from "../../utils/styles";
import {useState} from "react";
import {getAuth, sendPasswordResetEmail} from 'firebase/auth'

export const ForgotPassword = ({navigation}: any) => {
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('')
    const [repeatNewPassword, setRepeatNewPassword] = useState('')

    function isSamePassword(): boolean {
        return newPassword === repeatNewPassword
    }

    const triggerResetPassword = async () => {
        const auth = getAuth()
        await sendPasswordResetEmail(auth, email).then(() => triggerResetPasswordAlert());
    }

    const triggerResetPasswordAlert = () => {
        Alert.alert('Reset password', 'Link has been send to your email', [
            {text: 'Ok', onPress: () => navigation.navigate('Login')},
        ]);
    }

    return (
        <AuthLayout pageTitle={'Forgot password'}>
            <InputWrapper inputLabel={'Email'}>
                <TextInput
                    value={email}
                    onChangeText={setEmail}
                    style={formStyles.inputPrimary}
                    placeholder='Email'
                    keyboardType={'email-address'}
                />
            </InputWrapper>
            <InputWrapper inputLabel={'New password'}>
                <TextInput
                    secureTextEntry={true}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    style={formStyles.inputPrimary}
                    placeholder='Password'
                    keyboardType={'visible-password'}
                />
            </InputWrapper>
            <InputWrapper inputLabel={'Repeat new password'}>
                <TextInput
                    secureTextEntry={true}
                    value={repeatNewPassword}
                    onChangeText={setRepeatNewPassword}
                    style={formStyles.inputPrimary}
                    placeholder='Repeat password'
                    keyboardType={'visible-password'}
                />
                {!isSamePassword() && <View>
                    <Text style={[commonAppStyles.textPrimary, {color: '#f80202'}]}>Hesla sa nezhoduju!</Text>
                </View>}
            </InputWrapper>
            <TouchableOpacity
                onPress={triggerResetPassword}
                style={formStyles.buttonPrimary}
            >
                <Text style={formStyles.buttonText}>Reset password</Text>
            </TouchableOpacity>
        </AuthLayout>
    )
}

export default ForgotPassword
