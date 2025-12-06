import { Pressable, StyleSheet, Text } from 'react-native';
import { commonAppStyles } from '../../utils/styles/styles';
import { useThemeColors } from '../../utils/styles/themeColors';
import React from 'react';

type ButtonProps = {
  text: string;
  clickFuntion: () => void;
  color: string;
};

export const Button = (props: ButtonProps) => {
  const colors = useThemeColors();
  
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        { borderColor: props.color },
        pressed && { backgroundColor: props.color },
      ]}
      onPress={props.clickFuntion}
    >
      {({ pressed }) => (
        <Text
          style={[
            commonAppStyles.textSecondary,
            {
              fontSize: 16,
              fontWeight: 'bold',
              color: pressed ? colors.primaryBgColor : props.color,
            },
          ]}
        >
          {props.text}
        </Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flexGrow: 1,
  },
  text: {
    marginBottom: 15,
    textAlign: 'center',
    // color is set inline to use theme colors
  },
  button: {
    width: 180,
    borderRadius: 30,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Button;
