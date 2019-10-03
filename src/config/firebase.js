const admin = require('firebase-admin');
const firebase = require('firebase');

const appConfig = require('./app.json');

admin.initializeApp({
  credential: admin.credential.cert(appConfig.keys.firebaseAdmin),
  databaseURL: appConfig.keys.firebase.databaseURL
});

firebase.initializeApp(appConfig.keys.firebase);