import {
  getDownloadURL,
  getStorage,
  list,
  ref,
  uploadBytes,
} from 'firebase/storage';
import { auth, storage } from '../../../../firebaseConfig';
import { savePost } from '../services/functions';
import { Post } from '../types/types';
import { generateId } from './generate-hash';
import { UseMutationResult } from 'react-query';

export const uploadImageAsync = async (
  uri: string,
  hook: UseMutationResult<boolean, unknown, boolean, unknown>,
  placeId: string
): Promise<void> => {
  try {
    if (!auth.currentUser) {
      console.error('No current user');
      return;
    }

    const blob: Blob = await uriToBlob(uri);
    const fileId = `${placeId}/${new Date().getTime().toString() + '_' + auth.currentUser?.uid}`;
    const newPost: Post = {
      uid: generateId(),
      name: auth.currentUser.displayName ?? '',
      fileId: fileId,
      folderId: auth.currentUser.uid,
      creationTime: new Date(),
    };

    await savePost(newPost);
    const storageRef = ref(storage, fileId);
    uploadBytes(storageRef, blob).then(result => {
      console.log('Upload successful!');
      hook.mutate(false);
    });
  } catch (error) {
    console.error('Error uploading image:', error);
  }
};

const uriToBlob = async (uri: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
      resolve(xhr.response);
    };
    xhr.onerror = function () {
      reject(new Error('uriToBlob failed'));
    };
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
};

export const uploadProfilePhotoAsync = async (uri: string): Promise<void> => {
  try {
    if (!auth.currentUser) {
      console.error('No current user');
      return;
    }

    const blob: Blob = await uriToBlob(uri);
    const fileId = `profile_photos/${auth.currentUser?.uid}`;

    const storageRef = ref(storage, fileId);
    uploadBytes(storageRef, blob).then(result => {
      console.log('Upload successful!');
    });
  } catch (error) {
    console.error('Error uploading image:', error);
  }
};

export const getProfilePicture = async () => {
  let uri = '';
  try {
    const storage = getStorage();
    const listRef = ref(storage, 'profile_photos');
    const res = await list(listRef);
    const photoReference = res.items.find(
      item => item.name === auth.currentUser?.uid
    );
    if (photoReference) {
      uri = await getDownloadURL(photoReference);
    }
    return uri;
  } catch (error) {
    console.error('Error listing files: ', error);
  }
};

export const listFiles = async (placeId: string | undefined | null) => {
  try {
    console.log('placeId', placeId);
    const storage = getStorage();
    const listRef = ref(storage, placeId ?? auth.currentUser?.uid);
    const res = await list(listRef, { maxResults: 20 });
    const urls = await Promise.all(
      res.items.map(item => getDownloadURL(item)).reverse()
    );
    return urls;
  } catch (error) {
    console.error('Error listing files: ', error);
  }
};
