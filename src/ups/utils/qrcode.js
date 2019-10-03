const QRCode = require('qrcode');

const options = {
  margin: 1,
  width: 300
};

/**
 * Encodes a pieace of text returning a promise containg base64 bytes of a png image
 * @param {String} text Text to encode
 * @returns {Promise<String>} 
 */
function createQRCode(text) {
  return QRCode.toDataURL(text, options).then(data => data.slice(22));
}

module.exports = {
  createQRCode
};