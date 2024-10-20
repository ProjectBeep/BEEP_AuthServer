import functions from "firebase-functions";
import { getAuth } from "firebase-admin/auth";
import request from "request-promise-native";
import { updateOrCreateUser } from "./common";

const requestMeUrl = "https://openapi.naver.com/v1/nid/me";

async function createFirebaseTokenWithNaver(provider, accessToken) {
    const response = await requestMe(accessToken);
    const body = JSON.parse(response);
    const userId = `${provider}:${body.id}`;
    if (!userId) {
        throw new functions.https.HttpsError("invalid-argument", "UserId 를 찾지 못했습니다.");
    }

    const displayName = body.nickname;
    const profileImage = body.profile_image;
    const email = body.email;

    const userRecord = await updateOrCreateUser(provider, userId, displayName, email, profileImage);
    return getAuth().createCustomToken(userRecord.uid, { "provider": provider });
}

async function requestMe(accessToken) {
    return await request({
        method: "GET",
        headers: {
            "Authorization": `Bearer ${accessToken}`,
        },
        url: requestMeUrl,
    });
}

module.exports = {
    createFirebaseTokenWithNaver,
};