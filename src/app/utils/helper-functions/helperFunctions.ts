import {
  deleteObject,
  getDownloadURL,
  getStorage,
  list,
  ref,
  uploadBytes,
} from 'firebase/storage';
import { auth, storage } from '../../../../firebaseConfig';
import { savePost } from '../services/functions';
import { UseMutationResult } from 'react-query';
import * as ImageManipulator from 'expo-image-manipulator';
import { Post } from '../../../../shared';

export const uploadImageAsync = async (
  uri: string,
  hook: UseMutationResult<boolean, unknown, boolean, unknown>,
  placeId: string,
  placeName: string,
  placeAddress: string
): Promise<void> => {
  try {
    if (!auth.currentUser) {
      console.error('No current user');
      return;
    }

    const blob: Blob = await uriToBlob(uri);
    const fileId = `${placeId}/${new Date().getTime().toString() + '_' + auth.currentUser?.uid}`;

    const storageRef = ref(storage, fileId);
    await uploadBytes(storageRef, blob);
    await hook.mutateAsync(false);
    const url = await getDownloadURL(storageRef);

    const newPost: Post = {
      id: '',
      user_id: auth.currentUser?.uid,
      name: auth.currentUser.displayName ?? '',
      fileId: fileId.split('/')[1],
      folderId: placeId,
      creationTime: new Date(),
      timestamp: Date.now(),
      placeName: placeName,
      placeAddress: placeAddress,
      photoUrl: url,
    };

    await savePost(newPost);
  } catch (error) {
    console.error('Error uploading image:', error);
  }
};

const uriToBlob = async (uri: string): Promise<Blob> => {
  return new Promise(async (resolve, reject) => {
    try {
      const width = 576;
      const height = 720;

      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width, height } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.WEBP }
      );

      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        resolve(xhr.response);
      };
      xhr.onerror = function () {
        reject(new Error('uriToBlob failed'));
      };
      xhr.responseType = 'blob';
      xhr.open('GET', manipResult.uri, true);
      xhr.send(null);
    } catch (error) {
      reject(error);
    }
  });
};

export const uploadProfilePhotoAsync = async (uri: string): Promise<string> => {
  try {
    if (!auth.currentUser) {
      throw new Error('No current user');
    }

    const fileId = `profile_photos/${auth.currentUser?.uid}`;
    const storageRef = ref(storage, fileId);

    const blob: Blob = await uriToBlob(uri);
    const result = await uploadBytes(storageRef, blob);

    return getProfilePicture(result.metadata.name);
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export const getProfilePicture = async (id?: string): Promise<string> => {
  let uri = '';
  try {
    const storage = getStorage();
    const listRef = ref(storage, `profile_photos/${id}`);

    try {
      uri = await getDownloadURL(listRef);
    } catch (downloadError) {
      // Handle the error from getDownloadURL
      console.error('Error getting download URL: ', downloadError);
      return ''; // Return an empty string or a default placeholder image URL
    }

    return uri; // Return the successful URI
  } catch (error) {
    // Handle any other errors that may occur
    console.error('Error listing files: ', error);
    return ''; // Return an empty string or a default placeholder image URL
  }
};

export const deleteProfilePicture = async (userId: string): Promise<void> => {
  const storageRef = ref(storage, `profile_photos/${userId}`);
  await deleteObject(storageRef);
};

export const listFiles = async (placeId: string | undefined | null) => {
  try {
    const storage = getStorage();
    const listRef = ref(storage, placeId ?? auth.currentUser?.uid);
    const res = await list(listRef, { maxResults: 20 });
    const fileNames: string[] = [];
    const urls = await Promise.all(
      res.items.map(item => {
        fileNames.push(item.name);
        return getDownloadURL(item);
      })
    );
    return { urls, fileNames };
  } catch (error) {
    console.error('Error listing files: ', error);
  }
};

export const listNewsFeedFiles = async (postPath: string) => {
  try {
    const storage = getStorage();
    const fileRef = ref(storage, postPath);
    const url = await getDownloadURL(fileRef);
    return url;
  } catch (error) {
    console.error('Error getting file URL:', error);
    return null;
  }
};
