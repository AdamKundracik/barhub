import {getAuth} from "firebase/auth";
import {ref, uploadBytes} from "firebase/storage";
import {storage} from "../../../firebaseConfig";

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
        const storageRef = ref(storage,
            `${auth.currentUser.uid}/${new Date().getTime().toString() + auth.currentUser?.uid}`);
        await uploadBytes(storageRef, blob);
    }
};
