import {auth} from "firebase-admin";


const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// export const createUser = functions.auth.user().onCreate((user: UserRecord) => {
//     const userObject = {
//         uid: user.uid,
//         email: user.email,
//         createdAt: Date.now()
//     };
//
//     return admin
//         .firestore()
//         .collection('users')
//         .doc(user.uid)
//         .set(userObject)
//         .then(() => {
//             console.log(`User ${user.uid} created at ${new Date().toISOString()}.`);
//         })
//         .catch(console.error);
// });

export const createUser = functions.auth.user().onCreate((user) => {
    return admin
        .firestore()
        .collection('users')
        .doc(user.uid)
        .set(JSON.parse(JSON.stringify(user)));
});
