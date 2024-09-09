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
import { CommentProps } from '../../../../../../shared';
import { auth } from '../../../../../../firebaseConfig';
import { getTimeAgoFromTimestampSeconds } from '../../../../utils/helper-functions/timeAgo';

type Props = {
  postId: string | null;
  closeComments: () => void;
};

const CommentsSlider = (props: Props) => {
  const [newComment, setNewComment] = useState('');
  const translateY = useRef(new Animated.Value(1000)).current; // Start position is off-screen
  const [comments, setComments] = useState<CommentProps[]>([]);
  const [areCommentsLoading, setAreCommentsLoading] = useState(false);

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
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // If the user swipes down
        return gestureState.dy > 10;
      },
      onPanResponderMove: Animated.event([null, { dy: translateY }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 300) {
          // If the swipe is significant, close the window
          Animated.timing(translateY, {
            toValue: 1000,
            duration: 250,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }).start(() => {
            props.closeComments();
          });
        } else {
          // Otherwise, snap back to the original position
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

  const handleAddComment = async (newComment: string) => {
    if (
      newComment &&
      auth.currentUser?.displayName &&
      auth.currentUser.photoURL
    ) {
      await addCommentToPost(
        props.postId ?? '',
        auth.currentUser?.uid!,
        auth.currentUser?.displayName,
        auth.currentUser?.photoURL,
        newComment.trim()
      );

      const updatedComments = await fetchCommentsForPost(props.postId ?? '');
      setComments(updatedComments);
    }
  };

  useEffect(() => {
    async function getComments() {
      setAreCommentsLoading(true);
      try {
        const comments = await fetchCommentsForPost(props.postId ?? '');
        setComments(comments);
        setAreCommentsLoading(false);
      } catch (e) {
        console.log(e);
        setAreCommentsLoading(false);
      }
    }
    getComments();
  }, [props.postId]);

  return (
    <BlurView style={StyleSheet.absoluteFillObject}>
      <Animated.View
        style={[{ transform: [{ translateY }] }, styles.container]}
        {...panResponder.panHandlers}
      >
        <View style={styles.header}>
          <Text style={{ color: primaryColor }}>{comments.length}</Text>
          <Text style={styles.headerText}>Komentáre</Text>
          <TouchableOpacity onPress={props.closeComments}>
            <FontAwesomeIcon icon={Icons.Remove} size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Comments List */}
        {areCommentsLoading ? (
          <ActivityIndicator />
        ) : (
          <>
            {comments.length ? (
              <FlatList
                data={comments}
                renderItem={({ item }) => (
                  <View style={styles.commentItem}>
                    {/* Left Column: Profile Picture and Comment */}
                    <View
                      style={{
                        flexDirection: 'row',
                        flex: 1,
                        alignItems: 'center',
                      }}
                    >
                      <Image
                        style={styles.profilePicture}
                        source={{ uri: item.userPhotoUrl }}
                      />
                      <View style={[styles.commentContent]}>
                        <Text style={styles.commentBy}>{item.userName}</Text>
                        <Text style={styles.commentText}>
                          Strasne dlhy dlhozicny text ktory ani neviem ako mam
                          zapisat lebo je to tak dlhe ze neviem co by som s tym
                          viac robil
                        </Text>
                      </View>
                    </View>

                    {/* Right Column: Creation Time */}
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
                  style={[{ alignItems: 'center', justifyContent: 'center' }]}
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

        {/* Input Field */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Add a comment..."
            placeholderTextColor="#ccc"
            value={newComment}
            onChangeText={setNewComment}
          />
          <TouchableOpacity
            onPress={() => {
              handleAddComment(newComment);
              setNewComment('');
            }}
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
