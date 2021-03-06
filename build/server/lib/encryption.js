// Generated by CoffeeScript 1.7.1
var CryptoTools, cryptoTools, db, fs, masterKey, randomString, slaveKey, updateKeys;

fs = require('fs');

db = require('../helpers/db_connect_helper').db_connect();

CryptoTools = require('./crypto_tools');

randomString = require('./random').randomString;

cryptoTools = new CryptoTools();

masterKey = null;

slaveKey = null;

updateKeys = function(oldKey, password, encryptedslaveKey, callback) {
  var data, encryptedSlaveKey, salt;
  salt = cryptoTools.genSalt(32 - password.length);
  masterKey = cryptoTools.genHashWithSalt(password, salt);
  encryptedSlaveKey = cryptoTools.encrypt(masterKey, slaveKey);
  data = {
    slaveKey: encryptedSlaveKey,
    salt: salt
  };
  return callback(data);
};

exports.encrypt = function(password) {
  var err, newPwd;
  if ((password != null) && process.env.NODE_ENV !== "development") {
    if ((masterKey != null) && (slaveKey != null)) {
      newPwd = cryptoTools.encrypt(slaveKey, password);
      return newPwd;
    } else {
      err = "master key and slave key don't exist";
      console.log("[encrypt]: " + err);
      throw new Error(err);
    }
  } else {
    return password;
  }
};

exports.get = function() {
  return masterKey;
};

exports.decrypt = function(password) {
  var err, newPwd;
  if ((password != null) && process.env.NODE_ENV !== "development") {
    if ((masterKey != null) && (slaveKey != null)) {
      newPwd = password;
      try {
        newPwd = cryptoTools.decrypt(slaveKey, password);
      } catch (_error) {}
      return newPwd;
    } else {
      err = "master key and slave key don't exist";
      console.log("[decrypt]: " + err);
      throw new Error(err);
    }
  } else {
    return password;
  }
};

exports.init = function(password, user, callback) {
  var data, encryptedSlaveKey, salt;
  salt = cryptoTools.genSalt(32 - password.length);
  masterKey = cryptoTools.genHashWithSalt(password, salt);
  slaveKey = randomString();
  encryptedSlaveKey = cryptoTools.encrypt(masterKey, slaveKey);
  data = {
    salt: salt,
    slaveKey: encryptedSlaveKey
  };
  return db.merge(user._id, data, (function(_this) {
    return function(err, res) {
      if (err) {
        console.log("[initializeKeys] err: " + err);
        return callback(err);
      } else {
        return callback(null);
      }
    };
  })(this));
};

exports.logIn = function(password, user, callback) {
  var encryptedSlaveKey;
  masterKey = cryptoTools.genHashWithSalt(password, user.salt);
  encryptedSlaveKey = user.slaveKey;
  slaveKey = cryptoTools.decrypt(masterKey, encryptedSlaveKey);
  return callback();
};

exports.update = function(password, user, callback) {
  var err;
  if ((masterKey != null) && (slaveKey != null)) {
    if (masterKey.length !== 32) {
      err = "password to initialize keys is different than user password";
      console.log("[update] : " + err);
      return callback(err);
    } else {
      return updateKeys(masterKey, password, slaveKey, (function(_this) {
        return function(data) {
          return db.merge(user._id, data, function(err, res) {
            if (err) {
              console.log("[update] : " + err);
              return callback(err);
            } else {
              return callback(null);
            }
          });
        };
      })(this));
    }
  } else {
    err = "masterKey and slaveKey don't exist";
    console.log("[update] : " + err);
    return callback(400);
  }
};

exports.reset = function(user, callback) {
  var data;
  data = {
    slaveKey: null,
    salt: null
  };
  return db.merge(user._id, data, (function(_this) {
    return function(err, res) {
      if (err) {
        return callback("[resetKeys] err: " + err);
      } else {
        return callback();
      }
    };
  })(this));
};

exports.isLog = function() {
  return (slaveKey != null) && (masterKey != null);
};
