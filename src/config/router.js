const AuthHandlers = require('../ups/auth/handlers');
const ProfileHandlers = require('../ups/profiles/handlers');
const ConnectionsHandlers = require('../ups/connections/handlers');
const NoteHandlers = require('../ups/notes/handlers');

/**
 * Main router for our application, include all routes here. No logic should be added in this file.
 * @param {Express} app 
 */
function router(app) {
  // Auth Endpoints
  app.get('/auth/twitter/token', AuthHandlers.getTwitterToken );
  app.get('/auth/twitter/username', AuthHandlers.getTwitterUsername );
  app.get('/auth/session/:sessionId/exists', AuthHandlers.doesSessionExist);
  app.get('/auth/email/:email/exists', AuthHandlers.doesAttributeExist );
  app.get('/auth/tagferId/:tagferId/exists', AuthHandlers.doesAttributeExist );
  app.post('/auth/phone/code', AuthHandlers.sendPhoneCode);
  app.post('/auth/phone/verify', AuthHandlers.verifyPhoneCode);
  app.post('/auth/signin', AuthHandlers.signin);
  app.post('/auth/signout', AuthHandlers.signout);
  app.post('/auth/passwordReset', AuthHandlers.sendPasswordResetEmail);
  app.post('/auth/findUsers/byPhone', AuthHandlers.findUsersByPhoneNumber);
  app.put('/auth/signup', AuthHandlers.signup);

  // Profile Endpoints
  app.post('/profiles/me/:profileN', ProfileHandlers.updateUserProfile);
  app.get('/profiles/me/:profileN', ProfileHandlers.getUserProfile);
  app.get('/profiles/:tagferId', ProfileHandlers.getUserProfile);
  app.get('/profiles/suggest', ProfileHandlers.suggestNProfiles);

  // Notes Endpoints
  app.get('/notes/me/:tagferId', NoteHandlers.getAllNotes);
  app.put('/notes/me/:tagferId', NoteHandlers.createNote);
  app.post('/notes/me/:tagferId', NoteHandlers.updateNote);
  app.delete('/notes/me/:tagferId', NoteHandlers.deleteNote);

  // Connection Endpoints
  app.get('/connections/me', ConnectionsHandlers.getAllConnections);
  app.get('/connections/me/count', ConnectionsHandlers.getConnectionCount);
  app.get('/connections/:tagferId/count', ConnectionsHandlers.getConnectionCount);
  app.get('/connections/me/requests', ConnectionsHandlers.getConnectionRequests);
  app.put('/connections/me/:profileN', ConnectionsHandlers.sendConnectionRequest);
  app.post('/connections/me/:profileN', ConnectionsHandlers.acceptConnectionRequest);
  app.delete('/connections/me', ConnectionsHandlers.removeConnectionRequest);
}

module.exports = router;