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

var Modernizr = require('modernizr.custom.24918');
var samples = require('model/Samples');
var FileHandleWriter = require('./FileHandleWriter');
var TypedArrayWriter = require('./TypedArrayWriter');
var logger = require('Logger');
 
/**
 * An Exporter class to extract the sound samples from IndexedDB and put them
 * in an audio file (currently WAV)
 * @param options
 * clip: {ClipModel} the clip to export
 * batchSize: {number} how many samples IndexedDB objects to process per iteration, defaults to 10.
 * @constructor
 */
function Exporter(options) {
  this.clip = options.clip;
  this.writer = (Modernizr.devicestorage && Modernizr.filehandle) ? new FileHandleWriter(this) : new TypedArrayWriter(this);
  this.bufferSize = +this.clip.get('sampleSize') * ( options.batchSize || 10 );
}

Exporter.createExporter = function createExporter(options) {
  var exporter = new Exporter(options);
  exporter.writer.defaultExportName({
    success: function(fileName) {
      exporter.fileName = fileName;
      if (typeof(options.success) === 'function') {
        options.success(exporter);
      }
    },
    error: options.error
  });
};

/**
 * The sound clip
 * @type {ClipModel}
 */
Exporter.prototype.clip = null;
/**
 * A writer object to persist the exported clip
 * @type {null}
 */
Exporter.prototype.writer = null;
/**
 * The clip size processed so far
 * @type {number}
 */
Exporter.prototype.processedSize = 0;
/**
 * The internal buffer size
 * @type {number}
 */
Exporter.prototype.bufferSize = 0;
/**
 * The clip size processed so far
 * @type {IDBTransaction}
 */
Exporter.prototype.transaction = null;
/**
 * True if export is running, false otherwise
 * @type {boolean}
 */
Exporter.prototype.exporting = false;
/**
 * The file name to use for the export
 * @type {boolean}
 */
Exporter.prototype.fileName = null;

Exporter.prototype.export_ = function export_() {
  var totalSize = +this.clip.get('totalSize'),
    sampleRate = +this.clip.get('sampleRate'),
    samplesBuffer = new ArrayBuffer(4 * this.bufferSize),
    samplesView = new Int16Array(samplesBuffer),
    offset,
    processSamples = function processSamples(cursor) {
      var samples, i, len, bufferL, bufferR, val;

      if (this.transaction) {
        if (cursor) {
          samples = cursor.value;

          // Transform the samples interleaved 16 bits signed ints
          bufferL = samples.bufferL;
          bufferR = samples.bufferR;
          for (i = 0, len = bufferL.length; i < len; i++) {
            val = bufferL[i];
            samplesView[2 * (i + offset)] = val < 0 ? val * 0x8000 : val * 0x7FFF;
            val = bufferR[i];
            samplesView[2 * (i + offset) + 1] = val < 0 ? val * 0x8000 : val * 0x7FFF;
          }
          offset += samples.bufferL.length;
          cursor.continue();
        } else {
          this.transaction = null;
          this.writer.writeData({
            data:offset === this.bufferSize ? samplesBuffer : samplesBuffer.slice(0, 4 * offset),
            updateSize:true,
            success: writeSamples,
            error: logger.error});
        }
      }
    }.bind(this),
    writeSamples = function writeSamples() {
      if (this.processedSize < totalSize) {
        // Not done yet, read next batch of samples
        offset = 0;
        this.transaction = samples.readSamples({
          clipid: this.clip.id,
          success:processSamples,
          from:this.processedSize,
          to:Math.min(totalSize, this.processedSize + this.bufferSize)
        });
      } else {
        // Done, finalize the export
        this.writer.finalize({
          success: finalizeExport,
          error: logger.error
        });
      }
    }.bind(this),
    finalizeExport = function finalizeExport() {
      this.exporting = false;
    }.bind(this),
    writerHeader = function writerHeader() {
      // Reset the internal state
      this.processedSize = 0;
      this.exporting = true;

      this.writer.writeData({
        data : Exporter.createHeader(totalSize, sampleRate),
        updateSize:false,
        success: writeSamples,
        error: logger.error });
    }.bind(this);

  this.writer.initialize({
    success: writerHeader,
    error: logger.error
  });

};

/**
 *
 * @param {number} totalSize
 * @param {number} sampleRate
 * @returns {ArrayBuffer}
 */
Exporter.createHeader = function createHeader(totalSize, sampleRate) {
  var header = new ArrayBuffer(44),
    headerView = new DataView(header),
    writeHeader = function writeHeader(offset, str) {
      var i, len;
      for (i = 0, len = str.length; i < len; i++){
        headerView.setUint8(offset + i, str.charCodeAt(i));
      }
    };
  // Write the WAV header
  writeHeader(0, 'RIFF');                             // RIFF identifier
  headerView.setUint32(4, 32 + 4 * totalSize, true);  // file length
  writeHeader(8, 'WAVE');                             // RIFF type
  writeHeader(12, 'fmt ');                            // format chunk identifier
  headerView.setUint32(16, 16, true);                 // format chunk length
  headerView.setUint16(20, 1, true);                  // sample format (raw)
  headerView.setUint16(22, 2, true);                  // channel count
  headerView.setUint32(24, sampleRate, true);         // sample rate
  headerView.setUint32(28, sampleRate * 4, true);     // byte rate (sample rate * block align)
  headerView.setUint16(32, 4, true);                  // block align (channel count * bytes per sample)
  headerView.setUint16(34, 16, true);                 // bits per sample
  writeHeader(36, 'data');                            // data chunk identifier
  headerView.setUint32(40, 4 * totalSize, true);      // data chunk length
  return header;
};

Exporter.prototype.abort = function abort() {
  if (this.transaction) {
    this.transaction.abort();
    this.transaction = null;
  }
  this.exporting = false;
};

module.exports = Exporter;
