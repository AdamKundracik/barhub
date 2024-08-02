import { Post } from '../../../../shared';

export const getRandomRecentPosts = (posts: Post[]) => {
  // Shuffle the array of recent posts
  const shuffledPosts = posts.sort(() => Math.random() - 0.5);

  // Optionally, pick a subset of the shuffled posts
  const selectedPosts = shuffledPosts.slice(
    0,
    Math.min(shuffledPosts.length, 10)
  ); // Select up to 10 posts

  return selectedPosts;
};
