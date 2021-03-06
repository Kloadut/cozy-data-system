// Generated by CoffeeScript 1.7.1
var client, db, feed;

feed = require('../lib/feed');

client = require('../lib/indexer');

db = require('../helpers/db_connect_helper').db_connect();

module.exports.index = function(req, res, next) {
  var data;
  req.doc.id = req.doc._id;
  data = {
    doc: req.doc,
    fields: req.body.fields
  };
  return client.post("index/", data, function(err, response, body) {
    if (err || response.statusCode !== 200) {
      return next(new Error(err));
    } else {
      res.send(200, {
        success: true
      });
      return next();
    }
  }, false);
};

module.exports.search = function(req, res, next) {
  var data;
  data = {
    docType: req.params.type,
    query: req.body.query
  };
  return client.post("search/", data, function(err, response, body) {
    if (err) {
      return next(new Error(err));
    } else if (response == null) {
      return next(new Error("Response not found"));
    } else if (response.statusCode !== 200) {
      return res.send(response.statusCode, body);
    } else {
      return db.get(body.ids, function(err, docs) {
        var doc, resDoc, results, _i, _len;
        if (err) {
          return next(new Error(err.error));
        } else {
          results = [];
          for (_i = 0, _len = docs.length; _i < _len; _i++) {
            doc = docs[_i];
            if (doc.doc != null) {
              resDoc = doc.doc;
              resDoc.id = doc.id;
              results.push(resDoc);
            }
          }
          return res.send(200, {
            rows: results
          });
        }
      });
    }
  });
};

module.exports.remove = function(req, res, next) {
  return client.del("index/" + req.params.id + "/", function(err, response, body) {
    if (err != null) {
      return next(new Error(err));
    } else {
      res.send(200, {
        success: true
      });
      return next();
    }
  }, false);
};

module.exports.removeAll = function(req, res, next) {
  return client.del("clear-all/", function(err, response, body) {
    if (err) {
      return next(new Error(err));
    } else {
      return res.send(200, {
        success: true
      });
    }
  }, false);
};
