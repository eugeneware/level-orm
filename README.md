# level-orm

Simple ORM built on leveldb/levelup.

[![build status](https://secure.travis-ci.org/eugeneware/level-orm.png)](http://travis-ci.org/eugeneware/level-orm)

# Installation

This module is installed via npm:

``` bash
$ npm install level-orm
```

## Usage

### Basic usage examples

``` js
var level = require('level');
var db = level('/tmp/db', { valueEncoding: 'json' });
var Model = require('level-orm');
function Users(db) {
  // users is the sublevel name to user
  // handle is the primary key to user for insertion
  Models.call(this, { db: db }, 'users', 'handle');
}
util.inherits(Users, Models);

var users = new Users(db);

// save to database
users.save({ handle: 'eugeneware', name: 'Eugene', email: 'eugene@noblesamurai.com' },
  function (err, id) {
    // id will be the primary key 
  });

// retrieve from database
users.get('eugeneware', function (err, user) { });

// delete from database
users.del('eugeneware');

// stream from database
users.createReadStream({start: 'a', end: 'c'}).pipe(...);
```

### Compound Keys

If you use [bytewise](https://github.com/deanlandolt/bytewise) you can have
compound keys, like so:

``` js
var level = require('level');
var bytewise = require('bytewise/hex');
var db = level('/tmp/db', { keyEncoding: bytewise, valueEncoding: 'json' });
var Model = require('level-orm');

function Feed(db) {
  // compound key of 'user' and 'id'
  Models.call(this, { db: db }, 'feed', ['user', 'id']);
}
util.inherits(Feed, Models);

var feed = new Feed(db);
feed.save({ user: 'eugeneware', id: 123, message: 'Test' }, cb);
```

### Auto Incremented Keys

Implement the `keyfn` function on the extended model to automatically generate
keys when none is found in the model to be saved:

``` js
var level = require('level');
var bytewise = require('bytewise/hex');
// we're just going to use a unique timestamp for our keys
var timestamp = require('monotonic-timestamp');
var db = level('/tmp/db', { keyEncoding: bytewise, valueEncoding: 'json' });
function Messages(db) {
  Models.call(this, { db: db }, 'messages', 'id');
}
util.inherits(Messages, Models);
// set the function to generate ids
Messages.prototype.keyfn = timestamp;

var messages = new Messages(db);
messages.save({ message: 'My message' }, function (err, id) {
  // id will contain the auto-generated ID
});
```

## License

### Copyright (c) 2013, Eugene Ware
#### All rights reserved.
  
Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:  
1. Redistributions of source code must retain the above copyright
   notice, this list of conditions and the following disclaimer.  
2. Redistributions in binary form must reproduce the above copyright
   notice, this list of conditions and the following disclaimer in the
   documentation and/or other materials provided with the distribution.  
3. Neither the name of Deoxxa Development nor the names of its contributors
   may be used to endorse or promote products derived from this software
   without specific prior written permission.  
  
THIS SOFTWARE IS PROVIDED BY EUGENE WARE ''AS IS'' AND ANY
EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL DEOXXA DEVELOPMENT BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
