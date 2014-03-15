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

/* global navigator, localStorage, window, webkitAudioContext, AudioContext */

var Modernizr = require('modernizr.custom.24918');
var logger = require('Logger');

var RELEASE_MIC = 'releaseMic',
  releaseMic = localStorage.getItem(RELEASE_MIC),
  env;
navigator.getMedia = ( navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia ||
  navigator.msGetUserMedia);
env = {
  getMediaSource: function getMediaSource(options) {
    if (!env.mediaSource || env.mediaSource.mediaStream.ended || env.getReleaseMic()) {
      navigator.getMedia (
        {
          video: false,
          audio: true
        },
        function(localMediaStream) {
          env.mediaSource = env.context.createMediaStreamSource(localMediaStream);
          env.bufferSize = options.bufferSize || 4096;
            options.success(env.mediaSource);
        },
        options.error || logger.error
      );
    } else {
      options.success(env.mediaSource);
    }
  },
  releaseMediaSource: function(source) {
    var mediaStream;
    if (env.getReleaseMic() && (mediaStream = source.mediaStream)) {
      mediaStream.stop();
      // For firefox: the object does not have the ended property.
      if (!mediaStream.ended) {
        mediaStream.ended = true;
      }
    }
  },
  getReleaseMic : function getReleaseMic() {
    return releaseMic === 'true';
  },
  setReleaseMic : function setReleaseMic(value) {
    localStorage.setItem(RELEASE_MIC, value);
    releaseMic = value;
  }
};
if (releaseMic === null) {
  env.setReleaseMic('true');
}

if (Modernizr.webaudio) {
  env.context = window.webkitAudioContext ? new webkitAudioContext() : new AudioContext();
}
module.exports = env;
