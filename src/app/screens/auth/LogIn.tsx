import {StyleSheet, Text, TextInput, TouchableOpacity, View} from "react-native";
import * as React from "react";
import {useState} from "react";
import Layout from "../../components/Layout";
import {InputWrapper} from "../../components/InputWrapper";
import {authPageStyles, commonAppStyles, formStyles} from "../../utils/styles";

export const LogIn = ({navigation}: any) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('')

    function handleLogin() {
        console.log(email, password)
    }

    return (
        <Layout pageTitle={'Register'}>
            <View style={authPageStyles.authPageContainer}>
                <View style={{display: 'flex', alignSelf: 'center'}}>
                    <Text style={[commonAppStyles.textPrimary, {fontSize: 50, fontFamily: 'Roboto'}]}>BARUJ</Text>
                </View>
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
                    <Text style={commonAppStyles.textPrimary}>Este nemas ucet? <Text style={{fontWeight: 'bold'}}>Zaregistruj sa!</Text></Text>
                </TouchableOpacity>
            </View>
        </Layout>
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


