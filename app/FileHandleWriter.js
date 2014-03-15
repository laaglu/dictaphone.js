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

/* global document, navigator*/

var DeviceStorageUtils = require('./DeviceStorageUtils');
var samples = require('model/Samples');
var logger = require('Logger');

function FileHandleWriter(exporter) {
  this.exporter = exporter;
}
/**
 * The exporter object
 * @type {Exporter}
 */
FileHandleWriter.prototype.exporter = null;
/**
 * @type {FileHandle} The FileHandle used for writing
 */
FileHandleWriter.prototype.fileHandle = null;
/**
 * @type {LockedFile} The LockedFile used for writing
 */
FileHandleWriter.prototype.lockedFile = null;

/**
 * Returns a default name for the exported clip
 */
FileHandleWriter.prototype.defaultExportName = function defaultExportName(options) {
  var computeName = function(files) {
    var exportName = DeviceStorageUtils.uniqueName(this.exporter.clip.get('name') + '.wav', files);
    if (typeof(options.success) === 'function') {
      options.success(exportName);
    }
  }.bind(this);

  DeviceStorageUtils.exists({
    storage:'music',
    path:'dictaphone',
    callback: function(b) {
      if (b) {
        DeviceStorageUtils.ls({
            storage:'music',
            path:'dictaphone',
            success: computeName,
            error: options.error || logger.error
          }
        );
      } else {
        computeName({});
      }
    }.bind(this)
  });
};

/**
 * Prepares the writer for writing
 * success: callback if the write operation succeeds
 * error: callback if the write operation fails
 * @param options
 */
FileHandleWriter.prototype.initialize = function initialize(options) {
  var getLockedFile = function getLockedFile(fileHandle) {
      this.fileHandle = fileHandle;
      this.lockedFile = fileHandle.open('readwrite');
      if (typeof options.success === 'function') {
        options.success();
      }
    }.bind(this),
    getFileHandle = function getFileHandle() {
      samples.exportSamples({
        name: this.exporter.fileName,
        success:getLockedFile,
        error: options.error
      });
    }.bind(this);
  DeviceStorageUtils.exists({
      storage:'music',
      path:'dictaphone' + '/' + this.exporter.fileName,
      callback: function(exists) {
        if (!exists || confirm(document.webL10n.get('overwwrite', {fileName: this.exporter.fileName}))) {
          getFileHandle();
        }
      }.bind(this)
    }
  );
};

/**
 * Writes a buffer of data into the wav file
 * @param options
 * success: callback if the write operation succeeds
 * error: callback if the write operation fails
 * data: {ArrayBuffer} a buffer containing the data to write
 * updateSize: {boolean} true to update the number of processed bytes
 */
FileHandleWriter.prototype.writeData = function writeData(options) {
  var lastLoaded, appendReq;

  lastLoaded = 0;
  appendReq = this.lockedFile.append(options.data);
  appendReq.onsuccess = function() {
    var flushReq;
    flushReq = this.lockedFile.flush();
    flushReq.onsuccess = options.success;
    flushReq.onerror = options.error;
  }.bind(this);
  appendReq.onerror = options.error;
  appendReq.onprogress = function(status) {
    if (options.updateSize) {
      this.exporter.processedSize += (status.loaded - lastLoaded) / 4;
    }
    lastLoaded = status.loaded;
  }.bind(this);
};

FileHandleWriter.prototype.finalize = function finalize(options) {
  var getFileReq;

  getFileReq = this.fileHandle.getFile();
  getFileReq.onerror = options.error || console.error;
  getFileReq.onsuccess = function () {
    var storage, addNamedReq;
    storage = navigator.getDeviceStorage('music');
    addNamedReq = storage.addNamed(getFileReq.result, 'dictaphone/' + this.exporter.fileName);
    addNamedReq.onerror = options.error || console.error;
    addNamedReq.onsuccess = options.success;
  }.bind(this);
};

module.exports = FileHandleWriter;