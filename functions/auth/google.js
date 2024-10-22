const functions = require("firebase-functions");
const { getAuth } = require("firebase-admin/auth");
const { updateOrCreateUser } = require("./common");
const axios = require("axios");

const requestMeUrl = "https://oauth2.googleapis.com/tokeninfo";

async function createFirebaseTokenWithGoogle(provider, accessToken) {
  const response = await requestMe(accessToken);
  const body = JSON.parse(response);
  const userId = `${provider}:${body.sub}`;
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

async function requestMe(idToken) {
  try {
    const response = await axios.get(requestMeUrl, {
      params: {
        id_token: idToken,
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
  createFirebaseTokenWithGoogle,
};
