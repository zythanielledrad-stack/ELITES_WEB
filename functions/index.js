const functions = require("firebase-functions");

const admin = require("firebase-admin");

admin.initializeApp();

exports.getSignedUrl =
functions.https.onCall(async (data, context) => {

  // REQUIRE LOGIN
  if (!context.auth) {

    throw new functions.https.HttpsError(
      "unauthenticated",
      "Login required"
    );

  }

  const filePath =
    data.filePath;

  if (!filePath) {

    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing file path"
    );

  }

  const bucket =
    admin.storage().bucket();

  const file =
    bucket.file(filePath);

  // EXPIRES IN 1 MINUTE
  const expires =
    Date.now() + 60 * 1000;

  const [url] =
    await file.getSignedUrl({
      action: "read",
      expires
    });

  return { url };

});