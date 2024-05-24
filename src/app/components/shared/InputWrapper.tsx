import {Text, TouchableOpacity, View} from "react-native";
import {ReactNode, useState} from "react";
import {commonAppStyles} from "../../utils/styles";
import {FontAwesomeIcon} from "@fortawesome/react-native-fontawesome";
import {faEye, faEyeSlash} from "@fortawesome/free-regular-svg-icons";

type LayoutProps = {
    children: ReactNode | ReactNode[];
    inputLabel: string;
    passwordInput?: boolean
};

export const InputWrapper = ({children, inputLabel, passwordInput = false}: LayoutProps) => {
    const [showPassword, setShowPassword] = useState(false)

    return (
        <View style={{marginHorizontal: 12, marginTop: 8}}>
            <Text style={[commonAppStyles.textPrimary, {marginBottom: 10}]}>
                {inputLabel}
            </Text>
            {passwordInput && <>
                <View style={{position: 'relative'}}>
                    {children}
                    <View style={{position: 'absolute', right: 10, top: 7}}>
                        <TouchableOpacity>
                            <FontAwesomeIcon icon={true ? faEye : faEyeSlash}
                                             size={24}
                                             color="#aaa"
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </>
            }
            {!passwordInput &&
                children
            }
        </View>
    );
};
