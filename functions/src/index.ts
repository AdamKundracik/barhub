const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();


//TODO: FINISH FUNCTION
export const createUser = functions.auth.user().onCreate((user) => {
    return admin
        .firestore()
        .collection('users')
        .doc(user.uid)
        .set(JSON.parse(JSON.stringify(user)));
});
