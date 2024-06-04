import {CallableContext} from "firebase-functions/lib/common/providers/https";

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
});

export const savePost = functions.https.onCall(
    async (
        post: {
            creationTime: Date;
            fileId: string;
            folderId: string;
            name: string;
            uid: string;
        },
        context: CallableContext
    ) => {
        await db
            .collection("posts")
            .doc(context.auth.uid)
            .set(post, {merge: true});
    }
);

export const getAllUsers = functions.https.onCall(
    async (users, context: CallableContext) => {
        const usersCollection = db.collection("users");

        try {
            const collection = await usersCollection.get();
            const users: any[] = [];

            collection.forEach((doc) => {
                users.push({id: doc.id, ...doc.data()});
            });

            return {users};
        } catch (error) {
            console.error("Error getting users collection: ", error);
            return error
        }
    }
);

export const getCurrentUser = functions.https.onCall(
    async (data, context: CallableContext) => {
        if (!context.auth) {
            throw new functions.https.HttpsError(
                "unauthenticated",
                "The function must be called while authenticated."
            );
        }

        const uid = context.auth.uid;

        try {
            const userDoc = await db.collection("users").doc(uid).get();

            if (!userDoc.exists) {
                return console.error("USER NOT FOUND");
            }

            return {id: userDoc.id, ...userDoc.data()};
        } catch (error) {
            console.error("Error getting user data: ", error);
        }
    }
);

//GET  await db.collection(data.collectionId).doc(data.documentId).get();
