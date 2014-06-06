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

/* global navigator, localStorage, window, webkitAudioContext, AudioContext, RSVP */

var Modernizr = require('modernizr.custom.24918');

var RELEASE_MIC = 'releaseMic',
  releaseMic = localStorage.getItem(RELEASE_MIC),
  mediaSource,
  env;
navigator.getMedia = ( navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia ||
  navigator.msGetUserMedia);

var mediaSourceFactory = {
  getSource : function getMediaSource(options) {
    return new RSVP.Promise(function(resolve, reject) {
      if (env.getReleaseMic() || !mediaSource) {
        navigator.getMedia (
          {
            video: false,
            audio: true
          },
          function(localMediaStream) {
            mediaSource = env.context.createMediaStreamSource(localMediaStream);
            mediaSource.bufferSize = (options && options.bufferSize) || 4096;
            resolve(mediaSource);
          },
          function(err) {
            reject(err);
          }
        );
      } else {
        resolve(mediaSource);
      }
    });
  },

  releaseSource: function releaseMediaSource(source) {
    var mediaStream = source.mediaStream;
    if (env.getReleaseMic() && mediaStream) {
      mediaStream.stop();
      // For firefox: the object does not have the ended property.
      if (!mediaStream.ended) {
        mediaStream.ended = true;
      }
    }
  }
};

/**
 * For environments which do not have a microphone, simulate
 * a noise source with an oscillator so that there is something to record.
 */
var oscillatorSourceFactory = {
  getSource : function getOscillatorSource(options) {
    var freq = 1000, 
      source = env.context.createOscillator();
    source.frequency.setValueAtTime(freq, 0);
    source.type = "sine";
    source.playing = true;
    source.bufferSize = (options && options.bufferSize) || 4096;
    source.start();
    (function wobble() {
      var currTime = env.context.currentTime;
      freq = freq === 1000 ? 100 : 1000;
      source.frequency.exponentialRampToValueAtTime(freq, currTime + 0.5);
      if (source.playing) {
        setTimeout(wobble, 500);
      }
    })();
    return RSVP.Promise.resolve(source);
  },

  releaseSource: function releaseOscillatorSource(source) {
    if (source.playing) {
      source.stop();
      source.playing = false;
    }
  }
};

var factory = mediaSourceFactory;

env = {
  getMediaSource: factory.getSource,
  releaseMediaSource: factory.releaseSource,
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
