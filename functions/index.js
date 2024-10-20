const { onRequest } = require("firebase-functions/v2/https");

const { initializeApp } = require("firebase-admin/app");

const { setGlobalOptions } = require("firebase-functions/v2");

const { authenticate } = require("./auth/auth");

setGlobalOptions({ region: "asia-northeast3" });

initializeApp();

exports.authWithToken = onRequest({ cors: true }, async (req, res) => {
    await authenticate({
        provider: req.body.provider.toUpperCase(),
        token: req.body.token,
    }, res);
});
