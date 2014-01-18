define(['backbone', 'vendor/backbone-indexeddb', 'Logger'], function (Backbone, idxdb, logger) {

  "use strict";

  Backbone.sync = idxdb.sync;

  /**
   * Database configuration object. The structure differs slightly from
   * indexeddb-backbonejs-adapter: the schema creation function is exposed
   * to make it reusable outside: this enables sharing the database between backbone
   * and indexeddb-api based code.
   */
  var dbConfig = {
    id: 'dictaphone',
    migrations: [{
      version: 1,
      migrate: function (transaction, next) {
        logger.log("indexedDB.migrate", transaction);
        dbConfig.createSchema(transaction.db);
        next();
      }
    }],
    createSchema: function(db) {
      db.createObjectStore('clip');
      db.createObjectStore('sample', { keyPath: ['clipid', 'offset'] });
    }
  };
  return dbConfig;
});