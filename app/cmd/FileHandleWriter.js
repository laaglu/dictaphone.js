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

/* global document, navigator, RSVP, Blob*/

var DeviceStorageUtils = require('./DeviceStorageUtils');
var samples = require('model/Samples');
var logger = require('Logger');

function FileHandleWriter(exportCmd) {
  this.exportCmd = exportCmd;
}
/**
 * The exportCmd object
 * @type {ExportCmd}
 */
FileHandleWriter.prototype.exportCmd = null;
/**
 * @type {FileHandle} The FileHandle used for writing
 */
FileHandleWriter.prototype.fileHandle = null;

/**
 * Returns a default name for the exported clip as a Promise
 */
FileHandleWriter.prototype.defaultExportName = function defaultExportName() {
  var self = this;
  return DeviceStorageUtils.exists({
      storage:'music',
      path:'dictaphone'})
    .then(function(exists) {
      return exists ? DeviceStorageUtils.ls({ storage:'music', path:'dictaphone '}) : {};
    })
    .then(function computeName(files) {
      return DeviceStorageUtils.uniqueName(self.exportCmd.clip.get('name') + '.wav', files);
    });
};

/**
 * Prepares the writer for writing as a Promise
 * Return true if the writer is ready, false to abort
 */
FileHandleWriter.prototype.initialize = function initialize() {
  logger.log('initialize');
  var self = this;
  return DeviceStorageUtils.exists({
      storage:'music',
      path:'dictaphone' + '/' + this.exportCmd.fileName})
    .then(function(exists) {
      if (!exists || confirm(document.webL10n.get('overwwrite', {fileName: self.exportCmd.fileName}))) {
        return samples.exportSamples(self.exportCmd.fileName)
          .then(function(fileHandle) {
            self.fileHandle = fileHandle;
            return true;
          });
      }
      return false;
    });
};

/**
 * Writes a buffer of data into the wav file as a Promise
 * @param options
 * data: {ArrayBuffer} a buffer containing the data to write
 * updateSize: {boolean} true to update the number of processed bytes
 */
FileHandleWriter.prototype.writeData = function writeData(options) {
  var self = this,
    lockedFile = this.fileHandle.open('readwrite');
  return new RSVP.Promise(function(resolve, reject) {
    var lastLoaded, appendReq;
    logger.log('LOCKEDFILE1', lockedFile.active);
    lastLoaded = 0;
    appendReq = lockedFile.append(options.data);
    appendReq.onsuccess = function() {
      var flushReq;
      logger.log('LOCKEDFILE2', lockedFile.active);
      flushReq = lockedFile.flush();
      flushReq.onsuccess = function() {
        logger.log('LOCKEDFILE3', lockedFile.active);
        resolve();
      };
      flushReq.onerror = reject;
    };
    appendReq.onerror = reject;
    appendReq.onprogress = function(status) {
      if (options.updateSize) {
        logger.log('LOADED', status.loaded);
        self.exportCmd.processedSize += (status.loaded - lastLoaded) / 4;
        logger.log('PROCESSED_SIZE', self.exportCmd.processedSize);
      }
      lastLoaded = status.loaded;
    };
  });
};

/**
 * Finalizes the writing as a Promise
 */
FileHandleWriter.prototype.finalize = function finalize() {
  logger.log('-----FINALIZE------');
  var self = this;
  return new RSVP.Promise(function(resolve, reject) {
    var getFileReq;

    getFileReq = self.fileHandle.getFile();
    getFileReq.onerror = reject;
    getFileReq.onsuccess = function() {
      logger.log('getFileReq', getFileReq.result, 'dictaphone/' + self.exportCmd.fileName);
      var storage, addNamedReq;
      storage = navigator.getDeviceStorage('music');
      //addNamedReq = storage.addNamed(getFileReq.result, 'dictaphone/' + self.exportCmd.fileName);
      addNamedReq = storage.addNamed(new Blob([self.exportCmd.createHeader(0, 44100)], { type: 'audio/wav'}), 'dictaphone/' + self.exportCmd.fileName);
      addNamedReq.onerror = function(err) {
        logger.log('ERROR', err);
        reject(err);
      };
      addNamedReq.onsuccess = function() {
        logger.log('SUCCESS ' + this.result);
      };
    };
  });

};

module.exports = FileHandleWriter;