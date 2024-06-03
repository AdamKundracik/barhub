import {ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity} from "react-native";
import {signInWithEmailAndPassword} from 'firebase/auth'
import * as React from "react";
import {useState} from "react";
import AuthLayout from "../../components/auth/AuthLayout";
import {InputWrapper} from "../../components/shared/InputWrapper";
import {commonAppStyles, formStyles} from "../../utils/styles/styles";
import {auth} from "../../../../firebaseConfig";
import {useTranslation} from "react-i18next";

export const LogIn = ({navigation}: any) => {
    const {t} = useTranslation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [togglePassword, setTogglePassword] = useState(true)
    const [loading, setLoading] = useState(false)

    function handleLogin() {
        setLoading(true)
        signInWithEmailAndPassword(auth, email, password)
            .then(async (userCredential) => {
                // Signed in
                setLoading(false);
                const user = userCredential.user;
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                setLoading(false);
            });
    };

    return (
        <AuthLayout pageTitle={t('register')}>
            <InputWrapper inputLabel={t('email')}>
                <TextInput
                    value={email}
                    onChangeText={setEmail}
                    style={formStyles.inputPrimary}
                    placeholder={t('email')}
                    keyboardType={"email-address"}
                />
            </InputWrapper>
            <InputWrapper
                inputLabel={t('password')}
                setTogglePassword={setTogglePassword}
                togglePassword={togglePassword}
                passwordInput
            >
                <TextInput
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={togglePassword}
                    style={formStyles.inputPrimary}
                    placeholder={t('password')}
                />
            </InputWrapper>
            <TouchableOpacity onPress={handleLogin} style={[formStyles.buttonPrimary]} disabled={loading}>
                {loading && <ActivityIndicator style={formStyles.buttonText} size='small' color='#000000'/>}
                {!loading && <Text style={formStyles.buttonText}>{t('login')}</Text>}
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.login}
                onPress={() => navigation.navigate("Register")}
            >
                <Text style={commonAppStyles.textPrimary}>
                    {t('noAccount')}
                    <Text style={{fontWeight: "bold"}}> {t('registerYourself')}</Text>
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.login}
                onPress={() => navigation.navigate("ForgotPassword")}
            >
                <Text style={commonAppStyles.textPrimary}>
                    {t('forgotPassword')}
                    <Text style={{fontWeight: "bold"}}> {t('resetIt')}</Text>
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
    input: {
        marginBottom: 10,
        backgroundColor: "white",
    },
    button: {
        marginTop: 10,
    },
    login: {
        justifyContent: "center",
        alignItems: "center",
        padding: 15,
    },
});

export default LogIn;
