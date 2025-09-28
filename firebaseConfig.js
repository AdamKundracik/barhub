// Import the functions you need from the SDKs you need
import {initializeApp} from 'firebase/app';
import {getReactNativePersistence, GoogleAuthProvider, initializeAuth} from 'firebase/auth';
import {getStorage} from 'firebase/storage';
import {getFirestore} from 'firebase/firestore';
import {getFunctions} from 'firebase/functions';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

const firebaseConfig = {
    apiKey: 'AIzaSyBaV4WnRJebYlHM8tkGYJqytVxCstTlAhI',
    authDomain: 'baruj-app-cb74c.firebaseapp.com',
    databaseURL:
        'https://baruj-app-cb74c-default-rtdb.europe-west1.firebasedatabase.app',
    projectId: 'baruj-app-cb74c',
    storageBucket: 'baruj-app-cb74c.appspot.com',
    messagingSenderId: '995791421821',
    appId: '1:995791421821:web:c9e6dc201955b1b637cc14',
    measurementId: 'G-07V3GVTF2G',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

export const provider = new GoogleAuthProvider();

const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app, 'europe-west1'); // tu sa nastavuje region

// Connect to the emulators if in development mode
// Note: Comment this out when developing locally without emulator set up
// if (__DEV__) {
//     connectFirestoreEmulator(db, 'localhost', 8080);
//     //connectAuthEmulator(auth, 'http://127.0.0.1:9099');
//     connectFunctionsEmulator(functions, 'localhost', 5001);
//     connectStorageEmulator(storage, 'localhost', 9199);
//
//     console.log("SUCCESSFULLY connected to FIREBASE LOCAL EMULATOR");
// }

export { db, storage, functions };
