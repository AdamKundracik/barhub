import {Text, TouchableOpacity, View} from "react-native";
import {ReactNode} from "react";
import {commonAppStyles} from "../../utils/styles/styles";
import {FontAwesomeIcon} from "@fortawesome/react-native-fontawesome";
import {faEye, faEyeSlash} from "@fortawesome/free-regular-svg-icons";

type LayoutProps = {
    children: ReactNode | ReactNode[];
    inputLabel: string;
    passwordInput?: boolean;
    togglePassword?: boolean;
    setTogglePassword?: (show: boolean) => void;
};

export const InputWrapper = ({
                                 children,
                                 inputLabel,
                                 passwordInput = false,
                                 setTogglePassword,
                                 togglePassword
                             }: LayoutProps) => {
    return (
        <View style={{marginHorizontal: 12, marginTop: 8}}>
            <Text style={[commonAppStyles.textPrimary, {marginBottom: 10}]}>
                {inputLabel}
            </Text>
            {passwordInput ? (
                <View style={{position: 'relative'}}>
                    {children}
                    <View style={{position: 'absolute', right: 10, top: 7}}>
                        <TouchableOpacity onPress={() => setTogglePassword && setTogglePassword(!togglePassword)}>
                            <FontAwesomeIcon
                                icon={togglePassword ? faEyeSlash : faEye}
                                size={24}
                                color="#aaa"
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                children
            )}
        </View>
    );
};
