const functions = require("firebase-functions");

const { createFirebaseTokenWithKakao } = require("./kakao");
const { createFirebaseTokenWithNaver } = require("./naver");
const { createFirebaseTokenWithGoogle } = require("./google");
const { createFirebaseTokenWithApple } = require("./apple");

const PROVIDER_KAKAO = "KAKAO";
const PROVIDER_NAVER = "NAVER";
const PROVIDER_GOOGLE = "GOOGLE";
const PROVIDER_APPLE = "APPLE";

const ORIGIN_FIREBASE = "firebase";

const UNKNOWN_ORIGIN = "unknown";
const UNKNOWN_CODE = "Unknown";
const UNKNOWN_MSG = "알 수 없는 오류가 발생했습니다.";

async function createFirebaseToken(provider, accessToken) {
  if (provider == PROVIDER_KAKAO) {
    return await createFirebaseTokenWithKakao(provider, accessToken);
  } else if (provider == PROVIDER_NAVER) {
    return await createFirebaseTokenWithNaver(provider, accessToken);
  } else if (provider == PROVIDER_GOOGLE) {
    return await createFirebaseTokenWithGoogle(provider, accessToken);
  } else if (provider == PROVIDER_APPLE) {
    return await createFirebaseTokenWithApple(provider, accessToken);
  }

  throw new functions.https.HttpsError(
    "invalid-argument",
    "존재하지 않는 provider 입니다."
  );
}

async function authenticate({ provider, token }, res) {
  if (!(typeof token === "string") || token.length === 0) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "유효하지 않는 token 입니다."
    );
  }

  try {
    const firebaseToken = await createFirebaseToken(provider, token);
    res.json({
      token: firebaseToken,
    });
  } catch (error) {
    if (error.errorInfo && error.errorInfo.code && error.errorInfo.message) {
      res.status(500).json({
        origin: ORIGIN_FIREBASE,
        code: error.errorInfo.code,
        message: error.errorInfo.message,
      });
    } else if (error.statusCode) {
      const errorData = JSON.parse(error.error);
      let origin = UNKNOWN_ORIGIN;
      let code = UNKNOWN_CODE;
      let msg = UNKNOWN_MSG;
      if (provider == PROVIDER_KAKAO && errorData.code && errorData.msg) {
        origin = provider.toLowerCase();
        code = errorData.code.toString();
        msg = errorData.msg;
      } else if (
        provider == PROVIDER_NAVER &&
        errorData.resultcode &&
        errorData.message
      ) {
        origin = provider.toLowerCase();
        code = errorData.resultcode;
        msg = errorData.message;
      } else if (
        provider == PROVIDER_GOOGLE &&
        errorData.error &&
        errorData.error_description
      ) {
        origin = provider.toLowerCase();
        code = errorData.error;
        msg = errorData.error_description;
      } else if (
        provider == PROVIDER_APPLE &&
        errorData.error &&
        errorData.error_description
      ) {
        origin = provider.toLowerCase();
        code = errorData.error;
        msg = errorData.error_description;
      }
      res.status(error.statusCode).json({ origin, code, msg });
    } else {
      res.status(error.statusCode).json({
        origin: UNKNOWN_ORIGIN,
        code: UNKNOWN_CODE,
        msg: UNKNOWN_MSG,
      });
    }
  }
}

module.exports = {
  authenticate,
};
