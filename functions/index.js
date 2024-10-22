const { logger } = require("firebase-functions");

const { onRequest } = require("firebase-functions/v2/https");

const { initializeApp } = require("firebase-admin/app");

const { setGlobalOptions } = require("firebase-functions/v2");

const { authenticate } = require("./auth/auth");

setGlobalOptions({ region: "asia-northeast3" });

initializeApp();

exports.authWithToken = onRequest({ cors: true }, async (req, res) => {
  const provider = req.body.provider.toUpperCase();
  const token = req.body.token;

  logger.log("authWithToken", provider, token);

  await authenticate(
    {
      provider: provider,
      token: token,
    },
    res
  );
});
