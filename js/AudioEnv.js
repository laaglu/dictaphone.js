define(['Logger', 'modernizr'], function(logger, Modernizr) {

  "use strict";

  var RELEASE_MIC = 'releaseMic',
    releaseMic = localStorage.getItem(RELEASE_MIC),
    env = {
      getLocalMediaStream: function getLocalMediaStream(options) {
        if (!env.localMediaStream || env.ended || env.getReleaseMic()) {
          navigator.getMedia (
            {
              video: false,
              audio: true
            },
            function(localMediaStream) {
              env.localMediaStream = localMediaStream;
              env.bufferSize = options.bufferSize || 4096;
              options.success(localMediaStream);
            },
            options.error || logger.error
          );
        } else {
          options.success(env.localMediaStream);
        }
      },
      getReleaseMic : function getReleaseMic() {
        return releaseMic == 'true';
      },
      setReleaseMic : function setReleaseMic(value) {
        localStorage.setItem(RELEASE_MIC, value);
        releaseMic = value;
      }
    };
  if (Modernizr.webaudio) {
    env.context = window.webkitAudioContext ? new webkitAudioContext() : new AudioContext();
  }
  return env;
});
