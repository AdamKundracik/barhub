import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from 'fs';

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

// Init database access object
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Check if collection name is passed as an argument
const collectionName = process.argv[2];
if (!collectionName) {
    // console.log('Please provide a collection name as an argument.');
    process.exit(1);
}

// Export collection data to JSON
async function exportCollectionToJson(collectionName) {
    try {
        // Use `collection()` to get a reference to the collection
        const collectionRef = collection(db, collectionName);
        const snapshot = await getDocs(collectionRef);

        if (snapshot.empty) {
            // console.log(`No documents found in collection: ${collectionName}`);
            return;
        }

        const data = [];
        snapshot.forEach(doc => {
            data.push({
                id: doc.id,
                ...doc.data(),
            });
        });

        // Write data to JSON file
        const fileName = `${collectionName}.json`;
        fs.writeFileSync(fileName, JSON.stringify(data, null, 2));
        // console.log(`Data from ${collectionName} has been exported to ${fileName}!`);
    } catch (error) {
        console.error('Error exporting collection:', error);
    }
}

exportCollectionToJson(collectionName)
    .catch(err => console.error('Error exporting Firestore collection:', err));
