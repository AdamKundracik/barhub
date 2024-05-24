import AuthLayout from "../../components/auth/AuthLayout";
import {InputWrapper} from "../../components/shared/InputWrapper";
import {Text, TextInput, TouchableOpacity, View} from "react-native";
import {commonAppStyles, formStyles} from "../../utils/styles";
import {useState} from "react";

export const ResetPassword = () => {
    const [newPassword, setNewPassword] = useState("");
    const [repeatNewPassword, setRepeatNewPassword] = useState("");

    function isSamePassword(): boolean {
        return newPassword === repeatNewPassword;
    }

    return (
        <AuthLayout pageTitle={"Forgot password"}>
            <InputWrapper inputLabel={"New password"} passwordInput>
                <TextInput
                    secureTextEntry={true}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    style={formStyles.inputPrimary}
                    placeholder="Password"
                    keyboardType={"visible-password"}
                />
            </InputWrapper>
            <InputWrapper inputLabel={"Repeat new password"} passwordInput>
                <TextInput
                    secureTextEntry={true}
                    value={repeatNewPassword}
                    onChangeText={setRepeatNewPassword}
                    style={formStyles.inputPrimary}
                    placeholder="Repeat password"
                    keyboardType={"visible-password"}
                />
                {!isSamePassword() && (
                    <View>
                        <Text style={[commonAppStyles.textPrimary, {color: "#f80202"}]}>
                            Hesla sa nezhoduju!
                        </Text>
                    </View>
                )}
            </InputWrapper>
            <TouchableOpacity
                style={formStyles.buttonPrimary}
            >
                <Text style={formStyles.buttonText}>Reset password</Text>
            </TouchableOpacity>
        </AuthLayout>
    )
}
