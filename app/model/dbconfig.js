/**********************************************
 * Copyright (C) 2014 Lukas Laag
 * This file is part of dictaphone.js.
 * 
 * dictaphone.js is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * dictaphone.js is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with dictaphone.js.  If not, see http://www.gnu.org/licenses/
 **********************************************/

'use strict';

var logger = require('Logger');

function createSchema(db) {
  db.createObjectStore('clip');
  db.createObjectStore('sample', { keyPath: ['clipid', 'offset'] });
}

/**
 * Database configuration object. The structure differs slightly from
 * indexeddb-backbonejs-adapter: the schema creation function is exposed
 * to make it reusable outside: this enables sharing the database between backbone
 * and indexeddb-api based code.
 */
module.exports = {
  id: 'dictaphone',
  migrations: [{
    version: 1,
    migrate: function (transaction, next) {
      logger.log("indexedDB.migrate", transaction);
      createSchema(transaction.db);
      next();
    }
  }],
  createSchema: createSchema
};
