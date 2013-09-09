var level = require('level'),
    through = require('through'),
    sublevel = require('level-sublevel');

module.exports = Models;

/**
 * Model
 */

function Models(container, name, key) {
  this.name = name;
  this.key = key;
  this.container = container;
  this.db = sublevel(container.db || container);
  this[this.name] = this.db.sublevel(name);
}

Models.prototype.all = function(cb) {
  var models = [];
  this[this.name].createReadStream().pipe(through(write, end));
  function write(model) {
    models.push(model.value);
  }
  function end() {
    cb(null, models);
  }
};

Models.prototype.save = function(model, cb) {
  var key = this.getKey(model);
  this[this.name].put(key, model, function (err) {
    if (err) return cb(err);
    cb(null, key);
  });
};

Models.prototype.get = function(key, cb) {
  this[this.name].get(key, function (err, data) {
    if (err) return cb(err);
    cb(null, data);
  });
};

Models.prototype.del = function(key, cb) {
  this[this.name].del(key, cb);
};

Models.prototype.getKey = function(model) {
  if (typeof model[this.key] === 'undefined' && this.keyfn) {
    var key = this.keyfn(model);
    model[this.key] = key;
    return key;
  } else if (Array.isArray(this.key)) {
    return this.key.map(function (prop) {
      return model[prop];
    });
  } else {
    return model[this.key];
  }
};

Models.prototype.createReadStream = function(options) {
  options = options || { };
  if (typeof options.keys === 'undefined') options.keys = false;
  return this[this.name].createReadStream(options);
};
