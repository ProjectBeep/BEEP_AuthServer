const functions = require("firebase-functions");
const { getAuth } = require("firebase-admin/auth");
const { updateOrCreateUser } = require("./common");
const axios = require("axios");

const requestMeUrl = "https://www.googleapis.com/oauth2/v2/userinfo";

async function createFirebaseTokenWithGoogle(provider, accessToken) {
  const response = await requestMe(accessToken);
  const body = response; // axios는 이미 JSON을 파싱해줌
  const userId = `${provider}:${body.id}`;
  if (!userId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "UserId 를 찾지 못했습니다."
    );
  }

  const displayName = body.name;
  const profileImage = body.picture;
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
      "Invalid access token"
    );
  }
}

module.exports = {
  createFirebaseTokenWithGoogle,
};
