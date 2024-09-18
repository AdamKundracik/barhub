import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../../../utils/icons/icons';
import { postBgColor } from '../../../../utils/styles/colors';
import Device from 'react-native-device-info';

type InteractionBarProps = {
  likes: number;
  comments: number;
  onLikeToggle: () => void;
  onCommentToggle: () => void;
  isLiked: boolean;
};

const isTablet = Device.isTablet();

export const InteractionBar = (props: InteractionBarProps) => {
  const styles = isTablet ? tabletStyles : mobileStyles;

  return (
    <View style={styles.container}>
      <View style={{ width: 24, height: 24 }} />
      <TouchableOpacity
        onPress={props.onLikeToggle}
        style={styles.iconContainer}
      >
        <FontAwesomeIcon
          icon={Icons.Heart}
          size={isTablet ? 30 : 24}
          color={props.isLiked ? 'red' : '#32d7b7'}
        />
        <Text style={styles.count}>{props.likes}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={props.onCommentToggle}
        style={styles.iconContainer}
      >
        <FontAwesomeIcon
          icon={Icons.Comment}
          size={isTablet ? 30 : 24}
          color="#32d7b7"
        />
        <Text style={styles.count}>{props.comments}</Text>
      </TouchableOpacity>
    </View>
  );
};

const mobileStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    backgroundColor: postBgColor,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  iconContainer: {
    alignItems: 'center',
  },
  count: {
    fontWeight: 'bold',
    marginTop: 5,
    fontSize: 14,
    color: '#a0a0a0',
  },
});

const tabletStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20, // Increased padding for tablets
    backgroundColor: postBgColor,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  iconContainer: {
    alignItems: 'center',
  },
  count: {
    fontWeight: 'bold',
    marginTop: 8,
    fontSize: 18,
    color: '#a0a0a0',
  },
});

export default InteractionBar;
