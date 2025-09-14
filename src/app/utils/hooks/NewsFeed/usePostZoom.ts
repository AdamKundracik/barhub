import { useState } from 'react';

export const usePostZoom = () => {
  const [zoomedPost, setZoomedPost] = useState<string | null>(null);

  const zoomPost = (postId: string) => setZoomedPost(postId);
  const unzoomPost = () => setZoomedPost(null);

  return {
    zoomedPost,
    zoomPost,
    unzoomPost,
    setZoomedPost, // Keep for backward compatibility
  };
};
