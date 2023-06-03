
const functions = require("firebase-functions");

const {getAuth} = require("firebase-admin/auth");

const {onRequest} = require("firebase-functions/v2/https");

const {initializeApp} = require("firebase-admin/app");

const {setGlobalOptions} = require("firebase-functions/v2");

setGlobalOptions({region: "asia-northeast3"});

initializeApp();

const request = require("request-promise");

const kakaoRequestMeUrl = "https://kapi.kakao.com/v2/user/me";

function requestKakaoMe(kakaoAccessToken) {
    return request({
        method: "GET",
        headers: {
            "Authorization": `Bearer ${kakaoAccessToken}`,
        },
        url: kakaoRequestMeUrl,
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

function createFirebaseToken(provider, accessToken) {
    if (provider == "KAKAO") {
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
    throw new functions.https.HttpsError("invalid-argument", "존재하지 않는 provider 입니다.");
}

exports.authWithkakao = onRequest({cors: true}, async (req, res) => {
    const token = req.body.data.token;

    if (!(typeof token === "string") || token.length === 0) {
        throw new functions.https.HttpsError("invalid-argument", "유효하지 않는 token 입니다.");
    }

    const firebaseToken = await createFirebaseToken("KAKAO", token);
    res.json({
        "token": firebaseToken,
    });
});
