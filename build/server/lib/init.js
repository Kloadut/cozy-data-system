// Generated by CoffeeScript 1.7.1
var db, encryption, errorMsg;

db = require('../helpers/db_connect_helper').db_connect();

encryption = require('./encryption');

errorMsg = "[lib/init] Error, no master/slave keys";

exports.initPassword = function(callback) {
  if (process.env !== 'development') {
    db.view("bankaccess/all", {}, (function(_this) {
      return function(err, res) {
        if (!err) {
          return res.forEach(function(value) {
            var error, password;
            if (value.password != null) {
              try {
                password = encryption.decrypt(value.password);
              } catch (_error) {
                error = _error;
                console.log(errorMsg);
              }
              if (password === value.password) {
                try {
                  password = encryption.encrypt(req.doc.password);
                } catch (_error) {
                  error = _error;
                  console.log(errorMsg);
                }
                value.password = password;
                return db.save(value.id, value, function(err, res, body) {});
              }
            }
          });
        }
      };
    })(this));
  }
  return callback();
};
