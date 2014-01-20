define(['Logger', 'modernizr'], function(logger, Modernizr) {
  var env = {
    init: function init(options) {
      navigator.getMedia (
        {
          video: false,
          audio: true
        },
        function(localMediaStream) {
          env.localMediaStream = localMediaStream;
          env.bufferSize = options.bufferSize || 4096;
          options.success();
        },
        options.error || logger.error
      );
    }
  };
  if (Modernizr.webaudio) {
    env.context = window.webkitAudioContext ? new webkitAudioContext() : new AudioContext();
  }
  return env;
});
