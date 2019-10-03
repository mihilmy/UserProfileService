const profileDao = require('./dao');
const authDao = require('../auth/dao');
const connDao = require('../connections/dao');
const utils = require('../utils/utils');
const appConfig = require('../../config/app.json');

// Handlers
/**
 * Endpoints: POST profiles/ 
 * Updates a profile for a user based on session stored tagferId
 * 
 * @param {Object} req 
 * @param {Object} res {result: Boolean} | {error: String}
 */
async function updateUserProfile(req, res) {
  const profileObj = req.body;
  const profileNumber = req.params.profileN;
  const sessionId = utils.getSessionIdFromAuthHeader(req, res);

  try {
    const tagferId = (await authDao.getSession(sessionId)).tagferId;
    await profileDao.updateProfile(profileObj, profileNumber, tagferId);
    res.json({});
  } catch (error) {
    res.json({ error });
  }
}

async function getUserProfile(req, res) {
  try {
    const [tagferId, profileN] = await _getTagferIdAndProfileN(req);
    const profile = await profileDao.getProfile(profileN, tagferId);
    res.json({ profile });
  } catch (error) {
    res.json({ error });
  }
}

/**
 * Endpoint: profiles/suggest
 * @param {Object} req {}
 * @param {Object} res { profiles: LiteProfileObject }
 * 
 * LiteProfileObject = { tagferId, fullName, photoURL, jobTitle, companyName }
 */
async function suggestNProfiles(req, res) {
  if (!utils.isAppSecretValid(req,res)) {
    return;
  }

  try {
    const profiles = await profileDao.suggestNProfiles(appConfig.suggestedUsersCount);
    console.log(profiles.length);
    res.json({ profiles });
  } catch(error) {
    res.json({ error });
  }
}

async function _getTagferIdAndProfileN(req) {
  const sessionId = utils.getSessionIdFromAuthHeader(req);

  if (req.params.profileN) {
    const tagferId = (await authDao.getSession(sessionId)).tagferId;
    const profileN = req.params.profileN;
    return [tagferId, profileN];
  } else {
    const fromTagferId = (await authDao.getSession(sessionId)).tagferId;
    const toTagferId = req.params.tagferId;
    const toProfileN = await connDao.getConnectionProfileN(fromTagferId, toTagferId);
    return [toTagferId, toProfileN];
  }
}

module.exports = {
  updateUserProfile,
  getUserProfile,
  suggestNProfiles
};