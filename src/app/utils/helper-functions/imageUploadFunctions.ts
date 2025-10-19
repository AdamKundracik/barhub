import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
} from 'firebase/storage';
import * as ImageManipulator from 'expo-image-manipulator';
import { auth, storage } from '@/firebaseConfig';

export const uploadImageAsync = async (
  uri: string,
  placeId: string,
  fileId: string
): Promise<string | null> => {
  try {
    if (!auth.currentUser) {
      console.error('No current user');
      return null;
    }

    const manipulatedImage = await manupulateOmage(uri);

    const response = await fetch(manipulatedImage.uri);
    const path = `${placeId}/${fileId + '_' + auth.currentUser?.uid}`;
    const storageRef = ref(storage, path);
    const blob = await response.blob();

    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
};

async function manupulateOmage(uri: string) {
  const width = 720;
  return await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: width } }],
    {
      compress: 0.7,
      format: ImageManipulator.SaveFormat.WEBP,
    }
  );
}

// const uriToBlob = async (uri: string): Promise<Blob> => {
//   return new Promise(async (resolve, reject) => {
//     try {
//       const width = 720;
//       const height = 720;
//
//       const manipResult = await ImageManipulator.manipulateAsync(
//         uri,
//         [{ resize: { width, height } }],
//         { compress: 0.7, format: ImageManipulator.SaveFormat.WEBP }
//       );
//
//       const xhr = new XMLHttpRequest();
//       xhr.onload = function () {
//         resolve(xhr.response);
//       };
//       xhr.onerror = function () {
//         reject(new Error('uriToBlob failed'));
//       };
//       xhr.responseType = 'blob';
//       xhr.open('GET', manipResult.uri, true);
//       xhr.send(null);
//     } catch (error) {
//       reject(error);
//     }
//   });
// };

export const uploadProfilePhotoAsync = async (uri: string): Promise<string> => {
  try {
    if (!auth.currentUser) {
      throw new Error('No current user');
    }

    const fileId = `profile_photos/${auth.currentUser?.uid}`;
    const storageRef = ref(storage, fileId);

    const manipulatedImage = await manupulateOmage(uri);

    const response = await fetch(manipulatedImage.uri);
    const blob = await response.blob();
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
      console.error('Error getting download URL: ', downloadError);
      return '';
    }

    return uri;
  } catch (error) {
    console.error('Error listing files: ', error);
    return '';
  }
};

export const deleteProfilePicture = async (userId: string): Promise<void> => {
  const storageRef = ref(storage, `profile_photos/${userId}`);
  await deleteObject(storageRef);
};
