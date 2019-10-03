const admin = require('firebase-admin');

const profileDao = require('../profiles/dao');
const utils = require('../utils/utils');

function createConnectionRequest(fromTagferId, fromProfileN, toTagferId) {
  const ref = admin.database().ref('requests');  
  const updates = {};
  updates[`${fromTagferId}/sent/${toTagferId}`] = fromProfileN;
  updates[`${toTagferId}/received/${fromTagferId}`] = fromProfileN;

  return ref.update(updates).catch(utils.dbErrorHandler);
}

function removeConnectionRequest(fromTagferId, toTagferId) {
  const ref = admin.database().ref('requests');   
  const updates = {};
  updates[`${fromTagferId}/sent/${toTagferId}`] = null;
  updates[`${toTagferId}/received/${fromTagferId}`] = null;

  return ref.update(updates).catch(utils.dbErrorHandler);
}

function createConnection(fromTagferId, fromProfileN, toTagferId, toProfileN) {
  const rootRef = admin.database().ref();
  const updates = {};
  updates[`requests/${fromTagferId}/sent/${toTagferId}`] = null;
  updates[`connections/${fromTagferId}/to/${toTagferId}`] = toProfileN;
  updates[`requests/${toTagferId}/received/${fromTagferId}`] = null;
  updates[`connections/${toTagferId}/to/${fromTagferId}`] = fromProfileN;

  return Promise.all([
    rootRef.update(updates).catch(utils.dbErrorHandler),
    updateConnectionCount(fromTagferId),
    updateConnectionCount(toTagferId)
  ]);
}

function updateConnectionCount(tagferId) {
  const ref = admin.database().ref(`connections/${tagferId}`);
  return ref.child('count').once('value').then(count => ref.update({ count: count.val() + 1 })).catch(utils.dbErrorHandler);
}

function getConnectionCount(tagferId) {
  return admin.database().ref(`connections/${tagferId}/count`).once('value')
    .then(count => (count.exists()? count.val(): 0))
    .catch(utils.dbErrorHandler);
}

// Gets sent and received requests as lite profile objects
async function getConnectionRequests(tagferId) {
  const requestsData = await admin.database().ref(`requests/${tagferId}`).once('value').catch(utils.dbErrorHandler);
  const promises = [];
  let rcvdCount = 0;

  requestsData.forEach(requests => {
    if (requests.key === 'received') { rcvdCount = requests.numChildren(); }
    requests.forEach(request => { promises.push(_connectionToLiteProfile(request)); });
  });
  
  const profiles = await Promise.all(promises);
  return {
    received: profiles.slice(0, rcvdCount),
    sent: profiles.slice(rcvdCount)
  };
}

async function getAllConnections(tagferId) {
  const connections = await admin.database().ref(`connections/${tagferId}/to`).once('value').catch(utils.dbErrorHandler);
  const profiles = [[], [], [], []];
  connections.forEach(connection => {
    profiles[connection.val() - 1].push(_connectionToLiteProfile(connection));
  });
  
  return await Promise.all(profiles.map(Promise.all, Promise));  
}

function getAutoAcceptProfileN(tagferId) {
  return admin.database().ref(`connections/${tagferId}/autoAccept`).once('value')
    .then(profileN => (profileN.exists() ? profileN.val() : 0 ))
    .catch(utils.dbErrorHandler);
}

function getConnectionProfileN(fromTagferId, toTagferId) {
  return admin.database().ref(`connections/${fromTagferId}/to/${toTagferId}`).once('value')
    .then(profileN => (profileN.exists() ? profileN.val() : 1 ))
    .catch(utils.dbErrorHandler);
}

function deleteConnection(tagferId1, tagfeId2) {
  const ref = admin.database().ref('connections');   
  const updates = {};
  updates[`${tagferId1}/to/${tagfeId2}`] = null;
  updates[`${tagfeId2}/to/${tagferId1}`] = null;

  return ref.update(updates).catch(utils.dbErrorHandler); 
}

function _connectionToLiteProfile(connection) {
  const tagferId = connection.key;
  const profileN = connection.val();

  return profileDao.getProfile(1, tagferId).then(profile => {
    const litePorfile = profileDao.toLiteProfile(profile, tagferId);
    litePorfile.profileN = profileN;
    return litePorfile;
  });
}

module.exports = {
  createConnectionRequest,
  removeConnectionRequest,
  getConnectionRequests,
  getAllConnections,
  getAutoAcceptProfileN,
  getConnectionProfileN,
  getConnectionCount,
  deleteConnection,
  createConnection
};