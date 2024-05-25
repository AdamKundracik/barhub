import {StyleSheet, Text, TextInput, TouchableOpacity, View,} from "react-native";
import AuthLayout from "../../components/auth/AuthLayout";
import {useState} from "react";
import {commonAppStyles, formStyles} from "../../utils/styles";
import {InputWrapper} from "../../components/shared/InputWrapper";
import {createUserWithEmailAndPassword, getAuth} from "firebase/auth";
import {useTranslation} from "react-i18next";

export const Register = ({navigation}: any) => {
    const {t} = useTranslation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [repeatPassword, setRepeatPassword] = useState("");
    const [togglePassword, setTogglePassword] = useState(true)


    function handleRegister() {
        if (isSamePassword()) {
            const auth = getAuth();
            createUserWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    // Signed up
                    const user = userCredential.user;
                    console.log(user);
                    // ...
                })
                .catch((error) => {
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    // ..

                    console.log("error", errorMessage);
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
                <Text style={formStyles.buttonText}>{t('register')}</Text>
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
