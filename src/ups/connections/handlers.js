const authDao = require('../auth/dao');
const connDao = require('./dao');

const utils = require('../utils/utils');

async function getConnectionRequests(req, res) {
  const sessionId = utils.getSessionIdFromAuthHeader(req, res);
  
  try {
    const tagferId = (await authDao.getSession(sessionId)).tagferId;
    const requests = await connDao.getConnectionRequests(tagferId);
    res.send(requests);
  } catch (error) {
    console.log(error);
    res.send({ error });
  }
}

async function getAllConnections(req, res) {
  const sessionId = utils.getSessionIdFromAuthHeader(req, res);
  
  try {
    const tagferId = (await authDao.getSession(sessionId)).tagferId;
    const conns = await connDao.getAllConnections(tagferId);
    res.send({ 
      profile1: conns[0],
      profile2: conns[1],
      profile3: conns[2],
      profile4: conns[3]
    });
  } catch (error) {
    console.log(error);
    res.send({ error });
  }
}

async function sendConnectionRequest(req, res) {
  const sessionId = utils.getSessionIdFromAuthHeader(req, res);
  const fromProfileN = parseInt(req.params.profileN);
  const toTagferId = req.body.toTagferId;

  try {
    const fromTagferId = (await authDao.getSession(sessionId)).tagferId;
    await connDao.createConnectionRequest(fromTagferId, fromProfileN, toTagferId);
    res.send({});
  } catch (error) {
    console.log(error);
    res.send({ error });
  }
}

async function removeConnectionRequest(req, res) {
  const sessionId = utils.getSessionIdFromAuthHeader(req, res);

  try {
    const myTagferId = (await authDao.getSession(sessionId)).tagferId;
    const fromTagferId = req.body.fromTagferId || myTagferId;
    const toTagferId = req.body.toTagferId || myTagferId;

    await connDao.removeConnectionRequest(fromTagferId, toTagferId);
    res.send({});
  } catch (error) {
    console.log(error);
    res.send({ error });
  }
}

async function acceptConnectionRequest(req, res) {
  const sessionId = utils.getSessionIdFromAuthHeader(req, res);
  
  try {
    // Connection request is accepted by the user is the TO_SIDE, he received a request FROM_SIDE
    const toTagferId = (await authDao.getSession(sessionId)).tagferId;
    const toProfileN = parseInt(req.params.profileN);
    const fromTagferId = req.body.fromTagferId;
    const fromProfileN = req.body.fromProfileN;
    
    await connDao.createConnection(fromTagferId, fromProfileN, toTagferId, toProfileN);
    res.send({});
  } catch (error) {
    console.log(error);
    res.send({ error });
  }
}

async function getConnectionCount(req, res) {
  try {
    const tagferId = await _getTagferId(req);  
    const count = await connDao.getConnectionCount(tagferId);
    res.json({ count });
  } catch (error) {
    res.json({ error });
  }
}

async function _getTagferId(req) {
  const sessionId = utils.getSessionIdFromAuthHeader(req);

  if (req.params.tagferId) {
    return req.params.tagferId;
  } else {
    return (await authDao.getSession(sessionId)).tagferId;
  }
}

module.exports = {
  getAllConnections,
  getConnectionCount,
  getConnectionRequests,
  sendConnectionRequest,
  acceptConnectionRequest,
  removeConnectionRequest
};
