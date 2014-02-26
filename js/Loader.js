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
define(['backbone', 'BinaryHeap', 'model/Samples', 'Logger'],
  function(Backbone, BinaryHeap, Samples, logger) {
    "use strict";

    /**
     * @param options
     * bufferingTime : how many seconds to buffer ahead
     * clip : the clip to read
     * storage : a storage to fetch sound samples from (defaults to indexedDb but can be also be used
     * to inject a simulated storage)
     * @constructor
     */
    function Loader(options) {
      var loader = this;

      // If unspecified, buffer two seconds of sound
      this.bufferingTime = options.bufferingTime || 2;

      // By default, used the indexedDB storage
      var storage = this.storage = options.storage || {
        cursorChanged: function(cursor) {
          if (storage.transaction) {
            if (cursor) {
              //console.log("enqueue", cursor.value.offset);
              loader.queueSample(cursor.value);
              cursor.continue();
            } else {
              //console.log("end-cursor");
              loader.loadedOffset = loader.requestedOffset;
              storage.transaction = null;
            }
          }
        },
        read : function(from, to) {
          console.assert(!storage.transaction);
          storage.transaction = Samples.readSamples({
            clipid: loader.clip.id,
            success: storage.cursorChanged.bind(storage),
            from: from,
            to:to
          });
        },
        reset : function() {
          //console.log("reset", storage);
          if (storage.transaction) {
            storage.transaction.abort();
            storage.transaction = null;
          }
        }
      };

      this.priorityQueue = new BinaryHeap(function(sample) { return sample.offset });
      this.clip = options.clip;
    }

    /**
     * A storage (usually an indexedDB storage, but can be also be used
     * to inject a simulated storage)
     * @type {Object}
     */
    Loader.prototype.storage = null;

    /**
     * The size of the buffer, in seconds
     * @type {number}
     */
    Loader.prototype.bufferingTime = 0;

    /**
     * A priority queue where samples are ordered by offset
     * @type {BinaryHeap}
     */
    Loader.prototype.priorityQueue = null;

    /**
     * The sound clip id
     * @type {ClipModel}
     */
    Loader.prototype.clip = null;

    /**
     * The offset of the last requested sample
     * @type {number}
     */
    Loader.prototype.requestedOffset = 0;

    /**
     * The offset of the last loaded sample
     * @type {number}
     */
    Loader.prototype.loadedOffset = 0;

    Loader.prototype.queueSample = function queueSample(sample) {
      sample.time = this.toTime(sample.offset);
      this.loadedOffset = sample.offset;
      this.priorityQueue.push(sample);
    };

    Loader.prototype.buffer = function buffer(time) {
      // Fetch all the samples in the specified time interval
      var from = this.requestedOffset;
      var to = this.requestedOffset + Math.min(
        this.clip.get('totalSize'), // end offset
        from + this.toByteCount(time));
      this.storage.read(from, to);
      this.requestedOffset = to;
    };

    Loader.prototype.getSamples = function getSamples(time) {
      //console.log('getSamples', time, this.loading(), this.atend(), this.starved(), this.loadedOffset, this.requestedOffset);
      var samples = null;
      var offset = this.toByteCount(time);

      if (this.atend() || this.loadedOffset >= offset) {
        // The data for the requested interval has been loaded already:
        // extract the samples if they have not been already extracted by a previous call.
        samples = [];
        var sample;
        while ((sample = this.priorityQueue.peek()) && sample.offset < offset) {
          samples.push(this.priorityQueue.pop());
        }
      }

      // Read more data if needed
      if (!(this.loading() || this.atend()) && this.starved()) {
        this.buffer(0.5 * this.bufferingTime);
      }
      return samples;
    };

    Loader.prototype.reset = function reset(startTime) {
      this.storage.reset();
      this.requestedOffset = this.loadedOffset = this.toByteCount(startTime || 0);
      this.priorityQueue.clear();

    };

    /**
     * True if the buffer is not at least half-full
     * @returns {boolean}
     */
    Loader.prototype.starved = function starved() {
      return this.priorityQueue.size() == 0 || this.toTime(this.loadedOffset - this.priorityQueue.peek().offset) < 0.5 * this.bufferingTime;
    };

    /**
     * True if a load operation is underway
     * @returns {boolean}
     */
    Loader.prototype.loading = function loading() {
      return this.loadedOffset < this.requestedOffset;
    };

    /**
     * True if the end of the stream has been reached
     * @returns {boolean}
     */
    Loader.prototype.atend = function atend() {
      return this.loadedOffset + this.clip.get('sampleSize') >= this.clip.get('totalSize');
    };

    Loader.prototype.toTime = function toTime(byteCount) {
      return byteCount / this.clip.get('sampleRate');
    };
    Loader.prototype.toByteCount = function toByteCount(time) {
      return time * this.clip.get('sampleRate');
    };

    return Loader;
  }
);
