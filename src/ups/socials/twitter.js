const request = require('request');
const querystring = require('querystring');

const appConfig =  require('../../config/app.json');
const utils =  require('../utils/utils');
const errors =  require('../../config/errors');
const http =  require('../../config/http');

/**
 * Calls api.twiter.com/oauth/request_token
 * 
 * @param {Function} Takes an object that either contains {`token`} or {`error`}
 */
function getOAuthToken(callback) {
  const twitter = appConfig.keys.twitter;
  const twitterRequest = twitter.endpoints.request_token;
  twitterRequest.headers = utils.createOAuthHeader(twitterRequest, twitter);

  request(twitterRequest, (twitterError, twitterResponse, twitterBody) => {
    if (!twitterError && twitterResponse.statusCode === http.OK) {
      const tokens = querystring.parse(twitterBody);
      callback({ token: tokens.oauth_token });
    } else {
      callback({ error: errors.AUTH_TWITTER_REQUEST_TOKEN_FAILURE });
    }
  });
}

/**
 * Callback excecuted by the Twitter API.
 * @param {Object} query { oauth_token: String, oauth_verifier: String } | { denied: String }
 * @param {Function} callback non-void callback that accepts a parameter of the HTML string.
 */
function getUsername(query, callback) {
  const twitter = appConfig.keys.twitter;
  const { oauth_token, oauth_verifier, denied } = query;
  
  if (denied) {
    callback(passingHTML(JSON.stringify({})));
    return;
  }

  request({
    url: `${twitter.endpoints.access_token.url}?oauth_token=${oauth_token}&oauth_verifier=${oauth_verifier}`,
    method: twitter.endpoints.access_token.method
  }, (twitterError, twitterResponse, twitterBody) => {
    let result = {};

    if(!twitterError && twitterResponse.statusCode === http.OK ){
      const { screen_name } = querystring.parse(twitterBody);
      result = { username: screen_name };
    }

    callback(passingHTML(JSON.stringify(result)));
  });
}

/**
 * Raw HTML passes the result using Window.postMessage from the WebView(DOM) back to ReactNative
 */
const passingHTML = (result) => `
<!DOCTYPE HTML>
<html>
<body>
<script>
  function waitForBridge() {
    if(window.postMessage.length !== 1){
      setTimeout(waitForBridge, 200);
    }
    else {
      window.postMessage('${result}');
    }
  }

  window.onload = waitForBridge;
</script>
</body>
</html>
`;

module.exports = {
  getOAuthToken,
  getUsername
};