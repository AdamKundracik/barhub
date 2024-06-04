import {ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View,} from "react-native";
import AuthLayout from "../../components/auth/AuthLayout";
import * as React from "react";
import {useState} from "react";
import {commonAppStyles, formStyles} from "../../utils/styles/styles";
import {InputWrapper} from "../../components/shared/InputWrapper";
import {createUserWithEmailAndPassword, getAuth, sendEmailVerification} from "firebase/auth";
import {useTranslation} from "react-i18next";

export const Register = ({navigation}: any) => {
    const {t} = useTranslation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [repeatPassword, setRepeatPassword] = useState("");
    const [togglePassword, setTogglePassword] = useState(true)
    const [loading, setLoading] = useState(false)


    const actionCodeSettings = {
        // URL you want to redirect back to. The domain (www.example.com) for this
        // URL must be in the authorized domains list in the Firebase Console.
        url: 'baruj-app-cb74c.firebaseapp.com',
        // This must be true.
        handleCodeInApp: true,
        iOS: {
            bundleId: 'com.example.ios'
        },
        android: {
            packageName: 'com.example.android',
            installApp: true,
            minimumVersion: '12'
        },
        dynamicLinkDomain: 'example.page.link'
    };

    async function handleRegister() {
        setLoading(true)
        if (isSamePassword()) {
            const auth = getAuth();
            createUserWithEmailAndPassword(auth, email, password)
                .then(async (userCredential) => {
                    const user = userCredential.user;
                    await sendEmailVerification(user).then(() => {
                        Alert.alert('Verification email sent!')
                        setLoading(false)
                    })
                })
                .catch(error => {
                    setLoading(false)
                    switch (error.code) {
                        case 'auth/email-already-in-use':
                            alert(`Email already in use.`);
                            console.error(`Email already in use.`);
                            break;
                        case 'auth/invalid-email':
                            alert(`Email is invalid.`);
                            console.error(`Email is invalid.`);
                            break;
                        case 'auth/operation-not-allowed':
                            alert(`Error during sign up.`);
                            console.error(`Error during sign up.`);
                            break;
                        case 'auth/weak-password':
                            alert('Password is not strong enough. Add additional characters including special characters and numbers.');
                            console.error('Password is not strong enough. Add additional characters including special characters and numbers.');
                            break;
                        default:
                            alert(error.message);
                            console.error(error.message)
                            break;
                    }
                });
        } else {
            console.log("wrong password");
        }
    }

    function isSamePassword(): boolean {
        return password === repeatPassword;
    }

    return (
        <AuthLayout pageTitle={t('Register')}>
            <InputWrapper inputLabel={t("email")}>
                <TextInput
                    value={email}
                    onChangeText={setEmail}
                    style={formStyles.inputPrimary}
                    placeholder="Email"
                    keyboardType={"email-address"}
                />
            </InputWrapper>
            <InputWrapper inputLabel={t("password")}
                          setTogglePassword={setTogglePassword}
                          togglePassword={togglePassword}
                          passwordInput>
                <TextInput
                    secureTextEntry={togglePassword}
                    value={password}
                    onChangeText={setPassword}
                    style={formStyles.inputPrimary}
                    placeholder={t('password')}
                    keyboardType={"visible-password"}
                />
            </InputWrapper>
            <InputWrapper inputLabel={t("repeatPassword")}
                          setTogglePassword={setTogglePassword}
                          togglePassword={togglePassword}
                          passwordInput>
                <TextInput
                    secureTextEntry={togglePassword}
                    value={repeatPassword}
                    onChangeText={setRepeatPassword}
                    style={formStyles.inputPrimary}
                    placeholder={t('repeatPassword')}
                    keyboardType={"visible-password"}
                />
                {!isSamePassword() && (
                    <View>
                        <Text style={[commonAppStyles.textPrimary, {color: "#f80202"}]}>
                            {t('noMatchingPasswords')}
                        </Text>
                    </View>
                )}
            </InputWrapper>

            <TouchableOpacity
                onPress={handleRegister}
                style={formStyles.buttonPrimary}
                disabled={!isSamePassword()}
            >
                {!loading ?
                    <Text style={formStyles.buttonText}>{t('register')}</Text>
                    :
                    <ActivityIndicator style={formStyles.buttonText} size='small' color='#000000'/>
                }
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.login}
                onPress={() => navigation.navigate("Login")}
            >
                <Text style={commonAppStyles.textPrimary}>
                    {t('haveAccount')} <Text style={{fontWeight: "bold"}}>{t('login')}!</Text>
                </Text>
            </TouchableOpacity>
        </AuthLayout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        paddingHorizontal: 20,
    },

    login: {
        justifyContent: "center",
        alignItems: "center",
        padding: 15,
    },
});
export default Register;
