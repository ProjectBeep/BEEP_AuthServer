// const {logger} = require("firebase-functions");
// const {onRequest} = require("firebase-functions/v2/https");
// const {onDocumentCreated} = require("firebase-functions/v2/firestore");

// // The Firebase Admin SDK to access Firestore.
// const {initializeApp} = require("firebase-admin/app");
// const {getFirestore} = require("firebase-admin/firestore");

// initializeApp();

// exports.addPage = onRequest( async (req, res) => {
//     const original = req.query.text;
//     const writeResult = await getFirestore()
//         .collection("messages")
//         .add({original : original})

//     res.json({
//         result : `Message with ID: ${writeResult.id} added`
//     });
// });

// exports.makeuppercase = onDocumentCreated("/messages/{documentId}", (event) => {
//     const original = event.data.data().original

//     logger.log("Uppercasing", event.params.documentId, original)

//     const uppercase = original.toUpperCase();

//     return event.data.ref.set({uppercase}, {merge: true})
// });
// // https://cloud.google.com/functions/docs/calling/cloud-firestore?hl=ko

const admin = require("firebase-admin")
const functions = require("firebase-functions");

const serviceAccount = require("./adminKey.json")

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
})

const request = require("request-promise")

const kakaoRequestMeUrl = "https://kapi.kakao.com/v2/user/me"

function requestKakaoMe(kakaoAccessToken) {
    return request({
        method: "GET",
        headers: { "Authorization": "Bearer " + kakaoAccessToken },
        url: kakaoRequestMeUrl
    })
}

function updateOrCreateUser(
    provider,
    userId,
    displayName, 
    email,
    photoURL,
) {
    isNotExists = []
    if(!provider) {
        isNotExists.push("provider")
    }
    if(!userId) {
        isNotExists.push("userId")
    }
    if(!displayName) {
        isNotExists.push("displayName")
    }
    if(!email) {
        isNotExists.push("email")
    }

    if(isNotExists) {
        throw new functions.https.HttpsError("invalid-argument", "존재하지 않는 인자 : " + isNotExists.join())
    }

    const requestParams = {
        provider: provider,
        displayName: displayName,
        email: email,
    }

    if(photoURL) {
        requestParams["photoURL"] = photoURL
    }

    return admin.auth().updateUser(userId, requestParams)
        .catch((error) => {
            if(error.code == 'auth/user-not-found') {
                requestParams["uid"] = userId
                return admin.auth().createUser(requestParams)
            }
            throw error
        })
}

function createFirebaseToken(provider, accessToken) {
    if(provider == "KAKAO") {
        return requestKakaoMe(accessToken).then((response) => {
            const body = JSON.parse(response)
            const userId = `${provider}:${body.id}`
            if(!userId) {
                throw new functions.https.HttpsError("invalid-argument", "UserId 를 찾지 못했습니다.")
            }

            const displayName = null
            const profileImage = null
            const email = null
            if(body.properties) {
                displayName = body.properties.nickname
                profileImage = body.properties.profile_image
            }

            if(body.kakao_account) {
                email = body.kakao_account.email
            }
            return updateOrCreateUser(provider, userId, displayName, email, profileImage)
        }).then((userRecord) => {
            const userId = userRecord.uid
            return admin.auth().createCustomToken(userId, { 'provider': provider })
        })
    }
    throw new functions.https.HttpsError("invalid-argument", "존재하지 않는 provider 입니다.")
}

exports.kakaoCustomAuth = functions.region('asia-northeast3').https
    .onCall((data) => {
        const token = data.token

        if(!(typeof token === 'string') || token.length === 0) {
            throw new functions.https.HttpsError("invalid-argument", "유효하지 않는 token 입니다.")
        }

        return createFirebaseToken("KAKAO", token).then((firebaseToken) => {
            return { "token": firebaseToken }
        })
    })
