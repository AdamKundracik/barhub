import {CallableContext} from "firebase-functions/lib/common/providers/https";
import {auth} from "firebase-admin";
import UserRecord = auth.UserRecord;


const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();
const functions = require("firebase-functions");


//TODO: FINISH FUNCTION
export const createUser = functions.auth.user().onCreate((user) => {
    return admin
        .firestore()
        .collection("users")
        .doc(user.uid)
        .set(JSON.parse(JSON.stringify(user)));
})

export const setUser = functions.https.onCall(async (user: UserRecord, context: CallableContext) => {
    await db.collection('users').doc(context.auth.uid).set(
        user, {merge: true}
    )
})

export const savePost = functions.https.onCall(async (post: {
    creationTime: Date;
    fileId: string;
    folderId: string;
    name: string;
    uid: string
}, context: CallableContext) => {
    await db.collection('posts').doc(context.auth.uid).set(post, {merge: true});
})


//GET  await db.collection(data.collectionId).doc(data.documentId).get();
