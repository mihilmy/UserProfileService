const database = require('firebase-admin').database();
const utils = require('../utils/utils');
const appConfig = require('../../config/app.json');

/**
 * Updates a user profile
 * 
 * @param {object} profileObj JSON object containing all data for a profile captured from the frontend
 * @param {number} profileNumber Number used to identify which profile a user wants to update/add to if the profile slot is empty
 * @param {string} tagferId tagferId obtained by extracting from authorization header
 */
async function updateProfile(profileObj, profileN, tagferId) {
  if (profileObj.photoBytes) {
    profileObj.photoURL = await _uploadProfileImageToBucket(profileObj.photoBytes, profileN, tagferId).catch(utils.storageErrorHandler);
    profileObj.photoBytes = null;
  }
  
  return database.ref(`/profiles/${tagferId}/profile${profileN}`).update(profileObj).catch(utils.dbErrorHandler);
}

/**
 * Gets a user profile
 *  
 * @param {Number} profileNumber profile number that identifies which profile information to get for a user
 * @param {string} tagferId SessionId obtained by extracting from authorization header
 */
function getProfile(profileN, tagferId) {
  return database.ref(`/profiles/${tagferId}/profile${profileN}`).once('value')
    .then(snapshot => (snapshot.exists() ? { tagferId, ...snapshot.val() } : {}))
    .catch(utils.dbErrorHandler);
}

var lastRetrievedProfile = undefined; 
/**
 * Returns a list of user profiles,that work as 'suggested contacts'. It works in a cyclic manner, starting from the top
 * node of the children of the profiles it fetches N profiles and saves the last retrieved profile. The next call will
 * start from the last retrieved profile and fetch the next N profiles. If the number of profiles fetched is ever less
 * than N, we make a recursive call to start at the top of the tree again and fetch the X remaining profiles. 
 * 
 * @param {Number} N number of profiles to retrieve
 */
async function suggestNProfiles(N) {
  let data = null;

  if (lastRetrievedProfile) {
    data = await database.ref('profiles').orderByKey().startAt(lastRetrievedProfile).limitToFirst(N).once('value').catch(utils.dbErrorHandler);
  } else {
    data = await database.ref('profiles').limitToFirst(N).once('value').catch(utils.dbErrorHandler);
  }
  const list = new Array(data.numChildren());
  let index = 0;

  data.forEach(profile => { list[index++] = toLiteProfile(profile.val().profile1, profile.key); });
  if (index > 0) { 
    lastRetrievedProfile = list[index-1].tagferId;
  }

  if (data.hasChildren && N !== data.numChildren()) {
    lastRetrievedProfile = undefined;
    return suggestNProfiles(N - index).then(list2 => list2.concat(list));
  }

  return list;
}

/**
 * Creates the initial profile object by formatting the object received from the app and adding the photoURL
 * 
 * @param {Realm Profile} profile 
 * @param {String} tagferId 
 */
async function createInitialProfileObject(profile, tagferId) {
  const { fullName, jobTitle, companyName, companyEmail, companyPhoneNumber, photoBytes } = profile;
  const photoURL = profile.photoBytes ?  await _uploadProfileImageToBucket(photoBytes, 1, tagferId) : null;

  return {
    profileName: appConfig.defaultProfileName,
    fullName,
    photoURL,
    experience: {
      jobTitle,
      companyName
    },
    emails: {
      company: companyEmail
    }, 
    phoneNumbers: {
      company: companyPhoneNumber
    }
  };
}

function toLiteProfile(profile, tagferId) {
  const { fullName, experience, photoURL } = profile;
  const { jobTitle, companyName } = experience;
  return { tagferId, fullName, jobTitle, companyName, photoURL };
}

function _uploadProfileImageToBucket(image, profileN, tagferId) {
  return utils.uploadImage(image, `${tagferId}-profile${profileN}.jpeg`, appConfig.buckets.profile);
}

module.exports = {
  createInitialProfileObject,
  updateProfile,
  getProfile,
  toLiteProfile,
  suggestNProfiles
};
