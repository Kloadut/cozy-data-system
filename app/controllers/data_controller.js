// Generated by CoffeeScript 1.6.3
var Client, RealtimeAdapter, checkDocType, client, db, git, realtime, updatePermissions;

load('application');

git = require('git-rev');

Client = require("request-json").JsonClient;

RealtimeAdapter = require('cozy-realtime-adapter');

checkDocType = require('./lib/token').checkDocType;

updatePermissions = require('./lib/token').updatePermissions;

if (process.env.NODE_ENV === "test") {
  client = new Client("http://localhost:9092/");
} else {
  client = new Client("http://localhost:9102/");
}

db = require('./helpers/db_connect_helper').db_connect();

realtime = RealtimeAdapter(compound, ['notification.*']);

before('lock request', function() {
  var _this = this;
  this.lock = "" + params.id;
  return app.locker.runIfUnlock(this.lock, function() {
    app.locker.addLock(_this.lock);
    return next();
  });
}, {
  only: ['update', 'upsert', 'delete', 'merge']
});

after('unlock request', function() {
  return app.locker.removeLock(this.lock);
}, {
  only: ['update', 'upsert', 'delete', 'merge']
});

before('get doc', function() {
  var _this = this;
  return db.get(params.id, function(err, doc) {
    if (err && err.error === "not_found") {
      app.locker.removeLock(_this.lock);
      return send({
        error: "not found"
      }, 404);
    } else if (err) {
      console.log("[Get doc] err: " + JSON.stringify(err));
      app.locker.removeLock(_this.lock);
      return send({
        error: err
      }, 500);
    } else if (doc != null) {
      _this.doc = doc;
      return next();
    } else {
      app.locker.removeLock(_this.lock);
      return send({
        error: "not found"
      }, 404);
    }
  });
}, {
  only: ['find', 'update', 'delete', 'merge']
});

before('permissions_param', function() {
  var auth,
    _this = this;
  auth = req.header('authorization');
  return checkDocType(auth, body.docType, function(err, appName, isAuthorized) {
    if (!appName) {
      err = new Error("Application is not authenticated");
      return send({
        error: err.message
      }, 401);
    } else if (!isAuthorized) {
      err = new Error("Application is not authorized");
      return send({
        error: err.message
      }, 403);
    } else {
      compound.app.feed.publish('usage.application', appName);
      return next();
    }
  });
}, {
  only: ['create', 'update', 'merge', 'upsert']
});

before('permissions', function() {
  var auth,
    _this = this;
  auth = req.header('authorization');
  return checkDocType(auth, this.doc.docType, function(err, appName, isAuthorized) {
    if (!appName) {
      err = new Error("Application is not authenticated");
      return send({
        error: err.message
      }, 401);
    } else if (!isAuthorized) {
      err = new Error("Application is not authorized");
      return send({
        error: err.message
      }, 403);
    } else {
      compound.app.feed.publish('usage.application', appName);
      return next();
    }
  });
}, {
  only: ['find', 'delete', 'merge']
});

action("index", function() {
  var sendVersion;
  sendVersion = function(commit, branch, tag) {
    return send("<strong>Cozy Data System</strong><br />\nrevision: " + commit + "  <br />\ntag: " + tag + " <br />\nbranch: " + branch + " <br />", 200);
  };
  return git.long(function(commit) {
    return git.branch(function(branch) {
      return git.tag(function(tag) {
        return sendVersion(commit, branch, tag);
      });
    });
  });
});

action('exist', function() {
  return db.head(params.id, function(err, res, status) {
    if (status === 200) {
      return send({
        "exist": true
      });
    } else if (status === 404) {
      return send({
        "exist": false
      });
    } else {
      return send(500, {
        error: JSON.stringify(err)
      });
    }
  });
});

action('find', function() {
  delete this.doc._rev;
  return send(this.doc);
});

action('create', function() {
  delete body._attachments;
  if ((body.docType != null) && body.docType.toLowerCase() === "application") {
    updatePermissions(body);
  }
  if (params.id) {
    return db.get(params.id, function(err, doc) {
      if (doc) {
        return send({
          error: "The document exists"
        }, 409);
      } else {
        return db.save(params.id, body, function(err, res) {
          if (err) {
            return send({
              error: err.message
            }, 409);
          } else {
            return send({
              "_id": res.id
            }, 201);
          }
        });
      }
    });
  } else {
    return db.save(body, function(err, res) {
      if (err) {
        railway.logger.write("[Create] err: " + JSON.stringify(err));
        return send({
          error: err.message
        }, 500);
      } else {
        return send({
          "_id": res.id
        }, 201);
      }
    });
  }
});

action('update', function() {
  delete body._attachments;
  if ((body.docType != null) && body.docType.toLowerCase() === "application") {
    updatePermissions(body);
  }
  return db.save(params.id, body, function(err, res) {
    if (err) {
      console.log("[Update] err: " + JSON.stringify(err));
      return send({
        error: err.message
      }, 500);
    } else {
      return send({
        success: true
      }, 200);
    }
  });
});

action('upsert', function() {
  return db.get(params.id, function(err, doc) {
    delete body._attachments;
    return db.save(params.id, body, function(err, res) {
      if (err) {
        console.log("[Upsert] err: " + JSON.stringify(err));
        return send({
          error: err.message
        }, 500);
      } else if (doc) {
        return send({
          success: true
        }, 200);
      } else {
        return send({
          "_id": res.id
        }, 201);
      }
    });
  });
});

action('delete', function() {
  var _this = this;
  return db.remove(params.id, this.doc.rev, function(err, res) {
    var doctype, _ref;
    if (err) {
      console.log("[Delete] err: " + JSON.stringify(err));
      return send({
        error: err.message
      }, 500);
    } else {
      doctype = (_ref = _this.doc.docType) != null ? _ref.toLowerCase() : void 0;
      if (doctype == null) {
        doctype = 'null';
      }
      return client.del("index/" + params.id + "/", function(err, res, resbody) {
        return send({
          success: true
        }, 204);
      });
    }
  });
});

action('merge', function() {
  delete body._attachments;
  return db.merge(params.id, body, function(err, res) {
    if (err) {
      console.log("[Merge] err: " + JSON.stringify(err));
      return send({
        error: err.message
      }, 500);
    } else {
      return send({
        success: true
      }, 200);
    }
  });
});
