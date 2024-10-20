import functions from "firebase-functions";
import { getAuth } from "firebase-admin/auth";
import request from "request-promise-native";
import { updateOrCreateUser } from "./common";

const requestMeUrl = "https://kapi.kakao.com/v2/user/me";

async function createFirebaseTokenWithKakao(provider, accessToken) {
    const response = await requestMe(accessToken);
    const body = JSON.parse(response);
    const userId = `${provider}:${body.id}`;
    if (!userId) {
        throw new functions.https.HttpsError("invalid-argument", "UserId 를 찾지 못했습니다.");
    }

    let displayName = null;
    let profileImage = null;
    let email = null;
    if (body.kakao_account) {
        email = body.kakao_account.email;
    }
    if (body.kakao_account.profile) {
        displayName = body.kakao_account.profile.nickname;
        profileImage = body.kakao_account.profile.profile_image_url;
    }

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
    createFirebaseTokenWithKakao,
};