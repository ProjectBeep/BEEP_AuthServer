const functions = require("firebase-functions");
const { getAuth } = require("firebase-admin/auth");
const { updateOrCreateUser } = require("./common");
const axios = require("axios");

const requestMeUrl = "https://openapi.naver.com/v1/nid/me";

async function createFirebaseTokenWithNaver(provider, accessToken) {
  const response = await requestMe(accessToken);
  const body = JSON.parse(response);
  const userId = `${provider}:${body.id}`;
  if (!userId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "UserId 를 찾지 못했습니다."
    );
  }

  const displayName = body.nickname;
  const profileImage = body.profile_image;
  const email = body.email;

  const userRecord = await updateOrCreateUser(
    provider,
    userId,
    displayName,
    email,
    profileImage
  );
  return getAuth().createCustomToken(userRecord.uid, { provider: provider });
}

async function requestMe(accessToken) {
  try {
    const response = await axios.get(requestMeUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Invalid ID token"
    );
  }
}

module.exports = {
  createFirebaseTokenWithNaver,
};
