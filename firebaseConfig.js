// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
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
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);
