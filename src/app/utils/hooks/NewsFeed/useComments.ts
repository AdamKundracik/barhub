import { useState } from 'react';

export const useComments = () => {
  const [commentsState, setCommentsState] = useState({
    isOpen: false,
    postId: null as string | null,
    userId: null as string | null,
    expoPushToken: '',
  });

  const openComments = (
    postId: string,
    expoPushToken: string,
    userId: string
  ) => {
    setCommentsState({
      isOpen: true,
      postId,
      userId,
      expoPushToken,
    });
  };

  const closeComments = () => {
    setCommentsState({
      isOpen: false,
      postId: null,
      userId: null,
      expoPushToken: '',
    });
  };

  return {
    commentsState,
    openComments,
    closeComments,
  };
};
