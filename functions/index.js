
const functions = require("firebase-functions");

const {getAuth} = require("firebase-admin/auth");

const {onRequest} = require("firebase-functions/v2/https");

const {initializeApp} = require("firebase-admin/app");

const {setGlobalOptions} = require("firebase-functions/v2");

setGlobalOptions({region: "asia-northeast3"});

initializeApp();

const request = require("request-promise");

const kakaoRequestMeUrl = "https://kapi.kakao.com/v2/user/me";
const PROVIDER_KAKAO = "KAKAO";

function requestKakaoMe(accessToken) {
    return request({
        method: "GET",
        headers: {
            "Authorization": `Bearer ${accessToken}`,
        },
        url: kakaoRequestMeUrl,
    });
}

const naverRequestMeUrl = "https://openapi.naver.com/v1/nid/me";
const PROVIDER_NAVER = "NAVER";

function requestNaverMe(accessToken) {
    return request({
        method: "GET",
        headers: {
            "Authorization": `Bearer ${accessToken}`,
        },
        url: naverRequestMeUrl,
    });
}

const googleRequestMeUrl = "https://oauth2.googleapis.com/tokeninfo";
const PROVIDER_GOOGLE = "GOOGLE";

function requestGoogleMe(idToken) {
    return request({
        method: "GET",
        url: `${googleRequestMeUrl}?id_token=${idToken}`,
    });
}

function updateOrCreateUser(
    provider,
    userId,
    displayName,
    email,
    photoURL,
) {
    const isNotExists = [];
    if (!provider) {
        isNotExists.push("provider");
    }
    if (!userId) {
        isNotExists.push("userId");
    }
    if (!displayName) {
        isNotExists.push("displayName");
    }
    if (!email) {
        isNotExists.push("email");
    }

    if (isNotExists.length) {
        throw new functions.https.HttpsError("invalid-argument", "존재하지 않는 인자 : " + isNotExists.join());
    }

    const requestParams = {
        provider: provider,
        displayName: displayName,
        email: email,
    };

    if (photoURL) {
        requestParams["photoURL"] = photoURL;
    }

    return getAuth().updateUser(userId, requestParams)
        .catch((error) => {
            if (error.code == "auth/user-not-found") {
                requestParams["uid"] = userId;
                return getAuth().createUser(requestParams);
            }
            throw error;
        });
}

function createFirebaseTokenWithKakao(provider, accessToken) {
    return requestKakaoMe(accessToken).then((response) => {
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

        return updateOrCreateUser(provider, userId, displayName, email, profileImage);
    }).then((userRecord) => {
        const userId = userRecord.uid;
        return getAuth().createCustomToken(userId, {"provider": provider});
    });
}

function createFirebaseTokenWithNaver(provider, accessToken) {
    return requestNaverMe(accessToken).then((res) => {
        const response = JSON.parse(res).response;
        const userId = `${provider}:${response.id}`;
        if (!userId) {
            throw new functions.https.HttpsError("invalid-argument", "UserId 를 찾지 못했습니다.");
        }

        const displayName = response.nickname;
        const profileImage = response.profile_image;
        const email = response.email;

        return updateOrCreateUser(provider, userId, displayName, email, profileImage);
    }).then((userRecord) => {
        const userId = userRecord.uid;
        return getAuth().createCustomToken(userId, {"provider": provider});
    });
}

function createFirebaseTokenWithGoogle(provider, accessToken) {
    return requestGoogleMe(accessToken).then((response) => {
        const body = JSON.parse(response);
        const userId = `${provider}:${body.sub}`;
        if (!userId) {
            throw new functions.https.HttpsError("invalid-argument", "UserId 를 찾지 못했습니다.");
        }

        const displayName = body.name;
        const profileImage = body.picture;
        const email = body.email;

        return updateOrCreateUser(provider, userId, displayName, email, profileImage);
    }).then((userRecord) => {
        const userId = userRecord.uid;
        return getAuth().createCustomToken(userId, {"provider": provider});
    });
}

function createFirebaseToken(provider, accessToken) {
    if (provider == PROVIDER_KAKAO) {
        return createFirebaseTokenWithKakao(provider, accessToken);
    } else if (provider == PROVIDER_NAVER) {
        return createFirebaseTokenWithNaver(provider, accessToken);
    } else if (provider == PROVIDER_GOOGLE) {
        return createFirebaseTokenWithGoogle(provider, accessToken);
    }

    throw new functions.https.HttpsError("invalid-argument", "존재하지 않는 provider 입니다.");
}

async function authenticate({provider, token}, res) {
    if (!(typeof token === "string") || token.length === 0) {
        throw new functions.https.HttpsError("invalid-argument", "유효하지 않는 token 입니다.");
    }

    try {
        const firebaseToken = await createFirebaseToken(provider, token);
        res.json({
            "token": firebaseToken,
        });
    } catch (error) {
        if (error.errorInfo && error.errorInfo.code && error.errorInfo.message) {
            // Firebase 오류
            res.status(500).json({
                code: error.errorInfo.code,
                message: error.errorInfo.message,
            });
        } else if (error.statusCode) {
            const errorData = JSON.parse(error.error);
            if (errorData.code && errorData.msg) {
                // KaKao 오류
                res.status(error.statusCode).json({
                    code: errorData.code.toString(),
                    msg: errorData.msg,
                });
            } else if (errorData.resultcode && errorData.message) {
                // Naver 오류
                res.status(error.statusCode).json({
                    code: errorData.resultcode,
                    msg: errorData.message,
                });
            } else if (errorData.error && errorData.error_description) {
                // Google 오류
                res.status(error.statusCode).json({
                    code: errorData.error,
                    msg: errorData.error_description,
                });
            } else {
                res.status(500).json({
                    code: "Unknown",
                    msg: "알 수 없는 오류가 발생했습니다.",
                });
            }
        }
    }
}

exports.authWithkakao = onRequest({cors: true}, async (req, res) => {
    const token = req.body.data.token;
    authenticate({
        provider: "KAKAO",
        token: token,
    }, res);
});

exports.authWithNaver = onRequest({cors: true}, async (req, res) => {
    const token = req.body.data.token;
    authenticate({
        provider: "NAVER",
        token: token,
    }, res);
});

exports.authWithGoogle = onRequest({cors: true}, async (req, res) => {
    const token = req.body.data.token;
    authenticate({
        provider: "GOOGLE",
        token: token,
    }, res);
});
