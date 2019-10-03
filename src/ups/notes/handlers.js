const authDao = require('../auth/dao');
const notesDao = require('./dao');

const utils = require('../utils/utils');

/**
 * Creates a new note
 * 
 * @param req { content: String }
 * @param res { noteId: String } | { error: AUTH_INVALID_SESSION | FIREBASE_DATABASE_ERROR }
 */
async function createNote(req,res) {
  const noteObject = req.body;
  const toTagferId = req.params.tagferId;
  const sessionId = utils.getSessionIdFromAuthHeader(req, res);

  try {
    const fromTagferId = (await authDao.getSession(sessionId)).tagferId;
    const noteId = await notesDao.createNote(fromTagferId, toTagferId, noteObject);
    res.json({ noteId });
  } catch (error) {
    res.json({ error });
  }
}

/**
 * Updates an existing note
 * 
 * @param req { noteId: String, content: String }
 * @param res { noteId: String } | { error: AUTH_INVALID_SESSION | FIREBASE_DATABASE_ERROR }
 */
async function updateNote(req,res) {
  const noteObject = req.body;
  const toTagferId = req.params.tagferId;
  const sessionId = utils.getSessionIdFromAuthHeader(req, res);

  try {
    const fromTagferId = (await authDao.getSession(sessionId)).tagferId;
    const noteId = await notesDao.updateNote(fromTagferId, toTagferId, noteObject);
    res.json({ noteId });
  } catch (error) {
    res.json({ error });
  }
}

/**
 * Deletes an existing note.
 * 
 * @param req { noteId: String }
 * @param res {} | { error: AUTH_INVALID_SESSION | FIREBASE_DATABASE_ERROR }
 */
async function deleteNote(req,res) {
  const { noteId } = req.body;
  const toTagferId = req.params.tagferId;
  const sessionId = utils.getSessionIdFromAuthHeader(req, res);

  try {
    const fromTagferId = (await authDao.getSession(sessionId)).tagferId;
    await notesDao.deleteNote(fromTagferId, toTagferId, noteId);
    res.json({});
  } catch (error) {
    res.json({ error });
  }
}

/**
 * Gets all notes between two users.
 * 
 * @param req {}
 * @param res [{ noteId: String, updatedAt: Number, content: String }] | { error: AUTH_INVALID_SESSION | FIREBASE_DATABASE_ERROR }
 */
async function getAllNotes(req,res) {
  const toTagferId = req.params.tagferId;
  const sessionId = utils.getSessionIdFromAuthHeader(req, res);

  try {
    const fromTagferId = (await authDao.getSession(sessionId)).tagferId;
    const allNotes = await notesDao.getAllNotes(fromTagferId, toTagferId);
    res.json({ notes: allNotes });
  } catch (error) {
    res.json({ error });
  }
}

module.exports = {
  createNote,
  updateNote,
  deleteNote,
  getAllNotes
};
