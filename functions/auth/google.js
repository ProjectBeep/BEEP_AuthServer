import functions from "firebase-functions";
import { getAuth } from "firebase-admin/auth";
import request from "request-promise-native";
import { updateOrCreateUser } from "./common";

const requestMeUrl = "https://oauth2.googleapis.com/tokeninfo";

async function createFirebaseTokenWithGoogle(provider, accessToken) {
    const response = await requestMe(accessToken)
    const body = JSON.parse(response);
    const userId = `${provider}:${body.sub}`;
    if (!userId) {
        throw new functions.https.HttpsError("invalid-argument", "UserId 를 찾지 못했습니다.");
    }

    const displayName = body.name;
    const profileImage = body.picture;
    const email = body.email;

    const userRecord = await updateOrCreateUser(provider, userId, displayName, email, profileImage);
    return getAuth().createCustomToken(userRecord.uid, { "provider": provider });
}

async function requestMe(idToken) {
    return await request({
        method: "GET",
        url: `${requestMeUrl}?id_token=${idToken}`,
    });
}

module.exports = {
    createFirebaseTokenWithGoogle,
};