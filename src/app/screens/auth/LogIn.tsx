import {StyleSheet, Text, TextInput, TouchableOpacity} from "react-native";
import * as React from "react";
import {useState} from "react";
import AuthLayout from "../../components/auth/AuthLayout";
import {InputWrapper} from "../../components/shared/InputWrapper";
import {commonAppStyles, formStyles} from "../../utils/styles";

export const LogIn = ({navigation}: any) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('')

    function handleLogin() {
        console.log(email, password)
    }

    return (
        <AuthLayout pageTitle={'Register'}>
            <InputWrapper inputLabel={'Email'}>
                <TextInput
                    value={email}
                    onChangeText={setEmail}
                    style={formStyles.inputPrimary}
                    placeholder='Email'
                    keyboardType={'email-address'}
                />
            </InputWrapper>
            <InputWrapper inputLabel={'Password'}>
                <TextInput
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={true}
                    style={formStyles.inputPrimary}
                    placeholder='Password'
                    keyboardType={'visible-password'}
                />
            </InputWrapper>
            <TouchableOpacity
                onPress={handleLogin}
                style={formStyles.buttonPrimary}
            >
                <Text style={formStyles.buttonText}>Log in</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.login}
                onPress={() => navigation.navigate('Register')}
            >
                <Text style={commonAppStyles.textPrimary}>Este nemas ucet? <Text style={{fontWeight: 'bold'}}>Zaregistruj
                    sa!</Text></Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.login}
                onPress={() => navigation.navigate('ForgotPassword')}
            >
                <Text style={commonAppStyles.textPrimary}>Zabudol si heslo? <Text style={{fontWeight: 'bold'}}>Obnov si
                    ho!</Text></Text>
            </TouchableOpacity>
        </AuthLayout>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    input: {
        marginBottom: 10,
        backgroundColor: 'white'
    },
    button: {
        marginTop: 10,
    },
    login: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 15,
    },
});

export default LogIn


