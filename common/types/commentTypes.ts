export interface PostComment {
  id: string;
  userId: string;
  userName: string;
  userPhotoUrl: string;
  text: string;
  creationTime?: FirebaseFirestore.Timestamp;
}

export interface PostCommentsResponse {
  comments: PostComment[];
}

export interface AddedCommentResponse {
  addedComment: PostComment;
}
