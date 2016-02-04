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

/*global _, Backbone*/

var Loader = require('./Loader');
var env = require('./AudioEnv');
var logger = require('Logger');

/**
 * A WebAudio API player for sound clips stored in an IndexedDB database.
 * The player uses the following audio graph:
 * AudioBufferSourceNode ---> GainNode() -------> AudioDestinationNode
 * @param options
 * clip: {ClipModel} the clip to replay
 * heartbeat: {number} refresh rate
 * logger: {Object} must implement log, error
 * timer: {Object} must implement getCurrentTime, start, stop
 * scheduler: {Object} must implement scheduleSample
 * loader: {Loader} loader object
 * loop: {boolean} true to play sound in a loop
 * @constructor
 */
function Player(options) {
  var player = this;
  this.heartbeat = options.heartbeat || 0.05;
  this.clip = options.clip;
  this.gainNode = env.context.createGain();
  this.gainNode.connect(env.context.destination);
  this.logger = options.logger || logger;
  this.loop = options.loop === true;

  // Define a timer based on Web Audio API to the currentTime
  // and window.setInterval to invoke periodic updates
  var timer = this.timer = options.timer || {
    getCurrentTime : function getCurrentTime() {
      return env.context.currentTime;
    },
    start : function start(func, delay) {
      timer.intervalId = setInterval(func, delay);
    },
    stop : function stop() {
      if (timer.intervalId) {
        clearInterval(timer.intervalId);
        timer.intervalId = 0;
      }
    }
  };

  // Define a Web Audio API based scheduler
  this.scheduler = options.scheduler || {
    scheduleSample: function scheduleSample(sample, time) {
      player.logger.log('schedule', sample, time);
      var buffer, bufferL, bufferR, source;
      buffer = env.context.createBuffer(2, sample.bufferL.length, player.clip.get('sampleRate'));
      bufferL = buffer.getChannelData(0);
      bufferL.set(sample.bufferL);
      bufferR = buffer.getChannelData(1);
      bufferR.set(sample.bufferR);
      source = env.context.createBufferSource();
      source.buffer = buffer;
      source.connect(player.gainNode);
      source.start(time);
    }
  };

  this.loader = options.loader || new Loader({clip: this.clip});
}
/**
 * The sound clip id
 * @type {ClipModel}
 */
Player.prototype.clip = null;
/**
 * The speed at which the player should update seconds)
 * @type {number}
 */
Player.prototype.heartbeat = 0;
/**
 * A timer (usually a webaudio-based timer, but can be also be used
 * to inject a simulated timer)
 * @type {Object}
 */
Player.prototype.timer = 0;
/**
 * A loader to retrieve samples from storage
 * @type {Loader}
 */
Player.prototype.loader = null;
/**
 * A scheduler
 * @type {Object}
 */
Player.prototype.scheduler = null;
/**
 * True to play the clip in an infinite loop
 * @type {boolean}
 */
Player.prototype.loop = false;
/**
 * True if the player is playing, false otherwise
 * @type {boolean}
 */
Player.prototype.playing = false;
/**
 * Time when the first scheduled sample started playing in seconds
 * @type {number}
 */
Player.prototype.startTime = 0;
/**
 * Time when the last scheduled sample will end playing in seconds
 * @type {number}
 */
Player.prototype.endTime = 0;
/**
 * The position in the clip from the beginning in seconds
 * @type {number}
 */
Player.prototype.clipTime = 0;
/**
 * The gain node used to control the volume
 * @type {GainNode}
 */
Player.prototype.gainNode = 0;

Player.prototype.onheartbeat = function onheartbeat() {
  var i, len, samples, sample,
   currentTime = this.timer.getCurrentTime();

  this.logger.log('heartbeat', currentTime);
  if (this.clipTime && !this.endTime) {
    this.endTime = currentTime;
  }
  // Read samples to schedule (if replay has not begun or has fallen behind, go as far in the future as two heartbeats from current clip time,
  // otherwise go as far in the future as two heartbeats from current time
  samples = this.loader.getSamples(((!this.endTime || currentTime >= this.endTime) ? this.clipTime : (currentTime - this.startTime)) + 2 * this.heartbeat);
  if (samples) {
    // Reset the start time if replay has not begun or has fallen behind
    if (this.endTime) {
      if (currentTime >= this.endTime) {
        this.startTime = currentTime - (this.clipTime + this.clip.sampleLength());
      }
    } else {
      this.startTime = currentTime;
    }
    for (i = 0, len = samples.length; i < len; i++) {
      sample = samples[i];
      this.clipTime = sample.time;
      var sampleTime = this.startTime + this.clipTime;
      this.scheduler.scheduleSample(sample, sampleTime);
      this.endTime = sampleTime + this.clip.sampleLength();
      if (sample.offset + this.clip.get('sampleSize') >= this.clip.get('totalSize')) {
        // Reset clip time to start of clip
        this.clipTime = 0;
        if (this.loop) {
          this.loader.reset(0);
        } else {
          this.stop();
        }
      }
    }
  }
};

Player.prototype.start = function start(clipTime) {
  this.playing = true;
  this.clip.trigger('clip:state');
  this.clipTime = clipTime;
  this.clip.save({ lastPlayed: Date.now() });
  this.loader.reset(this.clipTime);

  // Activate the heartbeat
  this.timer.start(this.onheartbeat.bind(this), Math.floor(this.heartbeat * 1000));
};

Player.prototype.stop = function stop() {
  if (this.playing) {
    this.playing = false;
    // Deactivate the heartbeat
    this.timer.stop();
    this.clip.trigger('clip:state');
  }
};

Player.prototype.getVolume = function getVolume() {
  return this.gainNode.gain.value;
};

Player.prototype.setVolume = function setVolume(value) {
  this.gainNode.gain.value = value;
};

_.extend(Player.prototype, Backbone.Events);
module.exports = Player;

