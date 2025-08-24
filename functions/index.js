const { logger } = require("firebase-functions");

const { onRequest } = require("firebase-functions/v2/https");

const { initializeApp } = require("firebase-admin/app");

const { setGlobalOptions } = require("firebase-functions/v2");

const { authenticate } = require("./auth/auth");

setGlobalOptions({ region: "asia-northeast3" });

initializeApp();

exports.authWithToken = onRequest({ cors: true }, async (req, res) => {
  // 요청 본문 검증
  if (!req.body || !req.body.provider || !req.body.token) {
    res.status(400).json({
      origin: "firebase",
      code: "invalid-argument",
      message: "provider와 token이 필요합니다."
    });
    return;
  }

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
