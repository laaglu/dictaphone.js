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

/* global window, RSVP */

var dbconfig = require('./dbconfig');
var logger = require('Logger');

var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB;
var IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange;
//var IDBCursor = window.IDBCursor || window.webkitIDBCursor;
//var IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction;

var samples = {
  /**
   * Init function, as a Promise
   */
  init : function init() {
    return new RSVP.Promise(function(resolve, reject) {
      // Open the database
      var request = indexedDB.open(dbconfig.id, dbconfig.migrations[0].version);

      request.addEventListener('error', reject);

      request.addEventListener('success', function(/*event*/) {
        samples.db = request.result;
        resolve();
      });

      request.addEventListener('upgradeneeded', function(event) {
        // Create the database schema
        var db = samples.db = event.target.result;
        dbconfig.createSchema(db);
      });
    });
  },

  sampleStoreTransaction: function sampleStoreTransaction(mode) {
    var transaction = samples.db.transaction(['sample'], mode);
    return transaction.objectStore('sample');
  },
  clipStoreTransaction: function clipStoreTransaction(mode) {
    var transaction = samples.db.transaction(['clip'], mode);
    return transaction.objectStore('clip');
  },
  /**
   * Writes an array of samples
   * @param array
   */
  createSamples: function createSamples(array) {
    var store = this.sampleStoreTransaction('readwrite');
    for (var i = 0, len = array.length; i < len; i++) {
      store.add(array[i]);
    }
  },
  /**
   * Reads several samples using a cursor
   * NB: this function cannot be turned into a Promise because
   * it repeatedly invokes the callback when the cursor continues,
   * whereas Promises settle only once.
   * @param options
   * success: { function({IDBCursor}) } a callback to invoke for each sample read
   * clipid: {number} the id of the clip to read
   * from: {number} where to start in the clip
   * to: {number} where to start in the clip
   */
  readSamples: function readSamples(options) {
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
   * Returns a Promise to delete the specified samples from a clip.
   * It resolves to the number of samples actually deleted
   * @param options
   * clipid: {number} the id of the clip to read
   * from: {number} where to start in the clip
   * to: {number} where to start in the clip
   */
  deleteSamples: function deleteSamples(options) {
    logger.log('deleteSamples', options);
    return new RSVP.Promise(function(resolve, reject) {
      var clipid = +options.clipid;
      var store = samples.sampleStoreTransaction('readwrite');
      var boundKeyRange = IDBKeyRange.bound([clipid, options.from || 0], [clipid, options.to || Number.MAX_VALUE]);
      var req = store.openCursor(boundKeyRange);
      var count = 0;
      req.onsuccess = function(event) {
        var cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
          count++;
        } else {
          resolve(count);
        }
      };
      req.onerror = function(err) {
        reject(err);
      };
    });
  },
  /**
   * Returns an object of the form { clipCount: <int>, sampleCount: <int> } as a Promise
   */
  getCounts: function getCounts() {
    return new RSVP.Promise(function(resolve, reject) {
        var status = {};
        var countReq = samples.clipStoreTransaction('readonly').count();
        countReq.onsuccess = function count(evt) {
          status.clipCount = evt.target.result;
          resolve(status);        
        };
        countReq.onerror = function(err) {
          reject(err);
        };
      })
    .then(function(status) {
      return new RSVP.Promise(function(resolve, reject) {
        var countReq = samples.sampleStoreTransaction('readonly').count();
        countReq.onsuccess = function count(evt) {
          status.sampleCount = evt.target.result;
          logger.log('getCount', status);
          resolve(status);        
        };
        countReq.onerror = function(err) {
          reject(err);
        };
      });
    });
  },
  exportSamples: function exportSamples(filename) {
    return new Promise(function(resolve, reject) {
      var fileReq = samples.db.mozCreateFileHandle(filename, 'audio/wav');
      fileReq.onerror = reject;
      fileReq.onsuccess = function mozCreateFileHandleSuccess() {
        resolve(fileReq.result);
      };
    }); 
  }
};
module.exports = samples;
