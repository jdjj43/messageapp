const crypto = require('crypto');

const getSaltHash = (password) => {
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');

  return { salt, hash };
};

const checkPassword = (password, salt, hash) => {
  const checkHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');

  return checkHash === hash;
}

module.exports = { getSaltHash, checkPassword };