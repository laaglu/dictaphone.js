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
define(['model/ClipModels', 'model/ClipModel', 'model/Samples', 'Logger', 'AudioEnv'],
  function(clipModels, ClipModel, samples, logger, env) {

    "use strict";

    /**
     * @constructor
     * @param options
     * bufferCapacity: clip length to keep in ram before flushing
     * model: the clip model to record
     */
    function Recorder(options) {
      // Store approximately 1 second of sound before flushing to indexed db
      this.bufferCapacity = options.bufferCapacity || 1;
      this.clip = options.model;
    }

    /**
     * @type {LocalMediaStream}
     */
    Recorder.prototype.inputNode = null;
    /**
     * @type {ScriptProcessorNode}
     */
    Recorder.prototype.processorNode = null;
    /**
     * @type {GainNode}
     */
    Recorder.prototype.gainNode = null;
    /**
     * The recording being recorded
     * @type {ClipModel}
     */
    Recorder.prototype.clip = null;
    /**
     * A buffer of chunks to persist
     * @type {[Object]}
     */
    Recorder.prototype.buffer = null;
    /**
     * Capacity of the buffer is seconds
     * @type {number}
     */
    Recorder.prototype.bufferCapacity = 0;
    /**
     * True if the recorder is recording, false otherwise
     * @type {boolean}
     */
    Recorder.prototype.recording = false;
    /**
     * The local media stream used for recording
     * @type {LocalMediaStream}
     */
    Recorder.prototype.localMediaStream = null;

    /**
     * Creates a web audio API recorder graph with the following structure
     * The microphone output is piped into a 0 gain node to mute it
     * and a processor node to capture the input
     *
     * MediaStreamSource(LocalMediaStream ) ---> GainNode(0) -----------> AudioDestinationNode
     *                                       |-> ScriptProcessorNode -|
     */
    Recorder.prototype.start = function start(localMediaStream) {
      this.localMediaStream = localMediaStream;
      this.recording = true;
      this.clip.trigger('clip:state');
      var context = env.context;
      this.inputNode = context.createMediaStreamSource(localMediaStream);
      this.gainNode = context.createGain();
      this.gainNode.gain.value = 0;
      // Create buffers that can hold approximately 1/10s of recording at 44.1khz
      this.processorNode = context.createScriptProcessor(env.bufferSize, 2, 2);

      this.inputNode.connect(this.gainNode);
      this.inputNode.connect(this.processorNode);
      this.gainNode.connect(context.destination);
      this.processorNode.connect(context.destination);

      var processSample = function processSample(e) {
        if (this.recording) {
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

    Recorder.prototype.copyBuffer = function copyBuffer(buffer) {
      var bufferCopy = new Float32Array(buffer.length);
      bufferCopy.set(buffer);
      return bufferCopy;
    };

      /**
     * @param options
     * success: backbone.js success callback
     * error: backbone.js error callback
     */
    Recorder.prototype.stop = function stop(options) {
      this.recording = false;
      // Deactivate the Web Audio API graph
      this.processorNode.onaudioprocess = null;
      this.inputNode.disconnect();
      this.inputNode = null;
      this.gainNode.disconnect();
      this.gainNode = null;
      this.processorNode.disconnect();
      this.processorNode = null;

      if (env.getReleaseMic()) {
        this.localMediaStream.stop();
        // For firefox: the object does not have the ended property.
        if (!this.localMediaStream.ended) {
          this.localMediaStream.ended = true;
        }
      }

      // Save remaining samples
      this.flush();
      this.clip.recorder = null;

      // Update the clip object
      this.clip.save({ sampleSize: env.bufferSize}, options);
      this.clip.trigger('clip:state');
    };

    Recorder.prototype.flush = function flush() {
      if (this.buffer) {
        samples.createSamples(this.buffer);
        this.buffer = null;
        this.clip.trigger('clip:length');
      }
    };

    return Recorder;
  }
);
