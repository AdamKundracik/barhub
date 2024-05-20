import {StyleSheet, Text, TextInput, TouchableOpacity, View} from "react-native";
import Layout from "../../components/Layout";
import {useState} from "react";
import {authPageStyles, commonAppStyles, formStyles} from "../../utils/styles";
import {InputWrapper} from "../../components/InputWrapper";

export const Register = ({ navigation }: any) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('')
    const [repeatPassword, setRepeatPassword] = useState('')
    function handleRegister() {
        if (isSamePassword()) console.log(email, password, repeatPassword)
    }

    function isSamePassword(): boolean {
        return password === repeatPassword
    }


    return (
        <Layout pageTitle={'Register'}>
            <View style={authPageStyles.authPageContainer}>
                <View style={{display: 'flex', alignSelf: 'center'}}>
                    <Text style={[commonAppStyles.textPrimary, {fontSize: 50, fontFamily: 'Inter-Black'}]}>BARUJ</Text>
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
                        secureTextEntry={true}
                        value={password}
                        onChangeText={setPassword}
                        style={formStyles.inputPrimary}
                        placeholder='Password'
                        keyboardType={'visible-password'}
                    />
                </InputWrapper>
                <InputWrapper inputLabel={'Repeat password'}>
                    <TextInput
                        secureTextEntry={true}
                        value={repeatPassword}
                        onChangeText={setRepeatPassword}
                        style={formStyles.inputPrimary}
                        placeholder='Repeat password'
                        keyboardType={'visible-password'}
                    />
                    {!isSamePassword() && <View>
                        <Text style={[commonAppStyles.textPrimary, {color: '#f80202'}]}>Hesla sa nezhoduju!</Text>
                    </View>}
                </InputWrapper>

                <TouchableOpacity
                    onPress={handleRegister}
                    style={formStyles.buttonPrimary}
                >
                    <Text style={formStyles.buttonText}>Register</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.login}
                    onPress={() => navigation.navigate('Login')}
                >
                    <Text style={commonAppStyles.textPrimary}>Uz mas ucet? <Text style={{fontWeight: 'bold'}}>Prihlas sa!</Text></Text>
                </TouchableOpacity>
            </View>
        </Layout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
    },

    login: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 15,
    },
})
export default Register;
