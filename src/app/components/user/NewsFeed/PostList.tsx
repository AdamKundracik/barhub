import React from 'react';
import { View } from 'react-native';
import RequestPhotoButton from './RequestPhotoButton';
import { Post, User } from '../../../../../shared';
import { PlacePrediction } from '../../../utils/types/types';
import UserPost from './UserPost';
import Ad from '../Ad';

interface PostsListProps {
  posts: Post[];
  zoomedPost: string | null;
  setZoomedPost: (postId: string | null) => void;
  userData: User | null | undefined;
  numberOfDaysSinceLastPostedPhoto: number;
  place: PlacePrediction | null;
  requestPhoto: () => void;
}

const PostsList: React.FC<PostsListProps> = ({
  posts,
  zoomedPost,
  setZoomedPost,
  userData,
  numberOfDaysSinceLastPostedPhoto,
  place,
  requestPhoto,
}) => (
  <>
    {place && <RequestPhotoButton requestPhoto={requestPhoto} />}
    {posts.map((post, index) => (
      <View
        key={index} // changed to index because we might skip rendering post based on index.
        style={{
          marginVertical: 10,
          zIndex: zoomedPost === post.photoUrl ? 1 : 0,
        }}
      >
        <UserPost
          hasPremium={
            (userData?.premium || numberOfDaysSinceLastPostedPhoto <= 7) ??
            false
          }
          post={post}
          setZoomedPost={setZoomedPost}
          isZoomed={zoomedPost === post.photoUrl}
        />
        {index % 2 === 0 && index !== 0 && <Ad />}
      </View>
    ))}
  </>
);

export default PostsList;
