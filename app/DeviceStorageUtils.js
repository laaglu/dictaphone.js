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

/* global navigator */

module.exports = {
  /**
   * List files in a directory
   * @param options
   * storage: device storage name (music, images...)
   * path: path for the enumerate call
   * options: path for the options call
   * success: a success callback(File[])
   * error: error callback(Error)
   */
  ls : function ls(options) {
    var files = {},
      storage = navigator.getDeviceStorage(options.storage),
      enumReq = storage.enumerate(options.path, options.options);
    enumReq.onsuccess = function onsuccess() {
      var file = this.result, path, name;
      if (file) {
        path = file.name;
        name = path.substring( 1 + path.lastIndexOf('/'));
        files[name] = file;
        enumReq.continue();
      } else if (typeof options.success === 'function') {
        options.success(files);
      }
    };
    enumReq.onerror = options.error;
  },
  /**
   * Returns a name derived from the supplied name and which
   * is guaranteed not to be in names. The derived name has
   * the form: <basename>-<incr>[.ext]
   * @param {string} name The to test for unicity.
   * @param {Object} names A hash of names
   * @returns {string}
   */
  uniqueName : function uniqueName(name, names) {
    var index = name.lastIndexOf('.'),
      extension = index !== -1 ? name.substring(1 + index) : null,
      baseName = index !== -1 ? name.substring(0, index) : name,
      uniqueName_ = name,
      count = 0,
      parts;
    while(uniqueName_ in names) {
      parts = [baseName, '-', count++];
      if (extension) {
        parts.push('.', extension);
      }
      uniqueName_ = parts.join('');
    }
    return uniqueName_;
  },

  /**
   * Returns true if a file exists, false otherwise
   * @param options
   * storage: device storage name (music, images...)
   * options: path for the options call
   * callback: a success callback(boolean)
   */
  exists: function exists(options) {
    var storage, getReq;
    storage = navigator.getDeviceStorage(options.storage);
    getReq = storage.get(options.path);
    getReq.onsuccess = function onsuccess() {
      if (typeof options.callback === 'function') {
        options.callback(this.result != null);
      }
    };
    getReq.onerror = function() {
      if (typeof options.callback === 'function') {
        options.callback(false);
      }
    };
  }
};

