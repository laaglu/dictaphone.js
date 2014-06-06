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

/* global RSVP */

var samples = require('model/Samples');
var clipModels = require('model/ClipModels');
var env = require('AudioEnv');
var logger = require('Logger');

/**
 * A WebAudio API record command which stores raw PCM data in a
 * IndexedDB database.
 * @constructor
 * @param options
 * bufferCapacity: clip length to keep in ram before flushing
 * clip: the clip model to record
 */
function RecordCmd(options) {
  // Store approximately 1 second of sound before flushing to indexed db
  this.bufferCapacity = options.bufferCapacity || 1;
  this.clip = options.clip;
}

/**
 * @type {LocalMediaStream}
 */
RecordCmd.prototype.inputNode = null;
/**
 * @type {ScriptProcessorNode}
 */
RecordCmd.prototype.processorNode = null;
/**
 * @type {GainNode}
 */
RecordCmd.prototype.gainNode = null;
/**
 * The recording being recorded
 * @type {ClipModel}
 */
RecordCmd.prototype.clip = null;
/**
 * A buffer of samples to persist
 * @type {[Object]}
 */
RecordCmd.prototype.buffer = null;
/**
 * Capacity of the buffer in seconds
 * @type {number}
 */
RecordCmd.prototype.bufferCapacity = 0;
/**
 * True if the command is recording, false otherwise
 * @type {boolean}
 */
RecordCmd.prototype.running = false;

/**
 * Creates a web audio API record command graph with the following structure
 * The microphone output is piped into a 0 gain node to mute it
 * and a processor node to capture the input
 *
 * MediaStreamSource(LocalMediaStream ) ---> GainNode(0) -----------> AudioDestinationNode
 *                                       |-> ScriptProcessorNode -|
 */
RecordCmd.prototype.start = function start(sourceNode) {
  this.running = true;
  clipModels.nextId();
  clipModels.add(this.clip);
  this.clip.trigger('clip:state');
  var context = env.context;
  this.inputNode = sourceNode;
  this.gainNode = context.createGain();
  this.gainNode.gain.value = 0;
  // Create buffers that can hold approximately 1/10s of recording at 44.1khz
  this.processorNode = context.createScriptProcessor(env.bufferSize, 2, 2);

  this.inputNode.connect(this.gainNode);
  this.inputNode.connect(this.processorNode);
  this.gainNode.connect(context.destination);
  this.processorNode.connect(context.destination);

  var processSample = function processSample(e) {
    if (this.running) {
      var clip = this.clip, sample = {
        clipid: +clip.id,
        bufferL: this.copyBuffer(e.inputBuffer.getChannelData(0)),
        bufferR: this.copyBuffer(e.inputBuffer.getChannelData(1)),
        offset: clip.get('totalSize')
      };
      this.clip.set('totalSize', clip.get('totalSize') + sample.bufferL.length);
      this.clip.set('duration', clip.get('totalSize') / clip.get('sampleRate'));
      if (!this.buffer) {
        this.buffer = [];
      }
      this.buffer.push(sample);
      if (this.buffer.length * env.bufferSize / env.context.sampleRate > this.bufferCapacity) {
        this.flush();
      }
    }
  }.bind(this);
  this.processorNode.onaudioprocess = processSample;
};

RecordCmd.prototype.copyBuffer = function copyBuffer(buffer) {
  var bufferCopy = new Float32Array(buffer.length);
  bufferCopy.set(buffer);
  return bufferCopy;
};

/**
 * Returns a promise which is accomplished when the command has stopped
 */
RecordCmd.prototype.stop = function stop() {
  logger.log('stop', this);
  var self = this;
  return new RSVP.Promise(function(resolve, reject) {
    self.running = false;
    // Deactivate the Web Audio API graph
    self.processorNode.onaudioprocess = null;
    self.inputNode.disconnect();
    self.gainNode.disconnect();
    self.processorNode.disconnect();

    env.releaseMediaSource(self.inputNode);

    // Save remaining samples
    self.flush();

    // Update the clip object
    self.clip.save(
      { sampleSize: self.inputNode.bufferSize },
      { success: function() { resolve(self); },
        error: function(err) { reject(err); }}
    );
    self.inputNode = null;
    self.gainNode = null;
    self.processorNode = null;
    self.clip.trigger('clip:state');
  });
};

RecordCmd.prototype.flush = function flush() {
  if (this.buffer) {
    samples.createSamples(this.buffer);
    this.buffer = null;
    this.clip.trigger('clip:length');
  }
};

module.exports = RecordCmd;
