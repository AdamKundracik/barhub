import AuthLayout from "../../components/auth/AuthLayout";
import {InputWrapper} from "../../components/shared/InputWrapper";
import {Alert, Text, TextInput, TouchableOpacity} from "react-native";
import {formStyles} from "../../utils/styles";
import {useState} from "react";
import {getAuth, sendPasswordResetEmail} from "firebase/auth";
import {useTranslation} from "react-i18next";

export const ForgotPassword = ({navigation}: any) => {
    const {t} = useTranslation();
    const [email, setEmail] = useState("");


    const triggerResetPassword = async () => {
        const auth = getAuth();
        await sendPasswordResetEmail(auth, email).then(() =>
            triggerResetPasswordAlert(),
        );
    };

    const triggerResetPasswordAlert = () => {
        Alert.alert("Reset password", "Link has been send to your email", [
            {text: "Ok", onPress: () => navigation.navigate("Login")},
        ]);
    };

    return (
        <AuthLayout pageTitle={"Forgot password"}>
            <InputWrapper inputLabel={t("email")}>
                <TextInput
                    value={email}
                    onChangeText={setEmail}
                    style={formStyles.inputPrimary}
                    placeholder={t('email')}
                    keyboardType={"email-address"}
                />
            </InputWrapper>
            <TouchableOpacity
                onPress={triggerResetPassword}
                style={formStyles.buttonPrimary}
            >
                <Text style={formStyles.buttonText}>{t('resetPassword')}</Text>
            </TouchableOpacity>
        </AuthLayout>
    );
};

export default ForgotPassword;
