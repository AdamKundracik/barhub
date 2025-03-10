import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../../../../utils/icons/icons';
import { primaryColor, primaryGrey } from '../../../../../utils/styles/colors';
import { User } from '../../../../../../../shared';
import { auth } from '../../../../../../../firebaseConfig';
import { getTimeAgoFromTimestampSeconds } from '../../../../../utils/helper-functions/timeAgo';
import Svg, { Path } from 'react-native-svg';
import useOptimistic from '../../../../../utils/helper-functions/useOptimistic';
import { useTranslation } from 'react-i18next';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetTextInput,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import CommentsLoaderView from '../Loaders/CommentsLoaderView';
import { PostComment } from '../../../../../../../common/types/commentTypes';
import commentService from '../../../../../utils/services/comment.service';
import { sendCommentNotification } from '../../../../../utils/functions/notofications-handler';

type Props = {
  expoPushToken: string;
  userId: string;
  postId: string | null;
  opened: boolean;
  users: User[] | undefined;
  onClose: () => void;
};

const CommentsSlider = (props: Props) => {
  const { t } = useTranslation();
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const [newComment, setNewComment] = useState('');
  const [inputHeight, setInputHeight] = useState(40);
  const [areCommentsLoading, setAreCommentsLoading] = useState(false);
  const [allComments, setAllComments] = useState<PostComment[]>([]);
  const [commentsOpened, setCommentsOpened] = useState(props.opened);
  const [snapPoint, setSnapPoint] = useState<string | number>('70%');
  const [isCommentPosting, setIsCommentPosting] = useState(false);

  useEffect(() => {
    setCommentsOpened(props.opened);
  }, [props.opened]);

  const {
    data: comments,
    pendingData,
    optimisticUpdate,
  } = useOptimistic<PostComment[]>(async (newComments: PostComment[]) => {
    if (!props.postId) return [];

    // Make call to Backend and persist new (last added) comment
    const lastComment = newComments[newComments.length - 1];
    const addedComment = await commentService.addCommentToPost(
      props.postId,
      lastComment.userId,
      lastComment.text
    );

    // Add user related data to comment that we have locally on FE
    addedComment.userName = lastComment.userName;
    addedComment.userPhotoUrl = lastComment.userPhotoUrl;

    // Replace new (last added) comment with new object which contains backend generated ID and creationTime
    const updatedComments = [...newComments];
    updatedComments[updatedComments.length - 1] = {
      ...addedComment,
    };

    return updatedComments;
  }, []);

  if (bottomSheetRef.current) {
    if (commentsOpened) {
      bottomSheetRef.current.expand();
    } else {
      bottomSheetRef.current.close();
    }
  }

  const handleAddComment = useCallback(async () => {
    if (
      !newComment ||
      !auth?.currentUser ||
      !auth.currentUser?.uid ||
      !auth.currentUser?.displayName ||
      !props.postId
    )
      return;

    setIsCommentPosting(true);

    const optimisticComment: PostComment = {
      id: '', // Note: Will be generated on backend and replaced upon adding comment
      userId: auth.currentUser.uid,
      userName: auth.currentUser.displayName,
      userPhotoUrl: auth.currentUser?.photoURL ?? '',
      text: newComment.trim(),
    };
    try {
      await optimisticUpdate([...comments, optimisticComment]);
      if (props.userId !== auth.currentUser?.uid)
        await sendCommentNotification({
          commentText: newComment,
          postId: props.postId,
          username: auth.currentUser.displayName,
          expoPushToken: props.expoPushToken,
        });
      setNewComment('');
      setIsCommentPosting(false);
    } catch (error) {
      console.error('Error adding comment:', error);
      // TODO add some notification maybe?
    }
  }, [newComment, auth, comments, props.postId, optimisticUpdate]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setSnapPoint('100%');
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setSnapPoint('70%');
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleCloseComments = useCallback(() => {
    bottomSheetRef.current?.close();
    setCommentsOpened(false);
    props.onClose();
  }, [bottomSheetRef, props]);

  const handleDeleteComment = async (commentId: string) => {
    try {
      //PREPARED FOR NEXT USAGE
      // await deleteCommentFromPost(props.postId ?? '', commentId);
      // const updatedComments = await fetchCommentsForPost(props.postId ?? '');
      // optimisticUpdate(updatedComments);
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  useEffect(() => {
    async function getComments() {
      if (!props.postId) return;

      setAreCommentsLoading(true);
      try {
        const fetchedComments = await commentService.getCommentsForPost(
          props.postId
        );
        if (fetchedComments) setAllComments(fetchedComments.reverse());
      } catch (e) {
        console.error(e);
      } finally {
        setAreCommentsLoading(false);
      }
    }

    getComments().then();
  }, [props.postId]);

  useEffect(() => {
    setAllComments(comments);
  }, [comments]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        opacity={0.7}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    ),
    []
  );

  return (
    <BottomSheet
      backgroundStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
      onClose={handleCloseComments}
      ref={bottomSheetRef}
      snapPoints={[snapPoint]}
      index={-1}
      onChange={index => {
        if (index === -1) {
          Keyboard.dismiss();
        }
      }}
      backdropComponent={renderBackdrop}
      handleHeight={60}
      enablePanDownToClose
      keyboardBehavior="extend"
      keyboardBlurBehavior="restore"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, justifyContent: 'space-between' }}
      >
        <BottomSheetView style={styles.header}>
          <Text style={[styles.headerText, { color: primaryColor }]}>
            {allComments.length}
          </Text>
          <Text style={styles.headerText}>{t('comments')}</Text>
          <TouchableOpacity onPress={handleCloseComments}>
            <FontAwesomeIcon icon={Icons.Remove} size={28} color="#fff" />
          </TouchableOpacity>
        </BottomSheetView>

        {areCommentsLoading ? (
          <CommentsLoaderView />
        ) : (
          <BottomSheetView style={{ flex: 1 }}>
            {allComments.length ? (
              <FlatList
                data={
                  [
                    ...(allComments || []),
                    ...(pendingData ? [pendingData] : []),
                  ] as PostComment[]
                }
                renderItem={({ item }) => (
                  <BottomSheetView style={styles.commentItem}>
                    <BottomSheetView
                      style={{
                        flexDirection: 'row',
                        flex: 1,
                        alignItems: 'center',
                      }}
                    >
                      {props.users?.find(user => user.uid === item?.userId)
                        ?.photoURL ? (
                        <Image
                          style={styles.profilePicture}
                          source={{
                            uri:
                              props.users?.find(
                                user => user.uid === item?.userId
                              )?.photoURL ?? '',
                          }}
                        />
                      ) : (
                        <BottomSheetView style={styles.image}>
                          <Svg
                            width="32"
                            height="32"
                            viewBox="0 0 50 50"
                            fill="none"
                          >
                            <Path
                              d="M25.0003 6.28979e-05C11.1864 6.28979e-05 0 11.2423 0 25.1251C0 28.7049 0.749508 32.1595 2.18752 35.4251C2.37551 35.9281 3.00053 36.1171 3.43754 35.9281C3.93803 35.7392 4.12604 35.111 3.93803 34.6719C2.62452 31.6563 1.93851 28.5157 1.93851 25.1859C1.93851 12.3734 12.3149 2.0093 25 2.0093C37.6883 2.0093 48.0615 12.3118 48.0615 25.125C48.0615 28.4545 47.373 31.5953 46.062 34.6109C45.874 35.1139 46.062 35.6782 46.5625 35.8672C46.687 35.931 46.8115 35.931 46.9385 35.931C47.3144 35.931 47.627 35.7421 47.8125 35.3666C49.2505 32.1597 50 28.7054 50 25.125C50 11.2422 38.8142 6.28979e-05 25.0003 6.28979e-05Z"
                              fill={'white'}
                            />
                            <Path
                              d="M5.11153 39.7802C4.9194 40.1574 4.98427 40.5958 5.23879 40.8455C10.1595 46.6765 17.3133 50 24.9789 50C32.6444 50 39.7983 46.6768 44.6544 40.9734C44.6544 40.9734 44.6544 40.9098 44.7193 40.9098C44.7842 40.8461 44.7842 40.7849 44.8465 40.7849C44.8465 40.7212 44.9114 40.66 44.9114 40.66C45.0387 40.4102 45.0387 40.0967 44.8465 39.8444C41.7175 34.2658 36.3499 30.4405 30.1542 28.9979C33.5404 27.1808 35.7762 23.669 35.7762 19.6579C35.7762 13.7657 30.9203 9 24.9166 9C18.913 9 14.0571 13.7657 14.0571 19.6579C14.0571 23.6692 16.3578 27.181 19.679 28.9979C13.6729 30.3766 8.24355 34.2017 5.11153 39.7802ZM16.1007 19.5937C16.1007 14.7668 20.0608 10.8805 24.9787 10.8805C29.8967 10.8805 33.8567 14.767 33.8567 19.5937C33.8567 24.3593 29.8967 28.3068 24.9787 28.3068C20.0608 28.3068 16.1007 24.4203 16.1007 19.5937ZM24.9787 30.2515C32.3249 30.2515 39.0322 34.0768 42.7379 40.1577C38.2663 45.1731 31.8132 48.1191 24.9787 48.1191C18.2062 48.1191 11.8182 45.2342 7.21956 40.1577C10.9899 34.0132 17.6971 30.2515 24.9787 30.2515Z"
                              fill={'white'}
                            />
                          </Svg>
                        </BottomSheetView>
                      )}

                      <BottomSheetView style={styles.commentContent}>
                        <Text style={styles.commentBy}>
                          {props.users?.find(user => user.uid === item?.userId)
                            ?.displayName ?? 'Deleted user'}
                        </Text>
                        <Text style={styles.commentText}>{item?.text}</Text>
                      </BottomSheetView>
                    </BottomSheetView>

                    <BottomSheetView
                      style={{
                        alignItems: 'flex-end',
                        justifyContent: 'center',
                        marginLeft: 30,
                        flexDirection: 'row',
                      }}
                    >
                      <Text
                        style={[
                          styles.commentTime,
                          { color: 'white', fontSize: 14 },
                        ]}
                      >
                        {getTimeAgoFromTimestampSeconds(
                          item?.creationTime?.seconds
                        )}
                      </Text>
                      {item?.userId === auth.currentUser?.uid && (
                        <TouchableOpacity
                          onPress={() => handleDeleteComment(item?.id)}
                          style={styles.trashButton}
                        >
                          <FontAwesomeIcon
                            icon={Icons.Remove}
                            size={16}
                            color="#fff"
                          />
                        </TouchableOpacity>
                      )}
                    </BottomSheetView>
                  </BottomSheetView>
                )}
                keyExtractor={(item, index) => item?.id || index.toString()}
              />
            ) : (
              <BottomSheetView
                style={{
                  width: '100%',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BottomSheetView
                  style={{ alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text
                    style={{
                      textAlign: 'center',
                      color: '#aaaaaa',
                      fontSize: 18,
                    }}
                  >
                    {t('no-comments')}
                  </Text>
                </BottomSheetView>
              </BottomSheetView>
            )}
          </BottomSheetView>
        )}

        <BottomSheetView
          style={{
            flexDirection: 'row',
            padding: 15,
            alignItems: 'center',
            marginBottom: 10,
          }}
        >
          <Image
            style={styles.image}
            source={{ uri: auth.currentUser?.photoURL ?? '' }}
          />

          <BottomSheetTextInput
            style={[styles.input, { height: Math.max(40, inputHeight) }]}
            placeholder={t('add-comment')}
            placeholderTextColor="#ccc"
            value={newComment}
            onChangeText={setNewComment}
            onContentSizeChange={event => {
              setInputHeight(event.nativeEvent.contentSize.height);
            }}
            multiline
          />
          <TouchableOpacity
            disabled={
              !newComment || newComment.trim().length === 0 || isCommentPosting
            }
            style={styles.sendButton}
            onPress={() => handleAddComment()}
          >
            <FontAwesomeIcon icon={Icons.Right} size={16} color={primaryGrey} />
          </TouchableOpacity>
        </BottomSheetView>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    alignContent: 'flex-end',
    justifyContent: 'flex-end',
    flex: 1,
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
    alignItems: 'center',
    marginBottom: 10,
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
    fontWeight: 'bold',
    color: '#fff',
    fontSize: 12,
  },
  commentText: {
    color: '#ccc',
    fontSize: 16,
  },
  commentTime: {
    color: '#999',
    fontSize: 12,
  },
  image: {
    width: 32,
    height: 32,
    borderRadius: 35,
    marginRight: 20,
    verticalAlign: 'middle',
  },
  input: {
    flex: 1,
    borderColor: '#444',
    borderWidth: 1,
    borderRadius: 30,
    paddingHorizontal: 25,
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
  trashButton: {
    marginLeft: 10,
  },
});

export default CommentsSlider;
