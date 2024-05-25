import AuthLayout from "../../components/auth/AuthLayout";
import {InputWrapper} from "../../components/shared/InputWrapper";
import {Text, TextInput, TouchableOpacity, View} from "react-native";
import {commonAppStyles, formStyles} from "../../utils/styles";
import {useState} from "react";
import {useTranslation} from "react-i18next";

export const ResetPassword = () => {
    const {t} = useTranslation();
    const [newPassword, setNewPassword] = useState("");
    const [repeatNewPassword, setRepeatNewPassword] = useState("");
    const [togglePassword, setTogglePassword] = useState(true)

    function isSamePassword(): boolean {
        return newPassword === repeatNewPassword;
    }

    return (
        <AuthLayout pageTitle={t("Forgot password")}>
            <InputWrapper inputLabel={t("newPassword")}
                          setTogglePassword={setTogglePassword}
                          togglePassword={togglePassword}
                          passwordInput>
                <TextInput
                    secureTextEntry={togglePassword}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    style={formStyles.inputPrimary}
                    placeholder={t('newPassword')}
                    keyboardType={"visible-password"}
                />
            </InputWrapper>
            <InputWrapper inputLabel={t("repeatNewPassword")}
                          setTogglePassword={setTogglePassword}
                          togglePassword={togglePassword}
                          passwordInput>
                <TextInput
                    secureTextEntry={togglePassword}
                    value={repeatNewPassword}
                    onChangeText={setRepeatNewPassword}
                    style={formStyles.inputPrimary}
                    placeholder={t('repeatNewPassword')}
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
                style={formStyles.buttonPrimary}
            >
                <Text style={formStyles.buttonText}>{t('resetPassword')}</Text>
            </TouchableOpacity>
        </AuthLayout>
    )
}
