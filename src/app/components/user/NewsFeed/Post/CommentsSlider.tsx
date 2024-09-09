import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  Image,
  PanResponder,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../../../utils/icons/icons';
import { primaryColor } from '../../../../utils/styles/colors';
import {
  addCommentToPost,
  fetchCommentsForPost,
} from '../../../../utils/services/functions';
import { CommentProps, User } from '../../../../../../shared';
import { auth } from '../../../../../../firebaseConfig';
import { getTimeAgoFromTimestampSeconds } from '../../../../utils/helper-functions/timeAgo';
import Svg, { Path } from 'react-native-svg';
import useOptimistic from '../../../../utils/helper-functions/useOptimistic';

type Props = {
  postId: string | null;
  closeComments: () => void;
  users: User[] | undefined;
};

const CommentsSlider = (props: Props) => {
  const [newComment, setNewComment] = useState('');
  const translateY = useRef(new Animated.Value(1000)).current;
  const [areCommentsLoading, setAreCommentsLoading] = useState(false);
  const [allComments, setAllComments] = useState<CommentProps[]>([]);

  // Optimistic update logic
  const {
    data: comments, // Holds the actual comments
    pendingData, // Pending optimistic updates
    optimisticUpdate,
  } = useOptimistic<CommentProps[]>(
    async (newComments: CommentProps[]) => {
      const lastComment = newComments[newComments.length - 1];
      await addCommentToPost(
        props.postId ?? '',
        lastComment.userId,
        lastComment.userName,
        lastComment.userPhotoUrl,
        lastComment.commentText
      );

      const updatedComments = await fetchCommentsForPost(props.postId ?? '');
      return updatedComments;
    },
    [] // Initial empty comment list
  );

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: 0,
      duration: 250,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 10,
      onPanResponderMove: Animated.event([null, { dy: translateY }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 300) {
          Animated.timing(translateY, {
            toValue: 1000,
            duration: 250,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }).start(() => {
            onCancelClick();
          });
        } else {
          Animated.timing(translateY, {
            toValue: 0,
            duration: 250,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Optimistic comment handling
  const handleAddComment = () => {
    if (
      newComment &&
      auth.currentUser?.displayName &&
      auth.currentUser?.photoURL &&
      props.postId
    ) {
      const optimisticComment: CommentProps = {
        id: Math.random().toString(),
        userId: auth.currentUser?.uid!,
        userName: auth.currentUser?.displayName,
        userPhotoUrl: auth.currentUser?.photoURL,
        commentText: newComment.trim(),
        creationTime: { _seconds: Math.floor(Date.now() / 1000) },
      };

      optimisticUpdate([...comments, optimisticComment]); // Optimistically update the comments list
      setNewComment('');
    }
  };

  useEffect(() => {
    async function getComments() {
      if (!props.postId) return;

      setAreCommentsLoading(true);
      try {
        const fetchedComments = await fetchCommentsForPost(props.postId);
        setAllComments(fetchedComments); // Update the state directly with fetched comments
      } catch (e) {
        console.error(e);
      } finally {
        setAreCommentsLoading(false);
      }
    }

    getComments();
  }, [props.postId]);

  useEffect(() => {
    setAllComments(comments);
  }, [comments]);

  function onCancelClick() {
    Animated.timing(translateY, {
      toValue: 1000,
      duration: 250,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      props.closeComments();
    });
  }

  return (
    <BlurView style={StyleSheet.absoluteFillObject}>
      <Animated.View
        style={[{ transform: [{ translateY }] }, styles.container]}
        {...panResponder.panHandlers}
      >
        <View style={styles.header}>
          <Text style={{ color: primaryColor }}>{allComments.length}</Text>
          <Text style={styles.headerText}>Comments</Text>
          <TouchableOpacity onPress={onCancelClick}>
            <FontAwesomeIcon icon={Icons.Remove} size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {areCommentsLoading ? (
          <ActivityIndicator />
        ) : (
          <>
            {allComments.length ? (
              <FlatList
                data={allComments} // Show all comments including optimistic updates
                renderItem={({ item }) => (
                  <View style={styles.commentItem}>
                    <View
                      style={{
                        flexDirection: 'row',
                        flex: 1,
                        alignItems: 'center',
                      }}
                    >
                      {props.users?.find(user => user.uid === item.userId)
                        ?.photoURL ? (
                        <Image
                          style={styles.profilePicture}
                          source={{
                            uri:
                              props.users?.find(
                                user => user.uid === item.userId
                              )?.photoURL ?? '',
                          }}
                        />
                      ) : (
                        <View style={styles.image}>
                          <Svg
                            width="50"
                            height="50"
                            viewBox="0 0 50 50"
                            fill="none"
                          >
                            {/* SVG path omitted for brevity */}
                          </Svg>
                        </View>
                      )}

                      <View style={styles.commentContent}>
                        <Text style={styles.commentBy}>
                          {props.users?.find(user => user.uid === item.userId)
                            ?.displayName ?? 'Deleted user'}
                        </Text>
                        <Text style={styles.commentText}>
                          {item.commentText}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={{
                        alignItems: 'flex-end',
                        justifyContent: 'center',
                        marginLeft: 30,
                      }}
                    >
                      <Text
                        style={[
                          styles.commentTime,
                          { color: 'white', fontSize: 14 },
                        ]}
                      >
                        {getTimeAgoFromTimestampSeconds(
                          item.creationTime._seconds
                        )}
                      </Text>
                    </View>
                  </View>
                )}
                keyExtractor={item => item.id}
              />
            ) : (
              <View
                style={{
                  width: '100%',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <View
                  style={{ alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text
                    style={{
                      textAlign: 'center',
                      color: '#aaaaaa',
                      fontSize: 18,
                    }}
                  >
                    No comments
                  </Text>
                </View>
              </View>
            )}
          </>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Add a comment..."
            placeholderTextColor="#ccc"
            value={newComment}
            onChangeText={setNewComment}
          />
          <TouchableOpacity
            onPress={handleAddComment}
            style={styles.sendButton}
          >
            <Text style={styles.sendText}>Send</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '75%',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    padding: 10,
    zIndex: 100,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  headerText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  commentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', // Center items vertically
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  profilePicture: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentContent: {
    flexDirection: 'column',
    marginLeft: 10,
  },
  commentBy: {
    color: '#fff',
    fontSize: 12,
  },
  commentText: {
    color: '#ccc',
    fontSize: 14,
  },
  commentTime: {
    color: '#999',
    fontSize: 12,
  },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#444',
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 20,
  },
  input: {
    flex: 1,
    borderColor: '#444',
    borderWidth: 1,
    borderRadius: 30, // More rounded input field
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 10,
    color: '#fff',
  },
  sendButton: {
    backgroundColor: '#00FFBF',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 30,
  },
  sendText: {
    color: '#000',
    fontWeight: 'bold',
  },
});

export default CommentsSlider;
