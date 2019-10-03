const Twilio = require('twilio');

const appConfig = require('./app.json');

const authToken  = appConfig.keys.twilio.authToken;
const accountSid = appConfig.keys.twilio.accountSid;
const tagferPhone = appConfig.keys.twilio.phoneNumber;
var client;

function sendSMSTo(clientPhone, message, callback = () => {}) {
  const sms = {
    from: tagferPhone,
    body: message,
    to: clientPhone
  };

  getClient().messages.create(sms).then(() => {
    callback({result: true});
  }).catch(error => {
    callback({error: error.message});
  }).done();
}

function getClient() {
  if (!client) {
    client = new Twilio(accountSid, authToken);
  }

  return client;
}

module.exports = {
  sendSMSTo
};