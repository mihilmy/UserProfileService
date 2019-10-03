const OAuth = require('oauth-1.0a');
const admin = require('firebase-admin');
const crypto  = require('crypto');

const appConfig =  require('../../config/app.json');
const http =  require('../../config/http');
const errors =  require('../../config/errors');

/**
 * Verifies if the request is valid by checking if the request has the right app secret.
 * @param {Object} req express request object
 * @param {Object} res express response object
 * @returns true if the app secret is valid and false otherwise
 */
function isAppSecretValid(req, res) {
  const usrToken = req.headers.authorization;
  const sysToken = appConfig.keys.appSecret;

  if( usrToken !== sysToken) {
    res.status(http.UNAUTHORIZED).json({ error: errors.AUTH_UNAUTHORIZED_ACCESS });
    return false;
  }

  return true;  
}

function getSessionIdFromAuthHeader(req) {
  const usrToken = req.headers.authorization;

  if (usrToken) {
    return usrToken;
  } else {
    return null;
  }
}
/**
 * Checks if the body is valid
 * @param {Function} isValid verifier 
 */
function isBodyValid(isValid, response) {
  if (!isValid()) {
    response.status(http.BAD_REQUEST).json({error: errors.MISSING_BODY_ATTRIBUTES});
    return false;
  }

  return true;
} 

function isProfileNumberValid(profileNumber, response) {
  if (profileNumber > 4 || profileNumber < 1) {
    response.status(http.BAD_REQUEST).json({error: errors.NO_PROFILE_FOUND_FOR_NUMBER});
    return false;
  } else {
    return true;
  }
}

/**
 * Creates the OAuth header to be passed into a request. 
 * 
 * @param {Object} request { method: String, url: String, data: Object }
 * @param {Object} app { consumer: Object, token: Object }, each object is of the following { key: String, secret: String }
 * @returns { Authorization: String }
 */
function createOAuthHeader(request, app) {
  const oauth = OAuth({
    consumer: app.consumer,
    signature_method: 'HMAC-SHA1',
    hash_function: (base_string, key) => (crypto.createHmac('sha1', key).update(base_string).digest('base64'))
  });

  return oauth.toHeader(oauth.authorize(request, app.token));
}

async function uploadImage(imageData, path, bucketName) {
  try {
    const bucket = admin.storage().bucket(`gs://${bucketName}`);

    const file = bucket.file(`${path}`);
    await file.save(Buffer.from(imageData, 'base64'));

    const fileMetaData = await file.getMetadata();
    return fileMetaData[0].mediaLink;
  } catch (error) {
    console.log(error);
    throw errors.APP_FIREBASE_STORAGE_ERROR;
  }
}

function dbErrorHandler(error) {
  console.log(error);
  throw errors.APP_FIREBASE_DATABASE_ERROR;
}

function storageErrorHandler(error) {
  console.log(error);
  throw errors.APP_FIREBASE_STORAGE_ERROR;
}

module.exports = {
  isAppSecretValid,
  isBodyValid,
  getSessionIdFromAuthHeader,
  isProfileNumberValid,
  createOAuthHeader,
  uploadImage,
  dbErrorHandler,
  storageErrorHandler
};