define(['Logger', 'model/dbconfig'],
  function(logger, dbconfig) {

    "use strict";

    var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB;
    var IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction;
    var IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange;
    var IDBCursor = window.IDBCursor || window.webkitIDBCursor;

    var samples = {
      /**
       *
       * @param options
       * success: a callback to invoke upon successful database initialization
       * error: a callback to invoke for any database related error
       */
      init : function (options) {
        // Open the database
        var request = indexedDB.open(dbconfig.id, dbconfig.migrations[0].version);

        request.addEventListener('error', options.error || logger.error);

        request.addEventListener('success', function(event) {
          samples.db = request.result;
          if (options.success) {
            options.success();
          }
        });

        request.addEventListener('upgradeneeded', function(event) {
          // Create the database schema
          var db = samples.db = event.target.result;
          dbconfig.createSchema(db);
        });
      },

      sampleStoreTransaction: function(mode) {
        var transaction = samples.db.transaction(['sample'], mode);
        return transaction.objectStore('sample');
      },
      clipStoreTransaction: function(mode) {
        var transaction = samples.db.transaction(['clip'], mode);
        return transaction.objectStore('clip');
      },
      /**
       * Writes an array of samples
       * @param array
       */
      createSamples: function(array) {
        var store = this.sampleStoreTransaction('readwrite');
        for (var i = 0, len = array.length; i < len; i++) {
          store.add(array[i]);
        }
      },
      /**
       * Reads several samples using a cursor
       * @param options
       * success: { function({IDBCursor}) } a callback to invoke for each sample read
       * clipid: {number} the id of the clip to read
       * from: {number} where to start in the clip
       * to: {number} where to start in the clip
       */
      readSamples: function(options) {
        //console.log('readSamples', options);
        var clipid = +options.clipid;
        var transaction = samples.db.transaction(['sample'], 'readonly');
        var store = transaction.objectStore('sample');
        var boundKeyRange = IDBKeyRange.bound([clipid, options.from || 0], [clipid, options.to || Number.MAX_VALUE]);
        var req = store.openCursor(boundKeyRange);
        req.onsuccess = function(event) {
          options.success(event.target.result);
        };
        return transaction;
      },
      /**
       * Reads a single samples
       * @param options
       * success: { function({Object}) } a callback to invoke for each sample read
       * clipid: {number} the id of the clip to read
       * offset: {number} where to start in the clip
       */
      readSample: function(options) {
        var clipid = +options.clipid;
        var store = this.sampleStoreTransaction('readonly');
        var req = store.get([clipid, options.offset || 0]);
        req.onsuccess = function(event) {
          options.success(event.target.result);
        };
      },
      /**
       * Delete the specified samples from a clip
       * @param options
       * success: { function(count) } a callback to invoke once deletion is complete. Receives the number
       * of samples actually deleted.
       * error: { function() } a callback to invoke upon error
       * clipid: {number} the id of the clip to read
       * from: {number} where to start in the clip
       * to: {number} where to start in the clip
       */
      deleteSamples: function(options) {
        var clipid = +options.clipid;
        var store = this.sampleStoreTransaction('readwrite');
        var boundKeyRange = IDBKeyRange.bound([clipid, options.from || 0], [clipid, options.to || Number.MAX_VALUE]);
        var req = store.openCursor(boundKeyRange);
        var count = 0;
        req.onsuccess = function(event) {
          var cursor = event.target.result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
            count++;
          } else if (typeof options.success === 'function') {
            options.success(count);
          }
        };
        if (typeof options.error === 'function') {
          req.onerror = options.error;
        }
      },
      getCounts: function getCounts(callback) {
        var status = {};
        this.clipStoreTransaction('readonly').count().onsuccess = function countClips(evt) {
          status.clipCount = evt.target.result;
          this.sampleStoreTransaction('readonly').count().onsuccess = function countSamples(evt) {
            status.sampleCount = evt.target.result;
            logger.log('getCount', status);
            if (typeof callback === 'function') {
              callback(status);
            }
          };
        }.bind(this);
      }
    };
    return samples;
  }
);