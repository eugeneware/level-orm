var expect = require('expect.js'),
    util = require('util'),
    rimraf = require('rimraf'),
    level = require('level'),
    path = require('path'),
    bytewise = require('bytewise'),
    sublevel = require('level-sublevel/bytewise'),
    range = require('range').range,
    after = require('after'),
    timestamp = require('monotonic-timestamp'),
    through = require('through'),
    Models = require('..');

describe('level-orm', function() {
  var db, dbPath = path.join(__dirname, '..', 'data', 'testdb');

  beforeEach(function(done) {
    rimraf.sync(dbPath);
    db = level(dbPath, { keyEncoding: bytewise, valueEncoding: 'json' });
    done();
  });

  afterEach(function(done) {
    db.close(done);
  });

  it('should be able to extend the base model', function(done) {

    function Users(db) {
      Models.call(this, { db: db }, 'users', 'handle');
    }
    util.inherits(Users, Models);

    done();
  });

  it('should be able to save and get an object', function(done) {
    function Users(db) {
      Models.call(this, { db: db }, 'users', 'handle');
    }
    util.inherits(Users, Models);

    var users = new Users(db);
    users.save({ handle: 'eugeneware', name: 'Eugene', email: 'eugene@noblesamurai.com' }, get);
    function get(err) {
      if (err) return done(err);
      users.get('eugeneware', function (err, user) {
        if (err) return done(err);
        expect(user.handle).to.equal('eugeneware');
        expect(user.name).to.equal('Eugene');
        expect(user.email).to.equal('eugene@noblesamurai.com');
        done();
      });
    }
  });

  it('should be able to delete an object', function(done) {
    function Users(db) {
      Models.call(this, { db: db }, 'users', 'handle');
    }
    util.inherits(Users, Models);

    var users = new Users(db);
    users.save({ handle: 'eugeneware', name: 'Eugene', email: 'eugene@noblesamurai.com' }, del);
    function del(err) {
      if (err) return done(err);
      users.del('eugeneware', get);
    }
    function get(err) {
      if (err) return done(err);
      users.get('eugeneware', function (err, user) {
        expect(err.name).to.equal('NotFoundError');
        done();
      });
    }
  });

  it('should be able to get a list of all object', function(done) {
    function Users(db) {
      Models.call(this, { db: db }, 'users', 'handle');
    }
    util.inherits(Users, Models);

    var users = new Users(db);
    var num = 10;
    var next = after(num, list);
    range(0, num).forEach(function (i) {
      users.save({handle: 'handle' + i, name: 'name ' + i}, next);
    });

    function list(err) {
      if (err) return done(err);
      users.all(function (err, _users) {
        if (err) return done(err);
        expect(_users.length).to.equal(num);
        _users.forEach(function (user) {
          expect(user.handle).to.match(/^handle[0-9]+$/);
          expect(user.name).to.match(/^name [0-9]+$/);
        });
        done();
      });
    }
  });

  it('should be able to generate IDs', function(done) {
    function Messages(db) {
      Models.call(this, { db: db }, 'messages', 'id');
    }
    util.inherits(Messages, Models);
    Messages.prototype.keyfn = timestamp;

    var messages = new Messages(db);
    messages.save({ message: 'My message' }, get);

    var _id;
    function get(err, id) {
      if (err) return done(err);
      expect(id).to.be.above(0);
      _id = id;

      messages.get(id, check);
    }

    function check(err, msg) {
      if (err) return done(err);
      expect(msg.id).to.equal(_id);
      expect(msg.message).to.equal('My message');
      done();
    }
  });

  it('should be able to stream values', function(done) {
    function Users(db) {
      Models.call(this, { db: db }, 'users', 'handle');
    }
    util.inherits(Users, Models);

    var users = new Users(db);
    var num = 10;
    var next = after(num, stream);
    range(0, num).forEach(function (i) {
      users.save({handle: 'handle' + i, name: 'name ' + i}, next);
    });

    function stream(err) {
      if (err) return done(err);
      var count = 0;
      users.createReadStream().pipe(through(write, end));
      function write(user) {
        expect(user.handle).to.match(/^handle[0-9]+$/);
        expect(user.name).to.match(/^name [0-9]+$/);
        count++;
      }
      function end() {
        expect(count).to.equal(num);
        done();
      }
    }
  });

  it('should be able to have compound keys', function(done) {
    function Feed(db) {
      Models.call(this, { db: db }, 'feed', ['user', 'id']);
    }
    util.inherits(Feed, Models);

    var feed = new Feed(db);

    var num = 10;
    var users = ['eugeneware', 'rvagg', 'dominictarr'];
    var next = after(num * users.length, stream);
    users.forEach(function (user) {
      range(0, num).forEach(function (i) {
        feed.save({ user: user, id: timestamp(), message: 'Message ' + i}, next); 
      });
    });

    function stream(err) {
      if (err) return done(err);
      feed.createReadStream({start: ['rvagg', -Infinity], end: ['rvagg', Infinity]})
        .pipe(through(write, end));
      var count = 0;
      function write(item) {
        expect(item.user).to.equal('rvagg');
        expect(item.id).to.be.above(0);
        expect(item.message).to.match(/^Message [0-9]+$/);
        count++;
      }
      function end() {
        expect(count).to.equal(num);
        done();
      }
    }
  });
});
