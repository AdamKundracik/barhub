import { Dimensions, Text, TouchableOpacity, View } from 'react-native';
import { ReactNode } from 'react';
import { commonAppStyles } from '../../utils/styles/styles';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../utils/icons/icons';

type LayoutProps = {
  children: ReactNode | ReactNode[];
  inputLabel?: string;
  passwordInput?: boolean;
  togglePassword?: boolean;
  setTogglePassword?: (show: boolean) => void;
};

export const InputWrapper = ({
  children,
  inputLabel,
  passwordInput = false,
  setTogglePassword,
  togglePassword,
}: LayoutProps) => {
  return (
    <View
      style={{
        marginHorizontal: 12,
        marginTop: 8,
      }}
    >
      {inputLabel && (
        <Text
          style={[
            commonAppStyles.textPrimary,
            { marginBottom: 10, paddingLeft: 12 },
          ]}
        >
          {inputLabel}
        </Text>
      )}
      {passwordInput ? (
        <View style={{ position: 'relative' }}>
          {children}
          <View style={{ position: 'absolute', right: 20, top: 12 }}>
            <TouchableOpacity
              onPress={() =>
                setTogglePassword && setTogglePassword(!togglePassword)
              }
            >
              <FontAwesomeIcon
                icon={!togglePassword ? Icons.EyeSlash : Icons.Eye}
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
