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

var logger = require('Logger');
var commands = require('cmd/Commands');

function StatsLogger(clip) {
  this.clip = clip;
  this.sampleRate = this.clip.get('sampleRate');
  _.extend(this, Backbone.Events);
  this.listenTo(clip, 'clip:state', this.stateChange);
  this.reset();
}
StatsLogger.prototype.clip = null;
StatsLogger.prototype.heartbeats = null;
StatsLogger.prototype.sampleRate = null;

StatsLogger.prototype.dump = function dump() {
  var i, ilen, heartbeat, j, jlen, samples, sample, builder = [];
  if (logger.getShowLogs()) {
    for (i = 0, ilen = this.heartbeats.length; i < ilen; i++) {
      heartbeat = this.heartbeats[i];
      builder.push(heartbeat.ts);
      builder.push('\n');
      samples = heartbeat.samples;
      for (j = 0, jlen = samples.length; j < jlen; j++) {
        sample = samples[j];
        builder.push('\t');
        builder.push(sample.ts);
        builder.push(' ');
        builder.push(sample.data);
        builder.push('\n');
      }
    }
    logger.log(builder.join(''));
  }
};
StatsLogger.prototype.reset = function reset() {
  this.heartbeats = [];
};
StatsLogger.prototype.log = function log() {
  if (arguments.length) {
    if (arguments[0] === 'heartbeat' && arguments.length === 2) {
      this.heartbeats.push({ ts: arguments[1], samples: []});
    } if (arguments[0] === 'schedule' && arguments.length === 3) {
      this.heartbeats[this.heartbeats.length - 1].samples.push({ ts: arguments[2], data: arguments[1].offset / this.sampleRate });
    }
  }
};
StatsLogger.prototype.stateChange = function stateChange() {
  if (commands.isRunning(this.clip.id, commands.PLAY)) {
    this.reset();
  } else {
    this.dump();
  }
};

module.exports = StatsLogger;
