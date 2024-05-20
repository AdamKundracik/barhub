import {Text, View} from "react-native";
import {ReactNode} from "react";
import {commonAppStyles} from "../utils/styles";

type LayoutProps = {
    children: ReactNode | ReactNode[];
    inputLabel: string
}

export const InputWrapper = ({children, inputLabel}: LayoutProps) => {
    return (
        <View style={{marginHorizontal: 12, marginTop: 8}}>
            <Text style={[commonAppStyles.textPrimary, {marginBottom: 10}]}>{inputLabel}</Text>
            {children}
        </View>
    )
}
