import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../../../utils/icons/icons';
import { rgbaColor } from 'react-native-reanimated/lib/typescript/reanimated2/Colors';

type InteractionBarProps = {
  likes: number;
  comments: number;
  onLikeToggle: () => void;
  onCommentToggle: () => void;
  isLiked: boolean;
};

export const InteractionBar = (props: InteractionBarProps) => {
  return (
    <View style={styles.container}>
      <View style={{ width: 24, height: 24 }} />
      <TouchableOpacity
        onPress={props.onLikeToggle}
        style={styles.iconContainer}
      >
        <FontAwesomeIcon
          icon={Icons.Heart}
          size={24}
          color={props.isLiked ? 'red' : '#32d7b7'}
        />
        <Text style={styles.count}>{props.likes}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={props.onCommentToggle}
        style={styles.iconContainer}
      >
        <FontAwesomeIcon icon={Icons.Comment} size={24} color="#32d7b7" />
        <Text style={styles.count}>{props.comments}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    backgroundColor: '#0f0f1c',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  iconContainer: {
    alignItems: 'center',
  },
  count: {
    marginTop: 5,
    fontSize: 14,
    color: '#a0a0a0',
  },
});

export default InteractionBar;
