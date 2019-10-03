const Loki = require('lokijs');

const appConfig = require('./app.json');

const loki = new Loki('store.json', { autosave: true, autoload: true, autoloadCallback: lokiInit });

/**
 * Initializes the collections in our local loki
 */
function lokiInit() {
  let sessions = loki.getCollection('sessions');
  let verifications = loki.getCollection('verifications');

  if (sessions == null) {
    sessions = loki.addCollection('sessions', { unique: ['id'] });
  }

  if(verifications == null) {
    verifications = loki.addCollection('verifications', {
      unique: ['phoneNumber'], 
      ttl: appConfig.loki.verificationTTL,
      ttlInterval: appConfig.loki.verificationTTLClear
    });
  }
}

module.exports = loki;