const phone = require('phone');

const authDao = require('./dao');
const profileDao = require('./../profiles/dao');
const utils = require('../utils/utils');
const errors =  require('../../config/errors');
const twitter = require('../socials/twitter');

// Handlers
/**
 * Endpoints: auth/email/:email/exists or auth/tagferId/:tagferId/exists
 * Extracts the parameter from the request and calls the appropriate function to check if the attribute exists.
 * @param {Object} req 
 * @param {Object} res {result: Boolean} | {error: String}
 */
function doesAttributeExist(req, res) {
  const { email, tagferId } = req.params;
  if (!utils.isAppSecretValid(req,res)) {
    return;
  }
  var promise = email? authDao.doesEmailExist(email) : authDao.doesTagferIdExist(tagferId.toLowerCase());

  promise.then((result) => res.json({ result }) ).catch(error => res.json(error));
}

/**
 * Endpoint: auth/session/:sessionId/exists
 * Checks if a user session exists.
 * Brute force session id attack safe by app secret.
 * @param {Object} req {}
 * @param {Object} res { result: Boolean }
 */
async function doesSessionExist(req, res) {
  const { sessionId } = req.params;
  if (!utils.isAppSecretValid(req,res)) {
    return;
  }

  try {
    await authDao.getSession(sessionId);
    res.json({ result: true});
  } catch(error) {
    res.json({ result: false });
  }
}

/**
 * Handles the request/response for auth/phone/code. Uses the data layer to generate a unique code,
 * if the phone number is not in our system.
 * @param {Object} req request body contains number
 * @param {Object} res {code: String} | {error: String}
 */
function sendPhoneCode(req, res) {
  const verifier = () => req.body.phoneNumber;
  if (!utils.isAppSecretValid(req,res) || !utils.isBodyValid(verifier, res)) {
    return;
  }

  const phoneNumber = req.body.phoneNumber;
  authDao.doesPhoneExist(phoneNumber).then( result => { 
    if (result === false) { 
      authDao.sendVerificationCode(phoneNumber, status => res.json(status)); 
    } else{ 
      throw { error: errors.AUTH_PHONE_ALREADY_EXISTS };
    }
  }).catch( error => res.json(error) );
}

/**
 * Handles the request/response for auth/phone/verify. Uses the data layer to verify that the code is correct.
 * @param {Object} req request is a json that has both attributes { phone, code }
 * @param {Object} res express request object
 */
function verifyPhoneCode(req, res) {
  const verifier = () => req.body.phoneNumber && req.body.code;
  if (!utils.isAppSecretValid(req,res) || !utils.isBodyValid(verifier, res)) {
    return;
  }

  const phoneNumber = req.body.phoneNumber;
  const code  = req.body.code;
  res.json(authDao.isVerificationCodeCorrect(phoneNumber, code));
}

/**
 * Endpoint: auth/signin
 * Signs the user in using firebase auth
 * 
 * @param {Object} req {email: String, password: String} | {tagferId: String, password: String}
 * @param {Object} res {sessionId: String} | {error: String}
 */
async function signin(req, res) {
  const { email, tagferId, password } = req.body;
  const verifier = () => (email || tagferId) && password;
  if (!utils.isAppSecretValid(req,res) || !utils.isBodyValid(verifier, res)) {
    return;
  }

  try {
    const { user } = await (email ? authDao.signinWithEmail(email, password) : authDao.signinWithTagferId(tagferId, password));
    const sessionId = await authDao.createNewSession(user.uid);
    res.json({ sessionId });
  } catch (error) {
    res.json({ error: error.code ? error.code : error });
  }
}

/**
 * Endpoint: auth/signout
 * Signs out by deleting his session
 * @param {Object} req {}
 * @param {Object} res { error: String } | {}
 */
async function signout(req, res) {
  const sessionId = utils.getSessionIdFromAuthHeader(req);

  try {
    await authDao.deleteSession(sessionId);
    res.json({});
  } catch(error) {
    res.json({ error });
  }
}

/**
 * Endpoint: auth/signup
 * Signs up the user by creating a new user in firebase admin.
 * 
 * @param {Object} req { tagferId: String, email: String, password: String, phoneNumber: String, fullName: String }
 * @param {Object} res { sessionId: String } | { error: String }
 */
async function signup(req, res) {
  const { user, profile, invites } = req.body;
  if (!utils.isAppSecretValid(req,res)) {
    return;
  }

  try {
    // ADD USER TO FIREBASE AUTH
    const tagferId = (await authDao.createNewUser(user)).uid;
    
    // CREATE PROFILE OBJECT
    const profileObject = await profileDao.createInitialProfileObject(profile, tagferId);

    // ADD PROFILE, MAPPER, REQUESTS TO DB
    await authDao.signup(tagferId, user.phoneNumber, profileObject, invites.requests);
    
    // CREATE NEW SESSION ID
    const sessionId = await authDao.createNewSession(tagferId);
    res.json({ sessionId });
    
    // INVITES SENT IN THE BACKGROUND
    authDao.sendMassTextInvites(invites.phoneNumbers, profile.fullName, tagferId);
  } catch (error) {
    console.log(error);
    res.json({ error });
  }
}

/**
 * Endpoint: auth/findUsers/byPhone
 * Seperates the phone numbers into batches in/out of Tagfer network, receiver should use this information to either
 * add people who already in network, or send invites or repeat calls for failed batches.
 * @param {Object} req {phoneNumbers: Array<PhoneNumber>}
 * @param {Object} res {inNetwork : Array<PhoneNumber>, outNetwork: Array<PhoneNumber>, failed: Array<PhoneNumber> }
 */
async function findUsersByPhoneNumber(req, res) {
  const phoneNumbers = req.body.phoneNumbers;
  const verifier = () => phoneNumbers && Array.isArray(phoneNumbers);
  if (!utils.isAppSecretValid(req,res) || !utils.isBodyValid(verifier, res)) {
    return;
  }

  const batches = await authDao.getUsersByPhoneNumber(phoneNumbers.map((number) => phone(number)[0]));
  res.json(batches);
}

/**
 * Endpoint: auth/passwordReset
 * Send a reset password link to the email
 * @param {Object} req { email: String }
 * @param {Object} res {} | { error: String }
 */
function sendPasswordResetEmail(req, res) {
  const { email } = req.body;
  const verifier = () => email;
  if (!utils.isAppSecretValid(req,res) || !utils.isBodyValid(verifier, res)) {
    return;
  }

  authDao.resetPassword(email).then(() => res.json({}) ).catch( error => res.json(error));
}

/**
 * Endpoint: auth/twitter/token
 * Calls the twitter endpoint using OAuth, to get the `oauth_token`
 * @param {Object} req {}
 * @param {Object} res { token: String } | { error: String }
 */
function getTwitterToken(req, res) {
  if (!utils.isAppSecretValid(req,res)) {
    return;
  }

  twitter.getOAuthToken((result) => res.json(result));
}

/**
 * Endpoint: auth/twitter/username
 * Calls the twitter endpoint to get the `screen_name`
 * @param {Object} req {}
 * @param {Object} res HTML @see socials/twitter#passingHTML
 */
function getTwitterUsername(req, res) {
  res.set('Content-Type', 'text/html');
  twitter.getUsername(req.query, (result) => res.send(result));
}

module.exports = {
  doesAttributeExist,
  doesSessionExist,
  findUsersByPhoneNumber,
  sendPhoneCode,
  verifyPhoneCode,
  signin,
  signup,
  signout,
  sendPasswordResetEmail,
  getTwitterToken,
  getTwitterUsername
};