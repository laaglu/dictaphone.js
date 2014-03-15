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

/* global Blob, URL, document, $, window */

function TypedArrayWriter(exporter) {
  var totalSize;

  this.exporter = exporter;
  totalSize = +exporter.clip.get('totalSize');
  this.buffer = new ArrayBuffer(44 + 4 * totalSize);
  this.bufferView = new Uint8Array(this.buffer);
}

/**
 * The exporter object
 * @type {Exporter}
 */
TypedArrayWriter.prototype.exporter = null;
/**
 * The buffer which stores the wav file
 * @type {ArrayBuffer}
 */
TypedArrayWriter.prototype.buffer = null;
/**
 * A Uint8 view on the buffer
 * @type {Uint8Array}
 */
TypedArrayWriter.prototype.bufferView = null;
/**
 * Write position in the buffer
 * @type {number}
 */
TypedArrayWriter.prototype.offset = 0;

/**
 * Returns a default name for the exported clip
 */
TypedArrayWriter.prototype.defaultExportName = function defaultExportName(options) {
  if (typeof(options.success) === 'function') {
    options.success(this.exporter.clip.get('name') + '.wav');
  }
};

/**
 * Prepares the writer for writing
 * success: callback if the write operation succeeds
 * error: callback if the write operation fails
 * @param options
 */
TypedArrayWriter.prototype.initialize = function initialize(options) {
  if (typeof options.success === 'function') {
    options.success();
  }
};

/**
 * Writes a buffer of data into the wav file
 * @param options
 * success: callback if the write operation succeeds
 * error: callback if the write operation fails
 * data: {ArrayBuffer} a buffer containing the data to write
 * updateSize: {boolean} true to update the number of processed bytes
 */
TypedArrayWriter.prototype.writeData = function writeData(options) {
  this.bufferView.set(new Uint8Array(options.data), this.offset);
  this.offset += options.data.byteLength;
  if (options.updateSize) {
    this.exporter.processedSize += options.data.byteLength / 4;
  }
  if (typeof options.success === 'function') {
    options.success();
  }
};

TypedArrayWriter.prototype.finalize = function finalize(options) {
  var blob = new Blob([this.buffer], { type: 'audio/wav'}),
    section = $('#sourceView'),
    link = document.createElement('a'),
    evt;

  link.href = URL.createObjectURL(blob);
  link.download = this.exporter.fileName;
  link.style.visibility = 'hidden';
  section.append($(link));
  evt = document.createEvent("MouseEvents");
  evt.initMouseEvent("click", true, true, window,
    0, 0, 0, 0, 0, false, false, false, false, 0, null);
  link.dispatchEvent(evt);
  if (typeof options.success === 'function') {
    options.success();
  }
};

module.exports = TypedArrayWriter;
