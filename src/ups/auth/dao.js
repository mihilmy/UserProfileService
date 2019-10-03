const firebase = require('firebase');
const admin = require('firebase-admin');
const uuid = require('uuid/v4');

const utils = require('../utils/utils');
const errors = require('../../config/errors');
const twilio = require('../../config/twilio');
const appConfig = require('../../config/app.json');

/**
 * Checks if the email exists in our auth system
 */
function doesEmailExist(email) {
  return _doesKeyValueExist({email});
}

/**
 * Checks if the tagferId exists in our auth system
 */
function doesTagferIdExist(tagferId) {
  return _doesKeyValueExist({tagferId});
}

/**
 * Checks if the phone number exists in our auth system
 */
function doesPhoneExist(phoneNumber) {
  return _doesKeyValueExist({phoneNumber});
}

/**
 * Sign in user using firebase client api
 * 
 * @param {String} email 
 * @param {String} password 
 */
function signinWithEmail(email, password) {
  return firebase.auth().signInWithEmailAndPassword(email, password);
}

/**
 * Sign in with tagferId using the admin sdk to get email and then the firebase client to sign in
 * 
 * @param {String} tagferId 
 * @param {String} password 
 */
function signinWithTagferId(tagferId, password) {
  return admin.auth().getUser(tagferId).then(user => signinWithEmail(user.email, password) );
}

/**
 * Creates a new user in firebase auth
 * 
 * @param {Object} user 
 * @param {Function} callback 
 */
function createNewUser(user) {
  return admin.auth().createUser({
    uid: user.tagferId.toLowerCase(),
    email: user.email,
    password: user.password,
    phoneNumber: user.phoneNumber
  }).catch(error => { throw error.code; });
}

/**
 * Adds the user signup data to firebase database
 */
function signup(tagferId, phoneNumber, profile, requests = []) {
  const ref = admin.database().ref();
  const updates = {};
  updates[`profiles/${tagferId}/profile1`] = profile;
  updates[`mapper/phoneNumbers/${phoneNumber}`] = tagferId;

  for (let i = 0; i < requests.length; i++) {
    updates[`requests/${tagferId}/sent/${requests[i]}`] = 1;
    updates[`requests/${requests[i]}/received/${tagferId}`] = 1;
  }
  
  return ref.update(updates).catch(utils.dbErrorHandler);
}

/**
 * Filters contacts into three batches:
 * 1. Contacts that are in the tagfer network.
 * 2. Contacts that are out of the network.
 * 3. Contacts that failed to be processed.
 * 
 * @param {Array} phoneNumbers 
 * @returns {Object} groups of inNetwork, outNetwork, failed
 */
async function getUsersByPhoneNumber(phoneNumbers) {
  const promises = [];
  const inNetwork = [];
  const outNetwork = [];
  const failed = [];
  
  for (let i = 0; i < phoneNumbers.length; i++) {
    if (phoneNumbers[i]) promises.push(_getTagferIdByPhoneNumber(phoneNumbers[i],inNetwork, outNetwork, failed));
  }

  await Promise.all(promises);

  return { inNetwork, outNetwork, failed };
}

/**
 * Sends a password reset email
 * @param {email} email 
 */
function resetPassword(email) {
  return firebase.auth().sendPasswordResetEmail(email).catch( error => { throw { error: error.code }; });
}

/**
 * Verifies that the saved code is the same as the user inputed code
 * 
 * @param {String} phoneNumber Phone Number in E.164 format
 * @param {String} usrCode User supplied code
 */
async function isVerificationCodeCorrect(phoneNumber, usrCode) {
  try {
    const sysCode = await getVerificationCode(phoneNumber);
    return { result: usrCode == sysCode };
  } catch (error) {
    return { error };
  }
}

/**
 * Sends the verification code by calling twilio and saving the code to our local storgae
 * @param {string} phoneNumber 
 * @param {function} callback 
 */
async function sendVerificationCode(phoneNumber, callback) {
  const code = await createNewVerificationCode(phoneNumber);
  const message = `Tagfer PIN: ${code}`;
  twilio.sendSMSTo(phoneNumber, message, callback);
}

/**
 * Sends a mass text invite for all phone numbers supplied. Calls are subject to be throttled, since Twillio has a limit
 * of 1 MPS, with a queue of max size of 1MPS * 14,400.
 * 
 * @param {Array} phoneNumbers 
 * @param {String} fullName 
 * @param {String} tagferId 
 */
async function sendMassTextInvites(phoneNumbers = [], fullName, tagferId) {
  const promises = [];
  const referralMessage = `${fullName} gave you ${appConfig.referralTokens} Tagfer Tokens! To claim use his referral link: ${appConfig.baseURL}/${tagferId}`;
  for (let i = 0; i < phoneNumbers.length; i++) {
    promises[i] = twilio.sendSMSTo(phoneNumbers[i], referralMessage);
  }

  try {
    await Promise.all(promises);
  } catch(error) {
    console.log(error);
  }
}

function createNewSession(tagferId) {
  const sessionId = uuid();
  return admin.database().ref(`sessions/${sessionId}`).update({ tagferId }).then(() => sessionId).catch(utils.dbErrorHandler);
}

async function getSession(sessionId) {
  const session = await admin.database().ref(`sessions/${sessionId}`).once('value').catch(utils.dbErrorHandler);
  if (session.exists()) {
    return session.val();
  } else {
    throw errors.AUTH_INVALID_SESSION_ID;
  }
}

function deleteSession(sessionId) {
  admin.database().ref(`sessions/${sessionId}`).remove().catch(utils.dbErrorHandler);
}

function createNewVerificationCode(phoneNumber) {
  const code = Math.floor(((Math.random() * 899999) + 100000));
  return admin.database().ref(`verifications/${phoneNumber}`).set(code).then(() => code).catch(utils.dbErrorHandler);
}

async function getVerificationCode(phoneNumber) {
  const verification = await admin.database().ref(`verifications/${phoneNumber}`).once('value').catch(utils.dbErrorHandler);
  if (verification.exists()) {
    return verification.val();
  } else {
    throw errors.AUTH_PHONE_NOT_CACHED;
  }
}

function _doesKeyValueExist({email, tagferId, phoneNumber}) {
  let promise;

  if (email) { promise = admin.auth().getUserByEmail(email); }
  if (tagferId) { promise = admin.auth().getUser(tagferId.toLowerCase());}
  if (phoneNumber) {promise = admin.auth().getUserByPhoneNumber(phoneNumber); }
  
  return promise.then(() => { return true; })
    .catch(error => { 
      if (error.code === errors.AUTH_USER_NOT_FOUND) {  
        return false; 
      } else {
        throw { error: error.code };
      }
    });
}

function _getTagferIdByPhoneNumber(phoneNumber, inNetwork, outNetwork, failed) {
  return admin.database().ref(`mapper/phoneNumbers/${phoneNumber}`).once('value')
    .then( data => data.exists() ? inNetwork.push(data.val()) : outNetwork.push(phoneNumber))
    .catch( () => failed.push(phoneNumber));
}

module.exports = {
  doesEmailExist,
  doesTagferIdExist,
  doesPhoneExist,
  sendMassTextInvites,
  sendVerificationCode,
  isVerificationCodeCorrect,
  signup,
  signinWithTagferId,
  signinWithEmail,
  createNewUser,
  createNewSession,
  getSession,
  deleteSession,
  resetPassword,
  getUsersByPhoneNumber
};