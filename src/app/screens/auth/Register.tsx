import {StyleSheet, Text, TextInput, TouchableOpacity, View} from "react-native";
import AuthLayout from "../../components/auth/AuthLayout";
import {useState} from "react";
import {authPageStyles, commonAppStyles, formStyles} from "../../utils/styles";
import {InputWrapper} from "../../components/shared/InputWrapper";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

export const Register = ({ navigation }: any) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('')
    const [repeatPassword, setRepeatPassword] = useState('')
    function handleRegister() {
        if (isSamePassword()) {
            const auth = getAuth();
            createUserWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    // Signed up
                    const user = userCredential.user;
                    console.log(user)
                    // ...
                })
                .catch((error) => {
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    // ..

                    console.log('error')
                });
        } else {
            console.log('wrong password')
        }
    }

    function isSamePassword(): boolean {
        return password === repeatPassword
    }

    const auth = getAuth();
    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            // Signed up
            const user = userCredential.user;
            console.log(user)
            // ...
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            // ..

            console.log('error')
        });


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
        </AuthLayout>
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
