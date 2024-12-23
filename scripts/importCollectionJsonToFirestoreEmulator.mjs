import admin from 'firebase-admin';
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

admin.initializeApp(firebaseConfig);

// Connect to Firestore emulator (make sure emulator is running locally)
const db = admin.firestore();
db.settings({
    host: 'localhost:8080', // Firestore emulator
    ssl: false, // Disable SSL for local emulator
});

// Check for collection name and file name argument
const collectionName = process.argv[2];
const fileName = process.argv[3];

if (!collectionName || !fileName) {
    console.log('Please provide both collection name and JSON file as arguments.');
    process.exit(1);
}

// Read JSON data from file and import it into Firestore
async function importCollectionJsonToFirestoreEmulator(fileName, collectionName) {
    try {
        const data = JSON.parse(fs.readFileSync(fileName, 'utf8'));

        if (!data || data.length === 0) {
            console.log('No data found in the file to import.');
            return;
        }

        // Loop through the data and add it to Firestore
        const batch = db.batch();
        data.forEach(item => {
            const docRef = db.collection(collectionName).doc(item.id); // Use `id` from JSON as document ID
            batch.set(docRef, item);
        });

        await batch.commit();
        console.log(`Successfully imported ${data.length} documents into ${collectionName} collection.`);
    } catch (error) {
        console.error('Error importing collection:', error);
    }
}

importCollectionJsonToFirestoreEmulator(fileName, collectionName)
    .catch(err => console.error('Error during import process:', err));
