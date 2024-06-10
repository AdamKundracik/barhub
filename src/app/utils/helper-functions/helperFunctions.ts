import {getAuth} from "firebase/auth";
import {ref, uploadBytes} from "firebase/storage";
import {storage} from "../../../../firebaseConfig";
import {savePost} from "../services/functions";
import {Post} from "../types/types";
import {generateId} from "./generate-hash";

export const uploadImageAsync = async (uri: string): Promise<void> => {
    const auth = getAuth()
    if (auth.currentUser) {
        const blob: Blob = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onload = function () {
                resolve(xhr.response);
            };
            xhr.onerror = function (e) {
                console.error(e);
                reject(new TypeError('Network request failed'));
            };
            xhr.responseType = 'blob';
            xhr.open('GET', uri, true);
            xhr.send(null);
        });

        const fileId = `${auth.currentUser.uid}/${new Date().getTime().toString() + auth.currentUser?.uid}`
        const newPost: Post = {
            uid: generateId(),
            name: auth.currentUser.displayName ?? '',
            fileId: fileId,
            folderId: auth.currentUser.uid,
            creationTime: new Date()
        }
        savePost(newPost)
        const storageRef = ref(storage,
            fileId);
        await uploadBytes(storageRef, blob);
    }
};
