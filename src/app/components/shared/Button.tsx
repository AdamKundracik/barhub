import { Pressable, StyleSheet, Text } from 'react-native';
import { commonAppStyles } from '../../utils/styles/styles';
import { primaryLightGrey } from '../../utils/styles/colors';
import React from 'react';

type ButtonProps = {
  text: string;
  clickFuntion: () => void;
  color: string;
};

export const Button = (props: ButtonProps) => {
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
              color: pressed ? '#fff' : props.color,
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
    color: primaryLightGrey,
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
