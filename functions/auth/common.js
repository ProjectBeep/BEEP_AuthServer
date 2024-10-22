const functions = require("firebase-functions");
const { getAuth } = require("firebase-admin/auth");

async function updateOrCreateUser(
  provider,
  userId,
  displayName,
  email,
  photoURL
) {
  const requiredFields = { provider, userId, email };
  const isNotExists = Object.keys(requiredFields).filter(
    (key) => !requiredFields[key]
  );

  if (isNotExists.length) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "존재하지 않는 인자 : " + isNotExists.join()
    );
  }

  const requestParams = {
    provider: provider,
    email: email,
  };

  if (displayName) {
    requestParams["displayName"] = displayName;
  }

  if (photoURL) {
    requestParams["photoURL"] = photoURL;
  }

  let userRecord = null;
  try {
    userRecord = await getAuth().updateUser(userId, requestParams);
  } catch (error) {
    if (error.code == "auth/user-not-found") {
      requestParams["uid"] = userId;
      userRecord = await getAuth().createUser(requestParams);
    } else {
      throw error;
    }
  }
  return userRecord;
}

module.exports = {
  updateOrCreateUser,
};
