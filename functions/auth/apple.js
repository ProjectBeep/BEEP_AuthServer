import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import functions from "firebase-functions";
import { getAuth } from "firebase-admin/auth";
import dotenv from 'dotenv';
dotenv.config();

import { updateOrCreateUser } from "./common";

// https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_rest_api/verifying_a_user
// Apple 공개키 URL
// id_token(JWT) 을 검증하기 위해 사용
// 검증 방법은 id_token 을 디코딩한 후 JWT 헤더의 kid 값이 일치하는 공개키로 서명을 검증
const publicKeyUrl = "https://appleid.apple.com/auth/keys";

const client = jwksClient({
    jwksUri: publicKeyUrl,
});

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

async function verifyIdToken(idToken) {
    const decodedToken = jwt.decode(idToken, { complete: true });
    if (!decodedToken) {
        throw new functions.https.HttpsError("invalid-argument", "Invalid ID token");
    }

    const kid = decodedToken.header.kid;
    const publicKey = await getApplePublicKey(kid);

    return jwt.verify(idToken, publicKey, { algorithms: ["RS256"] });
}

async function getApplePublicKey(kid) {
    return new Promise((resolve, reject) => {
        client.getSigningKey(kid, (err, key) => {
            if (err) {
                reject(err);
            } else {
                resolve(key.getPublicKey());
            }
        });
    });
}

async function createFirebaseTokenWithApple(provider, id_token) {
    const decodedToken = await verifyIdToken(id_token)

    const userId = `${provider}:${decodedToken.sub}`;
    if (!userId) {
        throw new functions.https.HttpsError("invalid-argument", "UserId 를 찾지 못했습니다.");
    }

    const email = decodedToken.email;
    const userRecode = await updateOrCreateUser(provider, userId, null, email, null);

    return getAuth().createCustomToken(userRecode.uid, { "provider": provider });
}

module.exports = {
    createFirebaseTokenWithApple,
};