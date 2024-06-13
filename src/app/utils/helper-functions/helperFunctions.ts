import { ref, uploadBytes } from 'firebase/storage';
import { auth, storage } from '../../../../firebaseConfig';
import { savePost } from '../services/functions';
import { Post } from '../types/types';
import { generateId } from './generate-hash';

export const uploadImageAsync = async (uri: string): Promise<void> => {
  try {
    if (!auth.currentUser) {
      console.error('No current user');
      return;
    }

    const blob: Blob = await uriToBlob(uri);
    const fileId = `${auth.currentUser.uid}/${new Date().getTime().toString() + auth.currentUser?.uid}`;
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
